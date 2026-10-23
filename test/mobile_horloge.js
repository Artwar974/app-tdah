// Mobile · l'heure du téléphone (tâche 10, spec § 4 bis). L'app installée (?source=pwa ou display-mode standalone, sans paramètre dans le fragment)
// suit l'heure et la date de l'appareil : S.horloge = 'telephone', S.heure = l'heure locale, maintenant(S) = l'heure réelle, S.jour = les journées
// locales depuis S.depart + 1 ; à l'activation, l'économie est recalée d'un seul écart (rien ne se perd) ; horlogeSync() au montage, au retour au
// premier plan et toutes les 30 s tant que la page est visible : un lendemain() par journée passée, au plus V.JEU.retourJours, puis le retour sans
// reproche ; le panneau de démonstration (heure, lendemain, avancer) éteint le mode avec « Heure de démonstration » ; l'interrupteur « Suivre l'heure
// du téléphone » de Carnet › Téléphone le rallume. Le miroir des notifications (tâche 4) garde retourA stable (l'heure du retour à la minute) et
// matinA suit le résumé du matin ; l'agenda (tâche 5) et le calendrier suivent la date réelle ; le service worker qui a annoncé un retour (periodicsync,
// protocole de débogage) trouve le compagnon rentré à l'ouverture.
// Correction du tour 1 de la relecture : le rattrapage de plusieurs journées garde le résumé de la dernière journée jouée (5c) ; quitter le mode
// téléphone entre minuit et la bascule de 4 h (9), ou après le changement d'heure en Europe/Paris (10), laisse l'horloge de démonstration à l'heure réelle.
// L'heure de la page est réglée par l'horloge de Playwright (clock.install, fastForward) ; le service worker garde l'heure réelle de la machine.
// Lancer : bash test/_serveur.sh && node test/mobile_horloge.js
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';   // les requêtes du service worker passent par le routage du contexte (CDN en local)
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { URL, ARGS, lancer, ouvrir, ok, bilan } = require('./_commun.js');
process.chdir(__dirname);

const RACINE = path.join(__dirname, '..');
const DEMO = path.join(RACINE, 'demo');
const lire = (f) => { try { return fs.readFileSync(path.join(DEMO, f), 'utf8'); } catch (e) { return ''; } };
const PH = '[data-screen-label="Prototype V1"]';
const CARTE = '[data-el="telephone"] [data-el="horloge"]';
const INTER = CARTE + ' button[role="switch"]';

// V.TEXTES, V.JEU, V.DEMO lus comme le vérificateur : athena-v1.js dans une VM sans navigateur
const V = (() => {
  const W = { navigator: {}, document: { currentScript: null, addEventListener() {}, dispatchEvent() {}, querySelectorAll() { return []; }, createElement() { return { style: {} }; }, head: { appendChild() {} } }, setTimeout() {}, matchMedia: null, CustomEvent: function () {} };
  W.window = W; vm.runInContext(lire('athena-v1.js'), vm.createContext(W)); return W.ATHENA_V1;
})();
const TX = (k, p) => { const x = V.TEXTES[k]; return x ? (typeof x[1] === 'object' ? x[1][p || 'enfant'] || x[1].adulte : x[1]) : undefined; };
const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '’');
const interditsDans = (s) => V.MOTS_INTERDITS.filter((m) => norm(s).includes(norm(m)));
const local = (a, mo, j, h, mi) => new Date(a, mo - 1, j, h || 0, mi || 0).getTime();
const iso = (t) => { const d = new Date(t), p = (n) => (n < 10 ? '0' : '') + n; return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()); };
const momentDe = (h) => (h >= V.JEU.moments.nuit ? 'nuit' : h >= V.JEU.moments.coucher ? 'coucher' : 'jour');
const lignes = (ics) => String(ics).replace(/\r\n /g, '').split('\r\n');

