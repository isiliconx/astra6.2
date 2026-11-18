// Optional CPU renderer audit, using a local Canvas implementation only.
const {createCanvas}=require('@napi-rs/canvas'),assert=require('node:assert/strict'),g=require('./model.js'),m=g.build(),W=395,H=395;globalThis.AlphabetCast=g;globalThis.window={devicePixelRatio:1};globalThis.document={createElement:()=>createCanvas(2,2)};require('./render.js');
const c=createCanvas(W,H);c.clientWidth=W;c.clientHeight=H;const r=CastRender.renderer(c,m),context=c.getContext('2d'),dpr=1,scale=Math.min(W/79,(H-45*dpr)/70);
for(let [k,[az,el]] of [[0,0],[0,Math.PI/2],[Math.PI/2,0]].entries()){
 r(az,el,true);const data=context.getImageData(0,0,W,H).data,[sw,sh]=g.dims[k];let checks=0;
 for(let y=-2;y<sh+2;y++)for(let x=-2;x<sw+2;x++){const xx=Math.floor(W*.505+scale*(x+.5-sw/2)),yy=Math.floor(H*.46-scale*(y+.5-sh/2));let expected=x>=0&&x<sw&&y>=0&&y<sh&&!!m.actual[k][x+sw*y];assert.equal(!!data[4*(xx+W*yy)+3],!!expected);checks++}console.log('Axis '+k+': '+checks+' CPU-rendered sample rays match the model.')}
r(.66,.42,false);let img=context.getImageData(0,0,W,H).data,colors=new Set();for(let i=0;i<img.length;i+=4)if(img[i+3]===255)colors.add((img[i]<<16)+(img[i+1]<<8)+img[i+2]);assert.ok(colors.size>400);console.log('Orbit renderer: '+colors.size+' distinct opaque colors.');
