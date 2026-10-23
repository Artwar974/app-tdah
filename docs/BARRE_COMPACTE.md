# Barre inférieure compacte

Demande : supprimer l’espace inutile sous les quêtes et réduire davantage la barre sans quête en attente.

La barre conserve une ligne de titre et la rangée des quêtes lorsqu’il en reste, avec 8 px en haut, 4 px entre les lignes et 6 px en bas (ou la zone de sécurité du téléphone). Sans quête en attente, y compris lorsque toutes sont terminées, la rangée disparaît et le bouton d’ajout rejoint la ligne de titre à droite. La hauteur nominale passe de 140 à 106 px, puis 58 px à vide. Les cibles compensent la mise à l’échelle du téléphone pour rester au moins à 44 px. Les repères des indications au-dessus de la barre suivent sa hauteur. Le camp reste rendu par PixiJS 8.22.0, l’interface reste en HTML.

Validation : test/barre_compacte.js a reproduit les marges excessives et l’absence de réduction à vide avant modification. Après modification : scénarios avec quêtes, toutes terminées et aucune quête, sur 360 et 412 px ; hauteur, marge basse, taille tactile, absence de débordement, absence de créneau à vide et ouverture du formulaire via +. Vérificateur de projet : 0 erreur et 0 alerte.
