# Audit du paysage — 24 octobre 2026

Corrections réalisées sur la baie mod1, sans modifier son image source ni le cadrage validé :

- Masque marin délimité par le rivage, avec exclusion explicite du ponton : les ombres bleues des falaises ne sont plus prises pour de l’eau.
- Vent limité aux zones de végétation ; le sable et la pierre restent fixes.
- Calque aquatique masqué pour les poissons, éclaboussures, cercles et sillages. Les sauts vérifient leur trajectoire dans l’eau.
- Oiseaux en orbite replacés derrière le mont pendant la moitié éloignée de leur parcours.
- Éclairage du feu calculé depuis le nouveau terrain, sans faire réapparaître l’ancien fond.
- Teintes de l’eau et du terrain adaptées séparément aux quatre ambiances et synchronisées au chargement des textures. Écume atténuée dans la baie.
- Chemin navigable prolongé sur le nouveau ponton, sortie déplacée et panneau décalé pour libérer l’embarquement.
- Scintillement des lueurs désactivé avec la réduction des mouvements.

Validation : test/paysage_audit.js vérifie les points sensibles des masques, capture lever/jour/coucher/nuit, effectue un départ et un retour complets, contrôle le mouvement réduit et l’absence d’erreur JavaScript. test/barre_compacte.js contrôle trois formats mobiles et trois états de quêtes. Captures locales dans test/logs/paysage-audit. Le vérificateur du projet rapporte zéro erreur et zéro alerte. Ces contrôles navigateur ne remplacent pas un essai de performances sur téléphone physique.

## Étoiles — 25 octobre 2026

Le shader faisait varier toutes les étoiles et utilisait pour leur fréquence et phase le même hasard, déjà limité à 0,985–1 par la sélection des étoiles : leurs rythmes étaient presque identiques. Désormais 92 % restent fixes ; 8 % ont une variation douce (64–100 %), une période indépendante de 4,5 à 12 secondes et une phase indépendante. La luminosité fixe est renforcée et le rayon passe de 1,4 à 1,65 pixel de scène. La lumière globale du ciel et le passage des nuages restent naturels.

`test/etoiles_fixes.js` compare les contributions réelles du shader sur huit instants : avant correction, 63 étoiles sur 63 variaient ; après, 62 fixes et 5 variables sur 67 détectées dans la zone de contrôle. Vérification visuelle soir/nuit dans le Prototype, console sans erreur et mouvement réduit figé. Le moteur est chargé en version 19 et le précache est régénéré.
