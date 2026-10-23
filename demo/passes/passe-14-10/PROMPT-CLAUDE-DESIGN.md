# Mise à jour du 14/10 · économie bois et or, Mont des 4 habitudes, Grand Sentier, rangement du projet

Tu travailles sur le projet Athéna (« Le Journal de Quêtes »). Je viens d’ajouter au projet les fichiers suivants :
- `passes/passe-14-10/`
- `commun/athena-economie.js`
- `outils/economie-test.html`
- `outils/economie-controles.js`

Ta mission, sur le **prototype de la V1 uniquement** (les Incursions n’entrent pas dans cette passe) :
1. passer à la nouvelle économie et aux nouvelles mécaniques, en gardant l’âme de l’app : cozy, bienveillante, la vraie vie d’abord, on gagne toujours et on ne perd jamais ;
2. **ranger tout le projet** pour qu’il soit clair et lisible ;
3. **mettre en avant les choix qui restent à faire**, pour que mon associé et moi puissions trancher vite.

## Avant de commencer

1. Lis, dans cet ordre :
   - `passes/passe-14-10/00-LISEZ-MOI.md`
   - `01-ANALYSE.md` (la section 4, ce sont les règles)
   - `02-ECRANS.md`
   - `03-CHOIX-A-FAIRE.md`
   - `04-RANGEMENT.md`
   - `decisions-economie.json`
   - l’en-tête de `commun/athena-economie.js`
2. Ouvre `outils/economie-test.html` : la section « Contrôles » doit dire « 52 règles vérifiées ».
3. Puis fais les étapes dans l’ordre. Vérifie chaque lot (section « Contrôle ») avant de passer au suivant.

**Arrête-toi et demande-moi** seulement si :
- une règle de ce prompt contredit une décision « décidée » qui n’est pas listée dans `remplace` ;
- tu devrais supprimer un écran existant sans équivalent ;
- un lot casse un parcours existant et tu ne sais pas le réparer.

Pour tout le reste, tranche toi-même et note ton choix dans le compte rendu.

## Les règles du projet (toujours valables)

1. **Les Incursions.** Ne touche ni à `Tower defense.dc.html` ni à `tower-defense/`. Le tower defense doit s’ouvrir exactement comme avant.
2. **Les modules de la vraie app.** Ne modifie ni `commun/athena-decor.js`, ni `athena-objets-animes.js`, ni `athena-camp-lumiere.js`, ni `athena-avatars.js`, ni `assets/decor`, `assets/housing` et `assets/camp/anime`. Tout se règle par leurs options.
3. **Le module d’économie.** Ne modifie pas non plus `commun/athena-economie.js`. Recopie `AthenaEconomie.DEFAUT` tel quel dans `V.JEU.eco` (athena-v1.js), qui reste la source unique des valeurs.
   - Les pages calculent avec les fonctions d’`AthenaEconomie`, appelées avec `V.JEU.eco`, jamais avec des nombres écrits en dur.
   - Si tu dois changer une valeur, change-la dans `V.JEU.eco` et explique-le dans le compte rendu.
4. **Rien ne se supprime.** Ce qui sort va dans `Archives/2026-10-14-rangement/`, avec une ligne dans `Archives/INDEX.md`. Une décision remplacée garde sa fiche, au statut « remplacée ».
5. **Un mot, un sens** (`V.GLOSSAIRE`, `V.MOTS_INTERDITS`).
   - Jamais de rouge, de clignotement ou de compte à rebours qui presse : une durée, c’est un sablier et une heure approximative (« prêt vers 18 h »).
   - Jamais de « il te manque », de « raté » ou de comparaison entre personnes.
6. **Pas de dessin inventé.** Pour les bâtiments autres que la tente, les compagnons, le coffre du camp et le sac, utilise les icônes des kits déjà dans le projet (Game-icons, Phosphor, Material Symbols, Fluent), dans des feuilles et des cartes, et ajoute chacun à la liste « Dessins à commander ».
7. **Accessibilité.**
   - Cibles de 44 px au moins, contraste AA.
   - Chaque compteur a un libellé lu par un lecteur d’écran (« 120 bois », « 3 habitudes sur 4 »).
   - Le mouvement réduit coupe les animations, jamais l’information.
8. **Profils et DA.** Chaque écran existe en Adulte et en Enfant (textes plus courts pour l’enfant), dans les deux DA.

## Étape 1 · Ranger le projet

Suis `04-RANGEMENT.md`.

