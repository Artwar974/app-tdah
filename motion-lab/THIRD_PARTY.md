# Third-party sources — Athena Motion Lab

Ce document liste les sources externes utilisées ou prévues pour le laboratoire. Les assets externes restent des matières premières : ils doivent être harmonisés avant intégration finale dans Athena.

## GSAP

- Source : https://gsap.com/
- Version épinglée dans le script : 3.15.0
- Dépôt : https://github.com/greensock/GSAP
- Licence : GreenSock Standard License — vérifier les termes avant distribution finale.
- Usage dans le lab : timeline, easing, transformations, SVG, MorphSVG, DrawSVG, MotionPath, Flip.

## Open Doodles

- Site : https://www.opendoodles.com/
- Auteur : Pablo Stanley
- Licence : CC0 / domaine public.
- Usage prévu : poses, gestes, silhouettes expressives, références de mouvement.
- Règle Athena : ne pas utiliser une scène complète telle quelle dans le produit final ; la transformer en asset Athena cohérent.

## Open Peeps

- Site : https://www.openpeeps.com/
- Auteur : Pablo Stanley
- Licence : CC0 / domaine public.
- Usage prévu : base de personnages modulaires, expressions, coiffures, postures.
- Règle Athena : créer progressivement notre propre `ATHENA CHARACTER SYSTEM` plutôt que dépendre à long terme des compositions d'origine.

## Highlights

- Site : https://www.highlights.design/
- Créateur : Outdraw Design
- Licence : CC0 / domaine public.
- Usage prévu : blobs, flèches, boucles, lignes, underlines, scribbles, sprinkles et autres gestes graphiques.
- Règle Athena : utiliser ces éléments comme vocabulaire motion et non comme décoration gratuite.

## Politique d'intégration

Pour chaque asset externe retenu dans une capsule validée :

1. garder sa provenance dans `assets/sources-manifest.json` ;
2. créer si nécessaire une version transformée dans `assets/athena/` ;
3. nommer les groupes animables explicitement ;
4. conserver l'original externe séparé de la version Athena ;
5. ne jamais modifier silencieusement un asset déjà utilisé par une capsule publiée ; créer une variante/version.
