# Brief : nouvel onglet « CAMPS » dans Le Nid — gestion de toutes les créatures et de tous les biomes

## Ce que je veux

Conçois-moi **un écran de gestion complet**, façon **PC de Pokémon**, ajouté comme onglet dans
l'écran « LE NID » de mon application. Aujourd'hui je dois voyager de biome en biome pour
savoir qui travaille où, et je ne peux gérer que le biome sur lequel je me trouve. Je veux
**un seul écran** qui montre les 5 biomes et toute ma collection, où je vois d'un coup d'œil
qui est où, et où je peux **déplacer une créature d'un biome à l'autre ou d'un poste à
l'autre par glisser-déposer**.

Ça doit être **lisible, ludique, organisé, efficace et optimisé**. C'est un écran de gestion,
mais il doit rester un plaisir à ouvrir — pas un tableur.

Donne-moi la maquette et le code (HTML + CSS + JS, sans dépendance externe). Je te donne
ci-dessous **toutes** les règles et données du jeu : ne les invente pas, ne les modifie pas.

---

## Le contexte technique — contraintes non négociables

- **Application mobile en un seul fichier HTML**, sans framework, sans bibliothèque, sans
  requête réseau. Vanilla JS, CSS écrit à la main.
- **Format de référence : 375 × 812 px** (téléphone). Ça doit rester utilisable jusqu'à
  ~340 px de large. Le pouce est le seul outil : **cibles tactiles ≥ 40 px**.
- Le glisser-déposer doit marcher **au doigt** (Pointer Events), pas seulement à la souris.
  Prévois **une solution de repli au tap** (sélectionner la créature, puis taper la
  destination) : sur un petit écran, le glissé rate souvent, et il doit toujours exister un
  chemin sans glissé.
- **Esthétique pixel-art / RPG rétro.** Pas d'aplats plats ni de style « application web
  moderne ». Vignettes de créatures en `image-rendering: pixelated`.
- Tout en **français**.
- Performance : l'écran peut afficher ~26 créatures × 5 biomes. **Pas de re-rendu complet
  du DOM à chaque image** pendant un glissé.

## La charte visuelle existante — à respecter

Palette de l'app :
```
--bg     #c9ad72   (parchemin, fond général de l'app)
--panel  #ecdcae   (panneaux clairs)
--ink    #3a2a12   (texte sombre)
--gold   #b07d14
--green  #5a8a30
--red    #a8362a
--mono   "Courier New", ui-monospace, monospace
--sans   "Segoe UI", system-ui, sans-serif
```

L'écran du Nid est **sombre**, en contraste avec le reste de l'app :
- fond : dégradé `#2a1c10 → #201409` avec un halo doré discret en haut
- cartes de créature : dégradé `#3a2716 → #2c1c0f`, bordure `2px solid #5a3a22`, coins 3 px
- titres de section : `Courier New`, 11 px, majuscules, interlettrage 2 px, couleur `#c8ab72`
- texte secondaire : `#c8ab72` — chiffres mis en avant : `#ffd24d`
- boutons : fond `#54341e`, bordure `1.5px #8a6a3c`, texte `#f0ddac`, `Courier New`
- grille de collection actuelle : `repeat(3, 1fr)`, gouttière 10 px

Garde cette famille. Tu peux l'enrichir, pas la remplacer.

---

## Les données réelles du jeu

### Les 5 biomes (dans l'ordre de déblocage)

| Clé | Nom | Icône | Couleur |
|---|---|---|---|
| `prairie` | Prairie | 🌿 | `#3fae5a` |
| `glace` | Banquise | ❄️ | `#7fd4ff` |
| `plage` | Plage | 🏝️ | `#ffc464` |
| `foretnoire` | Forêt Noire | 🌲 | `#6f9a4a` |
| `volcanyon` | Volcanyon | 🌋 | `#e0592a` |

Un biome se débloque quand **tous les habillages du biome précédent ont été achetés**. Les
biomes verrouillés doivent apparaître à l'écran, **grisés et cadenassés** — on doit voir ce
qui reste à conquérir.