1. **Les dossiers des passes.** Crée `passes/` et déplaces-y `passe-08-10/` (mets à jour ses mentions dans athena-v1.js et LISEZ-MOI.md). `passes/passe-14-10/` y est déjà.
2. **Les Archives.** Pour chaque élément de la liste « Ce qui sort », vérifie qu’aucune page, ni `athena-v1.js`, ni `athena-v1-rapport.js`, ni `commun/` ne le lit encore. S’il est libre, déplace-le dans `Archives/2026-10-14-rangement/` et note-le dans `Archives/INDEX.md`. Sinon, garde-le et dis pourquoi dans le compte rendu.
   - Liste : Décider, Explorer, Fondations, La V1, Coulisses/, et les copies de `_gen/`, `_shots/`, `_motion/` restées à la racine.
3. **L’ordre des sections dans chaque page** suit `04-RANGEMENT.md` (section 3).
   - La barre du hub ne montre que l’espace V1 ; un seul lien discret mène aux Incursions.
   - Dans Mécaniques, Écrans et Décisions, ce qui est remplacé est replié, pas supprimé.
4. **LISEZ-MOI.md** est réécrit comme un plan lisible en deux minutes :
   - les 7 pages, une phrase chacune ;
   - les fichiers de la racine ;
   - les dossiers ;
   - les deux règles.

## Étape 2 · Préparer la mise à jour

1. **Le module.** Charge `commun/athena-economie.js` dans `Prototype.dc.html`, `Mecaniques.dc.html` et `Decisions.dc.html`, et déclare-le dans leurs dépendances (`ext-resource-dependency`, `window.__resources`), comme les autres modules de `commun/`.
2. **Le barème.** Ajoute `V.JEU.eco`, la copie exacte de `AthenaEconomie.DEFAUT`. Le simulateur doit dire « V.JEU.eco est identique au barème du module ».
3. **Le vocabulaire** (glossaire et tous les textes) :
   - la chouette est « le guide », les compagnons partent en expédition, l’avatar est l’image de profil ;
   - « le marché » devient « le Comptoir » ;
   - ajoute : le bois, le coffre du camp, ramasser, le sac, l’habitude clé, le palier, le Sommet, le Grand Sentier, la saison, l’Auberge, le chantier, l’expédition, le compagnon, le charme, la Forge, l’Étincelle, l’Étincelle dorée, le groupe, le Hameau, la lanterne du Hameau, le Carnet des légendes, la journée de jeu ;
   - corrige les mécaniques `compagnon` et `avatar`.
4. **Les décisions.** Applique `decisions-economie.json` :
   - les 20 décisions de `nouvelles` : statut « décidé », par « 14/10 » ;
   - celles de `remplace` passent « remplacée », avec « Remplacée le 14/10 par <id> » ;
   - les 9 décisions de `choix` passent « à définir ensemble » ;
   - les notes de `a_mettre_a_jour` s’ajoutent aux fiches concernées.
5. **La sauvegarde**, avec une migration douce dans le Prototype et le modèle décrit dans `athena-v1-rapport.js`.
   - Un ancien état garde son or, ses XP et ses objets ; les objets non placés vont dans le sac.
   - L’Auberge reprend l’ancienne étape de la tente : niveau d’XP 11 ou plus → 4 ; 7 à 10 → 3 ; 4 à 6 → 2 ; sinon 1. **Personne ne perd sa tente.**
   - Les bâtiments arrivés commencent au niveau de l’Auberge.
   - Le coffre du camp démarre avec 50 bois, en cadeau d’arrivée.
   - Les nouveaux champs vivent dans un sous-objet `eco`, de la forme rendue par `AthenaEconomie.etatInitial`.

## Étape 3 · Les lots

Les règles sont dans `01-ANALYSE.md` (section 4) ; les écrans et leurs réglages d’URL dans `02-ECRANS.md`.

**Lot 1 · Économie, coffre, sac, Mont**
1. **Valider une quête** passe par `AthenaEconomie.valider(eco, etat, { cle, maintenant })`.
   - Les étiquettes +bois et +or filent dans le coffre du camp, +XP vers le médaillon.
   - Un palier s’allume si c’est une habitude clé.
   - Au Sommet, le chemin s’embrase (animation existante), puis la carte du palier gagné du Grand Sentier s’affiche.
   - « Annuler » (6 s) retire exactement ce que la quête avait mis. « Déjà comptée » reste vrai pour une quête reprise.
