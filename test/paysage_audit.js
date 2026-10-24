const assert=require('node:assert/strict');
const fs=require('node:fs');
const {lancer,ouvrir}=require('./_commun');
const LOGIQUE=`window.__logique=()=>{const e=document.querySelector('[data-screen-label="Prototype V1"]');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];while(f){if(f.stateNode?.logic?.state)return f.stateNode.logic;f=f.return;}};`;
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout',{init:LOGIQUE,delai:0});
 await p.waitForFunction(()=>window.__scene&&__logique()?.state.pret,null,{timeout:60000});
 
 const out='test/logs/paysage-audit';fs.mkdirSync(out,{recursive:true});
 const mesures=await p.evaluate(()=>{
  const s=__scene, monde=s.app.stage.children[0],sh=monde.children.flatMap(c=>c.children||[]).find(c=>c.shader?.resources.uMasques)?.shader;
  const cv=sh.resources.uMasques.resource||sh.resources.uMasques._resource;
  const data=cv.getContext('2d').getImageData(0,0,720,1280).data;
  const masque=(x,y)=>Array.from(data.slice((y*720+x)*4,(y*720+x)*4+3));
  const nav=s.navigation();
  return {points:[[50,590],[90,610],[205,600],[560,610],[590,640],[630,680],[200,690],[300,670],[398,728],[163,730],[350,600],[370,750],[520,770],[30,1100]].map(([x,y])=>({x,y,m:masque(x,y)})),sortie:s.json.chemins.points.sortie,perf:s.perf};
 });console.log(JSON.stringify(mesures,null,2));
 for(const q of mesures.points.filter(q=>[50,90,205,560,590,630,200,300,163,370,520,30].includes(q.x))) assert.equal(q.m[0],0,'Pas d’eau sur terrain/ponton '+q.x+','+q.y);
 assert.equal(mesures.points.find(q=>q.x===350).m[0],255,'La mer reste animée');
 assert.equal(mesures.points.find(q=>q.x===370).m[1],0,'Le sable reste rigide');
 for(const [nom,h] of [['lever',6.5],['jour',12],['soir',19],['nuit',23]]){
  await p.evaluate(h=>__logique().setState({heure:h,horloge:'demo',sheet:null,nouvCarte:null,proj:null}),h);await p.waitForTimeout(1300);
  await p.screenshot({path:`${out}/${nom}.png`});
 }
 await p.evaluate(()=>{__logique().setState({heure:12,horloge:'demo'});__scene.emettre('expedition-depart',{compagnon:'minotaure'});});
 for(let i=0;i<65;i++){await p.evaluate(()=>__scene.avancer(1));if([5,12,20,34].includes(i)){console.log('embarquement',i+1,await p.evaluate(()=>({m:__scene.element('minotaure'),b:__scene.element('bateau').etat})));await p.screenshot({path:`${out}/depart-${i+1}.png`});}}
 assert.equal(await p.evaluate(()=>__scene.element('bateau').etat),'large','Départ complet');
 assert.equal(await p.evaluate(()=>__scene.element('minotaure').visible),false,'Compagnon embarqué');
 await p.evaluate(()=>__scene.emettre('expedition-retour',{compagnon:'minotaure'}));
 for(let i=0;i<70;i++){await p.evaluate(()=>__scene.avancer(1)); if(i%10===0)await p.waitForTimeout(100);}
 assert.equal(await p.evaluate(()=>__scene.element('bateau').etat),'amarre','Retour à quai');
 assert.equal(await p.evaluate(()=>__scene.element('minotaure').visible),true,'Compagnon revenu');
 await p.screenshot({path:out+'/retour.png'});
 await p.emulateMedia({reducedMotion:'reduce'});
 const t=await p.evaluate(()=>{__scene.avancer(1); return __scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0].shader.resources.u.uniforms.uTemps;});
 await p.evaluate(()=>__scene.avancer(5));
 assert.equal(await p.evaluate(()=>__scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0].shader.resources.u.uniforms.uTemps),t,'Effets figés en mouvement réduit');
 assert.deepEqual(p.errs,[]); console.log('PASS masques, sol, départ/retour, mouvement réduit, console');fs.writeFileSync(`${out}/mesures.json`,JSON.stringify(mesures,null,2));
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
