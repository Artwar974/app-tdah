# V1 testable sur téléphone — plan d'exécution

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Livrer dans `demo/` de la branche `demo-mobile-v1` une V1 de la refonte installable sur un Pixel depuis un QR, avec notifications, agenda, Sentier façon pass, onglet « Mobile test », contrôles automatiques et compte rendu.

**Architecture:** `demo/` est la copie de travail du dossier publié de l'artefact (pages `.dc.html` rendues par `support.js`, contenu dans `athena-v1.js`, mécanique dans `commun/`, scène PixiJS 8.22.0 en dessous de l'interface HTML). Les ajouts mobiles sont trois fichiers servis tels quels (`manifest.webmanifest`, `sw.js` + `sw-precache.js` généré, `commun/athena-mobile.js`) branchés sur le Prototype, une page de hub de plus et des générateurs dans `outils/`. Les contrôles sont des scripts Node + Playwright dans `test/` contre un serveur local qui sert `demo/`.

**Tech Stack:** HTML/CSS/JS sans bundler, React 18.3.1 + Babel standalone par `support.js`, PixiJS 8.22.0 (CDN épinglé), Service Worker, Web App Manifest, Notifications API, IndexedDB, Web Share, ICS (RFC 5545), Google Identity Services (facultatif), Node 22 + Playwright (Chromium pré-installé), Python 3 (`-I`) pour les générateurs et le vérificateur, GitHub Actions (Pages).

