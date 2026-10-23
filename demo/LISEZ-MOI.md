# Athéna · plan du projet

Le prototype de l’app Athéna (« Le Journal de Quêtes ») : un camp qui vit avec les quêtes du jour. Deux espaces : la **V1** et les **Incursions** (tower defense, hors V1, désactivé par défaut). Commence par **Accueil.dc.html** : le jeu en une page (pour qui, la boucle, le camp qui grandit, le Grand Sentier, les nouveautés, le social, ce qui fait revenir, le camp vivant), puis les choix qui restent à faire et les dessins à commander. La dernière passe : passes/passe-19-10/ (le camp qui récompense pendant l’action, puis sa relecture : lisez-moi, conception, état), passe-20-10/ (la passe technique : PixiJS 8.22.0 et un seul moteur, le dossier d’intégration pour la vraie app ; puis la passe de conception : le Ponton en parcours, le résumé du matin, les quêtes d’hier, le coffre inventaire, 12 paliers par mois : 03-CONCEPTION.md et 04-ETAT.md).

## Les 8 pages

| Page | En une phrase |
|---|---|
| Accueil.dc.html | Le jeu en une page, pour la démo (ados et parents) ; puis les 20 choix (le 20/10, six sont tranchés ; le 3 et le 11 sont remplacés), où on en est, les dessins à commander avec leurs fiches, le guide et le journal. |
| Prototype.dc.html | L’app jouable dans un téléphone : le camp dessiné par un seul moteur (la scène PixiJS 8.22.0 ; une image fixe du camp en repli sans WebGL) avec sa caméra et ses personnages, ses niveaux et ses places, les nouveautés une à une, le Grand Sentier et ses saisons, le Hameau et son défi ; le configurateur (choix à faire du 14/10 et du 19/10, heure, DA, profil Ado ou Parent, simulation). |
| Ecrans.dc.html | Les écrans de la V1 par parcours, chacun ouvrable dans le prototype ; on y modifie les textes. |
| Mecaniques.dc.html | Les mécaniques rangées par rythme (la quête, la journée, la saison) et le barème 4 calculé par le module depuis V.JEU.eco. |
| DA.dc.html | Les deux directions artistiques : couleurs (dont les 4 saisons), polices, icônes, avatars, composants, « Bâtiments et paliers » (chaque niveau, chaque palier du Sentier, ce qui est dessiné et ce qu’il reste à générer), et « Le mouvement » (le système d’animation en démonstration). |
| Decisions.dc.html | En tête, les choix à faire (1 à 20) ; puis les décisions par thème (celles du 19/10 comprises), les remplacées repliées, l’intégration et la sauvegarde. |
| Mobile-test.dc.html | Les QR pour installer la V1 testable sur un téléphone (dessinés par le code), les versions distribuées, les avis des testeurs gardés dans le navigateur (clé athena-v1-mobile) et exportables en JSON ou Markdown, avec import-fusion. |
| Tower defense.dc.html | Les Incursions, hors V1. Nom de fichier inchangé : il sert de lien avec le dépôt. |

## Les fichiers de la racine

| Fichier | Rôle |
|---|---|
| athena-v1.js | Le contenu de la V1, source unique : textes, écrans, mécaniques, décisions, barème de l’économie (V.JEU.eco), niveaux du camp et nouveautés, textes de l’Accueil (V.SYNTHESE), journal des changements. |
| athena-v1-rapport.js | La suite lue par Décisions : vérifications, modèle de sauvegarde, migration. |
| support.js | Le moteur des pages .dc.html. Ne pas toucher. |
| github.md | La note de synchronisation avec le dépôt. |
| LISEZ-MOI.md | Ce plan. |
| Camp-scene.html | « Camp en une scène » seul : le moteur du camp (PixiJS 8.22.0) avec ses réglages (heure au centième, événements, tente, mer, vent, caméra, gestes, visiteur, jauge du feu, chantiers, animations légères, cadence 30, culling) et la mesure (images par seconde, boucle en ms). |
| atelier.html | L’Atelier des personnages : les animations du minotaure (dont les gestes du 19/10, le clignement et le mouvement secondaire), réglées en direct ; « Copier les réglages » exporte vers minotaure.json. |

## Les dossiers

