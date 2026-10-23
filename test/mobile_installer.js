// La page d'installation (21/10) : l'adresse du QR (index.html) propose d'installer l'app avant tout. Android : le bouton « Installer l'app » ouvre
// l'invite du téléphone (beforeinstallprompt) ; sans invite, les gestes de Chrome ; iPhone : les gestes de Safari ; l'app installée passe tout droit.
process.chdir(__dirname);
process.env.PW_EXPERIMENTAL_SERVICE_WORKER_NETWORK_EVENTS = '1';   // les requêtes du service worker passent par les copies locales des CDN
const { lancer, ouvrir, ok, bilan } = require('./_commun');
const ANDROID = 'Mozilla/5.0 (Linux; Android 16; Pixel 10 Pro) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Mobile Safari/537.36';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const TEL = (ua, vp) => ({ viewport: vp || { width: 412, height: 915 }, delai: 0, contexte: { isMobile: true, hasTouch: true, deviceScaleFactor: 2, userAgent: ua } });
// une fausse invite d'installation, comme Chrome la donne (l'issue choisie par le test)
const INVITE = (issue) => `window.__invite = () => { const e = new Event('beforeinstallprompt', { cancelable: true }); e.prompt = () => { window.__prompts = (window.__prompts || 0) + 1; return Promise.resolve(); }; e.userChoice = Promise.resolve({ outcome: '${issue}' }); dispatchEvent(e); };`;
const vu = (p, sel) => p.$eval(sel, (el) => { const r = el.getBoundingClientRect(), s = getComputedStyle(el); return r.width > 0 && r.height > 0 && s.visibility !== 'hidden' && s.display !== 'none' ? { h: Math.round(r.height), bas: Math.round(r.bottom) } : null; }).catch(() => null);
const mesure = (p) => p.evaluate((MOTS) => {
  const txt = document.body.innerText, petits = [...document.querySelectorAll('body *')].filter((el) => [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim()) && el.getClientRects().length).map((el) => parseFloat(getComputedStyle(el).fontSize)).filter((x) => x < 13);
  const cibles = [...document.querySelectorAll('a, button')].filter((el) => el.getClientRects().length).map((el) => Math.round(el.getBoundingClientRect().height)).filter((h) => h < 44);
  return { txt, petits, cibles, large: document.documentElement.scrollWidth > innerWidth + 1, interdits: MOTS.filter((m) => txt.toLowerCase().includes(m)) };
}, ['raté', 'échec', 'manqué', 'retard', 'abandon', 'puni', 'perdu', 'série cassée', 'dernière chance', 'il te manque', 'expire']);

