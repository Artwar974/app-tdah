#!/usr/bin/env python3
"""Serve a disposable, editor-enabled copy of the current ATHENA application.

The production files are read-only from this process. Validation writes a proposal
to tools/map-editor/proposals and never mutates the application.
"""

from __future__ import annotations

import argparse
import base64
import hashlib
import json
import mimetypes
import re
import subprocess
import threading
import webbrowser
from datetime import datetime, timezone
from http import HTTPStatus
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import unquote, urlsplit


TOOL_DIR = Path(__file__).resolve().parent
APP_ROOT = TOOL_DIR.parent.parent
PROPOSALS_DIR = TOOL_DIR / "proposals"
MAX_PROPOSAL_BYTES = 96 * 1024 * 1024


class InjectionError(RuntimeError):
    pass


def replace_once(source: str, old: str, new: str, label: str) -> str:
    if source.count(old) != 1:
        raise InjectionError(f"Point d'injection {label!r} introuvable ou ambigu")
    return source.replace(old, new, 1)


def renderer_bridge() -> str:
    return r'''
    let editorRefreshRequest = 0;

    function refreshEditorPreview() {
      if (!loading.classList.contains('done')) {
        if (!editorRefreshRequest) {
          editorRefreshRequest = requestAnimationFrame(() => {
            editorRefreshRequest = 0;
            refreshEditorPreview();
          });
        }
        return;
      }
      litBaseSceneReady = false;
      waterDepthReady = false;
      skyBackdropReady = false;
      animationClock = performance.now();
      render();
    }

    window.AthenaRendererEditor = {
      getPreviewHour: () => getLocalHour(),
      getVisualBlend: hour => {
        const blend = getVisualBlend(hour);
        return { current: blend.current.mountFrames, next: blend.next.mountFrames, easedT: blend.easedT };
      },
      setReferenceState(stateId) {
        editorCyclePlaying = false;
        editorPreviewHour = null;
        editorForcedState = states.some(state => state.mountFrames === stateId) ? stateId : null;
        refreshEditorPreview();
      },
      setPreviewHour(hour) {
        editorCyclePlaying = false;
        editorForcedState = null;
        editorPreviewHour = Number.isFinite(Number(hour)) ? Number(hour) : null;
        refreshEditorPreview();
      },
      playDayCycle(seconds = 24) {
        editorForcedState = null;
        editorPreviewHour = null;
        editorCycleDuration = Math.max(10, Math.min(60, Number(seconds) || 24));
        editorCycleStartedAt = performance.now();
        editorCyclePlaying = true;
        editorAnimationPaused = false;
        startRenderLoop();
      },
      pauseDayCycle() {
        if (!editorCyclePlaying) return;
        editorPreviewHour = getLocalHour();
        editorCyclePlaying = false;
        refreshEditorPreview();
      },
      restartDayCycle(seconds = editorCycleDuration) { this.playDayCycle(seconds); },
      clearPreview() {
        editorForcedState = null;
        editorPreviewHour = null;
        editorCyclePlaying = false;
        refreshEditorPreview();
      },
      isDayCyclePlaying: () => editorCyclePlaying,
      setAnimationPaused(active) {
        editorAnimationPaused = Boolean(active);
        if (editorAnimationPaused) {
          activeOceanVideo.pause();
          cloudVideo.pause();
        } else {
          syncOceanVideoPlayback();
          syncCloudVideoPlayback();
          startRenderLoop();
        }
        refreshEditorPreview();
      },
      stepAnimation(layerId, delta) {
        editorAnimationPaused = true;
        if (layerId === 'cascade') {
          editorMountFrame = (editorMountFrame + Number(delta || 0) + MOUNT_FRAME_COUNT) % MOUNT_FRAME_COUNT;
        } else if (layerId === 'ocean' && Number.isFinite(activeOceanVideo.currentTime)) {
          activeOceanVideo.currentTime = Math.max(0, activeOceanVideo.currentTime + Number(delta || 0) / 24);
        } else if (layerId === 'sky' && Number.isFinite(cloudVideo.currentTime)) {
          cloudVideo.currentTime = Math.max(0, cloudVideo.currentTime + Number(delta || 0) / 24);
        }
        refreshEditorPreview();
      },
      firstAnimationFrame(layerId) {
        editorAnimationPaused = true;
        if (layerId === 'cascade') editorMountFrame = 0;
        if (layerId === 'ocean') activeOceanVideo.currentTime = 0;
        if (layerId === 'sky') cloudVideo.currentTime = 0;
        refreshEditorPreview();
      },
      setAnimationFrame(layerId, frameIndex) {
        editorAnimationPaused = true;
        if (layerId === 'cascade') {
          editorMountFrame = (Math.floor(Number(frameIndex) || 0) + MOUNT_FRAME_COUNT) % MOUNT_FRAME_COUNT;
        } else if (layerId === 'ocean' && Number.isFinite(activeOceanVideo.duration)) {
          activeOceanVideo.currentTime = Math.max(0, Math.min(activeOceanVideo.duration || 0, Number(frameIndex || 0) / 24));
        } else if (layerId === 'sky' && Number.isFinite(cloudVideo.duration)) {
          cloudVideo.currentTime = Math.max(0, Math.min(cloudVideo.duration || 0, Number(frameIndex || 0) / 24));
        }
        refreshEditorPreview();
      },
      getAnimationInfo(layerId) {
        if (layerId === 'cascade') return { type: 'frames', frame: Math.floor(editorMountFrame) + 1, frameCount: MOUNT_FRAME_COUNT, fps: Math.round(1000 / MOUNT_FRAME_MS), loop: true };
        if (layerId === 'ocean') return { type: 'video', time: activeOceanVideo.currentTime || 0, duration: activeOceanVideo.duration || 0, fps: 24, loop: true };
        if (layerId === 'sky') return { type: 'video', time: cloudVideo.currentTime || 0, duration: cloudVideo.duration || 0, fps: 24, loop: true };
        return null;
      },
      render: refreshEditorPreview
    };
'''


