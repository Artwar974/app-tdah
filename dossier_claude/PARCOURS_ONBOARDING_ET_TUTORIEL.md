# Spécifications du Parcours d'Onboarding & Tutoriel — Athéna
**Destinataire : Claude & Équipe de Développement**  
**Auteur : Baptiste974**  
**Date : 23/10/2026**  
**Moteur cible : PixiJS 8.22.0**  
**Philosophie : Neuro-ergonomie TDAH, Bienveillance Absolue, Zéro Culpabilité**

---

## 1. Principes Fondateurs & Neuro-Ergonomie TDAH

L'onboarding d'Athéna est pensé pour éliminer toute friction cognitive et désamorcer le cycle de l'évitement souvent provoqué par les applications de productivité traditionnelles :
1. **Zéro Écran Écrasant** : Jamais de mur de texte ni de listes d'objectifs décourageantes. Une seule notion claire par écran.
2. **Le Geste d'Abord** : L'apprentissage se fait par l'action tactile en moins de 150 ms (glisser la quête vers le foyer).
3. **Zéro Jugement & Rien Ne Se Perd** : Aucun système de punition, pas de compteurs de séries fragiles susceptibles de se briser. Si le joueur s'absente, son campement l'attend paisiblement sans reproche.
4. **Validation Instantanée** : Chaque quête complétée libère une gerbe chaleureuse d'étincelles dorées et crédite instantanément le bois et l'or aux compteurs.

---

## 2. Le Déroulé Pas-à-Pas des 10 Étapes de l'Onboarding

