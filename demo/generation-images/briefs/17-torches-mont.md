# 17 · Les 4 torches du Mont

**Origine** : dessins à commander du 20/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le chemin du Mont : quatre torches à égale distance, de bas en haut, la dernière avant le temple ; une s’allume par habitude validée, la quatrième fait le Sommet. Aujourd’hui dessinées par le code avec la planche du flambeau.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/torche-mont-eteinte.webp` ; `torche-mont-allumee.webp`
- Taille : 256 × 256 px ; environ 18 px à l’écran (la torche fait 30 px de haut dans la scène 720 × 1280).
- Format : PNG puis WebP avec transparence
- Vue : De face, légèrement plongeante.
- Lumière : Éteinte : bois et corde mats ; allumée : flamme ocre et halo chaud (le moteur ajoute la lueur au sol).
- Variantes : 2 images (éteinte, allumée) ; même torche, même angle.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une torche de bois plantée au bord d’un sentier de montagne, un manche de bois clair ligaturé de corde, deux états : éteinte (mèche sombre, pas de lueur) et allumée (petite flamme ocre et dorée, halo chaud discret). Simple et lisible à très petite taille. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A wooden torch planted at the edge of a mountain trail, a pale wooden handle bound with rope, two states: unlit (dark wick, no glow) and lit (small ochre and golden flame, discreet warm halo). Simple and readable at a very small size. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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
- `camp-nuit.webp`

## Contrôle avant de ranger le fichier

- [ ] Se lit à 18 px, de jour comme de nuit
- [ ] La flamme ne dépasse pas le tiers de la hauteur
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
