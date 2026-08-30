(function () {
  const replayButton = document.getElementById('replay');
  const reduceButton = document.getElementById('toggleMotion');
  let timeline = null;

  function ensureGsap() {
    if (!window.gsap) {
      document.getElementById('message').textContent = 'GSAP manque dans motion-lab/vendor/gsap.';
      document.getElementById('supporting').textContent = 'Lance scripts/setup-assets.ps1 puis recharge la page.';
      return false;
    }

    const plugins = [window.CustomEase, window.MorphSVGPlugin, window.DrawSVGPlugin, window.MotionPathPlugin, window.Flip].filter(Boolean);
    if (plugins.length) gsap.registerPlugin(...plugins);
    return true;
  }

  function resetScene() {
    gsap.killTweensOf('*');
    gsap.set('#taskMass', { autoAlpha: 1, scale: 1, x: 0, y: 0, transformOrigin: '50% 50%' });
    gsap.set('#pieces', { autoAlpha: 0, x: 0, y: 0 });
    gsap.set('.piece', { autoAlpha: 1, x: 0, y: 0, rotation: 0, scale: 1, transformOrigin: '50% 50%' });
    gsap.set('#focusPiece', { scale: 1 });
    gsap.set('#person', { x: 0, y: 0, rotation: 0, transformOrigin: '50% 100%' });
    gsap.set('#armLeft,#armRight,#legLeft,#legRight', { rotation: 0, transformOrigin: '50% 0%' });
    gsap.set('#highlightStroke', { autoAlpha: 0 });
    document.getElementById('stepLabel').textContent = 'Quand tout paraît énorme…';
    document.getElementById('message').textContent = 'Ne cherche pas à tout faire.';
    document.getElementById('supporting').textContent = 'Réduis la tâche jusqu’à trouver une première action qui paraît faisable.';
  }

  function buildTimeline() {
    resetScene();
    const A = window.AthenaMotion;
    const tl = gsap.timeline({ defaults: { ease: 'power2.out' } });

    if (A.reduced) {
      tl.set('#taskMass', { autoAlpha: 0 }, 0.1)
        .set('#pieces', { autoAlpha: 1 }, 0.1)
        .set('.piece:not(#focusPiece)', { autoAlpha: 0 }, 0.2)
        .set('#highlightStroke', { autoAlpha: 1 }, 0.2)
        .set('#person', { x: 48 }, 0.2)
        .call(() => {
          document.getElementById('stepLabel').textContent = 'Réduire';
          document.getElementById('message').textContent = 'Choisis un seul morceau.';
        }, null, 0.2);
      return tl;
    }

    A.pulse(tl, '#taskMass', 0.25, { scale: 1.055, duration: 0.32 });
    tl.to('#person', { x: -9, rotation: -2.5, duration: 0.32, ease: 'power2.out' }, 0.32)
      .to('#armRight', { rotation: -12, duration: 0.24 }, 0.34)
      .to('#armLeft', { rotation: 9, duration: 0.24 }, 0.34)
      .to('#taskMass', { scale: 1.09, duration: 0.34, ease: 'power2.inOut' }, 0.78)
      .to('#taskMass', { autoAlpha: 0, scale: 0.92, duration: 0.2 }, 1.16)
      .set('#pieces', { autoAlpha: 1 }, 1.2);

    A.scatter(tl, '.piece', 1.22, { distance: 14, duration: 0.42 });

    tl.call(() => {
      document.getElementById('stepLabel').textContent = 'Découper';
      document.getElementById('message').textContent = 'Rends la tâche plus petite.';
    }, null, 1.28)
      .to('.piece:not(#focusPiece)', { autoAlpha: 0.18, scale: 0.82, duration: 0.35, stagger: 0.05 }, 1.78)
      .to('#focusPiece', { x: -56, y: 52, duration: 0.58, ease: 'power3.inOut' }, 1.82);

    A.focus(tl, '#focusPiece', 2.22, { scale: 1.22, duration: 0.42 });
    A.draw(tl, '#highlightStroke', 2.3, { duration: 0.55 });

    tl.to('#person', { x: 48, y: -8, rotation: 0, duration: 0.62, ease: 'power2.inOut' }, 2.38)
      .to('#legLeft', { rotation: 11, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 2.38)
      .to('#legRight', { rotation: -11, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 2.38)
      .to('#armLeft', { rotation: -8, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 2.38)
      .to('#armRight', { rotation: 8, duration: 0.18, yoyo: true, repeat: 3, ease: 'sine.inOut' }, 2.38)
      .call(() => {
        document.getElementById('stepLabel').textContent = 'Commencer';
        document.getElementById('message').textContent = 'Choisis un seul morceau.';
        document.getElementById('supporting').textContent = 'Le premier pas n’a pas besoin d’être impressionnant. Il doit juste être faisable.';
      }, null, 2.74)
      .to('#focusPiece', { scale: 1, duration: 0.42, ease: 'back.out(1.5)' }, 3.0);

    return tl;
  }

  function play() {
    if (!ensureGsap()) return;
    timeline?.kill();
    timeline = buildTimeline();
  }

  replayButton.addEventListener('click', play);
  reduceButton.addEventListener('click', () => {
    AthenaMotion.setReduced(!AthenaMotion.reduced);
    reduceButton.setAttribute('aria-pressed', String(AthenaMotion.reduced));
    reduceButton.textContent = AthenaMotion.reduced ? 'Mouvement réduit : oui' : 'Mouvement réduit';
    play();
  });

  AthenaMotion.setReduced(window.matchMedia('(prefers-reduced-motion: reduce)').matches);
  reduceButton.setAttribute('aria-pressed', String(AthenaMotion.reduced));
  play();
})();
