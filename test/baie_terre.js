const assert=require('node:assert/strict');
const {lancer,ouvrir}=require('./_commun');
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout',{delai:0});
 await p.waitForFunction(()=>window.__scene,null,{timeout:60000});await p.waitForTimeout(1800);
 const result=await p.evaluate(()=>{
 const s=__scene;s.pause();const mesh=s.app.stage.children[0].children.find(c=>c.label==='fond').children[0];
 const read=()=>{const a=s.app.renderer.extract.pixels({target:mesh});return [[350,600],[420,620],[550,700],[400,700],[370,900]].map(([x,y])=>Array.from(a.pixels.slice((Math.floor(y*a.height/1280)*a.width+Math.floor(x*a.width/720))*4,(Math.floor(y*a.height/1280)*a.width+Math.floor(x*a.width/720))*4+3)));};
 const before=read(),old=mesh.shader.resources.uBaie,cv=document.createElement('canvas');cv.width=cv.height=4;const g=cv.getContext('2d');g.fillStyle='#ff00ff';g.fillRect(0,0,4,4);const tx=s.PIXI.Texture.from(cv);mesh.shader.resources.uBaie=tx.source;
 const after=read();mesh.shader.resources.uBaie=old;tx.destroy(true);return {before,after};
 });console.log(result);
 for(let i=0;i<4;i++) assert.deepEqual(result.before[i],result.after[i],'La texture du nouveau décor ne doit contribuer aucun pixel à la mer, point '+i);
 assert.notDeepEqual(result.before[4],result.after[4],'La texture reste utilisée sur la terre');
 assert.deepEqual(p.errs,[]);console.log('PASS intégration terre seule');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
