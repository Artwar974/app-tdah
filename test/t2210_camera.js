// 22/10 · la caméra du Prototype en mode app : la feuille du Ponton s'ouvre, l'expédition part, la feuille se ferme ; on relève la
// caméra (z, dx, dy) et on capture la scène toutes les 2 s de scène (scene.avancer), en 412 × 915 et 360 × 640, densité 2, mobile.
// Attendu : le zoom z ne change jamais ; les glissements sont bornés et doux ; le calque HTML et la toile restent alignés
// (le panneau du Ponton de la scène et sa pastille HTML) ; en mouvement réduit, rien ne bouge.
// Serveur : cd demo && python3 -m http.server 8771 --bind 127.0.0.1 ; puis PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node test/t2210_camera.js [dossier] [reduit]
const path = require('path');
const fs = require('fs');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun.js');
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.modeApp === 'function') return s.logic; if (s && typeof s.modeApp === 'function') return s; f = f.return; } return null; };`;
const PORT = process.env.ATHENA_PORT || '8771';
const OUT = process.argv[2] || path.join(__dirname, 'logs', 't2210_camera');
const REDUIT = process.argv.includes('reduit');
fs.mkdirSync(OUT, { recursive: true });

async function scenario(b, vp, tag) {
  // densité 1 (et non 2) : le rendu headless (swiftshader) ne suit pas en 824 × 1830 ; la géométrie de la caméra ne dépend pas de la densité
  const p = await b.newPage({ viewport: vp, deviceScaleFactor: 1, isMobile: true, hasTouch: true, reducedMotion: REDUIT ? 'reduce' : 'no-preference' });
  p.setDefaultTimeout(90000);
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.addInitScript(ESPION); await p.addInitScript(LOGIQUE); await routerCdn(p);
  await p.goto('http://127.0.0.1:' + PORT + '/Prototype.dc.html?app=1#ecran=camp&heure=10.25&nouv=tout', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene && window.__logique(), null, { timeout: 30000 });
  await p.waitForTimeout(2000);
  await p.evaluate(() => window.__scene.avancer(1.5));
  const cam = () => p.evaluate(() => { const c = window.__scene.camera(), L = window.__logique(); return { z: +c.z.toFixed(4), dx: +c.dx.toFixed(1), dy: +c.dy.toFixed(1), x: Math.round(c.x), y: Math.round(c.y), fe: L.state.fe ? L.state.fe.k : null, html: L._cam ? [+L._cam.z.toFixed(4), +L._cam.dx.toFixed(1), +L._cam.dy.toFixed(1)] : null }; });
  const rel = [];
  const noter = async (nom) => { const c = await cam(); c.nom = nom; rel.push(c); console.log(tag, nom, JSON.stringify(c)); await p.screenshot({ path: path.join(OUT, tag + '_' + String(rel.length).padStart(2, '0') + '_' + nom + '.png') }); };
  await noter('camp');
  // 1. la feuille du Ponton s'ouvre
  await p.evaluate(() => window.__logique().setState({ fe: { k: 'expedition' } }));
  await p.waitForTimeout(700);
  for (let i = 1; i <= 2; i++) { await p.evaluate(() => window.__scene.avancer(1)); await p.waitForTimeout(150); await noter('feuille' + i); }
  // 2. le départ
  await p.evaluate(() => window.__logique().parcoursAction('partir', null, null, 'moyen', null));
  await p.waitForTimeout(500);
  for (let i = 1; i <= 3; i++) { await p.evaluate(() => window.__scene.avancer(2)); await p.waitForTimeout(150); await noter('part' + i); }
  // 3. la feuille se ferme pendant que le minotaure marche
  await p.evaluate(() => window.__logique().setState({ fe: null }));
  await p.waitForTimeout(700);
  for (let i = 1; i <= 12; i++) { await p.evaluate(() => window.__scene.avancer(2)); await p.waitForTimeout(150); await noter('bateau' + i); }
  const zs = rel.map((r) => r.z), dxs = rel.map((r) => r.dx), dys = rel.map((r) => r.dy);
  ok(tag + ' : le zoom z ne change jamais', zs.every((z) => z === zs[0]), zs.join(','));
  ok(tag + ' : le calque HTML suit la scène (mêmes z, dx, dy)', rel.every((r) => r.html && r.html[0] === r.z && Math.abs(r.html[1] - r.dx) < .6 && Math.abs(r.html[2] - r.dy) < .6), rel.map((r) => r.html).join(' | '));
  const sauts = rel.slice(1).map((r, i) => Math.hypot(r.dx - rel[i].dx, r.dy - rel[i].dy));
  ok(tag + ' : pas de saut de plus de 90 px entre deux relevés (2 s)', sauts.every((s) => s <= 90), sauts.map((s) => s.toFixed(0)).join(','));
  if (REDUIT) ok(tag + ' : mouvement réduit, la caméra ne bouge qu\'avec la feuille', rel.filter((r) => !r.fe).every((r) => r.dx === rel[0].dx && r.dy === rel[0].dy), dxs.join(',') + ' / ' + dys.join(','));
  const fin = await p.evaluate(() => { const s = window.__scene; return { b: s.element('bateau').etat, m: s.element('minotaure').visible, ev: window.__events.map((e) => e[0]).filter((n) => /expedition/.test(n)) }; });
  ok(tag + ' : le bateau est parti (aller ou large) à la fin', ['aller', 'large'].includes(fin.b), JSON.stringify(fin));
  ok(tag + ' : console sans erreur', errs.length === 0, errs.join(' | '));
  await p.close();
}

(async () => {
  const b = await lancer();
  await scenario(b, { width: 412, height: 915 }, 'v412');
  await scenario(b, { width: 360, height: 640 }, 'v360');
  await b.close();
  process.exit(bilan('t2210_camera' + (REDUIT ? '_reduit' : '')) ? 1 : 0);
})();
