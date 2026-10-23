const assert = require('node:assert/strict');
const { lancer, ouvrir } = require('./_commun');
const fs = require('node:fs');
const path = require('node:path');
const LOGIQUE = `window.__logique = () => { const el = document.querySelector('[data-screen-label="Prototype V1"]'), k = el && Object.keys(el).find(x => x.startsWith('__reactFiber$')); let f = k ? el[k] : null; while(f) { if(f.stateNode?.logic?.state) return f.stateNode.logic; f = f.return; } };`;
(async () => {
  const b = await lancer(); const failures = [];
  const check = (name, value) => { console.log((value ? 'PASS ' : 'FAIL ') + name); if (!value) failures.push(name); };
  try {
    for (const width of [360, 412]) {
      const p = await ouvrir(b, 'Prototype.dc.html?app=1#ecran=camp&nouv=tout', { viewport: { width, height: 844 }, init: LOGIQUE, delai: 0 });
      await p.waitForFunction(() => window.__logique?.()?.state.pret);
      await p.evaluate(() => { const l = __logique(); window.__quetes = JSON.parse(JSON.stringify(l.state.quetes)); l.setState({ ecran:'camp', appris:{...l.state.appris, balayer:2}, sheet:null, voix:null, busy:false }); });
      for (const mode of ['pending', 'done', 'empty']) {
        await p.evaluate(mode => { const l = __logique(); l.setState({ quetes: mode === 'empty' ? [] : __quetes.map(q => ({...q, fait:mode === 'done'})), curId:null, cr:null, optsId:null }); }, mode);
        await p.waitForTimeout(350);
        const m = await p.evaluate(() => { const plus = document.querySelector('[data-el="barre_plus"]'); const bar = plus?.closest('[data-barre]') || plus?.parentElement?.parentElement; const r = bar.getBoundingClientRect(); const br = plus.getBoundingClientRect(); return { height:r.height, gap:r.bottom-br.bottom, button:{w:br.width,h:br.height}, plusCount:document.querySelectorAll('[data-el="barre_plus"]').length, infos:bar.querySelectorAll('[data-barre-info]').length, overflow:document.documentElement.scrollWidth>innerWidth }; });
        check(`${width}/${mode}: hauteur compacte (${m.height})`, m.height <= (mode === 'pending' ? 112 : 64));
        check(`${width}/${mode}: marge basse utile (${m.gap})`, m.gap <= 10);
        check(`${width}/${mode}: un + tactile de 44 px`, m.plusCount === 1 && m.button.w >= 43.9 && m.button.h >= 43.9);
        check(`${width}/${mode}: aucun débordement`, !m.overflow);
        if (mode !== 'pending') check(`${width}/${mode}: aucun créneau inutile`, m.infos === 0);
        const out = path.join(__dirname, 'logs', 'barre-compacte'); fs.mkdirSync(out, {recursive:true});
        await p.screenshot({path:path.join(out, `${width}-${mode}.png`)});
        await p.locator('[data-el="barre_plus"]').click();
        await p.waitForFunction(() => !!__logique().state.cr);
        check(`${width}/${mode}: création accessible`, await p.evaluate(() => !!__logique().state.cr));
      }
      check(`${width}: aucune erreur JavaScript`, !p.errs.some(e => e.startsWith('pageerror')));
      await p.close();
    }
  } finally { await b.close(); }
  assert.equal(failures.length, 0, failures.join('\n'));
})().catch(e => { console.error(e); process.exit(1); });
