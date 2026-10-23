# Passe technique du 20/10/2026 · PixiJS 8.22.0 et un seul moteur pour le camp

Deux changements en une passe, tous deux réversibles : le camp du prototype passe de PixiJS 8.6.6 à **8.22.0**, et la scène PixiJS devient le **seul moteur du monde du jeu** dans le prototype ; l’ancien moteur du camp (celui de la vraie app, repris en secours) est rangé aux Archives. Le principe tient en une phrase : **le monde du jeu se dessine dans la scène PixiJS ; l’interface reste en HTML.**

Le 20/10 a eu **deux passes** : la passe technique (ce fichier, `01-MOTEUR.md`, `02-INTEGRATION-VRAIE-APP.md`) et la **passe de conception** demandée le matin (`03-CONCEPTION.md` : le camp, les expéditions en parcours, le résumé du matin, les quêtes d’hier, les décisions ; `04-ETAT.md` : ce qui est fait, vérifié, et ce qui reste).

**À lire d’abord**
1. **Ce fichier** : ce qui a changé, ce qui est vérifié, ce qui reste, puis le compte rendu en sept points.
2. **01-MOTEUR.md** : l’architecture (monde dans la scène, interface en HTML), les fichiers du moteur, le repli sans WebGL, ce qui est parti aux Archives, comment revenir en arrière.
3. **02-INTEGRATION-VRAIE-APP.md** : pour l’associé, à lire en dix minutes : ce que la vraie app utilise aujourd’hui, ce que la scène apporte, la correspondance des appels, un plan en petites étapes réversibles, le repli, les risques. C’est le dossier du **choix 20**.
4. **03-CONCEPTION.md** et **04-ETAT.md** : la passe de conception du 20/10 (le système d’expédition au propre, les décisions, l’état).

## 1. Ce qui a changé

| Où | Quoi |
|---|---|
| `Prototype.dc.html`, `Camp-scene.html`, `atelier.html` | PixiJS `8.22.0` au lieu de `8.6.6` (une ligne par page). Aucune autre page ne charge PixiJS ; le vérificateur le contrôle. |
| `commun/athena-scene.js` (version du matin dans `Archives/2026-10-20-scene-avant/`) | L’en-tête dit que la scène est le moteur du monde et que 8.22.0 est requis. Les particules du monde sont dans des `ParticleContainer` (une famille par calque, profondeur, mode de fusion et texture). `app.ticker.maxFPS = 60` ; `scene.reglages.cadence = 30` (ou le mode léger) baisse à 30. `cullable` posé sur les éléments du monde, `scene.reglages.cull` lance `Culler.shared` (éteint). **L’API n’a pas bougé** : `monter, emettre, on, definir, ajouter, deplacer, element, lumiere, reglages, detruire, pause, reprendre, boite, depuisTelephone, elementDepuisCamp`, et les événements gardent leurs noms. |
| `Prototype.dc.html` (version du matin dans `Archives/2026-10-20-ancien-moteur/`) | Plus d’ancien moteur ni de code de secours : ni `AthenaDecor`, ni `AthenaObjetsAnimes`, ni `AthenaCampLumiere`, ni le canevas de particules. Sans WebGL (ou avec « Forcer l’image fixe » dans le panneau), le camp s’affiche en **image fixe** au moment de la journée, fait des images de la scène ; tout reste jouable ; un message discret, une seule fois. Le coffre, les bâtiments et les objets gardent une seule source pour leur place et leur image. `V.CAMP` ne garde que ce qui n’est pas dans la scène. |
| `Ecrans.dc.html`, `DA.dc.html`, `Mecaniques.dc.html` | Les aperçus montrent le décor actuel (îlot, ponton) : les mêmes images que la scène, depuis `assets/scene/`, aux places d’`athena-scene.json`. Plus rien ne lit `assets/optim`, `assets/camp`, `assets/housing`, `assets/decor`. |
| `athena-v1.js` | Deux décisions réversibles du 20/10 (`pixi-8-22`, `monde-pixi-interface-html`), le **choix 20** (la scène dans la vraie app), « Les Incursions sur la même scène » après la V1, l’entrée du journal, `V.CAMP` épuré (plus d’atlas ni d’animations de l’ancien moteur), le texte du repli (`camp.imageFixe`). |
| `Accueil.dc.html`, `Decisions.dc.html`, `LISEZ-MOI.md` | « Le camp vivant » dit le moteur unique ; l’en-tête des choix compte le 20 ; le plan des dossiers, la règle 1 (« Les modules de la vraie app, rangés aux Archives, ne se modifient pas. ») et la nouvelle règle (« Le monde du jeu se dessine dans la scène PixiJS ; l’interface reste en HTML. »). |
| `scripts/verifier-projet.py` | La section 8 ne contrôle plus l’ancien moteur ; elle contrôle la même version de PixiJS partout (8.22.0 attendue), qu’aucune page de la racine ne charge les anciens modules, qu’aucune page ni `athena-v1.js` ne cite les anciens dossiers d’images, que l’API de la scène est là, que les images de la scène existent, et que `athena-avatars.js` est toujours en place. |
| `Archives/` | `2026-10-20-ancien-moteur/` (les modules de la vraie app, le canevas de particules, les pages de test, les anciens dossiers d’images, `ancienne-version.html`, le Prototype du matin) et `2026-10-20-scene-avant/` (la scène du matin). Chaque ligne est dans `Archives/INDEX.md`. |
| `Camp-scene.html` | Trois boutons de plus : « Cadence 30 », « Culling (caméra) », et « ips · boucle ms » (la boucle en millisecondes à côté des images par seconde). |

