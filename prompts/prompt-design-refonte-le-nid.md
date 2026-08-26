# Brief : refondre l'écran « LE NID » — ergonomie et lisibilité sur téléphone

## Ce que je te demande

L'écran « LE NID » de mon application marche, mais il a grossi par ajouts successifs et il
n'a jamais été pensé d'un bloc. **Refonds-le** : même contenu, même fonctions, mais une
mise en page conçue pour un pouce sur un écran de téléphone. Je te décris ci-dessous
**exactement** ce qu'il y a aujourd'hui, avec les mesures réelles relevées dans
l'application. Ne devine rien, ne retire aucune fonction sans me le dire.

**Contrainte de base : 375 × 812 px** (iPhone standard), doit tenir jusqu'à 340 px de large.
Application mobile **en un seul fichier HTML**, sans framework ni bibliothèque, vanilla JS,
CSS écrit à la main, tout en français, esthétique **pixel-art / RPG rétro**.

---

## Le problème principal, chiffré

L'écran mesure **2082 px de haut** pour une fenêtre de 812 px : **2,5 écrans de défilement**.

| Section | Position (px) | Hauteur |
|---|---|---|
| Enseigne « LE NID » | 18 | 62 |
| Encart « Œuf mystère » | 96 | 102 |
| Bouton « Ouvrir un œuf » | 212 | 46 |
| **Panneau des camps** | 268 | 211 |
| Titre « Ma collection » | 499 | 12 |
| Ligne « En balade » | 521 | 27 |
| **Grille de collection** | 556 | **1436** |
| Bouton « Retour au camp » | 2012 | 44 |

La grille de collection occupe **69 % de la page**. Le bouton de retour est à 2012 px : il
faut traverser toute la collection pour sortir. Et le panneau des camps — la partie avec
laquelle on interagit le plus — est coincé au milieu, à cheval sur deux écrans.

C'est le cœur du problème que je veux te voir résoudre.

---

## Ce que contient l'écran, section par section

### 1. Enseigne (269 × 62)
Panneau de bois : **« LE NID »** en gros, sous-titre *« Fais éclore des œufs, collectionne
les créatures »*.

### 2. Encart « Œuf mystère » (340 × 102)
Une vignette d'œuf dessinée (26 × 32 px), un titre **« Œuf mystère »** et un paragraphe :
*« Une créature au hasard t'attend à l'intérieur. Plus elle est rare, plus elle est
précieuse. »*

### 3. Bouton d'achat (345 × 46)
**« 🥚 Ouvrir un œuf — 🪙 150 »**. Désactivé si le joueur n'a pas les pièces.

### 4. Panneau des camps (340 × 211) — la partie la plus utilisée

**a) Cinq onglets de biome** (66 × 26 chacun), chacun d'une couleur, nom en blanc avec
contour sombre :

| Onglet | Couleur | État |
|---|---|---|
| Prairie | `#3fae5a` vert | ouvert, actif |
| Banquise | `#eef4f8` blanc | ouvert |
| Plage | `#2f8fd8` bleu | ouvert |
| Forêt | `#241c1c` noir | 🔒 verrouillé (grisé) |
| Volcan | `#e0592a` orange | 🔒 verrouillé (grisé) |

Une pastille chiffrée sur l'onglet indique le nombre de créatures au travail dans ce biome.
Les onglets inactifs sont assombris (`filter: brightness(.72)`), l'actif est en pleine
couleur.

**b) Barre d'état + bouton Auto**
À gauche, une phrase d'état du biome ouvert, dans l'un de ces quatre cas :
- `✅ Les 4 postes tournent` (vert)
- `⛔ Chaîne coupée — il manque 🎣 🍲` (rouge, liste les métiers absents)
- `💨 Feu éteint — production à l'arrêt` (rouge)
- `🔒 Biome à débloquer` (rouge)

À droite, un bouton **⚡ Auto** (57 × 26) qui place automatiquement les meilleures créatures
disponibles aux postes du biome.

**c) Trois colonnes de postes** (105 × 73 chacune), côte à côte :
- **🎣 Pêche** — 2 emplacements
- **🍲 Cuisine** — 1 emplacement
- **🧭 Explo** — 2 emplacements

Chaque emplacement fait **44 × 44 px** et contient soit :
- une créature : sa vignette pixel (36 px max), une **pastille de niveau en haut à droite**,
  et un **cadre de la couleur de sa rareté** ;
- soit un **+** en pointillés si la place est libre.

