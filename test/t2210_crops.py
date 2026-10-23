# 22/10 · découpe, dans les captures de test/t2210_mer.js (camp_<heure>.png + boite_<heure>.json), le ponton et sa cabane, puis le Mont
# et ses torches, agrandis ×3 pour les regarder. python3 -I test/t2210_crops.py [dossier des captures]
import sys, os, json
from PIL import Image
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'logs', 't2210_mer')
ZONES = { 'ponton': (370, 630, 630, 770), 'mont': (330, 130, 640, 480), 'baie': (0, 390, 720, 800) }
for nom in ['lever', 'jour', 'coucher', 'nuit']:
    fb = os.path.join(D, 'boite_%s.json' % nom); fi = os.path.join(D, 'camp_%s.png' % nom)
    if not (os.path.exists(fb) and os.path.exists(fi)): continue
    b = json.load(open(fb)); im = Image.open(fi).convert('RGB')
    for z, (x0, y0, x1, y1) in ZONES.items():
        X = lambda v: b['x'] + b['p0x'] + v * b['e0']; Y = lambda v: b['y'] + b['p0y'] + v * b['e0']
        c = im.crop((int(X(x0)), int(Y(y0)), int(X(x1)) + 1, int(Y(y1)) + 1))
        k = 3 if z != 'baie' else 2
        c.resize((c.width * k, c.height * k), Image.LANCZOS).save(os.path.join(D, 'zoom_%s_%s.png' % (z, nom)))
print('ok', D)
