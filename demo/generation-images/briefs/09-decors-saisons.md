# 09 · Les décors de saison (palier 10) des 4 saisons

**Origine** : dessins à commander du 19/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le Grand Sentier (palier 10 : « le décor de la saison »), posé au camp quand il est gagné.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/decor-oliviers.webp` ; `decor-vendanges.webp` ; `decor-lanternes.webp` ; `decor-semailles.webp`
- Taille : Source 1024 × 1024 px ; dans le jeu environ 120 px de large dans la scène.
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts, légèrement plongeant, posé au sol.
- Lumière : Jour, haut gauche.
- Variantes : 4 images, une par saison ; couleurs d’accent : Les oliviers #4f6b2f, Les vendanges #7a2f4a, Les lanternes #8a4512, Les semailles #2f5f6b.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un petit décor de camp pour chaque saison, à poser au sol. Les oliviers : un jeune olivier en pot de terre cuite avec une guirlande de feuilles. Les vendanges : une treille basse avec des grappes et deux amphores. Les lanternes : un mât de bois avec trois lanternes de papier chaud. Les semailles : un carré de jeunes pousses bordé de pierres claires, un arrosoir de cuivre. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small camp decoration for each season, to be placed on the ground. Olives: a young olive tree in a terracotta pot with a garland of leaves. Harvest: a low trellis with grapes and two amphorae. Lanterns: a wooden mast with three warm paper lanterns. Sowing: a square of young shoots edged with pale stones, a copper watering can. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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
- `sentier.webp`

## Contrôle avant de ranger le fichier

- [ ] Même échelle que les objets du camp (banc, lavande)
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
