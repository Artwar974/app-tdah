# 23 · Les cinq voies du parcours (vignettes)

**Origine** : dessins à commander du 20/10 · **Priorité** : 2 (après la démo)

**Où ça sert** : Le Ponton, quand le compagnon attend notre choix : trois cartes « voie », chacune avec son indice. Une vignette ronde par type de voie. Aujourd’hui une icône du jeu par type.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/voie-clairiere.webp` ; `voie-cabane.webp` ; `voie-atelier.webp` ; `voie-pierre.webp` ; `voie-traces.webp`
- Taille : Source 512 × 512 px, rondes ; affichées à 44 px dans la carte.
- Format : PNG puis WebP avec transparence (vignette ronde)
- Vue : Médaillon rond, un motif central simple, lisible à 44 px.
- Lumière : Jour, haut gauche.
- Variantes : 5 vignettes.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Cinq vignettes rondes dans le même style, un motif simple chacune : une clairière avec une souche et une hachette (du bois et quelques pièces) ; une cabane de planches à moitié prise par le lierre (un objet) ; un établi avec un charme de bronze posé (un charme) ; une pierre dressée gravée d’une spirale (un fragment de légende) ; des empreintes dans le sable vers des buissons (une créature). Sans personnage, sans texte. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. Five round vignettes in one style, one simple motif each: a clearing with a stump and a hatchet (wood and a few coins); a plank cabin half taken by ivy (an object); a workbench with a bronze charm on it (a charm); a standing stone carved with a spiral (a legend fragment); footprints in the sand leading to bushes (a creature). No character, no text. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
```

## À éviter (prompt négatif, à ajouter en fin de prompt : « Éviter : … »)

```text
texte, lettres, chiffres, logo, filigrane, signature, bordure, cadre, photo réaliste, rendu 3D brillant, style anime, colonnes grecques, dieux, armes, visage humain réaliste, flou, bruit, fond chargé, ombre portée dure, perspective frontale
```

```text
text, letters, numbers, logo, watermark, signature, border, frame, photorealistic, glossy 3D render, anime style, Greek columns, gods, weapons, realistic human face, blur, noise, busy background, hard cast shadow, front-on perspective
```

## Références à joindre à la génération (dossier `references/`)

- `ponton-parcours.webp`
- `camp-jour.webp`

## Contrôle avant de ranger le fichier

- [ ] Les cinq se distinguent à 44 px
- [ ] Aucune ne ressemble à une icône du haut du camp
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
