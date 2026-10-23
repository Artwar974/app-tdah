// 22/10 · liste V2 (5.4) : les longs traits blancs peints au milieu de la baie (l'écume fixe des quatre fonds) sont effacés par la scène,
// une fois au chargement, sur le CPU (fonds nettoyés) ; effets.ecumePeinte = 1 remet les fonds bruts, en direct.
// Camp-scene.html aux 4 heures (lever 6.75, jour 10.25, coucher 19.5, nuit 22), en mouvement réduit, la toile portée à 720 × 1280 et la
// caméra à l'échelle 1 (1 px d'écran = 1 px du tableau), la mer, le vent, la brume, les reflets et les rayons à 0 (le fond seul, figé) :
//   - six points des traits doivent être de l'eau (écart de luminance avec l'eau 30 px plus bas < 0,05) avec ecumePeinte = 0, et redevenir
//     clairs avec 1 (preuve que le contrôle détecte), puis de nouveau de l'eau à 0 (en direct) ;
//   - hors des traits, les fonds brut et propre sont identiques : le rocher de gauche, son reflet, le pied de la falaise droite et la plage
//     (écart moyen < 3/255 entre les captures 1 et 0) ; le retour à 0 redonne la capture propre (écart < 2/255 : la mesure est stable) ;
//   - les quatre fonds sont nettoyés (scene.ecume : prêts, ms par fond, ms du masque) ; aucune erreur de console.
// Puis le Prototype en 390 × 844 (jour et nuit) : les fonds nettoyés dans la vraie app, une capture, console propre.
// Chaque page est fermée après usage, un seul navigateur ; une page qui casse ne fait pas tomber la suite (✗ et on continue).
// Serveur : cd demo && python3 -m http.server 8781 --bind 127.0.0.1 ; puis ATHENA_PORT=8781 PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node test/t2210_ecume.js [dossier]
const path = require('path');
const fs = require('fs');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun.js');
const PORT = process.env.ATHENA_PORT || '8781';
const OUT = process.argv[2] || path.join(__dirname, 'logs', 't2210_ecume');
fs.mkdirSync(OUT, { recursive: true });
const HEURES = { lever: 6.75, jour: 10.25, coucher: 19.5, nuit: 22 };
// les points des traits (repère du tableau 720 × 1280), choisis sur les quatre fond_<moment>.webp : à l'intérieur de l'eau, nettement plus
// clairs que l'eau 30 px plus bas (+ 0,12 au moins le jour, + 0,035 la nuit), l'eau en dessous calme, loin du bateau, de la cabane (sa
// lanterne éclaire l'eau la nuit) et des liserés gardés (à moins de 4 px de la terre ou du rocher de gauche)
const POINTS = [[226, 488], [336, 476], [250, 496], [238, 562], [282, 564], [360, 598]];
// hors des traits : le rocher de gauche (son corps), son reflet, le pied de la falaise droite, la plage : [x0, y0, x1, y1]
const ZONES = { rocher: [140, 425, 185, 468], reflet: [140, 480, 190, 512], falaise: [600, 600, 700, 700], plage: [300, 690, 480, 760] };
const BAIE = { y0: 395, y1: 800 };

// Lit une capture PNG (base64) dans la page : luminance moyenne (bloc 5 × 5) des points et 30 px plus bas, pixels RVB des zones.
const ANALYSE = async ({ b64, POINTS, ZONES }) => {
  const img = new Image(); img.src = 'data:image/png;base64,' + b64; await img.decode();
  const c = document.createElement('canvas'); c.width = img.width; c.height = img.height;
  const g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(img, 0, 0);
  const d = g.getImageData(0, 0, c.width, c.height).data, W = c.width;
  const lum = (x, y) => { let s = 0; for (let j = -2; j <= 2; j++) for (let i = -2; i <= 2; i++) { const k = ((y + j) * W + x + i) * 4; s += d[k] * .3 + d[k + 1] * .59 + d[k + 2] * .11; } return s / 25 / 255; };
  const points = POINTS.map(([x, y]) => +(lum(x, y) - lum(x, y + 30)).toFixed(3));
  const zones = {};
  for (const [n, [x0, y0, x1, y1]] of Object.entries(ZONES)) { const px = []; for (let y = y0; y < y1; y++) for (let x = x0; x < x1; x++) { const k = (y * W + x) * 4; px.push(d[k], d[k + 1], d[k + 2]); } zones[n] = px; }
  return { points, zones, w: c.width, h: c.height };
};
const ecartZones = (a, b) => { const r = {}; for (const n of Object.keys(a)) { let s = 0; for (let i = 0; i < a[n].length; i++) s += Math.abs(a[n][i] - b[n][i]); r[n] = +(s / a[n].length).toFixed(2); } return r; };
const fmt = (xs) => xs.map((e) => (e >= 0 ? '+' : '') + e.toFixed(3)).join(' ');