### Les 5 raretés

| Clé | Nom | Couleur | Niveau de base |
|---|---|---|---|
| `commun` | Commun | `#98a2ae` | 1 |
| `rare` | Rare | `#4fa3e0` | 2 |
| `tresrare` | Très rare | `#3ec8a0` | 3 |
| `epique` | Épique | `#b06ae8` | 8 |
| `legendaire` | Légendaire | `#ffb648` | 12 |

**Niveau d'une créature** = niveau de base de sa rareté **+ (nombre d'exemplaires possédés − 1)**.
Les doublons font monter le niveau. Le niveau est important : il détermine la vitesse de
production. Il doit être visible sur chaque créature.

### Les 3 métiers

| Clé | Nom | Icône | Postes par biome |
|---|---|---|---|
| `peche` | Pêche | 🎣 | **2** |
| `cuisine` | Cuisine | 🍲 | **1** |
| `exploration` | Exploration | 🧭 | **2** |

**Une créature ne peut exercer que le métier de son espèce.** Un pêcheur ne peut pas cuisiner.

### Les 26 créatures

| id | Nom | Rareté | Métier |
|---|---|---|---|
| `heros` | Héros | commun | exploration |
| `chat` | Chat | commun | pêche |
| `robot` | Robot | commun | exploration |
| `champi` | Champlutin | commun | cuisine |
| `meduse` | Méduse | commun | pêche |
| `poussin` | Poussin | commun | exploration |
| `lapin` | Lapin | commun | exploration |
| `renard` | Renardeau | rare | exploration |
| `tigre` | Tigre | rare | pêche |
| `capybara` | Capybara | rare | pêche |
| `poulet` | Poulet | rare | pêche |
| `toad` | Toad | rare | pêche |
| `slime` | Slime | très rare | cuisine |
| `kappa` | Kappa | très rare | pêche |
| `diabolo` | Diabolo | très rare | exploration |
| `gobelin` | Gobelin | très rare | exploration |
| `skelet` | Skelet | très rare | cuisine |
| `orc` | Orc | très rare | pêche |
| `chevalier` | Chevalier | très rare | cuisine |
| `golem` | Golem | épique | cuisine |
| `dragon` | Dragono | épique | exploration |
| `rex` | Rex | épique | pêche |
| `garoo` | Garoo | épique | exploration |
| `yeti` | Yéti | épique | pêche |
| `phenix` | Phénix | légendaire | exploration |
| `minos` | Minos | légendaire | cuisine |

Une créature non possédée s'affiche en silhouette « ? » verrouillée. Les créatures
s'obtiennent en ouvrant des œufs (150 🪙 pièce).

---

## Les règles d'affectation — le cœur du problème

C'est ce qui doit être **évident** à l'écran.

1. **Une créature ne peut être qu'à UN seul endroit.** Soit elle tient un poste de travail
   dans un biome, soit elle est « en balade » dans un biome, soit elle se repose au Nid.
   Jamais deux à la fois. L'affecter quelque part la retire automatiquement d'ailleurs.

2. **Postes de travail, par biome** : 2 × 🎣 pêche, 1 × 🍲 cuisine, 2 × 🧭 exploration.
   Donc **5 postes par biome, 25 postes en tout** sur les 5 biomes.

3. **La balade** : jusqu'à **3 créatures par biome** peuvent être « en balade » — elles ne
   travaillent pas, elles décorent le campement et se promènent à l'écran. La **n°1** de la
   liste est celle qui apparaît dans le cadre du journal (c'est un statut convoité : il faut
   pouvoir **réordonner** les 3, la position 1 est spéciale et doit se voir).

4. **Le feu** : la production ne tourne que si le feu du camp est allumé. Le feu se nourrit
   des quêtes accomplies dans la vraie vie (1 quête = 1 bûche = 4 h de feu, maximum 48 h).
   Chaque biome a son propre feu. Un biome dont le feu est éteint doit se voir immédiatement.

## La chaîne de production — ce que l'affectation détermine

