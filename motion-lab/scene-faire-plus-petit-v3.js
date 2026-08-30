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
  let peepBody = null;
  let peepHead = null;

  function registerMotion() {
    if (!window.gsap || !window.Flip) return false;

    const plugins = [window.Flip, window.CustomEase].filter(Boolean);
    if (plugins.length) gsap.registerPlugin(...plugins);

    if (window.CustomEase) {
      // Fast visual decision, long clean landing. No bounce or elastic overshoot.
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

  function readPeepParts() {
    const doc = peep.contentDocument;
    if (!doc) return false;

    const groups = Array.from(doc.querySelectorAll('g'));
    peepBody = groups.find((node) => node.id === 'body/Explaining')
      || groups.find((node) => node.id.startsWith('body/'))
      || null;
    peepHead = groups.find((node) => node.id.startsWith('head/')) || null;

    if (peepBody) {
      gsap.set(peepBody, { transformOrigin: '50% 82%' });
    }
    if (peepHead) {
      gsap.set(peepHead, { transformOrigin: '50% 70%' });
    }

    return true;
  }

  function waitForPeep() {
    return new Promise((resolve) => {
      if (readPeepParts()) {
        resolve();
        return;
      }

      let finished = false;
      const finish = () => {
        if (finished) return;
        finished = true;
        readPeepParts();
        resolve();
      };

      peep.addEventListener('load', finish, { once: true });
      window.setTimeout(finish, 1800);
    });
  }

  function clearFlipResidue() {
    activeFlip?.kill();
    activeFlip = null;

    if (window.Flip) {
      Flip.killFlipsOf(tasks);
    }

    gsap.killTweensOf(tasks);
    board.classList.remove('is-focused');
    gsap.set(tasks, { clearProps: 'transform,opacity,width,height,left,top' });

    // Flush the start layout before capturing the next FLIP state.
    void board.offsetWidth;
  }

  function resetScene() {
    timeline?.kill();
    timeline = null;

    clearFlipResidue();

    gsap.killTweensOf([focusMeta, highlightArrow, finalCopy, peep]);
    if (peepBody) gsap.killTweensOf(peepBody);
    if (peepHead) gsap.killTweensOf(peepHead);

    gsap.set(focusMeta, { autoAlpha: 0, y: 7 });
    gsap.set(highlightArrow, { autoAlpha: 0, x: 12, y: 5 });
    gsap.set(finalCopy, { yPercent: 112 });
    gsap.set(peep, { x: 0, y: 0 });

    if (peepBody) {
      gsap.set(peepBody, { x: 0, y: 0, rotation: 0 });
    }
    if (peepHead) {
      gsap.set(peepHead, { x: 0, y: 0, rotation: 0 });
    }
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
      stagger: {
        each: 0.024,
        from: 'end'
      }
    });

    return activeFlip;
  }

  function buildTimeline() {
    resetScene();

    const focusFlip = makeFocusFlip();
    const clock = { progress: 0 };
    const tl = gsap.timeline({ paused: true });

    // Invisible clock pins the study to exactly 2.00 s.
    tl.to(clock, { progress: 1, duration: 2, ease: 'none' }, 0);

    // 0.28–0.50 — the character notices the visual problem.
    if (peepHead) {
      tl.to(peepHead, {
        x: -1,
        y: -1,
        rotation: -1.8,
        duration: 0.22,
        ease: 'power2.inOut'
      }, 0.28);
    } else {
      tl.to(peep, {
        y: 2,
        duration: 0.22,
        ease: 'power2.inOut'
      }, 0.28);
    }

    if (peepBody) {
      tl.to(peepBody, {
        x: -1,
        y: 1,
        duration: 0.28,
        ease: 'power2.inOut'
      }, 0.32);
    }

    // 0.48–1.25 — the only major visual move: many slips become one clear first step.
    tl.add(focusFlip, 0.48);

    // The information inside the chosen slip arrives only after the spatial decision is readable.
    tl.to(focusMeta, {
      autoAlpha: 1,
      y: 0,
      duration: 0.22,
      ease: ease('athenaSettle', 'power2.out')
    }, 1.06);

    // 1.13–1.40 — a real Highlights SVG is used as a single editorial accent.
    tl.to(highlightArrow, {
      autoAlpha: 0.92,
      x: 0,
      y: 0,
      duration: 0.27,
      ease: ease('athenaFocus', 'power3.out')
    }, 1.13);

    // Character settle: tiny response, not a puppet performance.
    if (peepBody) {
      tl.to(peepBody, {
        x: 0,
        y: 0,
        rotation: 0,
        duration: 0.30,
        ease: ease('athenaSettle', 'power2.out')
      }, 1.16);
    }
    if (peepHead) {
      tl.to(peepHead, {
        x: 0,
        y: 0,
        rotation: 0.6,
        duration: 0.30,
        ease: ease('athenaSettle', 'power2.out')
      }, 1.16)
        .to(peepHead, {
          rotation: 0,
          duration: 0.18,
          ease: 'power1.out'
        }, 1.44);
    }

    // 1.42–1.80 — copy is revealed through a mask window; no floating fade-in.
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
