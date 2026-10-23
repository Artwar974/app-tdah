/* Athéna · sw.js — le service worker de la V1 testable (portée ./). La version et les listes viennent de sw-precache.js, généré par outils/generer-precache.py.
 * Stratégies (spec § 3) :
 *   install  = cache strict de la coquille (pages, scripts, styles, polices, manifest, icônes) et des 4 scripts CDN demandés en mode cors ;
 *   activate = suppression des caches d'une autre version, clients.claim(), puis précache tolérant (allSettled) des images de assets/scene/ qui manquent :
 *              lancé après l'activation (les requêtes de la page ne l'attendent pas), gardé en vie par le waitUntil de chaque fetch tant qu'il tourne, et
 *              relancé au premier fetch d'une vie suivante du worker s'il a été arrêté avant la fin (réseau lent) ;
 *   fetch    = navigations : réseau d'abord (3 s) puis le cache (la page demandée, sinon Prototype.dc.html) ; même origine GET : cache d'abord (ignoreSearch) puis réseau
 *              (une ressource ?v= dont le cache n'a qu'une autre version : réseau d'abord, la copie en cache hors ligne) ;
 *              unpkg / jsdelivr : cache d'abord puis réseau en mode cors (jamais de réponse opaque en cache) ; accounts.google.com, googleapis.com, calendar.google.com :
 *              réseau seul ; le reste passe.
 *   message SKIP_WAITING ;
 *   notificationclick = la notification se ferme, une fenêtre de la portée prend le focus (sinon ./Prototype.dc.html?source=pwa s'ouvre : sans fragment,
 *              qui remplacerait la sauvegarde ; le camp est l'écran par défaut), puis
 *              postMessage({ type: 'athena-notif', action }) : l'app ouvre le camp ;
 *   periodicsync « resume-matin » (app installée et fermée, le téléphone choisit le moment) = lecture du miroir IndexedDB (écrit par
 *              AthenaMobile.miroir ; nom, magasin et clé dans commun/athena-mobile-commun.js) : dans la plage heures (heure de l'appareil), le retour des
 *              compagnons (retourA passé) et le résumé du matin (matinA passé) se montrent une fois chacun, puis montre les marque. Spec § 4. */
importScripts('./sw-precache.js');
importScripts('./commun/athena-mobile-commun.js?v=1');   // les options des notifications et la base du miroir, partagées avec la page

const VERSION = self.ATHENA_VERSION || '0';
const CACHE = 'athena-demo-' + VERSION;
const COQUILLE = self.ATHENA_COQUILLE || [], IMAGES = self.ATHENA_IMAGES || [], CDN = self.ATHENA_CDN || [];
const DELAI_NAVIGATION = 3000;
const CDN_HOTES = /(^|\.)(unpkg\.com|cdn\.jsdelivr\.net)$/;
const RESEAU_SEUL = /(^|\.)(accounts\.google\.com|googleapis\.com|calendar\.google\.com)$/;
const PAGE = './Prototype.dc.html';

const bonne = (r) => !!r && r.ok && r.type !== 'opaque';
const delai = (ms) => new Promise((_, ko) => setTimeout(() => ko(new Error('délai dépassé')), ms));
const cors = (url) => new Request(url, { mode: 'cors', credentials: 'omit' });

// Coquille stricte : chaque fichier revalidé (no-cache), chaque CDN en mode cors ; une réponse manquante ou opaque fait échouer l'installation (et la version d'avant reste)
const precacheCoquille = async (c) => {
  await Promise.all(COQUILLE.map(async (u) => {
    const r = await fetch(new Request(u, { cache: 'no-cache' }));
    if (!bonne(r)) throw new Error('coquille : ' + u + ' → ' + (r ? r.status : 'rien'));
    await c.put(u, r);
  }));
  await Promise.all(CDN.map(async (u) => {
    const r = await fetch(cors(u));
    if (!bonne(r)) throw new Error('CDN : ' + u + ' → ' + (r ? r.status + ' ' + r.type : 'rien'));
    await c.put(u, r);
  }));
};

