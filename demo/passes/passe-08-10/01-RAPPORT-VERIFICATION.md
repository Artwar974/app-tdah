# Rapport de vérification · projet Athéna · 8 octobre 2026

Fait sur le projet du zip « Wireframes_application_mobile_7 » (état du 8 octobre, après la passe lumière du camp).

## Ce qui a été testé
| Contrôle | Résultat |
|---|---|
| Syntaxe des 14 scripts (athena-v1.js, commun/, tower-defense/) | Aucune erreur |
| Ouverture des 8 pages du projet | Les 8 s'ouvrent ; aucun gabarit `{{ }}` visible (une page pose un problème, voir bug 1) |
| Ouverture des 55 écrans du prototype, un par un | 55 sur 55 sans erreur d'exécution, aucun écran vide |
| Boutons plus petits que 44 px dans ces 55 écrans | Aucun détecté |
| Ressources déclarées (`ext-resource-dependency`) | Toutes présentes, aucun identifiant en double |
| Liens entre pages | Aucun lien cassé |
| Valider une quête avec « C'est fait » | Les XP montent (0 → 5) ; le feu garde sa taille |
| Les 4 pages de test (décor, feu, objets vivants, camp) | S'ouvrent sans erreur, y compris une fois déplacées dans `outils/` |

Limite : le glisser jusqu'au feu n'a pas pu être rejoué par un script de façon fiable dans mon navigateur de test. Il reste à essayer à la main sur un vrai téléphone.

## Bugs et incohérences trouvés
| N° | Gravité | Où | Problème | Correctif |
|---|---|---|---|---|
| 1 | **Haute** | Page Tower defense | Une erreur rouge s'affiche à l'ouverture environ une fois sur deux (3 échecs sur 6 essais). Cause : la page exécute chaque script deux fois, et la seconde exécution de `athena-v1.js` efface les données ajoutées entre-temps par le tower defense. | Deux lignes en tête de `athena-v1.js` (ci-dessous). Avec le correctif : 14 ouvertures sur 14 sans erreur. |
| 2 | Moyenne | `tower-defense/incursions-contenu.js` (lignes 10, 15, 35, 37, 38, 97, 108) et `Mecaniques.dc.html` (ligne 109) | Des textes disent encore que les quêtes « font grandir le feu », parlent du « stade du feu » ou que « le feu grandit à l'approche », alors que cette mécanique est retirée depuis le 8 octobre. Les Incursions s'appuient sur ce « stade du feu ». | Décision « incursions-base » : on remplace par l'étape de la tente. Réécrire ces textes. |
| 3 | Moyenne | `Prototype`, `Ecrans`, `DA` | Les polices Alegreya et GFS Neohellenic sont chargées depuis Google (liens + un `fetch` dans DA, ligne 196). Le projet dit ses polices auto-hébergées. | Décision « polices-v1 » : on retire ces deux polices de la V1 et leurs liens. |
| 4 | Moyenne | Navigation | La page Tower defense affiche la barre « Athéna · V1 » et aucune page ne mène vers elle. V1 et option sont mélangées. | Barre à deux espaces (fichier `commun/hub-v1.js` fourni, testé). |
| 5 | Faible | `Decisions.dc.html` | Charge `athena-icones.js?v=22` alors que les autres pages chargent `v=25`. | Passer à `v=25`. |
| 6 | Faible | `athena-v1-rapport.js` (ligne 51) | Le modèle de sauvegarde décrit le compteur `feu` comme « l'étape du feu ». | Le renommer « quêtes validées depuis le début ». |
| 7 | Faible | Racine du projet | `uploads/` (31 Mo, 57 fichiers dont des doublons avec suffixe) et `screenshots/` (8 Mo) ne sont lus par aucune page. Ils alourdissent l'export. | Les ranger dans `Archives/` (plan dans la structure cible). |
| 8 | Faible | Toutes les pages | Dans la console, des avertissements « Expected length, "{{ … }}" » viennent du lecteur SVG qui voit les gabarits avant leur remplacement. Sans effet visible. | Aucun. À savoir pour ne pas les prendre pour des erreurs. |
| 9 | Info | `Accueil`, `Mecaniques`, `DA`, `Decisions`, `Tower defense` | Seules `Ecrans` et `Prototype` déclarent leurs scripts dans les `ext-resource-dependency`. | À vérifier à la prochaine publication ; rien ne casse dans le projet. |

### Correctif du bug 1 (à mettre en tête de `athena-v1.js`)
Dans `athena-v1.js`, juste après la ligne `(function (W) {`, ajouter :
```js
/* La page peut exécuter ce fichier deux fois : la seconde fois, on garde l'objet existant (les modules, comme les Incursions, y ajoutent leurs données) */
if (W.ATHENA_V1 && W.ATHENA_V1.version) return;
```
Le fichier `commun/hub-v1.js` fourni ici est déjà prêt à copier (barre à deux espaces).

## Mesures de la mise en page (largeur 1280 px)
| Page | Hauteur | Sections principales |
|---|---|---|
| Accueil | 5 125 px | Où on en est, Guide, Journal des changements (le journal seul commence à 2 267 px) |
| Prototype | 3 720 px | Téléphone + panneau de réglages |
| Écrans | 10 192 px | 55 écrans en 11 parcours |
| DA | 1 418 px | Deux DA |
| Mécaniques | 3 778 px | 23 mécaniques |
| Décisions & intégration | 7 457 px | À définir ensemble, Autres points ouverts, Tableau (53 blocs repliés) |
| Tower defense | 1 937 px | 4 étapes |
