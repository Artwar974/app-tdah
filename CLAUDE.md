# ATHENA — consignes pour Claude

Les règles communes à tous les agents sont dans `AGENTS.md` : dépôt, prototype, skills, direction artistique, règles du projet. Lis-les et suis-les.

@AGENTS.md

## Dans une session Claude (claude.ai ou Claude Code)

### Les skills

Sur le compte de Baptiste, les skills sont déjà installées. Appelle-les sous ces noms avec l'outil Skill, avant de commencer la tâche :

| Tâche | Skill |
|---|---|
| Nouvelle fonctionnalité, nouveau comportement, changement d'écran | `superpowers:brainstorming`, puis `superpowers:writing-plans` |
| Exécuter un plan | `superpowers:executing-plans` ou `superpowers:subagent-driven-development` |
| Bug, comportement inattendu | `superpowers:systematic-debugging` |
| Code de fonctionnalité ou correctif | `superpowers:test-driven-development` |
| Avant de dire « c'est fait » | `superpowers:verification-before-completion` |
| Tout code PixiJS du camp | `anthropic-skills:pixijs-camp-athena` |
| Écrans de l'app : UX, accessibilité, états | `anthropic-skills:ui-ux-pro-max` |
| Revue visuelle d'un écran, pages web | `anthropic-skills:taste-skill` |
| Réponses très courtes, sur demande | `anthropic-skills:caveman` |

Si l'une d'elles n'est pas disponible (autre compte, Claude Code sur un ordinateur), lis la copie du dépôt : `.agents/skills/<nom>/SKILL.md`. Exception : pour taste-skill, la copie s'appelle `design-taste-frontend`.

### L'artefact Athéna

- Lis les artefacts avec l'outil Artifact (action `read`), jamais avec WebFetch.
  - « Athéna » : https://claude.ai/artifact/L4ZMGPiAahZyX653Z4Yq69
  - « Camp en une scène » : https://claude.ai/artifact/MX5s4FcUygLC4ywivNnou5
- D'habitude, l'artefact Athéna change par un prompt pour Claude Design :
  - le format : objectif, règles, étapes, choix, contrôle, compte rendu ;
  - les prompts sont rangés dans le Projet claude.ai « TDAH APP », sous `claude/…`.
- Ne republie pas l'artefact toi-même sans que Baptiste le demande.
- Pour auditer l'artefact : copie-le en local, sers-le en HTTP et vérifie-le au format 390 × 844.
  - Sessions cloud : Chromium est dans `/opt/pw-browsers/chromium` (Playwright).
  - Regarde les captures, et pas seulement la console.
