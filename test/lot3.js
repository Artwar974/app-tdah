// Lot 3 · le Grand Sentier en pass de saison : écran, saisons, ruban, cartes
const { URL, ESPION, lancer, routerCdn } = require('./_commun.js');   // navigateur, espion de la scène, URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const res = []; const ok = (nom, cond, info) => { res.push(cond); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
const lum = h => { const c = h.replace('#', ''); const f = i => { const v = parseInt(c.slice(i, i + 2), 16) / 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }; return .2126 * f(0) + .7152 * f(2) + .0722 * f(4); };
const contraste = (a, b) => { const l1 = lum(a), l2 = lum(b); return (Math.max(l1, l2) + .05) / (Math.min(l1, l2) + .05); };
(async () => {
  const b = await lancer();
  const ouvrir = async (hash, o) => { const p = await b.newPage({ viewport: { width: 1280, height: 950 } }); const errs = []; await p.addInitScript(ESPION);
    await routerCdn(p);
    p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error') errs.push('console ' + m.text().slice(0, 200)); });
    await p.goto(URL + 'Prototype.dc.html#' + hash, { waitUntil: 'load' }); await p.waitForFunction(() => document.querySelector('[data-scene]'), null, { timeout: 30000 }).catch(() => {}); await p.waitForTimeout(o && o.delai || 4000); p.errs = errs; return p; };
  const shot = async (p, nom) => { const el = await p.evaluateHandle(() => { let e = document.querySelector('[data-scene]'); while (e && e.getBoundingClientRect().width < 380) e = e.parentElement; return e || document.body; }); await el.asElement().screenshot({ path: 'lot3_' + nom + '.png' }).catch(() => {}); };
  // contraste AA des 4 saisons, deux DA
  const V = require('vm'); const ctx = { window: {} }; ctx.window = ctx; V.createContext(ctx); V.runInContext(require('fs').readFileSync('../demo/athena-v1.js', 'utf8'), ctx);
  const SA = ctx.ATHENA_V1.SAISONS; const ratios = SA.flatMap(s => ['r2', 'origine'].map(d => [s.id + '/' + d, contraste(s.couleur[d], s.texte).toFixed(2)]));
  ok('0 contraste AA (≥ 4,5) des bannières, 2 DA', ratios.every(r => +r[1] >= 4.5), ratios.map(r => r.join(' ')).join(', '));
  // A · l’écran du Sentier
  let p = await ouvrir('ecran=sentier&palier=7&nouv=tout');
  const dial = await p.$('[role="dialog"][aria-modal="true"]'); const nC = await p.$$eval('[role="dialog"] button[role="listitem"]', l => l.length);
  const ici = await p.$eval('[role="dialog"] [data-ici="true"]', e => e.getAttribute('aria-label')).catch(() => 'absent');
  /* 21/10 · le Sentier en colonne (tâche 6) : la liste ne défile plus seule ; centrage et « loin » sur l'axe vertical.
   * Tâche 7 : la liste est dans un bloc positionné (le rail), l'offsetParent des cartes n'est plus le défileur : le défileur se prend depuis la liste
   * (son premier ancêtre qui défile) et la position d'une carte s'additionne jusqu'à lui (offsetTop), comme senHaut dans le Prototype */
  const DEF = `const defileur = l => { for (let x = l && l.parentElement; x; x = x.parentElement) { const o = getComputedStyle(x).overflowY; if (o === 'auto' || o === 'scroll') return x; } return null; };
    const centre = (i, b) => { let y = 0; for (let x = i; x && x !== b; x = x.offsetParent) y += x.offsetTop; return Math.round(y + i.offsetHeight / 2 - b.clientHeight / 2 - b.scrollTop); };
    const l = document.querySelector('[role="dialog"] [role="list"]'); return { l, b: defileur(l), i: l && l.querySelector('[data-ici="true"]'), centre };`;
  const centre = await p.evaluate(def => { const { b, i, centre } = new Function(def)(); if (!b || !i) return null; return centre(i, b); }, DEF);
  ok('A écran du Sentier : 13 cartes (12 paliers et le bonus de fin de saison), « Tu es ici » sur le palier 7, bande centrée', !!dial && nC === 13 && /Palier 7 sur 12, gagné, tu es ici/.test(ici) && centre !== null && Math.abs(centre) < 4, `cartes=${nC} ici=« ${ici} » décentrage=${centre}`);
  const suiv = await p.$eval('[role="dialog"] [role="listitem"]:nth-child(9)', e => e.style.animation); const det = await p.$eval('[role="dialog"] [aria-live="polite"]', e => e.textContent);
  ok('A le palier suivant respire, le détail montre le palier 8', /rv-respire/.test(suiv) && /Palier 8/.test(det), suiv + ' | ' + det.slice(0, 60));
  const ban = await p.$eval('[role="dialog"] > div > div:first-child', e => getComputedStyle(e).backgroundColor + ' | ' + e.textContent); ok('A bannière saison 1 « Les oliviers »', /rgb\(79, 107, 47\)/.test(ban) && /Les oliviers/.test(ban) && /encore \d+ semaines/.test(ban), ban.slice(0, 90));
  await shot(p, 'sentier');
  await p.click('[role="dialog"] [role="listitem"]:nth-child(11)'); await p.waitForTimeout(300); const det2 = await p.$eval('[role="dialog"] [aria-live="polite"]', e => e.textContent); ok('A toucher le palier 10 : le détail change', /Palier 10/.test(det2), det2.slice(0, 70));
  /* 19/10 · un état venu d'une adresse reste figé jusqu'au premier toucher (B1) : un toucher sur la bannière le libère avant de faire défiler */
  await p.$eval('[data-screen-label="Prototype V1"]', el => el.dispatchEvent(new PointerEvent('pointerdown', { bubbles: true, pointerId: 9, pointerType: 'touch' }))); await p.waitForTimeout(500);
  await p.evaluate(def => { const { b } = new Function(def)(); b.scrollTop = b.scrollHeight; }, DEF); let rev = null; for (let i = 0; i < 20 && !rev; i++) { await p.waitForTimeout(250); rev = await p.$('button:has-text("Revenir à mon palier")'); }   /* le rendu arrive après le défilement, jusqu'à quelques secondes sous swiftshader */ ok('A loin du palier : « Revenir à mon palier »', !!rev);
  if (rev) { await p.waitForTimeout(400); await p.evaluate(() => { const b = [...document.querySelectorAll('button')].find(x => /Revenir à mon palier/.test(x.textContent)); if (b) b.click(); }); let c2 = 9999; for (let i = 0; i < 24 && Math.abs(c2) >= 4; i++) { await p.waitForTimeout(250); c2 = await p.evaluate(def => { const { b, i, centre } = new Function(def)(); return centre(i, b); }, DEF); }   /* le retour est un défilement doux : on attend qu'il arrive */ const rev2 = await p.$('button:has-text("Revenir à mon palier")'); ok('A revenir recentre', !rev2 && Math.abs(c2) < 4, 'décentrage=' + c2); }
  ok('A Sentier sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // B · saison 2
  p = await ouvrir('ecran=sentier&palier=7&saison=2&nouv=tout'); const ban2 = await p.$eval('[role="dialog"] > div > div:first-child', e => getComputedStyle(e).backgroundColor + ' | ' + e.textContent);
  ok('B saison 2 « Les vendanges », couleur', /rgb\(122, 47, 74\)/.test(ban2) && /Les vendanges/.test(ban2), ban2.slice(0, 80)); await shot(p, 'saison2'); await p.close();
  // C · le ruban dans le camp
  p = await ouvrir('ecran=camp&heure=10.25&fait=2&paliers=2&nouv=tout');
  // 22/10 · le bandeau est devenu un bouton rond (icône pass), sans badge au palier 0 ; l'aria garde la saison, le compte et le prochain palier
  const ruban = await p.$('[data-el="ruban"]'); const rt = ruban ? await ruban.getAttribute('aria-label') : 'absent'; const rb = ruban ? await ruban.boundingBox() : null; const badge = ruban ? await p.$('[data-el="ruban"] [role="status"]') : null;
  ok('C bouton pass du Sentier (22/10) : rond ≥ 44 px, l’aria dit la saison, le compte sur 12 et le prochain palier, pas de badge au palier 0', !!ruban && !!rb && rb.width >= 44 && rb.height >= 44 && /palier 0 sur 12/.test(rt) && /Prochain palier, le 1/.test(rt) && !badge, rt + (rb ? ' ' + Math.round(rb.width) + '×' + Math.round(rb.height) : ''));
  const fan = await p.evaluate(() => window.__scene && window.__scene.element('bat-ponton') && window.__scene.element('bat-ponton').def.couleur); ok('C le fanion du Ponton aux couleurs de la saison', fan === '#8fb05a', String(fan));
  await shot(p, 'ruban'); if (ruban) { await ruban.click(); await p.waitForTimeout(800); ok('C toucher le ruban ouvre le Sentier', !!(await p.$('[role="dialog"][aria-modal="true"]'))); }
  ok('C camp sans erreur', p.errs.length === 0, p.errs.join(' | ')); await p.close();
  // D · carte du palier gagné (grand : 6, depuis les 12 paliers du 20/10)
  p = await ouvrir('ecran=camp&heure=16&paliers=4&palier=6&gagne=1&nouv=tout');
  const ca = await p.$eval('[role="dialog"][aria-live="polite"]', e => e.getAttribute('aria-label') + ' | ' + e.style.animation + ' | ' + e.style.border).catch(() => 'absente');
  ok('D carte du palier 6 : lecteur d’écran, retournement, cadre de la saison', /Palier 6 sur 12, gagné/.test(ca) && /rv-flip/.test(ca) && /3px solid/.test(ca), ca); await shot(p, 'palier6'); await p.close();
  // E · fin de saison (tâche 7 : une feuille plein écran [data-fin-saison], la grille des 12 paliers, « Tu gardes tout. », la saison suivante)
  p = await ouvrir('ecran=camp&heure=16&palier=12&fin=1&nouv=tout');
  const fin = await p.$eval('[data-fin-saison][role="dialog"]', e => e.textContent + ' | cases=' + e.querySelectorAll('[data-case]').length).catch(() => 'absente');
  ok('E fin de saison : tu gardes tout, saison suivante, 12 cases', /Tu gardes tout\./.test(fin) && /La saison 2 commence\s: Les vendanges\./.test(fin) && /cases=12$/.test(fin), fin.slice(0, 160)); await shot(p, 'fin'); await p.close();
  // F · Veillée d’origine
  /* 21/10 (tâche 7) : le compagnon du palier 3 n'est plus une icône mais sa silhouette teintée (visuelRecompense, spec § 6) ; dans la Veillée, aucune icône
   * n'est demandée sous un nom que la DA ne connaît pas (« compagnon » passe par V.DAS.origine.noms → « animal ») */
  p = await ouvrir('ecran=sentier&palier=12&nouv=tout&da=origine'); const ic = await p.evaluate(() => { const d = document.querySelector('[role="dialog"]'); return { silhouette: !!d.querySelector('[data-pal="3"] [data-visuel="compagnon"]'), brut: [...d.querySelectorAll('athena-icone')].map(e => e.getAttribute('nom')).filter(n => n === 'compagnon').length }; });
  ok('F Veillée : le compagnon en silhouette teintée, aucune icône « compagnon » brute, sans erreur', ic.silhouette && ic.brut === 0 && p.errs.length === 0, JSON.stringify(ic) + ' ' + p.errs.join(' | ')); await shot(p, 'veillee'); await p.close();
  await b.close(); const ko = res.filter(x => !x).length; console.log(ko ? ko + ' contrôle(s) en échec' : 'tout passe');
})();
