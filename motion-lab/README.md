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
- Plugins disponibles : MorphSVG, DrawSVG, MotionPath, Flip, CustomEase.
- Sources graphiques gratuites retenues : Open Peeps, Open Doodles, Highlights.

Aucun framework ni bundler supplementaire n'est impose. Le lab reste en HTML/CSS/JavaScript afin de rester compatible avec l'architecture actuelle du prototype.

## Test 02 — Le premier pas — 2.00 s

Ouvrir :

`/motion-lab/scene-first-step.html`

Cette scene dure exactement 2.00 secondes et teste :

- personnage Open Doodles reel ;
- geste graphique Highlights reel ;
- formes Athena ;
- DrawSVG ;
- anticipation / recoil ;
- apparition en stagger ;
- focus avec overshoot ;
- mouvement final du personnage ;
- version mouvement reduit ;
- barre de progression et compteur temporel.

La scene utilise les fichiers GSAP vendorises dans `motion-lab/vendor/gsap/` et les SVG deja presents dans `motion-lab/assets/sources/`. Elle ne depend donc pas d'un CDN pour fonctionner.

## Demo precedente

`/motion-lab/`

La premiere demo reste intacte afin de pouvoir comparer les deux approches.

## Assets et dependances

Les assets de depart et GSAP sont deja presents sur la branche `athena-motion-lab-v0`.

Le script PowerShell reste disponible comme procedure reproductible si les fichiers doivent etre recuperes a nouveau :

```powershell
./motion-lab/scripts/setup-assets.ps1
```

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

- `index.html` : premiere scene de test.
- `scene-first-step.html` : scene 2.00 s "Le premier pas".
- `scene-first-step.css` : presentation propre a cette scene.
- `scene-first-step.js` : timeline GSAP de cette scene.
- `styles.css` : presentation du lab et variables visuelles communes.
- `motion.js` : petite API motion reutilisable.
- `demo.js` : premiere capsule test.
- `assets/` : assets externes et futurs assets Athena.
- `vendor/gsap/` : GSAP et plugins epingles localement.
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