| Étape | Identifiant | Titre & Thématique | Contenu Visuel & Interaction | Asset Dédié |
| :---: | :---: | :--- | :--- | :--- |
| **01** | `ob1` | **Le Concept** | Présentation de la transmutation : tes actions réelles deviennent des quêtes simples qui font grandir le campement. | `onboarding_01_concept.webp` |
| **02** | `ob2` | **Le Camp Vivant** | Découverte du camp au matin. Le feu central crépite doucement, relié par des particules d'or et de bois aux compteurs. | `onboarding_02_camp_vivant.webp` |
| **03** | `ob3` | **Le Geste Fondateur** | Tutoriel interactif : le joueur fait glisser une carte de test vers les pierres du foyer. Gerbe d'étincelles et son doux. | `onboarding_03_geste_au_feu.webp` |
| **04** | `ob4` | **Le Mont et le Son** | La montagne sacrée et ses 4 haltes quotidiennes. Choix apaisé du volume et des sonorités de la nature. | `onboarding_04_mont_et_son.webp` |
| **05** | `ob-avatar` | **Choix de l'Avatar** | Sélection du premier compagnon guide parmi les figures antiques bienveillantes (Minotaure, Chouette, Faune, Lézard). | `onboarding_05_choix_avatar.webp` |
| **06** | `habitudes` | **Les 4 Habitudes** | Choix de 4 micro-habitudes concrètes (ex: *Boire un verre d'eau*, *Aérer la pièce*, *Marcher 5 minutes*, *Pause calme*). | `onboarding_06_quatre_habitudes.webp` |
| **07** | `promesse` | **La Promesse du Camp** | Le sceau de terre cuite à maintenir 1,5s avec son cercle doré de complétion : *« Ici, on ne te juge pas. Rien ne se perd. »* | `onboarding_07_la_promesse.webp` |
| **08** | `ponton` | **Découverte du Ponton** | Découverte du tableau des départs et recrutement du premier compagnon marin (120 or, taux transparents). | `onboarding_08_decouverte_ponton.webp` |
| **09** | `donjon` | **Première Incursion** | Découverte du donjon automatique Soda Dungeon 2 : combat fluide, portails de bifurcation et butin 100% sécurisé. | `onboarding_09_premier_donjon.webp` |
| **10** | `veillee` | **La Veillée du Soir** | Clôture douce de la journée autour des lampions du campement et de l'Auberge. | `onboarding_10_le_soir_veillee.webp` |

---

## 3. Zoom sur la Mécanique de « La Promesse du Camp » (`promesse`)

L'écran de la Promesse scelle le pacte de confiance entre le jeu et le joueur. Il ne s'agit pas d'un contrat contraignant, mais d'un serment de douceur envers soi-même :
- **Interaction Tactile** : Le joueur pose son doigt sur le sceau de terre cuite orné d'un rameau d'olivier.
- **Retour Visuel PixiJS** :
  - Un anneau doré se remplit de façon circulaire pendant 1,5 seconde ($1500$ ms).
  - De douces vibrations haptiques accompagnent la progression.
  - À complétion, le sceau s'illumine d'une aura dorée et diffuse une pluie d'étincelles chaleureuses.
- **Option Accessible** : Pour les utilisateurs en mode mouvement réduit ou préférant un clic simple, un bouton *"Je promets"* ou *"Passer"* reste accessible sans obligation.

```javascript
// Implémentation PixiJS de l'anneau de promesse (1.5s)
export class SceauPromesse extends PIXI.Container {
  constructor(textureSceau, onValide) {
    super();
    this.duree = 1.5;
    this.tempsAppui = 0;
    this.enCours = false;
    this.onValide = onValide;

    // Sprite du sceau de terre cuite
    this.sceau = new PIXI.Sprite(textureSceau);
    this.sceau.anchor.set(0.5);
    this.addChild(this.sceau);

    // Anneau de progression doré
    this.anneau = new PIXI.Graphics();
    this.addChild(this.anneau);

    // Événements tactiles
    this.eventMode = 'static';
    this.cursor = 'pointer';
    this.on('pointerdown', this.demarrerAppui, this);
    this.on('pointerup', this.annulerAppui, this);
    this.on('pointerupoutside', this.annulerAppui, this);
  }

  demarrerAppui() {
    this.enCours = true;
    this.sceau.scale.set(0.96);
  }

  annulerAppui() {
    this.enCours = false;
    this.tempsAppui = 0;
    this.anneau.clear();
    this.sceau.scale.set(1.0);
  }

  maj(dt) {
    if (!this.enCours) return;
    this.tempsAppui += dt;
    const progression = Math.min(1.0, this.tempsAppui / this.duree);

    // Dessin de l'arc doré
    this.anneau.clear();
    this.anneau.lineStyle(6, 0xd49b38, 1);
    this.anneau.arc(0, 0, 110, -Math.PI / 2, -Math.PI / 2 + progression * Math.PI * 2);

    if (progression >= 1.0) {
      this.enCours = false;
      this.declencherFete();
      if (this.onValide) this.onValide();
    }
  }

  declencherFete() {
    // Éclat doré et gerbe de particules
    this.sceau.scale.set(1.15);
    // Diffusion douce des étincelles vers le camp
  }
}
```

---

## 4. Tutoriel du Geste : Glisser vers le Feu (`ob3`)

La validation d'une quête dans Athéna ne passe jamais par une case à cocher banale :
1. **La Carte de Quête** : Flottant légèrement au bas de l'écran avec une ombre douce.
2. **Zone Réceptrice (Le Foyer)** : Les pierres chaudes du feu de camp s'illuminent d'une aura accueillante dès que la carte est saisie.
3. **Seuil d'Aspiration** : Si la carte est relâchée à moins de 80 px du centre du feu, une animation d'aspiration douce en $120$ ms l'absorbe dans les flammes.
4. **Feu d'Étincelles** : Le foyer projette 12 particules dorées qui filent vers les jauges de bois et d'or en haut de l'écran.

---

## 5. Transition Douce vers le Donjon Crawler

Une fois le campement découvert, l'onboarding guide le joueur vers le Ponton :
- Le joueur reçoit une dotation d'accueil de **120 pièces d'or**, lui permettant de recruter son tout premier compagnon sans attente.
- Le premier départ en mer vers le dédale d'Athéna est scénarisé :
  - Vitesse initialisée à `1x` pour permettre d'observer les animations.
  - Premier combat contre un squelette hoplite très accessible.
  - Découverte du premier portail de bifurcation (Chambre aux Trésors).
  - Retour au camp célébré avec la confirmation : **100% des ressources récoltées sont versées au campement**.
