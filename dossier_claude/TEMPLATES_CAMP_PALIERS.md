# Spécifications des Templates du Camp — Athéna (Paliers 1 à 5)
**Destinataire : Claude & Développeurs**  
**Auteur : Baptiste974**  
**Date : 23/10/2026**  
**Moteur : PixiJS 8.22.0**  
**Système : Templates Isométriques d'Évolution du Campement**

---

## 1. Philosophie Spatiale du Campement

Le camp d'Athéna est un havre de paix en bord de mer Égée.
Le joueur y voit son refuge grandir au fil de ses expéditions et des paliers franchis.
Chaque bâtiment possède 5 niveaux visuels distincts, allant de la modeste installation de fortune en bois flotté jusqu'à l'agora hellénique monumentale aux dômes d'azur.

```
       [ARRIÈRE-PLAN : Mer Égée, falaises douces et oliveraies]
  
            (Étage Haut)           (Centre Droit)
             L'AUBERGE                 LA FORGE
            [x: 320, y: 240]        [x: 780, y: 280]
  
      (Centre Gauche)              (Avant-Plan Droit)
       LE COMPTOIR                  LE PONTON / EMBARCADÈRE
      [x: 210, y: 460]              [x: 820, y: 520]
  
                  (Centre Bas / Feu de Joie)
                      L'AGORA CENTRALE
                      [x: 520, y: 420]
```

---

## 2. Les 5 Paliers d'Évolution Visuelle

### Palier 1 : Le Campement Balbutiant (Arrivée sur la grève)
- **Ambiance** : Écru, bois brut, simplicité rustique.
- **Comptoir Niv 1** : Simple table de bois patiné avec un panier tressé d'oranges et deux poteries d'argile.
- **Forge Niv 1** : Enclume posée sur un tronc d'olivier, petit foyer de pierres chaudes et marteau d'artisan.
- **Auberge Niv 1** : Abri bas fait de pieux et de nattes de roseaux tressés, banquette de toile pour le repos.

### Palier 2 : L'Installation Confortable (Les premiers surplus)
- **Ambiance** : Auvents de toile rayée blanc et ocre, cordages marins, outillage organisé.
- **Comptoir Niv 2** : Table couverte d'un dais rayé protégeant les caisses d'approvisionnement.
- **Forge Niv 2** : Foyer élargi avec soufflet de cuir suspendu et baquet d'eau de trempe.
- **Auberge Niv 2** : Dortoir surélevé sur plancher de bois avec auvent abritant les tablées.

### Palier 3 : Le Hameau Prospère (Le bourg commerçant)
- **Ambiance** : Toiles bleu d'azur et crème, étagères chargées d'amphores, lanternes de bronze allumées.
- **Comptoir Niv 3** : Grande échoppe ouverte avec étagères de poteries, rouleaux de tissus égéens et fanion de bienvenue.
- **Forge Niv 3** : Atelier semi-clos couvert de tuiles de terre cuite, meule à eau et râtelier de lances et haches.
- **Auberge Niv 3** : Maisonnette à étage avec balcon de bois sculpté, jardinières de fleurs et deux chambres d'hôtes.

### Palier 4 : La Cité Minérale (Élégance classique)
- **Ambiance** : Calcaire blanc taillé, tuiles canal en terre cuite flammée, menuiseries massives.
- **Comptoir Niv 4** : Comptoir massif taillé dans le calcaire clair, enseigne en bois patiné, lanternes soignées.
- **Forge Niv 4** : Véritable fonderie de pierre avec cheminée fumante, établis multiples et foyer à haute température.
- **Auberge Niv 4** : Pavillon d'accueil hellénique à colonnettes ioniques, tuiles vernissées et terrasse dallée.

