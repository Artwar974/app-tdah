/*! incursions-moteur.js 0.2 — module « Incursions » (option, désactivée par défaut, à définir ensemble).
 * Moteur V0 déterministe : même camp, même moment, même graine → même résultat, calculé sur le téléphone (aucun serveur).
 * Valeurs : athena-v1.js (V.INCURSIONS.sim), surchargeables dans le prototype. Aucun texte ici (clés inc.* de V.TEXTES).
 *   AthenaIncursions.resoudre({ camp, flamme: 70, graine: 1234, anciennete: 10, mode: 'absent' })  → rapport
 *   AthenaIncursions.lecteur(canvas, { habillage, moment, reduit, modeste, onTick, onFin, onSon })   → direct, image figée, replay */
(function (W) {
const V = () => W.ATHENA_V1, B = () => V().INCURSIONS.sim;
const fusion = (a, b) => { if (!b) return a; const o = Object.assign({}, a); Object.keys(b).forEach(k => { const x = b[k]; o[k] = x && typeof x === 'object' && !Array.isArray(x) && a && a[k] && typeof a[k] === 'object' ? fusion(a[k], x) : x; }); return o; };
const I = W.AthenaIncursions = {};
I.valeurs = s => fusion(B(), s);
I.rng = s => { let a = s >>> 0; return () => { a = a + 0x6D2B79F5 | 0; let t = Math.imul(a ^ a >>> 15, 1 | a); t = t + Math.imul(t ^ t >>> 7, 61 | t) ^ t; return ((t ^ t >>> 14) >>> 0) / 4294967296; }; };
I.hash = function () { let h = 2166136261; for (let j = 0; j < arguments.length; j++) { const s = String(arguments[j]); for (let i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } h ^= 47; } return h >>> 0; };
const cl = (x, a, b) => Math.max(a, Math.min(b, x));
/* La route unique, du portail au feu */
I.route = P => { if (P._r) return P._r; const pts = P.route, cum = [0]; for (let i = 1; i < pts.length; i++) cum.push(cum[i - 1] + Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]));
  const L = cum[cum.length - 1], pos = d => { d = cl(d, 0, L); let i = 1; while (i < cum.length - 1 && cum[i] < d) i++; const s = cum[i] - cum[i - 1] || 1, u = (d - cum[i - 1]) / s; return [pts[i - 1][0] + (pts[i][0] - pts[i - 1][0]) * u, pts[i - 1][1] + (pts[i][1] - pts[i - 1][1]) * u]; };
  const proche = (x, y) => { let best = 1e9, dl = 0; for (let i = 1; i < pts.length; i++) { const [ax, ay] = pts[i - 1], [bx, by] = pts[i], vx = bx - ax, vy = by - ay, l2 = vx * vx + vy * vy || 1, u = cl(((x - ax) * vx + (y - ay) * vy) / l2, 0, 1), px = ax + vx * u, py = ay + vy * u, dd = Math.hypot(x - px, y - py); if (dd < best) { best = dd; dl = cum[i - 1] + Math.sqrt(l2) * u; } } return dl; };
  Object.defineProperty(P, '_r', { value: { pts, cum, L, pos, proche }, enumerable: false }); return P._r; };
/* La flamme du jour : la braise (base), puis chaque quête la nourrit un peu moins ; plafonnée à 100 */
I.flammeDuJour = (n, P) => { P = P || B(); const F = P.flamme; let f = F.base; for (let i = 0; i < n; i++) f += F.gains[Math.min(i, F.gains.length - 1)]; return Math.min(100, f); };
/* Étape de la tente (1 à 4) atteinte après t quêtes validées : le niveau vient de l’XP des quêtes (décision incursions-base, 08/10 : elle remplace le stade du feu) */
I.etapeTente = t => { const J = window.ATHENA_V1.JEU, niv = Math.floor((t || 0) * J.xpParQuete / J.xpParNiveau) + 1; let e = 1; J.tente.forEach(([s, n]) => { if (niv >= n) e = s; }); return e; };
I.mult = (fl, stade, P) => (P.flamme.mMin + (P.flamme.mMax - P.flamme.mMin) * cl(fl, 0, 100) / 100) * (1 + P.flamme.stade * (stade || 0));
I.composition = (graine, anc, P) => { const r = I.rng(graine), G = P.vague, n = G.base + Math.min(G.plus, Math.floor((anc || 0) / 7) * G.parSemaine), out = []; let t = P.intro.debut;
  for (let i = 0; i < n; i++) { const x = r(); let k = x < G.mix[0] ? 'vive' : x < G.mix[1] ? 'ombre' : 'grande'; if (k === 'grande' && (anc || 0) < G.grandesDes) k = 'ombre'; out.push({ k, t: Math.round(t * 100) / 100 }); t += G.ecart[0] + r() * (G.ecart[1] - G.ecart[0]); } return out; };