Les Incursions (`Tower defense.dc.html`, `tower-defense/`) ne sont pas touchées ; les huit images qu’elles lisent encore (six fonds dans `assets/optim/`, le feu dans `assets/housing/`, l’atlas dans `assets/camp/`) restent à leur place.

## 2. Ce qui est vérifié

| Contrôle | Résultat |
|---|---|
| `python3 -I scripts/verifier-projet.py .` | 0 erreur, 0 alerte (avec les nouveaux contrôles de la section 8). |
| Les règles de l’économie (`outils/economie-controles.js`, barème 5) | 87 règles sur 87 ; `V.JEU.eco` est la copie exacte d’`AthenaEconomie.DEFAUT` (comparée champ par champ). |
| `Camp-scene.html` sur 8.22.0 | `PIXI.VERSION` 8.22.0 ; aucune erreur ni dépréciation dans la console à 6 h 30, 10 h 15, 17 h 30, 19 h 30, 22 h 30 ; les curseurs Mer et Vent changent les uniformes du shader (`uEau`, `uVent`) ; les quatre événements ; le Mont au palier 4 ; la tente 1 à 4 ; le flambeau ; le compagnon ; toucher le minotaure et le sol ; le mouvement réduit ; « Cadence 30 » → `ticker.maxFPS` 30. |
| `atelier.html` | Chaque état, chaque direction, « Tourner sur lui-même », les têtes, le sac, « Copier les réglages » : sans erreur (le bouton « Copier » attrape maintenant un refus du presse-papiers). |
| `Prototype.dc.html` | Ado puis Parent, les deux DA, 390 × 844 et 360 × 640 : premier lancement, camp de jour et de nuit, coffre, Sommet, Comptoir, Arranger, plan et chantier, expédition aller et retour, Hameau, visite, Étincelle : console vide, aucune requête vers `assets/decor`, `assets/optim`, `assets/camp`, `assets/housing`. La validation par le glisser fait réagir le camp. |
| « Forcer l’image fixe » (panneau) | La scène se démonte, le camp s’affiche en image fixe (fond, ciel, mont, cascade, tente, coffre et cinq bâtiments dessinés par le code), le message s’affiche une fois ; décoché, la scène revient. Même chose quand PixiJS manque ou que `isWebGLSupported()` répond non. |
| Aperçus d’Écrans, de DA et de Mécaniques | Le décor actuel, sans erreur ; aucun défilement horizontal à 390 px. `Tower defense.dc.html` s’ouvre. |
| FPS, avant et après | Mesurés sur le rendu logiciel du conteneur (SwiftShader), donc bas dans l’absolu ; ce qui compte est le temps de la boucle, ci-dessous. |

