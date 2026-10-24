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
