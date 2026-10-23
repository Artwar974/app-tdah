/* Athéna · commun/athena-mobile-config.js — la configuration du téléphone (passe du 20/10, mobile, tâche 5), chargée par le Prototype.
 *
 * googleClientId : l'ID client OAuth « Application Web » de Google, pour relier Google Agenda (Journal › Carnet › Téléphone, profil Parent).
 *   Vide = les boutons Google n'apparaissent pas ; le fichier .ics, le lien Google Agenda et l'app Agenda du téléphone marchent sans lui.
 *   C'est un ID public, pas un secret (il se voit dans toute page qui l'utilise) : sa place est ici, dans le dépôt. Aucune clé, aucun
 *   « client secret » ne va dans ce fichier.
 *   L'utilisateur le crée lui-même : console.cloud.google.com › projet « Athena demo » › activer « Google Calendar API » › écran de consentement
 *   Externe en mode Test (adresses des testeurs) › Identifiants › ID client OAuth « Application Web », origine JavaScript autorisée
 *   https://athena-v1.baptistebertil.workers.dev ; puis le coller entre les guillemets ci-dessous (il finit par .apps.googleusercontent.com).
 *   Ensuite : dans Prototype.dc.html, passer commun/athena-mobile-config.js?v= à la version suivante (deux endroits), puis relancer
 *   python3 -I outils/generer-precache.py — sinon le téléphone où l'app est installée garde l'ancienne copie de ce fichier.
 * Une configuration posée avant ce fichier (une page de test, par exemple) est gardée. */
window.AthenaMobileConfig = Object.assign({
  googleClientId: ''
}, window.AthenaMobileConfig);
