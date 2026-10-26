const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const scene=require('../demo/commun/athena-scene.json');
assert.equal(scene.marionnettes.minotaure,'minotaure-v2/minotaure.json','Le camp utilise le nouveau modèle');
const root=path.resolve(__dirname,'../demo/assets/scene'),d=JSON.parse(fs.readFileSync(path.join(root,scene.marionnettes.minotaure),'utf8'));
for(const v of ['face','profil','dos','assis'])assert.ok(d.vues[v].squelette,v+' dispose de son squelette articule');
for(const [name,v] of Object.entries(d.vues)){assert.ok(fs.existsSync(path.join(root,'minotaure-v2',v.squelette.atlas)),name+' image présente');for(const k of ['torse','brasG','brasD','jambeG','jambeD','queue','pagne'])assert.ok(v.squelette.os[k],name+' articulation '+k);}
for(const a of ['repos','marche','assis','dort','aurevoir','content'])assert.ok(d.animations[a]);
assert.equal(new Set(d.directions.map(q=>d.vues[q.vue].squelette.atlas)).size,8,'Huit vues distinctes');assert.ok(d.directions.every(q=>q.miroir===false),'Les vues fournies sont utilisées directement');
console.log('PASS nouveau modèle, huit directions distinctes, articulations et états compatibles');
