# 01 · Le Comptoir (4 niveaux)

**Origine** : dessins à commander du 14/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le camp (bâtiment à sa place, en bas à droite) et la feuille « Le camp ». Aujourd’hui dessiné par le code.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/bat-comptoir-1.webp` ; `bat-comptoir-2.webp` ; `bat-comptoir-3.webp` ; `bat-comptoir-4.webp`
- Taille : Source 1024 × 1024 px (l’objet occupe 80 % de la largeur) ; dans le jeu : 98 px de large dans la scène 720 × 1280, soit environ 65 px à l’écran.
- Format : PNG puis WebP avec transparence (qualité 90)
- Vue : Trois quarts avant gauche, légèrement plongeant (30°), le même angle que la tente du camp.
- Lumière : Jour, du haut à gauche ; une version nuit n’est pas nécessaire (le jeu teinte).
- Variantes : 4 images (un niveau chacune), même angle, même échelle : le niveau 4 ne doit pas dépasser 1,3 fois la largeur du niveau 1.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un petit comptoir de marché en bois et toile, étal de fruits, amphores et paniers, un auvent rayé ocre et blanc cassé. Niveau 1 : une simple table avec un panier. Niveau 2 : la table et un auvent. Niveau 3 : un auvent plus grand, des étagères, une lanterne. Niveau 4 : un vrai petit comptoir en pierre claire et bois, enseigne de bois sans texte, deux lanternes, des amphores. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small wooden market stall with cloth, a fruit display, amphorae and baskets, an ochre and off-white striped awning. Level 1: a simple table with a basket. Level 2: the table with an awning. Level 3: a larger awning, shelves, a lantern. Level 4: a real little counter in pale stone and wood, a wooden sign without text, two lanterns, amphorae. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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
- `tente4.webp`
- `objets-camp.webp`

## Contrôle avant de ranger le fichier

- [ ] Les 4 niveaux se lisent comme une progression
- [ ] Rien n’écrit (pas d’enseigne lisible)
- [ ] Fond retiré proprement, bords nets
- [ ] Posé dans le camp : ne cache ni le feu ni la tente
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