def build_editor_html() -> str:
    source = (APP_ROOT / "index.html").read_text(encoding="utf-8")

    source = replace_once(
        source,
        "</head>",
        '  <link rel="stylesheet" href="/__editor__/scene-editor.css?v=standalone-v1">\n'
        '  <link rel="stylesheet" href="/__editor__/housing-editor-bridge.css?v=standalone-v1">\n</head>',
        "styles",
    )
    source = replace_once(
        source,
        "  <script>\n    // La vidéo source",
        '  <script src="/__editor__/scene-editor-runtime.js?v=standalone-v1"></script>\n'
        "  <script>\n    // La vidéo source",
        "runtime",
    )
    source = replace_once(
        source,
        "    // Horaires par défaut du prototype.",
        "    // Variables disponibles uniquement dans la copie d'édition.\n"
        "    let editorForcedState = null;\n"
        "    let editorPreviewHour = null;\n"
        "    let editorCycleStartedAt = 0;\n"
        "    let editorCycleDuration = 24;\n"
        "    let editorCyclePlaying = false;\n"
        "    let editorAnimationPaused = false;\n"
        "    let editorMountFrame = 0;\n\n"
        "    // Horaires par défaut du prototype.",
        "variables",
    )
    source = replace_once(
        source,
        "      const framePosition = reducedMotionQuery.matches\n        ? 0\n        : (animationClock / MOUNT_FRAME_MS) % MOUNT_FRAME_COUNT;",
        "      const framePosition = reducedMotionQuery.matches || editorAnimationPaused\n"
        "        ? editorMountFrame\n"
        "        : (animationClock / MOUNT_FRAME_MS) % MOUNT_FRAME_COUNT;",
        "cascade frame control",
    )
    source = replace_once(
        source,
        "    function getVisualBlend(hour) {\n      const normalizedHour",
        "    function getVisualBlend(hour) {\n"
        "      if (editorForcedState) {\n"
        "        const forced = states.find(state => state.mountFrames === editorForcedState) || states[1];\n"
        "        return { current: forced, next: forced, easedT: 0 };\n"
        "      }\n"
        "      const normalizedHour",
        "forced state",
    )
    source = replace_once(
        source,
        "    function getLocalHour() {\n      const forcedHourParam",
        "    function getLocalHour() {\n"
        "      if (editorCyclePlaying) {\n"
        "        const elapsed = (performance.now() - editorCycleStartedAt) / 1000;\n"
        "        return (elapsed / editorCycleDuration * 24) % 24;\n"
        "      }\n"
        "      if (Number.isFinite(editorPreviewHour)) return ((editorPreviewHour % 24) + 24) % 24;\n"
        "      const forcedHourParam",
        "preview clock",
    )
    source = replace_once(
        source,
        "    function rebuildLitBaseScene(hour, lighting = getTemporalLightingState(hour)) {\n      const { current, next, easedT } = lighting;",
        "    function rebuildLitBaseScene(hour, lighting = getTemporalLightingState(hour)) {\n"
        "      window.AthenaSceneRuntime?.beginLayer('base', ctx);\n"
        "      const { current, next, easedT } = lighting;",
        "base begin",
    )
    source = replace_once(
        source,
        "      paintMaskedColor(assets.shadowMask, lighting.shadowColor, lighting.shadowPower, 'multiply');\n      captureLitBaseScene();",
        "      paintMaskedColor(assets.shadowMask, lighting.shadowColor, lighting.shadowPower, 'multiply');\n"
        "      window.AthenaSceneRuntime?.endLayer('base', ctx, getVisualBlend(hour));\n"
        "      captureLitBaseScene();",
        "base end",
    )
    render_old = """      drawAnimatedSky(hour);
      const celestials = getCelestials(hour);
      drawAnimatedOcean(hour);
      drawWaterDepthGradient(hour);
      drawWaterSparkles(hour);
      drawAnimatedMount(hour);
      for (const celestial of celestials) paintDirectionalLight(assets.lightMask, celestial);
      for (const celestial of celestials) drawCelestialSystem(celestial);
      restoreForegroundLayers();"""
    render_new = """      window.AthenaSceneRuntime?.beginLayer('sky', ctx);
      drawAnimatedSky(hour);
      window.AthenaSceneRuntime?.endLayer('sky', ctx, getVisualBlend(hour), skyCanvas);
      const celestials = getCelestials(hour);
      window.AthenaSceneRuntime?.beginLayer('ocean', ctx);
      drawAnimatedOcean(hour);
      drawWaterDepthGradient(hour);
      drawWaterSparkles(hour);
      window.AthenaSceneRuntime?.endLayer('ocean', ctx, getVisualBlend(hour), assets.waterMask);
      window.AthenaSceneRuntime?.beginLayer('mount', ctx);
      drawAnimatedMount(hour);
      window.AthenaSceneRuntime?.endLayer('mount', ctx, getVisualBlend(hour), assets.mountLayer);
      const cascadeFrameIndex = Math.floor(reducedMotionQuery.matches || editorAnimationPaused
        ? editorMountFrame
        : (animationClock / MOUNT_FRAME_MS) % MOUNT_FRAME_COUNT);
      window.AthenaSceneRuntime?.beginLayer('cascade', ctx, cascadeFrameIndex);
      window.AthenaSceneRuntime?.endLayer('cascade', ctx, getVisualBlend(hour), {
        source: mountWaterBlendCanvas,
        dx: MOUNT_CROP.x,
        dy: MOUNT_CROP.y,
        dw: MOUNT_CROP.width,
        dh: MOUNT_CROP.height
      }, cascadeFrameIndex);
      window.AthenaSceneRuntime?.beginLayer('celestials', ctx);
      for (const celestial of celestials) paintDirectionalLight(assets.lightMask, celestial);
      for (const celestial of celestials) drawCelestialSystem(celestial);
      window.AthenaSceneRuntime?.endLayer('celestials', ctx, getVisualBlend(hour));
      window.AthenaSceneRuntime?.beginLayer('foreground', ctx);
      restoreForegroundLayers();
      window.AthenaSceneRuntime?.endLayer('foreground', ctx, getVisualBlend(hour), assets.sceneForegroundOcclusion);"""
    source = replace_once(source, render_old, render_new, "render layers")
    source = replace_once(
        source,
        "    function frame(now) {",
        renderer_bridge()
        + "\n    function frame(now) {\n"
        "      if (editorAnimationPaused) {\n"
        "        renderLoopActive = false;\n"
        "        renderFrameRequest = 0;\n"
        "        return;\n"
        "      }",
        "renderer bridge",
    )
    source = re.sub(
        r'<script src="housing-shell\.js\?v=[^"]+"></script>',
        '<script src="/__editor__/housing-shell-editor.js?v=standalone-v1"></script>',
        source,
        count=1,
    )
    source = replace_once(
        source,
        "</body>",
        '  <script src="/__editor__/scene-editor.js?v=standalone-v1"></script>\n</body>',
        "editor UI",
    )
    return source


