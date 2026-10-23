// Mobile · agenda (tâche 5, spec § 5) : le fichier .ics (CRLF, lignes repliées à 75 octets, une entrée par quête, rappel, récurrence), le lien
// Google Agenda, l'intention Android, le partage du fichier (ou son téléchargement), l'API Google Agenda facultative (ID client public dans
// commun/athena-mobile-config.js, profil Parent seulement) ; dans le Prototype : « Mettre dans mon agenda » dans les options d'une quête (une
// feuille à 3 choix sur Android, 2 ailleurs), la carte agenda du Carnet › Téléphone (export .ics des quêtes à heure, Google Agenda relié) ; le jour
// des entrées et des rendez-vous du jour suit maintenant(S) (l'horloge du jeu dans le hub, l'heure réelle sur le téléphone installé, tâche 10).
// 1 · sans navigateur : athena-v1.js et commun/athena-mobile.js dans une VM (window minimal), fetch et Google Identity remplacés par des doublures.
// 2 · dans Chromium : le Prototype servi par bash test/_serveur.sh, l'API Google remplacée par une route (aucun appel réseau vers Google).
// Lancer : bash test/_serveur.sh && node test/mobile_agenda.js
const fs = require('fs');
const path = require('path');
const vm = require('vm');
const { ouvrir, lancer, ok, bilan } = require('./_commun.js');
process.chdir(__dirname);

const RACINE = path.join(__dirname, '..');
const DEMO = path.join(RACINE, 'demo');
const lire = (f) => { try { return fs.readFileSync(path.join(RACINE, f), 'utf8'); } catch (e) { return ''; } };
const PH = '[data-screen-label="Prototype V1"]';
const ANDROID = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';

// Une fenêtre minimale (celle du vérificateur, plus ce que le module touche) ; head.appendChild note les scripts ajoutés
const fenetre = (ua) => {
  const W = { navigator: { userAgent: ua || 'Mozilla/5.0 (X11; Linux x86_64)' }, setTimeout, clearTimeout, matchMedia: null, CustomEvent: function () {}, __ajoutes: [] };
  W.document = { currentScript: null, addEventListener() {}, dispatchEvent() {}, querySelector() { return null; }, querySelectorAll() { return []; }, createElement(n) { return { tagName: String(n).toUpperCase(), style: {}, setAttribute(k, v) { this[k] = v; } }; }, head: { appendChild(e) { W.__ajoutes.push(e); return e; } }, body: { appendChild() {} } };
  W.window = W;
  const ctx = vm.createContext(W);
  for (const f of ['demo/athena-v1.js', 'demo/commun/athena-mobile-config.js', 'demo/commun/athena-mobile.js']) { try { vm.runInContext(lire(f), ctx, { filename: f }); } catch (e) { W.__erreur = (W.__erreur || '') + f + ' : ' + e.message + ' '; } }
  return W;
};
const octets = (s) => Buffer.byteLength(s, 'utf8');
const lignes = (ics) => String(ics).split('\r\n');
const deplier = (ics) => String(ics).replace(/\r\n /g, '');
const Q1 = { id: 'q1', titre: 'Ranger ma chambre', jour: '2026-10-21', heure: '08:00', creneau: 'matin', revient: true, jours: null };

