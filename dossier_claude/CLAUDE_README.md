# Dossier d'Intégration et Banques d'Assets — Athéna
**Destinataire : Claude & Équipe de Développement**  
**Auteur : Baptiste974**  
**Date : 23/10/2026**  
**Moteur cible : PixiJS 8.22.0**  
**Direction Artistique : Antiquité Méditerranéenne Apaisante (Athéna)**

---

## 1. Vue d'Ensemble & Objectif

Ce dossier autonome `dossier_claude/` rassemble l'intégralité des assets graphiques, sprites découpés, planches maîtresses originales, configurations JSON et guides d'intégration pour finaliser le jeu mobile **Athéna**.

Tous les assets ont été soigneusement extraits, détourés avec canal alpha transparent RGBA (aucun fond blanc résiduel, aucun liseré noir de dessin animé), harmonisés à l'échelle isométrique et formatés en double extension (`.png` haute fidélité sans perte et `.webp` ultra-léger pour le chargement instantané).

### Principes Clés de la Direction Artistique
- **Palette chromatique chaleureuse** : Toile écru/lin (`#f4eee6`), bois chaud patiné (`#7a4e28`), calcaire clair (`#dfd7ca`), bleu Égée doux (`#2c6b9e`), terre cuite (`#b85437`), bronze antique (`#d49b38`), vert sauge/olivier (`#4f6b2f`).
- **Éclairage & perspective** : Isométrie 3/4 plongeante, lumière matinale douce zénithale gauche, ombres portées discrètes au sol sans halo dur.
- **Ton & Philosophie** : Bienveillant, réconfortant, adapté au rythme de chaque joueur. Formule cardinale : *« Rien ne se perd »* (100% du butin est sécurisé, expérience fluide et sereine sans régression).

---

## 2. Arborescence du Dossier

```
dossier_claude/
├── CLAUDE_README.md                    <- Ce guide maître
├── SYSTEME_DUNGEON_CRAWLER.md          <- Spécifications du combat auto & IA
├── SYSTEME_ECONOMIE_ET_PROGRESSION.md  <- Modèle économique (V.JEU.eco) & PixiJS
├── PARCOURS_ONBOARDING_ET_TUTORIEL.md  <- Parcours d'accueil, geste & promesse
├── BATTLE_PASS_GRAND_SENTIER.md        <- Spécifications des 20 paliers & saisons
├── TEMPLATES_CAMP_PALIERS.md           <- Templates du camp du niveau 1 au 5
├── index.html                          <- Galerie interactive & banc d'essai PixiJS
│
├── onboarding/                         <- Parcours d'Onboarding & Tutoriel
│   └── illustrations/                  <- 20 cartes (10 PNG + 10 WebP 1080x1350)
│
├── etude_soda_dungeon_athena/          <- Étude de Référence Soda Dungeon 2 ➔ Athéna
│   ├── index.html                      <- Présentation complète des 10 piliers
│   └── assets/                         <- 50 images de référence (diapos 1080p, infographies, SD2)
│
├── batiments/                          <- Bâtiments du camp
│   ├── batiments_progression.json      <- Config JSON coûts, bonus et sprites
│   ├── auberge/                        <- auberge_niveau_1..5.png/.webp + planches
│   ├── comptoir/                       <- comptoir_niveau_1..5.png/.webp + planches
│   ├── forge/                          <- forge_niveau_1..5.png/.webp + planches
│   ├── ponton/                         <- ponton_niveau_1..4.webp + 4 pièces du bateau
│   ├── kiosque/                        <- kiosque_niveau_1..4.webp (Hameau)
│   └── tente/                          <- tente_niveau_1..4.webp (Refuge principal)
│
├── decorations_et_objets_camp/         <- Objets et décors du campement
│   ├── faune_et_visiteurs/             <- Chouette guide (4 poses), Cerf, Hérisson, Renard
│   ├── lumieres_et_foyer/              <- Feu animé, lanternes, flambeaux, lampions, torches
│   ├── mobilier_et_nature/             <- Banc, pergola, salon, fontaine, statue, olivier, lavande
│   └── animations_camp/                <- Carillon animé, fanion animé
│
├── personnages/                        <- Héros jouables (Détourage RGBA & Frames)
│   ├── minotaure/                      <- 16 morceaux découpés, 20 frames, JSONs
│   ├── satyre/                         <- 11 morceaux découpés, 20 frames, JSONs
│   └── meduse/                         <- 12 morceaux découpés, 20 frames, JSONs
│
├── dungeon_crawler/                    <- Système de Donjon & Combat Auto
│   ├── dungeon_crawler_config.json     <- Config JSON héros, monstres, portails, loots
│   ├── heros_combat/                   <- 15 sprites de combat (5 poses par héros)
│   ├── monstres_ennemis/               <- 4 monstres mythologiques (Squelette, Harpie, Cyclope, Cerbère)
│   ├── portails_bifurcation/           <- 4 portails (Soin, Trésor, Mine, Boss)
│   ├── butin_et_coffres/               <- Coffres, sacs, charmes en bois, reliques runiques
│   ├── decors_et_fonds/                <- 2 fonds de donjon (Dédale Crétois, Ruines d'Olympe)
│   └── effets_et_ui_combat/            <- VFX slash, onde tellurique, soin, pétrification, UI 1x/2x/4x
│
└── battle_pass/                        <- Le Grand Sentier (Progression 20 Paliers)
    ├── battle_pass_paliers.json        <- Config JSON des 20 paliers et 4 saisons
    ├── bannieres/                      <- 6 bannières saisonnières 1170x330px
    ├── insignes_medailles/             <- 4 insignes saisonniers (Bronze, Argent, Or, Laurier)
    ├── recompenses_cosmetiques/        <- Cadres d'avatar, décors de camp palier 10 & 20
    └── cartes_paliers/                 <- 20 cartes de palier individuelles PNG/WebP
```

