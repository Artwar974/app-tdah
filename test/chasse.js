// La chasse aux bugs : chaque écran d'Écrans dans le prototype, un profil / une DA / une taille donnés ; erreurs de console,
// cibles sous 44 px, textes coupés (débordement), défilement horizontal du téléphone ; une vignette par écran.
const { URL, lancer, routerCdn } = require('./_commun.js');   // navigateur, URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const fs = require('fs');
const [profil, da, taille, prefix, suffixe] = [process.argv[2] || 'enfant', process.argv[3] || 'r2', process.argv[4] || 'ref', process.argv[5] || 'ch', process.argv[6] || ''];
const ecrans = JSON.parse(fs.readFileSync('ecrans.json', 'utf8')).filter(e => !process.env.CHASSE_IDS || process.env.CHASSE_IDS.split(',').includes(e.id));   /* CHASSE_IDS=a,b,c pour une sonde ciblée */
(async () => {
  const b = await lancer();
  const p = await b.newPage({ viewport: { width: 1280, height: 1000 } });
  await routerCdn(p);
  let errs = []; p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 140))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 140)); });
  const rapport = [];
  for (let i = 0; i < ecrans.length; i++) {
    const e = ecrans[i]; errs = [];
    const q = e.q + '&profil=' + profil + '&da=' + da + '&taille=' + taille + '&fige=1' + suffixe;
    if (i === 0) { await p.goto(URL + 'Prototype.dc.html#' + q, { waitUntil: 'load' }); await p.waitForTimeout(6000); }
    else { await p.evaluate(h => { location.hash = h; }, q); await p.waitForTimeout(1800); }
    await p.evaluate(() => { window.__calmeT = null; });
    await p.waitForFunction(() => { const run = document.getAnimations().some(a => a instanceof CSSAnimation && a.playState === 'running' && !(a.effect && a.effect.getTiming().iterations === Infinity) && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('[data-scene]'))); const t = performance.now(); if (run || window.__calmeT == null) window.__calmeT = t; return t - window.__calmeT > 700; }, null, { timeout: 6000, polling: 150 }).catch(() => {});   /* les transitions CSS et le décor vivant ne comptent pas : seules les animations finies de l'interface (entrée d'une carte…) */   /* une carte qui entre encore (parfois après quelques secondes : Sommet, niveau) fausserait la mesure : on attend 0,7 s de calme */
    const r = await p.evaluate(async detail => {
      const encore = () => document.getAnimations().some(a => a instanceof CSSAnimation && a.playState === 'running' && !(a.effect && a.effect.getTiming().iterations === Infinity) && !(a.effect && a.effect.target && a.effect.target.closest && a.effect.target.closest('[data-scene]')));
      for (let k = 0; k < 4 && encore(); k++) await new Promise(res => setTimeout(res, 500));   /* une carte entrée entre le dernier sondage et la mesure */
      const ph = document.querySelector('[data-screen-label="Prototype V1"]'); if (!ph) return { manque: true };
      const R = ph.getBoundingClientRect(), K = R.width / ph.offsetWidth || 1, vis = el => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && r.bottom > R.top && r.top < R.bottom && r.right > R.left && r.left < R.right; };
      const petits = [...ph.querySelectorAll('button, [role="button"], a, input, [tabindex="0"]')].filter(el => vis(el) && !el.disabled && getComputedStyle(el).visibility !== 'hidden').map(el => { const r = el.getBoundingClientRect(); return { w: Math.round(r.width / K), h: Math.round(r.height / K), t: (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 30) }; }).filter(x => x.w < 44 || x.h < 44);
      const coupes = [...ph.querySelectorAll('span, p, div, button')].filter(el => vis(el) && el.children.length === 0 && el.textContent.trim().length > 2 && el.scrollWidth > el.clientWidth + 2 && getComputedStyle(el).overflow !== 'visible' && getComputedStyle(el).textOverflow !== 'ellipsis').map(el => el.textContent.trim().slice(0, 40));
      const masque = el => !!el.closest('[aria-live][style*="clip-path"]');
      const defile = el => { let a = el.parentElement; while (a && a !== ph) { const o = getComputedStyle(a).overflowX; if (o === 'auto' || o === 'scroll') return true; a = a.parentElement; } return false; };   /* une rangée qui défile (catégories, onglets) dépasse par construction */
      const abreges = [...ph.querySelectorAll('span, p, div, button')].filter(el => vis(el) && el.textContent.trim().length > 2 && el.scrollWidth > el.clientWidth && getComputedStyle(el).textOverflow === 'ellipsis' && getComputedStyle(el).overflow !== 'visible' && !masque(el)).map(el => el.textContent.trim().slice(0, 40));   /* feuille ou non : l'ellipse peut être sur le parent du texte */   /* un texte abrégé d'un « … » se lit mal */
      const larges = [...ph.querySelectorAll('*')].filter(el => { const r = el.getBoundingClientRect(); return r.width > 0 && (r.right > R.right + 2 || r.left < R.left - 2) && getComputedStyle(el).position !== 'fixed' && !el.closest('[data-scene]') && el.tagName !== 'CANVAS' && !masque(el) && !el.closest('[data-vol]') && !el.closest('[data-rayons]') && !defile(el); })   /* les rayons derrière l'icône d'une carte sont un décor rogné par le téléphone */.map(el => { const r = el.getBoundingClientRect(); return el.tagName.toLowerCase() + (el.getAttribute('data-el') ? '[' + el.getAttribute('data-el') + ']' : '') + ' « ' + (el.getAttribute('aria-label') || el.textContent || '').trim().slice(0, 24) + ' » ' + Math.round((r.left - R.left) / K) + '…' + Math.round((r.right - R.left) / K) + (detail ? ' {' + [...el.attributes].map(a => a.name + '=' + a.value.slice(0, 60)).join(' ') + ' | parent ' + el.parentElement.tagName + '[' + (el.parentElement.getAttribute('data-el') || '') + '] anim=' + getComputedStyle(el).animationName + '}' : ''); });
      return { petits: petits.slice(0, 6), coupes: coupes.slice(0, 6), abreges: abreges.slice(0, 6), large: larges.length, larges: larges.slice(0, 4) };
    }, !!process.env.CHASSE_DETAIL);
    const ph = await p.$('[data-screen-label="Prototype V1"]');
    if (ph) await ph.screenshot({ path: `${prefix}_${String(i).padStart(2, '0')}_${e.id}.png`, animations: 'disabled', timeout: 15000 }).catch(() => {});   /* une animation sans fin ne doit pas arrêter la chasse */
    const pb = [];
    if (errs.length) pb.push('erreurs : ' + [...new Set(errs)].join(' | '));
    if (r.petits && r.petits.length) pb.push('cibles < 44 px : ' + r.petits.map(x => x.w + '×' + x.h + ' « ' + x.t + ' »').join(', '));
    if (r.coupes && r.coupes.length) pb.push('textes coupés : ' + r.coupes.join(' | '));
    if (r.abreges && r.abreges.length) pb.push('textes abrégés : ' + r.abreges.join(' | '));
    if (r.large) pb.push('éléments hors du téléphone : ' + r.large + ' (' + r.larges.join(', ') + ')');
    if (pb.length) rapport.push(e.id + ' (' + e.q + ') : ' + pb.join(' ; '));
    process.stdout.write((pb.length ? '✗ ' : '· ') + e.id + (pb.length ? ' — ' + pb.join(' ; ').slice(0, 200) : '') + '\n');
  }
  fs.writeFileSync(`${prefix}_rapport.txt`, rapport.join('\n'));
  await b.close();
})();
