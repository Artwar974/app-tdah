# Athena Motion Lab v0

Laboratoire isole pour tester la direction artistique et le motion design des capsules Athena sans toucher au prototype principal `index.html`.

## Objectif

Valider rapidement un pipeline professionnel et reversible :

Figma -> SVG editables -> GSAP -> test navigateur -> validation -> integration progressive dans l'application.

Le lab n'ecrit aucune donnee utilisateur et n'utilise pas le `localStorage` de Journal de Quetes.

## Stack v0

- Figma : composition, variantes, storyboard, validation de mouvement.
- SVG : source graphique editable et animable.
- GSAP 3.15.0 : moteur de motion final dans le navigateur.
- Plugins charges pour les tests : MorphSVG, DrawSVG, MotionPath, Flip, CustomEase.
- Sources graphiques gratuites retenues : Open Peeps, Open Doodles, Highlights.

Aucun framework, bundler ou serveur supplementaire n'est impose. Le lab reste en HTML/CSS/JavaScript afin de rester compatible avec l'architecture actuelle du prototype.

## Lancer le lab

Utiliser le serveur local deja present dans le depot, puis ouvrir :

`/motion-lab/`

Le lab fonctionne aussi en ouvrant `motion-lab/index.html` dans un navigateur moderne, mais un serveur local est preferable pour les futurs chargements SVG.

## Telecharger les dependances et assets de test

Depuis PowerShell :

```powershell
./motion-lab/scripts/setup-assets.ps1
```

Le script telecharge une selection volontairement petite de GSAP et des trois bibliotheques sources afin de commencer les tests sans aspirer des centaines d'assets inutiles.

Les licences et sources sont documentees dans `THIRD_PARTY.md` et `assets/sources-manifest.json`.

## Regles de production Athena

1. Une metaphore dominante par ecran.
2. Les bibliotheques externes sont une matiere premiere, jamais une DA finale collee telle quelle.
3. Les assets reutilises passent progressivement par la couche Athena : proportions, trait, palette, grain, noms et preparation motion.
4. Les animations doivent expliquer, pas decorer.
5. Toujours fournir une version `prefers-reduced-motion`.
6. Les textes doivent rester lisibles sans dependre de la couleur ou du mouvement.
7. Aucun test du lab ne doit modifier `index.html`, les sauvegardes ou l'economie du jeu.

## Structure

- `index.html` : scene de test et controles.
- `styles.css` : presentation du lab et variables visuelles.
- `motion.js` : petite API motion reutilisable.
- `demo.js` : premiere capsule test.
- `assets/` : assets externes et futurs assets Athena.
- `scripts/setup-assets.ps1` : telechargement reproductible des sources.
- `THIRD_PARTY.md` : provenance et licences.

## Definition de "convaincant"

Une capsule de test n'est validee que si :

- l'idee se comprend globalement sans texte ;
- le texte tient en une phrase courte ;
- le mouvement guide le regard ;
- le rendu ne semble pas etre un collage de bibliotheques ;
- le mode mouvement reduit reste comprehensible ;
- la scene reste fluide sur un telephone courant ;
- l'animation peut etre reutilisee ou composee avec d'autres capsules.
