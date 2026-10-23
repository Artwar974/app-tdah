/*! athena-economie.js — l’économie de la V1 d’Athéna (version 5 du module, 22/10/2026 : les compagnons ont un nom, une rareté et trois stats (flair, force, pied) ;
 *   on les recrute au Ponton pour un prix fixe, la rareté se tire (recruterAleatoire) ; plus de créature au bout d’un parcours (parcours.creature = 0, la branche reste) ;
 *   le bateau se construit en 3 niveaux (ameliorerBateau : une place à bord et une destination de plus par niveau) ; trois destinations (crique, îles, détroit : des pas en plus,
 *   des voies plus dures) ; un parcours emmène plusieurs compagnons (opts.compagnons) et leurs stats grossissent la besace (compagnons.parPoint par point de stat).
 *   Version 3, 19/10/2026 ; barème version 4, 19/10/2026 : la version courte d’une quête, le défi du Hameau, VARIANTES des choix 13 et 14,
 *   les quêtes de saison ; barème 3 du 17/10 : le Ponton se construit à l’Auberge 2, la Forge arrive à l’Auberge 3 ; la simulation donne le même résultat dans tous les navigateurs).
 *
 * Deux ressources : le bois (construire) et l’or (embellir, recruter). L’XP n’est pas une ressource.
 * Le Mont : 4 habitudes clés par jour ; les 4 validées = le Sommet, qui fait avancer le Grand Sentier (le battle pass, gratuit).
 * Les quêtes remplissent le coffre du camp ; on le ramasse quand on ouvre le camp. Les objets vont dans le sac.
 *
 * Un module sans dessin et sans dépendance : il calcule, il ne touche ni au DOM ni à la sauvegarde.
 * Toutes les fonctions sont pures : elles reçoivent le barème (eco) et un état, et rendent un nouvel état.
 * Le barème par défaut est AthenaEconomie.DEFAUT ; dans le hub, il est recopié dans athena-v1.js (V.JEU.eco),
 * qui reste la source unique des valeurs.
 *
 *   const E = AthenaEconomie, eco = V.JEU.eco;
 *   let s = E.etatInitial(eco, Date.now());
 *   let r = E.valider(eco, s, { cle: true, maintenant: Date.now() });   // r.etat, r.gains (partis dans le coffre), r.evenements
 *   r = E.ramasser(eco, r.etat, Date.now());                           // le coffre du camp passe dans les réserves
 *   E.peutAmeliorer(eco, s, 'auberge')                                 // { ok, raison, cout, manque }
 *   E.simuler(eco, E.PROFILS.regulier, 120)
 *
 * Règles garanties (outils/economie-controles.js) : aucune ressource ne baisse sans un choix de la personne ;
 * le coffre du camp ne se périme pas et n’a pas de plafond ; le feu ne descend jamais sous son plancher ;
 * une quête validée rapporte toujours quelque chose ; un jour sans Sommet ne retire rien du Sentier ;
 * rien ne s’achète avec de l’argent réel.
 */
