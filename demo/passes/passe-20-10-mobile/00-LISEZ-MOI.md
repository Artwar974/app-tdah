# Passe mobile du 20-21/10 · la V1 testable sur téléphone

Branche `demo-mobile-v1` de `Baptiste974/app-tdah`, dossier `demo/`. Spec : `docs/superpowers/specs/2026-10-20-v1-testable-mobile-design.md`. Plan : `docs/superpowers/plans/2026-10-20-v1-testable-mobile.md`.

## Ce qui a changé

- **L'app s'installe sur le téléphone.** Manifest, icônes tirées de la flamme existante, service worker qui garde le camp hors ligne, carte « Installer » dans Journal › Carnet › Téléphone, message discret « Nouvelle version prête ».
- **Un onglet « Mobile test » dans le hub.** Les QR codes dessinés par le code (l'app, le hub, et « Une autre adresse » pour le tunnel), les versions distribuées, le questionnaire d'avis, l'export et l'import des avis en JSON ou Markdown.
- **Les notifications.** Permission demandée seulement au toucher d'un interrupteur. Deux réglages éteints par défaut : le retour des compagnons et le résumé du matin, entre 8 h et 21 h. Un bouton « Essayer une notification ».
- **L'agenda.** Depuis une quête (appui long › « Mettre dans mon agenda ») ou le Carnet : fichier .ics (Apple Calendrier et les autres), lien Google Agenda, app Agenda du téléphone sur Android. API Google Agenda en option pour le profil Parent, une fois l'ID client renseigné.
- **L'heure du téléphone.** App installée, le camp suit l'heure et la date réelles (décor, créneaux, retours d'expédition, résumé du matin). Interrupteur « Suivre l'heure du téléphone » dans le Carnet. Le panneau de démonstration reprend la main dès qu'on le touche.
- **Le Grand Sentier en pass de saison.** Une colonne verticale de 13 cartes, une jauge de 12 paliers dans la bannière, la carte « Prochain palier », le bonus après le 12e, le rail qui se remplit, les bornes des grands paliers, l'étagère de la saison, la frise et la fin de saison. Tout est dessiné par le code ou pris dans les images existantes.
- **Correctifs venus des relectures.** L'invite d'installation écoutée dès l'ouverture, les images du camp gardées pendant le préchargement, le raccourci qui n'efface plus la sauvegarde, le titre court des notifications, « une semaine sur deux » dans l'agenda, un message quand rien ne part vers Google.

## Ce qui a été vérifié

| Contrôle | Résultat |
|---|---|
| `python3 -I demo/scripts/verifier-projet.py demo` | 0 erreur, 0 alerte (8 pages) |
| `node test/mobile_pwa.js` | 54 ✓ |
| `node test/mobile_notif.js` | 44 ✓ |
| `node test/mobile_test.js` | 23 ✓ |
| `node test/mobile_agenda.js` | 73 ✓ (rejoué seul ; un contrôle du partage du .ics avait échoué une fois sous la charge de quatre suites en parallèle) |
| `node test/mobile_horloge.js`, `test/sentier_pass.js`, `test/lot3.js`, `test/lot7.js` | passés à leur tâche (49 ✓, 62 ✓, 16 ✓, 36 ✓) |

Les tâches 1 à 6 et 10 ont eu chacune une relecture indépendante et ses corrections. La tâche 7 (visuels du Sentier) et la fin de la tâche 11 n'ont pas été relues : la passe a été raccourcie à la demande.

## Ce qui ne marche pas, ou pas encore

- **Rien n'a été essayé sur un vrai Pixel.** Tout est testé dans un Chromium sans carte graphique. Installation, notifications, intention Agenda et partage du .ics sont à confirmer sur le téléphone.
- **Notifications app fermée :** c'est le téléphone qui choisit le moment (synchronisation périodique, au mieux deux fois par jour). Les rappels à heure précise passent par l'agenda.
- **Partage du .ics :** sur Chrome Android il finira probablement en téléchargement. Le fichier s'ouvre ensuite dans Google Agenda.
- **Google Agenda par l'API :** testé contre des doublures seulement. Il faut un ID client (voir plus bas).
- **Entre minuit et 4 h,** la journée du jeu est encore la veille, agenda compris : c'est la règle de l'économie.
- **Pas fait :** la passe qualité chiffrée (grille de 10 critères), une partie de la tâche 11 (couverture de tests de l'horloge, nom accessible des zones de texte de Mobile test, textes de l'après-12e dans Mécaniques), l'ordre du journal des changements sur l'Accueil (la passe du 19/10 s'affiche encore en premier).

## Ce qui te reste à faire

1. **Tester tout de suite sur le Pixel :** dans GitHub Desktop, prendre la branche `demo-mobile-v1`, lancer `outils/tunnel-https.ps1` (il installe le tunnel s'il manque). Coller l'adresse affichée dans Mobile test › « Une autre adresse », scanner le QR, puis Chrome › ⋮ › « Installer l'application ».
2. **Adresse fixe :** fusionner la PR, puis Settings › Pages › Source « GitHub Actions ». Pages sur un dépôt privé demande GitHub Pro, sinon il faut passer le dépôt en public. Le site sera public dans les deux cas. Adresse : `https://baptiste974.github.io/app-tdah/`.
3. **Notifications :** les autoriser depuis l'interrupteur de l'app, et vérifier Réglages Android › Applis › Chrome › Notifications.
4. **API Google Agenda (facultatif) :** console.cloud.google.com, un projet, activer « Google Calendar API », écran de consentement Externe en mode Test, ID client « Application Web » avec l'origine `https://baptiste974.github.io`. Coller l'ID dans `demo/commun/athena-mobile-config.js`.
5. **Avant chaque nouvelle version :** `python3 -I outils/generer-precache.py`, pour que les téléphones voient la mise à jour.
