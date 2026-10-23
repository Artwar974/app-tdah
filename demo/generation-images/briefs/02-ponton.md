# 02 · Le Ponton : le tableau des départs (4 niveaux)

**Origine** : dessins à commander du 17/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le bout du ponton, au bord de la mer : le tableau des départs et un détail par niveau. Dessiné par le code aujourd’hui.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/bat-ponton-1.webp … bat-ponton-4.webp`
- Taille : Source 1024 × 1024 px ; dans le jeu : 50 px de large dans la scène, soit environ 33 px à l’écran.
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts, légèrement plongeant ; l’objet tient debout sur des planches.
- Lumière : Jour, haut gauche.
- Variantes : 4 images, un niveau chacune.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un petit tableau de bois sur deux piquets, planté au bout d’un ponton, avec une corde et une cloche de bateau. Niveau 1 : le tableau seul. Niveau 2 : un piquet de plus et un fanion bleu. Niveau 3 : une lanterne accrochée et un tonneau. Niveau 4 : un petit abri de planches avec un toit de tuiles claires, deux fanions, une lanterne. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small wooden notice board on two posts standing at the end of a pier, with a rope and a ship bell. Level 1: the board alone. Level 2: one more post and a blue pennant. Level 3: a hanging lantern and a barrel. Level 4: a small plank shelter with a pale tile roof, two pennants, a lantern. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `camp-jour.webp`
- `objets-camp.webp`

## Contrôle avant de ranger le fichier

- [ ] Lisible à 33 px : formes simples, contrastées
- [ ] Pas de texte sur le tableau
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
