// Socle · le dossier demo/ est complet, le vérificateur du projet est à 0/0, et la page d'entrée mène au Prototype.
// Lancer : bash test/_serveur.sh && node test/socle.js
const fs = require('fs');
const path = require('path');
const { spawnSync } = require('child_process');
const { URL, lancer, ouvrir, ok, bilan } = require('./_commun.js');

const RACINE = path.join(__dirname, '..');
const DEMO = path.join(RACINE, 'demo');
const lire = (f) => { try { return fs.readFileSync(path.join(DEMO, f), 'utf8'); } catch (e) { return ''; } };
const existe = (f) => fs.existsSync(path.join(DEMO, f));

(async () => {
  // 1 · la page d'entrée et les fichiers qui font tenir la démo
  ok('1 demo/index.html redirige vers Prototype.dc.html', lire('index.html').includes('url=Prototype.dc.html'));
  for (const f of ['Prototype.dc.html', 'commun/athena-qr.js', 'commun/athena-scene.js', 'assets/scene/objets/objets.webp', 'Archives/INDEX.md']) {
    ok('1 demo/' + f + ' existe', existe(f));
  }

  // 2 · le vérificateur du projet
  const v = spawnSync('python3', ['-I', path.join('demo', 'scripts', 'verifier-projet.py'), 'demo'], { cwd: RACINE, encoding: 'utf8' });
  const sortie = (v.stdout || '') + (v.stderr || '');
  ok('2 verifier-projet.py : code 0 et « 0 erreur(s), 0 alerte(s) »', v.status === 0 && sortie.includes('0 erreur(s), 0 alerte(s)'), 'code=' + v.status + ' ' + (sortie.trim().split('\n').pop() || ''));

  // 3 · dans un navigateur : la racine mène au Prototype, la scène apparaît, la console reste muette
  const b = await lancer();
  const p = await ouvrir(b, '', { delai: 1500 });
  await p.waitForURL(/Prototype\.dc\.html/, { timeout: 15000 }).catch(() => {});
  ok('3 http://localhost:8766/ redirige vers Prototype.dc.html', /Prototype\.dc\.html/.test(p.url()), p.url());
  const t0 = Date.now();
  const scene = await p.waitForSelector('[data-scene]', { timeout: 30000 }).then(() => true).catch(() => false);
  ok('3 [data-scene] apparaît en moins de 30 s', scene, ((Date.now() - t0) / 1000).toFixed(1) + ' s après la redirection');
  await p.waitForTimeout(1500);
  ok('3 aucune erreur de console', p.errs.length === 0, p.errs.join(' | '));
  await p.close(); await b.close();

  process.exit(bilan('socle') ? 1 : 0);
})().catch((e) => { console.error(e); process.exit(2); });
