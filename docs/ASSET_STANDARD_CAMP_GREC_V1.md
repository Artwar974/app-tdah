# Asset Standard — Camp grec V1

Statut : **VERROUILLÉ**

Date de verrouillage : 2026-09-15

Cette norme est la source de vérité pour toute création, extraction, correction ou intégration d'asset plaçable dans le Housing du camp grec de *Journal de Quêtes*.

Elle ne doit être modifiée qu'après décision explicite du studio.

## 1. Règle principale

Un asset n'est pas validé parce qu'il est joli isolément. Il est validé s'il donne immédiatement l'impression d'avoir été peint dans la même scène que le camp, avec la même caméra, la même perspective, la même échelle visuelle et la même logique lumière/couleur.

Ordre de priorité en cas de conflit :

1. perspective et caméra ;
2. ancrage au sol et proportions ;
3. valeurs et lumière ;
4. palette et matériaux ;
5. direction artistique ;
6. détail décoratif.

## 2. Caméra canonique verrouillée

La caméra des assets du camp grec est unique.

- vue pseudo-isométrique / quasi orthographique ;
- vue de 3/4 ;
- légère plongée ;
- élévation conceptuelle : environ **30 à 38°** au-dessus du plan horizontal ;
- rotation horizontale conceptuelle : environ **35 à 45°** par rapport à la face principale ;
- très faible déformation perspective ;
- les verticales restent visuellement verticales ;
- pas de grand-angle ;
- pas de vue frontale ;
- pas de caméra propre à chaque objet.

La référence visuelle prime sur les valeurs numériques si un écart est nécessaire.

### Axes du sol

Les deux axes horizontaux du plan de sol forment un V aplati :

- un axe part vers le haut-gauche ;
- l'autre part vers le haut-droit.

Un carré posé au sol doit donc apparaître comme un quadrilatère / losange aplati cohérent avec le camp.

### Orientation canonique

La face principale de l'objet est orientée vers le bas de l'image avec une légère rotation permettant de voir une face latérale.

On doit généralement voir :

- le devant ;
- un côté ;
- une portion significative du dessus.

**L'objet s'adapte à la caméra. La caméra ne s'adapte jamais à l'objet.**

Les variantes miroir ou retournées doivent être gérées ensuite par le Housing quand c'est possible.

## 3. Rapport dessus / façade

Le dessus doit être assez visible pour que l'objet appartienne au plan du camp :

- table : plateau clairement visible ;
- potager : terre intérieure clairement visible ;
- fontaine : intérieur du bassin visible ;
- amphore : ouverture légèrement visible ;
- kiosque : toiture + espace sous toiture lisibles ;
- caisse : dessus + deux faces.

Ne jamais basculer vers une vue aérienne.

## 4. Contact au sol et footprint

Chaque asset doit sembler posé sur exactement le même plan de sol que les autres.

Interdits :

- objet flottant ;
- base vue de face ;
- socle construit selon une autre perspective ;
- plaque de terrain artificielle ajoutée pour masquer un mauvais raccord.

Par défaut, ne pas inclure de terrain autour de l'objet.

Exceptions fonctionnelles :

- potager : la terre à l'intérieur de la clôture appartient à l'asset ;
- fontaine : son bassin et son socle appartiennent à l'asset ;
- arbre en pot : le pot appartient à l'asset ;
- torche plantée : pas de plaque de terre autour du pied.

## 5. Convention d'ancrage Housing

Chaque asset doit pouvoir être décrit au minimum par :

- `anchor` ;
- `footprint` ;
- `heightClass` ;
- `orientation` ;
- `emissive` si nécessaire.

Convention :

- objet vertical : anchor au centre de la zone de contact au sol, proche du pied ;
- objet au sol : anchor proche du centre géométrique du footprint ;
- l'anchor n'est pas le centre visuel de l'image.

Exemples indicatifs :

