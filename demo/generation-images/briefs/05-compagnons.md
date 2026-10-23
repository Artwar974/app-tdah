# 05 · 2 compagnons (un commun, un rare), en marionnette

**Origine** : dessins à commander du 14/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le Ponton (ils partent en parcours), le Grand Sentier (palier 3), et la créature qui suit parfois un compagnon au bout d’un parcours (une chance sur cinq). En attendant, ce sont des minotaures teintés. Ni chouette, ni avatar. Trois créatures de plus au n° 24.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/compagnon-commun/<vue>/<morceau>.png` ; `assets/scene/compagnon-rare/<vue>/<morceau>.png`
- Taille : Comme le minotaure : chaque vue dans un cadre de 262 × 364 px, le personnage 97 px de haut à l’échelle 1 (voir minotaure.json : hauteur 97, hauteurCadre 355).
- Format : PNG avec transparence, un fichier par morceau
- Vue : 6 vues : avant (trois quarts vers nous), face, profil, dos, arrière (trois quarts vers le fond), assis. Pour chaque vue debout : torse, brasG, brasD, jambeG, jambeD, pagne, queue ; 3 têtes : calme, content, dort (yeux fermés).
- Lumière : Lumière neutre, légèrement du haut à gauche ; pas d’ombre au sol (le jeu la dessine).
- Variantes : 2 personnages × 6 vues ; les morceaux se nomment comme ceux du minotaure (minotaure.json) ; les pivots se règlent ensuite dans atelier.html.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Étape 1 (planche) : un petit personnage de camp, rond et sympathique, un animal debout (un commun : un blaireau rondouillard avec un pagne de lin ; un rare : un cerf élancé avec une cape courte), vu de trois quarts, de face, de profil, de dos, de trois quarts arrière et assis, bras le long du corps, sur une même planche, même échelle, fond blanc uni. Étape 2 (découpe) : la même pose, mais les parties séparées et légèrement écartées sur fond blanc : torse, bras gauche, bras droit, jambe gauche, jambe droite, pagne, queue, et trois têtes (calme, content, yeux fermés), chaque partie complète derrière les chevauchements.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. Step 1 (sheet): a small, round, friendly camp character, a standing animal (common: a chubby badger with a linen loincloth; rare: a slender deer with a short cape), seen in three-quarter front, front, profile, back, three-quarter back and seated, arms at the sides, on one sheet at the same scale, plain white background. Step 2 (cut-out): the same pose with the parts separated and slightly spread on white: torso, left arm, right arm, left leg, right leg, loincloth, tail, and three heads (calm, happy, eyes closed), each part complete behind the overlaps.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `minotaure-face.webp`
- `minotaure-morceaux.webp`
- `minotaure-json.txt`

## Contrôle avant de ranger le fichier

- [ ] Même hauteur que le minotaure (97 px à l’échelle 1)
- [ ] Les morceaux se recouvrent assez pour pivoter sans trou
- [ ] Lisible à 44 px
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