I.camp = c => ({ def: Object.assign({}, c && c.def), cr: Object.assign({}, c && c.cr), am: Object.assign({}, c && c.am) });
I.depart = o => { const P = o.P || I.valeurs(o.surcharges), R = I.route(P), camp = I.camp(o.camp), m = I.mult(o.flamme, o.stade, P), U = [];
  Object.keys(P.lieux).forEach(l => { const [x, y] = P.lieux[l], dl = R.proche(x, y), d = camp.def[l], c = camp.cr[l];
    if (d) U.push({ id: 'd' + l, sorte: 'def', k: d, lieu: l, x, y, dl, am: camp.am[d] || 0, cd: 0, score: 0, act: -9 });
    if (c) U.push({ id: 'c' + l, sorte: 'cr', k: c, lieu: l, x: x + 22, y: y + 14, dl, cd: .6, score: 0, act: -9, fatigue: 0, repos: 0 }); });
  const file = I.composition(o.graine >>> 0, o.anciennete, P);
  return { P, R, m, t: 0, file, total: file.length, ennemis: [], unites: U, flamme0: o.flamme, flamme: o.flamme, abri: 0, pouvoirs: { recul: 1, abri: 1 }, mode: o.mode || 'absent', entrees: (o.entrees || []).slice().sort((a, b) => a.t - b.t), journal: [], utilises: [], fx: [], arretees: 0, passees: 0, passeesK: {}, fini: false, tFin: 0, id: 0, sons: [], rapide: !!o.rapide }; };
const fx = (E, f) => { if (!E.rapide) { f.t = E.t; E.fx.push(f); } };
I.pouvoir = (E, k, rejoue) => { if (!E.pouvoirs[k] || E.fini || E.t < E.P.intro.debut) return false; E.pouvoirs[k] = 0; E.utilises.push({ t: Math.round(E.t * 100) / 100, k }); if (!rejoue && E.mode === 'present') E.journal.push({ t: E.t, k });
  if (k === 'recul') E.ennemis.forEach(e => { e.d = Math.max(0, e.d - E.P.pouvoirs.recul.recul); const p = E.R.pos(e.d); e.x = p[0]; e.y = p[1]; }); else E.abri = E.P.pouvoirs.abri.duree;
  fx(E, { k: k === 'recul' ? 'onde' : 'dome' }); E.sons.push(k); return true; };
/* Athéna, quand la personne est absente ; « ideal » sert seulement à l’équilibrage (une personne attentive) */
I.politique = E => { if (!E.ennemis.length) return; const A = E.mode === 'ideal' ? E.P.ideal : E.P.athena, L = E.R.L; let tete = 0, fin = 0;
  E.ennemis.forEach(e => { tete = Math.max(tete, e.d / L); if (e.d / L > .6) fin++; });
  if (E.pouvoirs.recul && (tete >= A.recul || fin >= A.groupe)) I.pouvoir(E, 'recul');
  if (E.pouvoirs.abri && E.abri <= 0 && E.ennemis.some(e => e.tenu <= 0 && (L - e.d) / Math.max(1, E.P.ennemis[e.k].v * e.lent) <= A.abri)) I.pouvoir(E, 'abri'); };
