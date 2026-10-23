# Passe du 17/10/2026 · la conception

Le camp qui grandit et les nouveautés au bon moment. Ce document dit **ce qu'on a décidé et pourquoi**. Les fichiers touchés, les bugs corrigés et la façon de vérifier sont dans `00-LISEZ-MOI.md`. La version à lire d'abord est l'Accueil du projet : le jeu en une page.

**Cible de la démo.** Les ados (13 à 17 ans) et leurs parents. Les profils du prototype deviennent **l'Ado** (Léa, 15 ans) et **le Parent** (Alex) ; la démo s'ouvre sur l'Ado. En second : les adultes qui s'organisent seuls (les personas de Pixelio), avec le profil Parent. Les clés internes ne changent pas (`enfant`, `adulte`) : rien ne casse dans les sauvegardes ni dans Écrans.

**Références** (Pixelio, prototype Gemini « Journal de Quêtes ») : on reprend des **systèmes**, jamais des textes, des dessins ou des sons. Le tower defense n'est pas traité ici. Ce qu'on garde et ce qu'on laisse : § 7.

## 1. En bref

- **Le camp grandit en 4 niveaux**, ceux de l'Auberge (la tente). Chaque niveau ouvre des bâtiments et des objets au Comptoir. **Chaque place est marquée dans le camp dès le premier jour.**
- **Les nouveautés arrivent une à une**, dans l'ordre : d'abord le jeu de base et l'organisation, ensuite les expéditions (3e jour) et le social (5e jour), enfin la Forge.
- **Un tutoriel court** porté par la chouette : une carte, puis un projecteur sur un seul endroit. Il ne bloque rien et se passe d'un toucher.
- **Le social vit dans le camp** : l'espace parent dès le jour 1, puis le Kiosque du Hameau, les lanternes communes, la visite d'un proche, l'Étincelle qui arrive jusqu'au feu. Jamais de chiffres montrés aux autres.
- **Le camp est plus vivant** et **le haut du camp ne cache plus le sommet** ; le minotaure marche plus souplement, bras près du corps.

## 2. Les niveaux du camp

| Niveau | Personne régulière (simulé) | Bâtiments | Objets au Comptoir |
|---|---|---|---|
| 1 · Le campement | Au départ | L'Auberge (la tente), le Comptoir | Fanion, banc de bois, jardin de lavande, amphore |
| 2 · Le camp s'ouvre | Vers le jour 2 | Le Ponton (expéditions), le Kiosque du Hameau (social) | Olivier, carillon, tapis tissé, couronne de laurier |
| 3 · Le camp prospère | Vers le jour 18 | La Forge ; deux chantiers à la fois | Fontaine, statue de chouette, mosaïque |
| 4 · Le grand camp | Vers le jour 68 | Tout monte au niveau 4 (vers le jour 124) | La sélection du mois |

La lanterne n'est pas vendue : elle vient du Grand Sentier (palier 3). Le kiosque n'est plus vendu : il devient le Kiosque du Hameau.

**Les bâtiments et leur dessin**

