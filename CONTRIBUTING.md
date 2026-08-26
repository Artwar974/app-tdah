# Travailler à deux sans écraser le projet

## Avant de commencer

1. Ouvrir GitHub Desktop.
2. Cliquer sur **Fetch origin**, puis sur **Pull origin** si proposé.
3. Créer une branche portant le nom de la modification, par exemple `housing-nouveaux-objets`.
4. Ne modifier que les fichiers nécessaires.

## Avant d’envoyer une modification

1. Tester `index.html` sur un écran de téléphone.
2. Vérifier les erreurs dans la console du navigateur.
3. Tester les quatre biomes, les transitions camp/accueil et les modes jour/nuit.
4. Tester l’ouverture du Journal, du Nid et du Housing.
5. Vérifier qu’une sauvegarde existante se recharge encore.
6. Faire un commit avec un message précis.
7. Publier la branche et créer une Pull Request.

## Règles de sécurité

- Ne jamais travailler directement dans un dossier `AppData\Local\Temp`.
- Ne jamais supprimer les modifications de l’autre personne avec `git reset --hard`.
- Ne jamais ajouter de mot de passe, clé API ou donnée personnelle au dépôt.
- Les dossiers d’archives lourdes restent hors du dépôt principal.
- `index.html` est la référence exécutable : toute modification doit y être synchronisée et testée.

## Convention de commits

- `feat:` nouvelle fonctionnalité.
- `fix:` correction de bug.
- `assets:` ajout ou remplacement de ressources.
- `docs:` documentation seulement.
- `refactor:` nettoyage sans changement de comportement.
