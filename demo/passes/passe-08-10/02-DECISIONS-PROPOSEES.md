# Décisions proposées · 8 octobre 2026

**Statut :** ces 14 décisions sont prises « par défaut » pour que le projet avance. Rien n'est figé : chacune est réversible (colonne « Revenir en arrière »). Les 6 marquées **à confirmer avec l'associé** touchent à la structure ou à la direction du jeu, elles méritent un regard en réunion.

Les décisions déjà marquées « Choisi » dans le hub ne changent pas.

## Les 6 à confirmer avec l'associé
- **Comment ranger la V1 et le tower defense ?** → Deux espaces séparés : la V1 (à livrer) et les Incursions (tower defense, option hors V1)
- **Que gagne-t-on en validant toute la journée ?** → A · Un coffre d'or ; la surprise « Coffre » de la nuit devient « Coffre de la nuit »
- **Comment le feu évolue-t-il, sans changer de taille ?** → Pas de changement dans la V1 : le feu garde sa taille et son animation. Piste retenue provisoirement pour la suite : la lumière qui porte plus loin le soir
- **Sur quoi repose la défense des Incursions, maintenant que le feu ne grandit plus ?** → Sur l'étape de la tente (quatre étapes, permanente) et la flamme du jour
- **Dans la vraie app, le décor est-il étiré ou recadré ?** → Recadré (cover), centré sur la clairière ; plus d'étirement
- **Qu'y a-t-il dans la V1 Toussaint, et après ?** → Dans la V1 : camp animé (décor, feu, objets vivants), tente en 4 étapes, 13 objets, quêtes (créer, étapes, minuteur, glisser jusqu'au feu), journal à 4 onglets, espace parent, onboarding de 4 écrans, surprises, bonus A, profils Enfant et Adulte, deux DA. Après la V1 : Incursions, feu qui évolue, réveil du camp, bonus étoile

## Toutes les décisions
### 1. Comment ranger la V1 et le tower defense ?
**Décision :** Deux espaces séparés : la V1 (à livrer) et les Incursions (tower defense, option hors V1).

La barre de navigation n'affiche que les pages de l'espace où l'on est. Un seul lien discret mène de l'un à l'autre. Les pages de la V1 ne parlent plus du tower defense, sauf une carte « Option hors V1 » sur l'Accueil. Le tower defense garde ses propres données (dossier tower-defense/).

*Pourquoi :* Aujourd'hui la page Tower defense porte la barre « Athéna · V1 » et aucune page ne mène vers elle : on mélange ce qui sera livré et ce qui est encore une idée.
*Revenir en arrière :* Réversible : la barre se règle dans commun/hub-v1.js (H.PAGES, H.INCURSIONS).
*Thème :* Structure · *Statut :* à confirmer avec l'associé

### 2. Que gagne-t-on en validant toute la journée ?
**Décision :** A · Un coffre d'or ; la surprise « Coffre » de la nuit devient « Coffre de la nuit ».

Le plus simple à comprendre et à intégrer, relié au marché. B (nouveauté du calendrier) et C (étoile) restent notés pour plus tard : l'étoile pourra servir à l'évolution du feu.

*Pourquoi :* C'est le dernier point « à définir ensemble » de la V1 ; tant qu'il est ouvert, il bloque l'écran du bilan du soir. A est la seule option sans nouvelle illustration ni nouveau calendrier.
*Revenir en arrière :* Réversible : un seul réglage (V.JEU.bonus) et un écran.
*Thème :* Progression · *Statut :* à confirmer avec l'associé

### 3. Quelles options du « camp vivant » entrent dans la V1 ?
**Décision :** Quatre sur six : vie ambiante, tout se touche, prochain objet, bonus animé. Reportés : réveil du camp, étincelles par catégorie.

