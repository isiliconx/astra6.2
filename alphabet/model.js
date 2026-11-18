/* Lattice visual hull, meshing, projection and binary STL. No dependencies. */
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.AlphabetCast=api})(globalThis,function(){
'use strict';
const X=34,Y=48,Z=44, pitch=1.4;
const frontOuter=[[0,0],[19,0],[25,1],[30,4],[33,8],[34,13],[33,17],[30,21],[26,23],[29,25],[31,29],[31,34],[29,38],[26,41],[22,43],[17,44],[0,44]];
const frontCuts=[[[8,7],[18,7],[23,8],[25,11],[25,14],[23,17],[19,19],[8,19]],[[8,26],[17,26],[21,27],[23,30],[23,33],[21,36],[17,37],[8,37]]];
// Side silhouette: a swift, beak to the right, swept primaries above and below.
const swift=[[0,27],[7,26],[12,25],[16,24],[19,25],[16,31],[15,37],[15,44],[18,44],[21,38],[26,32],[29,28],[32,26],[36,26],[39,27],[42,27],[45,25],[48,23],[48,22],[43,22],[40,20],[34,19],[30,17],[26,12],[22,6],[17,0],[15,0],[16,8],[17,14],[18,19],[13,20],[7,18],[1,17],[6,21],[9,23],[4,24],[0,23]];
function inside(x,y,p){let yes=false;for(let i=0,j=p.length-1;i<p.length;j=i++){const [a,b]=p[i],[c,d]=p[j];if((b>y)!==(d>y)&&x<(c-a)*(y-b)/(d-b)+a)yes=!yes}return yes}
function target(k,a,b){const s=a+.5,t=b+.5;if(k===0)return inside(s,t,frontOuter)&&!frontCuts.some(p=>inside(s,t,p));if(k===1)return a<8||(b<8&&a<27)||(b>=14&&b<26&&a<34)||(b>=40&&a<27);return inside(s,t,swift)}
const dims=[[X,Z],[X,Y],[Y,Z]], axisSteps=[[1,0,0],[-1,0,0],[0,1,0],[0,-1,0],[0,0,1],[0,0,-1]];
const faces=[[[1,0,0],[1,1,0],[1,1,1],[1,0,1]],[[0,0,0],[0,0,1],[0,1,1],[0,1,0]],[[0,1,0],[0,1,1],[1,1,1],[1,1,0]],[[0,0,0],[1,0,0],[1,0,1],[0,0,1]],[[0,0,1],[1,0,1],[1,1,1],[0,1,1]],[[0,0,0],[0,1,0],[1,1,0],[1,0,0]]];
function build(){const masks=dims.map(([w,h],k)=>Uint8Array.from({length:w*h},(_,i)=>+target(k,i%w,i/w|0))),actual=dims.map(([w,h])=>new Uint8Array(w*h)),cells=new Uint8Array(X*Y*Z);
const ix=(x,y,z)=>x+X*(y+Y*z),has=(x,y,z)=>x>=0&&x<X&&y>=0&&y<Y&&z>=0&&z<Z&&!!cells[ix(x,y,z)];
let count=0;
for(let z=0;z<Z;z++)for(let y=0;y<Y;y++)for(let x=0;x<X;x++)if(masks[0][x+X*z]&&masks[1][x+X*y]&&masks[2][y+Y*z]){cells[ix(x,y,z)]=1;count++;actual[0][x+X*z]=actual[1][x+X*y]=actual[2][y+Y*z]=1}
const quads=[];for(let z=0;z<Z;z++)for(let y=0;y<Y;y++)for(let x=0;x<X;x++)if(has(x,y,z))for(let f=0;f<6;f++){const [a,b,c]=axisSteps[f];if(!has(x+a,y+b,z+c))quads.push([f,x,y,z])}
const iou=masks.map((m,k)=>{let u=0,n=0;for(let i=0;i<m.length;i++){u+=!!(m[i]||actual[k][i]);n+=!!(m[i]&&actual[k][i])}return n/u});
return {cells,actual,masks,quads,has,count,iou}}
function corners(q){const [f,x,y,z]=q;return faces[f].map(([a,b,c])=>[x+a,y+b,z+c])}
function stl(m){const triangles=m.quads.length*2,ab=new ArrayBuffer(84+triangles*50),v=new DataView(ab);let off=84;new Uint8Array(ab).set(new TextEncoder().encode('Impossible Alphabet | 1.4 mm pitch | swift face down'));v.setUint32(80,triangles,true);for(const q of m.quads){const p=corners(q),[nx,ny,nz]=axisSteps[q[0]];for(const tri of [[0,1,2],[0,2,3]]){for(const a of [ny,nz,nx]){v.setFloat32(off,a,true);off+=4}for(const i of tri){const [x,y,z]=p[i];for(const a of [y,z,x]){v.setFloat32(off,a*pitch,true);off+=4}}off+=2}}return ab}
// Off-axis silhouette IoU about each view's vertical axis. Sample 3x3 per cell;
// exact projected rectangles suffice because all faces align with that vertical axis.
function offAxis(m,k,degrees,ss=3){const amp=80,w=amp*ss,c=w/2,ref=new Uint8Array(w*w),out=new Uint8Array(w*w),rad=degrees*Math.PI/180,cs=Math.cos(rad),sn=Math.sin(rad),[rw,rh]=dims[k];
for(let b=0;b<rh;b++)for(let a=0;a<rw;a++)if(m.masks[k][a+rw*b])for(let j=0;j<ss;j++){let s=(c+(b-rh/2)*ss+j)*w+c+(a-rw/2)*ss;ref.fill(1,s,s+ss)}
for(let q of m.quads){let x0=1e5,x1=-1e5,y0=1e5,y1=-1e5;for(let [x,y,z] of corners(q)){x-=X/2;y-=Y/2;z-=Z/2;const u=k===2?y:x,v=k===1?y:z,d=k===0?-y:k===1?z:x,h=u*cs-d*sn;x0=Math.min(x0,h);x1=Math.max(x1,h);y0=Math.min(y0,v);y1=Math.max(y1,v)}x0=Math.ceil(c+x0*ss-.5);x1=Math.ceil(c+x1*ss-.5);y0=Math.ceil(c+y0*ss-.5);y1=Math.ceil(c+y1*ss-.5);if(x1<=x0)continue;for(let j=y0;j<y1;j++)out.fill(1,j*w+x0,j*w+x1)}
let n=0,u=0;for(let i=0;i<ref.length;i++){n+=!!(ref[i]&&out[i]);u+=!!(ref[i]||out[i])}return n/u}
return {X,Y,Z,pitch,dims,axisSteps,faces,corners,target,build,stl,offAxis}
});
