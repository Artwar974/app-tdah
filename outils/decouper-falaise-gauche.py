#!/usr/bin/env python3
"""22/10 · découpe la falaise gauche du tableau d'origine (liste V2, point 5.2).

Le tableau d'origine (demo/assets/optim/day-hd.webp, lu par les Incursions : on le lit seulement) a une falaise à gauche de la baie :
un rocher gris, deux cyprès et un pin parasol, à x < 150, y ≈ 510-740. Les quatre fonds de la scène (demo/assets/scene/fond/fond_<moment>.webp)
en sont dérivés, mais là il n'y a que de la mer : le paysage penche à droite. Ce script découpe la falaise dans les trois tableaux hd
(jour, coucher, nuit) et la teinte pour le lever ; la scène la pose en deux sprites au-dessus du maillage du fond (athena-scene.js, fond.falaiseGauche).

La silhouette : les pixels où |day-hd − fond_jour| > 20 (fond_jour n'a que de la mer à cet endroit : la différence EST la falaise et son liseré ;
là où les deux tableaux sont d'accord, l'eau, l'alpha retombe à 0 tout seul), seulement là où fond_jour a de l'eau (masques.png, canal R :
l'île au pin et les buissons du premier plan de fond_jour restent devant), dans la fenêtre x < 152, y 470-742 (mesuré : le bord droit du
rocher descend en biais jusqu'à x ≈ 150 à y ≈ 656 ; à 130 il serait tranché net), nettoyée par ouverture (rayon 1 : les branches du pin font
2-3 px) et fermeture (rayon 2), plus grande composante connexe. Sous le rocher, day-hd a un pont de buissons jusqu'à SON île (x 150-200,
y 650-700) qu'on ne garde pas : la coupe suit une couture de coût minimal le long des contours peints (le coût est l'inverse du gradient :
la couture longe le bord du buisson sombre du pied de la falaise, entre lui et le buisson olive du pont) dans la bande x 134-152, à partir du pied
du bord droit du rocher. Les trous fermés sont remplis (là, les deux tableaux sont d'accord : rien ne change à l'œil). Bord adouci sur 1,5 px,
et l'alpha suit le bord propre du masque d'eau sur l'île et les buissons de fond_jour (pas de liseré d'eau par-dessus leur contour).

Sorties : demo/assets/scene/fond/falaise_gauche_{jour,lever,coucher,nuit}.png (RGBA, alpha droit) et leur origine dans
demo/commun/athena-scene.json → fond.falaiseGauche ; avec --apercu DOSSIER, un aperçu PNG de chaque découpe posée sur son fond (zoom ×3).

Usage : python3 -I outils/decouper-falaise-gauche.py [RACINE_DU_DEPOT] [--apercu DOSSIER]
(numpy et Pillow installés pour tout le système : python3 -I ignore les paquets installés avec --user)
"""
import sys, os, json
import numpy as np
from PIL import Image, ImageFilter

# 23/10 · « --apercu DOSSIER » est retiré des arguments avant de lire la racine (sinon, sans RACINE, le dossier d'aperçu devenait la racine)
argv = sys.argv[1:]
apercu = None
if '--apercu' in argv:
    i = argv.index('--apercu'); apercu = argv[i + 1] if i + 1 < len(argv) else None; del argv[i:i + 2]
args = [a for a in argv if not a.startswith('--')]
racine = args[0] if args else os.path.join(os.path.dirname(os.path.abspath(__file__)), '..')
A = os.path.join(racine, 'demo', 'assets')
SORTIE = os.path.join(A, 'scene', 'fond')
JSON = os.path.join(racine, 'demo', 'commun', 'athena-scene.json')

SEUIL = 20                 # |day-hd − fond_jour| au-delà duquel un pixel est de la falaise
FENETRE = (0, 470, 152, 742)   # x0, y0, x1, y1 (exclus)
BANDE = (134, 152)         # la couture de coupe des buissons, sous le rocher
Y_COUTURE_FIN = 712        # en dessous, le rocher de l'île de fond_jour (masque) fait la coupe
ZONE_DROITE = (610, 480, 700, 600)   # la falaise DROITE, pour teinter le lever : rapport des moyennes fond_lever / fond_jour
ADOUCI = 0.75              # rayon du flou de l'alpha (≈ 1,5 px de bord)

