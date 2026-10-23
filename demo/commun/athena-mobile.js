/* Athéna · commun/athena-mobile.js — le téléphone (passe du 20/10, mobile). Objet global AthenaMobile, chargé par le Prototype.
 * demarrer({ onMiseAJour, onInstallable }) : enregistre ./sw.js (portée ./) seulement en contexte sécurisé et hors artefact publié (window.__resources absent) ;
 *   onMiseAJour(recharger) quand une nouvelle version du service worker attend (recharger poste SKIP_WAITING puis recharge au changement de contrôleur) ;
 *   onInstallable(true) quand le navigateur propose l'installation (beforeinstallprompt gardé), onInstallable(false) après l'installation ou l'invite.
 *   Les écouteurs beforeinstallprompt / appinstalled sont posés dès le chargement du module (Chrome peut proposer l'installation avant que l'app
 *   démarre) : une invite reçue avant demarrer() est gardée, et demarrer() la rejoue à onInstallable.
 * installer() : ouvre l'invite d'installation → 'accepted' | 'dismissed' | 'indisponible'.
 * etat() : { sw, installable, standalone, notifs: 'default' | 'granted' | 'denied' | 'indisponible', android } ; notifs « indisponible » = pas d'API
 *   Notification, contexte non sécurisé ou artefact publié (aucun service worker pour les montrer).
 * Les options des notifications et la base du miroir viennent de commun/athena-mobile-commun.js (AthenaMobileCommun, chargé avant ce fichier ; sw.js
 *   l'importe aussi) : un seul exemplaire pour la page et le service worker.
 * Notifications (tâche 4, spec § 4) — jamais le constructeur Notification (« Illegal constructor » sur Chrome Android) : tout passe par le service worker.
 * demanderNotifs() : la demande de permission, seulement depuis un geste (le seul endroit du projet qui la fait) → 'granted' | 'denied' | 'default' |
 *   'indisponible' (pas d'API Notification, contexte non sécurisé ou artefact publié : aucun service worker pour les montrer).
 * notifier({ titre, corps, tag, action, donnees, heure, essai }) : registration.showNotification (options de AthenaMobileCommun.options : icône,
 *   badge, action « Voir », vibration sauf mouvement réduit ; action et donnees dans notification.data) → true ; false sans permission, sans service
 *   worker prêt (3 s) ou hors de la plage V.MOBILE.notifs.heures : l'heure de l'appareil doit y être, et aussi heure quand elle est donnée (celle du
 *   jeu dans le Prototype) ; essai = la réponse au bouton « Essayer une notification » : la plage ne s'applique pas.
 * miroir({ retourA, retourCle, matinA, matinCle, heures, compagnons, matin }) : ce que sw.js lit quand l'app est fermée — la base IndexedDB de
 *   AthenaMobileCommun (base, magasin, clé) ; la partie montre (ce que le service worker a déjà montré) est gardée ; vibrer suit le mouvement réduit ; rien n'est écrit
 *   si rien n'a changé. retourCle / matinCle (facultatives) : ce que l'heure annonce, côté jeu ; tant que la clé écrite est la même, l'heure déjà
 *   écrite est gardée (l'app rouverte plus tard ne la décale pas, et le service worker ne ré-annonce pas ce qu'il a déjà montré).
 * surMessage(f) : f(action) à chaque message { type: 'athena-notif', action } du service worker (le clic sur une notification) ; un message arrivé
 *   avant est rejoué ; renvoie de quoi arrêter l'écoute.
 * synchroniser() : la synchronisation périodique « resume-matin » (12 h au moins ; le téléphone choisit le moment) si l'app est installée et la
 *   permission accordée → true | false.
 * Agenda (tâche 5, spec § 5) — une entrée QA = { id, titre, jour: 'AAAA-MM-JJ', heure: 'HH:MM' | null, creneau, revient, jours: number[] | null (lundi = 0),
 *   semaines: 1 | 2 | null (chaque semaine, une semaine sur deux), joursMois: number[] | null (1 à 31, certains jours du mois) } (tâche 11) ;
 *   sans heure, l'heure du créneau (V.MOBILE.agenda.heures) ; « libre » sans heure = la journée entière ; o = { nom: 'Athéna', duree, rappelMin } (durée et rappel
 *   lus dans V.MOBILE.agenda, sinon 30 et 10 min). Heures locales « flottantes » (sans fuseau) : 8 h reste 8 h sur le téléphone, où qu'il soit.
 * ics(liste, o) : le fichier .ics (VCALENDAR 2.0, CRLF, lignes repliées à 75 octets, un VEVENT par entrée : UID <id>@athena, DTSTAMP, DTSTART / DTEND,
 *   SUMMARY, RRULE pour une quête qui revient — FREQ=MONTHLY;BYMONTHDAY=… (joursMois), sinon FREQ=WEEKLY[;INTERVAL=2][;BYDAY=…] (jours ou semaines),
 *   sinon FREQ=DAILY — ; VALARM -PT<rappelMin>M ; la journée entière n'a pas de rappel : il sonnerait la veille au soir). Une quête de certains jours
 *   (de la semaine ou du mois) commence au premier de ces jours (RFC 5545 : DTSTART suit la règle). Le lien Google, l'intention Android et l'API
 *   Google reçoivent la même règle.
 * lienGoogleAgenda(q, o) : https://calendar.google.com/calendar/render?action=TEMPLATE… (text, dates, ctz = fuseau du téléphone, recur ; details si o.details).
 * intentAgenda(q, o) : l'intention Android d'ajout d'un événement (l'app Agenda du téléphone), le lien Google en secours ; null hors Android.
 * partagerIcs(ics, nom = 'quetes-athena.ics') : navigator.share({ files }) si le navigateur accepte ce fichier → 'partage', sinon téléchargement → 'telecharge'.
 * google (facultatif, profil Parent) : pret() = un ID client dans AthenaMobileConfig (commun/athena-mobile-config.js) ; precharger() charge Google
 *   Identity sans rien demander (à l'ouverture de la carte, tâche 11) → true | false ; relier() le charge s'il manque, et sinon appelle tout de suite
 *   requestAccessToken, dans le geste (la fenêtre de Google n'est pas bloquée) (jeton d'accès, portée calendar.events, gardé en mémoire seulement) ; envoyer(liste) → le nombre d'entrées écrites (cherche d'abord
 *   l'événement par extendedProperties.private.athena = id : mis à jour, jamais doublé) ; rendezVousDuJour(jour) → [{ t, heure: 'HH:MM' | null }].
 * Rien d'insistant : aucun bandeau, aucune demande sans geste. */