| Dossier | Rôle |
|---|---|
| commun/ | Ce que partagent les pages : le moteur du camp (athena-scene.js, athena-scene.json, athena-marionnette.js), le système d’animation (athena-motion.css, athena-motion.js), barre du hub et avis des testeurs (hub-v1.js), icônes, polices, sons, particules, le module de l’économie (athena-economie.js), le module des avatars de la vraie app (athena-avatars.js), le générateur de QR (athena-qr.js) et le téléphone (athena-mobile.js, voir plus bas). Les anciens modules du camp (décor, objets animés, lumière, particules en canevas) sont aux Archives depuis le 20/10. |
| assets/ | Les images : la scène du camp (assets/scene/, la seule source des images du camp, dont la marionnette assets/scene/minotaure/), les images de la doc (assets/doc/), kits d’icônes et licences, planches sources. Les anciens dossiers du décor (decor, optim, housing, camp) sont aux Archives depuis le 20/10, sauf les quelques fichiers que les Incursions lisent encore. |
| outils/ | Les pages de test et de mesure, dont le simulateur de l’économie (economie-test.html, 87 règles) et la mesure de la scène (fps-test.html). Elles s’ouvrent depuis outils/ et lisent la racine. |
| scripts/ | verifier-projet.py : contrôle du projet sans le lancer. |
| passes/ | Un dossier par passe : passe-08-10/, passe-14-10/ (économie), passe-17-10/ (le camp qui grandit), passe-19-10/ (le camp qui récompense pendant l’action, puis sa relecture : lisez-moi, conception, état), passe-20-10/ (la passe technique : PixiJS 8.22.0 et un seul moteur, le dossier d’intégration pour la vraie app ; puis la passe de conception : le Ponton en parcours, le résumé du matin, les quêtes d’hier, le coffre inventaire, 12 paliers par mois : 03-CONCEPTION.md et 04-ETAT.md). |
| generation-images/ | Le dossier pour générer les images à commander : un brief par dessin, les prompts, le style, les références, le contrôle. |
| tower-defense/ | Ce qui est propre aux Incursions. |
| Archives/ | Tout ce qui n’est plus lu par une page, rangé par date : voir Archives/INDEX.md. |

## Le téléphone (PWA)

La V1 s’installe sur un téléphone depuis Chrome (Android) : un manifest, un service worker et des icônes, tout en chemins relatifs. Elle est en ligne sur https://athena-v1.baptistebertil.workers.dev/ : Cloudflare publie le dossier demo/ tel quel à chaque mise à jour de main (wrangler.jsonc et cloudflare/worker.js à la racine du dépôt, chaque fichier à son adresse exacte) ; on peut aussi l’ouvrir tout de suite par un tunnel HTTPS (outils/tunnel-https.ps1 du dépôt, adresse à coller dans Mobile test). Après un changement d’un fichier mis en cache : python3 -I outils/generer-precache.py (le vérificateur le rappelle, règle 11).

L’adresse du site (le QR) ouvre d’abord la page d’installation (index.html), puis l’app seule (Prototype.dc.html?app=1) : plein écran, sans la barre du hub, sans le panneau de réglages ni le cadre de téléphone, l’heure du téléphone allumée. L’app installée (?source=pwa) s’ouvre de la même façon ; ?reglages=1 garde la page du hub et son panneau, pour les contrôles. demo/.assetsignore écarte du site les pages de travail (hub, docs, outils, archives) : elles restent dans le dépôt et dans l’artefact.

Rappels et agenda (21/10) : Journal › Carnet › Téléphone a un troisième interrupteur, « Me rappeler mes quêtes à leur heure ». App ouverte, la quête due s’affiche en bandeau ; app cachée, une notification part (une seule fois par quête et par jour, hors de la plage du jour). App fermée, sw.js la montre au prochain réveil périodique (periodicsync), que le téléphone place quand il veut : pour un rappel à l’heure près, l’envoi des quêtes dans l’agenda reste le plus sûr. Dans l’autre sens, « Importer un agenda (.ics) » lit un fichier exporté de Google Agenda ou d’Apple Calendrier (événements du jour et récurrents) et chaque rendez-vous, comme ceux de « Voir les rendez-vous du jour », a un bouton « Ajouter » qui en fait une quête (moment de la journée d’après l’heure, répétition reprise). Test : test/mobile_rappels.js.

