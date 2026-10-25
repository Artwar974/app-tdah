const assert=require('node:assert/strict'),fs=require('node:fs');
const {lancer,ouvrir}=require('./_commun');
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Camp-scene.html',{delai:0});await p.waitForFunction(()=>window.scene,null,{timeout:60000});
 await p.waitForTimeout(1800);
 const results=await p.evaluate(()=>{
  scene.pause();const mesh=scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0],u=mesh.shader.resources.u.uniforms;
  u.uTemps=8;u.uMerBaie=1;u.uVagues=1;
  const render=phase=>{u.uMerPhase=phase;return scene.app.renderer.extract.pixels({target:mesh,frame:new scene.PIXI.Rectangle(0,0,720,1280),resolution:1});};
  const a=render(0),b=render(Math.PI/2),c=render(Math.PI*2),delta=(f,g,x,y)=>{const i=(y*720+x)*4;return Math.max(...[0,1,2].map(k=>Math.abs(f.pixels[i+k]-g.pixels[i+k])));};
  let motion=0,loop=0;for(let y=395;y<780;y++)for(let x=0;x<720;x++){if(delta(a,b,x,y)>2)motion++;loop=Math.max(loop,delta(a,c,x,y));}
  const dry=[[200,690],[260,670],[340,643],[50,590],[205,600],[590,640],[370,800],[360,1100]].map(([x,y])=>({x,y,delta:delta(a,b,x,y)}));
  const map=mesh.shader.resources.uRivage.resource,mapData=map.getContext('2d').getImageData(0,0,360,640).data;
  const distance=(x,y)=>(mapData[(Math.floor(y/2)*360+Math.floor(x/2))*4]/255-.5)*192;
  return {motion,loop,dry,waterDistance:distance(398,728),sandDistance:distance(370,780),mer:scene.mer};
 });console.log(results);
 assert.ok(results.motion>1000,'Vagues réellement animées');assert.ok(results.loop<=1,'Raccord de boucle à 48 s');
 for(const q of results.dry)assert.equal(q.delta,0,'Décor immobile '+q.x+','+q.y);
 assert.ok(results.waterDistance>0&&results.sandDistance<0,'Distance signée eau/terre');
 fs.mkdirSync('test/logs/mer-baie',{recursive:true});
 // Compare the cost of rendering the same background, in the same session (software GPU here).
 const timings=await p.evaluate(()=>{const mesh=scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0],u=mesh.shader.resources.u.uniforms,out={};for(const mode of [0,1]){u.uMerBaie=mode;scene.app.renderer.render(scene.app.stage);const t=performance.now();for(let i=0;i<12;i++)scene.app.renderer.render(scene.app.stage);out[mode?'baie':'ancienne']=(performance.now()-t)/12;}return out;});
 console.log('Rendu CPU/soumission GPU (ms, pas une mesure du GPU physique)',timings);
 for(const [name,phase] of [['phase-0',0],['phase-12',Math.PI/2],['phase-24',Math.PI]]){
  await p.evaluate(phase=>{const m=scene.app.stage.children[0].children.find(c=>c.label==='fond').children[0];m.shader.resources.u.uniforms.uMerPhase=phase;scene.app.renderer.render(scene.app.stage);},phase);
  await p.screenshot({path:`test/logs/mer-baie/${name}.png`});
 }
 await p.click('#merBaie');assert.equal(await p.evaluate(()=>scene.reglages.merBaie),0);await p.click('#merBaie');assert.equal(await p.evaluate(()=>scene.reglages.merBaie),1);
 assert.deepEqual(p.errs,[]);fs.writeFileSync('test/logs/mer-baie/mesures.json',JSON.stringify({results,timings},null,2));
 console.log('PASS mer : boucle, mouvement, masque du ponton/terre, retour ancienne version');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1)});