(async () => {
  // 1 · sans navigateur
  let W = fenetre();
  const M = W.AthenaMobile || {}, V = W.ATHENA_V1 || {};
  ok('1 athena-v1.js, athena-mobile-config.js et athena-mobile.js se chargent dans une VM sans navigateur', !W.__erreur && !!W.AthenaMobile && !!W.ATHENA_V1, W.__erreur || '');
  ok('1 AthenaMobile.ics, lienGoogleAgenda, intentAgenda, partagerIcs et google { pret, relier, envoyer, rendezVousDuJour } existent', ['ics', 'lienGoogleAgenda', 'intentAgenda', 'partagerIcs'].every((f) => typeof M[f] === 'function') && !!M.google && ['pret', 'relier', 'envoyer', 'rendezVousDuJour'].every((f) => typeof M.google[f] === 'function'), Object.keys(M).join(','));
  const TX = (k) => { const x = V.TEXTES && V.TEXTES[k]; return x ? (typeof x[1] === 'object' ? x[1].adulte : x[1]) : undefined; };
  const ATTENDUS = {
    'mob.agenda.t': 'Mettre dans mon agenda', 'mob.agenda.google': 'Google Agenda', 'mob.agenda.ics': 'Fichier .ics (Apple Calendrier, autres)', 'mob.agenda.tel': 'L’app Agenda du téléphone',
    'mob.agenda.export': 'Exporter mes quêtes à heure (.ics)', 'mob.agenda.relier': 'Relier Google Agenda', 'mob.agenda.envoyer': 'Envoyer mes quêtes à heure', 'mob.agenda.jour': 'Voir les rendez-vous du jour',
    'mob.agenda.rien': 'Aucune quête à heure pour l’instant.', 'mob.agenda.fait': 'C’est dans ton agenda.',
    'mob.agenda.rate': 'Rien n’est parti : réessaie plus tard.', 'mob.agenda.vide': 'Aucun rendez-vous aujourd’hui.'
  };
  const faux = Object.keys(ATTENDUS).filter((k) => TX(k) !== ATTENDUS[k]);
  ok('1 textes mob.agenda.* : les 12 valeurs des briefs (tâches 5 et 11) (apostrophes typographiques du projet)', faux.length === 0, faux.map((k) => k + ' = ' + JSON.stringify(TX(k))).join(' | '));
  const norm = (s) => String(s).toLowerCase().replace(/[’']/g, '’');
  const interdits = [];
  Object.keys(V.TEXTES || {}).filter((k) => k.startsWith('mob.agenda.')).forEach((k) => { const v = V.TEXTES[k][1]; (typeof v === 'object' ? Object.values(v) : [v]).forEach((s) => (V.MOTS_INTERDITS || []).forEach((m) => { if (norm(s).includes(norm(m))) interdits.push(k + ' : ' + m); })); });
  ok('1 aucun mot de V.MOTS_INTERDITS dans les textes mob.agenda.*', interdits.length === 0, interdits.join(' | '));
  ok('1 V.MOBILE.agenda : heures matin 8, midi 12, apresmidi 15, soir 19 ; durée 30 ; rappel 10', JSON.stringify(V.MOBILE && V.MOBILE.agenda) === JSON.stringify({ heures: { matin: 8, midi: 12, apresmidi: 15, soir: 19 }, duree: 30, rappelMin: 10 }), JSON.stringify(V.MOBILE && V.MOBILE.agenda));
  const cfg = lire('demo/commun/athena-mobile-config.js');
  ok('1 commun/athena-mobile-config.js : AthenaMobileConfig = { googleClientId: \'\' }, commentaire (ID public, créé par l’utilisateur, origine https://athena-v1.baptistebertil.workers.dev)', !!W.AthenaMobileConfig && W.AthenaMobileConfig.googleClientId === '' && /googleClientId:\s*''/.test(cfg) && /https:\/\/athena-v1\.baptistebertil\.workers\.dev/.test(cfg) && /public/i.test(cfg) && /secret/i.test(cfg), JSON.stringify(W.AthenaMobileConfig));

  const proto = lire('demo/Prototype.dc.html'), helmet = proto.slice(proto.indexOf('<helmet>'));
  ok('1 le Prototype déclare commun/athena-mobile-config.js?v=1 (ext-resource-dependency) et le charge (chargeur des scripts communs)', /<meta name="ext-resource-dependency" content="commun\/athena-mobile-config\.js" data-resource-id="commun\/athena-mobile-config\.js\?v=1">/.test(proto) && helmet.includes("['commun/athena-mobile-config.js?v=1','AthenaMobileConfig']"), '');
  ok('1 CONTRIBUTING.md : le paragraphe « ID client Google (public, pas un secret) » ; LISEZ-MOI.md : la ligne de commun/athena-mobile-config.js', /^## ID client Google \(public, pas un secret\)$/m.test(lire('CONTRIBUTING.md')) && /^\| commun\/athena-mobile-config\.js \|/m.test(lire('demo/LISEZ-MOI.md')), '');

  const ics = M.ics ? M.ics([Q1]) : '';
  const L1 = lignes(ics);
  ok('1 ics : BEGIN:VCALENDAR, VERSION:2.0, PRODID:-//Athena//V1//FR, X-WR-CALNAME:Athéna, END:VCALENDAR', L1[0] === 'BEGIN:VCALENDAR' && L1.includes('VERSION:2.0') && L1.includes('PRODID:-//Athena//V1//FR') && L1.includes('X-WR-CALNAME:Athéna') && L1[L1.length - 2] === 'END:VCALENDAR' && L1[L1.length - 1] === '', JSON.stringify(L1.slice(0, 6)));
  ok('1 ics : UID:q1@athena, DTSTAMP UTC, DTSTART:20261021T080000, DTEND:20261021T083000, SUMMARY:Ranger ma chambre, RRULE:FREQ=DAILY', L1.includes('UID:q1@athena') && L1.some((l) => /^DTSTAMP:\d{8}T\d{6}Z$/.test(l)) && L1.includes('DTSTART:20261021T080000') && L1.includes('DTEND:20261021T083000') && L1.includes('SUMMARY:Ranger ma chambre') && L1.includes('RRULE:FREQ=DAILY'), L1.filter((l) => /^(UID|DTSTAMP|DTSTART|DTEND|SUMMARY|RRULE)/.test(l)).join(' | '));
  ok('1 ics : un VEVENT, un VALARM ACTION:DISPLAY TRIGGER:-PT10M', L1.filter((l) => l === 'BEGIN:VEVENT').length === 1 && L1.includes('BEGIN:VALARM') && L1.includes('ACTION:DISPLAY') && L1.includes('TRIGGER:-PT10M') && L1.includes('END:VALARM'), '');
  ok('1 ics : chaque ligne finit par \\r\\n (aucun \\n ni \\r seul)', ics.endsWith('\r\n') && L1.slice(0, -1).every((l) => !/[\r\n]/.test(l)) && ics.replace(/\r\n/g, '').indexOf('\n') < 0, '');
  const long = 'Préparer le goûter, les affaires de piscine; et réviser l’évaluation de géographie avec les cartes « Europe » ✓ 🎒 jusqu’au bout';
  const icsL = M.ics ? M.ics([Object.assign({}, Q1, { id: 'q-long', titre: long })]) : '';
  const tropLongues = lignes(icsL).filter((l) => octets(l) > 75);
  const casses = lignes(icsL).filter((l) => Buffer.from(l, 'utf8').toString('utf8') !== l || /�/.test(l));
  ok('1 ics : aucune ligne > 75 octets (titre de 130 caractères avec accents et émoji), aucun caractère coupé', icsL && tropLongues.length === 0 && casses.length === 0 && lignes(icsL).some((l) => l.startsWith(' ')), tropLongues.map((l) => octets(l) + ' : ' + l).join(' | '));
  ok('1 ics : le titre se relit entier une fois déplié, virgule et point-virgule échappés', lignes(deplier(icsL)).includes('SUMMARY:' + long.replace(/([,;])/g, '\\$1')), lignes(deplier(icsL)).find((l) => l.startsWith('SUMMARY')) || '');
  const icsS = M.ics ? M.ics([Object.assign({}, Q1, { jours: [0, 2] })]) : '';
  ok('1 ics : jours [0, 2] → RRULE:FREQ=WEEKLY;BYDAY=MO,WE', lignes(icsS).includes('RRULE:FREQ=WEEKLY;BYDAY=MO,WE'), lignes(icsS).filter((l) => l.startsWith('RRULE')).join(' | '));
  // « une semaine sur deux » et « certains jours du mois » (tâche 11) : la même règle dans le .ics, le lien Google et l'intention Android
  const QD = Object.assign({}, Q1, { jours: [0, 2], semaines: 2 }), QM = Object.assign({}, Q1, { joursMois: [15, 1] });
  const icsD = M.ics ? M.ics([QD]) : '', icsM = M.ics ? M.ics([QM]) : '', icsW = M.ics ? M.ics([Object.assign({}, Q1, { semaines: 1 })]) : '';
  ok('1 ics : une semaine sur deux (semaines 2, jours [0, 2]) → RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE', lignes(icsD).includes('RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE'), lignes(icsD).filter((l) => l.startsWith('RRULE')).join(' | '));
  ok('1 ics : certains jours du mois (joursMois [15, 1]) → RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15, au premier de ces jours à partir du 21/10 (DTSTART:20261101T080000)', lignes(icsM).includes('RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15') && lignes(icsM).includes('DTSTART:20261101T080000') && lignes(icsM).includes('DTEND:20261101T083000'), lignes(icsM).filter((l) => /^(RRULE|DT)/.test(l)).join(' | '));
  ok('1 ics : chaque semaine sans jours (semaines 1) → RRULE:FREQ=WEEKLY (plus chaque jour)', lignes(icsW).includes('RRULE:FREQ=WEEKLY'), lignes(icsW).filter((l) => l.startsWith('RRULE')).join(' | '));
  const gD = M.lienGoogleAgenda ? M.lienGoogleAgenda(QD) : '', gM = M.lienGoogleAgenda ? M.lienGoogleAgenda(QM) : '';
  ok('1 lienGoogleAgenda : recur=RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE et recur=RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15 (dates au 01/11)', gD.includes('&recur=RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE') && gM.includes('&recur=RRULE:FREQ=MONTHLY;BYMONTHDAY=1,15') && gM.includes('dates=20261101T080000/20261101T083000'), gD + ' | ' + gM);
  W.navigator.userAgent = ANDROID;
  const iD = M.intentAgenda ? M.intentAgenda(QD) || '' : '', iM = M.intentAgenda ? M.intentAgenda(QM) || '' : '';
  W.navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64)';
  ok('1 intentAgenda (Android) : S.rrule = la même règle (INTERVAL=2 ; MONTHLY;BYMONTHDAY=1,15)', iD.includes(';S.rrule=' + encodeURIComponent('FREQ=WEEKLY;INTERVAL=2;BYDAY=MO,WE') + ';') && iM.includes(';S.rrule=' + encodeURIComponent('FREQ=MONTHLY;BYMONTHDAY=1,15') + ';'), iD.slice(0, 60) + ' … ' + iM.slice(-120));
  const icsSoir = M.ics ? M.ics([Object.assign({}, Q1, { creneau: 'soir', heure: null })]) : '';
  ok('1 ics : créneau soir sans heure → DTSTART:20261021T190000 (V.MOBILE.agenda.heures), DTEND:20261021T193000', lignes(icsSoir).includes('DTSTART:20261021T190000') && lignes(icsSoir).includes('DTEND:20261021T193000'), lignes(icsSoir).filter((l) => l.startsWith('DT')).join(' | '));
  const icsLibre = M.ics ? M.ics([Object.assign({}, Q1, { creneau: 'libre', heure: null, revient: false })]) : '';
  ok('1 ics : créneau libre sans heure → DTSTART;VALUE=DATE:20261021, DTEND;VALUE=DATE:20261022, sans rappel la nuit d’avant, une fois → sans RRULE', lignes(icsLibre).includes('DTSTART;VALUE=DATE:20261021') && lignes(icsLibre).includes('DTEND;VALUE=DATE:20261022') && !lignes(icsLibre).includes('BEGIN:VALARM') && !lignes(icsLibre).some((l) => l.startsWith('RRULE')), lignes(icsLibre).filter((l) => /^(DT|RRULE|BEGIN:VALARM)/.test(l)).join(' | '));
  const icsO = M.ics ? M.ics([Object.assign({}, Q1, { heure: '23:45', revient: false })], { nom: 'Essai', duree: 45, rappelMin: 5 }) : '';
  ok('1 ics : o = { nom, duree, rappelMin } → X-WR-CALNAME:Essai, DTEND le lendemain 00:30, TRIGGER:-PT5M', lignes(icsO).includes('X-WR-CALNAME:Essai') && lignes(icsO).includes('DTSTART:20261021T234500') && lignes(icsO).includes('DTEND:20261022T003000') && lignes(icsO).includes('TRIGGER:-PT5M'), lignes(icsO).filter((l) => /^(X-WR|DT|TRIGGER)/.test(l)).join(' | '));
  const ics2 = M.ics ? M.ics([Q1, Object.assign({}, Q1, { id: 'q2', titre: 'Sac' })]) : '';
  ok('1 ics : deux quêtes → deux VEVENT (UID:q1@athena, UID:q2@athena) ; une liste vide → un calendrier sans VEVENT', lignes(ics2).filter((l) => l === 'BEGIN:VEVENT').length === 2 && lignes(ics2).includes('UID:q2@athena') && !!M.ics && !lignes(M.ics([])).includes('BEGIN:VEVENT') && lignes(M.ics([])).includes('END:VCALENDAR'), '');

  const g = M.lienGoogleAgenda ? M.lienGoogleAgenda(Q1) : '';
  ok('1 lienGoogleAgenda : https://calendar.google.com/calendar/render?action=TEMPLATE, text, dates=20261021T080000/20261021T083000, ctz, recur=RRULE:FREQ=DAILY', g.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE') && g.includes('text=Ranger%20ma%20chambre') && g.includes('dates=20261021T080000/20261021T083000') && /[?&]ctz=[A-Za-z_]+(%2F|\/)?/.test(g) && g.includes('recur=RRULE:FREQ=DAILY'), g);
  const gL = M.lienGoogleAgenda ? M.lienGoogleAgenda(Object.assign({}, Q1, { creneau: 'libre', heure: null, revient: false })) : '';
  ok('1 lienGoogleAgenda : journée entière → dates=20261021/20261022, sans recur', gL.includes('dates=20261021/20261022') && !gL.includes('recur='), gL);
  ok('1 intentAgenda : null hors Android', M.intentAgenda ? M.intentAgenda(Q1) === null : false, '');
  W.navigator.userAgent = ANDROID;
  const it = M.intentAgenda ? M.intentAgenda(Q1) || '' : '';
  const debut = new Date(2026, 9, 21, 8, 0).getTime();
  ok('1 intentAgenda (Android) : intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event, titre, l.beginTime/l.endTime, S.rrule, S.browser_fallback_url encodé, ;end', it.startsWith('intent:#Intent;action=android.intent.action.INSERT') && it.includes(';type=vnd.android.cursor.item/event') && it.includes(';S.title=Ranger%20ma%20chambre') && it.includes(';l.beginTime=' + debut + ';') && it.includes(';l.endTime=' + (debut + 30 * 6e4) + ';') && it.includes(';S.rrule=FREQ%3DDAILY') && it.includes(';S.browser_fallback_url=' + encodeURIComponent(g) + ';') && it.endsWith(';end'), it);
  W.navigator.userAgent = 'Mozilla/5.0 (X11; Linux x86_64)';

  // google : prêt seulement avec un ID client ; relier charge Google Identity à la demande ; envoyer cherche avant d'écrire (pas de doublon)
  ok('1 google.pret() : false avec l’ID vide', M.google ? M.google.pret() === false : false, '');
  ok('1 google.relier() sans ID : false, aucun script chargé', M.google ? (await M.google.relier()) === false && W.__ajoutes.length === 0 : false, '');
  W.AthenaMobileConfig = Object.assign(W.AthenaMobileConfig || {}, { googleClientId: 'x' });
  ok('1 google.pret() : true avec googleClientId = \'x\'', M.google ? M.google.pret() === true : false, '');
  let cfgJeton = null;
  const oauth2 = { initTokenClient(c) { cfgJeton = c; return { requestAccessToken() { setTimeout(() => c.callback({ access_token: 'jeton-essai', expires_in: 3600 }), 0); } }; } };
  const rel = M.google ? M.google.relier() : Promise.resolve(false);
  await new Promise((r) => setTimeout(r, 20));
  const s = W.__ajoutes.find((e) => e.tagName === 'SCRIPT');
  ok('1 google.relier() : charge https://accounts.google.com/gsi/client à la demande', !!s && s.src === 'https://accounts.google.com/gsi/client', JSON.stringify(W.__ajoutes.map((e) => e.src)));
  if (s && typeof s.onload === 'function') { W.google = { accounts: { oauth2 } }; s.onload(); }
  const relie = await Promise.race([rel, new Promise((r) => setTimeout(() => r('délai'), 2000))]);
  ok('1 google.relier() → true ; initTokenClient({ client_id: \'x\', scope: …/auth/calendar.events, callback })', relie === true && !!cfgJeton && cfgJeton.client_id === 'x' && cfgJeton.scope === 'https://www.googleapis.com/auth/calendar.events' && typeof cfgJeton.callback === 'function', String(relie) + ' ' + JSON.stringify(cfgJeton && { client_id: cfgJeton.client_id, scope: cfgJeton.scope }));
  const appels = [];
  W.fetch = (url, init) => {
    init = init || {}; const a = { url: String(url), methode: init.method || 'GET', auth: (init.headers || {}).Authorization, corps: init.body ? JSON.parse(init.body) : null }; appels.push(a);
    const u = new URL(a.url); let data = {};
    if (a.methode === 'GET' && u.searchParams.get('privateExtendedProperty')) data = { items: u.searchParams.get('privateExtendedProperty') === 'athena=q2' ? [{ id: 'ev-q2' }] : [] };
    else if (a.methode === 'GET' && u.searchParams.get('timeMin')) data = { items: [{ summary: 'Réunion', start: { dateTime: new Date(2026, 9, 21, 9, 30).toISOString() } }, { summary: 'Anniversaire', start: { date: '2026-10-21' } }, { summary: 'Annulé', status: 'cancelled', start: { dateTime: new Date(2026, 9, 21, 11, 0).toISOString() } }] };
    else data = { id: 'ev-nouveau' };
    return Promise.resolve({ ok: true, status: 200, json: () => Promise.resolve(data) });
  };
  const n = M.google ? await M.google.envoyer([Q1, Object.assign({}, Q1, { id: 'q2', titre: 'Sac', jours: [0, 2] }), Object.assign({}, Q1, { id: 'q3', titre: 'Lire', creneau: 'libre', heure: null, revient: false })]) : 0;
  const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const cherche = appels.filter((a) => a.methode === 'GET' && a.url.includes('privateExtendedProperty'));
  const post = appels.filter((a) => a.methode === 'POST'), put = appels.filter((a) => a.methode === 'PUT');
  ok('1 google.envoyer(3 quêtes) → 3 ; une recherche privateExtendedProperty=athena=<id> avant chaque écriture, jeton Bearer', n === 3 && cherche.length === 3 && cherche.every((a) => a.url.startsWith(API + '?') && a.auth === 'Bearer jeton-essai') && cherche.some((a) => new URL(a.url).searchParams.get('privateExtendedProperty') === 'athena=q1'), 'n=' + n + ' ' + appels.map((a) => a.methode + ' ' + a.url).join(' | '));
  const p1 = post.find((a) => a.corps && a.corps.extendedProperties && a.corps.extendedProperties.private.athena === 'q1');
  ok('1 google.envoyer : POST …/calendars/primary/events pour une quête nouvelle, extendedProperties.private.athena = id, début/fin locaux avec fuseau, RRULE, rappel 10 min', post.length === 2 && post.every((a) => a.url === API) && !!p1 && p1.corps.summary === 'Ranger ma chambre' && p1.corps.start.dateTime === '2026-10-21T08:00:00' && p1.corps.end.dateTime === '2026-10-21T08:30:00' && !!p1.corps.start.timeZone && JSON.stringify(p1.corps.recurrence) === '["RRULE:FREQ=DAILY"]' && p1.corps.reminders && p1.corps.reminders.overrides && p1.corps.reminders.overrides[0].minutes === 10, JSON.stringify(p1 && p1.corps));
  ok('1 google.envoyer : une quête déjà envoyée (trouvée par sa propriété) est mise à jour (PUT …/events/ev-q2), jamais doublée', put.length === 1 && put[0].url === API + '/ev-q2' && put[0].corps.extendedProperties.private.athena === 'q2' && JSON.stringify(put[0].corps.recurrence) === '["RRULE:FREQ=WEEKLY;BYDAY=MO,WE"]', JSON.stringify(put.map((a) => a.url)));
  const p3 = post.find((a) => a.corps && a.corps.extendedProperties && a.corps.extendedProperties.private.athena === 'q3');
  ok('1 google.envoyer : journée entière → start.date / end.date, sans récurrence', !!p3 && p3.corps.start.date === '2026-10-21' && p3.corps.end.date === '2026-10-22' && !p3.corps.recurrence, JSON.stringify(p3 && p3.corps));
  appels.length = 0;
  const rdv = M.google ? await M.google.rendezVousDuJour('2026-10-21') : [];
  const lu = appels[0] ? new URL(appels[0].url) : null;
  ok('1 google.rendezVousDuJour(\'2026-10-21\') : events.list du jour (timeMin/timeMax locaux, singleEvents, orderBy=startTime) → [{ t, heure }]', !!lu && lu.origin + lu.pathname === API && new Date(lu.searchParams.get('timeMin')).getTime() === new Date(2026, 9, 21).getTime() && new Date(lu.searchParams.get('timeMax')).getTime() === new Date(2026, 9, 22).getTime() && lu.searchParams.get('singleEvents') === 'true' && lu.searchParams.get('orderBy') === 'startTime' && JSON.stringify(rdv) === JSON.stringify([{ t: 'Réunion', heure: '09:30' }, { t: 'Anniversaire', heure: null }]), JSON.stringify(rdv) + ' ' + (lu ? lu.search : ''));
  W.fetch = () => Promise.resolve({ ok: false, status: 401, json: () => Promise.resolve({}) });
  const n401 = M.google ? await M.google.envoyer([Q1]) : -1;
  ok('1 google.envoyer : une réponse 401 → 0 envoi, sans exception', n401 === 0, String(n401));
  W.google = { accounts: { oauth2: { initTokenClient() { throw new Error('refus'); } } } };
  const t0 = Date.now(), rk = M.google ? await Promise.race([M.google.relier(), new Promise((r) => setTimeout(() => r('délai'), 2000))]) : null;
  ok('1 google.relier() : Google Identity qui lève une erreur → false tout de suite (rien ne reste en attente)', rk === false && Date.now() - t0 < 1000, String(rk));

  // Google Identity préchargé (la carte Téléphone ouverte, profil Parent, ID renseigné) : relier() appelle alors requestAccessToken tout de suite,
  // dans le geste (la fenêtre de Google n'est pas bloquée) ; sans ID, rien n'est chargé
  const W2 = fenetre(), M2 = W2.AthenaMobile || {};
  const pre0 = M2.google && typeof M2.google.precharger === 'function' ? await M2.google.precharger() : 'absent';
  W2.AthenaMobileConfig = { googleClientId: 'x' };
  const preP = M2.google && typeof M2.google.precharger === 'function' ? M2.google.precharger() : Promise.resolve('absent');
  const s2 = W2.__ajoutes.find((e) => e.tagName === 'SCRIPT');
  let dansGeste = null;
  if (s2 && typeof s2.onload === 'function') { W2.google = { accounts: { oauth2: { initTokenClient: (c) => ({ requestAccessToken() { dansGeste = true; setTimeout(() => c.callback({ access_token: 'j2', expires_in: 3600 }), 0); } }) } } }; s2.onload(); }
  const pre1 = await Promise.race([preP, new Promise((r) => setTimeout(() => r('délai'), 2000))]);
  ok('1 google.precharger() : rien sans ID (false, aucun script) ; avec un ID, charge https://accounts.google.com/gsi/client → true', pre0 === false && pre1 === true && !!s2 && s2.src === 'https://accounts.google.com/gsi/client' && W2.__ajoutes.filter((e) => e.tagName === 'SCRIPT').length === 1, 'sans ID=' + pre0 + ' avec=' + pre1);
  dansGeste = false;
  const rel2 = M2.google ? M2.google.relier() : Promise.resolve(false);
  const synchrone = dansGeste;
  ok('1 google.relier() après le préchargement : requestAccessToken appelé tout de suite (dans le geste), puis → true', synchrone === true && (await Promise.race([rel2, new Promise((r) => setTimeout(() => r('délai'), 2000))])) === true, 'synchrone=' + synchrone);

  // 2 · dans Chromium
  const b = await lancer();
  const nomsQuetes = (profil) => (V.JOURNEES[profil] || []).filter((x) => x[4]).map((x) => [x[1], x[4]]);
  // (les hauteurs en px CSS de la maquette, offsetHeight, comme test/mobile_notif.js : le téléphone de 390 × 844 est mis à l’échelle de la fenêtre)
  // Ce que les pages du test ouvrent : les liens (Google, intention Android) sont notés au lieu d'être suivis
  const LIENS = `window.__liens = []; document.addEventListener('click', (e) => { const a = e.target && e.target.closest && e.target.closest('a[href]'); if (a && /^(intent:|https:\\/\\/calendar\\.google\\.com)/.test(a.getAttribute('href'))) { window.__liens.push({ href: a.getAttribute('href'), target: a.target || '' }); e.preventDefault(); } }, true);`;
  const SANS_PARTAGE = `try { delete Navigator.prototype.share; delete Navigator.prototype.canShare; } catch (e) {}`;
  // window.__logique() : la logique du Prototype (l'instance du composant), trouvée par la fibre React de la maquette
  const LOGIQUE = `window.__logique = () => { const el = document.querySelector('${PH}'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.jourAgenda === 'function') return s.logic; f = f.return; } return null; };`;
  // Le téléphone le 21/10/2026 à 7 h 45 : maintenant(S) rendu réel le temps d'une action de la logique (exporterIcs, rdvGoogle), puis rendu au jeu
  // (ce que la tâche 10 fait pour de bon en mode téléphone) ; renvoie jourAgenda() vu pendant l'action
  const TEL = new Date(2026, 9, 21, 7, 45).getTime();
  const commeTelephone = (p, action) => p.evaluate(([a, t]) => { const L = window.__logique && window.__logique(); if (!L) return null; L.maintenant = () => t; try { L[a](); return L.jourAgenda(); } finally { delete L.maintenant; } }, [action, TEL]);
  const JOUR_JEU = String(V.DEMO && V.DEMO.date).replace(/-/g, '');
  const PARTAGE = `window.__partage = null; Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: (d) => !!(d && d.files) }); Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: (d) => { window.__partage = (d.files || []).map((f) => [f.name, f.type]); return Promise.resolve(); } });`;
  // Le Prototype chargé et sa scène montée (window.__scene, posé par l'espion de _commun.js) : avec le rendu logiciel des tests, un clic attend
  // 3 à 5 s que la page le traite tant que la scène s'installe (mesuré : 2,9 à 5 s par clic) ; d'où des délais de 20 s
  const pret = async (p) => {
    await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
    await p.waitForFunction(() => !!window.__scene && !!(window.__logique && window.__logique()), null, { timeout: 30000 }).catch(() => {});
  };
  const page = async (hash, o) => {
    o = Object.assign({ init: '' }, o);
    const p = await ouvrir(b, 'Prototype.dc.html#' + hash, Object.assign({}, o, { delai: 0, init: LIENS + LOGIQUE + o.init }));
    p.setDefaultTimeout(20000);
    await pret(p);
    return p;
  };
  // La même page rouverte sur une autre adresse (même contexte)
  const rouvrir = async (p, de, vers) => { await p.goto(p.url().replace(de, vers), { waitUntil: 'load' }); await p.reload({ waitUntil: 'load' }); await pret(p); };
  const clic = (p, sel) => p.click(sel).then(() => true, () => false);
  // L'état attendu après un geste (au plus 20 s) : jamais une attente fixe ; false si l'état n'est pas venu (le ✗ qui suit le dit)
  const attendre = (p, f, arg) => p.waitForFunction(f, arg, { timeout: 20000 }).then(() => true, () => false);
  const feuille = (p) => p.waitForSelector('[data-el="opts_agenda"] button', { timeout: 20000 }).then(() => true, () => false);
  const haut = (p, sel) => p.$$eval(sel, (L) => L.map((x) => x.offsetHeight));
  const lireTelechargement = async (dl) => { if (!dl) return { nom: '', texte: '' }; const f = await dl.path().catch(() => null); return { nom: dl.suggestedFilename(), texte: f ? fs.readFileSync(f, 'utf8') : '' }; };
  const telecharger = (p, sel) => Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null), clic(p, sel)]).then(([d]) => lireTelechargement(d));
  const OPTS_AG = 'button:has-text("Mettre dans mon agenda")';
  const CH = (k) => '[data-el="opts_agenda"] button:has-text("' + TX(k) + '")';
  const erreurs = [];

  // 2a · Ado, navigateur sans partage : les options d'une quête → « Mettre dans mon agenda » → 2 choix ; « Fichier .ics » → téléchargement
  let p = await page('ecran=options&nouv=tout', { init: SANS_PARTAGE });
  const hBtn = await haut(p, OPTS_AG);
  ok('2a options d’une quête (Ado) : un bouton « Mettre dans mon agenda » (≥ 44 px)', hBtn.length === 1 && hBtn[0] >= 44, JSON.stringify(hBtn));
  const titreQ = await p.$eval('[data-el="opts_actions"]', (el) => { const f = el.parentElement; const s = f && f.querySelector('span[data-t] + span[data-t], span[data-t]'); return s ? s.textContent.trim() : ''; }).catch(() => '');
  await clic(p, OPTS_AG); await feuille(p);
  const choix = await p.$$eval('[data-el="opts_agenda"] button', (L) => L.map((x) => ({ t: x.textContent.replace(/\s+/g, ' ').trim(), h: x.offsetHeight }))).catch(() => []);
  ok('2a hors Android : la feuille montre 2 choix (≥ 44 px) « Google Agenda » et « Fichier .ics (Apple Calendrier, autres) », pas l’app Agenda du téléphone', choix.length === 2 && choix.every((c) => c.h >= 44) && choix[0].t === TX('mob.agenda.google') && choix[1].t === TX('mob.agenda.ics'), JSON.stringify(choix));
  const d1 = await telecharger(p, CH('mob.agenda.ics'));
  ok('2a « Fichier .ics » sans navigator.share → un téléchargement quetes-athena.ics (un VEVENT, la quête de la feuille)', d1.nom === 'quetes-athena.ics' && /^BEGIN:VCALENDAR\r\n/.test(d1.texte) && lignes(d1.texte).filter((l) => l === 'BEGIN:VEVENT').length === 1 && !!titreQ && deplier(d1.texte).includes('SUMMARY:' + titreQ), d1.nom + ' · ' + titreQ + ' · ' + lignes(deplier(d1.texte)).filter((l) => /^(SUMMARY|DTSTART|RRULE)/.test(l)).join(' | '));
  ok('2a après le choix, la feuille des options se ferme', (await p.$$('[data-el="opts_agenda"]')).length === 0, '');
  erreurs.push(...p.errs.map((e) => '2a ' + e)); await p.context().close();

  // 2b · mode=agenda par l'adresse, partage disponible → navigator.share({ files }) d'un fichier text/calendar, pas de téléchargement
  p = await page('ecran=options&mode=agenda&nouv=tout', { init: PARTAGE });
  let dl2 = 0; p.on('download', () => { dl2++; });
  await clic(p, CH('mob.agenda.ics')); await attendre(p, () => window.__partage != null);
  const partage = await p.evaluate(() => window.__partage);
  ok('2b #ecran=options&mode=agenda ouvre la feuille ; avec le partage du téléphone : navigator.share d’un fichier quetes-athena.ics (text/calendar), sans téléchargement', JSON.stringify(partage) === '[["quetes-athena.ics","text/calendar"]]' && dl2 === 0, JSON.stringify(partage) + ' téléchargements=' + dl2);
  erreurs.push(...p.errs.map((e) => '2b ' + e)); await p.context().close();

  // 2c · Android (Pixel) : 3 choix ; « Google Agenda » → le lien ; « L'app Agenda du téléphone » → l'intention
  p = await page('ecran=options&nouv=tout', { contexte: { userAgent: ANDROID } });
  await clic(p, OPTS_AG); await feuille(p);
  const choixA = await p.$$eval('[data-el="opts_agenda"] button', (L) => L.map((x) => ({ t: x.textContent.replace(/\s+/g, ' ').trim(), h: x.offsetHeight }))).catch(() => []);
  ok('2c Android : 3 choix (≥ 44 px) : Google Agenda, Fichier .ics, L’app Agenda du téléphone', choixA.length === 3 && choixA.every((c) => c.h >= 44) && choixA.map((c) => c.t).join('|') === [TX('mob.agenda.google'), TX('mob.agenda.ics'), TX('mob.agenda.tel')].join('|'), JSON.stringify(choixA));
  await clic(p, CH('mob.agenda.google')); await attendre(p, () => window.__liens.length >= 1);
  const liens = await p.evaluate(() => window.__liens);
  // (la feuille s'est fermée après le choix : on la rouvre par l'adresse, la page rechargée)
  await rouvrir(p, 'ecran=options', 'ecran=options&mode=agenda');
  await feuille(p); await clic(p, CH('mob.agenda.tel')); await attendre(p, () => window.__liens.length >= 1);
  liens.push(...(await p.evaluate(() => window.__liens)));
  ok('2c « Google Agenda » ouvre calendar.google.com/calendar/render?action=TEMPLATE… dans un nouvel onglet', !!liens[0] && liens[0].href.startsWith('https://calendar.google.com/calendar/render?action=TEMPLATE') && /dates=\d{8}T\d{6}\/\d{8}T\d{6}/.test(liens[0].href) && liens[0].target === '_blank', JSON.stringify(liens[0]));
  ok('2c « L’app Agenda du téléphone » ouvre intent:#Intent;action=android.intent.action.INSERT… avec le lien Google en secours', !!liens[1] && liens[1].href.startsWith('intent:#Intent;action=android.intent.action.INSERT') && liens[1].href.includes(';S.browser_fallback_url=https%3A%2F%2Fcalendar.google.com') && liens[1].href.endsWith(';end'), JSON.stringify(liens[1]));
  erreurs.push(...p.errs.map((e) => '2c ' + e)); await p.context().close();

  // 2d · Carnet › Téléphone (Ado) : la carte agenda après les notifications, l'export .ics des quêtes à heure, pas de Google (ID vide, et Ado)
  p = await page('ecran=journal&tab=carnet&nouv=tout', { init: SANS_PARTAGE });
  const ordre = await p.$$eval('[data-el="telephone"] > [data-el]', (L) => L.map((x) => x.getAttribute('data-el'))).catch(() => []);
  const EXP = '[data-el="telephone"] [data-el="agenda"] button:has-text("' + TX('mob.agenda.export') + '")';
  const hExp = await haut(p, EXP);
  ok('2d Carnet › Téléphone : la carte agenda vient après celle des notifications, « Exporter mes quêtes à heure (.ics) » (≥ 44 px)', ordre.indexOf('agenda') > ordre.indexOf('notifs') && ordre.indexOf('notifs') >= 0 && hExp.length === 1 && hExp[0] >= 44, JSON.stringify(ordre) + ' ' + JSON.stringify(hExp));
  ok('2d « Relier Google Agenda » absent quand googleClientId est vide', (await p.$$('button:has-text("' + TX('mob.agenda.relier') + '")')).length === 0, '');
  const d2 = await telecharger(p, EXP);
  const attendus = nomsQuetes('enfant');
  const LD = lignes(deplier(d2.texte));
  ok('2d l’export : quetes-athena.ics, un VEVENT par quête à heure précise (' + attendus.length + ' pour Ado), à leur heure', d2.nom === 'quetes-athena.ics' && LD.filter((l) => l === 'BEGIN:VEVENT').length === attendus.length && attendus.every(([t, h]) => LD.includes('SUMMARY:' + t) && LD.some((l) => l.startsWith('DTSTART:') && l.endsWith('T' + h.replace(':', '') + '00'))), d2.nom + ' · ' + LD.filter((l) => /^(SUMMARY|DTSTART)/.test(l)).join(' | '));
  const dtJeu = LD.filter((l) => l.startsWith('DTSTART'));
  ok('2d dans le hub, l’export commence au jour de l’horloge du jeu (V.DEMO.date, journée 1 : DTSTART:' + JOUR_JEU + 'T…)', JOUR_JEU.length === 8 && dtJeu.length === attendus.length && dtJeu.every((l) => l.startsWith('DTSTART:' + JOUR_JEU + 'T')), dtJeu.join(' | '));
  const [dTel, jTel] = await Promise.all([p.waitForEvent('download', { timeout: 30000 }).catch(() => null).then(lireTelechargement), commeTelephone(p, 'exporterIcs')]);
  const dtTel = lignes(deplier(dTel.texte)).filter((l) => l.startsWith('DTSTART'));
  ok('2d le jour suit maintenant(S) : le téléphone le 21/10/2026 à 7 h 45 → jourAgenda() = 2026-10-21, l’export commence le 21/10 (DTSTART:20261021T…, ' + attendus.length + ' VEVENT), pas à la date de démonstration', jTel === '2026-10-21' && dTel.nom === 'quetes-athena.ics' && dtTel.length === attendus.length && dtTel.every((l) => l.startsWith('DTSTART:20261021T')), String(jTel) + ' · ' + dTel.nom + ' · ' + dtTel.join(' | '));
  // l'adaptateur du Prototype : « une semaine sur deux » → semaines 2 et ses jours ; « certains jours du mois » → joursMois (22/10 : plus d'écran pour en créer,
  // une ancienne quête « mois » posée dans l'état garde ses jours tels quels) ; une ancienne quête « mois » sans jours du mois reste une seule fois
  const adapt = await p.evaluate(() => new Promise((res) => { const L = window.__logique(); const n = (L.state.quetes || []).length;
    L.setState({ quetes: (L.state.quetes || []).concat({ id: 'q-mois', k: null, t: 'Arroser les plantes', ic: 'plante', cr: 'matin', h: '08:00', rec: 'mois', mois: [5, 20], fait: false, etapes: [], timer: null, report: false }) }, () => { setTimeout(() => {
      const q = (L.state.quetes || [])[n] || null, a = (x) => { const r = L.queteAgenda(x); return { revient: r.revient, jours: r.jours, semaines: r.semaines == null ? null : r.semaines, joursMois: r.joursMois == null ? null : r.joursMois }; };
      res({ cree: q && { mois: q.mois, rec: q.rec }, mois: q && a(q), deux: a({ id: 'd', t: 'x', h: '08:00', cr: 'matin', rec: 'deux', jours: [1, 3] }), semaine: a({ id: 's', t: 'x', h: '08:00', cr: 'matin', rec: 'semaine', jours: [4] }), ancien: a({ id: 'm', t: 'x', h: '08:00', cr: 'matin', rec: 'mois' }) }); }, 300); }); }));
  ok('2d adaptateur : « une semaine sur deux » → semaines 2 + jours ; « chaque semaine » → semaines 1 ; « certains jours du mois » (ancienne quête, mois [5, 20] gardés tels quels : plus d’écran pour en créer depuis le 22/10) → joursMois [5, 20] ; « mois » sans jours → une fois', JSON.stringify(adapt.cree) === '{"mois":[5,20],"rec":"mois"}' && JSON.stringify(adapt.mois) === '{"revient":true,"jours":null,"semaines":null,"joursMois":[5,20]}' && JSON.stringify(adapt.deux) === '{"revient":true,"jours":[1,3],"semaines":2,"joursMois":null}' && JSON.stringify(adapt.semaine) === '{"revient":true,"jours":[4],"semaines":1,"joursMois":null}' && adapt.ancien.revient === false && adapt.ancien.joursMois === null, JSON.stringify(adapt));
  erreurs.push(...p.errs.map((e) => '2d ' + e)); await p.context().close();

  // 2e · aucune quête à heure → « Aucune quête à heure pour l'instant. », pas de bouton d'export
  p = await page('ecran=journal&tab=carnet&nouv=tout&vide=1');
  const txtAg = await p.$eval('[data-el="telephone"] [data-el="agenda"]', (el) => el.textContent.replace(/\s+/g, ' ').trim()).catch(() => '');
  ok('2e sans quête à heure : « Aucune quête à heure pour l’instant. » et pas de bouton d’export', txtAg.includes(TX('mob.agenda.rien')) && !txtAg.includes(TX('mob.agenda.export')), txtAg);
  erreurs.push(...p.errs.map((e) => '2e ' + e)); await p.context().close();

  // 2f · Parent, ID vide → pas de Google ; Ado avec un ID → pas de Google (les comptes Family Link ne peuvent pas consentir)
  p = await page('ecran=journal&tab=carnet&nouv=tout&profil=adulte');
  ok('2f Parent, googleClientId vide : « Relier Google Agenda » absent', (await p.$$('button:has-text("' + TX('mob.agenda.relier') + '")')).length === 0, '');
  erreurs.push(...p.errs.map((e) => '2f ' + e)); await p.context().close();
  const ID = `window.AthenaMobileConfig = { googleClientId: 'x' };`;
  p = await page('ecran=journal&tab=carnet&nouv=tout&profil=enfant', { init: ID });
  ok('2f Ado, googleClientId = \'x\' : « Relier Google Agenda » absent', (await p.$$('button:has-text("' + TX('mob.agenda.relier') + '")')).length === 0, '');
  erreurs.push(...p.errs.map((e) => '2f ' + e)); await p.context().close();

  // 2g · Parent, googleClientId = 'x' (addInitScript) : relier → envoyer → « C'est dans ton agenda. » ; voir les rendez-vous du jour (t · heure)
  const GOOGLE = `window.google = { accounts: { oauth2: { initTokenClient: (c) => ({ requestAccessToken: () => setTimeout(() => c.callback({ access_token: 'jeton-essai', expires_in: 3600 }), 50) }) } } };`;
  const apiAppels = [];
  let panne = false, vide = false;
  p = await page('ecran=journal&tab=carnet&nouv=tout&profil=adulte', { init: ID + GOOGLE, avant: (q) => q.route(/^https:\/\/(www\.googleapis\.com|accounts\.google\.com)\//, async (r) => {
    const rq = r.request(), u = new URL(rq.url()), m = rq.method();
    const CORS = { 'access-control-allow-origin': '*', 'access-control-allow-methods': 'GET, POST, PUT, PATCH, OPTIONS', 'access-control-allow-headers': 'authorization, content-type' };
    if (m === 'OPTIONS') return r.fulfill({ status: 204, headers: CORS, body: '' });
    apiAppels.push({ m, u: rq.url(), auth: (await rq.allHeaders()).authorization || '' });
    if (u.hostname === 'accounts.google.com') return r.fulfill({ status: 200, contentType: 'text/javascript', body: '' });
    if (panne && u.hostname === 'www.googleapis.com' && !u.searchParams.get('timeMin')) return r.fulfill({ status: 500, contentType: 'application/json', headers: CORS, body: '{}' });
    if (vide && m === 'GET' && u.searchParams.get('timeMin')) return r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: '{"items":[]}' });
    let body = { id: 'ev' };
    if (m === 'GET' && u.searchParams.get('privateExtendedProperty')) body = { items: [] };
    else if (m === 'GET' && u.searchParams.get('timeMin')) { const d = new Date(u.searchParams.get('timeMin')); body = { items: [{ summary: 'Réunion', start: { dateTime: new Date(d.getFullYear(), d.getMonth(), d.getDate(), 9, 30).toISOString() } }, { summary: 'Anniversaire', start: { date: '2026-11-23' } }] }; }
    return r.fulfill({ status: 200, contentType: 'application/json', headers: CORS, body: JSON.stringify(body) });
  }) });
  const REL = '[data-el="agenda"] button:has-text("' + TX('mob.agenda.relier') + '")';
  const hRel = await haut(p, REL);
  ok('2g Parent, googleClientId = \'x\' (addInitScript) : « Relier Google Agenda » présent (≥ 44 px)', hRel.length === 1 && hRel[0] >= 44, JSON.stringify(hRel));
  const ENV = '[data-el="agenda"] button:has-text("' + TX('mob.agenda.envoyer') + '")', JOUR = '[data-el="agenda"] button:has-text("' + TX('mob.agenda.jour') + '")';
  await clic(p, REL); await p.waitForSelector(ENV, { timeout: 20000 }).catch(() => {});
  const hEnv = await haut(p, ENV), hJour = await haut(p, JOUR);
  ok('2g relié : « Envoyer mes quêtes à heure » et « Voir les rendez-vous du jour » (≥ 44 px), « Relier » disparaît', hEnv.length === 1 && hEnv[0] >= 44 && hJour.length === 1 && hJour[0] >= 44 && (await p.$$(REL)).length === 0, JSON.stringify({ hEnv, hJour }));
  const nAdulte = nomsQuetes('adulte').length;
  await clic(p, ENV); await attendre(p, (t) => [...document.querySelectorAll('[data-el="toast"]')].some((x) => x.textContent.includes(t)), TX('mob.agenda.fait'));
  const ecrits = apiAppels.filter((a) => a.m === 'POST' || a.m === 'PUT');
  ok('2g « Envoyer » : une recherche puis une écriture par quête à heure (' + nAdulte + ' pour Parent), jeton Bearer ; « C’est dans ton agenda. »', ecrits.length === nAdulte && apiAppels.filter((a) => a.m === 'GET' && a.u.includes('privateExtendedProperty')).length === nAdulte && ecrits.every((a) => a.auth === 'Bearer jeton-essai') && (await p.$$('[data-el="toast"]:has-text("' + TX('mob.agenda.fait') + '")')).length >= 1, apiAppels.map((a) => a.m + ' ' + a.u.slice(0, 90)).join(' | '));
  await clic(p, JOUR); await p.waitForSelector('[data-el="agenda"] [data-el="rdv"] [role="listitem"]', { timeout: 20000 }).catch(() => {});
  const rdvT = await p.$$eval('[data-el="agenda"] [data-el="rdv"] [role="listitem"]', (L) => L.map((x) => { const y = x.cloneNode(true); y.querySelectorAll('button').forEach((b) => b.remove()); return y.textContent.replace(/\s+/g, ' ').trim(); })).catch(() => []);
  const lj = apiAppels.find((a) => a.m === 'GET' && a.u.includes('timeMin'));
  const tMin = lj ? new Date(new URL(lj.u).searchParams.get('timeMin')) : null;
  ok('2g « Voir les rendez-vous du jour » : events.list du jour du jeu (minuit local), la liste « t · heure » dans le Carnet', !!tMin && tMin.getHours() === 0 && tMin.getMinutes() === 0 && JSON.stringify(rdvT) === JSON.stringify(['Réunion · 9 h 30', 'Anniversaire']), JSON.stringify(rdvT) + ' ' + (lj ? lj.u.slice(0, 160) : 'aucun appel'));
  ok('2g dans le hub, le jour demandé est celui de l’horloge du jeu (timeMin = minuit local du ' + (V.DEMO && V.DEMO.date) + ')', !!tMin && tMin.getTime() === new Date(V.DEMO.date + 'T00:00:00').getTime(), tMin ? tMin.toString() : 'aucun appel');
  const nJour = apiAppels.filter((a) => a.m === 'GET' && a.u.includes('timeMin')).length;
  const jRdv = await commeTelephone(p, 'rdvGoogle');
  for (let i = 0; i < 100 && apiAppels.filter((a) => a.m === 'GET' && a.u.includes('timeMin')).length <= nJour; i++) await p.waitForTimeout(200);
  const ljTel = apiAppels.filter((a) => a.m === 'GET' && a.u.includes('timeMin'))[nJour];
  const tMinTel = ljTel ? new Date(new URL(ljTel.u).searchParams.get('timeMin')) : null, tMaxTel = ljTel ? new Date(new URL(ljTel.u).searchParams.get('timeMax')) : null;
  ok('2g le jour suit maintenant(S) : le téléphone le 21/10/2026 à 7 h 45 → « Voir les rendez-vous du jour » interroge le 21/10 (timeMin/timeMax = minuit local du 21 et du 22)', jRdv === '2026-10-21' && !!tMinTel && tMinTel.getTime() === new Date(2026, 9, 21).getTime() && tMaxTel.getTime() === new Date(2026, 9, 22).getTime(), String(jRdv) + ' · ' + (ljTel ? ljTel.u.slice(0, 200) : 'aucun appel'));
  // rien n'est parti (l'API répond 500) → « Rien n’est parti : réessaie plus tard. » ; aucun rendez-vous ce jour-là → « Aucun rendez-vous aujourd’hui. »,
  // dans la zone aria-live="polite" de la carte
  const LIVE = '[data-el="agenda"] [data-el="ag_msg"][aria-live="polite"]';
  // (les réponses 500 voulues ici laissent « Failed to load resource » dans la console : retirées de la liste des erreurs de la page)
  const avantPanne = p.errs.length;
  panne = true;
  await clic(p, ENV); const vuRate = await attendre(p, ([s, t]) => { const z = document.querySelector(s); return !!z && z.textContent.includes(t); }, [LIVE, TX('mob.agenda.rate')]);
  const zRate = await p.$eval(LIVE, (z) => z.textContent.trim()).catch(() => null);
  ok('2g l’envoi rend 0 (l’API répond 500) → « Rien n’est parti : réessaie plus tard. » dans la zone aria-live="polite", sans « C’est dans ton agenda. » de plus', vuRate && zRate === TX('mob.agenda.rate'), String(zRate));
  panne = false; vide = true;
  for (let i = p.errs.length - 1; i >= avantPanne; i--) if (/status of 500/.test(p.errs[i])) p.errs.splice(i, 1);
  await clic(p, JOUR); const vuVide = await attendre(p, ([s, t]) => { const z = document.querySelector(s); return !!z && z.textContent.includes(t); }, [LIVE, TX('mob.agenda.vide')]);
  const zVide = await p.$eval(LIVE, (z) => z.textContent.trim()).catch(() => null), listeVide = (await p.$$('[data-el="agenda"] [data-el="rdv"] [role="listitem"]')).length;
  ok('2g la liste du jour est vide → « Aucun rendez-vous aujourd’hui. » (aria-live="polite"), plus de liste', vuVide && zVide === TX('mob.agenda.vide') && listeVide === 0, String(zVide) + ' liste=' + listeVide);
  vide = false;
  await clic(p, JOUR); const vuListe = await attendre(p, (s) => !document.querySelector(s).textContent.trim(), LIVE);
  ok('2g des rendez-vous de nouveau → la zone se vide', vuListe, '');
  erreurs.push(...p.errs.map((e) => '2g ' + e)); await p.context().close();

  // 2i · Parent avec un ID : Google Identity se charge à l'ouverture de la carte Téléphone (avant tout geste) ; « Relier » appelle alors
  // requestAccessToken dans le geste (window.__clic : le clic en cours, effacé à la tâche suivante)
  const gsiAppels = [];
  const GSI_FAUX = `window.google = { accounts: { oauth2: { initTokenClient: (c) => ({ requestAccessToken: () => { window.__dansGeste = window.__clic === true; setTimeout(() => c.callback({ access_token: 'jeton-essai', expires_in: 3600 }), 50); } }) } } };`;
  const CLIC = `window.__clic = false; document.addEventListener('click', () => { window.__clic = true; setTimeout(() => { window.__clic = false; }, 0); }, true);`;
  p = await page('ecran=journal&tab=carnet&nouv=tout&profil=adulte', { init: ID + CLIC, avant: (q) => q.route(/^https:\/\/accounts\.google\.com\//, (r) => { gsiAppels.push(r.request().url()); r.fulfill({ status: 200, contentType: 'text/javascript', body: GSI_FAUX }); }) });
  const preCharge = await attendre(p, () => !!(window.google && window.google.accounts));
  const avantGeste = gsiAppels.length;
  await clic(p, REL); await p.waitForSelector(ENV, { timeout: 20000 }).catch(() => {});
  const geste = await p.evaluate(() => window.__dansGeste);
  ok('2i la carte Téléphone ouverte (Parent, ID renseigné) : Google Identity chargé avant tout geste (une requête accounts.google.com/gsi/client)', preCharge && avantGeste === 1 && gsiAppels[0] === 'https://accounts.google.com/gsi/client', 'chargé=' + preCharge + ' requêtes=' + JSON.stringify(gsiAppels));
  ok('2i « Relier Google Agenda » : requestAccessToken appelé dans le geste, puis relié (« Envoyer » paraît)', geste === true && (await p.$$(ENV)).length === 1, 'dans le geste=' + geste);
  erreurs.push(...p.errs.map((e) => '2i ' + e)); await p.context().close();

  // 2h · 360 × 640, Veillée d'origine, Parent avec Google : la carte tient, cibles ≥ 44 px, aucun texte sous 13 px
  p = await page('ecran=journal&tab=carnet&nouv=tout&da=origine&profil=adulte', { init: ID, viewport: { width: 360, height: 640 } });
  const c = await p.$eval('[data-el="telephone"] [data-el="agenda"]', (el) => ({ deborde: el.scrollWidth > el.clientWidth + 1, btn: [...el.querySelectorAll('button')].map((x) => x.offsetHeight), petit: [...el.querySelectorAll('span')].filter((s) => s.childElementCount === 0 && s.textContent.trim()).map((s) => parseFloat(getComputedStyle(s).fontSize)).filter((x) => x < 13) })).catch(() => null);
  ok('2h 360 × 640, Veillée d’origine, Parent : la carte agenda tient, boutons ≥ 44 px, aucun texte sous 13 px', !!c && !c.deborde && c.btn.length >= 2 && c.btn.every((h) => h >= 44) && c.petit.length === 0, JSON.stringify(c));
  await rouvrir(p, 'ecran=journal&tab=carnet', 'ecran=options&mode=agenda');
  const fa = await p.$eval('[data-el="opts_agenda"]', (el) => ({ deborde: el.scrollWidth > el.clientWidth + 1, btn: [...el.querySelectorAll('button')].map((x) => x.offsetHeight), petit: [...el.querySelectorAll('span')].filter((s) => s.childElementCount === 0 && s.textContent.trim()).map((s) => parseFloat(getComputedStyle(s).fontSize)).filter((x) => x < 13) })).catch(() => null);
  ok('2h 360 × 640 : la feuille « Mettre dans mon agenda » tient, choix ≥ 44 px, aucun texte sous 13 px', !!fa && !fa.deborde && fa.btn.length >= 2 && fa.btn.every((h) => h >= 44) && fa.petit.length === 0, JSON.stringify(fa));
  erreurs.push(...p.errs.map((e) => '2h ' + e)); await p.context().close();

  ok('2 aucune erreur de page (pageerror) ni de console', erreurs.length === 0, erreurs.join(' | '));
  await b.close();
  process.exitCode = bilan('mobile_agenda') ? 1 : 0;
})().catch((e) => { console.error(e); bilan('mobile_agenda'); process.exit(1); });
