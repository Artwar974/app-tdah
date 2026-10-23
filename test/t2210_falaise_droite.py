# 22/10 · zooms ×3 des captures de test/t2210_falaise_droite.js (camp_<heure>.png, 720 × 1280 = le repère du tableau) : la falaise droite
# et le pied de la montagne, le sommet (le temple) et le flanc droit (le bord du calque mont_eau contre le tableau), et le Prototype
# (390 × 844) autour de la falaise, et la toile seule pendant la feuille du Ponton (proto_feuille_scene.png, la falaise en haut à droite).
# python3 -I test/t2210_falaise_droite.py [dossier des captures]
import sys, os
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'logs', 't2210_falaise_droite')
ZONES = { 'falaise': (540, 380, 720, 540), 'sommet': (420, 50, 620, 220), 'flanc': (560, 200, 720, 400) }
for nom in ['lever', 'jour', 'coucher', 'nuit']:
    f = os.path.join(D, 'camp_%s.png' % nom)
    if not os.path.exists(f): continue
    im = Image.open(f).convert('RGB')
    for z, (x0, y0, x1, y1) in ZONES.items():
        c = im.crop((x0, y0, x1, y1)); c.resize((c.width * 3, c.height * 3), Image.NEAREST).save(os.path.join(D, 'zoom_%s_%s.png' % (z, nom)))
for nom in ['jour', 'coucher']:
    f = os.path.join(D, 'proto_%s.png' % nom)
    if not os.path.exists(f): continue
    im = Image.open(f).convert('RGB'); c = im.crop((270, 390, 390, 540)); c.resize((c.width * 3, c.height * 3), Image.NEAREST).save(os.path.join(D, 'zoom_proto_%s.png' % nom))
f = os.path.join(D, 'proto_feuille_scene.png')
if os.path.exists(f):
    im = Image.open(f).convert('RGB'); c = im.crop((280, 10, 390, 130)); c.resize((c.width * 3, c.height * 3), Image.NEAREST).save(os.path.join(D, 'zoom_proto_feuille.png'))
print('ok', D)
