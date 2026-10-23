# Écrans à créer ou à modifier (mise à jour du 14/10)

Chaque écran s’ajoute à `V.ECRANS` (athena-v1.js), avec ses textes dans `V.TEXTES` et sa mécanique dans `V.MECANIQUES`. Il existe :
- dans les deux profils (Adulte, Enfant) ;
- dans les deux DA ;
- de jour et de nuit pour ceux du camp.

La colonne « q » donne les réglages d’URL proposés pour l’ouvrir directement dans le Prototype.

## Lot 1 · Économie, coffre, sac, Mont

| id | Parcours | Écran | Ce qu’on y voit | q |
|---|---|---|---|---|
| camp (modifié) | camp | Le camp | Haut : le médaillon de l’avatar avec le niveau de la personne, les compteurs bois et or, l’icône du sac. Le coffre du camp est posé près de la tente : il gonfle quand il se remplit, et un petit chiffre dit ce qu’il contient. Le Mont montre ses 4 paliers. | `ecran=camp&heure=10.25&fait=1` |
| recompense (modifié) | validation | La récompense | Étiquettes +bois +or qui filent dans le coffre, +XP vers le médaillon, et un palier qui s’allume si c’est une habitude clé. Pas d’écran. | `ecran=camp&heure=10.25&fait=2&etiq=1` |
| ramasser | camp | Ramasser le coffre | Un toucher : bois et or volent vers les compteurs. Parfois une surprise (une fois par jour au plus). | `ecran=camp&coffre=80,40` |
| sac | camp | Le sac | L’inventaire : charmes, objets à placer, fragments, cosmétiques, Étincelles dorées, lanternes. Chaque objet dit à quoi il sert et propose son action (Placer, Emporter en expédition, Offrir). | `ecran=sac` |
| habitudes | creer | Mes 4 habitudes | Choisir 4 petites habitudes parmi ses quêtes récurrentes, ou en créer, avec des exemples courts. « Tu pourras les changer lundi. » Pour l’enfant : dans l’espace parent, avec lui. | `ecran=habitudes` |
| mont | camp | Le Mont du jour | Les 4 habitudes, celles qui sont faites, et la règle : « Les 4 = le Sommet, un palier du Grand Sentier. » Jamais « il te manque ». Le joker apparaît ici s’il est activé. | `ecran=camp&mont=1&paliers=3` |
| sommet | validation | Le Sommet | Le chemin s’embrase jusqu’au sommet (animation existante), puis la carte du palier gagné du Grand Sentier. Remplace « Journée validée ». | `ecran=camp&heure=16&paliers=4&sommet=1` |
| feu (modifié) | camp | Le feu | La jauge (braises, stable, ardent), son effet en une phrase, « Offrir du bois au feu ». | `ecran=feu&feu=55` |
| retour (modifié) | camp | Retour | « Te revoilà ! » ; le coffre a attendu ; à la première quête, le feu remonte. | `ecran=camp&heure=9&retour=1` |
| carte-niveau (modifié) | validation | Un niveau de plus | Le niveau de la personne, +20 or. La tente ne change plus ici. | `ecran=camp&carte=niveau&xp=300` |

## Lot 2 · Le Grand Sentier

| id | Parcours | Écran | Ce qu’on y voit | q |
|---|---|---|---|---|
| sentier | sentier | Le Grand Sentier | Le chemin des 20 paliers, de bas en haut, le palier actuel au centre. Les grandes récompenses (5, 10, 15, 20) sont plus grandes. « Saison 1 · encore 5 semaines », sans compte à rebours. Chaque récompense dit où elle va (le coffre, le sac, le Hall). | `ecran=sentier&palier=7` |
| sentier-palier | sentier | Un palier gagné | La carte de la récompense, montrée une fois après le Sommet. | `ecran=sentier&palier=5&gagne=1` |
| sentier-fin | sentier | Fin de saison | Ce qui a été gagné et la saison suivante. Rien n’est perdu. | `ecran=sentier&fin=1` |
| carnet-legendes | journal | Le Carnet des légendes | Dans le Carnet : 12 séries de 5 fragments. Une série complète offre un décor. | `ecran=journal&tab=carnet&legendes=1` |

