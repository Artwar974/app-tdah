// Lot 5 · les personnages (Camp-scene et atelier) : caméra (choix 17), vie au repos, clignements, au revoir, suivi du bateau, visiteur, mouvement réduit
// Sous swiftshader la scène tourne à 4 ou 5 images par seconde : on attend en temps de scène (scene.temps), pas en temps réel.
const { URL, lancer, routerCdn } = require('./_commun.js');   // navigateur, URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const res = []; const ok = (nom, cond, info) => { res.push(cond); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
(async () => {
  const b = await lancer();
  const ouvrir = async (url, o) => { const p = await b.newPage({ viewport: o && o.petit ? { width: 230, height: 620 } : { width: 1280, height: 950 }, reducedMotion: o && o.reduit ? 'reduce' : 'no-preference' }); const errs = [];
    await routerCdn(p);
    p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    await p.goto(URL + url, { waitUntil: 'load' }); await p.waitForFunction(() => window.scene && window.scene.temps > .2, null, { timeout: 40000 }).catch(() => {}); p.errs = errs; return p; };
  const clic = async (p, t) => { await p.click('button:has-text("' + t + '")'); await p.waitForTimeout(80); };
  const etat = p => p.evaluate(() => window.scene.compagnon('minotaure').etatActif);
  const cam = p => p.evaluate(() => window.scene.camera());
  // attendre « s » secondes de scène (au plus « max » secondes réelles), en appelant « f » à chaque tour ; f peut renvoyer true pour arrêter
  const attendre = async (p, s, f, max = 240) => { const t0 = await p.evaluate(() => window.scene.temps), r0 = Date.now(); while (true) { await p.waitForTimeout(120); const t = await p.evaluate(() => window.scene.temps); if (f && await f(t - t0)) return true; if (t - t0 >= s || Date.now() - r0 > max * 1000) return false; } };
  const attendreRepos = p => attendre(p, 30, async () => (await etat(p)) === 'repos');
  // 1 · la caméra (comportement, petite fenêtre : la scène y tourne plus vite)
  let p = await ouvrir('Camp-scene.html?heure=10.25', { petit: true });
  const c0 = await cam(p); ok('1 caméra : vue rapprochée au montage (z 1,12, centre 392 × 681)', Math.abs(c0.z - 1.12) < 1e-3 && Math.abs(c0.x - 392) < 1 && Math.abs(c0.y - 681) < 1, JSON.stringify(c0));
  await clic(p, 'Vue large'); let inter = null; await attendre(p, 2.5, async () => { const c = await cam(p); if (!inter && c.z < 1.115 && c.z > 1.005) inter = c.z; return false; }); const c1 = await cam(p);
  ok('1 caméra : vue large (z 1) après un glissement (valeur intermédiaire vue)', Math.abs(c1.z - 1) < 2e-3 && Math.abs(c1.dx) < 1 && inter !== null, `z=${c1.z.toFixed(3)} intermédiaire=${inter}`);
  await clic(p, 'Vue rapprochée'); await attendre(p, 2.5);
  await clic(p, 'Une feuille ouverte'); await attendre(p, 2.5); const cf = await cam(p); ok('1 caméra : une feuille ouverte fait glisser vers le haut (y plus grand)', cf.y > 681 + 100 && Math.abs(cf.z - 1.12) < 1e-3, 'y=' + cf.y.toFixed(0));
  await clic(p, 'Une feuille ouverte'); await attendre(p, 2.5); const cf2 = await cam(p); ok('1 caméra : feuille fermée, retour au cadrage', Math.abs(cf2.y - 681) < 1, 'y=' + cf2.y.toFixed(0));
  await clic(p, 'Sommet (danse)'); let minY = 999, maxX = 0; await attendre(p, 4.2, async () => { const c = await cam(p); minY = Math.min(minY, c.y); maxX = Math.max(maxX, c.x); return false; }); const cs2 = await cam(p);
  ok('1 caméra : au Sommet, un léger mouvement vers le Mont (y plus petit, x plus grand), puis retour', minY < 681 - 50 && maxX > 392 + 10 && Math.abs(cs2.y - 681) < 4 && Math.abs(cs2.x - 392) < 4, `min y=${minY.toFixed(0)} max x=${maxX.toFixed(0)} fin=${cs2.x.toFixed(0)},${cs2.y.toFixed(0)}`);
  // 1 · la vie au repos sur commande, le clignement, le banc
  await attendre(p, 1.5); const gestes = {}; for (const [t, e] of [['S’étire', 'etire'], ['Se gratte la tête', 'gratte'], ['Tapote du pied', 'tapote'], ['Bâille', 'baille'], ['Au revoir', 'aurevoir'], ['Signe de la main', 'signe']]) {
    let vu = false; for (let essai = 0; essai < 3 && !vu; essai++) { await attendreRepos(p); await clic(p, t); const st = await etat(p); if (st === e) vu = true; else await attendre(p, 2); } gestes[e] = vu; if (vu) await attendre(p, 3); }
  ok('1 vie au repos : les six états sur commande', Object.values(gestes).every(Boolean), JSON.stringify(gestes));
  // le banc : on insiste jusqu'à ce que le geste soit pris (il peut être en train de marcher ou de réagir), puis on attend qu'il s'assoie
  let pris = false; for (let essai = 0; essai < 6 && !pris; essai++) { await attendreRepos(p); const n0 = await p.$eval('#journal', e => e.textContent.length); await clic(p, 'S’assoit sur le banc'); const j = await p.$eval('#journal', e => e.textContent); pris = /geste banc(?! \(pas)/.test(j.slice(0, j.length - n0 + 40)); if (!pris) await attendre(p, 2); }
  const assis = pris && await attendre(p, 30, async () => (await etat(p)) === 'assis'); const ou = await p.evaluate(() => { const m = window.scene.element('minotaure'), b = window.scene.element('banc'); return [Math.round(m.x - b.x), Math.round(m.y - b.y)]; });
  ok('1 vie au repos : il va s’asseoir sur le banc (assis, tout près du banc)', assis && Math.abs(ou[0]) < 60 && Math.abs(ou[1]) < 40, `pris=${pris} écart au banc=${ou.join(',')}`);
  // 1 · le visiteur : les autres vont à sa rencontre
  await attendre(p, 2); await clic(p, 'Un compagnon de plus'); await attendre(p, 1); const av = await p.evaluate(() => { const c = window.scene.element('compagnon-2'); return [Math.round(c.x), Math.round(c.y)]; });
  await clic(p, 'Un compagnon en visite'); await attendre(p, 1.5); const j1 = await p.$eval('#journal', e => e.textContent); ok('1 visiteur : « compagnon-arrive » dans le journal', /compagnon-arrive/.test(j1), j1.split('\n').slice(0, 3).join(' | '));
  // pendant que le visiteur arrive (40 s de scène au plus), on suit le compagnon 2 : sa distance au sol au visiteur, et son salut (bras levés)
  let dMin = 9999, salue = false, bouge = 0; await attendre(p, 40, async () => { const r = await p.evaluate(() => { const c = window.scene.element('compagnon-2'), v = window.scene.element('visiteur'), m = window.scene.compagnon('compagnon-2'); return { d: Math.hypot(c.x - v.x, (c.y - v.y) * 2.2), e: m.etatActif, c: [c.x, c.y] }; }); dMin = Math.min(dMin, r.d); if (r.e === 'bras' || r.e === 'content') salue = true; bouge = Math.max(bouge, Math.hypot(r.c[0] - av[0], r.c[1] - av[1])); return salue && dMin < 220; });
  ok('1 rencontre : le compagnon 2 est allé à la rencontre du visiteur (s’en est approché) et l’a salué', dMin < 220 && salue && bouge > 30, `distance min=${dMin.toFixed(0)} salut=${salue} déplacement=${bouge.toFixed(0)}`);
  ok('1 Camp-scene (comportement) sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 1 bis · l'au revoir avant d'embarquer, puis le suivi du bateau
  p = await ouvrir('Camp-scene.html?heure=10.25', { petit: true }); await attendreRepos(p); await clic(p, 'Départ en expédition'); let adieu = false, suivi = false, maxDx = 0;
  await attendre(p, 45, async () => { const st = await etat(p); if (st === 'aurevoir') adieu = true; const c = await cam(p); maxDx = Math.max(maxDx, Math.hypot(c.x - 392, c.y - 681)); if (maxDx > 8) suivi = true; return adieu && suivi; });
  ok('1 bis au revoir de la main avant d’embarquer', adieu); ok('1 bis au départ, la caméra suit un peu le bateau', suivi, 'écart max=' + maxDx.toFixed(0)); ok('1 bis sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 1 ter · mouvement réduit : la caméra ne bouge jamais
  p = await ouvrir('Camp-scene.html?heure=10.25&reduit=1', { petit: true }); await clic(p, 'Une feuille ouverte'); await attendre(p, .3); const cr = await cam(p); await clic(p, 'Sommet (danse)'); await attendre(p, 1.5); const cr2 = await cam(p);
  ok('1 ter mouvement réduit : le cadrage de base s’applique d’un coup, jamais de mouvement (feuille : d’un coup ; Sommet : rien)', cr.y > 681 + 100 && Math.abs(cr2.y - cr.y) < .5 && Math.abs(cr2.x - cr.x) < .5, `feuille y=${cr.y.toFixed(0)} sommet x=${cr2.x.toFixed(0)} y=${cr2.y.toFixed(0)}`); await p.close();
  // 1 quater · captures en vraie taille
  p = await ouvrir('Camp-scene.html?heure=10.25'); const tel = await p.$('#tel'); await tel.screenshot({ path: 'lot5_cam_rapprochee.png' });
  await clic(p, 'Une feuille ouverte'); await attendre(p, 2.5); await tel.screenshot({ path: 'lot5_cam_feuille.png' }); await clic(p, 'Une feuille ouverte'); await clic(p, 'Vue large'); await attendre(p, 2.5); await tel.screenshot({ path: 'lot5_cam_large.png' });
  await clic(p, 'Vue rapprochée'); await attendreRepos(p); await clic(p, 'S’étire'); await attendre(p, .9); await tel.screenshot({ path: 'lot5_etire.png' }); ok('1 quater captures sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 2 · atelier
  p = await ouvrir('atelier.html'); await p.waitForFunction(() => window.__atelier && window.__atelier.p, null, { timeout: 30000 }); await p.waitForTimeout(800);
  const nEtats = await p.$$eval('#etats button', l => l.length); const nGen = await p.$$eval('#generaux input', l => l.length);
  await clic(p, 'S’étire'); const ea = await p.evaluate(() => window.__atelier.p.etatActif); await p.waitForTimeout(700); await (await p.$('#scene')).screenshot({ path: 'lot5_atelier_etire.png' });
  await clic(p, 'Se gratte la tête'); await p.waitForTimeout(700); await (await p.$('#scene')).screenshot({ path: 'lot5_atelier_gratte.png' });
  await clic(p, 'Bâille'); await p.waitForTimeout(900); const tv = await p.evaluate(() => window.__atelier.p.teteVisible); await (await p.$('#scene')).screenshot({ path: 'lot5_atelier_baille.png' });
  const json = await p.$eval('#json', e => e.value); ok('2 atelier : 17 états, le clignement et le mouvement secondaire en curseurs, « Copier les réglages » les contient', nEtats === 17 && nGen >= 9 && ea === 'etire' && /"clignement"/.test(json) && /"secondaire"/.test(json) && /"etire"/.test(json), `états=${nEtats} généraux=${nGen} état=${ea}`);
  ok('2 atelier : au plus fort du bâillement, les yeux fermés', tv === 'dort', tv);
  // le clignement : vue de trois quarts (la seule qui a des têtes dessinées), la tête « dort » apparaît 120 ms toutes les 3 à 6 s
  await clic(p, 'Repos'); await p.waitForTimeout(300); const clign = await p.evaluate(async () => { const m = window.__atelier.p; let dort = 0, n = 0; const t0 = performance.now(); while (performance.now() - t0 < 9000) { await new Promise(r => setTimeout(r, 20)); n++; if (m.teteVisible === 'dort') dort++; } return { dort, n, vue: m.vueActive, tete: m.teteVisible }; });
  ok('2 clignement : la tête « dort » vue un court instant (une à trois fois en 9 s), la tête active reste calme', clign.dort >= 1 && clign.dort < clign.n / 4 && clign.vue === 'face', JSON.stringify(clign)); ok('2 atelier sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  await b.close(); const ko = res.filter(x => !x).length; console.log(ko ? ko + ' contrôle(s) en échec' : 'tout passe');
})();
