# 25 · Le matin : la bannière du résumé (option)

**Origine** : dessins à commander du 20/10 · **Priorité** : 3 (option)

**Où ça sert** : Le haut de la feuille « Hier » (le résumé du matin). Facultatif : la feuille se lit sans.

## Ce qu’il faut livrer

- Fichiers : `assets/doc/banniere-matin.webp`
- Taille : 1170 × 330 px (390 × 110 à l’écran, en 3×), paysage.
- Format : WebP sans transparence
- Vue : Frise de face, zone centrale calme pour le titre.
- Lumière : Lever du jour : ciel doré et rose pâle.
- Variantes : 1 bannière.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une frise horizontale : le camp vu de la mer au lever du jour, ciel doré et rose pâle, la tente et le feu qui fume doucement, la montagne dans une lumière claire, le centre calme pour un titre. Sans personnage, sans texte.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A horizontal banner strip: the camp seen from the sea at sunrise, golden and pale pink sky, the tent and the gently smoking fire, the mountain in clear light, a calm centre for a title. No character, no text.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `matin.webp`
- `camp-jour.webp`

## Contrôle avant de ranger le fichier

- [ ] Contraste AA du titre brun #211612 sur la bannière
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
