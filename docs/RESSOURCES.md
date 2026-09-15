# Organisation des ressources

## Ressources incluses dans le dépôt

- `ressources-sources/3.0/` : sources des biomes Grèce antique et Japon féodal.
- `ressources-sources/audio/` : sons et projets audio utilisés pendant le développement.
- `ressources-sources/water-animations/` : recherches et frames d’animation d’eau.
- `ressources-sources/catalogue/` : catalogue de ressources disponible.
- `ressources-sources/medieval-nordique/` : dernières sources utiles des anciens biomes Prairie et Banquise.
- `ressources-sources/assets-extraits/` : ressources déjà découpées provenant de la version 2.0.
- `ressources-sources/prototype-housing/` : prototype initial utile pour comprendre les règles historiques de placement. Ses anciens assets ne constituent pas une autorité artistique pour le camp grec actuel.
- `outils/grec-assets/` : scripts de découpe, nettoyage et injection employés pour le biome grec.

## Norme officielle des assets Housing — Camp grec

Toute création, extraction, correction ou intégration d’un asset plaçable dans le camp grec doit partir des trois documents suivants :

1. `docs/ASSET_STANDARD_CAMP_GREC_V1.md` — **source de vérité verrouillée** pour caméra, perspective, orientation, échelle relative, ancrage, footprint, base neutre et masks lumière/ombre/emissive ;
2. `ressources-sources/3.0/GREC/REFERENCES_ASSETS_HOUSING.md` — index des références visuelles et hiérarchie des sources du biome grec ;
3. `prompts/AGENT_DIRECTION_ARTISTIQUE_CAMP_GREC.md` — mandat et prompt canonique de l’agent de direction artistique.

La règle essentielle est : **l’objet s’adapte à la caméra du camp ; la caméra ne s’adapte jamais à l’objet.**

Les anciennes ressources grecques restent utiles comme vocabulaire visuel, mais une perspective historique incohérente ne doit pas être reproduite dans un nouvel asset. En cas de conflit, `docs/ASSET_STANDARD_CAMP_GREC_V1.md` est prioritaire.

## Archives volontairement non copiées

Le dossier original `C:\Users\berri\Desktop\APPLI` contient environ 1 Go, dont plus de 500 Mo de sauvegardes dupliquées et de nombreuses sources PSD anciennes. Ces archives restent sur l’ordinateur d’origine et ne doivent pas être importées intégralement dans le dépôt principal.

Principaux dossiers laissés hors Git :

- `SAUVEGARDES/` ;
- `CREA/` ;
- anciens biomes Récif, Forêt noire et Volcanyon non retenus dans la nouvelle direction ;
- profils temporaires de navigateur ;
- copies historiques déjà remplacées par Git.

Si une ancienne ressource doit être récupérée, la copier individuellement dans le bon dossier, indiquer sa provenance dans le commit et éviter d’ajouter une archive complète.
