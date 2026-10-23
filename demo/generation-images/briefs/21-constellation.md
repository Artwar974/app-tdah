# 21 · La constellation (option, bonus C)

**Origine** : dessins à commander du pack · **Priorité** : 3 (option)

**Où ça sert** : Bonus C à définir : 12 étoiles forment une figure, en 12 étapes, lisible sur les trois ciels.

## Ce qu’il faut livrer

- Fichiers : `assets/doc/constellation-<n>.webp (1 à 12)`
- Taille : Source 1024 × 1024 px, fond transparent.
- Format : PNG puis WebP avec transparence
- Vue : Ciel vu de face.
- Lumière : Nuit.
- Variantes : 12 images.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une figure de douze étoiles reliées par des traits fins lumineux, une chouette stylisée, en douze étapes : à chaque étape une étoile de plus s’allume, sur fond transparent, lisible sur un ciel de jour comme de nuit.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A figure of twelve stars joined by thin glowing lines, a stylised owl, in twelve steps: at each step one more star lights up, on a transparent background, readable on a day or night sky.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `camp-nuit.webp`

## Contrôle avant de ranger le fichier

- [ ] Lisible sur les trois ciels
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
