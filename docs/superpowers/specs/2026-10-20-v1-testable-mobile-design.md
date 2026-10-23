# V1 testable sur téléphone — conception (20/10/2026)

Demande : « mets à jour l'artefact et crée un prototype testable sur téléphone qu'on peut télécharger en app en scannant un QR ; un onglet « Mobile test » pour les QR, les versions distribuées et les avis ; une V1 avec les visuels manquants en substitut ; le Sentier inspiré des battle pass ; le niveau de qualité de Pixelio (sans rien en reprendre) ; notifications sur le téléphone ; synchronisation d'agenda Google ou Apple ; appareils Google Pixel 10 Pro et Pixel 11 ; démo test entre nous, sans sécurité d'app en ligne pour l'instant ; va au principal. »

Ce document est le résultat de la phase de compréhension (7 lectures parallèles : références Pixelio, planches « battle pass », code du Sentier, hébergement PWA et notifications, pages du hub, QR, app réelle). Il tranche ce que la demande laisse ouvert. Les décisions récentes de la refonte priment sur les notes anciennes de `docs/`.

## 1. Ce qui est livré

| Élément | Où | Forme |
|---|---|---|
| La V1 testable (le hub de la refonte, Prototype compris) | `demo/` dans `Baptiste974/app-tdah`, branche `demo-mobile-v1`, PR vers `main` | copie de travail du dossier publié de l'artefact (sans `Archives/`), servie telle quelle |
| Installation sur téléphone | `demo/manifest.webmanifest`, `demo/sw.js`, `demo/icones/`, `demo/commun/athena-mobile.js` | PWA installable depuis Chrome Android (WebAPK) |
| Hébergement HTTPS | `.github/workflows/pages.yml` (GitHub Pages par Actions, dossier `demo`) | URL `https://baptiste974.github.io/app-tdah/` ; activation par l'utilisateur (voir § 9) |
| Test immédiat sans hébergement | `outils/tunnel-https.ps1` | tunnel `cloudflared` vers `outils/serveur-local.ps1` |
| Onglet « Mobile test » | `demo/Mobile-test.dc.html`, `demo/commun/athena-qr.js`, `H.mobile` dans `demo/commun/hub-v1.js`, `V.MOBILE_TEST` dans `demo/athena-v1.js` | QR dessinés par le code, versions distribuées, avis des testeurs (navigateur + export/import) |
| Notifications | `demo/commun/athena-mobile.js`, `demo/sw.js`, section « Téléphone » du Journal › Carnet | permission sur geste, `showNotification` depuis le service worker, synchronisation périodique au mieux |
| Agenda | `demo/commun/athena-mobile.js`, `demo/commun/athena-mobile-config.js`, fiche d'une quête et Carnet | fichier `.ics`, lien Google Agenda, intention Android, API Google Calendar côté client (facultative, ID client à créer) |
| Grand Sentier façon pass | `demo/Prototype.dc.html`, `demo/athena-v1.js`, `demo/commun/athena-motion.css` | colonne verticale de 13 cartes, jauge, prochain palier, bornes, étagère, frise, fin de saison |
| Qualité « niveau Pixelio » | `test/mobile_qualite.js`, corrections | grille de 10 critères mesurables, contrôles automatiques |
| Compte rendu | `demo/passes/passe-20-10-mobile/00-LISEZ-MOI.md`, PR | changé / vérifié / ne marche pas / étapes qui restent à l'utilisateur |
| Artefact | https://claude.ai/artifact/L4ZMGPiAahZyX653Z4Yq69 | republié depuis `demo/` (synchronisé vers le dossier `pub/` de l'artefact) |

## 2. Règles qui s'appliquent à tout

