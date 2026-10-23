# Passe technique du 20/10 · 01 · Le moteur

## L’architecture en une phrase

**Le monde du jeu se dessine dans la scène PixiJS ; l’interface reste en HTML.** Le camp, ses personnages, sa lumière et ses particules sont dessinés par `commun/athena-scene.js` (décrit par `commun/athena-scene.json`, personnages dans `commun/athena-marionnette.js`, images dans `assets/scene/`). Le haut du camp, la barre des quêtes, les feuilles, les cartes, le Journal, l’espace parent et tous les textes restent en HTML par-dessus, reliés à la scène par ses événements (`scene.on('toucher', …)`, `scene.emettre('quete-validee', …)`). On ne dessine aucune interface dans PixiJS.

```
┌───────────────────────── téléphone 390 × 844 (HTML) ─────────────────────────┐
│ haut du camp (HUD, bandeau du Sentier, badges)        ← HTML, par-dessus       │
│ ┌───────────── canvas de la scène (PixiJS 8.22.0, 720 × 1280 « cover ») ───┐ │
│ │ fond (shader : ciel, mer, végétation, lumière) · mont et cascade (mesh)    │ │
│ │ objets, tente, bâtiments (dessins par le code), coffre, torches du Mont    │ │
│ │ minotaure et compagnons (marionnettes), bateau, mouettes, papillons        │ │
│ │ particules (ParticleContainer par famille), lueurs, voile du soir          │ │
│ └────────────────────────────────────────────────────────────────────────────┘ │
│ zones de toucher invisibles (feu, tente, coffre, Mont, bâtiments) ← HTML        │
│ barre des quêtes, feuilles, cartes, Journal, parent, textes     ← HTML          │
└────────────────────────────────────────────────────────────────────────────────┘
```

## Ce qui a changé le 20/10

| Avant (matin du 20/10) | Après |
|---|---|
| PixiJS 8.6.6 (décembre 2024) | PixiJS 8.22.0 (1er octobre 2026), dans les trois pages qui le chargent : `Prototype.dc.html`, `Camp-scene.html`, `atelier.html`. Rien d’autre ne le charge (contrôle du vérificateur). |
| Le prototype gardait l’ancien moteur du camp en secours : `AthenaDecor` (décor vidéo), `AthenaObjetsAnimes` (feu GIF), `AthenaCampLumiere` (filtres et ombres), chargés quand la scène échouait, et un canevas de particules 2D (`AthenaParticules`) | Un seul moteur : la scène. Sans WebGL, le camp s’affiche en **image fixe** (voir plus bas). Les particules du monde sont dans la scène ; celles de l’interface (fête d’une carte, bonus du bilan) sont la fête CSS du système d’animation (`commun/athena-motion.js`). |
| Les aperçus d’Écrans, de DA et de Mécaniques montraient l’ancien décor (`assets/optim/`, `assets/camp/`, `assets/housing/`), sans l’îlot ni le ponton | Ils montrent le décor actuel : les mêmes images que la scène (`assets/scene/`), posées aux places d’`athena-scene.json`. |
| Les particules de la scène : un `Sprite` par particule, trié avec les objets | Un `ParticleContainer` par famille (calque, profondeur, mode de fusion, texture) ; seules la position et la couleur remontent au GPU, plus l’échelle ou la rotation pour les familles qui en ont besoin ; ce qui brille hérite du mode « add » du conteneur. |
| Cadence libre (jusqu’à 120 images par seconde sur les écrans rapides) | `app.ticker.maxFPS = 60` ; `scene.reglages.cadence = 30` (ou le mode léger) baisse à 30. |
| — | `cullable` posé sur les éléments du monde ; `scene.reglages.cull` lance `Culler.shared` à chaque image. Éteint par défaut : rien n’est caché tant que tout le camp est visible (préparé pour la caméra de la grande passe). |

## Les fichiers du moteur

| Fichier | Rôle |
|---|---|
| `commun/athena-scene.js` | Le moteur : montage, calques, fond en shader, objets, bâtiments dessinés par le code, personnages, particules, lumière, caméra, événements. API inchangée (règle 2) : `monter`, `emettre`, `on`, `definir`, `ajouter`, `retirer`, `deplacer`, `element`, `lumiere`, `reglages`, `detruire`, `pause`, `reprendre`, `boite`, `depuisTelephone`, `elementDepuisCamp`, `dessins`. |
| `commun/athena-scene.json` | La description du camp : fond et moments, planches, éléments et leurs places (720 × 1280), chemins, lieux, ambiance (torches du Mont, soir), vie. |
| `commun/athena-marionnette.js` | Les personnages en morceaux (minotaure, compagnons), réglés par `assets/scene/minotaure/minotaure.json`. |
| `assets/scene/` | Toutes les images du camp : fond (4 moments), ciel, mont et cascade, planche des objets (`objets/objets.webp`), tentes, planches animées (feu, lanterne, fanion, carillon, flambeau), bateau, marionnette. 7,9 Mo. |
| `commun/athena-avatars.js` | Le seul module de la vraie app encore chargé par le prototype : il dessine les avatars (interface, pas le monde). |

## Une seule source pour la place et l’image de chaque objet

