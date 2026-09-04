# Migration des dépôts — 4 septembre 2026

## Décision

Le dépôt officiel et l’unique source de vérité du projet est désormais :

`https://github.com/Artwar974/app-tdah`

Le dépôt `Artwar974/journal-de-quetes` est conservé comme archive historique en lecture seule. Aucun fichier n’y a été supprimé pendant la migration.

## Vérification effectuée

- Les deux dépôts ont des historiques Git indépendants.
- `app-tdah/main` contient la version fonctionnelle la plus récente de l’application ATHENA.
- `journal-shell.js` et `journal-theme.css` sont identiques dans les deux dépôts au moment de l’audit.
- Le seul écart du chargeur actif est la correction de cache `water-pixels-only-v13`, présente dans `app-tdah` et absente de `journal-de-quetes`.
- Les 20 frames actives de `water-grade-v12` sont présentes dans `app-tdah` et absentes de `journal-de-quetes`.
- Les 80 fichiers présents uniquement dans `journal-de-quetes` sont d’anciens assets ou prototypes et ne sont référencés par aucun des trois fichiers d’exécution actifs (`index.html`, `journal-shell.js`, `journal-theme.css`).

## Règle de travail

Toutes les nouvelles branches, modifications, validations visuelles et publications doivent partir de `app-tdah/main` et revenir dans ce même dépôt. Le dépôt archivé ne doit pas être utilisé comme base de développement.
