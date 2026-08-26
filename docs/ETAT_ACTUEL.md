# État actuel du prototype

## Architecture

- Application HTML/CSS/JavaScript monofichier.
- Canvas nominal mobile avec adaptation à différentes hauteurs d’écran.
- Sauvegarde locale dans `localStorage`.
- Nombreuses ressources intégrées en base64 dans `index.html`.
- Aucun serveur ni compte utilisateur requis pour le prototype actuel.

## Journal

- quêtes quotidiennes et ponctuelles ;
- événements, horaires et rappels ;
- étapes cochables ;
- aperçu des gains ;
- validation depuis l’accueil ;
- disparition animée d’une quête accomplie et remontée visuelle des récompenses.

## Nid et créatures

- collection de créatures ;
- affectations par biome et activité ;
- filtre automatique selon le poste choisi ;
- optimisation automatique des affectations ;
- retrait d’une créature active par double interaction ;
- déplacement des créatures sur le terrain avec perspective, ombre et collisions.

## Camps et production

- base du système pêche → cuisine → exploration ;
- poissons crus et grillés conservés dans le coffre ;
- or ramassable depuis le coffre ;
- activités automatiques tant que les conditions sont réunies ;
- cuisinier et broche liés au feu de camp déplaçable.

## Housing

- placement, déplacement et inversion horizontale ;
- variation de taille avec la perspective ;
- tri des objets par Camp, Objets et Nature ;
- boutique et inventaire ;
- objets spéciaux non supprimables ;
- système de profondeur et collisions ;
- éclairage nocturne et halos liés aux sources lumineuses.

## Biomes actuellement utiles

- Médiéval/Prairie ;
- Nordique/Banquise ;
- Grèce antique, avec mer animée, Mont Olympe et bateau ;
- Japon féodal, avec arrière-plan animé et zone d’eau.

## Chantiers à poursuivre

- consolider la refonte des créatures mythiques et leur évolution ;
- équilibrer définitivement les activités AFK ;
- finaliser l’ergonomie du Housing ;
- ajouter les ressources des quatre univers ;
- renforcer l’accessibilité et les tests sur plusieurs téléphones ;
- préparer une version de démonstration stable pour les professionnels et les familles.