```text
potager.png
anchor: 50% / 66%
footprint: RECT_2x2
heightClass: LOW
orientation: CAMP_CANONICAL
```

```text
torch_wood_01.png
anchor: 50% / 91%
footprint: POINT
heightClass: TALL
orientation: CAMP_CANONICAL
emissive: true
```

Ces valeurs sont des exemples de structure, pas des valeurs à recopier sans mesurer l'asset réel.

## 6. Échelle relative

Utiliser une échelle commune. Repères conceptuels :

- humain : ~1,75 m ;
- banc : ~0,45 m ;
- table : ~0,75 m ;
- torche : ~1,6–2 m ;
- amphore : ~0,5–1 m ;
- petit olivier : ~1,5–2,5 m ;
- kiosque : ~2,5–3 m ;
- tente : ~2,5–3,5 m.

Le Housing pourra ensuite appliquer son scaling de profondeur, mais l'asset source doit déjà être cohérent avec cette échelle relative.

## 7. Direction artistique verrouillée

Direction : camp grec méditerranéen de *Journal de Quêtes*, avec le langage de formes établi dans le projet et l'influence de décors stylisés de type *Samurai Jack*.

À conserver :

- grandes silhouettes lisibles ;
- formes simplifiées ;
- grandes masses colorées ;
- aplats nuancés ;
- petite matière de pinceau numérique ;
- grain léger ;
- contours créés surtout par les masses de couleur ;
- ombres larges et graphiques ;
- matériaux lisibles sans photoréalisme ;
- détails sélectionnés, pas accumulés.

À éviter :

- photoréalisme ;
- rendu PBR ;
- rendu 3D glossy ;
- fantasy mobile générique ;
- contours noirs épais ;
- hypertexture ;
- dorures et ornements en excès ;
- objets beaucoup plus détaillés que le décor.

Priorité de lecture :

**silhouette > volume > couleur > détail**.

Un asset doit rester lisible une fois réduit à environ 100–200 px de hauteur sur téléphone.

## 8. Palette matérielle du camp grec

Base recommandée :

- pierre : ivoire chaud, beige méditerranéen, ocre clair, ombres lavande très légères ;
- bois : brun moyen désaturé, ombres brun-prune ;
- végétation : olive, sauge, vert gris, accents lumineux mesurés ;
- céramique : terre cuite, ivoire, bleu grec désaturé, violet doux ponctuel ;
- textile : ivoire, bleu grec / indigo doux, lavande, prune discret ;
- métal : bronze mat, or ancien, jamais chrome ou or ultra brillant.

Les motifs grecs sont des accents. Ils ne doivent pas couvrir toutes les surfaces.

## 9. Base neutre et système temporel

Les assets ne doivent pas embarquer un éclairage sunset, dawn ou night définitif.

Principe :

**MATÉRIAU D'ABORD → ÉCLAIRAGE TEMPOREL ENSUITE.**

La base doit rester relativement neutre pour pouvoir recevoir :

- DAWN ;
- DAY ;
- SUNSET ;
- NIGHT.

La lumière de construction neutre vient conceptuellement du haut-gauche ; le bas-droit est plus ombré. Elle doit rester douce et ne servir qu'à rendre le volume lisible.

Ne pas peindre de longues ombres portées correspondant à une heure précise.

## 10. Calques et masks recommandés

Pour les assets importants, préparer si pertinent :

- `ASSET_BASE.png` ;
- `ASSET_LIGHT_MASK.png` ;
- `ASSET_SHADOW_MASK.png` ;
- `ASSET_EMISSIVE.png` pour les sources lumineuses ;
- `ASSET_OCCLUSION_MASK.png` si nécessaire.

Tous les calques doivent conserver exactement :

- la même résolution ;
- le même cadrage ;
- le même alpha ;
- le même point d'ancrage ;
- la même position de l'objet.

### LIGHT MASK

Grayscale :

- blanc = reçoit fortement la lumière ;
- gris = lumière intermédiaire ;
- noir = très peu ou pas de lumière directe.

