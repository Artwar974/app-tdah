// Lot 6 · le décor : la rafale ordonnée, la fumée qui suit le vent, la jauge du feu, les lucioles près des plantes, l'étoile filante du Sommet,
// les mouettes sur le ponton, les transitions de l'heure sans saut, les copeaux et la fête de fin de chantier, l'onglet caché, animations légères
const { URL, ESPION, lancer, routerCdn } = require('./_commun.js');   // navigateur, espion de la scène, URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const res = []; const ok = (nom, cond, info) => { res.push(cond); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
(async () => {
  const b = await lancer();
  const ouvrir = async (url, o) => { const p = await b.newPage({ viewport: o && o.petit ? { width: 230, height: 620 } : { width: 1280, height: 950 } }); const errs = []; await p.addInitScript(ESPION);
    await routerCdn(p);
    p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    await p.goto(URL + url, { waitUntil: 'load' }); await p.waitForFunction(() => (window.scene || window.__scene) && (window.scene || window.__scene).temps > .2, null, { timeout: 60000 }).catch(() => {}); p.errs = errs; return p; };
  const sc = p => p.evaluate(() => (window.scene || window.__scene));
  const clic = async (p, t) => { await p.click('button:has-text("' + t + '")'); await p.waitForTimeout(80); };
  const attendre = async (p, s, f, max = 240) => { const t0 = await p.evaluate(() => (window.scene || window.__scene).temps), r0 = Date.now(); while (true) { await p.waitForTimeout(120); const t = await p.evaluate(() => (window.scene || window.__scene).temps); if (f && await f(t - t0)) return true; if (t - t0 >= s || Date.now() - r0 > max * 1000) return false; } };
  const heure = async (p, h) => { await p.evaluate(h => { const i = document.getElementById('heure'); i.value = h; i.dispatchEvent(new Event('input')); }, h); };
  // couleur moyenne de la scène : le rendu est relancé puis recopié tout de suite dans un canevas 2D (même tâche : le tampon est encore là) ; l'extracteur de Pixi donnait des images alternées
  const moyenne = p => p.evaluate(() => { const s = window.scene; s.app.renderer.render(s.app.stage); const c = document.createElement('canvas'); c.width = 48; c.height = 104; const g = c.getContext('2d'); g.drawImage(s.app.canvas, 0, 0, 48, 104); const d = g.getImageData(0, 0, 48, 104).data; let r = 0, gg = 0, bb = 0, n = 0; for (let i = 0; i < d.length; i += 4) { r += d[i]; gg += d[i + 1]; bb += d[i + 2]; n++; } return [r / n, gg / n, bb / n]; });
  // 1 · Camp-scene : la rafale (une seule, de gauche à droite, puis le calme), la fumée suit le vent
  let p = await ouvrir('Camp-scene.html?heure=10.25', { petit: true });
  await p.evaluate(() => window.scene.rafale(-220, 1.2, 160)); const xs = []; await attendre(p, 9, async () => { const v = await p.evaluate(() => window.scene.vie.rafale); xs.push(v); return !v[2] && xs.length > 5; });
  const avance = xs.every((v, i) => !i || v[0] >= xs[i - 1][0] - 1), finie = !xs[xs.length - 1][2];
  ok('1 vent : une rafale traverse le camp de gauche à droite (x croissant) puis s’éteint', avance && finie && xs.length > 3, `${xs.length} relevés, x de ${xs[0][0]} à ${xs[xs.length - 1][0]}, active à la fin=${xs[xs.length - 1][2]}`);
  const calme = await p.evaluate(() => window.scene.vie.rafale[2]); ok('1 vent : un moment de calme après la rafale', !calme);
  // 1 · la jauge du feu : la lumière du feu suit (uniforme uFeu[2] du fond), la teinte en braises est plus rouge, le dessin garde sa taille
  const lect = () => p.evaluate(() => { const s = window.scene, f = s.app.stage.children[0].children.find(c => c.children.some(m => m.shader)).children.find(m => m.shader), u = f.shader.resources.u.uniforms, e = s.element('feu'); const sp = [...s.app.stage.children[0].children].flatMap(c => c.children).find(c => c.images && c.position && Math.abs(c.position.x - e.x) < 1); return { feu: +u.uFeu[2].toFixed(4), jauge: s.vie.jauge, tint: sp ? sp.tint : null, h: sp ? Math.round(sp.height) : null }; });
  await heure(p, 22.5); await attendre(p, 1.2); const j0 = await lect(); await clic(p, 'Braises'); await attendre(p, 1.2); const jb = await lect(); await clic(p, 'Ardent'); await attendre(p, 1.2); const ja = await lect(); await clic(p, 'Stable');
  ok('1 feu, une jauge : braises = moins de lumière et plus rouge ; ardent = plus de lumière ; même taille de dessin', jb.feu < j0.feu * .75 && ja.feu > j0.feu * 1.15 && jb.tint !== j0.tint && jb.h === j0.h && ja.h === j0.h, JSON.stringify({ stable: j0, braises: jb, ardent: ja }));
  // 1 · la nuit : les lucioles près de la lavande et du laurier ; au Sommet de nuit, une étoile filante
  await attendre(p, 2); const luc = await p.evaluate(() => { const s = window.scene, L = s.vie.lucioles, la = s.element('lavande'), lo = s.element('laurier'); return { n: L.length, pres: L.filter(([x, y]) => [la, lo].some(o => o && Math.hypot(x - o.x, y - (o.y - 20)) < 80)).length }; });
  ok('1 nuit : les lucioles vivent près de la lavande et du laurier', luc.n >= 8 && luc.pres === luc.n, JSON.stringify(luc));
  await p.evaluate(() => window.scene.emettre('sommet')); const filante = await attendre(p, 2, async () => p.evaluate(() => window.scene.vie.filante)); ok('1 nuit : au Sommet, une étoile filante', filante);
  // 1 · les mouettes se posent sur le ponton (le jour), puis repartent
  await heure(p, 10.25); await attendre(p, 1); let posee = false, repartie = false; await attendre(p, 60, async () => { const e = await p.evaluate(() => window.scene.vie.mouettes); if (e.some(x => x === 'perche@ponton')) posee = true; if (posee && !e.some(x => /ponton/.test(x))) repartie = true; return posee && repartie; });
  ok('1 mouettes : l’une se pose sur le ponton puis repart', posee && repartie, `posée=${posee} repartie=${repartie}`);
  // 1 · le chantier : des copeaux à chaque coup de marteau ; la fin du chantier : une fête (le bâtiment sort du sol)
  await clic(p, 'La Forge en chantier'); await attendre(p, .3); const et1 = await p.evaluate(() => window.scene.element('bat-forge').def.etat); let cop = 0;
  await attendre(p, 8, async () => { const n = await p.evaluate(() => { const s = window.scene; return [...s.app.stage.children[0].children].flatMap(c => c.children).filter(c => c.texture && c.texture.width === 10 && c.texture.height === 4).length; }); cop = Math.max(cop, n); return cop > 0; });
  await clic(p, 'Fin du chantier (fête)'); await attendre(p, .25); const monte = await p.evaluate(() => { const s = window.scene, e = s.element('bat-forge'); const sp = [...s.app.stage.children[0].children].flatMap(c => c.children).find(c => c.plan && Math.abs(c.position.x - e.x) < 1); return sp ? { dy: Math.round(sp.position.y - e.y), masque: !!sp.mask } : null; });
  await attendre(p, 1.6); const fin = await p.evaluate(() => { const s = window.scene, e = s.element('bat-forge'); const sp = [...s.app.stage.children[0].children].flatMap(c => c.children).find(c => c.plan && Math.abs(c.position.x - e.x) < 1); return sp ? { dy: Math.round(sp.position.y - e.y), masque: !!sp.mask, etat: e.def.etat } : null; });
  ok('1 chantier : des copeaux volent ; fin du chantier : le bâtiment sort du sol (masqué, plus bas pendant la montée), puis se pose', et1 === 'chantier' && cop > 0 && monte && monte.dy > 10 && monte.masque && fin && fin.dy === 0 && !fin.masque && fin.etat === 'construit', JSON.stringify({ copeaux: cop, pendant: monte, apres: fin }));
  // 1 · animations légères
  await clic(p, 'Animations légères'); await attendre(p, 1); const leg = await p.evaluate(() => window.scene.vie.legere); ok('1 animations légères : la scène le sait (reglages.legere)', leg === true);
  ok('1 Camp-scene sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 2 · les transitions de l'heure : la couleur moyenne ne saute pas autour de 6 h 30, 8 h 30, 12 h, 17 h, 18 h 30, 19 h 30, 21 h, 22 h 30
  p = await ouvrir('Camp-scene.html?heure=12&reduit=1', { petit: true }); const sauts = [];
  // autour de chaque heure, on avance par pas de 72 s de jeu : aucun pas ne doit sauter (sous 3/255 de couleur moyenne), même quand la lumière change vite (crépuscule)
  for (const h of [6.5, 8.5, 12, 17, 18.5, 19.5, 21, 22.5]) { let prev = null, pire = 0; for (let x = h - .1; x <= h + .1 + 1e-9; x = +(x + .02).toFixed(2)) { await heure(p, x); await attendre(p, .8); const m = await moyenne(p); if (prev) pire = Math.max(pire, Math.max(...m.map((v, i) => Math.abs(v - prev[i])))); prev = m; } sauts.push([h, pire.toFixed(1)]); }
  ok('2 transitions : aucun saut de couleur (le pire pas de 72 s autour de 6 h 30, 8 h 30, 12 h, 17 h, 18 h 30, 19 h 30, 21 h, 22 h 30 reste sous 3/255)', sauts.every(s => +s[1] < 3), sauts.map(s => s[0] + ' h : ' + s[1]).join(', '));
  ok('2 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 3 · Prototype : la jauge du feu arrive à la scène ; « Animations légères » dans le Carnet
  p = await ouvrir('Prototype.dc.html#ecran=camp&heure=19.5&nouv=tout&jours=3&feu=20'); const jp = await p.evaluate(() => window.__scene.vie.jauge); ok('3 Prototype : le feu en braises (feu=20) arrive à la scène', jp === 'braises', jp);
  await p.close(); p = await ouvrir('Prototype.dc.html#ecran=journal&tab=carnet&nouv=tout&jours=3'); const sw = await p.$('button[role="switch"]:has-text("Animations légères")'); ok('3 Carnet : le réglage « Animations légères »', !!sw);
  if (sw) { await sw.click(); await p.waitForTimeout(600); const on = await sw.getAttribute('aria-checked'); const legP = await p.evaluate(() => window.__scene ? window.__scene.vie.legere : 'pas de scène'); ok('3 Carnet : le réglage se transmet à la scène', on === 'true' && (legP === true || legP === 'pas de scène'), `aria-checked=${on} scène=${legP}`); }
  ok('3 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 4 · onglet caché : la boucle s'arrête
  p = await ouvrir('Camp-scene.html?heure=10.25', { petit: true }); await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); document.dispatchEvent(new Event('visibilitychange')); });
  const t1 = await p.evaluate(() => window.scene.temps); await p.waitForTimeout(1500); const t2 = await p.evaluate(() => window.scene.temps);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => false }); document.dispatchEvent(new Event('visibilitychange')); }); await p.waitForTimeout(1200); const t3 = await p.evaluate(() => window.scene.temps);
  ok('4 onglet caché : la boucle s’arrête, puis repart au retour', t2 === t1 && t3 > t2, `t=${t1.toFixed(2)} → ${t2.toFixed(2)} → ${t3.toFixed(2)}`); await p.close();
  await b.close(); const ko = res.filter(x => !x).length; console.log(ko ? ko + ' contrôle(s) en échec' : 'tout passe');
})();
