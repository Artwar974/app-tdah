# Passe du 20/10/2026 · 03 · La conception

Ce document dit **ce qu'on a décidé le 20/10 et pourquoi** : le camp (torches, coffre, bandeau, badges), les expéditions en parcours, le résumé du matin, les quêtes d'hier, les habitudes libres, le Grand Sentier à 12 paliers par mois. Les fichiers touchés, les contrôles et ce qui reste sont dans `04-ETAT.md`. La passe technique du même jour (PixiJS 8.22.0, un seul moteur) est dans `00-LISEZ-MOI.md`, `01-MOTEUR.md` et `02-INTEGRATION-VRAIE-APP.md`.

**Le fil.** Le 19/10 a donné un camp qui récompense pendant l'action. Le 20/10, le fondateur a relu le camp et a dicté le système d'expédition qu'il voulait (une note vocale, au propre au § 8). Cette passe met le camp au propre et fait des expéditions un petit jeu à part entière, compatible avec tout ce qui existe : le Ponton, les compagnons, les charmes de la Forge, le coffre, le Grand Sentier.

**Références.** On reprend des systèmes, jamais des textes, des dessins, des sons ni des noms.

## 1. En bref

- **Le camp dit tout de suite ce qui attend** : le Ponton et le Kiosque sont là dès le premier jour ; la première expédition part dans le quart d'heure ; le Kiosque s'ouvre après 5 expéditions terminées.
- **Quatre torches sur le chemin du Mont**, une par habitude validée ; la quatrième fait le Sommet et sa fête. Un joker par semaine.
- **Le coffre est l'inventaire** : le bois et l'or vont droit aux compteurs du haut ; le coffre posé devant la tente range le reste. Plus de coffre d'attente, plus de symbole de sac.
- **Les expéditions en parcours** : des pas, trois voies à chaque pas avec un indice et une difficulté, quatre façons de partir, rentrer quand on veut avec sa besace, parfois une créature au bout.
- **Le matin, hier en quelques cartes** ; une quête pas validée se **valide après coup** (ses gains, sans palier) ou se **relance**.
- **Le Grand Sentier : 12 paliers par mois** et un bonus de fin de saison. **Les habitudes se changent quand on veut.** L'app s'ouvre sur le camp.
- **Une passe sur l'interface** : des badges discrets sur les bâtiments, les niveaux dits par un toast, pas de brume le matin, un soir tamisé, les mouettes à l'échelle ; un mot, un sens.

## 2. Les expéditions en parcours

### 2.1 Le principe

Le compagnon part du Ponton et suit un **chemin** fait de **pas**. À chaque pas, **trois voies** s'ouvrent devant lui. Chaque voie dit, par un indice, **le type de récompense** qu'elle promet (une clairière à bois et quelques pièces ; une cabane oubliée, un objet ; un vieil atelier, un charme ; une pierre gravée, un fragment de légende ; des traces fraîches, une créature) et **sa difficulté** (voie sûre, voie moyenne, voie risquée : trois crans). Le compagnon met quelques minutes par pas. Une voie réussie met sa récompense dans **sa besace** ; une voie manquée le ramène au camp plus tôt, **avec la moitié de sa besace**. On peut **le faire rentrer à tout moment** : il garde tout ce qu'il a trouvé. Au dernier pas, une fois sur cinq, une voie de plus mène à **une créature** : si elle le suit, c'est un compagnon de plus au Ponton.

### 2.2 Quatre façons de partir

