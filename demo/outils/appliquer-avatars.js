#!/usr/bin/env node
/*
 * Ajoute l'avatar de profil au contenu du hub (athena-v1.js) : textes, écrans, mécanique, deux décisions (avatar et lumière du camp), profils, journal des changements.
 * Usage :  node outils/appliquer-avatars.js athena-v1.js        (écrit athena-v1.js ; une copie .avant-avatars est gardée)
 *          node outils/appliquer-avatars.js athena-v1.js --essai (n'écrit rien, dit seulement ce qui serait fait)
 * Idempotent : sans effet si l'écran « ob-avatar » existe déjà. S'arrête avec un message si un repère du fichier a changé.
 */
const fs = require('fs');
const [, , fichier, option] = process.argv;
if (!fichier) { console.error('Usage : node outils/appliquer-avatars.js athena-v1.js [--essai]'); process.exit(2); }
let s = fs.readFileSync(fichier, 'utf8');
if (s.includes("E('ob-avatar'")) { console.log('Déjà appliqué : rien à faire.'); process.exit(0); }
let n = 0;
function remplacer(ancre, neuf, nom) {
  const i = s.indexOf(ancre);
  if (i < 0 || s.indexOf(ancre, i + 1) >= 0) { console.error('Repère introuvable ou ambigu : ' + nom); process.exit(1); }
  s = s.slice(0, i) + neuf + s.slice(i + ancre.length); n++;
}

/* 1 · profils : un avatar par défaut pour chaque profil de démonstration */
remplacer("V.PROFILS = { adulte: { nom: 'Adulte', prenom: 'Alex' }, enfant: { nom: 'Enfant', prenom: 'Léa' } };",
  "V.PROFILS = { adulte: { nom: 'Adulte', prenom: 'Alex', avatar: { id: 'renard', couleur: 'ocre' } }, enfant: { nom: 'Enfant', prenom: 'Léa', avatar: { id: 'lapin', couleur: 'rose' } } };", 'V.PROFILS');

/* 2 · textes */
remplacer("V.TEXTES = {\n",
`V.TEXTES = {
  'avatar.titre': ['ob-avatar', 'Choisis ton avatar'], 'avatar.sous': ['ob-avatar', { adulte: 'C’est ta photo de profil : elle te représente dans l’app. Tu pourras la changer dans le Carnet.', enfant: 'C’est ton image de profil. Tu pourras en changer quand tu veux.' }],
  'avatar.couleur': ['ob-avatar', 'Couleur'], 'avatar.choisir': ['ob-avatar', { adulte: 'Choisir cet avatar', enfant: 'C’est parti' }], 'avatar.plusTard': ['ob-avatar', 'Choisir plus tard'],
  'avatar.carnet.t': ['carnet', 'Mon avatar'], 'avatar.carnet.d': ['avatar-carnet', 'Change d’animal ou de couleur quand tu veux.'], 'avatar.carnet.ok': ['avatar-carnet', 'Enregistrer'],
`, 'V.TEXTES');
remplacer("Pictogrammes de Game-icons.net, licence CC BY 3.0 (creativecommons.org/licenses/by/3.0).", "Pictogrammes de Game-icons.net, licence CC BY 3.0 (creativecommons.org/licenses/by/3.0), avatars compris.", 'credits.icones.d');

/* 3 · écrans */
remplacer("[['camp', 'Entrer au camp'], ['aide', 'Premières fois']], ['onboarding', 'sons'], { vide: '', plein: '', nuit: '' }),",
  "[['ob-avatar', 'Entrer au camp'], ['aide', 'Premières fois']], ['onboarding', 'sons'], { vide: '', plein: '', nuit: '' }),\n" +
  "  E('ob-avatar', 'onboarding', 'Ton avatar', 'Juste après l’accueil : un animal et une couleur pour te représenter. Modifiable dans le Carnet.', 'ecran=onboarding&ob=4', [['camp', 'Choisir cet avatar'], ['camp', 'Choisir plus tard']], ['avatar', 'onboarding'], { vide: '', plein: '', nuit: '' }),", 'écran ob4');
