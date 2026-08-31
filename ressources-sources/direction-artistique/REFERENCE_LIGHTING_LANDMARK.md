# REFERENCE — Landmark : lumière dynamique et états maîtres

> Statut : référence de direction artistique / pipeline visuel du camp.
> Cette fiche consigne la réflexion validée autour des états lumineux du landmark. Elle ne remplace pas les masters : les images maîtres restent les juges artistiques finaux.

## 1. Principe fondamental

Le camp est **un seul monde dans plusieurs états lumineux**, et non plusieurs décors repeints indépendamment.

La géométrie, les silhouettes, la composition, le terrain jouable, la baie, les falaises, le temple, le chemin et les grandes masses végétales restent fixes. Les variables temporelles sont la lumière, la palette, les ombres, l'atmosphère, les reflets et les micro-effets liés à l'heure.

Une variation horaire qui déplace un rocher, reconstruit un buisson ou modifie une falaise est une dérive graphique, pas un changement de lumière.

## 2. Masters verrouillés

```text
REFERENCE/
├── MASTER_SUNRISE_LOCKED.png
├── MASTER_DAYLIGHT_LOCKED.png
├── MASTER_SUNSET_LOCKED.png
├── MASTER_NIGHT_LOCKED.png
├── LAND_BASE_NEUTRAL.png
└── LAND_LIGHT_MASK.png
```

Les quatre masters sont des **cibles de calibration artistique**. Ils définissent les moments-clés du cycle et la qualité visuelle attendue. Ils ne sont pas quatre `LAND_BASE` différents.

### SUNRISE / DAWN

Sensation : **calme / réveil / fraîcheur**.

- Ciel : violet froid en haut, rose saumon, pêche clair près de l'horizon.
- Éclairage : lumière très latérale, orange rosé clair.
- Ombres : encore bleutées.
- Atmosphère : légère brume, contraste réduit au loin.
- Mer : bleu lavande, reflets pêche.
- Point distinctif : ne pas en faire un petit sunset ; la coexistence lumière chaude / ombres froides est importante.

Cible : `MASTER_SUNRISE_LOCKED.png`.

### DAY

Sensation : **clarté / lisibilité / énergie tranquille**.

- Ciel : bleu doux légèrement turquoise, horizon plus pâle.
- Éclairage : crème, beaucoup moins orange.
- Ombres : bleu-violet discret.
- Mer : bleu plus franc / turquoise désaturé.
- Végétation : roses et violets toujours présents, moins baignés de rouge.
- Point distinctif : meilleure lisibilité fonctionnelle de la scène.

Cible : `MASTER_DAYLIGHT_LOCKED.png`.

### SUNSET

Sensation : **chaleur / retour au camp / intimité**.

- Ciel : pêche → rose → violet.
- Éclairage : orange chaud très latéral.
- Ombres : mauve / violet.
- Mer : bleu profond, reflets roses.
- Point distinctif : le master existant est le juge final ; une reconstruction théoriquement plus jolie mais trop éloignée est rejetée.

Cible : `MASTER_SUNSET_LOCKED.png`.

### NIGHT

Sensation : **repos / contemplation / sécurité**.

Règle absolue : **NIGHT ≠ DAY + filtre bleu foncé**.

- Ciel : bleu-violet profond, gradient encore visible, jamais noir pur.
- Paysage : valeurs réduites mais couleurs encore perceptibles.
- Ombres : violet profond / bleu pétrole.
- Lumière : léger clair de lune froid.
- Mer : bleu sombre, reflets lunaires très parcimonieux.
- Camp : petites sources chaudes éventuelles.
- Avant-plan : peut être largement absorbé par l'ombre sans perdre la structure générale.

Cible : `MASTER_NIGHT_LOCKED.png`.

## 3. LAND_BASE_NEUTRAL

`LAND_BASE_NEUTRAL.png` contient ce qui appartient au monde, pas ce qui appartient à une heure précise :

- géométrie des falaises ;
- temple ;
- chemin ;
- côte ;
- terrain du camp ;
- masses végétales ;
- silhouettes ;
- texture matérielle de base ;
- séparation des plans ;
- détails permanents.

Il doit être aussi indépendant que possible de l'orange du coucher, du rose atmosphérique, du bleu nocturne, des halos et des ombres colorées propres à un moment.

Attention : neutraliser ne signifie pas rendre le décor gris et mort. La base conserve les relations de matières et les couleurs locales utiles à la DA ; elle retire surtout la forte signature d'un éclairage horaire.

Principe : **ALBEDO / MATIÈRE** séparés autant que possible de **LUMIÈRE / ATMOSPHÈRE**.

## 4. LAND_LIGHT_MASK

`LAND_LIGHT_MASK.png` est le masque maître d'exposition à la lumière principale. Il encode **combien une surface reçoit la lumière**, pas une heure particulière.

