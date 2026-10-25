# Bâtiments et implantation du 25 octobre 2026

La fiche `ASSETSSSS.png` fournit les modèles. L'image `1.png` est uniquement
une référence de disposition : son paysage et son feu ne sont pas intégrés.
Les deux originaux sont conservés dans `assets/sources/batiments-20261025/`.

Les trois bâtiments disposent de quatre visuels actifs. Le manifeste est
`demo/assets/scene/batiments/modeles-baie.json` ; les douze images transparentes
portent les noms `baie-auberge-1.webp` à `baie-forge-4.webp` dans ce même dossier.
`outils/preparer-batiments-baie.py` reproduit la sélection et la préparation.

## Sélection corrigée

- Auberge 1 : tente crème simple ; auberge 2 : tente avec bande bleue ;
  auberge 3 : petite maison ; auberge 4 : grande maison choisie par l'utilisateur
  dans le résultat initialement classé à tort comme forge 4, avec l'enclume
  retirée de sa terrasse et le toit entièrement cadré.
- Forge 1 : petite installation d'origine, ajoutée après correction ;
  forge 2 : modèle initialement classé forge 1 ; forge 3 : ancien modèle 2 ;
  forge 4 : ancien modèle 3. Aucun modèle d'auberge n'est utilisé comme forge.
- Comptoirs 1 à 4 : progression de la fiche, du petit étal bleu à l'étal
  à grande toile crème et bleue.

Les sauvegardes et le barème historique de niveau 5 sont conservés : le rendu
plafonne au quatrième visuel disponible. Le cinquième niveau ne réintroduit
aucune ancienne illustration. Ce choix évite de rétrograder les bâtiments
déjà acquis pour une révision graphique.

## Disposition et intégration

Repère de scène 720 × 1280, coordonnées au pied :

| Élément | x | y | largeur maximale avant profondeur |
|---|---:|---:|---:|
| Auberge | 155 | 900 | 245 |
| Forge | 570 | 900 | 225 |
| Comptoir | 575 | 1105 | 220 |
| Feu actuel | 363 | 968 | 104 |

Le feu conserve sa planche animée et ses effets. Sa lumière, sa zone libre
et les sièges suivent sa nouvelle position. Les petits décors du camp ont
des emplacements par défaut adaptés ; les positions personnalisées restent
prioritaires. Le kiosque passe en bas à gauche et la fontaine dans la zone
basse centrale. Le coffre reste à portée de l'auberge.

Le manifeste porte la taille de chaque niveau, l'empreinte et les points de
foyer, d'enclume et de cheminée des forges. Les lanternes ne sont placées
que sur les illustrations qui en contiennent. Le repli HTML lit le même
manifeste que PixiJS. Les chemins ont été recalés autour du nouveau feu,
de l'entrée de l'auberge et du Comptoir, notamment son point d'arrêt [575,1135].

## Préparation des images

Outil intégré **imagegen**, mode édition, fond transparent. Sources et résultats
intermédiaires restent dans `assets/sources/batiments-20261025/`.

Prompts : extraire séparément les quatre auberges, les quatre forges et les
quatre comptoirs de la fiche, conserver architecture, perspective, couleurs,
bannières et accessoires, supprimer numéros, arrière-plans, grands rectangles
de terrain et traînées de collage ; conserver seulement les petits socles
irréguliers. La sélection des niveaux est ensuite explicite dans le script,
sans se fier à l'ordre proposé par la génération.

Corrections demandées : extraire la petite forge 1 de son morceau de fiche,
sans l'améliorer ni la transformer ; conserver exactement la maison choisie
pour l'auberge 4, retirer seulement l'enclume de sa table et réparer le bois ;
recadrer cette maison avec une marge transparente et son toit complet.
Les limites des cellules sont nettoyées par sélection de la silhouette
principale, afin d'exclure les fragments d'un toit voisin. Les WebP sont
sans perte et rembourrés de quatre pixels transparents.

## Contrôles

`batiments_baie.js` : douze modèles, ordre des quatre niveaux, manifeste
partagé, disposition et planche du feu conservée. `batiments_scene.js` :
constructions à tous les niveaux, absence de chevauchement entre les trois
bâtiments, accès port/coffre/comptoir, menus au toucher et lumière nocturne.
`batiments_compat.js` : Camp-scene, Atelier, sauvegardes niveau 5 et repli HTML.
Les captures de contrôle sont dans `test/logs/batiments/` et
`test/logs/batiments-baie/`.

## Palette du paysage

Les douze modèles partagent une correction locale de saturation (64 %), sépia léger (12 %), contraste (88 %) et luminosité (96 %). Le champ `palette` du manifeste pilote la texture PixiJS et le repli HTML. La correction est calculée une fois à la création du dessin, avant les lumières jour/nuit ; les flammes, halos et particules restent indépendants. Les sources et transparences sont conservées.
