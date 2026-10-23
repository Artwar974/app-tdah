# Analyse et règles de la mise à jour du 14/10/2026

**Périmètre.** Le prototype de la V1, sans les Incursions (tower defense).

**Sources.**
- Le document « Le Journal de Quêtes, Mécaniques et fonctionnement », c’est-à-dire la vision de la V1.
- Le prototype actuel : athena-v1.js, Prototype, Mécaniques, Décisions.
- Les choix de Baptiste du 14/10 :
  - le Sommet, ce sont les 4 habitudes du jour validées ;
  - chaque Sommet fait avancer un grand battle pass ;
  - les quêtes remplissent un coffre en attente ;
  - le social, la Forge et le Sentier entrent dans la V1.

Les chiffres viennent de `commun/athena-economie.js`, simulé sur 180 jours, 20 tirages par profil. Ils se retrouvent dans `outils/economie-test.html`.

## 1. En bref

- **Deux ressources : le bois (construire) et l’or (embellir, recruter).** L’XP n’est pas une ressource : elle donne le niveau de la personne. Le minerai sort. Les fragments de lore, les charmes et les Étincelles dorées sont des objets rangés dans **le sac**.
- **Le Mont des habitudes.** La personne choisit 4 petites habitudes. Chacune validée allume un palier ; les 4 font **le Sommet**.
- **Le Grand Sentier.** Chaque Sommet avance d’un palier sur le Grand Sentier, le battle pass gratuit : 20 paliers en 8 semaines, une récompense à chaque palier.
- **Le coffre du camp.** Valider une quête met le bois et l’or dans le coffre du camp. On le ramasse d’un geste en ouvrant le camp, comme les mines de Clash of Clans. Il n’a ni plafond ni date limite.
- **Le rythme des récompenses.** Au plus 3 moments forts par jour : le Sommet, une petite surprise en ramassant le coffre, le retour d’une expédition. Le reste, ce sont des étiquettes qui filent, sans écran. Simulé : 1,9 moment fort par jour actif pour une personne régulière, 2,5 pour une personne intense.
- **Le rythme simulé pour une personne régulière** (4 habitudes réussies chacune 85 % du temps, 6 jours sur 7) :
  - le Sommet un jour actif sur deux (54 %) ;
  - le Grand Sentier fini en 46 jours sur 56, 93 fois sur 100 ;
  - l’Auberge au niveau 4 le jour 71, tout le camp le jour 130 ;
  - 60 % du bois vient du travail réel.

## 2. Les incohérences entre le document et le prototype, et ce qu’on retient

| # | Prototype | Document | Ce qu’on retient |
|---|---|---|---|
| 1 | La tente change aux niveaux d’XP 1, 4, 7 et 11 | La tente est l’Auberge, montée par des chantiers | La tente est l’Auberge (4 niveaux, chantiers). L’XP donne le niveau de la personne, qui se fête sans rien bloquer. Migration : une tente déjà gagnée n’est jamais perdue. |
| 2 | Une lumière par quête du jour ; « journée validée » = toutes les quêtes | Le Mont : 4 habitudes clés | Le Mont à 4 habitudes. Les autres quêtes rapportent des ressources et accélèrent les chantiers, mais ne font pas monter le Mont. Une journée chargée ne bloque donc jamais le Sommet. |
| 3 | Bonus d’une journée (coffre de 30 or) + surprise de la nuit + calendrier des 30 journées | Récompenses aux paliers, Étincelle, Sentier du mois | Une seule piste : le Grand Sentier. Le calendrier des 30 journées et le bonus de journée y entrent, et ses objets passent dans la saison 1. Les surprises passent dans le coffre du camp. L’étoile filante reste un moment du soir, sans gain. |
| 4 | « Le compagnon » = la chouette | La chouette est le guide ; les compagnons partent en expédition | La chouette est le guide. Les compagnons partent en expédition. L’avatar est l’image de profil. |
| 5 | Le feu garde sa taille ; son évolution reste à définir | Une jauge nourrie de bois | Une jauge nourrie **par les quêtes déposées au feu** (le geste du prototype). Le dessin garde sa taille ; seules la lumière et la couleur changent. |
| 6 | « Le marché » | « Le Comptoir marchand » | Le Comptoir. |
| 7 | La journée change le matin | La journée de jeu va de 4 h à 4 h | Bascule à 4 h, réglable. |
| 8 | Le périmètre V1 (`perimetre-v1`) exclut bâtiments, expéditions et social | Le document est la vision de la V1 | Tout entre dans la V1 : économie, Mont, Grand Sentier, bâtiments, expéditions, Forge, Hameau. Seules les Incursions restent hors V1. La date de la Toussaint est un choix à faire. |

