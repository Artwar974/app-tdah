# 12 · Les icônes par type de récompense (8) et par saison (4), deux DA

**Origine** : dessins à commander du 19/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : La bande du Grand Sentier, les cartes, le ruban du camp. Aujourd’hui des icônes des kits.

## Ce qu’il faut livrer

- Fichiers : `commun/athena-icones-figures.js (Figures : à vectoriser)` ; `commun/athena-icones.js (Veillée, au trait : à vectoriser)`
- Taille : Source 512 × 512 px par icône, noir plein sur fond blanc (Figures) ou trait de 24 px avec une touche d’or (Veillée).
- Format : PNG noir sur blanc, puis vectorisation SVG 24 × 24 (rapport 1:1)
- Vue : De face, pictogramme.
- Lumière : Aucune (pictogramme).
- Variantes : 12 icônes × 2 DA = 24 pictogrammes ; à vectoriser (le projet dessine ses icônes en SVG, jamais en image).

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Huit pictogrammes dans un même style, un par type de récompense : bois et or (une bûche et une pièce), charme (une boucle de bronze), objet (un cadeau noué), compagnon (une silhouette d’animal rond), Étincelle dorée (une étincelle à quatre branches), cadre et tenue d’avatar (un cadre rond avec une écharpe), lanterne du Hameau (une lanterne de papier), décor de saison (une pousse en pot). Et quatre pictogrammes de saison : rameau d’olivier, grappe, lanterne, graine qui germe. Figures : silhouettes noires pleines, objets du quotidien, sans ornement. Veillée : au trait fin avec une petite touche dorée.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. Eight pictograms in one style, one per reward type: wood and gold (a log and a coin), charm (a bronze loop), object (a tied gift), companion (a round animal silhouette), golden Spark (a four-point spark), avatar frame and outfit (a round frame with a scarf), Hamlet lantern (a paper lantern), season decoration (a potted shoot). And four season pictograms: olive branch, grape bunch, lantern, sprouting seed. Figures: solid black silhouettes of everyday objects, no ornament. Veillée: thin line with a small golden touch.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `icones-figures.webp`

## Contrôle avant de ranger le fichier

- [ ] Lisible à 20 px
- [ ] Même graisse que les icônes existantes
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
