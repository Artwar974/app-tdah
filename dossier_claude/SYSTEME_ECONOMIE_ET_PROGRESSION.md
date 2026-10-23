# Spécifications de l'Économie & de la Progression — Athéna
**Destinataire : Claude & Équipe de Développement**  
**Auteur : Baptiste974**  
**Date : 23/10/2026**  
**Moteur cible : PixiJS 8.22.0**  
**Référence Barème : Module Économie Athéna (`V.JEU.eco`) & Inspiration Soda Dungeon 2**

---

## 1. Principes & Formule de l'Économie Unifiée

L'économie d'Athéna repose sur une harmonie parfaite entre les activités de la vie réelle (les quêtes quotidiennes validées) et l'univers du jeu (l'agrandissement du camp et les expéditions en donjon).
Elle respecte strictement le barème officiel du projet (`V.JEU.eco`) afin d'assurer une progression fluide, constante et sans rupture sur 30 à 60 jours.

```
       ┌────────────────────────────────────────────────────────┐
       │                   ENTRÉES DE RESSOURCES                │
       │  • Quêtes du Réel : +10 Bois, +5 Or (x6 pleines/jour)  │
       │  • Expéditions Donjon : 15 à 250 Or, 8 à 120 Bois      │
       │  • Puits de Mine : +60 Bois, +180 Or                   │
       │  • Troc & Liquidation au Comptoir : Revente surplus    │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                   RÉSERVES DU CAMPEMENT                │
       │           [ BOIS DE CÈDRE ]      [ PIÈCES D'OR ]       │
       └───────────────────────────┬────────────────────────────┘
                                   │
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                   SORTIES & INVESTISSEMENTS            │
       │  • Amélioration Bâtiments 1 ➔ 5 (Comptoir, Forge, Aub.)│
       │  • Recrutement Compagnons au Ponton (120 Or fixe)      │
       │  • Affûtage d'armes & Gravure de charmes à la Forge    │
       │  • Mobilier de confort & Embellissements du Camp       │
       └────────────────────────────────────────────────────────┘
```

---

## 2. Le Barème Quotidien des Quêtes (`V.JEU.eco`)

| Action | Bois Crédité | Or Crédité | Expérience (XP) | Remarques |
| :--- | :---: | :---: | :---: | :--- |
| **Quête validée (1 à 6)** | **+10 bois** | **+5 or** | **+10 XP** | Plein gain pour encourager la régularité sans surcharger |
| **Quête supplémentaire (> 6)** | **+2 bois** | **+1 or** | **+2 XP** | Gain réduit doux pour éviter l'épuisement ou le grind forcé |
| **Total quotidien optimal (6 quêtes)** | **60 bois** | **30 or** | **60 XP** | Suffisant pour poser les bases de la journée |

---

## 3. Coûts & Paliers d'Évolution des Bâtiments (1 à 5)

Chaque bâtiment structurel du camp possède 5 niveaux d'amélioration, nécessitant un investissement équilibré en bois et en or :

### A. Le Comptoir d'Échange
| Niveau | Appellation | Coût Bois | Coût Or | Bénéfice Débloqué |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Étal de bois modeste | *Initial (0)* | *Initial (0)* | Troc de base (10 Bois ➔ 25 Or) |
| **2** | Échoppe à auvent rayé | 40 bois | 80 or | **Liquidation Automatique** des surplus d'équipements (> 6 doublons) |
| **3** | Boutique à étagères & lanternes | 100 bois | 220 or | **+15% Or** sur toutes les expéditions en donjon |
| **4** | Comptoir en pierre calcaire | 250 bois | 550 or | Caravane marchande itinérante bi-hebdomadaire |
| **5** | Agora Marchande Hellénique | 600 bois | 1 400 or | **Revenu passif horaire d'or** (+10 Or/h) & accès aux charmes rares |