Vie ambiante : oiseaux, papillons, lucioles du décor animé, sans visiteur en silhouette, coupée en mouvement réduit et en économie de batterie. Tout se touche : une réaction courte de 250 ms. Prochain objet : une silhouette qui ouvre le marché. Bonus animé : le coffre s'ouvre en pièces.

*Pourquoi :* Le décor et les objets vivants font déjà l'essentiel de la micro-vie. « Réveil du camp » fait doublon avec le calendrier des 30 journées. Les étincelles par catégorie ne changent qu'un détail.
*Revenir en arrière :* Réversible : chaque option est déjà activable seule dans le prototype.
*Thème :* Camp vivant · *Statut :* par défaut

### 4. Fontaine du camp : dessin de l'atlas ou fontaine animée de la vraie app ?
**Décision :** Le dessin de l'atlas, qui garde son style ; la fontaine animée n'entre pas dans la V1.

Le test côte à côte montre deux objets de style et de taille différents : la version animée ne remplace pas la fontaine, elle en pose une autre. La vie vient déjà des objets vivants (étendoir, olivier, lanterne, lavande, laurier, carillon) et du feu.

*Pourquoi :* Garder un seul style de dessin dans le camp.
*Revenir en arrière :* Réversible : la page de comparaison est archivée, pas supprimée.
*Thème :* Camp · *Statut :* par défaut

### 5. Quelles polices pour les titres ?
**Décision :** Deux : Bricolage Grotesque pour Figures, Young Serif pour la Veillée ; Lexend pour les textes. Alegreya et GFS Neohellenic sortent de la V1.

Le panneau « Police des titres » ne propose plus que la police recommandée et l'autre. Les deux polices retirées ne sont plus chargées.

*Pourquoi :* Alegreya et Neohellenic sont encore chargées depuis Google, alors que le projet dit ses polices auto-hébergées : c'est la seule dépendance externe qui reste. Quatre choix de titres pour deux DA, c'est un choix en trop.
*Revenir en arrière :* Réversible : les deux polices restent décrites dans V.POLICES, il suffit de les remettre dans le panneau et de les auto-héberger.
*Thème :* Direction artistique · *Statut :* par défaut

### 6. Que faire des icônes trop détaillées à 24 px ?
**Décision :** Les remplacer par des icônes plus simples des kits déjà dans le projet (Phosphor, Material Symbols, Fluent) : Réunion, Espace parent, Cahier, Repas.

Pas de commande à l'illustrateur pour ces quatre-là. La liste « à redessiner » de l'illustrateur garde les dessins du camp (chouette, visiteurs).

*Pourquoi :* Ces quatre icônes ne sont lues qu'à 24 px : un trait simple suffit, et c'est tout de suite faisable.
*Revenir en arrière :* Réversible : une icône par entrée (V.ICONES_EDITION).
*Thème :* Direction artistique · *Statut :* par défaut

### 7. Où afficher les crédits ?
**Décision :** Dans le Carnet, ligne « Crédits et licences » (déjà en place).

Un seul endroit, atteignable depuis l'espace de la personne. La licence CC BY 3.0 est respectée tant que le crédit est visible dans l'app.

*Pourquoi :* Déjà fait dans le prototype ; un deuxième endroit demanderait de le maintenir deux fois.
*Revenir en arrière :* Réversible.
*Thème :* Intégration · *Statut :* par défaut

### 8. Quels sons garder ?
**Décision :** Le marimba actuel ; les sons « lolurio » ne sont pas retenus.

Les notes sont toutes dans la même gamme (ré majeur pentatonique) : elles se marient entre elles.

*Pourquoi :* Le marimba n'oblige à aucun crédit supplémentaire et ne pèse rien ; lolurio demanderait un crédit et un nouveau mixage.
*Revenir en arrière :* Réversible : athena-sons.js est isolé.
*Thème :* Sons · *Statut :* par défaut

### 9. Quelle forme pour l'historique ?
**Décision :** A · Le mont des routines par défaut, avec la bascule « Les fiches » dans la même page.

