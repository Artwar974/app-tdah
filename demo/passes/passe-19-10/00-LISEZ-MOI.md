# Passe du 19/10/2026 · le camp qui récompense pendant l'action

Neuf lots en une passe : les bugs du 17/10, un seul système d'animation, la récompense pendant l'action, le Grand Sentier en pass de saison, sept nouvelles fonctions, les personnages, le décor, la passe UI/UX, le barème 4, puis la doc, les choix 13 à 19 et les dessins à commander. Une seconde passe de relecture a suivi la publication (§ 9), puis quatre retours du soir (§ 10). Ce fichier est le compte rendu ; `01-CONCEPTION.md` dit ce qu'on a décidé et pourquoi ; `ETAT.md` est l'état lot par lot, tenu pendant la passe.

**À lire d'abord**
1. **Accueil.dc.html** : le jeu en une page, avec les sections « Le Grand Sentier » et « Ce qui nous distingue », les 19 choix (17 encore ouverts depuis le soir du 19/10), les dessins à commander avec leurs fiches.
2. **Decisions.dc.html** : les décisions du 19/10 (par « 19/10 », réversibles) et les choix 13 à 19.
3. **Le prototype** : les parcours à essayer, plus bas. Le configurateur a un groupe « Choix à faire (19/10) ».

## 1. Ce qui est fait, lot par lot

