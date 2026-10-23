# Passe du 8 octobre · ce que contient ce dossier

Ce dossier a été glissé dans le projet avec le prompt. Chaque fichier a un rôle précis.

| Fichier | Rôle |
|---|---|
| `01-RAPPORT-VERIFICATION.md` | Ce qui a été testé dans le projet, 9 bugs ou incohérences et leur correctif, hauteurs des pages. |
| `02-DECISIONS-PROPOSEES.md` et `decisions-proposees.json` | 14 décisions par défaut, dont 6 à confirmer avec l'associé. Le `.json` est lu par le prompt. |
| `03-STRUCTURE-CIBLE.md` | Les deux espaces (V1 / Incursions), l'arborescence, la méthode de rangement complet, les règles de mise en page. |
| `INTEGRATION-APP-vraie-app.md` | Pour plus tard, avec l'associé : brancher l'avatar puis la lumière v2 dans la vraie app (dépôt app-tdah). Claude Design n'en a pas besoin. |

Ailleurs dans le dossier :
- `commun/athena-camp-lumiere.js` (lumière v2, remplace la v1), `commun/athena-avatars.js` (avatar de profil), `commun/hub-v1.js` (barre à deux espaces).
- `outils/` : 6 pages de test (`lumiere-v2-test.html`, `avatars-test.html`…) et `appliquer-avatars.js`, qui ajoute l'avatar (écrans, textes, mécanique, deux décisions) à `athena-v1.js`.
- `scripts/verifier-projet.py` : vérifie le projet sans le lancer (`python3 -I verifier-projet.py DOSSIER`).
- `assets/kits/LICENCES-avatars.md` : crédits CC BY 3.0 des avatars, par auteur (Game-icons.net).

Non vérifié : les écrans d'avatar du prototype (construits par la passe), Safari et Firefox, le glisser jusqu'au feu sur un vrai téléphone, la vraie app (le document d'intégration est écrit d'après la lecture du code).
