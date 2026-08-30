(function () {
  const replayButton = document.getElementById('replay');
  const reduceButton = document.getElementById('toggleMotion');
  const knotPath = document.getElementById('knotPath');
  const guidePath = document.getElementById('guidePath');
  const initialKnot = knotPath.getAttribute('d');
  const finalPath = guidePath.getAttribute('d');
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');
  let reduced = reducedMedia.matches;
  let timeline = null;

  function ready() {
    if (!window.gsap) return false;

    const plugins = [window.MorphSVGPlugin, window.DrawSVGPlugin, window.CustomEase].filter(Boolean);
    if (plugins.length) gsap.registerPlugin(...plugins);

    if (window.CustomEase) {
      CustomEase.create('athenaTension', 'M0,0 C0.18,0 0.28,1 1,1');
      CustomEase.create('athenaUnwind', 'M0,0 C0.16,0.02 0.22,1 1,1');
      CustomEase.create('athenaStep', 'M0,0 C0.22,0 0.18,1 1,1');
    }

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

  function resetScene() {
    timeline?.kill();
    gsap.killTweensOf('*');

    knotPath.setAttribute('d', initialKnot);
    knotPath.setAttribute('stroke-width', '16');

    gsap.set('#knotGroup', {
      x: 0,
      y: 0,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      transformOrigin: '50% 50%'
    });

    gsap.set('#knotPath', { autoAlpha: 1 });
    if (window.DrawSVGPlugin) gsap.set('#knotPath', { drawSVG: '3% 97%' });

    gsap.set('#character', {
      x: 0,
      y: 0,
      rotation: 0,
      transformOrigin: '50% 100%'
    });

    gsap.set('#head', { rotation: 0, transformOrigin: '50% 80%' });
    gsap.set('#torso', { y: 0, rotation: 0, transformOrigin: '50% 70%' });
    gsap.set('#armBack,#armFront', { rotation: 0, transformOrigin: '50% 5%' });
    gsap.set('#legBack,#legFront', { rotation: 0, transformOrigin: '50% 5%' });
    gsap.set('#footBack,#footFront', { rotation: 0, transformOrigin: '50% 50%' });
    gsap.set('#shadow', { scaleX: 1, opacity: 0.10, transformOrigin: '50% 50%' });
    gsap.set('#spark', { autoAlpha: 0, scale: 0.72, transformOrigin: '50% 50%' });
    gsap.set('#copy', { autoAlpha: 0, y: 8 });
  }

  function showReducedState() {
    resetScene();
    knotPath.setAttribute('d', finalPath);
    knotPath.setAttribute('stroke-width', '10');
    if (window.DrawSVGPlugin) gsap.set('#knotPath', { drawSVG: '0% 100%' });
    gsap.set('#character', { x: 38 });
    gsap.set('#spark', { autoAlpha: 0.82, scale: 1 });
    gsap.set('#copy', { autoAlpha: 1, y: 0 });
  }

  function buildTimeline() {
    resetScene();

    const tl = gsap.timeline({ paused: true });

    // 0.00–0.38 — tension contenue. Rien ne flotte gratuitement.
    tl.to('#knotGroup', {
      y: -2,
      rotation: -0.45,
      scaleX: 1.012,
      scaleY: 0.986,
      duration: 0.18,
      ease: 'sine.inOut'
    }, 0)
      .to('#knotGroup', {
        y: 0,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        duration: 0.20,
        ease: 'sine.inOut'
      }, 0.18);

    // 0.34–0.62 — les deux extrémités du trait deviennent lisibles.
    if (window.DrawSVGPlugin) {
      tl.to('#knotPath', {
        drawSVG: '0% 100%',
        duration: 0.28,
        ease: ease('athenaTension', 'power2.out')
      }, 0.34);
    }

    // 0.62–1.36 — le nœud ne casse pas : il se résout en un seul chemin.
    if (window.MorphSVGPlugin) {
      tl.to('#knotPath', {
        morphSVG: '#guidePath',
        duration: 0.74,
        ease: ease('athenaUnwind', 'power3.inOut')
      }, 0.62);
    } else {
      tl.to('#knotPath', {
        autoAlpha: 0,
        duration: 0.18,
        ease: 'power2.out',
        onComplete() {
          knotPath.setAttribute('d', finalPath);
        }
      }, 0.62)
        .to('#knotPath', { autoAlpha: 1, duration: 0.34 }, 0.82);
    }

    tl.to('#knotPath', {
      attr: { 'stroke-width': 10 },
      duration: 0.58,
      ease: 'power2.inOut'
    }, 0.72)
      .to('#knotGroup', {
        rotation: 0,
        duration: 0.40,
        ease: 'power2.out'
      }, 0.96);

    // 1.30–1.58 — un seul repère apparaît. Pas de confettis, pas de récompense artificielle.
    tl.to('#spark', {
      autoAlpha: 0.92,
      scale: 1,
      duration: 0.24,
      ease: 'back.out(1.7)'
    }, 1.30)
      .to('#copy', {
        autoAlpha: 1,
        y: 0,
        duration: 0.30,
        ease: 'power2.out'
      }, 1.42);

    // 1.48–2.00 — anticipation du corps puis un seul vrai pas.
    tl.to('#head', {
      rotation: 2.5,
      duration: 0.13,
      ease: 'power1.inOut'
    }, 1.48)
      .to('#torso', {
        y: -2,
        rotation: 1,
        duration: 0.13,
        ease: 'power1.inOut'
      }, 1.48)
      .to('#legFront', {
        rotation: -16,
        duration: 0.16,
        ease: 'power2.out'
      }, 1.55)
      .to('#legBack', {
        rotation: 12,
        duration: 0.16,
        ease: 'power2.out'
      }, 1.55)
      .to('#armFront', {
        rotation: 8,
        duration: 0.16,
        ease: 'power2.out'
      }, 1.55)
      .to('#armBack', {
        rotation: -7,
        duration: 0.16,
        ease: 'power2.out'
      }, 1.55)
      .to('#character', {
        x: 38,
        y: -4,
        duration: 0.34,
        ease: ease('athenaStep', 'power2.inOut')
      }, 1.58)
      .to('#shadow', {
        scaleX: 1.12,
        opacity: 0.065,
        duration: 0.16,
        ease: 'sine.out'
      }, 1.58)
      .to('#legFront', {
        rotation: 2,
        duration: 0.18,
        ease: 'power2.inOut'
      }, 1.72)
      .to('#legBack', {
        rotation: -2,
        duration: 0.18,
        ease: 'power2.inOut'
      }, 1.72)
      .to('#armFront,#armBack', {
        rotation: 0,
        duration: 0.18,
        ease: 'power2.inOut'
      }, 1.72)
      .to('#head', {
        rotation: 0,
        duration: 0.18,
        ease: 'power2.out'
      }, 1.74)
      .to('#torso', {
        y: 0,
        rotation: 0,
        duration: 0.18,
        ease: 'power2.out'
      }, 1.74)
      .to('#character', {
        y: 0,
        duration: 0.10,
        ease: 'power2.out'
      }, 1.90)
      .to('#shadow', {
        scaleX: 1,
        opacity: 0.10,
        duration: 0.20,
        ease: 'sine.out'
      }, 1.80)
      .to('#spark', {
        autoAlpha: 0.82,
        duration: 0.01
      }, 1.99);

    return tl;
  }

  function play() {
    if (!ready()) return;
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
  play();
})();
