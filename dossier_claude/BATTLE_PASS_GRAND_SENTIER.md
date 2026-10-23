# Spécifications du Battle Pass « Le Grand Sentier » — Athéna
**Destinataire : Claude & Développeurs**  
**Auteur : Baptiste974**  
**Date : 23/10/2026**  
**Moteur : PixiJS 8.22.0**  
**Système : Le Grand Sentier (Progression 20 Paliers & 4 Saisons Thématiques)**

---

## 1. Principes & Éthique du Grand Sentier

Le Grand Sentier est la colonne vertébrale de l'engagement à long terme dans Athéna.
Fidèle à la philosophie bienveillante du jeu, il rompt délibérément avec les pratiques de rétention agressives :
- **Aucune date butoir anxiogène** : Le joueur progresse à son rythme, les paliers ne s'évaporent pas.
- **Récompenses tangibles pour le camp** : Chaque palier débloque du bois pour agrandir les bâtiments, de l'or pour le troc, des charmes gravés et des ornements visuels pour embellir le campement.
- **20 Paliers Jalonnés** : Chaque palier possède sa carte illustrée dédiée (`palier_01_carte.png` à `palier_20_grand_carte.png`).

---

## 2. Les 4 Saisons Thématiques

Le Sentier se décline en 4 ambiances méditerranéennes possédant chacune sa palette, son insigne en métal ciselé et sa bannière panoramique ($1170 \times 330$ px) :

| Saison | Teinte & Ambiance | Insigne Dédié | Bannière Panoramique | Ornement de Camp Majeur |
| :--- | :--- | :--- | :--- | :--- |
| **1. Saison des Oliviers** | Vert sauge & calcaire (`#4f6b2f`) | `insigne_saison_1_oliviers_bronze.webp` | `banniere_saison_1_oliviers.webp` | Jeune olivier en pot décoré de feuilles d'argent |
| **2. Saison des Vendanges** | Pourpre vigne & terre cuite (`#7a2f4a`) | `insigne_saison_2_vendanges_argent.webp` | `banniere_saison_2_vendanges.webp` | Treille de raisin noir & amphores de vendange |
| **3. Saison des Lanternes** | Ambre doré & crépuscule (`#8a4512`) | `insigne_saison_3_lanternes_or.webp` | `banniere_saison_3_lanternes.webp` | Mât aux trois lampions d'or illuminés |
| **4. Saison des Semailles** | Bleu ardoise & aurore (`#2f5f6b`) | `insigne_saison_4_semailles_laurier.webp` | `banniere_saison_4_semailles.webp` | Carré de pousses tendres & arrosoir de cuivre |

---

## 3. Tableau Détaillé des 20 Paliers

| Palier | Expérience Requise | Piste & Rareté | Récompense Attribuée | Asset Visuel Associé |
| :---: | :---: | :--- | :--- | :--- |
| **01** | 100 XP | Piste Initiale | 50 Bois d'œuvre pour le camp | `palier_01_carte.webp` |
| **02** | 250 XP | Piste Initiale | 100 Pièces d'Or de négoce | `palier_02_carte.webp` |
| **03** | 450 XP | Prestige | Charme en bois gravé d'Éclaireur (+5% Vitesse) | `palier_03_carte.webp` |
| **04** | 700 XP | Piste Initiale | 150 Bois de charpente | `palier_04_carte.webp` |
| **05** | 1 000 XP | Prestige | Insigne de Bronze & Jardinières d'argile pour le camp | `palier_05_carte.webp` |
| **06** | 1 350 XP | Piste Initiale | 200 Pièces d'Or de commerce | `palier_06_carte.webp` |
| **07** | 1 750 XP | Prestige | Charme d'Atelier Artisanal (+10% Gain de bois en mine) | `palier_07_carte.webp` |
| **08** | 2 200 XP | Piste Initiale | 250 Bois d'olivier poli | `palier_08_carte.webp` |
| **09** | 2 700 XP | Piste Initiale | 300 Pièces d'Or étincelantes | `palier_09_carte.webp` |
| **10** | 3 300 XP | **Grand Cap Saisonnier** | Décor de Camp Majeur (Olivier en pot / Treille selon la saison) | `palier_10_carte.webp` |
| **11** | 4 000 XP | Piste Initiale | 350 Bois de cèdre | `palier_11_carte.webp` |
| **12** | 4 800 XP | Prestige | Charme Protecteur Fouineur (+15% Détection de coffres) | `palier_12_carte.webp` |
| **13** | 5 700 XP | Piste Initiale | 400 Pièces d'Or de prospérité | `palier_13_carte.webp` |
| **14** | 6 700 XP | Piste Initiale | 450 Bois d'Olympe | `palier_14_carte.webp` |
| **15** | 7 800 XP | **Ornement d'Honneur** | Cadre d'avatar exclusif : Feuilles d'olivier ciselées d'or | `palier_15_carte.webp` |
| **16** | 9 000 XP | Piste Initiale | 500 Pièces d'Or antique | `palier_16_carte.webp` |
| **17** | 10 300 XP | Prestige | Relique de pierre runique polie (Amélioration Forge) | `palier_17_carte.webp` |
| **18** | 11 700 XP | Piste Initiale | 600 Bois noble de sanctuaire | `palier_18_carte.webp` |
| **19** | 13 200 XP | Piste Initiale | 750 Pièces d'Or royal | `palier_19_carte.webp` |
| **20** | 15 000 XP | **Consécration Suprême** | Monument Monumental de Camp & Tunique Brodée Égéenne | `palier_20_grand_carte.webp` |

---

## 4. Spécifications Techniques d'Affichage PixiJS

### Défilement Horizontal Fluide du Sentier
Le Sentier s'affiche sous forme d'un ruban horizontal défilable :
- Chaque carte de palier mesure $280 \times 400$ px (ou adaptée au ratio mobile).
- Un tracé doré relie les cartes entre elles, s'illuminant au fur et à mesure que l'expérience est collectée.
- Quand un palier est atteint, la carte s'illumine d'un éclat doux et affiche un bouton *"Recueillir"*.

```javascript
import { Container, Sprite, Assets, Graphics } from 'pixi.js';

async function creerRubanSentier(paliers, palierActuel) {
  const ruban = new Container();
  const espacement = 220;

  for (let i = 0; i < paliers.length; i++) {
    const p = paliers[i];
    const num = String(p.palier).padStart(2, '0');
    const nomFichier = p.palier === 20 ? 'palier_20_grand_carte.webp' : `palier_${num}_carte.webp`;
    const tex = await Assets.load(`dossier_claude/battle_pass/cartes_paliers/${nomFichier}`);
    
    const carte = new Sprite(tex);
    carte.x = i * espacement;
    carte.y = 50;
    carte.scale.set(0.5); // Réduction élégante pour le ruban
    carte.alpha = p.palier <= palierActuel ? 1.0 : 0.65;
    
    ruban.addChild(carte);
  }
  return ruban;
}
```