| Bâtiment | Dans le camp | Dessin |
|---|---|---|
| L'Auberge | La tente, à gauche | Existant, 4 étapes |
| Le Comptoir | En bas à droite, au-dessus de la barre | **Provisoire**, dessiné par le code : une échoppe et son enseigne |
| Le Ponton (l'ancien « Hall des expéditions ») | Au bout de la plage | Le ponton et le bateau existent ; le bateau n'apparaît qu'une fois le Ponton construit. Tableau des départs **provisoire** |
| Le Kiosque du Hameau (l'ancien « Hall social ») | En haut à droite | Existant : le kiosque |
| La Forge | Devant, à gauche du feu | **Provisoire** : foyer de pierre, enclume, cheminée qui fume |

**Les états d'une place** (toucher une place ouvre ce qu'il faut : le plan du camp ou le Comptoir)

| État | Ce qu'on voit |
|---|---|
| À venir | Un panneau en bois et un cadenas : « À l'Auberge 3 » |
| À construire | Des piquets, une corde, le panneau « Construire » qui respire doucement |
| En chantier | Un échafaudage, de la poussière, des coups de marteau ; « prêt vers 18 h » |
| Construit | Le bâtiment, avec un détail de plus à chaque niveau |
| Place d'un objet | Une empreinte en pointillés et un « + » ; la toucher ouvre le Comptoir sur cet objet. Seulement pour les objets du niveau du Comptoir : les suivants restent dans le plan du camp |

## 3. Les nouveautés, une à une

| # | Nouveauté | Elle arrive quand (règle du prototype) | Ce que dit la carte |
|---|---|---|---|
| 1 | Le feu et tes quêtes | En entrant au camp | « Une quête faite ? Glisse-la jusqu'au feu. » |
| 2 | Le coffre du camp | 1re quête validée | « Chaque quête y dépose du bois et de l'or. Un toucher pour ramasser. » |
| 3 | Le Mont | 2e quête validée | « Tes 4 habitudes allument le Mont… » |
| 4 | Le Comptoir | Assez d'or pour l'objet le moins cher du niveau 1 | « Des objets pour embellir le camp. Leurs places t'attendent, en pointillés. » |
| 5 | Ta tente peut grandir | Assez de bois et d'or pour l'Auberge 2 | « Dans le plan du camp, l'Auberge passe au niveau 2. » |
| 6 | Le Ponton | Auberge 2 et 3 journées actives | « Ton minotaure part en bateau pendant que tu fais tes quêtes… » |
| 7 | Le Kiosque du Hameau | Auberge 2, 5 journées actives et une 1re expédition ; sans expédition, au 7e jour | « Ton camp n'est pas seul… On ne se compare jamais. » |
| 8 | La Forge | Auberge 3 | « Des charmes en bois pour les expéditions… » |

Les règles :
- une seule nouveauté à la fois ; jamais pendant une quête qu'on glisse, jamais par-dessus un autre message ou une feuille ouverte ;
- une carte (« Voir », « Plus tard »), puis un projecteur sur l'endroit du camp ; avec « Plus tard », pas de projecteur : la nouveauté reste dans la liste du plan du camp, d'où on peut la revoir ;
- **« Prochaine nouveauté »**, sous le haut du camp, dit ce qui arrive ensuite ; la liste des nouveautés est dans le plan du camp ;
- **le lien parent-ado n'attend pas** : l'espace parent est là dès le premier jour (c'est de l'organisation, pas du jeu social) ;
- le rythme des expéditions et du Hameau reste à trancher : **choix 10** (par défaut : Ponton au 3e jour, Hameau au 5e).

## 4. Le tutoriel

1. **4 écrans courts** ; le 4e présente le Mont (« Le Mont : 4 petites habitudes »). On peut passer.
2. **L'avatar**, puis **« Tes 4 habitudes »**, choisies avant d'entrer au camp ; le parent peut aider.
3. **Au camp**, la carte de la première nouveauté (le feu), puis le projecteur : un geste à la fois.
4. Le projecteur s'éteint au premier toucher ou au bout de 9 secondes, et ne bloque rien. En mouvement réduit : les mêmes phrases, sans animation.

Dans le prototype, le panneau « Simulation » rejoue le tutoriel et appelle la nouveauté suivante.

## 5. Le social

| Élément | Quand | Ce que c'est | Garde-fous |
|---|---|---|---|
| L'espace parent | Dès le jour 1 | La semaine de l'ado, ses 4 habitudes choisies ensemble, un mot, un jeton cadeau | Code à 4 chiffres ; jamais de chiffres en rouge |
| Le Kiosque du Hameau | Auberge 2, 5e jour | Le groupe Famille ou Amis (8 au plus) ; on visite les camps sans y toucher | On voit le Sommet du jour de chacun, jamais de chiffres, aucun tableau des scores |
| L'Étincelle | Une par jour | Après son Sommet, on en offre une à un proche : elle traverse son camp jusqu'au feu, avec le prénom. Si ce proche fait aussi son Sommet ce jour-là : +10 bois et +10 or pour chacun | Rien ne se perd si on n'en offre pas |
| Les lanternes communes | À chaque Sommet | Chaque Sommet du groupe pose une lanterne autour du Kiosque, dans le camp de chacun | On ne montre jamais qui a allumé quoi. Récompense : **choix 11** (par défaut, aucune) |
| La visite | De temps en temps | Le compagnon d'un proche passe au camp, avec son prénom, puis repart | Seulement si le Kiosque est construit |
| Les expéditions communes | Kiosque niveau 2 | Le compagnon d'un proche part avec le tien : +15 % de butin pour les deux | Facultatif |

## 6. Ce qui fait revenir, ce qu'on refuse

| Ce qui fait revenir | Rythme |
|---|---|
| Le coffre du camp : il se remplit à chaque quête et attend sans limite ; parfois une surprise (une fois par jour) | Chaque jour |
| Le Mont et le Sommet : 4 petites habitudes ; le Mont repart à 4 h | Chaque jour |
| Les chantiers : « prêt vers 18 h », un rendez-vous sans compte à rebours | Quelques heures |
| Les expéditions : partir pendant ses quêtes, revenir avec un butin (1 h, 4 h ou 8 h ; 2 départs par jour) | Quelques heures |
| Les nouveautés, une à la fois ; « Prochaine nouveauté » | Les premières semaines |
| Le Grand Sentier : un palier par Sommet, une récompense à chacun, une saison de 8 semaines | Une saison |
| Les proches : une Étincelle, une lanterne commune, une visite | Chaque jour |
| Le camp vivant : il suit l'heure et s'anime à chaque quête | À chaque ouverture |

**Ce qu'on refuse** : les séries qui cassent (le feu ne s'éteint jamais) ; la pression (ni rouge, ni clignotement, ni compte à rebours qui presse) ; la comparaison (aucun tableau des scores) ; l'argent (rien ne s'achète, aucune publicité) ; la culpabilité (le soir, « À demain ») ; le tutoriel qui bloque l'écran.

