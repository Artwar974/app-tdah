#!/usr/bin/env python3
"""Écrit demo/sw-precache.js : la version du cache et les listes que demo/sw.js met en cache. Usage : python3 -I outils/generer-precache.py

Lit demo/Prototype.dc.html et demo/index.html (ext-resource-dependency, <link href>, <script src>, le chargeur du helmet, les un('…') de sceneScripts()),
demo/commun/athena-scene.json et ses sous-JSON, et liste demo/assets/scene/**, demo/commun/polices/*, demo/icones/*, demo/manifest.webmanifest ; y ajoute la
coquille nommée par la spec (athena-v1-rapport.js, commun/*.js, commun/*.css, commun/*.json). COQUILLE = tout sauf les images de assets/scene/ (IMAGES) ;
CDN = les 4 scripts (react, react-dom, @babel/standalone de support.js, pixi 8.22.0). VERSION = AAAAMMJJ-<8 hex de sha256 des contenus>.
Sort avec le code 1 si un fichier cité manque. sw.js et sw-precache.js ne sont jamais listés (le navigateur les gère)."""
import datetime, hashlib, json, os, re, sys

RACINE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
DEMO = os.path.join(RACINE, 'demo')
PAGES = ['Prototype.dc.html', 'index.html']
IMAGES_EXT = ('.webp', '.png', '.jpg', '.jpeg', '.gif', '.svg', '.avif')
JAMAIS = {'sw.js', 'sw-precache.js'}


def lire(chemin):
    with open(os.path.join(DEMO, chemin), encoding='utf8', errors='ignore') as f:
        return f.read()


def existe(chemin):
    return os.path.isfile(os.path.join(DEMO, chemin.split('?')[0]))


def lister(dossier, filtre=lambda f: True):
    out = []
    base = os.path.join(DEMO, dossier)
    for r, _, fs in os.walk(base):
        for x in fs:
            rel = os.path.relpath(os.path.join(r, x), DEMO).replace(os.sep, '/')
            if filtre(rel):
                out.append(rel)
    return out


cites = {}   # chemin (avec ?v=) → d'où il vient
cdn = []


def citer(u, origine):
    u = u.strip()
    if not u or u.startswith(('#', 'data:', 'mailto:', 'javascript:')):
        return
    if u.startswith('http'):
        if re.search(r'(unpkg\.com|cdn\.jsdelivr\.net)', u) and u not in cdn:
            cdn.append(u)
        return
    u = re.sub(r'^\./', '', u)
    if u.split('?')[0] in JAMAIS:
        return
    cites.setdefault(u, origine)


for p in PAGES:
    s = lire(p)
    cites.setdefault(p, 'page')
    for m in re.finditer(r'ext-resource-dependency" content="([^"]+)" data-resource-id="([^"]+)"', s):
        citer(m.group(2) if m.group(2).split('?')[0] == m.group(1) else m.group(1), p)
    for m in re.finditer(r'<(?:link|script)\b[^>]*?\b(?:href|src)="([^"]+)"', s):
        citer(m.group(1), p)
    for m in re.finditer(r"\['([^']+\.(?:js|css)\?v=\d+)','[A-Za-z_]+'\]", s):   # le chargeur du helmet
        citer(m.group(1), p + ' (helmet)')
    for m in re.finditer(r"un\('([^']+)'", s):   # sceneScripts()
        citer(m.group(1), p + ' (sceneScripts)')

# support.js : les 3 CDN de React, ReactDOM et Babel
if existe('support.js'):
    for m in re.finditer(r'"(https://unpkg\.com/[^"]+\.js)"', lire('support.js')):
        citer(m.group(1), 'support.js')

# La scène : athena-scene.json et ses sous-JSON (les images, elles, viennent de la liste de assets/scene/)
if existe('commun/athena-scene.json'):
    sc = json.loads(lire('commun/athena-scene.json'))
    base = os.path.normpath(os.path.join('commun', sc.get('base', '../assets/scene/'))).replace(os.sep, '/') + '/'
    citer('commun/athena-scene.json', 'scène')
    for m in re.finditer(r'"([^"]+\.json)"', lire('commun/athena-scene.json')):
        citer(base + m.group(1), 'athena-scene.json')

for f in lister('assets/scene'):
    citer(f, 'assets/scene/')
for f in lister('commun/polices'):
    citer(f, 'commun/polices/')
for f in lister('icones'):
    citer(f, 'icones/')
citer('manifest.webmanifest', 'manifest')
# La coquille nommée par la spec § 3
for f in ['athena-v1-rapport.js'] + lister('commun', lambda f: f.count('/') == 1 and f.endswith(('.js', '.css', '.json'))):
    if f.split('/')[-1] not in JAMAIS and not any(c.split('?')[0] == f for c in cites):
        citer(f, 'spec § 3')

manquants = sorted(u for u in cites if not existe(u))
if manquants:
    for u in manquants:
        print(f'ERREUR fichier cité absent : {u} (cité par {cites[u]})', file=sys.stderr)
    sys.exit(1)

images = sorted(u for u in cites if u.startswith('assets/scene/') and u.lower().endswith(IMAGES_EXT))
coquille = sorted(u for u in cites if u not in images)
attendus = ['react@18.3.1/umd/react.production.min.js', 'react-dom@18.3.1/umd/react-dom.production.min.js', '@babel/standalone@7.29.0/babel.min.js', 'pixi.js@8.22.0/dist/pixi.min.js']
if not all(any(u.endswith(a) for u in cdn) for a in attendus) or len(cdn) != 4:
    print('ERREUR les 4 CDN attendus (react, react-dom, @babel/standalone, pixi 8.22.0) ne sont pas tous trouvés : ' + ', '.join(cdn), file=sys.stderr)
    sys.exit(1)

h = hashlib.sha256()
for u in coquille + images:
    h.update(u.encode('utf8') + b'\0')
    with open(os.path.join(DEMO, u.split('?')[0]), 'rb') as f:
        h.update(f.read())
    h.update(b'\0')
version = datetime.date.today().strftime('%Y%m%d') + '-' + h.hexdigest()[:8]

def tableau(nom, liste):
    # Sans virgule finale : le tableau reste du JSON valide (le test et le vérificateur le relisent avec JSON.parse / json.loads)
    return 'self.ATHENA_' + nom + ' = [\n' + ',\n'.join('  ' + json.dumps(u, ensure_ascii=False) for u in liste) + '\n];\n'

sortie = ('/* Généré par outils/generer-precache.py — ne pas modifier à la main. Lu par sw.js (importScripts).\n'
          ' * VERSION = date + empreinte des fichiers listés : elle change à chaque déploiement qui touche la coquille ou les images. */\n'
          "self.ATHENA_VERSION = '" + version + "';\n" + tableau('COQUILLE', coquille) + tableau('IMAGES', images) + tableau('CDN', cdn))
# Les crochets vides restent valides : "[\n];" → "[];"
sortie = sortie.replace('[\n];', '[];')
with open(os.path.join(DEMO, 'sw-precache.js'), 'w', encoding='utf8', newline='\n') as f:
    f.write(sortie)
taille = sum(os.path.getsize(os.path.join(DEMO, u.split('?')[0])) for u in coquille + images)
print(f'✓ demo/sw-precache.js : version {version} · coquille {len(coquille)} fichiers · images {len(images)} · CDN {len(cdn)} · {taille // 1024} Ko au total')
