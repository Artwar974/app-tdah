# Passe technique du 20/10 · 02 · La scène dans la vraie app (proposition pour le choix 20)

*Pour décider du choix 20 en dix minutes. Rien n’est modifié dans le dépôt de la vraie app : ce dossier est une proposition.*

## 1 · Ce que la vraie app utilise aujourd’hui pour le camp

D’après `github.md` (dépôt Artwar974/app-tdah, branche main, dernière synchronisation du 04/10/2026) et les modules repris dans `Archives/2026-10-20-ancien-moteur/commun/` :

| Module | Ce qu’il fait | Poids mesuré |
|---|---|---|
| `athena-decor.js` (repris d’`index.html`, commit 22c79b4) | Le décor animé : ciel et nuages vidéo, soleil et lune, étoiles, mer vidéo avec relais, reflets, cascade image par image, conifères animés, lumière selon l’heure, oiseaux, papillons, lucioles. Dessine en 720 × 1280 dans un canvas 2D. | 112 Ko |
| `athena-objets-animes.js` (repris de `housing-shell.js` et `housing-theme.css`) | Le feu, le flambeau et la fontaine : un GIF par objet, les filtres du moment, la lueur et la flaque au sol du feu. | 20 Ko |
| `athena-camp-lumiere.js` (version 2) | Les filtres de couleur, les ombres portées et de contact, les halos : calculés pour chaque objet posé en HTML. | 28 Ko |
| Les images : `assets/decor/` (sources vidéo et masques), `assets/optim/` (fonds), `assets/housing/` (GIF et aperçus), `assets/camp/` (planche des objets, tentes, planches animées) | | **25 Mo + 0,4 Mo + 5,7 Mo + 2,3 Mo ≈ 33 Mo** |

Les écrans de la vraie app qui portent le camp : `index.html` et `journal-shell.js` (le camp et le tiroir des quêtes), `housing-shell.js` et `housing-theme.css` (Aménager le camp).

## 2 · Ce que la scène apporte, et son poids

| Fichier | Rôle | Poids mesuré |
|---|---|---|
| `commun/athena-scene.js` | Le moteur (PixiJS 8.22.0) : un seul canvas pour le fond (shader : ciel, mer, végétation, lumière, soir), le mont et la cascade, les objets, la tente, les bâtiments dessinés par le code, les personnages, les particules, la lumière, la caméra, les événements | 232 Ko |
| `commun/athena-marionnette.js` | Les personnages en morceaux (le minotaure, les compagnons), animés par un JSON | 40 Ko |
| `commun/athena-scene.json` | La description du camp | 24 Ko |
| `assets/scene/` | Toutes les images : fond (4 moments), ciel, mont et cascade, planche des objets, tentes, planches animées, bateau, marionnette | **7,9 Mo** |
| PixiJS 8.22.0 (CDN ou copie locale) | | 840 Ko minifié (≈ 240 Ko compressé) |

Ce que le camp gagne : l’îlot, la plage, le ponton et le bateau du 16/10 ; l’aube, le coucher et la nuit en continu ; le vent, les rafales, les feuilles ; le feu comme jauge ; les torches du Mont ; les compagnons qui marchent, s’assoient, dorment ; le soir tamisé ; les chantiers ; une caméra ; les particules ; tout cela **dans un seul fichier à faire évoluer**, au lieu de trois modules et de 33 Mo d’images et de vidéos. Et une seule source pour la place de chaque chose (`athena-scene.json`).

## 3 · La correspondance des appels

`AthenaDecor.monter(canvas, options)` → `AthenaScene.monter(canvas, options)`, option par option :

| Option d’AthenaDecor | Dans AthenaScene | Remarque |
|---|---|---|
| `base: 'assets/decor/'` | `base: 'assets/scene/'` | les images de la scène |
| `heure: () => 10.25` | `heure: () => 10.25` | identique (nombre ou fonction ; absent = heure locale) |
| `vieAmbiante: true` | `vieAmbiante: true` | identique (lucioles, oiseaux, papillons, poussières) |
| `onPret()` | `onPret()` | identique |
| `onLumiere(etat)` | `onLumiere(etat)` | identique : `{ heure, etat, suivant, progression, lumiere, ombre, accent }` ; les états sont `lever`, `jour`, `coucher`, `nuit` (le prototype les traduit en `sunrise`, `day`, `sunset`, `night` par `SCENE_MOM`) |
| `onErreur(message)` | `onErreur(message)` | identique |
| `resoudre(chemin)` | `resoudre(chemin)` | identique |
| — | `scene: 'commun/athena-scene.json'` (ou l’objet) | la description du camp : la vraie app peut y mettre ses propres places |
| — | `mouvementReduit: false` | absent = réglage du système |
| — | `onCamera(etat)` | à chaque mouvement de caméra, pour faire suivre les calques HTML |
| `decor.pause() / reprendre() / lumiere() / detruire()` | identiques | |

Ce qu’`AthenaObjetsAnimes` et `AthenaCampLumiere` faisaient est dans la scène : le feu est un élément (`scene.definir('feu', { jauge })`), la lumière et les ombres sont calculées par la scène elle-même ; plus rien à poser en HTML.

