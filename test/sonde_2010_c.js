// Lot C · les nouveaux écrans : le Ponton en parcours (attend, route, retour), le résumé du matin, « Hier, pas validées » (Journal), la pastille, les habitudes libres
const { URL, lancer, routerCdn } = require('./_commun.js');   // navigateur, URL de la démo et route des CDN : un seul exemplaire, dans _commun.js
process.chdir(__dirname);   // les chemins relatifs (../demo/, captures, ecrans.json) partent de test/, d'où que la suite soit lancée
const res = []; const ok = (nom, cond, info) => { res.push(cond); console.log((cond ? '✓ ' : '✗ ') + nom + (info ? ' — ' + info : '')); };
const ouvrir = async (b, u, delai) => { const p = await b.newPage({ viewport: { width: 390, height: 844 } }); const errs = [];
  await routerCdn(p);
  p.on('pageerror', e => errs.push('pageerror ' + e.message.slice(0, 200))); p.on('console', m => { if (m.type() === 'error' || m.type() === 'warning') errs.push(m.type() + ' ' + m.text().slice(0, 200)); });
  await p.goto(URL + 'Prototype.dc.html#' + u, { waitUntil: 'load' }).catch(e => errs.push('goto ' + e.message)); await p.waitForTimeout(delai || 6500); p.errs = errs; return p; };
