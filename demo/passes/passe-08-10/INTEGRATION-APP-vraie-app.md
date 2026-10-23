# Intégrer l’avatar (image de profil, distincte de la chouette compagnon) et la lumière v2 dans la vraie app (dépôt Artwar974/app-tdah)

Ce document est pour toi et ton associé. Il est écrit d'après la lecture du dépôt (index.html, journal-shell.js, housing-shell.js, housing-theme.css) ; **je n'ai pas pu lancer la vraie app**, donc chaque étape dit ce qu'il faut regarder après l'avoir faite. Les deux chantiers sont indépendants : l'avatar d'abord (petit, sans risque), la lumière ensuite (plus délicate).

Règle commune : une étape = un commit. Chaque étape se défait en retirant le commit, sans migration à défaire (les sauvegardes qui ont un champ de plus restent lisibles par l'ancien code).

---

## Étape A · L'avatar de profil

### A1. Ajouter le module
- Copie `commun/athena-avatars.js` à la racine du dépôt (le dépôt n'a pas de dossier commun). Aucune dépendance.
- Dans index.html, charge-le **avant** journal-shell.js : `<script src="athena-avatars.js"></script>`.

### A2. Le champ dans la sauvegarde (journal-shell.js, fonction `normalize`)
Deux champs, ajoutés avec les autres lignes de `normalize` :
```js
s.avatar = AthenaAvatars.normaliser(s.avatar);   // { id, couleur } ; une valeur absente ou inconnue devient le renard ocre
s.avatarChoisi = Boolean(s.avatarChoisi);         // faux tant que la personne n'a pas validé son choix
```
Migration douce : une ancienne sauvegarde n'a pas ces champs, `normalize` les crée. Elle garde le renard ocre et **n'est pas interrompue** par l'écran de choix (voir A4). Rien d'autre ne change dans la clé `jdq_v1`.

### A3. Remplacer la grenouille
- index.html ligne 363 : `<div class="journal-avatar" aria-hidden="true">🐸</div>` devient `<div class="journal-avatar" id="journalAvatar"></div>`.
- Dans `updateProfile()` : `document.getElementById('journalAvatar').innerHTML = AthenaAvatars.svg(state.avatar, { taille: 52, da: 'origine', titre: false });`
- journal-theme.css (ligne 335 et les deux blocs « petits écrans », lignes ~1025 et ~1055, qui donnent 52 × 58 et 47 × 54) : le médaillon est rond, donc carré. Mets `width` = `height` (52 puis 47) et `border-radius: 50%`, retire `font-size`.
- `da: 'origine'` : l'app actuelle suit la Veillée (prune et or). Si la DA Figures est adoptée, passer `'r2'`.

### A4. L'écran « Choisis ton avatar »
- Une `<dialog id="avatarDialog">` qui contient : un titre, une phrase, un conteneur `#avatarZone`, le bouton principal, le lien « Choisir plus tard ». Les textes sont dans le hub (V.TEXTES, clés `avatar.*`, une version adulte et une version enfant).
- Ouverture : `AthenaAvatars.monter(zone, { valeur: state.avatar, da: 'origine', enfant: profilEnfant, onChange: v => brouillon = v })`. « Choisir cet avatar » enregistre `state.avatar = brouillon; state.avatarChoisi = true; save();`. « Choisir plus tard » enregistre `avatarChoisi = true` sans changer l'avatar (on ne redemande pas).
- Quand : **une seule fois**, juste après l'accueil, pour une personne qui n'a jamais eu de sauvegarde (`seed()` vient d'être utilisé). Pour une sauvegarde existante, ne rien ouvrir : l'avatar se change depuis le Journal › Carnet (un toucher sur le médaillon du profil ouvre la même feuille).
- Accessibilité : le sélecteur est un groupe de boutons radio avec flèches du clavier ; la boîte `<dialog>` rend le focus au bouton d'où elle vient.

### A5. À regarder après
1. Une sauvegarde de l'ancienne version (copie de `jdq_v1` avant l'étape) s'ouvre, garde ses quêtes, affiche le renard ocre, n'ouvre pas l'écran de choix.
2. Un navigateur neuf : l'écran de choix s'ouvre une fois ; choisir, recharger : l'avatar est resté ; « Choisir plus tard » : il ne revient pas.
3. Le médaillon est rond à 52 et 47 px, et net à l'écran de ton téléphone.
4. `AthenaAvatars.CREDITS` est ajouté au texte de « Crédits et licences » du Carnet (CC BY 3.0, obligatoire).
5. Outil de test : `outils/avatars-test.html` du dossier (sélecteur dans les deux DA, adulte et enfant, jour, coucher, nuit).

---

## Étape B · La lumière v2 du camp

### Ce que la vraie app fait aujourd'hui
`housing-shell.js` règle l'ambiance par `setVisualHour(hour, lighting)` : quatre états (`VISUAL_STATES`) mélangés selon `lighting.current/next/progress` et écrits dans des variables CSS (`--housing-brightness`, `--housing-shade-color`…). Les objets sont des `button.housing-object` avec une `img.housing-object-art` qui reçoit un `filter` CSS (brightness, saturate, sepia, hue-rotate) et des calques d'ombre et de lumière (`appendAmbientGrade`). C'est le même principe que le prototype avant la passe du 4 octobre : un réglage de brillance par moment, sans ombre portée orientée ni couleur par objet.

### Ce que le module apporte
Ombres qui suivent le soleil puis la lune (direction et longueur), ombre de contact, teinte par objet qui se mélange avec la couleur du ciel, profondeur de brume, feu et lanternes qui éclairent le sol la nuit. Le prototype du hub l'utilise déjà : `Prototype.dc.html`, fonctions `lumCreer`, `posees`, `decorLumiere` sont l'implémentation de référence.

### B1. Brancher le module à côté de l'existant, derrière un drapeau
- Copie `commun/athena-camp-lumiere.js` à la racine, charge-le avant housing-shell.js, et n'active le module que si l'adresse contient `?lumiere=2` (ou `localStorage.athenaLumiere2 = '1'`). Sans drapeau, **rien ne change**.
- Le module compte en pixels d'un cadre. Dans la vraie app, les objets sont en fractions de la scène (`object.x`, `object.y`, `SCENE_WIDTH` × `SCENE_HEIGHT`). Le plus simple : donne au module un cadre virtuel de la taille de la scène, et mets ses calques dans un conteneur de `SCENE_WIDTH × SCENE_HEIGHT` px mis à l'échelle par CSS (`transform: scale(...)`), au-dessus du fond et sous les objets :
```js
const lum = AthenaCampLumiere.creer(cadreVirtuel, {
  feu: [feu.x * SCENE_WIDTH, feu.y * SCENE_HEIGHT],
  profondeur: [yFond * SCENE_HEIGHT, yDevant * SCENE_HEIGHT, 0.80, 1.20],   // bas du fond, bas du devant, échelles
  porteeFeu: 0.30 * SCENE_WIDTH,
  calque: { parent: conteneurStable }
});
```
- Les constantes à adapter (feu, profondeur, portée) viennent de la scène réelle : prends-les dans `TYPES` et `depthAt()` de housing-shell.js. Elles sont documentées en tête du module.

### B2. Donner l'heure au module
Dans `setVisualHour(hour, lighting)`, après les `root.setProperty(...)` :
```js
if (lum) lum.maj({ heure: hour, etat: lighting.current, suivant: lighting.next, progression: lighting.progress, lumiere: lighting.lightColor, ombre: lighting.shadowColor });
```
Les noms d'états de la vraie app (`sunrise`, `day`, `sunset`, `night`) sont ceux du module : rien à convertir.

### B3. Les objets
Pour chaque objet posé (dans `setObjectStyle` ou juste après `renderObjects`) :
```js
const w = displayWidth(object), h = w / (type.aspect || 1);
const g = { cx: object.x * SCENE_WIDTH, by: object.y * SCENE_HEIGHT, w, h };
const s = lum.objet(object.id, g);
art.style.filter = s.filtre;          // remplace le filtre CSS à variables
// sous l'objet : deux calques (s.contact, s.ombre avec background-image = type.src) ; au-dessus : s.base
if (type.luminous) lum.sourcesObjet(object.id, g, [[0.5, 0.4, 20]], type.group === 'fire' ? 'feu' : 'lanterne');
```
Quand le drapeau est actif, retire `appendAmbientGrade` (il fait déjà le même travail, il doublerait la teinte) et garde `housing-flame-glow` (la lueur de la flamme).
- Mouvement réduit : le module coupe seul la vibration des lumières ; les ombres et la teinte sont fixes.
- Glisser un objet : rappelle `lum.objet(...)` pendant le déplacement (le prototype le fait à chaque rendu) ; la taille, l'ombre et la teinte suivent la profondeur.

### B4. À regarder après
1. Le même camp, à 10 h 15, 19 h 30 et 22 h 30, avec et sans `?lumiere=2` : côte à côte, comme dans `apercu/camp-lumiere-v1-en-haut-v2-en-bas.png`.
2. Aucun objet qui flotte (ombre de contact visible), aucun saut de couleur à la minute du changement d'état.
3. Coût : images par seconde et processeur sur le téléphone le plus modeste, camp avec tous les objets (une dizaine de filtres SVG ; si c'est trop, retirer le calque `base` d'abord, puis les ombres portées des petits objets).
4. Un navigateur sans filtres SVG sur éléments HTML retombe sur un filtre simple (brightness, saturate) : le module le détecte (`CSS.supports`). À vérifier sur Safari de l'iPhone, que je n'ai pas pu tester.
5. Outils de test : `outils/lumiere-v2-test.html` (heure au curseur, v1 / v2, direction du soleil affichée).

---

## Ordre conseillé
1. A (avatar), 1 commit, test sur une copie de ta sauvegarde.
2. B1 + B2 seuls : le module reçoit l'heure mais ne dessine rien d'important ; contrôle de la console.
3. B3 derrière le drapeau, regarde les trois heures, mesure le coût.
4. Quand c'est bon sur téléphone : retire le drapeau et l'ancien code d'ambiance.

## Ce que je n'ai pas vérifié
- La vraie app n'a pas été lancée : les noms de fonctions viennent de la lecture du code.
- Safari et Firefox : les captures et les tests sont faits sur Chromium.
- Le coût sur téléphone réel.
