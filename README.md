# APP TDAH — Journal de Quêtes

Prototype d’application mobile qui transforme les tâches de la vie réelle en quêtes dans un univers de collection, d’évolution et de housing inspiré des mythologies.

## Lancer l’application

- Ouvrir `index.html` dans un navigateur moderne.
- Pour tester sur un téléphone connecté au même réseau, lancer `outils/serveur-local.ps1`, puis ouvrir l’adresse affichée par le script.
- Les données de jeu sont enregistrées dans le `localStorage` du navigateur. Deux appareils ne partagent donc pas automatiquement la même sauvegarde.

## Fichier principal

`index.html` est actuellement une application monofichier : HTML, CSS, JavaScript et ressources nécessaires à l’exécution sont intégrés dans ce fichier. Les dossiers `ressources-sources/` servent à conserver les originaux pour les futures modifications graphiques et sonores.

## Organisation

- `index.html` : dernière version fonctionnelle de l’application.
- `docs/` : contexte produit, décisions, état technique et passation.
- `prompts/` : prompts de design conservés.
- `ressources-sources/` : ressources actives et sources utiles, sans les anciennes sauvegardes dupliquées.
- `outils/` : scripts de traitement et serveur local.

## Règle de collaboration

Avant de modifier l’application, créer une branche dédiée. Ne jamais remplacer `index.html` sans vérifier visuellement les quatre biomes, les modes jour/nuit, le Journal, le Nid et le Housing. Voir `CONTRIBUTING.md`.

## État du prototype

La base actuelle comprend notamment :

- le Journal de quêtes et les quêtes visibles depuis l’accueil ;
- une collection de créatures mythiques ;
- le Nid et la gestion des affectations ;
- un système de housing avec perspective, profondeur, collisions et objets spéciaux du camp ;
- quatre directions de biomes : Médiéval, Nordique, Grèce antique et Japon féodal ;
- des cycles jour/nuit, ambiances, animations de décor et effets lumineux.

Le produit reste un prototype en évolution. Les principes validés et les chantiers sont détaillés dans `docs/CONTEXTE_PROJET.md` et `docs/ETAT_ACTUEL.md`.