// window.__logique() : la logique du Prototype (l'instance du composant), trouvée par la fibre React de la maquette ;
// window.__miroirs : chaque appel de AthenaMobile.miroir (ce que le Prototype calcule à chaque sauvegarde), noté avec l'heure de la page ;
// window.__syncs : le nombre d'appels de horlogeSync (compté dès que la logique est là)
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('${PH}'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.jourAgenda === 'function') return s.logic; f = f.return; } return null; };
  window.__miroirs = []; window.__syncs = 0;
  (function poser() { const M = window.AthenaMobile, L = window.__logique && document.querySelector('${PH}') && window.__logique();
    if (M && typeof M.miroir === 'function' && !M.__esp) { const m = M.miroir; M.miroir = (o) => { window.__miroirs.push(Object.assign({ quand: Date.now() }, o)); return m(o); }; M.__esp = true; }
    if (L && typeof L.horlogeSync === 'function' && !L.__esp) { const s = L.horlogeSync; L.horlogeSync = function () { window.__syncs++; return s.apply(this, arguments); }; L.__esp = true; }
    if (!(M && M.__esp && L && L.__esp) && (window.__poser = (window.__poser || 0) + 1) < 750) setTimeout(poser, 20); })();`;
const SANS_PARTAGE = `try { delete Navigator.prototype.share; delete Navigator.prototype.canShare; } catch (e) {}`;

// L'état utile du Prototype, lu dans la page
const etat = (p) => p.evaluate((PH) => {
  const L = window.__logique && window.__logique(); if (!L || !L.state || !L.state.eco) return null;
  const S = L.state, E = window.AthenaEconomie, b = L.bareme(), t = L.maintenant(S), e = S.eco, ej = L.ecoJour(e, t), el = document.querySelector(PH);
  return { horloge: S.horloge || null, pref: S.horlogePref || null, depart: S.depart || null, jour: S.jour, heure: S.heure, avance: S.avance || 0, t, now: Date.now(), journee: E.journeeDe(b, t),
    xp: e.xp, bois: e.bois, or: e.or, coffre: e.coffre, sac: e.sac, batiments: e.batiments, sentier: { saison: e.sentier.saison, palier: e.sentier.palier },
    saisonJours: Math.round((new Date(E.journeeDe(b, t) + 'T12:00:00') - new Date(e.sentier.debut + 'T12:00:00')) / 864e5), mont: E.paliers(b, ej.jour, e.clesDefinies),
    feu: Math.round(E.feuA(b, e.feu, t).pts), chantiers: e.chantiers.map((c) => Math.round((c.fin - t) / 1000)), parcours: (e.parcours || []).map((x) => ({ id: x.id, statut: x.statut, prochain: x.prochain, reste: Math.round((x.prochain - t) / 1000) })),
    rentres: (e.rentres || []).map((x) => x.id), ecoJour: e.jour.id, hierId: e.hier ? e.hier.id : null, jourQuetes: e.jour.quetes || 0, hierQuetes: e.hier ? e.hier.quetes || 0 : null,
    hierS: S.hier ? { non: (S.hier.nonValidees || []).map((q) => q.id), faites: S.hier.faites || [] } : null, offres: [...document.querySelectorAll('[data-feuille-eco="matin"] [data-carte^="hier-"]')].map((x) => x.getAttribute('data-carte').slice(5)), fe: S.fe ? S.fe.k : null, carte: S.carte ? S.carte.kt : null, toast: S.toast ? S.toast.k : null,
    retourMode: !!S.retourMode, voix: S.voix ? S.voix.k : null, ecran: S.ecran, hz: !!L.hz, moment: el ? el.getAttribute('data-moment') : null,
    texte: el ? el.innerText.replace(/\s+/g, ' ') : '', cal: L.cal(), aujourdhui: L.aujourdhui(), jourAgenda: L.jourAgenda(), syncs: window.__syncs, miroirs: window.__miroirs.length };
}, PH);
const miroir = (p) => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('athena-mobile', 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('etat')) r.result.createObjectStore('etat'); }; r.onerror = () => res(null); r.onsuccess = () => { const db = r.result; try { const g = db.transaction('etat').objectStore('etat').get(1); g.onsuccess = () => { db.close(); res(g.result || null); }; g.onerror = () => { db.close(); res(null); }; } catch (e) { db.close(); res(null); } }; }));
const attendreMiroir = async (p, f, ms) => { let m = null; for (let i = 0; i < (ms || 8000) / 200; i++) { m = await miroir(p); if (m && f(m)) break; await p.waitForTimeout(200); } return m; };
const ecrireMiroir = (p, v) => p.evaluate((v) => new Promise((res) => { const r = indexedDB.open('athena-mobile', 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('etat')) r.result.createObjectStore('etat'); }; r.onsuccess = () => { const db = r.result, t = db.transaction('etat', 'readwrite'); t.objectStore('etat').put(v, 1); t.oncomplete = () => { db.close(); res(true); }; t.onerror = () => { db.close(); res(false); }; }; r.onerror = () => res(false); }), v);
const attendre = async (p, f, ms) => { let s = null; for (let i = 0; i < (ms || 10000) / 250; i++) { s = await etat(p); if (s && f(s)) break; await p.waitForTimeout(250); } return s; };

// La page passe en arrière-plan / revient au premier plan (le téléphone éteint puis rallumé)
const cacher = (p) => p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => 'hidden' }); document.dispatchEvent(new Event('visibilitychange')); });
const montrer = (p) => p.evaluate(() => { delete document.hidden; delete document.visibilityState; document.dispatchEvent(new Event('visibilitychange')); });
// Avance l'heure de la page jusqu'à t (heure locale), page cachée puis rendue visible (une nuit, des jours d'absence)
const nuitJusqua = async (p, t) => { await cacher(p); const n = await p.evaluate(() => Date.now()); await p.clock.fastForward(Math.max(0, t - n)); await p.waitForTimeout(300); const n2 = await p.evaluate(() => Date.now()); await montrer(p); await p.waitForTimeout(1500); return [new Date(n).toISOString(), new Date(n2).toISOString()]; };

// Le Prototype chargé, sa scène montée (window.__scene, posé par l'espion de _commun.js) et la logique espionnée
const pret = async (p) => {
  await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
  await p.waitForFunction(() => !!window.__scene, null, { timeout: 30000 }).catch(() => {});
  await p.waitForFunction(() => window.AthenaMobile && window.AthenaMobile.__esp && window.__logique && window.__logique() && window.__logique().__esp, null, { timeout: 10000 }).catch(() => {});
  await p.waitForTimeout(1500);
};
// Une page neuve, l'heure de la page posée à `heure` (horloge de Playwright, qui suit ensuite son cours) ; puis rouvrir(p, adresse) dans le même contexte
const page = async (b, chemin, heure, o) => {
  o = Object.assign({ init: '' }, o);
  const avant = o.avant;
  // (sw : les CDN routés sur le contexte, pour que le service worker, qui met la coquille et les CDN en cache, passe aussi par les copies locales)
  const p = await ouvrir(b, chemin, Object.assign({ sw: true }, o, { delai: 0, init: LOGIQUE + o.init, avant: async (q) => { await q.clock.install({ time: heure }); await q.context().route(/\/favicon\.ico$/, (r) => r.fulfill({ status: 204, body: '' })); if (avant) await avant(q); } }));
  p.setDefaultTimeout(20000);
  await pret(p);
  return p;
};
// (une adresse qui ne change que par son fragment ne recharge pas la page : on recharge alors ; le rendu logiciel des tests rend une navigation lente, jusqu'à 15 s)
const rouvrir = async (p, chemin) => { const sans = (u) => u.split('#')[0], meme = sans(p.url()) === sans(URL + chemin); await p.goto(URL + chemin, { waitUntil: 'load', timeout: 60000 }); if (meme) await p.reload({ waitUntil: 'load', timeout: 60000 }); await pret(p); };
const clic = (p, sel) => p.click(sel).then(() => true, () => false);
// Le camp en image fixe (« Forcer l'image fixe » du panneau) pour les voyages dans le temps : le rendu logiciel de la scène (SwiftShader) peut prendre
// plusieurs secondes par image le soir (bilan du soir, lumières), et les gestes du test attendent alors une image qui ne vient pas ; le décor
// (data-moment) suit l'heure de la même façon, la scène a déjà été vue au 2a
const fixe = async (p) => { await p.evaluate(() => window.__logique().setState({ forcerFixe: true })); await p.waitForTimeout(600); };
// Journal › Carnet par l'interface (sans fragment : l'app installée n'en a pas) ; la carte « Suivre l'heure du téléphone »
// (ce que l'app a ouvert d'elle-même se referme d'abord : le bilan du soir après 19 h, le résumé du matin)
const ouvrirCarnet = async (p) => { await libre(p); const a = await clic(p, '[data-el="hud_journal"]'); await p.waitForTimeout(500); const c = await clic(p, 'button[role="tab"]:has-text("' + TX('jn.tab.carnet') + '")'); await p.waitForTimeout(600); if (!a || !c) console.log('   (Carnet : journal ' + a + ', onglet ' + c + ', état ' + JSON.stringify(await p.evaluate(() => { const S = window.__logique().state; return { sheet: S.sheet, fe: S.fe && S.fe.k, carte: S.carte && S.carte.kt, jn: !!S.jn, bilan: !!S.bilan, sen: !!S.sen, nouvCarte: !!S.nouvCarte, proj: !!S.proj }; })) + ')'); };
const fermerJournal = async (p) => { await clic(p, 'button[aria-label="' + TX('jn.retour') + '"]'); await p.waitForTimeout(500); };
// La feuille ouverte (le résumé du matin) refermée par son bouton « Fermer », s'il y en a une ; libre(p) : la feuille du jeu aussi (Échap)
const fermerFeuille = async (p) => { if (await p.$('[data-feuille-eco]')) { await clic(p, '[data-feuille-eco] button[aria-label="' + TX('commun.fermer') + '"]'); await p.waitForTimeout(500); } };
const libre = async (p) => { await fermerFeuille(p); if (await p.evaluate(() => { const S = window.__logique().state; return !!(S.sheet || S.optsId || S.sen || S.bilan); })) { await p.keyboard.press('Escape'); await p.waitForTimeout(400); } };
const carte = (p) => p.evaluate((sel) => { const c = document.querySelector(sel); if (!c) return null; const sw = c.querySelector('button[role="switch"]'); const petit = [...c.querySelectorAll('span')].filter((s) => s.childElementCount === 0 && s.textContent.trim()).map((s) => parseFloat(getComputedStyle(s).fontSize)).filter((x) => x < 13);
  return { texte: c.textContent.replace(/\s+/g, ' ').trim(), on: sw ? sw.getAttribute('aria-checked') : null, h: sw ? sw.offsetHeight : 0, swT: sw ? sw.textContent.replace(/\s+/g, ' ').trim() : '', statut: [...c.querySelectorAll('[role="status"]')].map((x) => x.textContent.trim()), petit, deborde: c.scrollWidth > c.clientWidth + 1, ordre: [...document.querySelectorAll('[data-el="telephone"] > [data-el]')].map((x) => x.getAttribute('data-el')) }; }, CARTE);
const lireTelechargement = async (dl) => { if (!dl) return { nom: '', texte: '' }; const f = await dl.path().catch(() => null); return { nom: dl.suggestedFilename(), texte: f ? fs.readFileSync(f, 'utf8') : '' }; };
const telecharger = (p, sel) => Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), clic(p, sel)]).then(([d]) => lireTelechargement(d));
const egal = (a, b) => JSON.stringify(a) === JSON.stringify(b);
const clicSim = (p, t) => p.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t)); if (b) b.click(); return !!b; }, t);
const clic1230 = (p) => p.locator('#reglages button').filter({ hasText: /^\s*12:30\s*$/ }).first().click().then(() => true, () => false);
const validerUne = (p) => p.evaluate(async () => { const L = window.__logique(), q = L.tri(L.state.quetes).find((z) => !z.fait); if (!q) return null; await L.valider(q.id, 200, 500); return L.state.quetes.some((z) => z.id === q.id && z.fait) ? q.id : null; });

(async () => {
  // 0 · sans navigateur : les textes du brief, aucun mot interdit, l'entrée des changements
  const ATTENDUS = { 'mob.horloge.t': 'Suivre l’heure du téléphone', 'mob.horloge.d': 'Le camp vit à ton heure : le matin, le soir, les retours d’expédition.', 'mob.horloge.demo': 'Heure de démonstration' };
  const faux = Object.keys(ATTENDUS).filter((k) => TX(k) !== ATTENDUS[k]);
  ok('0 textes mob.horloge.t, .d, .demo : les valeurs du brief (apostrophes typographiques du projet)', faux.length === 0, faux.map((k) => k + ' = ' + JSON.stringify(TX(k))).join(' | '));
  ok('0 aucun mot de V.MOTS_INTERDITS dans les textes mob.horloge.*', Object.keys(ATTENDUS).every((k) => interditsDans(TX(k) || '').length === 0), '');
  // (la date la plus récente : l'entrée du 19/10 passe encore devant à l'exécution, par un unshift que la tâche 9 retire)
  const ch = (V.CHANGEMENTS || []).find((x) => /heure du téléphone/i.test(x[1])), cle = (d) => String(d).split('/').reverse().join('');
  ok('0 V.CHANGEMENTS : une entrée dit « l’heure du téléphone », à la date la plus récente, sans mot interdit', !!ch && V.CHANGEMENTS.every((x) => cle(x[0]) <= cle(ch[0])) && interditsDans(ch[1]).length === 0, ch ? ch[0] + ' · ' + ch[1].slice(0, 120) : 'absente');
  const versions = ['Accueil.dc.html', 'DA.dc.html', 'Decisions.dc.html', 'Ecrans.dc.html', 'Mecaniques.dc.html', 'Mobile-test.dc.html', 'Prototype.dc.html', 'outils/economie-test.html'].map((f) => [f, (lire(f).match(/athena-v1\.js\?v=(\d+)/g) || []).join(',')]);
  /* 21/10 · la tâche 10 a passé athena-v1.js à v=55 ; les tâches suivantes l'augmentent encore : une seule version (55 ou plus) partout, la même dans le précache */
  const vA = (versions[0][1].match(/v=(\d+)/) || [])[1] || '', vAttendue = 'athena-v1.js?v=' + vA;
  ok('0 athena-v1.js?v=' + vA + ' (55 ou plus) dans toutes les pages qui le chargent (hors Incursions) et dans le précache', +vA >= 55 && versions.every(([, v]) => v && v.split(',').every((x) => x === vAttendue)) && lire('sw-precache.js').includes(vAttendue), versions.map((x) => x.join(' ')).join(' | '));

  // le Chromium complet en mode sans fenêtre (channel 'chromium') : la coquille sans fenêtre de Playwright refuse la permission des notifications,
  // et le miroir n'est écrit que quand une option des notifications est allumée (sans le trafic de fond : mises à jour de composants, services Google)
  const b = await lancer({ channel: 'chromium', args: ARGS.concat(['--disable-background-networking', '--disable-component-update']) });
  const erreurs = [];
  const TEL = local(2026, 10, 21, 19, 30);

  // 1 · (d) dans le hub : un fragment de démonstration → horloge de démonstration, l'interrupteur éteint, « Heure de démonstration »
  let p = await page(b, 'Prototype.dc.html#ecran=camp&heure=10.25&nouv=tout', TEL);
  let s = await etat(p);
  ok('1d #ecran=camp&heure=10.25&nouv=tout (sans source=pwa) : horloge de démonstration (S.horloge demo, heure 10,25, la journée de V.DEMO.date)', !!s && s.horloge === 'demo' && s.heure === 10.25 && s.journee === V.DEMO.date && s.jourAgenda === V.DEMO.date, JSON.stringify(s && { horloge: s.horloge, heure: s.heure, journee: s.journee, jourAgenda: s.jourAgenda }));
  await ouvrirCarnet(p);
  let c = await carte(p);
  ok('1d Carnet › Téléphone : « Suivre l’heure du téléphone » (role=switch, ≥ 44 px) éteint, « Heure de démonstration » dit l’horloge suivie', !!c && c.on === 'false' && c.h >= 44 && c.swT.includes(TX('mob.horloge.t')) && c.texte.includes(TX('mob.horloge.d')) && c.statut.includes(TX('mob.horloge.demo')), JSON.stringify(c));
  ok('1d la carte vient après l’installation et avant les notifications et l’agenda ; aucun texte sous 13 px, rien ne déborde', !!c && c.ordre.indexOf('horloge') >= 0 && c.ordre.indexOf('horloge') < c.ordre.indexOf('notifs') && c.ordre.indexOf('notifs') < c.ordre.indexOf('agenda') && c.petit.length === 0 && !c.deborde, JSON.stringify(c && { ordre: c.ordre, petit: c.petit, deborde: c.deborde }));
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1#ecran=camp&nouv=tout');
  s = await etat(p);
  ok('1d ?source=pwa avec un fragment de démonstration : l’horloge de démonstration garde la main', !!s && s.horloge === 'demo' && s.journee === V.DEMO.date, JSON.stringify(s && { horloge: s.horloge, journee: s.journee }));
  await rouvrir(p, 'Prototype.dc.html');
  s = await etat(p);
  ok('1d dans le navigateur (ni installée, ni fragment), une sauvegarde en démonstration reste en démonstration', !!s && s.horloge === 'demo' && s.journee === V.DEMO.date && !s.hz, JSON.stringify(s && { horloge: s.horloge, journee: s.journee, hz: s.hz }));
  erreurs.push(...p.errs.map((e) => '1d ' + e)); await p.context().close();

  // 2 · (a)(f) l'app installée rouverte sans fragment, le 21/10/2026 à 19 h 30 : le mode téléphone s'allume, le décor est au soir, rien ne se perd
  p = await page(b, 'Prototype.dc.html#ecran=camp&nouv=tout&fait=3&palier=4&chantier=auberge&expedition=route', TEL, { permissions: ['notifications'], init: SANS_PARTAGE });
  const avant = await etat(p);
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1');
  s = await attendre(p, (x) => x.horloge === 'telephone');
  const h0 = await p.evaluate(() => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; });
  ok('2a ?source=pwa sans fragment : S.horloge = telephone, S.heure ≈ 19,5 (l’heure locale), maintenant(S) = l’heure de l’appareil', !!s && s.horloge === 'telephone' && Math.abs(s.heure - 19.5) < 0.1 && Math.abs(s.heure - h0) < 0.02 && Math.abs(s.t - s.now) < 1000, JSON.stringify(s && { horloge: s.horloge, heure: s.heure, h0, t: s.t, now: s.now }));
  ok('2a le décor est au soir : data-moment = ' + momentDe(19.5) + ' (V.JEU.moments : coucher ' + V.JEU.moments.coucher + ' h, nuit ' + V.JEU.moments.nuit + ' h)', !!s && ['coucher', 'nuit'].includes(s.moment) && s.moment === momentDe(s.heure), String(s && s.moment));
  ok('2a S.depart = 2026-10-21 (journée 1 le 21/10), la journée du jeu et le jour de l’agenda = le 21/10', !!s && s.depart === '2026-10-21' && s.jour === avant.jour && s.journee === '2026-10-21' && s.jourAgenda === '2026-10-21' && s.ecoJour === '2026-10-21', JSON.stringify(s && { depart: s.depart, jour: s.jour, journee: s.journee, jourAgenda: s.jourAgenda, ecoJour: s.ecoJour }));
  ok('2a aujourdhui(S) et cal() suivent la date réelle : le 21 octobre 2026 (pas V.DEMO.date)', !!s && iso(s.aujourdhui) === '2026-10-21' && s.cal.j === 21 && s.cal.m === 10 && s.cal.y === 2026, JSON.stringify(s && { aujourdhui: iso(s.aujourdhui), cal: { j: s.cal.j, m: s.cal.m, y: s.cal.y } }));
  const PROG = ['xp', 'bois', 'or', 'coffre', 'sac', 'batiments', 'sentier', 'saisonJours', 'mont'];
  const diff = s ? PROG.filter((k) => !egal(avant[k], s[k])) : PROG;
  ok('2f la progression gardée à la première activation : XP, bois, or, coffre, sac, bâtiments, saison et palier du Sentier, jours de la saison, paliers du Mont identiques', !!avant && !!s && diff.length === 0 && avant.xp > 0 && avant.sentier.palier === 4, diff.map((k) => k + ' ' + JSON.stringify(avant[k]) + ' → ' + JSON.stringify(s[k])).join(' | ') || JSON.stringify({ xp: avant.xp, bois: avant.bois, or: avant.or, palier: avant.sentier.palier, mont: avant.mont }));
  const restes = (x) => ({ feu: x.feu, chantiers: x.chantiers, parcours: x.parcours.map((r) => r.reste) });
  ok('2f les dates de l’économie recalées du même écart : le feu, le chantier et le parcours en route gardent ce qu’il leur reste (à 20 s près)', !!s && Math.abs(avant.feu - s.feu) <= 1 && avant.chantiers.length === 1 && s.chantiers.length === 1 && Math.abs(avant.chantiers[0] - s.chantiers[0]) <= 20 && avant.parcours.length === 1 && s.parcours.length === 1 && s.parcours[0].statut === 'route' && Math.abs(avant.parcours[0].reste - s.parcours[0].reste) <= 20, JSON.stringify({ avant: restes(avant), apres: s && restes(s) }));
  await fixe(p);
  await ouvrirCarnet(p);
  c = await carte(p);
  ok('2a Carnet › Téléphone : « Suivre l’heure du téléphone » aria-checked="true", sans « Heure de démonstration »', !!c && c.on === 'true' && c.h >= 44 && !c.statut.includes(TX('mob.horloge.demo')), JSON.stringify(c));
  // l'agenda du téléphone : l'export .ics commence le 21/10
  const EXP = '[data-el="telephone"] [data-el="agenda"] button:has-text("' + TX('mob.agenda.export') + '")';
  const d2 = await telecharger(p, EXP);
  const dt = lignes(d2.texte).filter((l) => l.startsWith('DTSTART'));
  ok('2a l’export .ics en mode téléphone le 21/10 commence le 21/10 (DTSTART:20261021T…)', d2.nom === 'quetes-athena.ics' && dt.length > 0 && dt.every((l) => l.startsWith('DTSTART:20261021T')), d2.nom + ' · ' + dt.join(' | '));

  // 3 · le miroir des notifications (exigence 1) : un compagnon sur le chemin du retour, deux sauvegardes à 2 min d'intervalle → le même retourA
  await clic(p, '[data-el="telephone"] [data-el="notifs"] button[role="switch"]:has-text("Prévenir quand les compagnons rentrent")'); await p.waitForTimeout(800);
  await fermerJournal(p);
  // le compagnon fait deux pas (chaque chemin réussi : le hasard du jeu fixé), puis « Rentrer au camp » : son retour dure deux pas (V.JEU.eco)
  const idP = s && s.parcours[0] ? s.parcours[0].id : null, PR = V.JEU.eco.expeditions.parcours;
  await p.evaluate(() => { window.__logique()._alea = () => 0.3; });
  await p.clock.fastForward(Math.round((PR.minutes[1] * 1.7) * 60000)); await p.waitForTimeout(1500);
  const sPas = await etat(p), pas = sPas && sPas.parcours[0] ? await p.evaluate((id) => (window.__logique().state.eco.parcours.find((x) => x.id === id) || {}).etape, idP) : null;
  await p.evaluate((id) => window.__logique().parcoursAction('rentrer', id), idP);
  const m1 = await attendreMiroir(p, (m) => typeof m.retourA === 'number');
  const s3 = await etat(p), run = s3 && s3.parcours.find((x) => x.id === idP);
  const n1 = await p.evaluate(() => window.__miroirs.length);
  const sv1 = await p.evaluate(() => JSON.parse(localStorage.getItem('athena-proto-v1') || '{}').heure);
  const q1 = await p.evaluate(() => (window.__miroirs.find((x) => typeof x.retourA === 'number') || {}).quand || 0);
  await p.clock.fastForward(2 * 60000);
  // (la sauvegarde part 400 ms après le rendu que l'heure nouvelle provoque : relue jusqu'à ce qu'elle soit là, 8 s au plus)
  await p.waitForFunction((q) => window.__miroirs.some((x) => x.quand >= q + 2 * 60000 - 2000), q1, { timeout: 8000 }).catch(() => {});
  const m2 = await attendreMiroir(p, () => true);
  const appels = await p.evaluate(() => window.__miroirs.filter((x) => typeof x.retourA === 'number'));
  const sv2 = await p.evaluate(() => JSON.parse(localStorage.getItem('athena-proto-v1') || '{}').heure);
  const a1 = appels[0], a2 = appels[appels.length - 1];
  ok('3 deux pas faits puis « Rentrer au camp » en mode téléphone : retourA = l’heure du retour arrondie à la minute (parcours.prochain), retourCle sur cette heure', pas === 2 && !!m1 && !!run && run.statut === 'retour' && run.prochain - s3.now > 2.5 * 60000 && m1.retourA === Math.ceil(run.prochain / 6e4) * 6e4 && m1.retourA % 6e4 === 0 && !!a1 && String(a1.retourCle).includes(String(m1.retourA)), JSON.stringify({ pas, m1: m1 && { retourA: m1.retourA, retourCle: m1.retourCle }, prochain: run && run.prochain, reste: run && s3 && Math.round((run.prochain - s3.now) / 1000) }));
  ok('3 deux sauvegardes à 2 min d’intervalle (l’heure du jeu a suivi) → le même retourA et la même retourCle (le service worker n’annonce jamais deux fois le même retour)', !!m1 && !!m2 && m2.retourA === m1.retourA && m2.retourCle === m1.retourCle && appels.length >= 2 && a2.quand - a1.quand >= 2 * 60000 - 2000 && a2.retourA === a1.retourA && a2.retourCle === a1.retourCle && typeof sv1 === 'number' && typeof sv2 === 'number' && sv2 > sv1, JSON.stringify({ m1: m1 && m1.retourA, m2: m2 && m2.retourA, appels: appels.map((x) => [x.quand, x.retourA, x.retourCle]), sauvegardes: [sv1, sv2], n1 }));
  const matinAvant = m2 ? { a: m2.matinA, cle: m2.matinCle } : null;
  ok('3 matinA en mode téléphone : le début de la journée de jeu suivante (le 22/10 à ' + V.JEU.eco.journee.bascule + ' h), clé = la journée du 21/10', !!matinAvant && matinAvant.a === local(2026, 10, 22, V.JEU.eco.journee.bascule) && matinAvant.cle === '2026-10-21', JSON.stringify(matinAvant && { matinA: new Date(matinAvant.a).toString(), cle: matinAvant.cle }));

  // 4 · (b)(g) la nuit : page cachée, plus de minuterie de 30 s ; le lendemain 08:05, retour au premier plan → S.jour + 1, le résumé du matin s'ouvre
  const j0 = (await etat(p)).jour;
  await cacher(p);
  const sCache = await etat(p);
  await p.clock.fastForward(65000); await p.waitForTimeout(400);
  const sCache2 = await etat(p);
  ok('4g page cachée : plus de minuterie de 30 s (aucune vérification de l’heure pendant 65 s)', !!sCache && !sCache.hz && !!sCache2 && sCache2.syncs === sCache.syncs, JSON.stringify({ hz: sCache && sCache.hz, syncs: [sCache && sCache.syncs, sCache2 && sCache2.syncs] }));
  const nAvant = sCache2 ? sCache2.syncs : 0;
  await p.clock.fastForward(Math.max(0, local(2026, 10, 22, 8, 5) - await p.evaluate(() => Date.now()))); await p.waitForTimeout(300);
  await montrer(p);
  s = await attendre(p, (x) => x.fe === 'matin', 8000);
  ok('4b le lendemain 08:05, retour au premier plan → S.jour + 1, S.heure ≈ 8,08, le résumé du matin s’ouvre (« ' + TX('eco.matin.t') + ' »)', !!s && s.jour === j0 + 1 && Math.abs(s.heure - (8 + 5 / 60)) < 0.05 && s.fe === 'matin' && s.texte.includes(TX('eco.matin.t')) && s.syncs > nAvant, JSON.stringify(s && { jour: s.jour, j0, heure: s.heure, fe: s.fe, syncs: s.syncs }));
  ok('4b exigence 2 : matinA du miroir (posé la veille) est passé, et le résumé ouvert est celui de sa clé (eco.hier.id = ' + (matinAvant && matinAvant.cle) + ')', !!s && !!matinAvant && s.now >= matinAvant.a && s.hierId === matinAvant.cle && s.ecoJour === '2026-10-22', JSON.stringify(s && { now: new Date(s.now).toString(), hier: s.hierId, ecoJour: s.ecoJour }));
  const m4 = await attendreMiroir(p, (m) => m.matinCle === '2026-10-22');
  ok('4b le miroir passe au lendemain : matinCle = 2026-10-22, matinA = le 23/10 à ' + V.JEU.eco.journee.bascule + ' h', !!m4 && m4.matinCle === '2026-10-22' && m4.matinA === local(2026, 10, 23, V.JEU.eco.journee.bascule), JSON.stringify(m4 && { matinA: m4.matinA && new Date(m4.matinA).toString(), cle: m4.matinCle }));
  ok('4b exigence 3 (dans l’app) : l’horloge rattrapée a fait avancer le parcours, le compagnon est rentré', !!s && !s.parcours.some((x) => x.id === idP) && s.rentres.includes(idP), JSON.stringify(s && { parcours: s.parcours, rentres: s.rentres }));
  ok('4g au premier plan : la minuterie de 30 s reprend (une vérification de plus après 31 s)', await (async () => { const a = await etat(p); await p.clock.fastForward(31000); await p.waitForTimeout(400); const z = await etat(p); return !!a && !!z && a.hz && z.syncs > a.syncs; })(), '');

  // 5 · (c) trois jours plus tard : S.jour + 3 au plus (V.JEU.retourJours = ' + V.JEU.retourJours + '), aucun reproche ; dix jours : le retour sans reproche
  await fermerFeuille(p);
  // (une quête validée le 22/10 : le résumé du matin après l'absence doit être celui de cette journée-là, la dernière jouée)
  const qv = await validerUne(p); await p.waitForTimeout(800); await libre(p);
  const j1 = (await etat(p)).jour;
  await nuitJusqua(p, local(2026, 10, 25, 8, 5));
  s = await attendre(p, (x) => x.jour > j1, 8000);
  ok('5c trois jours plus tard → S.jour + ' + Math.min(3, V.JEU.retourJours) + ' (au plus V.JEU.retourJours = ' + V.JEU.retourJours + '), la journée du 25/10, aucun mot interdit à l’écran', !!s && s.jour - j1 === Math.min(3, V.JEU.retourJours) && s.jour - j1 <= V.JEU.retourJours && s.journee === '2026-10-25' && interditsDans(s.texte).length === 0, JSON.stringify(s && { jour: s.jour, j1, journee: s.journee, interdits: interditsDans(s.texte) }));
  const sH = await attendre(p, (x) => x.fe === 'matin' && x.offres.length > 0, 6000);
  ok('5c rattrapage de 3 journées : le résumé du matin est celui de la dernière journée jouée (le 22/10) — la quête validée ce jour-là est dans « faites », ni dans « Pas validées hier » ni proposée après coup, et le compte de l’économie est le même', !!qv && !!sH && sH.hierId === '2026-10-22' && !!sH.hierS && sH.hierS.faites.includes(qv) && !sH.hierS.non.includes(qv) && sH.hierQuetes === sH.hierS.faites.length && !sH.offres.includes(qv) && sH.offres.length === sH.hierS.non.length, JSON.stringify(sH ? { qv, hierId: sH.hierId, hierQuetes: sH.hierQuetes, faites: sH.hierS && sH.hierS.faites, non: sH.hierS && sH.hierS.non, offres: sH.offres } : { qv }));
  await fermerFeuille(p);
  const j2 = (await etat(p)).jour;
  const nj = await nuitJusqua(p, local(2026, 11, 4, 9, 0));
  s = await attendre(p, (x) => x.jour > j2, 8000);
  if (!s || s.jour === j2) console.log('   (heure de la page avant et après l’absence : ' + nj.join(' → ') + ')');
  const voixRetour = TX('voix.retour', 'enfant');
  ok('5c dix jours d’absence → S.jour + ' + V.JEU.retourJours + ' (V.JEU.retourJours), puis le retour sans reproche (« ' + voixRetour + ' »), aucun mot interdit, aucun compte de jours', !!s && s.jour - j2 === V.JEU.retourJours && s.retourMode && s.voix === 'voix.retour' && s.texte.includes(voixRetour) && interditsDans(s.texte).length === 0 && !/\b\d+\s+jours?\b/i.test(s.texte), JSON.stringify(s && { jour: s.jour, j2, retourMode: s.retourMode, voix: s.voix, interdits: interditsDans(s.texte) }));
  ok('5c S.depart suit : S.jour = les journées depuis S.depart + 1, la journée du 04/11', !!s && s.journee === '2026-11-04' && Math.round((new Date(s.journee + 'T12:00:00') - new Date(s.depart + 'T12:00:00')) / 864e5) + 1 === s.jour, JSON.stringify(s && { depart: s.depart, jour: s.jour, journee: s.journee }));

  // 6 · (e) le panneau de démonstration (un réglage d'heure) éteint le mode : « Heure de démonstration » ; l'interrupteur le rallume
  await fermerFeuille(p);
  const s6 = await etat(p);
  const h1230 = await clic1230(p); await p.waitForTimeout(600);
  if (!h1230) console.log('   (le bouton 12:30 du panneau n’a pas répondu)');
  s = await etat(p);
  ok('6e « 12:30 » du panneau → S.horloge = demo (choisie), S.heure = 12,5, « Heure de démonstration » à l’écran, la même journée de jeu (pas de saut vers V.DEMO.date)', !!s && s.horloge === 'demo' && s.pref === 'demo' && s.heure === 12.5 && s.texte.includes(TX('mob.horloge.demo')) && s.journee === s6.journee && s.jour === s6.jour, JSON.stringify(s && { horloge: s.horloge, pref: s.pref, heure: s.heure, journee: s.journee, avant: s6 && s6.journee }));
  ok('6e en démonstration : plus de minuterie de 30 s', !!s && !s.hz, '');
  await ouvrirCarnet(p);
  c = await carte(p);
  ok('6e Carnet : l’interrupteur éteint, « Heure de démonstration »', !!c && c.on === 'false' && c.statut.includes(TX('mob.horloge.demo')), JSON.stringify(c));
  await clic(p, INTER); await p.waitForTimeout(800);
  c = await carte(p); s = await etat(p);
  const h6 = await p.evaluate(() => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; });
  ok('6e l’interrupteur le rallume : aria-checked="true", S.heure = l’heure de l’appareil, la progression intacte', !!c && c.on === 'true' && !!s && s.horloge === 'telephone' && Math.abs(s.heure - h6) < 0.02 && Math.abs(s.t - s.now) < 1000 && s.hz && s.xp === s6.xp && s.bois === s6.bois && s.or === s6.or && egal(s.sentier, s6.sentier), JSON.stringify(s && { on: c && c.on, horloge: s.horloge, heure: s.heure, h6, xp: [s6.xp, s.xp] }));
  // éteint à la main : l'app rouverte (même sans fragment, installée) garde l'horloge de démonstration ; rallumée : elle garde le téléphone
  await clic(p, INTER); await p.waitForTimeout(800);
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1'); await fixe(p);
  const r1 = await etat(p);
  await ouvrirCarnet(p); await clic(p, INTER); await p.waitForTimeout(800);
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1');
  const r2 = await etat(p);
  ok('6e le choix est gardé : éteint → l’app rouverte reste en démonstration ; rallumé → elle suit le téléphone', !!r1 && r1.horloge === 'demo' && r1.pref === 'demo' && !!r2 && r2.horloge === 'telephone' && r2.pref === 'telephone' && Math.abs(r2.t - r2.now) < 1000, JSON.stringify({ r1: r1 && [r1.horloge, r1.pref], r2: r2 && [r2.horloge, r2.pref] }));
  erreurs.push(...p.errs.map((e) => '2-6 ' + e)); await p.context().close();

  // 7 · l'agenda Google (Parent) en mode téléphone le 21/10 : « Voir les rendez-vous du jour » interroge le jour réel
  const ID = `window.AthenaMobileConfig = { googleClientId: 'x' };`;
  const GOOGLE = `window.google = { accounts: { oauth2: { initTokenClient: (c) => ({ requestAccessToken: () => setTimeout(() => c.callback({ access_token: 'jeton-essai', expires_in: 3600 }), 50) }) } } };`;
  const api = [];
  p = await page(b, 'Prototype.dc.html#ecran=camp&nouv=tout&profil=adulte', local(2026, 10, 21, 7, 45), { init: ID + GOOGLE, avant: (q) => q.route(/^https:\/\/(www\.googleapis\.com|accounts\.google\.com)\//, async (r) => {
    const rq = r.request(), CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, PUT, PATCH, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' };
    if (rq.method() === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS, body: '' });
    api.push({ m: rq.method(), u: rq.url() });
    if (new globalThis.URL(rq.url()).hostname === 'accounts.google.com') return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    return r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify({ items: [] }) });
  }) });
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1');
  s = await etat(p);
  await ouvrirCarnet(p);
  await clic(p, '[data-el="agenda"] button:has-text("' + TX('mob.agenda.relier') + '")'); await p.waitForTimeout(800);
  await clic(p, '[data-el="agenda"] button:has-text("' + TX('mob.agenda.jour') + '")');
  for (let i = 0; i < 40 && !api.some((a) => a.u.includes('timeMin')); i++) await p.waitForTimeout(250);
  const lj = api.find((a) => a.u.includes('timeMin')), q7 = lj ? new globalThis.URL(lj.u).searchParams : null;
  ok('7 Parent, mode téléphone le 21/10 à 7 h 45 : « Voir les rendez-vous du jour » interroge le 21/10 (timeMin/timeMax = minuit local du 21 et du 22)', !!s && s.horloge === 'telephone' && !!q7 && new Date(q7.get('timeMin')).getTime() === local(2026, 10, 21) && new Date(q7.get('timeMax')).getTime() === local(2026, 10, 22), JSON.stringify({ horloge: s && s.horloge, appel: lj ? lj.u.slice(0, 200) : 'aucun' }));
  erreurs.push(...p.errs.map((e) => '7 ' + e)); await p.context().close();

  // 7 · 360 × 640, Veillée d'origine, Parent, mouvement réduit : la carte tient, l'interrupteur ≥ 44 px, aucun texte sous 13 px
  p = await page(b, 'Prototype.dc.html#ecran=journal&tab=carnet&nouv=tout&da=origine&profil=adulte', TEL, { viewport: { width: 360, height: 640 }, contexte: { reducedMotion: 'reduce' } });
  c = await carte(p);
  ok('7 360 × 640, Veillée d’origine, Parent, mouvement réduit : la carte « Suivre l’heure du téléphone » tient (≥ 44 px, rien sous 13 px, rien ne déborde)', !!c && c.h >= 44 && c.petit.length === 0 && !c.deborde && c.swT.includes(TX('mob.horloge.t')), JSON.stringify(c && { h: c.h, petit: c.petit, deborde: c.deborde }));
  erreurs.push(...p.errs.map((e) => '7b ' + e)); await p.context().close();

  // 9 · la nuit, entre minuit et la bascule de la journée de jeu (V.JEU.eco.journee.bascule) : le 22/10 à 01:30, le mode téléphone quitté par
  // l'interrupteur, puis par « Avancer d'une heure » et « 12:30 » du panneau → l'horloge de démonstration reprend à l'heure réelle, dans la même journée
  // de jeu (le 21/10) : une quête validée compte dans cette journée, rien ne passe dans « hier », et l'interrupteur rallumé ne recale pas d'un jour
  p = await page(b, 'Prototype.dc.html#ecran=camp&nouv=tout&fait=3&palier=4&chantier=auberge', local(2026, 10, 22, 1, 30), { init: SANS_PARTAGE });
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1'); await fixe(p);
  const w0 = await attendre(p, (x) => x.horloge === 'telephone');
  ok('9 le 22/10 à 01:30, mode téléphone : la journée de jeu est encore le 21/10 (bascule à ' + V.JEU.eco.journee.bascule + ' h), S.heure ≈ 1,5, un chantier en cours', !!w0 && w0.journee === '2026-10-21' && w0.ecoJour === '2026-10-21' && Math.abs(w0.heure - 1.5) < 0.05 && w0.chantiers.length === 1, JSON.stringify(w0 && { journee: w0.journee, ecoJour: w0.ecoJour, heure: w0.heure, chantiers: w0.chantiers }));
  await ouvrirCarnet(p); await clic(p, INTER); await p.waitForTimeout(800);
  const w1 = await etat(p);
  ok('9 l’interrupteur éteint à 01:30 : maintenant(démo) = l’heure réelle (S.heure ≈ 1,5 pour le décor, S.avance = 24), la même journée de jeu (21/10) et le même S.jour', !!w0 && !!w1 && w1.horloge === 'demo' && Math.abs(w1.t - w1.now) < 1000 && w1.journee === '2026-10-21' && w1.ecoJour === '2026-10-21' && w1.jour === w0.jour && Math.abs(w1.heure - 1.5) < 0.05 && w1.avance === 24, JSON.stringify(w1 && { horloge: w1.horloge, t: new Date(w1.t).toISOString(), now: new Date(w1.now).toISOString(), journee: w1.journee, jour: [w0 && w0.jour, w1.jour], heure: w1.heure, avance: w1.avance }));
  await fermerJournal(p);
  const nq = await validerUne(p); await p.waitForTimeout(800);
  const w2 = await etat(p);
  ok('9 une quête validée en démonstration à 01:30 : elle compte dans la journée du 21/10 (eco.jour.quetes + 1), sans nouvelle journée (hier inchangé)', !!nq && !!w1 && !!w2 && w2.ecoJour === '2026-10-21' && w2.jourQuetes === w1.jourQuetes + 1 && w2.hierId === w1.hierId, JSON.stringify(w2 && { nq, ecoJour: w2.ecoJour, quetes: [w1 && w1.jourQuetes, w2.jourQuetes], hier: [w1 && w1.hierId, w2.hierId] }));
  await libre(p); await ouvrirCarnet(p); await clic(p, INTER); await p.waitForTimeout(800);
  const w3 = await etat(p), reste9 = w0 && w1 && w0.chantiers.length ? w0.chantiers[0] - (w1.now - w0.now) / 1000 : null;
  ok('9 l’interrupteur rallumé : aucun recalage d’un jour (le chantier garde ce qu’il lui restait à l’extinction, à 20 s près), la journée du 21/10, hier et jours de la saison inchangés', !!w3 && w3.horloge === 'telephone' && w3.chantiers.length === 1 && reste9 !== null && Math.abs(w3.chantiers[0] - reste9) <= 20 && w3.ecoJour === '2026-10-21' && w3.hierId === w1.hierId && w3.jour === w0.jour && w3.saisonJours === w0.saisonJours, JSON.stringify(w3 && { chantier: w3.chantiers, attendu: reste9, ecoJour: w3.ecoJour, hier: w3.hierId, saisonJours: [w0 && w0.saisonJours, w3.saisonJours] }));
  await fermerJournal(p);
  const av9 = await clicSim(p, 'Avancer d’une heure'); await p.waitForTimeout(800);
  const w4 = await etat(p);
  ok('9 « Avancer d’une heure » du panneau à 01:3x : l’heure réelle + 1 h (02:3x), la journée du 21/10, « Heure de démonstration »', av9 && !!w4 && w4.horloge === 'demo' && Math.abs(w4.t - w4.now - 36e5) < 30000 && w4.journee === '2026-10-21' && w4.jour === w0.jour && w4.texte.includes(TX('mob.horloge.demo')), JSON.stringify(w4 && { horloge: w4.horloge, ecart: Math.round((w4.t - w4.now) / 1000), journee: w4.journee, heure: w4.heure, avance: w4.avance }));
  await clic1230(p); await p.waitForTimeout(600);
  const w5 = await etat(p);
  ok('9 « 12:30 » ensuite : midi et demi de la journée de jeu (le 21/10, S.avance remis à 0), pas le 22/10', !!w5 && w5.heure === 12.5 && w5.avance === 0 && w5.journee === '2026-10-21' && w5.t === local(2026, 10, 21, 12, 30), JSON.stringify(w5 && { heure: w5.heure, avance: w5.avance, journee: w5.journee, t: new Date(w5.t).toISOString() }));
  erreurs.push(...p.errs.map((e) => '9 ' + e)); await p.context().close();

  // 10 · le changement d'heure (fuseau Europe/Paris, le 25/10 à 3 h → 2 h) : l'horloge de démonstration compte en heures de l'horloge murale, la
  // journée du calendrier (un jour = minuit local suivant, pas 24 h) ; S.depart pris avant le changement
  const utc = (mo, j, h, mi) => Date.UTC(2026, mo - 1, j, h, mi || 0);
  const PARIS = { init: SANS_PARTAGE, contexte: { timezoneId: 'Europe/Paris' } };
  p = await page(b, 'Prototype.dc.html#ecran=camp&nouv=tout', utc(10, 24, 17, 30), PARIS);   // le 24/10 à 19:30, heure d'été (UTC+2)
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1'); await fixe(p);
  const z0 = await attendre(p, (x) => x.horloge === 'telephone');
  await nuitJusqua(p, utc(10, 25, 11, 0));   // le 25/10 à 12:00, heure d'hiver (UTC+1)
  const z1 = await attendre(p, (x) => !!z0 && x.jour > z0.jour, 8000);
  await fermerFeuille(p);
  await clic1230(p); await p.waitForTimeout(600);
  const z2 = await etat(p);
  ok('10 Europe/Paris, le 25/10 (jour du changement d’heure) : « 12:30 » du panneau = 12:30 à Paris (11:30 UTC), la journée du 25/10', !!z1 && !!z2 && z2.horloge === 'demo' && z2.t === utc(10, 25, 11, 30) && z2.journee === '2026-10-25' && z2.ecoJour === '2026-10-25', JSON.stringify(z2 && { horloge: z2.horloge, depart: z2.depart, jour: z2.jour, t: new Date(z2.t).toISOString(), journee: z2.journee, ecoJour: z2.ecoJour }));
  await ouvrirCarnet(p); await clic(p, INTER); await p.waitForTimeout(800); await fermerJournal(p);
  await nuitJusqua(p, utc(10, 28, 3, 30));   // le 28/10 à 04:30 (UTC+1)
  const z3 = await attendre(p, (x) => x.horloge === 'telephone' && x.ecoJour === '2026-10-28', 8000);
  await fermerFeuille(p); await ouvrirCarnet(p); await clic(p, INTER); await p.waitForTimeout(800);
  const z4 = await etat(p);
  ok('10 Europe/Paris, le 28/10 à 04:30, l’interrupteur éteint : maintenant(démo) = l’heure réelle, la journée du 28/10 (pas le 27/10), S.heure ≈ 4,5, S.avance = 0', !!z3 && !!z4 && z4.horloge === 'demo' && Math.abs(z4.t - z4.now) < 1000 && z4.journee === '2026-10-28' && z4.ecoJour === '2026-10-28' && Math.abs(z4.heure - 4.5) < 0.05 && z4.avance === 0, JSON.stringify(z4 && { horloge: z4.horloge, depart: z4.depart, jour: z4.jour, t: new Date(z4.t).toISOString(), now: new Date(z4.now).toISOString(), journee: z4.journee, heure: z4.heure, avance: z4.avance }));
  erreurs.push(...p.errs.map((e) => '10 ' + e)); await p.context().close();
  await b.close();

  // 8 · exigence 3 : le service worker (Chromium complet) annonce le retour (periodicsync), l'app rouverte montre le compagnon rentré.
  // L'heure de la page part 2 h avant l'heure de la machine : le retour annoncé (heure de la page) est déjà passé pour le service worker (heure réelle) ;
  // la plage du miroir est ouverte à toute la journée pour que l'heure de la machine n'empêche pas l'annonce (la plage a ses contrôles dans mobile_notif.js)
  const b2 = await lancer({ channel: 'chromium', args: ARGS.concat(['--disable-background-networking', '--disable-component-update']) });
  const T0 = Math.floor((Date.now() - 2 * 3600e3) / 6e4) * 6e4;
  p = await page(b2, 'Prototype.dc.html#ecran=camp&nouv=tout&expedition=route', T0, { sw: true, permissions: ['notifications'] });
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1'); await fixe(p);
  s = await attendre(p, (x) => x.horloge === 'telephone');
  await ouvrirCarnet(p);
  await clic(p, '[data-el="telephone"] [data-el="notifs"] button[role="switch"]:has-text("Prévenir quand les compagnons rentrent")'); await p.waitForTimeout(800);
  await fermerJournal(p);
  const id8 = s && s.parcours[0] ? s.parcours[0].id : null;
  await p.evaluate((id) => window.__logique().parcoursAction('rentrer', id), id8);
  const m8 = await attendreMiroir(p, (m) => typeof m.retourA === 'number' && m.compagnons === true);
  const swPret = await p.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((f) => setTimeout(() => f(false), 20000))]));
  if (m8) await ecrireMiroir(p, Object.assign({}, m8, { heures: [0, 24] }));
  const cdp = await p.context().newCDPSession(p);
  const regs = [];
  cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => regs.push(...e.registrations));
  await cdp.send('ServiceWorker.enable');
  for (let i = 0; i < 20 && !regs.some((r) => !r.isDeleted && r.scopeURL.startsWith(URL)); i++) await p.waitForTimeout(250);
  const reg = regs.find((r) => !r.isDeleted && r.scopeURL.startsWith(URL));
  await cacher(p);
  if (reg) await cdp.send('ServiceWorker.dispatchPeriodicSyncEvent', { origin: URL.replace(/\/$/, ''), registrationId: reg.registrationId, tag: 'resume-matin' });
  let L8 = [];
  for (let i = 0; i < 20 && !L8.length; i++) { L8 = await p.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready, new Promise((f) => setTimeout(() => f(null), 5000))]); return r ? (await r.getNotifications()).map((n) => n.body) : []; }); if (!L8.length) await p.waitForTimeout(250); }
  const m8b = await attendreMiroir(p, (m) => !!m.montre && m.montre.retourA === (m8 && m8.retourA), 5000);
  ok('8 periodicsync : le service worker annonce le retour (« ' + TX('eco.exp.notif') + ' ») et le marque montré', !!m8 && swPret && !!reg && L8.includes(TX('eco.exp.notif')) && !!m8b && m8b.montre.retourA === m8.retourA, JSON.stringify({ retourA: m8 && m8.retourA, sw: swPret, reg: !!reg, notifs: L8, montre: m8b && m8b.montre }));
  // l'app rouverte après l'heure annoncée (l'heure de la page avance jusque-là) : l'horloge rattrapée fait rentrer le compagnon
  if (m8) await p.clock.fastForward(Math.max(0, m8.retourA + 60000 - await p.evaluate(() => Date.now())));
  await rouvrir(p, 'Prototype.dc.html?source=pwa&reglages=1');
  s = await attendre(p, (x) => x.rentres.includes(id8), 10000);
  ok('8 l’app rouverte après l’annonce : le compagnon est rentré (parcours terminé, sa carte ou le mot du retour à l’écran)', !!s && !s.parcours.some((x) => x.id === id8) && s.rentres.includes(id8) && (s.carte === 'eco.par.rentre.t' || s.carte === 'eco.par.creature.t' || s.toast === 'eco.exp.notif'), JSON.stringify(s && { parcours: s.parcours, rentres: s.rentres, carte: s.carte, toast: s.toast }));
  // la même sauvegarde ouverte dans le navigateur (sans source=pwa, sans fragment) : un seul jeu, une seule horloge, elle suit toujours le téléphone
  await rouvrir(p, 'Prototype.dc.html');
  s = await etat(p);
  ok('8 la sauvegarde qui suit le téléphone, ouverte dans le navigateur (ni source=pwa ni fragment) : toujours l’heure du téléphone, sans recalage', !!s && s.horloge === 'telephone' && !s.pref && Math.abs(s.t - s.now) < 1000 && s.rentres.includes(id8), JSON.stringify(s && { horloge: s.horloge, pref: s.pref, rentres: s.rentres }));
  erreurs.push(...p.errs.map((e) => '8 ' + e)); await p.context().close();
  await b2.close();

  ok('aucune erreur de page (pageerror) ni de console', erreurs.length === 0, erreurs.join(' | '));
  process.exitCode = bilan('mobile_horloge') ? 1 : 0;
})().catch((e) => { console.error(e); bilan('mobile_horloge'); process.exit(1); });