// une page de contrôle : erreurs de page et de console recueillies, CDN locaux, espion posé
async function page(b, viewport, extra) {
  const p = await b.newPage(Object.assign({ viewport, deviceScaleFactor: 1 }, extra || {}));
  p.setDefaultTimeout(90000);
  const errs = [];
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.addInitScript(ESPION); await routerCdn(p);
  p.errs = errs;
  return p;
}

async function moment(b, nom, h) {
  const p = await page(b, { width: 760, height: 1320 });
  try {
    await p.goto('http://127.0.0.1:' + PORT + '/Camp-scene.html?heure=' + h + '&reduit=1', { waitUntil: 'load' });
    await p.waitForFunction(() => window.__scene, null, { timeout: 60000 });
    // la toile à la taille du tableau : 1 px d'écran = 1 px du tableau avec la caméra (360, 640, z = 1)
    await p.evaluate(() => { const t = document.getElementById('tel'); t.style.width = '720px'; t.style.height = '1280px'; t.style.maxHeight = 'none'; t.style.aspectRatio = 'auto'; t.style.borderRadius = '0'; });
    await p.waitForTimeout(600);
    // le fond seul, figé : sans la réfraction, les reflets, l'écume animée, le souffle des arbres, la brume, les nuages, les rayons ni les
    // nappes de lumière (tous réglables en direct), ni la vie ambiante (légère) ; la vue large, le mont à 4 paliers
    await p.evaluate(() => { const r = window.__scene.reglages; r.eau = 0; r.reflets = 0; r.vagues = 0; r.vent = 0; r.brume = 0; r.nuages = 0; r.rayons = 0; r.portees = 0; r.legere = true; window.__scene.camera({ x: 360, y: 640, z: 1, cache: 0 }, { immediat: true }); window.__scene.emettre('mont-paliers', { n: 4 }); window.__scene.avancer(2); });
    // 23/10 · le minotaure caché : de nuit il passe près de la plage et deux captures identiques à 3 s d'écart y différaient de 2,4/255 (0,97 sans lui)
    await p.evaluate(() => window.__scene.definir('minotaure', { visible: false }));
    const boite = await p.evaluate(() => { const r = document.getElementById('toile').getBoundingClientRect(); return { x: r.x, y: r.y, w: r.width, h: r.height }; });
    ok(nom + ' : la toile fait 720 × 1280', Math.round(boite.w) === 720 && Math.round(boite.h) === 1280, boite.w + ' × ' + boite.h);
    const clip = { x: boite.x, y: boite.y, width: 720, height: 1280 };
    // les fonds nettoyés : les deux moments du départ tout de suite, les deux autres en différé (on attend les quatre, 15 s au plus)
    await p.waitForFunction(() => { const e = window.__scene.ecume; return e && e.prets && e.prets.length >= 4; }, null, { timeout: 15000 }).catch(() => {});
    const ecume = await p.evaluate(() => window.__scene.ecume || null);
    ok(nom + ' : scene.ecume est exposé (fonds nettoyés, temps en ms)', !!(ecume && ecume.ms && !ecume.erreur), JSON.stringify(ecume));
    const tempsFonds = ecume && ecume.ms ? Object.values(ecume.ms) : [];
    ok(nom + ' : les quatre fonds sont nettoyés, chacun en moins de 1 s, le masque en moins de 1 s (garde-fou : temps réel, il dépend de la charge de la machine ; les chiffres sont dans le détail)', tempsFonds.length >= 4 && tempsFonds.every((t) => t < 1000) && ecume.masqueMs < 1000, 'ms : ' + JSON.stringify(ecume && ecume.ms) + ' · masque ' + (ecume && ecume.masqueMs) + ' ms · ' + JSON.stringify(ecume && ecume.masque));
    await p.evaluate(() => window.__scene.avancer(1 / 60));
    const capture = async (suffixe) => {
      const png = await p.screenshot({ clip, timeout: 60000 });
      fs.writeFileSync(path.join(OUT, suffixe + '_' + nom + '.png'), png);
      const r = await p.evaluate(ANALYSE, { b64: png.toString('base64'), POINTS, ZONES });
      // la baie seule (y 395-800), pour regarder
      await p.screenshot({ path: path.join(OUT, 'mer_' + suffixe + '_' + nom + '.png'), clip: { x: boite.x, y: boite.y + BAIE.y0, width: 720, height: BAIE.y1 - BAIE.y0 }, timeout: 60000 });
      return r;
    };
    // 1. fonds nettoyés (ecumePeinte = 0, le défaut)
    const reglage0 = await p.evaluate(() => window.__scene.reglages.ecumePeinte);
    ok(nom + ' : effets.ecumePeinte vaut 0 par défaut', !reglage0, String(reglage0));
    const A = await capture('propre');
    ok(nom + ' : les six points des traits sont de l’eau (écart de luminance avec l’eau 30 px plus bas < 0,05)', A.points.every((e) => Math.abs(e) < .05), fmt(A.points));
    // 2. fonds bruts (ecumePeinte = 1), en direct
    await p.evaluate(() => { window.__scene.reglages.ecumePeinte = 1; window.__scene.avancer(.1); });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.__scene.avancer(1 / 60));
    const B = await capture('brut');
    const seuilBrut = nom === 'nuit' ? .03 : .1;
    ok(nom + ' : avec ecumePeinte = 1 les traits reviennent (écart > ' + seuilBrut + ')', B.points.every((e) => e > seuilBrut), fmt(B.points));
    const ec = ecartZones(A.zones, B.zones);
    ok(nom + ' : hors des traits, brut et propre sont identiques : rocher de gauche, reflet, pied de la falaise droite, plage (écart moyen < 3/255)', Object.values(ec).every((v) => v < 3), JSON.stringify(ec));
    // 3. retour aux fonds nettoyés, en direct
    await p.evaluate(() => { window.__scene.reglages.ecumePeinte = 0; window.__scene.avancer(.1); });
    await p.waitForTimeout(300);
    await p.evaluate(() => window.__scene.avancer(1 / 60));
    const C = await capture('retour');
    ok(nom + ' : retour à 0, les traits sont de nouveau de l’eau', C.points.every((e) => Math.abs(e) < .05), fmt(C.points));
    const ecR = ecartZones(A.zones, C.zones);
    ok(nom + ' : le retour à 0 redonne la capture propre (zones, écart moyen < 2/255 : la mesure est stable)', Object.values(ecR).every((v) => v < 2), JSON.stringify(ecR));
    // la vue réelle (réfraction, reflets, écume animée, vent, brume, rayons remis), pour regarder : le camp entier et la baie
    await p.evaluate(() => { const r = window.__scene.reglages; r.eau = 1; r.reflets = 1; r.vagues = 1; r.vent = 1; r.brume = 1; r.nuages = 1; r.rayons = 1; r.portees = 1; r.legere = false; window.__scene.avancer(.5); });
    await p.screenshot({ path: path.join(OUT, 'camp_' + nom + '.png'), clip, timeout: 60000 });
    await p.screenshot({ path: path.join(OUT, 'mer_' + nom + '.png'), clip: { x: boite.x, y: boite.y + BAIE.y0, width: 720, height: BAIE.y1 - BAIE.y0 }, timeout: 60000 });
    ok(nom + ' : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  } catch (err) {
    ok(nom + ' : la page a tenu jusqu’au bout', false, (err && err.message || String(err)).slice(0, 300));
  } finally {
    await p.close().catch(() => {});
  }
}