**Spec:** `docs/superpowers/specs/2026-10-20-v1-testable-mobile-design.md` (le § 2 de la spec est la liste des règles ; le § 6 décrit l'écran du Sentier ; les § 3 à 5 décrivent la PWA, les notifications et l'agenda ; le § 7 l'onglet Mobile test).

## Global Constraints

- Ne jamais modifier `demo/Tower defense.dc.html`, `demo/tower-defense/`, `index.html` (racine), ni rien hors `demo/`, `test/`, `outils/`, `docs/`, `.github/`, `README.md`, `CONTRIBUTING.md`, `.gitignore`.
- Rien de Pixelio (code, texte, image, son) ; le mot « pixelio » n'apparaît dans aucun texte d'écran ni dans `V.TEXTES`.
- Aucune nouvelle image dessinée à la main : formes dessinées par le code, images déjà présentes dans `demo/assets/scene/`, icônes du kit ; les PNG d'icônes PWA sont produits par script depuis `demo/icones/icone.svg`.
- Aucun mot de `V.MOTS_INTERDITS` (raté, échec, manqué, retard, abandon, puni, perdu, série cassée, jours d'affilée, plus belle série, dernière chance, il te manque, classement, expire) dans un texte d'écran, de notification ou de questionnaire ; aucun rouge d'alerte, clignotement, compte à rebours en heures, badge de compte.
- Cibles ≥ 44 × 44 px, textes ≥ 13 px, contraste ≥ 4,5:1, mouvement réduit respecté (`[data-mouvement=reduit]` et `prefers-reduced-motion`), lisible à 390 × 844 et 360 × 640, deux profils (`enfant` = Ado, `adulte` = Parent) et deux DA (`r2`, `origine`).
- PixiJS reste `https://cdn.jsdelivr.net/npm/pixi.js@8.22.0/dist/pixi.min.js` ; interface en HTML au-dessus de la scène ; aucun changement au moteur `commun/athena-scene.js`.
- `V.JEU.eco` = copie exacte de `AthenaEconomie.DEFAUT` ; `commun/athena-economie.js` : ajouts seulement ; aucun nombre d'économie en dur dans la logique du Prototype (lire `b.sentier.paliers`, `b.sentier.bonus.or`, `b.sentier.saisons.grandsPaliers`…).
- Contenu (textes, données) dans `demo/athena-v1.js` en données pures (le vérificateur l'exécute dans une VM Node sans `location`, `navigator.userAgent`, `AthenaHub`) ; mécanique dans `commun/` ; sons via `AthenaSons` ; animations via `athena-motion.css/js` (toute nouvelle animation reprend un nom existant ou est ajoutée aux listes de mouvement réduit).
- Rien ne se supprime dans `demo/` : ce qui part va dans `demo/Archives/` avec une ligne dans `demo/Archives/INDEX.md`.
- Versions de cache `?v=` identiques dans toutes les pages du hub (hors Tower defense) ; après chaque tâche qui touche `demo/` : `python3 -I demo/scripts/verifier-projet.py demo` doit afficher `0 erreur(s), 0 alerte(s)`.
- Chemins relatifs (`./`) partout dans la PWA (site de projet sous `/app-tdah/`).
- Commits préfixés `feat:` / `fix:` / `docs:` / `refactor:` ; aucune clé ni secret ; `node --check` sur tout `.js` modifié.
- Tests : Node 22 + `require('playwright')` (global), Chromium lancé avec `['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist']`, serveur `http://localhost:8766/` qui sert `demo/`, CDN unpkg/jsdelivr routés vers les copies locales de `ATHENA_NPM` (défaut `/tmp/claude-0/-home-user/50291ce0-eb59-5f32-9466-493d6988abfd/scratchpad/test/npm/`) quand le dossier existe.

## Review Focus

1. Premier lancement hors ligne juste après l'installation (cache pas encore rempli) : la navigation doit retomber sur le réseau sans erreur et ne jamais renvoyer une réponse vide ; test dans la tâche 3 (`mobile_pwa.js`, cas « hors ligne avant précache »).
2. `Notification` absent ou permission refusée (Safari iOS non installé, refus système) : les interrupteurs restent éteints avec le texte « Plus tard… », aucun `TypeError` ; test dans la tâche 4 (contexte sans permission + `Notification` effacé par `addInitScript`).
3. `navigator.share` absent (bureau) ou refusé : l'export `.ics` se télécharge ; test dans la tâche 5.
4. Adresse vide ou très longue dans « Une autre adresse » : emplacement marqué (vide) ou QR de version plus haute (longue), jamais d'exception ; test dans la tâche 2.
5. `localStorage` indisponible (navigation privée, quota) : Mobile test et le Prototype se rendent quand même (`try/catch` autour de chaque lecture/écriture) ; test dans la tâche 2 (`localStorage` remplacé par un objet qui lève).

---

### Task 1: Socle `demo/` et harnais `test/`

**Files:**
- Create: `demo/` (copie), `demo/index.html`, `test/_commun.js`, `test/_serveur.sh`, `test/package.json`, `test/lot1.js`, `test/lot3.js`, `test/lot5.js`, `test/lot5b.js`, `test/lot6.js`, `test/lot7.js`, `test/lot9.js`, `test/sonde_2010_c.js`, `test/sonde_2010_e.js`, `test/chasse.js` (copies adaptées), `test/socle.js`
- Modify: `.gitignore`, `README.md`

**Interfaces:**
- Consumes: le dossier source `/tmp/claude-0/-home-user/50291ce0-eb59-5f32-9466-493d6988abfd/scratchpad/pub/` (le dossier publié de l'artefact, déjà vérifié à 0/0) et son harnais `/tmp/claude-0/-home-user/50291ce0-eb59-5f32-9466-493d6988abfd/scratchpad/test/`.
- Produces: `test/_commun.js` exportant `{ URL: 'http://localhost:8766/', ARGS, MAP, lancer(): Promise<Browser>, ouvrir(b, chemin, o = { viewport: {width: 390, height: 844}, delai: 4000, permissions: [], init: '' }): Promise<Page avec p.errs: string[]>, ok(nom, cond, info), bilan(suite): number (écrit test/logs/<suite>.log, renvoie le nombre d'échecs) }` ; `test/_serveur.sh` (démarre `python3 -m http.server 8766 --directory demo` en arrière-plan si le port est libre) ; `test/package.json` avec `devDependencies: { "jsqr": "1.4.0", "pngjs": "7.0.0" }`.

- [ ] **Step 1: Copier le dossier publié dans `demo/`**

`rsync -a --exclude 'Archives/' --exclude '*.zip' --exclude 'dl/' <source>/pub/ demo/` puis `mkdir -p demo/Archives` et écrire `demo/Archives/INDEX.md` : « Les archives de l'artefact (46 Mo) restent dans le dossier de l'artefact ; ce dossier reçoit ce qui sortira de `demo/`. » Écrire `demo/index.html` : page minimale `<!DOCTYPE html><html lang="fr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1"><meta name="robots" content="noindex"><meta http-equiv="refresh" content="0; url=Prototype.dc.html"><title>Athéna</title></head><body><a href="Prototype.dc.html">Ouvrir Athéna</a></body></html>`.

- [ ] **Step 2: Écrire le test de socle `test/socle.js`**

Assertions : `demo/index.html` contient `url=Prototype.dc.html` ; `demo/Prototype.dc.html`, `demo/commun/athena-qr.js`, `demo/commun/athena-scene.js`, `demo/assets/scene/objets/objets.webp` existent ; `demo/Archives/INDEX.md` existe ; `python3 -I demo/scripts/verifier-projet.py demo` sort en code 0 avec `0 erreur(s), 0 alerte(s)` ; via Playwright, `http://localhost:8766/` redirige vers `Prototype.dc.html` et `[data-scene]` apparaît en moins de 30 s sans erreur console.

- [ ] **Step 3: Lancer le test, vérifier qu'il échoue**

Run: `bash test/_serveur.sh && node test/socle.js`
Expected: échec (fichiers ou `_commun.js` absents).

- [ ] **Step 4: Écrire `test/_commun.js`, `test/_serveur.sh`, `test/package.json`**

`_commun.js` reprend l'`ESPION` (interception de `AthenaScene.monter` qui pose `window.__scene`), la route CDN (`p.route(/(unpkg\.com|cdn\.jsdelivr\.net)/, …)` qui sert `MAP[k]` quand le fichier existe, sinon laisse passer), la collecte `pageerror` + `console.error` dans `p.errs`, et `bilan()` qui écrit `test/logs/<suite>.log`. `npm install --prefix test` (jsqr, pngjs).

- [ ] **Step 5: Copier et adapter les suites**

Copier depuis le harnais source les fichiers listés en Files ; `sed -i 's#localhost:8765#localhost:8766#g; s#\.\./pub/#../demo/#g'` ; vérifier `node --check` sur chacun.

- [ ] **Step 6: Lancer le socle et une suite existante**

Run: `node test/socle.js && node test/lot7.js`
Expected: `socle` tout ✓ ; `lot7` 36/36 ✓ (comme avant la copie).

- [ ] **Step 7: `.gitignore`, README, commit**

Ajouter à `.gitignore` : `.superpowers/`, `test/node_modules/`, `test/logs/`, `test/*.png`. Ajouter à `README.md` une section « Démo V1 (`demo/`) » : ce que c'est, `python3 -m http.server 8766 --directory demo`, `node test/<suite>.js`, lien vers la spec. Commit : `feat: socle de la démo V1 (demo/) et harnais de contrôle`.

### Task 2: Onglet « Mobile test »

**Files:**
- Create: `demo/Mobile-test.dc.html`, `test/mobile_test.js`
- Modify: `demo/athena-v1.js` (après `V.APPAREILS`, vers la ligne 1544 ; `V.CHANGEMENTS` ligne 703), `demo/commun/hub-v1.js` (lignes 1, 13, 121-123, 153-167), `demo/Accueil.dc.html` (`const DESC`, ligne 368 ; `hint-placeholder-count` de la liste des pages), `demo/LISEZ-MOI.md` (ligne 5 et tableau), toutes les pages du hub et `demo/outils/economie-test.html` (versions `?v=`)

**Interfaces:**
- Consumes: `AthenaQR.svg(texte, { ec, marge, taille, encre, fond, libelle })` et `AthenaQR.dessiner(el, texte, o)` de `demo/commun/athena-qr.js` (existant) ; `H.ecouter`, `H.signal`, `H.telecharger`, `H.BADGES`, `H.publie()` de `hub-v1.js` ; `V.APPAREILS`, `V.PROFILS`, `V.DAS`.
- Produces: `V.MOBILE_TEST = { statutLe, intro, consignes: [[os, texte]], cibles: [{ id, t, d, url, statut }], versions: [{ id, nom, date, cible, contenu, da, profils, statut, notes }], avis: { questions: [{ id, t, type: 'choix'|'echelle'|'texte', options?, min?, max?, legendes? }] } }` avec `cibles` = `app` (`https://baptiste974.github.io/app-tdah/`, `a-activer`) et `hub` (`https://claude.ai/artifact/L4ZMGPiAahZyX653Z4Yq69`, `distribuee`), `versions[0]` = `{ id: 'test-1', nom: 'Test 1', date: '2026-10-20', cible: 'app', contenu: 'V1 de la refonte : camp PixiJS, barème 5, Sentier en pass, expéditions en parcours, notifications et agenda.', da: 'r2', profils: ['enfant', 'adulte'], statut: 'distribuee' }` ; `H.mobile = { lire(), ajouter(a) → id, modifier(id, patch), retirer(id), liste(filtre) → [], synthese(versionId) → { n, echelles: { [qid]: moyenne }, choix: { [qid]: { [option]: n } } }, importer(obj) → { nouveaux, misAJour }, exporter('json'|'md') }`, clé `localStorage` `athena-v1-mobile`, forme d'un avis `{ id, t, version, profil, da, appareil, os, installe, reponses: {}, remarque, qui, retire? }` ; `H.BADGES['a-activer'] = ['À activer', '#e7e3f5', '#3f2f6b']` ; versions `commun/hub-v1.js?v=20`, `athena-v1.js?v=51`.

- [ ] **Step 1: Écrire `test/mobile_test.js`**

Assertions (page `Mobile-test.dc.html` à 390 × 844 puis 1280 × 950) : l'onglet « Mobile test » est courant dans `hub-nav` ; `#qr` contient 2 `svg[role=img]` (cibles) dont `aria-label` cite l'adresse, et chaque QR mesure ≥ 176 px ; le badge « À activer » est visible sur la cible `app` ; le champ « Une autre adresse » avec `https://exemple.test/x` produit un 3e `svg` ; un screenshot de ce svg décodé par `jsqr` (via `pngjs`) renvoie exactement `https://exemple.test/x` ; champ vide → `[role=img][aria-label*="Emplacement"]` et aucune erreur ; champ de 600 caractères → un svg sans erreur ; `#avis` : remplir version/profil/da, échelle « clair » = 4, texte « plu » = « le camp », « Enregistrer l'avis » → `H.mobile.liste().length === 1`, le badge de l'onglet affiche `1` ; « Exporter en JSON » déclenche un téléchargement `athena-v1-avis-<date>.json` ; `H.mobile.importer(<le même export>)` renvoie `{ nouveaux: 0, misAJour: 0 }` ; `localStorage` remplacé par un objet dont `getItem`/`setItem` lèvent → la page se rend sans `pageerror` ; textes : aucun élément avec `font-size < 13px`, tous les `button, input, select, textarea, a[href]` visibles ≥ 44 px de haut ; `p.errs` vide.

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node test/mobile_test.js` → Expected: échec (page absente, 404).

- [ ] **Step 3: Données `V.MOBILE_TEST` et `V.CHANGEMENTS` dans `demo/athena-v1.js`**

Sous le commentaire `/* 31 · Mobile test (passe du 20/10, mobile) */`. Questionnaire : `installation` (choix : Oui / Avec de l'aide / Pas encore), `clair` (échelle 1-5, légendes Pas encore / Tout à fait), `plu` (texte « Ce qui t'a plu »), `gene` (texte « Ce qui t'a gêné ou que tu changerais »), `retour` (échelle 1-5, « Tu aurais envie d'y revenir demain ? »). Entrée `V.CHANGEMENTS` en tête : `['20/10/2026', 'Onglet « Mobile test » du hub : les QR vers la V1 testable et le hub (dessinés par le code), les versions distribuées, les avis des testeurs gardés dans le navigateur (clé athena-v1-mobile) avec import-fusion et export JSON ou Markdown.']`.

- [ ] **Step 4: `H.mobile` et la barre dans `demo/commun/hub-v1.js`**

Bloc `5 · Mobile test` après `Dc.exporter` sur le modèle de `Dc` ; `H.PAGES` reçoit `['Mobile-test.dc.html', 'Mobile test']` en dernier ; « 6 pages » → « 7 pages » (lignes 1 et 123) ; dans `hub-nav`, badge `nA` à côté du badge Écrans et re-rendu sur `k === 'mobile'`. Export Markdown : titre, une section par version (synthèse puis un tiret par avis : date · qui · Ado/Parent · DA · appareil · réponses · remarque), `## Historique`.

- [ ] **Step 5: La page `demo/Mobile-test.dc.html`**

Squelette de `Decisions.dc.html` (head avec `support.js`, `meta athena-page`, `ext-resource-dependency` pour `commun/athena-qr.js?v=1`, vignette SVG : un téléphone dessiné, fond `#f4eee6`, trait `#211612`, modules `#a3452a`), helmet avec `athena-v1.js?v=51`, `commun/hub-v1.js?v=20`, `commun/athena-qr.js?v=1`, les trois sections de la spec § 7. Le QR est rendu par `<sc-for>` sur une liste de rectangles `{ x, y }` à l'intérieur d'un `<svg viewBox>` inline (pas d'`innerHTML`), 176 px, encre `#211612` sur `#fffaf2`, marge 4 ; en dessous l'adresse (13 px) et « Copier l'adresse » (44 px). `renderVals()` renvoie toujours l'objet `base` complet.

- [ ] **Step 6: Propager les versions et la doc**

`sed` sur `demo/Accueil.dc.html`, `demo/Prototype.dc.html`, `demo/Ecrans.dc.html`, `demo/DA.dc.html`, `demo/Mecaniques.dc.html`, `demo/Decisions.dc.html`, `demo/outils/economie-test.html` : `hub-v1.js?v=19` → `?v=20`, `athena-v1.js?v=50` → `?v=51` (jamais Tower defense). `DESC['Mobile-test.dc.html']` dans l'Accueil ; `LISEZ-MOI.md` : « Les 8 pages », ligne du tableau, et « le générateur de QR (athena-qr.js) » dans la ligne `commun/`.

- [ ] **Step 7: Lancer les contrôles**

Run: `node --check demo/commun/hub-v1.js demo/athena-v1.js && python3 -I demo/scripts/verifier-projet.py demo && node test/mobile_test.js && node test/lot9.js`
Expected: `Pages : 8 … 0 erreur(s), 0 alerte(s)` ; `mobile_test` tout ✓ ; `lot9` inchangé.

- [ ] **Step 8: Commit**

`feat: onglet Mobile test (QR, versions distribuées, avis des testeurs)`

### Task 3: PWA installable (manifest, icônes, service worker, hébergement)

**Files:**
- Create: `demo/manifest.webmanifest`, `demo/icones/icone.svg`, `demo/icones/icone-192.png`, `demo/icones/icone-512.png`, `demo/icones/icone-maskable-512.png`, `demo/icones/badge-96.png`, `demo/sw.js`, `demo/sw-precache.js`, `demo/commun/athena-mobile.js`, `outils/generer-icones.js`, `outils/generer-precache.py`, `outils/tunnel-https.ps1`, `.github/workflows/pages.yml`, `test/mobile_pwa.js`
- Modify: `demo/Prototype.dc.html` (head lignes 3-12 ; `componentDidMount` ; la section Carnet vers la ligne 296 et `ca` vers la ligne 1709), `demo/athena-v1.js` (textes `mob.*`, `V.MOBILE`, `V.CHANGEMENTS`), `demo/scripts/verifier-projet.py` (nouvelle règle 11), `demo/LISEZ-MOI.md`, toutes les pages de `demo/` (`<meta name="robots" content="noindex">`)

**Interfaces:**
- Consumes: le `<template id="__bundler_thumbnail">` du Prototype (la flamme) ; `window.__resources` (présent seulement dans l'artefact publié) ; `this.toast(cle, icone)` et `T(cle)` du Prototype.
- Produces: `window.AthenaMobile = { version: '1.0', demarrer({ onMiseAJour: (recharger: () => void) => void, onInstallable: (ok: boolean) => void }): void, installer(): Promise<'accepted'|'dismissed'|'indisponible'>, etat(): { sw: boolean, installable: boolean, standalone: boolean, notifs: 'default'|'granted'|'denied'|'indisponible', android: boolean } }` ; `self.ATHENA_VERSION`, `self.ATHENA_COQUILLE: string[]`, `self.ATHENA_IMAGES: string[]`, `self.ATHENA_CDN: string[]` dans `sw-precache.js` ; cache nommé `athena-demo-<VERSION>` ; `V.MOBILE = { notifs: { heures: [8, 21] }, agenda: { heures: { matin: 8, midi: 12, apresmidi: 15, soir: 19 }, duree: 30, rappelMin: 10 } }` ; textes `mob.t` « Téléphone », `mob.installer.t` « Installer sur le téléphone », `mob.installer.d` « Une icône sur l'écran d'accueil, et le camp s'ouvre même sans réseau. », `mob.installe` « Déjà installée », `mob.maj.t` « Nouvelle version prête », `mob.maj.go` « Recharger » ; dans le Carnet, une section `data-el="telephone"` (titre `mob.t`) placée avant « Réglages » avec, pour cette tâche, la carte « Installer » (bouton 44 px visible seulement si `etat().installable`, sinon la ligne « Déjà installée » si `standalone`, sinon rien).

- [ ] **Step 1: Écrire `test/mobile_pwa.js`**

Assertions : `demo/manifest.webmanifest` est un JSON valide avec `id`, `name`, `short_name`, `start_url` `./Prototype.dc.html?source=pwa`, `scope` `./`, `display` `standalone`, 3 icônes dont `purpose` `maskable`, et chaque `src` existe ; les PNG font 192 × 192, 512 × 512, 512 × 512, 96 × 96 (lire la largeur dans l'en-tête IHDR) ; `demo/sw-precache.js` cite des fichiers qui existent tous dans `demo/` ; le head du Prototype contient `rel="manifest"`, `theme-color`, `apple-touch-icon`, `robots` `noindex` ; Playwright sur `http://localhost:8766/Prototype.dc.html` : `navigator.serviceWorker.ready` résout en < 20 s, `caches.keys()` contient un nom qui commence par `athena-demo-`, le cache contient `Prototype.dc.html` et `support.js` ; `context.setOffline(true)` puis rechargement → `[data-scene]` ou le repli image fixe apparaît, 0 `pageerror` ; cas « hors ligne avant précache » : nouveau contexte, SW enregistré mais `caches.delete` de tout, hors ligne, `goto` → la navigation échoue proprement (erreur réseau Playwright) sans réponse HTML vide ; dans le Carnet, le titre « Téléphone » est présent ; `python3 -I demo/scripts/verifier-projet.py demo` à 0/0 ; `.github/workflows/pages.yml` contient `path: demo`.

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node test/mobile_pwa.js` → Expected: échec (manifest absent).

- [ ] **Step 3: `outils/generer-icones.js` et les icônes**

Node + Playwright : écrit `demo/icones/icone.svg` (copie exacte du SVG de la vignette du Prototype, sans `data-bg-color`), ouvre une page qui l'affiche à 512 px et capture `icone-512.png` ; la maskable = même dessin réduit à 80 % centré sur fond `#f4eee6` ; `icone-192.png` = capture à 192 px ; `badge-96.png` = la flamme seule (`fill="#fff"`) sur fond transparent à 96 px (`omitBackground: true`). Run: `node outils/generer-icones.js` → 4 PNG + 1 SVG.

- [ ] **Step 4: `demo/manifest.webmanifest`, head du Prototype, `noindex`**

Valeurs de la spec § 3. Dans le head du Prototype, avant `support.js` : manifest, `theme-color #f4eee6`, `apple-touch-icon icones/icone-192.png`, `mobile-web-app-capable`, `robots noindex` ; `<meta name="ext-resource-dependency" content="commun/athena-mobile.js" data-resource-id="commun/athena-mobile.js?v=1">` et `<script src="commun/athena-mobile.js?v=1">` dans le helmet. `<meta name="robots" content="noindex">` dans le head de chaque page `.dc.html` et `.html` de `demo/` (hors Tower defense).

- [ ] **Step 5: `outils/generer-precache.py` et `demo/sw-precache.js`**

Lit les `ext-resource-dependency`, `<link href>`, `<script src>` de `demo/Prototype.dc.html` et `demo/index.html`, les `un('…')` de `sceneScripts()`, `demo/commun/athena-scene.json` et ses sous-JSON, liste `demo/assets/scene/**`, `demo/commun/polices/*`, `demo/icones/*`, `demo/manifest.webmanifest` ; `VERSION = AAAAMMJJ-<8 hex de sha256 des contenus>` ; échoue (code 1) si un fichier cité manque ; écrit `self.ATHENA_VERSION`, `self.ATHENA_COQUILLE`, `self.ATHENA_IMAGES`, `self.ATHENA_CDN` (les 4 URL CDN : react, react-dom, @babel/standalone de `support.js`, pixi 8.22.0).

- [ ] **Step 6: `demo/sw.js`**

Stratégies de la spec § 3 ; `importScripts('./sw-precache.js')` ; `message` `SKIP_WAITING` ; squelettes `notificationclick` et `periodicsync` (complétés en tâche 4) ; aucune réponse opaque mise en cache (CDN re-demandé en `mode: 'cors'`).

- [ ] **Step 7: `demo/commun/athena-mobile.js` (partie 1) et branchement**

`demarrer()` : si `window.__resources` ou contexte non sécurisé → ne rien enregistrer ; sinon `navigator.serviceWorker.register('./sw.js', { scope: './' })`, écoute `updatefound` → `onMiseAJour(recharger)` où `recharger` poste `SKIP_WAITING` puis recharge sur `controllerchange` ; `beforeinstallprompt` → `preventDefault`, garde l'événement, `onInstallable(true)` ; `installer()` appelle `prompt()`. Dans le Prototype : `componentDidMount` appelle `AthenaMobile.demarrer({ onMiseAJour: r => this.setState({ majMobile: r }), onInstallable: ok => this.setState({ installable: ok }) })` ; un toast discret `mob.maj.t` avec le bouton `mob.maj.go` (44 px) quand `majMobile` est posé ; section Carnet « Téléphone » avec la carte Installer ; `theme-color` mis à jour selon la DA dans `componentDidUpdate` (`#a3452a` origine, `#60445f` r2).

- [ ] **Step 8: `.github/workflows/pages.yml`, `outils/tunnel-https.ps1`, vérificateur, doc**

Workflow : `on: push: branches: [main]` + `workflow_dispatch` ; `permissions: pages: write, id-token: write, contents: read` ; jobs `build` (`actions/checkout@v4`, `actions/configure-pages@v5`, `actions/upload-pages-artifact@v3` avec `path: demo`) et `deploy` (`actions/deploy-pages@v4`, environnement `github-pages`). `tunnel-https.ps1` : lance `outils/serveur-local.ps1` si le port 8347 est libre puis `cloudflared tunnel --url http://localhost:8347` (message `winget install Cloudflare.cloudflared` si absent), affiche l'adresse à coller dans Mobile test. Vérificateur : règle `11 · PWA` = `manifest.webmanifest` JSON valide dont chaque icône existe, chaque fichier de `sw-precache.js` existe, `sw.js` importe `./sw-precache.js`. `LISEZ-MOI.md` : lignes pour `manifest.webmanifest`, `sw.js`, `icones/`, `commun/athena-mobile.js`.

- [ ] **Step 9: Contrôles**

Run: `python3 -I outils/generer-precache.py && node --check demo/sw.js demo/commun/athena-mobile.js && python3 -I demo/scripts/verifier-projet.py demo && node test/mobile_pwa.js && node test/lot7.js`
Expected: tout ✓, 0/0, lot7 36/36.

- [ ] **Step 10: Commit**

`feat: V1 installable (manifest, icônes dessinées par le code, service worker, GitHub Pages)`

### Task 4: Notifications sur le téléphone

**Files:**
- Create: `test/mobile_notif.js`
- Modify: `demo/commun/athena-mobile.js`, `demo/sw.js`, `demo/Prototype.dc.html` (section Carnet « Téléphone » ; `sauver()` vers la ligne 842 ; `tickEco` vers la ligne 1335-1339 ; `matinOuvrir()`), `demo/athena-v1.js` (textes), `demo/scripts/verifier-projet.py` (règle 12 : `requestPermission` seulement dans `athena-mobile.js`)

**Interfaces:**
- Consumes: `AthenaMobile.etat()` (tâche 3) ; `V.MOBILE.notifs.heures` ; textes existants `eco.exp.notif` (« Tes compagnons sont rentrés au camp. ») et `eco.exp.notifReglage` (« Prévenir quand les compagnons rentrent (en journée) ») ; `S.notifExp` (réglage existant lu dans `vueEco`, ligne 1418) ; `rentres` dans `tickEco` (ligne 1339) ; `matinOuvrir()`.
- Produces: `AthenaMobile.demanderNotifs(): Promise<'granted'|'denied'|'default'|'indisponible'>` (appelle `Notification.requestPermission()` ; seul endroit du projet) ; `AthenaMobile.notifier({ titre, corps, tag, action, donnees }): Promise<boolean>` (via `registration.showNotification`, `icon icones/icone-192.png`, `badge icones/badge-96.png`, `renotify false`, `actions [{ action: 'voir', title: 'Voir' }]`, `vibrate` `[40]` sauf mouvement réduit, `false` si pas de permission ou hors plage `heures`) ; `AthenaMobile.miroir({ retourA, matinA, heures, compagnons, matin }): Promise<void>` (IndexedDB `athena-mobile`, magasin `etat`, clé `1`, fusion avec `montre`) ; `AthenaMobile.surMessage(f)` (messages du SW `{ type: 'athena-notif', action }`) ; `AthenaMobile.synchroniser()` (`periodicSync.register('resume-matin', { minInterval: 12 * 3600 * 1000 })` si `standalone` et permission accordée) ; textes `mob.notif.t` « Prévenir sur le téléphone », `mob.notif.d` « Un mot quand les compagnons rentrent ou que le résumé du matin t'attend. Entre 8 h et 21 h, jamais la nuit. », `mob.notif.exemple.t` « Athéna · maintenant », `mob.notif.exemple.d` = `eco.exp.notif`, `mob.notif.matin` « Le résumé du matin », `mob.notif.matin.corps` « Ton résumé du matin t'attend au camp. », `mob.notif.essai` « Essayer une notification », `mob.notif.essai.t` « Ça marche », `mob.notif.essai.d` « C'est comme ça que l'app te préviendra. », `mob.notif.plusTard` « Plus tard, dans les réglages du téléphone. », `mob.notif.ferme` « Quand l'app est fermée, c'est le téléphone qui choisit le moment. » ; état `S.notifMatin` (défaut `false`) sauvegardé avec `S.notifExp`.

- [ ] **Step 1: Écrire `test/mobile_notif.js`**

Contexte Playwright avec `permissions: ['notifications']` (via `_commun.ouvrir(b, …, { permissions })`) : le Carnet montre la carte d'explication avec l'exemple dessiné (texte `Athéna · maintenant`) et deux interrupteurs `role=switch` éteints ; cliquer « Prévenir quand les compagnons rentrent » → `aria-checked="true"` ; cliquer « Essayer une notification » → `(await (await navigator.serviceWorker.ready).getNotifications()).length === 1` avec `title` « Ça marche » ; ouvrir `Prototype.dc.html?expedition=retour&nouv=tout` avec l'interrupteur allumé (état sauvegardé) → une notification dont le `body` est « Tes compagnons sont rentrés au camp. » ; hors plage (`heure=23`) → aucune ; `grep -c requestPermission demo/Prototype.dc.html demo/commun/*.js` = 1 occurrence, dans `athena-mobile.js` ; contexte sans permission + `addInitScript('delete window.Notification')` → la carte montre « Plus tard, dans les réglages du téléphone. », les interrupteurs restent éteints, 0 `pageerror` ; IndexedDB : après l'allumage, la base `athena-mobile` contient la clé `1` avec `heures: [8, 21]` ; aucun mot interdit dans les nouveaux textes (`V.MOTS_INTERDITS` contre `V.TEXTES` des clés `mob.*`).

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node test/mobile_notif.js` → Expected: échec (carte absente).

- [ ] **Step 3: `athena-mobile.js` partie 2 et `sw.js`**

`demanderNotifs`, `notifier`, `miroir`, `surMessage`, `synchroniser` ; dans `sw.js` : `notificationclick` → `event.notification.close()`, focus d'un client de la portée ou `clients.openWindow('./Prototype.dc.html?ecran=camp')`, `postMessage({ type: 'athena-notif', action: event.action || 'voir' })` ; `periodicsync` tag `resume-matin` → lecture IndexedDB, si `compagnons && retourA <= Date.now() && montre.retourA !== retourA` et heure locale dans `heures` → `showNotification(eco.exp.notif)` puis marque ; idem `matin` avec `matinA` (minuit du jour courant) ; textes des notifications en clair dans `sw.js` copiés de `V.TEXTES` (commentaire qui le dit).

- [ ] **Step 4: Prototype : section « Téléphone », réglages, déclencheurs**

Carte d'explication (`mob.notif.t/d`, exemple dessiné en CSS : une pastille 36 px avec l'icône du jeu `jour`, `mob.notif.exemple.t` 13 px, `mob.notif.exemple.d` 14 px, cadre `--da-trait`), interrupteurs `role=switch` 44 px pour `S.notifExp` et `S.notifMatin` (geste → `demanderNotifs()` ; `denied`/`indisponible` → `mob.notif.plusTard` sous les interrupteurs, qui restent éteints), bouton « Essayer une notification » (44 px, `notifier({ titre: T('mob.notif.essai.t'), corps: T('mob.notif.essai.d'), tag: 'essai' })`), ligne `mob.notif.ferme`. Dans `tickEco` : quand `rentres.length` et `S.notifExp` → `notifier({ titre: T('eco.exp.notif'), corps: T('eco.exp.notif'), tag: 'retour-' + t, action: 'camp' })` ; dans `matinOuvrir()` : si `S.notifMatin` et `document.hidden` → `notifier(mob.notif.matin.corps)` ; dans `sauver()` : `miroir({ retourA: min des x.prochain des parcours en route, matinA, heures: V.MOBILE.notifs.heures, compagnons: S.notifExp, matin: S.notifMatin })` ; `surMessage` → `this.setState({ ecran: 'camp' })`. Vérificateur : règle 12.

- [ ] **Step 5: Contrôles**

Run: `node --check demo/sw.js demo/commun/athena-mobile.js && python3 -I demo/scripts/verifier-projet.py demo && node test/mobile_notif.js && node test/mobile_pwa.js && node test/sonde_2010_c.js`
Expected: tout ✓, 0/0, sonde C 22/22.

- [ ] **Step 6: Commit**

`feat: notifications sur le téléphone (permission sur geste, service worker, résumé du matin)`

### Task 5: Agenda (fichier .ics, Google Agenda, Apple Calendrier, API Google)

**Files:**
- Create: `demo/commun/athena-mobile-config.js`, `test/mobile_agenda.js`
- Modify: `demo/commun/athena-mobile.js`, `demo/Prototype.dc.html` (feuille des options d'une quête, vers la ligne 891 pour l'état `optsMode` et le gabarit correspondant ; section Carnet « Téléphone »), `demo/athena-v1.js` (textes), `CONTRIBUTING.md`, `demo/LISEZ-MOI.md`

**Interfaces:**
- Consumes: les quêtes du Prototype (`S.quetes`, champs `id`, `t`, `h` (`HH:MM` quand la quête est à heure précise), `creneau` (`matin|midi|apresmidi|soir|libre`), `rec` (`'une'` = une fois, sinon revient) ; si le champ réel diffère, adapter l'adaptateur `queteAgenda()` du Prototype, jamais la forme ci-dessous) ; `V.MOBILE.agenda` ; `S.profil` (`adulte`) ; `H.telecharger`.
- Produces: forme d'entrée `QA = { id, titre, jour: 'AAAA-MM-JJ', heure: 'HH:MM' | null, creneau, revient: boolean, jours: number[] | null (lundi = 0) }` ; `AthenaMobile.ics(liste: QA[], o = { nom: 'Athéna', duree: 30, rappelMin: 10 }): string` (CRLF, lignes repliées à 75 octets, `VERSION:2.0`, `PRODID:-//Athena//V1//FR`, `X-WR-CALNAME`, par entrée `UID:<id>@athena`, `DTSTAMP`, `DTSTART:AAAAMMJJTHHMMSS` local flottant ou `DTSTART;VALUE=DATE:AAAAMMJJ` si `libre` sans heure, `DTEND` = + `duree`, `SUMMARY`, `RRULE:FREQ=DAILY` si `revient` sans `jours`, `RRULE:FREQ=WEEKLY;BYDAY=MO,TU…` sinon, `VALARM` `ACTION:DISPLAY`, `TRIGGER:-PT<rappelMin>M`) ; `AthenaMobile.lienGoogleAgenda(q: QA, o): string` ; `AthenaMobile.intentAgenda(q: QA, o): string | null` (null hors Android) ; `AthenaMobile.partagerIcs(ics: string, nom = 'quetes-athena.ics'): Promise<'partage'|'telecharge'>` ; `AthenaMobile.google = { pret(): boolean (clientId non vide), relier(): Promise<boolean>, envoyer(liste: QA[]): Promise<number>, rendezVousDuJour(jour): Promise<[{ t, heure }]> }` ; `window.AthenaMobileConfig = { googleClientId: '' }` ; textes `mob.agenda.t` « Mettre dans mon agenda », `mob.agenda.google` « Google Agenda », `mob.agenda.ics` « Fichier .ics (Apple Calendrier, autres) », `mob.agenda.tel` « L'app Agenda du téléphone », `mob.agenda.export` « Exporter mes quêtes à heure (.ics) », `mob.agenda.relier` « Relier Google Agenda », `mob.agenda.envoyer` « Envoyer mes quêtes à heure », `mob.agenda.jour` « Voir les rendez-vous du jour », `mob.agenda.rien` « Aucune quête à heure pour l'instant. », `mob.agenda.fait` « C'est dans ton agenda. ».

- [ ] **Step 1: Écrire `test/mobile_agenda.js`**

Partie Node (VM avec `window` minimal, `athena-mobile.js` chargé) : `ics([{ id: 'q1', titre: 'Ranger ma chambre', jour: '2026-10-21', heure: '08:00', creneau: 'matin', revient: true, jours: null }])` contient `BEGIN:VCALENDAR`, `PRODID:-//Athena//V1//FR`, `UID:q1@athena`, `DTSTART:20261021T080000`, `DTEND:20261021T083000`, `RRULE:FREQ=DAILY`, `TRIGGER:-PT10M`, toutes les lignes finissent par `\r\n`, aucune ligne > 75 octets ; `jours: [0, 2]` → `BYDAY=MO,WE` ; `creneau: 'soir', heure: null` → `DTSTART:20261021T190000` ; `creneau: 'libre', heure: null` → `DTSTART;VALUE=DATE:20261021` ; `lienGoogleAgenda(q)` commence par `https://calendar.google.com/calendar/render?action=TEMPLATE` et contient `dates=20261021T080000/20261021T083000` et `recur=RRULE:FREQ=DAILY` ; `intentAgenda(q)` est `null` sans Android et commence par `intent:#Intent;action=android.intent.action.INSERT` avec `S.browser_fallback_url=` encodé quand `navigator.userAgent` contient `Android`. Partie navigateur : appui long sur une quête (ou `?ecran=options&…`) → bouton « Mettre dans mon agenda » (44 px) → feuille avec 3 choix ; « Fichier .ics » sans `navigator.share` → un téléchargement `quetes-athena.ics` est déclenché ; Carnet › Téléphone : « Exporter mes quêtes à heure (.ics) » présent, « Relier Google Agenda » absent quand `googleClientId` est vide et présent (profil Parent) quand `AthenaMobileConfig.googleClientId = 'x'` est posé par `addInitScript` ; 0 `pageerror`.

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node test/mobile_agenda.js` → Expected: échec (`ics` n'existe pas).

- [ ] **Step 3: `athena-mobile.js` partie 3 et `athena-mobile-config.js`**

Fonctions de l'Interfaces ; `google.relier()` charge `https://accounts.google.com/gsi/client` à la demande, `initTokenClient({ client_id, scope: 'https://www.googleapis.com/auth/calendar.events', callback })`, jeton en mémoire ; `envoyer()` = `POST https://www.googleapis.com/calendar/v3/calendars/primary/events` par entrée avec `extendedProperties.private.athena = id` (recherche préalable par `privateExtendedProperty` pour mettre à jour au lieu de doubler) ; `rendezVousDuJour()` = `events.list` `timeMin`/`timeMax` du jour. `athena-mobile-config.js` : `window.AthenaMobileConfig = { googleClientId: '' }` avec un commentaire (ID public, créé par l'utilisateur, origine `https://baptiste974.github.io`).

- [ ] **Step 4: Prototype et doc**

`queteAgenda(q)` dans le Prototype (adaptateur vers `QA`, heure du créneau depuis `V.MOBILE.agenda.heures`) ; bouton « Mettre dans mon agenda » dans la feuille des options (`optsMode = 'agenda'` : 3 boutons 44 px) ; Carnet › Téléphone : export `.ics` de toutes les quêtes à heure (`mob.agenda.rien` si aucune), et pour `S.profil === 'adulte'` avec `google.pret()` : relier, envoyer, rendez-vous du jour (liste `t · heure`) ; `<script src="commun/athena-mobile-config.js?v=1">` + `ext-resource-dependency` dans le Prototype. `CONTRIBUTING.md` : paragraphe « ID client Google (public, pas un secret) ». `LISEZ-MOI.md` : ligne du fichier de configuration.

- [ ] **Step 5: Contrôles**

Run: `node --check demo/commun/athena-mobile.js demo/commun/athena-mobile-config.js && python3 -I demo/scripts/verifier-projet.py demo && node test/mobile_agenda.js && node test/mobile_notif.js && node test/lot7.js`
Expected: tout ✓, 0/0.

- [ ] **Step 6: Commit**

`feat: agenda (fichier .ics, Google Agenda, app Agenda du téléphone, API Google facultative)`

### Task 6: Le Grand Sentier en pass vertical (structure)

**Files:**
- Modify: `demo/Prototype.dc.html` (gabarit lignes 223-233 : remplacer 225-229, garder 223-224 et 230-233 ; `senVals` lignes 956-969 ; `senCentrer`/`senScroll` lignes 1231-1232 ; liaison `senBand` ligne 1780 ; `recompense()` ligne 1192 ; `cartePalier` ligne 1206 ; pastille 12,5 px ligne 227), `demo/athena-v1.js` (textes `sen.*` lignes 764-777 ; `V.SYNTHESE.sentier.legende` ; fiche Écrans `sentier` ; `V.CHANGEMENTS`), `demo/commun/athena-economie.js` (commentaire lignes 68-77 seulement), `test/lot3.js` (lignes 24, 33, 34)
- Create: `test/sentier_pass.js`

**Interfaces:**
- Consumes: `b.sentier` (`paliers`, `bonus.objets`, `bonus.or`, `auDela`, `saisons.grandsPaliers`), `V.SAISONS`, `MIGRATION_ECO.cadeauCoffre`, textes `ruban.bonus`, `eco.sentier.*`, le moteur de gabarit (`{{ }}`, `sc-if`, `sc-for`, `ref`, `onClick`, style chaîne).
- Produces: nouveaux champs de `senVals` : `sen.coul` (couleur de saison de la DA), `sen.jauge { n, max, pct, compte, aria, seg: [{ bg, h }] }`, `sen.prochain { on, t, n, r, ic, ou, d }`, `sen.bonus { on, t, d, ic, n }`, et par carte `suiv, grand, est, etatT, etatOn, typeT, h (96|128), box (52|64), icT (28|34), pastBg, pastBd, voirCampOn, voirCamp` ; champs conservés tels quels : `on, t, fermerT, fermer, ban{nom,ic,bg,fg,motif,s}, bandAria, cartes[n,nT,t,ou,ic,fait,ici,cur,bd,bg,nFg,icBg,icFg,anim,iciT,avatar,aria,go], scroll, loin, revenirT, revenir, det, regle1, regle2, dejaT, deja, dejaRienOn, dejaRien, qs` ; textes ajoutés (étiquette `sentier`) : `sen.suivant` « Prochain », `sen.grand` « Grand palier », `sen.gagne` « Gagné », `sen.prochain.t` « Prochain palier », `sen.prochain.d` « Un Sommet, et il est à toi. », `sen.jauge` « {n} paliers sur {max} », `sen.bonus.t` « Après le palier {n} », `sen.bonus.d` « Chaque Sommet de plus offre un objet pour le camp et {or} or. », `sen.voirCamp` « Voir au camp », `sen.type.bonus` « Un objet de plus pour le camp, à poser depuis le coffre. », `eco.r.bonus` « Un objet pour le camp et {or} or », `eco.r.c.bonus` « Un objet bonus » ; `sen.regle2` devient « Après le palier {n} : un objet pour le camp et {or} or par Sommet. » ; `recompense(n)` pour `n > paliers` renvoie `{ t: tx('eco.r.bonus', { or }), court: T('eco.r.c.bonus'), ou: 'sac', ic: 'cadeau', type: 'bonus' }`.

- [ ] **Step 1: Adapter `test/lot3.js` et écrire `test/sentier_pass.js`**

`lot3.js` : ligne 24 et 34, centrage = `Math.round(i.offsetTop + i.offsetHeight / 2 - b.clientHeight / 2 - b.scrollTop)` ; ligne 33, « loin » = `b.scrollTop = b.scrollHeight`. `sentier_pass.js` (`?ecran=sentier&palier=7&nouv=tout`, 390 × 844 puis 360 × 640, `da=r2` puis `da=origine`, `profil=enfant` puis `adulte`) : le `[role=list]` a `flex-direction: column` et 13 enfants directs `button[role=listitem]`, chacun ≥ 96 px de haut et pleine largeur ; `[role=progressbar]` dans le premier `div` de la bannière avec `aria-valuenow="7"` et `aria-valuemax="12"` et 12 segments ; la carte « Prochain palier » dit « Palier 8 » ; `palier=12` → pas de « Prochain palier », bloc « Après le palier 12 » avec « 10 or » ; `palier=13` via `gagne=1` → carte « Un objet pour le camp et 10 or » ; aucun texte < 13 px dans le dialog (`getComputedStyle`), aucune cible interactive < 44 px ; `[data-mouvement=reduit]` → aucune animation en cours sur les cartes ; « Voir au camp » présent sur un palier gagné dont la récompense est un objet (palier 4, lanterne) ; `p.errs` vide.

- [ ] **Step 2: Lancer, vérifier l'échec**

Run: `node test/sentier_pass.js` → Expected: échec (liste horizontale).

- [ ] **Step 3: Gabarit vertical**

Remplacer les lignes 225-229 : bannière en colonne avec la jauge (`role=progressbar`, `sc-for sen.jauge.seg`, segments 10 px aux grands paliers) et le compte ; carte « Prochain palier » (`sc-if sen.prochain.on`, sans `aria-live`) ; bloc bonus (`sc-if sen.bonus.on`) ; liste verticale `ref senBand` (= même ref que `senScroll`, `position: relative`, `overflow-y: auto`), enfants directs `button[role=listitem]` avec numéro + pastille (14 px) à gauche, rond d'icône `{{ c.box }}` avec coche si `c.fait`, titre/emplacement, pilule d'état à droite ; « Revenir à mon palier » en `position: sticky; bottom: 0` ; détail `aria-live=polite` inchangé et toujours premier ; `hint-placeholder-count` 13 ; pastille « Tu es ici » 13 px ; « Voir au camp » dans le détail (`sc-if det.voirCampOn`, `scene.camera` vers l'objet).

- [ ] **Step 4: Logique**

`senVals` : nouveaux champs ; `senCentrer`/`senScroll` en vertical (`offsetTop`, `clientHeight`, seuil 160 px) ; `recompense()` bonus ; `cartePalier(n)` et le ruban du camp (ligne 951) lisent le bonus après le 12e ; textes dans `athena-v1.js` ; commentaire du barème ; `V.SYNTHESE.sentier.legende` et la fiche Écrans décrivent la colonne (jauge, prochain palier, grandes cartes) ; `V.CHANGEMENTS`.

- [ ] **Step 5: Contrôles**

Run: `python3 -I demo/scripts/verifier-projet.py demo && node test/lot3.js && node test/sentier_pass.js && node test/lot9.js`
Expected: 0/0 ; lot3 16/16 ; sentier_pass tout ✓ ; lot9 inchangé.

- [ ] **Step 6: Commit**

`feat: Grand Sentier en pass vertical (jauge, prochain palier, bonus après le 12e)`

### Task 7: Le Grand Sentier, les visuels (rail, bornes, récompenses, étagère, frise, fin de saison)

**Files:**
- Modify: `demo/Prototype.dc.html` (gabarit du Sentier ; `cartePalier` ; `carteFin` ligne 1209-1210 et son gabarit ; séquence du Sommet ligne 1080), `demo/commun/athena-motion.css` (listes de mouvement réduit lignes 85-96), `demo/athena-v1.js` (textes `sen.fin.*`, `V.DA_PALIERS` si un visuel y est décrit), `demo/assets/doc/sentier.webp` (régénéré), `test/sentier_pass.js`
- Create: rien de nouveau hors tests

**Interfaces:**
- Consumes: l'atlas `demo/assets/scene/objets/objets.webp` et ses rectangles dans `commun/athena-scene.json` (`lanterne [825,292,39,96]`, `banc [868,292,92,77]`, `amphore [964,292,50,72]`, `kiosque`, `fontaine`, `statue`) ; `olivier.webp`, `lavande.webp`, `laurier.webp`, `fanion` ; `AthenaMotion.vol` ; `rv-anneau`, `rv-flip`, `rv-rayons`, `[data-couvercle]`, `--t-grand`, `--t-sommet`.
- Produces: `visuelRecompense(R, taille): { style, html? }` dans le Prototype (sprite d'atlas par `background-image/position/size`, pile teintée, icône) utilisé par les cartes, le détail, la carte du palier gagné (96 px) et l'étagère ; rail SVG `[data-rail]` avec `stroke-dashoffset` (animation `rv-rail` 0,9 s, 1 ms en mouvement réduit) ; bornes `[data-borne]` avec couronne SVG 24 feuilles ; frise de bannière `[data-frise]` (images teintées `opacity: .22`) ; étagère `[data-etagere]` ; feuille de fin de saison `[data-fin-saison]` (grille 4 × 3, bonus reçus, ruban de titre, « Tu gardes tout. », saison suivante, un bouton « Continuer ») ; textes `sen.fin.t` « Fin de la saison {s} », `sen.fin.grille` « Les paliers de la saison », `sen.fin.bonus` « {n} objets bonus reçus », `sen.fin.bonus1` « 1 objet bonus reçu », `sen.fin.titre` « Ami des {saison} » (formes par saison dans `V.SAISONS[i].titre`), `sen.fin.suivante` « La saison {s2} commence : {nom}. ».

- [ ] **Step 1: Compléter `test/sentier_pass.js`**

Ajouter : `[data-rail]` présent avec deux `path` dont le second a `stroke-dashoffset` < sa longueur au palier 7 ; 4 `[data-borne]` (paliers 3, 6, 9, 12) ; la carte du palier 4 (lanterne) a un `background-image` qui finit par `objets.webp` ; `[data-frise]` contient ≥ 2 images d'`assets/scene/` avec `opacity: 0.22` ; `[data-etagere]` au palier 7 montre 7 éléments, `sen.deja.rien` au palier 0 ; `gagne=1&palier=6` → carte avec couronne `svg[data-couronne]` et `border: 3px solid` ; `fin=1` → `[data-fin-saison]` avec 12 cases dont 7 cochées (`palier=7`), « Tu gardes tout. », « La saison 2 commence : Les vendanges. », un seul bouton principal ; `[data-mouvement=reduit]` → `animation-duration` de `[data-rail] path` ≤ 1 ms, pas de `rv-rayons` ; aucune image nouvelle (`git status --porcelain demo/assets` vide hors `assets/doc/sentier.webp`).

- [ ] **Step 2: Lancer, vérifier l'échec** — Run: `node test/sentier_pass.js` → Expected: échec sur `[data-rail]`.

- [ ] **Step 3: Rail, bornes, visuels, frise, étagère**

Dessins décrits à la spec § 6 (points 1, 4, 8 et « Visuel de chaque récompense ») ; `rv-rail` ajouté à `athena-motion.css` et à la liste de mouvement réduit (durée 1 ms) ; `rv-anneau` réutilisé pour la couronne.

- [ ] **Step 4: Carte du grand palier et fin de saison**

`cartePalier` : visuel 96 px, couronne pour `grand`, fête complète aux paliers 6 et 12 (`feteGrande`), fête du Sommet aux 3 et 9 ; `carteFin` → feuille `[data-fin-saison]` (plein écran, `role=dialog`), transition de couleur de saison (`background-color` en `--t-long`, opacité seule en mouvement réduit), « Continuer » actif dès l'apparition ; textes.

- [ ] **Step 5: Image de doc**

Playwright : capture 390 × 844 de `?ecran=sentier&palier=7&nouv=tout&da=r2` → `demo/assets/doc/sentier.webp` (même nom, même usage dans les pages de doc).

- [ ] **Step 6: Contrôles**

Run: `python3 -I demo/scripts/verifier-projet.py demo && node test/lot3.js && node test/sentier_pass.js && node test/lot5b.js && node test/sonde_2010_e.js`
Expected: 0/0 ; tout ✓.

- [ ] **Exigences venues de la relecture de la tâche 6 (à tenir dans cette tâche)** — (1) avant de poser `position: relative` sur le `[role=list]` pour le rail, remplacer dans `test/lot3.js` (lignes 23, 32, 33) le défileur `i.offsetParent` par le `[role=list]` lui-même ; (2) l'ordre de la colonne cache « Prochain palier » à l'ouverture (centrage sur « Tu es ici ») et « Voir au camp » après un toucher : à l'ouverture, garder « Prochain palier » visible (centrer de sorte que « Tu es ici » et la carte suivante tiennent, ou remonter la carte « Prochain palier » dans la bannière collante), et après un toucher sur un palier, faire défiler le détail en vue (`scrollIntoView({ block: 'nearest' })`, sans animation en mouvement réduit) ; contrôle dans `test/sentier_pass.js` à 390 × 844 et 360 × 640.
- [ ] **Step 7: Commit** — `feat: Grand Sentier, visuels dessinés par le code (rail, bornes, récompenses, étagère, frise, fin de saison)`

### Task 8: Passe qualité « niveau Pixelio »

**Files:**
- Create: `test/mobile_qualite.js`, `demo/passes/passe-20-10-mobile/02-QUALITE.md`
- Modify: ce que les mesures imposent dans `demo/Prototype.dc.html`, `demo/Mobile-test.dc.html`, `demo/commun/athena-ui.css` (jetons seulement), `demo/athena-v1.js` (textes)

**Interfaces:**
- Consumes: la grille de la spec § 8 ; les écrans par adresse (`V.ECRANS` : `ecran=camp`, `feuille`, `options`, `journal&tab=…`, `sentier`, `expedition`, `matin`, `parent`) ; `outils/fps-test.html` existant pour le critère 10.
- Produces: `test/mobile_qualite.js` qui parcourt 9 écrans × 2 DA × 2 profils × 2 largeurs et écrit `test/logs/mobile_qualite.log` (par critère : infractions avec sélecteur et valeur) ; sortie non nulle seulement pour les critères 2, 6, 7 et 9 (erreurs) ; les critères 1, 3, 4, 5, 8, 10 sont rapportés ; `02-QUALITE.md` = la grille, les mesures avant/après, ce qui a été corrigé, ce qui reste (avec pourquoi).

- [ ] **Step 1: Écrire `test/mobile_qualite.js`** — mesures : (2) `getBoundingClientRect` des `button, a[href], input, select, textarea, [role=button], [role=switch]` visibles et `font-size` de tout élément avec du texte ; (9) contraste calculé entre `color` et le premier fond opaque parent, nombre de couleurs distinctes de `background-color`/`color` par DA (≤ 8 teintes principales hors transparents) ; (1) boutons `width ≥ 80 %` de la feuille visibles par `[role=dialog]` ; (3) `performance.now()` entre `click` sur « C'est fait » et la première mutation de `[data-el=barre]` (ou de l'élément de la quête) ; (6) `grep` ; (7) `V.MOTS_INTERDITS` sur le texte rendu des écrans ; (8) nombre de sélecteurs distincts portant la chouette qui parle ; (10) lecture du log FPS existant (`test/logs/fps_*.log` du harnais source ou relance de `outils/fps-test.html` 30 s).

- [ ] **Step 2: Lancer** — Run: `node test/mobile_qualite.js` → Expected: le log liste les infractions (le script sort en code 1 si les critères 2, 6, 7, 9 ont des infractions).

- [ ] **Step 3: Corriger** — chaque infraction des critères 2, 6, 7, 9 ; les infractions du critère 1 qui se corrigent en passant un second bouton en lien texte sans changer le sens ; rien d'autre.

- [ ] **Step 4: Relancer tout** — Run: `node test/mobile_qualite.js && python3 -I demo/scripts/verifier-projet.py demo && for s in lot1 lot3 lot5 lot5b lot6 lot7 lot9 sonde_2010_c sonde_2010_e mobile_test mobile_pwa mobile_notif mobile_agenda sentier_pass; do node test/$s.js || echo "ECHEC $s"; done`
Expected: code 0 partout ; `02-QUALITE.md` écrit.

- [ ] **Step 5: Commit** — `fix: passe qualité mobile (cibles, textes, contraste, un bouton par écran)`

### Task 9: Compte rendu, documentation, synchronisation vers l'artefact

**Files:**
- Create: `demo/passes/passe-20-10-mobile/00-LISEZ-MOI.md`, `demo/passes/passe-20-10-mobile/01-INSTALLER.md`
- Modify: `demo/LISEZ-MOI.md`, `demo/Accueil.dc.html` (derniers changements lus depuis `V.CHANGEMENTS` : rien à faire si l'entrée existe), `demo/Decisions.dc.html` / `demo/athena-v1.js` (3 décisions du 20/10 mobile : pass vertical, PWA par GitHub Pages, notifications en deux paliers honnêtes, agenda sans serveur ; `statut: 'decide'`, `tranche: '20/10'`), `docs/ETAT_ACTUEL.md`, `README.md`, `demo/passes/passe-20-10/04-ETAT.md` (renvoi)

**Interfaces:**
- Consumes: tous les logs de `test/logs/`, la grille `02-QUALITE.md`, les rulings du ledger `.superpowers/sdd/<plan>/progress.md`.
- Produces: `00-LISEZ-MOI.md` avec les quatre parties « Ce qui a changé », « Ce qui a été vérifié (commande → résultat) », « Ce qui ne marche pas ou pas encore », « Ce qui reste à faire par l'utilisateur » (les 5 points de la spec § 9) ; `01-INSTALLER.md` (pas à pas Pixel : tunnel, Pages, installation, notifications, agenda, mise à jour) ; `docs/ETAT_ACTUEL.md` : paragraphe « Démo V1 (demo/), 20/10/2026 » qui dit que les décisions de la refonte priment ; `rsync -a --delete-excluded --exclude 'Archives/' demo/ <source>/pub/` sans toucher `Archives/` ni `Tower defense.dc.html` (vérifier par `diff` que ces deux sont identiques avant/après) pour que l'artefact soit republié par le contrôleur.

- [ ] **Step 1: Écrire les deux documents et les décisions** — contenu décrit en Interfaces ; `V.CHANGEMENTS` reçoit une entrée de synthèse de la passe mobile ; décisions ajoutées dans le bloc des décisions du 20/10 de `athena-v1.js` avec le même format que les 12 existantes.
- [ ] **Step 2: Contrôles** — Run: `python3 -I demo/scripts/verifier-projet.py demo && node test/socle.js && node test/mobile_test.js` → Expected: 0/0, tout ✓.
- [ ] **Step 3: Synchroniser vers le dossier de l'artefact** — `rsync` décrit ci-dessus, puis `diff -q demo/Tower\ defense.dc.html <source>/pub/Tower\ defense.dc.html` (identiques) et `python3 -I <source>/pub/scripts/verifier-projet.py <source>/pub` à 0/0.
- [ ] **Reports des relectures pour le compte rendu (à tenir dans cette tâche)** — (1) `V.CHANGEMENTS.unshift(['19/10/2026', …])` à l'exécution fait passer la passe du 19/10 devant les entrées plus récentes : remplacer l'`unshift` par une entrée placée à sa date dans le littéral (ordre décroissant) et vérifier que l'Accueil montre la passe mobile comme dernier changement ; (2) écrire dans `V.CHANGEMENTS` et dans une décision que l'ancien interrupteur « eca.notif » du Carnet est remplacé par le réglage unique des notifications (éteint par défaut) ; (3) `01-INSTALLER.md` : relancer `python3 -I outils/generer-precache.py` avant chaque publication (la règle 11 ne voit que les `?v=`), et dire qu'entre minuit et 4 h la journée du jeu est encore la veille (agenda compris) ; (4) `Ecrans.dc.html` : déclarer `commun/athena-mobile.js`, `commun/athena-mobile-commun.js` (s'il existe) et `commun/athena-mobile-config.js` en `ext-resource-dependency` avant la synchronisation vers l'artefact ; (5) compte rendu : feuille agenda à 2 choix hors Android (l'app Agenda du téléphone n'existe que sur Android), pas de rappel sur un événement d'une journée entière (il sonnerait la veille à 23 h 50), parties Google et intention Android testées contre des doublures seulement, partage du .ics probablement en téléchargement sur Chrome Android.
- [ ] **Step 4: Commit** — `docs: compte rendu de la passe mobile, installation, décisions`

### Task 10: L'heure du téléphone (ajoutée le 20/10 après la relecture de la tâche 4 ; exécutée avant la tâche 6)

**Files:**
- Create: `test/mobile_horloge.js`
- Modify: `demo/Prototype.dc.html` (`maintenant(S)` vers la ligne 1206 ; `lendemain()` vers la ligne 1183 ; `restaurer()` / `sauver()` ; `componentDidMount` et la vérification au retour au premier plan ; le panneau de démonstration ; la section Carnet « Téléphone »), `demo/athena-v1.js` (textes `mob.horloge.*`, `V.CHANGEMENTS`), `demo/commun/athena-mobile.js` (seulement si l'état « installée » y est lu), versions `?v=` des fichiers modifiés

**Interfaces:**
- Consumes: `AthenaMobile.etat().standalone` (tâche 3) ; `V.DEMO.date` ; `V.JEU.retourJours` ; `lendemain()` et le retour après absence existants ; le miroir des notifications de la tâche 4 (`retourA`, `matinA`).
- Produces: `S.horloge: 'telephone' | 'demo'` et `S.depart: 'AAAA-MM-JJ'` sauvegardés ; `maintenant(S)` qui renvoie l'heure réelle en mode téléphone ; méthode `horlogeSync()` du Prototype (met `S.heure` à l'heure locale décimale, et appelle `lendemain()` autant de fois que de jours locaux passés, au plus `V.JEU.retourJours`) appelée au montage, sur `visibilitychange` (visible) et toutes les 30 s tant que la page est visible (arrêtée quand elle est cachée) ; textes `mob.horloge.t` « Suivre l'heure du téléphone », `mob.horloge.d` « Le camp vit à ton heure : le matin, le soir, les retours d'expédition. », `mob.horloge.demo` « Heure de démonstration ».

- [ ] **Step 1: Écrire `test/mobile_horloge.js`** — Playwright 1.56 (`page.clock.install({ time })`, `page.clock.fastForward`, `page.clock.setFixedTime`) : (a) `Prototype.dc.html?source=pwa` sans fragment, heure fixée au 2026-10-21 19:30 locale → l'interrupteur « Suivre l'heure du téléphone » est `aria-checked="true"`, le décor est au soir (moment `nuit` ou `coucher` selon `V.JEU.moments`) et `S.heure` ≈ 19,5 ; (b) `fastForward` jusqu'au lendemain 08:05 puis `visibilitychange` → `S.jour` a augmenté de 1 et le résumé du matin s'ouvre ; (c) trois jours plus tard → `S.jour` a augmenté d'au plus `V.JEU.retourJours` et aucun texte de reproche (mots interdits) ; (d) `Prototype.dc.html#ecran=camp&heure=10.25&nouv=tout` (sans `source=pwa`) → horloge de démonstration, interrupteur éteint ; (e) toucher un réglage d'heure du panneau éteint le mode et affiche « Heure de démonstration » ; (f) progression gardée à la première activation (XP, bois, or, paliers identiques avant/après) ; (g) la page cachée n'a plus de minuterie de 30 s active ; 0 `pageerror`.
- [ ] **Step 2: Lancer, vérifier l'échec** — Run: `node test/mobile_horloge.js` → Expected: échec sur l'interrupteur absent.
- [ ] **Step 3: Implémenter** le mode téléphone décrit à la spec § 4 bis (recalage unique des dates de l'économie à la première activation : décaler tous les horodatages de l'état `eco` du même écart, sans changer les quantités).
- [ ] **Step 4: Contrôles** — Run: `python3 -I demo/scripts/verifier-projet.py demo && node test/mobile_horloge.js && node test/mobile_notif.js && node test/sonde_2010_c.js && node test/lot7.js` → Expected: 0/0 et tout ✓.
- [ ] **Exigences venues de la relecture de la tâche 4 (à tenir dans cette tâche)** — (1) en mode téléphone, `retourCle = t + ':' + r` change à chaque sauvegarde puisque `t` suit l'heure réelle : garder `retourA` numériquement stable (clé sur l'heure du retour arrondie à la minute, pas sur `t`) pour que le service worker n'annonce jamais deux fois le même retour ; un contrôle dans `test/mobile_horloge.js` le prouve (deux sauvegardes à 2 min d'intervalle → même `retourA`). (2) Quand le rattrapage passe un jour (`lendemain()` appelé par `horlogeSync()`), le résumé du matin s'ouvre à l'ouverture comme dans le cas (b) du Step 1, et `matinA` du miroir correspond à ce résumé. (3) Après un `periodicsync` qui a annoncé un retour, l'ouverture de l'app montre bien le compagnon rentré (l'horloge rattrapée fait avancer le parcours) : contrôle dans `test/mobile_horloge.js`.
- [ ] **Exigence venue de la relecture de la tâche 5** — en mode téléphone, `aujourdhui(S)` et `cal()` suivent aussi la date réelle (pas `V.DEMO.date`) : un fichier .ics exporté en mode téléphone le 21/10 commence le 21/10, et « Voir les rendez-vous du jour » interroge le jour réel ; contrôle dans `test/mobile_horloge.js`.
- [ ] **Step 5: Commit** — `feat: l'heure du téléphone (le camp suit l'heure réelle quand l'app est installée)`

### Task 11: Les reports des relectures (ajoutée le 21/10 ; exécutée après la tâche 7 et avant la tâche 8)

Les relectures des tâches 1 à 7 ont laissé des points mineurs réels, consignés dans le ledger. Cette tâche les traite tous, avec un test par point qui change un comportement.

**Files:** selon les points, dans `demo/` (Prototype, sw.js, commun/athena-mobile.js, manifest, athena-v1.js, Mobile-test, hub-v1.js) et `test/` ; nouveau `demo/commun/athena-mobile-commun.js` si le point N6 le demande.

**Interfaces:**
- Consumes: tout ce que les tâches 2 à 7 et 10 produisent.
- Produces: aucune nouvelle interface publique, sauf `demo/commun/athena-mobile-commun.js` (constantes partagées : options de notification, nom de la base IndexedDB, magasin, clé), importé par `sw.js` (`importScripts`) et chargé par le Prototype avant `athena-mobile.js`.

- [ ] **PWA (relecture de la tâche 3)** — P1 poser les écouteurs `beforeinstallprompt` et `appinstalled` au chargement du module (pas dans `demarrer()`), garder l'événement et le rejouer à `onInstallable` ; P2 précache des images de `assets/scene/` dans `e.waitUntil` de `activate` (ou relancé au premier `fetch` s'il n'est pas fini) ; P3 tests des gardes de `demarrer()` (`window.__resources` → aucun service worker, `etat().sw === false`) et de `installer()` → `'dismissed'` / `'indisponible'` ; P4 `V.CHANGEMENTS` : « noindex sur toutes les pages du hub (hors Incursions) » ; P5 raccourci du manifest et `notificationclick` → `./Prototype.dc.html?source=pwa` (sans fragment : un fragment remplace la sauvegarde).
- [ ] **Notifications (relecture de la tâche 4)** — N1 titre court « Athéna » et le texte dans le corps (plus de phrase répétée) ; N2 la plage 8 h-21 h se vérifie aussi sur l'heure de l'appareil ; N3 quand `etat().notifs === 'indisponible'` : interrupteurs masqués et texte `mob.notif.indispo` « Pas disponible ici : installe l'app sur le téléphone. » ; N4 `synchroniser()` relancé après le geste qui rend la permission ; N5 garder la pastille `feu` (l'icône de l'app) et le dire dans le rapport ; N6 constantes partagées dans `commun/athena-mobile-commun.js` (voir Produces) et un contrôle qui le prouve.
- [ ] **Agenda (relecture de la tâche 5)** — A1 « une semaine sur deux » → `RRULE:FREQ=WEEKLY;INTERVAL=2;BYDAY=…` ; « certains jours du mois » → `RRULE:FREQ=MONTHLY;BYMONTHDAY=…` (et les mêmes règles dans le lien Google et l'intention) ; A2 retour à l'écran, `aria-live=polite` : `mob.agenda.rate` « Rien n'est parti : réessaie plus tard. » quand l'envoi Google rend 0, `mob.agenda.vide` « Aucun rendez-vous aujourd'hui. » quand la liste du jour est vide ; A3 précharger Google Identity à l'ouverture de la carte Téléphone (profil Parent, ID renseigné) pour que `requestAccessToken` parte dans le geste ; A4 `test/mobile_agenda.js` : attentes sur l'état au lieu des délais fixes.
- [ ] **Horloge (relecture de la tâche 10)** — H1 commentaire de `jourAgenda` remis juste ; H2 couverture : curseur du panneau, « Lendemain », « Avancer d'une heure », interrupteur éteint puis rallumé la nuit (avant 4 h), `TZ=Europe/Paris` à travers le 25/10, contenu du résumé du matin après 2 et 3 jours ; H3 `recalerEco` : liste explicite des champs horodatés de l'état `eco` (ou un contrôle qui échoue si un champ inconnu entre 1e12 et 1e13 apparaît).
- [ ] **Mobile test (relecture de la tâche 2)** — M1 `aria-label="{{ q.t }}"` sur les textarea ; M2 badge « Remplacée » propre aux versions (statuts de `H.mobile` consultés avant `H.BADGES`).
- [ ] **Sentier (relecture de la tâche 6)** — S1 textes de l'après-12e encore faux (Mécaniques `set('grand-sentier', …)`, ancienne feuille) ; S2 « Un objet pour le camp » faux pour `tenue-avatar` : texte qui couvre les deux (« Un objet ou une tenue ») ou bonus de tenue rangé à part ; S3 « grand palier » lu à une seule source (`b.sentier.saisons.grandsPaliers`) ; S4 `senVoirCamp` sans `poser(id)` inutile quand la scène PixiJS est prête.
- [ ] **Harnais (relecture de la tâche 1)** — T1 `test/lot1.js` section H et `test/lot9.js` (« Barème 4 », « 68 règles ») mis à jour à l'état actuel (le compteur `athena-chiffre` du bois, le barème 5, 87 règles) ; T2 `test/_serveur.sh` vérifie que le port 8766 sert bien `demo/` (`index.html` contient `url=Prototype.dc.html`).
- [ ] **Contrôles** — Run: `python3 -I demo/scripts/verifier-projet.py demo` puis, une par une : `mobile_pwa`, `mobile_notif`, `mobile_agenda`, `mobile_horloge`, `mobile_test`, `sentier_pass`, `lot1`, `lot3`, `lot9`, `lot7` → Expected : 0/0 et tout ✓ (lot1 et lot9 compris).
- [ ] **Commits** — un commit `fix:` par groupe (PWA, notifications, agenda, horloge, Mobile test, Sentier, harnais).