## 3. Les failles corrigées

**Ressources.**
- Le minerai n’avait pas de rôle propre : il sort.
- L’Étincelle et l’Encouragement faisaient la même chose : ils deviennent un seul geste.
- Les fragments de lore ont un nombre fini : 60 en V1, 12 séries de 5. Une fois le Carnet complet, un fragment trouvé devient 15 or.

**Exploits.**
- **Farmer avec des quêtes minuscules.** Le gain est plein pour les 6 premières quêtes de la journée, puis petit (2 bois, 1 or, 2 XP). On reçoit toujours quelque chose. Simulé : une personne intense atteint l’Auberge 4 le jour 40, contre 71 pour une personne régulière.
- **Enchaîner les expéditions.** 2 par journée au plus, avec un butin modeste : le travail réel reste la source principale.
- **Valider, annuler, revalider.** Le prototype le gère déjà (« déjà comptée »). Avec le coffre, « Annuler » retire exactement ce que la quête y avait mis.

**Bien-être (public TDAH, enfants).**
- **Le Sommet à 4 sur 4 est exigeant.** Avec 4 habitudes réussies chacune 85 % du temps, il tombe un jour actif sur deux. C’est voulu, mais ça demande trois garde-fous :
  - les habitudes doivent être **petites**. L’écran de choix le dit et propose des exemples (boire un verre d’eau, 5 minutes de rangement…) ;
  - elles se changent chaque semaine ;
  - un jour sans Sommet ne retire rien, et on ne parle jamais de ce qui manque.
- **Une personne qui vient peu.** Avec 2 à 4 quêtes, 4 jours sur 7, elle atteint environ 6 paliers sur 20 par saison. C’est le principal choix à faire : le **joker** (une fois par semaine, 3 habitudes sur 4 suffisent) la ferait passer à 12 paliers.
- **Le feu en braises chez quelqu’un qui vient peu.** Les braises restent chaleureuses : la flamme est plus basse et plus rouge, le camp ne s’assombrit pas, aucun texte de manque.
- **Pas de compte à rebours.** Un sablier et une heure approximative (« prêt vers 18 h »).
- **Les familles dès le premier jour.** Le groupe et le Hameau ne dépendent d’aucun bâtiment.

**Durée de vie.**
- Le Grand Sentier se renouvelle toutes les 8 semaines, avec un thème et un décor de saison.
- Le Comptoir a une sélection du mois.
- Une personne régulière a tout construit vers le jour 130. La suite (Auberge 5, agrandir le camp) doit être prête avant que les premiers testeurs y arrivent : c’est un choix à faire.

## 4. Les règles (barème complet : `V.JEU.eco`)

**Deux ressources.**

| | Le bois | L’or |
|---|---|---|
| Rôle | Construire | Embellir et recruter |
| Gagné par | Chaque quête (10, +20 % si le feu est stable), le Grand Sentier, les expéditions, les surprises du coffre | Chaque quête (5), le Grand Sentier, les expéditions, chaque niveau de la personne (20) |
| Dépensé pour | Chantiers, charmes de la Forge, offrande au feu (facultative) | Objets du Comptoir, sélection du mois, compagnons (120 commun, 350 rare), l’Auberge (seul bâtiment qui demande aussi de l’or) |

**Une quête validée.**
- Elle rapporte 10 bois, 5 or et 10 XP, que ce soit une habitude ou non. Le bois et l’or partent dans **le coffre du camp** ; l’XP compte tout de suite.
- À partir de la 7e quête de la journée : 2 bois, 1 or, 2 XP.
- Une quête qui n’est pas une habitude clé retire aussi 1 h au chantier en cours.

