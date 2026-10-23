/*! athena-motion.js 1.0 — le petit moteur du mouvement (passe du 19/10). Les règles, durées et courbes : commun/athena-motion.css (jetons --t-*, --c-*).
 *   <athena-chiffre valeur="120"></athena-chiffre>              // le chiffre défile jusqu’à la nouvelle valeur et grossit un instant quand il reçoit
 *   AthenaMotion.voler({ conteneur, de, vers, icone, jeu, n })   // 3 à 8 petites icônes partent en arc de « de » vers « vers » (éléments ou {x, y}) ; promesse
 *   AthenaMotion.tirable(feuille, { fermer })                     // on tire la feuille vers le bas pour la fermer (seuil : 120 px ou 30 % de sa hauteur, ou une vitesse franche)
 *   AthenaMotion.grossir(el)                                      // l’élément grossit un instant (le coffre qui avale, un compteur qui reçoit)
 *   AthenaMotion.vibrer('tap' | 'sommet')                         // Android : 10 ms à la validation, un motif court au Sommet ; rien d’autre
 *   AthenaMotion.fete('quete' | 'sommet' | 'grand', { conteneur }) // promesse tenue à la fin de la fête ; un grand moment se passe d’un toucher
 *   AthenaMotion.reduit(el)                                        // vrai en mouvement réduit : data-mouvement du téléphone, sinon le réglage de l’appareil
 * En mouvement réduit : les chiffres changent d’un coup, rien ne vole, les fêtes durent 120 ms, la poignée ferme sans glisser. */
