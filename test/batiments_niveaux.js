const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const ctx={window:{}};vm.createContext(ctx);for(const f of ['demo/athena-v1.js','demo/commun/athena-economie.js'])vm.runInContext(fs.readFileSync(f,'utf8'),ctx);
const V=ctx.window.ATHENA_V1,E=ctx.window.AthenaEconomie,b=V.JEU.eco;
for(const id of ['auberge','comptoir','forge']){assert.equal(b.batiments[id].max,5,id+' propose cinq niveaux');assert.ok(b.batiments[id].cout[5],id+' niveau 5 constructible');}
assert.equal(JSON.stringify(b),JSON.stringify(E.DEFAUT),'Les deux barèmes restent synchronisés');
let s=E.etatInitial(b,Date.now());s.bois=s.or=100000;s.expeditionsFinies=10;Object.keys(s.batiments).forEach(k=>s.batiments[k]=4);
assert.equal(E.peutAmeliorer(b,s,'auberge').ok,true);s.batiments.auberge=5;
for(const id of ['comptoir','forge'])assert.equal(E.peutAmeliorer(b,s,id).ok,true,id+' améliorable au niveau 5');
assert.equal(b.batisseurs[5],2);assert.equal(b.forge.parExpedition[5],b.forge.parExpedition[4]);
console.log('PASS niveau 5, coûts, prérequis et compatibilité du barème');
