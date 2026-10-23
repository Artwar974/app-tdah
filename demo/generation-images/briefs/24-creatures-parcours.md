# 24 · Trois créatures de plus pour les parcours

**Origine** : dessins à commander du 20/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : Au bout d’un parcours, une créature suit parfois le compagnon (une chance sur cinq) et devient un compagnon : il en faut plus que les deux du n° 5. En attendant, des minotaures teintés.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/creature-herisson/<vue>/<morceau>.png` ; `assets/scene/creature-lezard/<vue>/<morceau>.png` ; `assets/scene/creature-tourterelle/<vue>/<morceau>.png`
- Taille : Comme le minotaure et les compagnons : chaque vue dans un cadre de 262 × 364 px, le personnage 97 px de haut à l’échelle 1 (minotaure.json).
- Format : PNG avec transparence, un fichier par morceau
- Vue : 6 vues : avant, face, profil, dos, arrière, assis ; les morceaux séparés (torse, brasG, brasD, jambeG, jambeD, pagne ou l’équivalent, queue) ; 3 têtes : calme, content, dort.
- Lumière : Lumière neutre, légèrement du haut à gauche ; pas d’ombre au sol (le jeu la dessine).
- Variantes : 3 personnages × 6 vues ; les morceaux se nomment comme ceux du minotaure ; les pivots se règlent dans atelier.html.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Trois petites créatures rondes et amicales, animaux debout à l’échelle du minotaure : un hérisson avec une sacoche de lin ; un lézard vert sauge avec un foulard ocre ; une tourterelle grise avec un petit panier. Silhouettes simples, lisibles à 60 px, couleurs qui se distinguent du minotaure brun et des deux compagnons. Feuille de personnage : les vues côte à côte, puis les morceaux séparés. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. Three small, round, friendly creatures, standing animals at the minotaur’s scale: a hedgehog with a linen satchel; a sage-green lizard with an ochre scarf; a grey turtledove with a small basket. Simple silhouettes readable at 60 px, colours distinct from the brown minotaur and the two companions. Character sheet: the views side by side, then the separate parts. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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

- [ ] Les trois se distinguent à 60 px
- [ ] Mêmes noms de morceaux que minotaure.json
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