(function (W) {
  const D = W.document;
  const JETONS = { tap: 120, court: 200, moyen: 320, long: 520, fete: 900, sommet: 2600, grand: 3600 };
  const COURBES = { sortie: 'cubic-bezier(.2,.8,.2,1)', entree: 'cubic-bezier(.5,0,.9,.5)', ressort: 'cubic-bezier(.34,1.45,.64,1)' };
  const VIBRATIONS = { tap: [10], sommet: [30, 50, 30, 50, 80] };
  const reduit = el => { const r = el && el.closest ? el.closest('[data-mouvement]') : null; if (r) return r.getAttribute('data-mouvement') === 'reduit'; return !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches); };
  const duree = (nom, el) => { if (reduit(el)) return nom === 'tap' ? 0 : 120; let v = NaN; try { v = el ? parseFloat(getComputedStyle(el).getPropertyValue('--t-' + nom)) : NaN; } catch (e) {} return isNaN(v) ? (JETONS[nom] || 320) : v; };
  const num = v => { if (v == null) return null; const n = parseFloat(String(v).replace(/[\s  ]/g, '').replace(',', '.')); return isNaN(n) ? null : n; };
  const centre = (p, R, K) => { if (!p) return null; if (p.getBoundingClientRect) { const r = p.getBoundingClientRect(); if (!r.width && !r.height) return null; return { x: (r.left + r.width / 2 - R.left) / K, y: (r.top + r.height / 2 - R.top) / K }; } return { x: +p.x || 0, y: +p.y || 0 }; };

  /* Compteur : <athena-chiffre valeur="…"> ; l’attribut change, le chiffre défile (--t-long) et grossit si la valeur monte */
  class Chiffre extends HTMLElement {
    static get observedAttributes() { return ['valeur']; }
    connectedCallback() { if (this._ok) return; this._ok = true; const v = this.getAttribute('valeur'); this.textContent = v == null ? '' : v; this._v = num(v); }
    disconnectedCallback() { if (this._raf) cancelAnimationFrame(this._raf); this._raf = null; }
    attributeChangedCallback(n, a, b) { if (!this._ok || a === b) return; this.vers(b); }
    vers(val) {
      const to = num(val), from = this._v; if (this._raf) { cancelAnimationFrame(this._raf); this._raf = null; }
      if (to == null || from == null || reduit(this) || Math.abs(to - from) < 1) { this.textContent = val == null ? '' : val; this._v = to; return; }
      const d = duree('long', this), t0 = performance.now(), pas = now => { const u = Math.min(1, (now - t0) / d), e = 1 - Math.pow(1 - u, 3); this.textContent = String(Math.round(from + (to - from) * e)); if (u < 1) this._raf = requestAnimationFrame(pas); else { this.textContent = val; this._v = to; this._raf = null; } };
      this._raf = requestAnimationFrame(pas);
      if (to > from) grossir(this, d);
    }
  }
  if (W.customElements && !W.customElements.get('athena-chiffre')) W.customElements.define('athena-chiffre', Chiffre);

  function grossir(el, d) { if (!el || reduit(el)) return; el.removeAttribute('data-recoit'); void el.offsetWidth; el.setAttribute('data-recoit', '1'); clearTimeout(el._grosT); el._grosT = setTimeout(() => el.removeAttribute('data-recoit'), (d || duree('long', el)) + 60); }

  /* Ressources qui volent : n icônes (3 à 8) décalées de 45 ms, chacune sur son propre arc ; le conteneur doit être positionné (le téléphone l’est) */
  function voler(o) {
    o = o || {}; const C = o.conteneur, n = Math.max(3, Math.min(8, o.n || 5)); if (!C || reduit(C) || !C.getBoundingClientRect) return Promise.resolve();
    const R = C.getBoundingClientRect(), K = (R.width && C.offsetWidth) ? R.width / C.offsetWidth : 1, P0 = centre(o.de, R, K), P2 = centre(o.vers, R, K); if (!P0 || !P2 || !D.body.animate) return Promise.resolve();
    if (getComputedStyle(C).position === 'static') C.style.position = 'relative';
    const t = o.taille || 18, dur = o.duree || duree('fete', C), dx = P2.x - P0.x, dy = P2.y - P0.y, L = Math.hypot(dx, dy) || 1, proms = [];
    for (let i = 0; i < n; i++) {
      const el = D.createElement('span'); el.setAttribute('data-vol', '1'); el.setAttribute('aria-hidden', 'true');
      el.style.cssText = 'display:flex;width:' + t + 'px;height:' + t + 'px;margin:' + (-t / 2) + 'px 0 0 ' + (-t / 2) + 'px;color:' + (o.couleur || 'inherit') + ';filter:drop-shadow(0 1px 2px rgba(20,10,20,.35))';
      el.innerHTML = o.html || ('<athena-icone nom="' + (o.icone || 'piece') + '" jeu="' + (o.jeu || 'r2') + '" taille="' + t + '"></athena-icone>');
      C.appendChild(el);
      /* arc : point de contrôle décalé de côté (une icône sur deux à gauche, l’autre à droite) et vers le haut */
      const cote = (i % 2 ? 1 : -1) * (.18 + .3 * Math.random()) * Math.min(L, 260), nx = -dy / L * cote, ny = dx / L * cote, cx = P0.x + dx / 2 + nx + (Math.random() - .5) * 24, cy = P0.y + dy / 2 + ny - (30 + 50 * Math.random());
      const N = 18, frames = [];
      for (let k = 0; k <= N; k++) { const u = k / N, w = 1 - u, x = w * w * P0.x + 2 * w * u * cx + u * u * P2.x, y = w * w * P0.y + 2 * w * u * cy + u * u * P2.y, sc = u < .3 ? .55 + u / .3 * .55 : 1.1 - (u - .3) / .7 * .35; frames.push({ transform: 'translate(' + x.toFixed(1) + 'px,' + y.toFixed(1) + 'px) scale(' + sc.toFixed(2) + ')', opacity: u < .08 ? u / .08 : (u > .88 ? (1 - u) / .12 : 1), offset: u }); }
      const a = el.animate(frames, { duration: dur * (.85 + Math.random() * .3), delay: i * 45, easing: 'cubic-bezier(.35,0,.25,1)', fill: 'both' });
      proms.push(new Promise(r => { let fini = false; const fin = () => { if (fini) return; fini = true; el.remove(); r(); }; a.onfinish = fin; a.oncancel = fin; setTimeout(fin, dur * 1.2 + i * 45 + 250); }));
    }
    return Promise.all(proms).then(() => { if (o.vers && o.vers.getBoundingClientRect && o.grossir !== false) grossir(o.vers); });
  }

  /* Poignée des feuilles : on tire depuis les 72 premiers pixels (ou [data-poignee]) ; au-delà du seuil ou d’un geste vif, la feuille part et « fermer » est appelé ; sinon elle revient en ressort */
  function tirable(el, o) {
    if (!el || el.__tirable) return; el.__tirable = true; o = o || {}; const zone = o.zone || 72; let g = null;
    const fin = () => { el.style.transition = ''; el.style.transform = ''; };
    const down = e => { if (e.button || g) return; const t = e.target; if (t.closest && t.closest('button,a,input,select,textarea,[role="tab"],[role="button"],[role="slider"],[role="radio"]') && !t.closest('[data-poignee]')) return;
      const r = el.getBoundingClientRect(); if (e.clientY - r.top > zone && !(t.closest && t.closest('[data-poignee]'))) return;
      g = { y0: e.clientY, y: 0, v: 0, t: performance.now(), id: e.pointerId, actif: false }; };
    const move = e => { if (!g || e.pointerId !== g.id) return; const dy = Math.max(0, e.clientY - g.y0), now = performance.now(); g.v = .6 * g.v + .4 * ((dy - g.y) / Math.max(1, now - g.t)); g.t = now; g.y = dy;
      if (!g.actif && dy > 6) { g.actif = true; el.style.transition = 'none'; try { el.setPointerCapture(g.id); } catch (x) {} }
      if (g.actif) { el.style.transform = reduit(el) ? '' : 'translateY(' + dy + 'px)'; if (e.cancelable) e.preventDefault(); } };
    const up = e => { if (!g || e.pointerId !== g.id) return; const G = g; g = null; if (!G.actif) return; const h = el.getBoundingClientRect().height || 400;
      if (G.y > Math.min(120, h * .3) || G.v > .6) { const d = duree('court', el); el.style.transition = 'transform ' + d + 'ms ' + COURBES.entree; el.style.transform = 'translateY(110%)'; setTimeout(() => { fin(); if (o.fermer) o.fermer(); }, Math.max(0, d - 10)); }
      else { const d = duree('moyen', el); el.style.transition = 'transform ' + d + 'ms ' + COURBES.ressort; el.style.transform = ''; setTimeout(fin, d + 40); } };
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up);
  }

  function vibrer(k) { const m = VIBRATIONS[k]; if (!m || !W.navigator || typeof W.navigator.vibrate !== 'function') return false; try { return !!W.navigator.vibrate(m); } catch (e) { return false; } }

  /* Les trois niveaux de fête : la promesse se tient à la fin ; un grand moment se passe d’un toucher (après 250 ms, pour ne pas avaler le toucher qui l’a lancé) */
  function fete(niveau, o) { o = o || {}; const C = o.conteneur || D, el = o.el || (C.nodeType === 1 ? C : null), d = o.duree || duree(niveau === 'grand' ? 'grand' : niveau === 'sommet' ? 'sommet' : 'fete', el);
    return new Promise(r => { let fini = false, t = null; const fin = () => { if (fini) return; fini = true; clearTimeout(t); C.removeEventListener('pointerdown', fin, true); r(); }; t = setTimeout(fin, d); if (niveau === 'grand' && o.passer !== false) setTimeout(() => { if (!fini) C.addEventListener('pointerdown', fin, true); }, 250); }); }

  W.AthenaMotion = { version: '1.0', jetons: JETONS, courbes: COURBES, vibrations: VIBRATIONS, reduit, duree, grossir, voler, tirable, vibrer, fete, Chiffre };
})(window);
