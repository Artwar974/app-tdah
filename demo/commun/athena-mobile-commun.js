/* Athéna · commun/athena-mobile-commun.js — ce que la page et le service worker partagent sur le téléphone (passe du 20/10, mobile ; tâche 11).
 * Un seul exemplaire des options des notifications et de la base IndexedDB du miroir : chargé par le Prototype avant commun/athena-mobile.js, et par
 * sw.js (importScripts, même ?v=). Objet global AthenaMobileCommun (self : la fenêtre ou le service worker).
 * base / version / magasin / cle : la base IndexedDB que AthenaMobile.miroir écrit et que sw.js lit quand l'app est fermée.
 * options({ corps, tag, action, donnees, vibrer }) : les options de registration.showNotification — icône de l'app, badge, action « Voir »,
 *   renotify false, data = donnees + { action } (« voir » par défaut), tag s'il est donné, vibration [40] sauf vibrer === false (mouvement réduit). */
(function (G) {
  'use strict';
  const ICONE = 'icones/icone-192.png', BADGE = 'icones/badge-96.png', VIBRATION = [40];
  G.AthenaMobileCommun = Object.freeze({
    base: 'athena-mobile', version: 1, magasin: 'etat', cle: 1,
    options(o) {
      o = o || {};
      const x = { body: o.corps || '', icon: ICONE, badge: BADGE, renotify: false, actions: [{ action: 'voir', title: 'Voir' }], data: Object.assign({}, o.donnees, { action: o.action || 'voir' }) };
      if (o.tag) x.tag = String(o.tag);
      if (o.vibrer !== false) x.vibrate = VIBRATION.slice();
      return x;
    }
  });
})(typeof self !== 'undefined' ? self : this);
