# Contrôle après génération, et rangement

## Pour chaque image

- [ ] Même style que les références (peinture à plat, ombres douces, palette chaude) ; même angle que le camp.
- [ ] Aucun texte, aucun chiffre, aucun logo, aucune signature, aucune bordure.
- [ ] Fond retiré proprement (transparence), bords nets, pas de halo blanc : vérifier à 100 % et à la taille d’écran du brief.
- [ ] Taille et format du brief (WebP qualité 90 avec transparence pour les objets ; sans transparence pour les bannières).
- [ ] Les variantes (niveaux, états, poses) ont la même échelle et la même base au sol.
- [ ] Lisible à la petite taille indiquée (20, 44, 64 px…) : plisser les yeux.

## Rangement dans le projet

- Les objets et bâtiments du camp : `assets/scene/objets/` ; ils se déclarent dans `commun/athena-scene.json` (un élément par objet : image, largeur, pied, empreinte). Pour un bâtiment, les 4 niveaux vont dans `images` avec `niveaux` (largeur, x, y par niveau), comme la tente.
- Les compagnons : un dossier par personnage dans `assets/scene/`, avec un JSON comme `minotaure.json` (vues, morceaux, pivots) ; les réglages se font dans `atelier.html`.
- Les bannières, vignettes, sceau : `assets/doc/` ; l’écran les lit à la place du dessin par le code.
- Les icônes : vectorisées en SVG 24 × 24 dans `commun/athena-icones-figures.js` (Figures) et `commun/athena-icones.js` (Veillée), avec leur nom dans le kit.
- Puis : ouvrir `Prototype.dc.html` à l’écran concerné (les adresses sont dans Écrans), `Camp-scene.html` pour la scène, et lancer `python3 -I scripts/verifier-projet.py .` (0 erreur). Noter l’ajout dans `Archives/INDEX.md` si une image provisoire est remplacée (elle part aux Archives : rien n’est supprimé).

## Crédits

Les images générées sont des créations pour Athéna ; elles ne reprennent rien d’une autre application. Ne pas signer les images ; le crédit va dans la doc (Accueil › Crédits) si besoin.
