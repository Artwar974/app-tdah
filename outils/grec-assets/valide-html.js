const fs=require('fs'),vm=require('vm');
const p=process.argv[2],s=fs.readFileSync(p,'utf8');
const blocks=[...s.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)].map(m=>m[1]);
if(!blocks.length)throw new Error('Aucun script trouvé');
blocks.forEach((code,i)=>new vm.Script(code,{filename:`script-${i+1}.js`}));
console.log(JSON.stringify({scripts:blocks.length,octets:Buffer.byteLength(s),tokens:(s.match(/__GREC_/g)||[]).length}));