### Palier 5 : Le Sanctuaire Suprême d'Athéna (Prestige architectural)
- **Ambiance** : Dômes peints en bleu d'azur profond, colonnades antiques en marbre blanc veiné, cyprès gracieux et braseros d'or.
- **Comptoir Niv 5** : Basilique marchande à dôme bleu azur, portique à colonnes de marbre et urnes d'abondance.
- **Forge Niv 5** : Temple métallurgique d'Héphaïstos flanqué de colonnes cannelées et surmonté de bas-reliefs de bronze.
- **Auberge Niv 5** : Palais d'hospitalité majestueux entouré d'un péristyle ombragé, fontaine d'eau claire et toiture à dôme.

---

## 3. Matrice de Coordonnées et Tri en Profondeur (Z-Ordering)

Dans le moteur PixiJS, le tri isométrique s'opère sur la coordonnée `y` du pied de chaque élément :

| Bâtiment | Ancre X | Ancre Y | Position X (Canvas 1170) | Position Y (Canvas 720) | Z-Index recommandé |
| :--- | :---: | :---: | :---: | :---: | :---: |
| **Auberge** | 0.50 | 0.88 | 320 px | 260 px | 10 |
| **Forge** | 0.50 | 0.85 | 800 px | 300 px | 12 |
| **Comptoir** | 0.50 | 0.85 | 220 px | 470 px | 20 |
| **Ponton** | 0.50 | 0.80 | 840 px | 540 px | 22 |
| **Chouettes / Compagnons** | 0.50 | 0.95 | Variables | Variables | Dynamique (`y`) |

---

## 4. Code d'Intégration du Camp dans PixiJS 8.22.0

```javascript
import { Application, Assets, Container, Sprite } from 'pixi.js';

export class CampAthenaScene {
  constructor(app, niveauxBatiments = { comptoir: 1, forge: 1, auberge: 1 }) {
    this.app = app;
    this.niveaux = niveauxBatiments;
    this.conteneur = new Container();
    this.conteneur.sortableChildren = true;
    this.batimentsSprites = {};
  }

  async initialiser() {
    // 1. Fond du camp
    const texFond = await Assets.load('assets/scene/fond/fond_jour.webp');
    const fond = new Sprite(texFond);
    fond.zIndex = 0;
    this.conteneur.addChild(fond);

    // 2. Disposition des bâtiments
    const config = [
      { id: 'auberge', x: 320, y: 260, ancreY: 0.88 },
      { id: 'forge', x: 800, y: 300, ancreY: 0.85 },
      { id: 'comptoir', x: 220, y: 470, ancreY: 0.85 }
    ];

    for (const b of config) {
      await this.poserBatiment(b.id, this.niveaux[b.id] || 1, b.x, b.y, b.ancreY);
    }

    this.app.stage.addChild(this.conteneur);
  }

  async poserBatiment(type, niveau, x, y, ancreY) {
    const chemin = `dossier_claude/batiments/${type}/sprites_decoupes/${type}_niveau_${niveau}.webp`;
    const texture = await Assets.load(chemin);
    
    // Remplacement fluide si déjà existant
    if (this.batimentsSprites[type]) {
      this.conteneur.removeChild(this.batimentsSprites[type]);
    }

    const sprite = new Sprite(texture);
    sprite.x = x;
    sprite.y = y;
    sprite.anchor.set(0.5, ancreY);
    sprite.zIndex = y; // Tri isométrique naturel par la profondeur Y
    sprite.eventMode = 'static';
    sprite.cursor = 'pointer';

    sprite.on('pointerenter', () => { sprite.scale.set(1.03); });
    sprite.on('pointerleave', () => { sprite.scale.set(1.0); });
    sprite.on('pointertap', () => { this.ouvrirAmelioration(type); });

    this.batimentsSprites[type] = sprite;
    this.conteneur.addChild(sprite);
    this.conteneur.sortChildren();
  }

  ouvrirAmelioration(type) {
    console.log(`[Camp] Ouverture de l'amélioration pour ${type} (Niveau actuel : ${this.niveaux[type]})`);
    // Déclenche l'affichage de la modale HTML/Canvas dédiée
  }
}
```
