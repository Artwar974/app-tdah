(() => {
  const stage = document.querySelector('.stage-shell');
  const objectsRoot = document.querySelector('#housingObjects');
  if (!stage || !objectsRoot || document.querySelector('#athenaMinotaur')) return;

  const SOURCES = {
    front: 'assets/creatures/minotaur/directions/straight-front.mp4',
    back: 'assets/creatures/minotaur/directions/straight-back.mp4',
    right: 'assets/creatures/minotaur/directions/side-right.mp4',
    left: 'assets/creatures/minotaur/directions/side-left.mp4',
    frontRight: 'assets/creatures/minotaur/directions/diagonal-front-right.mp4',
    frontLeft: 'assets/creatures/minotaur/directions/diagonal-front-left.mp4',
    backLeft: 'assets/creatures/minotaur/directions/diagonal-back-left.mp4',
    backRight: 'assets/creatures/minotaur/directions/diagonal-back-right.mp4'
  };
  const IDLE_SOURCES = {
    front: 'assets/creatures/minotaur/idle/straight-front.webm',
    back: 'assets/creatures/minotaur/idle/straight-back.mp4',
    frontRight: 'assets/creatures/minotaur/idle/diagonal-front-right.webm',
    frontLeft: 'assets/creatures/minotaur/idle/diagonal-front-left.webm',
    backLeft: 'assets/creatures/minotaur/idle/diagonal-back-left.webm',
    backRight: 'assets/creatures/minotaur/idle/diagonal-back-right.webm'
  };
  const REST_FRAME_RATIO = {
    front: .875,
    back: .375,
    right: .375,
    left: .125,
    frontRight: .375,
    frontLeft: .125,
    backLeft: .375,
    backRight: .125
  };
  const SCENE_WIDTH = 720;
  const SCENE_HEIGHT = 1280;
  const MIN_Y = .62;
  const MAX_Y = .925;
  const IDLE_MIN_MS = 2600;
  const IDLE_MAX_MS = 6200;
  const CANVAS_WIDTH = 247;
  const CANVAS_HEIGHT = 269;
  // Le personnage n'est affiché qu'entre 76 et 107 px dans la scène. Lire et
  // détourer 480 px à chaque image ne rajoutait aucun détail visible, mais
  // bloquait le thread principal avec plusieurs centaines de milliers de
  // comparaisons. 320 px conserve une marge confortable avant réduction.
  const SAMPLE_LIMIT = 288;
  const CHARACTER_RENDER_FPS = 18;
  const IDLE_RENDER_FPS = 12;
  const CHARACTER_MAX_WIDTH = 235;
  const CHARACTER_MAX_HEIGHT = 250;
  const STRIDE_RATIO = {
    front: .36,
    back: .36,
    right: .49,
    left: .49,
    frontRight: .43,
    frontLeft: .43,
    backLeft: .43,
    backRight: .43
  };
  const TURN_RATE_RAD_PER_SECOND = 1.45;
  const IDLE_LOOK_MIN_MS = 1700;
  const IDLE_LOOK_MAX_MS = 3600;
  const DIRECTION_ORDER = ['right', 'frontRight', 'front', 'frontLeft', 'left', 'backLeft', 'back', 'backRight'];

  const root = document.createElement('div');
  root.className = 'minotaur-agent';
  root.id = 'athenaMinotaur';
  root.setAttribute('aria-hidden', 'true');
  root.innerHTML = '<span class="minotaur-shadow"></span><canvas class="minotaur-art" width="247" height="269"></canvas>';
  const canvas = root.querySelector('canvas');
  // Ce canvas n'est jamais relu : le laisser accéléré évite de forcer tout le
  // rendu final du personnage en mémoire CPU.
  const context = canvas.getContext('2d');
  const sampleCanvas = document.createElement('canvas');
  const sampleContext = sampleCanvas.getContext('2d', { willReadFrequently: true });
  const videos = Object.fromEntries(Object.entries(SOURCES).map(([direction, src]) => [direction, createVideo(src, direction, 'walk')]));
  const idleVideos = Object.fromEntries(Object.entries(IDLE_SOURCES).map(([direction, src]) => [direction, createVideo(src, direction, 'idle')]));
  root.append(...Object.values(videos), ...Object.values(idleVideos));
  const daylightCanvases = new Map();
  const renderRegistrations = new WeakMap();
  const backgroundPalettes = new WeakMap();
  const readyDirections = new Set();
  const readyIdleDirections = new Set();
  let floodMask = new Uint8Array(0);
  let floodQueue = new Int32Array(0);
  let state = 'loading';
  let activeVideo = null;
  let lastDirection = 'front';
  let position = { x: .48, y: .82 };
  let origin = { ...position };
  let destination = { ...position };
  let movementStartedAt = 0;
  let movementDuration = 0;
  let movementDistance = 0;
  let movementStride = 0;
  let movementHalfSteps = 0;
  let movementCycleCount = 0;
  let lastMovementVideoTime = 0;
  let movementTrackDistance = 0;
  let movementTravelled = 0;
  let movementHeading = 0;
  let targetHeading = 0;
  let nextTurnDistance = Infinity;
  let wandering = false;
  let lastMovementUpdateAt = 0;
  let idleTimer = 0;
  let idleLookTimer = 0;
  let raf = 0;
  let suspended = false;
  let suspendedAt = 0;
  let lastFrameTime = 0;
  let lastLightingTime = 0;
  let idleFrameReady = false;
  let finishStartedAt = 0;

  function createVideo(src, direction, motion) {
    const video = document.createElement('video');
    video.src = src;
    video.dataset.direction = direction;
    video.dataset.motion = motion;
    video.muted = true;
    video.loop = true;
    video.playsInline = true;
    video.preload = 'auto';
    video.disablePictureInPicture = true;
    video.setAttribute('aria-hidden', 'true');
    Object.assign(video.style, {
      position: 'absolute',
      width: '1px',
      height: '1px',
      opacity: '0',
      pointerEvents: 'none'
    });
    video.load();
    return video;
  }

  function clamp(value, min, max) {
    return Math.max(min, Math.min(max, value));
  }

  function horizontalMargin(y) {
    const depth = clamp((y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1);
    return .16 - depth * .075;
  }

  function constrain(point) {
    const y = clamp(Number(point.y) || .8, MIN_Y, MAX_Y);
    const margin = horizontalMargin(y);
    return { x: clamp(Number(point.x) || .5, margin, 1 - margin), y };
  }

  function directionForVector(dx, dy) {
    const angle = Math.atan2(dy, dx) * 180 / Math.PI;
    if (angle >= -22.5 && angle < 22.5) return 'right';
    if (angle >= 22.5 && angle < 67.5) return 'frontRight';
    if (angle >= 67.5 && angle < 112.5) return 'front';
    if (angle >= 112.5 && angle < 157.5) return 'frontLeft';
    if (angle >= 157.5 || angle < -157.5) return 'left';
    if (angle >= -157.5 && angle < -112.5) return 'backLeft';
    if (angle >= -112.5 && angle < -67.5) return 'back';
    return 'backRight';
  }

  function attachToHousing() {
    const currentRoot = document.querySelector('#housingObjects');
    if (currentRoot && root.parentNode !== currentRoot) currentRoot.append(root);
    applyPosition();
  }

  function applyPosition() {
    const depth = clamp((position.y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1);
    const width = 76 + depth * 31;
    root.style.setProperty('--minotaur-x', `${position.x * 100}%`);
    root.style.setProperty('--minotaur-y', `${position.y * 100}%`);
    root.style.setProperty('--minotaur-width', `${width.toFixed(2)}px`);
    root.style.setProperty('--minotaur-shadow-scale', (0.82 + depth * .28).toFixed(3));
    root.style.zIndex = String(20 + Math.round(position.y * 1000));
    updateDynamicLighting();
  }

  function ensureFloodBuffers(size) {
    if (floodMask.length === size) {
      floodMask.fill(0);
      return;
    }
    floodMask = new Uint8Array(size);
    floodQueue = new Int32Array(size);
  }

  function quantizedKey(red, green, blue) {
    return (red >> 4) << 8 | (green >> 4) << 4 | (blue >> 4);
  }

  function collectBorderPalette(data, width, height) {
    const bins = new Map();
    const record = pixelIndex => {
      const offset = pixelIndex * 4;
      const key = quantizedKey(data[offset], data[offset + 1], data[offset + 2]);
      const entry = bins.get(key) || { key, count: 0, red: 0, green: 0, blue: 0 };
      entry.count += 1;
      entry.red += data[offset];
      entry.green += data[offset + 1];
      entry.blue += data[offset + 2];
      bins.set(key, entry);
    };
    const ring = Math.min(4, Math.floor(Math.min(width, height) / 8));
    for (let inset = 0; inset < ring; inset += 1) {
      const top = inset * width;
      const bottom = (height - 1 - inset) * width;
      for (let x = inset; x < width - inset; x += 1) {
        record(top + x);
        record(bottom + x);
      }
      for (let y = inset + 1; y < height - 1 - inset; y += 1) {
        record(y * width + inset);
        record(y * width + width - 1 - inset);
      }
    }
    const entries = [...bins.values()].sort((a, b) => b.count - a.count).slice(0, 36);
    entries.forEach(entry => {
      entry.red /= entry.count;
      entry.green /= entry.count;
      entry.blue /= entry.count;
    });
    return {
      keys: new Set(entries.map(entry => entry.key)),
      colors: entries.slice(0, 18)
    };
  }

  function isBackgroundPixel(data, pixelIndex, palette) {
    const offset = pixelIndex * 4;
    const red = data[offset];
    const green = data[offset + 1];
    const blue = data[offset + 2];
    if (palette.keys.has(quantizedKey(red, green, blue))) return true;
    for (const color of palette.colors) {
      const redDelta = red - color.red;
      const greenDelta = green - color.green;
      const blueDelta = blue - color.blue;
      if (redDelta * redDelta + greenDelta * greenDelta + blueDelta * blueDelta <= 18 * 18) return true;
    }
    return false;
  }

  function removeEnclosedBackgroundPockets(data, width, height, palette) {
    const size = width * height;
    const isExactBackground = pixelIndex => {
      const offset = pixelIndex * 4;
      return palette.keys.has(quantizedKey(data[offset], data[offset + 1], data[offset + 2]));
    };
    for (let start = 0; start < size; start += 1) {
      if (floodMask[start] !== 0 || !isExactBackground(start)) continue;
      let head = 0;
      let tail = 0;
      let exactMatches = 0;
      floodMask[start] = 2;
      floodQueue[tail++] = start;
      while (head < tail) {
        const pixelIndex = floodQueue[head++];
        if (isExactBackground(pixelIndex)) exactMatches += 1;
        const x = pixelIndex % width;
        const enqueue = neighbor => {
          if (floodMask[neighbor] !== 0 || !isBackgroundPixel(data, neighbor, palette)) return;
          floodMask[neighbor] = 2;
          floodQueue[tail++] = neighbor;
        };
        if (x > 0) enqueue(pixelIndex - 1);
        if (x + 1 < width) enqueue(pixelIndex + 1);
        if (pixelIndex >= width) enqueue(pixelIndex - width);
        if (pixelIndex + width < size) enqueue(pixelIndex + width);
      }
      const exactRatio = tail ? exactMatches / tail : 0;
      const shouldRemove = tail >= 3 && tail < size * .12 && exactRatio >= .42;
      if (shouldRemove) {
        for (let index = 0; index < tail; index += 1) floodMask[floodQueue[index]] = 3;
      }
    }
  }

  function removeSmallForegroundComponents(data, width, height) {
    const size = width * height;
    const minimumComponentSize = Math.max(36, Math.round(size * .00045));
    floodMask.fill(0);

    // Les videos source n'ont pas toutes le meme cadrage. Certains fonds
    // laissent des tirets verticaux qui agrandissaient artificiellement la
    // silhouette mesuree. Apres retrait du fond, ces tirets sont de petites
    // composantes isolees : on les supprime sans rogner le personnage, sa
    // hache ni les parties reellement dessinees.
    for (let start = 0; start < size; start += 1) {
      if (floodMask[start] !== 0 || data[start * 4 + 3] < 16) continue;
      let head = 0;
      let tail = 0;
      floodMask[start] = 1;
      floodQueue[tail++] = start;
      while (head < tail) {
        const pixelIndex = floodQueue[head++];
        const x = pixelIndex % width;
        const enqueue = neighbor => {
          if (floodMask[neighbor] !== 0 || data[neighbor * 4 + 3] < 16) return;
          floodMask[neighbor] = 1;
          floodQueue[tail++] = neighbor;
        };
        if (x > 0) enqueue(pixelIndex - 1);
        if (x + 1 < width) enqueue(pixelIndex + 1);
        if (pixelIndex >= width) enqueue(pixelIndex - width);
        if (pixelIndex + width < size) enqueue(pixelIndex + width);
      }
      if (tail >= minimumComponentSize) continue;
      for (let index = 0; index < tail; index += 1) {
        data[floodQueue[index] * 4 + 3] = 0;
      }
    }
  }

  function removeExternalBackground(pixels, width, height, palette) {
    const { data } = pixels;
    const size = width * height;
    ensureFloodBuffers(size);
    let head = 0;
    let tail = 0;

    const enqueue = pixelIndex => {
      if (floodMask[pixelIndex] || !isBackgroundPixel(data, pixelIndex, palette)) return;
      floodMask[pixelIndex] = 1;
      floodQueue[tail++] = pixelIndex;
    };
    for (let x = 0; x < width; x += 1) {
      enqueue(x);
      enqueue((height - 1) * width + x);
    }
    for (let y = 1; y < height - 1; y += 1) {
      enqueue(y * width);
      enqueue(y * width + width - 1);
    }

    while (head < tail) {
      const pixelIndex = floodQueue[head++];
      const x = pixelIndex % width;
      if (x > 0) enqueue(pixelIndex - 1);
      if (x + 1 < width) enqueue(pixelIndex + 1);
      if (pixelIndex >= width) enqueue(pixelIndex - width);
      if (pixelIndex + width < size) enqueue(pixelIndex + width);
    }

    removeEnclosedBackgroundPockets(data, width, height, palette);
    for (let pixelIndex = 0; pixelIndex < size; pixelIndex += 1) {
      if (floodMask[pixelIndex] === 1 || floodMask[pixelIndex] === 3) {
        data[pixelIndex * 4 + 3] = 0;
      }
    }
    removeSmallForegroundComponents(data, width, height);

    let minX = width;
    let minY = height;
    let maxX = -1;
    let maxY = -1;
    for (let pixelIndex = 0; pixelIndex < size; pixelIndex += 1) {
      const offset = pixelIndex * 4;
      if (data[offset + 3] < 16) continue;
      const x = pixelIndex % width;
      const y = Math.floor(pixelIndex / width);
      minX = Math.min(minX, x);
      minY = Math.min(minY, y);
      maxX = Math.max(maxX, x);
      maxY = Math.max(maxY, y);
    }
    return maxX >= minX && maxY >= minY
      ? { x: minX, y: minY, width: maxX - minX + 1, height: maxY - minY + 1 }
      : null;
  }

  function syncDaylightFrames() {
    daylightCanvases.forEach(entry => {
      const overlayContext = entry.canvas.getContext('2d');
      overlayContext.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
      overlayContext.drawImage(canvas, 0, 0);
    });
  }

  function findTorsoAnchorX(pixels, bounds, width) {
    const { data } = pixels;
    const startY = Math.max(0, Math.floor(bounds.y + bounds.height * .2));
    const endY = Math.min(Math.floor(bounds.y + bounds.height * .58), Math.floor(data.length / 4 / width));
    const startX = Math.max(0, bounds.x);
    const endX = Math.min(width, bounds.x + bounds.width);
    let weightedX = 0;
    let totalWeight = 0;
    for (let y = startY; y < endY; y += 1) {
      for (let x = startX; x < endX; x += 1) {
        const alpha = data[(y * width + x) * 4 + 3];
        if (alpha < 40) continue;
        weightedX += x * alpha;
        totalWeight += alpha;
      }
    }
    return totalWeight ? weightedX / totalWeight : bounds.x + bounds.width / 2;
  }

  function drawVideo(video) {
    if (!video || video.readyState < 2 || !video.videoWidth || !video.videoHeight) return false;
    const sampleScale = Math.min(SAMPLE_LIMIT / video.videoWidth, SAMPLE_LIMIT / video.videoHeight, 1);
    const sampleWidth = Math.max(1, Math.round(video.videoWidth * sampleScale));
    const sampleHeight = Math.max(1, Math.round(video.videoHeight * sampleScale));
    if (sampleCanvas.width !== sampleWidth || sampleCanvas.height !== sampleHeight) {
      sampleCanvas.width = sampleWidth;
      sampleCanvas.height = sampleHeight;
    }
    sampleContext.clearRect(0, 0, sampleWidth, sampleHeight);
    sampleContext.drawImage(video, 0, 0, sampleWidth, sampleHeight);
    const pixels = sampleContext.getImageData(0, 0, sampleWidth, sampleHeight);
    // Le décor de fond d'une animation ne change pas d'une frame à l'autre.
    // Sa palette est donc calculée une seule fois par fichier vidéo.
    let palette = backgroundPalettes.get(video);
    if (!palette) {
      palette = collectBorderPalette(pixels.data, sampleWidth, sampleHeight);
      backgroundPalettes.set(video, palette);
    }
    const bounds = removeExternalBackground(pixels, sampleWidth, sampleHeight, palette);
    const torsoX = bounds ? findTorsoAnchorX(pixels, bounds, sampleWidth) : sampleWidth / 2;
    sampleContext.putImageData(pixels, 0, 0);
    if (!bounds) return false;

    let registration = renderRegistrations.get(video);
    if (!registration || registration.sampleWidth !== sampleWidth || registration.sampleHeight !== sampleHeight) {
      const scale = Math.min(
        CHARACTER_MAX_WIDTH / (bounds.width * 1.04),
        CHARACTER_MAX_HEIGHT / bounds.height
      );
      registration = {
        sampleWidth,
        sampleHeight,
        scale,
        centerX: torsoX,
        footY: bounds.y + bounds.height
      };
      renderRegistrations.set(video, registration);
    }
    const width = Math.round(sampleWidth * registration.scale);
    const height = Math.round(sampleHeight * registration.scale);
    const x = Math.round(CANVAS_WIDTH / 2 - torsoX * registration.scale);
    const y = Math.round(CANVAS_HEIGHT - 14 - registration.footY * registration.scale);
    context.clearRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
    context.drawImage(
      sampleCanvas,
      0, 0, sampleWidth, sampleHeight,
      x, y, width, height
    );
    root.dataset.renderedDirection = video.dataset.direction;
    syncDaylightFrames();
    return true;
  }

  function createDaylight(sourceId) {
    const overlay = document.createElement('canvas');
    overlay.className = 'minotaur-art minotaur-daylight';
    overlay.width = CANVAS_WIDTH;
    overlay.height = CANVAS_HEIGHT;
    overlay.dataset.sourceId = sourceId;
    overlay.setAttribute('aria-hidden', 'true');
    root.append(overlay);
    const entry = { canvas: overlay };
    daylightCanvases.set(sourceId, entry);
    entry.canvas.getContext('2d').drawImage(canvas, 0, 0);
    return entry;
  }

  function updateDynamicLighting(force = false) {
    const now = performance.now();
    if (!force && now - lastLightingTime < 80) return;
    lastLightingTime = now;
    const sources = window.AthenaHousing?.getLightSources?.() || [];
    const activeIds = new Set();
    const width = 76 + clamp((position.y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1) * 31;
    const height = width * CANVAS_HEIGHT / CANVAS_WIDTH;
    const left = position.x * SCENE_WIDTH - width / 2;
    const top = position.y * SCENE_HEIGHT - height;

    sources.forEach((source, index) => {
      const sourceX = source.x * SCENE_WIDTH;
      const sourceY = source.flameY * SCENE_HEIGHT;
      const closestX = clamp(sourceX, left, left + width);
      const closestY = clamp(sourceY, top, top + height);
      if (Math.hypot(closestX - sourceX, closestY - sourceY) >= source.radius) return;
      activeIds.add(source.id);
      const entry = daylightCanvases.get(source.id) || createDaylight(source.id);
      const opacity = clamp(source.dayReveal * source.strength, 0, .84);
      entry.canvas.style.setProperty('--minotaur-daylight-x', `${(sourceX - left) / width * 100}%`);
      entry.canvas.style.setProperty('--minotaur-daylight-y', `${(sourceY - top) / height * 100}%`);
      entry.canvas.style.setProperty('--minotaur-daylight-rx', `${source.radius / width * 100}%`);
      entry.canvas.style.setProperty('--minotaur-daylight-ry', `${source.radius / height * 100}%`);
      entry.canvas.style.setProperty('--minotaur-daylight-opacity', opacity.toFixed(3));
      entry.canvas.style.setProperty('--minotaur-daylight-opacity-soft', (opacity * .9).toFixed(3));
      entry.canvas.style.animationDelay = `${-(index * .17) % 1.4}s`;
    });

    daylightCanvases.forEach((entry, sourceId) => {
      if (activeIds.has(sourceId)) return;
      entry.canvas.remove();
      daylightCanvases.delete(sourceId);
    });
  }

  function randomDestination() {
    for (let attempt = 0; attempt < 12; attempt += 1) {
      const y = MIN_Y + Math.random() * (MAX_Y - MIN_Y);
      const margin = horizontalMargin(y);
      const candidate = { x: margin + Math.random() * (1 - margin * 2), y };
      const dx = (candidate.x - position.x) * SCENE_WIDTH;
      const dy = (candidate.y - position.y) * SCENE_HEIGHT;
      if (Math.hypot(dx, dy) > 120) return candidate;
    }
    return constrain({ x: 1 - position.x, y: .72 + Math.random() * .17 });
  }

  function gaitProgress(phase) {
    return clamp(phase, 0, 1);
  }

  function strideForDepth(y, direction) {
    const depth = clamp((y - MIN_Y) / (MAX_Y - MIN_Y), 0, 1);
    const characterWidth = 76 + depth * 31;
    return characterWidth * (STRIDE_RATIO[direction] || .4);
  }

  function normalizeAngle(angle) {
    let normalized = angle;
    while (normalized <= -Math.PI) normalized += Math.PI * 2;
    while (normalized > Math.PI) normalized -= Math.PI * 2;
    return normalized;
  }

  function approachAngle(current, target, maximumDelta) {
    const delta = normalizeAngle(target - current);
    return normalizeAngle(current + clamp(delta, -maximumDelta, maximumDelta));
  }

  function headingDirection(angle) {
    return directionForVector(Math.cos(angle), Math.sin(angle));
  }

  function chooseTurnHeading() {
    const margin = horizontalMargin(position.y);
    const nearLeft = position.x < margin + .08;
    const nearRight = position.x > 1 - margin - .08;
    const nearTop = position.y < MIN_Y + .055;
    const nearBottom = position.y > MAX_Y - .055;
    if (nearLeft) return -Math.PI * .12 + Math.random() * Math.PI * .24;
    if (nearRight) return Math.PI - Math.PI * .12 + Math.random() * Math.PI * .24;
    if (nearTop) return Math.PI * (.2 + Math.random() * .6);
    if (nearBottom) return -Math.PI * (.2 + Math.random() * .6);
    const turn = (Math.random() < .5 ? -1 : 1) * (Math.PI * (.18 + Math.random() * .28));
    return normalizeAngle(targetHeading + turn);
  }

  function switchWalkingDirection(direction) {
    if (direction === lastDirection || !readyDirections.has(direction)) return;
    const previous = activeVideo;
    const previousDuration = Number.isFinite(previous?.duration) && previous.duration > 0 ? previous.duration : 0;
    const phase = previousDuration ? previous.currentTime / previousDuration : 0;
    const next = videos[direction];
    const nextDuration = Number.isFinite(next.duration) && next.duration > 0 ? next.duration : 0;
    previous?.pause();
    lastDirection = direction;
    root.dataset.direction = direction;
    activeVideo = next;
    if (nextDuration) {
      try { next.currentTime = clamp(phase, 0, .999) * nextDuration; } catch { /* Le média se synchronisera à sa prochaine image. */ }
      lastMovementVideoTime = next.currentTime;
    }
    play(next);
    drawVideo(next);
  }

  function play(video, restart = false) {
    if (activeVideo && activeVideo !== video) activeVideo.pause();
    activeVideo = video;
    if (restart) {
      try { video.currentTime = 0; } catch { /* Le média n'est pas encore indexé. */ }
    }
    const promise = video.play();
    if (promise?.catch) promise.catch(() => {});
  }

  function scheduleNextWalk() {
    clearTimeout(idleTimer);
    if (suspended || readyDirections.size < Object.keys(SOURCES).length) return;
    const wait = IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
    idleTimer = window.setTimeout(() => beginWalk(randomDestination(), { wander: true }), wait);
  }

  function scheduleIdleLook() {
    clearTimeout(idleLookTimer);
    if (suspended || state !== 'idle') return;
    const wait = IDLE_LOOK_MIN_MS + Math.random() * (IDLE_LOOK_MAX_MS - IDLE_LOOK_MIN_MS);
    idleLookTimer = window.setTimeout(lookAround, wait);
  }

  function lookAround() {
    if (suspended || state !== 'idle') return;
    const currentIndex = DIRECTION_ORDER.indexOf(lastDirection);
    const offsets = Math.random() < .72 ? [-1, 1] : [-2, 2];
    if (Math.random() < .5) offsets.reverse();
    const direction = offsets
      .map(offset => DIRECTION_ORDER[(currentIndex + offset + DIRECTION_ORDER.length) % DIRECTION_ORDER.length])
      .find(candidate => readyIdleDirections.has(candidate));
    if (direction) {
      lastDirection = direction;
      root.dataset.direction = direction;
      enterAnimatedIdle(idleVideos[direction], false);
    }
    scheduleIdleLook();
  }

  function beginWalk(target, options = {}) {
    if (suspended || state === 'preparing' || state === 'walking') return false;
    origin = { ...position };
    destination = constrain(target);
    const dx = (destination.x - origin.x) * SCENE_WIDTH;
    const dy = (destination.y - origin.y) * SCENE_HEIGHT;
    const distance = Math.hypot(dx, dy);
    if (distance < 24) return false;
    clearTimeout(idleTimer);
    clearTimeout(idleLookTimer);
    lastDirection = directionForVector(dx, dy);
    if (!readyDirections.has(lastDirection)) return false;
    root.dataset.direction = lastDirection;
    wandering = options.wander === true;
    movementDistance = wandering ? clamp(distance * (1.25 + Math.random() * .65), 170, 560) : distance;
    const idealStride = strideForDepth((origin.y + destination.y) / 2, lastDirection);
    movementHalfSteps = Math.max(2, Math.ceil(movementDistance / (idealStride / 2)));
    movementStride = movementDistance * 2 / movementHalfSteps;
    movementDuration = movementDistance / (movementStride / .97) * 1000;
    movementCycleCount = 0;
    lastMovementVideoTime = 0;
    movementTrackDistance = 0;
    movementTravelled = 0;
    movementHeading = Math.atan2(dy, dx);
    targetHeading = movementHeading;
    nextTurnDistance = wandering ? 55 + Math.random() * 85 : Infinity;
    lastMovementUpdateAt = 0;
    state = 'preparing';
    root.dataset.state = state;
    idleFrameReady = false;
    const directionVideo = videos[lastDirection];
    activeVideo = directionVideo;
    prepareDirectionalMovement(directionVideo);
    return true;
  }

  function prepareDirectionalMovement(video) {
    if (state !== 'preparing' || activeVideo !== video) return;
    if (video.readyState >= 2) {
      startDirectionalMovement(video);
      return;
    }
    video.addEventListener('loadeddata', () => startDirectionalMovement(video), { once: true });
    video.load();
  }

  function startDirectionalMovement(video) {
    if (state !== 'preparing' || activeVideo !== video || suspended) return;
    try { video.currentTime = 0; } catch { /* Le média se placera sur sa première image au lancement. */ }
    root.dataset.renderedDirection = '';
    drawVideo(video);
    movementStartedAt = performance.now();
    movementCycleCount = 0;
    lastMovementVideoTime = 0;
    state = 'walking';
    root.dataset.state = state;
    play(video);
    if (video.requestVideoFrameCallback) {
      video.requestVideoFrameCallback(() => {
        if (state === 'walking' && activeVideo === video) drawVideo(video);
      });
    }
  }

  function settle(useCurrentPosition = false) {
    if (!useCurrentPosition) position = { ...destination };
    destination = { ...position };
    applyPosition();
    const idleVideo = idleVideos[lastDirection];
    if (idleVideo && readyIdleDirections.has(lastDirection)) {
      enterAnimatedIdle(idleVideo);
      return;
    }
    enterContactFrameIdle(activeVideo || videos[lastDirection]);
  }

  function enterAnimatedIdle(video, schedule = true) {
    state = 'idle';
    root.dataset.state = state;
    idleFrameReady = drawVideo(video);
    play(video, true);
    if (schedule) {
      scheduleNextWalk();
      scheduleIdleLook();
    }
  }

  function enterContactFrameIdle(video) {
    state = 'finishing';
    root.dataset.state = state;
    idleFrameReady = false;
    finishStartedAt = performance.now();
    activeVideo = video;
    if (video.readyState >= 2) play(video);
    else {
      video.addEventListener('loadeddata', () => {
        if (state === 'finishing' && activeVideo === video && !suspended) play(video);
      }, { once: true });
      video.load();
    }
  }

  function finishOnContactFrame(now) {
    const video = activeVideo;
    if (!video || video.readyState < 2) return;
    if (now - lastFrameTime >= 1000 / CHARACTER_RENDER_FPS) {
      drawVideo(video);
      lastFrameTime = now;
    }
    const duration = Number.isFinite(video.duration) && video.duration > 0 ? video.duration : 0;
    if (!duration) return;
    const target = duration * (REST_FRAME_RATIO[lastDirection] ?? .5);
    const delta = Math.abs(video.currentTime - target);
    const circularDelta = Math.min(delta, duration - delta);
    if (circularDelta > .055 && now - finishStartedAt < Math.max(1500, duration * 1500)) return;
    video.pause();
    idleFrameReady = drawVideo(video);
    state = 'idle';
    root.dataset.state = state;
    scheduleNextWalk();
    scheduleIdleLook();
  }

  function updateMovement(now) {
    const video = activeVideo;
    const duration = Number.isFinite(video?.duration) && video.duration > 0 ? video.duration : 0;
    let trackDistance;
    if (duration) {
      const currentTime = clamp(video.currentTime, 0, duration);
      if (currentTime + duration * .35 < lastMovementVideoTime) movementCycleCount += 1;
      lastMovementVideoTime = currentTime;
      const phase = gaitProgress(currentTime / duration);
      const halfCycle = phase * 2;
      const completedHalfSteps = Math.floor(halfCycle);
      const activeHalfStepProgress = halfCycle - completedHalfSteps;
      const totalHalfSteps = movementCycleCount * 2 + completedHalfSteps + activeHalfStepProgress;
      trackDistance = totalHalfSteps * (movementStride / 2);
    } else {
      trackDistance = (now - movementStartedAt) / 1000 * (movementStride / .97);
    }
    const deltaDistance = Math.max(0, trackDistance - movementTrackDistance);
    movementTrackDistance = Math.max(movementTrackDistance, trackDistance);
    const deltaSeconds = lastMovementUpdateAt ? Math.min((now - lastMovementUpdateAt) / 1000, .08) : 0;
    lastMovementUpdateAt = now;

    if (wandering && movementTravelled >= nextTurnDistance) {
      targetHeading = chooseTurnHeading();
      nextTurnDistance += 52 + Math.random() * 105;
    }
    movementHeading = approachAngle(movementHeading, targetHeading, TURN_RATE_RAD_PER_SECOND * deltaSeconds);
    switchWalkingDirection(headingDirection(movementHeading));

    const next = constrain({
      x: position.x + Math.cos(movementHeading) * deltaDistance / SCENE_WIDTH,
      y: position.y + Math.sin(movementHeading) * deltaDistance / SCENE_HEIGHT
    });
    const blockedX = Math.abs(next.x - position.x) < Math.abs(Math.cos(movementHeading) * deltaDistance / SCENE_WIDTH) * .25;
    const blockedY = Math.abs(next.y - position.y) < Math.abs(Math.sin(movementHeading) * deltaDistance / SCENE_HEIGHT) * .25;
    position = next;
    if (wandering && (blockedX || blockedY)) {
      targetHeading = chooseTurnHeading();
      nextTurnDistance = movementTravelled + 35 + Math.random() * 60;
    }
    movementTravelled = Math.min(movementDistance, movementTravelled + deltaDistance);
    applyPosition();
    if (movementTravelled >= movementDistance - .01) settle(true);
  }

  function frame(now) {
    raf = requestAnimationFrame(frame);
    if (suspended) return;
    if (state === 'walking') {
      updateMovement(now);
      if (now - lastFrameTime >= 1000 / CHARACTER_RENDER_FPS) {
        drawVideo(activeVideo);
        lastFrameTime = now;
      }
    } else if (state === 'finishing') {
      finishOnContactFrame(now);
    } else if (state === 'idle' && activeVideo?.dataset.motion === 'idle') {
      if (now - lastFrameTime >= 1000 / IDLE_RENDER_FPS) {
        drawVideo(activeVideo);
        lastFrameTime = now;
      }
    }
    updateDynamicLighting();
  }

  function pause() {
    if (suspended) return;
    suspended = true;
    suspendedAt = performance.now();
    clearTimeout(idleTimer);
    clearTimeout(idleLookTimer);
    [...Object.values(videos), ...Object.values(idleVideos)].forEach(video => video.pause());
    root.classList.add('is-paused');
  }

  function resume() {
    if (!suspended) return;
    const pausedDuration = performance.now() - suspendedAt;
    suspended = false;
    root.classList.remove('is-paused');
    if (state === 'walking') {
      movementStartedAt += pausedDuration;
      play(videos[lastDirection]);
    } else if (state === 'finishing') {
      finishStartedAt += pausedDuration;
      play(videos[lastDirection]);
    } else if (state === 'preparing') {
      prepareDirectionalMovement(videos[lastDirection]);
    } else {
      if (activeVideo?.dataset.motion === 'idle') play(activeVideo);
      scheduleNextWalk();
      scheduleIdleLook();
    }
  }

  function debugState() {
    return {
      state,
      suspended,
      direction: lastDirection,
      source: activeVideo?.src || SOURCES[lastDirection],
      motion: activeVideo?.dataset.motion || null,
      position: { ...position },
      destination: { ...destination },
      parent: root.parentElement?.id || null,
      idleFrameReady,
      readyDirections: readyDirections.size,
      readyIdleDirections: readyIdleDirections.size,
      movementStride,
      movementHalfSteps,
      movementDistance,
      movementDuration,
      movementTravelled,
      movementHeading,
      targetHeading,
      wandering
    };
  }

  function markDirectionReady(direction) {
    if (readyDirections.has(direction)) return;
    readyDirections.add(direction);
    if (direction === 'front' && state === 'loading' && readyIdleDirections.has('front')) enterAnimatedIdle(idleVideos.front);
    if (readyDirections.size === Object.keys(SOURCES).length && state === 'idle') scheduleNextWalk();
  }

  function markIdleDirectionReady(direction) {
    if (readyIdleDirections.has(direction)) return;
    readyIdleDirections.add(direction);
    if (direction === 'front' && state === 'loading' && readyDirections.has('front')) enterAnimatedIdle(idleVideos.front);
  }

  Object.entries(videos).forEach(([direction, video]) => {
    if (video.readyState >= 2) markDirectionReady(direction);
    else video.addEventListener('loadeddata', () => markDirectionReady(direction), { once: true });
  });
  Object.entries(idleVideos).forEach(([direction, video]) => {
    if (video.readyState >= 2) markIdleDirectionReady(direction);
    else video.addEventListener('loadeddata', () => markIdleDirectionReady(direction), { once: true });
  });

  window.addEventListener('athena:housing-rendered', attachToHousing);
  window.addEventListener('athena:housing-editing', event => {
    if (event.detail?.active) pause();
    else resume();
  });
  document.addEventListener('visibilitychange', () => {
    if (document.hidden) pause();
    else if (!document.querySelector('#housingLayer')?.classList.contains('is-editing')) resume();
  });

  attachToHousing();
  raf = requestAnimationFrame(frame);
  window.AthenaMinotaur = {
    pause,
    resume,
    stop() {
      if (state !== 'preparing' && state !== 'walking') return false;
      settle(true);
      return true;
    },
    walkTo(x, y) {
      return beginWalk({ x, y });
    },
    directionForVector,
    getState: debugState,
    destroy() {
      cancelAnimationFrame(raf);
      clearTimeout(idleTimer);
      clearTimeout(idleLookTimer);
      [...Object.values(videos), ...Object.values(idleVideos)].forEach(video => video.pause());
      root.remove();
      delete window.AthenaMinotaur;
    }
  };
})();
