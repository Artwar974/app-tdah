const assert = require('node:assert/strict');
const {lancer,ouvrir}=require('./_commun');
const fs=require('node:fs');
const LOGIQUE=`window.__logique=()=>{const e=document.querySelector('[data-screen-label="Prototype V1"]');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];while(f){if(f.stateNode?.logic?.state)return f.stateNode.logic;f=f.return;}};`;
(async()=>{
 const b=await lancer();
 try {
  const p=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout',{init:LOGIQUE,delai:0});
  await p.waitForFunction(()=>window.__scene&&__logique()?.state.pret,null,{timeout:60000});
  fs.mkdirSync('test/logs/baie',{recursive:true});
  for(const [nom,heure] of [['jour',12],['coucher',19],['nuit',23]]) {
   await p.evaluate(h=>__logique().setState({heure:h,horloge:'demo',sheet:null,nouvCarte:null,proj:null}),heure);
   await p.waitForTimeout(1700);
   assert.equal(await p.evaluate(()=>__scene.element('bat-ponton').def.x),163,'Le panneau rejoint la plage dans la vraie application');
   assert.ok(await p.evaluate(()=>__scene.json.fond.baie),'La nouvelle côte est active');
   await p.screenshot({path:`test/logs/baie/${nom}.png`});
   console.log(nom,await p.evaluate(()=>({perf:__scene.perf,camera:__scene.camera().tableau})));
  }
  await p.reload();await p.waitForFunction(()=>window.__scene,null,{timeout:60000});
  assert.equal(await p.evaluate(()=>__scene.element('bat-ponton').def.x),163,'Le rechargement conserve le port');
  assert.deepEqual(p.errs,[]);
  console.log('PASS baie jour/soir/nuit, port et rechargement sans erreur');
 } finally {await b.close();}
})().catch(e=>{console.error(e);process.exit(1);});