| Façon | Ce que fait le compagnon |
|---|---|
| **Je choisis** | Il attend notre choix à chaque pas (la pastille du camp dit « Il t'attend au Ponton »). C'est le mode « donjon » : on décide voie par voie. |
| **Prudent** | Il prend les voies sûres, tout seul. Moins de butin, presque jamais d'échec. |
| **Curieux** (par défaut) | Il prend les voies moyennes. |
| **Hardi** | Il prend les voies risquées : plus de butin, plus d'échecs. S'il sent une créature, il y va. |

On choisit la façon de partir avant le départ ; on peut la changer en cours de route. Sans nous, le compagnon avance et rentre tout seul : **tout se simule quand on n'est pas là**, et le résultat est le même sur tous les appareils (une graine par parcours).

### 2.3 Ce qui s'adapte

- **Le Ponton** ouvre des chemins plus longs (3, 5, 7, 9 pas) et plus de places (1 à 4 compagnons).
- **Les charmes de la Forge** et **le niveau de la Forge** augmentent les chances de réussite ; un charme s'emporte depuis le coffre, en un toucher.
- **La difficulté est en faveur du joueur** : une voie sûre réussit 95 fois sur 100, une voie moyenne 80, une voie risquée 60 ; on gagne plus souvent qu'on ne perd, et **même en perdant on rapporte quelque chose** (la moitié de la besace, jamais moins que rien).
- **Les créatures** arrivent au rythme des parcours menés jusqu'au bout : avec deux départs par jour et une chance sur cinq, à peu près une créature tous les deux ou trois jours. C'est le rythme demandé ; à observer avec de vrais joueurs.

### 2.4 Les chiffres (barème 5, `commun/athena-economie.js`)

| Réglage | Valeur |
|---|---|
| Pas par parcours (Ponton 1 à 4) | 3 · 5 · 7 · 9 |
| Minutes par pas (Ponton 1 à 4) | 3 · 6 · 9 · 12 |
| Voies à chaque pas | 3 (une voie de plus au dernier pas, 20 %, vers une créature) |
| Réussite d'une voie sûre · moyenne · risquée | 95 % · 80 % · 60 %, plus 10 % par charme emporté et 3 % par niveau de Forge |
| Récompense d'une voie « ressources » (sûre · moyenne · risquée) | 7 · 11 · 17 bois et 3 · 5 · 8 or, +12 % par pas, × 0,8 en Prudent et × 1,4 en Hardi |
| Voie manquée | retour avec la moitié de la besace |
| Retour volontaire | 1,5 min par pas déjà fait |
| Départs par journée | 2 |
| Premier parcours | 3 pas de 3 min + 4,5 min de retour : environ 14 minutes |

### 2.5 Les écrans

- **Le Ponton › Partir** : la façon de partir (quatre boutons), le charme à emporter, « Partir · 3 pas de 3 min ». En chemin : une carte par compagnon (son pas, sa besace, les pas déjà faits en icônes, « Rentrer au camp »). Quand il attend : trois cartes « voie » avec l'indice, la difficulté en crans et « Par là ».
- **La pastille du camp** : « En route · pas 1 sur 3 », « Il t'attend au Ponton », « Il rentre vers 10 h 45 » ; la toucher ouvre le Ponton.
- **Le retour** : la carte de la besace avec la fête des grands moments ; « Une voie l'a arrêté : il est rentré plus tôt, avec la moitié de sa besace » ; « Une créature l'a suivi ».
- **Dans la scène** : le compagnon part par le ponton et revient par le ponton, comme pour les expéditions d'avant (événements `expedition-depart` et `expedition-retour`).

## 3. Le camp

- **Les torches** : quatre torches à égale distance sur le chemin du Mont, de bas en haut, la dernière avant le temple. Une habitude validée en allume une ; la quatrième fait le Sommet (la fanfare, la danse du minotaure, la carte du palier). Dessinées par le code avec la planche du flambeau en attendant leur dessin (brief 17).
- **Le coffre** : posé au pied de la tente, dessiné par le code (brief 06 pour son dessin). Le toucher ouvre l'inventaire : charmes, objets à placer, fragments, avatar, Étincelles. Le bois et l'or ne passent plus par lui : ils volent droit vers les compteurs du haut quand on valide.
- **Le bandeau du Grand Sentier** : en haut du camp, trois lignes (la saison, la barre des 12 paliers, « Prochain : … »).
- **Les bâtiments** : un petit panneau de 32 px près du bâtiment dit « à construire », « chantier » ou « prêt » ; jamais un bouton « Construire » posé sur le bâtiment. Un niveau gagné se dit par un toast (« Le Comptoir passe au niveau 2 »).
- **La journée** : pas de brume le matin ; le soir plus doux et tamisé ; les mouettes plus petites, à l'échelle du ponton.
- **Le premier jour** : le Ponton est construit et le Kiosque posé. Après la première quête, la carte du Ponton (« Ton compagnon part en expédition pendant que tu fais tes quêtes »). Le Kiosque s'ouvre après 5 expéditions terminées : le joueur voit ce qu'il attend.

## 4. Le matin et les quêtes d'hier

- **Le résumé du matin** s'ouvre à la première ouverture de la journée (après 4 h) par-dessus le camp : hier en quelques cartes (quêtes validées, Sommet ou pas, expéditions rentrées, surprise de la nuit). Rien si hier était vide.
- **Les quêtes d'hier pas validées** y sont listées, et aussi dans Journal › Quêtes (« Hier, pas validées »). Deux boutons : **« Valider après coup »** donne ses gains (bois, or, XP) sans palier du Mont, sans feu, sans Sentier : hier reste hier ; **« Relancer »** met la quête devant dans la journée.
- **Pourquoi sans palier** : le Mont et le Sentier récompensent le jour même ; valider après coup répare un oubli, il ne rejoue pas la journée.

## 5. Les décisions du 20/10 (toutes réversibles, par « 20/10 » dans Décisions)

| Décision | Ce qu'elle tranche |
|---|---|
| Le coffre est l'inventaire ; le bois et l'or vont droit aux compteurs | Remplace le choix 3 |
| Les expéditions en parcours | — |
| Le Ponton et le Kiosque dès le premier jour ; le Kiosque après 5 expéditions | Remplace le choix 10 |
| Le résumé du matin | — |
| Les quêtes d'hier : après coup ou relancer | — |
| Le Grand Sentier : 12 paliers par mois, un bonus de fin de saison | Choix 2 (C) |
| Le Sommet : 4 habitudes et un joker par semaine | Choix 1 (B) |
| Les habitudes se changent quand on veut | Choix 4 (B) |
| L'app s'ouvre sur le camp | Choix 6 (A) |
| Après l'Auberge 4 : les saisons du Sentier, une saison et sa récompense chaque mois | Choix 8 (C) |
| Les torches du Mont | — |
| Le camp discret (badges, toasts, brume, soir, mouettes) | — |

Les choix 5, 7, 9, 12 à 16 et 18 à 20 restent ouverts ; le choix 7 (les récompenses de la saison 1) porte maintenant sur 12 paliers.

## 6. Un mot, un sens

| Mot | Sens, et rien d'autre |
|---|---|
| le coffre | l'inventaire (charmes, objets, fragments, avatar, Étincelles) |
| les réserves | le bois et l'or, en haut du camp |
| la besace | ce qu'un compagnon rapporte d'un parcours |
| un pas | une étape du chemin |
| une voie | l'un des trois chemins d'un pas |
| le Sommet | les 4 habitudes du jour (ou 3 avec le joker) |
| le palier | une marche du Mont (4 par jour) ou du Grand Sentier (12 par saison) |

## 7. Ce qui reste ouvert

- Le rythme des créatures (une tous les deux ou trois jours) et les chances de réussite : à observer avec des ados et des parents, puis à régler dans le barème.
- Les dessins : les torches, le coffre, les cinq voies, trois créatures de plus, la bannière du matin (`generation-images/`, briefs 06, 17, 23, 24, 25).
- Les Incursions ne changent pas ; elles seront refaites plus tard sur la même scène.

## 8. La note vocale du fondateur, au propre

Les expéditions se jouent comme un petit donjon : un labyrinthe de récompenses. Ton compagnon met un certain temps pour aller d'une récompense à la suivante ; à chaque fois qu'il en obtient une, il a le choix entre trois chemins. Comme dans ce genre de jeu, de petites indications disent à peu près quel type de récompense attend dans tel ou tel chemin, et un petit niveau de difficulté dit « là, il y a une grosse récompense, mais c'est risqué : il faut être bien préparé ».

À tout moment tu peux décider de rentrer à la base ; le retour prend aussi un certain temps. Tu gardes alors tout le butin déjà trouvé. Si tu veux pousser, tu peux pousser, et à la fin ce sont les meilleures récompenses. Selon les chemins pris, au bout de l'expédition tu as une chance de pouvoir choisir un chemin qui mène à une nouvelle créature : à peu près 20 % si tu vas jusqu'au bout. Ainsi on débloque une nouvelle créature tous les deux ou trois jours environ ; ce n'est pas un choix à trancher aujourd'hui, c'est à régler ensemble en jouant.

Tout cela doit pouvoir se simuler avec des choix optimaux quand on n'est pas là, et être généré de manière procédurale, avec une difficulté adaptée à notre niveau pour qu'on gagne quand même un peu plus souvent ; et même si on perd, on rapporte quelque chose.

Dans ces parcours, tu choisis : soit ta créature t'attend après chaque étape pour ta prochaine décision ; soit tu la mets en mode « facile », « moyen » ou « difficile » et elle prend les choix toute seule. En facile elle sera tranquille mais ne prendra peut-être pas les choix les plus payants ; en difficile elle prend des risques. Ce système doit s'adapter aux améliorations des bâtiments et rester compatible avec tout ce qui est déjà en place.
