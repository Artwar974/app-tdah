# ASSET STANDARD — CAMP GREC V1

Ce standard gouverne tous les assets du Housing. La caméra est prioritaire : l'objet s'adapte au camp, jamais l'inverse.

## Kit caméra de référence

Les références visuelles absolues sont :

1. `tente1.webp` pour les structures hautes et textiles ;
2. `kiosque.webp` pour les constructions ouvertes ;
3. `potager.webp` pour les empreintes au sol.

En cas de conflit entre une valeur théorique et ces références validées, la référence visuelle prime.

## Caméra et orientation

- Projection pseudo-isométrique / orthographique légère, vue de 3/4 et légèrement plongeante.
- Élévation conceptuelle de 30° à 38° ; rotation horizontale de 35° à 45°.
- Le devant, un côté et une portion significative du dessus doivent être lisibles.
- Les axes du sol forment un V aplati vers le haut-gauche et le haut-droit.
- Les verticales restent verticales et ne convergent pratiquement pas.
- Orientation source unique : `CAMP_CANONICAL`. Le miroir est géré par le Housing.

## Sol, cadrage et ancrage

- Aucun terrain autour de l'objet, sauf s'il lui appartient fonctionnellement.
- Fond RGBA 100 % transparent ; aucun pixel parasite ni élément tronqué.
- Marge alpha raisonnable et point de contact stable.
- `anchorX` correspond au centre horizontal de l'empreinte.
- `anchorY` correspond au centre du contact au sol, pas au centre visuel.
- Les objets longs suivent strictement les axes du camp.

## Direction artistique et lumière

- Formes lisibles, grandes masses, détails sélectionnés, texture numérique discrète.
- Palette méditerranéenne relativement neutre : pierre ivoire/ocre, bois brun désaturé, végétation olive/sauge, bleu grec doux, bronze mat.
- Lumière neutre douce venant du haut-gauche ; ombres structurelles vers le bas-droit.
- Aucun éclairage sunset, dawn ou nuit cuit dans l'image.
- Aucune longue ombre portée au sol : elle relève du moteur.
- Les assets doivent supporter `BASE + LIGHT + SHADOW + AMBIENT + TIME OF DAY`.

## Lisibilité et échelle

- Validation obligatoire à environ 100–200 px de haut.
- Priorité : silhouette > volume > couleur > détail.
- Repères : banc 0,45 m ; table 0,75 m ; torche 1,6–2 m ; petit olivier 1,5–2,5 m ; kiosque 2,5–3 m ; tente 2,5–3,5 m.
- Le moteur applique ensuite un depth scaling global, identique pour tous.

## Métadonnées obligatoires

Chaque type doit exposer :

- `anchorX` et `anchorY` ;
- `footprint` ;
- `heightClass` (`LOW`, `MEDIUM`, `TALL`, `BUILDING`) ;
- `orientation: CAMP_CANONICAL` ;
- `emissive` pour les sources lumineuses.

Les métadonnées sont appliquées aux éléments rendus sous forme de `data-footprint`, `data-height-class`, `data-orientation` et `data-emissive`. Les tests refusent un asset incomplet.

## Assets lumineux

Le corps reste soumis à l'ambiance et la source lumineuse reste émissive. Le feu et le flambeau conservent une animation séparée et une lumière dynamique. Pour les futurs assets importants, prévoir si possible `BASE`, `LIGHT_MASK`, `SHADOW_MASK`, puis `EMISSIVE` et `OCCLUSION_MASK` si nécessaire, avec cadrage et résolution identiques.

## Validation

Un asset est accepté seulement s'il semble avoir été peint dans la même scène lorsqu'il est placé à gauche du feu, près de la statue, à côté de la tente, près du kiosque et au premier plan. Corriger dans cet ordre : perspective, angle, proportions, valeurs, palette, niveau de détail.