const texte = async p => p.evaluate(() => document.body.innerText);
const feuille = async p => p.evaluate(() => { const f = document.querySelector('[data-el="feuille"], [role="dialog"]'); return f ? f.innerText : ''; });
const clic = async (p, t) => { const b = await p.$('button:has-text("' + t + '")'); if (!b) return false; await b.click(); await p.waitForTimeout(900); return true; };
(async () => {
  const b = await lancer();
  // 1 · le Ponton : un compagnon attend notre choix ; « Par là » le remet en route
  let p = await ouvrir(b, 'ecran=expedition&expedition=attend&nouv=tout&profil=enfant&da=r2&fait=2');
  let f = await texte(p); await p.screenshot({ path: 'c_attend.png' });
  ok('Ponton · attend : la feuille dit qu’il attend, trois voies avec « Par là »', /t’attend/.test(f) && (f.match(/Par là/g) || []).length === 3, (f.match(/Par là/g) || []).length + ' « Par là »');
  ok('Ponton · attend : la difficulté est dite (voie sûre / moyenne / risquée)', /Voie sûre/.test(f) && /Voie moyenne/.test(f) && /Voie risquée/.test(f));
  const parLa = await p.$('button:has-text("Par là")'); if (parLa) { await parLa.click(); await p.waitForTimeout(900); } f = await texte(p); await p.screenshot({ path: 'c_attend_parla.png' });
  ok('Ponton · « Par là » : il repart (en route, prochain pas vers …)', /En route/.test(f) && /prochain pas vers/.test(f) && !/Par là/.test(f));
  ok('Ponton · « Rentrer au camp » est là', /Rentrer au camp/.test(f)); await clic(p, 'Rentrer au camp'); f = await texte(p); await p.screenshot({ path: 'c_rentrer.png' });
  ok('Ponton · « Rentrer » : il rentre (au camp vers …), sans « Rentrer »', /Il rentre/.test(f) && !/Rentrer au camp/.test(f));
  ok('Ponton · attend : console vide', p.errs.length === 0, [...new Set(p.errs)].join(' | ')); await p.close();
  // 2 · le Ponton vide : quatre façons de partir, « Partir » lance un parcours
  p = await ouvrir(b, 'ecran=expedition&nouv=tout&profil=enfant&da=r2&fait=2'); f = await texte(p); await p.screenshot({ path: 'c_ponton.png' });
  ok('Ponton · vide : les quatre façons (Je choisis, Prudent, Curieux, Hardi) et « Partir »', /Je choisis/.test(f) && /Prudent/.test(f) && /Curieux/.test(f) && /Hardi/.test(f) && /Partir · 3 pas/.test(f), (f.match(/Partir[^\n]*/) || [''])[0]);
  await clic(p, 'Je choisis'); await clic(p, 'Partir · '); f = await texte(p); await p.screenshot({ path: 'c_parti.png' });
  ok('Ponton · « Partir » : un compagnon en route', /Compagnon 1/.test(f) && /En route/.test(f), (f.match(/En route[^\n]*/) || [''])[0]);
  const pill = await p.evaluate(() => { const b = document.querySelector('[data-el="exped"]'); return b ? b.textContent.trim() : ''; });
  await p.evaluate(() => { const b = document.querySelector('[data-el="feuille-fermer"], button[aria-label="Fermer"]'); if (b) b.click(); }); await p.waitForTimeout(800);
  const pill2 = await p.evaluate(() => { const b = document.querySelector('[data-el="exped"]'); return b ? b.textContent.trim() : ''; }); await p.screenshot({ path: 'c_pastille.png' });
  ok('Camp · la pastille dit « En route · pas 1 sur 3 »', /En route · pas 1 sur 3/.test(pill2), pill2 || pill);
  ok('Ponton · vide : console vide', p.errs.length === 0, [...new Set(p.errs)].join(' | ')); await p.close();
  // 3 · le retour : la carte de la besace
  p = await ouvrir(b, 'ecran=camp&expedition=retour&nouv=tout&profil=enfant&da=r2&fait=2'); f = await texte(p); await p.screenshot({ path: 'c_retour.png' });
  ok('Retour · la carte « Compagnon 1 est rentré » avec sa besace', /est rentré/.test(f) && /besace/.test(f), (f.match(/Dans sa besace[^\n]*/) || [''])[0]);
  ok('Retour : console vide', p.errs.length === 0, [...new Set(p.errs)].join(' | ')); await p.close();
  // 4 · la pastille « Il t’attend au Ponton »
  p = await ouvrir(b, 'ecran=camp&expedition=attend&nouv=tout&profil=enfant&da=r2&fait=2'); let pill3 = ''; for (let i = 0; i < 16 && !pill3; i++) { pill3 = await p.evaluate(() => { const b = document.querySelector('[data-el="exped"]'); return b ? b.textContent.trim() : ''; }); if (!pill3) await p.waitForTimeout(500); }   /* la pastille se cache le temps du toast « il t’attend » */ await p.screenshot({ path: 'c_pastille_attend.png' });
  ok('Camp · la pastille « Il t’attend au Ponton »', /t’attend au Ponton/.test(pill3), pill3); await p.close();
  // 5 · le matin
  p = await ouvrir(b, 'ecran=matin&nouv=tout&profil=enfant&da=r2'); f = await texte(p); await p.screenshot({ path: 'c_matin.png' });
  ok('Matin · « Hier », les quêtes validées, le Sommet, les deux quêtes pas validées avec « Valider après coup » et « Relancer »', /Hier/.test(f) && /validées/.test(f) && /Sommet/.test(f) && (f.match(/Valider après coup/g) || []).length === 2 && (f.match(/Relancer/g) || []).length === 2, (f.match(/\d+ quêtes? validées?/) || [''])[0]);
  const lireOr = () => p.evaluate(() => { const e = document.querySelector('[data-el="hud_or"]') || document.querySelector('[data-hud="or"]'); return e ? e.textContent.trim() : (document.body.innerText.match(/(\d+)\s*or\b/) || ['', '?'])[1]; }); const or0 = await lireOr(); await clic(p, 'Valider après coup'); f = await texte(p); await p.screenshot({ path: 'c_matin_apres.png' });
  const or1 = await lireOr();
  ok('Matin · « Valider après coup » : la phrase le dit, une seule carte reste à valider, l’or monte', /validée après coup/.test(f) && (f.match(/Valider après coup/g) || []).length === 1 && or0 !== or1, 'or ' + or0 + ' → ' + or1);
  await clic(p, 'Relancer'); f = await texte(p); await p.screenshot({ path: 'c_matin_relance.png' });
  ok('Matin · « Relancer » : la feuille se ferme, le camp dit que la quête est dans la journée', !/Vers ma journée/.test(f) && /dans ta journée/.test(f));
  ok('Matin : console vide', p.errs.length === 0, [...new Set(p.errs)].join(' | ')); await p.close();
  // 6 · le Journal › Quêtes : « Hier, pas validées »
  p = await ouvrir(b, 'ecran=journal&tab=quetes&hier=1&nouv=tout&profil=adulte&da=origine'); f = await texte(p); await p.screenshot({ path: 'c_journal_hier.png', fullPage: true });
  ok('Journal · « Hier, pas validées » avec ses deux boutons', /Hier, pas validées/.test(f) && /Valider après coup/.test(f) && /Relancer/.test(f));
  await clic(p, 'Valider après coup'); f = await texte(p); ok('Journal · après coup : « Validée après coup » et un toast', /Validée après coup/.test(f));
  ok('Journal : console vide', p.errs.length === 0, [...new Set(p.errs)].join(' | ')); await p.close();
  // 7 · les habitudes se changent quand on veut
  p = await ouvrir(b, 'ecran=habitudes&nouv=tout&profil=enfant&da=r2'); f = await texte(p); ok('Habitudes · « Tu peux les changer quand tu veux », sans « lundi »', /quand tu veux/.test(f) && !/lundi/.test(f)); await p.screenshot({ path: 'c_habitudes.png' });
  ok('Habitudes : console vide', p.errs.length === 0, [...new Set(p.errs)].join(' | ')); await p.close();
  await b.close(); console.log('\n' + res.filter(Boolean).length + ' / ' + res.length + ' contrôles ok');
})();