// Images tolérantes : une image absente n'empêche rien, elle sera mise en cache à sa première demande ; seules celles qui manquent au cache sont demandées
const precacheImages = async () => {
  const c = await caches.open(CACHE);
  await Promise.allSettled(IMAGES.map(async (u) => { if (await c.match(u)) return; const r = await fetch(u); if (bonne(r)) await c.put(u, r); }));
};
// Le précache des images de cette vie du worker : une seule fois, et fini = plus rien à garder en vie (un échec laisse le suivant réessayer)
let images = null, imagesFinies = false;
const imagesEnCache = () => {
  if (!images) images = precacheImages().then(() => { imagesFinies = true; }, () => { images = null; });
  return images;
};

self.addEventListener('install', (e) => { e.waitUntil(caches.open(CACHE).then(precacheCoquille)); });

self.addEventListener('activate', (e) => {
  const p = (async () => {
    const ks = await caches.keys();
    await Promise.all(ks.filter((k) => k.indexOf('athena-demo-') === 0 && k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })();
  e.waitUntil(p);
  // Après l'activation (une requête de la page n'attend jamais les images : un worker « activating » retient les fetch), les images du camp entrent
  // dans le cache ; chaque fetch qui arrive pendant ce temps garde le worker en vie (voir plus bas)
  p.then(imagesEnCache).catch(() => {});
});

async function navigation(req) {
  try { return await Promise.race([fetch(req), delai(DELAI_NAVIGATION)]); }
  catch (e) {
    const c = await caches.open(CACHE);
    return (await c.match(req, { ignoreSearch: true })) || (await c.match(PAGE, { ignoreSearch: true })) || Response.error();
  }
}

// Même origine : cache d'abord (ignoreSearch). Seule exception : une ressource versionnée (?v=) dont le cache n'a qu'une autre version passe d'abord par le
// réseau, pour qu'une page neuve ne reçoive jamais un module d'une version d'avant ; hors ligne, la copie en cache sert quand même.
async function memeOrigine(req) {
  const c = await caches.open(CACHE);
  const exact = await c.match(req);
  if (exact) return exact;
  const proche = await c.match(req, { ignoreSearch: true });
  if (proche && !new URL(req.url).searchParams.has('v')) return proche;
  try {
    const r = await fetch(req);
    if (r && r.status === 200 && r.type === 'basic') c.put(req, r.clone()).catch(() => {});
    return r;
  } catch (e) {
    if (proche) return proche;
    throw e;
  }
}

async function cdn(req) {
  const c = await caches.open(CACHE);
  const hit = await c.match(req.url);
  if (hit) return hit;
  try {
    const r = await fetch(cors(req.url));
    if (bonne(r)) c.put(req.url, r.clone()).catch(() => {});
    return r;
  } catch (e) { return fetch(req); }   // sans CORS : la réponse (opaque) est servie telle quelle, jamais mise en cache
}

self.addEventListener('fetch', (e) => {
  const req = e.request;
  // Le précache des images pas fini (ou un worker redémarré qui ne sait pas s'il l'est) : il tourne, et cette requête garde le worker en vie jusqu'à la fin
  if (!imagesFinies) e.waitUntil(imagesEnCache());
  if (req.method !== 'GET') return;
  let url; try { url = new URL(req.url); } catch (x) { return; }
  if (RESEAU_SEUL.test(url.hostname)) return;
  if (req.mode === 'navigate') { e.respondWith(navigation(req)); return; }
  if (url.origin === self.location.origin) { e.respondWith(memeOrigine(req)); return; }
  if (CDN_HOTES.test(url.hostname)) { e.respondWith(cdn(req)); return; }
});

self.addEventListener('message', (e) => { if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting(); });

/* ——— Notifications (tâche 4) ——— */
// Textes copiés de V.TEXTES (athena-v1.js) tels quels : mob.notif.titre, eco.exp.notif, mob.notif.matin, mob.notif.matin.corps — le service worker ne
// charge pas athena-v1.js ; test/mobile_notif.js vérifie que les copies sont à jour.
const TEXTES = { titre: 'Athéna', retour: 'Tes compagnons sont rentrés au camp.', matinT: 'Le résumé du matin', matin: 'Ton résumé du matin t’attend au camp.', quete: 'C’est l’heure : ' };
const C = self.AthenaMobileCommun;   // la base IndexedDB de AthenaMobile.miroir (base, version, magasin, cle) et les options des notifications

// Le clic sur une notification (ou sur « Voir ») : la fenêtre de l'app reprend le focus, sinon elle s'ouvre ; puis l'app ouvre le camp
self.addEventListener('notificationclick', (e) => {
  e.notification.close();
  const action = e.action || (e.notification.data && e.notification.data.action) || 'voir';
  e.waitUntil((async () => {
    const portee = self.registration.scope;
    const fenetres = (await self.clients.matchAll({ type: 'window', includeUncontrolled: true })).filter((x) => x.url.indexOf(portee) === 0);
    let cl = fenetres.find((x) => 'focus' in x) || null;
    if (cl) { try { cl = (await cl.focus()) || cl; } catch (x) {} } else cl = await self.clients.openWindow(PAGE + '?source=pwa');
    if (cl && cl.postMessage) cl.postMessage({ type: 'athena-notif', action });
  })());
});

const ouvrirBase = () => new Promise((ok, ko) => {
  const r = indexedDB.open(C.base, C.version);
  r.onupgradeneeded = () => { if (!r.result.objectStoreNames.contains(C.magasin)) r.result.createObjectStore(C.magasin); };
  r.onsuccess = () => ok(r.result);
  r.onerror = () => ko(r.error);
});
const lireMiroir = (db) => new Promise((ok, ko) => { const g = db.transaction(C.magasin).objectStore(C.magasin).get(C.cle); g.onsuccess = () => ok(g.result || null); g.onerror = () => ko(g.error); });
// Marque ce qui vient d'être montré sans toucher au reste (le Prototype a pu écrire entre-temps)
const marquer = (db, montre) => new Promise((ok) => {
  const t = db.transaction(C.magasin, 'readwrite'), m = t.objectStore(C.magasin), g = m.get(C.cle);
  g.onsuccess = () => { if (g.result) m.put(Object.assign({}, g.result, { montre: Object.assign({}, g.result.montre, montre) }), C.cle); };
  t.oncomplete = () => ok(true); t.onerror = t.onabort = () => ok(false);
});
const montrer = (e, titre, corps, tag, action) => self.registration.showNotification(titre, C.options({ corps, tag, action, vibrer: e.vibrer !== false }));

// App fermée : ce qui est dû, dans la plage, une fois
async function resumeMatin() {
  if (self.Notification && self.Notification.permission !== 'granted') return;
  const db = await ouvrirBase();
  try {
    const e = await lireMiroir(db); if (!e) return;
    const H = Array.isArray(e.heures) && e.heures.length === 2 ? e.heures : null, d = new Date(), h = d.getHours() + d.getMinutes() / 60;
    const vu = Object.assign({ retourA: null, matinA: null, quetes: {} }, e.montre), maintenant = Date.now(), montre = {};
    /* 21/10 · les rappels des quêtes à heure : l'heure que la personne a choisie (pas de plage), seulement dans l'heure qui suit, une fois */
    if (e.rappels && Array.isArray(e.quetes)) { const vus = Object.assign({}, vu.quetes);
      for (const q of e.quetes) { const k = q.id + ':' + q.a; if (q.a <= maintenant && maintenant - q.a < 36e5 && !vus[k]) { await montrer(e, TEXTES.titre, TEXTES.quete + q.t, 'quete-' + q.id, 'camp'); vus[k] = 1; montre.quetes = vus; } } }
    if (!H || !(h >= H[0] && h < H[1])) { if (Object.keys(montre).length) await marquer(db, montre); return; }
    if (e.compagnons && typeof e.retourA === 'number' && e.retourA <= maintenant && vu.retourA !== e.retourA) { await montrer(e, TEXTES.titre, TEXTES.retour, 'retour', 'camp'); montre.retourA = e.retourA; }
    if (e.matin && typeof e.matinA === 'number' && e.matinA <= maintenant && vu.matinA !== e.matinA) { await montrer(e, TEXTES.matinT, TEXTES.matin, 'matin', 'matin'); montre.matinA = e.matinA; }
    if (Object.keys(montre).length) await marquer(db, montre);
  } finally { db.close(); }
}
self.addEventListener('periodicsync', (e) => { if (e.tag === 'resume-matin') e.waitUntil(resumeMatin().catch(() => {})); });
