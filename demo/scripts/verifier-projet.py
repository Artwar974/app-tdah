#!/usr/bin/env python3
"""Vérifie le projet Athéna sans le lancer. Usage : python3 -I verifier-projet.py DOSSIER_DU_PROJET

Contrôles : syntaxe des scripts (si node est installé), ressources déclarées qui n'existent pas,
fichiers locaux cités par les pages qui n'existent pas, versions de scripts différentes d'une page à l'autre,
polices chargées depuis Google, restes du « feu qui grandit », pages qui ne sont dans aucun espace de la barre,
dossiers lourds jamais lus par les pages, la PWA (manifest, précache du service worker), les notifications (la permission demandée à un seul endroit,
jamais new Notification). Sort avec le code 1 s'il y a au moins une erreur.
"""
import os, re, sys, glob, json, shutil, subprocess, collections

racine = sys.argv[1] if len(sys.argv) > 1 else '.'
os.chdir(racine)
erreurs, alertes = [], []

def lire(p):
    return open(p, encoding='utf8', errors='ignore').read()

pages = sorted(glob.glob('*.dc.html'))
scripts = sorted(glob.glob('*.js') + glob.glob('commun/*.js') + glob.glob('tower-defense/*.js'))
outils = sorted(glob.glob('outils/*.html'))
fichiers = set()
for r, d, f in os.walk('.'):
    for x in f:
        fichiers.add(os.path.relpath(os.path.join(r, x), '.').replace(os.sep, '/'))

# 1 · syntaxe
if shutil.which('node'):
    for s in scripts:
        r = subprocess.run(['node', '--check', s], capture_output=True, text=True)
        if r.returncode:
            erreurs.append(f'Syntaxe : {s} : {r.stderr.strip().splitlines()[0] if r.stderr else "erreur"}')
else:
    alertes.append('node absent : syntaxe des scripts non vérifiée')

# 2 · ressources et fichiers cités
for p in pages + outils:
    s = lire(p)
    base = '../' if p.startswith('outils/') and '<base href="../">' in s else ''
    for m in re.finditer(r'ext-resource-dependency" content="([^"]+)" data-resource-id="([^"]+)"', s):
        if m.group(1) not in fichiers:
            erreurs.append(f'Ressource manquante : {p} déclare {m.group(1)}')
    ids = re.findall(r'data-resource-id="([^"]+)"', s)
    for k, v in collections.Counter(ids).items():
        if v > 1:
            erreurs.append(f'Identifiant de ressource en double : {p} · {k}')
    for m in re.finditer(r'(?:src|href)="([^"#?]+)(?:\?[^"]*)?"', s):
        u = m.group(1)
        if u.startswith(('http', 'data:', 'mailto', '#', './support', '..')) or u.endswith('.dc.html') or '{{' in u or "'" in u:
            continue
        chemin = u if base else os.path.normpath(os.path.join(os.path.dirname(p), u)).replace(os.sep, '/')
        if chemin not in fichiers and u not in fichiers:
            erreurs.append(f'Fichier cité absent : {p} → {u}')

# 3 · versions
versions = collections.defaultdict(lambda: collections.defaultdict(set))
for p in pages:
    if 'Tower defense' in p:   # les Incursions ne se touchent pas (règle 1) : leurs versions restent celles d'avant le 14/10
        continue
    s = lire(p)
    for m in re.finditer(r'((?:commun/|tower-defense/)?[\w.-]+\.(?:js|css))\?v=(\d+)', s):
        versions[m.group(1)][m.group(2)].add(p)
for f, v in versions.items():
    if len(v) > 1:
        detail = ' ; '.join(f'v={k} dans {", ".join(sorted(x))}' for k, x in sorted(v.items()))
        erreurs.append(f'Versions différentes pour {f} : {detail}')

# 4 · polices Google
for p in pages + scripts + glob.glob('commun/*.css'):
    s = lire(p)
    if 'fonts.googleapis.com' in s or 'fonts.gstatic.com' in s:
        alertes.append(f'Police chargée depuis Google : {p}')