---

## 3. Recettes d'Intégration PixiJS 8.22.0

### A. Chargement d'un Bâtiment avec Changement de Palier
```javascript
import { Assets, Sprite, Container } from 'pixi.js';

// Chargement direct du sprite de bâtiment selon le palier actuel (1 à 5)
async function creerBatiment(type, niveau) {
  const texture = await Assets.load(`dossier_claude/batiments/${type}/sprites_decoupes/${type}_niveau_${niveau}.webp`);
  const sprite = new Sprite(texture);
  sprite.anchor.set(0.5, 0.85); // Ancre à la base au sol du bâtiment
  sprite.eventMode = 'static';
  sprite.cursor = 'pointer';
  sprite.on('pointertap', () => ouvrirModalAmelioration(type, niveau));
  return sprite;
}
```

### B. Instanciation d'un Héros en Combat (AnimatedSprite)
```javascript
import { Assets, AnimatedSprite, Container } from 'pixi.js';

async function creerHerosCombat(nomHeros, animation = 'idle') {
  // Charger les textures de l'animation demandée
  const textures = [];
  const frames = {
    idle: [1, 2, 3, 4],
    marche: [1, 2, 3, 4, 5, 6],
    action: [1, 2, 3, 4],
    degats: [1, 2],
    victoire: [1, 2, 3, 4]
  };

  const prefix = nomHeros === 'minotaure' ? (animation === 'action' ? 'minotaure_attaque' : 'minotaure_' + animation)
               : nomHeros === 'satyre' ? (animation === 'action' ? 'satyre_sort' : 'satyre_' + animation)
               : (animation === 'action' ? 'meduse_petrification' : (animation === 'marche' ? 'meduse_glisse' : 'meduse_' + animation));

  for (const idx of frames[animation]) {
    const num = String(idx).padStart(2, '0');
    const tex = await Assets.load(`dossier_claude/personnages/${nomHeros}/frames_animation/${prefix}_${num}.webp`);
    textures.push(tex);
  }

  const animSprite = new AnimatedSprite(textures);
  animSprite.anchor.set(0.5, 0.9);
  animSprite.animationSpeed = 0.15; // ~9 FPS pour un style rétro-cozy fluide
  animSprite.play();
  return animSprite;
}
```

### C. Gestion des Portails de Bifurcation
```javascript
async function afficherChoixPortails(conteneurDonjon, onChoisir) {
  const choix = ['portail_fontaine_soin', 'portail_coffre_tresor', 'portail_puits_mine'];
  const groupe = new Container();

  for (let i = 0; i < choix.length; i++) {
    const tex = await Assets.load(`dossier_claude/dungeon_crawler/portails_bifurcation/${choix[i]}.webp`);
    const s = new Sprite(tex);
    s.x = (i - 1) * 180;
    s.y = 0;
    s.anchor.set(0.5, 0.5);
    s.eventMode = 'static';
    s.cursor = 'pointer';
    s.on('pointertap', () => onChoisir(choix[i]));
    groupe.addChild(s);
  }
  conteneurDonjon.addChild(groupe);
}
```

---

## 4. Garanties & Conformité Qualité

1. **Intégrité de l'environnement** :
   - Zéro dépendance externe inutile.
   - Entièrement compatible PWA hors-ligne via `outils/generer-precache.py`.
   - Conforme au script de contrôle `scripts/verifier-projet.py` (0 erreur, 0 alerte).
2. **Détourage & Propreté Graphique** :
   - Tous les sprites sont en transparence RGBA intégrale.
   - Les ombres au sol d'origine ont été normalisées pour une superposition parfaite sur le sol isométrique du camp ou du donjon.
3. **Consistance Mécanique** :
   - Les 3 héros possèdent des archétypes complémentaires (Tank, Support, Arcaniste).
   - Les 4 monstres couvrent la courbe de difficulté des 20 étages.
   - Les 20 paliers du Sentier offrent un rythme de récompenses soutenu sans générer d'anxiété.
