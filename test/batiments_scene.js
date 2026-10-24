const assert=require('node:assert/strict'),fs=require('node:fs');const {lancer,ouvrir}=require('./_commun');
const LOGIQUE=`window.__logique=()=>{const e=document.querySelector('[data-screen-label="Prototype V1"]');let f=e?.[Object.keys(e).find(k=>k.startsWith('__reactFiber$'))];while(f){if(f.stateNode?.logic?.state)return f.stateNode.logic;f=f.return;}};`;
(async()=>{const b=await lancer();try{
 const p=await ouvrir(b,'Prototype.dc.html?app=1#ecran=camp&nouv=tout&auberge=5&batiments=comptoir:5,forge:5,expeditions:4,social:4&objets=tous',{init:LOGIQUE,delai:0});await p.waitForFunction(()=>__logique?.()?.state.pret&&window.__scene,null,{timeout:60000});
 fs.mkdirSync('test/logs/batiments',{recursive:true});
 for(let n=1;n<=5;n++){
  await p.evaluate(n=>{const l=__logique(),eco=JSON.parse(JSON.stringify(l.state.eco));Object.assign(eco.batiments,{auberge:n,comptoir:n,forge:n,expeditions:4,social:4});eco.chantiers=[];l.setState({eco,heure:12,horloge:'demo',sheet:null,proj:null,nouvCarte:null,appris:{...l.state.appris,balayer:2}});},n);
  await p.waitForTimeout(1700);
  const a=await p.evaluate(()=>['tente','bat-comptoir','bat-forge'].map(id=>({id,def:__scene.element(id).def,box:__scene.boite(id)})));
  for(const e of a){assert.equal(e.def.niveau,n);assert.equal(e.def.type,'batiment');assert.ok(e.box[0]>=0&&e.box[2]<=720&&e.box[1]>700&&e.box[3]<1250,e.id+' contenu dans le camp');}
  for(let i=0;i<a.length;i++)for(let j=i+1;j<a.length;j++){const x=a[i].box,y=a[j].box;assert.ok(x[2]<y[0]||y[2]<x[0]||x[3]<y[1]||y[3]<x[1],'Bâtiments séparés '+n);}
  await p.screenshot({path:`test/logs/batiments/niveau-${n}.png`});console.log('PASS niveau',n,a.map(e=>({id:e.id,box:e.box})));
 }
 const acces=await p.evaluate(()=>{const s=__scene,n=s.navigation(),id=(x,y)=>Math.floor(y/n.c)*n.w+Math.floor(x/n.c);const depart=s.element('minotaure'),todo=[id(depart.x,depart.y)],vus=new Set(todo);for(let k=0;k<todo.length;k++){const i=todo[k],x=i%n.w;for(const j of [i-n.w,i+n.w,...(x?[i-1]:[]),...(x<n.w-1?[i+1]:[])])if(j>=0&&j<n.g.length&&n.g[j]&&!vus.has(j)){vus.add(j);todo.push(j);}}return {port:vus.has(id(...s.json.chemins.points.sortie)),coffre:vus.has(id(...s.json.chemins.points.coffre)),comptoir:vus.has(id(...s.json.chemins.points.comptoir))};});
 assert.deepEqual(acces,{port:true,coffre:true,comptoir:true},'Passages du camp au niveau 5');
 await p.evaluate(()=>__logique().ouvrirFe('plan'));await p.waitForTimeout(600);
 assert.ok(await p.locator('[aria-label="Niveau 5 sur 5"]').count()>=3,'Les trois améliorations affichent cinq niveaux');
 await p.screenshot({path:'test/logs/batiments/plan-niveau-5.png'});
 await p.evaluate(()=>__logique().setState({fe:null,sheet:null}));await p.waitForTimeout(300);
 for(const id of ['tente','bat-comptoir','bat-forge']){
  const q=await p.evaluate(id=>{const b=__scene.boite(id),cam=__scene.camera();return {x:(b[0]+b[2])/2*innerWidth/720,y:(b[1]*.35+b[3]*.65)*cam.hauteurVisible/1280};},id);
  await p.mouse.click(q.x,q.y);await p.waitForTimeout(500);
  const open=await p.evaluate(()=>({fe:__logique().state.fe?.k,sheet:__logique().state.sheet}));
  assert.ok(open.fe||open.sheet,'Zone de toucher du bâtiment '+id);
  await p.evaluate(()=>__logique().setState({fe:null,sheet:null}));await p.waitForTimeout(300);
 }
 console.log('PASS passages, plan à cinq niveaux et zones de toucher');
 await p.evaluate(()=>__logique().setState({heure:23,sheet:null}));await p.waitForTimeout(1600);await p.screenshot({path:'test/logs/batiments/nuit.png'});
 await p.emulateMedia({reducedMotion:'reduce'});await p.waitForTimeout(300);
 await p.evaluate(()=>__logique().ouvrirFe('plan'));await p.waitForTimeout(300);await p.evaluate(()=>__logique().setState({fe:null}));
 assert.deepEqual(p.errs,[]);console.log('PASS cinq niveaux, placement, nuit et console');
}finally{await b.close();}})().catch(e=>{console.error(e);process.exit(1);});
