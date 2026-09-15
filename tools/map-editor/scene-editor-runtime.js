(() => {
  if (window.AthenaSceneRuntime) return;

  const WIDTH = 720;
  const HEIGHT = 1280;
  const STORAGE_KEY = 'athena-scene-editor-v2';
  const BACKUP_KEY = 'athena-scene-editor-backups-v2';
  const DATABASE_NAME = 'athena-scene-editor-raster-v2';
  const DATABASE_VERSION = 1;
  const STORE_NAME = 'layers';
  const STATE_IDS = ['sunrise', 'day', 'sunset', 'night'];
  const RASTER_FRAME_COUNTS = Object.freeze({ cascade: 5 });
  const LAYER_DEFINITIONS = [
    { id: 'foreground', name: 'Premier plan / végétation', icon: '▧', kind: 'image', mask: true },
    { id: 'celestials', name: 'Soleil, lune et effets', icon: '☼', kind: 'effect', mask: true },
    { id: 'mount', name: 'Montagnes', icon: '△', kind: 'image', mask: true },
    { id: 'cascade', name: 'Cascade', icon: '≋', kind: 'animation', frames: 5, mask: true },
    { id: 'ocean', name: 'Mer et écume', icon: '≈', kind: 'video', animated: true, mask: true },
    { id: 'sky', name: 'Ciel et nuages', icon: '☁', kind: 'animation', animated: true, mask: true },
    { id: 'base', name: 'Terrain / master temporel', icon: '▣', kind: 'image', mask: true },
    { id: 'camp', name: 'Décor du camp', icon: '⌂', kind: 'objects', mask: false }
  ];
  const DEFAULT_LEVELS = Object.freeze({ black: 0, gamma: 1, white: 255, outputBlack: 0, outputWhite: 255 });
  const DEFAULT_ADJUSTMENT = Object.freeze({ brightness: 0, contrast: 0, saturation: 0, hue: 0, opacity: 100, levels: DEFAULT_LEVELS });
  const DEFAULT_TRANSFORM = Object.freeze({ x: 0, y: 0, scaleX: 1, scaleY: 1, rotation: 0 });

  const canvases = new Map();
  const frameCanvases = new Map();
  const originalCanvases = new Map();
  const beforeCanvas = document.createElement('canvas');
  const afterCanvas = document.createElement('canvas');
  const adjustedCanvas = document.createElement('canvas');
  const baseMaskCanvas = document.createElement('canvas');
  const workingMaskCanvas = document.createElement('canvas');
  const maskedCanvas = document.createElement('canvas');
  [beforeCanvas, afterCanvas, adjustedCanvas, baseMaskCanvas, workingMaskCanvas, maskedCanvas].forEach(canvas => {
    canvas.width = WIDTH;
    canvas.height = HEIGHT;
  });
  const beforeCtx = beforeCanvas.getContext('2d');
  const afterCtx = afterCanvas.getContext('2d');
  const adjustedCtx = adjustedCanvas.getContext('2d');
  const baseMaskCtx = baseMaskCanvas.getContext('2d');
  const workingMaskCtx = workingMaskCanvas.getContext('2d');
  const maskedCtx = maskedCanvas.getContext('2d');

  let databasePromise = null;
  let committedConfig = loadConfig();
  let draftConfig = clone(committedConfig);
  let sessionBaseline = null;
  let sessionActive = false;
  let activeLayerCapture = null;
  let readyResolve;
  const ready = new Promise(resolve => { readyResolve = resolve; });

  function clone(value) {
    return JSON.parse(JSON.stringify(value));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, Number(value)));
  }

  function neutralAdjustment() {
    return clone(DEFAULT_ADJUSTMENT);
  }

  function normalizeAdjustment(value = {}) {
    const levels = value.levels || {};
    return {
      brightness: clamp(value.brightness || 0, -100, 100),
      contrast: clamp(value.contrast || 0, -100, 100),
      saturation: clamp(value.saturation || 0, -100, 100),
      hue: clamp(value.hue || 0, -180, 180),
      opacity: clamp(value.opacity ?? 100, 0, 100),
      levels: {
        black: clamp(levels.black ?? 0, 0, 254),
        gamma: clamp(levels.gamma ?? 1, .1, 9.99),
        white: clamp(levels.white ?? 255, 1, 255),
        outputBlack: clamp(levels.outputBlack ?? 0, 0, 254),
        outputWhite: clamp(levels.outputWhite ?? 255, 1, 255)
      }
    };
  }

  function emptyConfig() {
    const layers = {};
    LAYER_DEFINITIONS.forEach(layer => {
      layers[layer.id] = {
        visible: true,
        adjustments: Object.fromEntries(STATE_IDS.map(state => [state, neutralAdjustment()])),
        maskEnabled: false,
        transform: { ...DEFAULT_TRANSFORM }
      };
    });
    return { schema: 'athena-scene-editor', version: 2, layers };
  }

  function normalizeConfig(value) {
    const normalized = emptyConfig();
    if (!value || typeof value !== 'object') return normalized;
    LAYER_DEFINITIONS.forEach(layer => {
      const source = value.layers?.[layer.id] || {};
      normalized.layers[layer.id].visible = source.visible !== false;
      normalized.layers[layer.id].maskEnabled = Boolean(source.maskEnabled);
      normalized.layers[layer.id].transform = {
        x: clamp(source.transform?.x || 0, -WIDTH * 2, WIDTH * 2),
        y: clamp(source.transform?.y || 0, -HEIGHT * 2, HEIGHT * 2),
        scaleX: clamp(source.transform?.scaleX ?? 1, .01, 10),
        scaleY: clamp(source.transform?.scaleY ?? 1, .01, 10),
        rotation: clamp(source.transform?.rotation || 0, -3600, 3600)
      };
      STATE_IDS.forEach(state => {
        normalized.layers[layer.id].adjustments[state] = normalizeAdjustment(source.adjustments?.[state]);
      });
    });
    return normalized;
  }

  function loadConfig() {
    try {
      return normalizeConfig(JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null'));
    } catch {
      return emptyConfig();
    }
  }

  function layerCanvases(layerId) {
    if (!canvases.has(layerId)) {
      const pixels = document.createElement('canvas');
      const mask = document.createElement('canvas');
      pixels.width = mask.width = WIDTH;
      pixels.height = mask.height = HEIGHT;
      canvases.set(layerId, { pixels, mask });
    }
    return canvases.get(layerId);
  }

  function layerFrameCanvases(layerId, frameIndex, create = true) {
    const count = RASTER_FRAME_COUNTS[layerId] || 0;
    const frame = Number(frameIndex);
    if (!count || !Number.isInteger(frame) || frame < 0 || frame >= count) return null;
    const key = `${layerId}:${frame}`;
    if (!frameCanvases.has(key) && create) {
      const pixels = document.createElement('canvas');
      const mask = document.createElement('canvas');
      pixels.width = mask.width = WIDTH;
      pixels.height = mask.height = HEIGHT;
      frameCanvases.set(key, { pixels, mask });
    }
    return frameCanvases.get(key) || null;
  }

  function rasterCanvas(layerId, target = 'pixels', frameIndex = null) {
    return (frameIndex === null || frameIndex === undefined
      ? layerCanvases(layerId)
      : layerFrameCanvases(layerId, frameIndex))?.[target] || layerCanvases(layerId)[target];
  }

  function rasterEntries() {
    const entries = [];
    LAYER_DEFINITIONS.forEach(layer => {
      ['pixels', 'mask'].forEach(target => entries.push({
        key: `${layer.id}:${target}`,
        storageKey: `committed:${layer.id}:${target}`,
        canvas: layerCanvases(layer.id)[target]
      }));
      const frameCount = RASTER_FRAME_COUNTS[layer.id] || 0;
      for (let frame = 0; frame < frameCount; frame++) {
        ['pixels', 'mask'].forEach(target => entries.push({
          key: `${layer.id}:frame:${frame}:${target}`,
          storageKey: `committed:${layer.id}:frame:${frame}:${target}`,
          canvas: layerFrameCanvases(layer.id, frame)[target]
        }));
      }
    });
    return entries;
  }

  function openDatabase() {
    if (!('indexedDB' in window)) return Promise.resolve(null);
    if (databasePromise) return databasePromise;
    databasePromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DATABASE_NAME, DATABASE_VERSION);
      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) db.createObjectStore(STORE_NAME);
      };
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    }).catch(error => {
      console.warn('Stockage raster IndexedDB indisponible.', error);
      return null;
    });
    return databasePromise;
  }

  async function databaseGet(key) {
    const db = await openDatabase();
    if (!db) return null;
    return new Promise(resolve => {
      const request = db.transaction(STORE_NAME, 'readonly').objectStore(STORE_NAME).get(key);
      request.onsuccess = () => resolve(request.result || null);
      request.onerror = () => resolve(null);
    });
  }

  async function databasePut(key, value) {
    const db = await openDatabase();
    if (!db) return;
    await new Promise((resolve, reject) => {
      const request = db.transaction(STORE_NAME, 'readwrite').objectStore(STORE_NAME).put(value, key);
      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  function canvasToBlob(canvas) {
    return new Promise(resolve => canvas.toBlob(resolve, 'image/png'));
  }

  async function blobToCanvas(blob, canvas) {
    const context = canvas.getContext('2d');
    context.clearRect(0, 0, WIDTH, HEIGHT);
    if (!blob) return;
    const bitmap = await createImageBitmap(blob);
    context.drawImage(bitmap, 0, 0, WIDTH, HEIGHT);
    bitmap.close?.();
  }

  async function loadRaster() {
    await Promise.all(rasterEntries().map(async entry => {
      await blobToCanvas(await databaseGet(entry.storageKey), entry.canvas);
    }));
    readyResolve();
  }

  function snapshotCanvases() {
    const snapshot = new Map();
    rasterEntries().forEach(entry => {
      const copy = document.createElement('canvas');
      copy.width = WIDTH;
      copy.height = HEIGHT;
      copy.getContext('2d').drawImage(entry.canvas, 0, 0);
      copy.__athenaDirty = Boolean(entry.canvas.__athenaDirty);
      snapshot.set(entry.key, copy);
    });
    return snapshot;
  }

  function restoreCanvases(snapshot) {
    if (!snapshot) return;
    rasterEntries().forEach(entry => {
      const source = snapshot.get(entry.key);
      const context = entry.canvas.getContext('2d');
      context.clearRect(0, 0, WIDTH, HEIGHT);
      if (source) context.drawImage(source, 0, 0);
      entry.canvas.__athenaDirty = Boolean(source?.__athenaDirty);
    });
  }

  function getBackups() {
    try {
      const value = JSON.parse(localStorage.getItem(BACKUP_KEY) || '[]');
      return Array.isArray(value) ? value : [];
    } catch {
      return [];
    }
  }

  async function createBackup(label = 'Avant validation') {
    await ready;
    const id = `backup-${Date.now()}`;
    const backups = getBackups();
    backups.unshift({ id, label, createdAt: new Date().toISOString(), config: clone(committedConfig) });
    localStorage.setItem(BACKUP_KEY, JSON.stringify(backups.slice(0, 12)));
    await Promise.all(rasterEntries().map(async entry => {
      const blob = await databaseGet(entry.storageKey);
      if (blob) await databasePut(`${id}:${entry.key}`, blob);
    }));
    return id;
  }

  async function beginSession() {
    await ready;
    if (sessionActive) return;
    committedConfig = loadConfig();
    draftConfig = clone(committedConfig);
    sessionBaseline = { config: clone(committedConfig), canvases: snapshotCanvases() };
    sessionActive = true;
  }

  async function cancelSession() {
    if (!sessionActive) return;
    draftConfig = clone(sessionBaseline.config);
    restoreCanvases(sessionBaseline.canvases);
    sessionBaseline = null;
    sessionActive = false;
  }

  async function commitSession(label = 'Validation éditeur') {
    await ready;
    if (!sessionActive) await beginSession();
    const backupId = await createBackup(label);
    committedConfig = normalizeConfig(draftConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(committedConfig));
    await Promise.all(rasterEntries().map(async entry => {
      const blob = await canvasToBlob(entry.canvas);
      if (blob) await databasePut(entry.storageKey, blob);
    }));
    sessionBaseline = { config: clone(committedConfig), canvases: snapshotCanvases() };
    sessionActive = false;
    return backupId;
  }

  async function restoreBackup(id) {
    const backup = getBackups().find(item => item.id === id);
    if (!backup) return false;
    await createBackup('Avant restauration');
    committedConfig = normalizeConfig(backup.config);
    draftConfig = clone(committedConfig);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(committedConfig));
    await Promise.all(rasterEntries().map(async entry => {
      const blob = await databaseGet(`${id}:${entry.key}`);
      await blobToCanvas(blob, entry.canvas);
      const saved = await canvasToBlob(entry.canvas);
      if (saved) await databasePut(entry.storageKey, saved);
    }));
    refreshDirtyFlags();
    return true;
  }

  async function loadBackupToDraft(id) {
    const backup = getBackups().find(item => item.id === id);
    if (!backup) return false;
    draftConfig = normalizeConfig(backup.config);
    await Promise.all(rasterEntries().map(async entry => {
      const blob = await databaseGet(`${id}:${entry.key}`);
      await blobToCanvas(blob, entry.canvas);
    }));
    refreshDirtyFlags();
    return true;
  }

  function getAdjustment(layerId, stateId) {
    return clone(draftConfig.layers?.[layerId]?.adjustments?.[stateId] || neutralAdjustment());
  }

  function setAdjustment(layerId, stateId, patch) {
    if (!draftConfig.layers?.[layerId] || !STATE_IDS.includes(stateId)) return;
    const current = draftConfig.layers[layerId].adjustments[stateId];
    draftConfig.layers[layerId].adjustments[stateId] = normalizeAdjustment({
      ...current,
      ...patch,
      levels: patch.levels ? { ...current.levels, ...patch.levels } : current.levels
    });
  }

  function resetAdjustment(layerId, stateId) {
    if (draftConfig.layers?.[layerId] && STATE_IDS.includes(stateId)) {
      draftConfig.layers[layerId].adjustments[stateId] = neutralAdjustment();
    }
  }

  function interpolateAdjustment(layerId, blend) {
    const currentId = typeof blend?.current === 'string' ? blend.current : (blend?.current?.mountFrames || 'day');
    const nextId = typeof blend?.next === 'string' ? blend.next : (blend?.next?.mountFrames || currentId);
    const amount = clamp(blend?.easedT || 0, 0, 1);
    const from = getAdjustment(layerId, currentId);
    const to = getAdjustment(layerId, nextId);
    const mix = (a, b) => a + (b - a) * amount;
    return {
      brightness: mix(from.brightness, to.brightness),
      contrast: mix(from.contrast, to.contrast),
      saturation: mix(from.saturation, to.saturation),
      hue: mix(from.hue, to.hue),
      opacity: mix(from.opacity, to.opacity),
      levels: Object.fromEntries(Object.keys(DEFAULT_LEVELS).map(key => [key, mix(from.levels[key], to.levels[key])]))
    };
  }

  function isNeutral(adjustment) {
    const levels = adjustment.levels;
    return Math.abs(adjustment.brightness) < .001
      && Math.abs(adjustment.contrast) < .001
      && Math.abs(adjustment.saturation) < .001
      && Math.abs(adjustment.hue) < .001
      && Math.abs(adjustment.opacity - 100) < .001
      && Math.abs(levels.black) < .001
      && Math.abs(levels.gamma - 1) < .001
      && Math.abs(levels.white - 255) < .001
      && Math.abs(levels.outputBlack) < .001
      && Math.abs(levels.outputWhite - 255) < .001;
  }

  function getTransform(layerId) {
    return clone(draftConfig.layers?.[layerId]?.transform || DEFAULT_TRANSFORM);
  }

  function isNeutralTransform(transform) {
    return Math.abs(transform.x) < .001
      && Math.abs(transform.y) < .001
      && Math.abs(transform.scaleX - 1) < .001
      && Math.abs(transform.scaleY - 1) < .001
      && Math.abs(transform.rotation) < .001;
  }

  function drawTransformed(context, source, transform) {
    context.save();
    context.translate(WIDTH / 2 + transform.x, HEIGHT / 2 + transform.y);
    context.rotate(transform.rotation * Math.PI / 180);
    context.scale(transform.scaleX, transform.scaleY);
    context.drawImage(source, -WIDTH / 2, -HEIGHT / 2);
    context.restore();
  }

  function buildFilter(adjustment) {
    const levels = adjustment.levels;
    const inputSpan = Math.max(1, levels.white - levels.black);
    const outputSpan = Math.max(1, levels.outputWhite - levels.outputBlack);
    const levelContrast = 255 / inputSpan * outputSpan / 255;
    const gammaBrightness = Math.pow(.5, 1 / Math.max(.1, levels.gamma)) / .5;
    const levelBrightness = gammaBrightness * (1 + (levels.outputBlack - levels.black) / 255);
    return `brightness(${Math.max(0, (1 + adjustment.brightness / 100) * levelBrightness)}) contrast(${Math.max(0, (1 + adjustment.contrast / 100) * levelContrast)}) saturate(${Math.max(0, 1 + adjustment.saturation / 100)}) hue-rotate(${adjustment.hue}deg)`;
  }

  function prepareMask(maskSource, layerId, frameIndex = null) {
    baseMaskCtx.globalCompositeOperation = 'source-over';
    baseMaskCtx.globalAlpha = 1;
    baseMaskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    if (maskSource?.source) {
      const { source, sx = 0, sy = 0, sw = source.width, sh = source.height, dx = 0, dy = 0, dw = sw, dh = sh } = maskSource;
      baseMaskCtx.drawImage(source, sx, sy, sw, sh, dx, dy, dw, dh);
    } else if (maskSource) {
      baseMaskCtx.drawImage(maskSource, 0, 0, WIDTH, HEIGHT);
    } else {
      baseMaskCtx.fillStyle = '#fff';
      baseMaskCtx.fillRect(0, 0, WIDTH, HEIGHT);
    }
    workingMaskCtx.globalCompositeOperation = 'source-over';
    workingMaskCtx.globalAlpha = 1;
    workingMaskCtx.clearRect(0, 0, WIDTH, HEIGHT);
    workingMaskCtx.drawImage(baseMaskCanvas, 0, 0);
    const layer = draftConfig.layers[layerId];
    if (layer?.maskEnabled) {
      workingMaskCtx.globalCompositeOperation = 'destination-in';
      workingMaskCtx.drawImage(layerCanvases(layerId).mask, 0, 0);
      workingMaskCtx.globalCompositeOperation = 'source-over';
    }
    const frameMask = layerFrameCanvases(layerId, frameIndex, false)?.mask;
    if (frameMask?.__athenaDirty) {
      workingMaskCtx.globalCompositeOperation = 'destination-in';
      workingMaskCtx.drawImage(frameMask, 0, 0);
      workingMaskCtx.globalCompositeOperation = 'source-over';
    }
  }

  function masked(source, mask, filter = 'none') {
    maskedCtx.globalCompositeOperation = 'source-over';
    maskedCtx.globalAlpha = 1;
    maskedCtx.filter = filter;
    maskedCtx.clearRect(0, 0, WIDTH, HEIGHT);
    maskedCtx.drawImage(source, 0, 0);
    maskedCtx.filter = 'none';
    maskedCtx.globalCompositeOperation = 'destination-in';
    maskedCtx.drawImage(mask, 0, 0);
    maskedCtx.globalCompositeOperation = 'source-over';
    return maskedCanvas;
  }

  function beginLayer(context) {
    if (!context) return false;
    beforeCtx.globalCompositeOperation = 'source-over';
    beforeCtx.globalAlpha = 1;
    beforeCtx.clearRect(0, 0, WIDTH, HEIGHT);
    beforeCtx.drawImage(context.canvas, 0, 0);
    return true;
  }

  function needsLayerProcessing(layerId, frameIndex = null) {
    const layer = draftConfig.layers?.[layerId];
    if (!layer) return false;
    const targets = layerCanvases(layerId);
    const frameTargets = layerFrameCanvases(layerId, frameIndex, false);
    const transform = getTransform(layerId);
    return layer.visible === false
      || layer.maskEnabled
      || Boolean(targets.pixels.__athenaDirty)
      || Boolean(frameTargets?.pixels.__athenaDirty)
      || Boolean(frameTargets?.mask.__athenaDirty)
      || !isNeutralTransform(transform)
      || STATE_IDS.some(state => !isNeutral(getAdjustment(layerId, state)));
  }

  function captureLayer(layerId, context, frameIndex = null) {
    activeLayerCapture = null;
    if (!needsLayerProcessing(layerId, frameIndex)) return false;
    activeLayerCapture = { layerId, frameIndex };
    return beginLayer(context);
  }

  function endLayer(layerId, context, blend, maskSource = null, frameIndex = null) {
    if (activeLayerCapture?.layerId !== layerId) return;
    const capturedFrame = activeLayerCapture.frameIndex;
    activeLayerCapture = null;
    const activeFrame = frameIndex ?? capturedFrame;
    const layer = draftConfig.layers?.[layerId];
    if (!layer) return;
    const targets = layerCanvases(layerId);
    const frameTargets = layerFrameCanvases(layerId, activeFrame, false);
    const adjustment = interpolateAdjustment(layerId, blend);
    const transform = getTransform(layerId);
    const hasPixels = Boolean(targets.pixels.__athenaDirty || frameTargets?.pixels.__athenaDirty);
    const hasFrameMask = Boolean(frameTargets?.mask.__athenaDirty);
    if (layer.visible !== false && isNeutral(adjustment) && !hasPixels && !layer.maskEnabled && !hasFrameMask) return;

    afterCtx.globalCompositeOperation = 'source-over';
    afterCtx.globalAlpha = 1;
    afterCtx.clearRect(0, 0, WIDTH, HEIGHT);
    afterCtx.drawImage(context.canvas, 0, 0);
    prepareMask(maskSource, layerId, activeFrame);

    context.save();
    context.globalAlpha = 1;
    context.globalCompositeOperation = 'destination-out';
    context.drawImage(baseMaskCanvas, 0, 0);
    context.globalCompositeOperation = 'source-over';
    context.drawImage(masked(beforeCanvas, baseMaskCanvas), 0, 0);

    if (layer.visible !== false && adjustment.opacity > .001) {
      adjustedCtx.globalCompositeOperation = 'source-over';
      adjustedCtx.globalAlpha = 1;
      adjustedCtx.filter = buildFilter(adjustment);
      adjustedCtx.clearRect(0, 0, WIDTH, HEIGHT);
      adjustedCtx.drawImage(afterCanvas, 0, 0);
      adjustedCtx.filter = 'none';
      context.globalAlpha = adjustment.opacity / 100;
      drawTransformed(context, masked(adjustedCanvas, workingMaskCanvas), transform);
    }

    if (hasPixels) {
      context.globalAlpha = 1;
      if (targets.pixels.__athenaDirty) drawTransformed(context, masked(targets.pixels, workingMaskCanvas), transform);
      if (frameTargets?.pixels.__athenaDirty) drawTransformed(context, masked(frameTargets.pixels, workingMaskCanvas), transform);
    }
    context.restore();
  }

  function markRasterDirty(layerId, target = 'pixels', frameIndex = null) {
    const canvas = rasterCanvas(layerId, target, frameIndex);
    canvas.__athenaDirty = true;
    if (target === 'mask' && (frameIndex === null || frameIndex === undefined)) draftConfig.layers[layerId].maskEnabled = true;
  }

  function rasterHasContent(canvas) {
    try {
      const data = canvas.getContext('2d').getImageData(0, 0, WIDTH, HEIGHT).data;
      for (let index = 3; index < data.length; index += 4) if (data[index]) return true;
    } catch { return true; }
    return false;
  }

  function refreshDirtyFlags() {
    rasterEntries().forEach(entry => { entry.canvas.__athenaDirty = rasterHasContent(entry.canvas); });
  }

  function exportState() {
    return clone(draftConfig);
  }

  async function exportRasterEdits() {
    await ready;
    const edits = [];
    for (const entry of rasterEntries()) {
      if (!entry.canvas.__athenaDirty || !rasterHasContent(entry.canvas)) continue;
      edits.push({
        key: entry.key,
        width: entry.canvas.width,
        height: entry.canvas.height,
        dataUrl: entry.canvas.toDataURL('image/png')
      });
    }
    return edits;
  }

  function importState(value) {
    draftConfig = normalizeConfig(value);
  }

  loadRaster().then(refreshDirtyFlags);

  window.AthenaSceneRuntime = {
    ready,
    width: WIDTH,
    height: HEIGHT,
    states: STATE_IDS.slice(),
    getLayers: () => LAYER_DEFINITIONS.map(layer => ({ ...layer })),
    beginSession,
    cancelSession,
    commitSession,
    createBackup,
    restoreBackup,
    loadBackupToDraft,
    getBackups,
    getConfig: exportState,
    exportRasterEdits,
    setConfig: importState,
    getAdjustment,
    setAdjustment,
    resetAdjustment,
    getTransform,
    setTransform(layerId, patch = {}) {
      if (!draftConfig.layers[layerId]) return;
      const current = getTransform(layerId);
      draftConfig.layers[layerId].transform = normalizeConfig({ layers: { [layerId]: { transform: { ...current, ...patch } } } }).layers[layerId].transform;
    },
    resetTransform(layerId) {
      if (draftConfig.layers[layerId]) draftConfig.layers[layerId].transform = { ...DEFAULT_TRANSFORM };
    },
    getLayerConfig: layerId => clone(draftConfig.layers[layerId] || null),
    setLayerVisible(layerId, visible) {
      if (draftConfig.layers[layerId]) draftConfig.layers[layerId].visible = Boolean(visible);
    },
    getCanvas: (layerId, target = 'pixels', frameIndex = null) => rasterCanvas(layerId, target, frameIndex),
    markRasterDirty,
    getFrameCount: layerId => RASTER_FRAME_COUNTS[layerId] || 0,
    clearRaster(layerId, target = 'pixels', frameIndex = null) {
      const canvas = rasterCanvas(layerId, target, frameIndex);
      canvas.getContext('2d').clearRect(0, 0, WIDTH, HEIGHT);
      canvas.__athenaDirty = false;
      if (target === 'mask' && (frameIndex === null || frameIndex === undefined)) draftConfig.layers[layerId].maskEnabled = false;
    },
    beginLayer: captureLayer,
    endLayer,
    needsLayerProcessing,
    interpolateAdjustment,
    isNeutral
  };
})();