Le détail des contrôles est dans `test/t5_controles.js` et son journal ; les patches sont rejouables (`tools/patch_2010_t1.py` à `patch_2010_t5.py`).

## 3. Ce qui reste

- **Mesurer sur de vrais téléphones** : les chiffres ci-dessous viennent d’un rendu logiciel ; le gain des `ParticleContainer` se verra surtout sur un Android d’entrée de gamme. Deux appareils sont nommés dans `02-INTEGRATION-VRAIE-APP.md`.
- **La cadence pour les personnes** : `scene.reglages.cadence` existe (30 avec « Mode modeste »). Un réglage visible dans le panneau du prototype viendra avec la grande passe, s’il sert.
- **Le culling** : préparé, éteint. Il s’allumera avec la caméra, quand une partie du camp sortira de l’écran.
- **Le minotaure dans l’image fixe** : l’image fixe montre le camp sans le personnage (pas de dessin figé du minotaure en dehors de la marionnette ; rien n’est inventé). Si la vraie app a un jour besoin d’une image fixe avec lui, il faudra un dessin dans la liste à commander.
- **Le choix 20** : à confirmer avec l’associé (par défaut A).

## 4. Le compte rendu en sept points

### 4.1 · Ce qui a dû être corrigé pour 8.22.0, et pourquoi

Rien dans le code de la scène. Entre 8.6.6 et 8.22.0, aucune des API que la scène utilise n’a changé de forme : `Shader.from({ gl, resources })` avec `UniformGroup` typé (le fond et le mont), `MeshPlane` (les vagues, la cascade), `Texture` avec un cadre dans une planche (feu, lanterne, fanion, carillon, flambeau, atlas des objets), `Graphics` (les dessins par le code), le seul `PIXI.Text` (le zzz), les événements du toucher de la marionnette. Le prétraitement GLSL est le même (la ligne `#version 300 es` est reconnue, les macros WebGL1 ne sont pas injectées). La console reste vide : ni erreur, ni avertissement de dépréciation (`getSize`, `app.view`, `DisplayObject` ne sont pas utilisés). Les seules lignes changées pour 8.22.0 sont les trois adresses du CDN et le harnais de test (le paquet 8.22.0 servi en local).

### 4.2 · Les nouveautés utilisées, avec les mesures ; celles écartées

Mesures sur SwiftShader (rendu logiciel, images par seconde très basses par nature) ; le temps de la boucle (`scene.perf`) est la mesure qui compare.

| Moment | 8.6.6 (matin) | 8.22.0, avant les nouveautés | 8.22.0, après |
|---|---|---|---|
| 10 h 15 | 1,70 ms | 2,78 ms | 2,24 ms |
| 19 h 30 | 2,04 ms | 1,91 ms | 2,13 ms |
| 22 h 30 | 1,66 ms | 1,64 ms | 1,51 ms |
| Rafale (quête validée + Sommet + expédition) | 2,21 ms, 472 nœuds | — | 2,02 ms, 455 nœuds |

Les écarts entre colonnes sont dans le bruit du rendu logiciel (la même page mesurée deux fois varie de 0,3 ms) ; ce qu’on retient : **rien ne s’est dégradé**, la rafale est un peu plus courte et la scène compte moins de nœuds.