Les créatures travaillent **en boucle et automatiquement**, tant que le feu brûle :

```
🎣 pêcheur  →  dépose 1 🐟 au coffre        (1 toutes les 40 min au niveau 1)
🍲 cuisinier →  prend 1 🐟, remet 1 🍢       (1 toutes les 20 min au niveau 1)
🧭 explorateur → prend 1 🍢, rapporte 5 🪙   (1 voyage toutes les 40 min au niveau 1)
```

- Le niveau **accélère** les cycles (+6 % par niveau, plafonné à ×2,2) et **enrichit** les
  voyages (+0,9 🪙 par niveau).
- **Règle capitale : sans brochette 🍢, les explorateurs ne partent pas.** Donc **sans
  cuisinier, tout l'or s'arrête**. Cette dépendance en chaîne est le cœur du jeu de gestion :
  l'écran doit la rendre évidente, et montrer **quel maillon manque** dans chaque biome.
- Le coffre de chaque biome plafonne à 20 🐟 et 10 🍢.
- Les cadences sont accordées pour qu'une équipe complète (2 + 1 + 2) au niveau 1 débite
  3 unités/heure à chaque maillon : **aucun poste ne tourne dans le vide**. C'est pour ça
  qu'il faut les trois métiers, et c'est ce qui rend l'affectation intéressante.

---

## Ce que l'écran doit permettre, concrètement

1. **Voir les 5 biomes en même temps** avec, pour chacun : ses 5 emplacements de poste
   (2 🎣 / 1 🍲 / 2 🧭), qui les occupe, ses 3 emplacements de balade, l'état de son feu,
   son stock (🐟 / 🍢 / 🪙 en attente) et sa production estimée en 🪙/h.
2. **Voir toute la collection** (26 créatures, possédées et non possédées), avec pour chacune
   son métier, sa rareté, son niveau, et où elle se trouve actuellement.
3. **Déplacer une créature** : de la collection vers un poste, d'un poste vers un autre,
   d'un biome vers un autre, d'un poste vers la balade, et la renvoyer au repos.
4. **Refuser intelligemment** les gestes impossibles, en **disant pourquoi** : mauvais métier
   pour ce poste, poste déjà occupé, biome verrouillé. Idéalement, pendant le glissé, seules
   les destinations **valides** s'illuminent — l'erreur doit être impossible plutôt que
   signalée après coup.
5. **Repérer les manques** : un biome sans cuisinier alors qu'il a des explorateurs est une
   chaîne cassée. Ça doit sauter aux yeux, sans lire une ligne de texte.

## Mes attentes sur la forme

- Trouve la bonne réponse au problème de place : 5 biomes × 8 emplacements + 26 créatures sur
  un écran de téléphone. Onglets par biome ? Colonne de biomes repliables et tiroir de
  collection ? Vue d'ensemble compacte plus une vue détaillée ? **Propose et justifie** —
  c'est la vraie question de design, et je veux ton avis, pas une grille par défaut.
- Prévois les **états vides** (aucune créature possédée d'un métier, biome verrouillé, feu
  éteint, coffre plein) : ce sont eux qui font la qualité d'un écran de gestion.
- Prévois un **retour visuel et sonore discret** à chaque affectation réussie — c'est un jeu.
- N'oublie pas le **filtrage** de la collection (par métier, par rareté, par disponibilité) :
  avec 26 créatures, en trouver une doit être immédiat.

## À me livrer

1. Une **maquette visuelle** de l'écran (états : vue d'ensemble, glissé en cours,
   destination refusée, biome verrouillé).
2. Le **code complet** : HTML, CSS, JS autonome, commenté en français, prêt à intégrer dans
   un fichier unique. Expose une fonction d'entrée claire et documente les points de
   branchement avec l'état du jeu (lecture des créatures, des affectations, écriture d'une
   affectation).
3. Une **note courte** expliquant tes partis pris de mise en page, et ce que tu as écarté.

N'hésite pas à me dire si une de mes idées est mauvaise, et à proposer mieux.
