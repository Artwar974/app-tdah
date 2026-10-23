# Passe du 17/10/2026 · le camp qui grandit

Le camp grandit en 4 niveaux, ses places sont marquées dès le premier jour, et le jeu se découvre une nouveauté à la fois : d'abord le jeu de base et l'organisation, ensuite les expéditions et le social. La démo vise les ados et leurs parents. Le tower defense n'est pas touché.

**À lire d'abord**
1. **Accueil.dc.html** : le jeu en une page (pour qui, la boucle, le camp qui grandit, les nouveautés, le tutoriel, le social, ce qui fait revenir, le camp vivant), puis les 12 choix à faire et l'état du projet.
2. **01-CONCEPTION.md** (ce dossier) : les décisions, leurs raisons et les chiffres.
3. **Le prototype** : les parcours à essayer, plus bas.

## Ce qui change

| Sujet | Ce qui change |
|---|---|
| Pour qui | Profils **Ado** (Léa, 15 ans) et **Parent** (Alex) ; la journée de Léa ; les textes de l'ado réécrits, directs et chaleureux ; la démo s'ouvre sur l'Ado. Clés internes inchangées (`enfant`, `adulte`). |
| Le camp | 4 niveaux (l'Auberge). Chaque bâtiment a sa place dès le départ : à venir, à construire, en chantier, construit. Les objets du niveau du Comptoir ont une empreinte en pointillés ; la toucher ouvre le Comptoir sur cet objet. Comptoir, Forge et tableau du Ponton dessinés par le code en attendant les dessins. Le kiosque devient le Kiosque du Hameau ; le bateau n'arrive qu'avec le Ponton. |
| Les nouveautés | 8, une à la fois : une carte de la chouette, puis un projecteur sur l'endroit du camp. « Prochaine nouveauté » sous le haut du camp ; la liste dans le plan du camp. Le Ponton au 3e jour, le Hameau au 5e (choix 10). |
| Le tutoriel | Le 4e écran parle du Mont ; après l'avatar, « Tes 4 habitudes » ; le projecteur ne bloque rien (premier toucher ou 9 s). |
| Le social | L'espace parent dès le jour 1 ; le Kiosque du Hameau ; les lanternes communes autour du Kiosque ; la visite du compagnon d'un proche, avec son prénom ; l'Étincelle qui traverse le camp jusqu'au feu. |
| Le camp vivant | Feuilles et pétales dans les rafales, poissons et parfois un dauphin, ombre des nuages, oiseaux autour du sommet, fumée et étincelles de la Forge, fanion du Ponton, enseigne du Comptoir, chantier animé (poussière, marteau). Rien ne bouge en mouvement réduit. |
| Le minotaure | Marche plus souple (environ 2,2 pas par seconde), bras près du corps. |
| Le haut du camp | Le sac rejoint la pastille de gauche ; à droite, le Journal seul : le sommet du mont reste dégagé. |
| Les icônes | 11 icônes Figures (Game-icons.net, CC BY 3.0, Delapouite et Lorc, déjà crédités) : bois, Comptoir, Ponton, bateau, Forge, Hameau, minotaure, chantier, panneau, lampion, nouveauté. |
| Le barème | Version 3 : le Ponton se construit à l'Auberge 2, la Forge arrive à l'Auberge 3. La simulation donne le même résultat dans tous les navigateurs. |
| La doc | Accueil réécrit et trié ; ses textes dans `V.SYNTHESE` (athena-v1.js) ; 4 images dans `assets/doc/` ; 7 décisions et 3 choix (10 à 12) du 17/10 dans Décisions. |

## Les parcours à essayer

Ouvre `Prototype.dc.html` puis ajoute après `#` :

| Pour voir | Réglages |
|---|---|
| Le premier lancement (onboarding, avatar, « Tes 4 habitudes », première nouveauté) | « Réinitialiser » dans le panneau |
| Le camp au niveau 2, places et empreintes | `ecran=camp&auberge=2&nouv=tout&jours=3&bois=150&or=60` |
| La nouveauté du Ponton | `ecran=camp&nouveaute=ponton&auberge=2&jours=3&bois=120&nouv=5` |
| Le Hameau | `ecran=hameau&nouv=tout` |
| Le camp au niveau 3, tous les bâtiments | `ecran=camp&auberge=3&batiments=comptoir:3,expeditions:2,social:2,forge:1&nouv=tout` |

Dans le panneau, « Simulation » appelle la nouveauté suivante et rejoue le tutoriel.

## Les fichiers

| Fichier | Ce qui change |
|---|---|
| Accueil.dc.html | Réécrit : le jeu en une page, puis l'atelier (choix, état, pages, guide, journal). L'ancienne version : `Archives/2026-10-17-rangement/`. |
| Prototype.dc.html | Places et états des bâtiments, nouveautés (carte, projecteur, « Prochaine nouveauté »), Hameau dans le camp, haut du camp, panneau de simulation, bugs ci-dessous. |
| athena-v1.js | Profils, textes, `V.CAMP_NIVEAUX`, `V.BATIMENTS`, `V.NOUVEAUTES`, `V.BOUCLE`, `V.SYNTHESE`, objets (5e champ : niveau du Comptoir), décisions et choix du 17/10, glossaire, journal. |
| commun/athena-scene.js, commun/athena-scene.json | Bâtiments, places et chantiers dessinés par le code ; enseigne, lampions ; visite, Étincelle ; vie ambiante. |
| commun/athena-marionnette.js, assets/scene/minotaure/minotaure.json | La marche du minotaure. |
| commun/athena-economie.js | Barème 3 (données, recopiées à l'identique dans `V.JEU.eco`) et le mélange de la simulation. **Exception à la règle 1 du LISEZ-MOI** : seules les données et ce bug ont changé. |
| commun/athena-icones.js (2.2), commun/athena-icones-figures.js (1.2) | Les 11 icônes ; une icône dont le gabarit n'est pas encore rempli ne se dessine plus. |
| outils/economie-controles.js, outils/economie-test.html | Les contrôles du barème 3 (54 règles). |
| DA, Décisions, Écrans, Mécaniques | Versions des scripts ; « Au Ponton » ; Écrans : les flèches posées après le rendu, les profils Ado et Parent. |
| assets/doc/ | 4 images de la doc : le camp qui grandit, les places, le tutoriel, le Hameau. |
| LISEZ-MOI.md, Archives/INDEX.md | Le plan du projet et le rangement. |

Versions des scripts : athena-v1.js `?v=47`, athena-economie.js `?v=3`, athena-icones.js `?v=28`, athena-icones-figures.js `?v=7`, athena-scene.js `?v=3`, athena-marionnette.js `?v=3` ; hub-v1.js reste en `?v=18`. Tower defense.dc.html garde les siennes.

## Les bugs corrigés

- Les icônes en haut à droite cachaient le sommet du mont.
- La marche du minotaure était brute, bras écartés.
- Hameau : les avatars ne s'affichaient pas (image invalide).
- Erreurs SVG dans la console : sabliers et indice du geste (Prototype), flèches entre écrans (Écrans), icônes dessinées avant que leur taille soit connue (DA).
- Les chiffres du coffre faisaient moins de 14 px : ils passent à 15 px.
- Les feuilles des expéditions et du Hameau s'ouvraient avant leur bâtiment : elles disent maintenant quand il arrive.
- Poser un objet du sac déjà présent au camp ne faisait rien : il devient de l'or.
- « D'abord Le Comptoir » : une majuscule au milieu de la phrase.
- Noms « Hall » restants (écran des compagnons, glossaire, décision des expéditions, Carnet, dessins à commander).
- Pastilles des bâtiments coupées au bord droit ; ancienne étiquette « Bientôt » posée sur le coffre ; Comptoir caché par la barre des quêtes.
- « Ta tente peut grandir » proposée alors que l'Auberge 2 était déjà construite.
- Une carte de nouveauté pouvait s'ouvrir par-dessus une feuille.
- Écrans disait encore « Enfant » et « Adulte » pour les profils : « Ado » et « Parent ».
- La simulation de l'économie donnait des jours différents selon le navigateur (tri à comparateur aléatoire) : mélange de Fisher-Yates. Les chiffres des choix 1, 2 et 8 sont recalculés (Sentier fini 90 fois sur 100 pour une personne régulière, tout le camp vers le jour 124).

## Ce qui reste

- Trancher les **choix 10 à 12** (rythme des expéditions et du Hameau, lanternes communes, bâtiments provisoires), avec les 9 du 14/10.
- Commander les **9 dessins** (Accueil › Dessins à commander) : Comptoir, tableau du Ponton, Forge, niveaux du Kiosque, 2 compagnons, coffre, sac, décor de saison, récompense du palier 20.
- Tester la démo avec des ados et leurs parents (choix 6 : l'écran à l'ouverture).

## Vérifié

- `python3 -I scripts/verifier-projet.py .` : 0 erreur, 0 alerte.
- `outils/economie-test.html` : 54 règles vérifiées ; `V.JEU.eco` identique au module ; régulier : Auberge 3 au jour 18, Auberge 4 au jour 68, tout le camp au jour 124, Grand Sentier au jour 45 (dans les cibles).
- Prototype : aucune erreur dans la console ; aucune cible tactile sous 44 px ; le feu visible et touchable ; premier lancement, nouveautés dans l'ordre, places, Comptoir, Hameau, visite et Étincelle, en 390 × 844 et 360 × 640.
- Accueil, Écrans, Décisions, DA, Mécaniques : aucune erreur ; l'Accueil sans défilement horizontal à 390 px.

## Dans Claude Design

Le paquet `athena-maj-17-10.zip` contient seulement ce qui est nouveau ou modifié par rapport au projet Claude Design : le camp en une scène (16/10) et cette passe, soit 140 fichiers.

1. Dépose son contenu à la racine du projet, en remplaçant les fichiers du même nom. Rien n'est à supprimer.
2. `Archives/INDEX.md` et `Archives/2026-10-17-rangement/` (l'ancien Accueil) rejoignent les Archives.
3. Ouvre `outils/economie-test.html` : la section « Contrôles » doit dire « 54 règles vérifiées ». Puis `python3 -I scripts/verifier-projet.py .` : 0 erreur.
