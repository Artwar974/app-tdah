const assert=require('node:assert/strict'),fs=require('node:fs');const {lancer,ouvrir}=require('./_commun');
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Camp-scene.html',{viewport:{width:1000,height:700},delai:0});await p.waitForFunction(()=>window.scene,null,{timeout:60000});
 await p.evaluate(async()=>{scene.detruire();document.body.innerHTML='<canvas id="rig"></canvas>';document.body.style.cssText='margin:0;background:#e4ded1';
 const a=window.__rigApp=new PIXI.Application();await a.init({canvas:document.querySelector('#rig'),width:1000,height:700,background:0xe4ded1,antialias:true});a.stop();
 const m=window.__modele=await AthenaMarionnette.charger(PIXI,'assets/scene/minotaure-v2/minotaure.json');window.__rigs=['face','profil','dos'].map((v,i)=>{const r=m.creer();r.vue(v);r.profondeur(3.4);r.racine.position.set(175+i*325,580);r.renderer=a.renderer;a.stage.addChild(r.racine);return r;});
 window.__avance=(etat,seconds)=>{for(const r of __rigs){r.etat(etat);r.tete(etat==='dort'?'dort':etat==='content'?'content':'calme');}for(let i=0;i<seconds*60;i++)for(const r of __rigs)r.maj(1/60);a.renderer.render(a.stage);};__avance('repos',.5);});
 fs.mkdirSync('test/logs/minotaure-rig',{recursive:true});await p.screenshot({path:'test/logs/minotaure-rig/vues.png'});
 const before=await p.evaluate(()=>__rigs.map(r=>r.diagnostic()));
 for(const etat of ['marche','assis','dort','content','aurevoir','danse','applaudit','baille']){
  await p.evaluate(e=>__avance(e,.65),etat);
  const vals=await p.evaluate(()=>__rigs.map(r=>r.diagnostic()));
  for(const bones of vals)for(const bone of bones){assert.ok(Number.isFinite(bone.rotation));assert.equal(bone.sx,1);assert.equal(bone.sy,1);}
  await p.screenshot({path:`test/logs/minotaure-rig/${etat}.png`});
 }
 const after=await p.evaluate(()=>{__avance('marche',.4);return __rigs.map(r=>r.diagnostic());});assert.notDeepEqual(after,before,'Les articulations bougent');
 // Each child remains at exactly the same local offset: joint lengths cannot stretch.
 for(let n=0;n<3;n++)for(const bone of after[n]){const a=before[n].find(b=>b.name===bone.name);if(bone.name!=='bassin'){assert.equal(bone.x,a.x);assert.equal(bone.y,a.y);}}
 await p.evaluate(()=>{for(const r of __rigs){r.etat('repos');r.fige=true;r.maj(0);}__rigApp.renderer.render(__rigApp.stage);});const frozen=await p.screenshot();await p.evaluate(()=>{for(let i=0;i<120;i++)for(const r of __rigs)r.maj(1/60);__rigApp.renderer.render(__rigApp.stage);});assert.ok(frozen.equals(await p.screenshot()),'Mouvement réduit immobile');
 await p.evaluate(()=>{for(const r of __rigs){r.fige=false;r.etat('repos');r.tete('calme');r.porter('hache',true);}__avance('repos',.5);});await p.screenshot({path:'test/logs/minotaure-rig/hache.png'});
 const weapon=await p.evaluate(()=>__rigs.map(r=>{const find=c=>c.label==='accessoire-hache'&&c.visible||c.children?.some(find);return find(r.racine);}));assert.ok(weapon.every(Boolean),'Hache attachée à la main');
 const directions=await p.evaluate(()=>{__rigApp.stage.removeChildren().forEach(c=>c.destroy({children:true}));window.__huit=[];return __modele.def.directions.map((d,i)=>{const r=__modele.creer();__huit.push(r);r.profondeur(2.5);r.racine.position.set(125+(i%4)*250,i<4?310:655);__rigApp.stage.addChild(r.racine);for(let k=0;k<100;k++){r.orienter(d.angle);r.maj(1/60);}return {attendu:d.vue,vue:r.vueActive,miroir:r.miroirActif};});});
 for(const d of directions){assert.equal(d.vue,d.attendu);assert.equal(d.miroir,false);}await p.evaluate(()=>__rigApp.renderer.render(__rigApp.stage));await p.screenshot({path:'test/logs/minotaure-rig/huit-directions.png'});
 for(const state of ['marche','aurevoir']){
  await p.evaluate(state=>{for(const r of __huit){r.etat(state);for(let i=0;i<40;i++)r.maj(1/60);}__rigApp.renderer.render(__rigApp.stage);},state);
  await p.screenshot({path:`test/logs/minotaure-rig/huit-${state}.png`});
 }
 const manual=await p.evaluate(()=>{const r=__huit[0];r.etat('repos');r.fige=true;r.maj(0);const before=r.diagnostic();r.articulation('avantBrasD',60);r.maj(0);return {before,after:r.diagnostic()};});
 assert.ok(Math.abs(manual.after.find(b=>b.name==='avantBrasD').rotation-Math.PI/3)<1e-8);
 for(const b of manual.after)if(b.name!=='avantBrasD')assert.deepEqual(b,manual.before.find(a=>a.name===b.name),'Un seul os piloté, ses enfants héritent du parent');
 assert.deepEqual(p.errs,[]);console.log('PASS huit directions, huit animations, longueurs constantes des os, hache et mouvement réduit');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
