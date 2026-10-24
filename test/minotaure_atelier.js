const assert=require('node:assert/strict');const {lancer,ouvrir}=require('./_commun');
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'atelier.html',{viewport:{width:1100,height:850},delai:0});
 await p.waitForFunction(()=>window.__atelier?.p,{timeout:30000});
 await p.locator('#squelette').click();await p.locator('#pause-rig').click();
 await p.locator('#os').selectOption('avantBrasD');await p.locator('#rotation-os').fill('60');await p.locator('#rotation-os').dispatchEvent('input');
 const r=await p.evaluate(()=>__atelier.p.diagnostic().find(b=>b.name==='avantBrasD'));assert.ok(Math.abs(r.rotation-Math.PI/3)<1e-8);
 assert.equal(await p.locator('#squelette').getAttribute('aria-pressed'),'true');
 await p.screenshot({path:'test/logs/minotaure-rig/atelier-squelette.png'});
 await p.locator('#reset-rig').click();assert.equal(await p.locator('#rotation-os').inputValue(),'0');
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(100);const before=await p.evaluate(()=>__atelier.p.diagnostic());await p.waitForTimeout(200);assert.deepEqual(await p.evaluate(()=>__atelier.p.diagnostic()),before);
 assert.deepEqual(p.errs,[]);console.log('PASS Atelier : squelette visible, coude indépendant, remise à zéro, mouvement réduit');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
