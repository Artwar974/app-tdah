# Mer adaptée à la baie — 25/10/2026

## Sauvegarde et retour

La branche `backup/mer-avant-refonte-20261025` conserve intégralement la version précédente (`63a2e12`). Les assets d’origine et la planche des 83 images restent présents.
Dans `Camp-scene.html`, le bouton « Mer adaptée à la baie » permet de comparer avec l’ancienne animation d’écume. En code : `scene.reglages.merBaie = 0` (ancienne) ou `1` (nouvelle). Cette comparaison conserve le masque corrigé ; la branche de sauvegarde permet de restaurer la totalité de l’ancien rendu.

## Rendu

La texture technique 360 × 640 est calculée une fois au chargement, à partir des masques du décor et du contour géométrique de la baie. Rouge : distance signée à la côte ; vert/bleu : normale dirigée vers l’eau. Les petits trous de peinture sont comblés seulement dans cette carte. Le ponton n’est pas traité comme une plage.

Le shader existant PixiJS 8.22.0 utilise cette carte pour courber les fronts près des côtes. La houle du large reste discrète ; le rivage reçoit un liseré fragmenté, animé par du bruit périodique. Quatre zones de remous accompagnent les pilotis. Une frange étroite du sable est assombrie au reflux. Le masque de rendu protège le tablier, les pilotis et les rochers ; les reflets gris-bleu de l’image de référence ne sont plus pris pour de la terre.

La nouvelle écume a une période de 48 secondes (cycles intermédiaires décalés). Les autres effets existants, réfraction, reflets des astres et cascade, restent continus. La couleur d’écume suit les quatre ambiances. Le mouvement réduit fige les effets ; la pause de l’onglet conserve le comportement existant. La carte GPU est détruite avec la scène.

Il s’agit d’une animation artistique guidée par la côte, pas d’une simulation hydrodynamique. Les points des pilotis et le contour devront être recalés si le décor change à nouveau.

## Vérifications

`node test/mer_baie.js` : extraction des pixels réellement rendus, mouvement de l’eau, continuité 0/48 s (tolérance 1/255), terre/ponton immobiles, distance eau/terre signée, bouton ancienne/nouvelle mer. Mesure comparative de soumission du rendu : informative, pas une garantie de cadence sur téléphone physique.

`node test/paysage_audit.js` : masques, quatre ambiances, départ et retour du bateau, mouvement réduit, console.
Les captures et mesures sont dans `test/logs/mer-baie/` et `test/logs/paysage-audit/` (non versionnées).
