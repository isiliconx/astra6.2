/* Zero-dependency mathematical, interaction and generated-markup checks. */
'use strict';const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');process.chdir(__dirname);
const City=require('./model.js');let worst=0,clear=Infinity,jump=0,minGap=Infinity;
for(const st of City.stalls){let last=null;
 for(let i=0;i<=1800;i++){const t=i/10,h=t*Math.PI/360,f=City.frame(st,t);for(let [foot,len] of [[f.A,f.L],[f.B,f.R]]){worst=Math.max(worst,Math.abs(Math.hypot(f.P[0]-foot[0],f.P[2]-foot[2])-len))}
  for(let side of [-1,1])for(let u of [0,.25,.5,.75,1]){let P=City.point(st,t,side,u*(side===1?f.R:f.L),st.y);
   // Interior half-space z sin(h) ± x cos(h) >= 0. Convex panels span the two tested ends.
   clear=Math.min(clear,P[2]*Math.sin(h)-Math.abs(P[0])*Math.cos(h));}
  if(last)jump=Math.max(jump,Math.hypot(f.P[0]-last[0],f.P[2]-last[2]));last=f.P;
 }const z=City.frame(st,0);assert.equal(z.P[0],0);assert.equal(z.P[2],st.p);assert.ok(st.p<=94);
 for(const other of City.stalls)if(other.y>st.y)minGap=Math.min(minGap,other.y-st.y-st.w);
 assert.ok(st.y+st.w<5.75-4.2||st.y>5.75+4.2,'tram body corridor fails');
}
assert.ok(worst<1e-8);assert.ok(clear> -1e-8);assert.ok(minGap>0);assert.ok(jump<.25);
let elements={},tick,now=0;const el=id=>elements[id]??=( {innerHTML:'',value:'',setAttribute(k,v){this[k]=v}} );const ctx={City,document:{getElementById:el},matchMedia:()=>({matches:false}),performance:{now:()=>now},requestAnimationFrame:f=>(tick=f,1),cancelAnimationFrame:()=>{tick=null}};
vm.runInNewContext(fs.readFileSync('scene.js','utf8'),ctx);let svg=fs.readFileSync('index.html','utf8').match(/<svg id="scene"[\s\S]*?<\/svg>/)[0].replace(/<g id="drawing"><\/g>/,'<g>'+el('drawing').innerHTML+'</g>').replace('<svg id="scene"','<svg xmlns="http://www.w3.org/2000/svg" width="900" height="545"');
assert.ok(svg.includes('TEA HALL'));assert.ok(!svg.includes('NaN'));assert.equal(el('degrees').value,'180°');el('angle').value=0;el('angle').oninput();assert.equal(el('degrees').value,'0°');assert.equal(el('tram').disabled,true);el('angle').value=180;el('angle').oninput();el('tram').onclick();tick(3000);assert.equal(el('tram').disabled,false);assert.match(el('status').textContent,/arrived/);el('turn').onclick();assert.match(el('status').textContent,/West/);assert.ok(!el('drawing').innerHTML.includes('NaN'));el('play').onclick();tick(1700);assert.equal(el('degrees').value,'90°');tick(3400);assert.equal(el('degrees').value,'180°');
ctx.matchMedia=()=>({matches:true});el('play').onclick();assert.equal(el('degrees').value,'0°');el('play').onclick();assert.equal(el('degrees').value,'180°');el('tram').onclick();assert.match(el('status').textContent,/arrived/);
vm.runInNewContext(fs.readFileSync('pattern.js','utf8'),ctx);const plates=[...el('sheets').innerHTML.matchAll(/(<svg[\s\S]*?<\/svg>)/g)].map(m=>m[1]);assert.equal(plates.length,3);assert.ok(plates[0].includes('width="50" height="5"'));assert.ok(!plates.join('').includes('NaN'));if(process.argv.includes('--svg')){fs.writeFileSync('scene-proof.svg',svg);for(let i=0;i<3;i++)fs.writeFileSync('plate-'+(i+1)+'.svg',plates[i])}
console.log('PASS: 7,204 sampled linkage configurations; max length error '+worst.toExponential(2)+' mm; worst page clearance '+clear.toExponential(2)+' mm (roundoff); largest per-0.1° ridge step '+jump.toFixed(4)+' mm; minimum inter-house frontage gap '+minGap+' mm. Closed fold inside cover; tram corridor clear; UI controls and three 1:1 print sheets checked.');
