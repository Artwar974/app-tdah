// 22/10 · la falaise droite devant la montagne (liste V2, point 5.1) : dans le tableau, la falaise de droite (x ≥ 600, y ≥ 440, son herbe,
// ses buissons, l'arbre et le cyprès) passe devant le bas du flanc droit de la montagne ; le calque mont_eau_<moment> (un autre rendu de
// la montagne) la recouvrait. Camp-scene.html aux 4 heures (lever 6.75, jour 10.25, coucher 19.5, nuit 22), la toile élargie à 720 × 1280
// et la caméra à l'échelle 1 : 1 px d'écran = 1 px du tableau. Sur quatre points de la falaise, le rendu doit être celui du fond seul
// (le calque du mont caché : même lumière, même voile, même brume) à moins de 12/255 près, et à jour celui de fond_jour.webp ; sur la chute,
// le rendu diffère nettement du fond seul (la cascade est toujours là). Puis le Prototype en 390 × 844 (jour, soir) pour les captures, et la feuille
// du Ponton ouverte : la caméra glisse (ressort), le masque, dans le monde, glisse avec la couche ; posé dans app.stage il ne suivrait pas (contre-épreuve).
// Serveur : cd demo && python3 -m http.server 8771 --bind 127.0.0.1 ; puis PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers ATHENA_PORT=8771 node test/t2210_falaise_droite.js [dossier]
// Les zooms ×3 des captures : python3 -I test/t2210_falaise_droite.py [dossier]
const path = require('path');
const fs = require('fs');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun.js');
const PORT = process.env.ATHENA_PORT || '8771';
const OUT = process.argv[2] || path.join(__dirname, 'logs', 't2210_falaise_droite');
fs.mkdirSync(OUT, { recursive: true });
const HEURES = { lever: 6.75, jour: 10.25, coucher: 19.5, nuit: 22 };
// points du tableau (repère 720 × 1280), vérifiés sur fond_jour.webp : le bloc de la falaise (610, 480), son herbe (650, 470), la canopée de l'arbre (675, 435), l'herbe à droite (700, 470)
const FALAISE = [[610, 480], [650, 470], [675, 435], [700, 470]];
// la chute d'eau (les 5 images de la cascade couvrent x 556-675, y 156-441)
const CHUTE = [[600, 250], [615, 300], [630, 330]];
const TOL = 12, ECART_CHUTE = 20;
// lit des pixels (r, v, b) d'une image (adresse ou data:) aux points donnés, dans la page
const LIRE = `window.__lire = async (src, pts) => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); return pts.map(([x, y]) => Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3)); };`;
// la logique du Prototype (comme t2210_camera.js), pour ouvrir la feuille du Ponton
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.modeApp === 'function') return s.logic; if (s && typeof s.modeApp === 'function') return s; f = f.return; } return null; };`;
// lit la toile elle-même (renderer.extract, cadre = l'écran : une feuille HTML peut couvrir cette zone de la capture) aux points du tableau donnés,
// passés à l'écran par monde.toGlobal ; null hors toile ; data : la toile en PNG
const LIRE_TOILE = `window.__lireToile = (pts) => { const s = window.__scene, app = s.app, monde = app.stage.children.find((c) => c.children.length >= 10); app.render(); const c = app.renderer.extract.canvas({ target: app.stage, frame: app.screen.clone() }), g = c.getContext('2d', { willReadFrequently: true }); const ecran = pts.map(([x, y]) => { const q = monde.toGlobal({ x, y }); return [Math.round(q.x), Math.round(q.y)]; }); return { ecran, px: ecran.map(([x, y]) => x < 0 || y < 0 || x >= c.width || y >= c.height ? null : Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 3)), data: c.toDataURL('image/png') }; };`;
const MONDE = 'const s = window.__scene, monde = s.app.stage.children.find((c) => c.children.length >= 10), cascade = monde.children[2];';
const ecart = (a, b) => Math.max(...a.map((v, i) => Math.abs(v - b[i])));
const fmt = (pts, e) => pts.map((p, i) => '(' + p + ') ' + e[i]).join(', ');

async function page(b, vp) {
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1 });
  p.setDefaultTimeout(90000);
  p.errs = [];
  p.on('pageerror', (e) => p.errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console ' + m.text().slice(0, 200)); });
  await p.addInitScript(ESPION); await p.addInitScript(LIRE); await routerCdn(p);
  return p;
}

async function campScene(b, nom, h) {
  const p = await page(b, { width: 760, height: 1320 });
  await p.goto('http://127.0.0.1:' + PORT + '/Camp-scene.html?heure=' + h, { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene, null, { timeout: 30000 });
  // la toile à la taille du tableau (le cadre .tel est limité à 390 px de large) : le ResizeObserver de la scène recadre, puis la caméra à l'échelle 1
  await p.addStyleTag({ content: '.page{display:block!important;padding:0!important}.tel{width:720px!important;height:1280px!important;max-height:none!important;aspect-ratio:auto!important;border-radius:0!important;box-shadow:none!important}body{padding:0!important}.panneau{display:none!important}' });
  // (sondage à intervalle fixe : à 720 × 1280 le rendu sans carte graphique prend plusieurs centaines de ms par image, le sondage par rAF traîne)
  await p.waitForFunction(() => { const r = document.getElementById('toile').getBoundingClientRect(); return Math.abs(r.width - 720) < 1 && Math.abs(r.height - 1280) < 1; }, null, { timeout: 60000, polling: 250 });
  await p.waitForTimeout(600);
  await p.evaluate(() => { window.__scene.camera({ x: 360, y: 640, z: 1, cache: 0 }, { immediat: true }); window.__scene.emettre('mont-paliers', { n: 4 }); window.__scene.avancer(2); });
  const r = await p.evaluate(() => { const r = document.getElementById('toile').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const clip = { x: r.x, y: r.y, width: 720, height: 1280 };
  ok(nom + ' : toile 720 × 1280, caméra à l\'échelle 1', r.w === 720 && r.h === 1280, JSON.stringify(r));
  const pts = FALAISE.concat(CHUTE);
  const lireRendu = async (fichier) => { const png = await p.screenshot({ path: fichier, clip }); return p.evaluate(([src, pts]) => window.__lire(src, pts), ['data:image/png;base64,' + png.toString('base64'), pts]); };
  // 1. le rendu complet
  const rendu = await lireRendu(path.join(OUT, 'camp_' + nom + '.png'));
  // 2. le fond seul : le calque de la cascade (mont, lit, eau) caché, même lumière
  await p.evaluate(() => { const s = window.__scene, monde = s.app.stage.children.find((c) => c.children.length >= 10); window.__cascade = monde.children[2]; window.__cascade.visible = false; s.avancer(.05); });
  const fondSeul = await lireRendu(path.join(OUT, 'fondseul_' + nom + '.png'));
  await p.evaluate(() => { window.__cascade.visible = true; window.__scene.avancer(.05); });
  // 3. le tableau lui-même
  const tableau = await p.evaluate(([src, pts]) => window.__lire(src, pts), ['assets/scene/fond/fond_' + nom + '.webp', pts]);
  const nF = FALAISE.length;
  const eFond = FALAISE.map((_, i) => ecart(rendu[i], fondSeul[i])), eTab = FALAISE.map((_, i) => ecart(rendu[i], tableau[i]));
  const eChute = CHUTE.map((_, i) => ecart(rendu[nF + i], fondSeul[nF + i]));
  ok(nom + ' : la falaise est celle du fond (rendu = fond seul à ' + TOL + '/255 près)', eFond.every((e) => e <= TOL), fmt(FALAISE, eFond));
  const infoTab = fmt(FALAISE, eTab) + ' · fond seul vs tableau ' + fmt(FALAISE, FALAISE.map((_, i) => ecart(fondSeul[i], tableau[i])));
  // à lever et à jour le fond seul est le tableau exact (écart 0) ; le soir et la nuit, le voile et la lumière s'ajoutent (5 à 19/255)
  if (nom === 'jour' || nom === 'lever') ok(nom + ' : la falaise est celle de fond_' + nom + '.webp (à ' + TOL + '/255 près)', eTab.every((e) => e <= TOL), infoTab);
  else console.log('  ' + nom + ' : rendu vs tableau (indicatif, la lumière du moment s\'ajoute) ' + infoTab);
  ok(nom + ' : la cascade est toujours là (la chute diffère du fond seul de plus de ' + ECART_CHUTE + ')', Math.max(...eChute) > ECART_CHUTE, fmt(CHUTE, eChute));
  ok(nom + ' : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
}

async function prototype(b, nom, h) {
  const p = await page(b, { width: 390, height: 844 });
  await p.goto('http://127.0.0.1:' + PORT + '/Prototype.dc.html?app=1#ecran=camp&heure=' + h + '&nouv=tout', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene, null, { timeout: 30000 });
  await p.waitForTimeout(2500);
  await p.evaluate(() => window.__scene.avancer(1.5));
  await p.screenshot({ path: path.join(OUT, 'proto_' + nom + '.png') });
  ok('Prototype ' + nom + ' : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
}

// 22/10 · la feuille du Ponton ouverte : la caméra glisse (ressort) et le masque de la falaise, dans le monde, glisse avec la couche. Le ticker est
// ralenti (speed .04) pour attraper le glissement à dy ≤ −76 (une fois posé, la falaise sort de l'écran), la scène mise en pause là ; on lit la toile
// elle-même (la feuille HTML couvre cette zone) : la falaise = le fond seul. Contre-épreuve : le même masque dans app.stage (repère de l'écran) : la falaise
// serait recouverte. Captures : proto_feuille.png (l'écran, la feuille ouverte) et proto_feuille_scene.png (la toile seule, sous la feuille).
async function prototypeFeuille(b) {
  const p = await page(b, { width: 390, height: 844 });
  await p.addInitScript(LOGIQUE); await p.addInitScript(LIRE_TOILE);
  await p.goto('http://127.0.0.1:' + PORT + '/Prototype.dc.html?app=1#ecran=camp&heure=10.25&nouv=tout', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene && window.__logique(), null, { timeout: 30000 });
  await p.waitForTimeout(2000); await p.evaluate(() => window.__scene.avancer(1.5));
  const dy0 = await p.evaluate(() => window.__scene.camera().dy);
  await p.evaluate(() => { window.__scene.app.ticker.speed = .04; window.__logique().setState({ fe: { k: 'expedition' } }); });
  let glisse = true;
  try { await p.waitForFunction(() => window.__scene.camera().dy <= -76, null, { polling: 25, timeout: 120000 }); } catch (e) { glisse = false; }
  await p.evaluate(() => window.__scene.pause());
  const c = await p.evaluate(() => { const c = window.__scene.camera(); return { z: +c.z.toFixed(4), dx: +c.dx.toFixed(1), dy: +c.dy.toFixed(1) }; });
  ok('Prototype, feuille du Ponton : la caméra glisse (dy ≤ −76 ; au camp ' + dy0.toFixed(1) + ')', glisse && c.dy <= -76, JSON.stringify(c));
  await p.screenshot({ path: path.join(OUT, 'proto_feuille.png') });
  const lire = () => p.evaluate((pts) => window.__lireToile(pts), FALAISE);
  const rendu = await lire();
  fs.writeFileSync(path.join(OUT, 'proto_feuille_scene.png'), Buffer.from(rendu.data.split(',')[1], 'base64'));
  await p.evaluate(new Function(MONDE + ' cascade.visible = false;'));
  const fond = await lire();
  await p.evaluate(new Function(MONDE + ' cascade.visible = true; s.app.stage.addChild(cascade.mask);'));
  const stage = await lire();
  await p.evaluate(new Function(MONDE + ' monde.addChild(cascade.mask);'));
  const surToile = rendu.px.every((v, i) => v && fond.px[i] && stage.px[i]);
  const eF = FALAISE.map((_, i) => surToile ? ecart(rendu.px[i], fond.px[i]) : 999), eS = FALAISE.map((_, i) => surToile ? ecart(stage.px[i], fond.px[i]) : 0);
  ok('Prototype, feuille du Ponton (dy ' + c.dy + ') : la falaise est à l\'écran et reste celle du fond seul (à ' + TOL + '/255 près)', surToile && eF.every((e) => e <= TOL), 'écran ' + JSON.stringify(rendu.ecran) + ' · ' + fmt(FALAISE, eF));
  ok('Prototype, feuille du Ponton : le masque suit le monde, pas l\'écran (posé dans app.stage, la falaise serait recouverte)', eS.some((e) => e > TOL), fmt(FALAISE, eS));
  ok('Prototype, feuille du Ponton : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
}

(async () => {
  const b = await lancer();
  for (const [nom, h] of Object.entries(HEURES)) await campScene(b, nom, h);
  await prototype(b, 'jour', 10.25);
  await prototype(b, 'coucher', 19.5);
  await prototypeFeuille(b);
  await b.close();
  process.exit(bilan('t2210_falaise_droite') ? 1 : 0);
})();