I.pas = (E, dt) => { if (E.fini) return E; const P = E.P, R = E.R, m = E.m; E.t += dt; const t = E.t;
  while (E.entrees.length && E.entrees[0].t <= t + 1e-9) I.pouvoir(E, E.entrees.shift().k, true);
  while (E.file.length && E.file[0].t <= t) { const f = E.file.shift(), N = P.ennemis[f.k]; E.ennemis.push({ id: ++E.id, k: f.k, d: 0, pv: N.pv, pv0: N.pv, tenu: 0, lent: 1, x: R.pts[0][0], y: R.pts[0][1], ne: t, coup: -9, bancs: {} }); }
  const car = E.unites.filter(u => u.k === 'carillon');
  for (const e of E.ennemis) { e.lent = 1; for (const u of car) if (Math.hypot(e.x - u.x, e.y - u.y) <= P.defenses.carillon.portee) { e.lent = Math.min(e.lent, 1 - Math.min(.75, P.defenses.carillon.ralenti * (1 + P.renforts[u.am]))); u.score += dt * .3; u.act = t; } }
  for (const e of E.ennemis) { if (e.tenu > 0) { e.tenu -= dt; continue; } const d0 = e.d; e.d += P.ennemis[e.k].v * e.lent * dt;
    for (const u of E.unites) if (u.k === 'banc' && !e.bancs[u.id] && d0 < u.dl && e.d >= u.dl) { e.bancs[u.id] = 1; e.d = u.dl; e.tenu = P.defenses.banc.tenue * m * (1 + P.renforts[u.am]) * (e.k === 'grande' ? .5 : 1); u.score += 1.5; u.act = t; fx(E, { k: 'tenue', x: u.x, y: u.y }); }
    const p = R.pos(e.d); e.x = p[0]; e.y = p[1]; }
  const coup = (u, c, f) => { c.pv -= f; c.coup = t; c.par = u; u.score += f; u.act = t; };
  for (const u of E.unites) { if (u.k !== 'lanterne') continue; u.cd -= dt; if (u.cd > 0) continue; const D = P.defenses.lanterne; let c = null;
    for (const e of E.ennemis) if (e.pv > 0 && Math.hypot(e.x - u.x, e.y - u.y) <= D.portee && (!c || e.d > c.d)) c = e;
    if (!c) { u.cd = 0; continue; } u.cd = D.cd; coup(u, c, D.force * m * (1 + P.renforts[u.am])); fx(E, { k: 'rayon', x: u.x, y: u.y - 30, x2: c.x, y2: c.y - 10 }); }
  for (const u of E.unites) { if (u.sorte !== 'cr') continue; const C = P.creatures[u.k]; if (u.repos > 0) { u.repos -= dt; if (u.repos <= 0) u.fatigue = 0; continue; } u.cd -= dt; if (u.cd > 0) continue; let c = null;
    for (const e of E.ennemis) if (e.pv > 0 && (u.k === 'geai' || Math.abs(e.d - u.dl) <= C.portee) && (!c || e.d > c.d)) c = e;
    if (!c) { u.cd = 0; continue; } u.cd = C.cd; u.fatigue++;
    if (u.k === 'herisson') { c.d = Math.max(0, c.d - C.recul); const p = R.pos(c.d); c.x = p[0]; c.y = p[1]; u.score += 1.2; u.act = t; fx(E, { k: 'pousse', x: u.x, y: u.y }); }
    else if (u.k === 'renard') { c.tenu = Math.max(c.tenu, C.tenue); coup(u, c, C.force * m); u.score += 1; fx(E, { k: 'retient', x: c.x, y: c.y }); }
    else { coup(u, c, C.force * m); fx(E, { k: 'plonge', x: u.x, y: u.y - 30, x2: c.x, y2: c.y }); }
    if (u.fatigue >= C.fatigue[0]) u.repos = C.fatigue[1]; }
  if (E.mode !== 'present') I.politique(E);
  if (E.abri > 0) E.abri -= dt;
  E.ennemis = E.ennemis.filter(e => { if (e.pv <= 0) { E.arretees++; fx(E, { k: 'dissipe', x: e.x, y: e.y, e: e.k }); return false; }
    if (e.d >= R.L - .01) { if (E.abri > 0) { E.arretees++; fx(E, { k: 'dissipe', x: e.x, y: e.y, e: e.k }); } else { E.flamme = Math.max(0, E.flamme - P.ennemis[e.k].feu); E.passees++; E.passeesK[e.k] = (E.passeesK[e.k] || 0) + 1; fx(E, { k: 'feu' }); E.sons.push('faiblit'); } return false; } return true; });
  if (!E.rapide) E.fx = E.fx.filter(f => t - f.t < 1.4);
  if (!E.file.length && !E.ennemis.length) { E.fini = true; E.tFin = t; }
  return E; };
I.bilan = E => { const P = E.P, pct = E.flamme0 > 0 ? Math.round(E.flamme / E.flamme0 * 100) : 0, issue = E.flamme <= 0 ? 'endormie' : pct >= P.flamme.seuil * 100 ? 'tenu' : 'affaiblie';
  const u = E.unites.slice().sort((a, b) => b.score - a.score)[0], pk = E.passeesK; let faible = null;
  if (E.passees) { const vide = Object.keys(P.lieux).find(l => !E.unites.some(x => x.lieu === l && x.sorte === 'def')); faible = vide ? { k: 'vide', lieu: vide } : (pk.vive || 0) >= Math.max(pk.ombre || 0, pk.grande || 0) ? { k: 'vives' } : pk.grande ? { k: 'grandes' } : { k: 'general' }; }
  return { issue, pct, flamme0: Math.round(E.flamme0), flamme: Math.round(E.flamme), total: E.total, arretees: E.arretees, passees: E.passees, utile: u && u.score > 0 ? { sorte: u.sorte, k: u.k, lieu: u.lieu } : null, faible, duree: Math.round((E.tFin || E.t) * 10) / 10, pouvoirs: E.utilises.slice(), journal: E.journal.slice() }; };
