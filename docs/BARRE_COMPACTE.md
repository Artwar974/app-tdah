# Barre compacte et cadrage du camp

La barre conserve sa hauteur compacte (106 px à l’échelle de référence), avec ou sans quête en attente. À vide, le bouton + reste accessible à droite ; aucun créneau horaire inutile n’apparaît. Les cibles restent au moins à 44 px et la zone de sécurité du téléphone est respectée.

Le cadrage PixiJS utilise la zone allant du haut de l’écran au point où les coins arrondis de la barre rejoignent ses côtés (position réelle de la barre + rayon CSS). Le tableau couvre cette zone sans ciel ajouté. Les formats plus étroits recadrent les côtés plutôt que prolonger le ciel. Le placement des calques HTML et les interactions gardent la même transformation que le monde PixiJS. Les pages de démonstration indépendantes conservent leurs réglages de caméra.

Validation : test/barre_compacte.js vérifie trois formats (360×640, 390×844, 412×915), avec quêtes, toutes terminées et sans quête ; hauteur stable, marge basse, cibles tactiles, bouton +, cadrage sans vide, nuit et mouvement réduit, console. Le vérificateur du projet passe sans erreur ni alerte.
