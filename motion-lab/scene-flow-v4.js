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
    gsap.set(tasks, { clearProps: 'transform,opacity,visibility,width,height,left,top' });
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
      duration: 0.66,
      absolute: true,
      scale: true,
      props: 'opacity',
      ease: ease('athenaFocus', 'power3.out'),
      stagger: {
        each: 0.016,
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

    // Invisible clock: the whole study is exactly 2.00 seconds.
    tl.to(clock, { progress: 1, duration: 2, ease: 'none' }, 0);

    // 0.00–0.52: everything enters as a single visual sentence.
    tl.to(softDisc, {
      autoAlpha: 1,
      scale: 1,
      rotation: -7,
      duration: 0.44,
      ease: ease('athenaArrive', 'power3.out')
    }, 0.00);

    tl.to(tasks, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      duration: 0.34,
      ease: ease('athenaArrive', 'power3.out'),
      stagger: 0.045
    }, 0.04);

    tl.to(peep, {
      autoAlpha: 1,
      x: 0,
      y: 0,
      duration: 0.36,
      ease: ease('athenaArrive', 'power3.out')
    }, 0.08);

    // 0.28–0.56: one restrained breath of compression creates anticipation.
    tl.to(taskField, {
      scale: 0.982,
      duration: 0.15,
      ease: 'power2.inOut'
    }, 0.28)
      .to(taskField, {
        scale: 1,
        duration: 0.13,
        ease: ease('athenaSettle', 'power2.out')
      }, 0.43);

    // 0.58–1.24: many possibilities resolve into one next action.
    tl.call(resolveHierarchy, null, 0.58);

    // The character reacts inside the same movement, not as a second animation.
    tl.to(peep, {
      x: -6,
      y: -3,
      duration: 0.28,
      ease: 'power2.inOut'
    }, 0.66)
      .to(peep, {
        x: 0,
        y: 0,
        duration: 0.32,
        ease: ease('athenaSettle', 'power2.out')
      }, 0.99);

    // 0.95–1.38: meaning arrives while the spatial move is landing.
    tl.to(duration, {
      autoAlpha: 1,
      y: 0,
      duration: 0.25,
      ease: ease('athenaText', 'power3.out')
    }, 0.95);

    tl.to(accentArrow, {
      autoAlpha: 0.94,
      x: 0,
      y: 0,
      duration: 0.30,
      ease: ease('athenaText', 'power3.out')
    }, 1.00);

    tl.set(focusPulse, { autoAlpha: 0.52, scale: 0.70 }, 1.02)
      .to(focusPulse, {
        autoAlpha: 0,
        scale: 1.56,
        duration: 0.36,
        ease: 'power2.out'
      }, 1.02);

    // 1.24–1.86: conclusion reveals through a mask while everything else settles.
    tl.to(copy, {
      yPercent: 0,
      duration: 0.44,
      ease: ease('athenaText', 'power3.out')
    }, 1.24);

    tl.to(underline, {
      xPercent: 0,
      duration: 0.34,
      ease: ease('athenaText', 'power3.out')
    }, 1.50);

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

    // Remove animation overrides so the final CSS hierarchy remains intact.
    gsap.set(tasks, { clearProps: 'transform,opacity,visibility,width,height,left,top' });
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
