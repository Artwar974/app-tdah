/* Contrôles de l’économie (version 6, 22/10/2026 : les compagnons nommés recrutés au sort, le bateau, les destinations, l’équipe qui part ; version 5, 20/10/2026) : les règles promises par commun/athena-economie.js, vérifiées sur le barème donné.
 * Lus par outils/economie-test.html (section Contrôles). AthenaEconomieControles(E, eco) → { ok, ko, echecs } */
(function (W) {
W.AthenaEconomieControles = function (E, eco) {
  let ok = 0, ko = 0; const echecs = [];
  const T = (n, c) => { if (c) ok++; else { ko++; echecs.push(n); } };
  const C = o => JSON.parse(JSON.stringify(o));
  const t0 = new Date(2026, 10, 2, 9).getTime(), H = 3600e3, J = 24 * H;

  /* La journée de jeu */
  T('3 h 30 du matin compte pour la veille', E.journeeDe(eco, new Date(2026, 10, 3, 3, 30).getTime()) === '2026-11-02');
  T('4 h ouvre la nouvelle journée', E.journeeDe(eco, new Date(2026, 10, 3, 4, 0).getTime()) === '2026-11-03');

  /* Le Mont : 4 habitudes clés = le Sommet */
  const M = (c, a) => ({ cles: c, autres: a });
  T('4 habitudes clés = 4 paliers', E.paliers(eco, M(4, 0), 4) === 4);
  T('3 habitudes clés + des autres quêtes = 3 paliers', E.paliers(eco, M(3, 6), 4) === 3);
  T('sans habitude clé choisie, 4 quêtes = 4 paliers', E.paliers(eco, M(0, 4), 0) === 4);
  T('2 habitudes choisies : 2 + 2 autres quêtes = 4', E.paliers(eco, M(2, 2), 2) === 4);
  T('jamais plus de 4 paliers', E.paliers(eco, M(4, 9), 4) === 4);

  /* Valider : toujours un gain ; le bois et l’or attendent dans le coffre du camp */
  let s = E.etatInitial(eco, t0); s.clesDefinies = 4; const g = []; let evs = [];
  for (let i = 0; i < 8; i++) { const r = E.valider(eco, s, { cle: i < 4, maintenant: t0 + i * 600e3 }); s = r.etat; g.push(r.gains); evs = evs.concat(r.evenements); }
  T('chaque quête rapporte quelque chose', g.every(x => x.bois > 0 && x.or > 0 && x.xp > 0));
  T('à partir de la 7e quête, le petit gain', g[6].bois <= Math.round(eco.quete.petit.bois * 1.2) && g[5].bois >= eco.quete.bois);
  T('barème 5 : les gains vont droit aux compteurs, le coffre du camp reste vide', (eco.quete.direct ? (s.bois > 0 && s.coffre.bois === 0) : (s.bois === 0 && s.coffre.bois > 0)));
  const ecoD = C(eco); ecoD.quete.direct = false; let sD = E.etatInitial(ecoD, t0); sD.clesDefinies = 4; sD = E.valider(ecoD, sD, { cle: true, maintenant: t0 }).etat;
  T('sans « direct », le bois et l’or attendent dans le coffre comme avant', sD.bois === 0 && sD.coffre.bois > 0 && E.ramasser(ecoD, sD, t0 + H, () => .99).ok);
  T('4 habitudes clés font le Sommet', s.jour.sommet && evs.filter(e => e === 'sommet').length === 1);
  T('le Sommet fait avancer le Sentier d’un palier', s.sentier.palier === 1);
  const r1 = E.ramasser(eco, s, t0 + 2 * H, () => .99);
  T('ramasser : rien à ramasser quand les gains sont directs, sinon le coffre se vide dans les réserves', eco.quete.direct ? !r1.ok : (r1.ok && r1.etat.bois >= s.coffre.bois && r1.etat.coffre.bois === 0));
  T('coffre vide : rien à ramasser', !E.ramasser(eco, r1.ok ? r1.etat : s, t0 + 3 * H).ok);
  let s2 = E.nouvelleJournee(eco, s, t0 + J);
  T('le coffre non ramassé reste le lendemain', s2.coffre.bois === s.coffre.bois);
  /* Une surprise au plus par journée */
  let sp = C(s), n = 0;
  for (let i = 0; i < 6; i++) { sp.coffre.bois += 5; const rr = E.ramasser(eco, sp, t0 + (3 + i) * H, () => .01); sp = rr.etat; if (rr.surprise) n++; }
  T('une surprise au plus par journée', n === 1);

  /* 3 habitudes sur 4 : pas de Sommet, rien de retiré */
  let t3 = E.etatInitial(eco, t0); t3.clesDefinies = 4;
  for (let i = 0; i < 6; i++) t3 = E.valider(eco, t3, { cle: i < 3, maintenant: t0 + i * 600e3 }).etat;
  T('3 habitudes sur 4 : pas de Sommet', !t3.jour.sommet && t3.sentier.palier === 0);
  const t4 = E.nouvelleJournee(eco, t3, t0 + J);
  T('un jour sans Sommet ne retire rien', t4.sentier.palier === 0 && t4.coffre.bois === t3.coffre.bois);
  /* Joker (seulement s’il est activé) */
  const ej = C(eco); ej.mont.joker.parSemaine = 1;
  T('pas de joker si le barème ne l’active pas', eco.mont.joker.parSemaine > 0 || !E.peutJoker(eco, t3, t0 + 2 * H).ok);
  const uj = E.utiliserJoker(ej, t3, t0 + 2 * H);
  T('joker : 3 sur 4 suffisent, une fois par semaine', uj.ok && uj.etat.jour.sommet && !E.peutJoker(ej, E.nouvelleJournee(ej, uj.etat, t0 + J), t0 + J).ok);

  /* Le Grand Sentier */
  const sr = E.etatInitial(eco, t0); sr.clesDefinies = 4; let srr = sr;
  for (let d = 0; d < eco.sentier.paliers + 2; d++) for (let i = 0; i < 4; i++) srr = E.valider(eco, srr, { cle: true, maintenant: t0 + d * J + i * 600e3 }).etat;
  T('une récompense à chaque palier, puis le coffre au-delà', srr.sentier.palier === Math.min(eco.sentier.paliers + 2, srr.sentier.palier) && srr.sac.charmes.porteur >= 1);
  const sn = E.saisonA(eco, srr, t0 + eco.sentier.dureeJours * J + H);
  T('une nouvelle saison repart au palier 0, les récompenses restent', sn.sentier.saison === 2 && sn.sentier.palier === 0 && sn.sac.objets.length === srr.sac.objets.length);
  T('le Sentier compte ' + eco.sentier.recompenses.length + ' récompenses pour ' + eco.sentier.paliers + ' paliers', eco.sentier.recompenses.length === eco.sentier.paliers);

  /* Le feu */
  T('le feu ne descend jamais sous le plancher', E.feuA(eco, { pts: 50, t: t0 }, t0 + 30 * J).pts === eco.feu.plancher);
  let fr = E.etatInitial(eco, t0); fr = E.valider(eco, fr, { cle: false, maintenant: t0 }).etat; const rv = E.valider(eco, fr, { cle: false, maintenant: t0 + 3 * J });
  T('retour après 2 jours : le feu remonte', rv.evenements.includes('retour') && rv.etat.feu.pts >= eco.feu.retour.remonteA);
  const of = E.offrande(eco, Object.assign(E.etatInitial(eco, t0), { bois: 30 }), 2, t0);
  T('offrande : 2 × 10 bois', of.ok && of.etat.bois === 10);

  /* Chantiers */
  let b = E.etatInitial(eco, t0); b.bois = 6000; b.or = 6000;
  T('un bâtiment ne dépasse pas l’Auberge', E.peutAmeliorer(eco, b, 'comptoir').raison === 'auberge-trop-basse');
  T('la Forge arrive à l’Auberge ' + eco.batiments.forge.debloque, E.peutAmeliorer(eco, b, 'forge').raison === 'pas-encore');
  T('le Ponton (Hall des expéditions) se construit à l’Auberge ' + eco.batiments.expeditions.debloque, b.batiments.expeditions === (eco.batiments.expeditions.debloque <= 1 ? 1 : 0));
  let c = E.lancerChantier(eco, b, 'auberge', t0); T('Auberge 2 lancée', c.ok); b = c.etat;
  T('un seul bâtisseur au début', !E.lancerChantier(eco, b, 'comptoir', t0).ok);
  b = E.terminerChantiers(eco, b, t0 + 20 * 60e3).etat; T('Auberge 2 finie', b.batiments.auberge === 2);
  T('Auberge 3 : d’abord les autres bâtiments', E.peutAmeliorer(eco, b, 'auberge').raison === 'batiments-a-monter');
  c = E.lancerChantier(eco, b, 'comptoir', t0); b = c.etat; const fin = b.chantiers[0].fin;
  b = E.valider(eco, b, { cle: false, maintenant: t0 + 60e3 }).etat;
  T('une quête qui n’est pas une habitude clé accélère', !b.chantiers.length || b.chantiers[0].fin < fin);
  const p0 = E.etatInitial(eco, t0); p0.coffre.bois = 200; p0.coffre.or = 50;
  const pa = E.peutAmeliorer(eco, p0, 'auberge');
  T('pas assez : le manque est chiffré, et on sait que le coffre suffit', pa.raison === 'pas-assez' && pa.manque.bois > 0 && pa.dansLeCoffre === true);

  /* Expéditions, Forge */
  let x = E.etatInitial(eco, t0);
  if (!x.batiments.expeditions) { T('pas d’expédition avant le Ponton', !E.lancerExpedition(eco, x, { duree: 60, maintenant: t0 }).ok); x.batiments.expeditions = 1; }
  const l1 = E.lancerExpedition(eco, x, { duree: 60, maintenant: t0 });
  T('expédition d’1 h', l1.ok);
  T('durée pas encore ouverte', !E.lancerExpedition(eco, x, { duree: 480, maintenant: t0 }).ok);
  const xr = E.retours(eco, l1.etat, t0 + 2 * H, () => .9);
  T('le butin d’une expédition à durée (ancienne API) arrive : aux compteurs en direct, sinon dans le coffre', xr.butins.length === 1 && (eco.quete.direct ? xr.etat.bois > l1.etat.bois : xr.etat.coffre.bois > 0));
  const l2 = E.lancerExpedition(eco, xr.etat, { duree: 60, maintenant: t0 + 2 * H }); const x3 = E.retours(eco, l2.etat, t0 + 4 * H).etat;
  T('2 expéditions par journée au plus', !E.lancerExpedition(eco, x3, { duree: 60, maintenant: t0 + 4 * H }).ok);
  let rare = 0; for (let i = 0; i < 3000; i++) if (E.butin(eco, { duree: 480, compagnons: 1, charmes: ['fouineur', 'fouineur'] }, Math.random).rare) rare++;
  T('la chance d’objet rare ne dépasse jamais 50 %', rare / 3000 < .55);
  let fg = E.etatInitial(eco, t0); fg.bois = 100;
  T('pas de charme sans Forge', E.forgerCharme(eco, fg, 'porteur').raison === 'pas-de-forge');
  fg.batiments.forge = 1;
  T('charme du Porteur à la Forge 1', E.forgerCharme(eco, fg, 'porteur').ok);
  T('charme de l’Éclaireur : Forge 3', E.forgerCharme(eco, fg, 'eclaireur').raison === 'forge-trop-basse');

  /* Social */
  let so = E.etatInitial(eco, t0); so.clesDefinies = 4;
  T('pas d’Étincelle avant le Sommet', !E.peutOffrir(eco, so, t0).ok);
  for (let i = 0; i < 4; i++) so = E.valider(eco, so, { cle: true, maintenant: t0 + i * 60e3 }).etat;
  const o1 = E.offrirEtincelle(eco, so, t0 + H);
  T('une Étincelle après le Sommet, une par journée', o1.ok && !E.offrirEtincelle(eco, o1.etat, t0 + 2 * H).ok);
  const rc = E.recevoirEtincelle(eco, E.etatInitial(eco, t0), t0, true);
  T('recevoir : le feu monte et le petit cadeau arrive', rc.etat.feu.pts > eco.feu.depart && (eco.quete.direct ? rc.etat.bois : rc.etat.coffre.bois) === eco.social.etincelle.siSommet.bois);

  /* Sur 180 jours */
  for (const k in E.PROFILS) {
    const r = E.simuler(eco, E.PROFILS[k], 180, 3);
    T('jamais de réserve négative (' + k + ')', r.courbe.every(c => c.bois >= 0 && c.or >= 0));
    T('au plus ' + eco.rythme.momentsFortsParJour + ' moments forts par jour (' + k + ')', r.resume.momentsParJourActif <= eco.rythme.momentsFortsParJour);
  }
  T('niveau 2 à 60 XP', E.niveauDe(eco, 59).niveau === 1 && E.niveauDe(eco, 60).niveau === 2);

  /* 19/10 · le barème 4 : la version courte, le défi du Hameau, les saisons, les quêtes de saison, la migration douce */
  let vc = E.etatInitial(eco, t0); vc.clesDefinies = 4; const gc = [];
  for (let i = 0; i < 4; i++) { const r = E.valider(eco, vc, { cle: true, courte: true, maintenant: t0 + i * 600e3 }); vc = r.etat; gc.push(r.gains); }
  T('la version courte compte pour le Mont : 4 habitudes courtes font le Sommet', vc.jour.sommet && vc.sentier.palier === 1 && vc.jour.courtes === 4);
  let vn = E.etatInitial(eco, t0); vn.clesDefinies = 4; const gn = [];
  for (let i = 0; i < 4; i++) { const r = E.valider(eco, vn, { cle: true, maintenant: t0 + i * 600e3 }); vn = r.etat; gn.push(r.gains); }
  T('la version courte rapporte comme la quête (choix 13 A)', eco.quete.courte.gains !== 'identiques' || JSON.stringify(gc) === JSON.stringify(gn));
  const ecoB = C(eco); ecoB.quete.courte.gains = 'petit'; let vb = E.etatInitial(ecoB, t0); vb.clesDefinies = 4; let gb = null;
  for (let i = 0; i < 4; i++) { const r = E.valider(ecoB, vb, { cle: true, courte: true, maintenant: t0 + i * 600e3 }); vb = r.etat; gb = r.gains; }
  T('en petit gain (choix 13 B), la version courte compte quand même pour le Mont', vb.jour.sommet && gb.bois === eco.quete.petit.bois);
  const ecoM = C(eco); ecoM.quete.courte.gains = E.VARIANTES.courteGains.moitie; let vm = E.etatInitial(ecoM, t0); vm.clesDefinies = 4; let gm = null;
  for (let i = 0; i < 4; i++) { const r = E.valider(ecoM, vm, { cle: true, courte: true, maintenant: t0 + i * 600e3 }); vm = r.etat; gm = r.gains; }
  T('à moitié gain (choix 13 B), la version courte donne la moitié du bois et de l’or, le même XP, et compte pour le Mont', vm.jour.sommet && gm.or === Math.round(eco.quete.or / 2) && gm.xp === eco.quete.xp && gm.bois >= Math.round(eco.quete.bois / 2));
  const ecoC = C(eco); ecoC.defi.recompense = E.VARIANTES.defiRecompense.coffre; let dKc = E.etatInitial(ecoC, t0); const dCr = E.defiRecompenser(ecoC, dKc, t0);
  const ecoR = C(eco); ecoR.defi.recompense = E.VARIANTES.defiRecompense.rien; const dRr = E.defiRecompenser(ecoR, E.etatInitial(ecoR, t0), t0);
  T('la récompense du défi suit le choix 14 : du bois et de l’or vont au coffre (B), rien ne change avec « rien » (C)', dCr.ok && (eco.quete.direct ? dCr.etat.bois === dKc.bois + E.VARIANTES.defiRecompense.coffre.bois : dCr.etat.coffre.bois === dKc.coffre.bois + E.VARIANTES.defiRecompense.coffre.bois) && dCr.etat.sac.objets.length === dKc.sac.objets.length && dRr.ok && dRr.recompense === null && dRr.etat.sac.objets.length === 0);
  const dE = E.defiEtat(eco, E.etatInitial(eco, t0), t0, { membres: 5, autres: 4 });
  T('le défi : 3 lanternes par membre, entre 12 et 24', dE.cible === 15 && E.defiEtat(eco, E.etatInitial(eco, t0), t0, { membres: 2 }).cible === eco.defi.min && E.defiEtat(eco, E.etatInitial(eco, t0), t0, { membres: 20 }).cible === eco.defi.max);
  let dI = E.etatInitial(eco, t0); dI.coffre.bois = 30; dI.sac.objets.push('banc'); const dAvant = JSON.stringify(dI), dR = E.defiRecompenser(eco, dI, t0, { membres: 5, autres: 2 });
  T('une guirlande incomplète ne retire rien (et ne récompense pas)', !dR.ok && dR.raison === 'incomplet' && JSON.stringify(dR.etat) === dAvant && JSON.stringify(dI) === dAvant);
  const dC = E.defiRecompenser(eco, dI, t0, { membres: 5, autres: 15 });
  T('une guirlande complète : la récompense commune, une fois par semaine', dC.ok && dC.etat.sac.objets.indexOf(eco.defi.recompense.id) >= 0 && !E.defiRecompenser(eco, dC.etat, t0 + H, { membres: 5, autres: 15 }).ok);
  let fs0 = E.etatInitial(eco, t0); fs0.clesDefinies = 4; fs0.sentier.palier = 17; fs0.coffre.bois = 120; fs0.sac.charmes.porteur = 2; fs0.sac.objets.push('lanterne'); fs0.sac.fragments = 7;
  const fs1 = E.saisonA(eco, fs0, t0 + eco.sentier.dureeJours * J + H);
  T('une fin de saison garde tout : le sac, le coffre, les fragments ; seul le palier repart de 0', fs1.sentier.saison === 2 && fs1.sentier.palier === 0 && fs1.coffre.bois === 120 && fs1.sac.charmes.porteur === 2 && fs1.sac.objets.indexOf('lanterne') >= 0 && fs1.sac.fragments === 7);
  T('les saisons se suivent et recommencent', E.saisonId(eco, 1) === eco.sentier.saisons.cycle[0] && E.saisonId(eco, 5) === eco.sentier.saisons.cycle[0] && E.saisonId(eco, 2) !== E.saisonId(eco, 1));
  const tM1 = new Date(2026, 10, 10, 12).getTime(), tM2 = new Date(2026, 11, 10, 12).getTime(); let qs = E.etatInitial(eco, t0);
  const q1 = E.validerQueteSaison(eco, qs, 'mot', tM1); qs = q1.etat; const q1b = E.validerQueteSaison(eco, qs, 'mot', tM1 + H), q2 = E.validerQueteSaison(eco, qs, 'mot', tM2);
  T('les quêtes de saison changent chaque mois : la même quête se refait le mois suivant, pas deux fois dans le mois', q1.ok && !q1b.ok && q2.ok && E.quetesSaison(eco, qs, tM1).mois !== E.quetesSaison(eco, q2.etat, tM2).mois && E.quetesSaison(eco, q2.etat, tM2).faites.length === 1);
  T('une quête de saison : un fragment de légende et un peu d’or, dans le coffre', q1.gains.fragment === 1 && q1.gains.or === eco.saisonQuetes.gains.or && (eco.quete.direct ? qs.or : qs.coffre.or) === eco.saisonQuetes.gains.or && qs.sac.fragments === 1);
  const vieux = E.etatInitial(eco, t0); delete vieux.defi; delete vieux.quetesSaison; delete vieux.jour.courtes; vieux.coffre.bois = 44; const neuf = E.completer(eco, vieux);
  T('migration douce : un ancien état garde tout, les nouveaux champs prennent leur valeur de départ', neuf.coffre.bois === 44 && neuf.defi && neuf.defi.miennes === 0 && neuf.quetesSaison && typeof neuf.quetesSaison === 'object' && vieux.defi === undefined);
  const sL = E.simuler(eco, E.PROFILS.leger, 120, 3), sR = E.simuler(eco, E.PROFILS.regulier, 120, 3);
  T('la simulation fait des versions courtes (Léger 40 %, Régulier 15 %)', sL.resume.courtes > 0 && sR.resume.courtes > 0 && sL.resume.courtes / Math.max(1, sL.resume.sommets * 4) > sR.resume.courtes / Math.max(1, sR.resume.sommets * 4) / 2);

  /* 20/10 · barème 5 : le Sentier à 12 paliers par mois puis un bonus, le joker, le Ponton dès le premier jour, le Kiosque après 5 expéditions,
   * les expéditions en parcours, le résumé de la veille et la surprise au matin, valider après coup, la migration */
  {   /* un bloc à part : ses noms n'entrent pas en conflit avec ceux d'avant */
  T('le Sentier : 12 paliers par mois, les grands à 3, 6, 9, 12 (compagnon, décor, cadre, grand décor et titre)', eco.sentier.paliers === 12 && eco.sentier.recompenses.length === 12 && eco.sentier.dureeJours === 30 && eco.sentier.saisons.grandsPaliers.join() === '3,6,9,12' && eco.sentier.recompenses[2][0] === 'compagnon' && eco.sentier.recompenses[5][1].id === 'decor-saison' && eco.sentier.recompenses[8][1].id === 'cadre-avatar' && !!eco.sentier.recompenses[11][1].titre);
  let sB = E.etatInitial(eco, t0); sB.clesDefinies = 4; sB.sentier.palier = eco.sentier.paliers; const bonus = [];
  for (let d = 0; d < 3; d++) { for (let i = 0; i < 4; i++) { const r = E.valider(eco, sB, { cle: true, maintenant: t0 + d * J + i * 600e3 }); sB = r.etat; if (r.recompense) bonus.push(r.recompense); } }
  T('après le 12e palier, chaque Sommet donne un bonus (un objet ou un décor, un peu d’or), jamais le même d’affilée', bonus.length === 3 && bonus.every(b => b[0] === 'bonus' && b[1].id && b[1].or === eco.sentier.bonus.or) && bonus[0][1].id !== bonus[1][1].id && sB.sac.objets.length + sB.sac.cosmetiques.length === 3);
  T('un joker par semaine (choix 1 : 4 habitudes et un joker)', eco.mont.joker.parSemaine === 1);
  let sJ = E.etatInitial(eco, t0); sJ.clesDefinies = 4; for (let i = 0; i < 3; i++) sJ = E.valider(eco, sJ, { cle: true, maintenant: t0 + i * 600e3 }).etat;
  const pj = E.peutJoker(eco, sJ, t0 + 12 * H), uj = pj.ok ? E.utiliserJoker(eco, sJ, t0 + 12 * H) : null;
  T('3 habitudes et le joker font le Sommet, un seul joker dans la semaine', pj.ok && uj && uj.etat.jour.sommet && !E.peutJoker(eco, E.nouvelleJournee(eco, uj.etat, t0 + J), t0 + J + 12 * H).ok);
  const s0 = E.etatInitial(eco, t0);
  T('le Ponton est construit dès le premier jour, un compagnon est là, le Kiosque attend', s0.batiments.expeditions === 1 && s0.compagnons === 1 && s0.batiments.social === 0 && eco.batiments.social.apres.expeditions === 5);
  const pk = E.peutAmeliorer(eco, Object.assign(C(s0), { bois: 500, or: 100 }), 'social'), pk5 = E.peutAmeliorer(eco, Object.assign(C(s0), { bois: 500, or: 100, expeditionsFinies: 5 }), 'social');
  T('le Kiosque attend 5 expéditions finies, puis se construit', !pk.ok && pk.raison === 'pas-encore-expeditions' && pk.reste === 5 && pk5.ok);
  T('l’Auberge 2 n’attend pas le Kiosque encore verrouillé', E.peutAmeliorer(eco, Object.assign(C(s0), { bois: 500, or: 100 }), 'auberge').ok);
  const P = eco.expeditions.parcours, lA = E.parcoursLancer(eco, s0, { mode: 'attend', maintenant: t0, chemin: 0, graine: 42 }), lB = E.parcoursLancer(eco, s0, { mode: 'attend', maintenant: t0, chemin: 0, graine: 42 });
  T('un parcours : 3 étapes au Ponton 1, trois chemins par étape, la même graine donne les mêmes chemins', lA.ok && lA.parcours.etapes === 3 && lA.parcours.choix.length === 3 && JSON.stringify(lA.parcours.choix) === JSON.stringify(lB.parcours.choix) && lA.parcours.choix.every(x => x.difficulte >= 1 && x.difficulte <= 3));
  const aA = E.parcoursAvancer(eco, lA.etat, t0 + P.minutes[1] * 60e3, () => .01), rA = aA.etat.parcours[0];
  T('le compagnon arrive au bout de 3 minutes, joue le chemin pris, puis attend notre choix (mode « attend »)', rA && rA.statut === 'attend' && rA.etape === 1 && rA.journal.length === 1 && rA.journal[0].ok && rA.choix.length >= 3);
  const rt = E.parcoursRentrer(eco, aA.etat, rA.id, t0 + 5 * 60e3), aR = E.parcoursAvancer(eco, rt.etat, t0 + 5 * 60e3 + Math.round(P.retourParEtape * 60e3), () => .01);
  T('rentrer quand on veut : le butin reste, le compagnon rentre en 1,5 min par étape', rt.ok && rt.parcours.statut === 'retour' && aR.rentres.length === 1 && aR.etat.parcours.length === 0 && aR.etat.expeditionsFinies === 1 && aR.etat.bois === s0.bois + rA.butin.bois && aR.etat.or === s0.or + rA.butin.or);
  const ch = E.parcoursChoisir(eco, aA.etat, rA.id, 1, t0 + 5 * 60e3);
  T('choisir un chemin remet le compagnon en route', ch.ok && ch.parcours.statut === 'route' && JSON.stringify(ch.parcours.pris) === JSON.stringify(rA.choix[1]));
  let seq = [.01, .999], iS = 0; const alSeq = () => (iS < seq.length ? seq[iS++] : .01);
  const lM = E.parcoursLancer(eco, s0, { mode: 'moyen', maintenant: t0, graine: 42 }), aM = E.parcoursAvancer(eco, lM.etat, t0 + 60 * 60e3, alSeq), rM = aM.rentres[0];
  T('échouer une étape ramène le compagnon avec la moitié du butin', rM && rM.echec && rM.journal.length === 2 && rM.journal[0].ok && !rM.journal[1].ok && rM.butin.bois === Math.floor(rM.journal[0].gains.bois * P.echec) && aM.etat.expeditionsFinies === 1);
  { /* 22/10 · les règles du Ponton refait, dans leur propre portée */
  /* 22/10 · plus de créature au bout d’un parcours (creature = 0) : on recrute au Ponton ; la branche reste et marche encore avec creature = 0,2 */
  let avecCreature = 0, gagnees = 0, sansCreature = 0; const ecoC = C(eco); ecoC.expeditions.parcours.creature = .2;
  for (let g = 1; g <= 200; g++) { const l = E.parcoursLancer(ecoC, s0, { mode: 'moyen', maintenant: t0, graine: g }), a = E.parcoursAvancer(ecoC, l.etat, t0 + 60 * 60e3, () => .01), run = a.rentres[0]; if (run && run.journal.some(j => j.type === 'creature')) avecCreature++; if (a.etat.compagnons > s0.compagnons && a.etat.equipe.length === a.etat.compagnons) gagnees++;
    const l0 = E.parcoursLancer(eco, s0, { mode: 'moyen', maintenant: t0, graine: g }), a0 = E.parcoursAvancer(eco, l0.etat, t0 + 60 * 60e3, () => .01); if (a0.rentres[0] && !a0.rentres[0].journal.some(j => j.type === 'creature') && a0.etat.compagnons === s0.compagnons) sansCreature++; }
  T('barème 22/10 : plus de créature au bout d’un parcours (creature = 0) ; la branche reste (avec 20 %, une créature suit parfois et rejoint l’équipe avec un nom)', eco.expeditions.parcours.creature === 0 && sansCreature === 200 && avecCreature >= 25 && avecCreature <= 60 && gagnees === avecCreature);
  /* 22/10 · les compagnons : l’équipe de départ (le minotaure), recruter au sort (prix fixe, rareté tirée, stats dans la fourchette, noms distincts), la place au Ponton */
  const EQ0 = E.equipeDe(eco, s0), R = eco.compagnons.recrutement, SR = eco.compagnons.stats;
  T('l’équipe de départ : le minotaure (commun, flair 2, force 2, pied 2), l’état neuf la porte déjà (equipe, bateau 1)', EQ0.length === 1 && EQ0[0].id === 1 && EQ0[0].nom === 'Le minotaure' && EQ0[0].rarete === 'commun' && EQ0[0].stats.flair === 2 && s0.equipe && s0.equipe.length === 1 && s0.bateau === 1);
  let sRc = C(s0); sRc.or = 10000; sRc.batiments.expeditions = 4; const tir = {}; let okStats = true, okNoms = true, okPrix = true; let seqR = .37; const alea = () => { seqR = (seqR * 9301 + 49297) % 233280; return seqR / 233280; };
  for (let i = 0; i < 300; i++) { let sx = C(sRc); const rr = E.recruterAleatoire(eco, sx, alea); const c = rr.compagnon, F = SR[c.rarete]; tir[c.rarete] = (tir[c.rarete] || 0) + 1; if (!rr.ok || rr.etat.or !== sRc.or - R.prix || rr.prix !== R.prix) okPrix = false; if (!F || ['flair', 'force', 'pied'].some(k => c.stats[k] < F[0] || c.stats[k] > F[1])) okStats = false; if (rr.etat.equipe.length !== 2 || rr.etat.compagnons !== 2 || c.id !== 2 || c.nom === 'Le minotaure') okNoms = false; }
  T('recruter au sort : le prix fixe, la rareté tirée (commun le plus souvent, parfois rare, rarement légendaire), les stats dans la fourchette de la rareté, un compagnon de plus avec son nom', okPrix && okStats && okNoms && (tir.commun || 0) > 150 && (tir.rare || 0) >= 40 && (tir.legendaire || 0) >= 3 && (tir.legendaire || 0) < 45);
  let sR3 = C(sRc); for (let i = 0; i < 3; i++) sR3 = E.recruterAleatoire(eco, sR3, alea).etat; const noms3 = sR3.equipe.map(c => c.nom);
  T('les noms de l’équipe sont distincts ; le Ponton plein refuse (hall-plein) ; sans or, « pas-assez » dit ce qu’il reste à trouver', noms3.filter((x, i, L) => L.indexOf(x) === i).length === 4 && !E.recruterAleatoire(eco, sR3, alea).ok && E.recruterAleatoire(eco, sR3, alea).raison === 'hall-plein' && E.recruterAleatoire(eco, Object.assign(C(sRc), { or: 100 }), alea).raison === 'pas-assez' && E.recruterAleatoire(eco, Object.assign(C(sRc), { or: 100 }), alea).manque.or === R.prix - 100);
  /* 22/10 · le bateau : niveau 1 (une place), monte en 3 niveaux contre du bois (et de l’or au 3), une destination de plus par niveau */
  const NB = eco.bateau.niveaux; let sB = C(s0); sB.bois = 1000; sB.or = 1000; const b2 = E.ameliorerBateau(eco, sB), b3 = E.ameliorerBateau(eco, b2.etat), b4 = E.ameliorerBateau(eco, b3.etat);
  T('le bateau : niveau 1 au départ, 2 puis 3 (bois et or payés, une place à bord par niveau), pas de 4', E.bateauPlaces(eco, s0) === 1 && b2.ok && b2.niveau === 2 && b2.etat.bois === 1000 - NB[2].bois && b3.ok && b3.niveau === 3 && b3.etat.bois === 1000 - NB[2].bois - NB[3].bois && b3.etat.or === 1000 - NB[2].or - NB[3].or && E.bateauPlaces(eco, b3.etat) === 3 && !b4.ok && b4.raison === 'au-maximum' && !E.ameliorerBateau(eco, Object.assign(C(s0), { bois: 10 })).ok && E.peutAmeliorerBateau(eco, Object.assign(C(s0), { bois: 10 })).manque.bois === NB[2].bois - 10);
  T('les destinations : la crique dès le bateau 1, les îles au bateau 2, le détroit au bateau 3 ; une destination inconnue vaut la crique', E.destinationOuverte(eco, s0, 'crique') && !E.destinationOuverte(eco, s0, 'iles') && E.destinationOuverte(eco, b2.etat, 'iles') && !E.destinationOuverte(eco, b2.etat, 'detroit') && E.destinationOuverte(eco, b3.etat, 'detroit') && E.destinationDe(eco, 'nulle-part').cle === 'crique');
  /* 22/10 · l’équipée : les compagnons demandés partent ensemble (dans la limite des places du bateau), leurs stats grossissent la besace ; la destination ajoute des pas et durcit les voies */
  let sQ = C(sRc); sQ.bois = 1000; for (let i = 0; i < 2; i++) sQ = E.recruterAleatoire(eco, sQ, alea).etat; sQ = E.ameliorerBateau(eco, sQ).etat;
  const q1 = E.parcoursLancer(eco, sQ, { mode: 'moyen', maintenant: t0, graine: 42, destination: 'iles', compagnons: [1] }), q2 = E.parcoursLancer(eco, sQ, { mode: 'moyen', maintenant: t0, graine: 42, destination: 'iles', compagnons: [1, 2, 3] }), qd = E.parcoursLancer(eco, sQ, { mode: 'moyen', maintenant: t0, graine: 42, destination: 'detroit', compagnons: [1] });
  const a1 = E.parcoursAvancer(eco, q1.etat, t0 + 4 * H, () => .01), a2 = E.parcoursAvancer(eco, q2.etat, t0 + 4 * H, () => .01);
  T('partir à plusieurs : les ids demandés (le bateau 2 en prend deux), la destination (les îles : +2 pas, voies durcies), le bonus de l’équipée, une besace plus grosse à deux qu’à un', q1.ok && q2.ok && q1.parcours.compagnons.join() === '1' && q2.parcours.compagnons.join() === '1,2' && q2.parcours.destination === 'iles' && q2.parcours.etapes === P.etapes[4] + 2 && q2.parcours.dif === 2 && q2.parcours.choix.every(c => c.difficulte >= 2) && q2.parcours.bonus > q1.parcours.bonus && q1.parcours.bonus > 1 && a2.rentres[0].butin.bois > a1.rentres[0].butin.bois && !qd.ok && qd.raison === 'bateau-trop-petit' && qd.bateau === 3);
  const q3 = E.parcoursLancer(eco, q2.etat, { mode: 'moyen', maintenant: t0 + 60e3, graine: 43, compagnons: [2] });
  T('un compagnon en chemin ne repart pas : le suivant libre part à sa place ; les partis sont connus (compagnonsPartis)', E.compagnonsPartis(eco, q2.etat).join() === '1,2' && q3.ok && q3.parcours.compagnons.join() === '3' && E.compagnonsPartis(eco, q3.etat).join() === '1,2,3');
  const vieux6 = E.etatInitial(eco, t0); delete vieux6.equipe; delete vieux6.bateau; vieux6.compagnons = 3; const neuf6 = E.completer(eco, vieux6);
  T('migration douce (22/10) : un ancien état sans équipe reçoit le minotaure puis des compagnons communs nommés, jusqu’au compte, et le bateau 1', neuf6.equipe.length === 3 && neuf6.equipe[0].nom === 'Le minotaure' && neuf6.equipe.slice(1).every(c => c.rarete === 'commun' && c.nom && c.stats) && neuf6.bateau === 1 && E.completerEquipe(eco, neuf6) === neuf6);
  }
  const lF = E.parcoursLancer(eco, s0, { mode: 'facile', maintenant: t0, graine: 42 }), lD = E.parcoursLancer(eco, s0, { mode: 'difficile', maintenant: t0, graine: 42 });
  T('les modes sans nous : facile prend le chemin sûr, difficile le risqué', lF.parcours.pris.difficulte === 1 && lD.parcours.pris.difficulte === 3);
  const lJ = E.parcoursLancer(eco, s0, { mode: 'attend', maintenant: t0, chemin: 0, graine: 42 });
  T('deux parcours par journée au plus, un seul compagnon à la fois', !E.parcoursLancer(eco, lJ.etat, { mode: 'attend', maintenant: t0 + 60e3, graine: 43 }).ok && E.parcoursLancer(eco, Object.assign(C(lJ.etat), { parcours: [] }), { mode: 'attend', maintenant: t0 + 60e3, graine: 43 }).ok && !E.parcoursLancer(eco, Object.assign(C(lJ.etat), { parcours: [], jour: Object.assign({}, lJ.etat.jour, { expeditions: 2 }) }), { mode: 'attend', maintenant: t0 + 60e3, graine: 43 }).ok);
  let sH = E.etatInitial(eco, t0); sH.clesDefinies = 4; sH = E.valider(eco, sH, { cle: true, maintenant: t0 }).etat;
  const nj1 = E.nouvelleJournee(eco, sH, t0 + J, () => .01), nj2 = E.nouvelleJournee(eco, sH, t0 + J, () => .99);
  T('le matin : le résumé de la veille (quêtes, Sommet, palier) et, parfois, la surprise de la nuit qui entre tout de suite', nj1.hier && nj1.hier.quetes === 1 && nj1.hier.cles === 1 && nj1.hier.sommet === false && nj1.hier.palier === 0 && nj1.hier.surprise && nj1.bois + nj1.or > sH.bois + sH.or && nj2.hier && nj2.hier.surprise === null);
  const ac = E.validerApresCoup(eco, sH, { maintenant: t0 + J + H, jour: sH.jour.id });
  T('valider après coup : les gains et l’XP, ni palier ni Sentier', ac.ok && ac.etat.bois === sH.bois + eco.quete.bois && ac.etat.xp === sH.xp + eco.quete.xp && ac.etat.jour.cles === sH.jour.cles && ac.etat.sentier.palier === sH.sentier.palier);
  const vieux5 = E.etatInitial(eco, t0); delete vieux5.parcours; delete vieux5.expeditionsFinies; delete vieux5.hier; const neuf5 = E.completer(eco, vieux5);
  T('migration douce (barème 5) : un ancien état reçoit les parcours, les expéditions finies et le résumé de la veille', Array.isArray(neuf5.parcours) && neuf5.expeditionsFinies === 0 && 'hier' in neuf5);
  const sR5 = E.simuler(eco, E.PROFILS.regulier, 60, 3);
  T('la simulation : la personne régulière finit le Sentier du mois en 12 à 25 jours et gagne des compagnons', sR5.jalons.sentierComplet >= 12 && sR5.jalons.sentierComplet <= 25 && sR5.resume.compagnons > 1);
  }
  return { ok, ko, echecs };
};
})(typeof window !== 'undefined' ? window : globalThis);