# 5 · restes du feu qui grandit (hors historique daté)
termes = re.compile(r'(le feu grandit|fait grandir le feu|grandir le feu|stade du feu|étape du feu|le feu grossit|feu qui grandit)', re.I)
for p in pages + scripts:
    for i, ligne in enumerate(lire(p).splitlines(), 1):
        m = termes.search(ligne)
        if m and not re.search(r"retiré|retire|retrait|historique|\d\d/\d\d/2026|remplac", ligne, re.I):
            alertes.append(f'Reste « feu qui grandit » : {p}:{i} · « {m.group(0)} »')

# 6 · espaces de la barre
h = lire('commun/hub-v1.js') if os.path.exists('commun/hub-v1.js') else ''
cites = set(re.findall(r"\['([^']+\.dc\.html)'", h))
for p in pages:
    if p not in cites and 'Fontaine' not in p:
        alertes.append(f'Page absente de la barre de navigation : {p}')

# 7 · poids
for d in ('uploads', 'screenshots'):
    if os.path.isdir(d):
        t = sum(os.path.getsize(os.path.join(r, x)) for r, _, f in os.walk(d) for x in f)
        alertes.append(f'Dossier {d}/ : {t // 1024 // 1024} Mo à la racine (à ranger dans Archives/)')


# 8 · passe du 20/10 (PixiJS 8.22.0, un seul moteur) : les pages qui chargent PixiJS demandent la même version ; aucune page de la racine ne charge
#     l'ancien moteur du camp ; aucune page ni athena-v1.js ne cite les anciens dossiers d'images (hors Incursions, règle 1) ; le module des avatars reste
if not os.path.exists('commun/athena-avatars.js'):
    erreurs.append('commun/athena-avatars.js absent')
v1 = lire('athena-v1.js') if os.path.exists('athena-v1.js') else ''
if "E('ob-avatar'" not in v1:
    alertes.append("athena-v1.js : l'écran « ob-avatar » n'est pas encore ajouté (node outils/appliquer-avatars.js athena-v1.js)")
proto = lire('Prototype.dc.html') if os.path.exists('Prototype.dc.html') else ''
racine_html = sorted(glob.glob('*.html'))
pixi = collections.defaultdict(set)
for p in racine_html + outils:
    for m in re.finditer(r'pixi\.js@([\d.]+)/dist/pixi\.min\.js', lire(p)):
        pixi[m.group(1)].add(p)
if len(pixi) > 1:
    erreurs.append('PixiJS en plusieurs versions : ' + ' ; '.join(f'{k} dans {", ".join(sorted(x))}' for k, x in sorted(pixi.items())))
elif pixi and '8.22.0' not in pixi:
    alertes.append('PixiJS : la version chargée n’est pas 8.22.0 (' + ', '.join(pixi) + ')')
for p in racine_html:
    if 'Tower defense' in p:
        continue
    s = lire(p)
    for mod in ('athena-decor.js', 'athena-objets-animes.js', 'athena-camp-lumiere.js', 'athena-particules.js'):
        if re.search(r'(?:src|content)="[^"]*' + re.escape(mod), s):
            erreurs.append(f'{p} charge encore l’ancien moteur du camp : {mod}')
    for m in re.finditer(r'assets/(?:optim|camp|housing|decor)/', s):
        erreurs.append(f'{p} cite encore un ancien dossier d’images : {m.group(0)}')
        break
for p in ('athena-v1.js', 'athena-v1-rapport.js', 'commun/hub-v1.js'):
    if os.path.exists(p) and re.search(r'assets/(?:optim|camp|housing|decor)/', lire(p)):
        erreurs.append(f'{p} cite encore un ancien dossier d’images (assets/optim, camp, housing ou decor)')
