// La refonte de mer est annulée : vérifier le moteur restauré et le paysage conservé.
const assert=require('node:assert/strict'),fs=require('node:fs'),cp=require('node:child_process');
for(const f of ['demo/commun/athena-scene.js']) assert.deepEqual(fs.readFileSync(f),cp.execFileSync('git',['show','backup/mer-avant-refonte-20261025:'+f]));
console.log('PASS moteur et masque identiques à la sauvegarde');
require('./paysage_audit');
