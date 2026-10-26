const assert=require('node:assert/strict'),fs=require('node:fs');const {lancer,ouvrir}=require('./_commun');
const LOGIQUE=`window.__logique=()=>{const e=document.querySelector('[data-screen-label="Prototype V1"]');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];while(f){if(f.stateNode?.logic?.state)return f.stateNode.logic;f=f.return;}};`;
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout&auberge=5&batiments=comptoir:5,forge:5,expeditions:4,social:4&objets=tous&compagnons=3',{init:LOGIQUE,delai:0});await p.waitForFunction(()=>window.__scene&&__logique()?.state.pret,null,{timeout:60000});
 await p.evaluate(()=>{__logique().setState({heure:12,horloge:'demo',proj:null,nouvCarte:null,appris:{...__logique().state.appris,balayer:2}});void __scene.perf;});await p.waitForTimeout(2200);
 const m=await p.evaluate(()=>({ids:__scene.elements().filter(id=>__scene.compagnon(id)).map(id=>({id,modele:__scene.compagnon(id).def.modele})),perf:__scene.perf}));assert.equal(m.ids.length,3);assert.ok(m.ids.every(c=>c.modele==='minotaure-v2'));assert.ok(m.perf.moyenneMs<10,'Boucle du camp < 10 ms');console.log(m);
 await p.screenshot({path:'test/logs/minotaure-v2/camp-complet.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(700);const phase=await p.evaluate(()=>__scene.compagnon('minotaure').phaseMarche);await p.evaluate(()=>__scene.avancer(3));assert.equal(await p.evaluate(()=>__scene.compagnon('minotaure').phaseMarche),phase);
 assert.deepEqual(p.errs,[]);console.log('PASS trois compagnons, bâtiments niveau 5, budget de boucle et mouvement réduit');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