- **Les images** viennent toutes de la scène. `V.CAMP` (athena-v1.js) ne cite plus `assets/camp/objets.webp` ni `assets/camp/anime/` : la planche est celle d’`athena-scene.json` (`atlas`), les tentes sont les fichiers d’`assets/scene/objets/`. Ce qui a été déplacé hors de `V.CAMP` : `atlas`, `anime` (les planches animées de l’ancien moteur), `animesMax`, `biaisOmbres` (une option de l’ancien module de lumière). Ce qui reste : les prix et textes (dans `V.JEU.objets`), le niveau du Comptoir, et la géométrie de l’image fixe (`objets[id].s` : le rectangle dans la planche ; `c` : la place dans le téléphone ; `tentes[].c` ; `feu`, `bornes`, `zoneFeu`, `profondeur`).
- **Les places** : les éléments décrits dans `athena-scene.json` ont leurs coordonnées dans la scène (720 × 1280). Les objets achetés au Comptoir et déplacés par la personne (Aménager) gardent leur place dans le téléphone (`state.places`, 390 × 844) : la scène la reçoit par `AthenaScene.depuisTelephone(x, y)`, l’image fixe l’utilise telle quelle. Les deux repères se correspondent exactement (K = 844 / 1280, décalage horizontal (720 × K − 390) / 2).

## Le repli : l’image fixe du camp

Quand la scène ne peut pas tourner (pas de WebGL : `PIXI.isWebGLSupported()` faux ; script de PixiJS introuvable ; erreur au montage) ou quand le panneau du prototype force l’image fixe :

1. le camp s’affiche en image fixe **au bon moment de la journée** : le fond et le ciel de la scène (`fond_<moment>.webp`, `ciel_<moment>.webp`), le mont et son lit de cascade (`cascade/mont_<moment>.webp`, `mont_eau_<moment>.webp`), la première image de la cascade, posés en HTML aux rectangles de la scène (`cascade.json`) ;
2. la tente au niveau de l’Auberge, les objets posés (découpés dans la planche de la scène, à leur place), le feu (première image de sa planche), les bâtiments construits ou à construire et le coffre, dessinés par le code de la scène (`AthenaScene.dessins.plan`, canevas 2D, sans PixiJS) ;
3. le jeu reste entièrement jouable : le haut du camp, la barre des quêtes, les feuilles, le feu, la tente et le coffre restent touchables (ce sont des boutons HTML, les mêmes que sous la scène) ;
4. un message discret, une seule fois par session : « Le camp s’affiche en image fixe sur cet appareil. »

Les scripts se chargent dans cet ordre : la marionnette et la scène (qui n’ont pas besoin de PixiJS pour leurs dessins par le code), puis PixiJS ; sans WebGL, la scène ne se monte pas et le camp reste en image fixe. Le minotaure n’est pas dans l’image fixe (il faudrait assembler sa marionnette sans PixiJS) : c’est noté dans « ce qui reste ».

Les **aperçus** d’Écrans (le prototype importé en mode aperçu, jamais de scène) sont exactement ce dessin, avec les bâtiments : ils montrent donc le décor actuel, l’îlot, le ponton, le Kiosque. DA et Mécaniques lisent les mêmes fichiers d’`assets/scene/` (fonds, tentes).

## Ce qui est parti aux Archives, et pourquoi

Tout est dans `Archives/2026-10-20-ancien-moteur/` (ligne par ligne dans `Archives/INDEX.md`) :

- `commun/athena-decor.js`, `athena-objets-animes.js`, `athena-camp-lumiere.js`, `athena-camp-lumiere-v1.js` : les modules de la vraie app. **Toujours utilisés par la vraie app (dépôt Artwar974/app-tdah) ; gardés tels quels jusqu’au choix 20.** Le prototype ne les lit plus.
- `commun/athena-particules.js` : le canevas de particules 2D du prototype ; remplacé par les `ParticleContainer` de la scène et par la fête CSS du système d’animation.
- `outils/decor-test.html`, `objets-test.html`, `objets-vivants-test.html`, `lumiere-v2-test.html`, `camp-qualite-test.html` : leurs pages de test.
- `assets/decor/` (25 Mo), `assets/camp/` sauf `objets.webp`, `assets/housing/` sauf `feu-preview-v2.webp`, `assets/optim/` sauf `day`, `sunset`, `night` en 560 et hd : les anciennes images. Les fichiers gardés en place sont ceux que `Tower defense.dc.html` lit encore (règle 1 : les Incursions ne se touchent pas) ; la V1 ne les lit plus (contrôle du vérificateur, qui exclut les Incursions).
- `ancienne-version.html` : l’ancienne version publiée du Prototype, en un seul fichier ; elle charge l’ancien moteur.
- `Prototype.dc.html` du matin du 20/10 (avec l’ancien secours), pour revenir en arrière.

Et dans `Archives/2026-10-20-scene-avant/` : `athena-scene.js`, `athena-scene.json`, `athena-marionnette.js`, `minotaure.json` tels qu’ils étaient le matin du 20/10 (PixiJS 8.6.6, particules en sprites).

## Pour revenir en arrière

Recopier les fichiers de `Archives/2026-10-20-scene-avant/` à leur place, remettre `pixi.js@8.6.6` dans les trois pages ; et, pour l’ancien secours, recopier `Archives/2026-10-20-ancien-moteur/Prototype.dc.html` à la racine avec les modules et les images du même dossier. Rien n’a été supprimé.