La bascule existe déjà dans le prototype : on ne retire rien, on choisit seulement ce qu'on voit en premier.

*Pourquoi :* Le mont prolonge l'univers du camp ; les fiches restent pour qui veut des chiffres.
*Revenir en arrière :* Réversible : un réglage de départ.
*Thème :* Journal · *Statut :* par défaut

### 10. À quelle heure commence le « soir » ?
**Décision :** 19 h.

C'est la valeur du prototype, et c'est aussi le début du coucher du soleil dans le décor animé (palier 19 h).

*Pourquoi :* La surprise, le bilan du soir et le décor changent ensemble : le soir arrive quand le ciel le montre.
*Revenir en arrière :* Réversible : V.JEU.surprise.heure.
*Thème :* Surprises · *Statut :* par défaut

### 11. Comment le feu évolue-t-il, sans changer de taille ?
**Décision :** Pas de changement dans la V1 : le feu garde sa taille et son animation. Piste retenue provisoirement pour la suite : la lumière qui porte plus loin le soir.

La flaque de lumière au sol s'étend avec l'étape de la tente (quatre étapes, permanente, jamais perdue). Le module du camp la gère déjà par sa portée de lumière : l'image du feu ne bouge pas. Les braises et couleurs de flamme et le foyer en pierre restent des pistes ouvertes.

*Pourquoi :* C'est la piste qui coûte le moins (un réglage, pas de dessin) et qui se voit surtout le soir, là où le camp est le plus beau.
*Revenir en arrière :* Réversible : rien n'est construit, c'est une direction.
*Thème :* Mécaniques · *Statut :* à confirmer avec l'associé

### 12. Sur quoi repose la défense des Incursions, maintenant que le feu ne grandit plus ?
**Décision :** Sur l'étape de la tente (quatre étapes, permanente) et la flamme du jour.

Le « stade du feu » est remplacé partout dans les Incursions par l'« étape de la tente ». Les textes qui disent que les quêtes « font grandir le feu » sont réécrits. Rien d'autre ne change dans les Incursions, qui restent désactivées et hors V1.

*Pourquoi :* Les Incursions s'appuient aujourd'hui sur une mécanique retirée le 8 octobre ; la tente a la même propriété (permanente, jamais perdue) et existe déjà.
*Revenir en arrière :* Réversible : textes et une valeur.
*Thème :* Incursions · *Statut :* à confirmer avec l'associé

### 13. Dans la vraie app, le décor est-il étiré ou recadré ?
**Décision :** Recadré (cover), centré sur la clairière ; plus d'étirement.

Le prototype recadre, la vraie app étire (object-fit: fill). Les positions des objets du camp sont calculées sur 390 × 844 : elles ne tiennent que si le décor n'est pas déformé.

*Pourquoi :* Un décor étiré déforme le feu, les ombres et la perspective que la passe lumière vient de régler.
*Revenir en arrière :* À porter dans le dépôt par la personne qui l'applique (index.html : #scene).
*Thème :* Intégration · *Statut :* à confirmer avec l'associé

### 14. Qu'y a-t-il dans la V1 Toussaint, et après ?
**Décision :** Dans la V1 : camp animé (décor, feu, objets vivants), tente en 4 étapes, 13 objets, quêtes (créer, étapes, minuteur, glisser jusqu'au feu), journal à 4 onglets, espace parent, onboarding de 4 écrans, surprises, bonus A, profils Enfant et Adulte, deux DA. Après la V1 : Incursions, feu qui évolue, réveil du camp, bonus étoile.

La liste est écrite en une phrase par bloc dans l'Accueil, pour que le périmètre soit lisible sans ouvrir les autres pages.

*Pourquoi :* Un périmètre écrit évite que le tower defense ou une idée du camp vivant s'invite dans la V1 sans décision.
*Revenir en arrière :* Réversible : c'est une liste.
*Thème :* Structure · *Statut :* à confirmer avec l'associé
