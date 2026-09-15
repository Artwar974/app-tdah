# Références assets Housing — Camp grec

Ce fichier relie les sources graphiques grecques à la norme officielle de création d'assets Housing.

## Source de vérité

Lire d'abord :

- `docs/ASSET_STANDARD_CAMP_GREC_V1.md`

Cette norme verrouille la caméra, la perspective, l'orientation, l'ancrage au sol, la logique de masks et la compatibilité avec le système temporel.

## Références visuelles du biome grec

Sources de contexte à consulter :

- `MODELE_grec.png` : composition / ambiance générale du biome ;
- `SET_CAMP_GREC.png` : vocabulaire du camp et rapports d'échelle ;
- `SET1.png` : éléments complémentaires du set ;
- `2nd_plan_grec.png`, `fond_grec.png`, `ciel_grec.png`, `mer_grec.png` : contexte d'intégration environnementale ;
- les assets actifs réellement utilisés par l'application restent à vérifier dans le code avant remplacement ou production de variantes.

## Important : hiérarchie des références

Les images existantes servent de contexte artistique, mais elles ont été produites à différentes étapes du prototype.

Elles ne doivent pas être utilisées pour réintroduire une perspective incohérente.

Pour tout nouvel asset plaçable :

1. `docs/ASSET_STANDARD_CAMP_GREC_V1.md` fixe la perspective et la caméra ;
2. le camp grec actif fixe la cohérence d'échelle et de palette ;
3. les anciennes images servent de vocabulaire visuel secondaire.

Le dossier `ressources-sources/prototype-housing/` documente surtout l'historique du Housing. Ses anciens assets ne sont pas automatiquement conformes à la norme Camp grec V1.

## Kit de référence recommandé pour une génération

Lors d'une génération ou correction IA, fournir idéalement :

- une vue complète récente du camp ;
- une structure volumétrique déjà cohérente avec le camp (tente ou kiosque) ;
- un asset horizontal / au sol cohérent (potager ou équivalent) ;
- la norme `docs/ASSET_STANDARD_CAMP_GREC_V1.md`.

Instruction obligatoire :

> Ne déduis pas une nouvelle perspective à partir de l'objet demandé. Recopie la caméra, la projection, les axes de sol et l'orientation des références du camp grec. L'objet s'adapte à la caméra, jamais l'inverse.

## Production des masks

Pour un asset destiné au pipeline temporel, conserver strictement le même cadrage entre :

- `ASSET_BASE.png` ;
- `ASSET_LIGHT_MASK.png` ;
- `ASSET_SHADOW_MASK.png` ;
- `ASSET_EMISSIVE.png` si nécessaire ;
- `ASSET_OCCLUSION_MASK.png` si nécessaire.

Les règles exactes sont définies dans le standard officiel.
