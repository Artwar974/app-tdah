# 04 · Le Kiosque du Hameau (4 niveaux) et ses lanternes

**Origine** : dessins à commander du 17/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le camp (à droite, sur la terrasse) : le kiosque du Hameau avec les lanternes communes de la guirlande autour. Le kiosque existe en image ; il manque les niveaux et la guirlande.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/bat-kiosque-1.webp … bat-kiosque-4.webp` ; `assets/scene/objets/lampion-allume.webp` ; `lampion-eteint.webp`
- Taille : Kiosque : source 1024 × 1024 px, 141 px de large dans la scène (environ 93 px à l’écran). Lampions : 128 × 128 px source, environ 14 px à l’écran.
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts, légèrement plongeant ; le kiosque actuel du camp est la référence d’angle et de style.
- Lumière : Jour, haut gauche.
- Variantes : 4 niveaux + 2 lampions.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un petit kiosque rond à colonnettes de bois clair et toit bleu, des coussins, une table basse avec une théière et des fruits ; autour, des lampions de papier ocre suspendus à un fil. Niveau 1 : une simple pergola de bois avec deux coussins. Niveau 2 : le toit de toile bleue et une guirlande de lampions. Niveau 3 : le toit en tuiles bleues, des jardinières. Niveau 4 : le kiosque complet avec une treille fleurie et deux bancs. En plus, deux lampions seuls : un allumé (lueur chaude) et un éteint. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small round kiosk with pale wooden posts and a blue roof, cushions, a low table with a teapot and fruit; around it, ochre paper lanterns hanging on a string. Level 1: a simple wooden pergola with two cushions. Level 2: the blue cloth roof and a string of lanterns. Level 3: the blue tile roof, planters. Level 4: the full kiosk with a flowering trellis and two benches. Also two lanterns alone: one lit (warm glow) and one unlit. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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
- `camp-nuit.webp`
- `hameau-doc.webp`

## Contrôle avant de ranger le fichier

- [ ] Le niveau 4 ressemble au kiosque actuel du camp
- [ ] Le lampion se lit à 14 px (forme ronde, lueur simple)
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
