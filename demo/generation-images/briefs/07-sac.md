# 07 · Le sac (icône et illustration)

**Origine** : dessins à commander du 14/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : Le haut du camp (icône 24 et 44 px) et la feuille du sac.

## Ce qu’il faut livrer

- Fichiers : `assets/kits/sac-icone.svg (à vectoriser)` ; `assets/scene/objets/sac-illustration.webp`
- Taille : Icône : 512 × 512 px source (silhouette simple) ; illustration : 1024 × 768 px.
- Format : Icône : noir sur transparent (à vectoriser) ; illustration : WebP
- Vue : Illustration de face, posée.
- Lumière : Jour.
- Variantes : 2 images (icône, illustration).

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un sac de voyage en toile de lin et cuir brun, bandoulière, une fermeture par bouton de bois, un peu usé et aimé ; dedans, à peine visibles, un charme de bronze, un fragment de parchemin, une lanterne. Icône : la même silhouette simplifiée, noire, pleine, sans détail intérieur. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A travel bag in linen cloth and brown leather, a shoulder strap, a wooden toggle closure, a little worn and loved; inside, barely visible, a bronze charm, a parchment fragment, a lantern. Icon: the same silhouette simplified, solid black, no inner detail. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `objets-camp.webp`

## Contrôle avant de ranger le fichier

- [ ] L’icône se lit à 24 px
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