- **`ParticleContainer` + `Particle`** (utilisé) : étincelles, braises et fumée du feu, poussière, sable des pas, éclats et copeaux des chantiers, fumée des cheminées, embruns, gouttes de la cascade, sillage du bateau, éclat du Mont. Une famille par (calque, profondeur, mode de fusion, texture) ; `dynamicProperties` limité à la position et la couleur, plus `vertex` pour les familles qui changent d’échelle, `rotation` pour les copeaux ; ce qui brille (`add`) hérite du mode de fusion du conteneur, qui a sa `boundsArea`. Le gain attendu est sur téléphone : une particule n’est plus un `Sprite` trié avec les objets.
- **`Ticker.maxFPS`** (utilisé) : 60 au plus (plus jamais 120 sur les écrans rapides), 30 avec `reglages.cadence = 30` ou le mode léger. `Camp-scene.html` a le bouton.
- **`cullable` + `Culler.shared`** (préparé, éteint) : posé sur chaque élément du monde ; `reglages.cull` lance le tri à chaque image. Sans gain tant que tout le camp tient dans l’écran ; prêt pour la caméra.
- **`RenderLayer`** (écarté) : l’ordre de dessin est déjà simple, un calque par plan et `zIndex` sur le calque des objets ; rien n’a besoin d’être dessiné hors de l’ordre de son parent. On l’ajoutera si la caméra ou les Incursions compliquent l’ordre.
- **Feuilles mortes, le zzz et l’anneau de l’appui long** (restent des sprites, un texte, un `Graphics`) : trop peu nombreux pour une famille, ou pas une texture partagée.
- **Culling allumé par défaut** (écarté) : il coûte un calcul de bornes par image sans rien cacher aujourd’hui.

### 4.3 · Ce qui est parti aux Archives, ce qui est resté, et pourquoi

Parti dans `Archives/2026-10-20-ancien-moteur/` (ligne par ligne dans `Archives/INDEX.md`) :
- `commun/athena-decor.js`, `athena-objets-animes.js`, `athena-camp-lumiere.js`, `athena-camp-lumiere-v1.js` : les modules de la vraie app, **toujours utilisés par la vraie app (dépôt Artwar974/app-tdah) ; gardés tels quels jusqu’au choix 20**. Plus rien dans le prototype ne les charge.
- `commun/athena-particules.js` : le canevas de particules 2D du prototype ; les particules du monde sont dans la scène, celles de l’interface (fête, bonus) en CSS avec `AthenaMotion`.
- `outils/decor-test.html`, `objets-test.html`, `objets-vivants-test.html`, `lumiere-v2-test.html`, `camp-qualite-test.html` : les pages de test de l’ancien moteur.
- `assets/decor/` (25 Mo), `assets/camp/`, `assets/housing/`, `assets/optim/` : les images de l’ancien moteur, 33 Mo.
- `ancienne-version.html` : l’export en un fichier de l’ancien Prototype ; il chargeait l’ancien moteur.
- `Prototype.dc.html` du matin du 20/10, avec le secours.

Parti dans `Archives/2026-10-20-scene-avant/` : `athena-scene.js`, `athena-scene.json`, `athena-marionnette.js`, `minotaure.json` tels qu’ils étaient le matin (PixiJS 8.6.6, particules en sprites).

Resté en place, et pourquoi :
- `commun/athena-avatars.js` : encore chargé par le prototype (les avatars du Hameau).
- `assets/optim/day-560.webp`, `day-hd`, `sunset-560`, `sunset-hd`, `night-560`, `night-hd`, `assets/housing/feu-preview-v2.webp`, `assets/camp/objets.webp` : lus par les Incursions, qu’on ne touche pas. (`assets/camp/objets.webp` est identique, octet pour octet, à `assets/scene/objets/objets.webp`.)
- `commun/athena-scene.json`, `assets/scene/` : le moteur et ses images.

### 4.4 · Le repli et les aperçus

