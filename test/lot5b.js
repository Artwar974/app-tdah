// Lot 5 · les personnages (Prototype) : la caméra sur le calque HTML et la toile, les feuilles, le coffre, le glisser, choix 17 B, compagnons 2 et 3, mouvement réduit
const { URL, ESPION, lancer, routerCdn } = require('./_commun.js');   // navigateur, espion de la scène (window.__scene, window.__events), URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const res = []; const ok = (nom, cond, info) => { res.push(cond); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
(async () => {
  const b = await lancer();
  const ouvrir = async (hash, o) => { const p = await b.newPage({ viewport: { width: 1280, height: 950 }, reducedMotion: o && o.reduit ? 'reduce' : 'no-preference' }); const errs = []; await p.addInitScript(ESPION);
    await routerCdn(p);
    p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    await p.goto(URL + 'Prototype.dc.html#' + hash, { waitUntil: 'load' }); await p.waitForFunction(() => window.__scene && window.__scene.temps > .3, null, { timeout: 40000 }).catch(() => {}); await p.waitForTimeout(800); p.errs = errs; return p; };
  const attendre = async (p, s, max = 120) => { const t0 = await p.evaluate(() => window.__scene.temps), r0 = Date.now(); while (true) { await p.waitForTimeout(120); const t = await p.evaluate(() => window.__scene.temps); if (t - t0 >= s || Date.now() - r0 > max * 1000) return; } };
  const PH = '[data-screen-label="Prototype V1"]';
  const shot = async (p, nom) => { const el = await p.$(PH); if (el) await el.screenshot({ path: 'lot5_' + nom + '.png' }).catch(() => {}); };
  // 3 · la caméra sur le calque et la toile, le coffre, la feuille, le glisser
  let p = await ouvrir('ecran=camp&heure=10.25&nouv=tout&jours=3&bois=150&or=60&fait=0&cadrage=rapprochee');   /* (19/10, soir) la vue rapprochée est un réglage : on la demande */
  const tr = await p.$eval('[data-scene]', e => e.style.transform), trC = await p.$eval('canvas[data-pixi-scene]', e => e.style.transform);
  ok('3 en vue rapprochée (réglage), le calque du camp est zoomé (scale 1,12) et la toile a la transformation inverse', /scale\(1\.12/.test(tr) && /scale\(0\.89/.test(trC), tr + ' | ' + trC);
  await shot(p, 'proto_camp');
  const ph = await p.$eval(PH, e => { const r = e.getBoundingClientRect(); return { x: r.x, y: r.y, k: r.width / 390 }; });
  const coffre = await p.$('[data-el="coffre"]'); const cb = coffre && await coffre.boundingBox();
  const pc = await p.evaluate(() => { const V = window.ATHENA_V1, [w, cx, by] = V.CAMP.tentes[0].c; return [Math.max(4, Math.round(cx - w * .36) - 24), by - 26]; });   /* 20/10 · le coffre est dessiné au pied gauche de la tente */
  const attendu = await p.evaluate(pc => { const c = window.__scene.camera(); return [Math.max(6, Math.min(390 - 6 - 48, pc[0] * c.z + c.dx)), pc[1] * c.z + c.dy]; }, pc);   /* (relecture) le bouton reste à 6 px du bord au moins */
  ok('3 le bouton du coffre suit la caméra (à sa place zoomée, pas à celle d’avant)', !!cb && Math.abs((cb.x - ph.x) / ph.k - attendu[0]) < 3 && Math.abs((cb.y - ph.y) / ph.k - attendu[1]) < 3, cb ? `écran=${((cb.x - ph.x) / ph.k).toFixed(0)},${((cb.y - ph.y) / ph.k).toFixed(0)} attendu=${attendu.map(v => v.toFixed(0)).join(',')} avant=${pc.join(',')}` : 'absent');
  const base = await p.evaluate(() => window.__scene.camera()); await p.click('[data-el="barre_poignee"]'); await attendre(p, 2.5); const cfe = await p.evaluate(() => window.__scene.camera()); await shot(p, 'proto_feuille');
  const feuHaut = await p.evaluate(() => { const f = document.querySelector('[data-feuille="1"][data-tirable="1"]'), c = window.__scene.camera(), V = window.ATHENA_V1, fy = window.AthenaScene.depuisTelephone(...V.CAMP.feu)[1], K = 844 / 1280; return { feuille: f ? f.offsetTop : null, feu: Math.round((fy - c.y) * K * c.z + 422) }; });
  ok('3 une feuille ouverte : la caméra glisse vers le haut, le feu reste visible au-dessus de la feuille', cfe.y > base.y + 60 && feuHaut.feuille != null && feuHaut.feu < feuHaut.feuille - 20 && feuHaut.feu > 120, `base y=${base.y.toFixed(0)} feuille y=${cfe.y.toFixed(0)} feu à ${feuHaut.feu} px, feuille à ${feuHaut.feuille} px`);
  await p.click('[data-feuille="1"] button[aria-label="Fermer"]').catch(async () => { await p.keyboard.press('Escape'); }); await attendre(p, 2.5); const cre = await p.evaluate(() => window.__scene.camera()); ok('3 feuille fermée : retour au cadrage de base', Math.abs(cre.y - base.y) < 2, `y=${cre.y.toFixed(0)}`);
  // le glisser jusqu'au feu : « Lâche ici » à la position du feu vue par la caméra
  const rond = await p.$('[role="button"][data-presse]'); const rb = await rond.boundingBox(); const feu = await p.evaluate(() => { const c = window.__scene.camera(); return [197 * c.z + c.dx, 572 * c.z + c.dy]; });
  const cx = rb.x + rb.width / 2, cy = rb.y + rb.height / 2, tx = ph.x + feu[0] * ph.k, ty = ph.y + feu[1] * ph.k;
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 14; i++) { await p.mouse.move(cx + (tx - cx) * i / 14, cy + (ty - cy) * i / 14); await p.waitForTimeout(40); }
  await p.waitForTimeout(250); const lache = await p.$('[data-t="camp.lacheIci"]'); ok('3 glisser une quête jusqu’au feu (à sa place vue par la caméra) : « Lâche ici »', !!lache, `feu écran=${feu.map(v => v.toFixed(0)).join(',')}`); await shot(p, 'proto_glisser'); await p.mouse.up(); await attendre(p, 3);
  const ev = await p.evaluate(() => window.__events.map(e => e[0])); ok('3 la quête validée : « quete-validee » à la scène (20/10 : le bois et l’or vont aux compteurs, plus de « coffre-recoit »)', ev.includes('quete-validee') && !ev.includes('coffre-recoit'), ev.filter(x => x !== 'toucher').join(','));
  ok('3 Prototype sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 3 bis · vue large (choix 17 B), compagnons 2 et 3
  p = await ouvrir('ecran=camp&heure=10.25&nouv=tout&jours=3&compagnons=3');   /* (19/10, soir) sans réglage : la vue large, tout le camp */
  const cl = await p.evaluate(() => window.__scene.camera()); const els = await p.evaluate(() => window.__scene.elements().filter(id => /compagnon/.test(id)));
  const defs = await p.evaluate(() => ['compagnon-2', 'compagnon-3'].map(id => { const e = window.__scene.element(id); return e ? [e.def.teinte, e.def.taille, e.def.allure, (e.def.habitudes || []).join('+')].join(' ') : 'absent'; }));
  ok('3 bis par défaut, la vue large (choix 17 B, tranché le 19/10 au soir) : z 1', Math.abs(cl.z - 1) < 1e-3, 'z=' + cl.z); ok('3 bis compagnons=3 : les compagnons 2 et 3 au camp, teintés, chacun sa taille, son pas, ses habitudes', els.includes('compagnon-2') && els.includes('compagnon-3') && /plage/.test(defs[0]) && /comptoir/.test(defs[1]), defs.join(' | '));
  await attendre(p, 2); await shot(p, 'proto_large_compagnons'); ok('3 bis sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 3 ter · mouvement réduit : la feuille ouverte ne déplace pas la caméra
  p = await ouvrir('ecran=camp&heure=10.25&nouv=tout&jours=3&sheet=jour&cadrage=rapprochee', { reduit: true }); await p.waitForTimeout(600); const crp = await p.evaluate(() => window.__scene.camera());
  ok('3 ter mouvement réduit : la feuille ouverte ne déplace pas la caméra (cadrage de base, d’un coup)', Math.abs(crp.y - 681) < 1 && Math.abs(crp.z - 1.12) < 1e-3, `y=${crp.y.toFixed(0)} z=${crp.z}`); ok('3 ter sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // 3 quater · petite taille (360 × 693) : le calque suit toujours le décalage de la taille
  p = await ouvrir('ecran=camp&heure=10.25&nouv=tout&jours=3&taille=petit&cadrage=rapprochee'); const trp = await p.$eval('[data-scene]', e => e.style.transform); ok('3 quater taille petite : la transformation garde le décalage vertical (−100 px) et le zoom', /scale\(1\.12/.test(trp) && /-1[0-9]{2}\.\d+px\)/.test(trp), trp); await shot(p, 'proto_petit'); ok('3 quater sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  await b.close(); const ko = res.filter(x => !x).length; console.log(ko ? ko + ' contrôle(s) en échec' : 'tout passe');
})();
