/* Local software surface renderer: textured triangles, orthographic projection, depth buffer. */
(function(){
const {TAU,profile,envelope}=Kiln, W=512,H=256, A=68,B=42, tilt=.27,ct=Math.cos(tilt),st=Math.sin(tilt);
function mix(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
function smooth(a,b,x){let t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
function band(u,p,w){return 1-smooth(w*.82,w,Math.abs(u-p))}
function noise(x,y){let n=Math.imul(x+19071,1597334677)^Math.imul(y+3819,3812015801);n=Math.imul(n^(n>>>16),0x45d9f3b);return ((n^(n>>>16))>>>0)/4294967295}
const pigments=[],cosA=Array.from({length:W},(_,i)=>Math.cos(i/W*TAU)),sinA=Array.from({length:W},(_,i)=>Math.sin(i/W*TAU));
function tex(g){let bake=!pigments[g.kind],paint=pigments[g.kind]||(pigments[g.kind]=new Float32Array(W*H*4)),out=new Uint8ClampedArray(W*H*4),inner=new Uint8ClampedArray(W*H*4);for(let j=0;j<H;j++){let u=j/(H-1),slope=g.radius/g.height*(profile(g.kind,u+.002)-profile(g.kind,u-.002))/(u<.002||u>.998?.002:.004),len=Math.hypot(1,slope),up=-slope/len;
 for(let i=0;i<W;i++){let a=i/W*TAU,c=cosA[i],s=sinA[i],ix=4*(i+j*W);if(bake){let nn=noise(i,j),drift=.0025*Math.sin(3*a)+.0016*Math.sin(7*a+1),v=u+drift,throwing=Math.sin(u*360+.45*Math.sin(5*a)),p=[0,0,0];
 if(g.kind===0){p=mix([142,58,35],[224,134,79],.38+.23*Math.sin(2*a+u*4)+.16*Math.sin(u*18+a));let dark=[87,46,41],cream=[243,187,127];p=mix(p,dark,.8*Math.max(band(v,.19,.012),band(v,.67,.014),band(v,.72,.009),band(v,.93,.014)));p=mix(p,cream,.9*Math.max(band(v,.218,.008),band(v,.695,.008),band(v,.746,.006)));
 let arc=.39+.098*Math.cos(9*a);p=mix(p,dark,.84*band(v,arc,.015));p=mix(p,cream,.77*band(v,arc+.044,.011));}
 if(g.kind===1){p=mix([31,45,81],[71,104,145],.44+.24*Math.sin(a*3+u*12)+.1*Math.sin(u*29));let slip=[183,193,187],cream=[221,211,184];
 let motif=0;for(let k=0;k<2;k++){let b=a*7+k*Math.PI,t=.5+.5*Math.sin(b);let wave=.445+.12*Math.sin(b);motif=Math.max(motif,band(v,wave,.009+.019*t)*smooth(.01,.23,t));}
 p=mix(p,slip,.85*motif);p=mix(p,cream,.86*Math.max(band(v,.235,.008),band(v,.252,.005),band(v,.648,.013),band(v,.683,.005),band(v,.92,.014)));}
 if(g.kind===2){p=mix([102,136,126],[173,199,157],.45+.2*Math.sin(a*3+u*8)+.12*Math.sin(u*22+a));p=mix(p,[56,82,77],.75*Math.max(band(v,.115,.021),band(v,.76,.009),band(v,.805,.013),band(v,.95,.008)));
 let frac=(a/TAU*21)%1,k=Math.abs(frac-.5);p=mix(p,[230,221,175],.82*(1-smooth(.015,.038,k))*(1-smooth(.075,.085,Math.abs(v-.55-.04*Math.cos(frac*TAU)))));}
 paint[ix]=p[0];paint[ix+1]=p[1];paint[ix+2]=p[2];paint[ix+3]=(nn-.5)*11+throwing*2.6+(nn>.992?-30:0);}
 let light=(c*(-.51)+s*.52)/len+up*.68,sp=Math.max(0,(c*(-.29)+s*.80)/len+up*.52);
 let val=.60+.42*Math.max(0,light)+.12*Math.min(0,light),gloss=(g.kind===1?45:g.kind===2?32:17)*Math.pow(sp,14),grain=paint[ix+3];
 for(let k=0;k<3;k++){out[ix+k]=paint[ix+k]*val+gloss+grain;inner[ix+k]=paint[ix+k]*(.20+.35*Math.max(0,-light)+.16*u)+grain*.45;}out[4*(i+j*W)+3]=inner[4*(i+j*W)+3]=255;
 }}
 return [out,inner]}
function build(g){let rings=[],texs=tex(g);for(let j=0;j<=B;j++){let u=j/B,rad=g.radius*profile(g.kind,u),row=[];for(let i=0;i<=A;i++){let theta=i/A*TAU;row.push({c:Math.cos(theta),s:Math.sin(theta),m:[2,3,4,5,6].map(n=>Kiln.surface(n,u,theta)),v:[2,3,4,5,6].map(n=>Kiln.tangent(n,u,theta)),u,a:i/A,rad})}rings.push(row)}return {g:{...g},rings,texs}}
function render(canvas,shell,levels,displayScale){let ctx=canvas.getContext('2d'),w=canvas.width,h=canvas.height;if(!w||!h)return;const img=ctx.createImageData(w,h),data=new Uint32Array(img.data.buffer),z=new Float32Array(w*h);z.fill(-1e4);
 const {g,rings,texs}=shell,tables=texs.map(buf=>new Uint32Array(buf.buffer)),scale=Math.min(w/24,h/23)*displayScale,base=h*.86,center=w/2;
 function vert(v,inner){let d=0,t=0;if(levels)for(let k=0;k<5;k++){d+=v.m[k]*levels[k];t+=v.v[k]*levels[k]}t*=g.radius;let r=Math.max(.1,v.rad+g.radius*d-(inner?g.wall/10:0)),f=r*v.s+t*v.c,y=g.height*v.u;return [center+(r*v.c-t*v.s)*scale,base+(-y*ct+f*st)*scale,f*ct+y*st,v.a*W,v.u*(H-1)]}
 function tri(p,q,r,table,rim){let x0=p[0],y0=p[1],dx=q[0]-x0,dy=q[1]-y0,ex=r[0]-x0,ey=r[1]-y0,den=dx*ey-dy*ex;if(Math.abs(den)<.001)return;let ux=ey/den,uy=-ex/den,vx=-dy/den,vy=dx/den,minx=Math.max(0,Math.floor(Math.min(x0,q[0],r[0]))),maxx=Math.min(w-1,Math.ceil(Math.max(x0,q[0],r[0]))),miny=Math.max(0,Math.floor(Math.min(y0,q[1],r[1]))),maxy=Math.min(h-1,Math.ceil(Math.max(y0,q[1],r[1])));
 let z1=q[2]-p[2],z2=r[2]-p[2],a1=q[3]-p[3],a2=r[3]-p[3],b1=q[4]-p[4],b2=r[4]-p[4];for(let y=miny;y<=maxy;y++){let u=(minx+.5-x0)*ux+(y+.5-y0)*uy,v=(minx+.5-x0)*vx+(y+.5-y0)*vy,off=y*w+minx;for(let x=minx;x<=maxx;x++,off++,u+=ux,v+=vx){if(u<-.0001||v<-.0001||u+v>1.0001)continue;let zz=p[2]+z1*u+z2*v;if(zz<=z[off])continue;z[off]=zz;let a=(p[3]+a1*u+a2*v)|0,b=Math.max(0,Math.min(H-1,(p[4]+b1*u+b2*v)|0));data[off]=rim||table[(a&(W-1))+b*W];}}}
 let last;for(let side=0;side<2;side++){let prev=null;const start=side?Math.floor(.51*B):0;for(let j=start;j<=B;j++){let row=rings[j].map(v=>vert(v,side));if(prev)for(let i=0;i<A;i++){tri(prev[i],prev[i+1],row[i+1],tables[side],0);tri(prev[i],row[i+1],row[i],tables[side],0);}prev=row}
 if(!side)last=prev;else for(let i=0;i<A;i++){let rgb=[[182,118,82],[146,150,145],[174,178,143]][g.kind],mult=.8+.2*Math.sin(i/A*TAU);let col=(0xff000000|((rgb[2]*mult)<<16)|((rgb[1]*mult)<<8)|(rgb[0]*mult))>>>0;tri(last[i],last[i+1],prev[i+1],null,col);tri(last[i],prev[i+1],prev[i],null,col);}}
 ctx.putImageData(img,0,0)}
window.Glaze={build,render};
})();
