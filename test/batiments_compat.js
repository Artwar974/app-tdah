const assert=require('node:assert/strict');const fs=require('node:fs');const {lancer,ouvrir}=require('./_commun');
const LOGIQUE=`window.__logique=()=>{const e=document.querySelector('[data-screen-label="Prototype V1"]');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];while(f){if(f.stateNode?.logic?.state)return f.stateNode.logic;f=f.return;}};`;
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Camp-scene.html',{delai:0});await p.waitForFunction(()=>window.scene,null,{timeout:60000});await p.locator('#niveaux button').last().click();await p.waitForTimeout(300);
 assert.equal(await p.evaluate(()=>scene.element('tente').def.niveau),5);assert.equal(await p.evaluate(()=>scene.element('bat-forge').def.niveau),5);assert.deepEqual(p.errs,[]);console.log('PASS Camp-scene niveau 5');await p.close();
 const a=await ouvrir(b,'atelier.html',{delai:1200});assert.deepEqual(a.errs,[]);console.log('PASS atelier');await a.close();
 const f=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout&auberge=5&batiments=comptoir:5,forge:5',{init:LOGIQUE,delai:0});await f.waitForFunction(()=>window.__scene&&__logique()?.state.pret,null,{timeout:60000});
 await f.evaluate(()=>__logique().setState({forcerFixe:true}));await f.waitForTimeout(1200);
 const fixed=await f.evaluate(()=>__logique().batsFixes().filter(b=>['comptoir','forge'].includes(b.id)).map(b=>b.img));assert.equal(fixed.length,2);assert.ok(fixed.every(x=>/baie-.*-4.webp/.test(x)));assert.ok((await f.evaluate(()=>__logique().imgs().t5)).includes('baie-auberge-4.webp'),'Auberge du repli remplacée');assert.deepEqual(f.errs,[]);console.log('PASS sauvegarde niveau 5 : visuel actuel niveau 4 dans le repli');
 await f.screenshot({path:'test/logs/batiments/repli-niveau-5.png'});
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
