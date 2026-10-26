const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=JSON.parse(fs.readFileSync('demo/commun/athena-scene.json')),m=JSON.parse(fs.readFileSync('demo/assets/scene/batiments/modeles-baie.json'));
const ctx={window:{}};vm.createContext(ctx);vm.runInContext(fs.readFileSync('demo/athena-v1.js','utf8'),ctx);const v=ctx.window.ATHENA_V1;
const get=id=>s.elements.find(e=>e.id===id),f=get('feu');
for(const name of ['auberge','forge','comptoir']){
 assert.equal(m[name].length,4,name+' : quatre modèles');
 assert.equal(JSON.stringify(v.ILLUSTRATIONS_BATIMENTS[name]),JSON.stringify(m[name]),'Manifeste commun au repli HTML');
 for(const entry of m[name])assert.ok(fs.existsSync('demo/assets/scene/'+entry.image));
 const b=get(v.BATIMENTS[name].scene);assert.deepEqual([b.x,b.y,b.largeur],Array.from(v.BATIMENTS[name].place));
}
assert.ok(get('tente').x<f.x&&get('tente').y<f.y,'Auberge en haut à gauche');
assert.ok(get('bat-forge').x>f.x&&get('bat-forge').y<f.y,'Forge en haut à droite');
assert.ok(get('bat-comptoir').x>f.x&&get('bat-comptoir').y>f.y,'Comptoir en bas à droite');
assert.equal(f.planche,'feu-anime','Asset du feu conservé');
console.log('PASS douze modèles, implantation et feu conservé');