### B. La Forge d'Artisanat
| Niveau | Appellation | Coût Bois | Coût Or | Bénéfice Débloqué |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Enclume sur billot | *Initial (0)* | *Initial (0)* | Entretien des armes de base |
| **2** | Forge à soufflet en cuir | 50 bois | 100 or | Forgeage des armes de bronze poli (+15% Attaque équipe) |
| **3** | Atelier avec meule & auvent | 120 bois | 280 or | **Réduction de 20%** du coût en bois des fabrications |
| **4** | Fonderie de pierre & cheminée | 280 bois | 650 or | Affûtage de précision (**+10% Taux Critique** pour l'escouade) |
| **5** | Sanctuaire d'Héphaïstos | 700 bois | 1 600 or | Gravure de runes antiques & armes légendaires |

### C. L'Auberge des Héros
| Niveau | Appellation | Coût Bois | Coût Or | Bénéfice Débloqué |
| :---: | :--- | :---: | :---: | :--- |
| **1** | Abri de nattes & bancs | *Initial (0)* | *Initial (0)* | Hébergement du Minotaure Gardien (Tank) |
| **2** | Auberge à auvent & tablées | 60 bois | 120 or | Déblocage du **Satyre Musicien** (Support & Soin) |
| **3** | Maisonnette à étage fleuri | 150 bois | 350 or | Déblocage de la **Gorgone Méduse** (Mage & Contrôle) |
| **4** | Pavillon d'accueil en marbre | 320 bois | 750 or | **+25% Régénération PV** entre chaque combat de donjon |
| **5** | Palais Hospitalier à Péristyle | 800 bois | 1 800 or | **3 Presets d'IA Tactiques** personnalisables (*Athéna Scripts*) |

---

## 4. Rendement Économique du Donjon (Soda Dungeon 2)

Les expéditions dans le donjon viennent accélérer l'expansion du camp sans jamais concurrencer les quêtes réelles :

| Tranche d'Étages | Ennemi Affronté | Butin Or Moyen | Butin Bois Moyen | Objet Déposé |
| :---: | :--- | :---: | :---: | :--- |
| **Étages 1 à 4** | Squelettes Hoplites | 15 or / combat | 8 bois / combat | Charme d'éclaireur |
| **Étages 4 à 8** | Harpies des Vents (Élites) | 35 or / combat | 15 bois / combat | Charme fouineur |
| **Étage 5 & 15** | Cyclope Gardien (*Mini-Boss*) | 90 or | 40 bois | Coffre d'argent |
| **Étage 10 & 20** | Cerbère des Ombres (*Grand Boss*) | 250 or | 120 bois | Relique de pierre runique |
| **Portail Puits de Mine** | Veine de ressources | **+180 or** | **+60 bois** | Minage direct sans combat |

### Règle Anti-Inflation : La Liquidation Automatique
Inspirée de la fonction *Liquidate* de *Soda Dungeon 2*, l'écran du Comptoir propose un bouton de vente des doublons :
- Tout charme ou accessoire possédé en plus de 6 exemplaires est automatiquement converti en pièces d'or.
- Empêche l'engorgement de l'inventaire et offre un revenu d'or prévisible.

---

## 5. Recrutement au Ponton & Taux de Rareté

Le recrutement de compagnons s'effectue au Ponton à un tarif fixe sans achat en argent réel :
- **Coût de Recrutement** : **120 pièces d'or** par compagnon.
- **Taux de Rareté Transparents** :
  - **Compagnon Commun** : **68 %** (Stats de base : 1 à 2).
  - **Compagnon Rare** : **27 %** (Stats de base : 2 à 3 + passif d'expédition).
  - **Compagnon Légendaire** : **5 %** (Stats de base : 3 à 4 + capacité unique de groupe).
- **Recrutement Garanti** : Chaque tentative fournit un compagnon opérationnel prêt à embarquer.

---

## 6. Limites Techniques & Bonnes Pratiques PixiJS 8.22.0

Afin de garantir un framerate stable à **60 FPS** sur tous les terminaux mobiles sans surchauffe ni fuite mémoire :

1. **Dimensions Maximales des Textures (WebGL/WebGPU)** :
   - Aucune texture ne dépasse $2048 \times 2048$ px pour garantir la compatibilité universelle sur mobiles Android et iOS d'entrée de gamme.
   - Les fonds panoramiques sont limités à $1170 \times 600$ px et optimisés en WebP (poids moyen $< 120$ Ko).
2. **Gestion du Batching & Tri de Profondeur** :
   - Les sprites du camp partagent la même texture d'atlas ou le même format de texture pour maximiser le batch rendering automatique de PixiJS 8.22.0.
   - Utilisation de `container.sortableChildren = true` avec tri basé sur `sprite.zIndex = sprite.y`.
3. **Nettoyage Mémoire & Cycle de Vie** :
   - Lors du passage du camp au donjon, les textures non réutilisées sont nettoyées proprement :
     ```javascript
     // Libération propre des textures spécifiques à un écran
     PIXI.Assets.unload('chemin/vers/texture_specifique.webp');
     ```
4. **Format WebP Universel & Fallback PNG** :
   - Tous les assets sont livrés en double format (`.webp` prioritaire pour le web mobile PWA, et `.png` source sans compression).
