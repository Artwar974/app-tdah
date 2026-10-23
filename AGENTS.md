# ATHENA — consignes pour les agents (Codex, Claude)

ATHENA (« Le Journal de Quêtes ») est une app d'habitudes en forme de jeu. Le monde est en Antiquité légère, pas trop grecque. Le camp est dessiné avec PixiJS v8 ; toute l'interface (menus, cartes, boutons, textes) reste en HTML par-dessus.

## Le dépôt et le prototype

- **Dépôt de référence : `Artwar974/app-tdah`**. Ce dépôt est la référence de travail et de publication demandée par l’utilisateur. `Baptiste974/app-tdah` est conservé comme ancienne source.
- `index.html` est la dernière base fonctionnelle de ce dépôt.
- `demo/`, quand il est là, est la V1 testable de la refonte : une copie du dossier publié de l'artefact, installable sur téléphone. Avant d'y toucher, lis `demo/LISEZ-MOI.md` et la section « Démo V1 » du `README.md` (serveur local, tests, vérificateur).
- La refonte UI/UX en cours vit dans l'artefact Claude Design « Athéna » : https://claude.ai/artifact/L4ZMGPiAahZyX653Z4Yq69.
  - La scène du camp a son propre artefact, « Camp en une scène » : https://claude.ai/artifact/MX5s4FcUygLC4ywivNnou5.
  - Les décisions récentes de la refonte passent avant les anciennes notes de `docs/`. En cas de doute, signale le conflit au lieu de trancher.
- Avant de modifier l'app, lis `README.md`, `CONTRIBUTING.md` et `docs/`, en particulier `docs/PASSATION_CODEX.md`.
- Travaille dans une branche dédiée, puis ouvre une Pull Request.

## Skills à utiliser

Avant de commencer une tâche, choisis la ou les skills qui s'appliquent et suis-les.

| Tâche | Skill |
|---|---|
| Nouvelle fonctionnalité, nouveau comportement, changement d'écran | Superpowers : `brainstorming`, puis `writing-plans` |
| Exécuter un plan | Superpowers : `executing-plans` (ou `subagent-driven-development`) |
| Bug, test qui échoue, comportement inattendu | Superpowers : `systematic-debugging` |
| Code de fonctionnalité ou correctif | Superpowers : `test-driven-development` |
| Avant de dire « c'est fait » | Superpowers : `verification-before-completion` |
| Tout code PixiJS : camp, marionnettes, particules, shaders, caméra, toucher | `pixijs-camp-athena`, plus les fiches `pixijs-*` qu'elle indique |
| Écrans de l'app : UX, accessibilité, états, formulaires, listes | `ui-ux-pro-max` |
| Revue visuelle d'un écran ; site, page store, kit presse | `design-taste-frontend` (taste-skill) |
| Réponses très courtes | `caveman`, seulement si on le demande |

## Où sont les skills

Toutes les skills sont dans le dépôt, dans `.agents/skills/<nom>/SKILL.md` :

- Superpowers : `brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `systematic-debugging`, `test-driven-development`, `verification-before-completion`, et les autres ;
- `pixijs-camp-athena` et les fiches officielles `pixijs` et `pixijs-*` ;
- `ui-ux-pro-max`, `design-taste-frontend` et `caveman`.

Il arrive qu'une skill du tableau n'apparaisse pas dans ta liste de skills ; c'est le cas en ce moment sur Codex cloud. Dans ce cas, lis directement `.agents/skills/<nom>/SKILL.md` avant de commencer, puis suis-le.

Pour les réinstaller ou les mettre à jour : `bash outils/installer-skills.sh`. `skills-lock.json` garde la source et l'empreinte de chaque skill.

## En cloud

- Par défaut, tu n'as ni internet ni navigateur.
- Les fiches PixiJS sont dans `.agents/skills/` : ne va pas les chercher sur GitHub.
- `design-taste-frontend` :
  - `lint.mjs` fonctionne ;
  - si `inspect.mjs` ne trouve pas Chrome, suis le cas « No Chrome or Node 22 » de son SKILL.md et écris dans le compte rendu que l'inspecteur n'a pas tourné ;
  - pas de recherche d'images avec `assets.mjs`.
- `ui-ux-pro-max` : ses scripts Python fonctionnent hors ligne.

## La direction artistique d'ATHENA passe avant les skills de design

- `ui-ux-pro-max` et `design-taste-frontend` donnent des règles génériques. Elles ne remplacent ni la palette, ni les polices, ni le style d'ATHENA.
- Avec `design-taste-frontend`, passe toujours `--keep palette,type`.
- Les écrans de jeu (camp, coffres, récompenses, passe de saison, célébrations) gardent leurs lueurs, leurs ombres sur les objets qui flottent, leurs particules et leurs badges. Sur ces écrans, `design-taste-frontend` sert seulement de relecteur : avant, critique, les trois changements qui comptent le plus.
- Les écrans simples (réglages, profil, listes) et les pages web suivent ces skills en entier, en gardant la DA.

## Règles du projet

1. **Pas de nouvelle image sans demande.** Les illustrations sont faites à part. Utilise celles qui existent, des formes dessinées par le code, des teintes ou des particules, ou laisse un emplacement clairement marqué.
2. **Aucune punition.** Pas de perte de série, pas de compteur qui retombe à zéro, pas de message qui culpabilise. Si le projet a une liste de mots interdits, respecte-la.
3. **Méthodes stimulantes et ludiques.** Une action, une réponse visible tout de suite.
4. **V1 sans tower defense.**
5. **Rien de Pixelio.** On l'a étudié ; on n'en reprend ni code, ni texte, ni image.
6. **PixiJS** : la version épinglée par le projet fait foi. Avant d'utiliser une API, vérifie qu'elle existe dans cette version. Objectif : 60 images/s sur un écran de 390 × 844, une image en moins de 10 ms en moyenne. Tout s'arrête quand l'onglet est caché.
7. **Mouvement réduit** : plus d'animation ni de mouvement de caméra, mais toutes les informations restent.
8. **Cibles tactiles d'au moins 44 px, texte d'au moins 13 px.**

## Pour finir une tâche

- Fais la validation minimale de `docs/PASSATION_CODEX.md` pour les écrans touchés ; la console doit être vide d'erreurs.
- Dans le compte rendu, dis ce qui a changé, ce qui a été vérifié et comment, et ce qui ne marche pas encore.
