# Minotaure : marionnette articulée rigide

Cette révision remplace le maillage qui étirait les PNG. Le modèle actif utilise
neuf rigs : huit orientations distinctes et la pose assise. Chaque rig comporte
un bassin et seize morceaux : torse, tête, toge, queue, deux bras, deux avant-bras,
deux mains, deux cuisses, deux tibias et deux pieds.

Chaque articulation est un `PIXI.Container`, enfant de son articulation amont.
Les sprites sont rigides : leur échelle locale reste à 1. Les épaules entraînent
les coudes puis les poignets, les hanches entraînent les genoux puis les chevilles.
Un `RenderLayer` conserve l'ordre des membres proches et lointains sans casser
cette hiérarchie. Les jambes utilisent une résolution géométrique à deux os :
leur longueur ne varie pas pour atteindre l'appui de la marche.

Les états et l'API de la scène sont conservés : marche, repos, réactions, salut,
assis, sommeil, expéditions et accessoires. La hache suit la main et son poignet.
Les poses se raccordent sur 240 ms, les orientations sur 70 ms. Le mouvement
réduit immobilise aussi ces transitions. L'Atelier arrête son ticker lorsque
l'onglet est caché.

## Images et reproduction

Les PNG directionnels fournis, y compris `dos.png` avec la toge corrigée, restent
intacts. `outils/decouper-minotaure-articule.py` produit les neuf atlas `rig-*.png`
et la définition des articulations dans `demo/assets/scene/minotaure-v2/`.
Les contours, pivots, raccords arrondis et plans de coupe sont spécifiques aux vues.
Les portions de toge qui chevauchaient les bras ne restent pas figées sur les mains.
Les vues de profil utilisent deux chaînes superposées au repos pour le membre
lointain initialement occulté dans le PNG.

La découpe ne peut pas révéler un torse absent derrière un bras. Les dessous de
ces raccords ont donc été reconstruits avec l'outil intégré **imagegen**, puis
placés sous les pixels originaux. Référence et résultat conservés dans
`assets/sources/minotaure-v2/rig/`. Le dessin des membres et les visages ne sont
pas régénérés. Le léger lien de queue est tracé derrière la silhouette.

Prompt de préparation : transformer la planche de neuf vues en sous-couches de
torse et toge, enlever têtes, bras, mains, jambes et queues ; compléter seulement
les zones cachées, conserver style, couleurs, orientation et épaule de la toge,
neuf cellules dans le même ordre, fond transparent, aucun texte. Outil intégré,
pas d'API externe. Les sous-couches sont recadrées, les pixels transparents et
petits résidus isolés exclus avant l'assemblage dans les atlas.

## Vérification et inspection

- `test/minotaure_squelette.js` : neuf hiérarchies sans cycles, parents anatomiques,
  atlas présents, aucun maillage actif.
- `test/minotaure_animation.js` : vues agrandies, huit animations, huit orientations
  en marche et en salut, longueurs constantes, coude indépendant, hache, immobilité
  pixel par pixel en mouvement réduit, absence d'erreurs console.
- `test/minotaure_atelier.js` : commandes de squelette, pause, rotation d'un membre
  et remise à zéro dans l'interface.
- `test/minotaure_camp.js` et `test/paysage_audit.js` : intégration avec trois
  compagnons, ambiances et expédition.

L'Atelier propose « Voir le squelette », « Pause », le choix d'une articulation
et sa rotation indépendante. Les rotations manuelles extrêmes sont un outil
d'inspection : les illustrations ont une perspective peinte, et ne constituent
pas un modèle 3D tournable librement. La main conserve la pose dessinée dans
la source (la flexion des doigts n'est pas inventée).

Validation finale : suites d’animation, Atelier, camp et paysage réussies ; mobile 17/17 ; vérificateur 0 erreur, 0 alerte. Boucle JavaScript du camp mesurée à 2,34 ms sur 16 images avec trois compagnons (pas une mesure de FPS sur téléphone physique).

Le chargement versionne le JSON et les textures en plus du JavaScript. Le défaut a été reproduit dans l’aperçu déjà ouvert (ancien JSON en cache, méthode articulations absente), puis corrigé et contrôlé dans ce même onglet : liste des 17 articulations et squelette visible pendant la marche. Les sauvegardes ne sont pas effacées.
