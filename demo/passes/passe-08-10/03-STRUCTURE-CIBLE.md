# Structure cible · V1 d'un côté, Incursions de l'autre

## Le principe
Deux espaces. **V1** : ce qu'on livre à la Toussaint. **Incursions** : le tower defense, une option désactivée, hors V1, à définir ensemble. Chaque espace a sa barre, sa couleur et ses pages. On passe de l'un à l'autre par un seul lien discret.

| | V1 | Incursions |
|---|---|---|
| Barre | brun foncé, « Athéna · V1 » | bleu nuit, « Athéna · Incursions » |
| Pages | Accueil, Prototype, Écrans, DA, Mécaniques, Décisions & intégration | Tower defense (qui devient « Incursions ») |
| Données | `athena-v1.js`, `athena-v1-rapport.js` | `tower-defense/incursions-contenu.js` et `incursions-moteur.js` |
| Lien vers l'autre | « Incursions · option » à droite de la barre | « ← Retour à la V1 » |
| Mention dans les pages | Une seule carte « Option hors V1 » sur l'Accueil | Un bandeau « Hors V1 Toussaint · désactivé par défaut » en tête |

## L'arborescence
```
/ (racine : 7 pages, 3 scripts, 5 dossiers)
├─ Accueil.dc.html           V1 · le portail
├─ Prototype.dc.html         V1
├─ Ecrans.dc.html            V1
├─ DA.dc.html                V1
├─ Mecaniques.dc.html        V1
├─ Decisions.dc.html         V1
├─ Tower defense.dc.html     Incursions (garde son nom de fichier pour l'instant)
├─ athena-v1.js              contenu de la V1 (source unique)
├─ athena-v1-rapport.js      suite d'athena-v1.js, lue par Décisions
├─ support.js                outil du projet : ne pas toucher
├─ github.md                 note de synchronisation : ne pas déplacer
├─ commun/                   ce que partagent les deux espaces
├─ tower-defense/            tout ce qui est propre aux Incursions
├─ assets/                   images, décor, objets, kits d'icônes
├─ outils/                   pages de test (décor, feu, objets vivants, camp)
└─ Archives/                 tout ce qui n'est plus lu par une page
```

## Ce qui bouge (et rien d'autre)
| De | Vers | Pourquoi | Risque |
|---|---|---|---|
| `decor-test.html`, `objets-test.html`, `objets-vivants-test.html`, `camp-qualite-test.html` | `outils/` (versions fournies, avec `<base href="../">`) | Quatre pages de test qui encombrent la racine | Aucun : testées depuis `outils/`, 0 erreur |
| `Fontaine animee - comparaison.dc.html` | `Archives/` | Décision « fontaine-atlas » : on garde le dessin de l'atlas | Aucun : aucune page ne la cite |
| `uploads/` (33 Mo, 59 fichiers) | `Archives/uploads-2026-10/` | Aucune page ne les lit. Garder à part les deux planches sources citées en commentaire dans `athena-v1.js` : `pasted-1790992146608-0.png` (objets) et `pasted-1791036966363-0.png` (tentes) → `assets/sources/` | Les deux chemins cités en commentaire sont à mettre à jour |
| `screenshots/` (9 Mo, 83 fichiers) | `Archives/captures-2026-10/` | Aucune page ne les lit | Aucun |

À ne pas déplacer : `support.js`, `github.md`, `commun/`, `assets/` (le moteur du projet et la synchronisation avec le dépôt en dépendent).

Les pages `.dc.html` peuvent être **fusionnées ou retirées** si elles font doublon, mais jamais sans suite : leur contenu utile passe dans une autre page, ou la page entière va dans `Archives/`. Voir « Rangement complet » plus bas.

À vérifier avant d'archiver (non cités par les pages, mais peut-être chargés par le code) : `assets/tuto/`, `assets/revision/`, `assets/geometry_locked/*.png`. Lancer `scripts/verifier-projet.py` avant et après chaque déplacement.

