// Mobile · notifications sur le téléphone (tâche 4) : la carte « Prévenir sur le téléphone » du Carnet (texte, exemple dessiné, deux interrupteurs
// éteints, « Essayer une notification »), la permission demandée seulement sur le geste (et seulement dans commun/athena-mobile.js), le retour des
// compagnons et le résumé du matin (dans la plage 8 h - 21 h, rien hors plage), le miroir IndexedDB lu par le service worker, son « periodicsync »
// (déclenché par le protocole de débogage), le message du service worker qui ramène au camp, le refus (« Plus tard… »), mouvement réduit = sans vibration ;
// les textes mob.* (valeurs, mots interdits) et leurs copies dans sw.js ; la règle 12 du vérificateur sur une copie de demo/ qu'on abîme.
// Le Chromium complet en mode sans fenêtre (channel 'chromium') : la coquille sans fenêtre de Playwright refuse toute notification.
// Lancer : bash test/_serveur.sh && node test/mobile_notif.js
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';   // les requêtes du service worker passent par le routage du contexte (CDN en local)
const fs = require('fs');
const os = require('os');
const path = require('path');
const vm = require('vm');
const { spawnSync } = require('child_process');
const { URL, ARGS, lancer, ouvrir, ok, bilan } = require('./_commun.js');
process.chdir(__dirname);

const RACINE = path.join(__dirname, '..');
const DEMO = path.join(RACINE, 'demo');
const lire = (f) => { try { return fs.readFileSync(path.join(DEMO, f), 'utf8'); } catch (e) { return ''; } };
const PH = '[data-screen-label="Prototype V1"]';
const CARTE = '[data-el="telephone"] [data-el="notifs"]';
const SW_EXP = CARTE + ' button[role="switch"]:has-text("Prévenir quand les compagnons rentrent")';
const SW_MATIN = CARTE + ' button[role="switch"]:has-text("Le résumé du matin")';
const ESSAI = CARTE + ' button:has-text("Essayer une notification")';

// V.TEXTES et V.MOBILE lus comme le vérificateur : athena-v1.js dans une VM sans navigateur
const V = (() => {
  const W = { navigator: {}, document: { currentScript: null, addEventListener() {}, dispatchEvent() {}, querySelectorAll() { return []; }, createElement() { return { style: {} }; }, head: { appendChild() {} } }, setTimeout() {}, matchMedia: null, CustomEvent: function () {} };
  W.window = W; vm.runInContext(lire('athena-v1.js'), vm.createContext(W)); return W.ATHENA_V1;
})();
const TX = (k) => { const x = V.TEXTES[k]; return x ? (typeof x[1] === 'object' ? x[1].adulte : x[1]) : undefined; };

// Espion posé avant la page : chaque registration.showNotification de la page est noté dans window.__appels (titre, options, puis « montree » quand
// la promesse aboutit). Le Chromium sans fenêtre perd parfois une notification pourtant montrée (getNotifications() vide, environ 1 fois sur 20,
// mesuré sur 20 essais de suite) : l'appel abouti noté ici en témoigne, et le bouton « Essayer » (un geste qu'on peut refaire) est alors repris une fois.
const ESPION_NOTIF = `(() => { const P = window.ServiceWorkerRegistration && ServiceWorkerRegistration.prototype; if (!P || !P.showNotification) return; const o = P.showNotification; window.__appels = [];
  P.showNotification = function (titre, x) { x = x || {}; const a = { title: titre, body: x.body || '', tag: x.tag || '', icon: x.icon || '', badge: x.badge || '', renotify: x.renotify, vibrate: Array.from(x.vibrate || []), actions: (x.actions || []).map((y) => y.action + ':' + y.title), data: x.data, etat: 'en cours' };
    window.__appels.push(a); const p = o.call(this, titre, x); p.then(() => { a.etat = 'montree'; }, (e) => { a.etat = 'refus ' + e.message; }); return p; }; })();`;

// L'heure de l'appareil décalée pour la page (Date.now seulement) quand sessionStorage.__decalageMs est posé : « l'app rouverte plus tard »,
// l'horloge du jeu restant arrêtée (elle ne suit que le panneau de simulation)
const DECALAGE = `(() => { let d = 0; try { d = +sessionStorage.getItem('__decalageMs') || 0; } catch (e) {} if (d) { const n = Date.now.bind(Date); Date.now = () => n() + d; } })();`;

