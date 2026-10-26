# Mer adaptée à la baie — 25/10/2026

## Sauvegarde et retour

La branche `backup/mer-avant-refonte-20261025` conserve intégralement la version précédente (`63a2e12`). Les assets d’origine et la planche des 83 images restent présents.
Dans `Camp-scene.html`, le bouton « Mer adaptée à la baie » permet de comparer avec l’ancienne animation d’écume. En code : `scene.reglages.merBaie = 0` (ancienne) ou `1` (nouvelle). Cette comparaison conserve le masque corrigé ; la branche de sauvegarde permet de restaurer la totalité de l’ancien rendu.

## Rendu

La texture technique 360 × 640 est calculée une fois au chargement, à partir des lignes de contact physiques `fond.baie.rivages`, distinctes de la silhouette visible. Rouge : distance signée au contact ; vert : angle de la normale ; bleu : plage ou roche. La distance utilise une métrique aplatie (axe vertical × 2,8). Ni les arbres ni le ponton ne sont traités comme une plage.

Le shader existant PixiJS 8.22.0 utilise cette carte pour courber les fronts près des côtes. La houle du large reste discrète ; le rivage reçoit un liseré fragmenté, animé par du bruit périodique. Quatre zones de remous accompagnent les pilotis. Une frange étroite du sable est assombrie au reflux. Le masque de rendu protège le tablier, les pilotis et les rochers ; les reflets gris-bleu de l’image de référence ne sont plus pris pour de la terre.

La nouvelle écume a une période de 48 secondes (cycles intermédiaires décalés). Les autres effets existants, réfraction, reflets des astres et cascade, restent continus. La couleur d’écume suit les quatre ambiances. Le mouvement réduit fige les effets ; la pause de l’onglet conserve le comportement existant. La carte GPU est détruite avec la scène.

Il s’agit d’une animation artistique guidée par la côte, pas d’une simulation hydrodynamique. Les points des pilotis et le contour devront être recalés si le décor change à nouveau.

## Vérifications

`node test/mer_baie.js` : extraction des pixels réellement rendus, mouvement de l’eau, continuité 0/48 s (tolérance 1/255), terre/ponton immobiles, distance eau/terre signée, bouton ancienne/nouvelle mer. Mesure comparative de soumission du rendu : informative, pas une garantie de cadence sur téléphone physique.

`node test/paysage_audit.js` : masques, quatre ambiances, départ et retour du bateau, mouvement réduit, console.
Les captures et mesures sont dans `test/logs/mer-baie/` et `test/logs/paysage-audit/` (non versionnées).

## Correction des raccords

Le contour visible a été étendu aux bandes d’eau près des arbres à gauche et des falaises à droite. Les reflets gris-bleu appartiennent à l’eau, tandis que les pilotis et le sable restent opaques. Les normales et distances ne sont plus tirées de la silhouette des arbres : seules les bases de roche et la plage provoquent le ressac. Une échelle de profondeur réduit les remous vers l’horizon. La houle du large suit une phase logarithmique monotone (sans inversion de direction) ; des séries espacées entraînent un front d’écume et une nappe sur le sable.

Le test contrôle neuf points dans les anciennes zones tronquées, les pixels de ressac sur le sable, et les phases 0, 3, 6, 12 et 24 secondes.

## Essai séparé du 26 octobre

`Mer-essai.html` active `fond.effets.merCalques=1` dans une scène indépendante, sans accès aux sauvegardes du jeu. Le prototype conserve la méthode précédente par défaut. Deux maillages supplémentaires sont testés : une surface marine continue (masque géométrique avec occlusions localisées) et un ruban de ressac paramétré le long de la plage. Le ruban est exclu explicitement du polygone du ponton dans le shader. Les couleurs suivent le jour et la nuit. La comparaison, la pause et trois heures sont accessibles depuis cette page.

Le test extrait désormais le conteneur complet du fond, et non seulement son premier maillage, afin de mesurer le rendu réellement composé. Ce résultat reste un essai visuel, à évaluer dans la page de comparaison avant activation générale.

## Annulation du 26 octobre 2026

À la demande de l’utilisateur, le moteur de mer et son masque sont restaurés depuis `backup/mer-avant-refonte-20261025` (`63a2e12`). Les essais de ressac sont retirés du rendu. Les assets, bâtiments, baie, ponton, palette et sauvegardes de jeu restent inchangés. La page d’essai redirige vers le prototype restauré. Les sections précédentes documentent les essais abandonnés.