Ce que l’app devra **envoyer** à la scène (`scene.emettre(nom, données)`) : `quete-validee ({ cle })`, `sommet`, `mont-palier ({ n })`, `mont-paliers ({ n })`, `expedition-depart ({ compagnon })`, `expedition-retour`, `etincelle-recue`, `retour`, `feu-rallume`, `coffre-recoit`, `compagnon-arrive` ; et `scene.definir(id, { niveau, etat, x, y, visible, jauge, couleur })`, `scene.ajouter(def)`, `scene.retirer(id)`, `scene.deplacer(id, x, y)`, `scene.camera({ x, y, z, cache })`, `scene.reglages.legere / cadence / eau / vent`.

Ce que l’app devra **écouter** (`scene.on(nom, f)`) : `toucher ({ cible })`, `toucher-sol ({ x, y, libre })`, `bateau-au-large`, `bateau-accoste`, `butin-depose`, `compagnon-parti`, `jour`, `soir`, `nuit`.

Les coordonnées : la scène est en 720 × 1280 « cover » sur le téléphone ; `AthenaScene.depuisTelephone(x, y)` passe du repère 390 × 844 de l’app au repère de la scène ; `AthenaScene.elementDepuisCamp(id, o, echelle, place)` fabrique l’élément d’un objet de la planche.

## 4 · Le plan, en petites étapes réversibles, chacune testable seule

1. **Charger la scène à côté de l’existant.** Ajouter `pixi.js@8.22.0`, `athena-marionnette.js`, `athena-scene.js`, `athena-scene.json`, `assets/scene/` au dépôt ; monter la scène dans un second canvas masqué (`opacity: 0`), sans toucher au décor en place. Test : la console est vide, `scene.perf` donne une boucle sous 10 ms, la mémoire ne grimpe pas sur 10 minutes.
2. **L’afficher derrière un réglage.** Un réglage caché (« Camp en une scène ») inverse les deux canvas ; les événements du jeu sont envoyés aux deux moteurs. Test : les écrans du camp, d’Aménager et du tiroir avec la scène ; le bouton revient à l’ancien décor sans recharger.
3. **Basculer.** La scène par défaut, l’ancien décor derrière le réglage ; les objets posés passent par `scene.ajouter`, la tente par `scene.definir('tente', { niveau })`. Test : le parcours complet de l’app (premier lancement, quêtes, Aménager, Journal), de jour et de nuit, sur les appareils de l’étape 5.
4. **Retirer l’ancien.** Les trois modules, les GIF, les vidéos et masques (33 Mo) sortent du dépôt ; l’app pèse 25 Mo de moins. Garder une branche ou une étiquette git avant ce retrait.

## 5 · Le repli sans WebGL, et ce qu’il faut tester

- Sans WebGL (`PIXI.isWebGLSupported()` faux, WebView bridée, mode économie d’énergie), la scène ne se monte pas : l’app affiche le camp en image fixe au moment de la journée, comme le prototype (fond, ciel, mont, cascade, tente, objets, bâtiments en HTML), et tout reste jouable. Le message « Le camp s’affiche en image fixe sur cet appareil. » une seule fois.
- À tester sur un **Android d’entrée de gamme** (2 à 3 Go de mémoire, GPU Mali ou Adreno ancien) et sur un **iPhone** (Safari, WebGL 2) : fluidité (viser 60 images par seconde en 390 × 844, boucle sous 10 ms : `Camp-scene.html` affiche les deux), batterie (une heure de camp ouvert : moins de 10 % ; la cadence 30 et le mode léger sont là pour ça), mémoire (le camp ouvert 30 minutes, puis le Journal et Aménager : pas de fuite ; `app.destroy` à la fermeture), l’onglet caché (tout s’arrête), le retour de veille (le contexte WebGL perdu : la scène se remonte).

## 6 · Les risques, et comment revenir en arrière

| Risque | Parade |
|---|---|
| Un appareil sans WebGL ou trop lent | Le repli en image fixe ; la cadence 30 et le mode léger ; mesurer avant de basculer (étape 2). |
| Le poids de PixiJS au premier chargement (240 Ko compressés) | Le charger en différé après le premier écran, comme le prototype (la scène se monte à la première vue du camp). |
| Une régression visuelle (place d’un objet, moment de la journée) | Les deux moteurs côte à côte pendant les étapes 1 et 2 ; les captures du prototype aux cinq heures de référence comme témoin. |
| La perte du contexte WebGL (retour de veille, mémoire) | `app.renderer` émet `contextlost` / `contextrestored` ; remonter la scène avec le même JSON. |
| Revenir en arrière | Tout est réversible jusqu’à l’étape 3 par le réglage ; après l’étape 4, par la branche git gardée avant le retrait. |

## 7 · Recommandation

**A, en petites étapes réversibles.** Un seul moteur à faire évoluer, le décor actuel avec l’îlot et le ponton, une app plus légère de 25 Mo. L’option C (les deux pendant une période) est l’étape 2 du plan ; l’option B (pas encore) coûte un décor à maintenir deux fois.