| Lot | Fait |
|---|---|
| 0 · Bugs | Les 16 bugs relevés sont corrigés (tableau au § 2), puis une chasse sur les 86 écrans × 4 (Ado et Parent, deux DA, 390 × 844 et 360 × 640) : aucune erreur console, aucune cible sous 44 px, aucun texte coupé. Le vérificateur a cinq règles de plus (§ 8). |
| 1 · Animation d'interface | `commun/athena-motion.css` (jetons de durée, courbes, feuilles, boutons, compteurs, vols, toasts, cartes, onglets, mouvement réduit) et `commun/athena-motion.js` (compteurs qui défilent, ressources qui volent, poignée des feuilles, vibrations, trois niveaux de fête). Les pages n'animent plus que transform, opacity et des filtres légers. DA › Le mouvement montre chaque composant. |
| 2 · Récompense pendant l'action | Le minotaure réagit dans les 150 ms (cinq réactions, jamais deux fois la même d'affilée) et danse au Sommet ; les quatre lumières du Mont s'allument sur la montagne ; sept sons de validation, un son par palier du coffre, la fanfare du Sommet (`commun/athena-sons.js` 3.0) ; vibration de 10 ms, motif court au Sommet ; le bois et l'or volent vers le coffre ; « À demain » le soir. |
| 3 · Grand Sentier | Un pass de saison gratuit : quatre saisons (`V.SAISONS`, couleurs AA dans les deux DA, décor teinté), le ruban du Sentier à la place de la pastille, l'écran refait (bannière, bande horizontale centrée sur le palier, « Tu es ici », « Revenir à mon palier », détail d'une récompense), les cartes de palier (retournement, cadre de la saison, fête des grands paliers) et la carte de fin de saison (« Tout reste à toi »). |
| 4 · Nouvelles fonctions | 4.1 la version courte (champ et trois idées à la création, dans les options et la barre, feuille d'olivier) ; 4.2 l'appui long de 0,5 s avec un anneau (choix 16), maquettes widget et notification dans Écrans › Plus tard ; 4.3 la promesse du camp (sceau 1,5 s, « Je promets » en mouvement réduit, « Passer ») ; 4.4 le retour sans reproche (le minotaure court saluer, braises, coffre, le feu repart) ; 4.5 le défi du Hameau (guirlande, feuille, carte, fête ; le choix 11 est remplacé) ; 4.6 les quêtes de saison (trois par mois, bloc du Sentier, « Une idée de la saison ») ; 4.7 la pastille « Retour vers 15 h », la carte du butin. |
| 5 · Personnages | La caméra du camp (vue rapprochée par défaut, vue large en option : choix 17 ; glissement sous une feuille ouverte, regard vers le Mont au Sommet, suivi du bateau ; rien en mouvement réduit) ; la marche (départ tourné, plus lent sur le sable et le ponton) ; la vie au repos (un geste toutes les 6 à 14 s, jamais le même deux fois : mer, étirement, se gratte, feu, tapote, banc, coffre) ; les clignements ; le mouvement secondaire (queue, pagne, bras) ; l'au revoir avant d'embarquer, le signe de la main, le bâillement, l'étirement au réveil ; les compagnons 2 et 3 au camp (minotaures teintés : taille, pas, habitudes) et la rencontre du visiteur ; `atelier.html` (six états, clignement, secondaire, « Copier les réglages ») ; `Camp-scene.html` (caméra, gestes, visiteur). |
| 6 · Décor | Une seule rafale puis le calme, la fumée suit le vent ; la brume de 6 h à 8 h ; les lucioles près de la lavande et du laurier, les étoiles, l'étoile filante au Sommet ; les mouettes qui se posent sur le ponton ; le feu en jauge (braises, stable, ardent) par la lumière et la couleur seulement ; des transitions continues (le mélange des ombres soleil/feu au crépuscule) ; les copeaux des chantiers et la fête de fin ; l'arrêt quand l'onglet est caché ; le réglage « Animations légères » (Carnet et espace parent) ; `outils/fps-test.html` mesure la boucle du moteur. |
| 7 · UI/UX | Écran par écran : habitudes en lignes-interrupteurs, sac à cinq onglets (rangée qui défile), Carnet des légendes en grille, plan du camp à crans, feu en une phrase, idée de la saison après l'aide, haut du camp empilé (rien sous une feuille), couvercle du coffre, liseré doré des habitudes clés, Comptoir (l'objet acheté vole jusqu'à sa place), Ponton à trois durées, Forge (le forgeable en premier), Hameau en rangée d'avatars, Étincelle en deux temps, Journal, Historique sans série, espace parent (saison et défi), états vides, une seule zone de message. Règles communes : un style de bouton principal par écran, titres au même endroit, marges multiples de 4, chiffres tabulaires. |
| 8 · Barème 4 | `V.JEU.eco` version 4 : `sentier.saisons`, la version courte, le défi, les quêtes de saison ; `valider` accepte `{ courte: true }`, `defiEtat`, `defiAvancer`, `defiRecompenser` (refuse une guirlande incomplète), `quetesSaison`, `validerQueteSaison`, `completer` (migration douce), `VARIANTES` (choix 13 et 14) ; 68 règles dans `outils/economie-controles.js` ; la simulation a les profils avec versions courtes et quêtes de saison. |
| 9 · Doc, choix, dessins | Accueil (« Le Grand Sentier », « Ce qui nous distingue », la boucle, le social, ce qui fait revenir, le camp vivant, le compteur des choix sans le 11, les fiches des dessins) ; Écrans (cinq écrans de plus, les descriptions des écrans changés, `nouv` partout, `fige=1`) ; Mécaniques (saisons, fêtes, caméra, personnages, décor ; le barème 4 généré depuis `V.JEU.eco`) ; Décisions (vingt-deux décisions du 19/10, les choix 13 à 19, le 11 remplacé) ; le configurateur « Choix à faire (19/10) » ; DA (saisons dans la palette avec leur contraste, cadres des grandes récompenses, composants du 19/10) ; les dessins n° 10 à 18 avec leurs fiches et le dossier `generation-images/` ; `V.CHANGEMENTS`, `LISEZ-MOI.md`, `Archives/INDEX.md`. |

## 2. Les 16 bugs du Lot 0, puis ceux trouvés en route

| # | Corrigé | Comment |
|---|---|---|
| B1 | Oui | Une carte qui donne quelque chose ne se ferme jamais seule et ne se ferme pas pendant sa première seconde ; un toast reste 5 s et se met en pause au focus ; `fige=1` fige l'état venu d'une adresse jusqu'au premier toucher, mis par défaut sur tous les liens d'Écrans. |
| B2 | Oui | Chaque `q` de `V.ECRANS` dit son état de nouveautés (`nouv=tout` après le Mont, `nouv=0` au premier lancement, `nouv=1` pour l'aide du geste) ; le vérificateur refuse un écran sans `nouv=`. |
| B3 | Oui | Plus aucune série : « 21 jours ce mois-ci », « Tes meilleurs jours : le vendredi et le lundi », la semaine ; l'Historique n'a plus ni points allumés ni flamme. |
| B4 | Oui | Un seul historique de démo chargé dans l'état, lu par le Carnet et l'Historique. |
| B5 | Oui | Une seule date « aujourd'hui » pour la démo, lue par l'agenda, l'historique, le Carnet, la saison du Sentier et l'espace parent. |
| B6 | Oui | Une seule zone de messages en haut : un toast ou une erreur remplace la pastille de nouveauté, ne la chevauche jamais. |
| B7 | Oui | La bulle du projecteur évite le haut, la barre et la pastille des quêtes. |
| B8 | Oui | Le curseur de la jauge du feu passe sous le texte (puis, Lot 7, le feu devient une phrase). |
| B9 | Oui | « Journée validée » ne s'ouvre plus que depuis Écrans › Remplacés, avec la bande « Remplacé le 14/10 par le Sommet ». |
| B10 | Oui | « Le Comptoir », onglets « À acheter » et « Mes objets » ; le glossaire suit. |
| B11 | Oui | Bulle « 12 bois · 5 or » avec les deux icônes ; le coffre respire quand il attend ; la chouette dit « Touche le coffre pour ramasser » la première fois. |
| B12 | Oui | Un fondu sur le bord droit de la rangée des catégories et un léger décalage à l'ouverture. |
| B13 | Oui | Visiter montre le vrai camp du proche, dessiné par le moteur en lecture seule (Auberge, bâtiments, objets, compagnon, lanterne, Sommet du Mont), sans HUD ni barre. |
| B14 | Oui | La liste des nouveautés s'ouvre en haut, la prochaine en tête dans un encadré. |
| B15 | Oui | Chaque icône de quête a son trait dans la Veillée ; le vérificateur refuse une icône de repli dans les journées types et les catégories, dans les deux jeux. |
| B16 | Oui | La prochaine nouveauté tient en une ligne, sous le ruban du Sentier, cachée quand une feuille est ouverte (Lot 7). |

Trouvés et corrigés en route : au crépuscule, l'ombre d'un objet basculait d'un coup de l'ombre du soleil à celle du feu (un saut de couleur vers 19 h 30) : les deux se mélangent en continu ; le bouton « Acheter » du Comptoir ne transmettait pas l'événement, rien ne volait ; le réglage « Animations légères » manquait dans la liste rendue par l'onglet Carnet du Journal ; à 390 px, les cinq onglets du sac coupaient « Fragments » et « Étincelles » (la rangée défile, l'onglet choisi est amené en vue) ; au Ponton, le charme du sac n'était pas reconnu (`charmeOk`) ; le geste du banc visait une case occupée par le banc lui-même ; la table des courbes de DA › Le mouvement faisait défiler la page à 390 px ; l'Accueil nommait l'app de référence dans « Pour qui » ; le choix 11, remplacé, comptait encore parmi les choix ouverts ; enfin, aux contrôles finaux, le moteur des pages (support.js) appelle `componentDidUpdate` sans l'état précédent, et le prototype le lisait quand même : le Sentier se recentrait à chaque rendu (« Revenir à mon palier » ne pouvait jamais apparaître) et la garde d'une seconde des cartes repartait à chaque rendu ; le prototype garde maintenant lui-même son état précédent (`tools/patch_1910_p3.py`). Le minotaure n'a de dessins de tête qu'en vue de face trois-quarts : le clignement se voit dans cette vue (atelier) et pas de dos, ce n'est pas un bug.

## 3. Ce qui n'a pas pu être fait, et pourquoi

- **Les dessins ne sont pas générés** : la règle 7 interdit d'inventer un dessin. Chaque dessin a sa fiche (Accueil › Dessins à commander) et le dossier `generation-images/` (briefs, prompts, références).
- **La performance est mesurée sur la boucle JavaScript du moteur**, dans un navigateur sans accélération matérielle (swiftshader), pas sur un téléphone : la boucle reste sous 2 ms en moyenne, loin des 10 ms, mais les 60 images par seconde réelles se vérifient sur un appareil.
- **Les parcours complets Ado puis Parent, de jour puis de nuit, dans les deux DA** ont été joués par les tests des lots (profil Ado, DA Figures, et la Veillée pour les écrans) et par la chasse aux bugs (86 écrans × 4) ; le contrôle final rejoue les suites de tests et les pages, pas chaque parcours à la main dans chaque combinaison.
- **Le choix 19** (modèle économique) n'a rien dans le prototype, comme demandé : aucun réglage, aucun chiffre.

## 4. Les choix tranchés seul

- La vue rapprochée est à × 1,12 et non × 1,3 : à × 1,3, le Mont et le ponton sortaient du cadre sur 390 × 844 ; `V.JEU.camera` se règle.
- Dans Aménager, le prototype passe en vue large pour que les poignées restent dans le repère du téléphone.
- Les compagnons 2 et 3 sont des minotaures teintés (taille, pas, habitudes) en attendant leurs dessins (fiche n° 5).
- Le choix 13 B suit la lettre du tableau : « moitié moins de bois et d'or », même XP ; le barème garde aussi la variante « petit gain » du Lot 8. Les variantes des choix 13 et 14 sont des données du module (`AthenaEconomie.VARIANTES`), jamais écrites dans une page.
- Le choix 14 B envoie le bois et l'or au coffre de chacun ; le C ne donne rien et la carte le dit sans chiffre.
- Le sac garde ses cinq onglets dans une rangée qui défile plutôt que des libellés raccourcis (un mot, un sens).
- Au Ponton, la carte « Partir pendant que je travaille » garde son bouton secondaire ; le bouton principal unique reste « Partir · 1 h, retour vers … ».
- Les dessins gardent l'ordre du 14/10 (1 à 9) ; le décor et la récompense du palier 20 de la saison 1 restent les n° 8 et 9, complétés ; les saisons 2 à 4 sont les n° 11 et 12.
- Les décisions des lots 1 à 8 sont enregistrées par « 19/10 », réversibles ; deux d'entre elles renvoient à un choix à confirmer (caméra : choix 17 ; barème 4 : choix 13 à 15).

## 5. Le barème 4

Ce qui change dans `V.JEU.eco` (copie exacte de `AthenaEconomie.DEFAUT`, vérifiée par le simulateur) :

| Clé | Valeur | Sens |
|---|---|---|
| `version` | 4 | |
| `quete.courte.gains` | `identiques` | La version courte compte comme la quête (choix 13 A ; `moitie` et `petit` existent). |
| `defi` | 3 par membre, de 12 à 24, récompense `decor-semaine` | Le défi du Hameau (choix 14 A). |
| `saisonQuetes` | 3 par mois, 5 or et 1 fragment chacune | Les quêtes de saison (choix 15 A). |
| `sentier.saisons` | cycle oliviers, vendanges, lanternes, semailles ; fin garde tout ; grands paliers 5, 10, 15, 20 ; décor au 10, grand décor au 20 | Les saisons du Grand Sentier. |
| `feu.retour` | après 2 jours, le feu remonte à 40 | Le retour sans reproche (Lot 4). |

Les jalons simulés (médiane de 20 tirages sur 180 jours, `test/sim4.json` et `test/sim5.json`) :

| Profil | Barème 3 (17/10) | Barème 4 (19/10) | Cibles du 17/10 |
|---|---|---|---|
| Léger | A2 jour 6 · A3 jour 48 · A4, camp, Sentier au-delà de 180 jours · 6 paliers de saison | identiques ; 105 versions courtes, 6 quêtes de saison, or en réserve 703 (677 avant) | — |
| Régulier | A2 jour 2 · A3 jour 18 · A4 jour 68 · camp complet jour 124 · Sentier fini jour 45 · 25 paliers | identiques ; 77 versions courtes, 18 quêtes de saison, or en réserve 3 021 (2 661 avant) | A3 14 à 28 · A4 63 à 84 · camp 100 à 150 · Sentier 35 à 56 : dans les cibles |
| Intense | A2 jour 1 · A3 jour 10 · A4 jour 39 · camp jour 71 · Sentier jour 24 · 46 paliers | identiques ; 18 quêtes de saison, or 6 598 | — |

Avec le choix 13 B (moitié) : Régulier A3 jour 19, A4 jour 70, camp jour 127, Sentier jour 44 ; Léger A3 jour 54 au lieu de 48. Avec le choix 15 B (aucune quête de saison) : les jalons ne bougent pas, l'or en réserve de Régulier passe à 2 661 et Léger finit avec 21 fragments au lieu de 27. La migration : `completer` ajoute les champs du barème 4 à une sauvegarde du format 2 sans rien lui retirer.

## 6. La performance de la scène

`outils/fps-test.html`, colonne « Boucle du moteur (moyenne) », 390 × 844, 19 h 30, tout le camp construit, 3 compagnons, navigateur sans accélération matérielle :

| | Moyenne | Médiane | p95 | Max |
|---|---|---|---|---|
| Avant le Lot 6 | 1,54 ms | 1,3 ms | 3,8 ms | 9,4 ms |
| Après le Lot 6 | 1,51 ms | 1,2 ms | 4,3 ms | 10,9 ms |

Pas de régression ; loin des 10 ms par image. Le moteur s'arrête quand l'onglet est caché ; « Animations légères » retire feuilles, sauts, nuages, planeurs et poussières et divise les lucioles par deux.

## 7. Les dessins à commander, dans l'ordre

Les fiches complètes (format, angle, lumière, style, ce qu'il montre, morceaux de la marionnette) sont dans l'Accueil › Dessins à commander, et en version longue dans `generation-images/briefs/`. Règle commune : PNG à fond transparent, plongée trois-quarts comme le camp, lumière en haut à gauche, le décor peint du camp (Antiquité légère), aucun nom d'artiste.

| # | Dessin | Format |
|---|---|---|
| 1 | Le Comptoir | 4 niveaux de 360 × 300 px |
| 2 | Le Ponton | un tableau 160 × 200 px et 4 détails 240 × 200 px |
| 3 | La Forge | 4 niveaux de 360 × 320 px |
| 4 | Le Kiosque du Hameau | 4 détails de 240 × 240 px |
| 5 | 2 compagnons (un commun, un rare) | les morceaux de la marionnette, 5 vues, environ 330 px de haut |
| 6 | Le coffre du camp | 3 états de 160 × 140 px, le couvercle séparé |
| 7 | Le sac | icône 48 px et illustration 240 px |
| 8 | Le décor des oliviers (saison 1, palier 10) | 256 × 256 px |
| 9 | Le grand décor des oliviers et le titre (palier 20) | 384 × 384 px et un insigne 128 px |
| 10 | Les bannières des 4 saisons | 4 frises de 1170 × 480 px |
| 11 | Le décor des saisons 2 à 4 (palier 10) | 3 objets de 256 × 256 px |
| 12 | Les grands décors et titres des saisons 2 à 4 | 3 décors de 384 px et 3 insignes de 128 px |
| 13 | Une icône par type de récompense du Sentier | 9 icônes de 96 px |
| 14 | Les 12 vignettes du Carnet des légendes | 12 médaillons de 160 px |
| 15 | Le sceau de la promesse | 240 px et un anneau séparé |
| 16 | La guirlande de lanternes du défi | lanterne allumée et éteinte 64 × 96 px, corde 128 × 32 px |
| 17 | Le décor de la semaine (récompense du défi) | 192 × 192 px |
| 18 | Les lampes du Mont | éteinte et allumée, 96 × 128 px |

Après la V1 (déjà dans la liste des illustrations) : la chouette, les visiteurs rares, de nouveaux objets, les petites choses du réveil, la constellation.

## 8. Vérifié

- `python3 -I scripts/verifier-projet.py .` : 0 erreur, 0 alerte. Cinq règles de plus : chaque `q` de `V.ECRANS` a un état de nouveautés ; aucun mot de `V.MOTS_INTERDITS` dans les textes ; aucun nom des références ; aucune icône de repli dans les journées types et les catégories, dans les deux jeux ; les fichiers du moteur gardent les fonctions de l'API et les noms d'événements.
- `outils/economie-test.html` : 68 règles vérifiées, `V.JEU.eco` identique au barème du module, profil Régulier dans les cibles.
- Les suites `test/lot1.js` à `test/lot9.js` (animation, récompense, Sentier, fonctions, personnages, décor, UI/UX, pages de la doc), `test/lot5b.js` (caméra), `test/sim4.js` et `test/sim5.js` (jalons) ; les captures `test/lot*_*.png`.
- Les pages Accueil, Écrans, Mécaniques, Décisions, DA : aucune erreur console, aucun défilement horizontal à 390 px ; le compteur des choix compte les choix 1 à 19 encore ouverts, sans le 11 ni le 17 (17 depuis le soir du 19/10).
- `Camp-scene.html` et `atelier.html` : chaque nouvel état et événement a son bouton (caméra, gestes, visiteur, jauge du feu, chantier, animations légères ; six états et deux réglages de l'atelier).
- `Tower defense.dc.html` s'ouvre comme avant ; ni la page ni `tower-defense/` n'ont été touchés.

## 9. La seconde passe (relecture)

Après la publication, tout a été relu une seconde fois : les 101 écrans du prototype passés à la chasse automatique dans huit conditions (Ado et Parent, les deux DA, 390 et 360 px, jour et nuit : erreurs de console, cibles sous 44 px, textes coupés ou abrégés, éléments hors du téléphone), une revue à l'œil des captures, les textes et les pages de la doc, les versions de cache, les liens, les avertissements de console. Chaque correction est un script rejouable (`tools/patch_1910_p4.py` à `p12.py`, avec la copie d'avant).

| | Trouvé | Corrigé |
|---|---|---|
| Typographie | Dans 574 textes de `athena-v1.js`, l'espace avant « : ; ! ? » était sécable : un signe pouvait se retrouver seul en début de ligne. | Espace insécable avant les deux-points, fine insécable avant « ; ! ? » ; `V.JEU.eco` régénéré du module, toujours identique (P4). |
| Versions de cache | Les fichiers partagés modifiés le 19/10 (`athena-v1.js`, `hub-v1.js`, `athena-economie.js`, `athena-ui.css`, `athena-icones.js`) gardaient leur ancien numéro dans les six pages : un navigateur pouvait servir l'ancienne copie. | Un cran de plus sur les 38 références (P5). |
| Un mot, un sens | « réalisée » pour une quête (le mot est « faite »), « inventaire » (« sac »), « pièces » (« or »), « cocher sans effort » (« valider »), « Pour plus tard » (« À reprendre »). | Textes alignés sur le glossaire (P5). |
| Le coffre au bord | En vue rapprochée (× 1,12), le bouton du coffre dépassait de 5 px du bord gauche et sa bulle « bois · or », centrée sous lui, sortait jusqu'à 37 px (« 30 · 10 » commençait hors du téléphone) ; la zone de la tente dépassait de 7 px. | Le coffre reste à 6 px du bord au moins, la bulle s'ancre au bord du bouton quand il est près d'un bord, la zone de la tente est rognée au téléphone (P6). |
| Texte de 14 px au moins | 22 textes du prototype à 13,5 px (ruban, pastilles, idées, cartes, configurateur). | 14 px partout (P7). |
| Le ruban du Sentier | « Prochain palier : 40 bois · 20 or » était abrégé d'un « … » à 272 px : le « or » disparaissait, sur l'écran le plus vu ; les récompenses longues (« Un charme du … », « Un objet pour le camp : … ») l'étaient toujours à 300 px. | Chaque récompense a une forme courte pour le ruban (« Charme de l’Éclaireur », « une lanterne », « Grand décor et titre ») ; le ruban peut aller jusqu'à 358 px, rien d'autre n'est sur sa ligne ; le lecteur d'écran garde la forme longue (P7, P11). |
| La prochaine nouveauté | « Bientôt : le coffre du camp » était abrégé (« le coffre du c… ») à 230 px. | La pastille va jusqu'à 358 px : le plus long titre (« Bientôt : le Kiosque du Hameau ») tient (P10, P11). |
| « du Éclaireur » | « Un charme du {nom} » et « Charme du {nom} » donnaient « du Éclaireur ». | `V.du` met l'article qu'il faut (« du Porteur », « de l’Éclaireur ») (P11). |
| La pilule décalée | « Toutes tes quêtes » (et « Revenir à mon palier ») était centrée par `transform:translateX(-50%)` et animée par une animation qui écrit `transform` (`rv-bob`, `rv-up`) : l'animation l'emportait, la pilule se décalait d'une demi-largeur vers la droite dans l'app (les captures sans animation ne le montraient pas). | Le centrage passe à un conteneur, l'animation reste sur la pilule (P12). |
| Deux pilules l'une sur l'autre | Avec trois compagnons au camp, la pilule « Construire » de l'emplacement du bas gauche se cachait derrière « Toutes tes quêtes ». | Une pilule de bâtiment qui tomberait sur la bande de l'indice monte au-dessus (P12). |
| 360 px | La bulle du coffre touchait la pilule « Toutes tes quêtes » (le camp est plus bas dans cette taille). | Le coffre monte de 44 px en 360 px ; les étiquettes et les vols qui le visent suivent (P7). |
| Le retour | « Une seule quête pour reprendre : celle-ci. » était coupé après les deux-points dans la carte du bas (une seule ligne) ; et « reprendre » est le mot de « À reprendre ». | « Une seule quête et ça repart. » (Ado), « Une quête, et le feu repart. » (Parent), dans les deux définitions du texte (P7). |
| Les heures | « retour vers 11 h 15 » se coupait entre « 11 » et « h » dans les durées du Ponton. | Espaces insécables dans les deux formateurs d'heure du prototype (`hFr`, `heureVers`) (P8). |

**Vu, et laissé tel quel.** Les avertissements de console sont ceux du moteur des pages (`hint-placeholder-count` sur DA › Le mouvement et Mécaniques, jamais résolus au premier rendu) et celui de Canvas2D (`willReadFrequently`) : sans effet. Les rangées qui défilent (catégories, onglets du sac, bande des paliers), les rayons derrière l'icône d'une carte et l'annonce invisible du lecteur d'écran dépassent du téléphone par construction : la chasse les ignore maintenant. Le bouton « Continuer » mesuré à 40 px pendant l'entrée d'une carte était un effet de mesure (la carte grandit de 0,9 à 1) : la chasse attend 0,7 s de calme avant de mesurer. Aucun lien mort dans les pages, aucun `console.log` ni `TODO` oublié.

**Les outils.** `test/chasse.js` : attente du calme des animations, textes abrégés comptés comme les textes coupés, détail des éléments hors du téléphone, `CHASSE_IDS` pour une sonde ciblée ; `test/lot5b.js` suit la nouvelle place du coffre.

**Vérifié.** La chasse finale : 101 écrans × 8 conditions (Ado et Parent, DA R2 et Origine, 390 et 360 px, jour et nuit), 808 écrans mesurés : aucune erreur de console, aucune cible sous 44 px, aucun texte coupé ni abrégé, rien hors du téléphone (`test/chasse2/*_rapport.txt`, tous vides). Puis toutes les suites rejouées sans la chasse en parallèle (`test/chaine_suites.sh`), `python3 -I scripts/verifier-projet.py .` : 0 erreur, 0 alerte ; `V.JEU.eco` identique au barème du module.

## 10. Les retours du 19/10 au soir

Quatre retours après la relecture, traités dans la foulée (scripts `tools/patch_1910_p14.py` et `p15.py`).

| Retour | Ce qui a été fait |
|---|---|
| « On ne voit plus le camp en entier, le décor. » | La vue large (tout le camp, le cadrage du 17/10) redevient le cadrage de base. La vue rapprochée (× 1,12) reste un réglage du configurateur (choix 17 A, adresse `cadrage=rapprochee`), avec son glissement sous les feuilles. Le choix 17 est tranché : 17 choix restent ouverts. L'écran « La vue large » d'Écrans devient « La vue rapprochée (réglage) ». |
| « Quand on valide les quêtes, il n'y a plus de coffre d'attente, ça va direct dans les ressources. » | Vérifié par sonde dans trois états (premier jour, état courant, vue large) et par les suites lot2 et lot5b : les gains d'une quête vont bien dans le coffre (bulle « 12 · 5 »), les compteurs du haut restent à 0 jusqu'au toucher du coffre ; rien ne ramasse tout seul (le réglage « Coffre automatique » du configurateur n'est pas branché). Ce qui trompait l'œil : en vue rapprochée, le coffre était collé au bord gauche, loin de la tente, et ressemblait à un bouton du haut. Avec le camp en entier, il reprend sa place à côté de la tente. Le coffre dessiné (3 états) reste à générer : brief 06. |
| « On voit le bandeau du pass uniquement quand on clique sur le Mont. » | Le ruban du Sentier (icône de la saison, « Prochain palier : … », les 4 pas du jour) est sur le camp dès le premier jour ; il n'attendait plus que la nouveauté du Mont soit vue. Sous une feuille, une carte ou un message, il s'efface comme avant. |
| « Une partie dans la DA avec tous les paliers et le visuel des bâtiments, et tout ce qu'il faut générer. » | Nouvel onglet **DA › Bâtiments et paliers** : chaque bâtiment niveau par niveau (le dessin quand il existe : la tente aux 4 niveaux, le kiosque ; sinon ce que le code dessine en attendant, et le brief à générer), le Mont, les 20 paliers du Grand Sentier avec la récompense et son visuel (dessiné / à générer), les 4 saisons, et la liste complète des 22 dessins à générer, chacun relié à son brief dans `generation-images/`. Un brief de plus (22, les cosmétiques de l'avatar : un cadre, une tenue) et ses prompts. Les données sont dans `V.DA_PALIERS` ; les récompenses sont lues dans `V.JEU.eco`. |

**Vérifié.** Toutes les suites rejouées sur la vue large (lot1 à lot9, lot5b, tout passe ; deux contrôles rendus robustes au timing : le vol feu → coffre de lot2 s'observe par mutation, l'anneau de l'appui long de lot4a attend son rendu), puis la chasse sur les 101 écrans dans les huit conditions : huit rapports vides, hors une mesure prise pendant l'entrée d'une carte (la chasse attend maintenant la fin de cette entrée avant de mesurer, et la sonde ciblée confirme). `python3 -I scripts/verifier-projet.py .` : 0 erreur, 0 alerte ; `V.JEU.eco` identique au module. Publié en version 10 de l'artefact.


## Les parcours à essayer

Ouvre `Prototype.dc.html` puis ajoute après `#` :

| Pour voir | Réglages |
|---|---|
| Le premier lancement, la promesse du camp | « Réinitialiser » dans le panneau ; la promesse seule : `ecran=camp&promesse=1&nouv=0` |
| Une quête faite en version courte, l'appui long en cours | `ecran=camp&heure=10.25&fait=1&courte=1&nouv=tout` · `ecran=camp&heure=10.25&fait=1&anneau=1&nouv=tout` |
| Le Sommet, la danse et la carte du palier | `ecran=camp&heure=16&paliers=4&sommet=1&nouv=tout` |
| Le Grand Sentier, les quêtes de saison, la fin de saison | `ecran=sentier&palier=7&qs=1&nouv=tout` · `ecran=sentier&fin=1&nouv=tout` |
| Le défi du Hameau et la guirlande complète | `ecran=defi&defi=9&nouv=tout` · `ecran=camp&heure=16&defi=complet&nouv=tout` |
| Le retour après quelques jours | `ecran=camp&heure=9&retour=1&nouv=tout` |
| La vue rapprochée (réglage, choix 17 A), les compagnons au camp | `ecran=camp&heure=10.25&cadrage=rapprochee&nouv=tout` · `ecran=camp&heure=10.25&compagnons=3&auberge=3&batiments=comptoir:2,expeditions:2&nouv=tout` |
| L'aube, la nuit, le feu en braises | `ecran=camp&heure=6.5&nouv=tout` · `ecran=camp&heure=22&objets=lavande,laurier&nouv=tout` · `ecran=camp&heure=10.25&feu=20&nouv=tout` |
| Les choix 13 à 18 | le groupe « Choix à faire (19/10) » du panneau ; ou `courte=moitie`, `courte=sans`, `defiRecompense=coffre`, `defiRecompense=rien`, `quetesSaison=0`, `appui=bouton`, `appui=glisser`, `cadrage=large`, `promesse=non` |

## Les fichiers

| Fichier | Ce qui change |
|---|---|
| `athena-v1.js` | Textes, écrans, mécaniques, décisions et choix 13 à 19, `V.SAISONS`, `V.QUETES_SAISON`, `V.IDEES_COURTES`, `V.COMPAGNONS_CAMP`, `V.JEU.camera`, `V.JEU.eco` (barème 4), `V.SYNTHESE`, `V.BOUCLE`, `V.DESSINS_14_10` (fiches, n° 10 à 18), `V.CHANGEMENTS`. |
| `commun/athena-motion.css`, `commun/athena-motion.js` | Le système d'animation (Lot 1). |
| `commun/athena-sons.js` | Version 3.0 : sept validations, le coffre, le Mont, la fanfare, le clic. |
| `commun/athena-scene.js`, `commun/athena-scene.json`, `commun/athena-marionnette.js`, `assets/scene/minotaure/minotaure.json` | Caméra, personnages, décor (lots 2, 5, 6). Versions du 17/10 dans `Archives/2026-10-19-scene-avant/`. API et événements conservés (ajouts seulement). |
| `commun/athena-economie.js` | Version 3 : ajouts du barème 4 et `VARIANTES` ; comportement par défaut inchangé. |
| `commun/athena-ui.css` | Jetons `--da-dore`, chiffres tabulaires, couvercle du coffre. |
| `commun/hub-v1.js` | Le compteur des choix ignore un choix remplacé. |
| `Prototype.dc.html` | Tout ce qui précède, et le configurateur « Choix à faire (19/10) ». |
| `Accueil.dc.html`, `Ecrans.dc.html`, `Mecaniques.dc.html`, `Decisions.dc.html`, `DA.dc.html` | La doc (Lot 9). |
| `Camp-scene.html`, `atelier.html`, `outils/fps-test.html`, `outils/economie-test.html`, `outils/economie-controles.js` | Les outils. |
| `scripts/verifier-projet.py` | Cinq règles de plus. |
| `assets/doc/sentier.webp` | L'image du Grand Sentier de l'Accueil. |
| `generation-images/` | Le dossier pour générer les images (briefs, prompts, références). |
| `passes/passe-19-10/` | Ce compte rendu, la conception, l'état. |
