# REFERENCE — Ciel, mer, reflets et nuages dynamiques

> Statut : note de direction artistique / système d'ambiance du landmark.
> Complète `REFERENCE_LIGHTING_LANDMARK.md` sur la branche de travail `docs/da-lighting-reference`.

## 1. Principe général

Le ciel et la mer deviennent **indépendants du LAND_BASE**. Ils ne sont pas quatre images statiques correspondant aux quatre moments de la journée.

Ils sont des systèmes animés dont la palette, la luminosité, les reflets et l'opacité évoluent continûment dans le temps.

Les quatre masters `SUNRISE / DAY / SUNSET / NIGHT` restent des cibles artistiques de calibration, mais les transitions entre eux doivent être interpolées.

## 2. Ciel indépendant

Le ciel est traité comme un gradient animé avec plusieurs points-clés horaires.

Exemple de repères :

```text
05:30  NIGHT
06:30  SUNRISE
09:00  DAY
12:00  DAY
17:00  LATE_AFTERNOON
19:00  SUNSET
21:00  NIGHT
```

Le passage ne doit jamais être brutal. La logique est :

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

Les couleurs intermédiaires sont interpolées pour créer une continuité lumineuse plus naturelle et plus riche que quatre bascules fixes.

### Conséquence DA

Le ciel devient un moteur d'ambiance qui influence ensuite :

- la lumière ambiante du landmark ;
- la couleur des ombres ;
- la teinte de la mer ;
- la couleur des nuages ;
- les reflets ;
- la perception de profondeur atmosphérique.

## 3. Mer indépendante

La mer est reconstruite comme un système de calques :

```text
SEA_BASE
+
SEA_LIGHT_GRADIENT
+
SEA_REFLECTIONS
+
SHORE_LINES
```

Les **animations restent les mêmes** ; leur palette évolue avec l'heure.

### Palettes de référence

```text
DAWN
lavande + pêche

DAY
bleu / turquoise

SUNSET
bleu cobalt + reflets saumon

NIGHT
bleu pétrole + violet
```

La mer doit donc réagir au ciel plutôt que conserver une coloration peinte définitivement dans le landmark.

## 4. Reflets

Ne pas conserver de bandes roses permanentes.

Utiliser un système générique :

```text
REFLECTION_MASK
```

La même animation reçoit une teinte différente selon l'ambiance :

```text
SUNRISE
rose pâle / crème

DAY
cyan pâle / blanc cassé

SUNSET
pêche / rose

NIGHT
bleu argenté
```

Principe : **un seul système d'animation → plusieurs ambiances**.

La couleur des reflets doit être dérivée du ciel, de la position des astres et de l'état lumineux global, pas codée dans la texture de vague elle-même.

## 5. Nuages

Les formes de nuages restent stables comme langage graphique :

```text
CLOUD_SHAPE
```

Leur matière lumineuse varie avec l'heure :

```text
DAWN
rose crème

DAY
blanc cassé + bleu léger

SUNSET
pêche très clair

NIGHT
bleu lavande sombre
```

L'opacité peut également varier. La nuit, les nuages peuvent devenir beaucoup moins visibles.

Les nuages ne sont pas seulement décoratifs : ils peuvent moduler la lumière directe du soleil ou de la lune via une valeur d'occlusion douce.

## 6. Réaction au ciel et aux astres

Le système complet doit permettre :

```text
SKY GRADIENT
    ↓
SUN / MOON POSITION
    ↓
CLOUD COLOR + CLOUD OCCLUSION
    ↓
AMBIENT LIGHT
    ↓
SEA LIGHT GRADIENT
    ↓
REFLECTION COLOR / INTENSITY
    ↓
LANDMARK LIGHT RESPONSE
```

Le soleil et la lune parcourent le ciel en temps réel et ajoutent des variations de lueurs. Le ciel n'est donc pas uniquement une palette d'heure : sa lumière peut aussi dépendre de la position de l'astre et de la couverture nuageuse.

## 7. LAND_SHADOW_MASK

Le landmark dispose aussi d'un masque structurel d'ombre :

```text
LAND_SHADOW_MASK.png
```

Il identifie les zones qui restent structurellement moins exposées quel que soit le moment de la journée.

La géométrie du masque reste stable ; seule sa coloration varie :

```text
DAWN
lavande froid

DAY
bleu-violet doux

SUNSET
violet-mauve

NIGHT
bleu pétrole / violet profond
```

`LAND_SHADOW_MASK` ne doit pas être l'inverse exact de `LAND_LIGHT_MASK`. Une zone peu éclairée directement peut rester lisible grâce à l'ambient / sky light.

Les trois couches structurelles deviennent :

```text
LAND_BASE_NEUTRAL = matière / dessin
LAND_LIGHT_MASK   = potentiel de lumière
LAND_SHADOW_MASK  = potentiel d'ombre
```

## 8. Pipeline consolidé

```text
LAND_BASE_NEUTRAL
+
LAND_LIGHT_MASK × DIRECTIONAL_LIGHT_COLOR
+
LAND_SHADOW_MASK × SHADOW_COLOR
+
SKY_AMBIENT_COLOR
+
CLOUD_OCCLUSION
+
ATMOSPHERE
+
LOCAL_LIGHTS
=
LANDMARK_FINAL

SKY_GRADIENT
+
CLOUD_SHAPES
+
SUN / MOON
=
SKY_FINAL

SEA_BASE
+
SEA_LIGHT_GRADIENT
+
REFLECTION_MASK × SKY/ASTRE COLOR
+
SHORE_LINES
=
SEA_FINAL
```

## 9. Garde-fous

- Ne pas créer quatre ciels complets si un système de gradient interpolé suffit.
- Ne pas créer quatre mers complètes si les animations peuvent être recolorées dynamiquement.
- Ne pas figer les reflets dans la peinture de base.
- Ne pas recolorer tout le landmark brutalement lorsqu'un nuage passe.
- Les vagues influencent principalement la mer et ses reflets, pas les falaises.
- La nuit ne doit jamais être obtenue par simple filtre bleu sur l'état jour.
- Les masters restent les juges visuels aux moments-clés.

## 10. Intention finale

Le but n'est pas seulement d'économiser des assets. Le système doit faire sentir que **le même monde respire avec l'heure** : ciel, mer, nuages, astres et landmark appartiennent à une même ambiance lumineuse, tout en restant techniquement séparés et artistiquement contrôlables.