**d) Bande « 🐾 Balade »** (326 × 57), sous les colonnes : 3 emplacements du même format.
La créature en position 1 porte une **étoile ★** (c'est elle qui apparaît dans le cadre du
journal ailleurs dans l'app), les suivantes portent leur rang (2, 3).

### 5. Titre « Ma collection 14 / 26 »

### 6. Ligne d'information (340 × 27)
*« 🐾 En balade — Prairie 🌿 2 / 3 — la n°1 tient le cadre du journal »*

### 7. Grille de collection (345 × 1436) — 26 cartes, 3 par ligne
Chaque carte fait **108 × 162 px** et empile **neuf** éléments :

| Élément | Taille | Contenu | Police |
|---|---|---|---|
| halo de rareté | 104 × 158 | teinte de fond | — |
| étiquette | 30 × 10 | `N°1 ★` / `En quête` / nom du biome | 7,5 px |
| compteur | 18 × 10 | `×3` (exemplaires possédés) | 8,5 px |
| vignette | 52 × 52 | dessin pixel de la créature | — |
| nom | 92 × 11 | `Héros` | 9,5 px |
| rareté | 92 × 9 | `Commun` | 8 px |
| métier + niveau | 92 × 11 | `🧭 Exploration · Nv 3` | 8 px |
| bouton | 92 × 26 | `🧭 Mettre au poste` / `■ Rappeler` | 8,5 px |
| ligne d'état | 92 × 11 | `+7 🪙 / 36 min` ou la raison d'un arrêt | 7,5 px |

Les créatures non possédées (12 sur 26 ici) sont des cartes **« ? »** grisées, de même
taille — elles occupent donc **la moitié de la grille**, soit ~700 px de défilement pour
des cases vides.

### 8. Bouton « ↩ Retour au camp » (345 × 44), tout en bas à 2012 px.

---

## Les deux interactions à préserver absolument

### Affecter une créature — en deux temps
1. On touche un emplacement (le **+** ou la créature à remplacer). Il se met à **pulser**.
2. **La collection se filtre** : elle ne montre plus que les créatures du bon métier, triées
   par niveau décroissant. Le titre devient `🧭 Exploration disponibles 5`, une bande d'aide
   apparaît (`👇 Choisis une créature dans la collection — métier 🧭 exploration` + bouton
   *annuler*), et la ligne « En balade » disparaît.
   → La page passe alors de **2082 px à 969 px**.
3. On touche une créature : elle est affectée, la collection redevient entière.

C'est un **tap-tap**, pas un glissé : sur un écran de téléphone, le doigt masque la cible et
le moindre défilement fait rater un dépôt. **Garde ce principe.**

### Le bouton ⚡ Auto
Remplit les 5 postes du biome avec les meilleurs niveaux **disponibles** — il ne prend pas
les créatures qui travaillent dans un autre biome, et le dit :
`⚡ Volcanyon : 4 changements · 1 poste vide (21 créatures ailleurs)`.

---

## Les règles du jeu, pour que rien ne soit contredit

- **26 créatures**, 5 raretés (Commun `#98a2ae`, Rare `#4fa3e0`, Très rare `#3ec8a0`,
  Épique `#b06ae8`, Légendaire `#ffb648`), 3 métiers (🎣 pêche, 🍲 cuisine, 🧭 exploration).
- **Niveau** = base de rareté (1 / 2 / 3 / 8 / 12) **+ nombre d'exemplaires − 1**.
- Une créature **ne peut être qu'à un seul endroit** : un poste, une balade, ou au repos.
- **5 postes par biome** (2 / 1 / 2) et **3 places de balade**, sur **5 biomes**.
- Les créatures produisent en boucle tant que le feu du camp brûle : le pêcheur ramène du
  poisson, le cuisinier le grille, l'explorateur échange une brochette contre de l'or.
  **Sans cuisinier, tout l'or s'arrête** — d'où l'importance de voir un métier manquant.

## La charte visuelle actuelle — à garder dans l'esprit

Écran sombre (contrastant avec le reste de l'app, qui est en parchemin clair) :
```
fond du Nid     dégradé #2a1c10 → #20140a, halo doré discret en haut
cartes          dégradé #3a2716 → #2c1c0f, bordure 2px #5a3a22, rayon 3px
titres section  Courier New, 11px, MAJUSCULES, interlettrage 2px, #c8ab72
texte courant   #c8ab72   ·   chiffres mis en avant #ffd24d   ·   texte clair #f0ddac
boutons         fond #54341e, bordure 1.5px #8a6a3c, texte #f0ddac, Courier New
accent doré     #b07d14 / #ffd24d      vert #9ad48a      rouge #ff9a7a
polices         Courier New (chiffres, étiquettes) + Segoe UI (noms, textes)
```
Vignettes de créatures en `image-rendering: pixelated`, jamais lissées.

---

## Ce que j'attends de toi

1. **Règle le problème de longueur.** 2082 px pour gérer cinq camps et une collection, c'est
   trop. Onglets internes ? Collection en tiroir ? Panneau collant en haut ? Cartes plus
   compactes ? **Propose, justifie, et montre les chiffres** de ta version.
2. **Repense la carte de créature** : neuf éléments empilés sur 108 × 162 px avec des polices
   de 7,5 à 9,5 px, c'est illisible et c'est ce qui fait la longueur de la page. Que faut-il
   vraiment montrer en permanence, et que peut-on ne montrer qu'au besoin ?
3. **Traite le cas des 12 cartes verrouillées** qui mangent la moitié de la grille.
4. **Rends le panneau des camps prioritaire** : c'est la partie avec laquelle on interagit,
   elle ne devrait pas être à cheval sur deux écrans.
5. **Vérifie les cibles tactiles** : tout ce qui se touche doit faire ≥ 44 px. Les boutons de
   carte font 92 × 26 px aujourd'hui — trop bas pour un pouce.
6. **Garde le tap-tap** et l'état « filtré » : c'est la meilleure idée de l'écran actuel.

## À me livrer

1. Une **maquette** des états : vue normale, emplacement armé (collection filtrée), biome
   verrouillé, chaîne coupée.
2. Le **code complet** — HTML, CSS, JS autonome, commenté en français, prêt à intégrer dans
   un fichier unique, avec les points de branchement documentés (lecture de l'état,
   affectation, retrait, Auto).
3. Une **note courte** : tes partis pris, ce que tu as écarté, et la nouvelle hauteur totale
   de la page comparée aux 2082 px actuels.

Dis-moi franchement si une partie de l'écran actuel est à jeter plutôt qu'à améliorer.