## Règles de mise en page des pages V1
L'objectif : qu'on comprenne chaque page en dix secondes, sans rien supprimer. Ce qui est secondaire se replie.
1. Une idée par bloc, un titre par bloc, trois niveaux de titres au plus.
2. Le bloc le plus utile est en haut : l'état, puis ce qu'il faut faire maintenant.
3. Le détail se replie (`details`, fermé), il ne disparaît pas. Les blocs repliés affichent une phrase de résumé.
4. Un seul bouton principal par zone ; les autres boutons sont discrets.
5. Les listes de plus de 7 éléments sont groupées ou repliées.
6. Largeur de lecture : 760 px au plus pour les textes.

Cibles de hauteur à 1 280 px de large (avec les blocs repliés) :
| Page | Avant | Cible |
|---|---|---|
| Accueil | 5 125 px | 2 800 px |
| Décisions & intégration | 7 457 px | 4 500 px |
| Écrans | 10 192 px | 5 000 px (parcours repliés sauf le premier) |
| Mécaniques | 3 778 px | 3 200 px |
| Prototype, DA | 3 720 / 1 418 px | inchangées |

## L'Accueil de la V1
De haut en bas :
1. **Titre et état** : « Athéna · V1 », en une phrase, plus les quatre nombres (écrans, mécaniques, décisions, modifications).
2. **Ce qui est dans la V1** : le périmètre en une phrase par bloc (voir la décision « perimetre-v1 »).
3. **À faire maintenant** : les décisions « à confirmer avec l'associé », avec un lien chacune.
4. **Aller à** : les cinq autres pages V1 en cartes ; puis, séparée par un filet et plus discrète, la carte « Option hors V1 : les Incursions (tower defense) ».
5. **Guide** (replié) et **Journal des changements** (replié, trois dernières lignes visibles).

## La page Incursions
- Barre bleu nuit, bandeau « Hors V1 Toussaint · désactivé par défaut · à définir ensemble ».
- Ses quatre étapes restent (Comprendre, Voir, Tester, Décider).
- Les textes ne parlent plus du « stade du feu » : ils parlent de l'**étape de la tente** (décision « incursions-base »).
- Le prototype jouable de la page (téléphone) garde son propre état, sans toucher aux sauvegardes de la V1.

## Contrôle de la structure
`python3 -I scripts/verifier-projet.py <dossier du projet>` doit afficher 0 erreur. Les alertes restantes doivent être expliquées une par une.

## Rangement complet (demandé le 08/10)
Le but : qu'une personne qui ouvre le dossier pour la première fois sache en une minute ce qui sert, ce qui est un test, ce qui est ancien. On trie, on nomme clairement, on perd le moins possible.

**Méthode**
1. **Inventaire** : tous les fichiers et dossiers, avec taille, et ce qui les lit (une page, un script, rien). Classer chaque élément : *vivant* (lu par une page), *outil* (page de test, script), *source* (planche, original), *archive* (plus lu), *doublon*.
2. **Plan** : un tableau « élément · classe · décision (garder, fusionner, archiver) · où va son contenu · risque ». Il est montré avant toute fusion ou retrait de page.
3. **Exécution** : les déplacements vers `Archives/` de ce qui n'est lu par rien se font tout de suite ; les fusions et retraits de pages attendent le feu vert.
4. **Traces** : `Archives/INDEX.md` (ce qui a été rangé, d'où, pourquoi, comment le remettre) ; `LISEZ-MOI.md` à la racine (plan du projet : chaque dossier et chaque page en une phrase) ; la section « Rangé le 08/10 » du journal des changements.

**Règles**
- Rien n'est supprimé : tout ce qui sort va dans `Archives/`, avec son chemin d'origine noté dans l'index.
- Une page n'est retirée que si son contenu utile est ailleurs (ou si c'est un doublon exact) ; la barre, l'Accueil et tous les liens sont mis à jour, 0 lien cassé.
- Noms de fichiers : clairs, sans changer ceux qui servent de lien entre pages et avec le dépôt (un renommage = tous les liens mis à jour et vérifiés).
- Dans `Archives/`, regrouper par date et par sujet, pas en vrac.

**Candidats à examiner** (à décider avec le plan, pas à faire d'office) : pages qui se recoupent (Mécaniques et Décisions sur les mêmes sujets ; Écrans et Prototype), la page de la fontaine, les pages de test, `Archives/` elle-même (sous-dossiers qui s'empilent), `assets/` (dossiers jamais lus), doublons d'images.
