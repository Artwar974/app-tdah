# Passe du 20/10/2026 · 04 · L'état : ce qui est fait, vérifié, et ce qui reste

## 1. Fait, lot par lot

| Lot | Fait |
|---|---|
| A · Économie (barème 5, `commun/athena-economie.js`, version 4 du module) | Les gains vont droit aux compteurs (`quete.direct`) ; les expéditions en parcours (`parcoursLancer`, `parcoursAvancer`, `parcoursChoisir`, `parcoursRentrer`, `parcoursMode`) ; le Sentier à 12 paliers par mois avec `bonus` ; `validerApresCoup` ; `hier` dans `nouvelleJournee` ; le Ponton construit dans l'état initial ; `expeditionsFinies` pour le Kiosque. 87 règles de contrôle (`outils/economie-controles.js`). `V.JEU.eco` reste la copie exacte du barème. |
| B · Le camp (`commun/athena-scene.js`, `athena-scene.json`, `Prototype.dc.html`) | Les 4 torches du Mont (`mont-palier`, animation au 4e), le coffre dessiné au pied de la tente (zone de toucher 44 px) et plus de symbole de sac, le bandeau du Grand Sentier (trois lignes), les badges de 32 px sur les bâtiments, les niveaux en toast, plus de brume le matin, le soir tamisé, les mouettes plus petites, le Ponton et le Kiosque dès le premier jour (carte du Ponton après la 1re quête, Kiosque après 5 expéditions). |
| C · Les écrans (`Prototype.dc.html`, `athena-v1.js`) | La feuille du Ponton en parcours (quatre façons de partir, charmes, cartes des compagnons en chemin, les trois voies avec crans et « Par là », « Rentrer au camp »), la pastille du camp, la carte du retour (besace, voie manquée, créature), les départs et retours dans la scène, `tickEco` qui fait avancer les parcours ; le résumé du matin (feuille « Hier ») ouvert par `lendemain()` ; « Hier, pas validées » dans Journal › Quêtes ; « Valider après coup » et « Relancer » ; les habitudes sans verrou ; les réglages d'URL `expedition=attend|route|retour`, `mode=`, `ecran=matin`, `hier=1`, `sommetHier=1`. |
| D · La passe UI | Un mot, un sens dans tous les textes (le coffre, les réserves, la besace) ; les façons de partir en deux mots ; le résumé du matin plus court ; l'Étincelle au palier 7 ; aucune interface intrusive trouvée sur le camp (captures `test/d_*.png`). |
| E · La doc | Écrans (Il t'attend, Le résumé du matin, Hier pas validées ; le Ponton, le retour, les compagnons, le coffre, le Sentier revus), Mécaniques (parcours, matin, après coup, coffre inventaire, torches, Sentier 12, habitudes libres ; expéditions, Hameau, Grand Sentier, saisons revus), Décisions (douze décisions du 20/10 ; les choix 1, 2, 4, 6, 8, 10 tranchés, le 3 remplacé), Accueil (le coffre, le matin, les expéditions, 12 paliers par mois), le glossaire, DA › Bâtiments et paliers (torches, coffre, badges, voies, paliers 6 et 12), les dessins à commander (n° 6, 18 revus ; 19, 20, 21 ajoutés) et `generation-images/` régénéré (briefs 06, 17, 22 à 25 ; références du camp actuel), le journal, `LISEZ-MOI.md`, ce dossier. |
| F · Les contrôles | Voir § 2. La publication remplace la version 11 de l'artefact. |

## 2. Vérifié

| Contrôle | Résultat |
|---|---|
| `python3 -I scripts/verifier-projet.py .` | 0 erreur, 0 alerte. |
| Les règles de l'économie | 87 sur 87. |
| La sonde du Lot C (`test/sonde_2010_c.js`) | 22 contrôles sur 22 : le Ponton qui attend (trois « Par là », les difficultés dites), « Par là » le remet en route, « Rentrer au camp », les quatre façons de partir et « Partir », la pastille « En route · pas 1 sur 3 » et « Il t'attend au Ponton », la carte du retour avec la besace, le résumé du matin (quêtes, Sommet, deux quêtes pas validées), « Valider après coup » (l'or monte, une carte reste), « Relancer » (la feuille se ferme, la quête est dans la journée), Journal › « Hier, pas validées » et son après coup, les habitudes sans « lundi » ; console vide partout. |
| Les contrôles de la passe technique (`test/t5_controles.js`) | Camp-scene aux cinq heures, curseurs, événements, tente, flambeau, compagnon, touchers, mouvement réduit, cadence 30 ; atelier ; le prototype dans 48 états (Ado et Parent, deux DA, 390 × 844 et 360 × 640) sans erreur ni requête vers les anciens dossiers ; la validation par le glisser. |
| Les pages de la doc (`test/sonde_2010_e.js`) | Accueil (11 choix encore ouverts, le résumé du matin, 12 paliers, le coffre inventaire), Décisions (20 choix, le 3 « Remplacé », les tranchés marqués sur leur option), Écrans (les écrans du 20/10 ; à 390 px sans défilement horizontal), Mécaniques (parcours, matin, après coup), DA (torches, paliers 6 et 12) : aucune erreur console. |
| Les suites du 19/10, rejouées et adaptées au 20/10 | lot1 (animation d’interface) 16 / 16 · lot3 (Grand Sentier, 12 paliers) 16 / 16 · lot5 (personnages) 19 / 19 · lot5b (caméra, coffre à 6 px du bord) 14 / 14 · lot6 (décor : aucun saut de couleur, le coucher commence à 18 h) 16 / 16 · lot7 (UI/UX écran par écran) 36 / 36 · sim4 et sim5 (simulations) sans erreur. lot2 (récompense pendant l’action) et la chasse aux bugs : relancées seules après la mesure sous charge, résultat dans `test/logs/`. |

## 3. À essayer dans le prototype

- `Prototype.dc.html#ecran=expedition&expedition=attend&nouv=tout` : le compagnon attend, trois voies.
- `Prototype.dc.html#ecran=expedition&nouv=tout` : partir (quatre façons).
- `Prototype.dc.html#ecran=camp&expedition=retour&nouv=tout` : la carte du retour.
- `Prototype.dc.html#ecran=matin&nouv=tout` : le résumé du matin ; `&sommetHier=1` avec le Sommet.
- `Prototype.dc.html#ecran=journal&tab=quetes&hier=1&nouv=tout` : « Hier, pas validées ».
- `Prototype.dc.html#ecran=camp&heure=17&sommet=1&paliers=4&nouv=tout` : les quatre torches et le Sommet.
- Le panneau « Lendemain (4 h) » : la nouvelle journée et le résumé du matin.

## 4. Ce qui reste

- **Observer** le rythme des créatures et les chances de réussite avec de vrais joueurs ; régler dans le barème (`expeditions.parcours`).
- **Les dessins** à générer (`generation-images/`) : les torches (17), le coffre (06), les cinq voies (23), trois créatures (24), la bannière du matin (25).
- **La vraie app** : rien n'est modifié dans son dépôt ; le choix 20 (la scène) et ce système d'expédition sont des propositions.
- **Les tests sur appareils** (Android d'entrée de gamme, iPhone) pour la scène et les parcours.