remplacer("[['credits', 'Crédits et licences'], ['parent-code', 'Espace parent']], ['journal', 'sons']),",
  "[['avatar-carnet', 'Mon avatar'], ['credits', 'Crédits et licences'], ['parent-code', 'Espace parent']], ['journal', 'sons', 'avatar']),\n" +
  "  E('avatar-carnet', 'journal', 'Changer d’avatar', 'Depuis le Carnet : le même sélecteur, dans une feuille.', 'ecran=journal&tab=carnet&avatar=1', [['carnet', 'Enregistrer']], ['avatar']),", 'écran carnet');

/* 4 · mécaniques */
remplacer("fait: 'Quatre écrans très visuels", "fait: 'Quatre écrans très visuels, puis le choix de l’avatar", 'onboarding.fait');
remplacer("valeurs: [['Écrans', () => 4]], statut: 'decide', dec: ['onb-forme', 'mic-son'], ecrans: ['ob1', 'ob2', 'ob3', 'ob4'],",
  "valeurs: [['Écrans', () => 5]], statut: 'decide', dec: ['onb-forme', 'mic-son', 'onb-avatar'], ecrans: ['ob1', 'ob2', 'ob3', 'ob4', 'ob-avatar'],", 'onboarding.valeurs');
remplacer("  { id: 'sons', g: 'Sons',",
  "  { id: 'avatar', g: 'Profil', t: 'L’avatar de profil', fait: 'Choisit un animal et une couleur pour son image de profil juste après l’accueil ; peut en changer dans le Carnet. L’avatar est à part de la chouette, qui reste le compagnon. « Choisir plus tard » donne le renard ocre.', recoit: 'Son médaillon dans la barre du camp, le Carnet, l’espace parent et les en-têtes du journal.', valeurs: [['Animaux', () => 12], ['Couleurs', () => 7], ['Par défaut', () => 'renard ocre']], statut: 'decide', dec: ['onb-avatar'], ecrans: ['ob-avatar', 'avatar-carnet', 'camp', 'parent-semaine'], essayer: 'ecran=onboarding&ob=4', note: 'Pictogrammes Game-icons.net, crédités dans le Carnet.' },\n  { id: 'sons', g: 'Sons',", 'mécanique');

/* 5 · décision */
remplacer("  D('mic-vides', 9,", "  Object.assign(D('cam-lumiere', 1, 'Quelle lumière pour le camp ?', 'Un module de lumière commun, qui suit l’heure', 'La teinte des objets, les ombres portées, la profondeur et les lumières (feu, lanternes, porte de la tente) viennent d’un seul module : le soleil et la lune décident de la direction et de la longueur des ombres, le feu et les lanternes éclairent le sol la nuit.'), { par: '08/10' }),\n  Object.assign(D('onb-avatar', 7, 'Un avatar de profil ?', '12 animaux et 7 couleurs, juste après l’accueil', 'C’est l’image de profil, distincte de la chouette (le compagnon). Modifiable dans le Carnet. « Choisir plus tard » donne le renard ocre. Rien à nourrir ni à débloquer : un portrait, pas un compteur.'), { par: '08/10' }),\n  D('mic-vides', 9,", 'décision');

/* 6 · journal des changements */
remplacer("V.CHANGEMENTS = [\n", "V.CHANGEMENTS = [\n  ['08/10/2026', 'Image de profil (avatar), distincte de la chouette compagnon : après l’onboarding, on choisit un animal (12) et une couleur (7) ; modifiable dans le Carnet. Module commun/athena-avatars.js, deux finitions (Figures : aplat et filet d’encre ; Veillée : filet or et liseré prune). Écrans ob-avatar et avatar-carnet, mécanique « L’avatar de profil », décision onb-avatar.'],\n", 'changements');

if (option === '--essai') { console.log(n + ' modifications prévues, rien écrit.'); process.exit(0); }
fs.writeFileSync(fichier + '.avant-avatars', fs.readFileSync(fichier));
fs.writeFileSync(fichier, s);
console.log(n + ' modifications écrites dans ' + fichier + ' (copie : ' + fichier + '.avant-avatars).');
