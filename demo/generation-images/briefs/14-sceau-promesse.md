# 14 · Le sceau de la promesse

**Origine** : dessins à commander du 19/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : L’écran de la promesse du camp (onboarding) : le sceau qu’on garde sous le doigt 1,5 s. Aujourd’hui dessiné par le code.

## Ce qu’il faut livrer

- Fichiers : `assets/doc/sceau-promesse.webp`
- Taille : Source 512 × 512 px ; 128 px à l’écran.
- Format : PNG puis WebP avec transparence
- Vue : De face, légèrement plongeant.
- Lumière : Chaude, du haut à gauche, reflet discret sur la cire.
- Variantes : 1 image (+ une version « posée », un peu aplatie, pour l’état « promesse gardée », facultative).

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un sceau de cire terre cuite, rond, bord irrégulier, avec en relief un rameau d’olivier et une petite flamme ; une touche de doré sur les reliefs. Chaleureux, pas solennel. Pas de lettre. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A round terracotta wax seal with an irregular edge, an olive branch and a small flame in relief; a touch of gold on the raised parts. Warm, not solemn. No letters. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `promesse.webp`

## Contrôle avant de ranger le fichier

- [ ] Lisible sur le papier #fffaf2 et sur le fond assombri
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
