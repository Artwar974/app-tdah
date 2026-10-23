// 22/10 · le départ en expédition dans le Prototype : le minotaure longe le ponton, monte à bord, le bateau part le long de sa route
// et s'éloigne vers l'horizon ; au retour il revient et le minotaure descend. Relève l'état du bateau à t = 0, 2, 5, 10, 20, 30, 40 s
// de scène (scene.avancer : le rendu headless est trop lent pour le temps réel), et le cas « Rentrer » pendant la marche.
// Serveur : cd demo && python3 -m http.server 8771 --bind 127.0.0.1 ; puis : PLAYWRIGHT_BROWSERS_PATH=/opt/pw-browsers node test/t2210_bateau.js [dossier des captures] [reduit]
const path = require('path');
const fs = require('fs');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun.js');
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.modeApp === 'function') return s.logic; if (s && typeof s.modeApp === 'function') return s; f = f.return; } return null; };`;
const PORT = process.env.ATHENA_PORT || '8771';
const OUT = process.argv[2] || path.join(__dirname, 'logs', 't2210_bateau');
const REDUIT = process.argv.includes('reduit');
fs.mkdirSync(OUT, { recursive: true });

async function ouvrir(b) {
  const p = await b.newPage({ viewport: { width: 412, height: 915 }, deviceScaleFactor: 1, reducedMotion: REDUIT ? 'reduce' : 'no-preference' });
  p.errs = [];
  p.on('pageerror', (e) => p.errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') p.errs.push('console ' + m.text().slice(0, 200)); });
  await p.addInitScript(ESPION); await p.addInitScript(LOGIQUE); await routerCdn(p);
  await p.goto('http://127.0.0.1:' + PORT + '/Prototype.dc.html?app=1#ecran=camp&heure=10.25&nouv=tout', { waitUntil: 'load' });
  await p.waitForFunction(() => window.__scene && window.__logique(), null, { timeout: 30000 });
  await p.waitForTimeout(1500);
  // les événements émis par la scène elle-même (compagnon-parti, bateau-au-large, bateau-accoste, butin-depose)
  await p.evaluate(() => { window.__int = []; for (const n of ['compagnon-parti', 'bateau-au-large', 'bateau-accoste', 'butin-depose']) window.__scene.on(n, () => window.__int.push(n + '@' + window.__scene.temps.toFixed(1))); window.__scene.avancer(1); });
  return p;
}
const etat = (p) => p.evaluate(() => {
  const s = window.__scene, b = s.element('bateau'), m = s.element('minotaure'), mo = s.compagnon('minotaure');
  return { t: +s.temps.toFixed(1), bateau: b && [Math.round(b.x), Math.round(b.y)], bEtat: b && b.etat, bVisible: b && b.visible, mino: m && [Math.round(m.x), Math.round(m.y), mo && mo.etatActif, m.visible, m.etat, m.but && m.but.map(Math.round)], ev: window.__int.slice() };
});
// avance la scène jusqu'à t secondes après t0 (temps de scène), par tranches (setTimeout de la page entre deux tranches)
async function jusqua(p, t0, t) { let r = await etat(p); while (r.t < t0 + t - 1e-6) { const d = Math.min(1, t0 + t - r.t); await p.evaluate((d) => window.__scene.avancer(d), d); await p.waitForTimeout(30); r = await etat(p); } return r; }

(async () => {
  const b = await lancer();
  // ---- 1. le départ, puis le retour
  let p = await ouvrir(b);
  const av = await etat(p); console.log('avant', JSON.stringify(av));
  await p.evaluate(() => window.__logique().parcoursAction('partir', null, null, 'moyen', null));
  await p.waitForTimeout(300);
  const t0 = (await etat(p)).t, releves = {};
  const TEMPS = [0, 2, 5, 10, 20, 30, 40, 50];
  for (const t of TEMPS) {
    releves[t] = await jusqua(p, t0, t);
    console.log('t=' + t, JSON.stringify(releves[t]));
    await p.screenshot({ path: path.join(OUT, 'depart_' + t + '.png') });
  }
  const evs = releves[50].ev;
  ok('le minotaure a embarqué (compagnon-parti)', evs.some((e) => e.startsWith('compagnon-parti')), evs.join(','));
  ok('le minotaure est effacé à 50 s', releves[50].mino && releves[50].mino[3] === false, JSON.stringify(releves[50].mino));
  if (REDUIT) {
    ok('mouvement réduit : le bateau est au large tout de suite (< 2 s)', releves[2].bEtat === 'large' && evs.some((e) => e.startsWith('bateau-au-large')), releves[2].bEtat + ' ' + evs.join(','));
  } else {
    const xs = TEMPS.map((t) => releves[t].bateau && releves[t].bateau.join('/'));
    // le minotaure embarque vers 18,6 s (la marche, l'au revoir au pied du ponton, le ponton, le fondu), puis le bateau largue en 1,8 s : il bouge entre 20 et 30 s
    ok('le bateau a quitté le quai avant 30 s et bouge entre 20 et 30 s', releves[30].bateau[0] !== 462 && Math.hypot(releves[20].bateau[0] - releves[30].bateau[0], releves[20].bateau[1] - releves[30].bateau[1]) > 30, 'x/y : ' + xs.join(' → '));
    ok('le bateau est en route (aller) à 20 s', releves[20].bEtat === 'aller', releves[20].bEtat);
    ok('le bateau s\'éloigne vers l\'horizon (y et x baissent de 20 à 40 s)', releves[40].bateau[1] < releves[20].bateau[1] - 100 && releves[40].bateau[0] < releves[20].bateau[0] - 100, xs.join(' → '));
    ok('le bateau est au large à 50 s (bateau-au-large), invisible', releves[50].bEtat === 'large' && !releves[50].bVisible && evs.some((e) => e.startsWith('bateau-au-large')), releves[50].bEtat + ' ' + evs.join(','));
  }
  // le retour : le bateau revient, le minotaure descend et va déposer le butin (setTimeout de la scène : on laisse 2 s réelles passer)
  await p.evaluate(() => window.__scene.emettre('expedition-retour', { compagnon: 'minotaure' }));
  const r0 = (await etat(p)).t, rel = {};
  for (const t of [1, 5, 12, 25, 32, 40, 50]) { rel[t] = await jusqua(p, r0, t); console.log('retour t=' + t, JSON.stringify(rel[t])); await p.screenshot({ path: path.join(OUT, 'retour_' + t + '.png') }); await p.waitForTimeout(400); }
  ok('le bateau revient puis accoste (bateau-accoste)', rel[32].ev.some((e) => e.startsWith('bateau-accoste')), rel[32].bEtat + ' ' + rel[32].ev.join(','));
  ok('le minotaure est redescendu et visible', rel[32].mino && rel[32].mino[3] === true, JSON.stringify(rel[32].mino));
  ok('le minotaure est allé déposer le butin (avant 50 s)', rel[50].ev.some((e) => e.startsWith('butin-depose')), rel[50].ev.join(','));
  ok('console sans erreur (départ et retour)', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
  // ---- 2. « Rentrer » pendant que le minotaure marche encore vers le ponton : il renonce, le bateau reste amarré
  p = await ouvrir(b);
  await p.evaluate(() => window.__logique().parcoursAction('partir', null, null, 'moyen', null));
  await p.waitForTimeout(300);
  const u0 = (await etat(p)).t;
  const enMarche = await jusqua(p, u0, 3);
  console.log('rentrer : en marche', JSON.stringify(enMarche));
  await p.evaluate(() => window.__scene.emettre('expedition-retour', { compagnon: 'minotaure' }));
  const apres = await jusqua(p, u0, 30);
  console.log('rentrer : 27 s après', JSON.stringify(apres));
  await p.screenshot({ path: path.join(OUT, 'rentrer_30.png') });
  ok('rentré pendant la marche : le minotaure reste au camp, visible', apres.mino && apres.mino[3] === true, JSON.stringify(apres.mino));
  // en mouvement réduit il n'y a pas de marche : à 3 s il est déjà parti et le bateau au large ; « Rentrer » le ramène d'un coup (accoste, butin déposé)
  if (REDUIT) ok('rentré (mouvement réduit) : tout s\'est fait d\'un coup, le bateau est à quai et le butin déposé', apres.bEtat === 'amarre' && apres.ev.some((e) => e.startsWith('bateau-accoste')) && apres.ev.some((e) => e.startsWith('butin-depose')), apres.bEtat + ' ' + apres.ev.join(','));
  else ok('rentré pendant la marche : le bateau reste amarré', apres.bEtat === 'amarre' && !apres.ev.some((e) => e.startsWith('compagnon-parti')), apres.bEtat + ' ' + apres.ev.join(','));
  ok('console sans erreur (rentrer)', p.errs.length === 0, p.errs.join(' | '));
  await p.close();
  await b.close();
  process.exit(bilan('t2210_bateau' + (REDUIT ? '_reduit' : '')) ? 1 : 0);
})();