(function (W) {
  'use strict';
  const M = { version: '1.0' };
  const N = W.navigator || {};
  let app = {}, invite = null, swOk = false, demarre = false, recharge = false;

  const publie = () => !!W.__resources;
  const secur = () => !!(W.isSecureContext && 'serviceWorker' in N);
  const standalone = () => { try { return !!((W.matchMedia && W.matchMedia('(display-mode: standalone)').matches) || N.standalone === true); } catch (e) { return false; } };
  const dire = (nom, v) => { try { if (typeof app[nom] === 'function') app[nom](v); } catch (e) {} };

  // Une nouvelle version attend : l'app montre son message, et « recharger » fait passer le nouveau service worker puis recharge la page
  const attend = (w) => dire('onMiseAJour', () => { if (recharge) return; recharge = true; try { w.postMessage({ type: 'SKIP_WAITING' }); } catch (e) { recharge = false; } });

  // Dès le chargement du module : l'invite d'installation n'attend pas que l'app ait démarré
  try {
    W.addEventListener('beforeinstallprompt', (e) => { e.preventDefault(); invite = e; dire('onInstallable', true); });
    W.addEventListener('appinstalled', () => { invite = null; dire('onInstallable', false); });
  } catch (e) {}

  M.demarrer = (o) => {
    app = o || {};
    if (invite) dire('onInstallable', true);   // l'invite reçue avant le démarrage
    if (demarre) return; demarre = true;
    if (publie() || !secur()) return;
    const SW = N.serviceWorker;
    SW.addEventListener('controllerchange', () => { if (recharge) W.location.reload(); });
    SW.register('./sw.js', { scope: './', updateViaCache: 'none' }).then((r) => {
      swOk = true;
      if (r.waiting && SW.controller) attend(r.waiting);
      r.addEventListener('updatefound', () => {
        const w = r.installing; if (!w) return;
        w.addEventListener('statechange', () => { if (w.state === 'installed' && SW.controller) attend(w); });
      });
    }).catch(() => { swOk = false; });
  };

  M.installer = () => {
    const e = invite; if (!e) return Promise.resolve('indisponible');
    invite = null;
    return Promise.resolve().then(() => e.prompt()).then(() => e.userChoice).then((c) => {
      dire('onInstallable', false);
      return c && c.outcome === 'accepted' ? 'accepted' : 'dismissed';
    }).catch(() => { dire('onInstallable', false); return 'indisponible'; });
  };

  M.etat = () => ({
    sw: swOk,
    installable: !!invite,
    standalone: standalone(),
    notifs: possible() && 'Notification' in W && W.Notification && typeof W.Notification.permission === 'string' ? W.Notification.permission : 'indisponible',
    android: /Android/i.test(N.userAgent || '')
  });

  /* ——— Notifications (tâche 4) ——— */
  const C = W.AthenaMobileCommun || {}, MAGASIN = C.magasin, CLE = C.cle;
  const NOTIF_PERIODIQUE = 'resume-matin', INTERVALLE = 12 * 3600 * 1000;
  const permission = () => M.etat().notifs;
  const possible = () => !publie() && secur();
  const nombre = (v) => (typeof v === 'number' && isFinite(v) ? v : null);
  const cleDe = (v) => (typeof v === 'string' ? v : nombre(v) != null ? String(v) : null);
  const plage = () => { const V = W.ATHENA_V1, h = V && V.MOBILE && V.MOBILE.notifs && V.MOBILE.notifs.heures; return Array.isArray(h) && h.length === 2 ? h : null; };
  const heureAppareil = () => { const d = new Date(); return d.getHours() + d.getMinutes() / 60; };
  const dans = (h, H) => !!H && h >= H[0] && h < H[1];
  const reduit = () => {
    const D = W.document, el = D && D.querySelector ? D.querySelector('[data-mouvement]') : null;
    if (W.AthenaMotion && typeof W.AthenaMotion.reduit === 'function') return W.AthenaMotion.reduit(el);
    if (el) return el.getAttribute('data-mouvement') === 'reduit';
    return !!(W.matchMedia && W.matchMedia('(prefers-reduced-motion: reduce)').matches);
  };
  // Le service worker actif, 3 s au plus (sinon null : rien ne reste en attente)
  const pret = () => Promise.race([N.serviceWorker.ready, new Promise((ok) => setTimeout(() => ok(null), 3000))]).catch(() => null);

  M.demanderNotifs = () => {
    const NO = W.Notification, demande = NO && NO.requestPermission;   // le seul endroit du projet qui demande la permission (règle 12 du vérificateur)
    if (!possible() || typeof demande !== 'function') return Promise.resolve('indisponible');
    if (NO.permission === 'granted' || NO.permission === 'denied') return Promise.resolve(NO.permission);
    return new Promise((res) => {
      let fini = false;
      const rendre = (v) => { if (fini) return; fini = true; res(v === 'granted' || v === 'denied' || v === 'indisponible' ? v : 'default'); };
      try { const q = demande.call(NO, rendre); if (q && typeof q.then === 'function') q.then(rendre, () => rendre('default')); } catch (e) { rendre('indisponible'); }
    });
  };

  M.notifier = (o) => {
    o = o || {};
    if (!possible() || permission() !== 'granted') return Promise.resolve(false);
    // jamais la nuit : l'heure du téléphone dans la plage, et l'heure du jeu aussi quand elle est donnée
    const H = plage();
    if (!o.essai && !o.rappel && !(dans(heureAppareil(), H) && (typeof o.heure !== 'number' || dans(o.heure, H)))) return Promise.resolve(false);
    if (typeof C.options !== 'function') return Promise.resolve(false);
    const opts = C.options({ corps: o.corps, tag: o.tag, action: o.action, donnees: o.donnees, vibrer: !reduit() });
    return pret().then((r) => (r ? r.showNotification(o.titre || '', opts).then(() => true) : false)).catch(() => false);
  };

  const ouvrirBase = () => new Promise((ok, ko) => {
    if (!W.indexedDB || !C.base) return ko(new Error('IndexedDB absent'));
    const r = W.indexedDB.open(C.base, C.version);
    r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(MAGASIN)) r.result.createObjectStore(MAGASIN); };
    r.onsuccess = () => ok(r.result);
    r.onerror = () => ko(r.error);
    r.onblocked = () => ko(new Error('base bloquée'));
  });
  /* 21/10 · lireIcs(texte, jour) : un agenda exporté (Apple Calendrier, Google Agenda…) → [{ uid, titre, jour, heure, revient, freq, jours }].
   * Garde les rendez-vous du jour donné ('AAAA-MM-JJ') et ceux qui reviennent (tous les jours, ou certains jours de la semaine, lundi = 0) ;
   * une heure en UTC (…Z) est mise à l'heure du téléphone ; un fuseau nommé (TZID) est lu comme l'heure locale. Rien n'est envoyé nulle part. */
  M.lireIcs = (texte, jour) => {
    const L = String(texte || '').replace(/\r\n[ \t]/g, '').replace(/\n[ \t]/g, '').split(/\r?\n/), out = [], deux = (n) => String(n).padStart(2, '0');
    if (!L.some((l) => /^BEGIN:VCALENDAR/i.test(l))) return null;
    const JOURS = { MO: 0, TU: 1, WE: 2, TH: 3, FR: 4, SA: 5, SU: 6 }, deco = (v) => v.replace(/\\n/gi, ' ').replace(/\\([,;\\])/g, '$1').trim();
    let e = null;
    for (const l of L) {
      if (/^BEGIN:VEVENT/i.test(l)) { e = {}; continue; }
      if (/^END:VEVENT/i.test(l)) { if (e && e.dt) out.push(e); e = null; continue; }
      if (!e) continue;
      const i = l.indexOf(':'); if (i < 0) continue;
      const cle = l.slice(0, i).toUpperCase(), val = l.slice(i + 1), nom = cle.split(';')[0];
      if (nom === 'SUMMARY') e.titre = deco(val);
      else if (nom === 'UID') e.uid = val.trim();
      else if (nom === 'DTSTART') e.dt = val.trim();
      else if (nom === 'RRULE') e.rrule = val.trim().toUpperCase();
    }
    return out.map((x) => {
      const m = /^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})\d{0,2}(Z)?)?$/.exec(x.dt); if (!m) return null;
      let j = m[1] + '-' + m[2] + '-' + m[3], h = m[4] != null ? m[4] + ':' + m[5] : null;
      if (m[6]) { const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3], +m[4], +m[5])); j = d.getFullYear() + '-' + deux(d.getMonth() + 1) + '-' + deux(d.getDate()); h = deux(d.getHours()) + ':' + deux(d.getMinutes()); }
      const r = x.rrule || '', f = (/FREQ=(\w+)/.exec(r) || [])[1], by = (/BYDAY=([A-Z,0-9+-]+)/.exec(r) || [])[1];
      const jours = by ? by.split(',').map((d) => JOURS[d.replace(/^[+-]?\d+/, '')]).filter((d) => d != null) : null;
      const revient = f === 'DAILY' || f === 'WEEKLY';
      const freq = f === 'DAILY' ? 'jour' : f === 'WEEKLY' ? 'semaine' : null;
      return { uid: x.uid || j + (h || '') + (x.titre || ''), titre: (x.titre || '').slice(0, 80), jour: j, heure: h, revient, freq, jours: f === 'WEEKLY' ? (jours && jours.length ? jours : [(new Date(j + 'T12:00:00').getDay() + 6) % 7]) : null };
    }).filter((x) => x && x.titre && (x.revient ? x.jour <= (jour || x.jour) : !jour || x.jour === jour)).slice(0, 40);
  };

  let dernierMiroir = '';
  M.miroir = (o) => {
    o = o || {};
    if (!possible()) return Promise.resolve();
    const v = { retourA: nombre(o.retourA), retourCle: cleDe(o.retourCle), matinA: nombre(o.matinA), matinCle: cleDe(o.matinCle), heures: Array.isArray(o.heures) ? o.heures.slice(0, 2) : plage(), compagnons: !!o.compagnons, matin: !!o.matin, vibrer: !reduit(),
      rappels: !!o.rappels, quetes: Array.isArray(o.quetes) ? o.quetes.filter((q) => q && typeof q.a === 'number' && isFinite(q.a)).slice(0, 30).map((q) => ({ id: String(q.id).slice(0, 60), t: String(q.t || '').slice(0, 80), a: q.a })) : [] };
    if (v.retourA == null) v.retourCle = null;
    if (v.matinA == null) v.matinCle = null;
    // une heure qui a sa clé ne compte que par elle : à clé égale, l'heure écrite reste (voir plus bas)
    const cle = JSON.stringify(Object.assign({}, v, v.retourCle != null ? { retourA: 0 } : {}, v.matinCle != null ? { matinA: 0 } : {}));
    if (cle === dernierMiroir) return Promise.resolve();
    dernierMiroir = cle;
    const oublier = () => { dernierMiroir = ''; };   // une écriture qui échoue sera refaite à la sauvegarde suivante
    return ouvrirBase().then((db) => new Promise((fin) => {
      const t = db.transaction(MAGASIN, 'readwrite'), m = t.objectStore(MAGASIN), g = m.get(CLE);
      g.onsuccess = () => {
        const avant = g.result || {}, w = Object.assign({}, v), garder = (a, c) => w[c] != null && avant[c] === w[c] && nombre(avant[a]) != null;
        if (garder('retourA', 'retourCle')) w.retourA = avant.retourA;
        if (garder('matinA', 'matinCle')) w.matinA = avant.matinA;
        m.put(Object.assign(w, { montre: Object.assign({ retourA: null, matinA: null }, avant.montre) }), CLE);
      };
      t.oncomplete = () => { db.close(); fin(); };
      t.onerror = t.onabort = () => { db.close(); oublier(); fin(); };
    })).catch(oublier);
  };

  let ecoutes = [], enAttente = null;
  try {
    if (possible()) N.serviceWorker.addEventListener('message', (e) => {
      const d = e && e.data; if (!d || d.type !== 'athena-notif') return;
      const a = d.action || 'voir';
      if (!ecoutes.length) { enAttente = a; return; }
      ecoutes.forEach((f) => { try { f(a); } catch (x) {} });
    });
  } catch (e) {}
  M.surMessage = (f) => {
    if (typeof f !== 'function') return () => {};
    ecoutes.push(f);
    if (enAttente != null) { const a = enAttente; enAttente = null; try { f(a); } catch (x) {} }
    return () => { ecoutes = ecoutes.filter((g) => g !== f); };
  };

  M.synchroniser = () => {
    if (!possible() || !standalone() || permission() !== 'granted') return Promise.resolve(false);
    return pret().then((r) => (r && r.periodicSync ? r.periodicSync.register(NOTIF_PERIODIQUE, { minInterval: INTERVALLE }).then(() => true) : false)).catch(() => false);
  };

  /* ——— Agenda (tâche 5) ——— */
  const deux = (n) => (n < 10 ? '0' : '') + n;
  const AG = () => { const V = W.ATHENA_V1; return (V && V.MOBILE && V.MOBILE.agenda) || {}; };
  // Les réglages d'une sortie : ceux donnés, sinon V.MOBILE.agenda, sinon ceux de la spec (30 min, rappel 10 min avant)
  const reglages = (o) => {
    const A = AG(), r = { nom: 'Athéna', duree: nombre(A.duree) != null ? A.duree : 30, rappelMin: nombre(A.rappelMin) != null ? A.rappelMin : 10, heures: A.heures || {}, details: '' };
    Object.keys(o || {}).forEach((k) => { if (o[k] != null) r[k] = o[k]; });
    if (nombre(r.duree) == null || r.duree <= 0) r.duree = 30;
    if (nombre(r.rappelMin) == null || r.rappelMin < 0) r.rappelMin = 10;
    return r;
  };
  const BYDAY = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'];
  const joursDe = (q) => (q.revient && Array.isArray(q.jours) ? q.jours : []).filter((j, i, L) => Number.isInteger(j) && j >= 0 && j < 7 && L.indexOf(j) === i).sort((a, b) => a - b);
  const joursMoisDe = (q) => (q.revient && Array.isArray(q.joursMois) ? q.joursMois : []).filter((j, i, L) => Number.isInteger(j) && j >= 1 && j <= 31 && L.indexOf(j) === i).sort((a, b) => a - b);
  const semainesDe = (q) => (q.revient && Number.isInteger(q.semaines) && q.semaines >= 1 ? q.semaines : null);
  // Certains jours du mois → mensuelle ; des jours de la semaine ou un rythme en semaines → hebdomadaire (INTERVAL=2 : une semaine sur deux) ; sinon chaque jour
  const regle = (q) => {
    if (!q.revient) return null;
    const JM = joursMoisDe(q); if (JM.length) return 'FREQ=MONTHLY;BYMONTHDAY=' + JM.join(',');
    const J = joursDe(q), N = semainesDe(q);
    if (!J.length && N == null) return 'FREQ=DAILY';
    return 'FREQ=WEEKLY' + (N > 1 ? ';INTERVAL=' + N : '') + (J.length ? ';BYDAY=' + J.map((j) => BYDAY[j]).join(',') : '');
  };
  const heureDe = (q, o) => {
    if (typeof q.heure === 'string' && /^\d{1,2}:\d{2}$/.test(q.heure)) return q.heure;
    const h = nombre(o.heures && o.heures[q.creneau]);
    return h == null ? null : deux(Math.floor(h)) + ':' + deux(Math.round((h % 1) * 60));
  };
  // Début et fin d'une entrée en heure flottante, comptées comme si elles étaient en UTC (aucun changement d'heure ne s'en mêle) ;
  // journee = un événement sur toute la journée (fin = le lendemain, exclue)
  const moments = (q, o) => {
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(q.jour || ''), auj = new Date();
    let t = m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) : Date.UTC(auj.getFullYear(), auj.getMonth(), auj.getDate());
    const J = joursDe(q), JM = joursMoisDe(q);
    if (JM.length) { let k = 0; while (k < 400 && JM.indexOf(new Date(t + k * 864e5).getUTCDate()) < 0) k++; t += k * 864e5; }
    else if (J.length) { const jj = (new Date(t).getUTCDay() + 6) % 7; let k = 0; while (J.indexOf((jj + k) % 7) < 0) k++; t += k * 864e5; }
    const h = heureDe(q, o);
    if (!h) return { journee: true, debut: t, fin: t + 864e5 };
    const [hh, mm] = h.split(':').map(Number), debut = t + (hh * 60 + mm) * 6e4;
    return { journee: false, debut, fin: debut + Math.max(1, Math.round(o.duree)) * 6e4 };
  };
  const u = (t) => new Date(t);
  const jourIcs = (t) => u(t).getUTCFullYear() + deux(u(t).getUTCMonth() + 1) + deux(u(t).getUTCDate());
  const heureIcs = (t) => jourIcs(t) + 'T' + deux(u(t).getUTCHours()) + deux(u(t).getUTCMinutes()) + deux(u(t).getUTCSeconds());
  const jourIso = (t) => u(t).getUTCFullYear() + '-' + deux(u(t).getUTCMonth() + 1) + '-' + deux(u(t).getUTCDate());
  const heureIso = (t) => jourIso(t) + 'T' + deux(u(t).getUTCHours()) + ':' + deux(u(t).getUTCMinutes()) + ':00';
  const local = (t) => new Date(u(t).getUTCFullYear(), u(t).getUTCMonth(), u(t).getUTCDate(), u(t).getUTCHours(), u(t).getUTCMinutes()).getTime();   // l'instant réel, à l'heure du téléphone
  const fuseau = () => { try { return Intl.DateTimeFormat().resolvedOptions().timeZone || ''; } catch (e) { return ''; } };
  // Un texte iCalendar : \ ; , et retours à la ligne échappés (RFC 5545 § 3.3.11)
  const texte = (s) => String(s == null ? '' : s).replace(/\\/g, '\\\\').replace(/\r\n|\r|\n/g, '\\n').replace(/([,;])/g, '\\$1');
  // Une ligne repliée à 75 octets (UTF-8) : la suite commence par une espace, jamais au milieu d'un caractère
  const plier = (l) => {
    let out = '', n = 0;
    for (const c of l) { const p = c.codePointAt(0), b = p < 0x80 ? 1 : p < 0x800 ? 2 : p < 0x10000 ? 3 : 4; if (n + b > 75) { out += '\r\n '; n = 1; } out += c; n += b; }
    return out;
  };

  M.ics = (liste, o) => {
    o = reglages(o);
    const L = ['BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Athena//V1//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH', 'X-WR-CALNAME:' + texte(o.nom)], stamp = heureIcs(Date.now()) + 'Z';
    (liste || []).filter(Boolean).forEach((q) => {
      const t = moments(q, o), r = regle(q);
      L.push('BEGIN:VEVENT', 'UID:' + String(q.id) + '@athena', 'DTSTAMP:' + stamp);
      if (t.journee) L.push('DTSTART;VALUE=DATE:' + jourIcs(t.debut), 'DTEND;VALUE=DATE:' + jourIcs(t.fin));
      else L.push('DTSTART:' + heureIcs(t.debut), 'DTEND:' + heureIcs(t.fin));
      L.push('SUMMARY:' + texte(q.titre));
      if (r) L.push('RRULE:' + r);
      if (!t.journee) L.push('BEGIN:VALARM', 'ACTION:DISPLAY', 'DESCRIPTION:' + texte(q.titre), 'TRIGGER:-PT' + Math.max(0, Math.round(o.rappelMin)) + 'M', 'END:VALARM');
      L.push('END:VEVENT');
    });
    L.push('END:VCALENDAR');
    return L.map(plier).join('\r\n') + '\r\n';
  };

  M.lienGoogleAgenda = (q, o) => {
    o = reglages(o);
    const t = moments(q, o), r = regle(q), z = fuseau();
    const dates = t.journee ? jourIcs(t.debut) + '/' + jourIcs(t.fin) : heureIcs(t.debut) + '/' + heureIcs(t.fin);
    return 'https://calendar.google.com/calendar/render?action=TEMPLATE&text=' + encodeURIComponent(q.titre || '') + '&dates=' + dates + (z ? '&ctz=' + encodeURIComponent(z) : '') +
      (o.details ? '&details=' + encodeURIComponent(o.details) : '') + (r ? '&recur=' + encodeURI('RRULE:' + r) : '');
  };

  M.intentAgenda = (q, o) => {
    if (!/Android/i.test(N.userAgent || '')) return null;
    o = reglages(o);
    const t = moments(q, o), r = regle(q);
    const P = ['intent:#Intent', 'action=android.intent.action.INSERT', 'type=vnd.android.cursor.item/event', 'S.title=' + encodeURIComponent(q.titre || ''), 'l.beginTime=' + local(t.debut), 'l.endTime=' + local(t.fin)];
    if (t.journee) P.push('B.allDay=true');
    if (r) P.push('S.rrule=' + encodeURIComponent(r));
    P.push('S.browser_fallback_url=' + encodeURIComponent(M.lienGoogleAgenda(q, o)), 'end');
    return P.join(';');
  };

  M.partagerIcs = (ics, nom) => {
    nom = nom || 'quetes-athena.ics';
    const type = 'text/calendar';
    const telecharge = () => {
      const H = W.AthenaHub;
      try {
        if (H && typeof H.telecharger === 'function') H.telecharger(nom, ics, type + ';charset=utf-8');
        else { const D = W.document, a = D.createElement('a'), url = W.URL.createObjectURL(new W.Blob([ics], { type: type + ';charset=utf-8' })); a.href = url; a.download = nom; D.body.appendChild(a); a.click(); setTimeout(() => { W.URL.revokeObjectURL(url); a.remove(); }, 500); }
      } catch (e) {}
      return 'telecharge';
    };
    let f = null, ok = false;
    try { f = new W.File([ics], nom, { type }); ok = typeof N.share === 'function' && typeof N.canShare === 'function' && !!N.canShare({ files: [f] }); } catch (e) { ok = false; }
    if (!ok) return Promise.resolve(telecharge());
    // appelé tout de suite, dans le geste (Safari le demande) ; le partage refermé sans choix (AbortError) ne relance rien ;
    // un refus du navigateur passe au téléchargement
    let q;
    try { q = N.share({ files: [f], title: nom }); } catch (e) { return Promise.resolve(telecharge()); }
    return Promise.resolve(q).then(() => 'partage', (e) => (e && e.name === 'AbortError' ? 'partage' : telecharge()));
  };

  /* Google Agenda (facultatif) : un ID client OAuth « Application Web » public, le jeton d'accès en mémoire seulement (jamais sauvegardé) */
  const GSI = 'https://accounts.google.com/gsi/client', PORTEE = 'https://www.googleapis.com/auth/calendar.events';
  const API = 'https://www.googleapis.com/calendar/v3/calendars/primary/events';
  const G = {};
  let jeton = null, jetonFin = 0, gsi = null;
  const idClient = () => { const C = W.AthenaMobileConfig; return C && typeof C.googleClientId === 'string' ? C.googleClientId.trim() : ''; };
  const oauth = () => (W.google && W.google.accounts && W.google.accounts.oauth2) || null;
  const chargerGsi = () => {
    if (oauth()) return Promise.resolve(oauth());
    if (!gsi) gsi = new Promise((ok, ko) => {
      const D = W.document, s = D.createElement('script');
      s.src = GSI; s.async = true;
      s.onload = () => (oauth() ? ok(oauth()) : ko(new Error('Google Identity absent')));
      s.onerror = () => ko(new Error('Google Identity injoignable'));
      D.head.appendChild(s);
    }).catch((e) => { gsi = null; throw e; });
    return gsi;
  };
  const relie = () => !!jeton && Date.now() < jetonFin;
  const qs = (o) => Object.keys(o).map((k) => encodeURIComponent(k) + '=' + encodeURIComponent(o[k])).join('&');
  const appel = (methode, url, corps) => {
    if (typeof W.fetch !== 'function') return Promise.reject(new Error('fetch absent'));
    const h = { Authorization: 'Bearer ' + jeton };
    if (corps) h['Content-Type'] = 'application/json';
    return W.fetch(url, { method: methode, headers: h, body: corps ? JSON.stringify(corps) : undefined }).then((r) => {
      if (r.status === 401) { jeton = null; jetonFin = 0; }   // jeton expiré ou retiré : le prochain geste relie de nouveau
      if (!r.ok) throw new Error('HTTP ' + r.status);
      return r.status === 204 ? {} : r.json();
    });
  };
  const evenement = (q, o) => {
    const t = moments(q, o), r = regle(q), z = fuseau() || 'UTC';
    const e = { summary: String(q.titre || ''), extendedProperties: { private: { athena: String(q.id) } } };
    if (t.journee) Object.assign(e, { start: { date: jourIso(t.debut) }, end: { date: jourIso(t.fin) }, reminders: { useDefault: false, overrides: [] } });
    else Object.assign(e, { start: { dateTime: heureIso(t.debut), timeZone: z }, end: { dateTime: heureIso(t.fin), timeZone: z }, reminders: { useDefault: false, overrides: [{ method: 'popup', minutes: Math.max(0, Math.round(o.rappelMin)) }] } });
    if (r) e.recurrence = ['RRULE:' + r];
    return e;
  };
  const pretAEcrire = () => (relie() ? Promise.resolve(true) : G.relier());

  G.pret = () => !!idClient();
  G.precharger = () => (G.pret() ? chargerGsi().then(() => true, () => false) : Promise.resolve(false));
  G.relier = () => {
    if (!G.pret()) return Promise.resolve(false);
    const demander = (O) => new Promise((ok) => {
      let fini = false, delai = null;
      const fin = (v) => { if (fini) return; fini = true; clearTimeout(delai); ok(v); };
      delai = setTimeout(() => fin(false), 120000);   // la fenêtre de Google laissée ouverte : rien ne reste en attente sans fin
      try {
        O.initTokenClient({ client_id: idClient(), scope: PORTEE, error_callback: () => fin(false), callback: (r) => {
          if (r && r.access_token) { jeton = r.access_token; jetonFin = Date.now() + Math.max(60, (nombre(+r.expires_in) || 3600) - 60) * 1000; fin(true); } else fin(false);
        } }).requestAccessToken();
      } catch (e) { fin(false); }
    });
    // Google Identity déjà là (préchargé) : la demande part tout de suite, dans le geste ; sinon après son chargement
    const O = oauth();
    return (O ? demander(O) : chargerGsi().then(demander)).catch(() => false);
  };
  G.envoyer = (liste) => pretAEcrire().then((ok) => {
    if (!ok) return 0;
    const o = reglages();
    let n = 0;
    return (liste || []).filter(Boolean).reduce((p, q) => p.then(() => {
      if (!relie()) return null;   // (après un 401, plus rien ne part)
      const e = evenement(q, o);
      return appel('GET', API + '?' + qs({ privateExtendedProperty: 'athena=' + q.id, maxResults: 1, showDeleted: false }))
        .then((r) => { const x = r && r.items && r.items[0]; return x && x.id ? appel('PUT', API + '/' + encodeURIComponent(x.id), e) : appel('POST', API, e); })
        .then(() => { n++; }, () => {});
    }), Promise.resolve()).then(() => n);
  }).catch(() => 0);
  G.rendezVousDuJour = (jour) => pretAEcrire().then((ok) => {
    if (!ok) return [];
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(jour || ''), a = new Date(), d = m ? new Date(+m[1], +m[2] - 1, +m[3]) : new Date(a.getFullYear(), a.getMonth(), a.getDate());
    const f = new Date(d.getFullYear(), d.getMonth(), d.getDate() + 1);
    return appel('GET', API + '?' + qs({ timeMin: d.toISOString(), timeMax: f.toISOString(), singleEvents: true, orderBy: 'startTime', maxResults: 50 })).then((r) => ((r && r.items) || [])
      .filter((e) => e && e.status !== 'cancelled')
      .map((e) => { const s = e.start || {}, x = s.dateTime ? new Date(s.dateTime) : null; return { t: String(e.summary || ''), heure: x && !isNaN(x.getTime()) ? deux(x.getHours()) + ':' + deux(x.getMinutes()) : null }; }));
  }).catch(() => []);
  M.google = G;

  W.AthenaMobile = M;
})(window);
