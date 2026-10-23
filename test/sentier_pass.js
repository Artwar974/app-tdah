// Sentier en pass vertical (tâche 6) · l'écran du Grand Sentier en colonne : 13 grandes cartes pleine largeur sous une bannière qui porte la jauge,
// la carte « Prochain palier », le bloc bonus après le 12e, « Voir au camp » pour un objet gagné ; la récompense d'après le 12e (carte du palier 13,
// ruban du camp, règle) ; textes ≥ 13 px, cibles ≥ 44 px, mouvement réduit, 390 × 844 et 360 × 640, deux DA, deux profils, console vide.
// Tâche 7 · les visuels dessinés par le code : rail SVG, bornes, visuel de chaque récompense (sprites de l'atlas), frise de la bannière, étagère,
// carte du palier gagné (96 px, couronne), feuille de fin de saison ; « Prochain palier » visible à l'ouverture, le détail en vue après un toucher ;
// mouvement réduit (rail en 1 ms, pas de rayons) ; aucune image nouvelle dans demo/assets.
const fs = require('fs');
const { execSync } = require('child_process');
const path = require('path');
const vm = require('vm');
const { lancer, ouvrir, ok, bilan } = require('./_commun.js');
process.chdir(__dirname);

const lire = (f) => fs.readFileSync(path.join(__dirname, '..', 'demo', f), 'utf8');
// V lu comme le vérificateur : athena-v1.js dans une VM sans navigateur
const V = (() => {
  const W = { navigator: {}, document: { currentScript: null, addEventListener() {}, dispatchEvent() {}, querySelectorAll() { return []; }, createElement() { return { style: {} }; }, head: { appendChild() {} } }, setTimeout() {}, matchMedia: null, CustomEvent: function () {} };
  W.window = W; vm.runInContext(lire('athena-v1.js'), vm.createContext(W)); return W.ATHENA_V1;
})();
const TX = (k, p) => { const x = V.TEXTES[k]; return x ? (typeof x[1] === 'object' ? x[1][p || 'enfant'] || x[1].adulte : x[1]) : undefined; };
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '’');
const interditsDans = (s) => V.MOTS_INTERDITS.filter((m) => norm(s).includes(norm(m)));
const SEN = V.JEU.eco.sentier, MAX = SEN.paliers, OR = SEN.bonus.or, GRANDS = SEN.saisons.grandsPaliers;
const PROTO = 'Prototype.dc.html#';
const SAISONS = V.SAISONS;
// 21/10 · tâche 7 : le défileur du Sentier, pris depuis la liste (son premier ancêtre qui défile), et la position d'un élément dedans (somme des offsetTop) :
// la liste devient un bloc positionné pour le rail, l'offsetParent des cartes n'est plus le défileur
const DEF = `const defileur = (el) => { for (let x = el && el.parentElement; x; x = x.parentElement) { const o = getComputedStyle(x).overflowY; if (o === 'auto' || o === 'scroll') return x; } return null; };
  const haut = (el, b) => { let y = 0; for (let x = el; x && x !== b; x = x.offsetParent) y += x.offsetTop; return y; };
  const dansVue = (el, b) => { const y = haut(el, b) - b.scrollTop; return y >= -1 && y + el.offsetHeight <= b.clientHeight + 1; };
  return { defileur, haut, dansVue };`;   // dans la page : const { defileur, haut, dansVue } = new Function(def)();

// Ce que montre le dialog du Sentier : la liste, la bannière et sa jauge, la carte « Prochain palier », le bloc bonus, le détail, les textes sous 13 px
// et les cibles sous 44 px (tailles de mise en page : le téléphone du hub est mis à l'échelle, getComputedStyle et offsetWidth ne le sont pas)
const lireSentier = (p) => p.evaluate(() => {
  const d = document.querySelector('[role="dialog"][aria-modal="true"]'); if (!d) return null;
  const vis = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
  const l = d.querySelector('[role="list"]'), enfants = l ? [...l.children] : [], cs = l ? getComputedStyle(l) : null;
  const larg = l ? l.clientWidth - parseFloat(cs.paddingLeft) - parseFloat(cs.paddingRight) : 0;
  const ban = d.querySelector(':scope > div > div:first-child'), pb = ban && ban.querySelector('[role="progressbar"]');
  const pro = d.querySelector('[data-prochain]'), bo = d.querySelector('[data-bonus]'), lives = [...d.querySelectorAll('[aria-live]')];
  const petits = [], cibles = [];
  d.querySelectorAll('*').forEach((el) => {
    if (!vis(el)) return;
    const txt = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim());
    if (txt) { const f = parseFloat(getComputedStyle(el).fontSize); if (f < 13) petits.push(el.textContent.trim().slice(0, 30) + ' ' + f + 'px'); }
    if (el.matches('button, a[href], input, select, textarea, [role="button"], [role="switch"], [tabindex]:not([tabindex="-1"])') && (el.offsetWidth < 44 || el.offsetHeight < 44)) cibles.push((el.getAttribute('aria-label') || el.textContent.trim()).slice(0, 30) + ' ' + el.offsetWidth + '×' + el.offsetHeight);
  });
  return {
    sens: cs && cs.flexDirection, n: enfants.length, tousBoutons: enfants.length > 0 && enfants.every((c) => c.matches('button[role="listitem"]')),
    hauteurs: enfants.map((c) => c.offsetHeight), largeurs: enfants.map((c) => c.offsetWidth), larg,
    pbDansBanniere: !!pb, now: pb && pb.getAttribute('aria-valuenow'), vmax: pb && pb.getAttribute('aria-valuemax'), seg: pb ? [...pb.querySelectorAll('[data-seg]')].map((s) => s.offsetHeight) : [],
    banniere: ban ? ban.textContent : '', prochain: pro ? pro.textContent : null, prochainLive: !!(pro && (pro.matches('[aria-live]') || pro.querySelector('[aria-live]'))), bonus: bo ? bo.textContent : null,
    lives: lives.length, detail: lives[0] ? lives[0].textContent : '', texte: d.textContent, petits, cibles,
  };
});