- Ne jamais toucher `Tower defense.dc.html`, `tower-defense/`, `index.html` (l'app réelle), ni le dépôt `Artwar974/app-tdah`.
- Rien de Pixelio : ni code, ni texte, ni image, ni son. Les références servent de barre de qualité. Le mot « pixelio » n'apparaît dans aucun texte d'écran.
- Aucune nouvelle image dessinée à la main : les visuels manquants sont des formes dessinées par le code (CSS, SVG, PixiJS), des images déjà dans `assets/scene/` (atlas `objets.webp`, `olivier.webp`, `lavande.webp`, `laurier.webp`, tentes, planches animées) ou des icônes du kit. Les icônes PWA sont la rastérisation d'un dessin existant (la flamme de la vignette des pages), par un script.
- Aucune punition ni culpabilisation : pas de rouge d'alerte, pas de clignotement, pas de compte à rebours en heures, pas de « il te manque », pas de comparaison ni de classement, pas de série de jours. Les mots de `V.MOTS_INTERDITS` sont absents de tous les textes (écrans, notifications, questionnaire d'avis).
- Un mot, un sens (coffre = l'inventaire, « Dans le coffre » ; réserves = bois et or, « Dans tes réserves »).
- Accessibilité : cibles ≥ 44 × 44 px, textes ≥ 13 px, contraste ≥ 4,5:1, mouvement réduit respecté (l'information reste, l'animation s'efface), tout écran lisible à 390 × 844 et 360 × 640, deux profils (Ado, Parent) et deux DA (Figures rév. 2, Veillée d'origine), jour et nuit.
- PixiJS épinglé 8.22.0, chargé seulement par le Prototype, Camp-scene et l'atelier. Toute l'interface reste en HTML au-dessus de la scène. 60 fps à 390 × 844, < 10 ms par image, arrêt quand l'onglet est caché.
- `V.JEU.eco` = copie exacte de `AthenaEconomie.DEFAUT` ; `commun/athena-economie.js` n'accepte que des ajouts ; aucun nombre d'économie écrit en dur dans la logique du Prototype (lire `b.sentier.*`).
- Contenu dans `athena-v1.js` (source unique, données pures : le vérificateur l'exécute dans une VM sans navigateur) ; mécanique dans `hub-v1.js` ou les modules `commun/` ; sons via `commun/athena-sons.js` ; animations via `athena-motion.css/js`.
- Rien ne se supprime dans `demo/` (ce qui part va dans `Archives/` avec une ligne dans `Archives/INDEX.md`).
- Versions de cache `?v=` identiques dans toutes les pages (hors Tower defense) ; `python3 -I demo/scripts/verifier-projet.py demo` à 0 erreur et 0 alerte avant chaque commit qui touche `demo/`.
- Commits préfixés `feat:` / `fix:` / `docs:` / `refactor:` (CONTRIBUTING.md), aucune clé ni mot de passe dans le dépôt.
- Pas d'argent dans la démo.

## 3. Hébergement et installation (PWA)

Décision : GitHub Pages par GitHub Actions, dossier `demo` publié à la racine du site. URL du site : `https://baptiste974.github.io/app-tdah/`. Page d'entrée `demo/index.html` = redirection immédiate vers `Prototype.dc.html`. Tout est en chemins relatifs (`./`) à cause du préfixe de site de projet.

Ce que seul l'utilisateur peut faire : dans GitHub, Settings › Pages › Source = « GitHub Actions » (le dépôt est privé : GitHub Pages sur dépôt privé demande GitHub Pro, sinon passer le dépôt en public ; le site est public dans les deux cas, ce que la demande accepte « pour l'instant »). Tant que ce n'est pas fait, le QR « app » pointe vers l'adresse prévue et l'onglet Mobile test l'indique. Variante immédiate : `outils/tunnel-https.ps1` (serveur local + `cloudflared`), adresse à coller dans l'onglet Mobile test qui dessine le QR à la volée.

`demo/manifest.webmanifest` : `id` `athena-demo`, `name` « Athéna · Le Journal de Quêtes », `short_name` « Athéna », `lang` `fr`, `start_url` `./Prototype.dc.html?source=pwa`, `scope` `./`, `display` `standalone`, `orientation` `portrait`, `background_color` et `theme_color` `#f4eee6`, `prefer_related_applications` `false`, icônes `icones/icone-192.png` (192, any), `icones/icone-512.png` (512, any), `icones/icone-maskable-512.png` (512, maskable), raccourci « Le camp » → `./Prototype.dc.html?ecran=camp`. Pages de la démo : `<meta name="robots" content="noindex">`.

Icônes : `outils/generer-icones.js` (Node + Playwright, Chromium déjà installé) rend `demo/icones/icone.svg` (la flamme de la vignette : fond `#f4eee6`, flamme `#a3452a`, trait `#211612`, copiée du `<template id="__bundler_thumbnail">` du Prototype) en PNG 192, 512, maskable 512 (motif dans les 80 % centraux) et `badge-96.png` (flamme seule en blanc sur fond transparent, monochrome).

`demo/sw.js` (portée `./`) + `demo/sw-precache.js` généré par `outils/generer-precache.py` (constante `VERSION` = date + empreinte courte des fichiers ; listes `COQUILLE`, `IMAGES`, `CDN`) : à l'installation, cache strict de la coquille (`Prototype.dc.html`, `index.html`, `support.js`, `athena-v1.js`, `athena-v1-rapport.js`, `commun/*.js`, `*.css`, `*.json`, polices, `manifest.webmanifest`, `icones/*`) et des 4 scripts CDN demandés en mode `cors` ; à l'activation, suppression des caches d'une autre version, `clients.claim()`, puis précache tolérant (`allSettled`) des images de `assets/scene/` ; à la requête : navigations = réseau d'abord avec délai 3 s puis `Prototype.dc.html` en cache ; même origine GET = cache d'abord (`ignoreSearch: true`) puis réseau ; unpkg/jsdelivr = cache d'abord ; `accounts.google.com`, `googleapis.com`, `calendar.google.com` = réseau seul ; le reste passe. Messages `SKIP_WAITING`, `notificationclick`, `periodicsync` (§ 4).

`demo/commun/athena-mobile.js` (objet global `AthenaMobile`, chargé par le Prototype, déclaré en `ext-resource-dependency`) : `AthenaMobile.demarrer(app)` enregistre `./sw.js` seulement en contexte sécurisé et hors artefact publié (`!window.__resources`), montre un message discret « Nouvelle version prête · Recharger » quand une mise à jour attend, capture `beforeinstallprompt` et expose `AthenaMobile.installer()` ; aucun bandeau insistant.

Le `<head>` du Prototype (avant `support.js`) reçoit `<link rel="manifest" href="manifest.webmanifest">`, `<meta name="theme-color" content="#f4eee6">`, `<link rel="apple-touch-icon" href="icones/icone-192.png">`, `<meta name="mobile-web-app-capable" content="yes">`, `<meta name="robots" content="noindex">`. Le `theme-color` suit la DA à l'exécution (`#a3452a` Veillée, `#60445f` Figures rév. 2 : valeurs des boutons de `athena-ui.css`).

## 4. Notifications sur le téléphone

Deux paliers honnêtes, écrits tels quels dans l'app :

1. App ouverte ou installée et au premier plan : `registration.showNotification(titre, { body, icon: 'icones/icone-192.png', badge: 'icones/badge-96.png', tag, actions: [{ action: 'voir', title: 'Voir' }], vibrate })` (vibration `[40]` seulement sans mouvement réduit). Jamais `new Notification()` (lève « Illegal constructor » sur Chrome Android).
2. App installée et fermée : `periodicSync` (`resume-matin`, `minInterval` 12 h) si disponible ; le téléphone décide du moment. Les rappels à heure précise ne sont pas promis : ils passent par l'agenda (§ 5).

Ce qui déclenche une notification : le retour des compagnons d'expédition (`eco.exp.notif` « Tes compagnons sont rentrés au camp. ») et le résumé du matin (« Ton résumé du matin t'attend au camp. ») ; un bouton « Essayer une notification » dans les réglages. Rien d'autre : pas de badge d'icône avec un compte, pas de « tu n'as pas fait ».

