(() => {
  const stage = document.querySelector('.stage-shell');
  if (!stage || document.querySelector('#housingLayer')) return;

  const STORAGE_KEY = 'athena-housing-v2';
  const ANIMATION_STORAGE_KEY = 'athena-housing-animation-v1';
  const SCENE_WIDTH = 720;
  const SCENE_HEIGHT = 1280;
  const MIN_Y = .57;
  const MAX_Y = .965;
  const FIRE_CROP = { x: 42, y: 0, width: 306, height: 306 };
  const FIRE_CANVAS_SIZE = 240;
  const FIRE_FRAME_COUNT = 20;

  const TYPES = {
    tent1: { label: 'Tente I', group: 'tent', src: 'assets/housing/tente1.webp', width: 168, bottom: .891, defaultY: .735, aspect: 1 },
    tent2: { label: 'Tente II', group: 'tent', src: 'assets/housing/tente2.webp', width: 168, bottom: .899, defaultY: .735, aspect: 1 },
    tent3: { label: 'Tente III', group: 'tent', src: 'assets/housing/tente3.webp', width: 168, bottom: .906, defaultY: .735, aspect: 1 },
    tent4: { label: 'Tente IV', group: 'tent', src: 'assets/housing/tente4.webp', width: 168, bottom: .922, defaultY: .735, aspect: 1 },
    kiosk: { label: 'Kiosque', group: 'kiosk', src: 'assets/housing/kiosque.webp', width: 150, bottom: .962, defaultY: .90, aspect: 4 / 3 },
    altar: { label: 'Autel d’Athéna', group: 'altar', src: 'assets/housing/autel_athena.webp', width: 220, bottom: .97, defaultY: .735, aspect: 1 },
    fire: { label: 'Feu de camp', group: 'fire', src: 'assets/housing/feu-preview-v2.webp', animationSrc: 'assets/housing/FEU_ANIME_TRANSPARENT_X4.gif', width: 104, bottom: .95, defaultY: .79, animated: true, luminous: true, projectsGround: true, lightDiameter: 520, lightOffsetY: -.55, glowOffsetY: -.38, glowScale: .72, lightStrength: 1 },
    torch: { label: 'Flambeau', group: 'torch', src: 'assets/housing/flambeau-preview.webp', animationSrc: 'assets/housing/flambeau-anime-x2.gif', width: 115, bottom: .967, defaultY: .80, aspect: 1, animated: true, luminous: true, projectsGround: false, lightDiameter: 260, lightOffsetY: -.86, glowScale: .9, lightStrength: .72 },
    fountain: { label: 'Fontaine', group: 'fountain', src: 'assets/housing/fontaine-preview.webp', animationSrc: 'assets/housing/fontaine-anime.gif', width: 136, bottom: .949, defaultY: .82, aspect: 1, animated: true },
    shrub: { label: 'Olivier', group: 'shrub', src: 'assets/housing/arbuste.webp', width: 92, bottom: .967, defaultY: .82, aspect: 1 },
    weapons: { label: 'Râtelier d’armes', group: 'weapons', src: 'assets/housing/armes.webp', width: 112, bottom: .959, defaultY: .84, aspect: 1 },
    flowers: { label: 'Lopin fleuri', group: 'flowers', src: 'assets/housing/lopin-fleurs.webp', width: 132, bottom: .969, defaultY: .88, aspect: 1 },
    table: { label: 'Table', group: 'table', src: 'assets/housing/table.webp', width: 112, bottom: .925, defaultY: .87, aspect: 1 }
  };

  const DEFAULT_OBJECTS = [
    { id: 'tent-main', type: 'tent1', x: .27, y: .735, flip: false },
    { id: 'fire-main', type: 'fire', x: .50, y: .79, flip: false },
    { id: 'altar-main', type: 'altar', x: .73, y: .735, flip: false },
    { id: 'kiosk-main', type: 'kiosk', x: .73, y: .90, flip: false }
  ];

  const layer = document.createElement('section');
  layer.className = 'housing-layer';
  layer.id = 'housingLayer';
  layer.setAttribute('aria-label', 'Décor personnalisable du camp');
  layer.innerHTML = '<div class="housing-ground-guide" aria-hidden="true"></div><div class="housing-lights" id="housingLights" aria-hidden="true"></div><div class="housing-objects" id="housingObjects"></div>';

  const openButton = document.createElement('button');
  openButton.className = 'housing-open';
  openButton.id = 'housingOpen';
  openButton.type = 'button';
  openButton.setAttribute('aria-label', 'Aménager le camp');
  openButton.innerHTML = '<svg aria-hidden="true" viewBox="0 0 32 32"><path d="M4 25 16 7l12 18M8 25h16M11 25V15m10 10V15M16 7V3m0 0 5 2-5 2"/></svg>';

  const editor = document.createElement('section');
  editor.className = 'housing-interface';
  editor.id = 'housingInterface';
  editor.hidden = true;
  editor.setAttribute('aria-label', 'Mode aménagement du camp');
  editor.innerHTML = `
    <header class="housing-editor-head">
      <button class="housing-round-action" id="housingCancel" type="button" aria-label="Annuler les changements">×</button>
      <div class="housing-editor-title"><strong>Aménager le camp</strong><small>Fais glisser les objets dans la clairière</small></div>
      <button class="housing-round-action primary" id="housingDone" type="button" aria-label="Enregistrer l’aménagement">✓</button>
    </header>
    <footer class="housing-editor-tools">
      <div class="housing-tools-line">
        <div class="housing-status"><strong id="housingStatus">Choisis un objet</strong><small id="housingDepth">Disposition sauvegardée sur cet appareil</small></div>
        <button class="housing-tool-action" id="housingReset" type="button" aria-label="Rétablir la disposition d’origine">↺</button>
        <button class="housing-tool-action" id="housingFlip" type="button" aria-label="Retourner l’objet" disabled>⇄</button>
        <button class="housing-tool-action" id="housingDuplicate" type="button" aria-label="Dupliquer l’objet" disabled>⧉</button>
        <button class="housing-tool-action danger" id="housingRemove" type="button" aria-label="Retirer l’objet" disabled>×</button>
      </div>
      <div class="housing-catalogue" id="housingCatalogue" aria-label="Objets du camp"></div>
    </footer>
    <div class="housing-toast" id="housingToast" role="status" aria-live="polite"></div>`;

  stage.append(layer);
  document.body.append(openButton, editor);

  const objectsRoot = layer.querySelector('#housingObjects');
  const lightsRoot = layer.querySelector('#housingLights');
  const catalogue = editor.querySelector('#housingCatalogue');
  const status = editor.querySelector('#housingStatus');
  const depthLabel = editor.querySelector('#housingDepth');
  const flipButton = editor.querySelector('#housingFlip');
  const duplicateButton = editor.querySelector('#housingDuplicate');
  const removeButton = editor.querySelector('#housingRemove');
  const resetButton = editor.querySelector('#housingReset');
  const doneButton = editor.querySelector('#housingDone');
  const cancelButton = editor.querySelector('#housingCancel');
  const toastElement = editor.querySelector('#housingToast');
  const todayDrawer = document.querySelector('#todayDrawer');
  const journalOpen = document.querySelector('#journalOpen');

  let objects = loadObjects();
  let animationSettings = loadAnimationSettings();
  let selectedId = null;
  let editing = false;
  let externalEditing = false;
  let animationPaused = false;
  let animationStartedAt = performance.now();
  let drag = null;
  let editorSnapshot = '';
  let hiddenBeforeEdit = null;
  let toastTimer = 0;
  let lastVisualSignature = '';
  let currentVisual = {
    brightness: .86, saturation: .82, shadeOpacity: .1,
    lightOpacity: .035, glow: .28, dayReveal: .12
  };

  let fireCanvases = [];
  let fireFrameRequest = 0;
  let lastFirePaint = 0;
  let fireCanProcess = true;
  const fireSource = new Image();
  fireSource.className = 'housing-fire-source';
  fireSource.alt = '';
  fireSource.setAttribute('aria-hidden', 'true');
  const fireSourceCanvas = document.createElement('canvas');
  fireSourceCanvas.width = FIRE_CANVAS_SIZE;
  fireSourceCanvas.height = FIRE_CANVAS_SIZE;
  const fireSourceContext = fireSourceCanvas.getContext('2d', { willReadFrequently: true });
  fireSource.src = 'assets/housing/FEU_ANIME_TRANSPARENT_X4.gif';
  document.body.append(fireSource);

  function cloneDefaults() {
    return normalizeCollection(DEFAULT_OBJECTS);
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function horizontalMargin(y) {
    const progress = clamp((y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1);
    const eased = progress * progress * (3 - 2 * progress);
    return .085 - eased * .07;
  }

  function constrainPosition(object) {
    if (object.freePlacement) {
      object.y = clamp(Number(object.y) || .5, .02, .99);
      object.x = clamp(Number(object.x) || .5, .02, .98);
      object.flip = Boolean(object.flip);
      object.flipY = Boolean(object.flipY);
      return object;
    }
    object.y = clamp(Number(object.y) || TYPES[object.type].defaultY, MIN_Y, MAX_Y);
    const margin = horizontalMargin(object.y);
    object.x = clamp(Number(object.x) || .5, margin, 1 - margin);
    object.flip = Boolean(object.flip);
    object.flipY = Boolean(object.flipY);
    return object;
  }

  function normalizeObject(object, index = 0) {
    const type = TYPES[object.type];
    const normalized = constrainPosition({
      id: String(object.id || `housing-${Date.now()}-${index}`),
      type: object.type,
      name: String(object.name || type.label),
      x: object.x,
      y: object.y,
      flip: object.flip,
      flipY: object.flipY,
      freePlacement: Boolean(object.freePlacement),
      scaleX: clamp(Number(object.scaleX) || 1, .2, 4),
      scaleY: clamp(Number(object.scaleY) || 1, .2, 4),
      rotation: Number.isFinite(Number(object.rotation)) ? Number(object.rotation) : 0,
      opacity: clamp(Number.isFinite(Number(object.opacity)) ? Number(object.opacity) : 1, 0, 1),
      visible: object.visible !== false,
      locked: Boolean(object.locked),
      order: Number.isFinite(Number(object.order)) ? Number(object.order) : index
    });
    return normalized;
  }

  function normalizeCollection(source) {
    const hasExplicitOrder = source.length > 0 && source.every(object => Number.isFinite(Number(object?.order)));
    const normalized = source.map((object, index) => normalizeObject(object, index));
    normalized.sort(hasExplicitOrder ? (a, b) => a.order - b.order : (a, b) => a.y - b.y);
    normalized.forEach((object, index) => { object.order = index; });
    return normalized;
  }

  function loadObjects() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!Array.isArray(parsed)) return cloneDefaults();
      return normalizeCollection(parsed.filter(object => object && TYPES[object.type]));
    } catch {
      return cloneDefaults();
    }
  }

  function loadAnimationSettings() {
    try {
      const parsed = JSON.parse(localStorage.getItem(ANIMATION_STORAGE_KEY) || 'null');
      return {
        fps: clamp(Number(parsed?.fps) || 15, 1, 30),
        loop: parsed?.loop !== false
      };
    } catch {
      return { fps: 15, loop: true };
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objects));
    localStorage.setItem(ANIMATION_STORAGE_KEY, JSON.stringify(animationSettings));
    window.dispatchEvent(new CustomEvent('athena:housing-saved', { detail: { objects: getObjects() } }));
  }

  function getObjects() {
    return objects.map(object => ({ ...object }));
  }

  function emitChange(reason = 'update') {
    window.dispatchEvent(new CustomEvent('athena:housing-change', { detail: { reason, objects: getObjects() } }));
  }

  function depthAt(y) {
    return .58 + clamp((y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1) * .52;
  }

  function displayWidth(object) {
    const type = TYPES[object.type];
    return type.width * depthAt(object.y) / depthAt(type.defaultY);
  }

  function setObjectStyle(element, object) {
    const type = TYPES[object.type];
    const widthPercent = displayWidth(object) / SCENE_WIDTH * 100;
    element.style.setProperty('--housing-x', `${object.x * 100}%`);
    element.style.setProperty('--housing-y', `${object.y * 100}%`);
    element.style.setProperty('--housing-width', `${widthPercent}%`);
    element.style.setProperty('--housing-glow-width', `${widthPercent * 2.55}%`);
    element.style.setProperty('--housing-bottom-offset', `${-type.bottom * 100}%`);
    element.style.setProperty('--housing-flip', object.flip ? '-1' : '1');
    element.style.setProperty('--housing-scale-x', String((object.flip ? -1 : 1) * object.scaleX));
    element.style.setProperty('--housing-scale-y', String((object.flipY ? -1 : 1) * object.scaleY));
    element.style.setProperty('--housing-rotation', `${object.rotation}deg`);
    element.style.setProperty('--housing-art-aspect', String(type.aspect || 1));
    if (type.luminous) {
      const glowScale = type.glowScale || .9;
      element.style.setProperty('--housing-flame-glow-size', `${glowScale * 100}%`);
      element.style.setProperty('--housing-flame-shift', `${(type.glowOffsetY ?? type.lightOffsetY) / glowScale * 100}%`);
    }
    if (type.src) element.style.setProperty('--housing-mask-image', `url("${type.src}")`);
    element.style.opacity = String(object.opacity);
    element.hidden = !object.visible;
    element.disabled = object.locked && (editing || externalEditing);
    element.setAttribute('aria-disabled', String(object.locked));
    element.style.zIndex = String(20 + Math.round(object.order * 10));
  }

  function appendAmbientGrade(element) {
    const shade = document.createElement('span');
    shade.className = 'housing-object-grade housing-object-grade--shade';
    shade.setAttribute('aria-hidden', 'true');
    const light = document.createElement('span');
    light.className = 'housing-object-grade housing-object-grade--light';
    light.setAttribute('aria-hidden', 'true');
    element.append(shade, light);
  }

  function createObjectElement(object) {
    const type = TYPES[object.type];
    const element = document.createElement('button');
    element.className = 'housing-object';
    element.type = 'button';
    element.dataset.id = object.id;
    element.dataset.type = type.group;
    element.setAttribute('aria-label', `${type.label}, déplacer dans le camp`);
    if (type.animated) {
      if (type.luminous) {
        const glow = document.createElement('span');
        glow.className = `housing-flame-glow housing-flame-glow--${type.group}`;
        glow.setAttribute('aria-hidden', 'true');
        element.append(glow);
      }
      const image = document.createElement('img');
      image.className = `housing-object-art housing-animated-art${type.luminous ? ' housing-luminous-animation' : ''}${type.group === 'fire' ? ' housing-fire-animation' : ''}`;
      image.src = type.animationSrc;
      image.alt = '';
      image.draggable = false;
      element.append(image);
      if (!type.luminous) appendAmbientGrade(element);
    } else {
      const image = document.createElement('img');
      image.className = 'housing-object-art';
      image.src = type.src;
      image.alt = '';
      image.draggable = false;
      element.append(image);
      appendAmbientGrade(element);
    }
    setObjectStyle(element, object);
    return element;
  }

  function lightMetrics(object) {
    const type = TYPES[object.type];
    const depthScale = depthAt(object.y) / depthAt(type.defaultY);
    const scaleX = Math.abs(Number(object.scaleX) || 1);
    const scaleY = Math.abs(Number(object.scaleY) || 1);
    const objectWidth = displayWidth(object);
    return {
      x: object.x,
      flameY: object.y + type.lightOffsetY * objectWidth * scaleY / SCENE_HEIGHT,
      groundY: object.y - (type.group === 'torch' ? .006 : 0),
      diameter: type.lightDiameter * depthScale * Math.max(scaleX, scaleY),
      radius: type.lightDiameter * depthScale * Math.max(scaleX, scaleY) / 2,
      groundRadiusY: type.lightDiameter * depthScale * Math.max(scaleX, scaleY) * .18,
      strength: type.lightStrength
    };
  }

  function appendObjectDaylight(element, object, source, sourceIndex) {
    const type = TYPES[object.type];
    const metrics = lightMetrics(source);
    const scaleX = Math.abs(Number(object.scaleX) || 1);
    const scaleY = Math.abs(Number(object.scaleY) || 1);
    const targetWidth = displayWidth(object) * scaleX;
    const targetHeight = displayWidth(object) * scaleY / (type.aspect || 1);
    const left = object.x * SCENE_WIDTH - targetWidth / 2;
    const top = object.y * SCENE_HEIGHT - type.bottom * targetHeight;
    const closestX = clamp(metrics.x * SCENE_WIDTH, left, left + targetWidth);
    const closestY = clamp(metrics.flameY * SCENE_HEIGHT, top, top + targetHeight);
    const selector = `.housing-object-daylight[data-source-id="${CSS.escape(source.id)}"]`;
    let daylight = element.querySelector(selector);
    if (Math.hypot(closestX - metrics.x * SCENE_WIDTH, closestY - metrics.flameY * SCENE_HEIGHT) >= metrics.radius) {
      daylight?.remove();
      return;
    }

    if (!daylight) {
      daylight = document.createElement('img');
      daylight.className = 'housing-object-art housing-object-daylight';
      daylight.dataset.sourceId = source.id;
      daylight.src = type.animationSrc || type.src;
      daylight.alt = '';
      daylight.draggable = false;
      daylight.setAttribute('aria-hidden', 'true');
      element.append(daylight);
    }
    let localX = (metrics.x * SCENE_WIDTH - left) / targetWidth * 100;
    let localY = (metrics.flameY * SCENE_HEIGHT - top) / targetHeight * 100;
    if (object.flip) localX = 100 - localX;
    if (object.flipY) localY = 100 - localY;
    daylight.style.setProperty('--housing-daylight-x', `${localX}%`);
    daylight.style.setProperty('--housing-daylight-y', `${localY}%`);
    daylight.style.setProperty('--housing-daylight-rx', `${metrics.radius / targetWidth * 100}%`);
    daylight.style.setProperty('--housing-daylight-ry', `${metrics.radius / targetHeight * 100}%`);
    const opacity = clamp(currentVisual.dayReveal * metrics.strength, 0, .84);
    daylight.style.setProperty('--housing-daylight-opacity', opacity.toFixed(3));
    daylight.style.setProperty('--housing-daylight-opacity-soft', (opacity * .9).toFixed(3));
    daylight.style.animationDelay = `${-(sourceIndex * .17) % 1.4}s`;
  }

  function updateLighting() {
    const sources = objects.filter(object => TYPES[object.type].luminous && object.visible !== false);
    const sourceIds = new Set(sources.map(source => source.id));
    const groundSources = sources.filter(source => TYPES[source.type].projectsGround !== false);
    const groundSourceIds = new Set(groundSources.map(source => source.id));
    lightsRoot.querySelectorAll('.housing-light-source').forEach(light => {
      if (!groundSourceIds.has(light.dataset.sourceId)) light.remove();
    });
    groundSources.forEach((object, index) => {
      const type = TYPES[object.type];
      const metrics = lightMetrics(object);
      const opacity = clamp(currentVisual.dayReveal * metrics.strength, 0, .82);
      let light = lightsRoot.querySelector(`[data-source-id="${CSS.escape(object.id)}"]`);
      if (!light) {
        light = document.createElement('span');
        light.dataset.sourceId = object.id;
        lightsRoot.append(light);
      }
      light.className = `housing-light-source housing-light-source--${type.group}`;
      light.style.setProperty('--housing-light-x', `${metrics.x * 100}%`);
      light.style.setProperty('--housing-light-y', `${metrics.groundY * 100}%`);
      light.style.setProperty('--housing-light-rx', `${metrics.radius / SCENE_WIDTH * 100}%`);
      light.style.setProperty('--housing-light-ry', `${metrics.groundRadiusY / SCENE_HEIGHT * 100}%`);
      light.style.setProperty('--housing-source-opacity', opacity.toFixed(3));
      light.style.setProperty('--housing-source-opacity-soft', (opacity * .88).toFixed(3));
      light.style.animationDelay = `${-(index * .19) % 1.7}s`;
    });

    objects.forEach(object => {
      const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
      if (!element) return;
      element.querySelectorAll('.housing-object-daylight').forEach(daylight => {
        if (!sourceIds.has(daylight.dataset.sourceId)) daylight.remove();
      });
      sources.forEach((source, sourceIndex) => appendObjectDaylight(element, object, source, sourceIndex));
    });
  }

  function renderObjects() {
    objectsRoot.replaceChildren(...objects
      .slice()
      .sort((a, b) => a.order - b.order || a.y - b.y)
      .map(createObjectElement));
    updateLighting();
    fireCanvases = [...objectsRoot.querySelectorAll('.housing-fire-canvas')];
    refreshSelection();
    ensureFireAnimation();
  }

  function selectedObject() {
    return objects.find(object => object.id === selectedId) || null;
  }

  function countGroup(group) {
    return objects.filter(object => TYPES[object.type].group === group).length;
  }

  function refreshSelection() {
    const selected = selectedObject();
    objectsRoot.querySelectorAll('.housing-object').forEach(element => {
      element.classList.toggle('is-selected', (editing || externalEditing) && element.dataset.id === selectedId);
      element.tabIndex = editing || externalEditing ? 0 : -1;
    });
    status.textContent = selected ? TYPES[selected.type].label : 'Choisis un objet';
    depthLabel.textContent = selected
      ? `Profondeur ${Math.round(depthAt(selected.y) * 100)} % · fais-le glisser`
      : 'Disposition sauvegardée sur cet appareil';
    const selectedGroup = selected ? TYPES[selected.type].group : '';
    flipButton.disabled = !selected || selectedGroup === 'fire';
    duplicateButton.disabled = !selected || selectedGroup === 'tent' || countGroup(selectedGroup) >= 4;
    removeButton.disabled = !selected;
    catalogue.querySelectorAll('[data-type]').forEach(button => {
      const type = TYPES[button.dataset.type];
      const exactSelected = selected?.type === button.dataset.type;
      const placed = type.group === 'tent'
        ? objects.some(object => object.type === button.dataset.type)
        : countGroup(type.group) > 0;
      button.classList.toggle('is-active', exactSelected);
      button.classList.toggle('is-placed', placed);
      button.setAttribute('aria-pressed', String(exactSelected));
    });
  }

  function select(id, focus = false) {
    selectedId = objects.some(object => object.id === id) ? id : null;
    refreshSelection();
    if (focus && selectedId) objectsRoot.querySelector(`[data-id="${CSS.escape(selectedId)}"]`)?.focus({ preventScroll: true });
  }

  function updateObject(id, patch, options = {}) {
    const object = objects.find(candidate => candidate.id === id);
    if (!object) return null;
    Object.assign(object, patch);
    const normalized = normalizeObject(object, objects.indexOf(object));
    Object.assign(object, normalized);
    const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
    if (element) setObjectStyle(element, object);
    updateLighting();
    if (!options.silent) {
      refreshSelection();
      emitChange(options.reason || 'update');
    }
    if (options.save) persist();
    return { ...object };
  }

  function addObject(typeName, properties = {}, options = {}) {
    const type = TYPES[typeName];
    if (!type) return null;
    const position = suggestedPosition(type.group);
    const object = normalizeObject({
      id: uniqueId(type.group),
      type: typeName,
      ...position,
      flip: false,
      order: objects.length,
      ...properties
    }, objects.length);
    objects.push(object);
    renderObjects();
    select(object.id);
    emitChange(options.reason || 'add');
    if (options.save) persist();
    return { ...object };
  }

  function removeObject(id, options = {}) {
    const previousLength = objects.length;
    objects = objects.filter(object => object.id !== id);
    if (objects.length === previousLength) return false;
    objects.forEach((object, index) => { object.order = index; });
    if (selectedId === id) selectedId = null;
    renderObjects();
    emitChange(options.reason || 'remove');
    if (options.save) persist();
    return true;
  }

  function duplicateObject(id, options = {}) {
    const source = objects.find(object => object.id === id);
    if (!source) return null;
    return addObject(source.type, {
      ...source,
      id: undefined,
      name: `${source.name} copie`,
      x: source.x + .035,
      y: source.y + .02,
      order: objects.length
    }, { ...options, reason: options.reason || 'duplicate' });
  }

  function replaceObjects(nextObjects, options = {}) {
    if (!Array.isArray(nextObjects)) return false;
    objects = normalizeCollection(nextObjects.filter(object => object && TYPES[object.type]));
    selectedId = objects.some(object => object.id === selectedId) ? selectedId : null;
    renderObjects();
    emitChange(options.reason || 'replace');
    if (options.save) persist();
    return true;
  }

  function reorderObjects(orderedIds, options = {}) {
    if (!Array.isArray(orderedIds)) return false;
    const positions = new Map(orderedIds.map((id, index) => [id, index]));
    objects.sort((a, b) => (positions.get(a.id) ?? Number.MAX_SAFE_INTEGER) - (positions.get(b.id) ?? Number.MAX_SAFE_INTEGER));
    objects.forEach((object, index) => { object.order = index; });
    renderObjects();
    emitChange(options.reason || 'reorder');
    if (options.save) persist();
    return true;
  }

  function suggestedPosition(group) {
    const amount = countGroup(group);
    const y = clamp(.81 + amount * .035, .69, .91);
    const margin = horizontalMargin(y);
    return { x: clamp(.44 + amount * .09, margin, 1 - margin), y };
  }

  function uniqueId(group) {
    return `${group}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
  }

  function addOrSelect(typeName) {
    const type = TYPES[typeName];
    if (!type) return;
    const existingGroup = objects.find(object => TYPES[object.type].group === type.group);
    if (type.group === 'tent' && existingGroup) {
      existingGroup.type = typeName;
      renderObjects();
      select(existingGroup.id, true);
      showToast(`${type.label} installée.`);
      return;
    }
    const position = suggestedPosition(type.group);
    const object = normalizeObject({ id: uniqueId(type.group), type: typeName, ...position, flip: false, order: objects.length }, objects.length);
    objects.push(object);
    renderObjects();
    select(object.id, true);
    emitChange('add');
    showToast(`${type.label} ajouté au camp.`);
  }

  function duplicateSelected() {
    const source = selectedObject();
    if (!source || TYPES[source.type].group === 'tent') return;
    const copy = normalizeObject({
      ...source,
      id: uniqueId(TYPES[source.type].group),
      x: source.x + .07,
      y: source.y + .03,
      order: objects.length
    }, objects.length);
    objects.push(copy);
    renderObjects();
    select(copy.id, true);
    emitChange('duplicate');
    showToast('Objet dupliqué.');
  }

  function removeSelected() {
    if (!selectedId) return;
    objects = objects.filter(object => object.id !== selectedId);
    objects.forEach((object, index) => { object.order = index; });
    selectedId = null;
    renderObjects();
    emitChange('remove');
    showToast('Objet retiré. Tu peux le reprendre dans le catalogue.');
  }

  function showToast(message) {
    clearTimeout(toastTimer);
    toastElement.textContent = message;
    toastElement.classList.add('is-visible');
    toastTimer = setTimeout(() => toastElement.classList.remove('is-visible'), 1900);
  }

  function renderCatalogue() {
    catalogue.replaceChildren(...Object.entries(TYPES).map(([name, type]) => {
      const button = document.createElement('button');
      button.className = 'housing-catalogue-item';
      button.type = 'button';
      button.dataset.type = name;
      button.setAttribute('aria-pressed', 'false');
      const image = document.createElement('img');
      image.src = type.src;
      image.alt = '';
      const label = document.createElement('span');
      label.textContent = type.label;
      button.append(image, label);
      button.addEventListener('click', () => addOrSelect(name));
      return button;
    }));
  }

  function rememberHiddenState(element) {
    return element ? element.hidden : null;
  }

  function openEditor() {
    if (editing) return;
    const journal = document.querySelector('#journalDialog');
    if (journal?.open) return;
    editorSnapshot = JSON.stringify(objects);
    hiddenBeforeEdit = {
      drawer: rememberHiddenState(todayDrawer),
      journal: rememberHiddenState(journalOpen)
    };
    if (todayDrawer) todayDrawer.hidden = true;
    if (journalOpen) journalOpen.hidden = true;
    openButton.hidden = true;
    editor.hidden = false;
    editing = true;
    layer.classList.add('is-editing');
    select(objects[0]?.id || null);
    requestAnimationFrame(() => doneButton.focus({ preventScroll: true }));
  }

  function closeEditor(saveChanges) {
    if (!editing) return;
    if (!saveChanges) {
      try { objects = normalizeCollection(JSON.parse(editorSnapshot)); } catch { objects = cloneDefaults(); }
    } else {
      persist();
    }
    drag = null;
    selectedId = null;
    editing = false;
    layer.classList.remove('is-editing');
    editor.hidden = true;
    openButton.hidden = false;
    if (todayDrawer && hiddenBeforeEdit?.drawer !== null) todayDrawer.hidden = hiddenBeforeEdit.drawer;
    if (journalOpen && hiddenBeforeEdit?.journal !== null) journalOpen.hidden = hiddenBeforeEdit.journal;
    hiddenBeforeEdit = null;
    renderObjects();
    openButton.focus({ preventScroll: true });
  }

  function resetLayout() {
    if (!window.confirm('Rétablir la disposition du modèle pour tout le camp ?')) return;
    objects = cloneDefaults();
    selectedId = null;
    renderObjects();
    emitChange('reset');
    showToast('Disposition d’origine restaurée.');
  }

  function updateDraggedObject(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const bounds = layer.getBoundingClientRect();
    const object = objects.find(candidate => candidate.id === drag.id);
    if (!object || !bounds.width || !bounds.height) return;
    if (object.locked) return;
    object.y = clamp((event.clientY - bounds.top) / bounds.height, MIN_Y, MAX_Y);
    const margin = horizontalMargin(object.y);
    object.x = clamp((event.clientX - bounds.left) / bounds.width - drag.offsetX, margin, 1 - margin);
    const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
    if (element) setObjectStyle(element, object);
    updateLighting();
    depthLabel.textContent = `Profondeur ${Math.round(depthAt(object.y) * 100)} % · fais-le glisser`;
    event.preventDefault();
  }

  layer.addEventListener('pointerdown', event => {
    if (!editing || (event.button !== undefined && event.button !== 0)) return;
    const element = event.target.closest('.housing-object');
    if (!element) {
      select(null);
      return;
    }
    const object = objects.find(candidate => candidate.id === element.dataset.id);
    if (!object) return;
    if (object.locked) return;
    const bounds = layer.getBoundingClientRect();
    select(object.id);
    drag = {
      id: object.id,
      pointerId: event.pointerId,
      offsetX: (event.clientX - bounds.left) / bounds.width - object.x,
      moved: false,
      startX: event.clientX,
      startY: event.clientY
    };
    layer.setPointerCapture?.(event.pointerId);
    event.preventDefault();
  });

  layer.addEventListener('pointermove', event => {
    if (drag) drag.moved ||= Math.hypot(event.clientX - drag.startX, event.clientY - drag.startY) > 5;
    updateDraggedObject(event);
  });

  function endDrag(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    layer.releasePointerCapture?.(event.pointerId);
    drag = null;
    const sorted = objects.slice().sort((a, b) => a.y - b.y);
    sorted.forEach((object, index) => { object.order = index; });
    objects = sorted;
    sorted.forEach(object => objectsRoot.append(objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`)));
    emitChange('move');
  }

  layer.addEventListener('pointerup', endDrag);
  layer.addEventListener('pointercancel', endDrag);

  window.addEventListener('keydown', event => {
    if (!editing) return;
    if (event.key === 'Escape') {
      event.preventDefault();
      closeEditor(false);
      return;
    }
    const object = selectedObject();
    if (!object || object.locked || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const step = event.shiftKey ? .012 : .004;
    if (event.key === 'ArrowLeft') object.x -= step;
    if (event.key === 'ArrowRight') object.x += step;
    if (event.key === 'ArrowUp') object.y -= step;
    if (event.key === 'ArrowDown') object.y += step;
    constrainPosition(object);
    const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
    if (element) setObjectStyle(element, object);
    updateLighting();
    refreshSelection();
    emitChange('nudge');
    event.preventDefault();
  });

  function paintFireFrame(now) {
    fireFrameRequest = 0;
    if (!fireCanvases.length || document.hidden || animationPaused) return;
    if (!animationSettings.loop && now - animationStartedAt >= FIRE_FRAME_COUNT * 1000 / animationSettings.fps) return;
    if (!fireSource.complete || fireSource.naturalWidth === 0 || now - lastFirePaint < 32) {
      ensureFireAnimation();
      return;
    }
    lastFirePaint = now;
    if (fireCanProcess) {
      try {
        fireSourceContext.clearRect(0, 0, FIRE_CANVAS_SIZE, FIRE_CANVAS_SIZE);
        fireSourceContext.drawImage(
          fireSource,
          FIRE_CROP.x, FIRE_CROP.y, FIRE_CROP.width, FIRE_CROP.height,
          0, 0, FIRE_CANVAS_SIZE, FIRE_CANVAS_SIZE
        );
        const pixels = fireSourceContext.getImageData(0, 0, FIRE_CANVAS_SIZE, FIRE_CANVAS_SIZE);
        const data = pixels.data;
        for (let offset = 0; offset < data.length; offset += 4) {
          const r = data[offset];
          const g = data[offset + 1];
          const b = data[offset + 2];
          const minimum = Math.min(r, g, b);
          const chroma = Math.max(r, g, b) - minimum;
          if (minimum >= 244 && chroma <= 18) {
            data[offset + 3] = 0;
          } else if (minimum >= 220 && chroma <= 30) {
            data[offset + 3] = Math.min(data[offset + 3], Math.round((244 - minimum) / 24 * 255));
          }
        }
        fireSourceContext.putImageData(pixels, 0, 0);
      } catch {
        fireCanProcess = false;
        objectsRoot.querySelectorAll('.housing-fire-canvas').forEach(canvas => { canvas.hidden = true; });
        objectsRoot.querySelectorAll('.housing-fire-fallback').forEach(image => { image.hidden = false; });
      }
    }
    if (fireCanProcess) {
      fireCanvases.forEach(canvas => {
        const context = canvas.getContext('2d');
        context.clearRect(0, 0, FIRE_CANVAS_SIZE, FIRE_CANVAS_SIZE);
        context.drawImage(fireSourceCanvas, 0, 0);
      });
    }
    ensureFireAnimation();
  }

  function ensureFireAnimation() {
    if (fireFrameRequest || !fireCanvases.length || document.hidden || animationPaused) return;
    fireFrameRequest = requestAnimationFrame(paintFireFrame);
  }

  const VISUAL_STATES = {
    sunrise: { brightness: .60, saturation: .72, contrast: .93, sepia: .09, warmth: 4, shade: '#d18e7f', shadeOpacity: .23, lightOpacity: .085, glow: .56, dayReveal: .38, fireBrightness: .98 },
    day: { brightness: .80, saturation: .74, contrast: .92, sepia: .035, warmth: -1, shade: '#c7d1d0', shadeOpacity: .13, lightOpacity: .025, glow: .28, dayReveal: .12, fireBrightness: .94 },
    sunset: { brightness: .65, saturation: .78, contrast: .94, sepia: .11, warmth: 7, shade: '#bd6f69', shadeOpacity: .33, lightOpacity: .105, glow: .58, dayReveal: .48, fireBrightness: .98 },
    night: { brightness: .34, saturation: .54, contrast: .97, sepia: .02, warmth: -5, shade: '#304a87', shadeOpacity: .58, lightOpacity: .035, glow: .9, dayReveal: .78, fireBrightness: 1.04 }
  };

  function parseHexColor(value) {
    const match = /^#([0-9a-f]{6})$/i.exec(value || '');
    if (!match) return [255, 255, 255];
    const integer = Number.parseInt(match[1], 16);
    return [(integer >> 16) & 255, (integer >> 8) & 255, integer & 255];
  }

  function mixHexColor(from, to, amount) {
    const a = parseHexColor(from);
    const b = parseHexColor(to);
    return `rgb(${a.map((channel, index) => Math.round(channel + (b[index] - channel) * amount)).join(' ')})`;
  }

  function interpolateVisual(hour, lighting = {}) {
    const currentName = VISUAL_STATES[lighting.current] ? lighting.current : 'day';
    const nextName = VISUAL_STATES[lighting.next] ? lighting.next : currentName;
    const start = VISUAL_STATES[currentName];
    const end = VISUAL_STATES[nextName];
    const eased = clamp(Number(lighting.progress) || 0, 0, 1);
    const mix = key => start[key] + (end[key] - start[key]) * eased;
    return {
      brightness: mix('brightness'), saturation: mix('saturation'), contrast: mix('contrast'),
      sepia: mix('sepia'), warmth: mix('warmth'), shade: mixHexColor(start.shade, end.shade, eased),
      shadeOpacity: mix('shadeOpacity'), lightOpacity: mix('lightOpacity'), glow: mix('glow'),
      dayReveal: mix('dayReveal'),
      fireBrightness: mix('fireBrightness'), lightColor: lighting.lightColor || '#fff4dc',
      shadowColor: lighting.shadowColor || '#445468'
    };
  }

  function setVisualHour(hour, lighting = {}) {
    const visualMinute = Math.round((((hour % 24) + 24) % 24) * 60);
    const signature = `${visualMinute}:${lighting.current || ''}:${lighting.next || ''}:${Number(lighting.progress || 0).toFixed(3)}`;
    if (signature === lastVisualSignature) return;
    lastVisualSignature = signature;
    const visual = interpolateVisual(hour, lighting);
    currentVisual = visual;
    const root = document.documentElement.style;
    root.setProperty('--housing-brightness', visual.brightness.toFixed(3));
    root.setProperty('--housing-saturation', visual.saturation.toFixed(3));
    root.setProperty('--housing-contrast', visual.contrast.toFixed(3));
    root.setProperty('--housing-sepia', visual.sepia.toFixed(3));
    root.setProperty('--housing-warmth', `${visual.warmth.toFixed(2)}deg`);
    root.setProperty('--housing-shade-color', visual.shade);
    root.setProperty('--housing-shade-opacity', visual.shadeOpacity.toFixed(3));
    root.setProperty('--housing-light-color', visual.lightColor);
    root.setProperty('--housing-light-opacity', visual.lightOpacity.toFixed(3));
    root.setProperty('--housing-shadow-color', visual.shadowColor);
    root.setProperty('--housing-fire-brightness', visual.fireBrightness.toFixed(3));
    root.setProperty('--housing-glow', visual.glow.toFixed(3));
    root.setProperty('--housing-glow-soft', (visual.glow * .72).toFixed(3));
    root.setProperty('--housing-flame-glow-opacity', clamp(visual.glow * .44, .08, .38).toFixed(3));
    updateLighting();
    const editorBlend = window.AthenaRendererEditor?.getVisualBlend(hour);
    const editorAdjustment = window.AthenaSceneRuntime?.interpolateAdjustment('camp', editorBlend);
    if (editorAdjustment) {
      root.setProperty('--housing-editor-brightness', Math.max(0, 1 + editorAdjustment.brightness / 100).toFixed(3));
      root.setProperty('--housing-editor-contrast', Math.max(0, 1 + editorAdjustment.contrast / 100).toFixed(3));
      root.setProperty('--housing-editor-saturation', Math.max(0, 1 + editorAdjustment.saturation / 100).toFixed(3));
      root.setProperty('--housing-editor-hue', `${editorAdjustment.hue.toFixed(2)}deg`);
      root.setProperty('--housing-editor-opacity', Math.max(0, Math.min(1, editorAdjustment.opacity / 100)).toFixed(3));
    }
  }

  openButton.addEventListener('click', openEditor);
  doneButton.addEventListener('click', () => closeEditor(true));
  cancelButton.addEventListener('click', () => closeEditor(false));
  resetButton.addEventListener('click', resetLayout);
  flipButton.addEventListener('click', () => {
    const object = selectedObject();
    if (!object || TYPES[object.type].group === 'fire') return;
    object.flip = !object.flip;
    const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
    if (element) setObjectStyle(element, object);
  });
  duplicateButton.addEventListener('click', duplicateSelected);
  removeButton.addEventListener('click', removeSelected);
  window.addEventListener('athena:open-housing', openEditor);
  document.addEventListener('visibilitychange', ensureFireAnimation);

  renderCatalogue();
  renderObjects();
  window.AthenaHousing = {
    open: openEditor,
    close: closeEditor,
    setVisualHour,
    getObjects,
    getTypes: () => Object.fromEntries(Object.entries(TYPES).map(([name, type]) => [name, { ...type }])),
    getSceneSize: () => ({ width: SCENE_WIDTH, height: 1280 }),
    getElement: id => objectsRoot.querySelector(`[data-id="${CSS.escape(String(id))}"]`),
    select,
    updateObject,
    addObject,
    removeObject,
    duplicateObject,
    replaceObjects,
    reorderObjects,
    save: persist,
    reset(options = {}) {
      objects = cloneDefaults();
      selectedId = null;
      renderObjects();
      emitChange('reset');
      if (options.save) persist();
    },
    setExternalEditing(active) {
      externalEditing = Boolean(active);
      layer.classList.toggle('is-scene-editing', externalEditing);
      if (!externalEditing && !editing) selectedId = null;
      refreshSelection();
    },
    getAnimationSettings: () => ({ ...animationSettings, frameCount: FIRE_FRAME_COUNT }),
    setAnimationSettings(settings = {}, options = {}) {
      animationSettings = {
        fps: clamp(Number(settings.fps ?? animationSettings.fps) || 15, 1, 30),
        loop: settings.loop === undefined ? animationSettings.loop : Boolean(settings.loop)
      };
      animationStartedAt = performance.now();
      lastFirePaint = 0;
      ensureFireAnimation();
      window.dispatchEvent(new CustomEvent('athena:housing-animation-change', { detail: { ...animationSettings } }));
      if (options.save) persist();
      return { ...animationSettings, frameCount: FIRE_FRAME_COUNT };
    },
    setAnimationPaused(paused) {
      const wasPaused = animationPaused;
      animationPaused = Boolean(paused);
      layer.classList.toggle('is-animation-paused', animationPaused);
      if (animationPaused && fireFrameRequest) {
        cancelAnimationFrame(fireFrameRequest);
        fireFrameRequest = 0;
      }
      if (!animationPaused) {
        if (wasPaused) animationStartedAt = performance.now();
        ensureFireAnimation();
      }
    }
  };
})();
