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

## Etude prioritaire — Faire plus petit V3 — 2.00 s

Ouvrir :

`/motion-lab/scene-faire-plus-petit-v3.html`

Preview web :

`https://athena-faire-plus-petit-v3.vercel.app`

But du test : verifier une approche editoriale plus proche du niveau vise pour Athena, en reduisant fortement la complexite de mouvement.

La scene teste :

- un vrai SVG Open Peeps (`peep-57.svg`) conserve intact comme illustration secondaire ;
- un vrai SVG Highlights (`arrow-02.svg`) utilise comme ponctuation ;
- une seule transformation visuelle dominante : plusieurs taches deviennent un premier geste clair ;
- GSAP Flip pour interpoler proprement entre deux hierarchies spatiales ;
- CustomEase pour un depart rapide et un atterrissage long, sans bounce ni elasticite ;
- un micro-mouvement global du personnage, sans marionnette ni rig improvise ;
- une apparition du texte par fenetre masquee plutot que par simple fondu ;
- une duree de 2.00 secondes avec hold final ;
- un etat mouvement reduit complet.

Regle de cette etude : ne pas utiliser un effet parce qu'un plugin le permet. Le mouvement doit d'abord clarifier la hierarchie et le sens.

## Etudes precedentes — conservees pour comparaison

### V2 — Demeler

`/motion-lab/scene-demeler-v2.html`

Etude MorphSVG. Conservee comme contre-exemple : morph trop direct, personnage dessine comme marionnette et hierarchie insuffisamment controlee.

### V1 — Le premier pas

`/motion-lab/scene-first-step.html`

Premiere scene de 2.00 secondes utilisant Open Doodles + Highlights. Conservee comme test de pipeline, pas comme cible visuelle.

### Demo initiale

`/motion-lab/`

Premiere validation technique du Motion Lab.

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
3. Privilegier une illustration source forte et intacte plutot qu'un rig maison mediocre.
4. Deux animations majeures maximum ; le reste doit etre du micro-mouvement.
5. Les animations doivent expliquer, pas decorer.
6. Toujours fournir une version `prefers-reduced-motion`.
7. Les textes doivent rester lisibles sans dependre de la couleur ou du mouvement.
8. Aucun test du lab ne doit modifier `index.html`, les sauvegardes ou l'economie du jeu.

## Structure utile

- `index.html` : premiere scene de test.
- `scene-first-step.*` : V1 / validation pipeline.
- `scene-demeler-v2.*` : V2 / etude morph conservee pour comparaison.
- `scene-faire-plus-petit-v3.*` : etude editoriale prioritaire actuelle.
- `styles.css` : presentation du lab et variables visuelles communes.
- `motion.js` : petite API motion reutilisable.
- `assets/` : sources graphiques gratuites et futurs assets Athena.
- `vendor/gsap/` : GSAP et plugins epingles localement.
- `scripts/setup-assets.ps1` : telechargement reproductible des sources.
- `THIRD_PARTY.md` : provenance et licences.

## Definition de "convaincant"

Une capsule de test n'est validee que si :

- l'idee se comprend globalement sans texte ;
- la hierarchie est evidente des le premier regard ;
- le texte tient en une phrase courte ;
- le mouvement guide le regard sans attirer l'attention sur sa technique ;
- aucun effet ne semble gratuit ;
- le rendu ne semble pas etre un collage de bibliotheques ;
- le mode mouvement reduit reste comprehensible ;
- la scene reste fluide sur un telephone courant ;
- l'animation peut etre reutilisee ou composee avec d'autres capsules.
