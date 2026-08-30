(function () {
  const taskField = document.getElementById('taskField');
  const tasks = Array.from(document.querySelectorAll('.task'));
  const duration = document.getElementById('duration');
  const accentArrow = document.getElementById('accentArrow');
  const focusPulse = document.getElementById('focusPulse');
  const peep = document.getElementById('peep');
  const copy = document.getElementById('copy');
  const underline = document.getElementById('underline');
  const softDisc = document.getElementById('softDisc');
  const replayButton = document.getElementById('replay');
  const reduceButton = document.getElementById('toggleMotion');
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

  let reduced = reducedMedia.matches;
  let timeline = null;
  let activeFlip = null;

  const entryOffsets = [
    { x: -34, y: -18 },
    { x: 30, y: -10 },
    { x: -28, y: 13 },
    { x: 32, y: 20 }
  ];

  function registerMotion() {
    if (!window.gsap || !window.Flip) return false;

    const plugins = [window.Flip, window.CustomEase].filter(Boolean);
    gsap.registerPlugin(...plugins);

    if (window.CustomEase) {
      CustomEase.create('athenaArrive', '.16,1,.30,1');
      CustomEase.create('athenaFocus', '.20,.92,.24,1');
      CustomEase.create('athenaText', '.22,1,.36,1');
      CustomEase.create('athenaSettle', '.25,.72,.28,1');
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

  function killScene() {
    timeline?.kill();
    timeline = null;

    activeFlip?.kill();
    activeFlip = null;
    Flip.killFlipsOf(tasks);

    gsap.killTweensOf([
      ...tasks,
      taskField,
      duration,
      accentArrow,
      focusPulse,
      peep,
      copy,
      underline,
      softDisc
    ]);
  }

  function resetScene() {
    killScene();

    taskField.classList.remove('is-resolved');
    gsap.set(taskField, { clearProps: 'transform' });
    gsap.set(tasks, { clearProps: 'transform,opacity,width,height,left,top' });
    void taskField.offsetWidth;

    tasks.forEach((task, index) => {
      gsap.set(task, {
        autoAlpha: 0,
        x: entryOffsets[index].x,
        y: entryOffsets[index].y,
        scale: 0.945
      });
    });

    gsap.set(taskField, { scale: 1, transformOrigin: '50% 50%' });
    gsap.set(duration, { autoAlpha: 0, y: 10 });
    gsap.set(accentArrow, { autoAlpha: 0, x: 18, y: 7 });
    gsap.set(focusPulse, { autoAlpha: 0, scale: 0.65 });
    gsap.set(peep, { autoAlpha: 0, x: 18, y: 10 });
    gsap.set(copy, { yPercent: 112 });
    gsap.set(underline, { xPercent: -105 });
    gsap.set(softDisc, { autoAlpha: 0, scale: 0.88, rotation: -12 });
  }

  function resolveHierarchy() {
    if (reduced) return;

    activeFlip?.kill();
    Flip.killFlipsOf(tasks);

    const state = Flip.getState(tasks, { props: 'opacity' });
    taskField.classList.add('is-resolved');

    activeFlip = Flip.from(state, {
      duration: 0.70,
      absolute: true,
      scale: true,
      props: 'opacity',
      ease: ease('athenaFocus', 'power3.out'),
      stagger: {
        each: 0.018,
        from: 'end'
      },
      onComplete: () => {
        activeFlip = null;
      }
    });
  }

  function buildTimeline() {
    resetScene();

    const clock = { progress: 0 };
    const tl = gsap.timeline({ paused: true });

    // This invisible clock keeps the complete study exactly 2.00 seconds long.
    tl.to(clock, { progress: 1, duration: 2, ease: 'none' }, 0);

    // 0.00–0.46: scene arrives as one continuous gesture, not four separate pop-ins.
    tl.to(softDisc, {
      autoAlpha: 1,
      scale: 1,
      rotation: -7,
      duration: 0.46,
      ease: ease('athenaArrive', 'power3.out')
    }, 0.00);

    tl.to(tasks, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.42,
      ease: ease('athenaArrive', 'power3.out'),
      stagger: 0.055
    }, 0.045);

    tl.to(peep, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: 0.40,
      ease: ease('athenaArrive', 'power3.out')
    }, 0.10);

    // 0.34–0.58: a restrained compression creates anticipation before the decision.
    tl.to(taskField, {
      scale: 0.982,
      duration: 0.18,
      ease: 'power2.inOut'
    }, 0.34)
      .to(taskField, {
        scale: 1,
        duration: 0.16,
        ease: ease('athenaSettle', 'power2.out')
      }, 0.50);

    // 0.56–1.26: the whole hierarchy resolves in one FLIP movement.
    tl.call(resolveHierarchy, null, 0.56);

    // Small human response overlaps the reorganisation instead of waiting for it.
    tl.to(peep, {
      x: -6,
      y: -3,
      duration: 0.30,
      ease: 'power2.inOut'
    }, 0.68)
      .to(peep, {
        x: 0,
        y: 0,
        duration: 0.34,
        ease: ease('athenaSettle', 'power2.out')
      }, 1.05);

    // 0.93–1.36: selected action gains meaning only after the spatial decision is readable.
    tl.to(duration, {
      autoAlpha: 1,
      y: 0,
      duration: 0.27,
      ease: ease('athenaText', 'power3.out')
    }, 0.93);

    tl.to(accentArrow, {
      autoAlpha: 0.94,
      x: 0,
      y: 0,
      duration: 0.31,
      ease: ease('athenaText', 'power3.out')
    }, 0.99);

    // One pulse, once: punctuation rather than decoration.
    tl.set(focusPulse, { autoAlpha: 0.54, scale: 0.70 }, 1.02)
      .to(focusPulse, {
        autoAlpha: 0,
        scale: 1.58,
        duration: 0.38,
        ease: 'power2.out'
      }, 1.02);

    // 1.25–1.88: conclusion slides through a mask while the scene is already settling.
    tl.to(copy, {
      yPercent: 0,
      duration: 0.44,
      ease: ease('athenaText', 'power3.out')
    }, 1.25);

    tl.to(underline, {
      xPercent: 0,
      duration: 0.34,
      ease: ease('athenaText', 'power3.out')
    }, 1.52);

    // Tiny end settle keeps the final frame alive without adding a new event.
    tl.to(softDisc, {
      scale: 1.015,
      duration: 0.30,
      ease: ease('athenaSettle', 'power1.out')
    }, 1.58);

    return tl;
  }

  function showReducedState() {
    resetScene();
    taskField.classList.add('is-resolved');

    gsap.set(tasks, { clearProps: 'transform,opacity,width,height,left,top', autoAlpha: 1 });
    gsap.set(duration, { autoAlpha: 1, y: 0 });
    gsap.set(accentArrow, { autoAlpha: 0.94, x: 0, y: 0 });
    gsap.set(focusPulse, { autoAlpha: 0 });
    gsap.set(peep, { autoAlpha: 1, x: 0, y: 0 });
    gsap.set(copy, { yPercent: 0 });
    gsap.set(underline, { xPercent: 0 });
    gsap.set(softDisc, { autoAlpha: 1, scale: 1.015, rotation: -7 });
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
  registerMotion() && play();
})();