I.resoudre = o => { const E = I.depart(Object.assign({}, o, { rapide: true })), dt = E.P.pas; let n = 0; while (!E.fini && n++ < 3000) I.pas(E, dt); return I.bilan(E); };
I.etatA = (o, t) => { const E = I.depart(o), dt = E.P.pas; while (E.t < t - 1e-9 && !E.fini) I.pas(E, dt); return E; };
/* Équilibrage : part des incursions où le camp tient, selon la flamme et le camp */
/* « ideal » : une personne présente fait au moins aussi bien qu’Athéna (elle peut laisser faire) */
I.taux = (camp, fl, n, mode, P, anc) => { let v = 0; for (let i = 0; i < n; i++) { const o = { P, camp, flamme: fl, graine: I.hash('eq', i), anciennete: anc == null ? 14 : anc, mode: mode === 'ideal' ? 'absent' : mode }, a = I.resoudre(o).issue === 'tenu'; if (a || (mode === 'ideal' && I.resoudre(Object.assign(o, { mode: 'ideal' })).issue === 'tenu')) v++; } return v / n; };
I.equilibrage = (P, n) => { P = P || I.valeurs(); n = n || 40; const F = [20, 30, 40, 50, 60, 70, 80, 90, 100], S = {}; Object.keys(P.camps).forEach(c => { S[c] = F.map(f => I.taux(P.camps[c], f, n, 'absent', P)); }); return { flammes: F, series: S, present: F.map(f => I.taux(P.camps.base, f, n, 'ideal', P)) }; };
/* Le rythme : incursions prévues (déterministes) d’un jour donné */
I.prevue = (Rv, graine, jour, actif) => { const r = I.rng(I.hash(graine, 'jour', jour)), x = r(), h = Rv.fenetre[0] + r() * (Rv.fenetre[1] - Rv.fenetre[0]); if (jour < Rv.joursSans || x >= Rv.proba || (Rv.actifs && !actif)) return null; return jour * 24 + h; };
/* Une période : dates d’ouverture de l’app (heures depuis l’activation) ; au plus une incursion résolue par absence, puis période protégée */
I.periode = (Rv, graine, jours, ouvertures, actifs) => { const res = []; let derniere = -1e9, protegee = -1, enAttente = null; const ouv = ouvertures.slice().sort((a, b) => a - b);
  for (let j = 0; j < jours; j++) { const t = I.prevue(Rv, graine, j, actifs ? actifs(j) : true);
    ouv.filter(o => o >= j * 24 && o < (j + 1) * 24 && enAttente && o >= enAttente.t).forEach(o => { if (enAttente) { enAttente.vu = o; protegee = o + Rv.protegee; enAttente = null; } });
    if (t == null || t - derniere < Rv.ecartMin || t < protegee || enAttente) continue;
    const vu = ouv.find(o => o >= t && o < t + 1), inc = { t, jour: j, vu: vu == null ? null : vu }; res.push(inc); derniere = t;
    if (inc.vu == null) enAttente = inc; else protegee = t + Rv.protegee; }
  return res; };
/* 30 jours pour un profil de q quêtes par jour (l’app ouverte chaque jour à 8 h, 13 h et 19 h) */
I.trente = (q, P, Rv, graine) => { P = P || I.valeurs(); const J = V().JEU, A = P.achats.slice(), camp = I.camp(P.camps.base), ouv = []; for (let j = 0; j < 30; j++) ouv.push(j * 24 + 8, j * 24 + 13, j * 24 + 19);
  const incs = I.periode(Rv, graine, 30, ouv, () => q > 0), jours = []; let or = 0, cumul = 0;
  for (let j = 0; j < 30; j++) { cumul += q; or += q * J.orParQuete * P.economie.part; const achats = [];
    while (A.length && or >= A[0][1]) { const [k, prix] = A.shift(); or -= prix; achats.push(k); if (k === 'banc' && !Object.values(camp.def).includes('banc')) camp.def.chaussee = 'banc', camp.def.pied = camp.def.pied || 'carillon'; else if (P.creatures[k]) { const l = ['chaussee', 'pied', 'plage'].find(x => !camp.cr[x]); if (l) camp.cr[l] = k; } else camp.am[k] = Math.min(2, (camp.am[k] || 0) + 1); }
    const inc = incs.find(x => x.jour === j); let r = null;
    if (inc) { const h = inc.t - j * 24, n = cl(Math.round(q * (h - 8) / 12), 0, q), st = I.etapeTente(cumul - q + n) - 1; r = I.resoudre({ P, camp, flamme: I.flammeDuJour(n, P), stade: st, graine: I.hash(graine, 'inc', j), anciennete: j }); }
    jours.push({ j: j + 1, inc: !!inc, r, achats, flamme: I.flammeDuJour(q, P) }); }
  const R = jours.filter(d => d.r).map(d => d.r), nb = k => R.filter(r => r.issue === k).length;
  return { q, jours, n: R.length, tenu: nb('tenu'), affaiblie: nb('affaiblie'), endormie: nb('endormie'), pct: R.length ? Math.round(R.reduce((a, r) => a + r.pct, 0) / R.length) : 0, achats: P.achats.length - A.length }; };
