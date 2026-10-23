#!/usr/bin/env bash
# À lancer depuis la racine du dépôt : bash outils/installer-skills.sh (réinstalle ou met à jour les skills).
# Ensuite : committer .agents/ et skills-lock.json dans une branche, puis ouvrir une Pull Request (voir CONTRIBUTING.md).
set -e
npx -y skills add obra/superpowers --skill '*' -a codex --copy -y
npx -y skills add pixijs/pixijs-skills --skill '*' -a codex --copy -y
npx -y skills add nextlevelbuilder/ui-ux-pro-max-skill --skill ui-ux-pro-max -a codex --copy -y
npx -y skills add https://github.com/Leonxlnx/taste-skill --skill design-taste-frontend -a codex --copy -y
npx -y skills add JuliusBrussee/caveman --skill caveman -a codex --copy -y
echo "OK : $(ls .agents/skills | wc -l) skills dans .agents/skills"
