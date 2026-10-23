# Générer les dessins d’Athéna avec Nano Banana

Ce dossier contient tout ce qu’il faut pour générer les dessins à commander du projet avec Nano Banana (le modèle d’image de Gemini) ou un outil équivalent : un brief par dessin, le style commun, les références du projet à joindre, les fichiers attendus et le contrôle avant de ranger.

## Comment faire

1. Lis `01-STYLE-ATHENA.md` une fois : c’est le style commun à tous les dessins (ce que le projet appelle « Antiquité légère, pas trop grecque »).
2. Ouvre un brief dans `briefs/` (dans l’ordre des priorités : les « 1 » servent à la démo). Chaque brief donne le prompt en français et en anglais, les variantes, les tailles, les fichiers à livrer.
3. Dans Nano Banana, joins les images de `references/` citées par le brief (le camp le jour, la planche des objets…) puis colle le prompt. Les prompts en anglais sont souvent mieux suivis ; garde le français si tu préfères.
4. Demande les variantes une à la fois (un niveau, un état, une pose), en gardant la même conversation pour que le style reste le même ; dis « même style, même échelle, même angle que l’image précédente ».
5. Les objets du camp se génèrent **sur fond blanc uni, sans ombre au sol** : retire ensuite le fond (Nano Banana sait le faire en seconde passe : « retire le fond, garde l’objet seul, fond transparent », sinon un outil de détourage), puis exporte en WebP avec transparence.
6. Passe le contrôle du brief, range le fichier au chemin indiqué, puis ouvre le prototype à l’écran concerné et lance `python3 -I scripts/verifier-projet.py .` (0 erreur).

## Ce qui est dedans

- `01-STYLE-ATHENA.md` : le style, la palette, l’angle, la lumière, ce qu’on refuse.
- `02-CONTROLE.md` : la check-list après génération et comment poser les fichiers dans le projet.
- `briefs/` : un fichier par dessin, numéroté dans l’ordre conseillé.
- `prompts.json` et `prompts.csv` : les mêmes prompts, pour générer en série.
- `references/` : les images du projet à joindre (jamais d’images extérieures au projet).

## La liste

| N° | Dessin | Priorité | Origine | Variantes |
|---|---|---|---|---|
| 01 | Le Comptoir (4 niveaux) | 1 | 14/10 | 4 images (un niveau chacune), même angle, même échelle : le niveau 4 ne doit pas dépasser 1,3 fois la largeur du niveau 1 |
| 02 | Le Ponton : le tableau des départs (4 niveaux) | 1 | 17/10 | 4 images, un niveau chacune |
| 03 | La Forge (4 niveaux) | 1 | 14/10 | 4 images, un niveau chacune |
| 04 | Le Kiosque du Hameau (4 niveaux) et ses lanternes | 1 | 17/10 | 4 niveaux + 2 lampions |
| 05 | 2 compagnons (un commun, un rare), en marionnette | 1 | 14/10 | 2 personnages × 6 vues  |
| 06 | Le coffre du camp : l’inventaire (3 états) | 1 | 14/10, revu le 20/10 | 3 images |
| 07 | Le sac (icône et illustration) | 2 | 14/10 | 2 images (icône, illustration) |
| 08 | La chouette, le guide (4 poses) | 1 | pack | 4 images |
| 09 | Les décors de saison (palier 10) des 4 saisons | 1 | 19/10 | 4 images, une par saison  |
| 10 | Les grands décors (palier 20) et l’insigne du titre, 4 saisons | 2 | 19/10 | 4 grands décors + 4 insignes |
| 11 | Les bannières des 4 saisons | 1 | 19/10 | 4 bannières  |
| 12 | Les icônes par type de récompense (8) et par saison (4), deux DA | 2 | 19/10 | 12 icônes × 2 DA = 24 pictogrammes  |
| 13 | Les 12 vignettes des légendes | 2 | 19/10 | 12 images |
| 14 | Le sceau de la promesse | 2 | 19/10 | 1 image (+ une version « posée », un peu aplatie, pour l’état « promesse gardée », facultative) |
| 15 | La guirlande du défi du Hameau | 2 | 19/10 | 1 fond + les 2 lampions (l’app pose les lampions allumés / éteints par le code) |
| 16 | Le décor de la semaine (récompense du défi) | 3 | 19/10 | 1 image |
| 17 | Les 4 torches du Mont | 1 | 20/10 | 2 images (éteinte, allumée)  |
| 18 | Les visiteurs rares (option « Camp vivant ») | 3 | pack | 3 animaux × 2 poses = 6 images |
| 19 | Les petites choses du réveil (option) | 3 | pack | 6 images |
| 20 | De nouveaux objets pour le camp (option) | 3 | pack | Jusqu’à 17 objets, un à la fois |
| 21 | La constellation (option, bonus C) | 3 | pack | 12 images |
| 22 | Les cosmétiques de l’avatar (un cadre, une tenue) | 2 | 19/10 soir | 2 images (un cadre, une tenue)  |
| 23 | Les cinq voies du parcours (vignettes) | 2 | 20/10 | 5 vignettes |
| 24 | Trois créatures de plus pour les parcours | 2 | 20/10 | 3 personnages × 6 vues  |
| 25 | Le matin : la bannière du résumé (option) | 3 | 20/10 | 1 bannière |

Priorité 1 : nécessaire à la démo (aujourd’hui dessiné par le code ou en icône). Priorité 2 : après la démo. Priorité 3 : option, seulement si la mécanique est retenue.

Règles du projet qui s’appliquent aux images : rien venu d’une autre application ni d’une référence ; aucun texte dans les images (l’app pose les textes) ; aucun chiffre ; des objets du quotidien, des animaux ronds, jamais de dieux ni d’armes ; les lampions et le feu restent les seules sources de lumière du camp.
