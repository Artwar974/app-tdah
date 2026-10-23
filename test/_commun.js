// Socle commun des contrôles : navigateur, ouverture d'une page de la démo, comptage des ✓/✗.
// Le serveur de la démo (bash test/_serveur.sh) sert demo/ sur http://localhost:8766/.
// Les CDN (unpkg, jsdelivr) sont servis depuis les copies locales de ATHENA_NPM quand le fichier existe (routerCdn),
// sinon la requête passe. Toutes les suites prennent ici MAP, ESPION, routerCdn et lancer : un seul exemplaire à tenir à jour.
const fs = require('fs');
const path = require('path');
const { chromium } = require('playwright');

const URL = 'http://localhost:8766/';
const ARGS = ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'];

// Les seules versions que les pages de demo/ chargent (PixiJS 8.22.0, Babel 7.29.0, React 18.3.1).
const NPM = (process.env.ATHENA_NPM || '/tmp/claude-0/-home-user/50291ce0-eb59-5f32-9466-493d6988abfd/scratchpad/test/npm/').replace(/\/?$/, '/');
const MAP = {
  'react@18.3.1/umd/react.production.min.js': NPM + 'react-18.3.1/package/umd/react.production.min.js',
  'react-dom@18.3.1/umd/react-dom.production.min.js': NPM + 'react-dom-18.3.1/package/umd/react-dom.production.min.js',
  '@babel/standalone@7.29.0/babel.min.js': NPM + 'babel-standalone-7.29.0/package/babel.min.js',
  'pixi.js@8.22.0/dist/pixi.min.js': NPM + 'pixi.js-8.22.0/package/dist/pixi.min.js',
};

// Pose window.__scene dès que la page monte la scène (AthenaScene.monter), pour que les contrôles la pilotent,
// et note chaque événement émis par la scène dans window.__events ([nom, détail]).
const ESPION = `(() => { let v = null; window.__events = []; Object.defineProperty(window, 'AthenaScene', { configurable: true, get() { return v; }, set(x) { v = x; if (x && x.monter && !x.__esp) { const m = x.monter; x.monter = async (...a) => { const sc = await m(...a); window.__scene = sc; const em = sc.emettre; sc.emettre = (n, d) => { window.__events.push([n, d || {}]); return em.call(sc, n, d); }; return sc; }; x.__esp = true; } } }); })();`;

// o : options de lancement en plus (ex. { channel: 'chromium' } : le Chromium complet en mode sans fenêtre, le seul qui montre des notifications).
const lancer = (o) => chromium.launch(Object.assign({ args: ARGS }, o));

// Sert MAP[k] à la place du CDN quand la copie locale existe ; sinon laisse passer la requête (jamais d'ENOENT non géré).
const routerCdn = (p) => p.route(/(unpkg\.com|cdn\.jsdelivr\.net)/, (r) => {
  const u = r.request().url();
  const k = Object.keys(MAP).find((k) => u.endsWith(k) && fs.existsSync(MAP[k]));
  if (k) r.fulfill({ path: MAP[k], contentType: 'text/javascript' }); else r.continue();
});

// Ouvre URL + chemin ; p.errs reçoit les erreurs de page et de console (200 caractères au plus chacune).
// o.sw : les CDN sont routés sur le contexte de la page (et non sur la page), pour que les requêtes du service worker passent aussi par les copies
// locales (la suite pose PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS=1 avant de charger Playwright) ; o.contexte : options du contexte en plus ;
// o.avant(p) : appelé avant la navigation (une route ou un écouteur de plus).
const ouvrir = async (b, chemin, o) => {
  const c = Object.assign({ viewport: { width: 390, height: 844 }, delai: 4000, permissions: [], init: '', sw: false, contexte: {}, avant: null }, o);
  const p = await b.newPage(Object.assign({ viewport: c.viewport, permissions: c.permissions }, c.contexte));
  const errs = [];
  await p.addInitScript(ESPION);
  if (c.init) await p.addInitScript(c.init);
  await routerCdn(c.sw ? p.context() : p);
  if (c.avant) await c.avant(p);
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.goto(URL + (chemin || ''), { waitUntil: 'load' });
  if (c.delai) await p.waitForTimeout(c.delai);
  p.errs = errs;
  return p;
};

const lignes = [];
const res = [];
const ok = (nom, cond, info) => {
  const l = (cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '');
  res.push(!!cond); lignes.push(l); console.log(l);
};

// Écrit test/logs/<suite>.log et renvoie le nombre d'échecs.
const bilan = (suite) => {
  const echecs = res.filter((x) => !x).length;
  const resume = suite + ' : ' + (res.length - echecs) + '/' + res.length + (echecs ? ' — ' + echecs + ' échec(s)' : ' ✓');
  console.log('\n' + resume);
  const dossier = path.join(__dirname, 'logs');
  fs.mkdirSync(dossier, { recursive: true });
  fs.writeFileSync(path.join(dossier, suite + '.log'), lignes.join('\n') + '\n\n' + resume + '\n');
  return echecs;
};

module.exports = { URL, ARGS, MAP, ESPION, lancer, routerCdn, ouvrir, ok, bilan };