Réglages (Journal › Carnet, nouvelle section « Téléphone », dans l'ordre : installation, notifications, agenda) : une carte d'explication en HTML (texte seul + un exemple de rappel dessiné en CSS) et deux interrupteurs « Prévenir quand les compagnons rentrent (en journée) » (texte existant `eco.exp.notifReglage`) et « Le résumé du matin », éteints par défaut ; `Notification.requestPermission()` n'est appelé que depuis le geste sur un interrupteur ; refus = les interrupteurs restent éteints avec « Plus tard, dans les réglages du téléphone » sans reproche. Plage autorisée : 8 h à 21 h (données dans `V.MOBILE.notifs.heures`).

Miroir pour le service worker : IndexedDB `athena-mobile`, magasin `etat` (clé `1`) = `{ retourA, matinA, heures: [8, 21], compagnons: bool, matin: bool, montre: { retourA, matinA } }` écrit à chaque sauvegarde du Prototype quand une option est allumée ; `periodicsync` lit, montre ce qui est dû dans la plage et marque `montre`. `notificationclick` : focus du client ou `openWindow('./Prototype.dc.html?ecran=camp')`, puis `postMessage({ type: 'athena-notif', action })` ; l'app ouvre le camp.

## 4 bis. L'heure du téléphone (ajout du 20/10, révélé par la relecture de la tâche 4)

Le Prototype tourne sur une horloge de démonstration (`maintenant(S)` = `V.DEMO.date` + `S.jour` + `S.heure` + `S.avance`, réglée par le panneau). Sur un téléphone, une V1 testable doit suivre l'heure réelle, sinon le décor, les créneaux, les expéditions, le résumé du matin et les notifications ne correspondent à rien.

- Mode « téléphone » (`S.horloge === 'telephone'`) : actif par défaut quand l'app est lancée installée (`display-mode: standalone` ou `?source=pwa`) et qu'aucun paramètre de démonstration n'est dans le fragment ; un interrupteur « Suivre l'heure du téléphone » dans Journal › Carnet › Téléphone (44 px) l'allume ou l'éteint partout. Dans le hub et l'artefact (navigateur), il reste éteint par défaut : le panneau de démonstration garde la main.
- En mode téléphone : `S.heure` suit l'heure locale de l'appareil (décimale) ; à la première activation, la date de départ du jeu (`S.depart`, `AAAA-MM-JJ` local) est fixée au jour réel sans perdre la progression (les dates de l'économie sont recalées du même écart, une seule fois) ; ensuite `S.jour` = nombre de jours locaux depuis `S.depart` + 1 et `maintenant(S)` = l'heure réelle.
- Un changement de date réelle (à l'ouverture, au retour au premier plan, par une vérification toutes les 30 s tant que l'app est visible) déclenche `lendemain()` une fois par jour passé, au plus `V.JEU.retourJours` fois, puis le retour après absence existant au-delà ; jamais de reproche, jamais de compte de jours manqués.
- Le panneau de démonstration (heure, jour, avance) éteint le mode téléphone dès qu'on le touche, avec le message « Heure de démonstration » ; l'interrupteur le rallume.
- Les notifications (§ 4) utilisent alors des heures réelles exactes.
- Les suites de contrôle existantes passent des paramètres dans le fragment : elles restent en horloge de démonstration.

## 5. Agenda (Google, Apple)

Sans compte ni serveur, trois voies, offertes dans la fiche d'une quête (appui long › options › « Mettre dans mon agenda », une feuille à trois choix) et dans Carnet › Téléphone (« Exporter mes quêtes à heure (.ics) ») :

- `AthenaMobile.ics(quetes, o)` : `VCALENDAR` (`PRODID:-//Athena//V1//FR`, `X-WR-CALNAME:Athéna`, lignes terminées par CRLF, repliées à 75 octets), un `VEVENT` par quête à heure précise (`UID:<id>@athena`, `DTSTAMP`, `DTSTART`/`DTEND` en heure locale flottante `AAAAMMJJTHHMMSS`, durée 30 min, `RRULE:FREQ=DAILY` ou `FREQ=WEEKLY;BYDAY=…` pour une quête qui revient, `VALARM` `TRIGGER:-PT10M`), et pour une quête à créneau sans heure, l'heure du créneau prise dans `V.MOBILE.agenda.heures` (`matin` 8 h, `midi` 12 h, `apresmidi` 15 h, `soir` 19 h ; `libre` = événement sur la journée, `DTSTART;VALUE=DATE`).
- `AthenaMobile.partagerIcs(ics, nom)` : `navigator.share({ files })` si `navigator.canShare` l'accepte, sinon téléchargement `quetes-athena.ics` (`text/calendar`). C'est la seule voie pour Apple Calendrier (iPhone, Mac).
- `AthenaMobile.lienGoogleAgenda(q)` : `https://calendar.google.com/calendar/render?action=TEMPLATE&text=…&dates=…/…&ctz=<fuseau IANA>&details=…&recur=RRULE:…`.
- `AthenaMobile.intentAgenda(q)` : `intent:#Intent;action=android.intent.action.INSERT;type=vnd.android.cursor.item/event;S.title=…;l.beginTime=…;l.endTime=…;S.rrule=…;S.browser_fallback_url=<lien Google>;end`, proposé seulement sur Android.

Avec compte Google (profil Parent seulement, les comptes Family Link ne pouvant pas consentir) : `demo/commun/athena-mobile-config.js` porte `AthenaMobileConfig = { googleClientId: '' }` ; quand l'ID est renseigné, Carnet › Téléphone montre « Relier Google Agenda » (chargement à la demande de `https://accounts.google.com/gsi/client`, `initTokenClient` portée `calendar.events`, jeton en mémoire), « Envoyer mes quêtes à heure » (`events.insert` avec `extendedProperties.private.athena = id`) et « Voir les rendez-vous du jour » (`events.list` du jour, affichés en liste dans le Carnet). L'ID client est public par nature ; CONTRIBUTING.md le dit. Étapes de création côté utilisateur en § 9.

## 6. Le Grand Sentier façon pass de saison

Forme : colonne verticale (un seul sens de lecture, aucun geste horizontal, lisible à 360 px) de 13 cartes pleine largeur (cadeau d'arrivée en haut, paliers 1 à 12), sous une bannière de saison qui porte une jauge. Ce qui fait le niveau des références, traduit en Athéna : un seul fond, un seul système de cadre (jetons `--da-*`), une famille de titres et une de texte avec chiffres tabulaires, l'accent pour ce qui est gagné et la couleur de saison (`V.SAISONS.couleur[da]`) pour ce qui est grand, un seul bouton principal par écran, « Continuer » toujours actif dès l'apparition.

États d'un palier, nommés sans cadenas et sans désaturation : « à venir » (papier, filet 1 px), « prochain » (bord 2 px accent, `rv-respire` 2,8 s hors mouvement réduit), « tu es ici » (pastille avatar + texte, 13 px), « gagné » (papier-2, disque `--da-rond-fait-bg`, coche 22 px). Pas d'état « à réclamer » : la récompense arrive au Sommet par la carte et le vol.

Écran (feuille plein écran existante, `role=dialog`) :
1. Bannière : couleur et motif de saison (existants), icône 48 px, titre de saison, « Saison n · encore k semaines » (jamais d'heures), frise de 56 px faite d'images existantes teintées (olivier/laurier ; lavande + amphore ; lanterne répétée ; lavande + fanion) à opacité 0,22, jauge `role=progressbar` de 12 segments reliés (segments gagnés en couleur de texte de saison, bornes 10 px aux grands paliers 3, 6, 9, 12) et le compte « n / 12 » en chiffres tabulaires. Le premier `div` enfant du dialog reste la bannière (contrôle `lot3.js`).
2. Carte « Prochain palier » (sans `aria-live`) : « Un Sommet, et il est à toi. », récompense, emplacement ; éteinte au 12e.
3. Bloc bonus après le 12e : « Après le palier 12 : un objet pour le camp et 10 or par Sommet. » (valeurs lues dans `b.sentier`).
4. Liste `role=list` (enfants directs = 13 `button[role=listitem]`, cadeau en premier) : rail SVG continu à gauche (trait sable 6 px arrondi, pointillé ; copie en couleur de saison qui se remplit jusqu'au palier courant par `stroke-dashoffset`, 1 ms en mouvement réduit), pastille par palier, borne aux grands paliers (disque 60 px, bord 3 px de saison, couronne de 24 feuilles tracée en SVG, remplie à « gagné ») ; carte : numéro 14 px, visuel 52 px (64 grand), titre 600 `--t-1`, emplacement 13 px, pilule d'état à droite ; hauteur 96 px (128 grand).
5. Détail du palier choisi (le seul `aria-live=polite` du dialog, placé avant tout autre), avec « Voir au camp » (44 px) quand la récompense est un objet déjà gagné.
6. Règles corrigées : « Chaque Sommet te fait monter d'un palier. » / « Après le palier 12 : un objet pour le camp et 10 or par Sommet. »
7. Quêtes de saison (existantes, `[data-qs]`).
8. Étagère « Ce que la saison t'a déjà donné » : planche dessinée (deux dégradés, ombre `--o-1`) avec les sprites 36 à 48 px des objets gagnés, les ressources en tas d'icônes, les charmes en disques ; vide = `sen.deja.rien`.
9. « Revenir à mon palier » en `position: sticky` en bas du défileur quand on s'éloigne de plus de 160 px.

Visuel de chaque récompense (`visuelRecompense(R)`, sans nouvelle image) : ressources = icônes bois/or + nombre ; charme = icône « surprise » sur disque de bois dessiné ; compagnon = silhouette teintée ; lanterne = sprite de l'atlas `[825,292,39,96]` par `background-image/position/size` ; décor de saison = pile olivier + lanterne + fanion teintée ; Étincelle dorée = icône « etoile » avec `[data-rayons]` ; cadre d'avatar = avatar dans un cadre dessiné (bord 3 px de saison, coins en feuilles SVG) ; lanterne du Hameau = lampion dessiné ; grand décor + titre = pile 60 px + ruban de titre dessiné (« Ami des oliviers », 13 px capitales).

Carte du palier gagné (modale existante) : visuel 96 px, couronne SVG tracée en 0,9 s (`rv-anneau`) pour un grand palier, fête complète (`--t-grand`, passable d'un toucher) aux paliers 6 et 12, fête du Sommet (`--t-sommet`) aux 3 et 9 ; mouvement réduit : apparition 120 ms, pas de rayons ni de vols. Fin de saison : feuille « Fin de la saison n » avec la grille 4 × 3 des paliers (gagnés en couleur avec coche, les autres neutres, aucun compte de manque), les objets bonus reçus, le ruban de titre si le 12 est atteint, « Tu gardes tout. », puis « La saison n+1 commence : … » avec la nouvelle couleur qui glisse (opacité seule en mouvement réduit), un seul bouton « Continuer ».

Après le 12e palier, `recompense()` renvoie l'objet bonus (`b.sentier.bonus`) et non `auDela` ; `cartePalier(13)`, le bandeau du camp (« Prochain : un objet bonus », texte `ruban.bonus` existant) et `sen.regle2` en profitent. Trois traces corrigées : pastille « Tu es ici » 12,5 px → 13 px ; `sen.regle2` ; commentaire du barème (20 paliers, 8 semaines) dans `commun/athena-economie.js` ; `hint-placeholder-count` 21 → 13 ; image de doc `assets/doc/sentier.webp` régénérée par capture de l'écran refait (12 paliers).

Côté scène PixiJS : rien ne change au moteur ; aux paliers 6 et 12 l'app appelle `scene.definir('decor-saison', …)` comme aujourd'hui. Toute nouvelle animation reprend un nom existant ou est ajoutée aux listes de mouvement réduit de `athena-motion.css`.

Contrôles : `test/lot3.js` adapté en vertical (`scrollTop`/`scrollHeight`, `offsetTop`/`offsetHeight`/`clientHeight`), `test/sentier_pass.js` (jauge, prochain, bonus après le 12e, étagère, fin de saison, 13 px, 44 px, mouvement réduit), captures 390 × 844 et 360 × 640 dans les deux DA et les deux profils.

## 7. Onglet « Mobile test »

`demo/Mobile-test.dc.html` (squelette de `Decisions.dc.html` : `support.js`, `meta athena-page`, vignette SVG dessinée, helmet avec polices auto-hébergées et scripts versionnés, `<x-import hub-nav>`), entrée `['Mobile-test.dc.html', 'Mobile test']` dans `H.PAGES` après Décisions, description dans `DESC` de l'Accueil, « Les 8 pages » dans `LISEZ-MOI.md`, entrée `V.CHANGEMENTS`, étape de visite guidée facultative. Trois sections :

- `#qr` : une carte par cible de `V.MOBILE_TEST.cibles` (`app` = `https://baptiste974.github.io/app-tdah/`, statut `a-activer` ; `hub` = l'artefact, statut `distribuee`) avec le QR SVG (`AthenaQR.svg`, 176 px minimum, encre `#211612` sur `#fffaf2`, marge 4, aucune animation), l'adresse en clair ≥ 13 px, « Copier l'adresse » (44 px, `navigator.clipboard` sous `try/catch`, `H.signal`), les consignes Android / iOS ; plus une carte « Une autre adresse » avec un champ texte qui dessine le QR à la volée (pour le tunnel).
- `#versions` : une carte par version distribuée (`V.MOBILE_TEST.versions` : nom, date, cible, contenu, DA, profils, statut `adefinir` / `distribuee` / `remplacee`, nombre d'avis, synthèse).
- `#avis` : formulaire (version, profil Ado/Parent, DA, appareil `V.APPAREILS` + « autre », système, « installée ? », questions de `V.MOBILE_TEST.avis.questions` rendues par type : échelle = 5 boutons radio 44 px, choix = radios, texte = textarea ; remarque ; prénom ou initiales facultatif ; « Enregistrer l'avis »), liste filtrable avec « Retirer » (marque `retire`, rien ne se supprime), « Exporter en Markdown », « Exporter en JSON », « Importer un export JSON » (fusion par `id`, le plus récent gagne).

`H.mobile` (`hub-v1.js`, sur le modèle de `H.decisions`) : `lire`, `ajouter`, `modifier`, `retirer`, `liste(filtre)`, `synthese(version)`, `importer(obj)`, `exporter(fmt)` ; clé `localStorage` `athena-v1-mobile` ; `H.ecouter('mobile')` ; badge du nombre d'avis sur l'onglet. `V.MOBILE_TEST` = données pures (intro, consignes, cibles, versions, questionnaire sans mot interdit ni reproche). `commun/athena-qr.js` existe (copie intacte de qrcode-generator 2.0.4, MIT, + surcouche `AthenaQR` ; crédit dans `assets/kits/LICENCES.md`).

Versions de cache : `hub-v1.js?v=20`, `athena-v1.js?v=51` dans les 7 pages du hub et `outils/economie-test.html`.

## 8. Qualité « niveau Pixelio » : la grille

Dix critères mesurables, contrôlés par `test/mobile_qualite.js` sur les écrans principaux (camp, quêtes du jour, options d'une quête, journal 4 onglets, Sentier, expédition, matin, espace Parent, Mobile test) × 2 DA × 2 profils × 390 et 360 px :

1. Une action par écran : au plus un bouton principal plein-largeur visible par feuille ; signalé (alerte), corrigé quand le coût est faible.
2. Cibles ≥ 44 px et textes ≥ 13 px : 0 infraction (erreur).
3. Récompense immédiate ≤ 100 ms après un toucher de validation (mesuré sur « C'est fait »).
4. Compteurs toujours visibles hors feuille plein écran.
5. Onboarding ≤ 12 écrans, un retour par écran (compté).
6. Permission demandée sur geste seulement (grep : `requestPermission` uniquement dans un gestionnaire).
7. Zéro mot interdit (vérificateur).
8. Un seul composant « la chouette parle » (sélecteur unique).
9. Contraste ≥ 4,5:1 sur tout texte, ≤ 8 teintes par DA, 0 nouvelle image.
10. ≥ 55 fps médian sur 30 s à 390 et 360 px (harnais FPS existant), premier écran < 2 s en local.

Deux points de structure transposés sans rien copier : un écran de palier dédié (chiffre en grand, phrase positive, un bouton) = la carte du palier gagné ; les états « à venir » neutres avec la condition en texte au toucher, jamais une perte.

## 9. Ce qui reste à l'utilisateur

1. Activer GitHub Pages : Settings › Pages › Source « GitHub Actions » (GitHub Pro pour un dépôt privé, ou dépôt public), puis fusionner la PR ; le site apparaît à `https://baptiste974.github.io/app-tdah/` et le QR « app » devient actif tel quel.
2. En attendant : `outils/serveur-local.ps1` puis `outils/tunnel-https.ps1` (installe `cloudflared` avec `winget`), coller l'adresse `https://….trycloudflare.com/` dans Mobile test › « Une autre adresse ».
3. Sur le Pixel : Chrome › ⋮ › « Installer l'application » ; autoriser les notifications depuis l'interrupteur de l'app ; vérifier Réglages Android › Applis › Chrome › Notifications.
4. API Google Calendar (facultatif) : console.cloud.google.com › projet « Athena demo » › activer « Google Calendar API » › écran de consentement Externe en mode Test (adresses des testeurs) › ID client OAuth « Application Web », origine JavaScript = `https://baptiste974.github.io` ; coller l'ID dans `demo/commun/athena-mobile-config.js`.
5. Lire `demo/passes/passe-20-10-mobile/00-LISEZ-MOI.md` (compte rendu) et trancher les décisions ouvertes qu'il liste.

## 10. Hors périmètre (volontairement)

Serveur push (Web Push + VAPID), authentification, synchronisation d'agenda bidirectionnelle, abonnement `webcal`, pré-transpilation du Prototype, application du manifest et du service worker à l'app réelle `index.html` (étape séparée, après la démo), tout ce que le guide maître des références demande et que les règles refusent (paywall, boutique à minuterie, aversion à la perte, 60 fresques).