def lire(p): return np.asarray(Image.open(p).convert('RGB')).astype(np.int16)
day = lire(os.path.join(A, 'optim', 'day-hd.webp')); sun = lire(os.path.join(A, 'optim', 'sunset-hd.webp')); nit = lire(os.path.join(A, 'optim', 'night-hd.webp'))
fonds = {m: lire(os.path.join(SORTIE, 'fond_%s.webp' % m)) for m in ('jour', 'lever', 'coucher', 'nuit')}
masques = np.asarray(Image.open(os.path.join(SORTIE, 'masques.png')).convert('RGB'))
eau = masques[:, :, 0] > 128
H, W = eau.shape

# ---- morphologie (disque de rayon r), composante connexe
def dilater(m, r):
    out = m.copy()
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            if dx * dx + dy * dy > r * r or (dx == 0 and dy == 0): continue
            s = np.zeros_like(m)
            s[max(0, -dy):H + min(0, -dy), max(0, -dx):W + min(0, -dx)] = m[max(0, dy):H + min(0, dy), max(0, dx):W + min(0, dx)]
            out |= s
    return out
def eroder(m, r): return ~dilater(~m, r)
def plus_grande_composante(m):
    lab = np.zeros(m.shape, np.int32); n = 0; meilleure = (0, 0)
    for y, x in zip(*np.where(m)):
        if lab[y, x]: continue
        n += 1; pile = [(y, x)]; lab[y, x] = n; k = 0
        while pile:
            cy, cx = pile.pop(); k += 1
            for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
                if 0 <= ny < H and 0 <= nx < W and m[ny, nx] and not lab[ny, nx]: lab[ny, nx] = n; pile.append((ny, nx))
        if k > meilleure[0]: meilleure = (k, n)
    return lab == meilleure[1]

# ---- 1. la silhouette brute
x0, y0, x1, y1 = FENETRE
fenetre = np.zeros((H, W), bool); fenetre[y0:y1, x0:x1] = True
diff = np.abs(day - fonds['jour']).max(axis=2) > SEUIL
sil = diff & eau & fenetre
sil = dilater(eroder(sil, 1), 1)          # ouverture : les poussières
sil = eroder(dilater(sil, 2), 2)          # fermeture : les petits trous
sil = plus_grande_composante(sil)

# ---- 2. la coupe des buissons sous le rocher : une couture de coût minimal le long des contours (coût = 255 − gradient) dans la bande,
# à partir du pied du bord droit du rocher
lum = (day * np.array([0.3, 0.59, 0.11])).sum(axis=2)
gx = np.zeros_like(lum); gy = np.zeros_like(lum)
gx[:, 1:-1] = lum[:, 2:] - lum[:, :-2]; gy[1:-1, :] = lum[2:, :] - lum[:-2, :]
cout_px = 255.0 - np.minimum(255.0, np.hypot(gx, gy) * 2.0)
bx0, bx1 = BANDE
# le pied du bord droit : la première ligne (du haut) où la silhouette atteint le bord droit de la fenêtre moins 2 px
droite = [np.where(sil[y])[0].max() if sil[y].any() else -1 for y in range(H)]
y_pied = next(y for y in range(y0, y1) if droite[y] >= x1 - 3)
depart = droite[y_pied]
cout = np.full((Y_COUTURE_FIN - y_pied + 1, bx1 - bx0), np.inf); dou = np.zeros(cout.shape, np.int8)
cout[0, depart - bx0] = 0
for i in range(1, cout.shape[0]):
    y = y_pied + i
    for j in range(cout.shape[1]):
        cands = [(cout[i - 1, j + d], d) for d in (-1, 0, 1) if 0 <= j + d < cout.shape[1]]
        c, d = min(cands)
        cout[i, j] = c + cout_px[y, bx0 + j]; dou[i, j] = d
j = int(np.argmin(cout[-1])); couture = {}
for i in range(cout.shape[0] - 1, -1, -1):
    couture[y_pied + i] = bx0 + j; j += int(dou[i, j])
for y in range(y_pied + 1, Y_COUTURE_FIN + 1): sil[y, couture[y]:] = False
for y in range(Y_COUTURE_FIN + 1, y1): sil[y, couture[Y_COUTURE_FIN]:] = False
sil = plus_grande_composante(sil)
# les trous fermés : l'eau de fond_jour que la silhouette (ou la terre de fond_jour) entoure, hors d'atteinte depuis le bord de la fenêtre
libre = eau & fenetre & ~sil
atteint = np.zeros_like(libre); pile = [(y, x) for y in (y0, y1 - 1) for x in range(x0, x1) if libre[y, x]] + [(y, x) for x in (x0, x1 - 1) for y in range(y0, y1) if libre[y, x]]
for y, x in pile: atteint[y, x] = True
while pile:
    cy, cx = pile.pop()
    for ny, nx in ((cy - 1, cx), (cy + 1, cx), (cy, cx - 1), (cy, cx + 1)):
        if 0 <= ny < H and 0 <= nx < W and libre[ny, nx] and not atteint[ny, nx]: atteint[ny, nx] = True; pile.append((ny, nx))
