# 03 · La Forge (4 niveaux)

**Origine** : dessins à commander du 14/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le camp (en bas à gauche) et la feuille « Le camp ». Dessinée par le code aujourd’hui.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/bat-forge-1.webp … bat-forge-4.webp`
- Taille : Source 1024 × 1024 px ; dans le jeu : 78 px de large dans la scène (environ 51 px à l’écran).
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts, légèrement plongeant.
- Lumière : Jour, haut gauche ; une petite flamme chaude dans le foyer (le jeu ajoute la lueur).
- Variantes : 4 images, un niveau chacune.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une petite forge de camp : une enclume sur une souche, un foyer de pierres avec une petite flamme, un marteau posé. Niveau 1 : enclume et foyer. Niveau 2 : un soufflet de cuir et un seau. Niveau 3 : un auvent de bois et des outils accrochés. Niveau 4 : un atelier de pierre claire avec une cheminée basse qui fume un peu, une roue à aiguiser. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small camp forge: an anvil on a stump, a stone hearth with a small flame, a resting hammer. Level 1: anvil and hearth. Level 2: a leather bellows and a bucket. Level 3: a wooden awning with hanging tools. Level 4: a pale stone workshop with a low, gently smoking chimney and a grinding wheel. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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

- [ ] La flamme reste petite (le feu du camp est le seul grand feu)
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
