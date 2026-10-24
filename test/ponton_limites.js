const assert=require('node:assert/strict');
const S=require('../demo/commun/athena-scene.json');
const deck=[[164,687],[194,695],[365,645],[335,637]];
const inside=([x,y])=>{let ok=false;for(let i=0,j=deck.length-1;i<deck.length;j=i++){const a=deck[i],b=deck[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])ok=!ok;}return ok;};
const boat=S.elements.find(e=>e.id==='bateau'),birds=S.elements.find(e=>e.id==='mouettes');
for(const p of birds.perchoirs)assert.ok(inside(p),'Perchoir sur les planches : '+p);
const start=S.chemins.points.sortie,end=boat.quai;
for(let k=0;k<=100;k++){const t=k/100;assert.ok(inside([start[0]+(end[0]-start[0])*t,start[1]+(end[1]-start[1])*t]),'Trajet au milieu des planches à '+t);}
for(const p of S.fond.baie.pontonMarche) assert.ok(inside(p),'Marge de marche à l’intérieur du tablier : '+p);
console.log('PASS perchoirs, marge de marche et trajet dans le tablier réel');
