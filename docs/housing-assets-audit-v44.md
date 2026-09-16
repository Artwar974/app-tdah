# Audit Housing — conformité CAMP GREC V1

Audit réalisé sur les assets actifs de `athena-perspective-standard-v43`, avec le potager, le kiosque et la tente comme kit caméra.

| Asset | Statut caméra | Métadonnée / correction appliquée |
|---|---|---|
| Tentes I–IV | Référence / conforme | `RECT_3x2`, `BUILDING`, orientation canonique |
| Kiosque | Référence / conforme | `RECT_3x2`, `BUILDING` |
| Potager | Étalon footprint / conforme | `RECT_2x2`, `LOW`, ancre au centre de l'emprise |
| Autel d'Athéna | Conforme après remplacement v43 | largeur 200, ancre 0,98, `RECT_1x1`, `TALL` |
| Olivier | Conforme après remplacement v43 | ratio réel 1122/1402, ancre basse, `POINT`, `TALL` |
| Râtelier d'armes | Conforme après remplacement v43 | ancre basse, `RECT_2x1`, `MEDIUM` |
| Lopin fleuri | Conforme après remplacement v43 | `RECT_2x1`, `LOW` |
| Table | Conforme après remplacement v43 | largeur 104, ancre 0,979, `RECT_2x1`, `MEDIUM` |
| Table carrée | Conforme après remplacement v43 | largeur 106, ancre 0,979, `RECT_1x1`, `MEDIUM` |
| Banc | Conforme après remplacement v43 | largeur 88, inférieure aux tables, `RECT_2x1`, `LOW` |
| Feu de camp | Conforme pour un footprint circulaire | `CIRCLE_1x1`, `LOW`, émissif, lumière dynamique |
| Flambeau | Conforme pour un objet à pied ponctuel | `POINT`, `TALL`, émissif, sans disque lumineux au sol |
| Fontaine | Conforme ; dessus du bassin lisible | `RECT_2x2`, `MEDIUM`, animation conservée |

## Décisions

- Aucun redraw génératif n'est appliqué aux références validées : il risquerait d'inventer une nouvelle caméra, contrairement au standard.
- Les ombres portées CSS ajoutées aux assets restent supprimées.
- Tous les objets partagent le même depth scaling et le même système temps/lumière/couleur.
- Les nouvelles métadonnées rendent le standard exploitable par le moteur et contrôlable automatiquement.
