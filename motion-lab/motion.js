(function () {
  const reducedMedia = window.matchMedia('(prefers-reduced-motion: reduce)');

  const AthenaMotion = {
    reduced: reducedMedia.matches,

    setReduced(value) {
      this.reduced = Boolean(value);
      document.documentElement.dataset.reducedMotion = this.reduced ? 'true' : 'false';
    },

    duration(value) {
      return this.reduced ? 0.01 : value;
    },

    reset(targets, vars) {
      if (!window.gsap) return;
      gsap.set(targets, vars);
    },

    reveal(tl, target, at, options = {}) {
      const { y = 12, duration = 0.4, stagger = 0 } = options;
      return tl.fromTo(target,
        { autoAlpha: 0, y },
        { autoAlpha: 1, y: 0, duration: this.duration(duration), stagger, ease: 'power2.out' },
        at
      );
    },

    pulse(tl, target, at, options = {}) {
      const { scale = 1.05, duration = 0.34 } = options;
      return tl.to(target, {
        scale,
        transformOrigin: '50% 50%',
        duration: this.duration(duration),
        ease: 'power1.inOut',
        yoyo: true,
        repeat: 1
      }, at);
    },

    scatter(tl, targets, at, options = {}) {
      const { distance = 24, duration = 0.5 } = options;
      const nodes = gsap.utils.toArray(targets);
      return tl.to(nodes, {
        x: (i) => (i - (nodes.length - 1) / 2) * distance,
        y: (i) => (i % 2 === 0 ? -1 : 1) * distance * 0.35,
        rotation: (i) => (i - 1.5) * 7,
        duration: this.duration(duration),
        stagger: this.reduced ? 0 : 0.04,
        ease: 'power2.out'
      }, at);
    },

    settle(tl, target, at, options = {}) {
      const { duration = 0.45 } = options;
      return tl.to(target, {
        x: 0,
        y: 0,
        rotation: 0,
        scale: 1,
        duration: this.duration(duration),
        ease: this.reduced ? 'none' : 'back.out(1.35)'
      }, at);
    },

    draw(tl, target, at, options = {}) {
      const { duration = 0.5 } = options;
      if (window.DrawSVGPlugin && !this.reduced) {
        gsap.set(target, { drawSVG: '0% 0%' });
        return tl.to(target, { drawSVG: '0% 100%', duration, ease: 'power2.out' }, at);
      }
      return tl.fromTo(target, { autoAlpha: 0 }, { autoAlpha: 1, duration: this.duration(duration) }, at);
    },

    focus(tl, target, at, options = {}) {
      const { scale = 1.18, duration = 0.5 } = options;
      return tl.to(target, {
        scale,
        transformOrigin: '50% 50%',
        duration: this.duration(duration),
        ease: this.reduced ? 'none' : 'back.out(1.6)'
      }, at);
    }
  };

  reducedMedia.addEventListener?.('change', (event) => AthenaMotion.setReduced(event.matches));
  window.AthenaMotion = AthenaMotion;
})();