// Ouvre le Prototype dans un contexte neuf (service worker compris), attend qu'il soit chargé
const page = async (b, hash, o) => {
  // (le Chromium complet demande /favicon.ico, que la démo n'a pas : une réponse vide, pour que la console reste propre)
  o = Object.assign({}, o); o.init = ESPION_NOTIF + DECALAGE + (o.init || '');
  const p = await ouvrir(b, 'Prototype.dc.html#' + hash, Object.assign({ sw: true, delai: 0, avant: (q) => q.context().route(/\/favicon\.ico$/, (r) => r.fulfill({ status: 204, body: '' })) }, o));
  p.setDefaultTimeout(8000);
  await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(2500);
  return p;
};
// Un clic qui ne casse pas la suite : un élément absent devient un ✗ plus loin, pas une exception
const clic = (p, sel) => p.click(sel).then(() => true, () => false);
// Recharge la même page (même contexte : la sauvegarde et le service worker restent) avec un autre fragment ; sans fragment, l'app rouverte
// sur sa sauvegarde (comme l'app installée, dont l'adresse de départ n'a pas de fragment)
const recharger = async (p, hash) => {
  await p.goto(URL + 'Prototype.dc.html' + (hash ? '#' + hash : ''), { waitUntil: 'load' });
  await p.reload({ waitUntil: 'load' });
  await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(2500);
};
const swPret = (p) => p.evaluate(() => Promise.race([navigator.serviceWorker.ready.then(() => true), new Promise((f) => setTimeout(() => f(false), 20000))]));
// notifs et effacer : le service worker prêt en 5 s au plus, sinon rien (jamais d'attente sans fin)
const notifs = (p) => p.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready, new Promise((f) => setTimeout(() => f(null), 5000))]); if (!r) return []; return (await r.getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag, icon: n.icon, badge: n.badge, renotify: n.renotify, vibrate: Array.from(n.vibrate || []), actions: (n.actions || []).map((a) => a.action + ':' + a.title), data: n.data })); });
const effacer = (p) => p.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready, new Promise((f) => setTimeout(() => f(null), 5000))]); if (r) (await r.getNotifications()).forEach((n) => n.close()); });
const attendreNotifs = async (p, n, ms) => { let L = []; for (let i = 0; i < (ms || 5000) / 250; i++) { L = await notifs(p); if (L.length >= n) break; await p.waitForTimeout(250); } return L; };
const appels = (p) => p.evaluate(() => (window.__appels || []).slice());
const oublierAppels = (p) => p.evaluate(() => { if (window.__appels) window.__appels.length = 0; });
// Ce que la page a montré : la liste de la plateforme ; si elle a perdu une notification dont l'appel a abouti, cet appel (src le dit)
const montrees = async (p, n, ms) => {
  const L = await attendreNotifs(p, n, ms); if (L.length >= n) return { L, src: 'getNotifications' };
  const A = (await appels(p)).filter((a) => a.etat === 'montree');
  return A.length >= n ? { L: A, src: 'appel abouti (getNotifications : ' + L.length + ')' } : { L, src: 'getNotifications', appels: A };
};
// « Essayer une notification » : getNotifications() doit la lister ; si la plateforme l'a perdue alors que l'appel a abouti, le geste est refait une fois
const essayer = async (p) => {
  await oublierAppels(p);
  const clique = await clic(p, ESSAI);
  let L = await attendreNotifs(p, 1); if (L.length || !clique) return { L, clique, reprise: false };
  const A = await appels(p); if (!A.some((a) => a.etat === 'montree')) return { L, clique, reprise: false, appels: A };
  await effacer(p); await oublierAppels(p); await clic(p, ESSAI);
  L = await attendreNotifs(p, 1); return { L, clique, reprise: true };
};
const miroir = (p) => p.evaluate(() => new Promise((res) => { const r = indexedDB.open('athena-mobile', 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('etat')) r.result.createObjectStore('etat'); }; r.onerror = () => res({ erreur: String(r.error) }); r.onsuccess = () => { const db = r.result; try { const g = db.transaction('etat').objectStore('etat').get(1); g.onsuccess = () => { db.close(); res(g.result || null); }; g.onerror = () => { db.close(); res({ erreur: String(g.error) }); }; } catch (e) { db.close(); res({ erreur: String(e) }); } }; }));
// Le miroir relu jusqu'à ce que la sauvegarde l'ait écrit (au plus ms, 8 s par défaut ; le dernier lu sinon) : la sauvegarde part 400 ms après le
// dernier rendu, et après un geste les rendus de l'interface la repoussent (mesuré : de 0,9 à 2,8 s après « Rentrer au camp ») ; une attente fixe
// rendait les contrôles du miroir aléatoires
const attendreMiroir = async (p, f, ms) => { let m = null; for (let i = 0; i < (ms || 8000) / 200; i++) { m = await miroir(p); if (m && !m.erreur && f(m)) break; await p.waitForTimeout(200); } return m; };
const ecrireMiroir = (p, v) => p.evaluate((v) => new Promise((res) => { const r = indexedDB.open('athena-mobile', 1); r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains('etat')) r.result.createObjectStore('etat'); }; r.onsuccess = () => { const db = r.result, t = db.transaction('etat', 'readwrite'); t.objectStore('etat').put(v, 1); t.oncomplete = () => { db.close(); res(true); }; t.onerror = () => { db.close(); res(false); }; }; r.onerror = () => res(false); }), v);
const carte = (p) => p.evaluate((sel) => { const c = document.querySelector(sel); if (!c) return { on: false, texte: '', exemple: '', interrupteurs: [], essai: null, petit: [], deborde: false }; const sw = [...c.querySelectorAll('button[role="switch"]')]; const ex = c.querySelector('[data-el="notif_exemple"]'); const pastille = ex && ex.querySelector('[data-el="notif_pastille"]'); const petit = [...c.querySelectorAll('span')].filter((s) => s.childElementCount === 0 && s.textContent.trim()).map((s) => parseFloat(getComputedStyle(s).fontSize)).filter((x) => x < 13); const essai = [...c.querySelectorAll('button')].find((x) => /Essayer une notification/.test(x.textContent)); return { on: true, texte: c.textContent.replace(/\s+/g, ' ').trim(), exemple: ex ? ex.textContent.replace(/\s+/g, ' ').trim() : '', cadre: ex ? getComputedStyle(ex).borderTopStyle + ' ' + getComputedStyle(ex).borderTopWidth : '', pastille: pastille ? pastille.offsetWidth + '×' + pastille.offsetHeight : '', exT: ex ? parseFloat(getComputedStyle(ex.querySelector('[data-t="mob.notif.exemple.t"]')).fontSize) : 0, exD: ex ? parseFloat(getComputedStyle(ex.querySelector('[data-t="mob.notif.exemple.d"]')).fontSize) : 0, interrupteurs: sw.map((x) => ({ t: x.textContent.replace(/\s+/g, ' ').trim(), on: x.getAttribute('aria-checked'), h: x.offsetHeight })), essai: essai ? essai.offsetHeight : null, petit, deborde: c.scrollWidth > c.clientWidth + 1 }; }, CARTE);
// Compte les appels à AthenaMobile.synchroniser (window.__sync), posé au moment où le module s'installe
const SYNC = `(() => { let v; window.__sync = 0; Object.defineProperty(window, 'AthenaMobile', { configurable: true, get() { return v; }, set(x) { v = x; if (x && typeof x.synchroniser === 'function' && !x.__espSync) { const s = x.synchroniser; x.synchroniser = function () { window.__sync++; return s.apply(this, arguments); }; x.__espSync = true; } } }); })();`;
const clicSim = (p, t) => p.evaluate((t) => { const b = [...document.querySelectorAll('button')].find((x) => x.textContent.trim().startsWith(t)); if (b) b.click(); return !!b; }, t);