## 7. Ce qu'on prend aux références, ce qu'on laisse

| Référence | On prend | On laisse |
|---|---|---|
| Pixelio · trois boucles (instant, jour, long terme) | La même lecture : la quête (étiquettes), la journée (Mont, coffre), la saison (Sentier, niveaux du camp) | — |
| Pixelio · projecteur du tutoriel | Un projecteur sur un seul élément, une consigne courte | Le voile qui bloque tout l'écran |
| Pixelio · retour d'expédition, carte souvenir | Le retour qu'on attend, le butin qu'on ouvre ; les fragments de légende vont dans le Carnet | Les 60 cartes illustrées : hors de portée pour la démo |
| Pixelio · objectif communautaire | Les lanternes communes, en coopération seulement | Les objectifs à l'échelle de toute l'app, les tableaux des scores |
| Pixelio · « Je reviendrai demain ! » | Le soir peut dire « À demain » | L'engagement forcé, la culpabilité |
| Pixelio · monétisation (rappel d'essai, offre de sauvetage) | Rien | Tout : public ado, aucune dépense, aucune pression |
| Pixelio · série qui casse, peur de perdre | Rien | Le feu ne s'éteint jamais, rien ne se perd |
| Gemini · seuil de 5 minutes, chantier accéléré par une quête bonus | Déjà dans la V1 (petites habitudes ; une quête qui n'est pas une habitude retire 1 h au chantier) | — |
| Gemini · session focus = expédition | « Partir pendant que je travaille », dans la feuille des expéditions | Le minuteur de 25 min imposé |
| Pixelio · personas | Lus, sans les suivre : nos personas sont l'ado et son parent | Les personas adultes, en second |

## 8. Les chiffres (barème version 3)

Changements par rapport au 14/10 (`V.JEU.eco` et `AthenaEconomie.DEFAUT` restent identiques) :
- **le Ponton se construit à l'Auberge 2** : 50 bois, 5 min ; avant lui, aucune expédition ;
- **la Forge arrive à l'Auberge 3** (elle était à l'Auberge 2) : ses charmes ne servent qu'en expédition ;
- le reste ne bouge pas.

**La simulation donne maintenant le même résultat dans tous les navigateurs** : elle mélangeait les quêtes du jour avec un tri à comparateur aléatoire, dont le résultat dépend du moteur JavaScript (Chrome et Node donnaient des jours différents). Elle utilise un mélange de Fisher-Yates. Les 54 règles des contrôles restent vérifiées.

Simulé comme `outils/economie-test.html` (180 jours, 20 tirages, médianes) :

| Profil | Auberge 2 | Auberge 3 | Auberge 4 | Tout au niveau 4 | Grand Sentier fini |
|---|---|---|---|---|---|
| Léger (2 à 4 quêtes, 4 jours sur 7) | jour 6 | jour 48 | après 180 jours | — | non : 6 paliers sur 20 (12 avec un joker) |
| Régulier (4 à 6 quêtes, 6 jours sur 7) | jour 2 | jour 18 | jour 68 | jour 124 | jour 45 (90 saisons sur 100) |
| Intense (8 à 11 quêtes, tous les jours) | jour 1 | jour 10 | jour 39 | jour 71 | jour 24 |

Tout est dans les cibles du simulateur (régulier : Auberge 3 entre les jours 14 et 28, Auberge 4 entre 63 et 84, tout le camp entre 100 et 150, Grand Sentier entre 35 et 56). Les chiffres cités par les choix 1, 2 et 8 ont été recalculés de la même façon.
