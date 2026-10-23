// 22/10 · le chantier des quêtes (Prototype) : la barre du bas sans les quêtes faites, sans « C’est fait » ni « Version courte » (à leur place, le moment ou les
// minutes qui restent), le rond qui se remplit au minuteur (0 / 50 / 100 %), « Annuler » qui ramène la quête, le glisser vers le feu et l’appui long qui valident
// toujours ; l’écran Créer dans le nouvel ordre (activité, moment avec le sélecteur d’heure, répétition sans jours du mois) ; les options sans version courte.
// Serveur : cd demo && python3 -m http.server 8772 --bind 127.0.0.1 (ATHENA_PORT pour un autre port). Captures dans test/captures/2210/ (non suivies).
const fs = require('fs'), path = require('path');
const { lancer, routerCdn, ESPION } = require('./_commun.js');
process.chdir(__dirname);
const PORT = process.env.ATHENA_PORT || 8772, URL = 'http://127.0.0.1:' + PORT + '/Prototype.dc.html?app=1#';
const CAP = path.join(__dirname, 'captures', '2210');   /* captures/ est dans .gitignore */ fs.mkdirSync(CAP, { recursive: true });
const LOG = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.modeApp === 'function') return s.logic; if (s && typeof s.modeApp === 'function') return s; f = f.return; } return null; };`;
const res = [], ok = (nom, cond, info) => { res.push(!!cond); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
(async () => {
  const b = await lancer();
  const ouvrir = async (hash, o) => { const c = Object.assign({ vp: { width: 390, height: 844 }, reduit: false }, o); const p = await b.newPage({ viewport: c.vp, reducedMotion: c.reduit ? 'reduce' : 'no-preference' }); const errs = [];
    await p.addInitScript(ESPION); await p.addInitScript(LOG); await routerCdn(p);
    p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 300))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 300)); });
    await p.goto(URL + hash, { waitUntil: 'load' }); await p.waitForFunction(() => window.__logique && window.__logique() && window.__logique().state.pret, null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(2500); p.errs = errs; return p; };
  const shot = (p, nom) => p.screenshot({ path: path.join(CAP, nom + '.png') });
  const etat = p => p.evaluate(() => { const L = window.__logique(), S = L.state; const cur = S.quetes.find(q => q.id === S.curId && !q.fait) || L.tri(S.quetes).find(q => !q.fait); return { curCle: !!(cur && cur.cle), quetes: S.quetes.map(q => ({ id: q.id, fait: q.fait, h: q.h, cr: q.cr, timer: !!q.timer })), curId: S.curId, annuler: !!S.annuler,
    ronds: [...document.querySelectorAll('.nosb [role="button"][data-presse]')].length, ligne: !!document.querySelector('[aria-label^="Quête en cours"]'), info: (document.querySelector('[data-barre-info]') || {}).textContent || '', infoK: (document.querySelector('[data-barre-info]') || { getAttribute: () => '' }).getAttribute('data-barre-info'), cle: !!document.querySelector('[data-barre-info] [data-cle]'),
    fait: !!document.querySelector('[data-el="barre_fait"]'), courte: !!document.querySelector('[data-el="barre_courte"]'), rempl: [...document.querySelectorAll('[data-rempl]')].map(e => +e.getAttribute('data-rempl')), clip: [...document.querySelectorAll('[data-rempl]')].map(e => e.style.clipPath), sabliers: document.querySelectorAll('.nosb svg[viewBox="0 0 12 16"]').length,
    titre: (document.querySelector('[aria-label^="Quête en cours"] ~ div span') || {}).textContent, sous: [...document.querySelectorAll('[data-t]')].filter(e => /^statut\./.test(e.getAttribute('data-t'))).map(e => e.getAttribute('data-t') + '=' + e.textContent).join(' ; ') }; });
  const timer = (p, frac, dur, idx) => p.evaluate(([frac, dur, idx]) => { const L = window.__logique(), S = L.state, L2 = L.tri(S.quetes).filter(q => !q.fait), q = L2[idx || 0]; L.setState({ quetes: S.quetes.map(z => z.id === q.id ? Object.assign({}, z, { timer: { start: Date.now() - frac * dur * 1000, dur } }) : z) }); return q.id; }, [frac, dur, idx]);

  // 1 · la barre : 5 quêtes dont 2 faites → 2 ronds (la quête en cours est dans la ligne), aucune coche « fait », ni « C’est fait » ni « Version courte » ; à droite du nom, le moment (créneau)
  let p = await ouvrir('ecran=camp&heure=10.25&fait=2&nouv=tout'); let e = await etat(p);
  ok('1 barre : 2 faites sur 5 → la ligne + 2 ronds, les faites absentes de la barre', e.ronds === 2 && e.ligne && e.quetes.filter(q => q.fait).length === 2, `ronds=${e.ronds} ligne=${e.ligne}`);
  ok('1 barre : plus de bouton « C’est fait » ni de pastille « Version courte »', !e.fait && !e.courte);
  ok('1 barre : la pastille dit le créneau de la quête en cours (Après-midi) ; le point doré suit l’habitude clé', e.infoK === 'creneau' && /Après-midi/.test(e.info) && e.cle === e.curCle, `info=« ${e.info} » k=${e.infoK} cle=${e.cle}`);
  await p.evaluate(() => { const L = window.__logique(), S = L.state, cur = S.quetes.find(q => q.id === S.curId && !q.fait) || L.tri(S.quetes).find(q => !q.fait); L.setState({ quetes: S.quetes.map(z => z.id === cur.id ? Object.assign({}, z, { h: '10:30', cle: true }) : z) }); }); await p.waitForTimeout(400); e = await etat(p);
  ok('1 barre : une heure précise (10 h 30, pas encore passée) → « Vers 10 h 30 » avec le point doré de l’habitude clé, le sous-titre « En cours » (pas « À 10 h 30 » en double)', e.infoK === 'heure' && /Vers 10 h 30/.test(e.info) && e.cle && /statut\.enCours/.test(e.sous), `info=« ${e.info} » cle=${e.cle} sous=${e.sous}`);
  await p.evaluate(() => { const L = window.__logique(); L.setState({ encours: 'rangee' }); }); await p.waitForTimeout(400); e = await etat(p);
  ok('1 barre (choix B, quête en cours dans la rangée) : 3 ronds, pas de rond dans la ligne, toujours sans les faites', e.ronds === 3 && !e.ligne, `ronds=${e.ronds} ligne=${e.ligne}`);
  await p.evaluate(() => { const L = window.__logique(); L.setState({ encours: 'ligne' }); }); await p.waitForTimeout(300);
  // 2 · le minuteur : le rond de la quête en cours se VIDE pendant le décompte (22/10, liste V2 : plein au départ, moitié, vide à la fin), les minutes qui restent à droite, le sablier ne double pas le remplissage ; à la fin, « Sable écoulé » et le toast
  await timer(p, 0, 60); await p.waitForTimeout(1200); e = await etat(p); const clip0 = e.clip[0] || ''; await p.screenshot({ path: path.join(CAP, 'minuteur-0.png'), clip: { x: 0, y: 690, width: 390, height: 154 } });   /* la capture prend plusieurs secondes : tout se lit avant */
  ok('2 minuteur au départ : data-rempl ≥ 90 (presque plein ; la machine de test peut prendre quelques secondes), 55 à 60 min à droite, le sous-titre « En cours »', e.rempl.length >= 1 && e.rempl[0] >= 90 && e.infoK === 'min' && /^(60|59|58|57|56|55)[ \u00a0]min$/.test(e.info) && /statut\.enCours/.test(e.sous), `rempl=${e.rempl} info=« ${e.info} » sous=${e.sous}`);
  ok('2 minuteur au départ : clip-path inset depuis le haut ≤ 10 % (presque tout rempli), cohérent avec data-rempl', /inset\(([0-9](\.\d+)?|10)%/.test(clip0) && Math.abs(100 - parseFloat(clip0.slice(6)) - e.rempl[0]) <= 1, clip0 + ' rempl=' + e.rempl[0]);
  await timer(p, .5, 60); await p.waitForTimeout(1300); e = await etat(p); await p.screenshot({ path: path.join(CAP, 'minuteur-50.png'), clip: { x: 0, y: 690, width: 390, height: 154 } });
  ok('2 minuteur à mi-course : data-rempl 48 à 50, « 30 min » (ou 29)', e.rempl[0] >= 48 && e.rempl[0] <= 50 && /^(30|29) min$/.test(e.info), `rempl=${e.rempl} info=« ${e.info} »`);
  await timer(p, 1, 60); await p.waitForTimeout(1500); e = await etat(p); const toast = await p.evaluate(() => [...document.querySelectorAll('[role="status"]')].map(x => x.textContent).join(' | ')); await p.screenshot({ path: path.join(CAP, 'minuteur-100.png'), clip: { x: 0, y: 690, width: 390, height: 154 } });
  ok('2 minuteur à la fin : disque vide (data-rempl 0), plus de pastille, « Sable écoulé », le toast « sable passé / tombé »', e.rempl[0] === 0 && !e.info && /statut\.ecoule/.test(e.sous) && /sable/i.test(toast), `rempl=${e.rempl} sous=${e.sous} toast=« ${toast} »`);
  await p.evaluate(() => { const L = window.__logique(), S = L.state; L.setState({ quetes: S.quetes.map(z => Object.assign({}, z, { timer: null })) }); }); await p.waitForTimeout(300);
  await timer(p, .5, 60, 1); await p.waitForTimeout(1300); e = await etat(p);
  ok('2 minuteur sur une quête de la rangée : son rond est à mi-course (data-rempl ≈ 50) et aucun petit sablier', e.rempl.some(v => v >= 48 && v <= 52) && e.sabliers === 0, `rempl=${e.rempl} sabliers=${e.sabliers}`);
  const trans = await p.$eval('[data-rempl]', el => getComputedStyle(el).transitionProperty); ok('2 mouvement normal : le remplissage glisse (transition clip-path)', /clip-path/.test(trans), trans);
  await shot(p, 'camp-390'); ok('1-2 camp 390 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 3 · mouvement réduit : le remplissage se met à jour sans transition
  p = await ouvrir('ecran=camp&heure=10.25&fait=0&nouv=tout', { reduit: true }); await timer(p, .5, 60); await p.waitForTimeout(1200);
  const mv = await p.evaluate(() => { const ph = document.querySelector('[data-mouvement]'), el = document.querySelector('[data-rempl]'); return { mouvement: ph && ph.getAttribute('data-mouvement'), tp: el ? getComputedStyle(el).transitionProperty : null, rempl: el && el.getAttribute('data-rempl') }; });
  ok('3 mouvement réduit : data-mouvement=reduit, le remplissage sans transition clip-path, la valeur reste', mv.mouvement === 'reduit' && mv.tp && !/clip-path/.test(mv.tp) && +mv.rempl >= 45 && +mv.rempl <= 55, JSON.stringify(mv));
  ok('3 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 4 · 360 × 640 : la pastille tient dans la barre, rien ne déborde
  p = await ouvrir('ecran=camp&heure=10.25&fait=2&nouv=tout', { vp: { width: 360, height: 640 } }); await timer(p, .5, 600); await p.waitForTimeout(1300);
  const bb = await p.evaluate(() => { const i = document.querySelector('[data-barre-info]'), r = i && i.getBoundingClientRect(), f = parseFloat(getComputedStyle(i).fontSize); return { droite: r && r.right, haut: r && r.height, police: f, large: document.documentElement.scrollWidth }; });
  ok('4 360 × 640 : la pastille tient (bord droit ≤ 360), police ≥ 13 px, pas de défilement horizontal', bb.droite <= 360 && bb.police >= 13 && bb.large <= 360, JSON.stringify(bb));
  await shot(p, 'camp-360'); ok('4 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 5 · tout est fait : la ligne dit « Le Sommet », plus aucun rond
  p = await ouvrir('ecran=camp&heure=10.25&fait=5&nouv=tout'); e = await etat(p); const sommet = await p.$('[data-t="barre.journeeValidee"]');
  ok('5 journée validée : aucun rond, pas de quête en cours, « Le Sommet » (barre.journeeValidee)', e.ronds === 0 && !e.ligne && !!sommet && !e.info, `ronds=${e.ronds} ligne=${e.ligne}`);
  ok('5 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 6 · valider (appui) puis « Annuler » : la quête quitte la barre, puis y revient en cours (fige=0 : un état posé par l’adresse reste figé jusqu’au premier toucher)
  p = await ouvrir('ecran=camp&heure=10.25&fait=0&fige=0&nouv=tout'); const e0 = await etat(p);
  const idV = await p.evaluate(() => { const L = window.__logique(), S = L.state, id = S.curId || L.tri(S.quetes).find(q => !q.fait).id; L.valider(id, 36, 750, 'appui'); return id; }); await p.waitForFunction(id => window.__logique().state.quetes.find(q => q.id === id).fait, idV, { timeout: 15000 }).catch(() => {}); await p.waitForTimeout(600); e = await etat(p);   /* en mode sans fenêtre (swiftshader), les attentes de valider() s’étirent */
  const qv = e.quetes.find(q => q.id === idV);
  ok('6 validée : la quête est faite, hors de la barre (un rond de moins), une autre passe en cours, « Annuler » proposé', qv && qv.fait && e.ronds === e0.ronds - 1 && e.curId !== idV && e.annuler, `ronds ${e0.ronds}→${e.ronds} cur=${e.curId} annuler=${e.annuler}`);
  const bA = await p.$('[role="status"] button'); if (bA) await bA.click(); await p.waitForTimeout(900); e = await etat(p); const qa = e.quetes.find(q => q.id === idV);
  ok('6 « Annuler » : la quête revient dans la barre, en cours, plus faite', qa && !qa.fait && e.curId === idV && e.ronds === e0.ronds && e.ligne, `ronds=${e.ronds} cur=${e.curId}`);
  // 7 · le glisser vers le feu valide toujours
  const ph = await p.evaluate(() => { const r = document.querySelector('[data-screen-label="Prototype V1"]').getBoundingClientRect(); return { x: r.left, y: r.top, k: r.width / 390 }; });
  const rond = await p.$('[aria-label^="Quête en cours"]'); const rb = await rond.boundingBox(); const feu = await p.evaluate(() => { const c = window.__scene.camera(); return [197 * c.z + c.dx, 572 * c.z + c.dy]; });
  const cx = rb.x + rb.width / 2, cy = rb.y + rb.height / 2, tx = ph.x + feu[0] * ph.k, ty = ph.y + feu[1] * ph.k;
  await p.mouse.move(cx, cy); await p.mouse.down(); for (let i = 1; i <= 14; i++) { await p.mouse.move(cx + (tx - cx) * i / 14, cy + (ty - cy) * i / 14); await p.waitForTimeout(40); } await p.waitForTimeout(250); const lache = await p.$('[data-t="camp.lacheIci"]'); const drag = await p.evaluate(() => JSON.stringify(window.__logique().state.drag)); await p.mouse.up(); await p.waitForTimeout(2200); e = await etat(p);
  ok('7 glisser la quête en cours jusqu’au feu : « Lâche ici », puis validée (hors de la barre)', !!lache && e.quetes.find(q => q.id === idV).fait && e.ronds === e0.ronds - 1, `lache=${!!lache} ronds=${e.ronds} drag=${drag} feu=${feu.map(v => v.toFixed(0))} ph=${JSON.stringify(ph)}`);
  // 8 · l’appui long valide toujours (anneau, puis validation)
  await p.waitForTimeout(7000);   /* « Annuler » s’efface (V.JEU.annuler s) */
  const rond2 = await p.$('[aria-label^="Quête en cours"]'); const r2b = await rond2.boundingBox(); const id2 = await p.evaluate(() => window.__logique().state.curId);
  await p.mouse.move(r2b.x + r2b.width / 2, r2b.y + r2b.height / 2); await p.mouse.down(); await p.waitForTimeout(250); const anneau = await p.$('circle[stroke-dasharray="125.7"]'); await p.waitForTimeout(600); await p.mouse.up(); await p.waitForTimeout(1800); e = await etat(p);
  ok('8 appui long sur la quête en cours : l’anneau se remplit, la quête est validée', !!anneau && e.quetes.find(q => q.id === id2).fait && e.ronds === e0.ronds - 2, `anneau=${!!anneau} ronds=${e.ronds}`);
  ok('6-8 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 9 · Créer : l’activité (1), le moment (2) avec le sélecteur d’heure, la répétition (3) sans jours du mois
  p = await ouvrir('ecran=creer&etape=1&nouv=tout');
  const t1 = await p.evaluate(() => ({ titre: (document.querySelector('[data-t="cr.titre.1"]') || {}).textContent, bloque: !!document.querySelector('[data-feuille="1"] button[disabled]'), nom: !!document.querySelector('input[aria-label="Nom de la quête"]'), creneaux: document.querySelectorAll('[data-feuille="1"] button:has([data-t^="creneau."][data-t$=".t"])').length, courte: !!document.querySelector('[data-t="cr.courte.t"]') }));
  ok('9 étape 1 = l’activité : titre « Qu’est-ce que tu vas faire ? », le nom, pas de créneau ni de champ « version courte », Suivant bloqué sans nom', /faire/.test(t1.titre) && t1.nom && t1.creneaux === 0 && !t1.courte && t1.bloque, JSON.stringify(t1));
  await p.fill('input[aria-label="Nom de la quête"]', 'Arroser les plantes'); await p.waitForTimeout(200); await shot(p, 'creer-1');
  await p.click('[data-t="cr.suivant"]'); await p.waitForTimeout(500);
  const t2 = await p.evaluate(() => ({ titre: (document.querySelector('[data-t="cr.titre.2"]') || {}).textContent, creneaux: document.querySelectorAll('[data-feuille="1"] button:has([data-t^="creneau."][data-t$=".t"])').length, sw: !!document.querySelector('[role="switch"]'), heures: document.querySelectorAll('[data-heure]').length, etape: window.__logique().state.cr.etape }));
  ok('9 étape 2 = le moment : « C’est pour quand ? », 5 créneaux, l’interrupteur, pas encore de sélecteur d’heure', /quand/.test(t2.titre) && t2.creneaux === 5 && t2.sw && t2.heures === 0 && t2.etape === 2, JSON.stringify(t2));
  await shot(p, 'creer-2'); await p.click('[role="switch"]'); await p.waitForTimeout(700);
  const t3 = await p.evaluate(() => { const H = [...document.querySelectorAll('[data-heure]')], M = [...document.querySelectorAll('[data-minute]')], bb = x => x.getBoundingClientRect(), h5 = H[0], h8 = H.find(x => x.getAttribute('data-heure') === '8'); return { heures: H.length, minutes: M.length, grande: (document.querySelector('[data-heure-grande]') || {}).textContent, min44: H.every(x => bb(x).height >= 44 && bb(x).width >= 44) && M.every(x => bb(x).height >= 44 && bb(x).width >= 44), police: Math.min(...H.concat(M).map(x => parseFloat(getComputedStyle(x).fontSize))), h5op: getComputedStyle(h5).opacity, h5aria: h5.getAttribute('aria-label'), h8on: h8.getAttribute('aria-checked'), visible: bb(h8).left >= 0 && bb(h8).right <= 390, cre: window.__logique().state.cr.cre, h: window.__logique().state.cr.h }; });
  ok('9 l’heure précise : « 8 h » en grand, 19 heures (5 h à 23 h) et 4 minutes, cibles ≥ 44 px, texte ≥ 13 px, 5 h en retrait (hors du créneau Matin) mais présente, 8 h choisie et visible', t3.heures === 19 && t3.minutes === 4 && t3.grande === '8 h' && t3.min44 && t3.police >= 13 && +t3.h5op < 1 && /hors du créneau/.test(t3.h5aria) && t3.h8on === 'true' && t3.visible && t3.cre === 'matin', JSON.stringify(t3));
  await shot(p, 'creer-2-heure');
  await p.click('[data-heure="20"]'); await p.waitForTimeout(400); await p.click('[data-minute="30"]'); await p.waitForTimeout(700);
  const t4 = await p.evaluate(() => ({ cre: window.__logique().state.cr.cre, h: window.__logique().state.cr.h, grande: (document.querySelector('[data-heure-grande]') || {}).textContent, soir: (document.querySelector('button[aria-pressed="true"] [data-t="creneau.soir.t"]') || {}).textContent, visible: (() => { const r = document.querySelector('[data-heure="20"]').getBoundingClientRect(); return r.left >= 0 && r.right <= 390; })() }));
  ok('9 choisir 20 h puis 30 : l’heure 20:30 (« 20 h 30 »), le créneau suit (Soir), 20 h amenée en vue', t4.h === '20:30' && t4.cre === 'soir' && t4.grande === '20 h 30' && t4.soir === 'Soir' && t4.visible, JSON.stringify(t4));
  await shot(p, 'creer-2-soir');
  await p.click('[data-feuille="1"] button:has([data-t="creneau.matin.t"])'); await p.waitForTimeout(500);
  const t5 = await p.evaluate(() => ({ cre: window.__logique().state.cr.cre, h: window.__logique().state.cr.h, precise: window.__logique().state.cr.precise }));
  ok('9 revenir au créneau Matin alors que l’heure en sortait : l’heure rejoint le début du créneau (06:00), l’heure précise reste allumée', t5.cre === 'matin' && t5.h === '06:00' && t5.precise, JSON.stringify(t5));
  await p.click('[data-heure="5"]'); await p.waitForTimeout(400);
  const t6 = await p.evaluate(() => ({ cre: window.__logique().state.cr.cre, h: window.__logique().state.cr.h, grises: [...document.querySelectorAll('[data-heure]')].filter(x => +getComputedStyle(x).opacity < 1).length }));
  ok('9 choisir 5 h (dans aucun créneau) : « À tout moment », aucune heure en retrait', t6.cre === 'libre' && t6.h === '05:00' && t6.grises === 0, JSON.stringify(t6));
  await p.click('[data-heure="9"]'); await p.waitForTimeout(300); await p.click('[data-t="cr.suivant"]'); await p.waitForTimeout(500);
  const t7 = await p.evaluate(() => ({ titre: (document.querySelector('[data-t="cr.titre.3"]') || {}).textContent, mois: !!document.querySelector('[data-t="freq.mois"]'), txt: /jours du mois/.test(document.querySelector('[data-feuille="1"]').textContent), etape: window.__logique().state.cr.etape, resume: (document.querySelector('[data-t="res.une"]') || {}).textContent }));
  ok('9 étape 3 = la répétition : « Tu la refais ? », sans « Certains jours du mois », le résumé « À 9 h · une fois »', /refais|revient/.test(t7.titre) && !t7.mois && !t7.txt && t7.etape === 3 && /9 h · une fois/.test(t7.resume), JSON.stringify(t7));
  await p.click('[data-t="cr.programme"]'); await p.waitForTimeout(400);
  const t8 = await p.evaluate(() => ({ freqs: [...document.querySelectorAll('[role="radio"][data-t], [role="radio"] [data-t]')].map(x => x.getAttribute('data-t')).filter(k => /^freq\./.test(k)), grille31: [...document.querySelectorAll('[data-feuille="1"] button')].filter(b => b.textContent.trim() === '31').length }));
  ok('9 « Routine » : 2 fréquences (jour, semaine), pas de grille des 31 jours', t8.freqs.join(',') === 'freq.jour,freq.semaine' && t8.grille31 === 0, JSON.stringify(t8));
  await shot(p, 'creer-3'); const nAv = await p.evaluate(() => window.__logique().state.quetes.length); await p.click('[data-t="cr.creer"]'); await p.waitForTimeout(800);
  const t9 = await p.evaluate(() => { const L = window.__logique(), q = L.state.quetes[L.state.quetes.length - 1]; return { n: L.state.quetes.length, t: q.t, h: q.h, cr: q.cr, rec: q.rec, mois: q.mois, cr0: !!L.state.cr, toast: /Nouvelle quête/.test(document.body.textContent) }; });
  ok('9 « Créer la quête » : une quête de plus (Arroser les plantes, 09:00, matin, tous les jours, sans jours du mois), le toast', t9.n === nAv + 1 && t9.t === 'Arroser les plantes' && t9.h === '09:00' && t9.cr === 'matin' && t9.rec === 'jour' && t9.mois == null && !t9.cr0 && t9.toast, JSON.stringify(t9));
  ok('9 Créer sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 10 · les options d’une quête : sans « Version courte » ; « Modifier » ouvre l’étape 1 (l’activité) avec le nom ; une ancienne quête « mois » se modifie en « tous les jours »
  p = await ouvrir('ecran=options&heure=10.25&fait=1&nouv=tout');
  const o1 = await p.evaluate(() => [...document.querySelectorAll('[data-el="opts_actions"] [data-t]')].map(x => x.getAttribute('data-t')));
  ok('10 options : Minuteur, Étapes, Modifier, Reprendre plus tard, agenda ; plus de « Version courte »', !o1.includes('opts.courte') && o1.includes('opts.minuteur') && o1.includes('opts.modifier') && o1.includes('mob.agenda.t'), o1.join(','));
  await shot(p, 'options'); await p.click('[data-t="opts.modifier"]'); await p.waitForTimeout(500);
  const o2 = await p.evaluate(() => { const c = window.__logique().state.cr; return { etape: c && c.etape, t: c && c.t, editId: c && c.editId, nom: (document.querySelector('input[aria-label="Nom de la quête"]') || {}).value }; });
  ok('10 « Modifier » : l’écran Créer à l’étape 1 (l’activité), le nom de la quête dans le champ', o2.etape === 1 && o2.t && o2.nom === o2.t && !!o2.editId, JSON.stringify(o2));
  await p.evaluate(() => { const L = window.__logique(), S = L.state; L.setState({ cr: null, quetes: S.quetes.concat({ id: 'ancienne', t: 'Payer le loyer', ic: 'maison', cr: 'matin', h: '', rec: 'mois', mois: [5, 20], fait: false, etapes: [], timer: null, report: false }) }); }); await p.waitForTimeout(300);
  const o3 = await p.evaluate(() => { const L = window.__logique(); L.ouvrirOptions('ancienne'); return new Promise(r => setTimeout(() => { document.querySelector('[data-t="opts.modifier"]').click(); setTimeout(() => { const c = L.state.cr; r({ etape: c.etape, rec: c.rec, freq: c.freq }); }, 300); }, 300)); });
  ok('10 une ancienne quête « certains jours du mois » (gardée telle quelle) se modifie en « Programmé · tous les jours », sans écran pour les jours du mois', o3.etape === 1 && o3.rec === 'prog' && o3.freq === 'jour', JSON.stringify(o3));
  ok('10 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  // 11 · la feuille « Toutes tes quêtes » garde les faites ; le Carnet n’a plus le réglage « Toujours afficher C’est fait »
  p = await ouvrir('ecran=feuille&heure=10.25&fait=2&nouv=tout'); const f1 = await p.evaluate(() => document.querySelectorAll('[data-t="statut.faite"]').length);
  ok('11 feuille « Toutes tes quêtes » : les 2 faites y sont toujours (« Faite »)', f1 === 2, 'faites=' + f1); await p.close();
  p = await ouvrir('ecran=journal&tab=carnet&nouv=tout'); const c1 = await p.evaluate(() => ({ fait: !!document.querySelector('[data-t="ca.fait.t"]'), son: !!document.querySelector('[data-t="ca.son.t"]') }));
  ok('11 Carnet : plus de « Toujours afficher C’est fait », les autres réglages restent', !c1.fait && c1.son, JSON.stringify(c1)); ok('11 sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();

  await b.close();
  const n = res.filter(x => !x).length; console.log('\nt2210_quetes : ' + (res.length - n) + '/' + res.length + (n ? ' — ' + n + ' échec(s)' : ' ✓')); process.exit(n ? 1 : 0);
})().catch(e => { console.error(e); process.exit(2); });
