(() => {
  const root = 'assets/housing/launch/';
  const item = (label, slug, width, aspect, category, options = {}) => ({
    label,
    group: `launch-${slug}`,
    src: `${root}${slug}.webp`,
    width,
    bottom: 1,
    defaultY: .86,
    aspect,
    category,
    footprint: 'RECT_1x1',
    heightClass: 'MEDIUM',
    ...options
  });

  window.ATHENA_LAUNCH_CATALOG = {
    launchMarketWorkshop: item('Atelier du marché', 'atelier-marche', 150, 1.18, 'Structures', { footprint: 'RECT_3x2', heightClass: 'BUILDING' }),
    launchFlowerPergola: item('Pergola fleurie', 'pergola-fleurie', 148, 1.18, 'Structures', { footprint: 'RECT_3x2', heightClass: 'BUILDING' }),
    launchCanopyLounge: item('Salon sous voile', 'salon-voile', 132, 1.13, 'Structures', { footprint: 'RECT_3x2', heightClass: 'BUILDING' }),
    launchHearthKitchen: item('Cuisine avec cheminée', 'cuisine-cheminee', 140, .97, 'Structures', {
      footprint: 'RECT_3x2', heightClass: 'BUILDING', luminous: true, projectsGround: true,
      lightDiameter: 330, lightOffsetY: -.39, glowOffsetY: -.39, glowScale: .43, lightStrength: .62
    }),
    launchRotunda: item('Rotonde', 'rotonde', 150, .85, 'Structures', { footprint: 'RECT_3x2', heightClass: 'BUILDING' }),
    launchFruitStall: item('Étal de fruits', 'etal-fruits', 112, .98, 'Structures', { footprint: 'RECT_2x2', heightClass: 'MEDIUM' }),
    launchHerbRack: item('Séchoir à herbes', 'sechoir-herbes', 106, .98, 'Structures', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchClothesline: item('Étendoir', 'etendoir-linge', 100, 1.01, 'Structures', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchWell: item('Puits', 'puits', 88, .85, 'Structures', { footprint: 'CIRCLE_1x1', heightClass: 'MEDIUM' }),
    launchShadeWorkbench: item('Établi ombragé', 'etabli-ombrage', 122, 1.15, 'Structures', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchTextileWorkshop: item('Atelier textile', 'atelier-textile', 104, .9, 'Structures', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchArmory: item('Armurerie', 'armurerie', 116, 1.04, 'Structures', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchMerchantCart: item('Chariot marchand', 'chariot-marchand', 126, 1.08, 'Structures', { footprint: 'RECT_3x2', heightClass: 'MEDIUM' }),

    launchDiningTable: item('Table de repas', 'table-repas', 106, 1.56, 'Mobilier', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchCarpetLounge: item('Salon sur tapis', 'salon-tapis', 128, 2.23, 'Mobilier', { footprint: 'RECT_3x2', heightClass: 'LOW' }),
    launchCushionLounge: item('Salon de coussins', 'salon-coussins', 88, 1.21, 'Mobilier', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchBed: item('Lit', 'lit', 100, 1.41, 'Mobilier', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchBlueChest: item('Coffre bleu', 'coffre-bleu', 54, .85, 'Mobilier', { heightClass: 'LOW' }),
    launchWoodChest: item('Coffre en bois', 'coffre-bois', 55, .97, 'Mobilier', { heightClass: 'LOW' }),
    launchWritingDesk: item('Écritoire', 'ecritoire', 64, 1.07, 'Mobilier', { heightClass: 'LOW' }),
    launchLongBench: item('Grand banc', 'banc-long', 76, 1.29, 'Mobilier', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchShortBench: item('Petit banc', 'banc-court', 55, 1.12, 'Mobilier', { heightClass: 'LOW' }),
    launchCrate: item('Caisse', 'caisse', 48, 1, 'Mobilier', { heightClass: 'LOW' }),
    launchLogs: item('Réserve de bûches', 'buches', 62, 1.25, 'Mobilier', { heightClass: 'LOW' }),
    launchScrolls: item('Rouleaux de toile', 'rouleaux', 68, 1.42, 'Mobilier', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchSquareRug: item('Tapis carré', 'tapis-carre', 88, 2.36, 'Mobilier', { footprint: 'RECT_2x2', heightClass: 'LOW' }),
    launchBedroll: item('Couchage roulé', 'couchage-roule', 88, 2.18, 'Mobilier', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchBookStool: item('Tabouret aux livres', 'tabouret-livre', 48, 1.02, 'Mobilier', { heightClass: 'LOW' }),
    launchReadingSeat: item('Siège de lecture', 'siege-lecture', 50, .8, 'Mobilier', { heightClass: 'LOW' }),

    launchLanterns: item('Duo de lanternes', 'lanternes', 62, 1.06, 'Éclairage', { footprint: 'RECT_2x1', heightClass: 'TALL' }),
    launchSimpleTorch: item('Torche simple', 'torche-simple', 38, .36, 'Éclairage', {
      footprint: 'POINT', heightClass: 'TALL', luminous: true, projectsGround: false,
      lightDiameter: 180, lightOffsetY: -.82, glowOffsetY: -.82, glowScale: .78, lightStrength: .62
    }),
    launchBrazier: item('Brasero', 'brasero', 62, .65, 'Éclairage', {
      footprint: 'CIRCLE_1x1', heightClass: 'MEDIUM', luminous: true, projectsGround: true,
      lightDiameter: 280, lightOffsetY: -.58, glowOffsetY: -.58, glowScale: .72, lightStrength: .72
    }),
    launchLowBrazier: item('Foyer bas', 'brasero-bas', 46, .85, 'Éclairage', {
      footprint: 'CIRCLE_1x1', heightClass: 'LOW', luminous: true, projectsGround: true,
      lightDiameter: 220, lightOffsetY: -.4, glowOffsetY: -.4, glowScale: .72, lightStrength: .58
    }),
    launchCookingTripod: item('Marmite sur trépied', 'marmite-trepied', 58, .87, 'Éclairage', { heightClass: 'MEDIUM' }),

    launchLinenScreen: item('Paravent de lin', 'paravent-lin', 70, .83, 'Textiles', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchLightLaundry: item('Linge clair', 'linge-clair', 72, .86, 'Textiles', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchTridentBanner: item('Bannière au trident', 'banniere-trident', 48, .53, 'Textiles', { footprint: 'POINT', heightClass: 'TALL' }),
    launchDryingFabrics: item('Séchoir à tissus', 'tissus-sechoir', 66, .83, 'Textiles', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchFlags: item('Drapeaux bleus', 'drapeaux', 58, .56, 'Textiles', { footprint: 'RECT_2x1', heightClass: 'TALL' }),

    launchPottedOlive: item('Olivier en pot', 'olivier-pot', 64, .8, 'Végétation', { footprint: 'POINT', heightClass: 'TALL' }),
    launchPottedShrub: item('Arbuste en pot', 'arbuste-pot', 48, .68, 'Végétation', { footprint: 'POINT', heightClass: 'MEDIUM' }),
    launchBushes: item('Massif de buissons', 'buissons', 92, 1.21, 'Végétation', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchPinkPlanter: item('Jardinière rose', 'jardiniere-rose', 70, .82, 'Végétation', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchFruitBush: item('Buisson fruitier', 'buisson-fruitier', 62, 1.17, 'Végétation', { heightClass: 'LOW' }),
    launchHerbPots: item('Pots d’herbes', 'pots-herbes', 74, .82, 'Végétation', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchCypressGrove: item('Bosquet de cyprès', 'bosquet-cypres', 64, .47, 'Végétation', { footprint: 'RECT_2x1', heightClass: 'TALL' }),
    launchOliveTrees: item('Duo d’oliviers', 'oliviers', 104, 1.19, 'Végétation', { footprint: 'RECT_2x1', heightClass: 'TALL' }),
    launchPinkTree: item('Arbre rose', 'arbre-rose', 70, .71, 'Végétation', { footprint: 'POINT', heightClass: 'TALL' }),
    launchLeafyTree: item('Arbre feuillu', 'arbre-feuillu', 68, .69, 'Végétation', { footprint: 'POINT', heightClass: 'TALL' }),
    launchLeafyShrub: item('Arbuste feuillu', 'arbuste-feuillu', 50, .74, 'Végétation', { footprint: 'POINT', heightClass: 'MEDIUM' }),
    launchFlowerBed: item('Bac fleuri', 'bac-fleurs', 92, 1.19, 'Végétation', { footprint: 'RECT_2x1', heightClass: 'LOW' }),

    launchVictoryStatue: item('Statue de la Victoire', 'statue-victoire', 62, .55, 'Monuments', { footprint: 'RECT_1x1', heightClass: 'TALL' }),
    launchPhilosopherStatue: item('Statue du philosophe', 'statue-philosophe', 68, .63, 'Monuments', { footprint: 'RECT_1x1', heightClass: 'TALL' }),
    launchBust: item('Buste sur colonne', 'buste', 42, .36, 'Monuments', { footprint: 'POINT', heightClass: 'TALL' }),
    launchSphinx: item('Sphinx ailé', 'sphinx', 76, .7, 'Monuments', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchBrokenColumns: item('Colonnes brisées', 'colonnes-brisees', 84, 1.1, 'Ruines', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchIvyColumn: item('Colonne au lierre', 'colonne-lierre', 52, .6, 'Ruines', { footprint: 'POINT', heightClass: 'TALL' }),
    launchColumn: item('Colonne antique', 'colonne', 42, .62, 'Ruines', { footprint: 'POINT', heightClass: 'TALL' }),
    launchIvyRuins: item('Ruines au lierre', 'ruines-lierre', 78, .82, 'Ruines', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchMajorRock: item('Grand rocher', 'rocher-majeur', 82, 1.25, 'Rochers', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchDoubleRocks: item('Rochers doubles', 'rochers-doubles', 82, .97, 'Rochers', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchGroveRocks: item('Rochers végétalisés', 'rochers-bosquet', 88, 1.04, 'Rochers', { footprint: 'RECT_2x1', heightClass: 'MEDIUM' }),
    launchGreenBlocks: item('Blocs végétalisés', 'blocs-vegetalises', 78, .91, 'Ruines', { footprint: 'RECT_2x1', heightClass: 'LOW' }),
    launchStoneBlocks: item('Blocs de pierre', 'blocs-pierre', 68, .72, 'Ruines', { footprint: 'RECT_2x1', heightClass: 'LOW' })
  };
})();
