# 11 · Les bannières des 4 saisons

**Origine** : dessins à commander du 19/10 · **Priorité** : 1 (démo)

**Où ça sert** : L’en-tête de l’écran du Grand Sentier et la carte de fin de saison. Aujourd’hui dessinées par le code (couleur + motif).

## Ce qu’il faut livrer

- Fichiers : `assets/doc/banniere-oliviers.webp` ; `banniere-vendanges.webp` ; `banniere-lanternes.webp` ; `banniere-semailles.webp`
- Taille : 1170 × 330 px (390 × 110 à l’écran, en 3×), paysage.
- Format : WebP sans transparence (qualité 85)
- Vue : Frise décorative vue de côté, zone centrale calme pour le texte que l’app pose par-dessus.
- Lumière : Selon la saison : oliviers lumière d’été argentée ; vendanges fin d’après-midi dorée ; lanternes soirée chaude ; semailles matin frais.
- Variantes : 4 bannières ; deux DA : les mêmes images servent (la couleur suffit).

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une frise horizontale pour une saison : fond uni de la couleur de la saison, un motif discret aux bords (gauche et droite) et le centre vide pour le texte. Les oliviers (#4f6b2f) : feuilles d’olivier argentées, petites olives ; Les vendanges (#7a2f4a) : grappes, feuilles de vigne, amphores ; Les lanternes (#8a4512) : lanternes de papier, lueurs chaudes ; Les semailles (#2f5f6b) : graines, jeunes pousses, soleil doux. Pas de texte.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A horizontal banner strip for a season: solid background in the season colour, a discreet motif at the left and right edges and an empty centre for text. Les oliviers (#4f6b2f): feuilles d’olivier argentées, petites olives; Les vendanges (#7a2f4a): grappes, feuilles de vigne, amphores; Les lanternes (#8a4512): lanternes de papier, lueurs chaudes; Les semailles (#2f5f6b): graines, jeunes pousses, soleil doux. No text.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `sentier.webp`
- `sentier-saison2.webp`

## Contrôle avant de ranger le fichier

- [ ] Contraste AA du texte lin #fff8ed sur la bannière (ratio ≥ 4,5)
- [ ] Le centre reste calme
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
