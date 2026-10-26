const assert=require('node:assert/strict'),fs=require('node:fs');const {lancer,ouvrir}=require('./_commun');
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Camp-scene.html',{viewport:{width:720,height:1280},delai:0});await p.waitForFunction(()=>window.scene,null,{timeout:60000});
 const result=await p.evaluate(()=>{
  scene.pause();const mesh=scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0],u=mesh.shader.resources.u.uniforms;
  u.uNuage[1]=0;u.uMix=0;
  const frames=[];
  for(const t of [0,.9,2.1,3.7,5.4,7.2,9.5,12.8]){
   u.uTemps=t;u.uEtoiles=0;const a=scene.app.renderer.extract.pixels({target:mesh,resolution:1});
   u.uEtoiles=1;const z=scene.app.renderer.extract.pixels({target:mesh,resolution:1});
   const cells=[];
   for(let cy=2;cy<25;cy++)for(let cx=2;cx<100;cx++){
    let peak=0;for(let y=cy*7;y<(cy+1)*7;y++)for(let x=cx*7;x<(cx+1)*7;x++){
     const i=(Math.floor(y*a.height/1280)*a.width+Math.floor(x*a.width/720))*4;
     peak=Math.max(peak,z.pixels[i]-a.pixels[i]);
    }cells.push(peak);
   }frames.push(cells);
  }
  const stars=frames[0].map((_,i)=>frames.map(f=>f[i])).filter(v=>Math.max(...v)>25);
  const changing=stars.filter(v=>Math.max(...v)-Math.min(...v)>3),fixed=stars.filter(v=>Math.max(...v)-Math.min(...v)<=3);
  return {count:stars.length,changing:changing.length,fixed:fixed.length,fixedMin:Math.min(...fixed.map(v=>Math.min(...v))),curves:changing.slice(0,8)};
 });
 console.log(result);assert.ok(result.count>20,'Étoiles présentes');assert.ok(result.changing/result.count<.16,'Grande majorité fixe');assert.ok(result.changing>1,'Quelques étoiles scintillent');assert.ok(result.fixedMin>25,'Étoiles fixes lumineuses');assert.ok(new Set(result.curves.map(v=>JSON.stringify(v))).size>1,'Rythmes indépendants');
 assert.deepEqual(p.errs,[]);
 const app=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout',{delai:0});await app.waitForFunction(()=>window.__scene,null,{timeout:60000});
 await app.evaluate(()=>{window.__logique=()=>{const e=document.querySelector('[data-screen-label="Prototype V1"]');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];while(f){if(f.stateNode?.logic?.state)return f.stateNode.logic;f=f.return;}};});
 fs.mkdirSync('test/logs/etoiles',{recursive:true});
 for(const [nom,h] of [['soir',20],['nuit',23]]){
  await app.evaluate(h=>{const l=__logique();l.setState({heure:h,horloge:'demo',sheet:null,nouvCarte:null,proj:null});},h);await app.waitForTimeout(1400);
  await app.screenshot({path:`test/logs/etoiles/${nom}.png`});
 }
 await app.emulateMedia({reducedMotion:'reduce'});await app.waitForTimeout(200);
 const time=await app.evaluate(()=>__scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0].shader.resources.u.uniforms.uTemps);
 await app.evaluate(()=>__scene.avancer(4));assert.equal(await app.evaluate(()=>__scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0].shader.resources.u.uniforms.uTemps),time,'Scintillement figé en mouvement réduit');
 assert.deepEqual(app.errs,[]);console.log('PASS ciel : étoiles fixes majoritaires, minorité asynchrone, soir/nuit et mouvement réduit');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
