# Spécifications du Système de Dungeon Crawler — Athéna
**Destinataire : Claude & Développeurs**  
**Auteur : Baptiste974**  
**Date : 23/10/2026**  
**Moteur : PixiJS 8.22.0**  
**Inspiration : Soda Dungeon 2 (Boucle village ↔ donjon, combat auto, scripts IA, conservation totale du butin)**

---

## 1. Philosophie & Boucle Fondamentale de Jeu

Le donjon d'Athéna est conçu pour offrir une progression gratifiante, accessible et dénuée de stress.
Il s'inspire directement des mécaniques éprouvées de *Soda Dungeon 2* tout en s'intégrant naturellement dans l'univers méditerranéen bienveillant d'Athéna :

```
       ┌────────────────────────────────────────────────────────┐
       │                  LE CAMPEMENT D'ATHÉNA                 │
       │  • Auberge : Recrutement & Repos de l'escouade         │
       │  • Comptoir : Troc du bois & Vente automatique         │
       │  • Forge : Amélioration des armes & gravure de charmes │
       └───────────────────────────┬────────────────────────────┘
                                   │
              Départ en expédition │ Retour triomphal
             (Consommation 0 énergie) │ 100% Butin sécurisé
                                   ▼
       ┌────────────────────────────────────────────────────────┐
       │                  L'EXPÉDITION EN DONJON                │
       │  • Combat au tour par tour fluide (1x, 2x, 4x)         │
       │  • Exécution des Athéna Scripts (IA configurable)      │
       │  • Choix de Portails de bifurcation stratégiques       │
       │  • Affrontement de Boss tous les 10 étages             │
       └────────────────────────────────────────────────────────┘
```

### Règle d'Or : Rien Ne Se Perd
Fidèle à la philosophie d'Athéna, lorsque l'escouade arrive au terme de son endurance dans le donjon, **100% des pièces d'or, du bois d'œuvre, des charmes et des reliques amassés sont rapportés au camp**. Le joueur ne subit aucun recul : chaque incursion contribue concrètement à l'expansion du campement.

---

## 2. L'Escouade des Trois Héros

L'équipe d'exploration se compose d'un trio complémentaire dont les compétences couvrent tous les besoins tactiques :

| Héros | Rôle & Classe | PV Max | Attaque | Défense | Vitesse | Capacité Spéciale |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Minotaure** | Tank Mêlée (*Gardien du Labyrinthe*) | 420 | 38 | 28 | 12 | **Charge Tellurique** : Frappe 250% d'ATK et étourdit 1 tour |
| **Satyre** | Soutien & Soigneur (*Barde Panique*) | 260 | 22 | 16 | 24 | **Mélodie d'Arcadie** : Soigne 45 PV à toute l'équipe + buff ATK +25% |
| **Méduse** | Mage Contrôle (*Gorgone Arcaniste*) | 290 | 45 | 14 | 18 | **Regard Pétrifiant** : 120 dégâts magiques et fige la cible 1 tour |

### Sprites de Combat Disponibles dans `dossier_claude/dungeon_crawler/heros_combat/`
Chaque héros dispose de 5 poses distinctes détourées en RGBA :
1. `_combat_01_idle.png` : Posture d'attente respirante
2. `_combat_02_anticipation.png` : Préparation de l'attaque ou du sort
3. `_combat_03_frappe.png` : Apex de l'action martiale ou magique
4. `_combat_04_degats_recus.png` : Réception d'un coup
5. `_combat_05_victoire.png` : Célébration de fin de combat

---

## 3. Le Bestiaire des Profondeurs

Les adversaires peuplant le donjon montent en puissance de manière prévisible :

```
Étage 1 à 4 : Squelettes Hoplites (Guerriers de base)
Étage 4 à 8 : Harpies des Vents (Créatures rapides élites)
Étage 5 & 15 : Cyclope Gardien (Mini-Boss imposant)
Étage 10 & 20 : Cerbère des Ombres (Grand Boss de Sanctuaire)
```

