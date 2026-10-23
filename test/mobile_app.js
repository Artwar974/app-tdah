// Le mode app (21/10) : ?app=1 (après la page d'installation du QR) ouvre la V1 seule, en plein écran, comme une app — ni barre du hub, ni panneau de réglages, ni cadre.
// Contrôles sur deux téléphones (Pixel 10 Pro ≈ 412 × 915, petit 360 × 640), l'heure du téléphone, l'app installée (?source=pwa),
// le Prototype ouvert seul (sans ?app=1 : le hub, inchangé), et ce que Cloudflare ne publie pas (demo/.assetsignore).
process.chdir(__dirname);
const fs = require('fs');
const { lancer, ouvrir, ok, bilan } = require('./_commun');
// window.__logique() : la logique du Prototype, trouvée par la fibre React de la maquette (même méthode que mobile_horloge.js)
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find((x) => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while (f) { const s = f.stateNode; if (s && s.logic && typeof s.logic.modeApp === 'function') return s.logic; f = f.return; } return null; };`;
const pret = (p) => p.waitForFunction(() => document.querySelector('[data-screen-label="Prototype V1"]') && window.__logique && window.__logique() && window.__logique().state.pret, null, { timeout: 60000 }).then(() => true, () => false);
const mesure = (p) => p.evaluate(() => {
  const t = document.getElementById('telephone'), r = t && t.getBoundingClientRect(), L = window.__logique && window.__logique();
  return { nav: !!document.querySelector('hub-nav'), panneau: !!document.getElementById('reglages'), w: innerWidth, h: innerHeight,
    tel: r ? { x: Math.round(r.x), y: Math.round(r.y), w: Math.round(r.width), h: Math.round(r.height) } : null,
    defile: document.documentElement.scrollWidth > innerWidth + 1 || document.documentElement.scrollHeight > innerHeight + 1,
    app: document.documentElement.dataset.app || '', horloge: L ? L.state.horloge : null, url: location.pathname + location.search,
    cadre: (() => { const ph = document.querySelector('[data-screen-label="Prototype V1"]'); return ph ? getComputedStyle(ph).boxShadow : ''; })() };
});
(async () => {
  const b = await lancer();
  for (const [nom, vp] of [['Pixel 10 Pro', { width: 412, height: 915 }], ['petit', { width: 360, height: 640 }]]) {
    // l'adresse du site ouvre d'abord la page d'installation (test/mobile_installer.js) ; « Ouvrir sans installer » mène ici
    const p = await ouvrir(b, 'Prototype.dc.html?app=1', { viewport: vp, delai: 0, init: LOGIQUE, contexte: { isMobile: true, hasTouch: true, deviceScaleFactor: 2 } });
    const pr = await pret(p); await p.waitForTimeout(2500);
    const m = await mesure(p);
    ok(nom + ' · ?app=1 (« Ouvrir sans installer ») ouvre le Prototype en mode app', pr && m.url === '/Prototype.dc.html' + '?app=1' && m.app === '1', m.url);
    ok(nom + ' · ni barre du hub, ni panneau de réglages', !m.nav && !m.panneau, 'nav=' + m.nav + ' panneau=' + m.panneau);
    const plein = m.tel && (Math.abs(m.tel.w - m.w) <= 2 || Math.abs(m.tel.h - m.h) <= 2) && m.tel.x >= -1 && m.tel.y >= -1 && m.tel.x + m.tel.w <= m.w + 1 && m.tel.y + m.tel.h <= m.h + 1;
    ok(nom + ' · le téléphone remplit l’écran (largeur ou hauteur), sans déborder ni défiler', plein && !m.defile, JSON.stringify(m.tel) + ' écran ' + m.w + '×' + m.h + ' défile=' + m.defile);
    ok(nom + ' · aucun cadre de téléphone autour', !m.cadre || m.cadre === 'none', m.cadre);
    ok(nom + ' · l’heure suit le téléphone', m.horloge === 'telephone', m.horloge);
    await p.screenshot({ path: 'mobile_app_' + vp.width + '.png' }).catch(() => {});
    ok(nom + ' · aucune erreur', p.errs.length === 0, p.errs.join(' | '));
    await p.close();
  }
  // l'app installée (start_url du manifest) : le même mode
  let p = await ouvrir(b, 'Prototype.dc.html?source=pwa', { viewport: { width: 412, height: 915 }, delai: 0, init: LOGIQUE });
  await pret(p); await p.waitForTimeout(1500);
  let m = await mesure(p);
  ok('?source=pwa (l’app installée) · mode app, sans barre ni panneau', m.app === '1' && !m.nav && !m.panneau, JSON.stringify({ app: m.app, nav: m.nav, panneau: m.panneau }));
  await p.close();
  // le Prototype ouvert seul (le hub) : inchangé
  p = await ouvrir(b, 'Prototype.dc.html#ecran=camp&heure=10.25&nouv=tout', { viewport: { width: 1280, height: 950 }, delai: 0, init: LOGIQUE });
  await pret(p); await p.waitForTimeout(2500);
  m = await mesure(p);
  ok('Prototype sans ?app=1 · le hub garde sa barre, son panneau et son cadre', m.app === '' && m.nav && m.panneau && m.cadre && m.cadre !== 'none', JSON.stringify({ nav: m.nav, panneau: m.panneau }));
  ok('Prototype sans ?app=1 · aucune erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close(); await b.close();
  // ce que Cloudflare ne publie pas : les pages de travail, jamais un fichier de l'app
  const pats = fs.readFileSync('../demo/.assetsignore', 'utf8').split('\n').map((l) => l.trim()).filter((l) => l && !l.startsWith('#'));
  const ignore = (f) => pats.some((x) => (x.endsWith('/') ? f.startsWith(x) : f === x));
  const pre = fs.readFileSync('../demo/sw-precache.js', 'utf8'), L = [...pre.matchAll(/"([^"]+)"/g)].map((x) => x[1]).filter((x) => !/^https?:/.test(x)).map((x) => x.replace(/\?.*$/, ''));
  ok('.assetsignore · aucun fichier mis en cache par l’app n’est écarté', L.length > 100 && !L.some(ignore), L.filter(ignore).join(', '));
  ok('.assetsignore · les pages de travail sont écartées (Accueil, Mobile test, docs, outils)', ['Accueil.dc.html', 'Mobile-test.dc.html', 'Ecrans.dc.html', 'passes/x', 'outils/x', 'Archives/x'].every(ignore));
  process.exit(bilan('mobile_app') ? 1 : 0);
})();
