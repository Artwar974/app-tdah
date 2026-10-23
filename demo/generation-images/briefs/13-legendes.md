# 13 · Les 12 vignettes des légendes

**Origine** : dessins à commander du 19/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : Le Carnet des légendes (une vignette par légende, 5 fragments chacune).

## Ce qu’il faut livrer

- Fichiers : `assets/doc/legende-<n>.webp (1 à 12)`
- Taille : Source 768 × 768 px ; dans le jeu 64 et 120 px.
- Format : WebP avec ou sans transparence (vignette ronde)
- Vue : Vignette ronde, un motif central simple.
- Lumière : Lumière chaude de veillée.
- Variantes : 12 images.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Douze vignettes rondes, comme des médaillons peints, un motif simple chacune, dans le même style : La source, Le premier feu, La chouette, Le Mont, Les bâtisseurs, Les compagnons, La Forge, Le Comptoir, Les étoiles, Le Hameau, Les saisons, Le Carnet. Par exemple : une source claire entre deux pierres ; trois pierres et une braise ; une chouette ; une montagne à quatre marches avec un chemin lumineux ; une poutre marquée d’un signe ; deux petits sacs ; une enclume et une boucle ; une lanterne bleue ; une étoile filante ; des lanternes reliées par un fil ; quatre feuilles de saisons ; un carnet ouvert. Pas de texte.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. Twelve round vignettes, like painted medallions, one simple motif each, in the same style: La source, Le premier feu, La chouette, Le Mont, Les bâtisseurs, Les compagnons, La Forge, Le Comptoir, Les étoiles, Le Hameau, Les saisons, Le Carnet. For example: a clear spring between two stones; three stones and an ember; an owl; a four-step mountain with a glowing path; a beam marked with a sign; two small bags; an anvil and a loop; a blue lantern; a shooting star; lanterns linked by a string; four season leaves; an open notebook. No text.
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

- [ ] Se distinguent à 64 px
- [ ] Aucune ne ressemble à une icône existante du haut du camp
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
