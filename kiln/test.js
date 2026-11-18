'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');const K=require('./model.js');
function near(x,y,t=1e-8){assert.ok(Math.abs(x-y)<t,`${x} != ${y} (tol ${t})`)}
const errors=[48,96,192,384].map(N=>Math.max(...K.reference(N).map(m=>m.error)));
assert.ok(errors[1]<1.32&&errors[2]<.331); for(let i=1;i<errors.length;i++)assert.ok(errors[i-1]/errors[i]>3.8);
console.log('Worst ring error (%), 48 / 96 / 192 / 384:',errors.map(e=>e.toFixed(5)).join(' / '));
// Independent continuous cylinder with axial curvature: integral q²=33/140 and integral (d²q/du²)²=3.
const n=2,R=.1,H=.12,h=.003,exact=h/(2*Math.PI)*Math.sqrt(55e9/(12*2350*(1-.22**2))*(((n*n-1)**2/R**4+3/(33/140)/H**4)/(1+1/n**2)));
let fixture=K.integrate(()=>R,H,h,K.envelope,[n],384,256)[0].f;
assert.ok(100*Math.abs(fixture/exact-1)<.02);console.log('Axially bending cylinder:',fixture.toFixed(4),'Hz vs closed form',exact.toFixed(4),'Hz');
let cents=0,targets=[[60,64,67],[57,60,64],[62,65,69]];
for(let triad of targets){K.defaults.forEach((g,i)=>{let target=440*2**((triad[i]-69)/12),wall=K.tune(g,target);assert.ok(wall>.6&&wall<7.5);let m=K.modes({...g,wall});cents=Math.max(cents,Math.abs(1200*Math.log2(m[0].f/target)));assert.ok(m.every((x,j)=>Number.isFinite(x.f)&&x.f>0&&(!j||x.f>m[j-1].f)));});}
assert.ok(cents<1e-8);console.log('Nine geometry-tuned target notes; worst tuning error:',cents.toExponential(2),'cents');
for(let g of K.defaults){let modes=K.modes(g);let thick=K.modes({...g,wall:g.wall*1.15}),wide=K.modes({...g,radius:g.radius*1.15}),short=K.modes({...g,height:g.height*.82}),scale=K.modes({...g,radius:g.radius*1.25,height:g.height*1.25});modes.forEach((m,i)=>{near(thick[i].f/m.f,1.15);near(scale[i].f/m.f,1/1.25**2)});assert.ok(wide[0].f<modes[0].f);assert.ok(Math.abs(short[0].f-modes[0].f)>1);near(K.surface(2,1,Math.PI/4),0);near(K.surface(2,1,Math.PI/2),-1);near(K.surface(2,0,.378),0);}
const win={};vm.runInNewContext(fs.readFileSync(__dirname+'/glaze.js','utf8'),{Kiln:K,window:win,Float32Array,Uint8ClampedArray,Uint32Array,Math});
const width=260,height=230;let pixels;const ctx={createImageData:(w,h)=>({data:new Uint8ClampedArray(w*h*4)}),putImageData:o=>pixels=o.data},canvas={width,height,getContext:()=>ctx};
K.defaults.forEach((g,i)=>{const shell=win.Glaze.build(g);win.Glaze.render(canvas,shell,null,1);let base=pixels.slice();let visible=base.filter((v,j)=>j%4===3&&v>0).length;assert.ok(visible>10000);
 if(process.env.KILN_RASTER_DIR){fs.writeFileSync(process.env.KILN_RASTER_DIR+'/vessel-'+i+'.rgba',base)}
 win.Glaze.render(canvas,shell,[.12,0,0,0,0],1);let changed=pixels.filter((v,j)=>v!==base[j]&&j%4===3).length;assert.ok(changed>30);console.log(K.names[i]+':',visible,'visible pixels;',changed,'silhouette pixels changed by mode 2')});
console.log('All modal, profile, tuning and software-renderer checks passed.');