(async () => {
  const b = await lancer();

  // 1 · Android, l'invite du téléphone pas encore là : la page, les gestes de Chrome, « Ouvrir sans installer »
  let p = await ouvrir(b, '', Object.assign(TEL(ANDROID), { sw: true }));
  await p.waitForSelector('[data-el="installer"]', { timeout: 15000 }).catch(() => {});
  let m = await mesure(p);
  ok('1 l’adresse du site ouvre la page d’installation (pas de redirection)', /\/(index\.html)?$/.test(new URL(p.url()).pathname) && /Athéna/.test(m.txt), p.url());
  ok('1 Android sans invite : les gestes de Chrome (menu ⋮ → « Installer l’application »)', !!(await vu(p, '[data-el="pas-android"]')) && !(await vu(p, '[data-el="pas-iphone"]')) && /Installer l’application/.test(m.txt), m.txt.slice(0, 300));
  const sans = await p.$eval('[data-el="sans-installer"]', (a) => a.getAttribute('href')).catch(() => null);
  ok('1 « Ouvrir sans installer » mène à l’app plein écran (Prototype.dc.html?app=1)', sans === 'Prototype.dc.html?app=1', String(sans));
  const sw = await p.evaluate(() => Promise.race([navigator.serviceWorker.ready.then((r) => !!r.active), new Promise((ok) => setTimeout(() => ok(false), 30000))]));
  ok('1 le service worker est enregistré depuis cette page (l’app devient installable)', sw, String(sw));
  const man = await p.$eval('link[rel="manifest"]', (l) => l.getAttribute('href')).catch(() => null);
  ok('1 le manifest est lié', man === 'manifest.webmanifest', String(man));
  ok('1 cibles ≥ 44 px, texte ≥ 13 px, rien ne déborde, aucun mot interdit', !m.cibles.length && !m.petits.length && !m.large && !m.interdits.length, JSON.stringify({ cibles: m.cibles, petits: m.petits, large: m.large, interdits: m.interdits }));
  await p.screenshot({ path: 'mobile_installer_android.png' }).catch(() => {});

  // 2 · l'invite arrive : le bouton « Installer l'app » (≥ 48 px) ouvre l'invite ; acceptée → « C'est installé » et « Ouvrir l'app »
  await p.evaluate(INVITE('accepted')); await p.evaluate(() => window.__invite());
  await p.waitForSelector('[data-el="installer"]:not([hidden])', { timeout: 5000 }).catch(() => {});
  const btn = await vu(p, '[data-el="installer"]');
  ok('2 l’invite du téléphone arrive : « Installer l’app » apparaît (≥ 48 px), les gestes de Chrome se replient', !!btn && btn.h >= 48 && !(await vu(p, '[data-el="pas-android"]')), JSON.stringify(btn));
  await p.screenshot({ path: 'mobile_installer_invite.png' }).catch(() => {});
  await p.click('[data-el="installer"]');
  await p.waitForSelector('[data-el="installee"]:not([hidden])', { timeout: 5000 }).catch(() => {});
  const nb = await p.evaluate(() => window.__prompts || 0), fini = await vu(p, '[data-el="installee"]');
  const ouvrirApp = await p.$eval('[data-el="installee"] a', (a) => a.getAttribute('href')).catch(() => null);
  ok('2 le bouton ouvre l’invite une fois ; acceptée → « C’est installé », avec « Ouvrir l’app » (Prototype.dc.html?app=1)', nb === 1 && !!fini && ouvrirApp === 'Prototype.dc.html?app=1' && !(await vu(p, '[data-el="installer"]')), JSON.stringify({ nb, fini, ouvrirApp }));
  await p.screenshot({ path: 'mobile_installer_fait.png' }).catch(() => {});
  ok('2 aucune erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.close();

  // 3 · invite refusée : le bouton s'efface, les gestes de Chrome reviennent
  p = await ouvrir(b, '', TEL(ANDROID));
  await p.waitForSelector('[data-el="pas-android"]', { timeout: 15000 }).catch(() => {});
  await p.evaluate(INVITE('dismissed')); await p.evaluate(() => window.__invite());
  await p.waitForSelector('[data-el="installer"]:not([hidden])', { timeout: 5000 }).catch(() => {});
  await p.click('[data-el="installer"]').catch(() => {}); await p.waitForTimeout(400);
  ok('3 invite refusée : plus de bouton, les gestes de Chrome reviennent, rien d’affiché comme une faute', !(await vu(p, '[data-el="installer"]')) && !!(await vu(p, '[data-el="pas-android"]')) && !(await vu(p, '[data-el="installee"]')) && p.errs.length === 0, p.errs.join(' | '));
  await p.close();

  // 4 · iPhone : les gestes de Safari (Partager → « Sur l'écran d'accueil »), pas ceux de Chrome
  p = await ouvrir(b, '', TEL(IPHONE, { width: 390, height: 844 }));
  await p.waitForSelector('[data-el="pas-iphone"]', { timeout: 15000 }).catch(() => {});
  m = await mesure(p);
  ok('4 iPhone : Partager → « Sur l’écran d’accueil », sans les gestes de Chrome', !!(await vu(p, '[data-el="pas-iphone"]')) && !(await vu(p, '[data-el="pas-android"]')) && /Sur l’écran d’accueil/.test(m.txt), m.txt.slice(0, 300));
  ok('4 iPhone : cibles ≥ 44 px, texte ≥ 13 px, rien ne déborde, aucune erreur', !m.cibles.length && !m.petits.length && !m.large && p.errs.length === 0, JSON.stringify({ cibles: m.cibles, petits: m.petits, large: m.large }) + ' ' + p.errs.join(' | '));
  await p.screenshot({ path: 'mobile_installer_iphone.png' }).catch(() => {});
  await p.close();

  // 5 · petit écran 360 × 640 : le bouton d'installation tient sans défiler
  p = await ouvrir(b, '', TEL(ANDROID, { width: 360, height: 640 }));
  await p.waitForSelector('[data-el="pas-android"]', { timeout: 15000 }).catch(() => {});
  await p.evaluate(INVITE('accepted')); await p.evaluate(() => window.__invite());
  await p.waitForSelector('[data-el="installer"]:not([hidden])', { timeout: 5000 }).catch(() => {});
  const b5 = await vu(p, '[data-el="installer"]'); m = await mesure(p);
  ok('5 360 × 640 : « Installer l’app » visible sans défiler, rien ne déborde', !!b5 && b5.bas <= 640 && !m.large, JSON.stringify(b5));
  await p.screenshot({ path: 'mobile_installer_360.png' }).catch(() => {});
  await p.close();

  // 6 · l'app déjà installée (affichage standalone) : la page passe tout droit à l'app
  p = await ouvrir(b, '', Object.assign(TEL(ANDROID), { init: `const mm = window.matchMedia.bind(window); window.matchMedia = (q) => /standalone/.test(q) ? { matches: true, media: q, addEventListener() {}, removeEventListener() {}, addListener() {}, removeListener() {} } : mm(q);` }));
  await p.waitForURL(/Prototype\.dc\.html\?source=pwa/, { timeout: 15000 }).catch(() => {});
  ok('6 app installée : l’adresse ouvre directement l’app (Prototype.dc.html?source=pwa)', /Prototype\.dc\.html\?source=pwa/.test(p.url()), p.url());
  await p.close();

  await b.close();
  bilan('mobile_installer');
})();
