// Mobile · PWA installable : le manifest et ses icônes (tailles lues dans l'en-tête PNG), la liste du précache (chaque fichier existe), le head du Prototype,
// noindex sur toutes les pages, le vérificateur à 0/0, le workflow GitHub Pages ; dans le navigateur : service worker prêt en < 20 s, cache athena-demo-*
// avec Prototype.dc.html et support.js, rechargement hors ligne (scène ou repli, 0 pageerror), hors ligne avant précache (la navigation échoue proprement),
// section « Téléphone » du Carnet (rien, la carte « Installer » quand le navigateur propose l'installation, « Déjà installée » en mode autonome) ; règle 11
// du vérificateur (sur une copie de demo/ qu'on abîme), tunnel HTTPS, LISEZ-MOI ; une ressource ?v= d'une autre version que celle du cache passe par le
// réseau (en ligne) ou par la copie en cache (hors ligne) ; theme-color qui suit la DA ; une nouvelle version du service worker (sur une copie de demo/
// servie à part) fait paraître « Nouvelle version prête · Recharger », et « Recharger » passe à la nouvelle version.
// Lancer : bash test/_serveur.sh && node test/mobile_pwa.js
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';   // les requêtes du service worker passent par context.route (CDN servis en local) et par setOffline
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawn, spawnSync } = require('child_process');
const { URL, MAP, ESPION, lancer, ok, bilan } = require('./_commun.js');
process.chdir(__dirname);

const RACINE = path.join(__dirname, '..');
const DEMO = path.join(RACINE, 'demo');
const lire = (f) => { try { return fs.readFileSync(path.join(DEMO, f), 'utf8'); } catch (e) { return ''; } };
const existe = (f) => fs.existsSync(path.join(DEMO, f.split('?')[0]));
const PH = '[data-screen-label="Prototype V1"]';

// Dimensions d'un PNG lues dans l'en-tête IHDR (largeur aux octets 16-19, hauteur 20-23, grand-boutien), null si ce n'est pas un PNG
const dimsPng = (f) => { try { const b = fs.readFileSync(path.join(DEMO, f)); if (b.length < 24 || b.readUInt32BE(0) !== 0x89504e47) return null; return [b.readUInt32BE(16), b.readUInt32BE(20)]; } catch (e) { return null; } };

// Le service worker et la page demandent les CDN : servis depuis les copies locales de ATHENA_NPM quand elles existent, sinon la requête passe
const routerCdnContexte = (ctx) => ctx.route(/(unpkg\.com|cdn\.jsdelivr\.net)/, (r) => {
  const u = r.request().url();
  const k = Object.keys(MAP).find((k) => u.endsWith(k) && fs.existsSync(MAP[k]));
  if (k) r.fulfill({ path: MAP[k], contentType: 'text/javascript' }); else r.continue();
});

// Ouvre le Prototype dans un contexte neuf (le service worker s'enregistre par contexte) ; p.errs reçoit les erreurs de page et de console
// (o.init : un script posé avant la page ; o.url : une autre adresse que celle du serveur de la démo)
const ouvrir = async (b, hash, o) => {
  const ctx = await b.newContext({ viewport: { width: 390, height: 844 } });
  await routerCdnContexte(ctx);
  const p = await ctx.newPage();
  const errs = []; p.errs = errs; p.ctx = ctx;
  await p.addInitScript(ESPION);
  if (o && o.init) await p.addInitScript(o.init);
  p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
  p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
  await p.goto(((o && o.url) || URL) + 'Prototype.dc.html' + (hash ? '#' + hash : ''), { waitUntil: 'load' });
  await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout((o && o.delai) || 2500);
  return p;
};

// Attend que le service worker soit prêt (< 20 s), puis actif (« activated ») et qu'il contrôle la page (< 30 s de plus) ; renvoie les durées
const attendreSw = (p) => p.evaluate(() => new Promise((res) => {
  const t0 = Date.now(), out = { pret: null, actif: null };
  if (!('serviceWorker' in navigator)) return res(out);
  const delai = setTimeout(() => res(out), 20000);
  navigator.serviceWorker.ready.then(() => {
    clearTimeout(delai); out.pret = (Date.now() - t0) / 1000;
    const t1 = Date.now();
    const f = () => navigator.serviceWorker.getRegistration().then((r) => {
      if (r && r.active && r.active.state === 'activated' && navigator.serviceWorker.controller) { out.actif = (Date.now() - t1) / 1000; return res(out); }
      if (Date.now() - t1 > 30000) return res(out);
      setTimeout(f, 200);
    });
    f();
  });
}));

const scene = (p) => p.evaluate(() => { const ph = document.querySelector('[data-screen-label="Prototype V1"]'); return { scene: !!(ph && ph.querySelector('[data-scene]')), fixe: !!(ph && ph.querySelector('[data-decor="ciel"][data-fixe]')) }; });