- blanc = exposition forte ;
- gris clair = exposition moyenne ;
- gris foncé = exposition faible ;
- noir = aucune contribution de cette lumière.

Zones prioritaires :

- côtés gauche / orientés vers la lumière des falaises ;
- hauts des terrasses ;
- parties supérieures du terrain ;
- certains volumes de feuillage ;
- sommet de l'Olympe / temple.

Ne pas y confondre les ombres de contact et l'occlusion profonde : le masque décrit surtout la contribution de la lumière directionnelle principale.

Couleurs de lumière indicatives :

```text
SUNRISE → pêche rosé clair
DAY     → crème pâle
SUNSET  → orange chaud
NIGHT   → bleu lunaire très faible
```

Pipeline conceptuel :

```text
LAND_BASE_NEUTRAL
      +
LAND_LIGHT_MASK × LIGHT_COLOR
      +
SHADOW / AMBIENT
      +
ATMOSPHERE
      =
FINAL STATE
```

À la nuit, le masque ne doit jamais être simplement réutilisé à pleine intensité en bleu. Sa contribution lunaire est très faible et peut être complétée par des masques spécifiques si nécessaire.

## 5. Ciel, mer et astres : systèmes dynamiques

Le ciel et la mer doivent être remplacés / composés par des **calques d'animation d'ambiance**. Ils sont traités comme des systèmes du landmark, pas comme une peinture statique figée dans `LAND_BASE_NEUTRAL`.

Les astres — soleil et lune — parcourent le ciel en temps réel et participent aux variations de lueurs.

Architecture conceptuelle :

```text
LAND_BASE_NEUTRAL
    ↓
LAND_LIGHT_MASK
    ↓
SUN / MOON POSITION
    ↓
CLOUD OCCLUSION
    ↓
SKY AMBIENT COLOR
    ↓
SEA REFLECTION STATE
    ↓
LOCAL LIGHTS
    ↓
FINAL LANDMARK LIGHTING
```

Le système lumineux répond donc aux variations du ciel, des nuages, des vagues et des astres au lieu d'appliquer seulement quatre filtres figés.

## 6. Trois échelles de variation

### Variation lente

- heure de la journée ;
- position du soleil / de la lune ;
- palette générale ;
- évolution vers les quatre masters.

### Variation intermédiaire

- passages nuageux ;
- atténuation de la lumière directe ;
- léger refroidissement / réchauffement de l'ambiante ;
- changements de reflets sur la mer.

### Variation fine

- scintillements ;
- vagues ;
- halos ;
- petites fluctuations lumineuses.

Garde-fou : **tout ne doit pas réagir à tout**. Un nuage peut réduire la lumière directe et refroidir légèrement l'ambiante sans recolorer brutalement tout le monde. Les vagues influencent d'abord les reflets et scintillements de la mer, pas l'éclairage global des falaises.

## 7. Rôle des quatre masters dans un système dynamique

Les masters sont des **points de calibration**, pas des cages rigides.

Entre deux masters, le système peut faire varier progressivement :

- teinte ;
- intensité ;
- direction de la lumière ;
- couleur d'ombre ;
- densité atmosphérique ;
- réponse de la mer ;
- contribution solaire / lunaire.

Mais ces interpolations ne doivent jamais casser la composition, la hiérarchie lumineuse ou la signature graphique du landmark.

## 8. Règle de fidélité / anti-dérive

Lors d'une reconstruction ou d'une génération :

1. conserver exactement la structure du monde ;
2. modifier seulement les variables liées à la lumière / ambiance demandée ;
3. comparer le résultat au master horaire le plus proche ;
4. rejeter une image séduisante si elle dérive en géométrie, silhouettes, masses ou budget de détail ;
5. revenir au master comme autorité artistique.

Le système cible donc :

**un landmark stable + une lumière vivante**, et non quatre illustrations indépendantes.

## 9. Pipeline de référence synthétique

```text
LANDMARK STABLE
├── LAND_BASE_NEUTRAL
├── LAND_LIGHT_MASK
├── géométrie / masses verrouillées
└── matières / textures permanentes

AMBIANCE DYNAMIQUE
├── SKY animation
├── CLOUD animation / occlusion
├── SEA animation / waves / reflections
├── SUN trajectory
├── MOON trajectory
└── local emissives

LIGHTING RESPONSE
├── ambient / sky color
├── directional light
├── shadow color
├── atmospheric depth
├── sea reflection response
└── local lights

CALIBRATION
├── MASTER_SUNRISE_LOCKED
├── MASTER_DAYLIGHT_LOCKED
├── MASTER_SUNSET_LOCKED
└── MASTER_NIGHT_LOCKED
```

## 10. Statut de production

Cette fiche documente la **direction artistique et la logique de pipeline souhaitée**. Elle ne signifie pas que l'implémentation technique complète existe déjà dans l'application. Avant implémentation, le Developer doit vérifier l'architecture réelle, les assets présents, le coût mobile et choisir le plus petit slice sûr et réversible.
