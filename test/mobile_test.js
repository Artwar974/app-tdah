// Mobile test · la page Mobile-test.dc.html du hub : l'onglet courant, les QR des cibles (dessinés par le code, ≥ 176 px, lisibles par jsqr),
// l'adresse libre (QR à la volée, emplacement quand elle est vide, 600 caractères sans erreur, 3 000 caractères → message « trop long » sans « undefined »), un avis enregistré (H.mobile, badge de la barre),
// l'export JSON téléchargé et réimporté sans doublon, localStorage qui lève sans casser la page, textes ≥ 13 px et cibles ≥ 44 px à 390 et 1280 px.
const fs = require('fs');
const path = require('path');
const jsQR = require('jsqr');
const { PNG } = require('pngjs');
const { URL, lancer, routerCdn, ok, bilan } = require('./_commun.js');
process.chdir(__dirname);   // captures et node_modules depuis test/, d'où que la suite soit lancée

const PAGE = 'Mobile-test.dc.html';
const AUTRE = 'https://exemple.test/x';
const LONGUE = 'https://exemple.test/' + 'abcdefghij'.repeat(58) + 'z';   // 600 caractères
const TROP = 'https://exemple.test/' + 'a'.repeat(2979);   // 3 000 caractères : au-delà de ce qu'un QR (niveau M) peut contenir
const DATE = /^athena-v1-avis-\d{4}-\d{2}-\d{2}\.(json|md)$/;