2. **Le coffre du camp** est posé près de la tente : il gonfle un peu quand il se remplit, et `ramasser` le vide d’un toucher. La surprise éventuelle (une fois par jour au plus) reprend les animations des surprises existantes.
3. **Le sac** est une feuille, ouverte depuis l’icône du haut. Chaque objet propose son action : Placer, Emporter, Offrir.
4. **Le haut du camp** : le médaillon de l’avatar avec le niveau de la personne, le bois, l’or, le sac. La barre d’XP passe dans la carte du profil.
5. **Le Mont** : 4 paliers, un par habitude clé.
   - L’écran « Mes 4 habitudes » propose de petites habitudes en exemples et dit qu’on peut les changer chaque semaine. Pour l’enfant : dans l’espace parent, avec lui.
   - Les journées types des deux profils marquent 4 quêtes comme habitudes clés.
   - Le joker n’apparaît que si l’option est activée.
6. **Le feu devient une jauge** :
   - trois états, visibles par la lumière et la couleur seulement ;
   - les braises restent chaleureuses ;
   - « Offrir du bois au feu » dans sa feuille ;
   - l’éclairage du camp peut suivre l’état du feu par les options du module de lumière.
7. **La journée de jeu** bascule à 4 h.

**Lot 2 · Le Grand Sentier**
1. La feuille du Grand Sentier s’ouvre depuis le Mont.
   - 20 paliers, de bas en haut, le palier actuel au centre ; les grandes récompenses (5, 10, 15, 20) sont plus grandes.
   - Chaque récompense dit où elle va : le coffre, le sac ou le Hall.
2. Les cartes « palier gagné » et « fin de saison ».
3. Le calendrier des 30 journées et le bonus de journée sont remplacés. Leurs objets passent dans la saison 1 : garde leurs textes et leurs dessins.
4. Le Carnet des légendes, dans l’onglet Carnet : 12 séries de 5, avec une phrase provisoire par fragment.

**Lot 3 · L’Auberge, les chantiers, le Comptoir**
1. La feuille « Le camp » s’ouvre en touchant la tente.
   - Elle utilise `peutAmeliorer`, `lancerChantier` et `terminerChantiers`, appelés à l’ouverture du camp et à chaque rendu.
   - Quand il manque des ressources, une seule phrase. Si `dansLeCoffre` est vrai : « Il y en a assez dans le coffre : ramasse-le. »
2. Quand l’Auberge monte, la tente passe à l’étape suivante (les 4 dessins existants), avec une fête. La tente ne dépend plus des XP.
3. Le marché devient le Comptoir, avec les mêmes objets et les mêmes prix ; au niveau 4, la sélection du mois.

**Lot 4 · Expéditions et Forge**
1. **Le Hall des expéditions** utilise `lancerExpedition`, `retours` et `recruter`.
   - 1 compagnon offert, 2 départs par journée.
   - « Elles ne peuvent pas échouer. »
   - Le bois et l’or du butin vont dans le coffre, le reste dans le sac.
2. **Depuis une quête de l’agenda** : « Partir pendant que je travaille ». La durée est la plus proche du créneau.
3. **La notification de retour** (simulée par un message) arrive en journée seulement et se désactive dans le Carnet.
4. **La Forge** utilise `forgerCharme`, avec les 3 charmes, leur effet et le niveau qui les ouvre. Le charme forgé va dans le sac ; on l’emporte au départ d’une expédition.

**Lot 5 · Hameau et Étincelle**
1. **L’entrée « Hameau »** est discrète dans le journal. La barre de navigation ne change pas : c’est le choix « accueil ».
   - Un groupe fictif de 3 personnes : une Famille pour le profil Enfant, des Amis pour l’Adulte.
   - Visite en lecture seule.
   - On voit le Sommet du jour de chacun et les lanternes communes, jamais de chiffres.
2. **L’Étincelle** utilise `peutOffrir`, `offrirEtincelle` et `recevoirEtincelle` : une par jour après son Sommet, ou une Étincelle dorée du sac.
3. **L’écran « Le groupe »** montre ce que les autres voient et ce qu’ils ne voient jamais. Le groupe ne dépend d’aucun bâtiment.

## Étape 4 · Mettre en avant les choix à faire

C’est ce que je regarderai en premier.

1. **Accueil** : un bloc « À décider après la mise à jour du 14/10 », tout en haut.
   - Les 9 choix de `03-CHOIX-A-FAIRE.md` en cartes, le plus important (le joker) en premier.
   - Chaque carte : la question en une ligne, la valeur actuelle, la recommandation, un chiffre de la simulation, « Essayer dans le prototype » (qui ouvre le prototype avec le bon réglage), et « Voir dans Décisions ».
   - Un compteur « 9 choix à faire » qui baisse quand un choix est tranché dans la page Décisions.
