// Rappels des quêtes à heure et agenda vers l'app (21/10).
// 1 · app au premier plan : la quête sonne à son heure par un message dans l'app ; 2 · app cachée : par une notification du téléphone ;
// 3 · app fermée : le service worker la montre depuis le miroir (une fois, dans l'heure qui suit) ; 4 · un fichier .ics : ses rendez-vous
// d'aujourd'hui et ceux qui reviennent deviennent des quêtes, sans double ; un fichier qui n'est pas un agenda le dit ; 5 · rendez-vous Google → quête.
process.chdir(__dirname);
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';
const vm = require('vm'), fs = require('fs');
const { lancer, ouvrir, ok, bilan, ARGS } = require('./_commun');
const PH = '[data-screen-label="Prototype V1"]';
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('${PH}'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.rappelsTick === 'function') return s.logic; f = f.return; } return null; };
  window.__visible = true; Object.defineProperty(document, 'visibilityState', { configurable: true, get: () => (window.__visible ? 'visible' : 'hidden') }); Object.defineProperty(document, 'hidden', { configurable: true, get: () => !window.__visible });`;
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx); vm.runInContext(fs.readFileSync('../demo/athena-v1.js', 'utf8'), ctx);
const V = ctx.ATHENA_V1, TX = (k, v) => { const x = V.TEXTES[k][1]; const s = typeof x === 'string' ? x : x.adulte; return v ? s.replace(/\{(\w+)\}/g, (m, n) => v[n]) : s; };
const pret = (p) => p.waitForFunction(() => window.__logique && window.__logique() && window.__logique().state.pret, null, { timeout: 60000 }).then(() => true, () => false);
const notifs = (p) => p.evaluate(async () => { const r = await Promise.race([navigator.serviceWorker.ready, new Promise((f) => setTimeout(() => f(null), 8000))]); if (!r) return null; return (await r.getNotifications()).map((n) => ({ title: n.title, body: n.body, tag: n.tag })); });
const local = (a, m, j, h, mi) => new Date(a, m - 1, j, h, mi).getTime();
const ics = (lignes) => ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Essai//FR'].concat(lignes, ['END:VCALENDAR']).join('\r\n');
const ev = (uid, dt, titre, rrule) => ['BEGIN:VEVENT', 'UID:' + uid, 'DTSTART' + dt, 'SUMMARY:' + titre].concat(rrule ? ['RRULE:' + rrule] : [], ['END:VEVENT']);

(async () => {
  const b = await lancer({ channel: 'chromium', args: ARGS.concat(['--disable-background-networking', '--disable-component-update']) });
  // 1-3 · l'app ouverte depuis le QR (?app=1 : l'heure du téléphone), à 08:28 le 21/10
  const p = await ouvrir(b, 'Prototype.dc.html?app=1', { delai: 0, sw: true, init: LOGIQUE, permissions: ['notifications'], avant: (q) => q.clock.install({ time: local(2026, 10, 21, 8, 28) }) });
  ok('0 l’app est prête (heure du téléphone)', await pret(p) && (await p.evaluate(() => window.__logique().state.horloge)) === 'telephone');
  await p.evaluate(() => Promise.race([navigator.serviceWorker.ready, new Promise((f) => setTimeout(f, 20000))]));
  await p.evaluate(() => { const L = window.__logique(); L.setState({ notifQuetes: true, ob: 0, fe: null, sheet: null }); L.queteDepuisAgenda({ titre: 'Dentiste', heure: '08:30' }); L.queteDepuisAgenda({ titre: 'Appeler Mamie', heure: '08:31' }); });
  await p.waitForTimeout(600);
  let s = await p.evaluate(() => window.__logique().state.quetes.filter((q) => q.h).map((q) => q.t + ' ' + q.h + ' ' + q.cr + ' ' + q.ic));
  ok('1 deux quêtes à heure ajoutées (créneau du matin, icône agenda)', s.includes('Dentiste 08:30 matin agenda') && s.includes('Appeler Mamie 08:31 matin agenda'), s.join(' | '));
  // avant l'heure : rien
  await p.evaluate(() => window.__logique().rappelsTick()); await p.waitForTimeout(300);
  ok('1 avant 08:30 : aucun rappel', !(await p.evaluate(() => document.body.textContent.includes('C’est l’heure'))));
  // 08:30:30, au premier plan : un message dans l'app
  await p.clock.fastForward('02:30'); await p.evaluate(() => window.__logique().rappelsTick()); await p.waitForTimeout(500);
  const texte = await p.evaluate(() => document.querySelector('[role="status"]') ? [...document.querySelectorAll('[role="status"]')].map((x) => x.textContent).join(' | ') : '');
  ok('1 à 08:30, app au premier plan : « ' + TX('mob.notif.quetes.corps', { q: 'Dentiste' }) + ' » dans l’app', texte.includes(TX('mob.notif.quetes.corps', { q: 'Dentiste' })), texte.slice(0, 160));
  const n0 = await notifs(p);
  ok('1 au premier plan : pas de notification du téléphone en plus', Array.isArray(n0) && n0.length === 0, JSON.stringify(n0));
  await p.evaluate(() => window.__logique().rappelsTick()); await p.waitForTimeout(300);
  ok('1 une seule fois : le rappel ne revient pas au tick suivant', (await p.evaluate(() => Object.keys(JSON.parse(localStorage.getItem('athena-v1-rappels') || '{}')).filter((k) => /:/.test(k)).length)) === 1);
  // 08:31:30, app cachée : une notification du téléphone (titre court, corps « C'est l'heure : Appeler Mamie »)
  await p.evaluate(() => { window.__visible = false; }); await p.clock.fastForward('01:00'); await p.evaluate(() => window.__logique().rappelsTick());
  let L = []; for (let i = 0; i < 20 && !L.length; i++) { await p.waitForTimeout(250); L = (await notifs(p)) || []; }
  ok('2 à 08:31, app cachée : une notification « Athéna » · « ' + TX('mob.notif.quetes.corps', { q: 'Appeler Mamie' }) + ' »', L.length === 1 && L[0].title === 'Athéna' && L[0].body === TX('mob.notif.quetes.corps', { q: 'Appeler Mamie' }) && /^quete-/.test(L[0].tag), JSON.stringify(L));
  await p.evaluate(async () => { const r = await navigator.serviceWorker.ready; (await r.getNotifications()).forEach((n) => n.close()); window.__visible = true; });
  // 3 · le miroir porte les rappels ; le service worker (app fermée) montre une quête due, une fois
  await p.evaluate(() => { const L = window.__logique(); L.queteDepuisAgenda({ titre: 'Rendre le livre', heure: '08:40' }); }); await p.waitForTimeout(400);
  await p.evaluate(() => { const L = window.__logique(); L.sauver(); L.miroirMobile(); }); await p.waitForTimeout(1200);
  const m = await p.evaluate(() => new Promise((ok) => { const r = indexedDB.open('athena-mobile'); r.onsuccess = () => { try { const g = r.result.transaction('etat').objectStore('etat').get(1); g.onsuccess = () => ok(g.result || null); g.onerror = () => ok(null); } catch (e) { ok(String(e)); } }; r.onerror = () => ok(null); }));
  const q40 = m && Array.isArray(m.quetes) && m.quetes.find((x) => x.t === 'Rendre le livre');
  ok('3 le miroir : rappels allumés et la quête de 08:40 à son heure (le téléphone)', !!m && m.rappels === true && !!q40 && q40.a === local(2026, 10, 21, 8, 40), JSON.stringify(m && { rappels: m.rappels, quetes: m.quetes }));
  const sw = p.context().serviceWorkers()[0];
  const avant = sw ? await sw.evaluate(async () => { await resumeMatin(); return (await self.registration.getNotifications()).map((n) => n.body); }) : null;
  ok('3 service worker avant 08:40 : rien de la quête de 08:40', !!avant && !avant.some((x) => /Rendre le livre/.test(x)), JSON.stringify(avant));
  const due = sw ? await sw.evaluate(async (t) => { const r = indexedDB.open('athena-mobile'); const db = await new Promise((ok) => { r.onsuccess = () => ok(r.result); }); const e = await new Promise((ok) => { const g = db.transaction('etat').objectStore('etat').get(1); g.onsuccess = () => ok(g.result); });
    e.quetes = e.quetes.map((q) => (q.t === 'Rendre le livre' ? Object.assign({}, q, { a: Date.now() - 60000 }) : q)); await new Promise((ok) => { const tx = db.transaction('etat', 'readwrite'); tx.objectStore('etat').put(e, 1); tx.oncomplete = ok; }); db.close();
    await resumeMatin(); const a = (await self.registration.getNotifications()).map((n) => n.body); await resumeMatin(); const b2 = (await self.registration.getNotifications()).map((n) => n.body); return { a, b2 }; }) : null;
  const corps40 = TX('mob.notif.quetes.corps', { q: 'Rendre le livre' });
  ok('3 service worker (app fermée), quête due : « ' + corps40 + ' », une seule fois', !!due && due.a.filter((x) => x === corps40).length === 1 && due.b2.filter((x) => x === corps40).length === 1, JSON.stringify(due));
  ok('1-3 aucune erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.context().close();

  // 4 · l'agenda vers l'app : un fichier .ics (Carnet › Téléphone)
  const q = await ouvrir(b, 'Prototype.dc.html#ecran=journal&tab=carnet&nouv=tout', { delai: 0, init: LOGIQUE });
  await pret(q); await q.waitForSelector('[data-el="ics_import"]', { timeout: 30000 }).catch(() => {});
  const jour = await q.evaluate(() => window.__logique().jourAgenda());
  const J = jour.replace(/-/g, ''), demain = new Date(new Date(jour + 'T12:00:00').getTime() + 864e5).toISOString().slice(0, 10).replace(/-/g, '');
  const fichier = ics([].concat(ev('a1', ':' + J + 'T093000', 'Dentiste'), ev('a2', ';TZID=Europe/Paris:20260901T190000', 'Sport\\, salle', 'FREQ=WEEKLY;BYDAY=MO,WE'), ev('a3', ';VALUE=DATE:' + J, 'Anniversaire de Léa'), ev('a4', ':' + demain + 'T090000', 'Demain, pas aujourd’hui'), ev('a5', ':20260901T070000', 'Méditer', 'FREQ=DAILY')));
  const lbl = await q.$eval('[data-el="ics_import"]', (e) => ({ h: e.getBoundingClientRect().height, t: e.textContent }));
  ok('4 Carnet › Téléphone : « ' + TX('mob.agenda.import.t') + ' » (≥ 44 px)', lbl.h >= 44 && lbl.t.includes(TX('mob.agenda.import.t')), JSON.stringify(lbl));
  await q.setInputFiles('[data-el="ics_import"] input', { name: 'agenda.ics', mimeType: 'text/calendar', buffer: Buffer.from(fichier) });
  await q.waitForSelector('[data-el="ics_liste"] [role="listitem"]', { timeout: 10000 }).catch(() => {});
  const items = await q.$$eval('[data-el="ics_liste"] [role="listitem"]', (l) => l.map((x) => x.textContent.replace(/\s+/g, ' ').trim()));
  ok('4 la liste : les rendez-vous d’aujourd’hui et ceux qui reviennent (4), pas celui de demain', items.length === 4 && !items.some((x) => /Demain/.test(x)) && items.some((x) => /Sport, salle/.test(x) && x.includes(TX('mob.agenda.chaqueSemaine'))) && items.some((x) => /Anniversaire/.test(x) && x.includes(TX('mob.agenda.journee'))), items.join(' | '));
  const nb0 = await q.evaluate(() => window.__logique().state.quetes.length);
  await q.click('[data-el="ics_liste"] [role="listitem"]:first-child button'); await q.waitForTimeout(500);
  let qs = await q.evaluate(() => window.__logique().state.quetes.map((x) => ({ t: x.t, h: x.h, rec: x.rec, jours: x.jours })));
  ok('4 « Ajouter » : la quête « Dentiste » à 09:30, une fois', qs.length === nb0 + 1 && qs.some((x) => x.t === 'Dentiste' && x.h === '09:30' && x.rec === 'une'), JSON.stringify(qs.slice(-1)));
  ok('4 la ligne dit « ' + TX('mob.agenda.ajoutee') + ' »', (await q.$eval('[data-el="ics_liste"] [role="listitem"]:first-child', (e) => e.textContent)).includes(TX('mob.agenda.ajoutee')));
  await q.click('button:has-text("' + TX('mob.agenda.toutAjouter') + '")'); await q.waitForTimeout(500);
  qs = await q.evaluate(() => window.__logique().state.quetes.map((x) => ({ t: x.t, h: x.h, rec: x.rec, jours: x.jours, cr: x.cr })));
  ok('4 « Tout ajouter » : les trois autres (sport lundi et mercredi à 19:00, méditer chaque jour à 07:00, anniversaire sans heure)', qs.length === nb0 + 4 && qs.some((x) => x.t === 'Sport, salle' && x.h === '19:00' && x.rec === 'semaine' && JSON.stringify(x.jours) === '[0,2]' && x.cr === 'soir') && qs.some((x) => x.t === 'Méditer' && x.rec === 'jour' && x.h === '07:00') && qs.some((x) => x.t === 'Anniversaire de Léa' && x.h === '' && x.cr === 'libre'), JSON.stringify(qs.slice(-4)));
  await q.setInputFiles('[data-el="ics_import"] input', { name: 'agenda.ics', mimeType: 'text/calendar', buffer: Buffer.from(fichier) }); await q.waitForTimeout(500);
  await q.click('button:has-text("' + TX('mob.agenda.toutAjouter') + '")').catch(() => {}); await q.waitForTimeout(400);
  ok('4 le même fichier une deuxième fois : aucune quête en double', (await q.evaluate(() => window.__logique().state.quetes.length)) === nb0 + 4);
  await q.setInputFiles('[data-el="ics_import"] input', { name: 'pas.ics', mimeType: 'text/calendar', buffer: Buffer.from('bonjour') }); await q.waitForTimeout(500);
  ok('4 un fichier qui n’est pas un agenda : « ' + TX('mob.agenda.importErreur') + ' »', (await q.evaluate(() => (document.querySelector('[data-el="imp_msg"]') || {}).textContent || '')).includes(TX('mob.agenda.importErreur')));
  // 5 · un rendez-vous Google (liste du jour) devient une quête
  await q.evaluate(() => window.__logique().setState({ rdv: [{ t: 'Réunion parents', heure: '18:15' }] }));
  const ajG = await q.evaluate(() => { const L = window.__logique(); L.ajouterAgenda('rdv', 0); return L.state.quetes.some((x) => x.t === 'Réunion parents' && x.h === '18:15'); });
  await q.waitForTimeout(300);
  ok('5 un rendez-vous Google du jour → la quête « Réunion parents » à 18:15', ajG || (await q.evaluate(() => window.__logique().state.quetes.some((x) => x.t === 'Réunion parents' && x.h === '18:15'))));
  // cibles et textes
  const petits = await q.evaluate(() => { const C = document.querySelector('[data-el="agenda"]'); if (!C) return ['carte absente']; return [...C.querySelectorAll('button,label')].filter((e) => e.getBoundingClientRect().height && e.getBoundingClientRect().height < 44).map((e) => e.textContent.trim().slice(0, 30)).concat([...C.querySelectorAll('*')].filter((e) => e.childElementCount === 0 && e.textContent.trim() && parseFloat(getComputedStyle(e).fontSize) < 13).map((e) => 'texte<13 ' + e.textContent.slice(0, 20))); });
  ok('4 carte agenda : cibles ≥ 44 px, textes ≥ 13 px', petits.length === 0, petits.join(' | '));
  const MOTS = V.MOTS_INTERDITS || [], nouveaux = Object.keys(V.TEXTES).filter((k) => /^mob\.(notif\.quetes|agenda\.(import|ajout|tout|journee|chaque))/.test(k)).map((k) => TX(k));
  ok('textes nouveaux sans mot interdit', nouveaux.length >= 10 && !nouveaux.some((t) => MOTS.some((m) => t.toLowerCase().includes(m))), nouveaux.length + ' textes');
  ok('4-5 aucune erreur', q.errs.length === 0, q.errs.join(' | '));
  await q.close(); await b.close();
  process.exit(bilan('mobile_rappels') ? 1 : 0);
})();
