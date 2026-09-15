(() => {
  const params = new URLSearchParams(window.location.search);
  const editorMode = params.get('editor');
  const DEV_ACCESS_KEY = 'athena-scene-editor-enabled-v2';
  if (editorMode === 'off') {
    localStorage.removeItem(DEV_ACCESS_KEY);
    return;
  }
  if (['1', 'open'].includes(editorMode)) localStorage.setItem(DEV_ACCESS_KEY, '1');
  if (!['1', 'open'].includes(editorMode) && localStorage.getItem(DEV_ACCESS_KEY) !== '1') return;

  const stage = document.querySelector('.stage-shell');
  const housing = window.AthenaHousing;
  const runtime = window.AthenaSceneRuntime;
  const renderer = window.AthenaRendererEditor;
  if (!stage || !housing || !runtime || !renderer) {
    console.error('L’éditeur de scène ne peut pas démarrer : moteur de scène indisponible.');
    return;
  }

  const SNAPSHOT_KEY = 'athena-scene-editor-snapshots-v2';
  const DEVICES = {
    '390x844': { width: 390, height: 844, label: 'iPhone 390 × 844' },
    '393x852': { width: 393, height: 852, label: 'iPhone 393 × 852' },
    '430x932': { width: 430, height: 932, label: 'Grand mobile 430 × 932' },
    '360x800': { width: 360, height: 800, label: 'Android 360 × 800' },
    '720x1280': { width: 720, height: 1280, label: 'Source 720 × 1280' }
  };
  const PIPELINE_LAYERS = runtime.getLayers();

  const launcher = document.createElement('button');
  launcher.className = 'ase-dev-launch';
  launcher.type = 'button';
  launcher.textContent = '✦ Éditer la scène';
  launcher.setAttribute('aria-label', 'Ouvrir l’éditeur visuel de scène');

  const shell = document.createElement('section');
  shell.className = 'ase-shell';
  shell.hidden = true;
  shell.setAttribute('aria-label', 'Éditeur visuel de scène');
  shell.innerHTML = `
    <header class="ase-topbar">
      <div class="ase-brand"><span class="ase-brand-mark">Ψ</span><span><strong>ATHENA Scene Editor V2</strong><small>Copie de travail non destructive</small></span></div>
      <button class="ase-btn" type="button" data-command="undo" title="Annuler (Ctrl+Z)">↶ <span class="ase-wide-label">Annuler</span></button>
      <button class="ase-btn" type="button" data-command="redo" title="Rétablir (Ctrl+Y)">↷ <span class="ase-wide-label">Rétablir</span></button>
      <button class="ase-btn" type="button" data-command="zoom-out" title="Dézoomer (-)">−</button>
      <input class="ase-zoom-readout" id="aseZoomReadout" value="100 %" aria-label="Niveau de zoom">
      <button class="ase-btn" type="button" data-command="zoom-in" title="Zoomer (+)">+</button>
      <button class="ase-btn" type="button" data-command="fit" title="Ajuster à la fenêtre (0)">Ajuster</button>
      <select class="ase-device" id="aseDevice" aria-label="Format de téléphone">
        ${Object.entries(DEVICES).map(([key, device]) => `<option value="${key}">${device.label}</option>`).join('')}
      </select>
      <div class="ase-top-spacer"></div>
      <select class="ase-snapshot-select" id="aseSnapshotSelect" aria-label="Instantanés" title="Restaurer un instantané"><option value="">Instantanés…</option></select>
      <button class="ase-btn" type="button" data-command="snapshot" title="Créer un instantané">◉</button>
      <button class="ase-btn" type="button" data-command="delete-snapshot" title="Supprimer l’instantané sélectionné" disabled>⌫</button>
      <button class="ase-btn" type="button" data-command="export" title="Exporter la composition JSON">Exporter</button>
      <button class="ase-btn" type="button" data-command="import" title="Importer une composition JSON">Importer</button>
      <button class="ase-btn is-primary" type="button" data-command="save" title="Valider les changements (Ctrl+S)">Valider</button>
      <button class="ase-btn" type="button" data-command="close" title="Annuler la session">Annuler</button>
      <input id="aseImport" type="file" accept="application/json,.json" hidden>
    </header>
    <div class="ase-timebar" aria-label="État temporel">
      <strong>TIME STATE</strong>
      <div class="ase-time-states" role="group" aria-label="États de référence">
        <button type="button" data-time-state="sunrise">1 · Sunrise</button>
        <button type="button" data-time-state="day" class="is-active">2 · Day</button>
        <button type="button" data-time-state="sunset">3 · Sunset</button>
        <button type="button" data-time-state="night">4 · Night</button>
      </div>
      <label class="ase-preview-time">Preview <input id="asePreviewTime" type="range" min="0" max="1439" value="720"><output id="asePreviewOutput">12:00</output></label>
      <button class="ase-btn" type="button" data-command="day-play">▶ Cycle 24 h</button>
      <button class="ase-btn" type="button" data-command="day-pause">⏸</button>
      <button class="ase-btn" type="button" data-command="day-restart">↺</button>
    </div>
    <nav class="ase-toolbar" aria-label="Outils">
      <button class="ase-tool is-active" type="button" data-tool="move" title="Déplacement (V)"><span>↖</span><kbd>V</kbd></button>
      <button class="ase-tool" type="button" data-tool="marquee" title="Sélection rectangulaire (M)"><span>□</span><kbd>M</kbd></button>
      <button class="ase-tool" type="button" data-tool="lasso" title="Lasso polygonal (L)"><span>⬠</span><kbd>L</kbd></button>
      <button class="ase-tool" type="button" data-tool="brush" title="Pinceau (B)"><span>●</span><kbd>B</kbd></button>
      <button class="ase-tool" type="button" data-tool="clone" title="Tampon (S)"><span>♟</span><kbd>S</kbd></button>
      <button class="ase-tool" type="button" data-tool="eraser" title="Gomme (E)"><span>▱</span><kbd>E</kbd></button>
      <button class="ase-tool" type="button" data-tool="eyedropper" title="Pipette (I)"><span>⌞</span><kbd>I</kbd></button>
      <button class="ase-tool" type="button" data-tool="hand" title="Main / déplacement de la vue (H)"><span>✋</span><kbd>H</kbd></button>
      <div class="ase-tool-separator"></div>
      <button class="ase-tool" type="button" data-command="duplicate" title="Dupliquer (Ctrl+J)"><span>⧉</span></button>
      <button class="ase-tool" type="button" data-command="delete" title="Supprimer (Suppr)"><span>⌫</span></button>
    </nav>
    <aside class="ase-sidebar">
      <nav class="ase-panel-tabs" aria-label="Panneaux">
        <button type="button" class="is-active" data-panel="properties">Propriétés</button>
        <button type="button" data-panel="layers">Calques</button>
        <button type="button" data-panel="assets">Assets</button>
      </nav>
      <section class="ase-panel is-active" data-panel-content="properties"><div id="aseProperties"></div></section>
      <section class="ase-panel" data-panel-content="layers">
        <div class="ase-panel-head"><input class="ase-search" id="aseLayerSearch" type="search" placeholder="Rechercher un calque…"></div>
        <div class="ase-layer-list" id="aseLayerList"></div>
      </section>
      <section class="ase-panel" data-panel-content="assets">
        <div class="ase-panel-head"><input class="ase-search" id="aseAssetSearch" type="search" placeholder="Rechercher un asset…"></div>
        <div class="ase-assets-grid" id="aseAssetGrid"></div>
      </section>
    </aside>
    <footer class="ase-timeline" id="aseTimeline">
      <button class="ase-btn" type="button" data-command="frame-first" title="Première frame">|◀</button>
      <button class="ase-btn" type="button" data-command="frame-prev" title="Frame précédente">◀</button>
      <button class="ase-btn" type="button" data-command="animation-toggle">⏸ Pause</button>
      <button class="ase-btn" type="button" data-command="frame-next" title="Frame suivante">▶</button>
      <div class="ase-timeline-copy"><strong>Feu animé</strong><small>GIF existant · déplacement de l’objet entier</small></div>
      <div class="ase-timeline-track" id="aseTimelineTrack" aria-label="Informations de l’animation existante"></div>
      <label class="ase-timeline-control">FPS <input id="aseAnimationFps" data-animation="fps" type="number" min="1" max="30" step="1"></label>
      <label class="ase-timeline-control">Boucle <input id="aseAnimationLoop" data-animation="loop" type="checkbox"></label>
    </footer>
    <div class="ase-stage-label" id="aseStageLabel"></div>
    <div class="ase-stage-status"><span class="ase-status-dot"></span><span id="aseStatus">Scène réelle connectée</span></div>
    <div class="ase-guide is-vertical" id="aseGuideX" hidden></div>
    <div class="ase-guide is-horizontal" id="aseGuideY" hidden></div>
    <div class="ase-transform-box" id="aseTransformBox" hidden>
      <i class="ase-handle" data-handle="nw"></i><i class="ase-handle" data-handle="ne"></i>
      <i class="ase-handle" data-handle="sw"></i><i class="ase-handle" data-handle="se"></i>
      <i class="ase-handle" data-handle="rotate"></i>
    </div>
    <div class="ase-context-menu" id="aseContextMenu" hidden>
      <button type="button" data-context="duplicate">Dupliquer</button>
      <button type="button" data-context="front">Placer au premier plan</button>
      <button type="button" data-context="back">Placer à l’arrière-plan</button>
      <button type="button" class="is-danger" data-context="delete">Supprimer</button>
    </div>`;

  document.body.append(launcher, shell);

  const propertiesRoot = shell.querySelector('#aseProperties');
  const layerList = shell.querySelector('#aseLayerList');
  const assetGrid = shell.querySelector('#aseAssetGrid');
  const layerSearch = shell.querySelector('#aseLayerSearch');
  const assetSearch = shell.querySelector('#aseAssetSearch');
  const transformBox = shell.querySelector('#aseTransformBox');
  const contextMenu = shell.querySelector('#aseContextMenu');
  const status = shell.querySelector('#aseStatus');
  const zoomReadout = shell.querySelector('#aseZoomReadout');
  const deviceSelect = shell.querySelector('#aseDevice');
  const snapshotSelect = shell.querySelector('#aseSnapshotSelect');
  const importInput = shell.querySelector('#aseImport');
  const stageLabel = shell.querySelector('#aseStageLabel');
  const guideX = shell.querySelector('#aseGuideX');
  const guideY = shell.querySelector('#aseGuideY');
  const animationFpsInput = shell.querySelector('#aseAnimationFps');
  const animationLoopInput = shell.querySelector('#aseAnimationLoop');
  const timelineTrack = shell.querySelector('#aseTimelineTrack');
  const timeline = shell.querySelector('#aseTimeline');
  const previewTime = shell.querySelector('#asePreviewTime');
  const previewOutput = shell.querySelector('#asePreviewOutput');
  // Le canvas de scène est un frère de l’éditeur avec son propre contexte
  // d’empilement. Le cadre doit donc vivre directement sous body pour rester
  // réellement au-dessus de l’image, sans modifier le renderer.
  document.body.append(transformBox);
  const rasterOverlay = document.createElement('canvas');
  rasterOverlay.className = 'ase-raster-overlay';
  rasterOverlay.width = runtime.width;
  rasterOverlay.height = runtime.height;
  rasterOverlay.hidden = true;
  document.body.append(rasterOverlay);
  const rasterOverlayContext = rasterOverlay.getContext('2d');

  let isOpen = false;
  let selectedId = null;
  let selectedPipelineId = null;
  let activeTool = 'move';
  let device = DEVICES['390x844'];
  let zoom = 1;
  let panX = 0;
  let panY = 0;
  let interaction = null;
  let spaceHeld = false;
  let preserveRatio = true;
  let snapping = true;
  let history = [];
  let future = [];
  let savedState = '';
  let dirty = false;
  let animationPaused = false;
  let propertyStartState = '';
  let animationStartState = '';
  let draggedLayerId = '';
  let activeTimeState = 'day';
  let validating = false;
  let editMode = 'scene';
  let rasterTarget = 'pixels';
  let rasterApplyAllFrames = false;
  let selectionPoints = [];
  let selectionClosed = false;
  let selectionCombine = 'replace';
  let brushSize = 28;
  let brushHardness = .8;
  let brushOpacity = 1;
  let brushFlow = .45;
  let brushColor = '#f2d19f';
  let cloneSource = null;
  let cloneAligned = true;
  let rasterStroke = null;
  let timeStateClipboard = null;
  let rasterPointer = null;
  let marqueeStart = null;
  const rasterSnapshotted = new Set();
  const collapsedGroups = new Set();

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function sceneState() {
    return JSON.stringify({
      objects: housing.getObjects(),
      animation: housing.getAnimationSettings?.() || null,
      editorConfig: runtime.getConfig(),
      selection: { points: selectionPoints, closed: selectionClosed, combine: selectionCombine }
    });
  }

  function currentObject() {
    return housing.getObjects().find(object => object.id === selectedId) || null;
  }

  function typeFor(object) {
    return object ? housing.getTypes()[object.type] : null;
  }

  function setStatus(message) {
    status.textContent = message;
  }

  function setDirty(value = true) {
    dirty = value;
    shell.querySelector('[data-command="save"]')?.classList.toggle('is-dirty', dirty);
  }

  function recordChange(before, label) {
    const after = sceneState();
    if (!before || before === after) return;
    history.push({ state: before, label });
    if (history.length > 80) history.shift();
    future = [];
    setDirty(after !== savedState);
    refreshUndoButtons();
  }

  function restoreState(serialized, reason) {
    try {
      const parsed = JSON.parse(serialized);
      const objects = Array.isArray(parsed) ? parsed : parsed.objects;
      if (!Array.isArray(objects)) throw new Error('Objets absents');
      housing.replaceObjects(objects, { reason });
      if (!Array.isArray(parsed) && parsed.animation) housing.setAnimationSettings?.(parsed.animation);
      if (!Array.isArray(parsed) && parsed.editorConfig) runtime.setConfig(parsed.editorConfig);
      if (!Array.isArray(parsed) && parsed.selection) {
        selectionPoints = Array.isArray(parsed.selection.points) ? parsed.selection.points : [];
        selectionClosed = Boolean(parsed.selection.closed);
        selectionCombine = parsed.selection.combine || 'replace';
      }
      if (!objects.some(object => object.id === selectedId)) selectedId = null;
      housing.select(selectedId);
      renderAll();
      renderer.render();
      return true;
    } catch (error) {
      console.error(error);
      setStatus('Composition invalide');
      return false;
    }
  }

  function undo() {
    const entry = history.pop();
    if (!entry) return;
    if (entry.layerEdit) {
      future.push({ layerEdit: captureLayerEdit(entry.layerEdit.layerId), label: entry.label });
      restoreLayerEdit(entry.layerEdit, 'undo-layer');
      setDirty(true);
      setStatus(`Annulé : ${entry.label}`);
      refreshUndoButtons();
      return;
    }
    if (entry.raster) {
      future.push({ raster: { ...entry.raster, before: cloneRasterCanvas(entry.raster.layerId, entry.raster.target, entry.raster.frameIndex), state: sceneState() }, label: entry.label });
      if (entry.raster.state) restoreState(entry.raster.state, 'undo-raster');
      restoreRasterCanvas(entry.raster.layerId, entry.raster.target, entry.raster.before, entry.raster.frameIndex);
      setDirty(true);
      setStatus(`Annulé : ${entry.label}`);
      refreshUndoButtons();
      return;
    }
    future.push({ state: sceneState(), label: entry.label });
    restoreState(entry.state, 'undo');
    setDirty(sceneState() !== savedState);
    setStatus(`Annulé : ${entry.label}`);
    refreshUndoButtons();
  }

  function redo() {
    const entry = future.pop();
    if (!entry) return;
    if (entry.layerEdit) {
      history.push({ layerEdit: captureLayerEdit(entry.layerEdit.layerId), label: entry.label });
      restoreLayerEdit(entry.layerEdit, 'redo-layer');
      setDirty(true);
      setStatus(`Rétabli : ${entry.label}`);
      refreshUndoButtons();
      return;
    }
    if (entry.raster) {
      history.push({ raster: { ...entry.raster, before: cloneRasterCanvas(entry.raster.layerId, entry.raster.target, entry.raster.frameIndex), state: sceneState() }, label: entry.label });
      if (entry.raster.state) restoreState(entry.raster.state, 'redo-raster');
      restoreRasterCanvas(entry.raster.layerId, entry.raster.target, entry.raster.before, entry.raster.frameIndex);
      setDirty(true);
      setStatus(`Rétabli : ${entry.label}`);
      refreshUndoButtons();
      return;
    }
    history.push({ state: sceneState(), label: entry.label });
    restoreState(entry.state, 'redo');
    setDirty(sceneState() !== savedState);
    setStatus(`Rétabli : ${entry.label}`);
    refreshUndoButtons();
  }

  function refreshUndoButtons() {
    shell.querySelector('[data-command="undo"]').disabled = history.length === 0;
    shell.querySelector('[data-command="redo"]').disabled = future.length === 0;
  }

  function activeRasterFrame(layerId = selectedPipelineId) {
    if (!layerId || rasterApplyAllFrames || !runtime.getFrameCount(layerId)) return null;
    const info = renderer.getAnimationInfo(layerId);
    return info?.type === 'frames' ? Math.max(0, Number(info.frame || 1) - 1) : null;
  }

  function cloneRasterCanvas(layerId, target, frameIndex = activeRasterFrame(layerId)) {
    const source = runtime.getCanvas(layerId, target, frameIndex);
    const copy = document.createElement('canvas');
    copy.width = source.width;
    copy.height = source.height;
    copy.getContext('2d').drawImage(source, 0, 0);
    copy.__athenaDirty = Boolean(source.__athenaDirty);
    return copy;
  }

  function restoreRasterCanvas(layerId, target, source, frameIndex = activeRasterFrame(layerId)) {
    const canvas = runtime.getCanvas(layerId, target, frameIndex);
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.drawImage(source, 0, 0);
    canvas.__athenaDirty = Boolean(source.__athenaDirty);
    renderer.render();
    drawRasterOverlay();
  }

  function captureLayerEdit(layerId) {
    const rasters = [];
    [null, ...Array.from({ length: runtime.getFrameCount(layerId) }, (_, index) => index)].forEach(frameIndex => {
      ['pixels', 'mask'].forEach(target => rasters.push({ target, frameIndex, canvas: cloneRasterCanvas(layerId, target, frameIndex) }));
    });
    return {
      layerId,
      state: sceneState(),
      rasters
    };
  }

  function restoreLayerEdit(snapshot, reason) {
    if (!snapshot?.layerId) return;
    restoreState(snapshot.state, reason);
    snapshot.rasters.forEach(raster => restoreRasterCanvas(snapshot.layerId, raster.target, raster.canvas, raster.frameIndex));
    renderer.render();
    drawRasterOverlay();
  }

  function recordRasterChange(before, label, layerId = selectedPipelineId, target = rasterTarget, beforeState = null, frameIndex = activeRasterFrame(layerId)) {
    if (!before || !layerId) return;
    history.push({ raster: { layerId, target, frameIndex, before, state: beforeState }, label });
    if (history.length > 30) history.shift();
    future = [];
    setDirty(true);
    refreshUndoButtons();
  }

  function viewportBounds() {
    const right = parseFloat(getComputedStyle(document.documentElement).getPropertyValue('--ase-right')) || 310;
    const left = 50;
    const top = 82;
    const bottom = shell.classList.contains('is-timeline-open') ? 76 : 0;
    return { left, top, width: Math.max(100, window.innerWidth - left - right), height: Math.max(100, window.innerHeight - top - bottom) };
  }

  function applyStageTransform() {
    if (!isOpen) return;
    const viewport = viewportBounds();
    const x = viewport.left + (viewport.width - device.width * zoom) / 2 + panX;
    const y = viewport.top + (viewport.height - device.height * zoom) / 2 + panY;
    const root = document.documentElement.style;
    root.setProperty('--ase-device-width', `${device.width}px`);
    root.setProperty('--ase-device-height', `${device.height}px`);
    root.setProperty('--ase-stage-scale', zoom.toFixed(4));
    root.setProperty('--ase-stage-x', `${x.toFixed(2)}px`);
    root.setProperty('--ase-stage-y', `${y.toFixed(2)}px`);
    zoomReadout.value = `${Math.round(zoom * 100)} %`;
    stageLabel.textContent = `${device.width} × ${device.height}`;
    stageLabel.style.left = `${Math.max(viewport.left + 4, x)}px`;
    stageLabel.style.top = `${Math.max(viewport.top + 2, y - 20)}px`;
    updateTransformBox();
    syncRasterOverlay();
  }

  function fitStage() {
    const viewport = viewportBounds();
    zoom = Math.min(1.25, Math.max(.12, Math.min((viewport.width - 30) / device.width, (viewport.height - 34) / device.height)));
    panX = 0;
    panY = 0;
    applyStageTransform();
  }

  function setZoom(nextZoom) {
    zoom = Math.min(3, Math.max(.1, nextZoom));
    applyStageTransform();
  }

  function selectObject(id) {
    if (editMode === 'raster') leaveRasterMode();
    selectedId = housing.getObjects().some(object => object.id === id) ? id : null;
    selectedPipelineId = null;
    housing.select(selectedId);
    renderAll();
  }

  function selectPipeline(id) {
    selectedPipelineId = PIPELINE_LAYERS.some(layer => layer.id === id) ? id : null;
    selectedId = null;
    housing.select(null);
    renderAll();
    drawRasterOverlay();
  }

  function measuredSize(object) {
    const element = housing.getElement(object.id)?.querySelector('.housing-object-art');
    const rect = element?.getBoundingClientRect();
    if (!rect) return { width: 0, height: 0 };
    return { width: rect.width / zoom, height: rect.height / zoom };
  }

  function adjustmentControl(name, label, value, min, max, step = 1) {
    return `<div class="ase-adjustment-row"><label>${label}</label><input data-adjust="${name}" type="range" min="${min}" max="${max}" step="${step}" value="${value}"><input data-adjust-number="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  }

  function pipelineTransformControl(name, label, value, min, max, step = 1) {
    return `<div class="ase-field"><label>${label}</label><input data-pipeline-transform="${name}" type="number" min="${min}" max="${max}" step="${step}" value="${value}"></div>`;
  }

  function renderPipelineProperties(pipeline) {
    const adjustment = runtime.getAdjustment(pipeline.id, activeTimeState);
    const config = runtime.getLayerConfig(pipeline.id);
    const transform = runtime.getTransform(pipeline.id);
    const animatedLabel = pipeline.frames ? `${pipeline.frames} FRAMES` : pipeline.animated ? 'ANIMÉ' : pipeline.kind.toUpperCase();
    return `
      <div class="ase-section">
        <div class="ase-section-title">Calque moteur <span>${animatedLabel}</span></div>
        <div class="ase-property-empty"><strong>${pipeline.name}</strong><br>Original Asset + Edited Instance · ${pipeline.mask ? 'mask disponible' : 'sans mask raster'}</div>
        <div class="ase-property-actions">
          <span class="ase-mode-badge">${editMode === 'raster' ? 'RASTER EDIT' : 'SCENE EDIT'}</span>
          <button class="ase-btn ${editMode === 'raster' ? 'is-active' : ''}" type="button" data-command="edit-pixels">${editMode === 'raster' ? 'Quitter Raster' : 'Edit Pixels'}</button>
        </div>
        <label class="ase-inline-toggle"><span>Visible</span><input type="checkbox" data-layer-visible ${config?.visible !== false ? 'checked' : ''}></label>
      </div>
      <div class="ase-section">
        <div class="ase-section-title">TRANSFORM · SCENE EDIT <span>PX / % / °</span></div>
        <div class="ase-property-grid">
          ${pipelineTransformControl('x', 'X', Math.round(transform.x), -1440, 1440)}
          ${pipelineTransformControl('y', 'Y', Math.round(transform.y), -2560, 2560)}
          ${pipelineTransformControl('scaleX', 'Sx', transform.scaleX.toFixed(3), .01, 10, .01)}
          ${pipelineTransformControl('scaleY', 'Sy', transform.scaleY.toFixed(3), .01, 10, .01)}
          ${pipelineTransformControl('rotation', '°', transform.rotation.toFixed(1), -3600, 3600, .1)}
        </div>
        <div class="ase-property-actions">
          <button class="ase-btn" type="button" data-command="reset-transform">Reset Transform</button>
          <span class="ase-property-empty">V : glisser directement sur le paysage</span>
        </div>
      </div>
      <div class="ase-section">
        <div class="ase-section-title">Cible raster <span>${rasterTarget === 'mask' ? 'MASK' : 'PIXELS'}</span></div>
        <div class="ase-raster-targets">
          <button class="ase-btn ${rasterTarget === 'pixels' ? 'is-active' : ''}" type="button" data-raster-target="pixels">Pixels</button>
          <button class="ase-btn ${rasterTarget === 'mask' ? 'is-active' : ''}" type="button" data-raster-target="mask" ${pipeline.mask ? '' : 'disabled'}>Mask</button>
        </div>
        ${runtime.getFrameCount(pipeline.id) ? `<div class="ase-section-title">Portée de la retouche <span>${rasterApplyAllFrames ? 'TOUTES' : `FRAME ${renderer.getAnimationInfo(pipeline.id)?.frame || 1}`}</span></div>
        <div class="ase-raster-targets">
          <button class="ase-btn ${!rasterApplyAllFrames ? 'is-active' : ''}" type="button" data-raster-scope="frame">Frame courante</button>
          <button class="ase-btn ${rasterApplyAllFrames ? 'is-active' : ''}" type="button" data-raster-scope="all">Toutes les frames</button>
        </div>` : ''}
        <div class="ase-property-actions">
          <label class="ase-color-chip" title="Couleur active"><input data-brush-color type="color" value="${brushColor}"></label>
          <label class="ase-field">Taille<input data-brush="size" type="number" min="1" max="300" value="${brushSize}"></label>
          <label class="ase-field">Dureté<input data-brush="hardness" type="number" min="0" max="100" value="${Math.round(brushHardness * 100)}"></label>
          <label class="ase-field">Opacité<input data-brush="opacity" type="number" min="1" max="100" value="${Math.round(brushOpacity * 100)}"></label>
          <label class="ase-field">Flux<input data-brush="flow" type="number" min="1" max="100" value="${Math.round(brushFlow * 100)}"></label>
          <button class="ase-btn" type="button" data-command="cut-selection" ${selectionPath() ? '' : 'disabled'}>Découper sélection</button>
        </div>
      </div>
      <div class="ase-section">
        <div class="ase-section-title">TIME STATE ADJUSTMENTS <span>LAND_${activeTimeState.toUpperCase()}</span></div>
        ${adjustmentControl('brightness', 'Luminosité', adjustment.brightness, -100, 100)}
        ${adjustmentControl('contrast', 'Contraste', adjustment.contrast, -100, 100)}
        ${adjustmentControl('saturation', 'Saturation', adjustment.saturation, -100, 100)}
        ${adjustmentControl('hue', 'Teinte', adjustment.hue, -180, 180)}
        ${adjustmentControl('opacity', 'Opacité calque', adjustment.opacity, 0, 100)}
        <div class="ase-section-title">Input Levels <span>BLACK · γ · WHITE</span></div>
        ${adjustmentControl('levels.black', 'Noir', adjustment.levels.black, 0, 254)}
        ${adjustmentControl('levels.gamma', 'Gamma', adjustment.levels.gamma, .1, 9.99, .01)}
        ${adjustmentControl('levels.white', 'Blanc', adjustment.levels.white, 1, 255)}
        <div class="ase-section-title">Output Levels <span>BLACK · WHITE</span></div>
        ${adjustmentControl('levels.outputBlack', 'Sortie noir', adjustment.levels.outputBlack, 0, 254)}
        ${adjustmentControl('levels.outputWhite', 'Sortie blanc', adjustment.levels.outputWhite, 1, 255)}
        <div class="ase-property-actions">
          <button class="ase-btn" type="button" data-command="reset-state">Reset State</button>
          <button class="ase-btn" type="button" data-command="copy-state">Copy State</button>
          <button class="ase-btn" type="button" data-command="paste-state" ${timeStateClipboard ? '' : 'disabled'}>Paste State</button>
          <button class="ase-btn is-danger" type="button" data-command="restore-layer">Restore Original Layer</button>
        </div>
      </div>`;
  }

  function renderProperties() {
    const object = currentObject();
    if (!object) {
      const pipeline = PIPELINE_LAYERS.find(layer => layer.id === selectedPipelineId);
      propertiesRoot.innerHTML = pipeline
        ? renderPipelineProperties(pipeline)
        : '<div class="ase-property-empty">Sélectionnez un objet du camp dans la scène ou dans le panneau Calques.</div>';
      return;
    }
    const type = typeFor(object);
    const size = measuredSize(object);
    propertiesRoot.innerHTML = `
      <div class="ase-section">
        <div class="ase-section-title">Objet <span>${type.animated ? 'ANIMÉ' : 'IMAGE'}</span></div>
        <div class="ase-property-grid">
          <div class="ase-field is-wide"><label for="asePropName">Nom</label><input id="asePropName" data-prop="name" value="${escapeHtml(object.name)}"></div>
          <div class="ase-field"><label>X</label><input data-prop="x" type="number" step="1" value="${Math.round(object.x * device.width)}"></div>
          <div class="ase-field"><label>Y</label><input data-prop="y" type="number" step="1" value="${Math.round(object.y * device.height)}"></div>
          <div class="ase-field"><label>L</label><input data-prop="width" type="number" min="8" step="1" value="${Math.round(size.width)}"></div>
          <div class="ase-field"><label>H</label><input data-prop="height" type="number" min="8" step="1" value="${Math.round(size.height)}"></div>
          <div class="ase-field"><label>Sx</label><input data-prop="scaleX" type="number" min=".2" max="4" step=".01" value="${object.scaleX.toFixed(2)}"></div>
          <div class="ase-field"><label>Sy</label><input data-prop="scaleY" type="number" min=".2" max="4" step=".01" value="${object.scaleY.toFixed(2)}"></div>
          <div class="ase-field"><label>°</label><input data-prop="rotation" type="number" step="1" value="${Math.round(object.rotation)}"></div>
          <div class="ase-field"><label>%</label><input data-prop="opacity" type="number" min="0" max="100" step="1" value="${Math.round(object.opacity * 100)}"></div>
        </div>
        <label class="ase-inline-toggle"><span>Conserver les proportions</span><input type="checkbox" data-option="ratio" ${preserveRatio ? 'checked' : ''}></label>
        <label class="ase-inline-toggle"><span>Magnétisme léger</span><input type="checkbox" data-option="snap" ${snapping ? 'checked' : ''}></label>
        <label class="ase-inline-toggle"><span>Visible</span><input type="checkbox" data-prop="visible" ${object.visible ? 'checked' : ''}></label>
        <label class="ase-inline-toggle"><span>Verrouillé</span><input type="checkbox" data-prop="locked" ${object.locked ? 'checked' : ''}></label>
      </div>
      <div class="ase-section">
        <div class="ase-section-title">Calque</div>
        <div class="ase-property-actions">
          <button class="ase-btn" type="button" data-command="duplicate">Dupliquer</button>
          <button class="ase-btn ${object.flip ? 'is-active' : ''}" type="button" data-command="flip-h">Retourner H</button>
          <button class="ase-btn ${object.flipY ? 'is-active' : ''}" type="button" data-command="flip-v">Retourner V</button>
          <button class="ase-btn" type="button" data-command="front">Premier plan</button>
          <button class="ase-btn" type="button" data-command="back">Arrière-plan</button>
          <button class="ase-btn is-danger" type="button" data-command="delete">Supprimer</button>
        </div>
      </div>`;
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"]/g, character => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[character]);
  }

  function applyProperty(input) {
    const object = currentObject();
    if (!object) return;
    const prop = input.dataset.prop;
    const patch = {};
    if (prop === 'name') patch.name = input.value.trim() || typeFor(object).label;
    if (prop === 'x') { patch.x = Number(input.value) / device.width; patch.freePlacement = true; }
    if (prop === 'y') { patch.y = Number(input.value) / device.height; patch.freePlacement = true; }
    if (prop === 'scaleX') patch.scaleX = Number(input.value);
    if (prop === 'scaleY') patch.scaleY = Number(input.value);
    if (prop === 'rotation') patch.rotation = Number(input.value);
    if (prop === 'opacity') patch.opacity = Number(input.value) / 100;
    if (prop === 'visible' || prop === 'locked') patch[prop] = input.checked;
    if (prop === 'width' || prop === 'height') {
      const measured = measuredSize(object);
      const target = Math.max(8, Number(input.value));
      const current = prop === 'width' ? measured.width : measured.height;
      if (current > 0 && Number.isFinite(target)) {
        const factor = target / current;
        if (prop === 'width') patch.scaleX = object.scaleX * factor;
        if (prop === 'height') patch.scaleY = object.scaleY * factor;
        if (preserveRatio) {
          patch.scaleX = object.scaleX * factor;
          patch.scaleY = object.scaleY * factor;
        }
      }
    }
    housing.updateObject(object.id, patch, { silent: true });
    updateTransformBox();
  }

  function commitProperty(input) {
    if (input.dataset.option === 'ratio') {
      preserveRatio = input.checked;
      propertyStartState = '';
      return;
    }
    if (input.dataset.option === 'snap') {
      snapping = input.checked;
      guideX.hidden = true;
      guideY.hidden = true;
      propertyStartState = '';
      return;
    }
    applyProperty(input);
    housing.updateObject(selectedId, {}, { reason: 'property' });
    recordChange(propertyStartState, `Modifier ${input.dataset.prop}`);
    propertyStartState = '';
    renderAll();
  }

  function adjustmentPatch(property, value) {
    if (property.startsWith('levels.')) return { levels: { [property.slice(7)]: value } };
    return { [property]: value };
  }

  function applyPipelineTransform(input) {
    if (!selectedPipelineId) return;
    const property = input.dataset.pipelineTransform;
    if (!property) return;
    runtime.setTransform(selectedPipelineId, { [property]: Number(input.value) });
    renderer.render();
  }

  function commitPipelineTransform(input) {
    const property = input.dataset.pipelineTransform;
    if (!property) return;
    applyPipelineTransform(input);
    recordChange(propertyStartState, `Transformer ${selectedPipelineId} · ${property}`);
    propertyStartState = '';
    renderProperties();
    setStatus(`${selectedPipelineId} · ${property} mis à jour`);
  }

  function applyAdjustmentInput(input) {
    if (!selectedPipelineId) return;
    const property = input.dataset.adjust || input.dataset.adjustNumber;
    if (!property) return;
    const value = Number(input.value);
    if (!Number.isFinite(value)) return;
    runtime.setAdjustment(selectedPipelineId, activeTimeState, adjustmentPatch(property, value));
    propertiesRoot.querySelectorAll(`[data-adjust="${property}"], [data-adjust-number="${property}"]`).forEach(control => {
      if (control !== input) control.value = String(value);
    });
    renderer.render();
  }

  function commitAdjustmentInput(input) {
    const property = input.dataset.adjust || input.dataset.adjustNumber;
    if (!property) return;
    applyAdjustmentInput(input);
    recordChange(propertyStartState, `Modifier ${property} · LAND_${activeTimeState.toUpperCase()}`);
    propertyStartState = '';
    setStatus(`${property} mis à jour pour LAND_${activeTimeState.toUpperCase()}`);
  }

  function setTimeState(stateId) {
    if (!runtime.states.includes(stateId)) return;
    activeTimeState = stateId;
    renderer.setReferenceState(stateId);
    shell.querySelectorAll('[data-time-state]').forEach(button => button.classList.toggle('is-active', button.dataset.timeState === stateId));
    previewOutput.textContent = `LAND_${stateId.toUpperCase()}`;
    renderProperties();
    setStatus(`État de référence LAND_${stateId.toUpperCase()}`);
  }

  function formatMinutes(value) {
    const minutes = Math.max(0, Math.min(1439, Number(value) || 0));
    return `${String(Math.floor(minutes / 60)).padStart(2, '0')}:${String(minutes % 60).padStart(2, '0')}`;
  }

  function clearSelection() {
    const before = sceneState();
    selectionPoints = [];
    selectionClosed = false;
    recordChange(before, 'Désélectionner');
    drawRasterOverlay();
    renderProperties();
  }

  function deleteRasterSelection(forceMask = false) {
    if (!selectedPipelineId || !selectionPath()) return false;
    const target = (forceMask || rasterTarget === 'pixels') ? 'mask' : rasterTarget;
    const beforeState = sceneState();
    if (target === 'mask') ensureMaskInitialized(selectedPipelineId);
    const frameIndex = activeRasterFrame(selectedPipelineId);
    const before = cloneRasterCanvas(selectedPipelineId, target, frameIndex);
    const canvas = runtime.getCanvas(selectedPipelineId, target, frameIndex);
    const context = canvas.getContext('2d');
    context.save();
    context.clip(selectionPath());
    context.clearRect(0, 0, canvas.width, canvas.height);
    context.restore();
    runtime.markRasterDirty(selectedPipelineId, target, frameIndex);
    recordRasterChange(before, `Découper la sélection · ${target}`, selectedPipelineId, target, beforeState, frameIndex);
    renderer.render();
    renderProperties();
    return true;
  }

  function renderLayers() {
    const term = layerSearch.value.trim().toLocaleLowerCase('fr');
    const objects = housing.getObjects().slice().sort((a, b) => b.order - a.order);
    const pipelineRows = PIPELINE_LAYERS
      .filter(layer => !term || layer.name.toLocaleLowerCase('fr').includes(term))
      .map(layer => {
        const config = runtime.getLayerConfig(layer.id);
        const badges = [layer.animated || layer.frames ? '▶' : '▧', layer.mask ? '◐' : '', 'DAY'].filter(Boolean).join(' ');
        return `<div class="ase-layer-row ${selectedPipelineId === layer.id ? 'is-selected' : ''} ${config?.visible === false ? 'is-hidden' : ''}" data-pipeline-id="${layer.id}"><span class="ase-layer-icon">${config?.visible === false ? '○' : '◉'}</span><span class="ase-layer-icon">${layer.icon}</span><span class="ase-layer-name">${layer.name}<small>${badges}${layer.frames ? ` · ${layer.frames} frames` : ''}</small></span><span class="ase-layer-icon">✎</span></div>`;
      }).join('');
    const objectRows = objects
      .filter(object => !term || object.name.toLocaleLowerCase('fr').includes(term) || typeFor(object).label.toLocaleLowerCase('fr').includes(term))
      .map(object => `<div class="ase-layer-row ${selectedId === object.id ? 'is-selected' : ''} ${object.visible ? '' : 'is-hidden'} ${object.locked ? 'is-locked' : ''}" data-layer-id="${object.id}" draggable="${!object.locked}">
        <button class="ase-layer-mini" type="button" data-layer-action="visible" title="Afficher ou masquer">${object.visible ? '◉' : '○'}</button>
        <span class="ase-layer-icon">${typeFor(object).animated ? '▶' : '▧'}</span>
        <span class="ase-layer-name">${escapeHtml(object.name)}</span>
        <button class="ase-layer-mini" type="button" data-layer-action="locked" title="Verrouiller ou déverrouiller">${object.locked ? '🔒' : '·'}</button>
      </div>`).join('');
    const renderCollapsed = collapsedGroups.has('render');
    const decorCollapsed = collapsedGroups.has('decor');
    layerList.innerHTML = `
      <button class="ase-group-head" type="button" data-layer-group="render" aria-expanded="${!renderCollapsed}"><span>${renderCollapsed ? '›' : '⌄'}</span><span>▣</span><span>Rendu temporel</span><span>V2</span></button>${renderCollapsed ? '' : pipelineRows || '<div class="ase-property-empty">Aucun calque moteur</div>'}
      <button class="ase-group-head" type="button" data-layer-group="decor" aria-expanded="${!decorCollapsed}"><span>${decorCollapsed ? '›' : '⌄'}</span><span>◇</span><span>Décor du camp</span><span>${objects.length}</span></button>${decorCollapsed ? '' : objectRows || '<div class="ase-property-empty">Aucun objet</div>'}`;
  }

  function renderAssets() {
    const term = assetSearch.value.trim().toLocaleLowerCase('fr');
    assetGrid.innerHTML = Object.entries(housing.getTypes())
      .filter(([, type]) => !term || type.label.toLocaleLowerCase('fr').includes(term))
      .map(([name, type]) => `<button class="ase-asset" type="button" draggable="true" data-asset-type="${name}"><img src="${type.src}" alt=""><strong>${escapeHtml(type.label)}</strong><small>${type.animated ? 'Animation' : 'Image'} · glisser ou cliquer</small></button>`).join('');
  }

  function renderTimeline() {
    const object = currentObject();
    const pipeline = PIPELINE_LAYERS.find(layer => layer.id === selectedPipelineId);
    const animated = Boolean(typeFor(object)?.animated || pipeline?.animated || pipeline?.frames);
    const wasOpen = shell.classList.contains('is-timeline-open');
    shell.classList.toggle('is-timeline-open', animated);
    const button = shell.querySelector('[data-command="animation-toggle"]');
    if (button) button.textContent = animationPaused ? '▶ Lecture' : '⏸ Pause';
    const copy = timeline.querySelector('.ase-timeline-copy');
    const info = pipeline ? renderer.getAnimationInfo(pipeline.id) : null;
    const settings = info || housing.getAnimationSettings?.() || { fps: 15, loop: true, frameCount: 20 };
    animationFpsInput.value = String(settings.fps || 24);
    animationLoopInput.checked = settings.loop !== false;
    animationFpsInput.disabled = Boolean(pipeline);
    animationLoopInput.disabled = Boolean(pipeline);
    timeline.querySelectorAll('[data-command^="frame-"]').forEach(button => { button.disabled = !pipeline; });
    if (pipeline) {
      copy.innerHTML = `<strong>${escapeHtml(pipeline.name)}</strong><small>${info?.type === 'frames' ? `Editing Frame ${info.frame} / ${info.frameCount}` : 'Flux vidéo source · navigation réelle'}</small>`;
      timelineTrack.innerHTML = info?.type === 'frames'
        ? Array.from({ length: info.frameCount }, (_, index) => `<button type="button" class="ase-frame-chip ${index + 1 === info.frame ? 'is-active' : ''}" data-frame-index="${index}">${String(index + 1).padStart(2, '0')}</button>`).join('')
        : `<span>${(info?.time || 0).toFixed(2)} s / ${(info?.duration || 0).toFixed(2)} s · ${info?.fps || 24} FPS</span>`;
    } else {
      copy.innerHTML = '<strong>Feu animé</strong><small>GIF existant · déplacement de l’objet entier</small>';
      timelineTrack.textContent = `${settings.frameCount || 20} frames source · aperçu ${settings.fps} FPS`;
    }
    if (wasOpen !== animated) requestAnimationFrame(applyStageTransform);
  }

  function renderAll() {
    if (!isOpen) return;
    renderProperties();
    renderLayers();
    renderTimeline();
    refreshUndoButtons();
    requestAnimationFrame(updateTransformBox);
  }

  function updateTransformBox() {
    if (!isOpen) return;
    const object = currentObject();
    const art = object && object.visible ? housing.getElement(object.id)?.querySelector('.housing-object-art') : null;
    if (!art) {
      transformBox.hidden = true;
      return;
    }
    const rect = art.getBoundingClientRect();
    if (!rect.width || !rect.height) {
      transformBox.hidden = true;
      return;
    }
    transformBox.hidden = false;
    transformBox.style.left = `${rect.left}px`;
    transformBox.style.top = `${rect.top}px`;
    transformBox.style.width = `${rect.width}px`;
    transformBox.style.height = `${rect.height}px`;
  }

  function addAsset(typeName, clientX, clientY) {
    const before = sceneState();
    const rect = stage.getBoundingClientRect();
    const x = Number.isFinite(clientX) ? (clientX - rect.left) / rect.width : .5;
    const y = Number.isFinite(clientY) ? (clientY - rect.top) / rect.height : .78;
    const object = housing.addObject(typeName, { x, y, freePlacement: true, order: housing.getObjects().length }, { reason: 'editor-add' });
    if (!object) return;
    selectedId = object.id;
    selectedPipelineId = null;
    recordChange(before, `Ajouter ${typeFor(object).label}`);
    renderAll();
    setStatus(`${typeFor(object).label} ajouté`);
  }

  function deleteSelected() {
    const object = currentObject();
    if (!object || object.locked) return;
    const before = sceneState();
    housing.removeObject(object.id, { reason: 'editor-delete' });
    selectedId = null;
    recordChange(before, `Supprimer ${object.name}`);
    renderAll();
  }

  function duplicateSelected() {
    const object = currentObject();
    if (!object || object.locked) return;
    const before = sceneState();
    const copy = housing.duplicateObject(object.id, { reason: 'editor-duplicate' });
    if (!copy) return;
    selectedId = copy.id;
    recordChange(before, `Dupliquer ${object.name}`);
    renderAll();
  }

  function moveLayer(where) {
    const object = currentObject();
    if (!object || object.locked) return;
    const before = sceneState();
    const ids = housing.getObjects().sort((a, b) => a.order - b.order).map(item => item.id).filter(id => id !== object.id);
    if (where === 'front') ids.push(object.id);
    else ids.unshift(object.id);
    housing.reorderObjects(ids, { reason: `editor-${where}` });
    recordChange(before, where === 'front' ? 'Placer au premier plan' : 'Placer à l’arrière-plan');
    renderAll();
  }

  function flipSelected(axis) {
    const object = currentObject();
    if (!object || object.locked) return;
    const before = sceneState();
    const property = axis === 'vertical' ? 'flipY' : 'flip';
    housing.updateObject(object.id, { [property]: !object[property] }, { reason: `editor-flip-${axis}` });
    recordChange(before, axis === 'vertical' ? 'Retourner verticalement' : 'Retourner horizontalement');
    renderAll();
  }

  function createAutomaticSnapshot(serialized, name, extra = {}) {
    try {
      const parsed = JSON.parse(serialized);
      const snapshots = loadSnapshots();
      snapshots.unshift({
        id: `${Date.now()}`,
        name,
        createdAt: new Date().toISOString(),
        automatic: true,
        ...extra,
        objects: parsed.objects,
        animation: parsed.animation,
        editorConfig: parsed.editorConfig
      });
      localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, 20)));
      if (isOpen) refreshSnapshots();
    } catch (error) {
      console.warn('Impossible de créer la sauvegarde automatique.', error);
    }
  }

  async function save() {
    if (validating) return;
    validating = true;
    const button = shell.querySelector('[data-command="save"]');
    button.disabled = true;
    setStatus('Préparation de la proposition…');
    try {
      const source = await fetch('/__editor__/api/status').then(result => result.json());
      const response = await fetch('/__editor__/api/proposals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          schema: 'athena-map-editor-proposal',
          version: 1,
          createdAt: new Date().toISOString(),
          source,
          baseline: JSON.parse(savedState),
          draft: JSON.parse(sceneState()),
          rasterEdits: await runtime.exportRasterEdits()
        })
      });
      const result = await response.json();
      if (!response.ok || !result.ok) throw new Error(result.error || 'Proposition refusée');
      createAutomaticSnapshot(savedState, `Copie avant envoi · ${new Date().toLocaleString('fr-FR')}`);
      setDirty(false);
      setStatus(`Proposition ${result.id} envoyée · aucune modification injectée`);
      window.alert(`Proposition ${result.id} enregistrée.\n\nElle n’a pas encore été injectée dans l’application. Demande à Codex de l’appliquer : une sauvegarde sera créée avant toute modification.`);
    } catch (error) {
      console.error(error);
      setStatus(`Échec de l’envoi — la version courante est préservée (${error.message})`);
    } finally {
      validating = false;
      button.disabled = false;
    }
  }

  function exportScene() {
    const payload = {
      schema: 'athena-scene-composition',
      version: 2,
      exportedAt: new Date().toISOString(),
      canvas: housing.getSceneSize(),
      objects: housing.getObjects(),
      animation: housing.getAnimationSettings?.() || null,
      editorConfig: runtime.getConfig(),
      rasterStorage: 'IndexedDB · athena-scene-editor-raster-v2'
    };
    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `athena-scene-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setStatus('Composition exportée');
  }

  async function importScene(file) {
    try {
      const payload = JSON.parse(await file.text());
      if (payload?.schema !== 'athena-scene-composition' || !Array.isArray(payload.objects)) throw new Error('Format inconnu');
      const before = sceneState();
      housing.replaceObjects(payload.objects, { reason: 'editor-import' });
      if (payload.animation) housing.setAnimationSettings?.(payload.animation);
      if (payload.editorConfig) runtime.setConfig(payload.editorConfig);
      selectedId = null;
      recordChange(before, 'Importer une composition');
      renderAll();
      setStatus('Composition importée — enregistrez pour la conserver');
    } catch (error) {
      console.error(error);
      setStatus('Import refusé : fichier invalide');
    }
  }

  function loadSnapshots() {
    try {
      const parsed = JSON.parse(localStorage.getItem(SNAPSHOT_KEY) || '[]');
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  function refreshSnapshots() {
    const selected = snapshotSelect.value;
    snapshotSelect.innerHTML = '<option value="">Instantanés…</option><option value="__original__">Original (ouverture)</option>' + loadSnapshots().map(snapshot => `<option value="${snapshot.id}">${escapeHtml(snapshot.name)}</option>`).join('');
    if ([...snapshotSelect.options].some(option => option.value === selected)) snapshotSelect.value = selected;
    shell.querySelector('[data-command="delete-snapshot"]')?.toggleAttribute('disabled', !snapshotSelect.value || snapshotSelect.value === '__original__');
  }

  function createSnapshot() {
    const name = window.prompt('Nom de l’instantané :', `Version ${new Date().toLocaleString('fr-FR')}`)?.trim();
    if (!name) return;
    const snapshots = loadSnapshots();
    snapshots.unshift({ id: `${Date.now()}`, name, createdAt: new Date().toISOString(), objects: housing.getObjects(), animation: housing.getAnimationSettings?.() || null, editorConfig: runtime.getConfig() });
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots.slice(0, 20)));
    refreshSnapshots();
    snapshotSelect.value = snapshots[0].id;
    setStatus(`Instantané « ${name} » créé`);
  }

  async function restoreSnapshot(id) {
    if (id === '__original__') {
      const before = sceneState();
      restoreState(savedState, 'editor-original');
      recordChange(before, 'Restaurer la composition d’ouverture');
      setStatus('Composition d’ouverture restaurée');
      return;
    }
    const snapshot = loadSnapshots().find(item => item.id === id);
    if (!snapshot) return;
    const before = sceneState();
    housing.replaceObjects(snapshot.objects, { reason: 'editor-snapshot' });
    if (snapshot.animation) housing.setAnimationSettings?.(snapshot.animation);
    if (snapshot.editorConfig) runtime.setConfig(snapshot.editorConfig);
    if (snapshot.rasterBackupId) await runtime.loadBackupToDraft(snapshot.rasterBackupId);
    selectedId = null;
    recordChange(before, `Restaurer ${snapshot.name}`);
    renderAll();
    renderer.render();
    setStatus(`Instantané « ${snapshot.name} » restauré`);
  }

  function deleteSnapshot() {
    const id = snapshotSelect.value;
    if (!id || id === '__original__') return;
    const snapshots = loadSnapshots();
    const snapshot = snapshots.find(item => item.id === id);
    if (!snapshot || !window.confirm(`Supprimer l’instantané « ${snapshot.name} » ?`)) return;
    localStorage.setItem(SNAPSHOT_KEY, JSON.stringify(snapshots.filter(item => item.id !== id)));
    snapshotSelect.value = '';
    refreshSnapshots();
    setStatus(`Instantané « ${snapshot.name} » supprimé`);
  }

  async function openEditor() {
    if (isOpen) return;
    await runtime.beginSession();
    isOpen = true;
    savedState = sceneState();
    history = [];
    future = [];
    dirty = false;
    launcher.hidden = true;
    shell.hidden = false;
    document.body.classList.add('scene-editor-open');
    housing.setExternalEditing(true);
    refreshSnapshots();
    renderAssets();
    renderAll();
    renderer.setReferenceState(activeTimeState);
    requestAnimationFrame(fitStage);
  }

  async function closeEditor(validated = false) {
    if (!isOpen) return;
    if (!validated && dirty && !window.confirm('Annuler cette session ? Aucun changement de la copie ne sera appliqué.')) return;
    if (!validated) {
      if (dirty) restoreState(savedState, 'editor-discard');
      await runtime.cancelSession();
    }
    renderer.clearPreview();
    isOpen = false;
    animationPaused = false;
    housing.setAnimationPaused(false);
    housing.setExternalEditing(false);
    document.body.classList.remove('scene-editor-open', 'ase-pan-mode');
    shell.hidden = true;
    transformBox.hidden = true;
    guideX.hidden = true;
    guideY.hidden = true;
    launcher.hidden = false;
    selectedId = null;
    selectedPipelineId = null;
    interaction = null;
  }

  function setTool(tool) {
    if (['marquee', 'lasso', 'brush', 'clone', 'eraser', 'eyedropper'].includes(tool) && !selectedPipelineId) {
      setStatus('Sélectionnez d’abord un calque du moteur');
      return;
    }
    if (['marquee', 'lasso', 'brush', 'clone', 'eraser', 'eyedropper'].includes(tool)) enterRasterMode();
    activeTool = tool;
    shell.querySelectorAll('[data-tool]').forEach(button => button.classList.toggle('is-active', button.dataset.tool === tool));
    document.body.classList.toggle('ase-pan-mode', tool === 'hand');
    rasterOverlay.classList.toggle('is-brush', ['brush', 'clone', 'eraser'].includes(tool));
    rasterOverlay.classList.toggle('is-crosshair', ['marquee', 'lasso', 'eyedropper'].includes(tool));
    drawRasterOverlay();
  }

  function enterRasterMode() {
    if (!selectedPipelineId || selectedPipelineId === 'camp') {
      setStatus('Ce calque se modifie en mode composition');
      return false;
    }
    editMode = 'raster';
    transformBox.hidden = true;
    rasterOverlay.hidden = false;
    if (!rasterSnapshotted.has(selectedPipelineId)) {
      createAutomaticSnapshot(sceneState(), `Before editing ${PIPELINE_LAYERS.find(layer => layer.id === selectedPipelineId)?.name || selectedPipelineId}`);
      rasterSnapshotted.add(selectedPipelineId);
    }
    syncRasterOverlay();
    renderProperties();
    setStatus(`RASTER EDIT · ${rasterTarget === 'mask' ? 'Mask' : 'Pixels'} · ${PIPELINE_LAYERS.find(layer => layer.id === selectedPipelineId)?.name}`);
    return true;
  }

  function leaveRasterMode() {
    editMode = 'scene';
    rasterOverlay.hidden = true;
    rasterStroke = null;
    marqueeStart = null;
    if (activeTool !== 'hand') activeTool = 'move';
    shell.querySelectorAll('[data-tool]').forEach(button => button.classList.toggle('is-active', button.dataset.tool === activeTool));
    renderProperties();
    updateTransformBox();
  }

  function syncRasterOverlay() {
    if (!isOpen || editMode !== 'raster' || !selectedPipelineId) {
      rasterOverlay.hidden = true;
      return;
    }
    const sceneCanvas = document.querySelector('#scene');
    const rect = sceneCanvas?.getBoundingClientRect();
    if (!rect?.width || !rect?.height) return;
    rasterOverlay.hidden = false;
    rasterOverlay.style.left = `${rect.left}px`;
    rasterOverlay.style.top = `${rect.top}px`;
    rasterOverlay.style.width = `${rect.width}px`;
    rasterOverlay.style.height = `${rect.height}px`;
    drawRasterOverlay();
  }

  function scenePoint(event) {
    const rect = rasterOverlay.getBoundingClientRect();
    return {
      x: Math.max(0, Math.min(runtime.width, (event.clientX - rect.left) / rect.width * runtime.width)),
      y: Math.max(0, Math.min(runtime.height, (event.clientY - rect.top) / rect.height * runtime.height))
    };
  }

  function selectionPath() {
    if (!selectionClosed || selectionPoints.length < 3) return null;
    const path = new Path2D();
    path.moveTo(selectionPoints[0].x, selectionPoints[0].y);
    selectionPoints.slice(1).forEach(point => path.lineTo(point.x, point.y));
    path.closePath();
    return path;
  }

  function drawRasterOverlay() {
    rasterOverlayContext.clearRect(0, 0, runtime.width, runtime.height);
    if (selectionPoints.length) {
      rasterOverlayContext.save();
      rasterOverlayContext.beginPath();
      rasterOverlayContext.moveTo(selectionPoints[0].x, selectionPoints[0].y);
      selectionPoints.slice(1).forEach(point => rasterOverlayContext.lineTo(point.x, point.y));
      if (selectionClosed) rasterOverlayContext.closePath();
      else if (rasterPointer) rasterOverlayContext.lineTo(rasterPointer.x, rasterPointer.y);
      rasterOverlayContext.setLineDash([7, 5]);
      rasterOverlayContext.lineWidth = 2;
      rasterOverlayContext.strokeStyle = '#fff';
      rasterOverlayContext.stroke();
      rasterOverlayContext.lineDashOffset = 6;
      rasterOverlayContext.strokeStyle = '#171923';
      rasterOverlayContext.stroke();
      selectionPoints.forEach((point, index) => {
        rasterOverlayContext.fillStyle = index === 0 ? '#a984ff' : '#fff';
        rasterOverlayContext.fillRect(point.x - 3, point.y - 3, 6, 6);
      });
      rasterOverlayContext.restore();
    }
    if (rasterPointer && ['brush', 'clone', 'eraser'].includes(activeTool)) {
      rasterOverlayContext.save();
      rasterOverlayContext.beginPath();
      rasterOverlayContext.arc(rasterPointer.x, rasterPointer.y, brushSize / 2, 0, Math.PI * 2);
      rasterOverlayContext.lineWidth = 1.5;
      rasterOverlayContext.strokeStyle = '#fff';
      rasterOverlayContext.shadowColor = '#000';
      rasterOverlayContext.shadowBlur = 2;
      rasterOverlayContext.stroke();
      rasterOverlayContext.restore();
    }
    if (cloneSource) {
      rasterOverlayContext.save();
      rasterOverlayContext.strokeStyle = '#ffcf72';
      rasterOverlayContext.lineWidth = 1.5;
      rasterOverlayContext.beginPath();
      rasterOverlayContext.moveTo(cloneSource.x - 8, cloneSource.y);
      rasterOverlayContext.lineTo(cloneSource.x + 8, cloneSource.y);
      rasterOverlayContext.moveTo(cloneSource.x, cloneSource.y - 8);
      rasterOverlayContext.lineTo(cloneSource.x, cloneSource.y + 8);
      rasterOverlayContext.stroke();
      rasterOverlayContext.restore();
    }
  }

  function ensureMaskInitialized(layerId) {
    const frameIndex = activeRasterFrame(layerId);
    const config = runtime.getLayerConfig(layerId);
    const mask = runtime.getCanvas(layerId, 'mask', frameIndex);
    if ((frameIndex === null && config?.maskEnabled) || (frameIndex !== null && mask.__athenaDirty)) return;
    const context = mask.getContext('2d');
    context.fillStyle = '#fff';
    context.fillRect(0, 0, mask.width, mask.height);
    runtime.markRasterDirty(layerId, 'mask', frameIndex);
  }

  function withRasterClip(context, callback) {
    context.save();
    const path = selectionPath();
    if (path) context.clip(path);
    callback();
    context.restore();
  }

  function paintBrushStamp(context, point, erase = false) {
    const radius = brushSize / 2;
    withRasterClip(context, () => {
      context.globalCompositeOperation = erase ? 'destination-out' : 'source-over';
      const alpha = Math.max(.01, brushOpacity * brushFlow);
      if (brushHardness >= .98) {
        context.globalAlpha = alpha;
        context.fillStyle = rasterTarget === 'mask' ? '#fff' : brushColor;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      } else {
        const gradient = context.createRadialGradient(point.x, point.y, radius * brushHardness, point.x, point.y, radius);
        const color = rasterTarget === 'mask' ? '255,255,255' : `${parseInt(brushColor.slice(1, 3), 16)},${parseInt(brushColor.slice(3, 5), 16)},${parseInt(brushColor.slice(5, 7), 16)}`;
        gradient.addColorStop(0, `rgba(${color},${alpha})`);
        gradient.addColorStop(1, `rgba(${color},0)`);
        context.globalAlpha = 1;
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(point.x, point.y, radius, 0, Math.PI * 2);
        context.fill();
      }
      context.globalAlpha = 1;
      context.globalCompositeOperation = 'source-over';
    });
  }

  function paintCloneStamp(context, point) {
    if (!cloneSource || !rasterStroke) return;
    const destinationStart = rasterStroke.start;
    const sourceX = cloneSource.x + point.x - destinationStart.x;
    const sourceY = cloneSource.y + point.y - destinationStart.y;
    const radius = brushSize / 2;
    const sceneCanvas = document.querySelector('#scene');
    withRasterClip(context, () => {
      context.save();
      context.globalAlpha = brushOpacity * brushFlow;
      context.beginPath();
      context.arc(point.x, point.y, radius, 0, Math.PI * 2);
      context.clip();
      context.drawImage(sceneCanvas, sourceX - radius, sourceY - radius, brushSize, brushSize, point.x - radius, point.y - radius, brushSize, brushSize);
      context.restore();
    });
  }

  function paintStrokeSegment(from, to) {
    if (!selectedPipelineId) return;
    if (rasterTarget === 'mask') ensureMaskInitialized(selectedPipelineId);
    const frameIndex = activeRasterFrame(selectedPipelineId);
    const canvas = runtime.getCanvas(selectedPipelineId, rasterTarget, frameIndex);
    const context = canvas.getContext('2d');
    const distance = Math.max(1, Math.hypot(to.x - from.x, to.y - from.y));
    const step = Math.max(1, brushSize * .18);
    const count = Math.ceil(distance / step);
    for (let index = 0; index <= count; index++) {
      const t = index / count;
      const point = { x: from.x + (to.x - from.x) * t, y: from.y + (to.y - from.y) * t };
      if (activeTool === 'clone') paintCloneStamp(context, point);
      else paintBrushStamp(context, point, activeTool === 'eraser');
    }
    runtime.markRasterDirty(selectedPipelineId, rasterTarget, frameIndex);
    renderer.render();
  }

  function pickColor(point) {
    try {
      const pixel = document.querySelector('#scene').getContext('2d').getImageData(Math.floor(point.x), Math.floor(point.y), 1, 1).data;
      brushColor = `#${[pixel[0], pixel[1], pixel[2]].map(value => value.toString(16).padStart(2, '0')).join('')}`;
      setStatus(`Couleur ${brushColor.toUpperCase()} · RGB ${pixel[0]}, ${pixel[1]}, ${pixel[2]}`);
      renderProperties();
    } catch (error) {
      setStatus('Pipette indisponible pour cette source');
    }
  }

  function beginObjectMove(event, object) {
    if (object.locked) return;
    interaction = {
      kind: 'move',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      objectX: object.x,
      objectY: object.y,
      moved: false,
      before: sceneState()
    };
    stage.setPointerCapture?.(event.pointerId);
  }

  function beginPipelineMove(event) {
    if (!selectedPipelineId) return;
    const transform = runtime.getTransform(selectedPipelineId);
    interaction = {
      kind: 'pipeline-move',
      pointerId: event.pointerId,
      startX: event.clientX,
      startY: event.clientY,
      transformX: transform.x,
      transformY: transform.y,
      layerId: selectedPipelineId,
      moved: false,
      before: sceneState()
    };
    stage.setPointerCapture?.(event.pointerId);
  }

  function nearestSnap(value, candidates, threshold) {
    let nearest = null;
    let distance = threshold;
    candidates.forEach(candidate => {
      const candidateDistance = Math.abs(candidate - value);
      if (candidateDistance <= distance) {
        nearest = candidate;
        distance = candidateDistance;
      }
    });
    return nearest;
  }

  function snapPosition(object, x, y, rect) {
    guideX.hidden = true;
    guideY.hidden = true;
    if (!snapping) return { x, y };
    const others = housing.getObjects().filter(candidate => candidate.id !== object.id && candidate.visible);
    const snappedX = nearestSnap(x, [.5, ...others.map(candidate => candidate.x)], 7 / rect.width);
    const snappedY = nearestSnap(y, [.5, ...others.map(candidate => candidate.y)], 7 / rect.height);
    if (snappedX !== null) {
      x = snappedX;
      guideX.hidden = false;
      guideX.style.left = `${rect.left + x * rect.width}px`;
      guideX.style.top = `${rect.top}px`;
      guideX.style.height = `${rect.height}px`;
    }
    if (snappedY !== null) {
      y = snappedY;
      guideY.hidden = false;
      guideY.style.left = `${rect.left}px`;
      guideY.style.top = `${rect.top + y * rect.height}px`;
      guideY.style.width = `${rect.width}px`;
    }
    return { x, y };
  }

  function beginPan(event) {
    interaction = { kind: 'pan', pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, panX, panY };
    stage.setPointerCapture?.(event.pointerId);
  }

  function beginTransform(event, handle) {
    const object = currentObject();
    if (!object || object.locked) return;
    const rect = transformBox.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;
    interaction = {
      kind: handle === 'rotate' ? 'rotate' : 'resize',
      pointerId: event.pointerId,
      centerX,
      centerY,
      startAngle: Math.atan2(event.clientY - centerY, event.clientX - centerX),
      startDistance: Math.max(1, Math.hypot(event.clientX - centerX, event.clientY - centerY)),
      startVectorX: Math.max(1, Math.abs(event.clientX - centerX)),
      startVectorY: Math.max(1, Math.abs(event.clientY - centerY)),
      scaleX: object.scaleX,
      scaleY: object.scaleY,
      rotation: object.rotation,
      before: sceneState()
    };
    transformBox.setPointerCapture?.(event.pointerId);
    event.preventDefault();
    event.stopPropagation();
  }

  function updateInteraction(event) {
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    if (interaction.kind === 'pan') {
      panX = interaction.panX + event.clientX - interaction.startX;
      panY = interaction.panY + event.clientY - interaction.startY;
      applyStageTransform();
      return;
    }
    if (interaction.kind === 'pipeline-move') {
      interaction.moved ||= Math.hypot(event.clientX - interaction.startX, event.clientY - interaction.startY) > 2;
      if (!interaction.moved) return;
      const rect = stage.getBoundingClientRect();
      runtime.setTransform(interaction.layerId, {
        x: interaction.transformX + (event.clientX - interaction.startX) / rect.width * runtime.width,
        y: interaction.transformY + (event.clientY - interaction.startY) / rect.height * runtime.height
      });
      renderer.render();
      event.preventDefault();
      return;
    }
    const object = currentObject();
    if (!object) return;
    if (interaction.kind === 'move') {
      interaction.moved ||= Math.hypot(event.clientX - interaction.startX, event.clientY - interaction.startY) > 2;
      if (!interaction.moved) return;
      const rect = stage.getBoundingClientRect();
      const position = snapPosition(
        object,
        interaction.objectX + (event.clientX - interaction.startX) / rect.width,
        interaction.objectY + (event.clientY - interaction.startY) / rect.height,
        rect
      );
      housing.updateObject(object.id, {
        x: position.x,
        y: position.y,
        freePlacement: true
      }, { silent: true });
    }
    if (interaction.kind === 'resize') {
      const distance = Math.max(1, Math.hypot(event.clientX - interaction.centerX, event.clientY - interaction.centerY));
      const factor = distance / interaction.startDistance;
      const factorX = Math.max(.1, Math.abs(event.clientX - interaction.centerX) / interaction.startVectorX);
      const factorY = Math.max(.1, Math.abs(event.clientY - interaction.centerY) / interaction.startVectorY);
      const keepRatio = preserveRatio || event.shiftKey;
      housing.updateObject(object.id, {
        scaleX: interaction.scaleX * (keepRatio ? factor : factorX),
        scaleY: interaction.scaleY * (keepRatio ? factor : factorY)
      }, { silent: true });
    }
    if (interaction.kind === 'rotate') {
      const angle = Math.atan2(event.clientY - interaction.centerY, event.clientX - interaction.centerX);
      housing.updateObject(object.id, { rotation: interaction.rotation + (angle - interaction.startAngle) * 180 / Math.PI }, { silent: true });
    }
    updateTransformBox();
    event.preventDefault();
  }

  function endInteraction(event) {
    if (!interaction || event.pointerId !== interaction.pointerId) return;
    const finished = interaction;
    interaction = null;
    guideX.hidden = true;
    guideY.hidden = true;
    if (finished.kind === 'pipeline-move') {
      if (finished.moved) {
        recordChange(finished.before, `Déplacer ${finished.layerId}`);
        renderProperties();
      }
      return;
    }
    if (finished.kind !== 'pan' && (finished.kind !== 'move' || finished.moved)) {
      housing.updateObject(selectedId, {}, { reason: `editor-${finished.kind}` });
      recordChange(finished.before, finished.kind === 'move' ? 'Déplacer un objet' : finished.kind === 'resize' ? 'Redimensionner un objet' : 'Faire pivoter un objet');
      renderAll();
    }
  }

  stage.addEventListener('pointerdown', event => {
    if (!isOpen || (event.button !== undefined && ![0, 1].includes(event.button))) return;
    contextMenu.hidden = true;
    const element = event.target.closest('.housing-object');
    const panRequested = activeTool === 'hand' || spaceHeld || event.button === 1;
    if (panRequested) {
      beginPan(event);
      event.preventDefault();
      return;
    }
    if (element) {
      const object = housing.getObjects().find(item => item.id === element.dataset.id);
      if (!object) return;
      selectObject(object.id);
      beginObjectMove(event, object);
      event.preventDefault();
    } else if (selectedPipelineId && activeTool === 'move') {
      beginPipelineMove(event);
      event.preventDefault();
    } else {
      selectObject(null);
    }
  }, true);

  stage.addEventListener('pointermove', updateInteraction);
  stage.addEventListener('pointerup', endInteraction);
  stage.addEventListener('pointercancel', endInteraction);
  stage.addEventListener('wheel', event => {
    if (!isOpen) return;
    setZoom(zoom * (event.deltaY > 0 ? .9 : 1.1));
    event.preventDefault();
  }, { passive: false });
  stage.addEventListener('dragover', event => {
    if (event.dataTransfer?.types.includes('application/x-athena-asset')) event.preventDefault();
  });
  stage.addEventListener('drop', event => {
    const typeName = event.dataTransfer?.getData('application/x-athena-asset');
    if (!typeName) return;
    event.preventDefault();
    addAsset(typeName, event.clientX, event.clientY);
  });

  rasterOverlay.addEventListener('pointerdown', event => {
    if (editMode !== 'raster' || !selectedPipelineId || event.button !== 0) return;
    const point = scenePoint(event);
    rasterPointer = point;
    if (activeTool === 'eyedropper') {
      pickColor(point);
      event.preventDefault();
      return;
    }
    if (activeTool === 'clone' && event.altKey) {
      cloneSource = point;
      setStatus(`Source du tampon définie · ${Math.round(point.x)}, ${Math.round(point.y)}`);
      drawRasterOverlay();
      event.preventDefault();
      return;
    }
    if (activeTool === 'lasso') {
      const before = sceneState();
      const first = selectionPoints[0];
      const closesAtFirst = first && selectionPoints.length >= 3 && Math.hypot(first.x - point.x, first.y - point.y) <= 12;
      if (selectionClosed) {
        selectionPoints = [point];
        selectionClosed = false;
      } else if (closesAtFirst || event.detail >= 2) {
        selectionClosed = true;
      } else {
        selectionPoints.push(point);
      }
      recordChange(before, selectionClosed ? 'Fermer le lasso polygonal' : 'Ajouter un point au lasso');
      drawRasterOverlay();
      if (selectionClosed) renderProperties();
      event.preventDefault();
      return;
    }
    if (activeTool === 'marquee') {
      const before = sceneState();
      marqueeStart = { point, before };
      selectionPoints = [point, point, point, point];
      selectionClosed = false;
      rasterOverlay.setPointerCapture?.(event.pointerId);
      event.preventDefault();
      return;
    }
    if (['brush', 'eraser', 'clone'].includes(activeTool)) {
      if (activeTool === 'clone' && !cloneSource) {
        setStatus('Alt + clic pour définir la source du tampon');
        return;
      }
      rasterStroke = {
        pointerId: event.pointerId,
        start: point,
        last: point,
        beforeState: sceneState(),
        frameIndex: activeRasterFrame(selectedPipelineId),
        before: cloneRasterCanvas(selectedPipelineId, rasterTarget, activeRasterFrame(selectedPipelineId)),
        layerId: selectedPipelineId,
        target: rasterTarget
      };
      rasterOverlay.setPointerCapture?.(event.pointerId);
      paintStrokeSegment(point, point);
      event.preventDefault();
    }
  });

  rasterOverlay.addEventListener('pointermove', event => {
    rasterPointer = scenePoint(event);
    if (marqueeStart) {
      const start = marqueeStart.point;
      const point = rasterPointer;
      selectionPoints = [
        start,
        { x: point.x, y: start.y },
        point,
        { x: start.x, y: point.y }
      ];
    }
    if (rasterStroke && event.pointerId === rasterStroke.pointerId) {
      paintStrokeSegment(rasterStroke.last, rasterPointer);
      rasterStroke.last = rasterPointer;
    }
    drawRasterOverlay();
  });

  function finishRasterPointer(event) {
    if (marqueeStart) {
      selectionClosed = true;
      recordChange(marqueeStart.before, 'Créer une sélection rectangulaire');
      marqueeStart = null;
      drawRasterOverlay();
      renderProperties();
    }
    if (rasterStroke && event.pointerId === rasterStroke.pointerId) {
      const stroke = rasterStroke;
      rasterStroke = null;
      recordRasterChange(stroke.before, activeTool === 'eraser' ? `Gommer ${stroke.target}` : activeTool === 'clone' ? 'Tampon de duplication' : `Peindre ${stroke.target}`, stroke.layerId, stroke.target, stroke.beforeState, stroke.frameIndex);
      if (!cloneAligned && activeTool === 'clone') cloneSource = null;
      renderer.render();
      drawRasterOverlay();
    }
  }

  rasterOverlay.addEventListener('pointerup', finishRasterPointer);
  rasterOverlay.addEventListener('pointercancel', finishRasterPointer);
  rasterOverlay.addEventListener('pointerleave', () => {
    if (!rasterStroke && !marqueeStart) {
      rasterPointer = null;
      drawRasterOverlay();
    }
  });

  transformBox.addEventListener('pointerdown', event => {
    const handle = event.target.closest('[data-handle]')?.dataset.handle;
    if (handle) beginTransform(event, handle);
  });
  transformBox.addEventListener('pointermove', updateInteraction);
  transformBox.addEventListener('pointerup', endInteraction);
  transformBox.addEventListener('pointercancel', endInteraction);

  propertiesRoot.addEventListener('focusin', event => {
    if (event.target.matches('[data-prop], [data-adjust], [data-adjust-number], [data-pipeline-transform]')) propertyStartState = sceneState();
  });
  propertiesRoot.addEventListener('pointerdown', event => {
    if (event.target.matches('[data-prop], [data-option], [data-adjust], [data-adjust-number], [data-pipeline-transform], [data-layer-visible]')) propertyStartState = sceneState();
  }, true);
  propertiesRoot.addEventListener('input', event => {
    if (event.target.matches('[data-prop]')) applyProperty(event.target);
    if (event.target.matches('[data-adjust], [data-adjust-number]')) applyAdjustmentInput(event.target);
    if (event.target.matches('[data-pipeline-transform]')) applyPipelineTransform(event.target);
    if (event.target.matches('[data-brush-color]')) {
      brushColor = event.target.value;
      setStatus(`Couleur active ${brushColor.toUpperCase()}`);
    }
    if (event.target.matches('[data-brush]')) {
      const value = Number(event.target.value);
      if (event.target.dataset.brush === 'size') brushSize = Math.max(1, Math.min(300, value || 1));
      if (event.target.dataset.brush === 'hardness') brushHardness = Math.max(0, Math.min(1, value / 100));
      if (event.target.dataset.brush === 'opacity') brushOpacity = Math.max(.01, Math.min(1, value / 100));
      if (event.target.dataset.brush === 'flow') brushFlow = Math.max(.01, Math.min(1, value / 100));
      drawRasterOverlay();
    }
  });
  propertiesRoot.addEventListener('change', event => {
    if (event.target.matches('[data-prop], [data-option]')) commitProperty(event.target);
    if (event.target.matches('[data-adjust], [data-adjust-number]')) commitAdjustmentInput(event.target);
    if (event.target.matches('[data-pipeline-transform]')) commitPipelineTransform(event.target);
    if (event.target.matches('[data-layer-visible]') && selectedPipelineId) {
      runtime.setLayerVisible(selectedPipelineId, event.target.checked);
      recordChange(propertyStartState, 'Changer la visibilité du calque');
      propertyStartState = '';
      renderer.render();
      renderLayers();
    }
  });
  propertiesRoot.addEventListener('focusout', event => {
    if (event.target.matches('[data-prop]') && propertyStartState) commitProperty(event.target);
    if (event.target.matches('[data-adjust], [data-adjust-number]') && propertyStartState) commitAdjustmentInput(event.target);
    if (event.target.matches('[data-pipeline-transform]') && propertyStartState) commitPipelineTransform(event.target);
  });
  propertiesRoot.addEventListener('click', event => {
    const target = event.target.closest('[data-raster-target]')?.dataset.rasterTarget;
    if (target) {
      rasterTarget = target;
      renderProperties();
      setStatus(`Cible active : ${target === 'mask' ? 'Mask' : 'Pixels'}`);
      return;
    }
    const scope = event.target.closest('[data-raster-scope]')?.dataset.rasterScope;
    if (scope) {
      rasterApplyAllFrames = scope === 'all';
      renderProperties();
      drawRasterOverlay();
      setStatus(rasterApplyAllFrames ? 'Retouche appliquée à toutes les frames' : `Retouche limitée à la frame ${renderer.getAnimationInfo(selectedPipelineId)?.frame || 1}`);
      return;
    }
    const command = event.target.closest('[data-command]')?.dataset.command;
    if (command) runCommand(command);
  });

  layerList.addEventListener('click', event => {
    const group = event.target.closest('[data-layer-group]')?.dataset.layerGroup;
    if (group) {
      if (collapsedGroups.has(group)) collapsedGroups.delete(group);
      else collapsedGroups.add(group);
      renderLayers();
      return;
    }
    const pipelineRow = event.target.closest('[data-pipeline-id]');
    if (pipelineRow) {
      selectPipeline(pipelineRow.dataset.pipelineId);
      return;
    }
    const row = event.target.closest('[data-layer-id]');
    if (!row) return;
    const id = row.dataset.layerId;
    const action = event.target.closest('[data-layer-action]')?.dataset.layerAction;
    if (action) {
      const object = housing.getObjects().find(item => item.id === id);
      if (!object) return;
      const before = sceneState();
      housing.updateObject(id, { [action]: !object[action] }, { reason: `editor-${action}` });
      recordChange(before, action === 'visible' ? 'Changer la visibilité' : 'Changer le verrouillage');
      renderAll();
      return;
    }
    selectObject(id);
  });
  layerList.addEventListener('dblclick', event => {
    const row = event.target.closest('[data-layer-id]');
    if (!row) return;
    const object = housing.getObjects().find(item => item.id === row.dataset.layerId);
    if (!object) return;
    const next = window.prompt('Renommer le calque :', object.name)?.trim();
    if (!next || next === object.name) return;
    const before = sceneState();
    housing.updateObject(object.id, { name: next }, { reason: 'editor-rename' });
    recordChange(before, 'Renommer un calque');
    renderAll();
  });
  layerList.addEventListener('contextmenu', event => {
    const row = event.target.closest('[data-layer-id]');
    if (!row) return;
    event.preventDefault();
    selectObject(row.dataset.layerId);
    contextMenu.hidden = false;
    contextMenu.style.left = `${Math.min(event.clientX, window.innerWidth - 180)}px`;
    contextMenu.style.top = `${Math.min(event.clientY, window.innerHeight - 140)}px`;
  });
  layerList.addEventListener('dragstart', event => {
    const row = event.target.closest('[data-layer-id]');
    if (!row) return;
    draggedLayerId = row.dataset.layerId;
    event.dataTransfer.effectAllowed = 'move';
  });
  layerList.addEventListener('dragover', event => {
    const row = event.target.closest('[data-layer-id]');
    if (!row || !draggedLayerId) return;
    event.preventDefault();
    layerList.querySelectorAll('.is-drag-over').forEach(item => item.classList.remove('is-drag-over'));
    row.classList.add('is-drag-over');
  });
  layerList.addEventListener('drop', event => {
    const target = event.target.closest('[data-layer-id]');
    if (!target || !draggedLayerId || target.dataset.layerId === draggedLayerId) return;
    event.preventDefault();
    const before = sceneState();
    const displayIds = housing.getObjects().sort((a, b) => b.order - a.order).map(object => object.id);
    const from = displayIds.indexOf(draggedLayerId);
    const to = displayIds.indexOf(target.dataset.layerId);
    displayIds.splice(to, 0, displayIds.splice(from, 1)[0]);
    housing.reorderObjects(displayIds.reverse(), { reason: 'editor-reorder' });
    recordChange(before, 'Réordonner les calques');
    draggedLayerId = '';
    renderAll();
  });
  layerList.addEventListener('dragend', () => {
    draggedLayerId = '';
    layerList.querySelectorAll('.is-drag-over').forEach(item => item.classList.remove('is-drag-over'));
  });

  assetGrid.addEventListener('click', event => {
    const item = event.target.closest('[data-asset-type]');
    if (item) addAsset(item.dataset.assetType);
  });
  assetGrid.addEventListener('dragstart', event => {
    const item = event.target.closest('[data-asset-type]');
    if (!item) return;
    event.dataTransfer.setData('application/x-athena-asset', item.dataset.assetType);
    event.dataTransfer.effectAllowed = 'copy';
  });

  shell.querySelector('.ase-panel-tabs').addEventListener('click', event => {
    const button = event.target.closest('[data-panel]');
    if (!button) return;
    shell.querySelectorAll('[data-panel]').forEach(item => item.classList.toggle('is-active', item === button));
    shell.querySelectorAll('[data-panel-content]').forEach(panel => panel.classList.toggle('is-active', panel.dataset.panelContent === button.dataset.panel));
  });

  contextMenu.addEventListener('click', event => {
    const command = event.target.closest('[data-context]')?.dataset.context;
    contextMenu.hidden = true;
    if (command) runCommand(command);
  });
  document.addEventListener('pointerdown', event => {
    if (!event.target.closest('#aseContextMenu')) contextMenu.hidden = true;
  });

  function runCommand(command) {
    if (command === 'undo') undo();
    if (command === 'redo') redo();
    if (command === 'zoom-in') setZoom(zoom * 1.12);
    if (command === 'zoom-out') setZoom(zoom / 1.12);
    if (command === 'fit') fitStage();
    if (command === 'save') save();
    if (command === 'close') closeEditor();
    if (command === 'edit-pixels') {
      if (editMode === 'raster') leaveRasterMode();
      else if (enterRasterMode()) setTool('brush');
    }
    if (command === 'reset-state' && selectedPipelineId) {
      const before = sceneState();
      runtime.resetAdjustment(selectedPipelineId, activeTimeState);
      recordChange(before, `Reset LAND_${activeTimeState.toUpperCase()}`);
      renderer.render();
      renderProperties();
    }
    if (command === 'copy-state' && selectedPipelineId) {
      timeStateClipboard = runtime.getAdjustment(selectedPipelineId, activeTimeState);
      renderProperties();
      setStatus(`Réglages LAND_${activeTimeState.toUpperCase()} copiés`);
    }
    if (command === 'paste-state' && selectedPipelineId && timeStateClipboard) {
      const before = sceneState();
      runtime.setAdjustment(selectedPipelineId, activeTimeState, timeStateClipboard);
      recordChange(before, `Coller les réglages dans LAND_${activeTimeState.toUpperCase()}`);
      renderer.render();
      renderProperties();
    }
    if (command === 'reset-transform' && selectedPipelineId) {
      const before = sceneState();
      runtime.resetTransform(selectedPipelineId);
      recordChange(before, `Réinitialiser la transformation de ${selectedPipelineId}`);
      renderer.render();
      renderProperties();
    }
    if (command === 'cut-selection' && selectedPipelineId) deleteRasterSelection(true);
    if (command === 'restore-layer' && selectedPipelineId && window.confirm('Restaurer le calque original, ses pixels, son mask et tous ses réglages temporels ?')) {
      const before = captureLayerEdit(selectedPipelineId);
      runtime.resetTransform(selectedPipelineId);
      runtime.states.forEach(state => runtime.resetAdjustment(selectedPipelineId, state));
      runtime.clearRaster(selectedPipelineId, 'pixels');
      runtime.clearRaster(selectedPipelineId, 'mask');
      for (let frame = 0; frame < runtime.getFrameCount(selectedPipelineId); frame++) {
        runtime.clearRaster(selectedPipelineId, 'pixels', frame);
        runtime.clearRaster(selectedPipelineId, 'mask', frame);
      }
      history.push({ layerEdit: before, label: `Restaurer ${selectedPipelineId}` });
      if (history.length > 30) history.shift();
      future = [];
      setDirty(true);
      refreshUndoButtons();
      renderer.render();
      renderProperties();
    }
    if (command === 'duplicate') duplicateSelected();
    if (command === 'delete') deleteSelected();
    if (command === 'front') moveLayer('front');
    if (command === 'back') moveLayer('back');
    if (command === 'flip-h') flipSelected('horizontal');
    if (command === 'flip-v') flipSelected('vertical');
    if (command === 'snapshot') createSnapshot();
    if (command === 'delete-snapshot') deleteSnapshot();
    if (command === 'export') exportScene();
    if (command === 'import') importInput.click();
    if (command === 'animation-toggle') {
      animationPaused = !animationPaused;
      if (selectedPipelineId) renderer.setAnimationPaused(animationPaused);
      else housing.setAnimationPaused(animationPaused);
      renderTimeline();
      setStatus(animationPaused ? 'Animation en pause' : 'Animation relancée');
    }
    if (command === 'frame-first' && selectedPipelineId) {
      animationPaused = true;
      renderer.firstAnimationFrame(selectedPipelineId);
      renderTimeline();
    }
    if (command === 'frame-prev' && selectedPipelineId) {
      animationPaused = true;
      renderer.stepAnimation(selectedPipelineId, -1);
      renderTimeline();
    }
    if (command === 'frame-next' && selectedPipelineId) {
      animationPaused = true;
      renderer.stepAnimation(selectedPipelineId, 1);
      renderTimeline();
    }
    if (command === 'day-play') {
      renderer.playDayCycle(24);
      setStatus('Cycle complet : 24 heures en 24 secondes');
    }
    if (command === 'day-pause') {
      renderer.pauseDayCycle();
      const minutes = Math.round(renderer.getPreviewHour() * 60) % 1440;
      previewTime.value = String(minutes);
      previewOutput.textContent = formatMinutes(minutes);
      setStatus('Cycle temporel en pause');
    }
    if (command === 'day-restart') {
      renderer.restartDayCycle(24);
      setStatus('Cycle temporel relancé depuis 00:00');
    }
  }

  shell.addEventListener('click', event => {
    const tool = event.target.closest('[data-tool]')?.dataset.tool;
    if (tool) setTool(tool);
    const command = event.target.closest('.ase-topbar [data-command], .ase-toolbar [data-command], .ase-timeline [data-command]')?.dataset.command;
    if (command) runCommand(command);
  });

  shell.querySelector('.ase-timebar').addEventListener('click', event => {
    const state = event.target.closest('[data-time-state]')?.dataset.timeState;
    if (state) setTimeState(state);
  });
  previewTime.addEventListener('input', () => {
    const minutes = Number(previewTime.value);
    previewOutput.textContent = formatMinutes(minutes);
    shell.querySelectorAll('[data-time-state]').forEach(button => button.classList.remove('is-active'));
    renderer.setPreviewHour(minutes / 60);
  });

  zoomReadout.addEventListener('change', () => {
    const value = Number(zoomReadout.value.replace(',', '.').replace('%', '').trim());
    if (Number.isFinite(value)) setZoom(value / 100);
    else applyStageTransform();
  });
  deviceSelect.addEventListener('change', () => {
    device = DEVICES[deviceSelect.value] || DEVICES['390x844'];
    fitStage();
    renderAll();
  });
  snapshotSelect.addEventListener('change', () => {
    shell.querySelector('[data-command="delete-snapshot"]')?.toggleAttribute('disabled', !snapshotSelect.value || snapshotSelect.value === '__original__');
    if (snapshotSelect.value) restoreSnapshot(snapshotSelect.value);
  });
  function applyAnimationControl(input) {
    const property = input.dataset.animation;
    if (!property) return;
    const patch = property === 'loop'
      ? { loop: input.checked }
      : { fps: Math.min(30, Math.max(1, Number(input.value) || 15)) };
    housing.setAnimationSettings?.(patch);
  }

  function commitAnimationControl(input) {
    const property = input.dataset.animation;
    if (!property) return;
    applyAnimationControl(input);
    recordChange(animationStartState, property === 'loop' ? 'Modifier la boucle' : 'Modifier les FPS');
    animationStartState = '';
    renderTimeline();
    setStatus(property === 'loop' ? 'Boucle de l’animation modifiée' : `Aperçu réglé à ${input.value} FPS`);
  }

  timeline.addEventListener('focusin', event => {
    if (event.target.matches('[data-animation]')) animationStartState = sceneState();
  });
  timeline.addEventListener('pointerdown', event => {
    if (event.target.matches('[data-animation]')) animationStartState = sceneState();
  }, true);
  timeline.addEventListener('click', event => {
    const frameButton = event.target.closest('[data-frame-index]');
    if (!frameButton || !selectedPipelineId) return;
    animationPaused = true;
    renderer.setAnimationFrame(selectedPipelineId, Number(frameButton.dataset.frameIndex));
    renderTimeline();
    renderProperties();
    drawRasterOverlay();
    setStatus(`Frame ${Number(frameButton.dataset.frameIndex) + 1} sélectionnée`);
  });
  timeline.addEventListener('input', event => {
    if (event.target.matches('[data-animation]')) applyAnimationControl(event.target);
  });
  timeline.addEventListener('change', event => {
    const property = event.target.dataset.animation;
    if (!property) return;
    commitAnimationControl(event.target);
  });
  timeline.addEventListener('focusout', event => {
    if (event.target.matches('[data-animation]') && animationStartState) commitAnimationControl(event.target);
  });
  importInput.addEventListener('change', () => {
    const [file] = importInput.files;
    if (file) importScene(file);
    importInput.value = '';
  });
  layerSearch.addEventListener('input', renderLayers);
  assetSearch.addEventListener('input', renderAssets);
  window.addEventListener('resize', applyStageTransform);
  window.addEventListener('athena:housing-change', () => {
    if (isOpen && !interaction) renderAll();
  });
  window.addEventListener('keydown', event => {
    if (!isOpen) return;
    const typing = event.target.matches('input, textarea, select, [contenteditable="true"]');
    if (event.code === 'Space' && !typing) {
      spaceHeld = true;
      document.body.classList.add('ase-pan-mode');
      event.preventDefault();
    }
    if (typing) return;
    const key = event.key.toLowerCase();
    if (key === 'v') setTool('move');
    if (key === 'm') setTool('marquee');
    if (key === 'l') setTool('lasso');
    if (key === 'b') setTool('brush');
    if (key === 's' && !(event.ctrlKey || event.metaKey)) setTool('clone');
    if (key === 'e') setTool('eraser');
    if (key === 'i') setTool('eyedropper');
    if (key === 'h') setTool('hand');
    if ((event.ctrlKey || event.metaKey) && key === 's') { event.preventDefault(); save(); }
    if ((event.ctrlKey || event.metaKey) && key === 'z' && !event.shiftKey) { event.preventDefault(); undo(); }
    if (((event.ctrlKey || event.metaKey) && key === 'y') || ((event.ctrlKey || event.metaKey) && event.shiftKey && key === 'z')) { event.preventDefault(); redo(); }
    if ((event.ctrlKey || event.metaKey) && key === 'j') { event.preventDefault(); duplicateSelected(); }
    if ((event.ctrlKey || event.metaKey) && key === 'd' && editMode === 'raster') { event.preventDefault(); clearSelection(); }
    if (event.key === 'Backspace' && editMode === 'raster' && activeTool === 'lasso' && !selectionClosed && selectionPoints.length) {
      const before = sceneState();
      selectionPoints.pop();
      recordChange(before, 'Retirer le dernier point du lasso');
      drawRasterOverlay();
      event.preventDefault();
    } else if ((event.key === 'Delete' || event.key === 'Backspace') && editMode === 'raster' && selectionClosed) {
      event.preventDefault();
      deleteRasterSelection();
    } else if (event.key === 'Delete' || event.key === 'Backspace') { event.preventDefault(); deleteSelected(); }
    if (event.key === '+' || event.key === '=') setZoom(zoom * 1.12);
    if (event.key === '-') setZoom(zoom / 1.12);
    if (event.key === '0') fitStage();
    if (['1', '2', '3', '4'].includes(event.key)) setTimeState(runtime.states[Number(event.key) - 1]);
    if (event.key === 'Escape') {
      if (editMode === 'raster' && selectionPoints.length) clearSelection();
      else if (editMode === 'raster') leaveRasterMode();
      else closeEditor();
    }
    const object = currentObject();
    if (object && !object.locked && ['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) {
      const before = sceneState();
      const pixels = event.shiftKey ? 10 : 1;
      const patch = { freePlacement: true };
      if (event.key === 'ArrowLeft') patch.x = object.x - pixels / device.width;
      if (event.key === 'ArrowRight') patch.x = object.x + pixels / device.width;
      if (event.key === 'ArrowUp') patch.y = object.y - pixels / device.height;
      if (event.key === 'ArrowDown') patch.y = object.y + pixels / device.height;
      housing.updateObject(object.id, patch, { reason: 'editor-nudge' });
      recordChange(before, 'Déplacer au clavier');
      renderAll();
      event.preventDefault();
    }
  });
  window.addEventListener('keyup', event => {
    if (event.code === 'Space') {
      spaceHeld = false;
      document.body.classList.toggle('ase-pan-mode', activeTool === 'hand');
    }
  });

  launcher.addEventListener('click', openEditor);
  refreshUndoButtons();
  window.AthenaSceneEditor = { open: openEditor, close: closeEditor, save, export: exportScene };
  if (editorMode === 'open') openEditor();
})();
