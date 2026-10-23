# 22 · Les cosmétiques de l’avatar (un cadre, une tenue)

**Origine** : dessins à commander du 19/10 soir · **Priorité** : 2 (après la démo)

**Où ça sert** : L’avatar (Hameau, Carnet) : un cadre et une tenue gagnés sur le Grand Sentier (palier 9). Aujourd’hui l’icône « habits ».

## Ce qu’il faut livrer

- Fichiers : `assets/avatars/cadre-sentier.webp` ; `assets/avatars/tenue-sentier.webp`
- Taille : Source 1024 × 1024 px ; dans le jeu : posés sur un avatar rond de 56 px (Hameau) à 88 px (Carnet).
- Format : PNG puis WebP avec transparence (qualité 90)
- Vue : De face.
- Lumière : Neutre, douce.
- Variantes : 2 images (un cadre, une tenue) ; les deux DA partagent les illustrations.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un anneau décoratif fin d’olivier et d’or vu de face, centre vide ; puis un foulard vert sauge et ocre noué sur le côté, vu de face. Couleurs douces, aplats, contours légers. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A thin decorative ring of olive leaves and gold seen from the front, empty centre; then a sage-green and ochre scarf knotted on one side, front view. Soft colours, flat shapes, light outlines. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `hameau-doc.webp`
- `icones-figures.webp`

## Contrôle avant de ranger le fichier

- [ ] Le cadre reste lisible autour d’un avatar de 56 px
- [ ] Ni visage ni personnage
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