**Le repli** (sans WebGL, sans PixiJS, ou « Forcer l’image fixe ») : le prototype n’essaie plus un autre moteur. Il affiche, en HTML et derrière les mêmes zones à toucher : le fond du moment (`assets/scene/fond/fond_<moment>.webp`) et son ciel, le mont et son eau (`assets/scene/cascade/mont_<moment>.webp`, `mont_eau_<moment>.webp` à la place du JSON), la première image de la cascade (`cascade_<moment>.webp`), la tente au niveau de l’Auberge (`assets/scene/objets/tenteN.webp`), les objets posés (découpés dans l’atlas de la scène, à leur place d’Aménager), le coffre, et les bâtiments construits dessinés par le code (`AthenaScene.dessins.plan`, les mêmes dessins que dans la scène, rendus une fois en image). Le moment vient de `fond.reperes` d’`athena-scene.json` (lever, jour, coucher, nuit), les rectangles sont convertis du repère de la scène (720 × 1280) au téléphone (390 de large). Tout reste jouable (les quêtes, le coffre, les feuilles, les écrans) ; un seul message, discret, une fois par session : « Le camp s’affiche en image fixe sur cet appareil. » Le panneau a « Forcer l’image fixe » pour l’essayer.

**Les aperçus** d’Écrans, de DA et de Mécaniques utilisent les mêmes images de la scène et les mêmes places (`athena-scene.json` pour les éléments, `V.CAMP.objets[id].c` et `V.BATIMENTS[id].place` pour ce qui est au jeu). Une seule source pour la place et l’image de chaque objet : la scène ; `V.CAMP` ne garde que les places d’Aménager, les prix et les textes.

### 4.5 · Ce qui n’a pas pu être fait

- Les mesures sur de vrais appareils (le conteneur n’a qu’un rendu logiciel) ; les chiffres de 4.2 disent « pas de régression », pas « plus fluide ».
- L’image fixe sans le minotaure (voir § 3) : aucun dessin inventé.
- `RenderLayer` : pas de raison de l’utiliser aujourd’hui.

### 4.6 · Les choix décidés seul

- Les familles de particules sont indexées par calque, profondeur, mode de fusion, texture et propriétés dynamiques ; les particules du sillage passent sous le bateau (`addChildAt(0)`), celles qui brillent dans le calque des lueurs.
- Les dessins par le code de l’image fixe sont rendus une fois en image (`blob:`), pas en `data:` (les styles en ligne des pages `.dc.html` coupent les adresses `data:` sur le point-virgule).
- Les huit images lues par les Incursions restent à leur place plutôt que d’être copiées : on ne touche pas aux Incursions, pas même leurs adresses.
- `ancienne-version.html` part aux Archives (il chargeait l’ancien moteur) ; `LISEZ-MOI.md` ne le cite plus.
- L’ordre de chargement : marionnette, scène, puis PixiJS ; si `PIXI.isWebGLSupported()` répond non, le repli tout de suite, sans monter.
- Le message du repli : une fois par session, 700 ms après l’affichage, jamais en rouge.
- « Forcer l’image fixe » est dans le panneau du prototype (pas dans l’app) ; décoché, la scène se remonte.
- Les deux décisions du 20/10 sont écrites comme réversibles, par « 20/10 », avec leur chemin de retour.
- Le choix 20 est écrit dans le même format que les autres, par défaut A, « à confirmer avec mon associé ».

### 4.7 · Le choix 20 en une ligne

**La vraie app adopte-t-elle la scène PixiJS du prototype ?** A · Oui (la scène remplace le décor, les objets animés et la lumière) · B · Pas encore · C · Les deux pendant une période. **Recommandation : A, en petites étapes réversibles** (`02-INTEGRATION-VRAIE-APP.md`) : un seul moteur à faire évoluer, le décor actuel avec l’îlot et le ponton, une app plus légère (8,2 Mo d’images et 240 Ko de PixiJS compressé, contre 33 Mo d’images aujourd’hui). Par défaut A, à confirmer avec l’associé.
