const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../demo/assets/scene/minotaure-v2');
const d=JSON.parse(fs.readFileSync(path.join(root,'minotaure.json')));
for(const [name,v] of Object.entries(d.vues)){
 assert.ok(v.squelette,`${name}: vrai squelette requis, pas de déformation de la texture entière`);
 assert.ok(!v.maillage,`${name}: ancien maillage désactivé`);
 assert.ok(fs.existsSync(path.join(root,v.squelette.atlas)));
 const os=v.squelette.os;
 for(const side of ['G','D']){
  assert.equal(os['avantBras'+side].parent,'bras'+side);
  assert.equal(os['main'+side].parent,'avantBras'+side);
  assert.equal(os['tibia'+side].parent,'jambe'+side);
  assert.equal(os['pied'+side].parent,'tibia'+side);
 }
 for(const [k,b] of Object.entries(os)){
  assert.ok(b.pivot.every(Number.isFinite));
  const seen=new Set([k]);let parent=b.parent;
  while(parent){assert.ok(os[parent]);assert.ok(!seen.has(parent),'Pas de cycle');seen.add(parent);parent=os[parent].parent;}
 }
}
console.log('PASS neuf squelettes, chaînes articulées et atlas présents');
