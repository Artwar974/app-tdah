# Passe du 19/10/2026 · la conception

Ce document dit **ce qu'on a décidé et pourquoi**. Les fichiers touchés, les bugs corrigés, les chiffres et la façon de vérifier sont dans `00-LISEZ-MOI.md`. La version à lire d'abord est l'Accueil du projet.

**Le fil de la passe.** Le 17/10 a donné un camp qui grandit et des nouveautés au bon moment. Le 19/10 fait vivre la seconde qui suit la quête : la récompense se joue pendant l'action, dans le camp, et tout ce qui donne envie de revenir (le Grand Sentier, le Hameau, les saisons) s'y accroche sans jamais retirer quoi que ce soit.

**Références.** On reprend des systèmes, jamais des textes, des dessins, des sons ni des noms. Aucune autre app n'est citée dans l'Accueil.

## 1. En bref

- **Un seul système d'animation** (`athena-motion.css` et `.js`) et **trois niveaux de fête, pas plus** : la quête (moins d'une seconde), le Sommet, les grands moments (on peut passer d'un toucher). En mouvement réduit, tout devient un fondu court ou rien ; les informations restent.
- **La récompense pendant l'action** : le minotaure réagit dans les 150 ms, le feu lance ses étincelles, le bois et l'or volent vers le coffre, les lumières du Mont s'allument sur la montagne, un son différent à chaque validation. Aucun écran de récompense ne coupe la journée.
- **Le Grand Sentier est un pass de saison gratuit** : quatre saisons qui se suivent, chacune sa couleur, sa bannière, son décor ; à la fin, tout reste acquis. Jamais un palier derrière un paiement, jamais de compte à rebours.
- **Sept fonctions pour les jours chargés et pour revenir** : la version courte d'une quête, l'appui long, la promesse du camp, le retour sans reproche, le défi du Hameau, les quêtes de saison, la pastille d'expédition.
- **Les personnages vivent et le décor suit la journée** ; **une caméra** garde le feu visible quand une feuille s'ouvre.
- **Le barème 4 ajoute sans déplacer** : les jalons de la personne régulière ne bougent pas.

## 2. La récompense pendant l'action

Une app d'habitudes se joue dans la seconde qui suit la coche. Si rien ne se passe là, un écran de félicitations après coup ne rattrape rien, et il coupe la journée. On a donc mis la récompense **dans le camp, pendant l'action** : réaction du minotaure (cinq, jamais deux fois la même d'affilée), étincelles du feu, ressources qui volent vers le coffre, lumière du Mont qui s'allume sur la montagne, un son par validation (sept), une vibration de 10 ms. Le Sommet est le seul moment qui prend plus de deux secondes : la danse, la fanfare, la carte du palier qui reste jusqu'au toucher. Les grands moments (grand palier, Auberge, fin de saison, guirlande complète) ont une fête plus longue qu'on peut passer.

**Ce qu'on refuse** : une carte qui se ferme seule avant qu'on l'ait vue (bug B1), deux fêtes de la même taille à la suite, un chiffre en rouge.

## 3. Le Grand Sentier en pass de saison

Le Sentier du 14/10 avait vingt paliers et une saison de huit semaines. On en fait un **pass de saison gratuit** : les saisons se suivent (les oliviers, les vendanges, les lanternes, les semailles), chacune a sa couleur (contraste AA dans les deux DA), sa bannière, son décor au palier 10, son grand décor et son titre au palier 20. Les grandes récompenses restent aux paliers 5, 10, 15 et 20. **À la fin d'une saison, tout reste acquis** et la suivante repart au palier 1 ; la carte de fin le dit : « Tout reste à toi ».

L'écran est refait : la bande des paliers centrée sur « Tu es ici », « Revenir à mon palier » quand on s'éloigne, le détail d'une récompense, le cadeau d'arrivée. Le **ruban du Sentier** remplace la pastille en haut du camp : il avance à chaque Sommet.

Le choix 2 (la forme du Sentier) et le choix 7 (les grandes récompenses) restent ouverts ; les saisons ne les contraignent pas.

## 4. Les sept fonctions

| Fonction | Pourquoi | Choix lié |
|---|---|---|
| **La version courte** : une quête a sa version 5 minutes, facultative, qui compte comme la quête (petite feuille d'olivier, jamais « à moitié »). | Baisser le coût d'une habitude est la moitié du travail : un jour chargé n'est plus un jour sans. | 13 : ce qu'elle rapporte |
| **L'appui long** (0,5 s, un anneau se remplit) coche une quête de la barre sans quitter le camp ; le glisser reste le geste signature. | Cocher doit coûter presque rien. | 16 : cocher en un geste |
| **La promesse du camp** : après « Tes 4 habitudes », un sceau à maintenir 1,5 s, ou « Je promets » en mouvement réduit, ou « Passer ». | Dire une fois ce qu'on attend de soi, sans chiffre ni engagement, aide à revenir le lendemain. | 18 : garder cet écran |
| **Le retour sans reproche** : le minotaure court saluer, le feu est en braises chaudes, le coffre a attendu ; à la première quête, le feu repart. Aucun nombre de jours, aucune liste. | Revenir doit être la chose la plus facile du monde. | — |
| **Le défi du Hameau** : chaque Sommet du groupe allume une lanterne autour du Kiosque (3 par membre, 12 à 24). Complète : une petite fête dans chaque camp et un décor pour tous ; incomplète : rien, une nouvelle guirlande lundi. Jamais qui a allumé quoi. | Un objectif où tout le monde gagne ensemble, sans comparaison ; il remplace le choix 11. | 14 : la récompense commune |
| **Les quêtes de saison** : trois par mois, facultatives, dans le Sentier et dans la feuille des quêtes (« Une idée de la saison ») ; un fragment de légende et un peu d'or ; elles changent le mois suivant, sans compte à rebours. | La saison vit aussi dans les quêtes, pas seulement dans le décor. | 15 : les garder dans la V1 |
| **Pendant une expédition** : le bateau au large, une pastille « Retour vers 15 h » qui ouvre le Ponton ; au retour, le butin déposé au coffre et la carte. | Une attente visible, jamais un compte à rebours. | — |

## 5. Les personnages et la caméra

Un personnage qui attend sans bouger rend le camp vide. Le minotaure **marche d'un pas souple** (il tourne avant de partir, ralentit sur le sable et le ponton), **vit au repos** (un geste toutes les 6 à 14 s, jamais le même deux fois : la mer, s'étirer, se gratter, le feu, tapoter, le banc, le coffre), **cligne des yeux**, a un mouvement secondaire (queue, pagne, bras), **réagit** (au revoir avant d'embarquer, un signe quand on le regarde, un bâillement le soir, un étirement au réveil). Les compagnons 2 et 3 vivent au camp avec leur taille, leur pas et leurs habitudes, et vont à la rencontre du visiteur. Tout se règle dans `atelier.html` et s'exporte vers `minotaure.json`.

**La caméra** : une feuille ouverte cachait le feu et la tente au moment même où l'on validait. Le soir du 19/10, le retour est net : on veut voir le camp en entier. La vue large (tout le camp) est donc le cadrage de base ; la vue rapprochée (× 1,12) reste un réglage (choix 17 A) : une feuille ouverte fait alors glisser la vue pour garder le feu visible ; le Sommet regarde le Mont ; le départ suit le bateau ; Aménager passe en vue large. En mouvement réduit, la caméra ne bouge jamais. À × 1,3, le Mont et le ponton sortaient du cadre : c'est pour cela que la valeur du réglage est 1,12 (`V.JEU.camera`).

## 6. Le décor au fil de la journée

Le camp est la récompense : il doit être beau à toute heure sans coûter une image de trop. Une seule rafale puis le calme (la fumée la suit) ; la brume de 6 h à 8 h ; la nuit, les lucioles près de la lavande et du laurier, les étoiles, une étoile filante au Sommet ; les mouettes qui se posent sur le ponton ; **le feu en jauge par la lumière et la couleur seulement** (braises, stable, ardent : jamais la taille, décision du 08/10) ; des transitions continues (les ombres du soleil et du feu se mélangent au crépuscule) ; les copeaux et la fête de fin des chantiers. Le moteur s'arrête quand l'onglet est caché ; « Animations légères » retire ce qui coûte le plus. La mesure : `outils/fps-test.html`, colonne « Boucle du moteur ».

## 7. Les règles d'interface

Le même geste au même endroit, d'un écran à l'autre. Un seul style de bouton principal par écran ; les titres des feuilles au même endroit et à la même taille ; des marges multiples de 4 ; des chiffres tabulaires ; des cibles de 44 px, des boutons de carte de 48 px ; une seule zone de message en haut ; un état vide a une icône, une phrase et une action. Les composants nés de cette passe (carte avec son action à droite, crans, grille de fragments, liseré doré, couvercle, rangée de choix, onglets qui défilent, cadres des grandes récompenses) sont dans DA › Composants.

## 8. Le barème 4

**Ajouter sans déplacer.** La version courte, le défi, les quêtes de saison et les saisons entrent dans `V.JEU.eco` sans toucher aux jalons : la personne régulière garde Auberge 3 vers le jour 18, Auberge 4 vers le jour 68, le camp complet vers le jour 124, le Sentier fini vers le jour 45 (dans les cibles du 17/10). La personne qui vient peu gagne des aides (40 % de ses habitudes en version courte dans la simulation) sans gagner moins. Les variantes des choix 13 et 14 sont des données du module (`VARIANTES`), le configurateur du prototype les applique à une copie du barème pour la session. La migration est douce : `completer` ajoute les champs manquants à une sauvegarde sans rien lui retirer.

## 9. Les choix 13 à 19

Dans l'ordre du tableau du 19/10, avec la recommandation : 13 version courte **A** (comme la quête) ; 14 récompense du défi **A** (un décor pour tous) ; 15 quêtes de saison **A** (3 par mois) ; 16 cocher en un geste **A** (appui long en plus du glisser) ; 17 cadrage **B** (vue large, tranché le 19/10 au soir : le camp en entier) ; 18 promesse **A** (oui, passable) ; 19 modèle économique **A** (tout gratuit pour la démo, décider après le test). Les chiffres de la simulation sont sur chaque fiche de Décisions. Le choix 11 (lanternes communes) est remplacé par le 14 et ne compte plus ; le 17 est tranché : 17 choix restent ouverts.

## 10. Les dessins

Rien n'est inventé : en attendant, des dessins faits par le code ou une icône du jeu. Chaque dessin a une fiche qui se lit telle quelle (format, angle, lumière, style, ce qu'il montre, et pour les personnages les morceaux de la marionnette sur le modèle de `assets/scene/minotaure/`). L'ordre du 14/10 est gardé ; les n° 10 à 18 viennent de cette passe (bannières et décors des saisons, icônes des récompenses, vignettes du Carnet, sceau de la promesse, guirlande du défi, décor de la semaine, lampes du Mont). Le dossier `generation-images/` tient les briefs longs, les prompts et les références.
