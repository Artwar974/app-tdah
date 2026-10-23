# 22/10 · mesure du clignotement de la mer : différences entre captures consécutives (12 images à 80 ms de scène, test/t2210_mer.js).
# python3 -I test/t2210_mer.py [dossier des captures]
import sys, os, json
from PIL import Image, ImageChops, ImageStat
D = sys.argv[1] if len(sys.argv) > 1 else os.path.join(os.path.dirname(__file__), 'logs', 't2210_mer')
for nom in ['lever', 'jour', 'coucher', 'nuit']:
    imgs = [Image.open(os.path.join(D, 'suite_%s_%02d.png' % (nom, i))).convert('RGB') for i in range(12) if os.path.exists(os.path.join(D, 'suite_%s_%02d.png' % (nom, i)))]
    if len(imgs) < 2: print(nom, ': pas de captures'); continue
    moy, maxi, pix = [], [], []
    cumul = Image.new('L', imgs[0].size, 0)
    for a, b in zip(imgs, imgs[1:]):
        d = ImageChops.difference(a, b).convert('L')
        st = ImageStat.Stat(d); moy.append(st.mean[0]); maxi.append(max(d.getextrema()))
        pix.append(sum(1 for v in d.getdata() if v > 40))
        cumul = ImageChops.lighter(cumul, d)
    w, h = imgs[0].size
    print('%-8s diff moyenne par image : %s | max : %s | pixels qui sautent de plus de 40 : %s (sur %d)' % (nom, ' '.join('%.2f' % m for m in moy), ' '.join(str(m) for m in maxi), ' '.join(str(n) for n in pix), w * h))
    # où ça bouge : carte des différences cumulées (amplifiée) à regarder
    cumul.point(lambda v: min(255, v * 4)).save(os.path.join(D, 'diff_%s.png' % nom))