## Lot 3 · L’Auberge, les chantiers, le Comptoir

| id | Parcours | Écran | Ce qu’on y voit | q |
|---|---|---|---|---|
| plan-camp | batiments | Le camp (feuille) | En touchant la tente : les bâtiments, leur niveau sur 4, « Améliorer » et son coût. Si on ne peut pas, une phrase : « Il manque 40 bois », « Il y en a assez dans le coffre : ramasse-le », « D’abord l’Auberge au niveau 2 », « Le bâtisseur est occupé ». Les bâtiments à venir sont grisés, avec « À l’Auberge 2 ». | `ecran=plan&bois=300&or=80` |
| chantier | batiments | Un chantier | Un sablier et « prêt vers 18 h ». Une quête qui n’est pas une habitude fait avancer le chantier. | `ecran=plan&chantier=auberge` |
| auberge-niveau | batiments | La tente s’embellit | À l’ouverture, après le chantier : la tente passe à l’étape suivante (les 4 dessins existants), avec une fête. | `ecran=camp&auberge=2&fete=1` |
| comptoir | batiments | Le Comptoir | L’ancien marché : mêmes objets, mêmes prix. Au niveau 4, la sélection du mois. | `ecran=amenager&or=140` |

## Lot 4 · Expéditions et Forge

| id | Parcours | Écran | Ce qu’on y voit | q |
|---|---|---|---|---|
| expedition | expeditions | Partir | La durée (1 h, puis 4 h et 8 h), les compagnons, un charme du sac. « Elles ne peuvent pas échouer. » Depuis une quête de l’agenda : « Partir pendant que je travaille ». | `ecran=expedition` |
| expedition-route | expeditions | En route | « Retour vers 15 h ». Après 2 départs : « C’est assez pour aujourd’hui. » | `ecran=camp&expedition=route` |
| expedition-retour | expeditions | Le retour | Le butin : bois et or vont dans le coffre, le reste dans le sac. | `ecran=camp&expedition=retour` |
| compagnons | expeditions | Les compagnons | Nom, icône, places au Hall, recruter avec de l’or. Ni la chouette ni l’avatar. | `ecran=expedition&tab=compagnons&or=200` |
| forge | forge | La Forge | Les 3 charmes, leur effet, leur coût, le niveau de Forge qui les ouvre. Le charme forgé va dans le sac. | `ecran=forge&bois=200` |

## Lot 5 · Hameau et Étincelle

| id | Parcours | Écran | Ce qu’on y voit | q |
|---|---|---|---|---|
| hameau | hameau | Le Hameau | Les camps du groupe (3 membres fictifs : une Famille pour le profil Enfant, des Amis pour l’Adulte). Le Sommet du jour de chacun, les lanternes communes. Aucun chiffre, aucun classement. | `ecran=hameau` |
| visite | hameau | Visiter un camp | Le camp d’un proche, en lecture seule. | `ecran=hameau&visite=1` |
| etincelle | hameau | Offrir une Étincelle | Après son Sommet, ou avec une Étincelle dorée : choisir un proche, un mot facultatif. « Son feu brille un peu plus. » | `ecran=hameau&etincelle=1&sommet=1` |
| groupe | hameau | Le groupe | Créer ou rejoindre un groupe (Famille ou Amis, 8 au plus) ; ce que les autres voient, ce qu’ils ne voient jamais. | `ecran=hameau&groupe=1` |

## Le panneau de simulation du Prototype

- « Ajouter 100 bois », « Ajouter 100 or », « Remplir le coffre ».
- « Avancer d’une heure », « Lendemain (4 h) », « Fin de saison ».
- « Feu en braises / stable / ardent ».
- « 3 habitudes faites » et « 4 habitudes faites ».
- « Journée type : légère / régulière / intense ».
- Le groupe « Choix à faire (14/10) » : Joker, Grand Sentier, Coffre, Accueil.
