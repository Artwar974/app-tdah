var ATHENA_RACINE = (function () { try { var s = document.currentScript && document.currentScript.src; return s ? new URL('../', s).href : ''; } catch (e) { return ''; } })(); window.ATHENA_RACINE = window.ATHENA_RACINE || ATHENA_RACINE;
/*! athena-icones.js 2.3 — jeux d’icônes de la V1 : « Veillée d’origine » (au trait, ci-dessous) et « Figures » (plus bas).
 * Grille 24, trait 1,8 arrondi en currentColor (corrigé selon la taille : même épaisseur à l’écran), une seule « touche d’or » (--ic-a) posée sous le trait, comme un aplat de gouache.
 *   <athena-icone nom="feu" taille="28"></athena-icone>
 *   AthenaIcones.svg('feu', 28)            → chaîne SVG
 * Le jeu de la Veillée d’origine, gardée pour comparer. */
(function (W) {
const A = d => '<path fill="var(--ic-a,#f0d3a8)" stroke="none" d="' + d + '"/>';
const AC = (cx, cy, r) => '<circle fill="var(--ic-a,#f0d3a8)" stroke="none" cx="' + cx + '" cy="' + cy + '" r="' + r + '"/>';
const P = d => '<path d="' + d + '"/>';
const flamme = 'M12 21c-4 0-6-2.7-6-6 0-3.5 3-5.5 3.5-9 2 1.5 3 3 3 5 1-1 1.5-2 1.5-3.5 2.5 2 4 4.7 4 7.5 0 3.3-2 6-6 6z';
const etoile = 'm12 3.5 2.6 5.4 5.9.8-4.3 4.1 1 5.8L12 16.8l-5.2 2.8 1-5.8L3.5 9.7l5.9-.8z';
const coeur = 'M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z';
const goutte = 'M12 3.5s-6 6.5-6 10.5a6 6 0 0 0 12 0c0-4-6-10.5-6-10.5z';
const hp = 'M4 9.5h3.5L12 5.5v13l-4.5-4H4z';
const ticket = 'M-5.3-3.8H1.6a1.2 1.2 0 0 0 2.4 0H5.3a1.2 1.2 0 0 1 1.2 1.2V2.6a1.2 1.2 0 0 1-1.2 1.2H4a1.2 1.2 0 0 0-2.4 0H-5.3a1.2 1.2 0 0 1-1.2-1.2V-2.6a1.2 1.2 0 0 1 1.2-1.2z';   /* 22/10 · un ticket centré sur l'origine (13 × 7,6), deux encoches sur les grands côtés : le pass du Grand Sentier */
const visage = (bouche, yeux) => AC(12, 12, 8.5) + '<circle cx="12" cy="12" r="8.5"/>' + (yeux || '<path d="M9 9.8v.4M15 9.8v.4" stroke-width="2.4"/>') + P(bouche);
/* [nom, famille, libellé, ancien identifiant, dessin] */
const L = [
 ['medicament', 'quetes', 'Médicament', 'pill', '<g transform="rotate(-40 12 12)">' + A('M12 8.5h5.5a3.5 3.5 0 0 1 0 7H12z') + '<rect x="3" y="8.5" width="18" height="7" rx="3.5"/>' + P('M12 8.5v7') + '</g>'],
 ['travail', 'quetes', 'Travail concentré', 'laptop', A('M6.5 6.5h11v7h-11z') + '<rect x="5" y="5" width="14" height="10" rx="1.5"/>' + P('M2.5 19h19l-2-4h-15z')],
 ['sport', 'quetes', 'Sport', 'dumbbell', '<circle cx="12" cy="12" r="8.5"/>' + A('m12 8.6 3.2 2.3-1.2 3.8h-4l-1.2-3.8z') + P('m12 8.6 3.2 2.3-1.2 3.8h-4l-1.2-3.8zM12 8.6V3.5M15.2 10.9l4.8-1.6M14 14.7l2.9 4.1M10 14.7l-2.9 4.1M8.8 10.9 4 9.3')],
 ['musique', 'quetes', 'Musique', 'guitar', '<ellipse fill="var(--ic-a,#f0d3a8)" stroke="none" cx="7.5" cy="17.5" rx="3" ry="2.5"/><ellipse cx="7.5" cy="17.5" rx="3" ry="2.5"/><ellipse cx="16.5" cy="15" rx="3" ry="2.5"/>' + P('M10.5 17.5V5l9-2v12M10.5 9l9-2')],
 ['lecture', 'quetes', 'Lecture', 'book', A('M12 6.5c3-2 6-2 9-1V19c-3-1-6-1-9 1z') + P('M3 5.5c3-1 6-1 9 1 3-2 6-2 9-1V19c-3-1-6-1-9 1-3-2-6-2-9-1zM12 6.5V20')],
 ['dents', 'quetes', 'Se brosser les dents', null, A('M7.2 6.3c-1 0-1.6.8-1.6 2 0 .9.7 1.1 1.1.5.6-.8 1.3-1.4 2-1.8.5-.3.2-.7-1.5-.7z') + P('M7 3.5c-2.5 0-3.5 2-3.5 4.5 0 3 1.5 4.5 2 7.5.4 2.6 1 5 2.3 5 1.6 0 1.4-5 4.2-5s2.6 5 4.2 5c1.3 0 1.9-2.4 2.3-5 .5-3 2-4.5 2-7.5 0-2.5-1-4.5-3.5-4.5-2 0-3 1-5 1s-3-1-5-1z')],
 ['dormir', 'quetes', 'Se coucher', null, A('M3 13h18v4H3z') + P('M3 7v12M21 13v6M3 13h18v4H3M6.5 13v-2.5A1.5 1.5 0 0 1 8 9h3a1.5 1.5 0 0 1 1.5 1.5V13M15.5 4.5h3l-3 3h3')],
 ['repas', 'quetes', 'Repas', null, A('M4 12h16a8 8 0 0 1-16 0z') + P('M3 12h18M4 12a8 8 0 0 0 16 0M9 3.5c-1 1.5 1 2.5 0 4M13 3.5c-1 1.5 1 2.5 0 4')],
 ['devoirs', 'quetes', 'Devoirs', null, A('M5 12h14v7.5H5z') + '<rect x="5" y="7" width="14" height="12.5" rx="2"/>' + P('M9 7V5.5A1.5 1.5 0 0 1 10.5 4h3A1.5 1.5 0 0 1 15 5.5V7M5 12h14M11 12v2h2v-2')],
 ['ranger', 'quetes', 'Ranger', null, A('M4 10h16v9.5H4z') + P('M3 6.5h18V10H3zM4 10v9.5h16V10M10 13.5h4')],
 ['laver', 'quetes', 'Se laver', null, A(goutte) + P(goutte) + P('M9.5 14.5a2.5 2.5 0 0 0 2.5 2.5')],
 ['animal', 'quetes', 'S’occuper de l’animal', null, '<ellipse fill="var(--ic-a,#f0d3a8)" stroke="none" cx="12" cy="16" rx="4" ry="3.5"/><ellipse cx="12" cy="16" rx="4" ry="3.5"/><circle cx="6" cy="10.5" r="1.8"/><circle cx="9.5" cy="6.5" r="1.8"/><circle cx="14.5" cy="6.5" r="1.8"/><circle cx="18" cy="10.5" r="1.8"/>'],
 ['plante', 'quetes', 'Arroser les plantes', null, A('M12 12C12 8 9 5 4.5 5c0 4 3 7 7.5 7zM12 10c0-3 2.5-5.5 7-5.5 0 3.5-2.5 5.5-7 5.5z') + P('M12 12C12 8 9 5 4.5 5c0 4 3 7 7.5 7zM12 10c0-3 2.5-5.5 7-5.5 0 3.5-2.5 5.5-7 5.5zM12 20.5V10M7.5 20.5h9')],
 ['habits', 'quetes', 'S’habiller', null, A('M9 4h6l5 3-2 4-2-1v10H8V10l-2 1-2-4z') + P('M9 4h6l5 3-2 4-2-1v10H8V10l-2 1-2-4zM9 4a3 3 0 0 0 6 0')],

 /* 19/10 · les quêtes des journées types et des catégories ont chacune leur dessin au trait (plus d’icône de repli dans la Veillée) */
 ['sac', 'quetes', 'Préparer mon sac', null, A('M6 9h12v11H6z') + P('M6 9h12v11H6zM9 9V6a3 3 0 0 1 6 0v3M8.5 14h7M12 14v6M6 12H4.5v5H6M18 12h1.5v5H18')],
 ['controle', 'quetes', 'Réviser, un contrôle', null, A('M6 3h8l4 4v14H6z') + P('M6 3h8l4 4v14H6zM14 3v4h4M8.5 14l2.5 2.5 5-5M9 9h3')],
 ['respirer', 'quetes', 'Respirer, poser le téléphone', null, AC(12, 12, 8.5) + '<circle cx="12" cy="12" r="8.5"/>' + P('M7.5 10c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0M7.5 14.5c1.5-1.3 3-1.3 4.5 0s3 1.3 4.5 0')],
 ['concentre', 'quetes', 'Travail concentré', null, AC(12, 12, 8.5) + '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><circle cx="12" cy="12" r="1.2" fill="currentColor" stroke="none"/>' + P('M12 3.5v2M12 18.5v2M3.5 12h2M18.5 12h2')],
 ['guitare', 'quetes', 'Jouer de la guitare', null, '<ellipse fill="var(--ic-a,#f0d3a8)" stroke="none" cx="8" cy="16.5" rx="4.5" ry="4"/><ellipse cx="8" cy="16.5" rx="4.5" ry="4"/>' + P('M10.5 13 19 4.5M19 4.5l1.5 1.5M17 6.5l1.5 1.5M8 16.5h.01')],
 ['cahier', 'quetes', 'Le cahier', null, A('M6 3h12v18H6z') + P('M6 3h12v18H6zM9.5 3v18M12.5 8h3M12.5 12h3')],
 ['crayon', 'quetes', 'Écrire', null, A('M14 6l4 4-9 9H5v-4z') + P('M5 19v-4l9-9 4 4-9 9zM12 8l4 4M5 19h14')],
 ['courrier', 'quetes', 'Le courrier', null, A('M3 6h18v12H3z') + P('M3 6h18v12H3zM3 7l9 6.5L21 7')],
 ['appel', 'quetes', 'Appeler', null, A('M6 4h3.5l1.5 4.5-2 1.5a10 10 0 0 0 5 5l1.5-2L20 14.5V18a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 2-2z') + P('M6 4h3.5l1.5 4.5-2 1.5a10 10 0 0 0 5 5l1.5-2L20 14.5V18a2 2 0 0 1-2 2A14 14 0 0 1 4 6a2 2 0 0 1 2-2z')],
 ['reunion', 'quetes', 'Une réunion', null, AC(12, 7.5, 2.5) + '<circle cx="12" cy="7.5" r="2.5"/><circle cx="5.5" cy="9.5" r="2"/><circle cx="18.5" cy="9.5" r="2"/>' + P('M8 20v-3a4 4 0 0 1 8 0v3M2.5 19.5v-2a3 3 0 0 1 3.5-3M21.5 19.5v-2a3 3 0 0 0-3.5-3')],
 ['lit', 'quetes', 'Faire son lit', null, A('M3 13h18v4H3z') + P('M3 8v12M21 13v7M3 13h18v4H3M6.5 13v-2.5A1.5 1.5 0 0 1 8 9h3a1.5 1.5 0 0 1 1.5 1.5V13')],
 ['vaisselle', 'quetes', 'La vaisselle', null, AC(10, 13, 6) + '<circle cx="10" cy="13" r="6"/><circle cx="10" cy="13" r="2.5"/>' + P('M19.5 4v16M17.5 4v4a2 2 0 0 0 4 0V4')],
 ['poubelle', 'quetes', 'Sortir les poubelles', null, A('M6 7h12l-1 13H7z') + P('M4 7h16M6 7l1 13h10l1-13M9 7V4h6v3M10 11v6M14 11v6')],
 ['balai', 'quetes', 'Passer le balai', null, A('M9 13l-3 2 2 5 4-1 1-4z') + P('M16 3l-6.5 9.5M9 13l-3 2 2 5 4-1 1-4zM6.5 15.5l5 1.5')],
 ['courses', 'quetes', 'Les courses', null, A('M4 9h16l-2 11H6z') + P('M4 9h16l-2 11H6zM8 9l4-6 4 6M9 13v4M12 13v4M15 13v4')],
 ['eau', 'quetes', 'Boire de l’eau', null, A('M7 9h10l-1 11H8z') + P('M6 4h12l-1.5 16h-9zM7 9h10')],
 ['course', 'quetes', 'Courir', null, AC(14.5, 5, 2) + '<circle cx="14.5" cy="5" r="2"/>' + P('M4 20l4.5-5 2.5-1 1-5 3 2.5 3-1.5M12 9l-3 4 4 2 1 5')],
 ['velo', 'quetes', 'Le vélo', null, AC(6, 16, 4) + '<circle cx="6" cy="16" r="4"/><circle cx="18" cy="16" r="4"/>' + P('M6 16l4-7h6l2 7M10 9h4M13 5h3l-2 4')],
 ['natation', 'quetes', 'Nager', null, AC(16, 7.5, 2) + '<circle cx="16" cy="7.5" r="2"/>' + P('M3 18c2 0 3-1.5 5-1.5s3 1.5 5 1.5 3-1.5 5-1.5 3 1.5 5 1.5M5 14l5-4 4 2 3-3')],
 ['ballon', 'quetes', 'Le ballon', null, AC(12, 12, 8.5) + '<circle cx="12" cy="12" r="8.5"/>' + P('M12 3.5c3 2.5 3 14.5 0 17M12 3.5c-3 2.5-3 14.5 0 17M3.5 12h17')],
 ['entrainement', 'quetes', 'L’entraînement', null, A('M5 8h2v8H5zM17 8h2v8h-2z') + P('M5 8h2v8H5zM17 8h2v8h-2zM3 10v4M21 10v4M7 12h10')],
 ['dessin', 'quetes', 'Dessiner', null, A('M12 3a9 9 0 1 0 0 18c2 0 2.2-1.8 1.2-3s-.2-3 2-3h2a4 4 0 0 0 0-8c-1-2.5-3-4-5.2-4z') + P('M12 3a9 9 0 1 0 0 18c2 0 2.2-1.8 1.2-3s-.2-3 2-3h2a4 4 0 0 0 0-8c-1-2.5-3-4-5.2-4z') + '<circle cx="8" cy="10" r="1.1" fill="currentColor" stroke="none"/><circle cx="12" cy="7.5" r="1.1" fill="currentColor" stroke="none"/><circle cx="8" cy="14.5" r="1.1" fill="currentColor" stroke="none"/>'],
 ['jeu', 'quetes', 'Jouer', null, A('M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1l-2-3H9l-2 3H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4z') + P('M6 8h12a4 4 0 0 1 4 4v2a4 4 0 0 1-4 4h-1l-2-3H9l-2 3H6a4 4 0 0 1-4-4v-2a4 4 0 0 1 4-4zM7 12h4M9 10v4M15.5 11.5h.01M17.5 13.5h.01')],
 ['masque', 'quetes', 'Le théâtre', null, A('M5 4c4 2 10 2 14 0v9a7 7 0 0 1-14 0z') + P('M5 4c4 2 10 2 14 0v9a7 7 0 0 1-14 0zM8.5 10h2M13.5 10h2M9 15c2 1.5 4 1.5 6 0')],
 ['sortie', 'quetes', 'Sortir', null, A('M4 3h9v18H4z') + P('M4 3h9v18H4zM13 12h8M18 9l3 3-3 3M10 12h.01')],
 ['meditation', 'quetes', 'Un moment calme', null, AC(12, 6, 2.5) + '<circle cx="12" cy="6" r="2.5"/>' + P('M12 10v4M5 19c2-4 5-5 7-5s5 1 7 5M3 19h18M8 14l-3 3M16 14l3 3')],
 ['peigne', 'quetes', 'Se coiffer', null, A('M4 7h16v4H4z') + P('M4 7h16v4H4zM6 11v6M9 11v6M12 11v6M15 11v6M18 11v6')],
 ['proche', 'quetes', 'Un proche', null, AC(8.5, 8, 2.5) + '<circle cx="8.5" cy="8" r="2.5"/><circle cx="16" cy="9" r="2"/>' + P('M3 20v-3a5.5 5.5 0 0 1 11 0v3M14 20v-2.5a4 4 0 0 1 7 0V20')],
 ['marcher', 'quetes', 'Marcher', null, AC(13, 4.5, 2) + '<circle cx="13" cy="4.5" r="2"/>' + P('M9 21l2-6-1-4 3 3 1 7M10 11l-3 2 1 3M13 8l3 3 3-1')],

 ['feu', 'camp', 'Le feu', null, A('M12 20.5c-2 0-3-1.3-3-3 0-1.8 1.5-2.7 1.8-4.5 1.5 1 3 2.3 3 4.5 0 1.7-1 3-1.8 3z') + P(flamme)],
 ['chouette', 'camp', 'Le guide (provisoire)', null, AC(9.3, 10.5, 2) + AC(14.7, 10.5, 2) + P('M6 5.5 8 7.5M18 5.5 16 7.5M6 8.5C6 6 8.7 4.5 12 4.5s6 1.5 6 4V14a6 6 0 0 1-12 0z') + '<circle cx="9.3" cy="10.5" r="2"/><circle cx="14.7" cy="10.5" r="2"/>' + P('m11 13.8 1 1.4 1-1.4')],
 ['temple', 'camp', 'Le temple', null, A('M3 9 12 4l9 5z') + P('M3 9 12 4l9 5M4.5 9h15M6 9v9M10 9v9M14 9v9M18 9v9M3.5 20.5h17M4.5 18h15')],
 ['tente', 'camp', 'La tente', 'tent', A('M9 20l3-5 3 5z') + P('M2.5 20h19M4 20 12 6l8 14M12 6l-1.5-2.5M12 6l1.5-2.5M9 20l3-5 3 5')],
 ['piece', 'camp', 'Or (pièce)', 'coin', AC(12, 12, 8.5) + '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5"/>'],
 ['etoile', 'camp', 'XP (étoile)', 'star', A(etoile) + P(etoile)],
 ['lanterne', 'camp', 'Lumière du mont', null, A('M8 9h8v9H8z') + P('M9 5.5h6M12 3v2.5M7 9h10M8 9v9M16 9v9M7 18h10M9.5 18v2.5h5V18M8 9l1-3.5h6L16 9')],
 ['elan', 'camp', 'Élan', null, A('M12 12l7 7H5z') + P('M5 19l7-7 7 7M5 13l7-7 7 7')],
 ['surprise', 'camp', 'Surprise', null, A('M11 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7z') + P('M11 3c.6 4.6 2.4 6.4 7 7-4.6.6-6.4 2.4-7 7-.6-4.6-2.4-6.4-7-7 4.6-.6 6.4-2.4 7-7zM18.5 16v4.5M16.25 18.25h4.5')],
 ['fragment', 'camp', 'Fragment', null, A('M12 3 18 9 12 21 6 9z') + P('M12 3 18 9 12 21 6 9zM6 9h12M12 3l-2 6 2 12 2-12z')],
 ['coeur', 'camp', 'Cœur', null, A(coeur) + P(coeur)],
 ['coffre', 'camp', 'Coffre', null, A('M4 11h16v8.5H4z') + P('M4 11V9a5 5 0 0 1 5-5h6a5 5 0 0 1 5 5v2M4 11h16v8.5H4zM10.5 11v3h3v-3')],
 ['cadeau', 'camp', 'Jeton cadeau', null, A('M4 9h16v11H4z') + '<rect x="4" y="9" width="16" height="11" rx="1.5"/>' + P('M3 9h18M12 9v11M12 9c-2-4-6-4-6-1.5S10 9 12 9zM12 9c2-4 6-4 6-1.5S14 9 12 9z')],
 ['autel', 'camp', 'L’autel', null, A('M8 8h8l-1 4H9z') + P('M7 8h10M8 8l1 4h6l1-4M9 12v6M15 12v6M5.5 20.5h13M6.5 18h11M12 3.5c-1 1-1 2.2 0 3.5 1-1.3 1-2.5 0-3.5z')],
 /* 22/10 · le compagnon : une tête cornue vue de face (le minotaure et ceux qui le rejoignent) : deux cornes, le museau, l’anneau ; l’icône « animal » reste à la quête de l’animal */
 ['compagnon', 'camp', 'Le compagnon', null, A('M7.5 9.2c0-2.2 2-3.7 4.5-3.7s4.5 1.5 4.5 3.7v3.6c0 3.4-2 6.2-4.5 6.2S7.5 16.2 7.5 12.8z') + P('M7.5 9.2c0-2.2 2-3.7 4.5-3.7s4.5 1.5 4.5 3.7v3.6c0 3.4-2 6.2-4.5 6.2S7.5 16.2 7.5 12.8zM8.4 8.5C6.4 8.2 4.8 6.6 4 3.4c2.2.6 4.2 2.2 5.4 4.4M15.6 8.5c2-.3 3.6-1.9 4.4-5.1-2.2.6-4.2 2.2-5.4 4.4M9.6 14.2c0 1.4 1.1 2.3 2.4 2.3s2.4-.9 2.4-2.3') + '<path d="M10 11.6v.4M14 11.6v.4" stroke-width="2.4"/><circle cx="12" cy="17.8" r="1.3"/>'],

 ['camp', 'navigation', 'Le camp', null, A('M3 19 9 9l3 5 2-3 7 8z') + P('M2.5 19.5h19M3 19 9 9l3 5M10.8 12 12 14l2-3 7 8')],
 ['journal', 'navigation', 'Journal', 'journal', A('M13 3v7l2-1.5 2 1.5V3z') + P('M5 5a2 2 0 0 1 2-2h12v15H7a2 2 0 0 0-2 2zM5 20a2 2 0 0 0 2 2h12v-4M13 3v7l2-1.5 2 1.5V3')],
 ['agenda', 'navigation', 'Agenda', null, A('M4 9h16v9a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2z') + '<rect x="4" y="5" width="16" height="15" rx="2"/>' + P('M4 9h16M8.5 3v4M15.5 3v4M8.5 13v.2M12 13v.2M15.5 13v.2M8.5 16.5v.2M12 16.5v.2')],
 ['historique', 'navigation', 'Historique', null, A('M8 20h8c0-3-4-4-4-6 0 2-4 3-4 6z') + P('M6 3.5h12M6 20.5h12M7.5 3.5c0 5 4.5 5.5 4.5 8.5s-4.5 3.5-4.5 8.5M16.5 3.5c0 5-4.5 5.5-4.5 8.5s4.5 3.5 4.5 8.5')],
 ['carnet', 'navigation', 'Carnet', null, A('M14 3.5V8h4.5z') + P('M6 3.5h8l4.5 4.5v12.5H6zM14 3.5V8h4.5M9 12.5h6M9 16h4')],
 ['parent', 'navigation', 'Espace parent', null, AC(16, 9, 2.2) + '<circle cx="9" cy="7.5" r="3"/><circle cx="16" cy="9" r="2.2"/>' + P('M3.5 20c0-3.6 2.4-6 5.5-6s5.5 2.4 5.5 6M15.5 14c2.6 0 5 1.8 5 5')],
 ['reglages', 'navigation', 'Réglages', null, P('M4 7h9M17 7h3M4 17h3M11 17h9') + AC(15, 7, 2) + AC(9, 17, 2) + '<circle cx="15" cy="7" r="2"/><circle cx="9" cy="17" r="2"/>'],
 ['retour', 'navigation', 'Retour', 'left', P('M10 6 4 12l6 6M4 12h16')],
 ['aide', 'navigation', 'Aide', null, AC(12, 12, 8.5) + '<circle cx="12" cy="12" r="8.5"/>' + P('M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.3-1 .9-1 1.7M12 16.8v.2')],
 /* 22/10 · le pass du Grand Sentier (le bouton rond du camp) : deux tickets inclinés avec encoches, celui de devant porte la touche d'or et cache l'autre */
 ['pass', 'navigation', 'Le pass du Grand Sentier', null, '<g transform="translate(11.5 11.3) rotate(-36)">' + P(ticket) + '</g><g transform="translate(12.9 14.3) rotate(-14)">' + A(ticket) + P(ticket + 'M2.8-1.7v1M2.8.7v1') + '</g>'],

 ['ajouter', 'actions', 'Créer une quête', 'plus', AC(12, 12, 8.5) + P('M12 7.5v9M7.5 12h9')],
 ['valider', 'actions', 'C’est fait', 'check', '<path d="m5 12.5 4.5 4.5L19 7.5" stroke-width="2.4"/>'],
 ['fermer', 'actions', 'Fermer', 'x', P('M6 6l12 12M18 6 6 18')],
 ['modifier', 'actions', 'Modifier', null, A('M5 15l4 4H5z') + P('M16.5 3.5l4 4L9 19H5v-4zM13.5 6.5l4 4')],
 ['minuteur', 'actions', 'Minuteur', 'clock', A('M12 13.5V6a7.5 7.5 0 0 1 7.5 7.5z') + '<circle cx="12" cy="13.5" r="7.5"/>' + P('M12 13.5V10M10 3h4M12 3v3M18 6.5l1.5-1.5')],
 ['son', 'actions', 'Son', null, A(hp) + P(hp) + P('M15.5 9a4 4 0 0 1 0 6M18 6.5a7.5 7.5 0 0 1 0 11')],
 ['son-coupe', 'actions', 'Son coupé', null, A(hp) + P(hp) + P('M16 9.5l5 5M21 9.5l-5 5')],
 ['jouer', 'actions', 'Jouer', null, A('M8 5.5v13l10.5-6.5z') + P('M8 5.5v13l10.5-6.5z')],
 ['etapes', 'actions', 'Étapes', null, P('M10 7h10M10 12h10M10 17h10m-16.5-10 1.5 1.5L7.5 6') + AC(5, 12, 1.6) + '<circle cx="5" cy="12" r="1.6"/><circle cx="5" cy="17" r="1.6"/>'],
 ['rechercher', 'actions', 'Rechercher', null, AC(10.5, 10.5, 6.5) + '<circle cx="10.5" cy="10.5" r="6.5"/>' + P('m15.5 15.5 5 5')],
 ['toucher', 'actions', 'Toucher, glisser', null, A('M9 16V5.5a1.5 1.5 0 0 1 3 0V11h3v-.5a1.5 1.5 0 0 1 3 0v4a6.5 6.5 0 0 1-6.5 6.5h-.5a6 6 0 0 1-5-2.8L4 15a1.5 1.5 0 0 1 2.5-1.7z') + P('M9 16V5.5a1.5 1.5 0 0 1 3 0V10M12 9.5a1.5 1.5 0 0 1 3 0V11M15 10.5a1.5 1.5 0 0 1 3 0v4a6.5 6.5 0 0 1-6.5 6.5h-.5a6 6 0 0 1-5-2.8L4 15a1.5 1.5 0 0 1 2.5-1.7L9 16')],
 ['envoyer', 'actions', 'Envoyer', null, A('M21 3 3 10.5l7 3 3 7z') + P('M21 3 3 10.5l7 3 3 7zM10 13.5 21 3')],
 ['verrou', 'actions', 'Accès parent', null, A('M5 11h14v7.5a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2z') + '<rect x="5" y="11" width="14" height="9.5" rx="2"/>' + P('M8 11V8a4 4 0 0 1 8 0v3M12 15v2')],

 ['jour', 'moments', 'Jour', 'sun', AC(12, 12, 4) + '<circle cx="12" cy="12" r="4"/>' + P('M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4')],
 ['coucher', 'moments', 'Coucher', 'sunrise', A('M7 18a5 5 0 0 1 10 0z') + P('M3 18h18M7 18a5 5 0 0 1 10 0M12 8V4.5M4.5 11.5l1.8 1.2M19.5 11.5l-1.8 1.2M6 21.5h12')],
 ['nuit', 'moments', 'Nuit', 'moon', A('M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5z') + P('M19 14.5A7.5 7.5 0 0 1 9.5 5a7.5 7.5 0 1 0 9.5 9.5zM17 3.5v3M15.5 5h3')],

 ['avis-1', 'avis', 'Pas du tout', null, visage('M8.5 16.5c2-2 5-2 7 0')],
 ['avis-2', 'avis', 'Bof', null, visage('M8.5 15.5h7')],
 ['avis-3', 'avis', 'Bien', null, visage('M8.5 14.5c2 1.6 5 1.6 7 0')],
 ['avis-4', 'avis', 'Très bien', null, visage('M8 13.8c2 3.2 6 3.2 8 0z')],
 ['avis-5', 'avis', 'Génial', null, visage('M8 13.5c1.5 4 6.5 4 8 0z', '<path d="M7.5 10l1.5-1.2 1.5 1.2M13.5 10l1.5-1.2 1.5 1.2"/>')]
];
const I = W.AthenaIcones = W.AthenaIcones || {};
I.FAMILLES = { quetes: 'Quêtes', camp: 'Camp et ressources', navigation: 'Navigation', actions: 'Actions', moments: 'Moments du jour', avis: 'Avis (remplace les visages emoji)' };
I.liste = L.map(([nom, famille, libelle, ancien]) => ({ nom, famille, libelle, ancien }));
const BY = {}; L.forEach(x => { BY[x[0]] = x[4]; });
/* 17/10/2026 · les noms du camp qui grandit, au trait : ils reprennent un dessin proche (le jeu Figures a les siens) */
Object.assign(BY, { bois: BY.plante, comptoir: BY.piece, ponton: BY.envoyer, bateau: BY.envoyer, forge: BY.reglages, hameau: BY.parent, minotaure: BY.compagnon, chantier: BY.modifier, panneau: BY.verrou, lampion: BY.lanterne, nouveaute: BY.cadeau });   /* 22/10 · minotaure : la tête cornue du compagnon */
I.connu = n => !!BY[n];   /* 19/10 : « vrai » dessin ou repli (le vérificateur du projet s'en sert) */
I.corps = n => BY[n] || BY.surprise;
/* Taille optique : quelques dessins remplissaient moins la grille que les autres (feu, cœur, élan, jouer) ;
 * ils sont agrandis autour de leur centre, trait compensé : [échelle, centre x, centre y] */
I.OPTIQUE = { feu: [1.13, 12, 13.5], coeur: [1.2, 12, 13], elan: [1.2, 12, 12.5], jouer: [1.2, 13.25, 12] };
I.optique = (n, w) => { const c = I.corps(n), o = I.OPTIQUE[n]; return o ? '<g transform="translate(' + o[1] + ' ' + o[2] + ') scale(' + o[0] + ') translate(' + -o[1] + ' ' + -o[2] + ')" stroke-width="' + Math.round(w / o[0] * 100) / 100 + '">' + c + '</g>' : c; };
/* Trait optique : à l’écran, le trait garde à peu près la même épaisseur de 16 à 48 px (1,8 sur la grille à 24 px) */
I.trait = t => { const p = parseFloat(t); return p > 0 && /^\d+(\.\d+)?(px)?$/.test(String(t)) ? Math.round(Math.max(1.3, Math.min(2.3, 1.8 * Math.pow(24 / p, .6))) * 100) / 100 : 1.8; };
I.svg = (n, t, o) => '<svg viewBox="0 0 24 24" width="' + (t || '1em') + '" height="' + (t || '1em') + '" fill="none" stroke="currentColor" stroke-width="' + ((o && o.trait) || I.trait(t)) + '" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" style="flex:none;display:block">' + I.optique(n, (o && o.trait) || I.trait(t)) + '</svg>';
if (W.customElements && !customElements.get('athena-icone')) customElements.define('athena-icone', class extends HTMLElement {
  static get observedAttributes() { return ['nom', 'taille', 'trait', 'jeu']; }
  connectedCallback() { this.rendre(); }
  attributeChangedCallback() { this.rendre(); }
  rendre() { if (/\{\{/.test((this.getAttribute('nom') || '') + (this.getAttribute('taille') || ''))) return;   /* gabarit pas encore rempli ({{ … }}) : rien à dessiner */
    const t = this.getAttribute('taille') || 24; this.style.display = 'inline-flex'; this.style.flex = 'none'; const r = this.shadowRoot || this.attachShadow({ mode: 'open' }); r.innerHTML = I.svg(this.getAttribute('nom'), t + (/\D$/.test(t) ? '' : 'px'), { trait: +this.getAttribute('trait') || 0, jeu: this.getAttribute('jeu') }); }
});
})(window);

/*! athena-icones.js 2.0 — jeu « figures » (DA Figures · rév. 2), chargé à la demande depuis athena-icones-figures.js.
 *   <athena-icone nom="lecture" jeu="figures" taille="24"></athena-icone>
 * Sans attribut jeu : le jeu au trait de la Veillée d’origine. En attendant le chargement, on retombe sur le trait. */
(function (W) {
const I = W.AthenaIcones; if (!I || !W.document) return;
const SRC = (W.document.currentScript && W.document.currentScript.src) || '';
const base = I.svg; if (!I.FIGURES && W.ATHENA_FIGURES) Object.assign(I, W.ATHENA_FIGURES); let etat = I.FIGURES ? 2 : 0;
const rafraichir = () => W.document.querySelectorAll('athena-icone[jeu="figures"]').forEach(e => e.rendre && e.rendre());
W.document.addEventListener('athena-figures', () => { if (!I.FIGURES && W.ATHENA_FIGURES) Object.assign(I, W.ATHENA_FIGURES); etat = 2; rafraichir(); });
if (etat === 2) W.setTimeout(rafraichir, 0);
const charger = () => { if (etat || !SRC || W.ATHENA_FIGURES) return; let u; try { u = new URL('athena-icones-figures.js?v=7', SRC).href; } catch (e) { return; } if (!/^https?:/.test(u)) return; etat = 1; const s = W.document.createElement('script'); s.src = u; W.document.head.appendChild(s); };
I.charger = charger;
/* Taille optique des Figures : étapes, son, son coupé et jouer remplissaient 60 à 70 % de la grille (les autres, 90 %) ; agrandis et recentrés */
I.OPTIQUE_F = { etapes: [1.41, 238, 239], son: [1.2, 256, 256], 'son-coupe': [1.2, 256, 256], jouer: [1.25, 256, 256] };
I.svgFigures = (n, t) => { const o = I.OPTIQUE_F[n], c = I.FIGURES[n]; return '<svg viewBox="0 0 512 512" width="' + (t || '1em') + '" height="' + (t || '1em') + '" fill="currentColor" aria-hidden="true" style="flex:none;display:block">' + (o ? '<g transform="translate(256 256) scale(' + o[0] + ') translate(' + -o[1] + ' ' + -o[2] + ')">' + c + '</g>' : c) + '</svg>'; };
I.svg = (n, t, o) => {
  if (o && o.jeu === 'figures') {
    if (!I.FIGURES && W.ATHENA_FIGURES) Object.assign(I, W.ATHENA_FIGURES);
    if (I.FIGURES) { if (I.FIGURES[n]) return I.svgFigures(n, t); } else charger();
  }
  return base(n, t, Object.assign({}, o, { jeu: '' }));
};
})(window);