**Le coffre du camp.**
- Il se remplit tout seul et se ramasse d’un toucher.
- Il n’a ni plafond ni date limite : il attend.
- Une fois par journée, en le ramassant, il y a 20 % de chance d’une petite surprise : pluie de pièces, fagot, étoile filante, fragment de lore ou objet.

**Le sac** (l’inventaire) : charmes, objets pas encore placés, fragments de lore, cosmétiques d’avatar, Étincelles dorées, lanternes du Hameau.

**Le Mont.**
- 4 habitudes clés, choisies par la personne (pour un enfant, avec le parent) et modifiables chaque semaine.
- Une habitude validée = un palier ; les 4 = le Sommet.
- Moins de 4 habitudes choisies : chaque place libre se remplit avec une quête.
- Le Mont repart à 4 h.

**Le Grand Sentier** (gratuit, sans piste payante) :
- une saison de 8 semaines, 20 paliers, un palier par Sommet ;
- les grandes récompenses tombent aux paliers 5 (un compagnon), 10 (un décor de saison), 15 (un compagnon rare) et 20 (un grand décor de saison et un titre) ;
- entre elles : du bois et de l’or, des charmes, des objets du camp, des cosmétiques d’avatar, des Étincelles dorées, une lanterne du Hameau ;
- au-delà du 20e palier, chaque Sommet met 20 bois et 10 or dans le coffre ;
- la saison 1 reprend des objets du calendrier des 30 journées.

**Le feu**, une jauge de 10 à 100 :
- +10 par quête déposée, −2 par heure, jamais sous 10 ;
- braises (10 à 29) : gains de base ; stable (30 à 79) : +20 % de bois ; ardent (80 et plus) : un objet de plus à la prochaine expédition, ce qui coûte 20 points ;
- offrande facultative : 10 bois = 10 points ;
- après 2 jours sans quête, la première quête remonte le feu à 40.

**Le niveau de la personne.** Il faut 60 XP pour passer au niveau 2, puis 20 XP de plus à chaque niveau. Chaque niveau se fête et rapporte 20 or.

**Les bâtiments.** Le niveau de l’Auberge est le niveau du camp (1 à 4).

| Bâtiment | Arrive | Construire | Niveau 2 | Niveau 3 | Niveau 4 |
|---|---|---|---|---|---|
| L’Auberge (la tente) | Au départ | Déjà là | 100 bois + 20 or · 15 min | 650 + 220 or · 4 h | 1 800 + 600 or · 12 h |
| Le Comptoir | Au départ | Déjà là | 90 · 10 min | 360 · 2 h | 1 000 · 8 h |
| Le Hall des expéditions | Au départ | Déjà là | 90 · 10 min | 360 · 2 h | 1 000 · 8 h |
| La Forge | Auberge 2 | 50 · 5 min | 90 · 10 min | 360 · 2 h | 1 000 · 8 h |
| Le Hall social | Auberge 2 | 50 · 5 min | 90 · 10 min | 360 · 2 h | 1 000 · 8 h |

Les règles des chantiers :
- aucun bâtiment ne dépasse l’Auberge ;
- pour monter l’Auberge, tous les bâtiments déjà arrivés doivent être à son niveau ;
- 1 chantier à la fois, 2 dès l’Auberge 3 ;
- un chantier fini attend l’ouverture du camp, sans notification ;
- rien ne s’achète avec de l’argent.

**Les expéditions** (elles ne peuvent pas échouer) :
- 1 h au départ, 4 h au Hall 2, 8 h au Hall 3 ;
- 1 compagnon offert, 1 à 4 places selon le niveau du Hall ;
- 2 expéditions par journée au plus ;
- butin d’un compagnon : 8 bois et 4 or (1 h), 20 et 10 (4 h), 30 et 15 (8 h) ; chaque compagnon en plus ajoute 15 % ;
- fragment de lore : 25 % de chance (4 h), 50 % (8 h) ;
- le butin va dans le coffre du camp et dans le sac ;
- la chance d’un objet rare ne dépasse jamais 50 % ;
- une notification au retour, en journée seulement, désactivable.

**La Forge.** Des charmes en bois, à emporter en expédition :

