# Rangement du projet (14/10)

Relevé fait sur le dossier du projet au 14/10. **Règle : rien ne se supprime.** Ce qui sort va dans `Archives/2026-10-14-rangement/`, avec une ligne par élément dans `Archives/INDEX.md` (ce que c’est, d’où ça vient, pourquoi c’est sorti). Avant chaque déplacement, cherche le nom dans toutes les pages, `athena-v1.js`, `athena-v1-rapport.js` et `commun/`. Si quelque chose le lit encore, garde-le et note-le.

## 1. Ce qui reste à la racine (cible)

| Élément | Rôle |
|---|---|
| Accueil.dc.html | Le portail. En haut : « À décider après la mise à jour du 14/10 ». |
| Prototype.dc.html | L’app jouable et son configurateur. |
| Ecrans.dc.html | Les écrans par parcours. |
| Mecaniques.dc.html | Les mécaniques, rangées par rythme : la quête, la journée, la saison. |
| DA.dc.html | Les deux directions artistiques. |
| Decisions.dc.html | En tête : les choix à faire ; puis le décidé, le remplacé, la sauvegarde. |
| Tower defense.dc.html | Les Incursions (hors V1). Nom de fichier inchangé : il sert de lien avec le dépôt. |
| athena-v1.js, athena-v1-rapport.js, support.js, github.md, LISEZ-MOI.md | Inchangés dans leur rôle. |
| commun/, assets/, outils/, scripts/, tower-defense/, Archives/ | Inchangés dans leur rôle. |
| passes/ | Les dossiers de chaque passe : `passes/passe-08-10/` (déplacé) et `passes/passe-14-10/`. |
| uploads/ | À garder seulement si une page ou athena-v1.js le lit encore ; sinon, les images vont dans `assets/sources/`. |

## 2. Ce qui sort vers les Archives (relevé : plus aucune page ne le lit)

| Élément | Pourquoi |
|---|---|
| Décider.dc.html, Explorer.dc.html, Fondations.dc.html, La V1.dc.html | Les anciennes entrées du hub (avant le 08/10). Aucun lien depuis les pages de la V1. |
| Coulisses/ (tout le dossier) | Les anciennes pages de travail. Une copie existe déjà dans `Archives/Coulisses/`. Compare les deux avant de déplacer, et garde la plus récente. `Coulisses/fondations/Économie.dc.html` est remplacée par `outils/economie-test.html`. |
| _gen/, _shots/, _motion/ (à la racine) | Des fichiers de travail. Le journal des changements dit déjà « _motion rangé dans Archives » : la copie restée à la racine est un doublon. |
| passe-08-10/ | Ne va pas aux Archives : il passe dans `passes/passe-08-10/`. Mets à jour ses mentions dans athena-v1.js et LISEZ-MOI.md. |

## 3. À l’intérieur des pages

- **Accueil.**
  - Un bloc « À décider après la mise à jour du 14/10 », en premier, avant tout le reste : les 9 choix de `03-CHOIX-A-FAIRE.md` en cartes (question, recommandation, un chiffre, « Essayer », « Voir dans Décisions »).
  - Puis l’état de la V1 en trois rythmes : la quête, la journée, la saison.
  - Puis « Dessins à commander ».
  - Puis les liens vers les pages.
  - Rien d’autre au-dessus de la ligne de flottaison sur un écran de 1280 × 800.
- **Décisions.**
  - En tête, une section « Choix à faire », avec les mêmes 9 fiches, plus détaillées (options côte à côte, chiffres de la simulation).
  - Ensuite, les décisions par thème. Les décisions remplacées sont repliées dans un groupe « Remplacées » fermé par défaut.
- **Mécaniques.**
  - Trois groupes : « À chaque quête », « Chaque jour », « Chaque saison et sur le long terme ».
  - Un encadré « Le barème » avec un lien vers le simulateur.
  - Les anciennes fiches remplacées (XP en barre, or seul, tente par niveaux, lumières par quête, bonus de journée, calendrier des 30 journées, surprises avec gain) sont repliées dans « Remplacées le 14/10 », pas supprimées.
- **Écrans.** Les nouveaux parcours sont rangés après « Le camp » :
  - Mont et Grand Sentier ;
  - Coffre et sac ;
  - Bâtiments ;
  - Expéditions ;
  - Forge ;
  - Hameau.

  Chaque écran s’ouvre dans le prototype.
- **Prototype, configurateur.**
  - Un groupe « Choix à faire (14/10) » en haut, avec un réglage par choix qui en a un : Joker, Grand Sentier, Coffre, Accueil.
  - Puis les réglages habituels.
- **La barre du hub** ne montre que les pages de l’espace V1 : Accueil, Prototype, Écrans, Mécaniques, DA, Décisions. Un seul lien discret mène aux Incursions.
- **LISEZ-MOI.md** : le plan à jour, avec les nouveaux fichiers et `passes/`.
