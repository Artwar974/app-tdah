// 22/10 · la falaise gauche du tableau d'origine (liste V2, point 5.2) : dans day-hd (et sunset-hd, night-hd) la baie a une falaise à gauche
// (rocher, deux cyprès, un pin parasol, x < 152, y ≈ 507-744) ; les fonds de la scène n'y ont que de la mer. La scène la repose en deux
// sprites (fond.falaiseGauche, découpes de outils/decouper-falaise-gauche.py) au-dessus du maillage du fond, fondus avec la lumière.
// Camp-scene.html aux 4 heures (lever 6.75, jour 10.25, coucher 19.5, nuit 22), la toile élargie à 720 × 1280 et la caméra à l'échelle 1
// (1 px d'écran = 1 px du tableau), la scène en pause (l'eau ne bouge pas entre deux lectures). Aux points (60, 600) et (90, 640) du tableau :
// le rendu n'est pas l'eau (il diffère de plus de 16/255 du rendu avec reglages.falaiseGauche = 0) ; sans brume ni voile du soir, il est celui
// de la découpe du moment à 16/255 près, et l'eau revenue (falaiseGauche = 0) est celle du fond à 40 près ; à (60, 430) la mer ne change pas.
// Puis le bateau en route (expedition-depart, 20 à 44 s de scène) : il passe au-dessus des cimes de la falaise (y < 500 tant que x < 160) ;
// le bouton « Falaise gauche » de Camp-scene.html (cache, remet) ; enfin le Prototype en 390 × 844 (jour, soir, nuit) pour les captures.
// Console sans erreur partout.
// Serveur : bash test/_serveur.sh (port 8766) ou cd demo && python3 -m http.server 8771 --bind 127.0.0.1 ; puis PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers ATHENA_PORT=<port> node test/t2210_falaise_gauche.js [dossier] (8771 par défaut)
const path = require('path');
const fs = require('fs');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun.js');
const PORT = process.env.ATHENA_PORT || '8771';
const OUT = process.argv[2] || path.join(__dirname, 'logs', 't2210_falaise_gauche');
fs.mkdirSync(OUT, { recursive: true });
const HEURES = { lever: 6.75, jour: 10.25, coucher: 19.5, nuit: 22 };
const FALAISE = [[60, 600], [90, 640]], MER = [[60, 430]];
const PTS = FALAISE.concat(MER);
const TOL = 16, TOL_EAU = 40;
const SCENE = JSON.parse(fs.readFileSync(path.join(__dirname, '..', 'demo', 'commun', 'athena-scene.json'), 'utf8'));
const FG = SCENE.fond.falaiseGauche;
// lit les pixels (r, v, b) d'une image (adresse ou data:) aux points donnés, dans la page
const LIRE = `window.__lire = async (src, pts) => { const im = new Image(); im.src = src; await im.decode(); const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); return pts.map(([x, y]) => Array.from(g.getImageData(x, y, 1, 1).data).slice(0, 4)); };`;
// les couches du monde : monde = le conteneur de 10 couches ; sol (la brume) = 3, voile (le soir tamisé) = 9
const MONDE = 'const s = window.__scene, monde = s.app.stage.children.find((c) => c.children.length >= 10), sol = monde.children[3], voile = monde.children[9];';
const ecart = (a, b) => Math.max(...a.slice(0, 3).map((v, i) => Math.abs(v - b[i])));
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
  // la toile à la taille du tableau (le cadre .tel est limité à 390 px de large) : le ResizeObserver recadre, puis la caméra à l'échelle 1
  await p.addStyleTag({ content: '.page{display:block!important;padding:0!important}.tel{width:720px!important;height:1280px!important;max-height:none!important;aspect-ratio:auto!important;border-radius:0!important;box-shadow:none!important}body{padding:0!important}.panneau{display:none!important}' });
  await p.waitForFunction(() => { const r = document.getElementById('toile').getBoundingClientRect(); return Math.abs(r.width - 720) < 1 && Math.abs(r.height - 1280) < 1; }, null, { timeout: 60000, polling: 250 });
  await p.waitForTimeout(600);
  await p.evaluate(() => { window.__scene.camera({ x: 360, y: 640, z: 1, cache: 0 }, { immediat: true }); window.__scene.emettre('mont-paliers', { n: 4 }); window.__scene.avancer(2); window.__scene.pause(); });
  const r = await p.evaluate(() => { const r = document.getElementById('toile').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
  const clip = { x: r.x, y: r.y, width: 720, height: 1280 };
  ok(nom + ' : toile 720 × 1280, caméra à l\'échelle 1', r.w === 720 && r.h === 1280, JSON.stringify(r));
  const lire = async (fichier) => { const png = await p.screenshot({ path: fichier, clip }); return p.evaluate(([src, pts]) => window.__lire(src, pts), ['data:image/png;base64,' + png.toString('base64'), PTS]); };
  const regler = (k) => p.evaluate((k) => { const s = window.__scene; s.reglages.falaiseGauche = k; s.lumiere(); s.app.render(); }, k);
  const nu = (on) => p.evaluate(new Function('on', MONDE + ' sol.children[0].visible = on ? false : true; voile.visible = !on; s.app.render();'), on);
  // 1. le rendu complet, puis sans la falaise (reglages.falaiseGauche = 0)
  const rendu = await lire(path.join(OUT, 'camp_' + nom + '.png'));
  await regler(0);
  const sans = await lire(path.join(OUT, 'sans_' + nom + '.png'));
  // 2. sans brume ni voile du soir : avec la falaise, puis sans
  await nu(true); await regler(1);
  const nuAvec = await lire(path.join(OUT, 'nu_' + nom + '.png'));
  await regler(0);
  const nuSans = await lire(path.join(OUT, 'nusans_' + nom + '.png'));
  await regler(1); await nu(false);
  // 3. la découpe du moment et le fond
  const decoupe = await p.evaluate(([src, pts]) => window.__lire(src, pts), ['assets/scene/' + FG.images[nom], FALAISE.map(([x, y]) => [x - FG.x, y - FG.y])]);
  const fond = await p.evaluate(([src, pts]) => window.__lire(src, pts), ['assets/scene/' + SCENE.fond.moments.find((m) => m.id === nom).fond, PTS]);
  const eF = FALAISE.map((_, i) => ecart(rendu[i], sans[i])), eD = FALAISE.map((_, i) => ecart(nuAvec[i], decoupe[i])), eE = FALAISE.map((_, i) => ecart(nuSans[i], fond[i]));
  ok(nom + ' : la découpe est opaque aux deux points (alpha 255)', decoupe.every((d) => d[3] === 255), decoupe.map((d) => d[3]).join(','));
  ok(nom + ' : la falaise est là (rendu ≠ rendu sans falaise, de plus de ' + TOL + '/255)', eF.every((e) => e > TOL), fmt(FALAISE, eF));
  ok(nom + ' : sans brume ni voile, le rendu est celui de la découpe (à ' + TOL + '/255 près)', eD.every((e) => e <= TOL), fmt(FALAISE, eD) + ' · rendu ' + JSON.stringify(nuAvec.slice(0, 2)) + ' découpe ' + JSON.stringify(decoupe));
  ok(nom + ' : reglages.falaiseGauche = 0, l\'eau du fond revient (à ' + TOL_EAU + ' près)', eE.every((e) => e <= TOL_EAU), fmt(FALAISE, eE) + ' · rendu ' + JSON.stringify(nuSans.slice(0, 2)) + ' fond ' + JSON.stringify(fond.slice(0, 2)));
  const eM = ecart(rendu[2], sans[2]);
  ok(nom + ' : à (60, 430) la mer ne change pas', eM <= 2, 'écart ' + eM + ' · ' + JSON.stringify(rendu[2]));
  ok(nom + ' : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
}

// le bateau en route : il part (expedition-depart : le minotaure marche au ponton, embarque vers 18,6 s, le bateau largue), on relève sa position
// toutes les 2 s de scène de 20 à 44 s : à gauche de x = 160 il reste au-dessus des cimes de la falaise (y < 500) ; capture à 34 s
async function bateau(b) {
  const p = await page(b, { width: 760, height: 1320 });
  await p.goto('http://127.0.0.1:' + PORT + '/Camp-scene.html?heure=10.25', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene, null, { timeout: 30000 });
  await p.addStyleTag({ content: '.page{display:block!important;padding:0!important}.tel{width:720px!important;height:1280px!important;max-height:none!important;aspect-ratio:auto!important;border-radius:0!important;box-shadow:none!important}body{padding:0!important}.panneau{display:none!important}' });
  await p.waitForFunction(() => { const r = document.getElementById('toile').getBoundingClientRect(); return Math.abs(r.width - 720) < 1 && Math.abs(r.height - 1280) < 1; }, null, { timeout: 60000, polling: 250 });
  await p.waitForTimeout(600);
  await p.evaluate(() => { window.__scene.camera({ x: 360, y: 640, z: 1, cache: 0 }, { immediat: true }); window.__scene.avancer(1); window.__scene.emettre('expedition-depart', { compagnon: 'minotaure' }); });
  const rel = [];
  for (let t = 0; t <= 44; t += 2) {
    await p.evaluate(() => window.__scene.avancer(2)); await p.waitForTimeout(30);
    const e = await p.evaluate(() => { const b = window.__scene.element('bateau'); return b && { x: Math.round(b.x), y: Math.round(b.y), etat: b.etat, visible: b.visible }; });
    if (t >= 20) rel.push(Object.assign({ t: t + 2 }, e));
    if (t === 32) { const r = await p.evaluate(() => { const r = document.getElementById('toile').getBoundingClientRect(); return { x: r.x, y: r.y }; }); await p.screenshot({ path: path.join(OUT, 'camp_bateau.png'), clip: { x: r.x, y: r.y, width: 720, height: 1280 } }); }
  }
  const enRoute = rel.filter((r) => r.etat === 'aller');
  ok('bateau : en route (aller) à un moment entre 20 et 46 s', enRoute.length > 0, rel.map((r) => r.t + ':' + r.etat + '@' + r.x + '/' + r.y).join(' '));
  const gauche = enRoute.filter((r) => r.x < 160);
  ok('bateau : à gauche de x = 160 il passe au-dessus des cimes de la falaise (y < 500)', gauche.length > 0 && gauche.every((r) => r.y < 500), gauche.map((r) => r.x + '/' + r.y).join(' '));
  ok('bateau : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
}

// le bouton « Falaise gauche » de Camp-scene.html (règle 6 : chaque état a son bouton) : posée au départ, un clic la cache (reglages.falaiseGauche = 0,
// la mer revient en (60, 600) du tableau), un second la remet
async function bouton(b) {
  // la page telle quelle (390 × 844, le panneau visible) : la vue large (z = 0 : toute la largeur du tableau), le point (60, 600) du tableau passé à l'écran
  // par monde.toGlobal, lu sur la toile elle-même (renderer.extract) ; le bouton est cliqué par le DOM (pas de défilement de la page)
  const p = await page(b, { width: 390, height: 844 });
  await p.goto('http://127.0.0.1:' + PORT + '/Camp-scene.html?heure=10.25', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene, null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  await p.evaluate(() => { window.__scene.camera({ x: 360, y: 640, z: 0, cache: 0 }, { immediat: true }); window.__scene.avancer(1); });
  const lirePx = () => p.evaluate(() => { const s = window.__scene, app = s.app, monde = app.stage.children.find((c) => c.children.length >= 10); s.avancer(1 / 60); const q = monde.toGlobal({ x: 60, y: 600 }); const c = app.renderer.extract.canvas({ target: app.stage, frame: app.screen.clone() }); return Array.from(c.getContext('2d', { willReadFrequently: true }).getImageData(Math.round(q.x), Math.round(q.y), 1, 1).data).slice(0, 3); });
  const etat = () => p.evaluate(() => ({ k: window.__scene.reglages.falaiseGauche, presse: document.getElementById('falaiseG').getAttribute('aria-pressed') }));
  const clic = () => p.evaluate(() => document.getElementById('falaiseG').click());
  const avant = await lirePx(), e0 = await etat();
  await clic(); const e1 = await etat(); const cache = await lirePx();
  await clic(); const e2 = await etat(); const remis = await lirePx();
  ok('bouton : posée au départ (reglages.falaiseGauche 1, aria-pressed true)', e0.k === 1 && e0.presse === 'true', JSON.stringify(e0));
  ok('bouton : un clic la cache (0, aria-pressed false) et la mer revient en (60, 600)', e1.k === 0 && e1.presse === 'false' && ecart(avant, cache) > TOL, JSON.stringify(e1) + ' · ' + JSON.stringify(avant) + ' → ' + JSON.stringify(cache));
  ok('bouton : un second clic la remet (1, aria-pressed true)', e2.k === 1 && e2.presse === 'true' && ecart(remis, avant) <= TOL, JSON.stringify(e2) + ' · ' + JSON.stringify(remis));
  ok('bouton : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
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

(async () => {
  ok('athena-scene.json : fond.falaiseGauche décrit les 4 découpes', !!(FG && FG.images && ['lever', 'jour', 'coucher', 'nuit'].every((m) => FG.images[m] && fs.existsSync(path.join(__dirname, '..', 'demo', 'assets', 'scene', FG.images[m])))), JSON.stringify(FG && FG.images));
  const b = await lancer();
  for (const [nom, h] of Object.entries(HEURES)) await campScene(b, nom, h);
  await bateau(b);
  await bouton(b);
  await prototype(b, 'jour', 10.25);
  await prototype(b, 'coucher', 19.5);
  await prototype(b, 'nuit', 22);
  await b.close();
  process.exit(bilan('t2210_falaise_gauche') ? 1 : 0);
})();