(async () => {
  // 1 · sans navigateur : les textes, la plage, le seul appel de la permission, les copies des textes dans sw.js
  const ATTENDUS = {
    'mob.notif.t': 'Prévenir sur le téléphone', 'mob.notif.d': 'Un mot quand les compagnons rentrent ou que le résumé du matin t’attend. Entre 8 h et 21 h, jamais la nuit.',
    'mob.notif.exemple.t': 'Athéna · maintenant', 'mob.notif.exemple.d': 'Tes compagnons sont rentrés au camp.', 'mob.notif.matin': 'Le résumé du matin',
    'mob.notif.matin.corps': 'Ton résumé du matin t’attend au camp.', 'mob.notif.essai': 'Essayer une notification', 'mob.notif.essai.t': 'Ça marche',
    'mob.notif.essai.d': 'C’est comme ça que l’app te préviendra.', 'mob.notif.plusTard': 'Plus tard, dans les réglages du téléphone.',
    'mob.notif.ferme': 'Quand l’app est fermée, c’est le téléphone qui choisit le moment.',
    'mob.notif.titre': 'Athéna', 'mob.notif.indispo': 'Pas disponible ici : installe l’app sur le téléphone.'
  };
  const faux = Object.keys(ATTENDUS).filter((k) => TX(k) !== ATTENDUS[k]);
  ok('1 textes mob.notif.* : les 13 valeurs des briefs (tâches 4 et 11) (apostrophes typographiques du projet) ; mob.notif.exemple.d = eco.exp.notif', faux.length === 0 && TX('mob.notif.exemple.d') === TX('eco.exp.notif') && TX('eco.exp.notif') === 'Tes compagnons sont rentrés au camp.', faux.map((k) => k + ' = ' + JSON.stringify(TX(k))).join(' | '));
  const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '’');
  const interdits = [];
  Object.keys(V.TEXTES).filter((k) => k.startsWith('mob.')).forEach((k) => { const v = V.TEXTES[k][1]; (typeof v === 'object' ? Object.values(v) : [v]).forEach((s) => V.MOTS_INTERDITS.forEach((m) => { if (norm(s).includes(norm(m))) interdits.push(k + ' : ' + m); })); });
  ok('1 aucun mot de V.MOTS_INTERDITS dans les textes mob.* (' + Object.keys(V.TEXTES).filter((k) => k.startsWith('mob.')).length + ' clés)', interdits.length === 0, interdits.join(' | '));
  ok('1 V.MOBILE.notifs.heures = [8, 21]', JSON.stringify(V.MOBILE && V.MOBILE.notifs && V.MOBILE.notifs.heures) === '[8,21]', JSON.stringify(V.MOBILE && V.MOBILE.notifs));
  const g = spawnSync('bash', ['-c', 'grep -c requestPermission demo/Prototype.dc.html demo/commun/*.js'], { cwd: RACINE, encoding: 'utf8' });
  const comptes = (g.stdout || '').trim().split('\n').map((l) => l.split(':')).filter((x) => +x[1] > 0);
  ok('1 grep -c requestPermission demo/Prototype.dc.html demo/commun/*.js : 1 occurrence, dans commun/athena-mobile.js', comptes.length === 1 && comptes[0][0] === 'demo/commun/athena-mobile.js' && comptes[0][1] === '1', comptes.map((x) => x.join(':')).join(', '));
  const sw = lire('sw.js');
  ok('1 sw.js : les textes des notifications copiés de V.TEXTES (mob.notif.titre, eco.exp.notif, mob.notif.matin, mob.notif.matin.corps), avec le commentaire qui le dit', ['mob.notif.titre', 'eco.exp.notif', 'mob.notif.matin', 'mob.notif.matin.corps'].every((k) => sw.includes("'" + TX(k) + "'")) && /copi[ée]s? de V\.TEXTES/.test(sw), '');
  ok('1 sw.js : notificationclick (close, focus ou openWindow ./Prototype.dc.html?source=pwa, sans fragment, postMessage athena-notif) et periodicsync resume-matin (IndexedDB athena-mobile)', /notificationclick/.test(sw) && /notification\.close\(\)/.test(sw) && /openWindow\(PAGE \+ '\?source=pwa'\)/.test(sw) && /athena-notif/.test(sw) && /periodicsync/.test(sw) && /resume-matin/.test(sw) && /indexedDB\.open\(C\.base, C\.version\)/.test(sw), '');
  // Les options des notifications et la base IndexedDB (nom, version, magasin, clé) n'existent qu'à un endroit : commun/athena-mobile-commun.js, importé
  // par sw.js et chargé par le Prototype avant commun/athena-mobile.js ; aucune des deux copies n'y revient
  const com = lire('commun/athena-mobile-commun.js'), mob = lire('commun/athena-mobile.js'), protoH = lire('Prototype.dc.html');
  const Wc = {}; Wc.window = Wc; Wc.self = Wc; try { vm.runInContext(com, vm.createContext(Wc)); } catch (e) { Wc.__erreur = e.message; }
  const C = Wc.AthenaMobileCommun || {}, o = typeof C.options === 'function' ? C.options({ corps: 'x', tag: 't', action: 'camp', vibrer: true }) : {};
  ok('1 commun/athena-mobile-commun.js : AthenaMobileCommun = base athena-mobile v1, magasin etat, clé 1, options (icône, badge, « Voir », renotify false, vibration [40])', !Wc.__erreur && C.base === 'athena-mobile' && C.version === 1 && C.magasin === 'etat' && C.cle === 1 && o.icon === 'icones/icone-192.png' && o.badge === 'icones/badge-96.png' && JSON.stringify(o.actions) === '[{"action":"voir","title":"Voir"}]' && o.renotify === false && JSON.stringify(o.vibrate) === '[40]' && o.body === 'x' && o.tag === 't' && o.data && o.data.action === 'camp' && !('vibrate' in C.options({ vibrer: false })), Wc.__erreur || JSON.stringify(o));
  const doublons = [['sw.js', sw], ['commun/athena-mobile.js', mob]].map(([f, t]) => [f, ['icones/icone-192.png', 'icones/badge-96.png', "'athena-mobile'", "'etat'", 'renotify', "title: 'Voir'"].filter((x) => t.includes(x))]).filter((x) => x[1].length);
  ok('1 sw.js et athena-mobile.js lisent AthenaMobileCommun, sans copie des options ni des constantes de la base', /importScripts\('\.\/commun\/athena-mobile-commun\.js\?v=\d+'\)/.test(sw) && /AthenaMobileCommun/.test(sw) && /AthenaMobileCommun/.test(mob) && doublons.length === 0, JSON.stringify(doublons));
  const vCom = (protoH.match(/data-resource-id="commun\/athena-mobile-commun\.js\?v=(\d+)"/) || [])[1], helm = protoH.slice(protoH.indexOf('<helmet>'));
  ok('1 le Prototype déclare commun/athena-mobile-commun.js?v=' + vCom + ' et le charge avant commun/athena-mobile.js (même version dans sw.js)', !!vCom && helm.indexOf("'commun/athena-mobile-commun.js?v=" + vCom + "'") > 0 && helm.indexOf("'commun/athena-mobile-commun.js?v=" + vCom + "'") < helm.indexOf("'commun/athena-mobile.js?v=") && sw.includes("importScripts('./commun/athena-mobile-commun.js?v=" + vCom + "')"), '');

  // 2 · la règle 12 du vérificateur : sur une copie de demo/ (sans Archives/), une demande de permission hors de commun/athena-mobile.js, un
  // « new Notification( » et une permission qui n'est plus demandée par athena-mobile.js → erreurs
  const v0 = spawnSync('python3', ['-I', path.join('demo', 'scripts', 'verifier-projet.py'), 'demo'], { cwd: RACINE, encoding: 'utf8' });
  ok('2 verifier-projet.py : code 0 et « 0 erreur(s), 0 alerte(s) »', v0.status === 0 && (v0.stdout || '').includes('0 erreur(s), 0 alerte(s)'), 'code=' + v0.status + ' ' + ((v0.stdout || '').trim().split('\n').pop() || ''));
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'athena-regle12-'));
  const r12 = (() => {
    try {
      fs.cpSync(DEMO, tmp, { recursive: true, filter: (s) => path.relative(DEMO, s).split(path.sep)[0] !== 'Archives' });
      const ecrire = (f, fn) => fs.writeFileSync(path.join(tmp, f), fn(fs.readFileSync(path.join(tmp, f), 'utf8')));
      ecrire('commun/hub-v1.js', (t) => t + '\nwindow.__essai = () => Notification.requestPermission();\n');
      ecrire('Prototype.dc.html', (t) => t.replace('</body>', '<script>window.__essai2 = () => new Notification("x");</script></body>'));
      const v1 = spawnSync('python3', ['-I', path.join(RACINE, 'demo', 'scripts', 'verifier-projet.py'), tmp], { encoding: 'utf8' });
      ecrire('commun/athena-mobile.js', (t) => t.split('requestPermission').join('demanderPermission'));
      const v2 = spawnSync('python3', ['-I', path.join(RACINE, 'demo', 'scripts', 'verifier-projet.py'), tmp], { encoding: 'utf8' });
      const L = (v) => (v.stdout || '').split('\n').filter((l) => l.includes('Notifications'));
      return { code1: v1.status, l1: L(v1), code2: v2.status, l2: L(v2) };
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  })();
  ok('2 règle 12 : requestPermission hors de commun/athena-mobile.js et new Notification( → erreurs', r12.code1 === 1 && r12.l1.some((l) => /commun\/hub-v1\.js/.test(l) && /requestPermission/.test(l)) && r12.l1.some((l) => /Prototype\.dc\.html/.test(l) && /new Notification/.test(l)), 'code=' + r12.code1 + ' · ' + r12.l1.join(' | '));
  ok('2 règle 12 : commun/athena-mobile.js sans requestPermission → erreur', r12.code2 === 1 && r12.l2.some((l) => /athena-mobile\.js/.test(l)), 'code=' + r12.code2 + ' · ' + r12.l2.join(' | '));

  // (sans le trafic de fond du Chromium complet : mises à jour de composants, services Google)
  const b = await lancer({ channel: 'chromium', args: ARGS.concat(['--disable-background-networking', '--disable-component-update']) });

  // 3 · permission accordée : le Carnet montre la carte, l'exemple dessiné et trois interrupteurs éteints (compagnons, matin, quêtes)
  let p = await page(b, 'ecran=journal&tab=carnet&nouv=tout', { permissions: ['notifications'], init: SYNC });
  const pret = await swPret(p);
  let c = await carte(p);
  ok('3 Carnet : la carte « Prévenir sur le téléphone » dans la section Téléphone, avec son texte et la ligne « Quand l’app est fermée… »', c.on && c.texte.includes(TX('mob.notif.t')) && c.texte.includes(TX('mob.notif.d')) && c.texte.includes(TX('mob.notif.ferme')), c.texte || 'carte absente');
  ok('3 exemple dessiné : « Athéna · maintenant » (13 px) et « Tes compagnons sont rentrés au camp. » (14 px), pastille 36 px, cadre', /Athéna · maintenant/.test(c.exemple) && /Tes compagnons sont rentrés au camp\./.test(c.exemple) && c.exT === 13 && c.exD === 14 && c.pastille === '36×36' && /solid/.test(c.cadre), JSON.stringify({ exemple: c.exemple, t: c.exT, d: c.exD, pastille: c.pastille, cadre: c.cadre }));
  ok('3 trois interrupteurs role=switch éteints (≥ 44 px) : « Prévenir quand les compagnons rentrent (en journée) », « Le résumé du matin » et « Me rappeler mes quêtes à leur heure »', c.on && c.interrupteurs.length === 3 && /Me rappeler mes quêtes à leur heure/.test(c.interrupteurs[2].t) && c.interrupteurs.every((x) => x.on === 'false' && x.h >= 44) && /Prévenir quand les compagnons rentrent \(en journée\)/.test(c.interrupteurs[0].t) && /Le résumé du matin/.test(c.interrupteurs[1].t), JSON.stringify(c.interrupteurs));
  ok('3 « Essayer une notification » (≥ 44 px), aucun texte sous 13 px, rien ne déborde', c.essai >= 44 && c.petit.length === 0 && !c.deborde, 'essai=' + c.essai + ' petits=' + c.petit.join(',') + ' déborde=' + c.deborde);
  ok('3 un seul interrupteur « Prévenir quand les compagnons rentrent » dans tout le Carnet', (await p.$$('button[role="switch"]:has-text("Prévenir quand les compagnons rentrent")')).length === 1, '');
  // allumer : la permission (déjà accordée au contexte) → aria-checked="true", puis le miroir IndexedDB
  await clic(p, SW_EXP); await p.waitForTimeout(1200);
  c = await carte(p);
  const m1 = await attendreMiroir(p, (m) => m.compagnons === true);
  ok('3 « Prévenir quand les compagnons rentrent » → aria-checked="true" ; « Le résumé du matin » reste éteint', c.interrupteurs[0] && c.interrupteurs[0].on === 'true' && c.interrupteurs[1].on === 'false', JSON.stringify(c.interrupteurs));
  ok('3 IndexedDB athena-mobile / etat / clé 1 : heures [8, 21], compagnons true, matin false, matinA (minuit suivant), montre', !!m1 && JSON.stringify(m1.heures) === '[8,21]' && m1.compagnons === true && m1.matin === false && typeof m1.matinA === 'number' && m1.matinA > Date.now() && m1.matinA - Date.now() <= 864e5 && new Date(m1.matinA).getHours() === 0 && !!m1.montre, JSON.stringify(m1));
  // essayer : une notification « Ça marche »
  const e3 = await essayer(p);
  let L = e3.L;
  ok('3 « Essayer une notification » → getNotifications().length === 1, titre « Ça marche »', pret && L.length === 1 && L[0].title === 'Ça marche' && L[0].body === TX('mob.notif.essai.d'), 'service worker prêt=' + pret + ' clic=' + e3.clique + (e3.reprise ? ' (repris une fois : la plateforme avait perdu la première)' : '') + ' ' + JSON.stringify(L) + (e3.appels ? ' appels=' + JSON.stringify(e3.appels) : ''));
  ok('3 la notification : icône icones/icone-192.png, badge icones/badge-96.png, action « Voir », renotify false, vibration [40], tag essai', L[0] && /\/icones\/icone-192\.png$/.test(L[0].icon) && /\/icones\/badge-96\.png$/.test(L[0].badge) && L[0].actions.join() === 'voir:Voir' && L[0].renotify === false && L[0].vibrate.join() === '40' && L[0].tag === 'essai', JSON.stringify(L[0] || {}));
  await effacer(p);
  await clic(p, SW_MATIN); await p.waitForTimeout(1200);
  const m2 = await attendreMiroir(p, (m) => m.matin === true);
  ok('3 « Le résumé du matin » → allumé, miroir matin true', m2 && m2.matin === true && m2.compagnons === true, JSON.stringify(m2));
  // la plage se vérifie aussi sur l'heure de l'appareil : jeu à 10 h mais téléphone à 23 h → rien ; les deux à 10 h → la notification part
  const plage = await p.evaluate(async () => { const g = Date.prototype.getHours, essai = async (h) => { Date.prototype.getHours = function () { return h; }; try { return await window.AthenaMobile.notifier({ titre: 'Athéna', corps: 'plage', tag: 'plage', heure: 10 }); } finally { Date.prototype.getHours = g; } };
    const n0 = (window.__appels || []).length, nuit = await essai(23), n1 = (window.__appels || []).length, jour = await essai(10), n2 = (window.__appels || []).length; return { nuit, appelsNuit: n1 - n0, jour, appelsJour: n2 - n1 }; });
  ok('3 plage 8 h-21 h : heure du jeu 10 h mais téléphone à 23 h → aucune notification ; les deux à 10 h → montrée', plage.nuit === false && plage.appelsNuit === 0 && plage.jour === true && plage.appelsJour === 1, JSON.stringify(plage));
  await effacer(p);
  // le geste qui rend la permission relance la synchronisation périodique (plus seulement une fois par session)
  const s0 = await p.evaluate(() => window.__sync);
  await clic(p, SW_MATIN); await p.waitForTimeout(600); await clic(p, SW_MATIN); await p.waitForTimeout(1200);
  const s1 = await p.evaluate(() => window.__sync), c3 = await carte(p);
  ok('3 « Le résumé du matin » éteint puis rallumé (la permission rendue par le geste) → synchroniser() relancé', s0 >= 1 && s1 > s0 && c3.interrupteurs[1] && c3.interrupteurs[1].on === 'true', 'appels avant=' + s0 + ' après=' + s1);
  // rien à résumer demain (aucune quête, aucune expédition : la condition du résumé du matin) → pas de matinA, le service worker n'annonce rien
  await recharger(p, 'ecran=camp&nouv=tout&vide=1');
  const mv = await attendreMiroir(p, (m) => m.matinA === null);
  ok('3 rien à résumer demain (#vide=1 : aucune quête ni expédition) → matinA null, « Le résumé du matin » toujours allumé', !!mv && mv.matin === true && mv.matinA === null, JSON.stringify(mv));

  // 4 · état sauvegardé, interrupteur allumé : un compagnon rentre (le temps avance au panneau) → la notification du retour
  // (une marque posée avant : son absence prouve que le miroir lu est celui de la page rechargée, pas celui d'avant, qui avait déjà retourA null)
  if (mv) await ecrireMiroir(p, Object.assign({}, mv, { marque: 'avant' }));
  await recharger(p, 'ecran=camp&expedition=route&nouv=tout');
  const m4 = await attendreMiroir(p, (m) => !('marque' in m));
  ok('4 miroir : un compagnon en route (prochain = son pas suivant, l’heure du retour pas encore connue) → retourA null', !!m4 && !('marque' in m4) && m4.compagnons === true && m4.retourA === null, JSON.stringify(m4 && { retourA: m4.retourA, compagnons: m4.compagnons, reecrit: !('marque' in m4) }));
  await effacer(p); await oublierAppels(p);
  let rentre = false, M = { L: [] };
  for (let i = 0; i < 4 && !M.L.length; i++) { await clicSim(p, 'Avancer d’une heure'); M = await montrees(p, 1, 3000); }
  L = M.L; rentre = /est rentré|sont rentrés au camp/.test(await p.evaluate(() => document.body.innerText));
  const okRetour = rentre && L.length === 1 && L[0].body === 'Tes compagnons sont rentrés au camp.';
  ok('4 un compagnon rentre, interrupteur allumé (état sauvegardé) → une notification titrée « Athéna », dont le body est « Tes compagnons sont rentrés au camp. »', rentre && L.length === 1 && L[0].title === 'Athéna' && L[0].body === 'Tes compagnons sont rentrés au camp.' && /^retour-/.test(L[0].tag) && L[0].data && L[0].data.action === 'camp', 'rentré=' + rentre + ' · ' + M.src + ' ' + JSON.stringify(L));
  // le résumé du matin quand l'app est cachée (document.hidden) : le lendemain au panneau
  await effacer(p); await oublierAppels(p);
  await p.evaluate(() => { Object.defineProperty(document, 'hidden', { configurable: true, get: () => true }); });
  await clicSim(p, 'Lendemain (4 h)');
  M = await montrees(p, 1, 4000); L = M.L;
  ok('4 le lendemain, app cachée, « Le résumé du matin » allumé → « Le résumé du matin » / « Ton résumé du matin t’attend au camp. »', L.length === 1 && L[0].title === 'Le résumé du matin' && L[0].body === 'Ton résumé du matin t’attend au camp.', M.src + ' ' + JSON.stringify(L));
  await p.evaluate(() => { delete document.hidden; });
  // hors plage (heure=23) : le compagnon rentre, aucune notification
  await recharger(p, 'ecran=camp&expedition=route&nouv=tout&heure=23');
  await effacer(p); await oublierAppels(p);
  for (let i = 0; i < 3; i++) { await clicSim(p, 'Avancer d’une heure'); await p.waitForTimeout(1500); }
  rentre = /est rentré|sont rentrés au camp/.test(await p.evaluate(() => document.body.innerText));
  L = await notifs(p); const A23 = await appels(p);
  ok('4 hors plage (heure=23) : le compagnon rentre, aucune notification ni aucun appel (le même retour en journée en a montré une)', okRetour && rentre && L.length === 0 && A23.length === 0, 'rentré=' + rentre + ' ' + JSON.stringify(L) + ' appels=' + JSON.stringify(A23));
  // un compagnon sur le chemin du retour (« Rentrer au camp ») : retourA = l'heure de l'appareil + ce qu'il lui reste ; l'app fermée puis rouverte
  // 7 min plus tard (heure de l'appareil ; l'horloge du jeu n'a pas bougé) garde le même retourA : le même retour n'est pas ré-annoncé
  await recharger(p, 'ecran=expedition&expedition=route&nouv=tout');
  const rentrer = await clic(p, 'button:has-text("Rentrer au camp")');
  const RPE = V.JEU.eco.expeditions.parcours.retourParEtape * 60000;
  const m5 = await attendreMiroir(p, (m) => typeof m.retourA === 'number'), d5 = m5 && typeof m5.retourA === 'number' ? m5.retourA - Date.now() : null;
  ok('4 « Rentrer au camp » → retourA = l’heure de l’appareil + le chemin du retour (' + RPE / 60000 + ' min, à la minute)', rentrer && d5 != null && d5 > 0 && d5 <= RPE + 60000 && m5.retourA % 60000 === 0, 'clic=' + rentrer + ' retourA − maintenant = ' + (d5 == null ? JSON.stringify(m5) : Math.round(d5 / 1000) + ' s'));
  // (une marque posée dans le miroir avant de rouvrir : son absence ensuite prouve que l'app rouverte l'a bien réécrit)
  if (m5) await ecrireMiroir(p, Object.assign({}, m5, { marque: 'avant' }));
  await p.evaluate(() => sessionStorage.setItem('__decalageMs', String(7 * 60000)));
  await recharger(p, '');
  const rouvert = await p.evaluate(() => { let sv = null; try { sv = JSON.parse(localStorage.getItem('athena-proto-v1')); } catch (e) {} return { decale: Date.now() - new Date().getTime(), statuts: ((sv && sv.eco && sv.eco.parcours) || []).map((x) => x.statut) }; });
  const m6 = await attendreMiroir(p, (m) => !('marque' in m));
  ok('4 l’app rouverte 7 min plus tard (même état du jeu, compagnon toujours sur le retour) → le même retourA (pas de ré-annonce)', !!m5 && !!m6 && rouvert.decale >= 7 * 60000 - 1000 && rouvert.statuts.join() === 'retour' && !('marque' in m6) && typeof m6.retourA === 'number' && m6.retourA === m5.retourA, JSON.stringify({ rouvert, reecrit: !!m6 && !('marque' in m6), avant: m5 && m5.retourA, apres: m6 && m6.retourA }));
  await p.evaluate(() => sessionStorage.removeItem('__decalageMs'));
  // le message du service worker (clic sur une notification) ramène au camp
  await recharger(p, 'ecran=journal&tab=carnet&nouv=tout');
  const avantMsg = !!(await p.$('[data-el="telephone"]'));
  await p.evaluate(() => navigator.serviceWorker.dispatchEvent(new MessageEvent('message', { data: { type: 'athena-notif', action: 'voir' } })));
  await p.waitForTimeout(800);
  const apresMsg = await p.evaluate(() => ({ carnet: !!document.querySelector('[data-el="telephone"]') }));
  ok('4 message { type: athena-notif } du service worker → le Journal se ferme, le camp paraît', avantMsg && !apresMsg.carnet, 'avant=' + avantMsg + ' ' + JSON.stringify(apresMsg));
  ok('3-4 aucune erreur de page ni de console', p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();

  // 5 · sans permission ni API Notification : « Plus tard… », les interrupteurs restent éteints, 0 pageerror
  p = await page(b, 'ecran=journal&tab=carnet&nouv=tout', { init: 'delete window.Notification;' });
  await oublierAppels(p);
  const sansApi = await p.evaluate(() => !('Notification' in window));
  // (un interrupteur masqué n'est pas cliqué : sa présence est déjà un ✗ plus bas)
  if (await p.$(SW_EXP)) { await clic(p, SW_EXP); await p.waitForTimeout(800); }
  if (await p.$(SW_MATIN)) { await clic(p, SW_MATIN); await p.waitForTimeout(800); }
  c = await carte(p);
  const etat5 = await p.evaluate(() => window.AthenaMobile.etat().notifs);
  ok('5 sans API Notification (etat().notifs « indisponible ») : « Pas disponible ici : installe l’app sur le téléphone. », interrupteurs masqués, ni « Plus tard » ni « Essayer »', sansApi && etat5 === 'indisponible' && c.texte.includes('Pas disponible ici : installe l’app sur le téléphone.') && !c.texte.includes('Plus tard') && c.interrupteurs.length === 0 && c.essai === null, JSON.stringify({ sansApi, texte: c.texte, sw: c.interrupteurs, essai: c.essai }));
  const A5 = await appels(p);
  ok('5 sans API Notification : aucun appel à showNotification, 0 pageerror', A5.length === 0 && !p.errs.some((e) => e.startsWith('pageerror')), 'appels=' + A5.length + ' ' + p.errs.join(' | '));
  await p.context().close();

  // 6 · le service worker, app fermée : « periodicsync » resume-matin (déclenché par le protocole de débogage) lit le miroir, montre ce qui est dû
  // dans la plage, marque « montre » et ne répète pas ; hors plage, rien ; mouvement réduit : « Essayer » sans vibration
  p = await page(b, 'ecran=journal&tab=carnet&nouv=tout', { permissions: ['notifications'], contexte: { reducedMotion: 'reduce' } });
  const pret6 = await swPret(p);
  const e6 = await essayer(p);
  L = e6.L;
  ok('6 mouvement réduit : « Essayer » montre la notification sans vibration', pret6 && L.length === 1 && L[0].vibrate.length === 0, 'service worker prêt=' + pret6 + ' clic=' + e6.clique + (e6.reprise ? ' (repris une fois : la plateforme avait perdu la première)' : '') + ' ' + JSON.stringify(L) + (e6.appels ? ' appels=' + JSON.stringify(e6.appels) : ''));
  await effacer(p);
  const cdp = await p.context().newCDPSession(p);
  const regs = [];
  cdp.on('ServiceWorker.workerRegistrationUpdated', (e) => regs.push(...e.registrations));
  await cdp.send('ServiceWorker.enable');
  for (let i = 0; i < 20 && !regs.some((r) => !r.isDeleted && r.scopeURL.startsWith(URL)); i++) await p.waitForTimeout(250);
  const reg = regs.find((r) => !r.isDeleted && r.scopeURL.startsWith(URL));
  const sync = async () => { await cdp.send('ServiceWorker.dispatchPeriodicSyncEvent', { origin: URL.replace(/\/$/, ''), registrationId: reg.registrationId, tag: 'resume-matin' }); };
  const avant = Date.now() - 60000;
  await ecrireMiroir(p, { retourA: avant, matinA: avant, heures: [0, 24], compagnons: true, matin: true, vibrer: true, montre: { retourA: null, matinA: null } });
  if (reg) await sync();
  L = await attendreNotifs(p, 2, 5000);
  const m3 = await attendreMiroir(p, (m) => !!m.montre && m.montre.retourA === avant && m.montre.matinA === avant, 5000);
  const okSync = !!reg && L.length === 2;
  ok('6 periodicsync : le retour (« Tes compagnons sont rentrés au camp. ») et le matin (« Le résumé du matin ») sont montrés', !!reg && L.length === 2 && L.some((n) => n.title === 'Athéna' && n.body === TX('eco.exp.notif')) && L.some((n) => n.title === TX('mob.notif.matin') && n.body === TX('mob.notif.matin.corps')), (reg ? '' : 'pas d’enregistrement · ') + JSON.stringify(L));
  ok('6 periodicsync : « montre » marque retourA et matinA', m3 && m3.montre && m3.montre.retourA === avant && m3.montre.matinA === avant, JSON.stringify(m3 && m3.montre));
  await effacer(p);
  if (reg) await sync();
  await p.waitForTimeout(1500);
  L = await notifs(p);
  ok('6 periodicsync une deuxième fois : rien de neuf (déjà montré)', okSync && L.length === 0, JSON.stringify(L));
  await ecrireMiroir(p, { retourA: avant + 1000, matinA: avant + 1000, heures: [0, 0], compagnons: true, matin: true, vibrer: true, montre: m3 && m3.montre });
  if (reg) await sync();
  await p.waitForTimeout(1500);
  L = await notifs(p);
  ok('6 periodicsync hors plage : aucune notification', okSync && L.length === 0, JSON.stringify(L));
  await ecrireMiroir(p, { retourA: avant + 2000, matinA: avant + 2000, heures: [0, 24], compagnons: false, matin: false, vibrer: true, montre: m3 && m3.montre });
  if (reg) await sync();
  await p.waitForTimeout(1500);
  L = await notifs(p);
  ok('6 periodicsync, options éteintes : aucune notification', okSync && L.length === 0, JSON.stringify(L));
  ok('6 aucune erreur de page ni de console', p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();

  // 7 · 360 × 640 : la carte tient (rien ne déborde, cibles ≥ 44 px)
  p = await page(b, 'ecran=journal&tab=carnet&nouv=tout&da=origine&profil=enfant', { permissions: ['notifications'], viewport: { width: 360, height: 640 } });
  c = await carte(p);
  ok('7 360 × 640, Veillée d’origine, Ado : la carte tient, interrupteurs ≥ 44 px, aucun texte sous 13 px', c.on && !c.deborde && c.interrupteurs.length === 3 && c.interrupteurs.every((x) => x.h >= 44) && c.petit.length === 0, JSON.stringify({ deborde: c.deborde, sw: c.interrupteurs, petit: c.petit }));
  ok('7 aucune erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();

  await b.close();
  process.exitCode = bilan('mobile_notif') ? 1 : 0;
})().catch((e) => { console.error(e); bilan('mobile_notif'); process.exit(1); });
