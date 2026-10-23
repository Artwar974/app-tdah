# 20 · De nouveaux objets pour le camp (option)

**Origine** : dessins à commander du pack · **Priorité** : 3 (option)

**Où ça sert** : Le calendrier des 30 journées et le Comptoir : jusqu’à 17 objets de plus, dans le style de la planche actuelle.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/objets-2.webp (planche) ou un fichier par objet`
- Taille : Comme la planche actuelle (objets.webp) : chaque objet entre 60 et 140 px de large dans la scène.
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts, légèrement plongeant.
- Lumière : Jour, haut gauche.
- Variantes : Jusqu’à 17 objets, un à la fois.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Des objets de camp dans le style de la planche existante (tente, banc, lavande, amphore, fontaine, olivier, laurier, statue, hache) : un tapis tissé, une jarre à eau, un tonneau, une table basse, un hamac entre deux piquets, un tas de bûches, un séchoir à poissons, un puits, une ruche, un cadran solaire, un bain d’oiseaux, un rocher à mousse, une barque retournée, un panier de pommes, un métier à tisser, un moulin à vent miniature, un totem de pierres. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. Camp objects in the style of the existing sheet (tent, bench, lavender, amphora, fountain, olive tree, laurel, statue, axe): a woven rug, a water jar, a barrel, a low table, a hammock between two posts, a pile of logs, a fish-drying rack, a well, a beehive, a sundial, a bird bath, a mossy rock, an upturned boat, a basket of apples, a loom, a miniature windmill, a stone cairn. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `objets-camp.webp`
- `camp-jour.webp`

## Contrôle avant de ranger le fichier

- [ ] Même échelle que la planche actuelle
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