for f in ('assets/scene/objets/objets.webp', 'assets/scene/objets/tente1.webp', 'assets/scene/fond/fond_jour.webp', 'commun/athena-scene.json'):
    if not os.path.exists(f):
        erreurs.append(f'Image de la scène absente : {f}')

# 9 · mise à jour du 14/10 (économie bois et or)
for p in ('Prototype.dc.html', 'Mecaniques.dc.html', 'Decisions.dc.html'):
    if os.path.exists(p) and 'commun/athena-economie.js' not in lire(p):
        erreurs.append(f'{p} ne charge pas commun/athena-economie.js')
if 'V.JEU.eco =' not in v1:
    erreurs.append('athena-v1.js : V.JEU.eco absent (copie de AthenaEconomie.DEFAUT)')
if proto:
    logique = proto[proto.find('class Component'):]
    for m in re.finditer(r'(?:bois|or|xp)\s*[:+\-*]=?\s*\d{2,}|\d{2,}\s*(?:bois|or)\b', logique):
        alertes.append(f'Prototype.dc.html : nombre de l\'économie écrit en dur ? « {m.group(0)} »')
for p in pages + ['athena-v1.js', 'athena-v1-rapport.js']:
    if 'Tower defense' in p or not os.path.exists(p):
        continue
    for i, ligne in enumerate(lire(p).splitlines(), 1):
        if re.search(r'(chouette[^.;\n]{0,40}compagnon|compagnon[^.;\n]{0,25}chouette)', ligne, re.I) and not re.search(r"Ni la chouette|ni chouette|est le guide|le guide|remplac|réservé|D\('compagnon'|ecran: 'compagnon'", ligne, re.I):
            erreurs.append(f'« compagnon » désigne la chouette : {p}:{i}')
partis = ('Décider.dc.html', 'Explorer.dc.html', 'Fondations.dc.html', 'La V1.dc.html', 'Coulisses/', '_gen/', '_shots/', '_motion/')
for p in pages + scripts:
    if 'Tower defense' in p:
        continue
    for m in re.finditer(r'(?:src|href)\s*=\s*["\']([^"\'#?]+)', lire(p)):
        u = m.group(1)
        if any(u.startswith(x) or u == x for x in partis):
            erreurs.append(f'{p} pointe vers un fichier parti aux Archives : {u}')

# 10 · passe du 19/10 : chaque écran dit son état de nouveautés ; aucun mot interdit dans les textes ; aucun nom des références ;
#      aucune icône de repli dans les journées types et les catégories (deux jeux) ; le moteur du camp garde son API
if shutil.which('node') and os.path.exists('athena-v1.js'):
    controle = r'''
const fs = require('fs'), vm = require('vm');
const W = { navigator: {}, document: { currentScript: null, addEventListener() {}, dispatchEvent() {}, querySelectorAll() { return []; }, createElement() { return { style: {} }; }, head: { appendChild() {} } }, setTimeout() {}, matchMedia: null, CustomEvent: function () {} }; W.window = W;
const ctx = vm.createContext(W);
for (const f of ['athena-v1.js', 'commun/athena-icones.js', 'commun/athena-icones-figures.js']) vm.runInContext(fs.readFileSync(f, 'utf8'), ctx);
const V = W.ATHENA_V1, I = W.AthenaIcones, F = (W.ATHENA_FIGURES || {}).FIGURES || {}, out = [];
V.ECRANS.forEach(e => { if (!/(^|&)nouv=/.test(e.q || '')) out.push('ERREUR Écran sans état de nouveautés (nouv=) : ' + e.id); });
const norm = s => String(s).toLowerCase().replace(/[’']/g, '’'), M = V.MOTS_INTERDITS.map(norm), OK = ['rien n’est perdu', 'rien ne se perd'];
Object.keys(V.TEXTES).forEach(k => { const v = V.TEXTES[k][1], L = typeof v === 'object' ? Object.values(v) : [v]; L.forEach(s => { let t = norm(s); OK.forEach(o => { t = t.split(o).join(' '); }); M.forEach(m => { if (t.includes(m)) out.push('ERREUR Mot interdit « ' + m + ' » dans le texte ' + k); }); }); });
const REF = ['aldwin', 'le premier pas', 'taverne', 'cœurs de feu', 'coeurs de feu', 'super pixelio', 'pixelio'];
Object.keys(V.TEXTES).forEach(k => { const v = V.TEXTES[k][1], L = typeof v === 'object' ? Object.values(v) : [v]; L.forEach(s => { const t = norm(s); REF.forEach(r => { if (t.includes(r)) out.push('ERREUR Nom d’une référence « ' + r + ' » dans le texte ' + k); }); if (/\bBâtisseur\b/.test(String(s))) out.push('ERREUR « Bâtisseur » (archétype des références) dans le texte ' + k); }); });
const icones = new Set(); Object.values(V.JOURNEES).forEach(L => L.forEach(q => icones.add(q[2]))); Object.values(V.ICONES_CAT).forEach(L => L.forEach(n => icones.add(n)));
icones.forEach(n => { if (!I.connu(n)) out.push('ERREUR Icône de repli dans la Veillée : ' + n); if (!F[n]) out.push('ERREUR Icône absente des Figures : ' + n); });
console.log(out.join('\n'));
'''
    r = subprocess.run(['node', '-e', controle], capture_output=True, text=True)
    if r.returncode:
        erreurs.append('Contrôle du 19/10 impossible : ' + (r.stderr.strip().splitlines()[-1] if r.stderr else 'erreur node'))
    for ligne in r.stdout.splitlines():
        if ligne.startswith('ERREUR '):
            erreurs.append(ligne[7:])