(async () => {
  // 1 · le manifest
  let manifest = null; try { manifest = JSON.parse(lire('manifest.webmanifest')); } catch (e) {}
  const m = manifest || {};
  ok('1 manifest.webmanifest : JSON valide avec id, name et short_name', !!manifest && !!m.id && !!m.name && !!m.short_name, manifest ? m.id + ' · ' + m.name + ' · ' + m.short_name : 'absent ou invalide');
  ok('1 start_url ./Prototype.dc.html?source=pwa, scope ./, display standalone', m.start_url === './Prototype.dc.html?source=pwa' && m.scope === './' && m.display === 'standalone', [m.start_url, m.scope, m.display].join(' · '));
  // le raccourci et le clic sur une notification ouvrent l'app sans fragment (un fragment passe par appliquer(), qui remplace la sauvegarde) ; le camp est l'écran par défaut
  const rac = Array.isArray(m.shortcuts) ? m.shortcuts : [];
  ok('1 raccourci du manifest : ./Prototype.dc.html?source=pwa, sans fragment', rac.length === 1 && rac[0].url === './Prototype.dc.html?source=pwa', rac.map((r) => r.url).join(', '));
  const swTxt = lire('sw.js');
  ok('1 sw.js notificationclick : openWindow(./Prototype.dc.html?source=pwa), sans fragment ni ?ecran=', /openWindow\(PAGE \+ '\?source=pwa'\)/.test(swTxt) && /const PAGE = '\.\/Prototype\.dc\.html';/.test(swTxt) && !/\?ecran=|#ecran=/.test(swTxt.replace(/\/\*[\s\S]*?\*\//g, '')), '');
  ok('1 V.CHANGEMENTS : « noindex sur toutes les pages du hub (hors Incursions) »', lire('athena-v1.js').includes('noindex sur toutes les pages du hub (hors Incursions)') && !lire('athena-v1.js').includes('noindex sur toutes les pages.'), '');
  const icones = Array.isArray(m.icons) ? m.icons : [];
  ok('1 trois icônes dont une maskable, chaque src existe dans demo/', icones.length === 3 && icones.filter((i) => i.purpose === 'maskable').length === 1 && icones.every((i) => i.src && existe(i.src)), icones.map((i) => i.src + ' (' + (i.purpose || '') + (existe(i.src || '') ? '' : ', absent') + ')').join(', '));

  // 2 · les PNG : 192 × 192, 512 × 512, 512 × 512, 96 × 96
  for (const [f, n] of [['icones/icone-192.png', 192], ['icones/icone-512.png', 512], ['icones/icone-maskable-512.png', 512], ['icones/badge-96.png', 96]]) {
    const d = dimsPng(f);
    ok('2 ' + f + ' fait ' + n + ' × ' + n, !!d && d[0] === n && d[1] === n, d ? d.join(' × ') : 'absent ou pas un PNG');
  }

  // 3 · le précache : version, fichiers présents, 4 CDN
  const pre = lire('sw-precache.js');
  const liste = (nom) => { const mm = pre.match(new RegExp('self\\.ATHENA_' + nom + '\\s*=\\s*(\\[[\\s\\S]*?\\]);')); try { return mm ? JSON.parse(mm[1]) : null; } catch (e) { return null; } };
  const version = (pre.match(/self\.ATHENA_VERSION\s*=\s*'([^']+)'/) || [])[1] || '';
  const coquille = liste('COQUILLE') || [], images = liste('IMAGES') || [], cdn = liste('CDN') || [];
  const absents = coquille.concat(images).filter((f) => !existe(f));
  ok('3 sw-precache.js : version AAAAMMJJ-xxxxxxxx, coquille et images listées, chaque fichier existe', /^\d{8}-[0-9a-f]{8}$/.test(version) && coquille.length >= 20 && images.length >= 100 && absents.length === 0, 'version=' + version + ' coquille=' + coquille.length + ' images=' + images.length + (absents.length ? ' absents : ' + absents.slice(0, 5).join(', ') : ''));
  ok('3 sw-precache.js : les 4 CDN (react, react-dom, babel, pixi 8.22.0)', cdn.length === 4 && cdn.some((u) => /react@18\.3\.1\/umd\/react\.production/.test(u)) && cdn.some((u) => /react-dom@18\.3\.1/.test(u)) && cdn.some((u) => /@babel\/standalone@7\.29\.0/.test(u)) && cdn.some((u) => /pixi\.js@8\.22\.0\/dist\/pixi\.min\.js/.test(u)), cdn.join(' | '));
  ok('3 la coquille contient Prototype.dc.html, index.html, support.js, athena-v1.js, athena-mobile.js, manifest et icônes', ['Prototype.dc.html', 'index.html', 'support.js', 'manifest.webmanifest', 'icones/icone-192.png'].every((f) => coquille.includes(f)) && coquille.some((f) => /^athena-v1\.js(\?|$)/.test(f)) && coquille.some((f) => /^commun\/athena-mobile\.js(\?|$)/.test(f)), coquille.filter((f) => !f.startsWith('commun/') && !f.startsWith('icones/')).join(', '));
  ok('3 sw.js importe ./sw-precache.js', /importScripts\(\s*'\.\/sw-precache\.js'\s*\)/.test(lire('sw.js')), '');

  // 4 · le head du Prototype (avant support.js) et noindex sur toutes les pages
  const proto = lire('Prototype.dc.html'), head = proto.slice(0, proto.indexOf('</head>')), avant = head.slice(0, head.indexOf('support.js'));
  ok('4 head du Prototype : rel="manifest", theme-color, apple-touch-icon, robots noindex, avant support.js', /rel="manifest"/.test(avant) && /name="theme-color"/.test(avant) && /rel="apple-touch-icon"/.test(avant) && /name="robots" content="noindex"/.test(avant) && /name="mobile-web-app-capable"/.test(avant), '');
  // (la version monte à chaque tâche qui change le module : la même dans la déclaration et dans le chargeur du helmet)
  const vMob = (head.match(/data-resource-id="commun\/athena-mobile\.js\?v=(\d+)"/) || [])[1];
  ok('4 le Prototype déclare et charge commun/athena-mobile.js?v=' + vMob, /ext-resource-dependency" content="commun\/athena-mobile\.js"/.test(head) && !!vMob && proto.slice(proto.indexOf('<helmet>')).includes('commun/athena-mobile.js?v=' + vMob), '');
  const pages = fs.readdirSync(DEMO).filter((f) => /\.html$/.test(f) && !/Tower defense/.test(f)).concat(fs.readdirSync(path.join(DEMO, 'outils')).filter((f) => /\.html$/.test(f)).map((f) => 'outils/' + f));
  const sansNoindex = pages.filter((f) => !/<meta name="robots" content="noindex">/.test(lire(f)));
  ok('4 noindex dans chaque page de demo/ (hors Tower defense) : ' + pages.length + ' pages', sansNoindex.length === 0, sansNoindex.join(', '));

  // 5 · le vérificateur et le workflow
  const v = spawnSync('python3', ['-I', path.join('demo', 'scripts', 'verifier-projet.py'), 'demo'], { cwd: RACINE, encoding: 'utf8' });
  const sortie = (v.stdout || '') + (v.stderr || '');
  ok('5 verifier-projet.py : code 0 et « 0 erreur(s), 0 alerte(s) »', v.status === 0 && sortie.includes('0 erreur(s), 0 alerte(s)'), 'code=' + v.status + ' ' + (sortie.trim().split('\n').pop() || ''));
  let wf = ''; try { wf = fs.readFileSync(path.join(RACINE, '.github', 'workflows', 'pages.yml'), 'utf8'); } catch (e) {}
  ok('5 .github/workflows/pages.yml : path: demo, deploy-pages, environnement github-pages', /path:\s*demo\b/.test(wf) && /actions\/deploy-pages@v4/.test(wf) && /github-pages/.test(wf), wf ? '' : 'absent');
  ok('5 pages.yml : à la main seulement (workflow_dispatch, pas de push) ; permissions pages, id-token, contents ; checkout@v4, configure-pages@v5, upload-pages-artifact@v3', !/\n\s+push:/.test(wf) && /\n\s+workflow_dispatch:/.test(wf) && /pages:\s*write/.test(wf) && /id-token:\s*write/.test(wf) && /contents:\s*read/.test(wf) && /actions\/checkout@v4/.test(wf) && /actions\/configure-pages@v5/.test(wf) && /actions\/upload-pages-artifact@v3/.test(wf) && /needs:\s*build/.test(wf), wf ? '' : 'absent');
  let wr = ''; try { wr = fs.readFileSync(path.join(RACINE, 'wrangler.jsonc'), 'utf8'); } catch (e) {}
  ok('5 wrangler.jsonc : Worker « athena-v1 », demo/ en fichiers statiques à leur adresse exacte (html_handling none), cloudflare/worker.js', /"name":\s*"athena-v1"/.test(wr) && /"directory":\s*"\.\/demo"/.test(wr) && /"html_handling":\s*"none"/.test(wr) && /"binding":\s*"ASSETS"/.test(wr) && /"main":\s*"cloudflare\/worker\.js"/.test(wr), wr ? '' : 'absent');
  let wk = ''; try { wk = fs.readFileSync(path.join(RACINE, 'cloudflare', 'worker.js'), 'utf8'); } catch (e) {}
  ok('5 cloudflare/worker.js : « …/ » ouvre « …/index.html », le reste passe par env.ASSETS', /endsWith\('\/'\)/.test(wk) && /index\.html/.test(wk) && /env\.ASSETS\.fetch/.test(wk), wk ? '' : 'absent');
  let tun = ''; try { tun = fs.readFileSync(path.join(RACINE, 'outils', 'tunnel-https.ps1'), 'utf8'); } catch (e) {}
  ok('5 outils/tunnel-https.ps1 : serveur-local.ps1 si le port 8347 est libre, cloudflared tunnel --url, winget si absent, adresse …/demo/ pour Mobile test', /serveur-local\.ps1/.test(tun) && /8347/.test(tun) && /'tunnel',\s*'--url'/.test(tun) && /http:\/\/localhost:\$Port/.test(tun) && /winget install Cloudflare\.cloudflared/.test(tun) && /trycloudflare/.test(tun) && /\/demo\//.test(tun) && /Mobile test/.test(tun), tun ? tun.length + ' caractères' : 'absent');
  const lm = lire('LISEZ-MOI.md');
  ok('5 LISEZ-MOI.md : une ligne pour manifest.webmanifest, sw.js, icones/ et commun/athena-mobile.js', /^\| manifest\.webmanifest \|/m.test(lm) && /^\| sw\.js \|/m.test(lm) && /^\| icones\/ \|/m.test(lm) && /^\| commun\/athena-mobile\.js \|/m.test(lm), '');

  // La règle 11 du vérificateur voit ce qui casse la PWA : sur une copie de demo/ (sans Archives/), une icône du manifest absente, un fichier du précache
  // absent, sw.js sans importScripts, un ?v= du Prototype plus récent que celui du précache ; puis un manifest qui n'est plus du JSON
  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), 'athena-regle11-'));
  const r11 = (() => {
    try {
      fs.cpSync(DEMO, tmp, { recursive: true, filter: (s) => path.relative(DEMO, s).split(path.sep)[0] !== 'Archives' });
      const ecrire = (f, fn) => fs.writeFileSync(path.join(tmp, f), fn(fs.readFileSync(path.join(tmp, f), 'utf8')));
      ecrire('manifest.webmanifest', (t) => t.replace('icones/icone-192.png', 'icones/absente-192.png'));
      ecrire('sw-precache.js', (t) => t.replace('self.ATHENA_COQUILLE = [', 'self.ATHENA_COQUILLE = [\n  "commun/absent.js",'));
      ecrire('sw.js', (t) => t.replace("importScripts('./sw-precache.js');", '// (retiré pour le test)'));
      ecrire('Prototype.dc.html', (t) => t.split('commun/hub-v1.js?v=20').join('commun/hub-v1.js?v=99'));
      const v1 = spawnSync('python3', ['-I', path.join(RACINE, 'demo', 'scripts', 'verifier-projet.py'), tmp], { encoding: 'utf8' });
      ecrire('manifest.webmanifest', () => '{ "name": ');
      const v2 = spawnSync('python3', ['-I', path.join(RACINE, 'demo', 'scripts', 'verifier-projet.py'), tmp], { encoding: 'utf8' });
      return { code1: v1.status, pwa1: (v1.stdout || '').split('\n').filter((l) => l.includes('PWA')), code2: v2.status, pwa2: (v2.stdout || '').split('\n').filter((l) => l.includes('PWA')) };
    } finally { fs.rmSync(tmp, { recursive: true, force: true }); }
  })();
  const vu = (re) => r11.pwa1.some((l) => re.test(l));
  ok('5 règle 11 : icône du manifest absente, fichier du précache absent, sw.js sans ./sw-precache.js, précache en retard sur le Prototype → erreurs', r11.code1 === 1 && vu(/absente-192\.png/) && vu(/commun\/absent\.js/) && vu(/importScripts|sw-precache\.js/) && vu(/hub-v1\.js.*v=20.*v=99|hub-v1\.js.*v=99.*v=20/) && vu(/generer-precache\.py/), 'code=' + r11.code1 + ' · ' + r11.pwa1.join(' | '));
  ok('5 règle 11 : un manifest qui n\'est plus du JSON → erreur', r11.code2 === 1 && r11.pwa2.some((l) => /manifest\.webmanifest/.test(l) && /JSON/.test(l)), 'code=' + r11.code2 + ' · ' + r11.pwa2.join(' | '));

  // 6 · dans le navigateur : service worker prêt, cache athena-demo-*, Prototype.dc.html et support.js dedans
  const b = await lancer();
  let p = await ouvrir(b, 'ecran=camp&nouv=tout');
  const sw = await attendreSw(p);
  ok('6 navigator.serviceWorker.ready résout en moins de 20 s', sw.pret != null && sw.pret < 20, sw.pret != null ? sw.pret.toFixed(1) + ' s' : 'pas prêt' + (p.errs.length ? ' · ' + p.errs.join(' | ') : ''));
  ok('6 le service worker est actif et contrôle la page', sw.actif != null, sw.actif != null ? sw.actif.toFixed(1) + ' s après' : 'pas activé');
  const cache = await p.evaluate(async () => { const ks = await caches.keys(); const k = ks.find((x) => x.indexOf('athena-demo-') === 0); if (!k) return { ks, n: 0, urls: [] }; const c = await caches.open(k); const urls = (await c.keys()).map((r) => r.url.replace(location.origin + '/', '')); return { ks, k, n: urls.length, urls }; });
  ok('6 caches.keys() contient un nom qui commence par athena-demo-', !!cache.k, cache.ks.join(', '));
  ok('6 le cache contient Prototype.dc.html et support.js (' + cache.n + ' entrées)', cache.urls.includes('Prototype.dc.html') && cache.urls.includes('support.js'), cache.urls.filter((u) => !u.startsWith('assets/') && !u.startsWith('commun/')).slice(0, 12).join(', '));
  // Une ressource ?v= dont le cache n'a qu'une autre version passe par le réseau (une page neuve ne reçoit jamais un module d'une version d'avant) et entre
  // dans le cache sous sa version
  const versionnee = await p.evaluate(async () => {
    const k = (await caches.keys()).find((x) => x.indexOf('athena-demo-') === 0); const c = await caches.open(k);
    const avant = !!(await c.match('commun/hub-v1.js?v=999'));
    const r = await fetch('commun/hub-v1.js?v=999'); const n = (await r.text()).length;
    let enCache = false; for (let i = 0; i < 30 && !enCache; i++) { enCache = !!(await c.match('commun/hub-v1.js?v=999')); if (!enCache) await new Promise((f) => setTimeout(f, 100)); }
    return { avant, statut: r.status, n, enCache };
  });
  ok('6 une ressource ?v= d\'une autre version que celle du cache passe par le réseau, puis entre dans le cache', !versionnee.avant && versionnee.statut === 200 && versionnee.n > 1000 && versionnee.enCache, JSON.stringify(versionnee));
  // Les images du camp entrent toutes dans le cache après l'activation ; un worker arrêté avant la fin (réseau lent) relance le précache au premier fetch de sa
  // vie suivante : ici, une image retirée du cache, le worker arrêté (CDP), puis une requête de la page → l'image revient sans que la page la demande
  const toutes = await p.evaluate(async (L) => { const k = (await caches.keys()).find((x) => x.indexOf('athena-demo-') === 0); const c = await caches.open(k); const t0 = Date.now(); let manque = L;
    while (Date.now() - t0 < 30000) { manque = []; for (const u of L) if (!(await c.match(u))) manque.push(u); if (!manque.length) break; await new Promise((f) => setTimeout(f, 300)); }
    return { n: L.length, manque: manque.length, ex: manque.slice(0, 3) }; }, images);
  ok('6 après l\'activation, les ' + images.length + ' images de assets/scene/ sont dans le cache', toutes.n > 100 && toutes.manque === 0, JSON.stringify(toutes));
  const IMG = images[0];
  const retiree = await p.evaluate(async (u) => { const k = (await caches.keys()).find((x) => x.indexOf('athena-demo-') === 0); const c = await caches.open(k); await c.delete(u); return !(await c.match(u)); }, IMG);
  let arret = 'ok';
  try { const cdp = await p.ctx.newCDPSession(p); await cdp.send('ServiceWorker.enable'); await cdp.send('ServiceWorker.stopAllWorkers'); await p.waitForTimeout(800); } catch (e) { arret = e.message.slice(0, 120); }
  const revenue = await p.evaluate(async (u) => { await fetch('support.js').then((r) => r.text()).catch(() => ''); const k = (await caches.keys()).find((x) => x.indexOf('athena-demo-') === 0); const c = await caches.open(k); const t0 = Date.now();
    while (Date.now() - t0 < 15000) { if (await c.match(u)) return (Date.now() - t0) + ' ms'; await new Promise((f) => setTimeout(f, 200)); } return null; }, IMG);
  ok('6 worker arrêté avant la fin du précache : le premier fetch de sa vie suivante le relance (' + IMG + ' revient dans le cache)', retiree && arret === 'ok' && !!revenue, 'retirée=' + retiree + ' arrêt=' + arret + ' revenue=' + revenue);
  ok('6 aucune erreur de page ni de console', p.errs.length === 0, p.errs.join(' | '));

  // 7 · hors ligne : la page se recharge depuis le cache, la scène ou le repli image fixe apparaît, 0 pageerror
  await p.ctx.setOffline(true);
  const recharge = await p.reload({ waitUntil: 'load' }).then(() => true).catch((e) => e.message.slice(0, 120));
  await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
  await p.waitForTimeout(4000);
  const sc = await scene(p);
  const pe = p.errs.filter((e) => e.startsWith('pageerror'));
  ok('7 hors ligne : le rechargement aboutit et [data-scene] ou le repli image fixe apparaît', recharge === true && (sc.scene || sc.fixe), 'rechargement=' + recharge + ' scène=' + sc.scene + ' repli=' + sc.fixe);
  ok('7 hors ligne : 0 pageerror', pe.length === 0, pe.join(' | '));
  const horsLigneV = await p.evaluate(async () => { try { const r = await fetch('commun/athena-jeu.js?v=998'); return { statut: r.status, n: (await r.text()).length }; } catch (e) { return { erreur: String(e).slice(0, 100) }; } });
  ok('7 hors ligne : une ressource ?v= d\'une autre version est servie par la copie en cache', horsLigneV.statut === 200 && horsLigneV.n > 100, JSON.stringify(horsLigneV));
  await p.ctx.close();

  // 8 · hors ligne avant précache : service worker enregistré, caches effacés, hors ligne → la navigation échoue proprement (erreur réseau), jamais une page vide
  p = await ouvrir(b, 'ecran=camp&nouv=tout');
  const sw2 = await attendreSw(p);
  // (hors ligne d'abord : une requête de la page encore en route rouvrirait un cache vide ; ce qui compte, c'est que plus aucun cache n'a la page)
  await p.ctx.setOffline(true);
  const effaces = await p.evaluate(async () => { const ks = await caches.keys(); await Promise.all(ks.map((k) => caches.delete(k))); await new Promise((f) => setTimeout(f, 300));
    for (const k of await caches.keys()) if (await (await caches.open(k)).match('Prototype.dc.html', { ignoreSearch: true })) return false; return true; });
  let nav = null, corps = '', statut = null;
  try { const r = await p.goto(URL + 'Prototype.dc.html', { waitUntil: 'load', timeout: 30000 }); nav = 'ok'; statut = r ? r.status() : null; corps = await p.content().catch(() => ''); } catch (e) { nav = e.message.slice(0, 100); }
  ok('8 hors ligne avant précache : la navigation échoue proprement (erreur réseau), sans réponse HTML vide', sw2.actif != null && effaces && nav !== 'ok' && /net::ERR|ERR_FAILED|ERR_INTERNET_DISCONNECTED/.test(nav || ''), 'sw=' + (sw2.actif != null) + ' effacés=' + effaces + ' navigation=' + nav + (statut != null ? ' statut=' + statut + ' corps=' + corps.length : ''));
  await p.ctx.close();

  // 9 · le Carnet : la section « Téléphone » (avant Réglages), rien d'insistant quand l'installation n'est pas proposée
  p = await ouvrir(b, 'ecran=journal&tab=carnet&nouv=tout');
  const carnet = await p.evaluate(() => { const s = document.querySelector('[data-el="telephone"]'); if (!s) return { on: false }; const titre = (s.querySelector('[data-t="mob.t"]') || {}).textContent || ''; const reg = document.querySelector('[data-t="ca.reglages"]'); const avant = reg ? !!(s.compareDocumentPosition(reg) & Node.DOCUMENT_POSITION_FOLLOWING) : null; const boutons = [...s.querySelectorAll('button')].map((x) => x.textContent.trim() + ' ' + Math.round(x.getBoundingClientRect().height)); return { on: true, titre: titre.trim(), avant, boutons, texte: s.textContent.replace(/\s+/g, ' ').trim() }; });
  ok('9 Carnet : la section data-el="telephone" avec le titre « Téléphone », placée avant « Réglages »', carnet.on && carnet.titre === 'Téléphone' && carnet.avant === true, JSON.stringify(carnet));
  ok('9 Carnet : sans beforeinstallprompt ni mode autonome, ni bouton « Installer » ni « Déjà installée »', carnet.on && !/Installer sur le téléphone|Déjà installée/.test(carnet.texte), carnet.texte);
  // Le navigateur propose l'installation (beforeinstallprompt, simulé) : la carte « Installer » paraît ; le bouton ouvre l'invite, puis la carte s'efface
  const propose = await p.evaluate(() => { window.__invite = 0; const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__invite++; return Promise.resolve(); }; e.userChoice = Promise.resolve({ outcome: 'accepted', platform: 'web' }); window.dispatchEvent(e); return e.defaultPrevented; });
  await p.waitForTimeout(600);
  const carte = await p.evaluate(() => { const s = document.querySelector('[data-el="telephone"]'); const bt = s && [...s.querySelectorAll('button')].find((x) => /Installer sur le téléphone/.test(x.textContent)); return { etat: window.AthenaMobile.etat(), texte: s ? s.textContent.replace(/\s+/g, ' ').trim() : '', bouton: bt ? bt.offsetHeight : null }; });
  ok('9 Installer : beforeinstallprompt retenu (preventDefault), la carte « Installer sur le téléphone » paraît avec son texte, bouton ≥ 44 px', propose && carte.etat.installable === true && carte.bouton >= 44 && /Une icône sur l’écran d’accueil, et le camp s’ouvre même sans réseau\./.test(carte.texte), 'preventDefault=' + propose + ' installable=' + carte.etat.installable + ' bouton=' + carte.bouton + ' · ' + carte.texte);
  if (carte.bouton) await p.click('[data-el="telephone"] button:has([data-t="mob.installer.t"])');
  await p.waitForTimeout(600);
  const apres = await p.evaluate(() => ({ invite: window.__invite, etat: window.AthenaMobile.etat(), texte: document.querySelector('[data-el="telephone"]').textContent.replace(/\s+/g, ' ').trim() }));
  ok('9 Installer : le bouton ouvre l\'invite du navigateur une fois, puis la carte s\'efface', apres.invite === 1 && apres.etat.installable === false && !/Installer sur le téléphone/.test(apres.texte), 'invite=' + apres.invite + ' installable=' + apres.etat.installable + ' · ' + apres.texte);
  ok('9 Carnet : aucune erreur', p.errs.length === 0, p.errs.join(' | '));
  const themeR2 = await p.evaluate(() => (document.querySelector('meta[name="theme-color"]') || {}).content);
  await p.ctx.close();

  // 10 · la barre du téléphone suit la DA : #60445f en Figures rév. 2 (par défaut), #a3452a en Veillée d'origine ; en mode autonome (display-mode
  // standalone, simulé), le Carnet dit « Déjà installée » sans bouton
  const AUTONOME = `(() => { const mm = window.matchMedia.bind(window); window.matchMedia = (q) => /display-mode:\\s*standalone/.test(q) ? { matches: true, media: q, onchange: null, addListener() {}, removeListener() {}, addEventListener() {}, removeEventListener() {}, dispatchEvent() { return false; } } : mm(q); })();`;
  p = await ouvrir(b, 'ecran=journal&tab=carnet&nouv=tout&da=origine', { init: AUTONOME });
  const themeOr = await p.evaluate(() => (document.querySelector('meta[name="theme-color"]') || {}).content);
  ok('10 theme-color suit la DA : #60445f en r2, #a3452a en origine', themeR2 === '#60445f' && themeOr === '#a3452a', 'r2=' + themeR2 + ' origine=' + themeOr);
  // (la section Téléphone porte aussi la carte des notifications, tâche 4 : on compte les boutons d'installation)
  const auto = await p.evaluate(() => { const s = document.querySelector('[data-el="telephone"]'); return { etat: window.AthenaMobile.etat(), texte: s ? s.textContent.replace(/\s+/g, ' ').trim() : '', boutons: s ? s.querySelectorAll('button:has([data-t="mob.installer.t"])').length : -1 }; });
  ok('10 mode autonome : le Carnet dit « Déjà installée », sans bouton « Installer »', auto.etat.standalone === true && /Déjà installée/.test(auto.texte) && auto.boutons === 0, JSON.stringify(auto));
  ok('10 aucune erreur (DA origine, mode autonome)', p.errs.length === 0, p.errs.join(' | '));
  await p.ctx.close();

  // 11 · une nouvelle version : une copie de demo/ servie à part (autre port, donc autre service worker) ; une fois la page contrôlée, sw.js change,
  // le navigateur installe la nouvelle version, l'app montre « Nouvelle version prête · Recharger » (boutons ≥ 44 px) ; « Recharger » recharge la page
  // sous la nouvelle version (plus rien n'attend)
  const copie = fs.mkdtempSync(path.join(os.tmpdir(), 'athena-maj-'));
  let srv = null;
  try {
    fs.cpSync(DEMO, copie, { recursive: true, filter: (s) => path.relative(DEMO, s).split(path.sep)[0] !== 'Archives' });
    srv = spawn('python3', ['-I', '-u', '-m', 'http.server', '0', '--bind', '127.0.0.1', '--directory', copie], { stdio: ['ignore', 'pipe', 'ignore'] });
    const port = await new Promise((res) => { let t = ''; srv.stdout.on('data', (d) => { t += d; const m = t.match(/port (\d+)/); if (m) res(m[1]); }); setTimeout(() => res(null), 10000); });
    p = await ouvrir(b, 'ecran=camp&nouv=tout', { url: 'http://127.0.0.1:' + port + '/' });
    const controle = await p.evaluate(() => new Promise((res) => { const t0 = Date.now(); const f = () => (navigator.serviceWorker.controller ? res(true) : Date.now() - t0 > 30000 ? res(false) : setTimeout(f, 200)); f(); }));
    fs.appendFileSync(path.join(copie, 'sw.js'), '\n// nouvelle version (test) ' + Date.now() + '\n');
    await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => r.update()).catch(() => {}));
    const vu = await p.waitForSelector('[data-el="toast_maj"]', { timeout: 30000 }).then(() => true).catch(() => false);
    const toast = vu ? await p.evaluate(() => { const t = document.querySelector('[data-el="toast_maj"]'); return { texte: t.textContent.replace(/\s+/g, ' ').trim(), boutons: [...t.querySelectorAll('button')].map((x) => x.offsetWidth + '×' + x.offsetHeight) }; }) : { texte: '', boutons: [] };
    ok('11 nouvelle version : « Nouvelle version prête » et « Recharger » paraissent, boutons ≥ 44 px', controle && vu && /Nouvelle version prête/.test(toast.texte) && /Recharger/.test(toast.texte) && toast.boutons.length === 2 && toast.boutons.every((x) => +x.split('×')[1] >= 44 && +x.split('×')[0] >= 44), 'contrôlée=' + controle + ' · ' + toast.texte + ' · ' + toast.boutons.join(', '));
    let recharge = false, apresMaj = {};
    if (vu) {
      await p.evaluate(() => { window.__marque = 1; });
      const charge = p.waitForEvent('load', { timeout: 20000 }).then(() => true).catch(() => false);
      await p.click('[data-el="toast_maj"] button:has([data-t="mob.maj.go"])');
      recharge = await charge;
      await p.waitForSelector(PH, { timeout: 40000 }).catch(() => {});
      apresMaj = await p.evaluate(() => navigator.serviceWorker.getRegistration().then((r) => ({ marque: window.__marque || null, toast: !!document.querySelector('[data-el="toast_maj"]'), attend: !!(r && r.waiting), actif: r && r.active && r.active.state, controle: !!navigator.serviceWorker.controller })));
    }
    ok('11 « Recharger » : la page se recharge sous la nouvelle version, plus rien n\'attend, plus de message', recharge && apresMaj.marque === null && !apresMaj.toast && !apresMaj.attend && apresMaj.actif === 'activated' && apresMaj.controle, 'rechargée=' + recharge + ' ' + JSON.stringify(apresMaj));
    ok('11 aucune erreur', p.errs.length === 0, p.errs.join(' | '));
    await p.ctx.close();
  } finally {
    if (srv) srv.kill();
    fs.rmSync(copie, { recursive: true, force: true });
  }

  // 12 · l'invite d'installation arrive avant que l'app démarre (visite suivante, service worker déjà actif) : les écouteurs sont posés au chargement du
  // module, l'invite est gardée, demarrer() la rejoue à onInstallable ; installer() → 'dismissed', puis 'indisponible' (plus d'invite, ou une invite qui lève)
  const TOT = `(() => { let v; Object.defineProperty(window, 'AthenaMobile', { configurable: true, get() { return v; }, set(x) { v = x; window.__invite = 0;
    const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__invite++; return Promise.resolve(); }; e.userChoice = Promise.resolve({ outcome: 'dismissed', platform: 'web' });
    window.dispatchEvent(e); window.__tot = e.defaultPrevented; } }); })();`;
  p = await ouvrir(b, 'ecran=journal&tab=carnet&nouv=tout', { init: TOT });
  const tot = await p.evaluate(() => { const s = document.querySelector('[data-el="telephone"]'); return { retenu: window.__tot === true, etat: window.AthenaMobile.etat(), carte: !!(s && s.querySelector('button:has([data-t="mob.installer.t"])')) }; });
  ok('12 invite reçue avant demarrer() (au chargement du module) : retenue, et la carte « Installer » paraît', tot.retenu && tot.etat.installable === true && tot.carte, JSON.stringify(tot));
  const refus = await p.evaluate(async () => { const r = await window.AthenaMobile.installer(); await new Promise((f) => setTimeout(f, 400)); const s = document.querySelector('[data-el="telephone"]'); return { r, invite: window.__invite, installable: window.AthenaMobile.etat().installable, carte: !!(s && s.querySelector('button:has([data-t="mob.installer.t"])')) }; });
  ok('12 installer() refusé par la personne → \'dismissed\', invite ouverte une fois, la carte s\'efface', refus.r === 'dismissed' && refus.invite === 1 && refus.installable === false && !refus.carte, JSON.stringify(refus));
  const sans = await p.evaluate(async () => ({ r: await window.AthenaMobile.installer(), invite: window.__invite }));
  ok('12 installer() sans invite gardée → \'indisponible\' (rien d\'ouvert)', sans.r === 'indisponible' && sans.invite === 1, JSON.stringify(sans));
  const leve = await p.evaluate(async () => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => Promise.reject(new Error('refusé par le navigateur')); e.userChoice = new Promise(() => {}); window.dispatchEvent(e);
    const avant = window.AthenaMobile.etat().installable; const r = await window.AthenaMobile.installer(); return { avant, r, apres: window.AthenaMobile.etat().installable }; });
  ok('12 installer() dont l\'invite lève → \'indisponible\', plus d\'invite gardée', leve.avant === true && leve.r === 'indisponible' && leve.apres === false, JSON.stringify(leve));
  ok('12 aucune erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.ctx.close();

  // 13 · jamais dans l'artefact publié : window.__resources présent → aucun service worker enregistré, etat().sw === false, installer() → 'indisponible'
  p = await ouvrir(b, 'ecran=camp&nouv=tout', { init: 'window.__resources = {};', delai: 4000 });
  const pub = await p.evaluate(async () => ({ reg: !!(await navigator.serviceWorker.getRegistration()), ctrl: !!navigator.serviceWorker.controller, etat: window.AthenaMobile && window.AthenaMobile.etat(), inst: window.AthenaMobile ? await window.AthenaMobile.installer() : null }));
  ok('13 window.__resources (artefact publié) : aucun service worker, etat().sw === false, installer() → \'indisponible\'', !pub.reg && !pub.ctrl && pub.etat && pub.etat.sw === false && pub.inst === 'indisponible', JSON.stringify(pub));
  ok('13 aucune erreur (artefact publié)', p.errs.length === 0, p.errs.join(' | '));
  await p.ctx.close();

  await b.close();

  process.exit(bilan('mobile_pwa') ? 1 : 0);
})().catch((e) => { console.error('mobile_pwa : ' + e.message); process.exit(2); });