async function prototype(b, nom) {
  const p = await page(b, { width: 390, height: 844 }, { isMobile: true, hasTouch: true });
  try {
    await p.goto('http://127.0.0.1:' + PORT + '/Prototype.dc.html?app=1#ecran=camp&heure=' + HEURES[nom] + '&nouv=tout', { waitUntil: 'load' });
    await p.waitForFunction(() => window.__scene, null, { timeout: 60000 });
    await p.waitForTimeout(2500);
    await p.evaluate(() => window.__scene.avancer(1.5));
    await p.waitForFunction(() => { const e = window.__scene.ecume; return e && e.prets && e.prets.length >= 4; }, null, { timeout: 15000 }).catch(() => {});
    const ecume = await p.evaluate(() => window.__scene.ecume || null);
    ok('Prototype ' + nom + ' : les fonds sont nettoyés dans la vraie app (les deux du départ avant la première image, les autres en différé)', !!(ecume && ecume.prets && ecume.prets.length >= 4 && !ecume.erreur), JSON.stringify(ecume));
    await p.screenshot({ path: path.join(OUT, 'proto_' + nom + '.png'), timeout: 60000 });
    ok('Prototype ' + nom + ' : console sans erreur', p.errs.length === 0, p.errs.join(' | '));
  } catch (err) {
    ok('Prototype ' + nom + ' : la page a tenu jusqu’au bout', false, (err && err.message || String(err)).slice(0, 300));
  } finally {
    await p.close().catch(() => {});
  }
}

(async () => {
  const b = await lancer();
  for (const [nom, h] of Object.entries(HEURES)) await moment(b, nom, h);
  for (const nom of ['jour', 'nuit']) await prototype(b, nom);
  await b.close();
  process.exit(bilan('t2210_ecume') ? 1 : 0);
})();