/* Les garde-fous anti-FOMO, vérifiés par le calcul (bloc 11) */
I.tests = (P, Rv, txt) => { P = P || I.valeurs(); const out = {}, G = 60;
  let max = 0, nAbs = 0; for (let g = 0; g < G; g++) for (let n = 1; n <= 30; n++) { const ouv = [0, (n + 4) * 24]; const r = I.periode(Rv, I.hash('abs', g), n + 5, ouv).filter(x => x.t > 1 && x.t < (n + 4) * 24); nAbs++; max = Math.max(max, r.length); }
  out.absence = { ok: max <= 1, v: max, n: nAbs };
  let viol = 0; for (let g = 0; g < G; g++) { const ouv = [5 * 24 + 8, 12 * 24 + 8, 13 * 24 + 8]; const r = I.periode(Rv, I.hash('pro', g), 20, ouv); r.forEach((x, i) => { const s = r[i + 1]; if (s && x.vu == null && s.t < 1e9) viol++; if (s && x.vu != null && s.t < x.vu + Rv.protegee - 1e-9 && s.t > x.t) viol++; }); }
  out.protegee = { ok: viol === 0, v: viol };
  const ec = Object.keys(P.camps).filter(c => c !== 'aucune').map(c => { const a = I.taux(P.camps[c], 70, 40, 'absent', P), b = I.taux(P.camps[c], 70, 40, 'ideal', P); return [c, Math.round((b - a) * 100)]; }), ecMax = Math.max(...ec.map(x => x[1]));
  out.ecart = { ok: ecMax <= P.cibles.ecart * 100, v: ecMax, detail: ec };
  let mod = 0; for (let g = 0; g < 30; g++) { const c = I.camp(P.camps.renforce), avant = JSON.stringify(c); I.resoudre({ P, camp: c, flamme: 50, graine: g, anciennete: 9 }); if (JSON.stringify(c) !== avant) mod++; } out.rien = { ok: mod === 0, v: mod };
  const T = (txt || []), mots = V().INCURSIONS.urgence, bad = T.filter(s => /!|\d+\s*(min|minutes|h\b|heures?)|compte à rebours/i.test(s) || mots.some(m => s.toLowerCase().includes(m)));
  out.notifs = { ok: bad.length === 0, v: bad.length, n: T.length };
  let hors = 0, tot = 0; for (let g = 0; g < 200; g++) for (let j = 0; j < 40; j++) { const t = I.prevue(Rv, I.hash('f', g), j, true); if (t == null) continue; tot++; const h = t - j * 24; if (j < Rv.joursSans || h < Rv.fenetre[0] || h > Rv.fenetre[1]) hors++; } out.fenetre = { ok: hors === 0, v: hors, n: tot };
  out.rallume = { ok: I.flammeDuJour(1, P) > 0 && I.flammeDuJour(1, P) > I.flammeDuJour(0, P), v: I.flammeDuJour(1, P) };
  return out; };

