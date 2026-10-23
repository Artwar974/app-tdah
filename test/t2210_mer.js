// 22/10 · la mer de Camp-scene.html aux 4 heures (lever 6.75, jour 10.25, coucher 19.5, nuit 22) : une capture de la baie par heure
// (les traits blancs peints doivent avoir disparu, sans tache), puis 12 captures à 80 ms de scène d'intervalle (scene.avancer) pour
// mesurer le clignotement (différences entre images consécutives, calculées ensuite par test/t2210_mer.py).
// Serveur : cd demo && python3 -m http.server 8771 --bind 127.0.0.1 ; puis PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node test/t2210_mer.js [dossier]
const path = require('path');
const fs = require('fs');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun.js');
const PORT = process.env.ATHENA_PORT || '8771';
const OUT = process.argv[2] || path.join(__dirname, 'logs', 't2210_mer');
fs.mkdirSync(OUT, { recursive: true });
const HEURES = { lever: 6.75, jour: 10.25, coucher: 19.5, nuit: 22 };

(async () => {
  const b = await lancer();
  for (const [nom, h] of Object.entries(HEURES)) {
    const p = await b.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
    p.setDefaultTimeout(90000);
    const errs = [];
    p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    await p.addInitScript(ESPION); await routerCdn(p);
    await p.goto('http://127.0.0.1:' + PORT + '/Camp-scene.html?heure=' + h, { waitUntil: 'load' });
    await p.waitForFunction(() => window.__scene, null, { timeout: 30000 });
    await p.waitForTimeout(1500);
    // la boîte de la toile et le cadrage « cover » : la baie va de y = 395 à 800 dans le repère de la scène
    const boite = await p.evaluate(() => { const r = document.getElementById('toile').getBoundingClientRect(); const e0 = Math.max(r.width / 720, r.height / 1280); return { x: r.x, y: r.y, w: r.width, h: r.height, e0, p0x: (r.width - 720 * e0) / 2, p0y: (r.height - 1280 * e0) / 2 }; });
    const clip = { x: boite.x, y: Math.max(0, boite.y + boite.p0y + 395 * boite.e0), width: boite.w, height: (800 - 395) * boite.e0 };
    // la vue large (Camp-scene.html ouvre en vue rapprochée) : la découpe et les zooms (t2210_crops.py) comptent sur le cadrage « cover » de base
    await p.evaluate(() => { window.__scene.camera({ x: 360, y: 640, z: 1, cache: 0 }, { immediat: true }); window.__scene.emettre('mont-paliers', { n: 4 }); window.__scene.avancer(2); });
    await p.screenshot({ path: path.join(OUT, 'mer_' + nom + '.png'), clip });
    await p.screenshot({ path: path.join(OUT, 'camp_' + nom + '.png') });
    for (let i = 0; i < 12; i++) { await p.evaluate(() => window.__scene.avancer(.08)); await p.screenshot({ path: path.join(OUT, 'suite_' + nom + '_' + String(i).padStart(2, '0') + '.png'), clip }); }
    fs.writeFileSync(path.join(OUT, 'boite_' + nom + '.json'), JSON.stringify(Object.assign({ clip }, boite)));
    ok(nom + ' : console sans erreur', errs.length === 0, errs.join(' | '));
    await p.close();
  }
  await b.close();
  process.exit(bilan('t2210_mer') ? 1 : 0);
})();
