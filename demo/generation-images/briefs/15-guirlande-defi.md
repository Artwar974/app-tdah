# 15 · La guirlande du défi du Hameau

**Origine** : dessins à commander du 19/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : La feuille du défi (la guirlande qui se remplit) et le camp (autour du Kiosque, dessinée par le code aujourd’hui).

## Ce qu’il faut livrer

- Fichiers : `assets/doc/guirlande-fond.webp` ; `assets/scene/objets/lampion-allume.webp` ; `lampion-eteint.webp`
- Taille : Guirlande de la feuille : 1170 × 240 px ; lampions : 128 × 128 px (voir le Kiosque).
- Format : WebP
- Vue : De face, un fil tendu entre deux piquets, 12 à 24 lampions.
- Lumière : Soirée chaude.
- Variantes : 1 fond + les 2 lampions (l’app pose les lampions allumés / éteints par le code).

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une guirlande de lampions de papier tendue entre deux piquets de bois, vue de face, sur un ciel de soirée ; la moitié des lampions allumés (lueur ocre), l’autre moitié éteints (papier mat). Sans personnage, sans texte.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A string of paper lanterns stretched between two wooden posts, seen from the front, against an evening sky; half of the lanterns lit (ochre glow), the other half unlit (matte paper). No character, no text.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `defi.webp`
- `camp-nuit.webp`

## Contrôle avant de ranger le fichier

- [ ] Allumé et éteint se distinguent sans couleur (forme ou lueur)
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
