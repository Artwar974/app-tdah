# Baie et grand ponton

La référence fournie « NEWMAP (2).png » est conservée intacte dans `demo/assets/scene/fond/baie-reference.png`. Le shader PixiJS utilise seulement sa partie côtière et le terrain inférieur, avec un raccord progressif au décor existant. Le mont, sa cascade, le ciel animé et les objets du camp restent en place. L'ancien calque de falaise gauche est désactivé lorsque cette baie est présente.

Le masque technique eau/vent est recalculé une fois au chargement depuis les couleurs de la référence. Les planches et le sable ne subissent pas la réfraction de l'eau. Le premier plan n'affiche plus les anciens conifères inférieurs. Les couleurs de la baie suivent les quatre moments de la journée.

Le panneau des expéditions, la cabane, le bateau, ses points d'amarrage, sa route et les perchoirs des mouettes suivent le nouveau ponton. L'identité des éléments et les sauvegardes restent inchangées. Le cadrage intégral validé et la hauteur de la barre sont conservés.

Validation : `test/barre_compacte.js` sur trois formats mobiles ; `test/baie.js` pour le rendu jour/coucher/nuit, la position effective du port et son maintien après rechargement. Captures dans `test/logs/baie/`. Les mesures de boucle sur le navigateur de test étaient comprises entre 1,17 et 2,39 ms ; elles ne constituent pas une mesure des FPS sur téléphone physique.

Révision du 24/10 : la référence active est désormais mod1.png, conservée intacte sous baie-mod1.png, avec la pierre de la petite falaise corrigée par l’utilisateur. Le cadrage et les coordonnées du port sont conservés.

Audit du 24/10 : le masque combine désormais un contour côtier explicite et la couleur des pixels ; le ponton est exclu. Le vent est limité aux frondaisons. Voir AUDIT_PAYSAGE.md pour les corrections de calques, de teintes et de navigation.

Correction terre seule : la référence mod1 ne fournit que les terres et le ponton. Son eau et son écume peinte sont exclues par le masque du shader. Les fonds marins existants sont prolongés sous les anciennes terres devenues baie, et les vagues animées conservent leur intensité initiale. Le test baie_terre.js remplace temporairement la référence par du magenta pour vérifier que quatre points marins ne changent pas, tandis que la terre réagit.

Ponton : contour du tablier relevé sur mod1, zone de marche en retrait des bords, entrée et quai alignés sur son axe. Les deux perchoirs sont sur les planches. Le compagnon embarque depuis le quai sans pas supplémentaire au-dessus de l’eau. Régression géométrique : test/ponton_limites.js ; trajet aller-retour : test/paysage_audit.js.
