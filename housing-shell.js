(() => {
  const stage = document.querySelector('.stage-shell');
  if (!stage || document.querySelector('#housingLayer')) return;

  const STORAGE_KEY = 'athena-housing-v2';
  const SCENE_WIDTH = 720;
  const MIN_Y = .60;
  const MAX_Y = .965;
  const FIRE_CROP = { x: 42, y: 0, width: 306, height: 306 };
  const FIRE_CANVAS_SIZE = 240;

  const TYPES = {
    tent1: { label: 'Tente I', group: 'tent', src: 'assets/housing/tente1.webp', width: 238, bottom: .891, defaultY: .76 },
    tent2: { label: 'Tente II', group: 'tent', src: 'assets/housing/tente2.webp', width: 238, bottom: .899, defaultY: .76 },
    tent3: { label: 'Tente III', group: 'tent', src: 'assets/housing/tente3.webp', width: 238, bottom: .906, defaultY: .76 },
    tent4: { label: 'Tente IV', group: 'tent', src: 'assets/housing/tente4.webp', width: 238, bottom: .922, defaultY: .76 },
    kiosk: { label: 'Kiosque', group: 'kiosk', src: 'assets/housing/kiosque.webp', width: 220, bottom: .962, defaultY: .944 },
    altar: { label: 'Autel d’Athéna', group: 'altar', src: 'assets/housing/autel_athena.webp', width: 310, bottom: .97, defaultY: .768 },
    fire: { label: 'Feu de camp', group: 'fire', src: 'assets/housing/feu-preview.webp', width: 86, bottom: .95, defaultY: .80, animated: true }
  };

  const DEFAULT_OBJECTS = [
    { id: 'tent-main', type: 'tent1', x: .205, y: .76, flip: false },
    { id: 'fire-main', type: 'fire', x: .50, y: .80, flip: false },
    { id: 'altar-main', type: 'altar', x: .79, y: .768, flip: false },
    { id: 'kiosk-main', type: 'kiosk', x: .75, y: .944, flip: false }
  ];

  const layer = document.createElement('section');
  layer.className = 'housing-layer';
  layer.id = 'housingLayer';
  layer.setAttribute('aria-label', 'Décor personnalisable du camp');
  layer.innerHTML = '<div class="housing-ground-guide" aria-hidden="true"></div><div class="housing-objects" id="housingObjects"></div>';

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
  let selectedId = null;
  let editing = false;
  let drag = null;
  let editorSnapshot = '';
  let hiddenBeforeEdit = null;
  let toastTimer = 0;
  let lastVisualMinute = -1;
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
  fireSource.src = 'assets/housing/FEU_ANIME.gif';
  document.body.append(fireSource);

  function cloneDefaults() {
    return DEFAULT_OBJECTS.map(object => ({ ...object }));
  }

  function clamp(value, min, max) {
    return Math.min(max, Math.max(min, value));
  }

  function horizontalMargin(y) {
    const progress = clamp((y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1);
    return .44 - progress * .395;
  }

  function constrainPosition(object) {
    object.y = clamp(Number(object.y) || TYPES[object.type].defaultY, MIN_Y, MAX_Y);
    const margin = horizontalMargin(object.y);
    object.x = clamp(Number(object.x) || .5, margin, 1 - margin);
    object.flip = Boolean(object.flip);
    return object;
  }

  function loadObjects() {
    try {
      const parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) || 'null');
      if (!Array.isArray(parsed)) return cloneDefaults();
      const valid = parsed
        .filter(object => object && TYPES[object.type])
        .map((object, index) => constrainPosition({
          id: String(object.id || `housing-${Date.now()}-${index}`),
          type: object.type,
          x: object.x,
          y: object.y,
          flip: object.flip
        }));
      return valid;
    } catch {
      return cloneDefaults();
    }
  }

  function persist() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(objects));
  }

  function depthAt(y) {
    return .72 + clamp((y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1) * .48;
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
    element.style.zIndex = String(20 + Math.round(object.y * 1000));
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
      const canvas = document.createElement('canvas');
      canvas.className = 'housing-object-art housing-fire-canvas';
      canvas.width = FIRE_CANVAS_SIZE;
      canvas.height = FIRE_CANVAS_SIZE;
      canvas.setAttribute('aria-hidden', 'true');
      const fallback = document.createElement('img');
      fallback.className = 'housing-object-art housing-fire-fallback';
      fallback.src = 'assets/housing/FEU_ANIME.gif';
      fallback.alt = '';
      fallback.hidden = true;
      element.append(canvas, fallback);
    } else {
      const image = document.createElement('img');
      image.className = 'housing-object-art';
      image.src = type.src;
      image.alt = '';
      image.draggable = false;
      element.append(image);
    }
    setObjectStyle(element, object);
    return element;
  }

  function renderObjects() {
    objectsRoot.replaceChildren(...objects
      .slice()
      .sort((a, b) => a.y - b.y)
      .map(createObjectElement));
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
      element.classList.toggle('is-selected', editing && element.dataset.id === selectedId);
      element.tabIndex = editing ? 0 : -1;
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
    if (existingGroup && type.group !== 'fire') {
      select(existingGroup.id, true);
      showToast('Cet objet est déjà installé.');
      return;
    }
    const position = suggestedPosition(type.group);
    const object = constrainPosition({ id: uniqueId(type.group), type: typeName, ...position, flip: false });
    objects.push(object);
    renderObjects();
    select(object.id, true);
    showToast(`${type.label} ajouté au camp.`);
  }

  function duplicateSelected() {
    const source = selectedObject();
    if (!source || TYPES[source.type].group === 'tent') return;
    const copy = constrainPosition({
      ...source,
      id: uniqueId(TYPES[source.type].group),
      x: source.x + .07,
      y: source.y + .03
    });
    objects.push(copy);
    renderObjects();
    select(copy.id, true);
    showToast('Objet dupliqué.');
  }

  function removeSelected() {
    if (!selectedId) return;
    objects = objects.filter(object => object.id !== selectedId);
    selectedId = null;
    renderObjects();
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
      try { objects = JSON.parse(editorSnapshot).map(constrainPosition); } catch { objects = cloneDefaults(); }
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
    showToast('Disposition d’origine restaurée.');
  }

  function updateDraggedObject(event) {
    if (!drag || event.pointerId !== drag.pointerId) return;
    const bounds = layer.getBoundingClientRect();
    const object = objects.find(candidate => candidate.id === drag.id);
    if (!object || !bounds.width || !bounds.height) return;
    object.y = clamp((event.clientY - bounds.top) / bounds.height, MIN_Y, MAX_Y);
    const margin = horizontalMargin(object.y);
    object.x = clamp((event.clientX - bounds.left) / bounds.width - drag.offsetX, margin, 1 - margin);
    const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
    if (element) setObjectStyle(element, object);
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
    sorted.forEach(object => objectsRoot.append(objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`)));
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
    if (!object || !['ArrowLeft', 'ArrowRight', 'ArrowUp', 'ArrowDown'].includes(event.key)) return;
    const step = event.shiftKey ? .012 : .004;
    if (event.key === 'ArrowLeft') object.x -= step;
    if (event.key === 'ArrowRight') object.x += step;
    if (event.key === 'ArrowUp') object.y -= step;
    if (event.key === 'ArrowDown') object.y += step;
    constrainPosition(object);
    const element = objectsRoot.querySelector(`[data-id="${CSS.escape(object.id)}"]`);
    if (element) setObjectStyle(element, object);
    refreshSelection();
    event.preventDefault();
  });

  function paintFireFrame(now) {
    fireFrameRequest = 0;
    if (!fireCanvases.length || document.hidden) return;
    if (!fireSource.complete || fireSource.naturalWidth === 0 || now - lastFirePaint < 66) {
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
    if (fireFrameRequest || !fireCanvases.length || document.hidden) return;
    fireFrameRequest = requestAnimationFrame(paintFireFrame);
  }

  function interpolateVisual(hour) {
    const anchors = [
      { hour: 0, brightness: .54, saturation: .72, warmth: -5, glow: .88 },
      { hour: 5.75, brightness: .56, saturation: .74, warmth: -3, glow: .8 },
      { hour: 7.25, brightness: .86, saturation: .84, warmth: 5, glow: .46 },
      { hour: 9, brightness: 1, saturation: .94, warmth: 0, glow: .28 },
      { hour: 17.75, brightness: .98, saturation: .96, warmth: 0, glow: .3 },
      { hour: 19.25, brightness: .82, saturation: .9, warmth: 8, glow: .5 },
      { hour: 21, brightness: .56, saturation: .73, warmth: -4, glow: .84 },
      { hour: 24, brightness: .54, saturation: .72, warmth: -5, glow: .88 }
    ];
    const normalizedHour = ((hour % 24) + 24) % 24;
    let index = anchors.findIndex((anchor, anchorIndex) => anchorIndex < anchors.length - 1 && normalizedHour >= anchor.hour && normalizedHour <= anchors[anchorIndex + 1].hour);
    if (index < 0) index = anchors.length - 2;
    const start = anchors[index];
    const end = anchors[index + 1];
    const raw = clamp((normalizedHour - start.hour) / Math.max(.001, end.hour - start.hour), 0, 1);
    const eased = raw * raw * (3 - 2 * raw);
    const mix = key => start[key] + (end[key] - start[key]) * eased;
    return { brightness: mix('brightness'), saturation: mix('saturation'), warmth: mix('warmth'), glow: mix('glow') };
  }

  function setVisualHour(hour) {
    const visualMinute = Math.round((((hour % 24) + 24) % 24) * 60);
    if (visualMinute === lastVisualMinute) return;
    lastVisualMinute = visualMinute;
    const visual = interpolateVisual(hour);
    const root = document.documentElement.style;
    root.setProperty('--housing-brightness', visual.brightness.toFixed(3));
    root.setProperty('--housing-saturation', visual.saturation.toFixed(3));
    root.setProperty('--housing-warmth', `${visual.warmth.toFixed(2)}deg`);
    root.setProperty('--housing-glow', visual.glow.toFixed(3));
    root.setProperty('--housing-glow-soft', (visual.glow * .72).toFixed(3));
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
  window.AthenaHousing = { open: openEditor, close: closeEditor, setVisualHour };
})();