2. **Décisions** : une section « Choix à faire » en tête de page, avec les mêmes 9 fiches, plus détaillées.
   - Les options côte à côte, les chiffres, la recommandation.
   - Un bouton pour trancher chaque choix, enregistré comme les autres modifications de la page, puis exportable.
3. **Prototype, configurateur** : un groupe « Choix à faire (14/10) » en haut.
   - Joker (aucun / 1 par semaine).
   - Grand Sentier (20 paliers en 8 semaines / 24 en 8 semaines / 12 par mois).
   - Coffre (à la main / automatique).
   - Accueil (camp / tableau de bord), si c’est faisable sans tout refaire ; sinon, note-le.
   - Chaque réglage modifie une copie de `V.JEU.eco` pour la session, jamais le fichier.
4. **Mécaniques** :
   - les trois groupes « À chaque quête », « Chaque jour », « Chaque saison et sur le long terme » ;
   - le tableau des coûts généré par `AthenaEconomie.cout` ;
   - le tableau des 20 paliers généré depuis `V.JEU.eco.sentier` ;
   - l’encadré « Le rythme des récompenses » (`V.JEU.eco.rythme`) ;
   - un lien vers le simulateur.
5. **Accueil, « Dessins à commander »** : le Comptoir, le Hall des expéditions, la Forge, le Hall social, 2 compagnons, le coffre du camp, le sac, le décor de saison, la récompense du palier 20.
6. **`V.CHANGEMENTS`** : une entrée datée du 14/10/2026.

## Contrôle (après chaque lot, et à la fin)

1. `outils/economie-test.html` :
   - « 52 règles vérifiées » ;
   - « V.JEU.eco est identique au barème du module » ;
   - profil Régulier : jalons dans la cible.
2. **Dans le Prototype, Adulte puis Enfant, de jour puis de nuit** : valide 7 quêtes dont les 4 habitudes, puis vérifie :
   - les étiquettes vers le coffre ;
   - les 4 paliers, puis le Sommet ;
   - la carte du palier 1 du Grand Sentier (40 bois et 20 or, dans le coffre) ;
   - le petit gain à la 7e quête ;
   - « Annuler » qui retire exactement les gains ;
   - ramasser le coffre, avec les compteurs qui montent.
3. **Le même jour avec seulement 3 habitudes** : pas de Sommet, et aucun texte de manque. Avec le joker activé dans le configurateur, le Sommet devient possible.
4. **« Ajouter 100 bois », ramasser, puis plusieurs fois « Avancer d’une heure »** :
   - l’Auberge 2 et la fête de la tente ;
   - l’arrivée de la Forge et du Hall social ;
   - le refus en une phrase quand c’est trop tôt ;
   - la phrase « Il y en a assez dans le coffre ».
5. **Une expédition d’1 h avec un charme**, « Avancer d’une heure » : le butin arrive dans le coffre et dans le sac. La 3e expédition du jour est refusée gentiment.
6. **Hameau** : offrir une Étincelle après le Sommet ; la seconde du jour est refusée ; une Étincelle dorée peut s’offrir.
7. **« Fin de saison »** : la saison 2 repart au palier 0, et tout ce qui a été gagné reste.
8. **Une ancienne sauvegarde au niveau 8** se charge avec l’Auberge 3, son or et ses objets.
9. **Mouvement réduit** : aucune animation, toutes les informations.
10. `scripts/verifier-projet.py` : ajoute les vérifications suivantes, puis lance-le :
    - le module est chargé dans Prototype, Mécaniques et Décisions ;
    - `V.JEU.eco` est présent ;
    - aucun nombre de l’économie n’est écrit en dur dans Prototype ;
    - aucun « compagnon » ne désigne la chouette ;
    - plus aucune page de la racine ne pointe vers un fichier parti aux Archives.
11. Le tower defense s’ouvre comme avant.

## Compte rendu (à la fin)

1. Ce qui est fait, étape par étape et lot par lot.
2. Ce qui n’a pas pu être fait, et pourquoi.
3. Le rangement : ce qui est parti aux Archives, ce qui est resté et pourquoi.
4. Les choix que tu as tranchés seul.
5. Les écarts éventuels de `V.JEU.eco` par rapport au module.
6. La liste des dessins à commander.
7. Les 9 choix à faire, dans l’ordre d’importance, en une ligne chacun avec ta recommandation.