(function (W) {
  'use strict';

  /* ── 1 · Le barème ─────────────────────────────────────────────────────────────── */
  var DEFAUT = {
    version: 5,   // 20/10 · barème 5 : gains directs, Sentier 12 par mois, expéditions en parcours, Ponton dès le premier jour
    journee: { bascule: 4 },                         // la journée de jeu commence à 4 h (réglable)

    /* Ce que rapporte une quête validée. Toutes les quêtes rapportent pareil ; une habitude clé fait en plus monter le Mont.
     * Au-delà de pleinesParJour quêtes dans la journée, une quête rapporte le « petit » gain. Le bois et l’or vont dans
     * le coffre du camp ; l’XP compte tout de suite. */
    quete: { bois: 10, or: 5, xp: 10, pleinesParJour: 6, petit: { bois: 2, or: 1, xp: 2 }, courte: { gains: 'identiques' }, direct: true },   // 20/10 · direct : les gains vont aux compteurs, le coffre du camp est l’inventaire   // 19/10 · la version courte compte comme la quête ; ses gains : 'identiques' (choix 13, A) ou 'petit' (B)

    /* Le coffre du camp : il se remplit à chaque quête et se ramasse d’un toucher. Ni plafond ni péremption.
     * Une fois par journée, en le ramassant, une petite surprise peut tomber (la table des surprises du prototype). */
    coffreCamp: {
      surprise: { chance: .2, parJour: 1, auMatin: true },   // 20/10 · auMatin : la surprise de la nuit se tire au premier geste du jour et entre dans le résumé de la veille
      surprises: [                                   // [id, poids, gain]
        ['pluie-pieces', 35, { or: 20 }],
        ['fagot', 35, { bois: 25 }],
        ['etoile-filante', 18, { bois: 10, or: 10 }],
        ['fragment', 9, { fragment: 1 }],
        ['objet', 3, { objet: 1 }]
      ]
    },

    /* Le feu : une jauge de 10 à 100, nourrie par les quêtes déposées au feu. */
    feu: {
      plancher: 10, max: 100, depart: 50,
      parQuete: 10,                                  // points par quête validée
      baisseParHeure: 2,                             // 48 points par jour : environ 5 quêtes par jour gardent un feu stable
      offrande: { bois: 10, points: 10 },            // geste facultatif
      etats: [['braises', 10], ['stable', 30], ['ardent', 80]],
      bonusBois: { braises: 0, stable: .2, ardent: .2 },
      ardentExpedition: { objets: 1, coutPoints: 20 },
      retour: { apresJours: 2, remonteA: 40 }
    },

    /* Le Mont : 4 paliers par journée, un par habitude clé validée. Les 4 = le Sommet.
     * S’il y a moins de 4 habitudes clés choisies, chaque place libre se remplit avec n’importe quelle quête.
     * joker.parSemaine : 0 par défaut. À 1, une fois par semaine, 3 habitudes sur 4 suffisent (choix à faire). */
    mont: { paliers: 4, clesMax: 4, joker: { parSemaine: 1 } },   // 20/10 · 4 habitudes + 1 joker par semaine (choix 1 tranché)

    /* Le Grand Sentier : le battle pass, gratuit et complet. Une saison d’un mois (dureeJours : 30), 12 paliers, un palier par Sommet.
     * Une récompense à chaque palier ; les paliers 3, 6, 9 et 12 sont les grandes (grand: true).
     * Après le 12e, chaque Sommet donne un objet bonus pour le camp (bonus.objets, l’un après l’autre) et bonus.or ; auDela (bois et or) ne sert
     * que si la liste des objets bonus est vide. Un jour sans Sommet ne retire rien.
     * Simulé (21/10, E.simuler, profil Régulier : 4 petites habitudes réussies 85 % du temps, 6 jours sur 7, graines 1 à 100) : la saison 1 finie en 30 jours 98 fois sur 100.
     * La saison 1 reprend des objets du calendrier des 30 journées. */
    sentier: {
      dureeJours: 30, paliers: 12, auDela: { bois: 20, or: 10 },   // 20/10 · 12 paliers par mois (choix 2 tranché) ; après le 12e, un bonus par Sommet
      bonus: { objets: ['banc', 'amphore', 'jarre', 'tapis', 'fanion', 'tenue-avatar', 'guirlande'], or: 10 },
      /* 19/10 · les saisons : quatre saisons qui se suivent et recommencent (leurs noms, couleurs et décors : V.SAISONS) ; une fin de saison garde tout
       * (le sac, le coffre, les objets) et remet seulement le palier à 0 ; les grands paliers (3, 6, 9, 12 depuis le 20/10) font la fête ; le décor de la saison arrive au palier 6, le grand au 12 */
      saisons: { cycle: ['oliviers', 'vendanges', 'lanternes', 'semailles'], finGardeTout: true, grandsPaliers: [3, 6, 9, 12], decor: { palier: 6, grand: 12 } },
      recompenses: [   // 20/10 · 12 paliers : les grands (3, 6, 9, 12) donnent un compagnon, le décor de la saison, un cadre pour l'avatar, le grand décor et le titre
        ['ressources', { bois: 40, or: 20 }], ['charme', { type: 'porteur' }], ['compagnon', { rarete: 'commun', grand: true }],
        ['objet', { id: 'lanterne' }], ['ressources', { bois: 60, or: 30 }], ['objet', { id: 'decor-saison', grand: true }],
        ['etincelle-doree', { n: 1 }], ['charme', { type: 'fouineur' }], ['cosmetique', { id: 'cadre-avatar', grand: true }],
        ['ressources', { bois: 80, or: 40 }], ['lanterne-hameau', { n: 1 }], ['objet', { id: 'grand-decor-saison', titre: true, grand: true }]
      ]
    },

    /* Le niveau de la personne (XP) : il se fête, rapporte un peu d’or, ne débloque rien d’obligatoire. */
    niveau: { base: 60, pas: 20, cadeau: { or: 20 } },

    /* Les bâtiments. L’Auberge (la tente, 4 dessins) est le niveau du camp.
     * cout[n] = passage au niveau n (n = 1 : construire) : [bois, or, minutes].
     * Barème 3 (17/10) : le Ponton (le hall des expéditions) se construit à l’Auberge 2 ; la Forge arrive à l’Auberge 3,
     * ses charmes ne servant qu’en expédition. Les nouveautés sont ensuite présentées dans l’ordre par le jeu (V.NOUVEAUTES). */
    batiments: {
      auberge:     { nom: 'L’Auberge', debloque: 1, max: 4, cout: { 2: [100, 20, 15], 3: [650, 220, 240], 4: [1800, 600, 720] } },
      comptoir:    { nom: 'Le Comptoir', debloque: 1, max: 4, cout: { 2: [90, 0, 10], 3: [360, 0, 120], 4: [1000, 0, 480] } },
      expeditions: { nom: 'Le Ponton', debloque: 1, max: 4, cout: { 1: [50, 0, 5], 2: [90, 0, 10], 3: [360, 0, 120], 4: [1000, 0, 480] } },
      forge:       { nom: 'La Forge', debloque: 3, max: 4, cout: { 1: [50, 0, 5], 2: [90, 0, 10], 3: [360, 0, 120], 4: [1000, 0, 480] } },
      social:      { nom: 'Le Kiosque du Hameau', debloque: 1, apres: { expeditions: 5 }, max: 4, cout: { 1: [50, 0, 5], 2: [90, 0, 10], 3: [360, 0, 120], 4: [1000, 0, 480] } }
    },
    batisseurs: { 1: 1, 2: 1, 3: 2, 4: 2 },
    accelerer: { parQueteBonus: 60 },                // une quête qui n’est pas une habitude clé retire 60 min au chantier le plus avancé

    /* Les expéditions : elles ne peuvent pas échouer. Niveau 0 : le Ponton n’est pas encore construit, aucune expédition. */
    expeditions: {
      durees: { 0: [], 1: [60], 2: [60, 240], 3: [60, 240, 480], 4: [60, 240, 480] },
      places: { 0: 0, 1: 1, 2: 2, 3: 3, 4: 4 },
      butin: { 60: [8, 4, 0], 240: [20, 10, .25], 480: [30, 15, .5] },   // [bois, or, chance d’un fragment]
      parCompagnonEnPlus: .15,
      parJournee: 2,
      /* 20/10 · les expéditions en parcours : étapes et minutes par niveau du Ponton, 3 chemins par étape (un type, une difficulté de 1 à 3), 20 % de chance
       * d'un chemin vers une créature au bout, les modes sans nous (facile, moyen, difficile ; « attend » : le compagnon attend notre choix), la réussite par
       * difficulté, la préparation (charmes, Forge), ce qu'on garde en cas d'échec, le butin qui grandit avec les étapes */
      parcours: { etapes: { 1: 3, 2: 5, 3: 7, 4: 9 }, minutes: { 1: 3, 2: 6, 3: 9, 4: 12 }, retourParEtape: 1.5, choix: 3, creature: 0,   // 22/10 · plus de créature au bout : on recrute au Ponton
        modes: { attend: null, facile: { butin: .8 }, moyen: { butin: 1 }, difficile: { butin: 1.4 } }, reussite: { 1: .95, 2: .8, 3: .6 },
        preparation: { charme: .1, forgeParNiveau: .03 }, recompenses: { ressources: { bois: [7, 11, 17], or: [3, 5, 8] } }, echec: .5, parEtapeBonus: .12 },
      rare: { base: .10, plafond: .5 },
      /* 22/10 · les destinations : des pas en plus de ceux du niveau du Ponton (etapes), des voies plus dures (dif : 1 = voies 1-2-3 ; 2 = 2-2-3 ; 3 = 2-3-3), un niveau de bateau demandé */
      destinations: { crique: { nom: 'La crique', etapes: 0, dif: 1, bateau: 1 }, iles: { nom: 'Les îles', etapes: 2, dif: 2, bateau: 2 }, detroit: { nom: 'Le détroit', etapes: 4, dif: 3, bateau: 3 } }
    },
    /* 22/10 · recruter au Ponton : un prix fixe, une rareté tirée (raretes), un nom tiré de la liste, trois stats de 1 à 5 selon la rareté (stats) ;
     * chaque point de stat d’un compagnon emmené ajoute parPoint au butin du parcours (en plus de parCompagnonEnPlus par compagnon de plus).
     * commun et rare restent pour les anciens appels (recruter). */
    compagnons: { recrutement: { commun: 120, rare: 350, prix: 120, raretes: { commun: .68, rare: .27, legendaire: .05 } }, depart: 1,
      stats: { commun: [1, 2], rare: [2, 4], legendaire: [3, 5] }, parPoint: .015,
      noms: ['Pyrrha', 'Nikos', 'Thalès', 'Ida', 'Orion', 'Leda', 'Bion', 'Calie', 'Dion', 'Mira', 'Teo', 'Zoé', 'Alba', 'Cosme', 'Iris', 'Lino', 'Nérée', 'Olympe', 'Phébé', 'Sélène'] },
    /* 22/10 · le bateau : niveau 1 au départ ; chaque niveau coûte (bois, or), ajoute une place à bord et ouvre une destination */
    bateau: { niveaux: { 2: { bois: 120, or: 0 }, 3: { bois: 300, or: 60 } }, max: 3 },

    /* La Forge : des charmes en bois, à emporter en expédition. Le niveau de la Forge ouvre les types. */
    forge: {
      charmes: {
        porteur:   { bois: 40, forge: 1, effet: { butin: .2 }, texte: '+20 % de bois et d’or au retour' },
        fouineur:  { bois: 40, forge: 2, effet: { rare: .20 }, texte: '+20 % de chance d’un objet rare' },
        eclaireur: { bois: 60, forge: 3, effet: { duree: -.25 }, texte: 'retour 25 % plus tôt' }
      },
      parExpedition: { 0: 0, 1: 1, 2: 1, 3: 2, 4: 2 }
    },
    comptoir: { selectionMois: [150, 200, 250, 300] },
    lore: { total: 60, parSerie: 5, auDela: { or: 15 } },

    /* Le social : l’Étincelle, un seul geste d’entraide. Après son Sommet, une par journée, à un membre du groupe.
     * Une Étincelle dorée (gagnée sur le Sentier) se garde dans le sac et s’offre n’importe quel jour. */
    social: { etincelle: { feu: 20, siSommet: { bois: 10, or: 10 } }, groupeMax: 8 },
    /* 19/10 · le défi du Hameau : chaque semaine, le groupe allume une guirlande de lanternes autour du Kiosque (un Sommet de chacun = une lanterne).
     * Le but : parMembre lanternes par membre, entre min et max. Complète : une petite fête dans chaque camp et une récompense commune (choix 14 : un décor de la semaine).
     * Incomplète en fin de semaine : rien ne se passe, une nouvelle guirlande commence lundi. On ne montre jamais qui a allumé quoi. */
    defi: { parMembre: 3, min: 12, max: 24, recompense: { id: 'decor-semaine' } },
    /* 19/10 · les quêtes de saison : chaque mois, 3 petites quêtes facultatives (textes : V.QUETES_SAISON). Récompense : un fragment de légende et un peu d’or (petit : le profil Régulier reste dans ses cibles). */
    saisonQuetes: { parMois: 3, gains: { or: 5, fragment: 1 } },

    /* Le rythme des récompenses : ce que la personne vit au plus dans une journée (sert aux contrôles et à la page Mécaniques). */
    rythme: { momentsFortsParJour: 4, description: [   // 20/10 · un retour d'expédition de plus par jour
      'À chaque quête : le bois et l’or filent du feu jusqu’aux compteurs du haut (pas d’écran).',
      'Le matin : le résumé de la veille, parfois une surprise de la nuit (une fois par jour).',
      'Le Sommet : un palier du Grand Sentier (12 par mois) et sa récompense (une fois par jour).',
      'Le retour d’une expédition : la besace des compagnons (deux fois par jour au plus).'
    ] }
  };

  /* ── 2 · Outils ────────────────────────────────────────────────────────────────── */
  var H = 3600 * 1000, J = 24 * H;
  function copie(o) { return JSON.parse(JSON.stringify(o)); }
  function borne(v, a, b) { return Math.max(a, Math.min(b, v)); }
  function hasard(graine) { var s = (graine >>> 0) || 1; return function () { s ^= s << 13; s ^= s >>> 17; s ^= s << 5; return ((s >>> 0) % 1e6) / 1e6; }; }
  function journeeDe(eco, t) {
    var d = new Date(t - eco.journee.bascule * H);
    return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
  }
  /* La semaine de jeu (pour le joker) : le lundi de la journée de jeu */
  function semaineDe(eco, t) { var d = new Date(t - eco.journee.bascule * H); d.setDate(d.getDate() - ((d.getDay() + 6) % 7)); return journeeDe(eco, d.getTime() + eco.journee.bascule * H); }

  /* ── 3 · L’état de départ ──────────────────────────────────────────────────────── */
  function etatInitial(eco, t) {
    var b = {};
    for (var id in eco.batiments) b[id] = eco.batiments[id].debloque <= 1 && !eco.batiments[id].apres ? 1 : 0;   // 20/10 · un bâtiment « après » (le Kiosque) attend
    return {
      v: 2, bois: 0, or: 0, xp: 0,
      coffre: { bois: 0, or: 0 },                    // le coffre du camp, à ramasser
      sac: { charmes: { porteur: 0, fouineur: 0, eclaireur: 0 }, objets: [], fragments: 0, cosmetiques: [], etincellesDorees: 0, lanternes: 0 },
      feu: { pts: eco.feu.depart, t: t },
      batiments: b, chantiers: [],
      clesDefinies: 0,
      jour: { id: journeeDe(eco, t), quetes: 0, cles: 0, autres: 0, sommet: false, surprise: false, expeditions: 0, etincelle: false },
      joker: { semaine: null },
      derniereQuete: null,
      sentier: { saison: 1, debut: journeeDe(eco, t), palier: 0 },
      expeditions: [], compagnons: eco.compagnons.depart,
      equipe: [compagnonOrigine(eco)], bateau: 1,   // 22/10 · l’équipe (un compagnon = { id, nom, rarete, stats }) ; le niveau du bateau
      parcours: [], expeditionsFinies: 0, rentres: [], hier: null,   // 20/10 · les parcours en cours, les expéditions finies (le Kiosque s'ouvre à 5), les derniers retours, le résumé de la veille
      historique: { joursActifs: 0, sommets: 0 },
      defi: { semaine: null, miennes: 0, fete: null },   // 19/10 · mes lanternes de la semaine (les autres : le groupe)
      quetesSaison: {}                                   // 19/10 · par mois, les quêtes de saison faites
    };
  }

  /* 19/10 · la migration douce : un état plus ancien garde tout ce qu’il a ; les champs qu’il n’a pas encore prennent leur valeur de départ */
  function completer(eco, s) {
    var r = copie(s), d = etatInitial(eco, Date.now());
    for (var k in d) {
      if (r[k] === undefined || r[k] === null) r[k] = d[k];
      else if (d[k] && typeof d[k] === 'object' && !Array.isArray(d[k]) && typeof r[k] === 'object') for (var k2 in d[k]) if (r[k][k2] === undefined) r[k][k2] = d[k][k2];
    }
    return completerEquipe(eco, r);   // 22/10 · l’équipe suit le compte des compagnons (le minotaure d’abord), le bateau au niveau 1
  }

  /* ── 3 bis · (22/10) Les compagnons : nom, rareté, stats ; l’équipe ; le bateau ───────── */
  /* Le compagnon d’origine : le minotaure, commun, des stats moyennes */
  function compagnonOrigine(eco) { return { id: 1, nom: 'Le minotaure', rarete: 'commun', stats: { flair: 2, force: 2, pied: 2 } }; }
  /* Un compagnon neuf : un nom pas encore pris si possible, trois stats dans la fourchette de sa rareté (commun 1-2, rare 2-4, légendaire 3-5) */
  function creerCompagnon(eco, equipe, rarete, A) {
    var C = eco.compagnons || {}, F = (C.stats && C.stats[rarete]) || [1, 2], N = C.noms || ['Compagnon'], pris = (equipe || []).map(function (c) { return c.nom; });
    var st = function () { return F[0] + Math.floor(A() * (F[1] - F[0] + 1)); }, i0 = Math.floor(A() * N.length), nom = N[i0], i;
    for (i = 0; i < N.length; i++) { var n2 = N[(i0 + i) % N.length]; if (pris.indexOf(n2) < 0) { nom = n2; break; } }
    return { id: (equipe || []).reduce(function (m, c) { return Math.max(m, c.id || 0); }, 0) + 1, nom: nom, rarete: rarete, stats: { flair: st(), force: st(), pied: st() } };
  }
  /* L’équipe telle qu’elle est, complétée jusqu’au compte des compagnons (sans toucher l’état) : le minotaure en 1, puis des compagnons communs tirés d’une graine fixe */
  function equipeDe(eco, s) {
    var L = (s.equipe || []).slice(), n = s.compagnons || 0;
    if (!L.length && n > 0) L.push(compagnonOrigine(eco));
    while (L.length < n) L.push(creerCompagnon(eco, L, 'commun', hasard(4242 + L.length)));
    return L;
  }
  /* La migration douce : un état sans équipe (ou dont l’équipe est en retard sur le compte) la reçoit ; sans bateau, le niveau 1. Rend le même état s’il n’y a rien à faire. */
  function completerEquipe(eco, s) {
    var L = equipeDe(eco, s); if (s.equipe && s.equipe.length === L.length && s.bateau) return s;
    var r = copie(s); r.equipe = L; r.bateau = r.bateau || 1; return r;
  }
  function compagnonDe(eco, s, id) { return equipeDe(eco, s).filter(function (c) { return c.id === id; })[0] || null; }
  /* Les compagnons en chemin : les ids emmenés par les parcours en cours (un ancien parcours sans ids compte son index) */
  function compagnonsPartis(eco, s) {
    var L = equipeDe(eco, s), ids = [];
    (s.parcours || []).forEach(function (run) { (run.compagnons || (L[run.compagnon || 0] ? [L[run.compagnon || 0].id] : [])).forEach(function (id) { if (ids.indexOf(id) < 0) ids.push(id); }); });
    return ids;
  }
  function tirerRarete(eco, A) { var R = (eco.compagnons.recrutement && eco.compagnons.recrutement.raretes) || { commun: 1 }, x = A(), acc = 0, k; for (k in R) { acc += R[k]; if (x < acc) return k; } return 'commun'; }
  /* Recruter au Ponton : le prix fixe, une rareté tirée, un compagnon de plus dans l’équipe ; la place au Ponton limite toujours */
  function recruterAleatoire(eco, s, alea) {
    var R = eco.compagnons.recrutement, prix = R.prix != null ? R.prix : R.commun, A = alea || Math.random;
    if (s.compagnons >= eco.expeditions.places[s.batiments.expeditions]) return { etat: s, ok: false, raison: 'hall-plein' };
    if (s.or < prix) return { etat: s, ok: false, raison: 'pas-assez', manque: { or: prix - s.or } };
    var r = completerEquipe(eco, s); r = r === s ? copie(s) : r;
    var rarete = tirerRarete(eco, A), c = creerCompagnon(eco, r.equipe, rarete, A);
    r.or -= prix; r.compagnons++; r.equipe.push(c);
    return { etat: r, ok: true, compagnon: c, rarete: rarete, prix: prix };
  }
  /* Le bateau : ses places à bord (une par niveau), ce qu’il peut encore devenir, l’améliorer (tout de suite, contre du bois et parfois de l’or) */
  function bateauPlaces(eco, s) { return Math.max(1, s.bateau || 1); }
  function peutAmeliorerBateau(eco, s) {
    var B = eco.bateau, n = s.bateau || 1, c = B && B.niveaux && B.niveaux[n + 1];
    if (!B || !c || n >= B.max) return { ok: false, raison: 'au-maximum', niveau: n };
    if (s.bois < c.bois || s.or < c.or) return { ok: false, raison: 'pas-assez', niveau: n, vers: n + 1, cout: c, manque: { bois: Math.max(0, c.bois - s.bois), or: Math.max(0, c.or - s.or) } };
    return { ok: true, niveau: n, vers: n + 1, cout: c };
  }
  function ameliorerBateau(eco, s) {
    var p = peutAmeliorerBateau(eco, s); if (!p.ok) return { etat: s, ok: false, raison: p.raison, detail: p };
    var r = completerEquipe(eco, s); r = r === s ? copie(s) : r; r.bois -= p.cout.bois; r.or -= p.cout.or; r.bateau = p.vers;
    return { etat: r, ok: true, niveau: p.vers };
  }
  /* Une destination : la sienne, ou la crique (la plus proche) ; ouverte si le bateau a le niveau */
  function destinationDe(eco, cle) { var D = (eco.expeditions && eco.expeditions.destinations) || {}; return D[cle] ? Object.assign({ cle: cle }, D[cle]) : D.crique ? Object.assign({ cle: 'crique' }, D.crique) : { cle: 'crique', nom: 'La crique', etapes: 0, dif: 1, bateau: 1 }; }
  function destinationOuverte(eco, s, cle) { return bateauPlaces(eco, s) >= (destinationDe(eco, cle).bateau || 1); }
  /* Le bonus de butin d’une équipée : parCompagnonEnPlus par compagnon de plus, parPoint par point de stat emmené */
  function bonusEquipe(eco, s, ids) {
    var pts = 0; (ids || []).forEach(function (id) { var c = compagnonDe(eco, s, id); if (c && c.stats) pts += (c.stats.flair || 0) + (c.stats.force || 0) + (c.stats.pied || 0); });
    return Math.round(1000 * (1 + (eco.expeditions.parCompagnonEnPlus || 0) * Math.max(0, (ids || []).length - 1) + ((eco.compagnons && eco.compagnons.parPoint) || 0) * pts)) / 1000;
  }

  /* ── 4 · Le feu ────────────────────────────────────────────────────────────────── */
  function feuA(eco, feu, t) { var h = Math.max(0, (t - feu.t) / H); return { pts: Math.max(eco.feu.plancher, feu.pts - h * eco.feu.baisseParHeure), t: t }; }
  function etatFeu(eco, pts) { var e = eco.feu.etats, r = e[0][0]; for (var i = 0; i < e.length; i++) if (pts >= e[i][1]) r = e[i][0]; return r; }
  function offrande(eco, s, fois, t) {
    var o = eco.feu.offrande, n = Math.min(fois || 1, Math.floor(s.bois / o.bois));
    if (n < 1) return { etat: s, ok: false, raison: 'pas-assez-de-bois' };
    var r = copie(s), f = feuA(eco, r.feu, t);
    r.bois -= n * o.bois; r.feu = { pts: Math.min(eco.feu.max, f.pts + n * o.points), t: t };
    return { etat: r, ok: true };
  }

  /* ── 5 · Le Mont ───────────────────────────────────────────────────────────────── */
  function paliers(eco, jour, clesDefinies) {
    var n = eco.mont.paliers, cd = borne(clesDefinies || 0, 0, eco.mont.clesMax);
    return Math.min(n, Math.min(jour.cles, cd) + Math.min(jour.autres, n - cd));
  }

  /* ── 6 · Le niveau de la personne ──────────────────────────────────────────────── */
  function niveauDe(eco, xp) {
    var n = 1, reste = xp, pour = eco.niveau.base;
    while (reste >= pour) { reste -= pour; n++; pour = eco.niveau.base + eco.niveau.pas * (n - 1); }
    return { niveau: n, dans: reste, pour: pour };
  }

  /* ── 7 · Le Grand Sentier ──────────────────────────────────────────────────────── */
  /* 19/10 · l’identifiant d’une saison (son nom dans V.SAISONS) : le cycle recommence après la dernière */
  function saisonId(eco, n) { var c = (eco.sentier.saisons && eco.sentier.saisons.cycle) || ['saison']; return c[(Math.max(1, n || 1) - 1) % c.length]; }
  /* La saison en cours : une nouvelle saison commence tous les dureeJours ; les récompenses obtenues restent. */
  function saisonA(eco, s, t) {
    var r = s, d0 = new Date(s.sentier.debut + 'T12:00:00').getTime(), jours = Math.floor((new Date(journeeDe(eco, t) + 'T12:00:00').getTime() - d0) / J);
    if (jours >= eco.sentier.dureeJours) {
      r = copie(s); var n = Math.floor(jours / eco.sentier.dureeJours);
      r.sentier = { saison: s.sentier.saison + n, debut: journeeDe(eco, d0 + n * eco.sentier.dureeJours * J), palier: 0 };
    }
    return r;
  }
  /* Donner la récompense d’un palier : les ressources vont dans le coffre du camp, le reste dans le sac. */
  function recompense(eco, r, palier) {
    var R = eco.sentier.recompenses[palier - 1];
    if (!R) {   // 20/10 · après le dernier palier : un bonus (un objet ou un décor, un peu d'or) par Sommet, sinon le bois et l'or d'avant
      var B = eco.sentier.bonus; if (B && B.objets && B.objets.length) { var nb = r.sentier.bonus || 0, id = B.objets[nb % B.objets.length]; r.sentier.bonus = nb + 1; if (/-avatar$/.test(id)) r.sac.cosmetiques.push(id); else r.sac.objets.push(id); depot(eco, r, 0, B.or || 0); return ['bonus', { id: id, or: B.or || 0 }]; }
      depot(eco, r, eco.sentier.auDela.bois, eco.sentier.auDela.or); return ['au-dela', eco.sentier.auDela]; }
    var k = R[0], v = R[1];
    if (k === 'ressources') depot(eco, r, v.bois, v.or);
    else if (k === 'charme') r.sac.charmes[v.type] += (v.n || 1);
    else if (k === 'objet') r.sac.objets.push(v.id);
    else if (k === 'cosmetique') r.sac.cosmetiques.push(v.id);
    else if (k === 'etincelle-doree') r.sac.etincellesDorees += v.n;
    else if (k === 'lanterne-hameau') r.sac.lanternes += v.n;
    else if (k === 'compagnon') { r.equipe = equipeDe(eco, r); r.compagnons += 1; r.equipe.push(creerCompagnon(eco, r.equipe, v.rarete || 'commun', hasard(palier * 7919 + r.compagnons))); }   // il s’installe au Hall, même s’il n’y a pas encore de place pour le faire partir ; 22/10 · avec son nom et ses stats
    return R;
  }
  function sommet(eco, r, ev, t) {
    r.jour.sommet = true; r.historique.sommets++; ev.push('sommet');
    if (t != null && eco.defi) defiAvancer(eco, r, t);   // 19/10 · un Sommet = une lanterne de plus sur la guirlande du Hameau
    r.sentier.palier++; ev.push('sentier-palier');
    var R = recompense(eco, r, r.sentier.palier);
    if (R[1] && R[1].grand) ev.push('sentier-grande');
    return R;
  }

  /* ── 7 bis · (19/10) Le défi du Hameau et les quêtes de saison ───────────────────── */
  /* Le défi : l’état de la semaine (lundi à dimanche). o.membres : la taille du groupe (moi compris) ; o.autres : les lanternes des autres (jamais détaillées par personne). */
  function defiEtat(eco, s, t, o) {
    o = o || {}; var sem = semaineDe(eco, t), d = s.defi && s.defi.semaine === sem ? s.defi : { semaine: sem, miennes: 0, fete: null };
    var membres = Math.max(1, o.membres || 1), cible = Math.max(eco.defi.min, Math.min(eco.defi.max, eco.defi.parMembre * membres)), autres = Math.max(0, o.autres || 0), total = Math.min(cible, d.miennes + autres);
    return { semaine: sem, cible: cible, miennes: d.miennes, autres: autres, total: total, complet: total >= cible, fete: d.fete === sem, reste: cible - total };
  }
  function defiAvancer(eco, s, t) { var sem = semaineDe(eco, t); if (!s.defi || s.defi.semaine !== sem) s.defi = { semaine: sem, miennes: 0, fete: null }; s.defi.miennes++; return s.defi; }
  /* Guirlande complète : la récompense commune, une fois par semaine (la fête est dans les pages) */
  function defiRecompenser(eco, s, t, o) {
    var r = copie(s), sem = semaineDe(eco, t); if (!r.defi || r.defi.semaine !== sem) r.defi = { semaine: sem, miennes: 0, fete: null };
    if (o && !defiEtat(eco, s, t, o).complet) return { etat: s, ok: false, raison: 'incomplet' };   // 19/10 · une guirlande incomplète ne donne rien, et ne retire rien
    if (r.defi.fete === sem) return { etat: s, ok: false, raison: 'deja' };
    r.defi.fete = sem; var R = eco.defi.recompense;   // 19/10 · choix 14 : un décor (id) dans le sac, ou du bois et de l’or dans le coffre, ou rien (la guirlande suffit)
    if (R && R.id) r.sac.objets.push(R.id); else if (R && (R.bois || R.or)) depot(eco, r, R.bois || 0, R.or || 0);
    return { etat: r, ok: true, recompense: R || null };
  }
  /* Les quêtes de saison du mois : celles déjà faites ; en faire une donne un fragment de légende et un peu d’or (au-delà des légendes, de l’or) */
  function quetesSaison(eco, s, t) { var m = journeeDe(eco, t).slice(0, 7); return { mois: m, faites: (s.quetesSaison && s.quetesSaison[m]) || [], parMois: eco.saisonQuetes.parMois }; }
  function validerQueteSaison(eco, s, id, t) {
    var m = journeeDe(eco, t).slice(0, 7), L = (s.quetesSaison && s.quetesSaison[m]) || [];
    if (L.indexOf(id) >= 0) return { etat: s, ok: false, raison: 'deja' };
    if (L.length >= eco.saisonQuetes.parMois) return { etat: s, ok: false, raison: 'mois-complet' };
    var r = copie(s), g = { or: eco.saisonQuetes.gains.or, fragment: eco.saisonQuetes.gains.fragment }; r.quetesSaison = r.quetesSaison || {}; r.quetesSaison[m] = L.concat([id]);
    depot(eco, r, 0, g.or); if (g.fragment) { if (r.sac.fragments >= eco.lore.total) { depot(eco, r, 0, eco.lore.auDela.or); g.or += eco.lore.auDela.or; g.fragment = 0; } else r.sac.fragments += g.fragment; }
    return { etat: r, ok: true, gains: g };
  }

  /* ── 8 · Valider une quête ─────────────────────────────────────────────────────── */
  /* opts : { cle, maintenant }. Rend { etat, gains, evenements, recompense }.
   * evenements : palier, sommet, sentier-palier, sentier-grande, niveau, retour, feu-<état>, chantier-accelere */
  /* 20/10 · le dépôt : aux compteurs quand le barème le dit (quete.direct), sinon dans le coffre du camp comme avant */
  function depot(eco, r, bois, or) { if (eco.quete && eco.quete.direct) { r.bois += bois || 0; r.or += or || 0; } else { r.coffre.bois += bois || 0; r.coffre.or += or || 0; } }
  /* 20/10 · la surprise de la nuit, tirée au matin (ou au ramassage, comme avant) : ce qu'elle donne entre tout de suite */
  function tirerSurprise(eco, r, A) {
    if (A() >= eco.coffreCamp.surprise.chance) return null;
    var T = eco.coffreCamp.surprises, tot = 0, x, i, gain = { bois: 0, or: 0, fragment: 0, objet: 0 };
    for (i = 0; i < T.length; i++) tot += T[i][1];
    x = A() * tot;
    for (i = 0; i < T.length; i++) { x -= T[i][1]; if (x < 0) { var g = T[i][2]; gain.bois += g.bois || 0; gain.or += g.or || 0;
      if (g.fragment) { if (r.sac.fragments >= eco.lore.total) gain.or += eco.lore.auDela.or; else { r.sac.fragments++; gain.fragment = 1; } }
      if (g.objet) { r.sac.objets.push('surprise'); gain.objet = 1; }
      depot(eco, r, gain.bois, gain.or); return { id: T[i][0], gain: gain }; } }
    return null;
  }
  /* 20/10 · valider une quête après coup (hier, avant-hier) : ses gains, son XP ; ni palier du Mont, ni feu, ni Sentier */
  function validerApresCoup(eco, s, opts) {
    var r = copie(s), g = { bois: eco.quete.bois, or: eco.quete.or, xp: eco.quete.xp }; depot(eco, r, g.bois, g.or); r.xp += g.xp;
    r.historique.apresCoup = (r.historique.apresCoup || 0) + 1; return { etat: r, ok: true, gains: g, jour: opts && opts.jour || null };
  }
  function valider(eco, s, opts) {
    var t = opts.maintenant, ev = [], jid = journeeDe(eco, t), r = saisonA(eco, s, t), recompenseSentier = null;
    r = r === s ? copie(s) : r;
    if (r.jour.id !== jid) r = nouvelleJournee(eco, r, t);

    var f = feuA(eco, r.feu, t);
    if (r.derniereQuete != null && t - r.derniereQuete >= eco.feu.retour.apresJours * J && f.pts < eco.feu.retour.remonteA) { f.pts = eco.feu.retour.remonteA; ev.push('retour'); }
    var etatAvant = etatFeu(eco, f.pts);
    var plein = r.jour.quetes < eco.quete.pleinesParJour, g = plein ? eco.quete : eco.quete.petit;
    if (opts.courte) { r.jour.courtes = (r.jour.courtes || 0) + 1; if (eco.quete.courte && eco.quete.courte.gains === 'petit') g = eco.quete.petit;   // 19/10 · la version courte compte comme la quête
      else if (eco.quete.courte && eco.quete.courte.gains === 'moitie' && plein) g = { bois: Math.round(eco.quete.bois / 2), or: Math.round(eco.quete.or / 2), xp: eco.quete.xp }; }   // choix 13 B : moitié moins de bois et d’or, même XP
    var gains = { bois: Math.round(g.bois * (1 + (eco.feu.bonusBois[etatAvant] || 0))), or: g.or, xp: g.xp };
    f.pts = Math.min(eco.feu.max, f.pts + eco.feu.parQuete);
    var etatApres = etatFeu(eco, f.pts);
    if (etatApres !== etatAvant) ev.push('feu-' + etatApres);
    r.feu = f;

    var avant = paliers(eco, r.jour, r.clesDefinies);
    r.jour.quetes++;
    if (opts.cle) r.jour.cles++; else r.jour.autres++;
    var apres = paliers(eco, r.jour, r.clesDefinies);
    if (apres > avant) ev.push('palier');
    if (apres === eco.mont.paliers && !r.jour.sommet) recompenseSentier = sommet(eco, r, ev, t);
    if (r.jour.quetes === 1) r.historique.joursActifs++;

    if (!opts.cle && r.chantiers.length) {
      var c = r.chantiers.slice().sort(function (a, b) { return a.fin - b.fin; })[0];
      c.fin = Math.max(t, c.fin - eco.accelerer.parQueteBonus * 60000); ev.push('chantier-accelere');
    }

    var n0 = niveauDe(eco, r.xp).niveau;
    depot(eco, r, gains.bois, gains.or); r.xp += gains.xp;
    var n1 = niveauDe(eco, r.xp).niveau;
    if (n1 > n0) { ev.push('niveau'); depot(eco, r, 0, eco.niveau.cadeau.or * (n1 - n0)); gains.or += eco.niveau.cadeau.or * (n1 - n0); }
    r.derniereQuete = t;
    return { etat: r, gains: gains, evenements: ev, recompense: recompenseSentier };
  }

  /* Le joker (si activé) : une fois par semaine, 3 habitudes clés sur 4 font le Sommet. On le touche soi-même. */
  function peutJoker(eco, s, t) {
    var j = eco.mont.joker.parSemaine;
    if (!j) return { ok: false, raison: 'pas-de-joker' };
    if (s.jour.id !== journeeDe(eco, t) || s.jour.sommet) return { ok: false, raison: 'pas-maintenant' };
    if (paliers(eco, s.jour, s.clesDefinies) < eco.mont.paliers - 1) return { ok: false, raison: 'trois-paliers-d-abord' };
    if (s.joker.semaine === semaineDe(eco, t)) return { ok: false, raison: 'deja-cette-semaine' };
    return { ok: true };
  }
  function utiliserJoker(eco, s, t) {
    var p = peutJoker(eco, s, t); if (!p.ok) return { etat: s, ok: false, raison: p.raison };
    var r = copie(s), ev = []; r.joker.semaine = semaineDe(eco, t);
    var R = sommet(eco, r, ev);
    return { etat: r, ok: true, evenements: ev, recompense: R };
  }

  function nouvelleJournee(eco, s, t, alea) {
    var r = copie(s), j = s.jour || {};
    /* 20/10 · le résumé de la veille (lu par le résumé du matin), puis la surprise de la nuit si la veille a eu au moins une quête */
    r.hier = { id: j.id || null, quetes: j.quetes || 0, cles: j.cles || 0, autres: j.autres || 0, courtes: j.courtes || 0, sommet: !!j.sommet, expeditions: j.expeditions || 0,
      palier: s.sentier ? s.sentier.palier : 0, saison: s.sentier ? s.sentier.saison : 1, surprise: null, vu: false };
    r.jour = { id: journeeDe(eco, t), quetes: 0, cles: 0, autres: 0, sommet: false, surprise: false, expeditions: 0, etincelle: false };
    if (eco.coffreCamp && eco.coffreCamp.surprise && eco.coffreCamp.surprise.auMatin && (j.quetes || 0) > 0) { var su = tirerSurprise(eco, r, alea || Math.random); if (su) { r.hier.surprise = su; r.jour.surprise = true; } }
    return r;
  }

  /* ── 9 · Le coffre du camp ─────────────────────────────────────────────────────── */
  function ramasser(eco, s, t, alea) {
    var c = s.coffre;
    if (!c.bois && !c.or) return { etat: s, ok: false, raison: 'vide' };
    var r = copie(s), jid = journeeDe(eco, t), surprise = null, A = alea || Math.random;
    if (r.jour.id !== jid) r = nouvelleJournee(eco, r, t);
    var gain = { bois: c.bois, or: c.or };
    if (!r.jour.surprise && A() < eco.coffreCamp.surprise.chance) {
      var T = eco.coffreCamp.surprises, tot = 0, x, i;
      for (i = 0; i < T.length; i++) tot += T[i][1];
      x = A() * tot;
      for (i = 0; i < T.length; i++) { x -= T[i][1]; if (x < 0) { surprise = T[i][0]; var g = T[i][2]; gain.bois += g.bois || 0; gain.or += g.or || 0;
        if (g.fragment) { if (r.sac.fragments >= eco.lore.total) gain.or += eco.lore.auDela.or; else r.sac.fragments++; }
        if (g.objet) r.sac.objets.push('surprise'); break; } }
      r.jour.surprise = true;
    }
    r.bois += gain.bois; r.or += gain.or; r.coffre = { bois: 0, or: 0 };
    return { etat: r, ok: true, gains: gain, surprise: surprise };
  }

  /* ── 10 · Bâtiments et chantiers ───────────────────────────────────────────────── */
  function cout(eco, id, vers) { var c = eco.batiments[id] && eco.batiments[id].cout[vers]; return c ? { bois: c[0], or: c[1], duree: c[2] } : null; }
  function enChantier(s, id) { return s.chantiers.some(function (c) { return c.bat === id; }); }
  function peutAmeliorer(eco, s, id) {
    var b = eco.batiments[id]; if (!b) return { ok: false, raison: 'inconnu' };
    var n = s.batiments[id], A = s.batiments.auberge, vers = n + 1, c = cout(eco, id, vers);
    if (A < b.debloque) return { ok: false, raison: 'pas-encore', vers: vers, auberge: b.debloque };
    if (b.apres && b.apres.expeditions && (s.expeditionsFinies || 0) < b.apres.expeditions) return { ok: false, raison: 'pas-encore-expeditions', vers: vers, reste: b.apres.expeditions - (s.expeditionsFinies || 0), expeditions: b.apres.expeditions };   // 20/10
    if (!c || n >= b.max) return { ok: false, raison: 'au-maximum' };
    if (enChantier(s, id)) return { ok: false, raison: 'deja-en-chantier' };
    if (id === 'auberge') {
      var enRetard = Object.keys(eco.batiments).filter(function (k) { var bk = eco.batiments[k]; return k !== 'auberge' && bk.debloque <= A && !(bk.apres && bk.apres.expeditions && (s.expeditionsFinies || 0) < bk.apres.expeditions) && s.batiments[k] < A; });   // 20/10 · un bâtiment encore verrouillé « après » n'est pas en retard
      if (enRetard.length) return { ok: false, raison: 'batiments-a-monter', liste: enRetard, cout: c };
    } else if (vers > A) return { ok: false, raison: 'auberge-trop-basse', cout: c };
    if (s.chantiers.length >= eco.batisseurs[A]) return { ok: false, raison: 'batisseurs-occupes', cout: c };
    if (s.bois < c.bois || s.or < c.or) {
      return { ok: false, raison: 'pas-assez', manque: { bois: Math.max(0, c.bois - s.bois), or: Math.max(0, c.or - s.or) }, dansLeCoffre: (s.coffre.bois + s.bois >= c.bois && s.coffre.or + s.or >= c.or), cout: c };
    }
    return { ok: true, cout: c, vers: vers };
  }
  function lancerChantier(eco, s, id, t) {
    var p = peutAmeliorer(eco, s, id);
    if (!p.ok) return { etat: s, ok: false, raison: p.raison, detail: p };
    var r = copie(s); r.bois -= p.cout.bois; r.or -= p.cout.or;
    r.chantiers.push({ bat: id, vers: p.vers, debut: t, fin: t + p.cout.duree * 60000 });
    return { etat: r, ok: true };
  }
  function terminerChantiers(eco, s, t) {
    var r = copie(s), finis = [];
    r.chantiers = r.chantiers.filter(function (c) { if (c.fin <= t) { r.batiments[c.bat] = c.vers; finis.push(c); return false; } return true; });
    return { etat: r, finis: finis };
  }

  /* ── 11 · Expéditions, compagnons, Forge ───────────────────────────────────────── */
  function lancerExpedition(eco, s, opts) {
    var t = opts.maintenant, niv = s.batiments.expeditions, D = eco.expeditions;
    if (D.durees[niv].indexOf(opts.duree) < 0) return { etat: s, ok: false, raison: 'duree-fermee' };
    var jid = journeeDe(eco, t), lancees = s.jour.id === jid ? s.jour.expeditions : 0;
    if (lancees >= D.parJournee) return { etat: s, ok: false, raison: 'assez-pour-aujourdhui' };
    var places = Math.min(D.places[niv], s.compagnons), parties = s.expeditions.reduce(function (a, e) { return a + e.compagnons; }, 0);
    if (parties >= places) return { etat: s, ok: false, raison: 'compagnons-partis' };
    var n = Math.max(1, Math.min(opts.compagnons || 1, places - parties));
    var r = copie(s); if (r.jour.id !== jid) r = nouvelleJournee(eco, r, t);
    var f = feuA(eco, r.feu, t), ardent = etatFeu(eco, f.pts) === 'ardent';
    if (ardent) f.pts = Math.max(eco.feu.plancher, f.pts - eco.feu.ardentExpedition.coutPoints);
    r.feu = f;
    var max = eco.forge.parExpedition[s.batiments.forge] || 0, pris = [];
    (opts.charmes || []).forEach(function (c) { if (pris.length < max && r.sac.charmes[c] > 0) { r.sac.charmes[c]--; pris.push(c); } });
    var duree = opts.duree * (pris.indexOf('eclaireur') >= 0 ? 1 + eco.forge.charmes.eclaireur.effet.duree : 1);
    r.jour.expeditions++;
    r.expeditions.push({ duree: opts.duree, compagnons: n, depart: t, retour: t + duree * 60000, ardent: ardent, charmes: pris });
    return { etat: r, ok: true, ardent: ardent };
  }
  function butin(eco, e, alea) {
    var D = eco.expeditions, b = D.butin[e.duree], A = alea || Math.random, ch = e.charmes || [];
    var k = (1 + D.parCompagnonEnPlus * (e.compagnons - 1)) * (ch.indexOf('porteur') >= 0 ? 1 + eco.forge.charmes.porteur.effet.butin : 1);
    var rare = Math.min(D.rare.plafond, D.rare.base + (ch.indexOf('fouineur') >= 0 ? eco.forge.charmes.fouineur.effet.rare : 0));
    var g = { bois: Math.round(b[0] * k), or: Math.round(b[1] * k), fragment: A() < b[2] ? 1 : 0, objets: e.ardent ? eco.feu.ardentExpedition.objets : 0 };
    if (A() < rare) g.rare = 1;
    return g;
  }
  /* Le butin d’une expédition rentrée va dans le coffre du camp (bois, or) et dans le sac (fragments, objets). */
  function retours(eco, s, t, alea) {
    var r = copie(s), recus = [];
    r.expeditions = r.expeditions.filter(function (e) {
      if (e.retour > t) return true;
      var g = butin(eco, e, alea);
      depot(eco, r, g.bois, g.or);
      if (g.fragment) { if (r.sac.fragments >= eco.lore.total) { g.fragment = 0; g.or += eco.lore.auDela.or; depot(eco, r, 0, eco.lore.auDela.or); } else r.sac.fragments++; }
      for (var i = 0; i < g.objets + (g.rare || 0); i++) r.sac.objets.push(i < g.objets ? 'expedition' : 'rare');
      recus.push(g); return false;
    });
    return { etat: r, butins: recus };
  }
  function recruter(eco, s, rarete) {
    var prix = eco.compagnons.recrutement[rarete || 'commun'];
    if (s.compagnons >= eco.expeditions.places[s.batiments.expeditions]) return { etat: s, ok: false, raison: 'hall-plein' };
    if (s.or < prix) return { etat: s, ok: false, raison: 'pas-assez', manque: { or: prix - s.or } };
    var r = copie(s); r.or -= prix; r.compagnons++; return { etat: r, ok: true };
  }
  function forgerCharme(eco, s, type) {
    var C = eco.forge.charmes[type || 'porteur'];
    if (!C) return { etat: s, ok: false, raison: 'inconnu' };
    if (s.batiments.forge < C.forge) return { etat: s, ok: false, raison: s.batiments.forge < 1 ? 'pas-de-forge' : 'forge-trop-basse', forge: C.forge };
    if (s.bois < C.bois) return { etat: s, ok: false, raison: 'pas-assez', manque: { bois: C.bois - s.bois } };
    var r = copie(s); r.bois -= C.bois; r.sac.charmes[type || 'porteur']++; return { etat: r, ok: true };
  }

  /* ── 12 · Le social ────────────────────────────────────────────────────────────── */
  /* Offrir une Étincelle : après son Sommet (une par journée), ou une Étincelle dorée du sac (n’importe quand).
   * L’effet chez le proche (son feu +20 ; s’il fait son Sommet le jour même, un petit coffre pour chacun) est calculé par recevoirEtincelle. */
  function peutOffrir(eco, s, t) {
    var jid = journeeDe(eco, t), duJour = s.jour.id === jid && s.jour.sommet && !s.jour.etincelle;
    if (duJour) return { ok: true, sorte: 'du-jour' };
    if (s.sac.etincellesDorees > 0) return { ok: true, sorte: 'doree' };
    return { ok: false, raison: s.jour.id === jid && s.jour.etincelle ? 'deja-offerte' : 'apres-le-sommet' };
  }
  function offrirEtincelle(eco, s, t) {
    var p = peutOffrir(eco, s, t); if (!p.ok) return { etat: s, ok: false, raison: p.raison };
    var r = copie(s); if (p.sorte === 'du-jour') r.jour.etincelle = true; else r.sac.etincellesDorees--;
    return { etat: r, ok: true, sorte: p.sorte };
  }
  function recevoirEtincelle(eco, s, t, sommetLeJourMeme) {
    var r = copie(s), f = feuA(eco, r.feu, t); r.feu = { pts: Math.min(eco.feu.max, f.pts + eco.social.etincelle.feu), t: t };
    if (sommetLeJourMeme) depot(eco, r, eco.social.etincelle.siSommet.bois, eco.social.etincelle.siSommet.or);
    return { etat: r };
  }

  /* ── 13 · Simulation ───────────────────────────────────────────────────────────── */
  /* pCle : chance de valider chacune des habitudes clés une journée active. Les 4 habitudes sont choisies petites. */
  var PROFILS = {
    /* 19/10 · courte : la part des habitudes faites en version courte ; quetesSaison : combien des 3 quêtes de saison du mois sont faites */
    leger:    { nom: 'Léger · 2 à 4 quêtes, 4 jours sur 7', quetes: [2, 4], actif: 4 / 7, cles: 4, pCle: .65, expeditions: .5, ramassages: [13, 20], heures: [9, 13, 18, 20], courte: .4, quetesSaison: 1 },
    regulier: { nom: 'Régulier · 4 à 6 quêtes, 6 jours sur 7', quetes: [4, 6], actif: 6 / 7, cles: 4, pCle: .85, expeditions: .9, ramassages: [12, 19, 22], heures: [8, 10, 12, 15, 18, 20], courte: .15, quetesSaison: 3 },
    intense:  { nom: 'Intense · 8 à 11 quêtes, tous les jours', quetes: [8, 11], actif: 1, cles: 4, pCle: .95, expeditions: 1, ramassages: [10, 13, 17, 21], heures: [7, 8, 9, 10, 11, 13, 14, 15, 16, 17, 19], courte: 0, quetesSaison: 3 }
  };
  var ORDRE = ['auberge', 'expeditions', 'comptoir', 'forge', 'social'];

  function simuler(eco, profil, jours, graine) {
    var rnd = hasard(graine || 7), t0 = Date.UTC(2026, 10, 2, 5), s = etatInitial(eco, t0), jalons = {}, courbe = [], feuEtats = { braises: 0, stable: 0, ardent: 0 };
    // 19/10 · un deuxième tirage pour les versions courtes : le premier reste le même qu’avant (mêmes résultats pour un profil sans version courte)
    var rndC = hasard((graine || 7) + 101), courtes = 0, qsFaites = 0, moisQs = -1;
    var achats = 0, prixObjets = [60, 90, 120, 140, 160, 170, 180, 240, 280, 320, 380], moisSel = -1, selAchetes = 0, selTotal = 0;
    var sommets = 0, actifs = 0, moments = 0, jokers = 0, sources = { quetes: { bois: 0, or: 0 }, sentier: { bois: 0, or: 0 }, expeditions: { bois: 0, or: 0 }, surprises: { bois: 0, or: 0 } };
    s.clesDefinies = profil.cles;
    function ouvrir(tt) {
      s = terminerChantiers(eco, s, tt).etat;
      var rt = retours(eco, s, tt, rnd); s = rt.etat; rt.butins.forEach(function (b) { sources.expeditions.bois += b.bois; sources.expeditions.or += b.or; moments++; });
      var pa = parcoursAvancer(eco, s, tt, rnd); s = pa.etat; pa.rentres.forEach(function (run) { sources.expeditions.bois += run.butin.bois; sources.expeditions.or += run.butin.or; moments++; });   // 20/10
    }
    for (var d = 0; d < jours; d++) {
      var base = t0 + d * J, actif = rnd() < profil.actif;
      s = saisonA(eco, s, base + 6 * H);
      ouvrir(base + 7 * H);
      if (actif) {
        actifs++;
        var n = profil.quetes[0] + Math.floor(rnd() * (profil.quetes[1] - profil.quetes[0] + 1)), cl = 0;
        for (var c = 0; c < profil.cles; c++) if (rnd() < profil.pCle) cl++;
        var autres = Math.max(0, n - profil.cles), ordre = [];
        for (c = 0; c < cl; c++) ordre.push(true);
        for (c = 0; c < autres; c++) ordre.push(false);
        for (var m = ordre.length - 1; m > 0; m--) { var jm = Math.floor(rnd() * (m + 1)), om = ordre[m]; ordre[m] = ordre[jm]; ordre[jm] = om; }   // mélange de Fisher-Yates : le même tirage dans tous les navigateurs (un tri à comparateur aléatoire en dépendait)
        if (rnd() < profil.expeditions) {
          var ds = eco.expeditions.durees[s.batiments.expeditions], du = ds[ds.length - 1], ch = [];
          if (s.batiments.forge >= 1 && s.bois > 300 && !s.sac.charmes.porteur) s = forgerCharme(eco, s, 'porteur').etat;
          if (s.sac.charmes.porteur) ch.push('porteur'); else if (s.sac.charmes.fouineur) ch.push('fouineur');
          if (parcoursRegles(eco)) {   // 20/10 · un parcours le matin (mode moyen), un second l'après-midi si le profil part souvent
            var l1 = parcoursLancer(eco, s, { mode: 'moyen', charmes: ch, maintenant: base + 8 * H, graine: (d + 1) * 131 + (graine || 7) }); if (l1.ok) s = l1.etat;
            if (profil.expeditions >= .9) { var l2 = parcoursLancer(eco, s, { mode: 'moyen', maintenant: base + 14 * H, graine: (d + 1) * 131 + 77 + (graine || 7) }); if (l2.ok) s = l2.etat; }
          } else {
          var le = lancerExpedition(eco, s, { duree: du, compagnons: 4, charmes: ch, maintenant: base + 8 * H });
          if (le.ok) s = le.etat; }
        }
        var ri = 0;
        for (var q = 0; q < ordre.length; q++) {
          var tq = base + (profil.heures[Math.min(q, profil.heures.length - 1)] + rnd() * .8) * H;
          ouvrir(tq);
          var courte = !!(profil.courte > 0 && ordre[q] && rndC() < profil.courte); if (courte) courtes++;
          var r = valider(eco, s, { cle: ordre[q], courte: courte, maintenant: tq });
          sources.quetes.bois += r.gains.bois; sources.quetes.or += r.gains.or;
          if (r.evenements.indexOf('sommet') >= 0) { sommets++; moments++; if (r.recompense && r.recompense[0] === 'ressources') { sources.sentier.bois += r.recompense[1].bois; sources.sentier.or += r.recompense[1].or; } if (r.recompense && r.recompense[0] === 'au-dela') { sources.sentier.bois += eco.sentier.auDela.bois; sources.sentier.or += eco.sentier.auDela.or; } }
          if (r.evenements.indexOf('niveau') >= 0) moments++;
          s = r.etat; feuEtats[etatFeu(eco, feuA(eco, s.feu, tq).pts)]++;
          while (ri < profil.ramassages.length && profil.ramassages[ri] <= profil.heures[Math.min(q, profil.heures.length - 1)] + 1) {
            var rm = ramasser(eco, s, base + profil.ramassages[ri] * H, rnd);
            if (rm.ok) { s = rm.etat; if (rm.surprise) moments++; }
            ri++;
          }
          for (var k = 0; k < ORDRE.length; k++) { var lc = lancerChantier(eco, s, ORDRE[k], tq); if (lc.ok) s = lc.etat; }
        }
        /* joker : seulement s’il est activé dans le barème */
        var pj = peutJoker(eco, s, base + 21 * H); if (pj.ok) { var uj = utiliserJoker(eco, s, base + 21 * H); s = uj.etat; sommets++; jokers++; moments++; }
        for (; ri < profil.ramassages.length; ri++) { var rm2 = ramasser(eco, s, base + profil.ramassages[ri] * H, rnd); if (rm2.ok) { s = rm2.etat; if (rm2.surprise) moments++; } }
        for (k = 0; k < ORDRE.length; k++) { var lc2 = lancerChantier(eco, s, ORDRE[k], base + 22 * H); if (lc2.ok) s = lc2.etat; }
        // 19/10 · les quêtes de saison du mois (facultatives) : faites les premiers jours actifs du mois
        var moisJ = journeeDe(eco, base + 12 * H).slice(0, 7); if (moisJ !== moisQs) { moisQs = moisJ; var nq = Math.min(eco.saisonQuetes ? eco.saisonQuetes.parMois : 0, profil.quetesSaison || 0); for (var iq = 0; iq < nq; iq++) { var vq = validerQueteSaison(eco, s, 'qs' + iq, base + 12 * H); if (vq.ok) { s = vq.etat; qsFaites++; } } }
        var A = s.batiments.auberge, garde = A < 4 ? cout(eco, 'auberge', A + 1).or : 0;
        var rc = s.or - garde >= eco.compagnons.recrutement.commun ? recruter(eco, s, 'commun') : { ok: false }; if (rc.ok) s = rc.etat;
        if (achats < prixObjets.length && s.or - garde >= prixObjets[achats]) { s.or -= prixObjets[achats]; achats++; }
        var mois = Math.floor(d / 30);
        if (achats >= prixObjets.length && s.batiments.comptoir >= 4) {
          if (moisSel !== mois) { moisSel = mois; selAchetes = 0; }
          var sel = eco.comptoir.selectionMois; if (selAchetes < sel.length && s.or >= sel[selAchetes]) { s.or -= sel[selAchetes]; selAchetes++; selTotal++; }
        }
      }
      var fin = base + 23 * H; s = terminerChantiers(eco, s, fin).etat; ouvrir(fin);   // 20/10 · les parcours rentrent avant la nuit
      for (var a = 2; a <= 4; a++) if (!jalons['A' + a] && s.batiments.auberge >= a) jalons['A' + a] = d + 1;
      if (!jalons.campComplet && ORDRE.every(function (b) { return s.batiments[b] >= 4; })) jalons.campComplet = d + 1;
      if (!jalons.sentierComplet && s.sentier.saison === 1 && s.sentier.palier >= eco.sentier.paliers) jalons.sentierComplet = d + 1;
      courbe.push({ jour: d + 1, bois: s.bois, or: s.or, coffre: s.coffre.bois + s.coffre.or, auberge: s.batiments.auberge, niveau: niveauDe(eco, s.xp).niveau, feu: Math.round(feuA(eco, s.feu, fin).pts), saison: s.sentier.saison, palier: s.sentier.palier });
    }
    var tf = feuEtats.braises + feuEtats.stable + feuEtats.ardent || 1;
    var paliersSaison1 = courbe.filter(function (c) { return c.saison === 1; }).reduce(function (m, c) { return Math.max(m, c.palier); }, 0);
    var tb = sources.quetes.bois + sources.sentier.bois + sources.expeditions.bois + sources.surprises.bois || 1;
    return {
      profil: profil.nom, jours: jours, jalons: jalons, courbe: courbe, final: s,
      resume: {
        joursActifs: actifs, sommets: sommets, jokers: jokers, partSommets: actifs ? Math.round(100 * sommets / actifs) : 0, courtes: courtes, quetesSaison: qsFaites,
        paliersSaison1: paliersSaison1, momentsParJourActif: actifs ? Math.round(10 * moments / actifs) / 10 : 0,
        niveau: niveauDe(eco, s.xp).niveau, objetsAchetes: achats, selectionAchetee: selTotal, compagnons: s.compagnons,
        orEnReserve: s.or, boisEnReserve: s.bois, fragments: s.sac.fragments,
        partBoisTravailReel: Math.round(100 * (sources.quetes.bois + sources.sentier.bois) / tb),
        feu: { braises: Math.round(100 * feuEtats.braises / tf), stable: Math.round(100 * feuEtats.stable / tf), ardent: Math.round(100 * feuEtats.ardent / tf) }
      }
    };
  }

  /* ── 11 · (20/10) Les expéditions en parcours ─────────────────────────────────────
   * Un parcours : des étapes (le Ponton en ouvre plus) ; à chaque étape, trois chemins (un type de récompense, une difficulté de 1 à 3, un indice) ;
   * le compagnon met quelques minutes par étape ; on rentre quand on veut, le butin reste ; échouer une étape ramène le compagnon avec la moitié ;
   * au bout, parfois (20 %), un chemin de plus mène à une créature. Sans nous, le mode choisit (facile : le chemin sûr ; moyen ; difficile : le risqué) ;
   * en mode « attend », le compagnon attend notre choix à chaque étape. Tout est tiré d'une graine : le même parcours dans tous les navigateurs. */
  var PARCOURS_TYPES = ['ressources', 'ressources', 'objet', 'charme', 'fragment', 'ressources'];   // les ressources une fois sur deux
  function parcoursRegles(eco) { return eco.expeditions && eco.expeditions.parcours; }
  function parcoursChoix(eco, run, n) {
    var P = parcoursRegles(eco), A = hasard(((run.graine >>> 0) + n * 7919) >>> 0), dif = [1, 2, 3], ch = [], i, j, x;
    for (i = dif.length - 1; i > 0; i--) { j = Math.floor(A() * (i + 1)); x = dif[i]; dif[i] = dif[j]; dif[j] = x; }
    var bump = Math.max(0, (run.dif || 1) - 1);   // 22/10 · la destination durcit les voies : une voie sûre devient moyenne (dif 2), une moyenne devient risquée (dif 3) ; il reste toujours une voie plus douce
    for (i = 0; i < P.choix; i++) { var ty = PARCOURS_TYPES[Math.floor(A() * PARCOURS_TYPES.length)], d = dif[i % dif.length]; if (bump >= 1 && d === 1) d = 2; else if (bump >= 2 && d === 2) d = 3; ch.push({ type: ty, difficulte: d }); }
    if (n === run.etapes && P.creature > 0 && A() < P.creature) ch.push({ type: 'creature', difficulte: 2 });
    return ch;
  }
  function parcoursRecompense(eco, run, n, c) {
    var P = parcoursRegles(eco), R = P.recompenses, m = P.modes[run.mode], k = (1 + P.parEtapeBonus * (n - 1)) * (m && m.butin ? m.butin : 1) * (run.bonus || 1), d = Math.max(0, Math.min(2, c.difficulte - 1));   // 22/10 · run.bonus : l’équipée (compagnons et stats)
    var g = { bois: 0, or: 0, objets: [], fragments: 0, charmes: [] };
    if (c.type === 'ressources') { g.bois = Math.round(R.ressources.bois[d] * k); g.or = Math.round(R.ressources.or[d] * k); }
    else if (c.type === 'fragment') g.fragments = 1;
    else if (c.type === 'objet') g.objets.push(d >= 2 ? 'rare' : 'expedition');
    else if (c.type === 'charme') g.charmes.push(['porteur', 'fouineur', 'eclaireur'][d]);
    else if (c.type === 'creature') g.creature = d >= 2 ? 'rare' : 'commun';
    return g;
  }
  function parcoursReussite(eco, s, run, c) {
    var P = parcoursRegles(eco), p = P.reussite[c.difficulte] || .8, prep = P.preparation.charme * ((run.charmes || []).length) + P.preparation.forgeParNiveau * (s.batiments.forge || 0);
    return Math.min(.99, p + prep);
  }
  function parcoursAuto(run) {
    var ch = run.choix || []; if (!ch.length) return null;
    var cible = run.mode === 'facile' ? 1 : run.mode === 'difficile' ? 3 : 2, best = ch[0], bd = 9;
    ch.forEach(function (c) { if (c.type === 'creature') { if (bd > -1) { best = c; bd = -1; } return; } var d = Math.abs(c.difficulte - cible); if (d < bd) { bd = d; best = c; } });
    return best;
  }
  function parcoursDe(r, id) { return (r.parcours || []).filter(function (x) { return x.id === id; })[0]; }
  function parcoursLancer(eco, s, opts) {
    var P = parcoursRegles(eco), t = opts.maintenant, niv = s.batiments.expeditions || 0; if (!P || niv < 1) return { etat: s, ok: false, raison: 'pas-de-ponton' };
    var jid = journeeDe(eco, t), r = copie(s); if (r.jour.id !== jid) r = nouvelleJournee(eco, r, t);
    if (r.jour.expeditions >= eco.expeditions.parJournee) return { etat: s, ok: false, raison: 'assez-pour-aujourdhui' };
    r = completerEquipe(eco, r);   // 22/10 · l’équipe est à jour (migration douce)
    var places = Math.min(eco.expeditions.places[niv], r.compagnons), partisIds = compagnonsPartis(eco, r), partis = partisIds.length + r.expeditions.reduce(function (a, e) { return a + e.compagnons; }, 0);
    if (partis >= places) return { etat: s, ok: false, raison: 'compagnons-partis' };
    /* 22/10 · qui part : les ids demandés (opts.compagnons) qui sont au camp, dans la limite des places du bateau ; sans demande, le premier compagnon libre */
    var EQ = r.equipe, libres = EQ.filter(function (c) { return partisIds.indexOf(c.id) < 0; }).slice(0, Math.max(0, places - partis)), aBord = bateauPlaces(eco, r);
    var ids = (opts.compagnons || []).filter(function (id, i, L) { return L.indexOf(id) === i && libres.some(function (c) { return c.id === id; }); }).slice(0, aBord);
    if (!ids.length) { if (!libres.length) return { etat: s, ok: false, raison: 'compagnons-partis' }; ids = [libres[0].id]; }
    /* 22/10 · la destination : ouverte si le bateau a le niveau ; ses pas s’ajoutent à ceux du Ponton, sa difficulté pèse sur les voies */
    var dest = destinationDe(eco, opts.destination); if (!destinationOuverte(eco, r, dest.cle)) return { etat: s, ok: false, raison: 'bateau-trop-petit', bateau: dest.bateau };
    var mode = opts.mode && P.modes[opts.mode] !== undefined ? opts.mode : 'attend';
    var max = eco.forge.parExpedition[r.batiments.forge] || 0, pris = []; (opts.charmes || []).forEach(function (c) { if (pris.length < max && r.sac.charmes[c] > 0) { r.sac.charmes[c]--; pris.push(c); } });
    var premier = EQ.map(function (c) { return c.id; }).indexOf(ids[0]);
    var run = { id: opts.id != null ? opts.id : t, compagnon: premier < 0 ? 0 : premier, compagnons: ids, destination: dest.cle, dif: dest.dif || 1, bonus: bonusEquipe(eco, r, ids), mode: mode, etapes: P.etapes[niv] + (dest.etapes || 0), etape: 0, statut: 'route', depart: t, prochain: t + P.minutes[niv] * 60000, choix: null, pris: null,
      butin: { bois: 0, or: 0, objets: [], fragments: 0, charmes: [] }, graine: (opts.graine != null ? opts.graine : (t % 1000003)) >>> 0, echec: false, creature: null, charmes: pris, journal: [] };
    run.choix = parcoursChoix(eco, run, 1); run.pris = opts.chemin != null && run.choix[opts.chemin] ? run.choix[opts.chemin] : parcoursAuto(run);
    r.parcours = (r.parcours || []).concat([run]); r.jour.expeditions++;
    return { etat: r, ok: true, parcours: run };
  }
  /* Le temps passe : le compagnon arrive aux étapes, joue le chemin pris, rentre ; ce qui est rentré se dépose (compteurs, inventaire, compagnons). */
  function parcoursAvancer(eco, s, t, alea) {
    var P = parcoursRegles(eco); if (!P || !(s.parcours && s.parcours.length)) return { etat: s, rentres: [], evenements: [] };
    var r = copie(s), A = alea || Math.random, rentres = [], ev = [], restants = [], niv = r.batiments.expeditions || 1;
    r.parcours.forEach(function (run) {
      var boucle = 0;
      while (run.prochain <= t && boucle++ < 60) {
        if (run.statut === 'retour') {
          var b = run.butin, i; depot(eco, r, b.bois, b.or); b.objets.forEach(function (o) { r.sac.objets.push(o); }); b.charmes.forEach(function (c) { r.sac.charmes[c] = (r.sac.charmes[c] || 0) + 1; });
          for (i = 0; i < b.fragments; i++) { if (r.sac.fragments >= eco.lore.total) depot(eco, r, 0, eco.lore.auDela.or); else r.sac.fragments++; }
          if (run.creature) { r.equipe = equipeDe(eco, r); r.compagnons++; r.equipe.push(creerCompagnon(eco, r.equipe, run.creature === 'rare' ? 'rare' : 'commun', hasard((run.graine >>> 0) + 17))); ev.push('creature'); }   // 22/10 · branche inactive par défaut (creature = 0), gardée
          r.expeditionsFinies = (r.expeditionsFinies || 0) + 1; run.statut = 'fini'; run.rentre = run.prochain; rentres.push(run); ev.push('expedition-retour'); break;
        }
        if (run.statut === 'attend') break;
        var n = run.etape + 1, c = run.pris || parcoursAuto(run) || run.choix[0], p = parcoursReussite(eco, r, run, c), ok = A() < p, g = ok ? parcoursRecompense(eco, run, n, c) : null;
        run.journal.push({ etape: n, type: c.type, difficulte: c.difficulte, ok: ok, gains: g, t: run.prochain });
        if (ok) { run.butin.bois += g.bois; run.butin.or += g.or; run.butin.fragments += g.fragments; run.butin.objets = run.butin.objets.concat(g.objets); run.butin.charmes = run.butin.charmes.concat(g.charmes); if (g.creature) run.creature = g.creature; }
        else { run.echec = true; run.butin.bois = Math.floor(run.butin.bois * P.echec); run.butin.or = Math.floor(run.butin.or * P.echec); }
        run.etape = n;
        if (!ok || n >= run.etapes || run.creature) { run.statut = 'retour'; run.prochain = run.prochain + Math.round(n * P.retourParEtape * 60000); continue; }
        run.choix = parcoursChoix(eco, run, n + 1); run.pris = null;
        if (run.mode === 'attend') { run.statut = 'attend'; run.attendDepuis = run.prochain; break; }
        run.pris = parcoursAuto(run); run.statut = 'route'; run.prochain = run.prochain + P.minutes[niv] * 60000;
      }
      if (run.statut !== 'fini') restants.push(run);
    });
    r.parcours = restants; if (rentres.length) r.rentres = (r.rentres || []).concat(rentres).slice(-6);
    return { etat: r, rentres: rentres, evenements: ev };
  }
  function parcoursChoisir(eco, s, id, idx, t) {
    var P = parcoursRegles(eco), r = copie(s), run = parcoursDe(r, id); if (!P || !run || run.statut !== 'attend' || !run.choix[idx]) return { etat: s, ok: false };
    run.pris = run.choix[idx]; run.statut = 'route'; run.prochain = t + P.minutes[r.batiments.expeditions || 1] * 60000; return { etat: r, ok: true, parcours: run };
  }
  function parcoursRentrer(eco, s, id, t) {
    var P = parcoursRegles(eco), r = copie(s), run = parcoursDe(r, id); if (!P || !run || run.statut === 'retour' || run.statut === 'fini') return { etat: s, ok: false };
    run.statut = 'retour'; run.rentreVolontaire = true; run.prochain = t + Math.round(Math.max(1, run.etape) * P.retourParEtape * 60000); return { etat: r, ok: true, parcours: run };
  }
  function parcoursMode(eco, s, id, mode, t) {
    var P = parcoursRegles(eco), r = copie(s), run = parcoursDe(r, id); if (!P || !run || P.modes[mode] === undefined) return { etat: s, ok: false };
    run.mode = mode; if (run.statut === 'attend' && mode !== 'attend') { run.pris = parcoursAuto(run); run.statut = 'route'; run.prochain = (t || run.attendDepuis || Date.now()) + P.minutes[r.batiments.expeditions || 1] * 60000; }
    return { etat: r, ok: true, parcours: run };
  }
  /* 19/10 · Lot 9 : les variantes des choix 13 et 14, lues par le configurateur du prototype (une copie du barème pour la session) et par les contrôles */
  var VARIANTES = { courteGains: { identiques: 'identiques', moitie: 'moitie', petit: 'petit' }, defiRecompense: { decor: { id: 'decor-semaine' }, coffre: { bois: 20, or: 10 }, rien: null } };
  function totaux(eco) {
    var t = { bois: 0, or: 0, minutes: 0 };
    for (var id in eco.batiments) { var c = eco.batiments[id].cout; for (var n in c) { t.bois += c[n][0]; t.or += c[n][1]; t.minutes += c[n][2]; } }
    return t;
  }

  W.AthenaEconomie = {
    version: 5, DEFAUT: DEFAUT, PROFILS: PROFILS, VARIANTES: VARIANTES,   // 22/10 · version 5 du module (compagnons nommés, recrutement au hasard, bateau, destinations), barème 5
    depot: depot, tirerSurprise: tirerSurprise, validerApresCoup: validerApresCoup, parcoursLancer: parcoursLancer, parcoursAvancer: parcoursAvancer, parcoursChoisir: parcoursChoisir, parcoursRentrer: parcoursRentrer, parcoursMode: parcoursMode, parcoursChoix: parcoursChoix, parcoursReussite: parcoursReussite,
    compagnonOrigine: compagnonOrigine, creerCompagnon: creerCompagnon, equipeDe: equipeDe, completerEquipe: completerEquipe, compagnonDe: compagnonDe, compagnonsPartis: compagnonsPartis, tirerRarete: tirerRarete, recruterAleatoire: recruterAleatoire,   // 22/10
    bateauPlaces: bateauPlaces, peutAmeliorerBateau: peutAmeliorerBateau, ameliorerBateau: ameliorerBateau, destinationDe: destinationDe, destinationOuverte: destinationOuverte, bonusEquipe: bonusEquipe,   // 22/10
    defiEtat: defiEtat, defiAvancer: defiAvancer, defiRecompenser: defiRecompenser, quetesSaison: quetesSaison, validerQueteSaison: validerQueteSaison,
    journeeDe: journeeDe, semaineDe: semaineDe, etatInitial: etatInitial, nouvelleJournee: nouvelleJournee,
    feuA: feuA, etatFeu: etatFeu, offrande: offrande,
    paliers: paliers, peutJoker: peutJoker, utiliserJoker: utiliserJoker, niveauDe: niveauDe,
    valider: valider, ramasser: ramasser, saisonA: saisonA, saisonId: saisonId, completer: completer,
    cout: cout, peutAmeliorer: peutAmeliorer, lancerChantier: lancerChantier, terminerChantiers: terminerChantiers,
    lancerExpedition: lancerExpedition, butin: butin, retours: retours, recruter: recruter, forgerCharme: forgerCharme,
    peutOffrir: peutOffrir, offrirEtincelle: offrirEtincelle, recevoirEtincelle: recevoirEtincelle,
    simuler: simuler, totaux: totaux, hasard: hasard
  };
})(typeof window !== 'undefined' ? window : globalThis);
