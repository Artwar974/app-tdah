# 08 · La chouette, le guide (4 poses)

**Origine** : dessins à commander du pack · **Priorité** : 1 (démo)

**Où ça sert** : La voix du camp (bulle), le retour (« Te revoilà ! »), les cartes de nouveauté. Aujourd’hui un pictogramme.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/chouette-bonjour.webp` ; `chouette-bravo.webp` ; `chouette-nuit.webp` ; `chouette-revoila.webp`
- Taille : Source 768 × 768 px ; dans le jeu 96 et 192 px, lisible à 44 px.
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts face, légèrement plongeant.
- Lumière : Jour ; la pose « nuit » au coin du feu avec une lueur chaude.
- Variantes : 4 images.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Une petite chouette ronde et douce, plumage sable et brun, grands yeux calmes, un foulard ocre. Pose 1 bonjour : une aile levée. Pose 2 bravo : les deux ailes ouvertes, yeux fermés de joie. Pose 3 la nuit : posée près d’un petit feu, yeux mi-clos. Pose 4 te revoilà : penchée en avant, accueillante, une aile tendue. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small, round, gentle owl, sand and brown plumage, big calm eyes, an ochre scarf. Pose 1 hello: one wing raised. Pose 2 bravo: both wings open, eyes closed with joy. Pose 3 night: perched by a small fire, eyes half closed. Pose 4 welcome back: leaning forward, welcoming, one wing extended. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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

- [ ] Lisible à 44 px
- [ ] Même chouette dans les 4 poses
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