def git_head() -> str:
    try:
        git_command = "git"
        bundled_git = Path.home() / ".cache/codex-runtimes/codex-primary-runtime/dependencies/native/git/cmd/git.exe"
        if bundled_git.is_file():
            git_command = str(bundled_git)
        return subprocess.check_output(
            [git_command, "-C", str(APP_ROOT), "rev-parse", "HEAD"],
            text=True,
            stderr=subprocess.DEVNULL,
        ).strip()
    except Exception:
        return "unavailable"


def source_status() -> dict:
    index_bytes = (APP_ROOT / "index.html").read_bytes()
    return {
        "ok": True,
        "mode": "standalone-draft",
        "appRoot": str(APP_ROOT),
        "head": git_head(),
        "indexSha256": hashlib.sha256(index_bytes).hexdigest(),
        "generatedAt": datetime.now(timezone.utc).isoformat(),
        "injectionPolicy": "proposal-only",
    }


class EditorHandler(SimpleHTTPRequestHandler):
    server_version = "AthenaMapEditor/1.0"

    def log_message(self, fmt: str, *args) -> None:
        print(f"[{self.log_date_time_string()}] {fmt % args}")

    def send_json(self, value: dict, status: HTTPStatus = HTTPStatus.OK) -> None:
        payload = json.dumps(value, ensure_ascii=False, indent=2).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def send_bytes(self, payload: bytes, content_type: str) -> None:
        self.send_response(HTTPStatus.OK)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(payload)))
        self.send_header("Cache-Control", "no-store")
        self.end_headers()
        self.wfile.write(payload)

    def do_GET(self) -> None:
        path = unquote(urlsplit(self.path).path)
        if path in ("/", "/__editor__", "/__editor__/"):
            try:
                self.send_bytes(build_editor_html().encode("utf-8"), "text/html; charset=utf-8")
            except Exception as error:
                self.send_json({"ok": False, "error": str(error)}, HTTPStatus.INTERNAL_SERVER_ERROR)
            return
        if path == "/__editor__/api/status":
            self.send_json(source_status())
            return
        editor_files = {
            "/__editor__/scene-editor.css": "scene-editor.css",
            "/__editor__/housing-editor-bridge.css": "housing-editor-bridge.css",
            "/__editor__/scene-editor-runtime.js": "scene-editor-runtime.js",
            "/__editor__/scene-editor.js": "scene-editor.js",
            "/__editor__/housing-shell-editor.js": "housing-shell-editor.js",
        }
        if path in editor_files:
            file_path = TOOL_DIR / editor_files[path]
            content_type = mimetypes.guess_type(file_path.name)[0] or "application/octet-stream"
            self.send_bytes(file_path.read_bytes(), content_type)
            return
        app_relative_path = path
        if app_relative_path.startswith("/__editor__/"):
            app_relative_path = app_relative_path[len("/__editor__/"):]
        requested = (APP_ROOT / app_relative_path.lstrip("/")).resolve()
        if APP_ROOT not in requested.parents or not requested.is_file():
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        content_type = mimetypes.guess_type(requested.name)[0] or "application/octet-stream"
        self.send_bytes(requested.read_bytes(), content_type)

    def do_POST(self) -> None:
        path = unquote(urlsplit(self.path).path)
        if path != "/__editor__/api/proposals":
            self.send_error(HTTPStatus.NOT_FOUND)
            return
        try:
            length = int(self.headers.get("Content-Length", "0"))
            if length <= 0 or length > MAX_PROPOSAL_BYTES:
                raise ValueError("Taille de proposition invalide")
            proposal = json.loads(self.rfile.read(length).decode("utf-8"))
            if proposal.get("schema") != "athena-map-editor-proposal" or proposal.get("version") != 1:
                raise ValueError("Schéma de proposition inconnu")
            if not isinstance(proposal.get("baseline"), dict) or not isinstance(proposal.get("draft"), dict):
                raise ValueError("La copie initiale ou le brouillon est absent")

            now = datetime.now(timezone.utc)
            proposal_id = f"map-{now.strftime('%Y%m%d-%H%M%S')}-{hashlib.sha1(json.dumps(proposal.get('draft'), sort_keys=True).encode()).hexdigest()[:7]}"
            destination = PROPOSALS_DIR / proposal_id
            destination.mkdir(parents=True, exist_ok=False)

            raster_manifest = []
            for index, edit in enumerate(proposal.pop("rasterEdits", [])):
                key = str(edit.get("key", ""))
                data_url = str(edit.get("dataUrl", ""))
                match = re.fullmatch(r"data:image/png;base64,([A-Za-z0-9+/=]+)", data_url)
                if not key or not match:
                    raise ValueError(f"Édition raster {index + 1} invalide")
                safe_name = re.sub(r"[^A-Za-z0-9_.-]+", "-", key).strip("-") + ".png"
                image_path = destination / safe_name
                image_path.write_bytes(base64.b64decode(match.group(1), validate=True))
                raster_manifest.append({
                    "key": key,
                    "width": edit.get("width"),
                    "height": edit.get("height"),
                    "file": safe_name,
                    "sha256": hashlib.sha256(image_path.read_bytes()).hexdigest(),
                })

            proposal["id"] = proposal_id
            proposal["receivedAt"] = now.isoformat()
            proposal["rasterEdits"] = raster_manifest
            proposal["applicationState"] = "pending-codex-review"
            (destination / "proposal.json").write_text(
                json.dumps(proposal, ensure_ascii=False, indent=2) + "\n",
                encoding="utf-8",
            )
            self.send_json({"ok": True, "id": proposal_id, "path": str(destination)})
        except Exception as error:
            self.send_json({"ok": False, "error": str(error)}, HTTPStatus.BAD_REQUEST)


def main() -> None:
    parser = argparse.ArgumentParser(description="Éditeur autonome de la map ATHENA")
    parser.add_argument("--host", default="127.0.0.1")
    parser.add_argument("--port", type=int, default=4188)
    parser.add_argument("--no-browser", action="store_true")
    args = parser.parse_args()

    build_editor_html()  # Fail before opening a browser if the current app cannot be instrumented.
    PROPOSALS_DIR.mkdir(parents=True, exist_ok=True)
    server = ThreadingHTTPServer((args.host, args.port), EditorHandler)
    url = f"http://{args.host}:{args.port}/__editor__/?editor=open&version=standalone-v1"
    print(f"ATHENA Map Editor: {url}")
    print("Mode non destructif : Valider crée une proposition, Annuler ne modifie rien.")
    if not args.no_browser:
        threading.Timer(0.45, lambda: webbrowser.open(url)).start()
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
