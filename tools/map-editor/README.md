# Éditeur autonome de la map ATHENA

Cet outil est volontairement séparé du runtime de l’application. L’application
publique ne charge ni son JavaScript, ni ses styles, ni ses canevas de travail.

## Lancer

Depuis PowerShell :

```powershell
& .\tools\map-editor\launch-map-editor.ps1
```

L’éditeur s’ouvre dans le navigateur système sur `http://127.0.0.1:4188`.
Le serveur reconstruit la copie éditable depuis le `index.html` et les assets
courants à chaque chargement : il ne conserve pas une ancienne copie de l’app.

## Contrat non destructif

- **Valider** écrit un paquet dans `tools/map-editor/proposals/<id>/`.
- Cette action ne modifie aucun fichier actif de l’application.
- **Annuler** restaure la copie d’ouverture et supprime les changements du brouillon.
- Une proposition reste en attente jusqu’à ce que l’utilisateur demande à Codex
  de l’appliquer.
- Avant l’application d’une proposition, Codex doit créer une sauvegarde datée
  des fichiers et assets ciblés, appliquer les changements, puis vérifier le rendu.

Chaque paquet contient le commit source, l’empreinte SHA-256 du `index.html`,
l’état initial, le brouillon final et les éventuels PNG de retouche raster.