trous = libre & ~atteint
print('trous remplis : %d px' % trous.sum()); sil |= trous

# ---- 3. l'alpha adouci (× le bord propre du masque d'eau), le cadre
alpha = np.asarray(Image.fromarray((sil * 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(ADOUCI))).astype(np.float32) / 255.0
alpha[~dilater(sil, 2)] = 0
alpha *= masques[:, :, 0].astype(np.float32) / 255.0
ys, xs = np.where(alpha > 0.002)
cx0, cy0, cx1, cy1 = int(xs.min()), int(ys.min()), int(xs.max()) + 1, int(ys.max()) + 1
print('silhouette : %d px, cadre x %d-%d, y %d-%d ; pied du bord droit du rocher (%d, %d), couture x %d → %d' % (sil.sum(), cx0, cx1, cy0, cy1, depart, y_pied, couture[y_pied], couture[Y_COUTURE_FIN]))

# ---- 4. les quatre découpes
zx0, zy0, zx1, zy1 = ZONE_DROITE
rapport = fonds['lever'][zy0:zy1, zx0:zx1].reshape(-1, 3).mean(axis=0) / fonds['jour'][zy0:zy1, zx0:zx1].reshape(-1, 3).mean(axis=0)
print('lever : teinte = day-hd × %s (falaise droite, fond_lever / fond_jour)' % np.round(rapport, 3).tolist())
sources = {'jour': day, 'coucher': sun, 'nuit': nit, 'lever': np.clip(day * rapport, 0, 255)}
a8 = np.clip(np.round(alpha * 255), 0, 255).astype(np.uint8)[cy0:cy1, cx0:cx1]
images = {}
for m, src in sources.items():
    rgba = np.dstack([np.clip(src, 0, 255).astype(np.uint8)[cy0:cy1, cx0:cx1], a8])
    chemin = os.path.join(SORTIE, 'falaise_gauche_%s.png' % m)
    Image.fromarray(rgba, 'RGBA').save(chemin, optimize=True)
    images[m] = 'fond/falaise_gauche_%s.png' % m
    print('%s : %d octets' % (os.path.relpath(chemin, racine), os.path.getsize(chemin)))

# ---- 5. l'origine dans athena-scene.json (fond.falaiseGauche)
with open(JSON, encoding='utf8') as f: brut = f.read()
S = json.loads(brut)
S['fond']['falaiseGauche'] = {
    'x': cx0, 'y': cy0, 'images': images,
    'note': "22/10 · la falaise gauche du tableau d'origine (day-hd, sunset-hd, night-hd ; le lever est le jour teinté), découpée par outils/decouper-falaise-gauche.py "
            "(cadre %d × %d, origine en haut à gauche) ; la scène la pose en deux sprites fondus au-dessus du fond, sous l'île au pin ; effets.falaiseGauche = 0 la cache" % (cx1 - cx0, cy1 - cy0)
}
if 'falaiseGauche' not in S['fond']['effets']:
    effets = {}
    for k, v in S['fond']['effets'].items():
        if k == 'note': effets['falaiseGauche'] = 1.0
        effets[k] = v
    S['fond']['effets'] = effets
with open(JSON, 'w', encoding='utf8') as f: f.write(json.dumps(S, indent=1, ensure_ascii=False) + ('\n' if brut.endswith('\n') else ''))
print('athena-scene.json : fond.falaiseGauche = (%d, %d)' % (cx0, cy0))

# ---- 6. l'aperçu : chaque découpe posée sur son fond, zoom ×3 sur la gauche de la baie
if apercu:
    os.makedirs(apercu, exist_ok=True)
    for m, src in sources.items():
        a = alpha[..., None]
        comp = fonds[m] * (1 - a) + np.clip(src, 0, 255) * a
        im = Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).crop((0, 450, 240, 780))
        im.resize((im.width * 3, im.height * 3), Image.LANCZOS).save(os.path.join(apercu, 'apercu_%s.png' % m))
        Image.fromarray(np.clip(comp, 0, 255).astype(np.uint8)).save(os.path.join(apercu, 'compose_%s.png' % m))
    Image.fromarray(a8).resize(((cx1 - cx0) * 3, (cy1 - cy0) * 3), Image.NEAREST).save(os.path.join(apercu, 'alpha.png'))
    print('aperçus dans', apercu)
