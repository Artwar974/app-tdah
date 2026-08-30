(function () {
  const board = document.getElementById('taskBoard');
  const tasks = Array.from(document.querySelectorAll('.task-slip'));
  const focusMeta = document.getElementById('focusMeta');
  const highlightArrow = document.getElementById('highlightArrow');
  const finalCopy = document.getElementById('finalCopy');
  const peep = document.getElementById('peep');
  const replayButton = document.getElementById('replay');
  const reduceButton = document.getElementById('toggleMotion');
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

  let reduced = reducedMedia.matches;
  let timeline = null;
  let activeFlip = null;

  function registerMotion() {
    if (!window.gsap || !window.Flip) return false;

    const plugins = [window.Flip, window.CustomEase].filter(Boolean);
    if (plugins.length) gsap.registerPlugin(...plugins);

    if (window.CustomEase) {
      CustomEase.create('athenaFocus', '.22,1,.36,1');
      CustomEase.create('athenaSettle', '.25,.75,.25,1');
    }

    gsap.config({ force3D: 'auto' });
    return true;
  }

  function ease(name, fallback) {
    return window.CustomEase ? name : fallback;
  }

  function syncReducedUi() {
    document.documentElement.dataset.reducedMotion = reduced ? 'true' : 'false';
    reduceButton.setAttribute('aria-pressed', String(reduced));
    reduceButton.textContent = reduced ? 'Mouvement réduit : oui' : 'Mouvement réduit';
  }

  function waitForPeep() {
    if (peep.complete && peep.naturalWidth) return Promise.resolve();

    return Promise.race([
      new Promise((resolve) => peep.addEventListener('load', resolve, { once: true })),
      new Promise((resolve) => window.setTimeout(resolve, 1200))
    ]);
  }

  function clearFlipResidue() {
    activeFlip?.kill();
    activeFlip = null;

    if (window.Flip) Flip.killFlipsOf(tasks);

    gsap.killTweensOf(tasks);
    board.classList.remove('is-focused');
    gsap.set(tasks, { clearProps: 'transform,opacity,width,height,left,top' });

    // Force the initial layout before the next FLIP capture.
    void board.offsetWidth;
  }

  function resetScene() {
    timeline?.kill();
    timeline = null;

    clearFlipResidue();

    gsap.killTweensOf([focusMeta, highlightArrow, finalCopy, peep]);
    gsap.set(focusMeta, { autoAlpha: 0, y: 7 });
    gsap.set(highlightArrow, { autoAlpha: 0, x: 12, y: 5 });
    gsap.set(finalCopy, { yPercent: 112 });
    gsap.set(peep, { x: 0, y: 0, rotation: 0, transformOrigin: '50% 100%' });
  }

  function makeFocusFlip() {
    const state = Flip.getState(tasks, { props: 'opacity' });
    board.classList.add('is-focused');

    activeFlip = Flip.from(state, {
      paused: true,
      duration: 0.70,
      absolute: true,
      scale: true,
      props: 'opacity',
      ease: ease('athenaFocus', 'power3.out'),
      stagger: { each: 0.024, from: 'end' }
    });

    return activeFlip;
  }

  function buildTimeline() {
    resetScene();

    const focusFlip = makeFocusFlip();
    const clock = { progress: 0 };
    const tl = gsap.timeline({ paused: true });

    // Exact 2.00 s study duration.
    tl.to(clock, { progress: 1, duration: 2, ease: 'none' }, 0);

    // 0.28–0.52 — tiny editorial reaction only; the illustration stays intact.
    tl.to(peep, {
      x: -3,
      y: 1,
      rotation: -0.55,
      duration: 0.24,
      ease: 'power2.inOut'
    }, 0.28);

    // 0.48–1.25 — primary motion: four competing tasks resolve into one first step.
    tl.add(focusFlip, 0.48);

    // Information appears after the spatial hierarchy is already understood.
    tl.to(focusMeta, {
      autoAlpha: 1,
      y: 0,
      duration: 0.22,
      ease: ease('athenaSettle', 'power2.out')
    }, 1.06);

    // One real Highlights SVG, used only as a visual pointer.
    tl.to(highlightArrow, {
      autoAlpha: 0.92,
      x: 0,
      y: 0,
      duration: 0.27,
      ease: ease('athenaFocus', 'power3.out')
    }, 1.13);

    // Character settles as the visual problem resolves.
    tl.to(peep, {
      x: 0,
      y: 0,
      rotation: 0,
      duration: 0.34,
      ease: ease('athenaSettle', 'power2.out')
    }, 1.13);

    // Copy rises through a fixed mask window, avoiding a generic fade-in.
    tl.to(finalCopy, {
      yPercent: 0,
      duration: 0.38,
      ease: ease('athenaFocus', 'power3.out')
    }, 1.42);

    return tl;
  }

  function showReducedState() {
    resetScene();
    board.classList.add('is-focused');
    gsap.set(tasks, { clearProps: 'transform,opacity,width,height,left,top' });
    gsap.set(focusMeta, { autoAlpha: 1, y: 0 });
    gsap.set(highlightArrow, { autoAlpha: 0.92, x: 0, y: 0 });
    gsap.set(finalCopy, { yPercent: 0 });
  }

  function play() {
    syncReducedUi();

    if (reduced) {
      showReducedState();
      return;
    }

    timeline = buildTimeline();
    timeline.play(0);
  }

  async function boot() {
    if (!registerMotion()) return;
    await waitForPeep();
    play();
  }

  replayButton.addEventListener('click', play);
  reduceButton.addEventListener('click', () => {
    reduced = !reduced;
    play();
  });

  reducedMedia.addEventListener?.('change', (event) => {
    reduced = event.matches;
    play();
  });

  syncReducedUi();
  boot();
})();