| Ennemi | Type & Rareté | PV | ATK | DEF | Vitesse | Butin Déposé |
| :--- | :--- | :---: | :---: | :---: | :---: | :--- |
| **Squelette Hoplite** | Troupe d'infanterie | 120 | 18 | 12 | 10 | 15 Or, 8 Bois, Charme d'éclaireur |
| **Harpie des Vents** | Assaillant aérien élite | 180 | 28 | 10 | 26 | 35 Or, 15 Bois, Charme fouineur |
| **Cyclope Gardien** | Mini-Boss d'étape | 550 | 55 | 22 | 8 | 90 Or, 40 Bois, Coffre d'argent |
| **Cerbère des Ombres** | Gardien Suprême | 1200 | 85 | 35 | 16 | 250 Or, 120 Bois, Relique de pierre runique |

---

## 4. Le Système de Portails de Bifurcation

Inspiré du système de portails à clé de *Soda Dungeon 2*, tous les 5 étages ou après la victoire sur un groupe élite, le jeu propose une bifurcation à 3 choix :

1. **Portail Fontaine de Soin** (`portail_fontaine_soin.png`) :
   - Restaure instantanément 100% des points de vie de tous les membres de l'escouade.
   - Idéal pour sécuriser l'approche d'un palier de boss.
2. **Portail Chambre aux Trésors** (`portail_coffre_tresor.png`) :
   - Étage paisible sans monstres contenant 3 coffres antiques scellés.
   - Dépose de l'or abondant et des charmes d'artisanat.
3. **Portail Puits de Mine** (`portail_puits_mine.png`) :
   - Filon abondant rapportant immédiatement 60 unités de bois de cèdre et 180 pièces d'or.
   - Nourrit directement les réserves du camp.
4. **Portail Sanctuaire du Boss** (`portail_boss_gardien.png`) :
   - Raccourci vers le Boss d'étage avec multiplicateur d'expérience doublé.

---

## 5. Moteur d'IA "Athéna Scripts" (Configurable)

Pour permettre au joueur de passer du statut de simple exécutant à celui d'architecte tactique, chaque héros obéit à une liste ordonnée de règles `SI [Condition] ALORS [Action]` :

```json
[
  {
    "heros": "Satyre",
    "regles": [
      { "si": "Allie.pv_pourcent < 50", "alors": "Capacite:Melodie_Arcadie" },
      { "si": "Allie.estAffaibli == true", "alors": "Capacite:Melodie_Arcadie" },
      { "si": "Toujours", "alors": "Attaque:Flute_Magique" }
    ]
  },
  {
    "heros": "Minotaure",
    "regles": [
      { "si": "Ennemi.estBoss == true", "alors": "Capacite:Charge_Tellurique" },
      { "si": "Ennemi.pv_pourcent <= 30", "alors": "Attaque:Hache_Lourde" },
      { "si": "Toujours", "alors": "Attaque:Hache_Lourde" }
    ]
  },
  {
    "heros": "Meduse",
    "regles": [
      { "si": "Ennemis.nombre >= 2", "alors": "Capacite:Regard_Petrifiant" },
      { "si": "Ennemi.rang >= 2", "alors": "Capacite:Regard_Petrifiant" },
      { "si": "Toujours", "alors": "Attaque:Eclair_Venimeux" }
    ]
  }
]
```

### Algorithme d'Évaluation en Combat (JavaScript PixiJS)
```javascript
function evaluerTourHeros(heros, etatCombat) {
  for (const regle of heros.scriptIA) {
    if (verifierCondition(regle.si, heros, etatCombat)) {
      return executerAction(regle.alors, heros, etatCombat);
    }
  }
  return heros.attaqueParDefaut();
}
```

---

## 6. Ergonomie (QoL) & Gestion du Butin

1. **Régulateur de Vitesse** :
   - Bouton en haut à droite du donjon basculant entre `1x` (vitesse standard), `2x` (rythme alerte) et `4x` (turbo).
2. **Liquidation Automatique (Comptoir)** :
   - Dès que le joueur possède plus de 6 exemplaires d'un même charme ou équipement, le surplus est automatiquement transformé en or au retour au camp en un seul clic sans gestion d'inventaire rébarbative.
3. **Journal d'Expédition** :
   - Écran de synthèse doux récapitulant les ressources récoltées, les étages parcourus et les paliers d'expérience gagnés pour chaque héros.