/* Sons doux et facultatifs (notes de V.INCURSIONS.motion), sans toucher à athena-sons.js */
let AC = null;
I.son = (notes, vol) => { if (!notes || !notes.length) return; try { AC = AC || new (W.AudioContext || W.webkitAudioContext)(); if (AC.state === 'suspended') AC.resume(); const t0 = AC.currentTime + .02, g0 = vol || .045; notes.forEach((f, i) => { const os = AC.createOscillator(), g = AC.createGain(), t = t0 + i * .12; os.type = 'sine'; os.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(g0, t + .03); g.gain.exponentialRampToValueAtTime(.0001, t + .7); os.connect(g); g.connect(AC.destination); os.start(t); os.stop(t + .75); }); } catch (e) {} };
/* Le lecteur : dessine l’incursion dans un canvas 390 × 844 (le repère du décor), en direct, figée ou en replay */
I.lecteur = (cv, o) => { const g = cv.getContext('2d'), opts = Object.assign({ moment: 'jour', habillage: 'classique', reduit: false, modeste: false }, o), C = V().CAMP; let E = null, raf = 0, last = 0, acc = 0, vit = 1, vue = 'refuge', cfg0 = null, flash = [], queue = 0, img = null;
  const taille = () => { const d = Math.min(W.devicePixelRatio || 1, opts.modeste ? 1 : 2); cv.width = 390 * d; cv.height = 844 * d; g.setTransform(d, 0, 0, d, 0, 0); }; taille();
  const atlas = () => { if (img) return img; img = new Image(); img.onload = () => dessiner(); img.src = (W.AthenaHub && W.AthenaHub.res ? W.AthenaHub.res('camp-objets', C.atlas) : C.atlas); return img; };
  const nuit = () => opts.moment === 'nuit', coul = () => ({ jour: ['#cdb68e', 'rgba(255,250,240,.75)'], coucher: ['#b79a76', 'rgba(255,236,210,.75)'], nuit: ['#77697d', 'rgba(255,240,214,.8)'] }[opts.moment] || ['#cdb68e', '#fff']);
  function chaussee(P, p) { const R = I.route(P), [a, b] = P.chaussee, pts = R.pts.slice(a, b + 1); if (p <= 0) return; const [cs, bord] = coul(); g.save(); g.lineCap = 'round'; g.lineJoin = 'round'; g.globalAlpha = .92 * (opts.reduit ? (p >= 1 ? 1 : 0) || p : 1);
    const n = opts.reduit ? pts.length : Math.max(2, Math.ceil(pts.length * p)); g.beginPath(); pts.slice(0, n).forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])));
    g.strokeStyle = 'rgba(30,22,30,.25)'; g.lineWidth = 24; g.stroke(); g.strokeStyle = cs; g.lineWidth = 18; g.stroke(); g.strokeStyle = bord; g.lineWidth = 1.5; g.setLineDash([3, 7]); g.stroke(); g.restore(); }
  function portail(p) { if (p <= 0) return; const r = opts.reduit ? 30 : 14 + 18 * p, a = opts.reduit ? Math.min(1, p) : p; g.save(); const gr = g.createRadialGradient(292, 74, 0, 292, 74, r * 2); gr.addColorStop(0, 'rgba(255,240,210,' + .75 * a + ')'); gr.addColorStop(1, 'rgba(255,200,130,0)'); g.fillStyle = gr; g.beginPath(); g.arc(292, 74, r * 2, 0, 6.283); g.fill();
    g.strokeStyle = 'rgba(255,246,228,' + .9 * a + ')'; g.lineWidth = 2.5; g.beginPath(); g.ellipse(292, 76, r, r * .62, 0, 0, 6.283); g.stroke(); g.restore(); }
  function sprite(k, x, y, h, a) { const ob = C.objets[k], im = atlas(); if (!ob || !im.complete || !im.naturalWidth) return; const [sx, sy, sw, sh] = ob.s, w = h * sw / sh; g.save(); g.globalAlpha = a; if (nuit()) g.filter = 'brightness(.82)'; g.drawImage(im, sx, sy, sw, sh, x - w / 2, y - h, w, h); g.restore(); }
  function ombre(e, P, t) { const N = P.ennemis[e.k], s = N.r, doux = opts.habillage === 'doux', bal = opts.reduit ? 0 : Math.sin(t * 2.6 + e.id) * 1.6, x = e.x, y = e.y + bal * .3, vie = e.pv / e.pv0, a = .55 + .45 * Math.max(.25, vie), touche = t - e.coup < .25;
    g.save(); g.globalAlpha = a;
    if (doux) { g.fillStyle = 'rgba(240,236,250,.92)'; [[-6, -6, 8], [0, -10, 9], [6, -6, 8], [0, -4, 9]].forEach(([dx, dy, r]) => { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, 6.283); g.fill(); }); g.fillStyle = 'rgba(60,40,80,.85)'; g.beginPath(); g.arc(x - 3 * s, y - 8 * s, 1.6 * s, 0, 6.283); g.arc(x + 3 * s, y - 8 * s, 1.6 * s, 0, 6.283); g.fill(); }
    else { g.fillStyle = '#1d1416'; g.strokeStyle = nuit() ? 'rgba(255,240,214,.8)' : 'rgba(255,250,240,.7)'; g.lineWidth = 1.4; g.beginPath(); g.ellipse(x, y - 7 * s, 5 * s, 8 * s, 0, 0, 6.283); g.fill(); g.stroke(); g.beginPath(); g.arc(x, y - 18 * s, 4 * s, 0, 6.283); g.fill(); g.stroke(); }
    if (touche) { g.globalAlpha = .7; g.strokeStyle = 'rgba(255,236,200,.9)'; g.lineWidth = 2; g.beginPath(); g.arc(x, y - 10 * s, 13 * s, 0, 6.283); g.stroke(); }
    g.restore(); }
  function creature(u, t) { const rep = u.repos > 0, act = t - u.act < .4, s = u.k === 'renard' ? 1.1 : u.k === 'geai' ? .85 : .9, x = u.x, y = u.y - (u.k === 'geai' ? 18 + (opts.reduit ? 0 : Math.sin(t * 1.6) * 3) : 0);
    g.save(); g.globalAlpha = rep ? .55 : 1; g.fillStyle = '#1d1416'; g.strokeStyle = '#e3aa5c'; g.lineWidth = 2;
    g.beginPath(); if (u.k === 'geai') { g.moveTo(x - 12 * s, y); g.lineTo(x, y - 6 * s); g.lineTo(x + 12 * s, y); g.lineTo(x, y + 4 * s); g.closePath(); } else g.ellipse(x, y - 6 * s, 10 * s, rep ? 5 * s : 7 * s, 0, 0, 6.283); g.fill(); g.stroke();
    if (u.k !== 'geai') { g.beginPath(); g.arc(x + 9 * s, y - (rep ? 8 : 12) * s, 4.5 * s, 0, 6.283); g.fill(); g.stroke(); }
    if (act && !rep) { g.globalAlpha = .6; g.beginPath(); g.arc(x, y - 6, 20, 0, 6.283); g.stroke(); } g.restore(); }
  function defense(u, p, t) { const h = { lanterne: 46, carillon: 50, banc: 30 }[u.k] * (opts.reduit ? 1 : .7 + .3 * p), a = .35 + .65 * p; g.save(); if (p > .2) { const gr = g.createRadialGradient(u.x, u.y - h * .5, 0, u.x, u.y - h * .5, 34); gr.addColorStop(0, 'rgba(255,215,154,' + (.45 * p) + ')'); gr.addColorStop(1, 'rgba(255,215,154,0)'); g.fillStyle = gr; g.beginPath(); g.arc(u.x, u.y - h * .5, 34, 0, 6.283); g.fill(); }
    g.fillStyle = 'rgba(40,24,16,.35)'; g.beginPath(); g.ellipse(u.x, u.y, 16, 5, 0, 0, 6.283); g.fill(); g.restore(); sprite(u.k, u.x, u.y, h, a);
    if (u.am) { g.save(); g.fillStyle = '#e3aa5c'; for (let i = 0; i < u.am; i++) { g.beginPath(); g.arc(u.x - 4 + i * 8, u.y + 9, 3, 0, 6.283); g.fill(); } g.restore(); } }
  function effets(t) { const now = t; for (const f of E.fx) { const u = (now - f.t) / 1.2; if (u < 0 || u > 1) continue; const a = 1 - u; g.save();
    if (f.k === 'rayon' && !opts.reduit) { if (u > .3) { g.restore(); continue; } const ok = (flash = flash.filter(x => now - x < 1)).length < 3 || flash.includes(f.t); if (ok && !flash.includes(f.t)) flash.push(f.t); g.strokeStyle = 'rgba(255,225,170,' + (ok ? .9 : .45) * (1 - u / .3) + ')'; g.lineWidth = 3; g.lineCap = 'round'; g.beginPath(); g.moveTo(f.x, f.y); g.lineTo(f.x2, f.y2); g.stroke(); }
    else if (f.k === 'onde') { const r = opts.reduit ? 0 : 40 + 260 * u; if (r) { g.strokeStyle = 'rgba(255,246,228,' + .7 * a + ')'; g.lineWidth = 3; g.beginPath(); g.ellipse(197, 566, r, r * .6, 0, 0, 6.283); g.stroke(); } }
    else if (f.k === 'plonge' && !opts.reduit && u < .4) { g.strokeStyle = 'rgba(255,236,200,.7)'; g.setLineDash([2, 5]); g.lineWidth = 2; g.beginPath(); g.moveTo(f.x, f.y); g.quadraticCurveTo((f.x + f.x2) / 2, Math.min(f.y, f.y2) - 40, f.x2, f.y2); g.stroke(); }
    else if (f.k === 'dissipe') { g.fillStyle = 'rgba(240,236,250,' + .5 * a + ')'; g.beginPath(); g.arc(f.x, f.y - 10 - (opts.reduit ? 0 : 18 * u), 8 + 10 * u, 0, 6.283); g.fill(); }
    else if ((f.k === 'pousse' || f.k === 'tenue' || f.k === 'retient') && u < .5) { g.strokeStyle = 'rgba(227,170,92,' + a + ')'; g.lineWidth = 2; g.beginPath(); g.arc(f.x, f.y - 8, 14 + (opts.reduit ? 0 : 10 * u), 0, 6.283); g.stroke(); }
    g.restore(); }
    if (E.abri > 0) { g.save(); g.fillStyle = 'rgba(255,248,237,.16)'; g.strokeStyle = 'rgba(255,248,237,.8)'; g.lineWidth = 2; g.beginPath(); g.ellipse(197, 560, 64, 56, 0, Math.PI, 0); g.closePath(); g.fill(); g.stroke(); g.restore(); } }
  function dessiner() { g.clearRect(0, 0, 390, 844); if (!E) return; const P = E.P, t = E.t, In = P.intro;
    if (vue === 'refuge') { E.unites.forEach(u => { if (u.sorte !== 'def') return; g.save(); g.strokeStyle = 'rgba(255,248,237,.55)'; g.setLineDash([3, 5]); g.lineWidth = 1.5; g.beginPath(); g.ellipse(u.x, u.y, 14, 5, 0, 0, 6.283); g.stroke(); g.restore(); }); return; }
    const pp = cl(t / In.portail, 0, 1), pc = cl((t - .6) / In.chaussee, 0, 1), pd = cl((t - In.debut + In.deploie) / In.deploie, 0, 1);
    portail(E.fini && t - E.tFin > .4 ? 1 - cl((t - E.tFin - .4) / .8, 0, 1) : pp); chaussee(P, pc);
    if (pc > .2) { const R = I.route(P); g.save(); g.strokeStyle = 'rgba(255,248,237,.28)'; g.setLineDash([2, 9]); g.lineWidth = 2; g.beginPath(); R.pts.slice(0, P.chaussee[0] + 1).forEach((q, i) => (i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1]))); g.stroke(); g.restore(); }
    E.unites.filter(u => u.sorte === 'def').forEach(u => defense(u, pd, t));
    E.ennemis.slice().sort((a, b) => a.y - b.y).forEach(e => ombre(e, P, t)); E.unites.filter(u => u.sorte === 'cr').forEach(u => creature(u, t)); effets(t); }
  function tick(ts) { raf = 0; if (!E) return; const d = last ? Math.min(.1, (ts - last) / 1000) : 0; last = ts; acc += d * vit; const dt = E.P.pas; let n = 0;
    if (vue === 'direct') { while (acc >= dt && !E.fini && n++ < 80) { I.pas(E, dt); acc -= dt; } if (E.fini) { queue += d * vit; E.t = E.tFin + queue; } }
    dessiner(); if (opts.onTick) opts.onTick(E); while (E.sons.length) { const s = E.sons.shift(); if (opts.onSon) opts.onSon(s); }
    if (vue === 'direct' && E.fini && queue > 1.2) { vue = 'fin'; if (opts.onFin) opts.onFin(I.bilan(E), cfg0); return; } if (vue === 'direct') raf = requestAnimationFrame(tick); }
  const L = { regler(x) { const m = opts.modeste; Object.assign(opts, x); if (opts.modeste !== m) taille(); if (vue !== 'direct') dessiner(); },
    jouer(c) { cfg0 = c; E = I.depart(c); vue = 'direct'; vit = c.vitesse || 1; acc = 0; last = 0; queue = 0; flash = []; cancelAnimationFrame(raf); raf = requestAnimationFrame(tick); },
    figer(c, t) { cfg0 = c; cancelAnimationFrame(raf); raf = 0; E = I.etatA(c, t); vue = 'fige'; dessiner(); },
    refuge(c) { cancelAnimationFrame(raf); raf = 0; E = I.depart(c); vue = 'refuge'; dessiner(); },
    vider() { cancelAnimationFrame(raf); raf = 0; E = null; vue = 'refuge'; g.clearRect(0, 0, 390, 844); },
    pouvoir: k => !!(E && vue === 'direct' && I.pouvoir(E, k)), vitesse: v => { vit = v; }, laisser: () => { if (E) E.mode = 'absent'; },
    passer() { if (!E || vue !== 'direct') return; while (!E.fini) I.pas(E, E.P.pas); queue = 2; tick(performance.now()); },
    etat: () => E, vue: () => vue, detruire() { cancelAnimationFrame(raf); raf = 0; E = null; } };
  return L; };
})(window);

/* Sons doux de l’incursion (notes de V.INCURSIONS.motion), facultatifs ; aucun son quand la flamme baisse */
(function (W) { let ctx = null; W.AthenaIncursions.son = (k, sobre) => { try { const M = ((W.ATHENA_V1.INCURSIONS || {}).motion || []).find(x => x[0] === k), N = M && M[3]; if (!N) return; ctx = ctx || new (W.AudioContext || W.webkitAudioContext)(); const t0 = ctx.currentTime + .01; N.forEach((f, i) => { const o = ctx.createOscillator(), g = ctx.createGain(), t = t0 + i * (sobre ? .1 : .14); o.type = 'sine'; o.frequency.value = f; g.gain.setValueAtTime(0, t); g.gain.linearRampToValueAtTime(.05, t + .02); g.gain.exponentialRampToValueAtTime(.0001, t + .5); o.connect(g); g.connect(ctx.destination); o.start(t); o.stop(t + .55); }); } catch (e) {} }; })(window);
