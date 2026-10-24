# Baie et grand ponton

La référence fournie « NEWMAP (2).png » est conservée intacte dans `demo/assets/scene/fond/baie-reference.png`. Le shader PixiJS utilise seulement sa partie côtière et le terrain inférieur, avec un raccord progressif au décor existant. Le mont, sa cascade, le ciel animé et les objets du camp restent en place. L'ancien calque de falaise gauche est désactivé lorsque cette baie est présente.

Le masque technique eau/vent est recalculé une fois au chargement depuis les couleurs de la référence. Les planches et le sable ne subissent pas la réfraction de l'eau. Le premier plan n'affiche plus les anciens conifères inférieurs. Les couleurs de la baie suivent les quatre moments de la journée.

Le panneau des expéditions, la cabane, le bateau, ses points d'amarrage, sa route et les perchoirs des mouettes suivent le nouveau ponton. L'identité des éléments et les sauvegardes restent inchangées. Le cadrage intégral validé et la hauteur de la barre sont conservés.

Validation : `test/barre_compacte.js` sur trois formats mobiles ; `test/baie.js` pour le rendu jour/coucher/nuit, la position effective du port et son maintien après rechargement. Captures dans `test/logs/baie/`. Les mesures de boucle sur le navigateur de test étaient comprises entre 1,17 et 2,39 ms ; elles ne constituent pas une mesure des FPS sur téléphone physique.

Révision du 24/10 : la référence active est désormais mod1.png, conservée intacte sous baie-mod1.png, avec la pierre de la petite falaise corrigée par l’utilisateur. Le cadrage et les coordonnées du port sont conservés.

Audit du 24/10 : le masque combine désormais un contour côtier explicite et la couleur des pixels ; le ponton est exclu. Le vent est limité aux frondaisons. Voir AUDIT_PAYSAGE.md pour les corrections de calques, de teintes et de navigation.