if os.path.exists('commun/athena-scene.js'):
    sc = lire('commun/athena-scene.js') + (lire('commun/athena-scene.json') if os.path.exists('commun/athena-scene.json') else '')
    for f in ('pause()', 'reprendre()', 'emettre', 'on(nom, f)', 'ajouter', 'retirer', 'definir', 'element:', 'boite:', 'compagnon:', 'elements:', 'detruire()', 'lumiere:', 'reglages:', 'deplacer:', 'depuisTelephone', 'elementDepuisCamp'):   # 20/10 · règle 2
        if f not in sc:
            erreurs.append(f'commun/athena-scene.js : l’API du moteur a perdu « {f} »')
    for ev in ('quete-validee', 'sommet', 'expedition-depart', 'expedition-retour', 'etincelle-recue', 'toucher-sol', 'bateau-au-large', 'bateau-accoste', 'butin-depose', 'compagnon-parti'):
        if ev not in sc:
            erreurs.append(f'commun/athena-scene.js : l’événement « {ev} » a disparu')

# 11 · PWA (passe du 20/10, mobile) : manifest.webmanifest est du JSON valide dont chaque icône existe ; chaque fichier de sw-precache.js existe ;
#      sw.js importe ./sw-precache.js ; le précache est à jour : chaque ressource ?v= du Prototype y est, à la même version (sinon le téléphone garderait
#      l'ancienne) — il se refait avec python3 -I outils/generer-precache.py
if proto:
    REFAIRE = 'relancer python3 -I outils/generer-precache.py'
    local = lambda u: os.path.normpath(u.split('?')[0]).replace(os.sep, '/')
    try:
        man = json.loads(lire('manifest.webmanifest'))
        if not isinstance(man, dict):
            raise ValueError('ce n’est pas un objet')
        icones = [i for i in man.get('icons') or [] if isinstance(i, dict)]
        icones += [i for r in man.get('shortcuts') or [] if isinstance(r, dict) for i in r.get('icons') or [] if isinstance(i, dict)]
        if not icones:
            erreurs.append('PWA : manifest.webmanifest sans icône')
        for i in icones:
            if local(i.get('src') or '') not in fichiers:
                erreurs.append(f'PWA : manifest.webmanifest cite une icône absente : {i.get("src")}')
    except FileNotFoundError:
        erreurs.append('PWA : manifest.webmanifest absent')
    except ValueError as e:
        erreurs.append(f'PWA : manifest.webmanifest n’est pas du JSON valide ({e})')
    pre = lire('sw-precache.js') if os.path.exists('sw-precache.js') else ''
    if not pre:
        erreurs.append(f'PWA : sw-precache.js absent ({REFAIRE})')
    else:
        if not re.search(r"self\.ATHENA_VERSION\s*=\s*'\d{8}-[0-9a-f]{8}'", pre):
            erreurs.append(f'PWA : sw-precache.js sans self.ATHENA_VERSION AAAAMMJJ-xxxxxxxx ({REFAIRE})')
        enCache = []
        for nom in ('COQUILLE', 'IMAGES', 'CDN'):
            m = re.search(r'self\.ATHENA_' + nom + r'\s*=\s*(\[[\s\S]*?\]);', pre)
            try:
                liste = json.loads(m.group(1)) if m else None
            except ValueError:
                liste = None
            if not isinstance(liste, list):
                erreurs.append(f'PWA : sw-precache.js : self.ATHENA_{nom} absent ou illisible ({REFAIRE})')
            elif nom != 'CDN':
                enCache += [u for u in liste if isinstance(u, str)]
        for u in enCache:
            if local(u) not in fichiers:
                erreurs.append(f'PWA : sw-precache.js cite un fichier absent : {u} ({REFAIRE})')
        connus, vus = {local(u): u for u in enCache}, set()
        for m in re.finditer(r'(?<![\w./-])((?:[\w-]+/)*[\w.-]+\.(?:js|css))\?v=(\d+)', proto):
            attendu = m.group(1) + '?v=' + m.group(2)
            if attendu in enCache or attendu in vus:
                continue
            vus.add(attendu)
            if m.group(1) in connus:
                erreurs.append(f'PWA : sw-precache.js en retard : {connus[m.group(1)]} dans le précache, {attendu} dans le Prototype ({REFAIRE})')
            else:
                erreurs.append(f'PWA : sw-precache.js en retard : {attendu} (Prototype) n’est pas dans le précache ({REFAIRE})')
    if not os.path.exists('sw.js') or not re.search(r"importScripts\(\s*['\"]\./sw-precache\.js['\"]\s*\)", lire('sw.js')):
        erreurs.append('PWA : sw.js absent ou sans importScripts(\'./sw-precache.js\')')

