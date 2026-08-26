# Passation pour une nouvelle session Codex

## Fichier de référence

Toujours partir du `index.html` situé à la racine de ce dépôt. Ne jamais reprendre une copie trouvée dans `AppData\Local\Temp` sans comparer son empreinte et sa date.

## Méthode de travail attendue

1. Mesurer avant de modifier : dimensions réelles, positions de calques, transparence, empreintes de pixels et ordre de dessin.
2. Préserver les changements sans rapport avec la demande.
3. Faire des modifications localisées.
4. Tester visuellement au format téléphone.
5. Vérifier les deux modes jour/nuit et les transitions camp/accueil.
6. Vérifier les erreurs JavaScript et la sauvegarde locale.
7. Documenter les décisions importantes dans `docs/`.

## Points techniques sensibles

- La perspective et l’ordre des calques du Housing constituent une règle globale : ne pas ajouter de traitement particulier qui contourne ce système.
- Les GIF doivent conserver un point d’ancrage et une boîte de collision stables pendant toute leur animation.
- Les objets plats et les éléments verticaux d’un même asset peuvent subir des transformations différentes pendant la transition.
- Les sources lumineuses ne doivent pas être assombries par le filtre nocturne, mais leur environnement doit l’être.
- Les ressources graphiques exportées peuvent contenir du blanc résiduel à l’intérieur des formes : contrôler les trous, cordes et zones encloses, pas seulement le contour extérieur.
- Le projet contient des ressources anciennes qui ne sont plus actives. Utiliser `ressources-sources/` comme sélection de travail et consulter `docs/RESSOURCES.md` avant d’importer une archive.

## Validation minimale avant fusion

- ouverture de l’application ;
- absence d’erreur console ;
- accueil et quêtes du jour ;
- Journal ;
- Nid ;
- Housing ;
- quatre biomes ;
- jour/nuit ;
- transition accueil/camp ;
- rechargement d’une sauvegarde existante.