Passe du 22/10 (retours de Baptiste et de son associé) : le cadrage du camp montre toute la largeur du tableau (zoom minimal de la scène, bande de ciel en haut : CIEL_EXT et uCielHaut dans commun/athena-scene.js, V.JEU.camera.large.z = 0 = « auto ») ; le Grand Sentier en bouton « pass » sous l’avatar ; Créer une quête dans l’ordre activité → moment (sélecteur d’heure) → répétition, sans « jours du mois » ; la barre du bas sans les quêtes faites, sans « C’est fait » ni « Version courte » (pastille calme : créneau, heure ou minutes restantes ; le rond se remplit pendant un minuteur) ; le Ponton : recruter un compagnon au sort (nom, rareté, stats), choisir destination, compagnons, charmes et façon de partir, agrandir le bateau (module d’économie version 5, V.JEU.eco recopié) ; l’icône « compagnon » ; la scène : bateau qui part, torches sur le sentier, écume peinte effacée (effets.ecumePeinte), cabane du port. Tests : test/t2210_*.js (ATHENA_PORT / ATHENA_URL).
Passe du 22/10, suite (23/10) · les calques du camp (liste V2 : 5.1, 5.2, 5.4) : l’écume peinte au large est effacée des quatre fonds au chargement (nettoyage CPU dans commun/athena-scene.js, scene.ecume donne les temps ; effets.ecumePeinte = 1 remet les fonds bruts) ; la falaise droite repasse devant la montagne (masque de la couche du mont, polygone dans assets/scene/cascade/cascade.json) ; la falaise gauche du tableau d’origine est réintégrée (assets/scene/fond/falaise_gauche_*.png, produites par outils/decouper-falaise-gauche.py depuis assets/optim/*-hd.webp ; effets.falaiseGauche). Boutons dans Camp-scene.html. Suites : test/t2210_ecume.js, test/t2210_falaise_droite.js (+ .py), test/t2210_falaise_gauche.js (ATHENA_PORT).

| Fichier | Rôle |
|---|---|
| manifest.webmanifest | Ce que le téléphone installe : « Athéna », ouverture sur Prototype.dc.html?source=pwa, plein écran (standalone), portrait, fond #f4eee6, trois icônes dont une maskable, raccourci « Le camp ». |
| sw.js | Le service worker (portée ./) : la coquille et les 4 scripts CDN en cache à l’installation, les images du camp ensuite ; les pages par le réseau d’abord (3 s), le reste par le cache d’abord ; le camp s’ouvre sans réseau, et une nouvelle version s’annonce par « Nouvelle version prête · Recharger ». |
| sw-precache.js | Généré par outils/generer-precache.py, ne pas le modifier à la main : la version du cache (date et empreinte des fichiers) et les listes que sw.js met en cache. |
| index.html | La page d’entrée du site, celle du QR : « Installer l’app » ouvre l’invite d’installation du téléphone (Android, Chrome), sinon les gestes à faire (menu ⋮ de Chrome, Partager de Safari sur iPhone) ; « Ouvrir sans installer » mène à Prototype.dc.html?app=1 ; l’app installée passe tout droit. Elle enregistre sw.js (par AthenaMobile) : l’app est installable dès cette page. |
| icones/ | icone.svg (la flamme de la vignette du Prototype) et ses PNG 192, 512, maskable 512 et badge-96, rendus par outils/generer-icones.js : aucune image dessinée à la main. |
| commun/athena-mobile-commun.js | AthenaMobileCommun : les options des notifications et la base IndexedDB du miroir (nom, magasin, clé), un seul exemplaire pour la page (chargé avant commun/athena-mobile.js) et le service worker (sw.js l’importe). |
| commun/athena-mobile.js | AthenaMobile, chargé par le Prototype : enregistre sw.js (jamais dans l’artefact publié), propose l’installation quand le navigateur le permet (Journal › Carnet › Téléphone) et annonce une nouvelle version ; les notifications ; l’agenda (fichier .ics, lien Google Agenda, app Agenda du téléphone sur Android, API Google Agenda facultative). |
| commun/athena-mobile-config.js | La configuration du téléphone : googleClientId, l’ID client OAuth « Application Web » de Google Agenda (vide par défaut : les boutons Google n’apparaissent pas). Un ID public, pas un secret ; l’utilisateur le crée (console.cloud.google.com, origine https://athena-v1.baptistebertil.workers.dev) et le colle ici. |

## Trois règles

- Le monde du jeu se dessine dans la scène PixiJS (commun/athena-scene.js, athena-scene.json, athena-marionnette.js, assets/scene/) ; l’interface reste en HTML par-dessus, reliée par les événements de la scène. On ne dessine aucune interface dans PixiJS.
- Les modules de la vraie app, rangés aux Archives (Archives/2026-10-20-ancien-moteur/ : athena-decor.js, athena-objets-animes.js, athena-camp-lumiere.js), ne se modifient pas ; commun/athena-avatars.js non plus. Le module de l’économie (commun/athena-economie.js) ne reçoit que des ajouts (données, fonctions) : son comportement par défaut ne change pas, et V.JEU.eco en reste la copie exacte. Le moteur du camp (athena-scene.js, athena-scene.json, athena-marionnette.js, minotaure.json) garde son API et ses événements ; ses versions d’avant chaque passe sont dans Archives/.
- Rien ne se supprime : ce qui sort va dans Archives/, avec une ligne dans Archives/INDEX.md.