# 12 · notifications (passe du 20/10, mobile, tâche 4) : la permission n'est demandée que par commun/athena-mobile.js, depuis un geste (spec § 4) ;
#      jamais le constructeur Notification (« Illegal constructor » sur Chrome Android) : tout passe par le service worker (AthenaMobile.notifier)
DEMANDE = 'commun/athena-mobile.js'
for f in sorted(fichiers):
    if f.startswith('Archives/') or not f.endswith(('.js', '.html')):
        continue
    t = lire(f)
    if 'requestPermission' in t and f != DEMANDE:
        erreurs.append(f'Notifications : {f} demande la permission (requestPermission) : seul {DEMANDE} le fait, sur un geste')
    if re.search(r'new\s+Notification\s*\(', t):
        erreurs.append(f'Notifications : {f} utilise new Notification( (refusé sur Chrome Android) : passer par AthenaMobile.notifier')
if os.path.exists(DEMANDE) and 'requestPermission' not in lire(DEMANDE):
    erreurs.append(f'Notifications : {DEMANDE} ne demande plus la permission (requestPermission) : la carte du Carnet ne pourra pas l’allumer')

print(f'Pages : {len(pages)} · outils : {len(outils)} · scripts : {len(scripts)}')
for e in erreurs: print('ERREUR ', e)
for a in alertes: print('ALERTE ', a)
print(f'{len(erreurs)} erreur(s), {len(alertes)} alerte(s)')
sys.exit(1 if erreurs else 0)
