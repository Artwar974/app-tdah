// 22/10 · Contrôle de la feuille du Ponton : recruter un compagnon au sort (nom, rareté, stats, la carte de révélation), le bateau qui s'agrandit,
// une destination, deux compagnons qui partent ensemble (la scène reçoit minotaure puis compagnon-2), le retour avec la besace.
// Serveur : cd demo && python3 -m http.server 8773 --bind 127.0.0.1 (ou ATHENA_URL). Captures 390 × 844 et 360 × 640 dans ATHENA_SHOTS (test/logs/ponton par défaut).
// node test/t2210_ponton.js
const fs = require('fs');
const path = require('path');
const { lancer, routerCdn, ESPION, ok, bilan } = require('./_commun');

const URL = (process.env.ATHENA_URL || 'http://127.0.0.1:8773/').replace(/\/?$/, '/');
const SHOTS = process.env.ATHENA_SHOTS || path.join(__dirname, 'logs', 'ponton');
fs.mkdirSync(SHOTS, { recursive: true });

// La logique du Prototype (la classe DCLogic montée sur l'écran « Prototype V1 »)
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.modeApp === 'function') return s.logic; if (s && typeof s.modeApp === 'function') return s; f = f.return; } return null; };`;
const local = (y, m, d, h, mi) => new Date(y, m - 1, d, h, mi || 0).getTime();

const etat = (p) => p.evaluate(() => { const L = window.__logique(); if (!L || !L.state) return null; const S = L.state, e = S.eco || {};
  return { equipe: e.equipe || null, bateau: e.bateau, compagnons: e.compagnons, or: e.or, bois: e.bois, ponton: e.batiments && e.batiments.expeditions, parcours: e.parcours || [], rentres: e.rentres || [],
    fe: S.fe ? { k: S.fe.k, tab: S.fe.tab, dest: S.fe.dest, equipe: S.fe.equipe, phrase: S.fe.phrase } : null, carte: S.carte ? { ic: S.carte.ic, kt: S.carte.kt, t: S.carte.t, d: S.carte.d, cadre: S.carte.cadre } : null, events: window.__events || [] }; });
const attendreFe = (p, k) => p.waitForFunction((k) => { const L = window.__logique(); return !!(L && L.state && L.state.fe && L.state.fe.k === k && !L.state.carte); }, k, { timeout: 30000 }).then(() => true, () => false);
const attendreCarte = (p) => p.waitForFunction(() => { const L = window.__logique(); return !!(L && L.state && L.state.carte); }, null, { timeout: 15000 }).then(() => true, () => false);
// La page « cachée » (la scène s'arrête, comme un onglet caché) le temps d'une capture : le rendu logiciel de la scène (SwiftShader) est trop lent pour une capture en direct
const cacher = (p) => p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
const montrer = (p) => p.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
// Une capture à 390 × 844 puis à 360 × 640 (la fenêtre revient à 390 × 844)
const capture = async (p, nom) => { await p.waitForTimeout(600);
  const shot = async (f) => { for (let i = 0; i < 2; i++) { try { await p.screenshot({ path: f, animations: 'disabled', timeout: 45000 }); return; } catch (e) { console.log('  (capture ' + path.basename(f) + ' : ' + e.message.split('\n')[0] + ')'); await p.waitForTimeout(1500); } } };
  await shot(path.join(SHOTS, nom + '_390.png'));
  await p.setViewportSize({ width: 360, height: 640 }); await p.waitForTimeout(600);
  await shot(path.join(SHOTS, nom + '_360.png'));
  await p.setViewportSize({ width: 390, height: 844 }); await p.waitForTimeout(400); };
// Les mesures d'accessibilité de la feuille ouverte : les boutons de moins de 44 px, les textes de moins de 13 px, ce qui déborde à droite
const mesures = (p) => p.evaluate(() => { const vis = (el) => { const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const dlg = Array.from(document.querySelectorAll('[role="dialog"]')).filter(vis); const racine = dlg.length ? dlg[dlg.length - 1] : document.body;
  const petits = Array.from(racine.querySelectorAll('button')).filter(vis).filter((b) => { const r = b.getBoundingClientRect(); return r.height < 44 || r.width < 44; }).map((b) => (b.getAttribute('aria-label') || b.textContent || '').trim().slice(0, 40) + ' ' + Math.round(b.getBoundingClientRect().width) + '×' + Math.round(b.getBoundingClientRect().height));
  const textes = []; const w = document.createTreeWalker(racine, NodeFilter.SHOW_TEXT); let n; while ((n = w.nextNode())) { if (!n.textContent.trim()) continue; const el = n.parentElement; if (!el || !vis(el)) continue; const fs = parseFloat(getComputedStyle(el).fontSize); if (fs < 13) textes.push(n.textContent.trim().slice(0, 30) + ' ' + fs + 'px'); }
  const W = document.documentElement.clientWidth; const deborde = Array.from(racine.querySelectorAll('*')).filter(vis).filter((el) => el.getBoundingClientRect().right > W + 1).map((el) => el.tagName.toLowerCase() + ' ' + (el.textContent || '').trim().slice(0, 30) + ' → ' + Math.round(el.getBoundingClientRect().right)).slice(0, 6);
  return { petits, textes, deborde, W }; });
// « Continuer » sur la carte (après son retournement) ; un second toucher si la carte est encore là
const fermerCarte = async (p) => { for (let i = 0; i < 3; i++) { await p.waitForTimeout(900); const b = p.locator('[role="dialog"][aria-live="polite"] button').last(); if (await b.count()) await b.click({ force: true }).catch(() => {}); const fermee = await p.waitForFunction(() => { const L = window.__logique(); return !!(L && L.state && !L.state.carte); }, null, { timeout: 5000 }).then(() => true, () => false); if (fermee) break; } await p.waitForTimeout(400); };

(async () => {
  const b = await lancer();
  const p = await b.newPage({ viewport: { width: 390, height: 844 } });
  const errs = [];
  await p.addInitScript(ESPION); await p.addInitScript(LOGIQUE);
  await routerCdn(p);
  await p.clock.install({ time: local(2026, 10, 22, 10, 0) });
  await p.route(/\/favicon\.ico$/, (r) => r.fulfill({ status: 204, body: '' }));
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.goto(URL + 'Prototype.dc.html?app=1#ecran=expedition&nouv=tout', { waitUntil: 'load', timeout: 60000 });
  await p.waitForFunction(() => !!window.__scene, null, { timeout: 40000 }).catch(() => {});
  await cacher(p);   // la scène en pause tout le long (le rendu logiciel bloque les gestes) ; ses événements partent quand même
  const feOk = await attendreFe(p, 'expedition'); await p.waitForTimeout(1500);
  let s = await etat(p);
  ok('1 la feuille du Ponton s’ouvre, sans erreur de console', feOk && errs.length === 0, JSON.stringify(errs));
  ok('1 l’état a une équipe (le minotaure, commun, des stats) et un bateau niveau 1', !!s && Array.isArray(s.equipe) && s.equipe.length === 1 && s.equipe[0].nom === 'Le minotaure' && s.equipe[0].rarete === 'commun' && s.equipe[0].stats.flair === 2 && s.bateau === 1, JSON.stringify(s && { equipe: s.equipe, bateau: s.bateau }));
  await capture(p, '1_feuille_1_compagnon');
  let m = await mesures(p); ok('1 feuille (1 compagnon) : cibles ≥ 44 px, textes ≥ 13 px, rien ne déborde', !m.petits.length && !m.textes.length && !m.deborde.length, JSON.stringify(m));

  // Le Ponton au niveau 3 (3 places), de l'or et du bois pour recruter et agrandir le bateau
  await p.evaluate(() => { const L = window.__logique(); L.setState((st) => ({ eco: Object.assign({}, st.eco, { or: 1500, bois: 1500, batiments: Object.assign({}, st.eco.batiments, { expeditions: 3 }) }) })); });
  await p.waitForTimeout(500);
  const recruter = async () => { const btn = p.getByRole('button', { name: /^Recruter/ }).first(); await btn.click(); return attendreCarte(p); };
  const c1 = await recruter(); s = await etat(p);
  const neuf = s && s.equipe && s.equipe[1]; const carteT = () => p.locator('[role="dialog"][aria-live="polite"]').last().textContent().catch(() => '');
  let ct = await carteT();
  ok('2 recruter donne un compagnon avec un nom, une rareté et trois stats, et sa carte de révélation (tête du compagnon)', c1 && !!neuf && typeof neuf.nom === 'string' && neuf.nom.length > 1 && ['commun', 'rare', 'legendaire'].includes(neuf.rarete) && ['flair', 'force', 'pied'].every((k) => neuf.stats[k] >= 1 && neuf.stats[k] <= 5) && s.or === 1500 - 120 && !!s.carte && s.carte.ic === 'compagnon' && ct.includes(neuf.nom), JSON.stringify({ neuf, or: s && s.or, carte: s && s.carte, ct }));
  ok('2 la carte dit le nom et les stats, sans erreur de console', !!s && !!s.carte && /Flair \d, force \d, pied \d sur 5/.test(ct) && errs.length === 0, JSON.stringify({ ct, errs }));
  await capture(p, '2_carte_revelation');
  m = await mesures(p); ok('2 carte de révélation : cibles ≥ 44 px, textes ≥ 13 px, rien ne déborde', !m.petits.length && !m.textes.length && !m.deborde.length, JSON.stringify(m));
  await fermerCarte(p);
  s = await etat(p); ok('2 la carte rangée, la feuille du Ponton revient', !!s && !s.carte && !!s.fe && s.fe.k === 'expedition', JSON.stringify(s && { fe: s.fe, carte: s.carte }));
  const c2 = await recruter(); await fermerCarte(p); s = await etat(p);
  ok('2 un troisième compagnon ; au-delà, le Ponton (3 places) est plein : « Recruter » grisé', c2 && s.equipe.length === 3 && s.compagnons === 3 && s.equipe.map((c) => c.nom).filter((x, i, L) => L.indexOf(x) === i).length === 3 && (await p.getByRole('button', { name: /^Recruter/ }).count()) === 0, JSON.stringify(s && s.equipe));
  await capture(p, '3_feuille_3_compagnons');
  m = await mesures(p); ok('3 feuille (3 compagnons) : cibles ≥ 44 px, textes ≥ 13 px, rien ne déborde', !m.petits.length && !m.textes.length && !m.deborde.length, JSON.stringify(m));

  // Le bateau : niveau 2 (120 bois) : une place de plus à bord, « Les îles » s'ouvre
  const ilesAvant = await p.getByRole('button', { name: /^Les îles/ }).first().isDisabled().catch(() => null);
  await p.getByRole('button', { name: /^Agrandir/ }).first().click(); await p.waitForTimeout(500); s = await etat(p);
  ok('4 « Agrandir » monte le bateau au niveau 2 pour 120 bois ; « Les îles » était fermée avant', ilesAvant === true && !!s && s.bateau === 2 && s.bois === 1500 - 120 && /niveau 2/.test(String(s.fe && s.fe.phrase)), JSON.stringify({ ilesAvant, bateau: s && s.bateau, bois: s && s.bois, phrase: s && s.fe && s.fe.phrase }));
  await p.getByRole('button', { name: /^Les îles/ }).first().click(); await p.waitForTimeout(300); s = await etat(p);
  ok('4 « Les îles » se choisit', !!s && s.fe && s.fe.dest === 'iles', JSON.stringify(s && s.fe));
  // Deux compagnons : le minotaure (déjà coché) et le deuxième
  const nom2 = s.equipe[1].nom, nom3 = s.equipe[2].nom;
  await p.getByRole('switch', { name: 'Emmener ' + nom2 }).first().click(); await p.waitForTimeout(300); s = await etat(p);
  ok('4 cocher le deuxième compagnon : l’équipe qui part = [1, 2]', !!s && Array.isArray(s.fe.equipe) && s.fe.equipe.join(',') === '1,2', JSON.stringify(s && s.fe));
  await p.getByRole('switch', { name: 'Emmener ' + nom3 }).first().click(); await p.waitForTimeout(300); s = await etat(p);
  ok('4 un troisième : le bateau (2 places) le refuse avec une phrase douce, l’équipe reste [1, 2]', !!s && s.fe.equipe.join(',') === '1,2' && /2 compagnons au plus/.test(String(s.fe.phrase)), JSON.stringify(s && s.fe));
  const partirT = await p.getByRole('button', { name: /^Partir/ }).first().textContent();
  ok('4 le bouton dit « Partir · 9 pas de 9 min · 2 compagnons » (Ponton 3 : 7 pas, les îles : +2)', /Partir · 9 pas de 9 min · 2 compagnons/.test(partirT || ''), partirT);
  await p.evaluate(() => { window.__events = []; });
  await p.getByRole('button', { name: /^Partir/ }).first().click(); await p.waitForTimeout(1200); s = await etat(p);
  const run = s && s.parcours[0];
  ok('5 Partir lance un parcours : compagnons = [1, 2], destination îles, 9 pas, voies durcies (dif 2), bonus > 1', !!run && run.compagnons.join(',') === '1,2' && run.destination === 'iles' && run.etapes === 9 && run.dif === 2 && run.bonus > 1 && run.compagnon === 0, JSON.stringify(run && { compagnons: run.compagnons, destination: run.destination, etapes: run.etapes, dif: run.dif, bonus: run.bonus, mode: run.mode }));
  const departs = (s ? s.events : []).filter((e) => e[0] === 'expedition-depart').map((e) => e[1].compagnon);
  ok('5 la scène reçoit le départ du minotaure puis de compagnon-2', departs.join(',') === 'minotaure,compagnon-2', JSON.stringify(departs));
  ok('5 pendant le parcours, la feuille reste ouverte et dit l’équipe par ses noms', !!s && s.fe && s.fe.k === 'expedition' && (await p.locator('[role="dialog"]').last().textContent()).includes('Le minotaure et ' + nom2), '');
  await capture(p, '5_feuille_pendant_parcours');
  m = await mesures(p); ok('5 feuille (parcours en cours) : cibles ≥ 44 px, textes ≥ 13 px, rien ne déborde', !m.petits.length && !m.textes.length && !m.deborde.length, JSON.stringify(m));

  // Le temps passe : 9 pas de 9 min, puis le retour (1,5 min par pas). Avec un paramètre de démonstration (#ecran=…), l'app vit à l'heure de démonstration (S.heure) :
  // « Avancer d'une heure » du panneau (simEco('heure')), la page montrée le temps du tic de la seconde, jusqu'au retour (3 h au plus)
  // La feuille se range d'abord : la carte du retour ne vient que sur le camp libre (sinon un toast « Tes compagnons sont rentrés »)
  await p.evaluate(() => window.__logique().setState({ fe: null })); await p.waitForTimeout(400);
  let rentre = false; for (let i = 0; i < 3 && !rentre; i++) { await montrer(p); await p.evaluate(() => window.__logique().simEco('heure')); await p.waitForTimeout(1600); await cacher(p); await p.waitForTimeout(300); s = await etat(p); rentre = s && !s.parcours.length && s.rentres.some((x) => x && x.id === run.id); }
  const fini = s && s.rentres.some((x) => x && x.id === run.id); ct = await carteT();
  ok('6 l’horloge avancée fait rentrer l’équipe (carte « … sont rentrés », tête du compagnon)', fini && !!s.carte && s.carte.ic === 'compagnon' && /sont rentrés/.test(ct), JSON.stringify({ fini, carte: s && s.carte, ct, parcours: s && s.parcours.length }));
  await capture(p, '6_carte_retour');
  await fermerCarte(p);
  ok('7 aucune erreur de console sur tout le parcours', errs.length === 0, JSON.stringify(errs));
  await b.close();

  // La besace à deux : le même parcours (graine 42, mode moyen, les îles) avec [1] et avec [1, 2], tout réussi : plus de bois et d'or à deux
  const W = { document: null }; global.window = W; require('../demo/commun/athena-economie.js'); const E = W.AthenaEconomie, eco = E.DEFAUT, t0 = local(2026, 10, 22, 10, 0);
  let s0 = E.etatInitial(eco, t0); s0.batiments.expeditions = 3; s0.or = 1500; s0.bois = 1500; let seq = 0.5; const A = () => { seq = (seq * 9301 + 49297) % 233280; return seq / 233280; };
  s0 = E.recruterAleatoire(eco, s0, A).etat; s0 = E.ameliorerBateau(eco, s0).etat;
  const bes = (ids) => { const l = E.parcoursLancer(eco, s0, { mode: 'moyen', maintenant: t0, graine: 42, destination: 'iles', compagnons: ids }); const a = E.parcoursAvancer(eco, l.etat, t0 + 4 * 3600e3, () => .01); const r = a.rentres[0]; return { bonus: l.parcours.bonus, bois: r.butin.bois, or: r.butin.or, etapes: r.etapes, dif: r.dif }; };
  const b1 = bes([1]), b2 = bes([1, 2]);
  ok('8 module : à deux, la besace est plus grosse (bonus et butin) qu’à un, même graine', b2.bonus > b1.bonus && b2.bois > b1.bois && b2.or > b1.or && b1.etapes === 9 && b1.dif === 2, JSON.stringify({ un: b1, deux: b2 }));
  process.exit(bilan('t2210_ponton') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