| Charme | Forge | Coût | Effet |
|---|---|---|---|
| Porteur | 1 | 40 bois | +20 % de bois et d’or au retour |
| Fouineur | 2 | 40 bois | +20 % de chance d’un objet rare |
| Éclaireur | 3 | 60 bois | Retour 25 % plus tôt |

On emporte 1 charme par expédition, 2 dès la Forge 3. Le Grand Sentier en offre aussi.

**Le social.**
- **Le groupe** : Famille (parent et enfant) ou Amis, 8 personnes au plus. Il ne dépend d’aucun bâtiment.
- **Le Hameau** : on y visite les camps du groupe, sans y toucher. On y voit le Sommet du jour de chacun, jamais de chiffres, jamais de classement.
- **L’Étincelle** :
  - après son Sommet, on peut en offrir une par jour à un proche ;
  - une Étincelle dorée, gagnée sur le Sentier, s’offre n’importe quel jour ;
  - elle donne 20 points au feu du proche ;
  - s’il atteint son Sommet le jour même, chacun reçoit 10 bois et 10 or dans son coffre.
- **Le Hall social**, à l’Auberge 2, ajoute des extras à chaque niveau :
  - niveau 2 : les expéditions communes ;
  - niveau 3 : les cadeaux d’objets ;
  - niveau 4 : un décor partagé du Hameau.
- **Les lanternes du Hameau** (récompense du Sentier) décorent le Hameau commun.

## 5. Ce qu’on prend à Clash of Clans, et ce qu’on laisse

| Clash of Clans | On prend | On laisse |
|---|---|---|
| Deux ressources au début (or, élixir) ; l’élixir noir n’arrive qu’à l’hôtel de ville 7 | Bois et or, chacun avec son rôle | Une 3e ressource dans la V1 |
| Les mines remplissent un réservoir qu’on vient ramasser | Le coffre du camp et le geste de ramasser | La production sans travail réel, et les réservoirs pleins qui perdent le surplus |
| L’hôtel de ville limite les bâtiments et en débloque de nouveaux | L’Auberge ; 3 bâtiments au départ, 2 à l’Auberge 2 | — |
| Des bâtisseurs en nombre limité | 1 chantier, puis 2 | Les bâtisseurs payants |
| Des améliorations de quelques secondes au début, puis de plusieurs jours | 10 à 15 min au début, 12 h au plus | Les chantiers de plusieurs jours |
| Les gemmes accélèrent | Une vraie quête accélère | L’argent |
| Le Gold Pass (piste gratuite et piste payante) | Le Grand Sentier, gratuit et complet | La piste payante |
| Le bonus d’étoiles du jour | Le Sommet | — |
| Les jeux de clan, les dons du château | Les lanternes du Hameau, l’Étincelle | Les classements, les attaques, les boucliers |
| Le niveau d’XP, surtout honorifique | Le niveau de la personne | — |

**Ce que font les autres** :
- **Finch** : un objectif rapporte de l’énergie, l’oiseau part à l’aventure, aucune punition. Nos expéditions jouent ce rôle, avec un premier départ dès le premier jour.
- **Habitica** : une quotidienne manquée fait perdre de la vie, et les groupes paient les oublis des autres. Beaucoup de personnes TDAH décrochent après une mauvaise semaine. C’est ce qu’on évite.
- **Duolingo** : la série qui casse crée du stress. Notre Sentier ne remet rien à zéro.
- **Animal Crossing** : deux monnaies aux rôles distincts, aucune punition sérieuse. C’est la même logique que notre bois et notre or.

## 6. Les choix à faire

Voir `03-CHOIX-A-FAIRE.md`. Chacun a une valeur par défaut déjà en place dans le prototype et un réglage pour l’essayer.

Sources :
- [Clash Ninja · durée de l’hôtel de ville 2](https://www.clash.ninja/guides/how-long-to-max-th-2)
- [Low End Mac · bâtiments et ressources de Clash of Clans](https://lowendmac.com/2015/introduction-to-clash-of-clans-part-2-buildings-and-resources/)
- [WhistleOut · test de Finch](https://www.whistleout.com/CellPhones/Apps/finch-self-care-app-review)
- [HabitBox · test de Habitica](https://habitbox.app/blog/habitica-review) (écrit par un concurrent, à lire avec recul)