Le mask représente une quantité de lumière, pas une copie grayscale de l'illustration.

### SHADOW MASK

Grayscale :

- blanc = ombre structurelle forte ;
- gris = ombre modérée ;
- noir = peu ou pas d'ombre structurelle.

Privilégier les faces opposées à la lumière, les dessous, les creux et les zones internes.

### EMISSIVE

Uniquement pour ce qui produit réellement sa propre lumière :

- flamme ;
- lanterne ;
- braise ;
- cristal / objet magique lumineux.

Le corps de l'objet reste dans la base neutre. L'emissive ne doit jamais englober artificiellement tout l'objet.

## 11. Objets lumineux

Une torche, un brasero ou une lanterne doit être pensé comme :

`OBJECT_BODY + EMISSIVE`

La flamme reste chaude. La structure suit le système temporel. La source lumineuse ne doit pas être assombrie comme le reste du décor lors du passage à la nuit.

## 12. Objets longs et rectangulaires

Bancs, tables, clôtures, jardinières, potagers, kiosques et plateformes doivent suivre exactement les axes du sol canonique.

Une rotation arbitraire de quelques degrés suffit à casser l'intégration : elle est donc interdite dans l'asset source.

## 13. Export

Chaque asset de production :

- un seul asset principal par image ;
- PNG RGBA ;
- fond 100 % transparent ;
- marge transparente raisonnable ;
- aucun checkerboard peint ;
- aucun décor de présentation ;
- aucun personnage ;
- aucun texte ajouté ;
- aucun sol extérieur inutile ;
- aucun élément coupé ;
- aucun pixel parasite ;
- base de contact stable.

## 14. Références et ordre de priorité

Pour la DA grecque existante, consulter notamment :

- `ressources-sources/3.0/GREC/MODELE_grec.png` ;
- `ressources-sources/3.0/GREC/SET_CAMP_GREC.png` ;
- `ressources-sources/3.0/GREC/SET1.png` ;
- les ressources actives réellement utilisées par le camp dans l'application.

Le dossier `ressources-sources/prototype-housing/` est une **référence historique de fonctionnement**, pas une autorité artistique. Un ancien asset n'est pas automatiquement conforme à cette V1.

En cas de conflit de perspective entre une ancienne image et la présente norme, **cette norme est prioritaire**.

## 15. Validation obligatoire d'un nouvel asset

Avant validation, vérifier l'asset dans plusieurs positions conceptuelles du camp :

- à gauche du feu ;
- près de la statue ;
- à côté de la tente ;
- près du kiosque ;
- au premier plan.

Question de validation :

> Donne-t-il l'impression d'avoir été peint en même temps que le reste du camp ?

Si non, corriger dans cet ordre :

1. perspective ;
2. angle ;
3. proportions ;
4. valeurs ;
5. palette ;
6. détail.

## 16. Instruction obligatoire pour toute génération IA

Inclure systématiquement l'instruction suivante :

> Ne déduis pas une nouvelle perspective à partir de l'objet demandé. Recopie la caméra, la projection, les axes de sol et l'orientation des références du camp grec. L'objet s'adapte à la caméra, jamais l'inverse.

Puis préciser :

> Vue pseudo-isométrique quasi orthographique, 3/4 légèrement plongeante, mêmes axes du sol, même orientation, base neutre compatible avec le système DAWN / DAY / SUNSET / NIGHT, un seul asset PNG RGBA sur fond transparent.

## 17. Critère de sortie studio

Un asset n'est considéré terminé que si :

- sa perspective est conforme ;
- son footprint est lisible ;
- son anchor peut être défini sans ambiguïté ;
- son échelle est cohérente ;
- sa DA se fond dans le camp ;
- il reste lisible à petite taille ;
- il accepte le système de lumière/temps sans double coloration ;
- il peut être déplacé sans avoir besoin d'une correction artistique spécifique à chaque emplacement.