(async () => {
  const b = await lancer();
  // Ouvre la page : erreurs de page, de console et réponses ≥ 400 dans p.errs ; init = script lancé avant la page (localStorage qui lève)
  const ouvrir = async (o) => {
    o = o || {};
    const p = await b.newPage({ viewport: { width: o.w || 390, height: o.h || 844 }, deviceScaleFactor: o.scale || 1, acceptDownloads: true });
    const errs = []; p.errs = errs;
    if (o.init) await p.addInitScript(o.init);
    await routerCdn(p);
    p.on('pageerror', (e) => errs.push('pageerror ' + e.message.slice(0, 200)));
    p.on('console', (m) => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    p.on('response', (r) => { if (r.status() >= 400) errs.push('http ' + r.status() + ' ' + r.url().slice(0, 100)); });
    await p.goto(URL + PAGE, { waitUntil: 'load' }).catch((e) => errs.push('goto ' + e.message.slice(0, 200)));
    await p.waitForTimeout(o.delai || 5000);
    return p;
  };
  const decoder = async (el) => {
    const png = PNG.sync.read(await el.screenshot({ type: 'png' }));
    const r = jsQR(new Uint8ClampedArray(png.data), png.width, png.height, { inversionAttempts: 'dontInvert' });
    return r ? r.data : null;
  };
  // Textes ≥ 13 px et cibles ≥ 44 px sur tout ce qui est affiché (page et barre comprises) ; a[download] = le lien passager de H.telecharger, pas une cible
  const mesures = (p) => p.evaluate(() => {
    const vis = (el) => el.getClientRects().length > 0 && getComputedStyle(el).visibility !== 'hidden';
    const petits = [...document.body.querySelectorAll('*')].filter((el) => vis(el) && parseFloat(getComputedStyle(el).fontSize) < 13).map((el) => el.tagName + '.' + (el.className || '') + ':' + getComputedStyle(el).fontSize);
    const bas = [...document.body.querySelectorAll('button, input, select, textarea, a[href]:not([download])')].filter((el) => vis(el) && el.getBoundingClientRect().height < 44).map((el) => el.tagName + ' « ' + (el.textContent || el.value || el.name || '').trim().slice(0, 30) + ' » ' + Math.round(el.getBoundingClientRect().height) + 'px');
    const defil = document.documentElement.scrollWidth > document.documentElement.clientWidth + 1;
    const n = [...document.body.querySelectorAll('button, input, select, textarea, a[href]')].filter(vis).length;
    return { petits, bas, defil, n };
  });

  // 1 · à 390 × 844 : l'onglet courant, les QR des deux cibles
  let p = await ouvrir();
  const courant = await p.$eval('hub-nav a[aria-current="page"]', (a) => a.textContent.trim()).catch(() => '');
  ok('L’onglet « Mobile test » est courant dans la barre', courant === 'Mobile test', 'courant=« ' + courant + ' »');
  const qrs = await p.$$eval('#qr svg[role="img"]', (l) => l.map((s) => ({ lib: s.getAttribute('aria-label') || '', w: s.getBoundingClientRect().width, h: s.getBoundingClientRect().height })));
  ok('#qr : deux QR svg[role=img], chacun ≥ 176 px', qrs.length === 2 && qrs.every((q) => q.w >= 176 && q.h >= 176), JSON.stringify(qrs.map((q) => [Math.round(q.w), Math.round(q.h)])));
  ok('Les aria-label des QR citent les adresses des cibles (app Cloudflare, hub artefact)', qrs.some((q) => q.lib.includes('https://athena-v1.baptistebertil.workers.dev/')) && qrs.some((q) => q.lib.includes('https://claude.ai/artifact/L4ZMGPiAahZyX653Z4Yq69')), qrs.map((q) => q.lib).join(' | '));
  const badgeApp = await p.$eval('#qr [data-cible="app"]', (c) => [...c.querySelectorAll('*')].some((el) => el.textContent.trim() === 'Distribuée' && el.getClientRects().length > 0)).catch(() => false);
  ok('Le badge « Distribuée » est visible sur la cible app (en ligne sur Cloudflare)', badgeApp, '');
  // 2 · une autre adresse : QR à la volée, lisible ; vide → emplacement ; 600 caractères → un svg sans erreur
  const champ = await p.$('#qr input[name="autre"]');
  ok('Le champ « Une autre adresse » existe', !!champ, '');
  if (champ) {
    await champ.fill(AUTRE); await p.waitForTimeout(600);
    const n3 = await p.$$eval('#qr svg[role="img"]', (l) => l.length);
    ok('L’adresse https://exemple.test/x produit un troisième QR', n3 === 3, 'svg=' + n3);
    const svg3 = await p.$('#qr [data-cible="autre"] svg[role="img"]');
    const lu = svg3 ? await decoder(svg3) : null;
    ok('Le QR à la volée se décode (jsqr) exactement en https://exemple.test/x', lu === AUTRE, 'lu=' + lu);
    if (svg3) await svg3.screenshot({ path: 'mobile_test_qr.png' }).catch(() => {});
    await champ.fill(''); await p.waitForTimeout(400);
    const place = await p.$$eval('#qr [role="img"][aria-label*="Emplacement"]', (l) => l.length);
    ok('Champ vide : un emplacement marqué (role=img, « Emplacement »), aucune erreur', place >= 1 && p.errs.length === 0, 'emplacements=' + place + ' ' + p.errs.join(' | '));
    await champ.fill(LONGUE); await p.waitForTimeout(1200);
    const nL = await p.$$eval('#qr [data-cible="autre"] svg[role="img"]', (l) => l.length);
    ok('Une adresse de 600 caractères donne un QR sans erreur', nL === 1 && p.errs.length === 0, 'svg=' + nL + ' ' + p.errs.join(' | '));
    // Au-delà de la capacité du QR, le moteur lève une chaîne (pas un Error) : le message doit dire « trop long », jamais « undefined »
    await champ.fill(TROP); await p.waitForTimeout(1200);
    const nT = await p.$$eval('#qr [data-cible="autre"] svg[role="img"]', (l) => l.length);
    const msgT = await p.$$eval('#qr [data-cible="autre"] p', (l) => l.map((e) => e.textContent.trim()).find((t) => t.startsWith('Le QR ne peut pas')) || '');
    ok('Une adresse de 3 000 caractères : aucun QR, un message « trop long : 3000 caractères » sans « undefined », aucune erreur', nT === 0 && /trop long : 3000 caractères/.test(msgT) && !/undefined/i.test(msgT) && p.errs.length === 0, 'svg=' + nT + ' message=« ' + msgT + ' » ' + p.errs.join(' | '));
    await champ.fill(''); await p.waitForTimeout(300);
  }
  // 3 · un avis : version, profil, DA, échelle « clair » = 4, texte « plu », enregistrer → H.mobile.liste() et badge de la barre
  const T = { timeout: 5000 };
  await p.selectOption('#avis select[name="version"]', 'test-1', T).catch((e) => p.errs.push('select version ' + e.message.slice(0, 80)));
  await p.selectOption('#avis select[name="profil"]', 'adulte', T).catch((e) => p.errs.push('select profil ' + e.message.slice(0, 80)));
  await p.selectOption('#avis select[name="da"]', 'origine', T).catch((e) => p.errs.push('select da ' + e.message.slice(0, 80)));
  await p.click('#avis [data-q="clair"][data-v="4"]', T).catch((e) => p.errs.push('clair ' + e.message.slice(0, 80)));
  await p.fill('#avis textarea[name="plu"]', 'le camp', T).catch((e) => p.errs.push('plu ' + e.message.slice(0, 80)));
  await p.getByRole('button', { name: /Enregistrer l.avis/ }).click(T).catch((e) => p.errs.push('enregistrer ' + e.message.slice(0, 80)));
  await p.waitForTimeout(600);
  const avis = await p.evaluate(() => { const H = window.AthenaHub; return H && H.mobile ? H.mobile.liste() : null; });
  const a0 = (avis || [])[0] || {};
  ok('« Enregistrer l’avis » → H.mobile.liste().length === 1, avec version, profil, DA, clair = 4 et plu = « le camp »', !!avis && avis.length === 1 && a0.version === 'test-1' && a0.profil === 'adulte' && a0.da === 'origine' && a0.reponses && a0.reponses.clair === 4 && a0.reponses.plu === 'le camp' && typeof a0.id === 'string' && typeof a0.t === 'number', JSON.stringify(a0).slice(0, 200));
  const badge = await p.$eval('hub-nav a[aria-current="page"] span', (s) => s.textContent.trim()).catch(() => '');
  ok('Le badge de l’onglet affiche 1', badge === '1', 'badge=« ' + badge + ' »');
  const liste = await p.$$eval('#avis [data-avis]', (l) => l.length);
  ok('La liste des avis montre l’avis enregistré', liste === 1, 'cartes=' + liste);
  // 4 · export JSON téléchargé, réimporté : 0 nouveau, 0 mis à jour ; un avis modifié ou nouveau fusionne
  const [dl] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.getByRole('button', { name: /Exporter en JSON/ }).click(T).catch((e) => p.errs.push('export ' + e.message.slice(0, 80)))]);
  const nomJson = dl ? dl.suggestedFilename() : '';
  ok('« Exporter en JSON » télécharge athena-v1-avis-<date>.json', DATE.test(nomJson) && nomJson.endsWith('.json'), 'fichier=« ' + nomJson + ' »');
  let exp = null;
  if (dl) { try { exp = JSON.parse(fs.readFileSync(await dl.path(), 'utf8')); } catch (e) { p.errs.push('export illisible ' + e.message.slice(0, 80)); } }
  ok('L’export contient l’avis, les versions et les cibles', !!exp && Array.isArray(exp.avis) && exp.avis.length === 1 && Array.isArray(exp.versions) && exp.versions.some((v) => v.id === 'test-1') && Array.isArray(exp.cibles), exp ? Object.keys(exp).join(',') : 'pas d’export');
  const re = exp ? await p.evaluate((o) => window.AthenaHub.mobile.importer(o), exp) : null;
  ok('H.mobile.importer(le même export) → { nouveaux: 0, misAJour: 0 }', !!re && re.nouveaux === 0 && re.misAJour === 0, JSON.stringify(re));
  if (exp) {
    const o2 = JSON.parse(JSON.stringify(exp)); o2.avis[0].remarque = 'modifié ailleurs'; o2.avis[0].m = Date.now() + 5000;
    o2.avis.push(Object.assign({}, exp.avis[0], { id: 'a-autre', t: Date.now() - 1000, qui: 'B.' }));
    const re2 = await p.evaluate((o) => window.AthenaHub.mobile.importer(o), o2);
    const n2 = await p.evaluate(() => window.AthenaHub.mobile.liste().length);
    const rem = await p.evaluate(() => (window.AthenaHub.mobile.liste().find((a) => a.id !== 'a-autre') || {}).remarque);
    ok('Un export avec un avis plus récent et un avis nouveau → { nouveaux: 1, misAJour: 1 }, 2 avis, la remarque mise à jour', !!re2 && re2.nouveaux === 1 && re2.misAJour === 1 && n2 === 2 && rem === 'modifié ailleurs', JSON.stringify(re2) + ' n=' + n2);
  }
  const [dlMd] = await Promise.all([p.waitForEvent('download', { timeout: 8000 }).catch(() => null), p.getByRole('button', { name: /Exporter en Markdown/ }).click(T).catch((e) => p.errs.push('export md ' + e.message.slice(0, 80)))]);
  const nomMd = dlMd ? dlMd.suggestedFilename() : '';
  let md = '';
  if (dlMd) { try { md = fs.readFileSync(await dlMd.path(), 'utf8'); } catch (e) {} }
  ok('« Exporter en Markdown » télécharge athena-v1-avis-<date>.md avec une section par version et « ## Historique »', DATE.test(nomMd) && nomMd.endsWith('.md') && /^## Test 1/m.test(md) && /^## Historique/m.test(md) && /le camp/.test(md), 'fichier=« ' + nomMd + ' » ' + md.length + ' caractères');
  // 5 · textes et cibles à 390 px, pas de défilement horizontal, aucune erreur (après que le lien passager de l'export est retiré)
  await p.waitForTimeout(800);
  let m = await mesures(p);
  ok('À 390 px : aucun texte sous 13 px, toutes les cibles (≥ 10 comptées) ≥ 44 px, pas de défilement horizontal', m.n >= 10 && m.petits.length === 0 && m.bas.length === 0 && !m.defil, ('cibles=' + m.n + ' ' + m.petits.slice(0, 5).join(' ; ') + ' ' + m.bas.slice(0, 5).join(' ; ') + (m.defil ? ' DÉFILEMENT' : '')).trim());
  ok('Page à 390 px sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.screenshot({ path: 'mobile_test_390.png' }).catch(() => {});
  await p.close();
  // 6 · à 1280 × 950
  p = await ouvrir({ w: 1280, h: 950 });
  const c2 = await p.$eval('hub-nav a[aria-current="page"]', (a) => a.textContent.trim()).catch(() => '');
  const q2 = await p.$$eval('#qr svg[role="img"]', (l) => l.length);
  m = await mesures(p);
  ok('À 1280 px : onglet courant, deux QR, aucun texte sous 13 px, toutes les cibles (≥ 10 comptées) ≥ 44 px', c2 === 'Mobile test' && q2 === 2 && m.n >= 10 && m.petits.length === 0 && m.bas.length === 0 && !m.defil, 'courant=« ' + c2 + ' » svg=' + q2 + ' cibles=' + m.n + ' ' + (m.petits.slice(0, 5).join(' ; ') + ' ' + m.bas.slice(0, 5).join(' ; ')).trim());
  ok('Page à 1280 px sans erreur', p.errs.length === 0, p.errs.join(' | '));
  await p.screenshot({ path: 'mobile_test_1280.png' }).catch(() => {});
  await p.close();
  // 7 · localStorage qui lève (navigation privée stricte) : la page se rend quand même, sans pageerror
  const INIT = `(() => { const boom = () => { throw new Error('localStorage indisponible'); }; const faux = { getItem: boom, setItem: boom, removeItem: boom, clear: boom, key: boom, get length() { return 0; } }; try { Object.defineProperty(window, 'localStorage', { configurable: true, get: () => faux }); } catch (e) {} })();`;
  p = await ouvrir({ init: INIT, delai: 5000 });
  const q3 = await p.$$eval('#qr svg[role="img"]', (l) => l.length);
  const pe = p.errs.filter((e) => e.startsWith('pageerror'));
  ok('localStorage qui lève : la page se rend (deux QR) sans pageerror', q3 === 2 && pe.length === 0, 'svg=' + q3 + ' ' + pe.join(' | '));
  await p.close();
  await b.close();
  const ko = bilan('mobile_test');
  process.exit(ko ? 1 : 0);
})().catch((e) => { console.error('mobile_test : ' + e.message); process.exit(2); });
