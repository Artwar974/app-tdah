---
name: pixijs-camp-athena
description: Use for any PixiJS v8 work on the ATHENA camp (athena-scene.js, marionnette, Camp-scene, atelier, particles, shaders, camera, touch). Applies the official pixijs-skills and the project's version and animation rules.
---

# PixiJS pour le camp d'ATHENA

Le camp d'ATHENA (« Le Journal de Quêtes ») est dessiné avec PixiJS v8. Dans le prototype, il tient dans ces fichiers :

- `commun/athena-scene.js`
- `commun/athena-scene.json`
- `commun/athena-marionnette.js`
- `assets/scene/`

On le teste dans `Camp-scene.html`, `atelier.html` et `Prototype.dc.html`. Dans le dépôt de l'app, cherche leurs équivalents avant de commencer.

Cette skill s'appuie sur la collection officielle **pixijs-skills** (MIT, https://github.com/pixijs/pixijs-skills) et y ajoute les règles du projet.

## 1. Les fiches officielles

Les fiches sont dans le dépôt : `.agents/skills/pixijs/SKILL.md` et `.agents/skills/pixijs-*/`. Elles ont été installées avec `npx skills add pixijs/pixijs-skills --skill '*' -a codex --copy`. Lis-les là.

Seulement si elles manquent et que tu as accès à internet, lis-les sur GitHub :

- la fiche d'entrée : `https://raw.githubusercontent.com/pixijs/pixijs-skills/main/skills/pixijs/SKILL.md` ;
- puis celles de la tâche : `skills/<nom>/SKILL.md` ;
- les sous-fiches détaillées : `skills/<nom>/references/*.md`.

| Tâche dans le camp | Fiches |
|---|---|
| Fluidité, 60 images/s, mémoire, pause quand l'onglet est caché | `pixijs-performance`, `pixijs-ticker` |
| Lucioles, braises, copeaux, ressources qui volent, feuilles | `pixijs-scene-particle-container`, `pixijs-performance` |
| Eau, végétation, lumière, brume (shader maison à masques R/V/B) | `pixijs-custom-rendering`, `pixijs-filters`, `pixijs-blend-modes` |
| Caméra, profondeur, ordre d'affichage, calques | `pixijs-scene-core-concepts`, `pixijs-scene-container` |
| Toucher, glisser jusqu'au feu, appui long, toucher le sol | `pixijs-events`, `pixijs-math` |
| Sprites animés (feu, fanion, lanterne), planches | `pixijs-scene-sprite`, `pixijs-assets` |
| Vagues, cordes, ruban, déformations | `pixijs-scene-mesh` |
| Formes dessinées par le code (Comptoir, Forge, chantiers) | `pixijs-scene-graphics` |
| Lecteur d'écran, clavier | `pixijs-accessibility` |
| Chargement des images, fonds, préchargement | `pixijs-assets` |

Si aucune fiche ne couvre une classe ou une option, lis l'index de l'API : https://pixijs.download/release/docs/llms.txt.

## 2. La version

1. Lis la version de pixi.js que le projet charge vraiment (balise `<script>`, `package.json` ou `package-lock.json`). Le prototype a longtemps chargé 8.6.6. La passe du 20/10 le fait passer en 8.22.0.
2. Les fiches officielles suivent la dernière 8.x. Avant d'utiliser une API qu'elles citent, vérifie qu'elle existe dans la version du projet (`node_modules/pixi.js` ou journal des versions).
3. Si elle n'y est pas, utilise l'équivalent disponible, ou propose de monter la version. Dans les deux cas, reteste le camp, l'atelier et le Prototype, et dis-le dans le compte rendu.

## 3. Les règles du camp

1. **L'API de la scène ne change pas.**
   - Fonctions : `monter`, `emettre`, `on`, `definir`, `ajouter`, `deplacer`, `element`, `lumiere`, `reglages`, `detruire`.
   - Événements existants, à garder sous le même nom : `quete-validee`, `sommet`, `expedition-depart`, `expedition-retour`, `etincelle-recue`, `toucher`, `toucher-sol`, `bateau-au-large`, `bateau-accoste`, `butin-depose`, `compagnon-parti`, `jour`, `soir`, `nuit`.
   - On peut en ajouter.
2. **Pas de nouvelle image sans demande.** Utilise des formes dessinées par le code, des teintes, des particules, ou les images déjà dans `assets/scene/`.
3. **Le budget.**
   - Objectif : 60 images/s sur un écran de 390 × 844, une image en moins de 10 ms en moyenne.
   - Mesure avant et après chaque changement, avec `outils/fps-test.html` ou le compteur de `Camp-scene.html`.
   - Tout s'arrête quand l'onglet est caché. Résolution plafonnée à 2.
4. **Mouvement réduit** : aucune animation ni mouvement de caméra, mais toutes les informations restent.
5. **Les personnages** sont des marionnettes maison (`athena-marionnette.js`, pas de Spine). Leur animation se règle dans le JSON du personnage et se vérifie dans `atelier.html`.
6. **Chaque nouvelle animation, chaque nouvel état ou événement** a son bouton dans `Camp-scene.html` ou `atelier.html`.
7. **Le monde est en PixiJS, l'interface en HTML.** Pas de menus, de cartes ni de textes d'interface dans le canvas.
