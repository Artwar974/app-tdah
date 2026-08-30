(function () {
  const replayButton = document.getElementById('replay');
  const reduceButton = document.getElementById('toggleMotion');
  const timeReadout = document.getElementById('timeReadout');
  let timeline = null;

  function ensureGsap() {
    if (!window.gsap) {
      timeReadout.textContent = 'GSAP ?';
      return false;
    }

    if (window.DrawSVGPlugin) {
      gsap.registerPlugin(window.DrawSVGPlugin);
    }

    return true;
  }

  function setReduced(value) {
    const reduced = Boolean(value);
    document.documentElement.dataset.reducedMotion = reduced ? 'true' : 'false';
    reduceButton.setAttribute('aria-pressed', String(reduced));
    reduceButton.textContent = reduced ? 'Mouvement réduit : oui' : 'Mouvement réduit';
    return reduced;
  }

  function resetScene() {
    gsap.killTweensOf([
      '#taskMass', '#character', '#splitStroke', '.piece', '#highlightArrow',
      '#focusPiece', '#finalCopy', '#stepMark', '#progressBar'
    ]);

    gsap.set('#taskMass', {
      autoAlpha: 1,
      x: 0,
      y: 0,
      scale: 1,
      transformOrigin: '50% 50%'
    });

    gsap.set('#character', {
      autoAlpha: 1,
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: '50% 92%'
    });

    gsap.set('.piece', {
      autoAlpha: 0,
      x: 0,
      y: 12,
      scale: 1,
      rotation: 0,
      transformOrigin: '50% 50%'
    });

    gsap.set('#focusPiece', { x: 0, y: 12, scale: 1 });
    gsap.set('#highlightArrow', { autoAlpha: 0, x: -20, y: 0, scale: 1 });
    gsap.set('#finalCopy', { autoAlpha: 0, y: 10 });
    gsap.set('#stepMark', { autoAlpha: 0, scaleX: 0 });
    gsap.set('#progressBar', { scaleX: 0 });

    if (window.DrawSVGPlugin) {
      gsap.set('#splitStroke', { drawSVG: '0% 0%', autoAlpha: 1 });
    } else {
      gsap.set('#splitStroke', { autoAlpha: 0 });
    }

    timeReadout.textContent = '0.00 s';
  }

  function showReducedState() {
    resetScene();
    gsap.set('#taskMass', { autoAlpha: 0 });
    gsap.set('.piece', { autoAlpha: 0.18, y: 0, scale: 0.82 });
    gsap.set('#focusPiece', { autoAlpha: 1, x: -54, y: 42, scale: 1 });
    gsap.set('#highlightArrow', { autoAlpha: 0.82, x: 0 });
    gsap.set('#character', { x: 38, y: 0, rotation: 0 });
    gsap.set('#finalCopy', { autoAlpha: 1, y: 0 });
    gsap.set('#stepMark', { autoAlpha: 1, scaleX: 1 });
    gsap.set('#progressBar', { scaleX: 1 });
    timeReadout.textContent = '2.00 s';
  }

  function buildTimeline() {
    resetScene();

    const tl = gsap.timeline({
      paused: true,
      defaults: { ease: 'power2.out' },
      onUpdate() {
        const t = Math.min(tl.time(), 2);
        timeReadout.textContent = `${t.toFixed(2)} s`;
      },
      onComplete() {
        timeReadout.textContent = '2.00 s';
      }
    });

    // Progress bar mirrors the exact 2-second duration.
    tl.to('#progressBar', {
      scaleX: 1,
      duration: 2,
      ease: 'none'
    }, 0);

    // 0.00–0.25 — tiny breath / anticipation.
    tl.to('#taskMass', {
      scale: 1.025,
      duration: 0.18,
      ease: 'sine.inOut'
    }, 0)
      .to('#taskMass', {
        scale: 1,
        duration: 0.16,
        ease: 'sine.inOut'
      }, 0.18);

    // 0.25–0.55 — the task pushes forward, the character recoils.
    tl.to('#taskMass', {
      x: -12,
      y: 3,
      scale: 1.04,
      duration: 0.30,
      ease: 'power2.inOut'
    }, 0.25)
      .to('#character', {
        x: -10,
        y: 2,
        rotation: -2.5,
        duration: 0.30,
        ease: 'power2.out'
      }, 0.25);

    // 0.55–0.95 — a hand-drawn cut reveals four smaller chunks.
    if (window.DrawSVGPlugin) {
      tl.to('#splitStroke', {
        drawSVG: '0% 100%',
        duration: 0.27,
        ease: 'power2.out'
      }, 0.55);
    } else {
      tl.to('#splitStroke', {
        autoAlpha: 1,
        duration: 0.08
      }, 0.55);
    }

    tl.to('#taskMass', {
      autoAlpha: 0,
      scale: 0.94,
      duration: 0.18,
      ease: 'power2.out'
    }, 0.64)
      .to('.piece', {
        autoAlpha: 1,
        y: 0,
        duration: 0.18,
        stagger: 0.06,
        ease: 'back.out(1.45)'
      }, 0.70)
      .to('#splitStroke', {
        autoAlpha: 0,
        duration: 0.10,
        ease: 'power1.out'
      }, 0.88);

    // 0.95–1.30 — noise recedes, the smallest action remains dominant.
    tl.to('.piece:not(#focusPiece)', {
      autoAlpha: 0.18,
      scale: 0.82,
      duration: 0.30,
      stagger: 0.03,
      ease: 'power2.out'
    }, 1.00)
      .to('#highlightArrow', {
        autoAlpha: 0.82,
        x: 0,
        duration: 0.22,
        ease: 'power2.out'
      }, 1.03);

    // 1.22–1.65 — focus piece travels toward the character and settles.
    tl.to('#focusPiece', {
      x: -54,
      y: 42,
      duration: 0.35,
      ease: 'power3.inOut'
    }, 1.22)
      .to('#focusPiece', {
        scale: 1.20,
        duration: 0.22,
        ease: 'back.out(2.2)'
      }, 1.25)
      .to('#focusPiece', {
        scale: 1,
        duration: 0.18,
        ease: 'power2.out'
      }, 1.47);

    // 1.65–2.00 — one decisive step, then stop. No extra flourish.
    tl.to('#character', {
      x: 38,
      y: -8,
      rotation: 0,
      duration: 0.35,
      ease: 'power2.inOut'
    }, 1.65)
      .to('#character', {
        y: 0,
        duration: 0.18,
        ease: 'power2.out'
      }, 1.82)
      .fromTo('#stepMark',
        { autoAlpha: 0, scaleX: 0 },
        { autoAlpha: 1, scaleX: 1, duration: 0.22, ease: 'power2.out' },
        1.70
      )
      .to('#finalCopy', {
        autoAlpha: 1,
        y: 0,
        duration: 0.22,
        ease: 'power2.out'
      }, 1.68);

    return tl;
  }

  function play() {
    if (!ensureGsap()) return;

    timeline?.kill();
    const reduced = document.documentElement.dataset.reducedMotion === 'true';

    if (reduced) {
      showReducedState();
      return;
    }

    timeline = buildTimeline();
    timeline.play(0);
  }

  replayButton.addEventListener('click', play);
  reduceButton.addEventListener('click', () => {
    const next = document.documentElement.dataset.reducedMotion !== 'true';
    setReduced(next);
    play();
  });

  const systemReduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  setReduced(systemReduced);
  play();
})();
