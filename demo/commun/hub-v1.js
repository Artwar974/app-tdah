/*! hub-v1.js — la barre commune des 7 pages du hub, et l’état partagé dans le navigateur :
 * les modifications faites dans Écrans (textes, icônes, tailles…), les décisions (avec leur historique) et les avis des testeurs (Mobile test).
 * Tout vient d’athena-v1.js ; ici, seulement ce que l’équipe change, gardé sous les clés localStorage « athena-v1-* ».
 * Liens toujours avec « # » (jamais « ? »), toujours dans le même onglet. */
(function (W) {
const D = W.document, V = () => W.ATHENA_V1 || {};
const SRC = (D.currentScript && D.currentScript.src) || '';
const H = W.AthenaHub = W.AthenaHub || {};
/* Les seules règles qui ne peuvent pas être en ligne : survol de la barre, flèche des blocs dépliables, lignes sans mot isolé */
if (!D.getElementById('hub-style')) { const st = D.createElement('style'); st.id = 'hub-style'; st.textContent = 'nav[aria-label="Pages du hub"] a:not([aria-current]):hover{background:rgba(246,236,223,.12)!important}[data-liens]::-webkit-scrollbar{display:none}[data-liens][data-suite]{-webkit-mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to right,#000 calc(100% - 36px),transparent)}[data-liens][data-avant]{-webkit-mask-image:linear-gradient(to right,transparent,#000 36px);mask-image:linear-gradient(to right,transparent,#000 36px)}[data-liens][data-avant][data-suite]{-webkit-mask-image:linear-gradient(to right,transparent,#000 36px,#000 calc(100% - 36px),transparent);mask-image:linear-gradient(to right,transparent,#000 36px,#000 calc(100% - 36px),transparent)}@media (max-width:720px){nav[aria-label="Pages du hub"]>div{flex-wrap:wrap;row-gap:2px;padding:6px 12px!important}nav[aria-label="Pages du hub"] [data-liens]{order:3;flex-basis:100%}}main{text-wrap:pretty}summary{list-style:none}summary::-webkit-details-marker{display:none}details[open]>summary [data-chev]{transform:rotate(225deg)!important;margin-top:4px!important}@media (prefers-reduced-motion:reduce){[data-chev]{transition:none!important}}'; (D.head || D.documentElement).appendChild(st); }
/* Dans la page publiée, le script est un blob : pas d’adresse de base, on reste en relatif */
H.RACINE = (() => { try { return SRC && /^https?:/.test(SRC) ? new URL('../', SRC).href : ''; } catch (e) { return ''; } })();
H.PAGES = [['Accueil.dc.html', 'Accueil'], ['Prototype.dc.html', 'Prototype'], ['Ecrans.dc.html', 'Écrans'], ['DA.dc.html', 'DA'], ['Mecaniques.dc.html', 'Mécaniques'], ['Decisions.dc.html', 'Décisions & intégration'], ['Mobile-test.dc.html', 'Mobile test']];
/* Deux espaces séparés : la V1 (à livrer) et les Incursions (tower defense, option hors V1). La barre n'affiche que les pages de l'espace où l'on est, avec un lien discret vers l'autre. */
H.INCURSIONS = [['Tower defense.dc.html', 'Incursions']];
H.ESPACES = { v1: { nom: 'Athéna · V1', fond: '#211612', accueil: 'Accueil.dc.html', autre: 'Incursions · option', vers: 'Tower defense.dc.html' }, inc: { nom: 'Athéna · Incursions', fond: '#1c2a3d', accueil: 'Tower defense.dc.html', autre: '← Retour à la V1', vers: 'Accueil.dc.html' } };
H.BADGES = { decide: ['Décidé', '#e3eee0', '#2f5a2f'], adefinir: ['À définir ensemble', '#f7e3c4', '#6b3f12'], remplacee: ['Remplacé par la révision', '#ece7df', '#5e4638'], ouvert: ['Ouvert', '#e3ebf3', '#2f4a6b'], comparer: ['Pour comparer', '#ece7df', '#4a3d47'], 'a-activer': ['À activer', '#e7e3f5', '#3f2f6b'] };

/* Paramètres de page dans le fragment : #cle=valeur&autre=valeur */
H.params = () => { const o = {}; location.hash.slice(1).split('&').forEach(kv => { if (!kv) return; const i = kv.indexOf('='); try { if (i < 0) o[decodeURIComponent(kv)] = '1'; else o[decodeURIComponent(kv.slice(0, i))] = decodeURIComponent(kv.slice(i + 1)); } catch (e) {} }); return o; };
H.setParams = o => { const s = Object.keys(o).filter(k => o[k] != null && o[k] !== '').map(k => encodeURIComponent(k) + '=' + encodeURIComponent(o[k])).join('&'); history.replaceState(null, '', s ? '#' + s : location.pathname); };

/* Stockage et évènements : même page (CustomEvent) et autres pages ou aperçus (événement storage) */
const lire = (k, d) => { try { const v = JSON.parse(localStorage.getItem('athena-v1-' + k)); return v == null ? d : v; } catch (e) { return d; } };
const ecrire = (k, v) => { try { localStorage.setItem('athena-v1-' + k, JSON.stringify(v)); } catch (e) {} W.dispatchEvent(new CustomEvent('athena-v1', { detail: k })); };
H.ecouter = f => { const a = e => f(e.detail), b = e => { if (e.key && e.key.indexOf('athena-v1-') === 0) f(e.key.slice(10)); }; W.addEventListener('athena-v1', a); W.addEventListener('storage', b); return () => { W.removeEventListener('athena-v1', a); W.removeEventListener('storage', b); }; };
const telecharger = (nom, txt, type) => { const a = D.createElement('a'); a.href = URL.createObjectURL(new Blob([txt], { type })); a.download = nom; D.body.appendChild(a); a.click(); setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 500); };
const jour = () => new Date().toISOString().slice(0, 10);
H.telecharger = telecharger;
/* Mouvement réduit : réglage de l’appareil ; les défilements deviennent immédiats */
/* Page publiée seule : le paquet publié fournit window.__resources ; les autres pages du hub n’y sont pas */
H.publie = () => !!W.__resources;
/* Images chargées par le code : dans la page publiée, leur version intégrée (déclarée par <meta name="ext-resource-dependency"> dans la page) */
H.res = (id, chemin) => { const r = W.__resources; return (r && r[id]) || chemin; };
/* La page courante : <meta name="athena-page">, car la page publiée n’a plus son nom de fichier */
H.page = () => { const m = D.querySelector('meta[name="athena-page"]'); return (m && m.content) || ici(); };
/* Message court en bas de l’écran */
H.signal = t => { let el = D.getElementById('hub-signal'); if (!el) { el = D.createElement('div'); el.id = 'hub-signal'; el.setAttribute('role', 'status'); el.style.cssText = 'position:fixed;left:50%;bottom:24px;z-index:99;width:max-content;max-width:min(92vw,520px);box-sizing:border-box;padding:12px 18px;border-radius:16px;background:#211612;color:#f6ecdf;font:500 15px/1.4 Lexend,system-ui,sans-serif;text-wrap:pretty;box-shadow:0 10px 30px rgba(33,22,18,.3);transform:translateX(-50%);transition:opacity .2s;opacity:0;pointer-events:none'; D.body.appendChild(el); } el.textContent = t; el.style.opacity = '1'; clearTimeout(H.sigT); H.sigT = setTimeout(() => { el.style.opacity = '0'; }, 3600); };
/* Page publiée seule : un lien vers la même page reste dans la page ; un lien vers une autre page du hub prévient au lieu de mener nulle part */
if (!H.clicPublie) { H.clicPublie = 1; D.addEventListener('click', e => { if (!H.publie() || e.defaultPrevented || e.button) return; const a = e.target.closest && e.target.closest('a[href]'); if (!a) return; const m = a.getAttribute('href').match(/^([^#?]*\.dc\.html)(#.*)?$/); if (!m) return; e.preventDefault(); let p = m[1].split('/').pop(); try { p = decodeURIComponent(p); } catch (er) {} if (p === H.page()) { location.hash = (m[2] || '#').slice(1); return; } H.signal('Cette page n’est pas dans la version publiée : ouvre-la depuis le projet.'); }, true); }
H.reduit = () => !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches);
H.defiler = y => scrollTo({ top: Math.max(0, y), behavior: H.reduit() ? 'auto' : 'smooth' });

/* 1 · Mes modifications (page Écrans) : textes communs aux deux DA, réglages de style propres à chaque DA */
const M = H.modifs = {};
M.lire = () => { const s = lire('modifs', null) || {}; s.textes = s.textes || {}; s.styles = s.styles || {}; return s; };
const parProfil = cle => { const x = (V().TEXTES || {})[cle]; return !!(x && x[1] && typeof x[1] === 'object'); };
M.cle = (cle, profil) => parProfil(cle) ? cle + '@' + profil : cle;
M.texte = (cle, profil) => { const m = M.lire().textes[M.cle(cle, profil)]; return m ? m.v : V().original(cle, profil); };
M.modifie = (cle, profil) => !!M.lire().textes[M.cle(cle, profil)];
M.setTexte = (cle, profil, v) => { const s = M.lire(), k = M.cle(cle, profil); if (v == null || v === V().original(cle, profil)) delete s.textes[k]; else s.textes[k] = { v: String(v), t: Date.now() }; ecrire('modifs', s); };
/* Tous les textes d’un profil, en objet imbriqué pour les modèles : t.feuille.titre */
M.arbre = profil => { const T = V().TEXTES || {}, m = M.lire().textes, o = {}, plat = {};
  Object.keys(T).forEach(cle => { const k = M.cle(cle, profil), v = m[k] ? m[k].v : V().original(cle, profil); plat[cle] = v; let n = o; const p = cle.split('.'); p.slice(0, -1).forEach(x => { if (typeof n[x] !== 'object' || n[x] === null) n[x] = {}; n = n[x]; }); if (typeof n[p[p.length - 1]] !== 'object') n[p[p.length - 1]] = v; });
  return { arbre: o, plat }; };
const DEF = { masquer: false, ordre: false };
M.defaut = (el, prop) => { const e = (V().ELEMENTS || {})[el] || {}; return prop === 'icone' ? e.ic : prop === 'taille' ? e.taille : prop === 'jeton' ? e.jeton : DEF[prop]; };
M.style = (da, el, prop) => { const x = ((M.lire().styles[da] || {})[el] || {})[prop]; return x ? x.v : M.defaut(el, prop); };
M.setStyle = (da, el, prop, v) => { const s = M.lire(), d = s.styles[da] = s.styles[da] || {}, e = d[el] = d[el] || {}; if (v == null || v === M.defaut(el, prop)) delete e[prop]; else e[prop] = { v, t: Date.now() }; if (!Object.keys(e).length) delete d[el]; ecrire('modifs', s); };
/* Réglages résolus d’un élément pour le prototype : d (display), ic, taille, ordre, bg, fg */
M.element = (da, el) => { const jt = (V().JETONS || []).find(j => j[0] === M.style(da, el, 'jeton')); return { d: M.style(da, el, 'masquer') ? 'none' : '', ic: M.style(da, el, 'icone') || '', taille: String(M.style(da, el, 'taille') || ''), ordre: !!M.style(da, el, 'ordre'), bg: jt ? 'var(' + jt[2] + ')' : '', fg: jt ? 'var(' + jt[3] + ')' : '' }; };
M.liste = () => { const s = M.lire(), L = [], v = V(), fmt = (p, x) => p === 'masquer' ? (x ? 'masqué' : 'affiché') : p === 'ordre' ? (x ? 'inversé' : 'd’origine') : p === 'jeton' ? ((v.JETONS || []).find(j => j[0] === x) || [0, x])[1] : String(x);
  Object.keys(s.textes).forEach(k => { const [cle, profil] = k.split('@'); L.push({ id: 't|' + k, type: 'texte', cle, profil: profil || 'tous', ecran: ((v.TEXTES || {})[cle] || [])[0] || '', avant: v.original(cle, profil || 'adulte'), apres: s.textes[k].v, t: s.textes[k].t }); });
  Object.keys(s.styles).forEach(da => Object.keys(s.styles[da]).forEach(el => Object.keys(s.styles[da][el]).forEach(p => { const e = (v.ELEMENTS || {})[el] || {}; L.push({ id: 's|' + da + '|' + el + '|' + p, type: 'style', da, el, prop: p, cle: el + ' · ' + p, ecran: e.e || '', libelle: e.t || el, avant: fmt(p, M.defaut(el, p)), apres: fmt(p, s.styles[da][el][p].v), t: s.styles[da][el][p].t }); })));
  return L.sort((a, b) => b.t - a.t); };
M.annuler = id => { const s = M.lire(), p = id.split('|'); if (p[0] === 't') delete s.textes[p[1]]; else { const e = ((s.styles[p[1]] || {})[p[2]]) || {}; delete e[p[3]]; if (!Object.keys(e).length && s.styles[p[1]]) delete s.styles[p[1]][p[2]]; } ecrire('modifs', s); };
M.toutRemettre = () => ecrire('modifs', { textes: {}, styles: {} });
M.exporter = fmt => { const L = M.liste(), v = V(), DA = v.DAS || {};
  if (fmt === 'json') return telecharger('athena-v1-modifications-' + jour() + '.json', JSON.stringify({ app: 'Athéna', version: v.version, date: new Date().toISOString(), textes: L.filter(x => x.type === 'texte').map(x => ({ cle: x.cle, profil: x.profil, ecran: x.ecran, avant: x.avant, apres: x.apres })), styles: L.filter(x => x.type === 'style').map(x => ({ da: x.da, element: x.el, reglage: x.prop, avant: x.avant, apres: x.apres })) }, null, 2), 'application/json');
  const md = ['# Athéna — mes modifications du ' + new Date().toLocaleDateString('fr-FR'), '', 'À intégrer dans athena-v1.js. Les textes valent pour les deux DA ; les réglages de style sont propres à chaque DA.', '', '## Textes', ''];
  L.filter(x => x.type === 'texte').forEach(x => md.push('- `' + x.cle + '`' + (x.profil !== 'tous' ? ' (' + x.profil + ')' : '') + ' · écran ' + x.ecran + ' : « ' + x.avant + ' » → « ' + x.apres + ' »'));
  md.push('', '## Styles', ''); L.filter(x => x.type === 'style').forEach(x => md.push('- ' + ((DA[x.da] || {}).nom || x.da) + ' · ' + x.libelle + ' · ' + x.prop + ' : ' + x.avant + ' → ' + x.apres));
  telecharger('athena-v1-modifications-' + jour() + '.md', md.join('\n'), 'text/markdown'); };

/* 2 · Décisions : pack du 28/09 (état initial) + révisions + choix du 01/10, historique de l’ancien hub fusionné au premier chargement */
const Dc = H.decisions = {};
const T_R1 = Date.parse('2026-09-28T19:00:00+02:00'), T_R2 = Date.parse('2026-09-30T17:00:00+02:00'), T_J = Date.parse('2026-10-01T09:00:00+02:00');
const DEC = { garder: 'Garder maintenant', bientot: 'Ajouter bientôt', discuter: 'À discuter', differer: 'Différer', ecarter: 'Écarter' };
const libelle = h => { const P = V().PACK || { noms: {}, qs: {} }, qn = P.qs[h.qid] || h.qid || '', on = id => P.noms[h.qid + '|' + id] || id || 'rien';
  if (h.type === 'carte') return (h.dec ? DEC[h.dec] || h.dec : 'Décision retirée') + ' : « ' + on(h.option) + ' » pour « ' + qn + ' »';
  if (h.type === 'choix' || h.type === 'decide') return (h.type === 'choix' ? 'Choisi' : 'Décidé') + ' : « ' + on(h.option) + ' » pour « ' + qn + ' »';
  if (h.type === 'ranger') return '« ' + qn + ' » rangé dans « ' + h.col + ' »';
  if (h.type === 'rouvrir') return 'Rouvert : « ' + qn + ' »'; if (h.type === 'annulation') return 'Choix annulé pour « ' + qn + ' »';
  if (h.type === 'vote') return (h.qui || '') + (h.option ? ' vote « ' + on(h.option) + ' »' : ' retire son vote') + ' pour « ' + qn + ' »';
  if (h.type === 'accord') return 'Accord : « ' + on(h.option) + ' » pour « ' + qn + ' »';
  if (h.type === 'vote-config') return 'Configuration « ' + h.nom + ' » reportée comme votes sur les mécaniques (' + (h.qui || '') + ')';
  return h.type || 'Action'; };
const question = id => { const v = V(), d = (v.DECISIONS || []).concat(v.AJOUTS || []).find(x => x.id === id); return d ? d.q : id; };
Dc.migrer = () => {
  const v = V(), P = v.PACK || { hist: [], noms: {} }, s = { v: 1, migre: Date.now(), etats: {}, notes: {}, historique: [] };
  (v.DECISIONS || []).forEach(d => { s.etats[d.id] = { statut: (v.REMPLACEMENTS || {})[d.id] ? 'remplacee' : 'decide' }; });
  const H0 = P.hist.map(([t, txt]) => ({ t, txt, src: 'pack' })), vu = new Set(H0.map(h => h.t + '|' + h.txt));
  let old = null; try { old = JSON.parse(localStorage.getItem('athena-hub-v1')); } catch (e) {}
  let nOld = 0; const tPack = P.hist.reduce((a, x) => Math.max(a, x[0]), 0);
  if (old && Array.isArray(old.historique)) old.historique.forEach(h => { const txt = libelle(h), k = h.t + '|' + txt; if (!vu.has(k)) { vu.add(k); nOld++; H0.push({ t: h.t, txt, src: 'ancien hub' }); } });
  if (old && old.choix) Object.keys(old.choix).forEach(q => { const c = old.choix[q] || {}; if (c.note) s.notes[q] = c.note; if (c.pourquoi) s.notes[q] = (s.notes[q] ? s.notes[q] + ' · ' : '') + c.pourquoi; if (c.option && c.quand > tPack && s.etats[q] && s.etats[q].statut !== 'remplacee') { s.etats[q].choix = P.noms[q + '|' + c.option] || c.option; s.etats[q].par = 'ancien hub'; } });
  Object.keys(v.REMPLACEMENTS || {}).forEach(id => { const [par, txt] = v.REMPLACEMENTS[id]; if (par === '14/10') return H0.push({ t: Date.parse('2026-10-14T09:00:00+02:00'), txt: '« ' + question(id) + ' » : ' + txt, src: '14/10' }); H0.push({ t: par === 'rev1' ? T_R1 : T_R2, txt: '« ' + question(id) + ' » : décision d’origine remplacée par la révision ' + (par === 'rev1' ? '1' : '2') + ' — ' + txt, src: par }); });
  (v.AJOUTS || []).forEach(a => H0.push({ t: a.par === 'rev1' ? T_R1 : a.par === 'rev2' ? T_R2 : a.par === '05/10' ? Date.parse('2026-10-05T09:00:00+02:00') : T_J, txt: 'Décidé : « ' + a.choix + ' » pour « ' + a.q + ' »', src: a.par }));
  H0.push({ t: Date.now(), txt: 'Migration vers le hub V1 : ' + (v.DECISIONS || []).length + ' décisions du pack, ' + P.hist.length + ' entrées de son historique' + (old ? ', ' + nOld + ' entrées nouvelles de l’ancien hub' : ' ; aucun ancien hub dans ce navigateur') + '.', src: 'hub' });
  s.historique = H0.sort((a, b) => b.t - a.t); ecrire('decisions', s); return s; };
Dc.lire = () => lire('decisions', null) || Dc.migrer();
Dc.journal = (s, txt) => { s.historique.unshift({ t: Date.now(), txt, src: 'hub' }); };
Dc.noter = (id, note) => { const s = Dc.lire(); s.notes[id] = note; ecrire('decisions', s); };
Dc.statut = (id, statut) => { const s = Dc.lire(), e = s.etats[id] = s.etats[id] || {}; if (e.statut === statut) return; e.statut = statut; e.t = Date.now(); Dc.journal(s, 'Statut de « ' + question(id) + ' » : ' + H.BADGES[statut][0]); ecrire('decisions', s); };
/* Un statut changé par une mise à jour d’athena-v1.js (statutLe) l’emporte sur l’état gardé dans ce navigateur, sauf si l’équipe l’a changé ensuite dans la page */
const apresMaj = (e, d) => !d.statutLe || !!(e.t && e.t > Date.parse(d.statutLe));
Dc.lignes = () => { const v = V(), s = Dc.lire(); return (v.DECISIONS || []).map(d => { const e0 = s.etats[d.id] || {}, e = apresMaj(e0, d) ? e0 : {}, R = (v.REMPLACEMENTS || {})[d.id]; return Object.assign({}, d, { statut: e.statut || d.statut, choix: e.choix || d.choix, parChoix: e.par || d.par, remplacement: R ? R[1] : '', revision: R ? R[0] : '', precision: (v.PRECISIONS || {})[d.id] || '', note: s.notes[d.id] || '' }); }).concat((v.AJOUTS || []).map(a => Object.assign({}, a, { statut: (s.etats[a.id] || {}).statut || a.statut, note: s.notes[a.id] || '' }))); };
/* Les choix à faire du 14/10 (V.CHOIX_14_10) : trancher un choix l’enregistre comme les autres décisions de la page (statut, choix, historique), puis s’exporte */
Dc.trancher = (id, option) => { const c = (V().CHOIX_14_10 || []).find(x => x.id === id), s = Dc.lire(), e = s.etats[id] = s.etats[id] || {}; e.statut = 'decide'; e.choix = option; e.par = 'hub'; e.t = Date.now(); Dc.journal(s, 'Choix tranché : « ' + option + ' » pour « ' + (c ? c.q : question(id)) + ' »'); ecrire('decisions', s); };
Dc.rouvrir = id => { const c = (V().CHOIX_14_10 || []).find(x => x.id === id), s = Dc.lire(), e = s.etats[id] = s.etats[id] || {}; e.statut = 'adefinir'; delete e.choix; e.t = Date.now(); Dc.journal(s, 'Choix rouvert : « ' + (c ? c.q : question(id)) + ' »'); ecrire('decisions', s); };
Dc.choix = () => { const L = Dc.lignes(); return (V().CHOIX_14_10 || []).map(c => { const d = L.find(x => x.id === c.id) || {}; return Object.assign({}, c, { statut: d.statut || 'adefinir', tranche: d.statut === 'decide' ? d.choix : '' }); }); };
Dc.choixRestants = () => Dc.choix().filter(c => c.statut !== 'decide' && c.statut !== 'remplacee').length;   // 19/10 · le choix 11, remplacé par le 14, ne compte plus
Dc.exporter = fmt => { const v = V(), s = Dc.lire(), L = Dc.lignes(), O = v.OPTIONS || {}, B = H.BADGES;
  const adef = (v.ADEFINIR || []).map(k => ({ question: O[k].t, statut: 'À définir ensemble', options: O[k].choix.map(c => c[1]), reglageDuPrototype: (O[k].choix.find(c => c[0] === O[k].defaut) || [])[1] }));
  if (fmt === 'json') return telecharger('athena-v1-decisions-' + jour() + '.json', JSON.stringify({ app: 'Athéna', version: v.version, date: new Date().toISOString(), decisions: L.map(d => ({ id: d.id, theme: (v.THEMES || [])[d.th], question: d.q, statut: B[d.statut][0], choix: d.choix, detail: d.desc, source: d.par, remplaceePar: d.remplacement || undefined, precision: d.precision || undefined, note: d.note || undefined })), aDefinirEnsemble: adef, autresPointsOuverts: (v.OUVERTS || []).map(o => ({ question: o.q, options: o.options, note: o.note, source: o.par })), configurationEnCoursDuPack: (v.PACK || {}).config, historique: s.historique }, null, 2), 'application/json');
  const md = ['# Athéna — décisions de la V1 au ' + new Date().toLocaleDateString('fr-FR'), '', 'État initial : pack du 28/09/2026. Les révisions 1 et 2 s’y ajoutent ; quand elles le contredisent, la révision l’emporte.', ''];
  (v.THEMES || []).forEach((t, i) => { const G = L.filter(d => d.th === i); if (!G.length) return; md.push('## ' + (i < 10 ? i + ' · ' : '') + t, ''); G.forEach(d => md.push('- **' + d.q + '** — ' + B[d.statut][0] + ' : ' + d.choix + (d.remplacement ? ' → remplacé par : ' + d.remplacement : '') + (d.precision ? ' (' + d.precision + ')' : '') + (d.note ? ' — note : ' + d.note : ''))); md.push(''); });
  md.push('## À définir ensemble', ''); adef.forEach(a => md.push('- **' + a.question + '** : ' + a.options.join(' · ') + ' (réglage du prototype : ' + a.reglageDuPrototype + ', rien n’est décidé)')); md.push('', '## Autres points ouverts', '');
  (v.OUVERTS || []).forEach(o => md.push('- **' + o.q + '** : ' + o.options.join(' · ') + ' — ' + o.note)); md.push('', '## Historique', '');
  s.historique.forEach(h => md.push('- ' + new Date(h.t).toLocaleString('fr-FR') + ' · ' + h.txt + (h.src && h.src !== 'hub' ? ' [' + h.src + ']' : '')));
  telecharger('athena-v1-decisions-' + jour() + '.md', md.join('\n'), 'text/markdown'); };

/* 5 · Mobile test : les avis des testeurs de la V1 sur téléphone, gardés dans ce navigateur (clé athena-v1-mobile) sur le modèle des décisions.
 * Un avis : { id, t, version, profil, da, appareil, os, installe, reponses: { [question]: valeur }, remarque, qui, retire?, m? } ; « Retirer » marque l’avis
 * (rien ne se supprime), m = dernière modification. L’import fusionne par id, le plus récent gagne ; l’export JSON emporte tout, le Markdown se lit. */
const Mb = H.mobile = {};
const MT = () => V().MOBILE_TEST || { cibles: [], versions: [], avis: { questions: [] } };
const STATUTS = { distribuee: ['Distribuée', '#e3eee0', '#2f5a2f'] };
Mb.badge = s => H.BADGES[s] || STATUTS[s] || H.BADGES.adefinir;
const unOu = (L, k) => { const x = (L || []).find(y => y[0] === k); return x ? x[1] : (k || '—'); };
/* Les libellés d’un avis, lus dans athena-v1.js : la page et l’export Markdown les partagent */
Mb.libelle = { version: id => { const v = MT().versions.find(x => x.id === id); return v ? v.nom : (id || '—'); }, profil: p => ((V().PROFILS || {})[p] || {}).nom || p || '—', da: d => ((V().DAS || {})[d] || {}).nom || d || '—',
  appareil: a => { const x = (V().APPAREILS || []).find(y => y[0] === a); return x ? x[2] + ' · ' + x[1] : (a || '—'); }, os: o => unOu((MT().avis || {}).os, o), installe: i => unOu((MT().avis || {}).installe, i) };
Mb.lire = () => { const s = lire('mobile', null) || { v: 1, avis: [], historique: [] }; if (!Array.isArray(s.avis)) s.avis = []; if (!Array.isArray(s.historique)) s.historique = []; return s; };
Mb.journal = (s, txt) => { s.historique.unshift({ t: Date.now(), txt, src: 'hub' }); };
const qui = a => a.qui || 'un testeur';
Mb.ajouter = a => { const s = Mb.lire(), id = 'a' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); s.avis.unshift(Object.assign({}, a, { id, t: Date.now() })); Mb.journal(s, 'Avis ajouté : ' + qui(a) + ' · ' + Mb.libelle.version(a.version) + ' · ' + Mb.libelle.profil(a.profil)); ecrire('mobile', s); return id; };
Mb.modifier = (id, patch) => { const s = Mb.lire(), a = s.avis.find(x => x.id === id); if (!a) return false; Object.assign(a, patch, { m: Date.now() }); ecrire('mobile', s); return true; };
Mb.retirer = id => { const s = Mb.lire(), a = s.avis.find(x => x.id === id); if (!a || a.retire) return false; a.retire = a.m = Date.now(); Mb.journal(s, 'Avis retiré : ' + qui(a) + ' · ' + Mb.libelle.version(a.version)); ecrire('mobile', s); return true; };
Mb.liste = f => { f = f || {}; return Mb.lire().avis.filter(a => !a.retire && (!f.version || a.version === f.version) && (!f.profil || a.profil === f.profil) && (!f.da || a.da === f.da)).sort((a, b) => b.t - a.t); };
/* Calculée, jamais stockée : moyenne des échelles (une décimale) et comptes des choix, sur les avis d’une version (ou de toutes) */
Mb.synthese = version => { const L = Mb.liste(version ? { version } : {}), Q = (MT().avis || {}).questions || [], out = { n: L.length, echelles: {}, choix: {} };
  Q.forEach(q => { const R = L.map(a => (a.reponses || {})[q.id]);
    if (q.type === 'echelle') { const v = R.map(Number).filter(x => x >= (q.min || 1) && x <= (q.max || 5)); if (v.length) out.echelles[q.id] = Math.round(v.reduce((a, x) => a + x, 0) / v.length * 10) / 10; }
    else if (q.type === 'choix') { const c = {}; R.forEach(r => { if ((q.options || []).includes(r)) c[r] = (c[r] || 0) + 1; }); if (Object.keys(c).length) out.choix[q.id] = c; } });
  return out; };
/* La synthèse en une ligne : « Clair : 4,2/5 · Installation : Oui 2, Avec de l’aide 1 » */
Mb.resume = sy => ((MT().avis || {}).questions || []).map(q => { const t = q.t.replace(/\s*\?$/, ''); if (q.type === 'echelle' && sy.echelles[q.id] != null) return t + ' : ' + String(sy.echelles[q.id]).replace('.', ',') + '/' + (q.max || 5); if (q.type === 'choix' && sy.choix[q.id]) return t + ' : ' + Object.keys(sy.choix[q.id]).map(o => o + ' ' + sy.choix[q.id][o]).join(', '); return ''; }).filter(Boolean).join(' · ');
Mb.importer = obj => { if (!obj || typeof obj !== 'object' || !Array.isArray(obj.avis)) throw new Error('ce fichier n’est pas un export des avis (pas de liste « avis »)');
  const s = Mb.lire(); let nouveaux = 0, misAJour = 0;
  obj.avis.forEach(x => { if (!x || typeof x !== 'object' || typeof x.id !== 'string' || !x.id) return; const t = +x.t || Date.now(), a = s.avis.find(y => y.id === x.id);
    if (!a) { s.avis.push(Object.assign({}, x, { t })); nouveaux++; } else if ((+x.m || t) > (+a.m || +a.t || 0)) { Object.assign(a, x, { t: +x.t || a.t }); misAJour++; } });
  if (nouveaux || misAJour) { s.avis.sort((a, b) => b.t - a.t); Mb.journal(s, 'Import : ' + nouveaux + ' avis nouveau' + (nouveaux > 1 ? 'x' : '') + ', ' + misAJour + ' mis à jour'); ecrire('mobile', s); }
  return { nouveaux, misAJour }; };
Mb.exporter = fmt => { const v = V(), M = MT(), s = Mb.lire(), Q = (M.avis || {}).questions || [], Lb = Mb.libelle;
  if (fmt === 'json') return telecharger('athena-v1-avis-' + jour() + '.json', JSON.stringify({ app: 'Athéna', version: v.version, date: new Date().toISOString(), versions: M.versions || [], cibles: (M.cibles || []).map(c => ({ id: c.id, t: c.t, url: c.url, statut: c.statut })), avis: s.avis, historique: s.historique }, null, 2), 'application/json');
  const rep = a => Q.map(q => { const r = (a.reponses || {})[q.id]; return r == null || r === '' ? '' : q.t.replace(/\s*\?$/, '') + ' : ' + (q.type === 'echelle' ? r + '/' + (q.max || 5) : r); }).filter(Boolean).join(' · ');
  const ligne = a => '- ' + new Date(a.t).toLocaleString('fr-FR') + ' · ' + qui(a) + ' · ' + Lb.profil(a.profil) + ' · ' + Lb.da(a.da) + ' · ' + Lb.appareil(a.appareil) + ' (' + Lb.os(a.os) + ', ' + Lb.installe(a.installe).toLowerCase() + ')' + (rep(a) ? ' · ' + rep(a) : '') + (a.remarque ? ' · remarque : ' + a.remarque : '');
  const md = ['# Athéna — avis des testeurs au ' + new Date().toLocaleDateString('fr-FR'), '', 'Notés dans l’onglet « Mobile test » du hub, gardés dans le navigateur. Les avis retirés restent dans l’export JSON, pas ici.', ''];
  const vus = new Set();
  (M.versions || []).forEach(ver => { const L = Mb.liste({ version: ver.id }), sy = Mb.synthese(ver.id); L.forEach(a => vus.add(a.id)); md.push('## ' + ver.nom + ' · ' + ver.date + ' · ' + Mb.badge(ver.statut)[0], '', ver.contenu, '', 'Synthèse : ' + sy.n + ' avis' + (Mb.resume(sy) ? ' · ' + Mb.resume(sy) : ''), ''); L.forEach(a => md.push(ligne(a))); if (L.length) md.push(''); });
  const autres = Mb.liste().filter(a => !vus.has(a.id)); if (autres.length) { md.push('## Autres versions', ''); autres.forEach(a => md.push(ligne(a).replace(' · ' + qui(a), ' · ' + qui(a) + ' · ' + Lb.version(a.version)))); md.push(''); }
  md.push('## Historique', ''); s.historique.forEach(h => md.push('- ' + new Date(h.t).toLocaleString('fr-FR') + ' · ' + h.txt));
  telecharger('athena-v1-avis-' + jour() + '.md', md.join('\n'), 'text/markdown'); };

/* 3 · Visite guidée des 7 pages (lancée depuis l’Accueil) */
H.VISITE = [
  ['Accueil.dc.html', 'ou-on-en-est', 'Où on en est', 'L’état de la V1 en une phrase et quatre nombres ; plus bas, ce qui est dans la V1 et les décisions à confirmer.'],
  ['Accueil.dc.html', 'guide', 'Le guide', 'Replié en bas de page : comment ajouter un écran, une mécanique ou une option, et changer un texte.'],
  ['Prototype.dc.html', 'telephone', 'Le prototype', 'Il se joue comme sur le téléphone : toucher, ⋯ ou appui long, glisser jusqu’au feu, balayer la barre vers le haut. « Annuler » reprend une quête validée par erreur.'],
  ['Prototype.dc.html', 'reglages', 'Un seul panneau', 'DA, police, profil, heure simulée, appareil (trois tailles de téléphone), surprise de la nuit et simulation.'],
  ['Prototype.dc.html', 'a-definir', 'À définir ensemble', 'Le bonus d’une journée validée et le camp vivant : « Voir » montre une option, « 30 s » la joue en scénario. Rien n’est décidé.'],
  ['Prototype.dc.html', 'aller', 'Aller à un écran', 'Choisis n’importe quel écran ou état : le prototype s’y place tout de suite.'],
  ['Ecrans.dc.html', 'tableau', 'Tous les écrans', 'Regroupés par parcours ; les flèches montrent comment on passe de l’un à l’autre, états vides et messages compris. Touche un écran pour l’ouvrir.'],
  ['Ecrans.dc.html', 'affichage', 'Fil de fer ou habillé', 'Pour toute la page : fil de fer ou habillé, Figures, Veillée ou les deux côte à côte.'],
  ['Ecrans.dc.html', 'edition', 'Le mode édition', 'Touche un texte pour le changer : il change aussi dans le prototype, sans recharger. « Mes modifications » garde tout, avec annuler et exporter.'],
  ['DA.dc.html#polices', 'polices', 'Les deux DA et les polices', 'Palettes, icônes, composants, tokens et grille ; les polices auto-hébergées et la matrice police × DA.'],
  ['Mecaniques.dc.html', 'liste', 'Les mécaniques', 'Ce que fait l’utilisateur, ce qu’il reçoit, les valeurs du prototype et le statut de chaque mécanique.'],
  ['Mecaniques.dc.html', 'glossaire', 'Le vocabulaire', 'Un seul mot par idée, dans tous les textes de l’app, et les mots à ne jamais employer.'],
  ['Decisions.dc.html', 'tableau', 'Décisions & intégration', 'Le tableau des décisions, les points à définir ensemble avec gains, pertes et effort, l’export, puis l’intégration.'],
  ['Decisions.dc.html#donnees', 'donnees', 'La sauvegarde existante', 'Ce que la V1 garde de jdq_v1, ce qu’elle ajoute, et la migration sans perte.'],
  ['Decisions.dc.html#qualite', 'bilan', 'Le rapport qualité', 'Le bilan, les 3 décisions prioritaires, le registre des problèmes, les parcours rejoués et les mesures avant et après.'],
  ['Mobile-test.dc.html', 'qr', 'Mobile test', 'Les QR pour installer la V1 testable sur un téléphone, les versions distribuées et les avis des testeurs, gardés ici et exportables.']
];
const ici = () => decodeURIComponent(location.pathname.split('/').pop() || '');
H.visite = { lancer: () => { sessionStorage.setItem('athena-v1-visite', '0'); H.visite.aller(0); }, arreter: () => { sessionStorage.removeItem('athena-v1-visite'); const b = D.getElementById('hub-visite'); if (b) b.remove(); },
  aller: i => { if (H.publie()) { H.visite.arreter(); return H.signal('La visite guidée passe par toutes les pages du hub : lance-la depuis le projet.'); } const st = H.VISITE[i]; if (!st) return H.visite.arreter(); sessionStorage.setItem('athena-v1-visite', String(i)); const pg = st[0].split('#'); if (ici() !== pg[0]) { location.href = H.RACINE + st[0]; return; } if (pg[1] && location.hash.slice(1) !== pg[1]) location.hash = pg[1]; H.visite.montrer(i); },
  montrer: i => { const st = H.VISITE[i]; let n = 0; const f = () => { const el = D.getElementById(st[1]); if (!el) { if (n++ < 60) setTimeout(f, 150); return; }
    const y = el.getBoundingClientRect().top + scrollY - 96; H.defiler(y);
    let b = D.getElementById('hub-visite'); if (b) b.remove(); b = D.createElement('div'); b.id = 'hub-visite'; b.setAttribute('role', 'dialog'); b.setAttribute('aria-label', 'Visite guidée');
    b.style.cssText = 'position:fixed;right:24px;bottom:24px;z-index:200;width:min(380px,calc(100vw - 48px));box-sizing:border-box;padding:18px 20px;border-radius:20px;background:#211612;color:#f6ecdf;box-shadow:0 18px 40px rgba(33,22,18,.35);font:15px/1.5 Lexend,system-ui,sans-serif;display:flex;flex-direction:column;gap:10px';
    b.innerHTML = '<span style="font:700 13px Lexend;letter-spacing:.08em;text-transform:uppercase;color:#e3aa5c">Visite · ' + (i + 1) + ' sur ' + H.VISITE.length + '</span><strong style="font:700 20px/1.2 \'Bricolage Grotesque\',Lexend,sans-serif">' + st[2] + '</strong><span>' + st[3] + '</span><div style="display:flex;gap:8px;justify-content:flex-end;flex-wrap:wrap"><button data-v="fin" style="min-height:44px;padding:0 16px;border-radius:22px;border:1px solid rgba(246,236,223,.35);background:transparent;color:#f6ecdf;font:600 15px Lexend;cursor:pointer">Terminer</button><button data-v="suiv" style="min-height:44px;padding:0 18px;border-radius:22px;border:0;background:#e3aa5c;color:#211612;font:700 15px Lexend;cursor:pointer">' + (i < H.VISITE.length - 1 ? 'Suivant' : 'Fin de la visite') + '</button></div>';
    D.body.appendChild(b); b.querySelector('[data-v="fin"]').onclick = H.visite.arreter; b.querySelector('[data-v="suiv"]').onclick = () => H.visite.aller(i + 1);
    if (el.animate && !H.reduit()) el.animate([{ boxShadow: '0 0 0 0 rgba(227,170,92,0)' }, { boxShadow: '0 0 0 6px rgba(227,170,92,.8)' }, { boxShadow: '0 0 0 0 rgba(227,170,92,0)' }], { duration: 1400, iterations: 2 }); }; setTimeout(f, 300); } };

/* 4 · La barre de navigation : <hub-nav></hub-nav> */
if (!customElements.get('hub-nav')) customElements.define('hub-nav', class extends HTMLElement {
  connectedCallback() { this.rendre(); this.off = H.ecouter(k => { if (k === 'modifs' || k === 'mobile') this.rendre(); }); this.rz = () => this.centrer(); addEventListener('resize', this.rz); if (D.fonts && D.fonts.ready) D.fonts.ready.then(this.rz);
    const v = sessionStorage.getItem('athena-v1-visite'); if (v != null && H.VISITE[+v] && H.VISITE[+v][0].split('#')[0] === ici()) H.visite.montrer(+v); }
  disconnectedCallback() { if (this.off) this.off(); removeEventListener('resize', this.rz); }
  /* Sur un écran étroit, la rangée défile : la page en cours reste visible, au centre */
  /* La rangée défile quand elle est trop longue : la page courante est centrée, un fondu à droite dit qu’il y a une suite */
  centrer() { const sc = this.querySelector('[data-liens]'), cur = sc && sc.querySelector('[aria-current]'); if (!sc) return; if (cur && sc.scrollWidth > sc.clientWidth + 1) sc.scrollLeft = Math.max(0, cur.offsetLeft - sc.offsetLeft - (sc.clientWidth - cur.offsetWidth) / 2); const suite = () => { sc.toggleAttribute('data-suite', sc.scrollLeft + sc.clientWidth < sc.scrollWidth - 2); sc.toggleAttribute('data-avant', sc.scrollLeft > 2); }; suite(); if (!sc._suite) { sc._suite = 1; sc.addEventListener('scroll', suite, { passive: true }); /* les polices et la largeur changent la rangée après le premier rendu : on recentre */ if (window.ResizeObserver) { const ro = new ResizeObserver(() => this.centrer()); ro.observe(sc); sc.querySelectorAll('a').forEach(a => ro.observe(a)); } else addEventListener('resize', suite); if (D.fonts && D.fonts.addEventListener) D.fonts.addEventListener('loadingdone', () => this.centrer()); } }
  rendre() { if (H.publie()) { this.innerHTML = ''; return; } const page = ici(), n = M.liste().length, nA = Mb.liste().length, inc = H.INCURSIONS.some(([h]) => h === page), E = inc ? H.ESPACES.inc : H.ESPACES.v1, LISTE = inc ? H.INCURSIONS : H.PAGES;
    const pastille = (titre, x, on) => '<span title="' + titre + '" style="min-width:22px;height:22px;padding:0 6px;box-sizing:border-box;border-radius:11px;background:' + (on ? '#211612' : '#a3452a') + ';color:#fff8ef;font:700 13px/22px Lexend;text-align:center">' + x + '</span>';
    this.innerHTML = '<nav aria-label="Pages du hub" style="position:sticky;top:0;z-index:60;background:' + E.fond + ';color:#f6ecdf;box-shadow:0 4px 16px rgba(33,22,18,.18);font-family:Lexend,system-ui,sans-serif"><div style="max-width:1480px;margin:0 auto;box-sizing:border-box;padding:8px 20px;display:flex;align-items:center;gap:16px">'
      + '<a href="' + H.RACINE + E.accueil + '" style="flex:none;min-height:44px;display:flex;align-items:center;font:700 20px/1 \'Bricolage Grotesque\',Lexend,sans-serif;color:#f6ecdf;text-decoration:none;white-space:nowrap">' + E.nom + '</a>'
      + '<div data-liens="1" style="display:flex;gap:4px;flex:1 1 auto;min-width:0;overflow-x:auto;scrollbar-width:none">' + LISTE.map(([h, l]) => { const on = page === h || (!page && h === 'Accueil.dc.html'); return '<a href="' + H.RACINE + h + '"' + (on ? ' aria-current="page"' : '') + ' style="min-height:44px;padding:0 14px;display:flex;align-items:center;gap:6px;border-radius:22px;text-decoration:none;font:' + (on ? 700 : 500) + ' 15px Lexend;white-space:nowrap;background:' + (on ? '#e3aa5c' : 'transparent') + ';color:' + (on ? '#211612' : '#f6ecdf') + '">' + l + (h === 'Ecrans.dc.html' && n ? pastille('Mes modifications', n, on) : '') + (h === 'Mobile-test.dc.html' && nA ? pastille('Avis des testeurs', nA, on) : '') + '</a>'; }).join('') + '</div>'
      + '<a data-autre="1" href="' + H.RACINE + E.vers + '" style="flex:none;margin-left:auto;min-height:44px;padding:0 14px;display:flex;align-items:center;border-radius:22px;border:1px solid rgba(246,236,223,.45);text-decoration:none;font:500 14px Lexend;white-space:nowrap;color:#f6ecdf">' + E.autre + '</a>'
      + '</div></nav>';
    requestAnimationFrame(() => this.centrer()); }
});
})(window);
