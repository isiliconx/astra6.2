// Optional plate using the exact live renderer. Requires @napi-rs/canvas.
const {createCanvas}=require('@napi-rs/canvas'),fs=require('node:fs'),path=require('node:path');
globalThis.AlphabetCast=require('./model.js');globalThis.window={devicePixelRatio:1};
globalThis.document={createElement:()=>createCanvas(2,2)};require('./render.js');
const W=960,H=620,c=createCanvas(W,H);c.clientWidth=W;c.clientHeight=H;const draw=CastRender.renderer(c,AlphabetCast.build());
draw(.66,.42,false);const result=createCanvas(W,H),ctx=result.getContext('2d'),gradient=ctx.createRadialGradient(W*.49,H*.43,25,W*.5,H*.48,W*.61);
gradient.addColorStop(0,'#44483c');gradient.addColorStop(.61,'#30362e');gradient.addColorStop(1,'#242a24');ctx.fillStyle=gradient;ctx.fillRect(0,0,W,H);ctx.drawImage(c,0,0);
fs.writeFileSync(path.join(__dirname,'cover.jpg'),result.toBuffer('image/jpeg',90));
