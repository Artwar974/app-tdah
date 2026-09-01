# REFERENCE — Pipeline de rendu du monde : végétation, emissives, états et ordre de production

> Statut : note de direction artistique et d'architecture visuelle du landmark.
> Complète les fiches `REFERENCE_LIGHTING_LANDMARK.md` et `REFERENCE_SKY_SEA_DYNAMIC.md`.
> Cette fiche décrit la cible de production. Elle ne prétend pas que l'implémentation existe déjà dans l'application.

## 1. Les végétaux n'ont pas quatre animations

Les animations de végétation doivent être **indépendantes de l'heure**.

Ne pas créer :

```text
TREE_DAY
TREE_SUNSET
TREE_NIGHT
```

Créer :

```text
TREE
+
COLOR / LIGHT ENVIRONMENT
```

Le mesh / système de déformation de vent reste identique. Le végétal reçoit ensuite la lumière, la couleur d'ombre et l'ambiance du monde.

Principe : **un asset animé → plusieurs états lumineux**.

Cette règle s'applique également autant que possible aux futurs assets de housing.

## 2. Vent paramétrique

Le vent ne doit pas être dupliqué par météo ou moment de journée. Préparer un paramètre commun :

```text
WIND_STRENGTH
```

Exemples :

```text
calme   = 0.2
venteux = 0.7
```

Le même mesh / cycle de végétation reçoit une amplitude différente.

Le vent pourra plus tard dépendre d'un système météo. Il n'est pas nécessaire de le relier automatiquement à l'heure réelle.

## 3. EMISSIVE_MASK

La nuit introduit un nouveau type de contribution : les sources émissives.

Préparer :

```text
EMISSIVE_MASK
```

Pour notamment :

- feu de camp ;
- lanternes ;
- fenêtres ;
- temple si pertinent ;
- futures lumières de housing ;
- autres éléments lumineux persistants.

Évolution indicative :

```text
DAY
opacity = 0

SUNSET
opacity monte progressivement

NIGHT
opacity = pleine valeur
```

Les emissives peuvent devenir un levier important de progression visuelle du camp : un refuge plus développé peut être particulièrement riche et chaleureux la nuit sans modifier la structure du décor.

## 4. GLOBAL_COLOR_GRADE reste secondaire

Un léger `GLOBAL_COLOR_GRADE` peut être conservé, mais il ne doit porter qu'environ **10–20 % du travail visuel**.

Le reste doit venir de :

```text
SKY
+
ATMOSPHERE
+
DIRECT LIGHT
+
SHADOW
+
SEA
+
REFLECTIONS
+
EMISSIVES
```

Garde-fou : éviter l'impression de quatre filtres globaux appliqués sur la même image.

## 5. Organisation de fichiers recommandée

```text
MAP/
│
├── MASTER/
│   ├── master_sunset_locked.png
│   ├── master_sunrise_locked.png
│   ├── master_daylight_locked.png
│   ├── master_night_locked.png
│   └── land_base_neutral.png
│
├── MASKS/
│   ├── land_light_mask.png
│   ├── land_shadow_mask.png
│   ├── atmosphere_mask.png
│   └── emissive_mask.png
│
├── SKY/
│   ├── cloud_01
│   ├── cloud_02
│   ├── cloud_03
│   └── stars
│
├── SEA/
│   ├── sea_base
│   ├── reflection_mask
│   └── shore_lines
│
├── VEGETATION/
│   ├── tree_left/
│   ├── tree_right/
│   ├── cypress_01/
│   ├── cypress_02/
│   └── shrubs/
│
├── VFX/
│   ├── leaf_01
│   ├── leaf_02
│   ├── birds
│   └── particles
│
└── STATES/
    ├── DAWN
    ├── DAY
    ├── SUNSET
    └── NIGHT
```

`STATES/` contient surtout des paramètres, pas des images dupliquées.

Paramètres attendus :

```text
sky colors
light color
shadow color
atmosphere color
sea color
reflection color
global grade
star opacity
emissive intensity
```

## 6. Ordre de production recommandé

Construire et valider dans cet ordre :

1. `master_sunset_locked`
2. `land_base_neutral`
3. `land_light_mask`
4. `land_shadow_mask`
5. `atmosphere_mask`
6. ciel dynamique / procédural
7. mer dynamique / procédurale
8. reflets de mer
9. nuages
10. six végétaux animés
11. état `SUNSET`
12. **contrôle qualité : reproduire le master sunset**
13. état `DAY`
14. état `NIGHT`
15. état `DAWN`
16. seulement ensuite, transitions entre les quatre

Le point **12 est le contrôle qualité central**. Le sunset étant déjà artistiquement verrouillé, il sert de calibration de tout le système.

Si le système reconstruit mal `MASTER_SUNSET_LOCKED`, ne pas avancer vers davantage d'états ou de transitions : corriger d'abord la séparation base / lumière / ombre / atmosphère / mer / reflets.

## 7. Transitions continues

Ne pas faire :

```text
DAY
CLIC
SUNSET
CLIC
NIGHT
```

Faire :

```text
DAY
 ↓
LATE_AFTERNOON
 ↓
SUNSET
 ↓
TWILIGHT
 ↓
NIGHT
```

Les sous-états n'ont pas besoin d'assets dédiés : ils résultent d'interpolations de paramètres.

Exemple conceptuel :

```text
18:00
DAY 80 %
SUNSET 20 %

18:30
DAY 50 %
SUNSET 50 %

19:00
DAY 10 %
SUNSET 90 %

19:30
SUNSET 60 %
NIGHT 40 %

20:30
NIGHT 100 %
```

Les horaires exacts sont volontairement **non verrouillés** à ce stade. Plus tard, le duo pourra choisir entre heures fixes, heure locale, ou lever/coucher astronomiques. Ne pas complexifier ce choix avant d'avoir validé le rendu de base.

## 8. Conséquence pour le housing

Un nouvel asset de housing ne devrait idéalement pas exister en quatre versions.

Structure cible :

```text
BASE
LIGHT_MASK
SHADOW_MASK
EMISSIVE éventuel
```

Ainsi un bâtiment ou objet posé dans le camp reçoit automatiquement :

- la lumière du lever ;
- la lumière de jour ;
- la lumière du coucher ;
- la nuit et ses emissives ;
- plus tard, la météo et d'autres ambiances.

Le cycle horaire devient donc un **système de rendu du monde**, et non une collection d'illustrations indépendantes.

## 9. Pourquoi cette architecture est importante pour Journal de Quêtes

Elle permet de préserver la peinture et la signature visuelle du landmark tout en rendant le monde capable de :

- respirer avec l'heure ;
- accueillir une météo future ;
- accueillir des saisons futures ;
- intégrer de nouveaux assets de housing sans quatre variantes peintes ;
- conserver une cohérence lumineuse globale ;
- réduire les duplications de production ;
- faciliter les transitions douces ;
- faire de la nuit un moment particulièrement riche grâce aux emissives.

## 10. Règle de production finale

**Animation, matériau et lumière doivent rester séparés autant que possible.**

- animation = mouvement propre de l'asset ;
- matériau / base = identité visuelle permanente ;
- lumière / ombre = réponse à l'environnement ;
- emissive = lumière propre de l'asset ;
- état horaire = ensemble de paramètres ;
- master = juge artistique.

Cette séparation doit rester suffisamment simple pour être maintenable par le duo. Toute implémentation devra être testée sur un petit slice avant généralisation.
