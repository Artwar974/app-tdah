// Lot 1 · le système d'animation : compteurs, feuilles tirables, toasts, cartes, onglets, vols, mouvement réduit
const { URL, lancer, routerCdn } = require('./_commun.js');   // navigateur, URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const res = []; const ok = (nom, cond, info) => { res.push([cond ? '✓' : '✗', nom, info || '']); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
(async () => {
  const b = await lancer();
  const ouvrir = async (hash, o) => { const p = await b.newPage({ viewport: { width: 1280, height: 950 }, reducedMotion: o && o.reduit ? 'reduce' : 'no-preference' }); const errs = [];
    await routerCdn(p);
    p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    await p.goto(URL + 'Prototype.dc.html#' + hash, { waitUntil: 'load' });
    await p.waitForFunction(() => document.querySelector('[data-scene]'), null, { timeout: 30000 }).catch(() => {});
    await p.waitForTimeout(o && o.delai || 3000); p.errs = errs; return p; };
  // A · compteurs du haut du camp
  let p = await ouvrir('ecran=camp&nouv=tout&jours=3&bois=150&or=60');   /* 20/10 · plus de coffre d'attente : les gains vont droit aux compteurs */
  await p.waitForTimeout(1500); const ch = await p.$$eval('[data-el="hud"] athena-chiffre', l => l.map(e => e.textContent));
  ok('A compteurs athena-chiffre', ch.length === 3 && ch[1] === '150' && ch[2] === '60', ch.join(','));
  const tr = await p.$eval('[data-el="hud_journal"]', e => getComputedStyle(e).transitionProperty + ' ' + getComputedStyle(e).transitionDuration);
  ok('I bouton : transition transform', /transform/.test(tr), tr);
  // G · (20/10) le coffre posé sur le camp est l'inventaire : le toucher ouvre la feuille ; le bois et l'or ne passent plus par lui
  const G = await p.evaluate(async () => { const c = document.querySelector('button[data-el="coffre"]'); if (!c) return { coffre: false }; c.click(); await new Promise(r => setTimeout(r, 800)); const f = document.querySelector('[data-feuille-eco]'); return { coffre: true, feuille: !!f, texte: f ? f.textContent.slice(0, 60) : '' }; });
  ok('G le coffre du camp ouvre l’inventaire (20/10)', G.coffre && G.feuille && /coffre/i.test(G.texte), JSON.stringify(G));
  await p.evaluate(() => { const b = document.querySelector('[data-feuille-eco] button[aria-label="Fermer"]'); if (b) b.click(); }); await p.waitForTimeout(500);
  ok('A camp sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // B · feuille tirable (sac)
  p = await ouvrir('ecran=sac&nouv=tout');
  const feuille = await p.$('[data-feuille-eco] [data-tirable="1"]'); const poignee = await p.$('[data-feuille-eco] [data-poignee]');
  ok('B feuille tirable + poignée', !!feuille && !!poignee);
  if (poignee) { const r = await poignee.boundingBox(); const anim = await feuille.evaluate(e => getComputedStyle(e).animationName); ok('B feuille : animation rv-feuille', anim === 'rv-feuille', anim);
    const tabObj = await p.$('[data-feuille-eco] button:has-text("Objets")'); if (tabObj) { await tabObj.click(); await p.waitForTimeout(500); }   /* 20/10 · l'onglet Objets a deux lignes (le banc, les lanternes) */
    const dec = await p.$eval('[data-feuille-eco] [data-decale]', e => getComputedStyle(e.children[1] || e.children[0]).animationDelay); ok('B contenu décalé (2e ligne 30 ms)', /0\.03s|30ms/.test(dec) || dec !== '0s', dec);
    await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2); await p.mouse.down(); for (let i = 1; i <= 12; i++) { await p.mouse.move(r.x + r.width / 2, r.y + r.height / 2 + i * 20); await p.waitForTimeout(16); }
    const pendant = await p.$eval('[data-feuille-eco] [data-tirable="1"]', e => e.style.transform); await p.mouse.up(); await p.waitForTimeout(500);
    const encore = await p.$('[data-feuille-eco]'); ok('B tirer la poignée ferme la feuille', /translateY\(2\d\dpx\)/.test(pendant) && !encore, 'pendant=' + pendant + ' encore=' + !!encore); }
  ok('B sac sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // C · toast
  p = await ouvrir('ecran=camp&heure=10.25&fait=2&toast=sablier&nouv=tout');
  const ta = await p.$eval('[data-el="toast"]', e => getComputedStyle(e).animationName + '|' + e.closest('[role="status"]').style.top).catch(() => 'absent');
  ok('C toast : rv-toast, zone à 112', ta === 'rv-toast|112px', ta); await p.close();
  // D · carte de récompense : rayons, Continuer → vol
  p = await ouvrir('ecran=camp&carte=niveau&xp=300&nouv=tout');
  const carte = await p.$('[role="dialog"] [data-rayons]'); const animC = await p.$eval('[role="dialog"][aria-live="polite"]', e => getComputedStyle(e).animationName).catch(() => '');
  ok('D carte : rayons + rv-carte', !!carte && animC === 'rv-carte', animC);
  await p.waitForTimeout(1000); await p.evaluate(() => { window.__volMax = 0; new MutationObserver(() => { window.__volMax = Math.max(window.__volMax, document.querySelectorAll('[data-vol]').length); }).observe(document.querySelector('[data-screen-label="Prototype V1"]'), { childList: true, subtree: true }); });   /* le vol part au toucher et finit avant que click() ne rende la main sous swiftshader : un observateur compte les icônes en vol */
  await p.click('[data-t="carte.continuer"]'); await p.waitForTimeout(300); const volC = await p.evaluate(() => window.__volMax);
 const carteApres = await p.$('[role="dialog"][aria-live="polite"]');
  ok('D Continuer : la récompense vole, la carte se ferme', volC >= 3 && !carteApres, `vols=${volC} carte=${!!carteApres}`);
  ok('D carte sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // E · onglets du journal : l’indicateur glisse
  p = await ouvrir('ecran=journal&tab=quetes&heure=10.25&fait=1&nouv=tout');
  const ind0 = await p.$eval('[role="tablist"] [data-indicateur]', e => getComputedStyle(e).transform + ' w=' + e.getBoundingClientRect().width.toFixed(0));
  const tabs = await p.$$('[role="tablist"] [role="tab"]'); await tabs[2].click(); await p.waitForTimeout(450);
  const ind1 = await p.$eval('[role="tablist"] [data-indicateur]', e => getComputedStyle(e).transform + ' w=' + e.getBoundingClientRect().width.toFixed(0));
  ok('E indicateur du journal glisse', ind0 !== ind1 && /matrix\(1, 0, 0, 1, 1[6-9]\d/.test(ind1), ind0 + ' → ' + ind1);
  ok('E journal sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // F · segments du Comptoir
  p = await ouvrir('ecran=amenager&or=140&nouv=tout');
  const seg0 = await p.$eval('[role="tablist"] [data-indicateur]', e => getComputedStyle(e).transform); const t2 = await p.$$('[role="tablist"] [role="tab"]'); await t2[1].click(); await p.waitForTimeout(450);
  const seg1 = await p.$eval('[role="tablist"] [data-indicateur]', e => getComputedStyle(e).transform);
  ok('F segment du Comptoir glisse', seg0 !== seg1 && seg0.startsWith('matrix(1, 0, 0, 1, 0'), seg0 + ' → ' + seg1); await p.close();
  // H · mouvement réduit : rien ne vole, le compteur change d’un coup
  p = await ouvrir('ecran=camp&nouv=tout&jours=3&bois=150&or=60&coffre=24,10', { reduit: true });
  const mv = await p.$eval('[data-mouvement]', e => e.getAttribute('data-mouvement')); await p.click('[data-el="coffre"]'); await p.waitForTimeout(80);
  const volR = await p.$$eval('[data-vol]', l => l.length); const chR = await p.$eval('[data-el="hud_bois"] athena-chiffre', e => e.textContent);
  ok('H mouvement réduit : pas de vol, compteur immédiat', mv === 'reduit' && volR === 0 && chR === '174', `mv=${mv} vols=${volR} bois=${chR}`);
  const fAnim = await p.evaluate(async () => { document.querySelector('button[data-el="coffre"]').click(); await new Promise(r => setTimeout(r, 300)); const f = document.querySelector('[data-feuille-eco] [data-tirable="1"]'); return f ? getComputedStyle(f).animationName + ' ' + getComputedStyle(f).animationDuration : 'absent'; });
  ok('H feuille en mouvement réduit : fondu 120 ms', /rv-apparait 0\.12s/.test(fAnim), fAnim);
  ok('H réduit sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  await b.close(); const ko = res.filter(r => r[0] === '✗').length; console.log(ko ? `${ko} contrôle(s) en échec` : 'tout passe');
})();
