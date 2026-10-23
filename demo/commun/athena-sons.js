/*! athena-sons.js 3.0 — les sons de la V1 : des notes douces, toutes dans la même gamme (ré majeur pentatonique), générées par WebAudio.
 * Notes de chaque son : athena-v1.js (V.JEU.sons) ; libellés : V.SONS. Passe du 19/10 : la validation a 7 variantes (jamais deux fois la même
 * d’affilée), le coffre tinte plus longtemps quand il y a plus à ramasser (3 à 12 notes), chaque palier du Mont monte d’un ton, le Sommet et les
 * grands moments ont une petite fanfare (2 à 4 s, plus forte), et les boutons un clic très doux, coupé par défaut.
 *   AthenaSons.jouer('valide', 'marimba')                 // timbre « marimba » (Figures · rév. 2) ou « veillee » (Veillée d’origine)
 *   AthenaSons.jouer('coffre', 'marimba', { n: 24 })      // n : la quantité ramassée (bois + or)
 *   AthenaSons.jouer('mont', 'marimba', { palier: 3 })    // palier 1 à 4
 *   AthenaSons.jouer('fanfare' | 'clic' | 'tap' | 'envol' | 'niveau' | 'surprise' | 'temple', timbre)
 * Le navigateur n’autorise le son qu’après un premier toucher. L’ancienne version reste dans Archives/Coulisses/commun. */
(function (W) {
let A = null; const dernier = {};
const ctx = () => { A = A || new (W.AudioContext || W.webkitAudioContext)(); if (A.state === 'suspended') A.resume(); return A; };
/* une note : f en Hz, t départ (s), dur (s), gain, marimba (sinus + partiel) ou veillée (triangle, plus long) */
function note(f, t, dur, gain, m) {
  const o = A.createOscillator(), g = A.createGain();
  o.type = m ? 'sine' : 'triangle'; o.frequency.value = f;
  g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(gain, t + (m ? .006 : .02)); g.gain.exponentialRampToValueAtTime(.0001, t + dur);
  o.connect(g); g.connect(A.destination); o.start(t); o.stop(t + dur + .05);
  if (m) { const o2 = A.createOscillator(), g2 = A.createGain(); o2.type = 'sine'; o2.frequency.value = f * 3.9; g2.gain.setValueAtTime(0, t); g2.gain.linearRampToValueAtTime(gain * .28, t + .004); g2.gain.exponentialRampToValueAtTime(.0001, t + Math.min(.12, dur)); o2.connect(g2); g2.connect(A.destination); o2.start(t); o2.stop(t + .15); }
}
/* une suite de notes régulières (le son historique) */
function suite(N, m, ecart, dur, gain) { const t0 = A.currentTime; N.forEach((f, i) => note(f, t0 + i * ecart, dur, gain, m)); }
/* choisir une variante, jamais la même que la précédente */
function variante(k, L) { if (!L.length) return null; let i = Math.floor(Math.random() * L.length); if (L.length > 1 && i === dernier[k]) i = (i + 1 + Math.floor(Math.random() * (L.length - 1))) % L.length; dernier[k] = i; return L[i]; }
W.AthenaSons = {
  version: '3.0',
  jouer(k, timbre, o) {
    try {
      const S = (W.ATHENA_V1 && W.ATHENA_V1.JEU && W.ATHENA_V1.JEU.sons) || {}, m = timbre !== 'veillee'; o = o || {}; ctx();
      const g = m ? .09 : .06, dur = m ? .34 : .6;
      if (k === 'valide') { const L = Array.isArray(S.valide && S.valide[0]) ? S.valide : [S.valide || [587, 740, 880]]; const N = variante('valide', L); const ecart = .07 + Math.random() * .04; suite(N, m, ecart, dur * (.9 + Math.random() * .4), g); return; }
      if (k === 'coffre') { const base = S.coffre || [880, 988, 1109, 1319, 1480, 1760], n = Math.max(3, Math.min(12, Math.round(3 + (o.n || 0) / 4))), t0 = A.currentTime; for (let i = 0; i < n; i++) note(base[(i + Math.floor(i / base.length)) % base.length] * (i % 3 === 2 ? 1.001 : 1), t0 + i * (.075 + .01 * (i % 2)), m ? .22 : .4, g * .8, m); return; }
      if (k === 'mont') { const M = S.mont || [587, 659, 740, 880], p = Math.max(1, Math.min(M.length, o.palier || 1)), t0 = A.currentTime; note(M[p - 1], t0, m ? .5 : .8, g * 1.1, m); note(M[p - 1] * 1.5, t0 + .11, m ? .45 : .7, g * .7, m); return; }
      if (k === 'fanfare' || k === 'grand') {
        const F = S.fanfare || [[294, .18], [370, .18], [440, .18], [587, .4], [440, .18], [587, .18], [740, .18], [880, .6], [1175, .9]], G = g * 1.5; let t = A.currentTime + .02;
        F.forEach(([f, d], i) => { note(f, t, d + .15, G, m); if (i === F.length - 1) { note(f * .75, t, d + .3, G * .5, m); note(f * .5, t, d + .4, G * .4, m); } else if (i >= F.length - 3) note(f * .5, t, d + .1, G * .35, m); t += d; });
        if (k === 'grand') { for (let i = 0; i < 3; i++) note(F[F.length - 1][0] * [1, 1.5, 2][i], t + i * .12, .8, G * .5, m); }
        return;
      }
      if (k === 'clic') { const t0 = A.currentTime, o1 = A.createOscillator(), g1 = A.createGain(); o1.type = 'sine'; o1.frequency.setValueAtTime((S.clic && S.clic[0]) || 1760, t0); o1.frequency.exponentialRampToValueAtTime(900, t0 + .02); g1.gain.setValueAtTime(0, t0); g1.gain.linearRampToValueAtTime(.028, t0 + .003); g1.gain.exponentialRampToValueAtTime(.0001, t0 + .03); o1.connect(g1); g1.connect(A.destination); o1.start(t0); o1.stop(t0 + .05); return; }
      const N = S[k] || S.tap || [587]; suite(Array.isArray(N[0]) ? N[0] : N, m, .09, dur, g);
    } catch (e) {}
  }
};
})(window);
