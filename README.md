# APP TDAH — Journal de Quêtes

Dépôt de référence : [Artwar974/app-tdah](https://github.com/Artwar974/app-tdah).

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

## Démo V1 (`demo/`)

`demo/` est la démo testable de la V1 : le hub de pages `.dc.html` et le Prototype (scène PixiJS 8.22.0 avec l’interface en HTML par-dessus), copiés depuis le dossier publié de l’artefact. Le `index.html` de la racine reste l’application monofichier d’origine. `demo/Tower defense.dc.html` et `demo/tower-defense/` ne se modifient pas ; ce qui sort de `demo/` part dans `demo/Archives/`, avec une ligne dans `demo/Archives/INDEX.md`.

- Servir la démo : `python3 -m http.server 8766 --directory demo`, puis ouvrir `http://localhost:8766/` (la page d’entrée mène au Prototype). `bash test/_serveur.sh` fait la même chose en arrière-plan.
- Contrôler : `node test/<suite>.js` (par exemple `node test/socle.js`), avec Node 22 et Playwright installé globalement ; `npm install --prefix test` ajoute `jsqr` et `pngjs`. Les copies locales de React, Babel et PixiJS qui remplacent les CDN se lisent dans le dossier donné par `ATHENA_NPM` (`test/_commun.js`) ; quand un fichier y manque, la page charge le CDN.
- Vérifier le projet : `python3 -I demo/scripts/verifier-projet.py demo` doit afficher `0 erreur(s), 0 alerte(s)`.
- Publier : Cloudflare Workers sert `demo/` à chaque push sur `main` (`wrangler.jsonc`, `cloudflare/worker.js` : chaque fichier à son adresse exacte, comme GitHub Pages). Branché le 21/10 (compte Cloudflare de Baptiste, Worker `athena-v1`, accès GitHub limité à ce dépôt). Adresse : https://athena-v1.baptistebertil.workers.dev/ (chaque branche et chaque pull request ont aussi leur adresse d’essai, donnée par Cloudflare). Pour essayer avec le même moteur : `npx wrangler dev --port 8766` à la racine, puis les contrôles `node test/<suite>.js`. `.github/workflows/pages.yml` reste en réserve (à la main seulement).
- Conception : [`docs/superpowers/specs/2026-10-20-v1-testable-mobile-design.md`](docs/superpowers/specs/2026-10-20-v1-testable-mobile-design.md).

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

## Agents (Claude, Codex)

- `AGENTS.md` et `CLAUDE.md` : les consignes pour Codex et Claude (skills à utiliser, règles du projet, liens vers le prototype Athéna).
- `.agents/skills/` : les skills partagées par Codex et Claude ; `bash outils/installer-skills.sh` les réinstalle ou les met à jour.