(async () => {
  const b = await lancer(); const erreurs = [];

  // 0 · les textes du brief, sans mot interdit
  const ATTENDUS = {
    'sen.suivant': 'Prochain', 'sen.grand': 'Grand palier', 'sen.gagne': 'Gagné', 'sen.prochain.t': 'Prochain palier', 'sen.prochain.d': 'Un Sommet, et il est à toi.',
    'sen.jauge': '{n} paliers sur {max}', 'sen.bonus.t': 'Après le palier {n}', 'sen.bonus.d': 'Chaque Sommet de plus offre un objet pour le camp et {or} or.', 'sen.voirCamp': 'Voir au camp',
    'sen.type.bonus': 'Un objet de plus pour le camp, à poser depuis le coffre.', 'eco.r.bonus': 'Un objet pour le camp et {or} or', 'eco.r.c.bonus': 'Un objet bonus',
    'sen.regle2': 'Après le palier {n} : un objet pour le camp et {or} or par Sommet.',   // l'espace insécable avant « : », comme les autres textes du Sentier
  };
  const faux = Object.keys(ATTENDUS).filter((k) => TX(k) !== ATTENDUS[k] || (V.TEXTES[k] || [])[0] !== 'sentier');
  ok('0 textes sen.* et eco.r.*bonus : les valeurs du brief, étiquette « sentier »', faux.length === 0, faux.map((k) => k + ' = ' + JSON.stringify(V.TEXTES[k])).join(' | '));
  ok('0 aucun mot de V.MOTS_INTERDITS dans ces textes', Object.keys(ATTENDUS).every((k) => interditsDans(TX(k) || '').length === 0));
  // 0 bis · les textes de la fin de saison (tâche 7), étiquette « sentier-fin » ; le titre de chaque saison dans V.SAISONS[i].titre
  const FIN = { 'sen.fin.t': 'Fin de la saison {s}', 'sen.fin.grille': 'Les paliers de la saison', 'sen.fin.bonus': '{n} objets bonus reçus', 'sen.fin.bonus1': '1 objet bonus reçu',
    'sen.fin.titre': 'Ami des {saison}', 'sen.fin.garde': 'Tu gardes tout.', 'sen.fin.suivante': 'La saison {s2} commence\u00a0: {nom}.' };
  const fauxFin = Object.keys(FIN).filter((k) => TX(k) !== FIN[k] || (V.TEXTES[k] || [])[0] !== 'sentier-fin');
  ok('0 bis textes sen.fin.* : les valeurs du brief, étiquette « sentier-fin », sans mot interdit', fauxFin.length === 0 && Object.keys(FIN).every((k) => interditsDans(TX(k) || '').length === 0), fauxFin.map((k) => k + ' = ' + JSON.stringify(V.TEXTES[k])).join(' | '));
  ok('0 bis V.SAISONS[i].titre : « Ami des oliviers », « Ami des vignes »…, et une frise d’objets du camp par saison (la lanterne seule se répète)', SAISONS.every((x) => typeof x.titre === 'string' && x.titre && Array.isArray(x.frise) && x.frise.length >= 1 && x.frise.every((id) => V.CAMP.objets[id])) && V.fmt(TX('sen.fin.titre'), { saison: SAISONS[0].titre }) === 'Ami des oliviers' && V.fmt(TX('sen.fin.titre'), { saison: SAISONS[1].titre }) === 'Ami des vignes', SAISONS.map((x) => x.titre + ' [' + (x.frise || []).join(',') + ']').join(' | '));

  // 1 · la colonne, à 390 × 844 et 360 × 640, dans les deux DA et pour les deux profils (palier 7)
  const regle2 = V.fmt(TX('sen.regle2'), { n: MAX, or: OR });
  for (const [w, h] of [[390, 844], [360, 640]]) for (const da of ['r2', 'origine']) for (const profil of ['enfant', 'adulte']) {
    const nom = `${w}×${h} ${da} ${profil}`;
    const p = await ouvrir(b, PROTO + `ecran=sentier&palier=7&nouv=tout&da=${da}&profil=${profil}`, { viewport: { width: w, height: h } });
    const s = await lireSentier(p);
    if (!s) { ok('1 ' + nom + ' : le dialog du Sentier', false, 'absent'); erreurs.push(...p.errs.map((e) => nom + ' ' + e)); await p.close(); continue; }
    ok('1 ' + nom + ' : [role=list] en colonne, 13 enfants directs button[role=listitem]', s.sens === 'column' && s.n === MAX + 1 && s.tousBoutons, `sens=${s.sens} enfants=${s.n} boutons=${s.tousBoutons}`);
    ok('1 ' + nom + ' : chaque carte ≥ 96 px de haut et pleine largeur', s.hauteurs.length === MAX + 1 && s.hauteurs.every((x) => x >= 96) && s.largeurs.every((x) => Math.abs(x - s.larg) <= 1), `hauteurs=${s.hauteurs.join(',')} largeurs=${[...new Set(s.largeurs)].join(',')} contenu=${s.larg}`);
    const segOk = s.seg.length === MAX && s.seg.every((x, i) => (GRANDS.includes(i + 1) ? x === 10 : x < 10));
    ok('1 ' + nom + ' : jauge [role=progressbar] dans la bannière, 7 sur 12, 12 segments (10 px aux grands paliers)', s.pbDansBanniere && s.now === '7' && s.vmax === String(MAX) && segOk && /Les oliviers/.test(s.banniere), `now=${s.now} max=${s.vmax} seg=${s.seg.join(',')}`);
    ok('1 ' + nom + ' : carte « Prochain palier » : Palier 8, sans aria-live ; pas de bloc bonus', !!s.prochain && /Prochain palier/.test(s.prochain) && /Palier 8/.test(s.prochain) && !s.prochainLive && s.bonus === null, (s.prochain || 'absente').slice(0, 80));
    ok('1 ' + nom + ' : un seul aria-live, le détail (Palier 8) ; la règle d’après le 12e', s.lives === 1 && /Palier 8/.test(s.detail) && s.texte.includes(regle2), `lives=${s.lives} détail=${s.detail.slice(0, 50)}`);
    ok('1 ' + nom + ' : aucun texte < 13 px, aucune cible < 44 px', s.petits.length === 0 && s.cibles.length === 0, [...s.petits, ...s.cibles].slice(0, 6).join(' | '));
    erreurs.push(...p.errs.map((e) => nom + ' ' + e));
    await p.close();
  }

  // 2 · palier 12 : plus de « Prochain palier », le bloc « Après le palier 12 » avec l'or du bonus ; à l'ouverture (paliers 0, 7, 12), la carte « Tu es ici »
  //     est entière dans la vue du défileur et « Revenir à mon palier » n'apparaît pas (bornes du défilement)
  const vue = (p) => p.evaluate(([t, def]) => { const { defileur, haut } = new Function(def)(); const l = document.querySelector('[role="dialog"] [role="list"]'), i = l && l.querySelector('[data-ici="true"]'), b = defileur(l); if (!b || !i) return null; const y = haut(i, b) - b.scrollTop; return { dedans: y >= 0 && y + i.offsetHeight <= b.clientHeight, y: Math.round(y), h: b.clientHeight, revenir: [...document.querySelectorAll('[role="dialog"] button')].some((x) => x.textContent.includes(t)) }; }, [TX('sen.revenir'), DEF]);
  let p, s;
  for (const n of [0, 7, MAX]) {
    p = await ouvrir(b, PROTO + `ecran=sentier&palier=${n}&nouv=tout`, { viewport: { width: 390, height: 844 } });
    const v = await vue(p); s = await lireSentier(p);
    ok(`2 palier ${n} à l'ouverture : « Tu es ici » dans la vue, pas de « Revenir à mon palier »`, !!v && v.dedans && !v.revenir, JSON.stringify(v));
    if (n === MAX) ok('2 palier 12 : pas de « Prochain palier », bloc « Après le palier 12 » avec « ' + OR + ' or »', !!s && s.prochain === null && !/Prochain palier/.test(s.texte) && !!s.bonus && s.bonus.includes(V.fmt(TX('sen.bonus.t'), { n: MAX })) && s.bonus.includes(OR + ' or') && s.now === String(MAX), s ? (s.bonus || 'bloc absent').slice(0, 100) : 'dialog absent');
    erreurs.push(...p.errs.map((e) => '2 palier ' + n + ' ' + e)); await p.close();
  }

  // 3 · palier 13 (gagne=1) : la carte du palier gagné donne l'objet bonus ; le ruban du camp au palier 12 et au-delà
  p = await ouvrir(b, PROTO + 'ecran=camp&heure=16&paliers=4&palier=13&gagne=1&nouv=tout', { viewport: { width: 390, height: 844 } });
  const carte = await p.$eval('[role="dialog"][aria-live="polite"]', (e) => e.textContent).catch(() => 'absente');
  ok('3 palier 13 : la carte « ' + V.fmt(TX('eco.r.bonus'), { or: OR }) + ' »', carte.includes(V.fmt(TX('eco.r.bonus'), { or: OR })) && /Palier 13/.test(carte), carte.slice(0, 120));
  erreurs.push(...p.errs.map((e) => '3 ' + e)); await p.close();
  for (const n of [MAX, MAX + 1]) {
    p = await ouvrir(b, PROTO + `ecran=camp&heure=10.25&palier=${n}&nouv=tout`, { viewport: { width: 390, height: 844 } });
    const r = await p.$eval('[data-el="ruban"]', (e) => e.textContent + ' | ' + e.getAttribute('aria-label')).catch(() => 'absent');
    // 22/10 · le bandeau est devenu un bouton pass : l'aria dit « palier 12 sur 12 » (jamais 13), le badge reste sur le dernier palier
    ok(`3 (22/10) bouton pass du camp au palier ${n} : « palier ${MAX} sur ${MAX} », badge « ${V.fmt(TX('ruban.badge'), { n: MAX })} »`, r.includes(`palier ${MAX} sur ${MAX}`) && !r.includes(`palier ${MAX + 1} sur`) && r.includes(V.fmt(TX('ruban.badge'), { n: MAX })), r.slice(0, 160));
    erreurs.push(...p.errs.map((e) => '3 ruban ' + n + ' ' + e)); await p.close();
  }

  // 4 · mouvement réduit : aucune animation en cours sur les cartes (le suivant ne respire pas)
  p = await ouvrir(b, PROTO + 'ecran=sentier&palier=7&nouv=tout', { viewport: { width: 390, height: 844 }, contexte: { reducedMotion: 'reduce' } });
  const red = await p.evaluate(() => { const l = document.querySelector('[role="dialog"] [role="list"]'); if (!l) return null; const anims = document.getAnimations().filter((a) => a.effect && a.effect.target && l.contains(a.effect.target) && a.playState === 'running').map((a) => a.animationName || a.id || 'anim'); return { reduit: !!document.querySelector('[data-mouvement="reduit"]'), anims, suiv: l.children[8] ? getComputedStyle(l.children[8]).animationName : '' }; });
  ok('4 [data-mouvement=reduit] : aucune animation en cours sur les cartes', !!red && red.reduit && red.anims.length === 0 && !/rv-respire/.test(red.suiv), JSON.stringify(red));
  erreurs.push(...p.errs.map((e) => '4 ' + e)); await p.close();

  // 5 · « Voir au camp » : un palier gagné dont la récompense est un objet (palier 4, la lanterne) ; pas sur un palier à venir ; le toucher ferme le Sentier et cadre l'objet
  const i4 = SEN.recompenses.findIndex((R) => R[0] === 'objet' && V.CAMP.objets[R[1].id]) + 1;
  p = await ouvrir(b, PROTO + 'ecran=sentier&palier=7&nouv=tout', { viewport: { width: 390, height: 844 } });
  await p.click(`[role="dialog"] [role="list"] > button:nth-child(${i4 + 1})`); await p.waitForTimeout(400);
  const voir = await p.evaluate((t) => { const d = document.querySelector('[role="dialog"] [aria-live="polite"]'), bt = d && [...d.querySelectorAll('button')].find((x) => x.textContent.includes(t)); return { detail: d ? d.textContent : '', h: bt ? bt.offsetHeight : 0, w: bt ? bt.offsetWidth : 0 }; }, TX('sen.voirCamp'));
  ok(`5 palier ${i4} (${SEN.recompenses[i4 - 1][1].id}) gagné : « ${TX('sen.voirCamp')} » dans le détail, ≥ 44 px`, voir.h >= 44 && voir.w >= 44 && voir.detail.includes('Palier ' + i4), JSON.stringify(voir).slice(0, 160));
  await p.click('[role="dialog"] [role="list"] > button:nth-child(10)'); await p.waitForTimeout(400);
  const sansVoir = await p.$eval('[role="dialog"] [aria-live="polite"]', (d, t) => d.textContent.includes(t), TX('sen.voirCamp'));
  ok('5 palier 9 (à venir) : pas de « Voir au camp »', !sansVoir);
  await p.click(`[role="dialog"] [role="list"] > button:nth-child(${i4 + 1})`); await p.waitForTimeout(400);
  const cam0 = await p.evaluate(() => window.__scene && window.__scene.camera());
  await p.evaluate((t) => { const bt = [...document.querySelectorAll('[role="dialog"] button')].find((x) => x.textContent.includes(t)); if (bt) bt.click(); }, TX('sen.voirCamp'));
  let cam1 = null, ferme = false; for (let i = 0; i < 16 && !(ferme && cam1 && cam0 && cam1.z > cam0.z + 0.01); i++) { await p.waitForTimeout(250); ferme = !(await p.$('[role="dialog"][aria-modal="true"]')); cam1 = await p.evaluate(() => window.__scene && window.__scene.camera()); }
  ok('5 « Voir au camp » ferme le Sentier et la caméra s’approche de l’objet', ferme && !!cam0 && !!cam1 && cam1.z > cam0.z + 0.01, JSON.stringify({ ferme, cam0, cam1 }));
  erreurs.push(...p.errs.map((e) => '5 ' + e)); await p.close();

  // 7 · les visuels du pass (palier 7) : le rail SVG (2 tracés, la copie de saison remplie jusqu'au palier courant), les 4 bornes des grands paliers,
  //     le visuel de chaque récompense (la lanterne du palier 4 : son sprite de l'atlas objets.webp), la frise de la bannière, l'étagère
  p = await ouvrir(b, PROTO + 'ecran=sentier&palier=7&nouv=tout', { viewport: { width: 390, height: 844 } });
  await p.waitForTimeout(600);   // le rail se trace en 0,9 s
  const vis = await p.evaluate((def) => {
    const { defileur, haut } = new Function(def)();
    const d = document.querySelector('[role="dialog"][aria-modal="true"]'), l = d && d.querySelector('[role="list"]'), sc = defileur(l), r = d && d.querySelector('[data-rail]');
    const ps = r ? [...r.querySelectorAll('path')] : [], p2 = ps[1];
    const L = p2 ? (+p2.getAttribute('pathLength') || p2.getTotalLength()) : 0, off = p2 ? parseFloat(getComputedStyle(p2).strokeDashoffset) : NaN;
    const cen = (n) => { const c = l.querySelector('[data-pal="' + n + '"]'); return c ? haut(c, sc) + c.offsetHeight / 2 : NaN; };
    const y0 = cen(0), yN = cen(12), yP = cen(7), attendu = (yP - y0) / (yN - y0);
    const bornes = [...d.querySelectorAll('[data-borne]')].map((x) => +(x.closest('[data-pal]') || {}).dataset.pal);
    const v4 = l.querySelector('[data-pal="4"] [data-visuel]'), bg4 = v4 ? getComputedStyle(v4).backgroundImage : '';
    const fr = d.querySelector('[data-frise]'), frImgs = fr ? [...fr.querySelectorAll('*')].filter((x) => /assets\/scene\//.test(getComputedStyle(x).backgroundImage + (x.getAttribute('src') || ''))) : [];
    const et = d.querySelector('[data-etagere]');
    return { rail: !!r, n: ps.length, L: Math.round(L), off: Math.round(off), rempli: L ? +((L - off) / L).toFixed(3) : 0, attendu: +attendu.toFixed(3), bornes, bg4: bg4.slice(-40),
      frise: frImgs.length, opa: frImgs.map((x) => getComputedStyle(x).opacity), banFrise: !!(fr && fr.closest('[role="dialog"] > div > div:first-child')),
      etagere: et ? et.querySelectorAll('[role="listitem"]').length : -1, etagereVis: et ? et.querySelectorAll('[role="listitem"] [data-visuel]').length : -1 };
  }, DEF);
  ok('7 [data-rail] : deux tracés, le second (couleur de saison) rempli jusqu’au palier 7 (stroke-dashoffset < sa longueur)', vis.rail && vis.n === 2 && vis.off > 0 && vis.off < vis.L && Math.abs(vis.rempli - vis.attendu) < 0.03, JSON.stringify({ n: vis.n, L: vis.L, off: vis.off, rempli: vis.rempli, attendu: vis.attendu }));
  ok('7 [data-borne] : 4 bornes, aux grands paliers ' + GRANDS.join(', '), JSON.stringify(vis.bornes) === JSON.stringify(GRANDS), JSON.stringify(vis.bornes));
  ok('7 la carte du palier 4 (lanterne) : un visuel dont le background-image finit par objets.webp', /objets\.webp"?\)$/.test(vis.bg4), vis.bg4);
  ok('7 [data-frise] dans la bannière : au moins 2 images de assets/scene/ à l’opacité 0,22', vis.banFrise && vis.frise >= 2 && vis.opa.every((o) => Math.abs(parseFloat(o) - 0.22) < 0.005), `images=${vis.frise} opacités=${vis.opa.join(',')}`);
  ok('7 [data-etagere] au palier 7 : 7 éléments, chacun son visuel', vis.etagere === 7 && vis.etagereVis === 7, `éléments=${vis.etagere} visuels=${vis.etagereVis}`);
  erreurs.push(...p.errs.map((e) => '7 ' + e)); await p.close();
  p = await ouvrir(b, PROTO + 'ecran=sentier&palier=0&nouv=tout', { viewport: { width: 390, height: 844 } });
  const et0 = await p.evaluate(() => { const et = document.querySelector('[role="dialog"] [data-etagere]'); return et ? { n: et.querySelectorAll('[role="listitem"]').length, t: et.textContent } : null; });
  ok('7 [data-etagere] au palier 0 : « ' + TX('sen.deja.rien') + ' », aucun élément', !!et0 && et0.n === 0 && et0.t.includes(TX('sen.deja.rien')), JSON.stringify(et0).slice(0, 120));
  erreurs.push(...p.errs.map((e) => '7 palier 0 ' + e)); await p.close();

  // 8 · « Prochain palier » visible à l'ouverture (avec « Tu es ici » et la carte suivante) ; après un toucher sur un palier, le détail vient en vue
  //     (« Voir au camp » compris) ; 390 × 844 et 360 × 640 (le téléphone en taille « petit », 693 px de haut)
  for (const [w, h, taille] of [[390, 844, ''], [360, 640, '&taille=petit']]) for (const n of [3, 7, 11]) {
    p = await ouvrir(b, PROTO + `ecran=sentier&palier=${n}&nouv=tout${taille}`, { viewport: { width: w, height: h } });
    const o = await p.evaluate(([n, def]) => {
      const { defileur, dansVue } = new Function(def)();
      const d = document.querySelector('[role="dialog"][aria-modal="true"]'), l = d && d.querySelector('[role="list"]'), sc = defileur(l), pr = d && d.querySelector('[data-prochain]');
      const R = d.getBoundingClientRect(), r = pr ? pr.getBoundingClientRect() : null, prSc = pr && defileur(pr) === sc;
      const prOk = !!r && r.top >= R.top - 1 && r.bottom <= R.bottom + 1 && (!prSc || dansVue(pr, sc));
      return { prOk, prDansBanniere: !!(pr && pr.closest('[role="dialog"] > div > div:first-child')), ici: dansVue(l.querySelector('[data-ici="true"]'), sc), suiv: dansVue(l.querySelector('[data-pal="' + (n + 1) + '"]'), sc), hSc: sc.clientHeight };
    }, [n, DEF]);
    ok(`8 ${w}×${h} palier ${n} à l’ouverture : « Prochain palier », « Tu es ici » et la carte suivante en vue`, o.prOk && o.ici && o.suiv, JSON.stringify(o));
    erreurs.push(...p.errs.map((e) => `8 ${w}×${h} ${n} ` + e)); await p.close();
  }
  for (const [w, h, taille] of [[390, 844, ''], [360, 640, '&taille=petit']]) for (const reduit of [false, true]) {
    p = await ouvrir(b, PROTO + `ecran=sentier&palier=7&nouv=tout${taille}`, { viewport: { width: w, height: h }, contexte: reduit ? { reducedMotion: 'reduce' } : {} });
    const i4 = SEN.recompenses.findIndex((R) => R[0] === 'objet' && V.CAMP.objets[R[1].id]) + 1;
    await p.evaluate((n) => document.querySelector(`[role="dialog"] [role="list"] > [data-pal="${n}"]`).click(), i4);
    // en mouvement réduit, le défilement est immédiat (lu à 150 ms) ; sinon, un défilement doux, attendu jusqu'à 3 s (swiftshader rend lentement)
    let o = null; for (let i = 0, t0 = Date.now(); i < 30 && !(o && o.detail && o.voir) && (!reduit || i === 0); i++) {
      await p.waitForTimeout(reduit ? 150 : 100);
      o = await p.evaluate(([t, def]) => {
        const { defileur, dansVue } = new Function(def)();
        const d = document.querySelector('[role="dialog"][aria-modal="true"]'), det = d.querySelector('[aria-live="polite"]'), sc = defileur(det), bt = [...det.querySelectorAll('button')].find((x) => x.textContent.includes(t));
        return { detail: dansVue(det, sc), voir: !!bt && dansVue(bt, sc), t: det.textContent.slice(0, 40) };
      }, [TX('sen.voirCamp'), DEF]); o.ms = Date.now() - t0;
    }
    ok(`8 ${w}×${h}${reduit ? ' mouvement réduit' : ''} : toucher le palier ${i4}, le détail et « ${TX('sen.voirCamp')} » viennent en vue`, o.detail && o.voir, JSON.stringify(o));
    erreurs.push(...p.errs.map((e) => `8 détail ${w}×${h} ` + e)); await p.close();
  }

  // 9 · la carte du palier gagné : visuel 96 px ; grand palier (6) : couronne SVG et cadre de 3 px ; palier 4 : le sprite de la lanterne
  p = await ouvrir(b, PROTO + 'ecran=camp&heure=16&paliers=4&palier=6&gagne=1&nouv=tout', { viewport: { width: 390, height: 844 } });
  const c6 = await p.evaluate(() => { const c = document.querySelector('[role="dialog"][aria-live="polite"]'); if (!c) return null; const ic = c.querySelector('[data-el="carte_ic"]'); return { couronne: !!c.querySelector('svg[data-couronne]'), bd: c.style.border, box: ic ? ic.offsetWidth : 0, vis: !!c.querySelector('[data-visuel]'), fete: !!c.querySelector('[data-fete]') }; });
  ok('9 palier 6 gagné : couronne svg[data-couronne], border 3px solid, visuel 96 px, fête complète', !!c6 && c6.couronne && /3px solid/.test(c6.bd) && c6.box === 96 && c6.vis && c6.fete, JSON.stringify(c6));
  erreurs.push(...p.errs.map((e) => '9 ' + e)); await p.close();
  p = await ouvrir(b, PROTO + 'ecran=camp&heure=16&paliers=4&palier=4&gagne=1&nouv=tout', { viewport: { width: 390, height: 844 } });
  const c4 = await p.evaluate(() => { const c = document.querySelector('[role="dialog"][aria-live="polite"]'); if (!c) return null; const v = c.querySelector('[data-visuel]'); return { couronne: !!c.querySelector('svg[data-couronne]'), bg: v ? getComputedStyle(v).backgroundImage.slice(-30) : '', w: v ? v.offsetHeight : 0 }; });
  ok('9 palier 4 gagné : la lanterne de l’atlas (objets.webp), pas de couronne', !!c4 && !c4.couronne && /objets\.webp"?\)$/.test(c4.bg), JSON.stringify(c4));
  erreurs.push(...p.errs.map((e) => '9 palier 4 ' + e)); await p.close();

  // 10 · la fin de saison : une feuille [data-fin-saison] (role=dialog), la grille 4 × 3 (12 cases, 7 cochées au palier 7), « Tu gardes tout. »,
  //      la saison suivante, un seul bouton ; au palier 13 : le ruban « Ami des oliviers » et « 1 objet bonus reçu » ; « Continuer » la ferme
  const suivante = V.fmt(TX('sen.fin.suivante'), { s2: 2, nom: SAISONS[1].nom });
  p = await ouvrir(b, PROTO + 'ecran=camp&heure=16&palier=7&fin=1&nouv=tout', { viewport: { width: 390, height: 844 } });
  const lireFin = () => p.evaluate(() => { const f = document.querySelector('[data-fin-saison]'); if (!f) return null; const cases = [...f.querySelectorAll('[data-case]')], gr = f.querySelector('[data-grille]'); return { role: f.getAttribute('role'), cases: cases.length, cochees: f.querySelectorAll('[data-case] [data-coche]').length, cols: gr ? getComputedStyle(gr).gridTemplateColumns.split(' ').length : 0, boutons: f.querySelectorAll('button').length, ruban: f.querySelector('[data-ruban-titre]') ? f.querySelector('[data-ruban-titre]').textContent : null, t: f.textContent, plein: f.offsetWidth >= 390 && f.offsetHeight >= 600,
    petits: [...f.querySelectorAll('*')].filter((el) => el.getClientRects().length && [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && parseFloat(getComputedStyle(el).fontSize) < 13).map((el) => el.textContent.trim().slice(0, 20)),
    cibles: [...f.querySelectorAll('button')].filter((b) => b.offsetWidth < 44 || b.offsetHeight < 44).length }; });
  let fin = await lireFin();
  ok('10 fin=1, palier 7 : feuille [data-fin-saison] plein écran (role=dialog), 12 cases en 4 colonnes dont 7 cochées', !!fin && fin.role === 'dialog' && fin.plein && fin.cases === MAX && fin.cols === 4 && fin.cochees === 7, JSON.stringify(fin && { role: fin.role, plein: fin.plein, cases: fin.cases, cols: fin.cols, cochees: fin.cochees }));
  ok('10 « ' + TX('sen.fin.garde') + ' », « ' + suivante + ' », un seul bouton (≥ 44 px), textes ≥ 13 px, pas de ruban de titre avant le 12e', !!fin && fin.t.includes(TX('sen.fin.garde')) && fin.t.includes(suivante) && fin.t.includes(V.fmt(TX('sen.fin.t'), { s: 1 })) && fin.boutons === 1 && fin.ruban === null && interditsDans(fin.t).length === 0 && fin.petits.length === 0 && fin.cibles === 0, fin ? `boutons=${fin.boutons} ruban=${fin.ruban} petits=${fin.petits.join(',')} | ${fin.t.slice(0, 160)}` : 'absente');
  if (fin) { await p.evaluate(() => document.querySelector('[data-fin-saison] button').click()); await p.waitForTimeout(400); }
  ok('10 « Continuer » ferme la feuille', !!fin && !(await p.$('[data-fin-saison]')));
  erreurs.push(...p.errs.map((e) => '10 ' + e)); await p.close();
  p = await ouvrir(b, PROTO + 'ecran=camp&heure=16&palier=13&fin=1&nouv=tout', { viewport: { width: 390, height: 844 } });
  fin = await lireFin();
  ok('10 fin=1, palier 13 : 12 cases cochées, le ruban « ' + V.fmt(TX('sen.fin.titre'), { saison: SAISONS[0].titre }) + ' », « ' + TX('sen.fin.bonus1') + ' »', !!fin && fin.cochees === MAX && (fin.ruban || '').trim().toLowerCase() === V.fmt(TX('sen.fin.titre'), { saison: SAISONS[0].titre }).toLowerCase() && fin.t.includes(TX('sen.fin.bonus1')), fin ? `cochées=${fin.cochees} ruban=${fin.ruban}` : 'absente');
  erreurs.push(...p.errs.map((e) => '10 palier 13 ' + e)); await p.close();

  // 11 · mouvement réduit : le rail se remplit en 1 ms au plus, aucun rv-rayons (Sentier au palier 7, carte du palier 7, l'Étincelle et ses rayons) ;
  //      la fin de saison : la couleur de la saison suivante en fondu seul
  for (const q of ['ecran=sentier&palier=7&nouv=tout', 'ecran=camp&heure=16&paliers=4&palier=7&gagne=1&nouv=tout', 'ecran=camp&heure=16&palier=7&fin=1&nouv=tout']) {
    p = await ouvrir(b, PROTO + q, { viewport: { width: 390, height: 844 }, contexte: { reducedMotion: 'reduce' } });
    const r = await p.evaluate(() => ({ reduit: !!document.querySelector('[data-mouvement="reduit"]'), rail: [...document.querySelectorAll('[data-rail] path')].map((x) => getComputedStyle(x).animationDuration),
      rayons: document.getAnimations().filter((a) => a.animationName === 'rv-rayons').length + [...document.querySelectorAll('[data-rayons]')].filter((x) => x.getClientRects().length && getComputedStyle(x).display !== 'none').length,
      saison: [...document.querySelectorAll('[data-saison-suivante]')].map((x) => getComputedStyle(x).animationName) }));
    const railOk = !q.includes('ecran=sentier') || (r.rail.length === 2 && r.rail.every((d) => parseFloat(d) * (/ms$/.test(d) ? 1 : 1000) <= 1));
    const saisonOk = !q.includes('fin=1') || (r.saison.length === 1 && r.saison[0] === 'rv-apparait');
    ok('11 [data-mouvement=reduit] ' + q.split('&')[0] + (q.includes('gagne') ? ' (carte)' : q.includes('fin') ? ' (fin)' : '') + ' : rail ≤ 1 ms, pas de rayons, fondu seul', r.reduit && railOk && r.rayons === 0 && saisonOk, JSON.stringify(r));
    erreurs.push(...p.errs.map((e) => '11 ' + e)); await p.close();
  }

  // 12 · aucune image nouvelle : demo/assets n'a rien de changé ni d'ajouté, hors l'image de doc du Sentier (régénérée)
  const st = execSync('git status --porcelain -- ../demo/assets', { encoding: 'utf8' }).split('\n').filter((x) => x.trim() && !/demo\/assets\/doc\/sentier\.webp$/.test(x));
  ok('12 aucune image nouvelle dans demo/assets (hors assets/doc/sentier.webp)', st.length === 0, st.slice(0, 4).join(' | '));

  ok('6 console vide sur tous les écrans', erreurs.length === 0, erreurs.slice(0, 5).join(' | '));
  await b.close();
  const ko = bilan('sentier_pass');
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error('sentier_pass : ' + e.message); process.exit(2); });
