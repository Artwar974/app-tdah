# 06 · Le coffre du camp : l’inventaire (3 états)

**Origine** : dessins à commander du 14/10, revu le 20/10 · **Priorité** : 1 (démo)

**Où ça sert** : Le camp, au pied de la tente : le coffre est l’inventaire (charmes, objets, décorations, fragments, Étincelles), jamais le bois ni l’or, qui vont droit aux compteurs. Trois états : fermé, entrouvert, plein. Depuis le 20/10 une icône.

## Ce qu’il faut livrer

- Fichiers : `assets/scene/objets/coffre-vide.webp` ; `coffre-moitie.webp` ; `coffre-plein.webp`
- Taille : Source 512 × 512 px ; dans le jeu environ 72 px de haut à l’écran.
- Format : PNG puis WebP avec transparence
- Vue : Trois quarts avant, légèrement plongeant.
- Lumière : Jour, haut gauche.
- Variantes : 3 images.

## Le prompt (français)

```text
Illustration de jeu mobile cosy et bienveillant, Antiquité méditerranéenne légère (un camp au bord de la mer, des oliviers, une montagne au loin), jamais trop grecque : pas de colonnes ni de symboles mythologiques appuyés. Peinture numérique à plat avec des ombres douces et quelques rehauts, contours discrets, palette chaude (ocre doré #e3aa5c, terre cuite #a3452a, sable #f4eee6, brun #211612, bleu mer #3f6aa6, vert olivier #4f6b2f). Vue de trois quarts légèrement plongeante, comme le camp d’Athéna. Lumière douce de fin de matinée venant du haut à gauche. Aucun texte, aucun logo, aucune bordure. Un petit coffre de bois clair cerclé de bronze, couvercle bombé, posé sur le sable au pied d’une tente. État 1 : fermé, simple. État 2 : couvercle entrouvert, on voit un charme de bronze et un parchemin roulé. État 3 : couvercle soulevé par le trop-plein, bûches et pièces qui débordent, le coffre semble gonflé et content. Objet isolé sur un fond blanc uni (#ffffff), sans ombre au sol, pour le détourage.
```

## The prompt (English, souvent plus fidèle avec Nano Banana)

```text
Cozy, kind mobile-game illustration, light Mediterranean antiquity (a seaside camp, olive trees, a mountain in the distance), never too Greek: no columns, no heavy mythological symbols. Flat digital painting with soft shading and a few highlights, discreet outlines, warm palette (golden ochre #e3aa5c, terracotta #a3452a, sand #f4eee6, dark brown #211612, sea blue #3f6aa6, olive green #4f6b2f). Three-quarter view, slightly from above, like the Athena camp. Soft late-morning light from the top left. No text, no logo, no border. A small pale wooden chest with bronze bands and a domed lid, resting on sand at the foot of a tent. State 1: closed, simple. State 2: lid ajar, a bronze charm and a rolled parchment visible. State 3: lid pushed up by the overflow, a lantern and coins spilling out, the chest looking plump and happy. Isolated object on a plain white background (#ffffff), no ground shadow, for cut-out.
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
- `objets-camp.webp`

## Contrôle avant de ranger le fichier

- [ ] Les 3 états se distinguent à 72 px
- [ ] Même base, même angle
- [ ] Aucun texte, aucun logo, aucune signature
- [ ] Fond retiré (transparence) quand le format le demande ; bords nets à 100 %
- [ ] Posé dans le projet au bon chemin, puis vérifié dans le prototype (page, écran) et `python3 -I scripts/verifier-projet.py .`
