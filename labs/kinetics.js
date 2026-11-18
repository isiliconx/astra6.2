/* Astra Observatory · five instruments for the study of mechanisms and motion. */
(() => {
'use strict';
const experiments = window.ASTRA || (window.ASTRA=[]);
const T=2*Math.PI, clamp=(x,a,b)=>Math.max(a,Math.min(b,x)), lerp=(a,b,t)=>a+(b-a)*t;
const circle=(g,x,y,r,fill,stroke,lw=1)=>{g.beginPath();g.arc(x,y,r,0,T);if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}};
const line=(g,pts,col,width=1,dash=[])=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.strokeStyle=col;g.lineWidth=width;g.setLineDash(dash);g.stroke();g.setLineDash([])};
const text=(g,x,y,str,col,size=11,align='left')=>{g.font='500 '+size+'px ui-monospace,SFMono-Regular,Consolas,monospace';g.fillStyle=col;g.textAlign=align;g.textBaseline='middle';g.fillText(str,x,y)};
const poly=(g,pts,fill,stroke,lw=1)=>{g.beginPath();pts.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();if(fill){g.fillStyle=fill;g.fill()}if(stroke){g.strokeStyle=stroke;g.lineWidth=lw;g.stroke()}};
function stage(g,w,h,bg){g.save();g.fillStyle=bg;g.fillRect(0,0,w,h);const z=Math.min(w/800,h/450),ox=(w-800*z)/2,oy=(h-450*z)/2;g.translate(ox,oy);g.scale(z,z);g.lineCap='round';g.lineJoin='round';return (ptr)=>[(ptr.x*w-ox)/z,(ptr.y*h-oy)/z]}
const joint=(g,x,y,r,face,edge)=>{circle(g,x,y,r,face,edge,1.5);circle(g,x,y,Math.max(1.3,r*.24),edge)};
function corner(g,c){for(const [x,y,dx,dy] of [[18,18,1,1],[782,18,-1,1],[18,432,1,-1],[782,432,-1,-1]])line(g,[[x+dx*11,y],[x,y],[x,y+dy*11]],c,1)}
const P=(name,min,max,step,value)=>({name,min,max,step,value});
const ptr=s=>s.pointer||{x:.5,y:.5,down:false};
function tstep(s,t){const dt=s._lastT===undefined?0:clamp(t-s._lastT,0,.12);s._lastT=t;return dt}
function compass(g,x,y,r,color){for(let i=0;i<60;i++){const a=i*T/60,rr=r-(i%5?3:8);line(g,[[x+rr*Math.cos(a),y+rr*Math.sin(a)],[x+r*Math.cos(a),y+r*Math.sin(a)]],color,i%5?1:1.5)}}

experiments.push({
id:'geneva-index',title:'Geneva Index',category:'Kinetics',
description:'A continuously rotating pin advances a scalloped wheel one station, then leaves it perfectly still.',
method:'The pin moves on a circle of radius a·sin(π/N), where a is the axle spacing. During engagement the slot aims at the pin; between engagements the output angle is held.',
gesture:'Hold and drag horizontally to turn the crank through one revolution.',
params:[P('Stations',4,9,1,6),P('Drive RPM',3,30,1,12)],
draw(g,w,h,t,p,s){
const pos=stage(g,w,h,'#102830'),q=ptr(s),n=Math.round(p[0]),rpm=p[1],dt=tstep(s,t);
corner(g,'#53737a');for(let x=40;x<800;x+=24)for(let y=50;y<408;y+=24){g.fillStyle='#365058';g.fillRect(x,y,1.2,1.2)}
const a=214,xc=302,yc=223,X=xc+a,R=a*Math.cos(Math.PI/n)-1.5,r=a*Math.sin(Math.PI/n),slot=5.8,alpha=Math.PI/2-Math.PI/n;
if(!Number.isFinite(s._drive))s._drive=.15+(s.seed%19)*.035;
if(q.down){const xx=pos(q)[0];if(!s._held){s._grabX=xx;s._grabAngle=s._drive}s._drive=s._grabAngle+(xx-s._grabX)*T/430}else{s._drive+=dt*rpm*T/60}
s._held=q.down;
const k=Math.floor((s._drive+Math.PI)/T),phase=s._drive-k*T,active=Math.abs(phase)<=alpha;
const wheel=Math.PI-k*T/n+(phase < -alpha?Math.PI/n:phase>alpha?-Math.PI/n:Math.atan2(-r*Math.sin(phase),a-r*Math.cos(phase)));
const pin=[xc+r*Math.cos(phase),yc+r*Math.sin(phase)];
compass(g,xc,yc,r+25,'#668086');
circle(g,xc,yc,r+11,'#193a42','#799396',1.5);circle(g,xc,yc,r-3,null,'#507078');
circle(g,xc,yc,r*.62,'#24474e','#69888a',1.4);
line(g,[[xc,yc],pin],'#0c2127',23);line(g,[[xc,yc],pin],'#c99b62',17);line(g,[[xc,yc],pin],'#edc28b',2);
g.save();g.translate(X,yc);g.rotate(wheel);
const mouth=Math.asin(slot/R),inner=Math.max(28,a-r-14);
g.beginPath();
for(let i=0;i<n;i++){
const a0=i*T/n,a1=(i+1)*T/n,co=Math.cos(a0),si=Math.sin(a0),point=(v,side)=>[v*co-side*si,v*si+side*co];
const start=point(Math.sqrt(R*R-slot*slot),-slot);
if(!i)g.moveTo(...start);else g.lineTo(...start);
g.lineTo(...point(inner,-slot));g.quadraticCurveTo(...point(inner-slot*1.55,0),...point(inner,slot));g.lineTo(...point(Math.sqrt(R*R-slot*slot),slot));
// Shallow concave flanks expose negative space between the radial stations.
const mid=a0+Math.PI/n,midR=R*(n>6?.85:.74);
g.quadraticCurveTo(midR*Math.cos(mid),midR*Math.sin(mid),R*Math.cos(a1-mouth),R*Math.sin(a1-mouth));
}
g.closePath();g.fillStyle='#c7ded3';g.fill();g.strokeStyle='#edf3dc';g.lineWidth=2;g.stroke();
for(let i=0;i<n;i++){
 const aa=(i+.5)*T/n,rad=R*.69,dx=Math.cos(aa),dy=Math.sin(aa);circle(g,dx*rad,dy*rad,n>7?10:14,'#294850','#759993',2);circle(g,dx*rad,dy*rad,3,'#5d7d79');
 line(g,[[dx*R*.29,dy*R*.29],[dx*(rad-21),dy*(rad-21)]],'#91b1a8',1.2)
}
g.restore();circle(g,X,yc,30,'#44686b','#f4eccf',2);joint(g,X,yc,13,'#a5c5b8','#213d43');joint(g,xc,yc,12,'#f1cea0','#513e32');
circle(g,pin[0],pin[1],6.5,'#ffac6e','#433a32',1.8);circle(g,pin[0],pin[1],2.1,'#fff2d0');
text(g,35,36,'IDX / '+String(n).padStart(2,'0')+' STATIONS','#bad3ce',11);
text(g,764,36,active?'PIN ENGAGED':'WHEEL AT REST',active?'#ffba7f':'#c4dbd0',11,'right');
line(g,[[70,410],[730,410]],'#426169');for(let i=0;i<24;i++){const xx=70+660*i/24;line(g,[[xx,410],[xx,414+(i%3===0?3:0)]],'#718c8d')}
const pp=(phase+Math.PI)/T;line(g,[[70+pp*660,405],[70+pp*660,416]],'#feb27e',3);
text(g,70,391,'DRIVER PHASE','#8dabad',10);text(g,730,391,'STEP '+(360/n).toFixed(1)+'°','#b6d2c9',10,'right');
g.restore();
}});

experiments.push({
id:'catenary-atelier',title:'Catenary Atelier',category:'Kinetics',
description:'A hanging chain becomes a drafting instrument. Raise its brass anchor and watch each link find its new place.',
method:'The chain is an ideal flexible cable under uniform weight. A numerical solve finds the catenary with the chosen endpoints and length; the link centers are spaced by arc length.',
gesture:'Drag anywhere to reposition the right-hand anchor. Release to leave it there.',
params:[P('Extra length (%)',3,38,1,18),P('Hoist travel',0,60,1,24)],
draw(g,w,h,t,p,s){
const pos=stage(g,w,h,'#e8d8b8'),q=ptr(s),ox=127,oy=137;
corner(g,'#9f8f73');
for(let x=54;x<754;x+=20)line(g,[[x,65],[x,371]],x%100===54?'#d3c09e':'#dfceae',.7);
for(let y=70;y<371;y+=20)line(g,[[55,y],[746,y]],y%100===70?'#d3c09e':'#dfceae',.7);
if(!s._anchor)s._anchor=[664,121];if(q.down){const m=pos(q);s._anchor=[clamp(m[0],430,689),clamp(m[1],80,180)]}
const x2=s._anchor[0],y2=s._anchor[1]+p[1]*.38*Math.sin(t*.63+(s.seed%11)/4),D=x2-ox,v=y2-oy,L=Math.hypot(D,v)*(1+p[0]/100),target=Math.sqrt(L*L-v*v);
let lo=.001,hi=6;
for(let i=0;i<29;i++){const u=(lo+hi)/2;if(D*Math.sinh(u)/u>target)hi=u;else lo=u}
const a=D/(lo+hi),x0=D/2+a*Math.atanh(v/L),base=oy+a*Math.cosh(x0/a),F0=-a*Math.sinh(x0/a);
const at=frac=>{const u=Math.asinh((F0+frac*L)/a);return [ox+x0+a*u,base-a*Math.cosh(u),Math.atan(-Math.sinh(u))]};
const low=[ox+x0,base-a];
line(g,[[ox,oy],[x2,y2]],'#aa9170',1,[5,5]);line(g,[[low[0],76],[low[0],365]],'#ad6a48',1,[2,5]);
const chain=[];for(let j=0;j<=85;j++)chain.push(at(j/85));line(g,chain,'#d0bb96',7);
const cnt=Math.round(L/10.5);
for(let i=0;i<cnt;i++){
 const [x,y,ang]=at((i+.5)/cnt);g.save();g.translate(x,y);g.rotate(ang);g.beginPath();g.ellipse(0,0,6.5,i%2?1.65:3.7,0,0,T);g.strokeStyle=i%2?'#bd8058':'#533f34';g.lineWidth=i%2?3.5:2.6;g.stroke();g.restore()
}
for(const [x,y] of [[ox,oy],[x2,y2]]){
line(g,[[x,66],[x,y]],'#8a785f',1.5,[3,3]);poly(g,[[x-12,y-13],[x+12,y-13],[x+8,y+10],[x-8,y+10]],'#aa7953','#78553f');
joint(g,x,y,7,'#ecc17d','#614c3c');line(g,[[x-19,65],[x+19,65]],'#745e4c',4);
}
circle(g,low[0],low[1],7,null,'#a45236',1.4);
text(g,42,36,'ATELIER / SUSPENDED STUDY','#5e4c3d',11);text(g,756,36,'CATENARY • 01','#81694f',11,'right');
line(g,[[ox,360],[x2,360]],'#8b755a',1);
for(const x of [ox,x2])line(g,[[x-3,364],[x+3,356]],'#8b755a',1);
text(g,(ox+x2)/2,378,'HORIZONTAL SPAN  '+D.toFixed(0),'#685342',10,'center');
line(g,[[43,400],[757,400]],'#b5a080');text(g,44,416,'LENGTH  '+L.toFixed(1),'#594738',11);text(g,401,416,'SAG  '+(low[1]-Math.min(oy,y2)).toFixed(1),'#594738',11,'center');text(g,756,416,cnt+' LINKS','#594738',11,'right');
g.restore()
}});

experiments.push({
id:'spring-exchange',title:'Spring Exchange',category:'Kinetics',
description:'Three pendulums trade their swing through a pair of springs. Pull one bob aside and follow the energy across the rack.',
method:'A fixed-step integrator advances three damped angular oscillators. The springs exert a restoring torque proportional to the angle difference; the strip records each bob’s local oscillator energy.',
gesture:'Grab a colored bob, pull sideways and release. It will set its neighbors in motion.',
params:[P('Coupling',0,4,.05,1.65),P('Center detune (%)',-35,55,1,4)],
draw(g,w,h,t,p,s){
const pos=stage(g,w,h,'#181c29'),q=ptr(s),dt=tstep(s,t),xs=[215,400,585],yy=92,L=166,cols=['#f2a283','#d1db92','#93c9d1'];
corner(g,'#5a6173');
if(!s._angles){s._angles=[-.56,.10,.03];s._v=[0,0,0];s._acc=0;s._heldBob=-1;s._hist=[];s._histTime=0}
const A=s._angles,V=s._v,om=[3.2,3.2*(1+p[1]/100),3.2],screen=i=>[xs[i]+L*Math.sin(A[i]),yy+L*Math.cos(A[i])],m=pos(q);
if(q.down&&!s._wasDown){let nearest=-1,best=47;for(let i=0;i<3;i++){const b=screen(i),dist=Math.hypot(m[0]-b[0],m[1]-b[1]);if(dist<best){nearest=i;best=dist}}s._heldBob=nearest}
if(!q.down)s._heldBob=-1;s._wasDown=q.down;
if(s._heldBob>=0){A[s._heldBob]=clamp(Math.atan2(m[0]-xs[s._heldBob],Math.max(24,m[1]-yy)),-.95,.95);V[s._heldBob]=0}
s._acc+=dt;const step=1/160;
while(s._acc>=step){const force=A.map((aa,i)=>-(om[i]**2)*Math.sin(aa)-.021*V[i]+p[0]*((i?A[i-1]-aa:0)+(i<2?A[i+1]-aa:0)));for(let i=0;i<3;i++){if(s._heldBob===i)continue;V[i]+=step*force[i];A[i]+=step*V[i]}s._acc-=step}
const E=A.map((aa,i)=>.5*V[i]*V[i]+om[i]**2*(1-Math.cos(aa)));
if((s._histTime+=dt)>.055||!s._hist.length){s._hist.push(E);if(s._hist.length>225)s._hist.shift();s._histTime=0}
text(g,42,36,'RACK 03 / COUPLED OSCILLATORS','#c3c7d1',11);text(g,757,36,'ENERGY TRANSFER','#9197a8',11,'right');
line(g,[[108,79],[690,79]],'#414655',8);line(g,[[108,76],[690,76]],'#9396a5',1.4);
for(let i=0;i<3;i++){
 const b=screen(i);g.beginPath();g.arc(xs[i],yy,L,Math.PI/2-.79,Math.PI/2+.79);g.strokeStyle='#393e4d';g.setLineDash([2,6]);g.lineWidth=1.4;g.stroke();g.setLineDash([]);
 line(g,[[xs[i],yy+8],[xs[i],yy+L+16]],'#393c4d',1,[2,5]);
 line(g,[[xs[i],yy],b],'#b6a99c',3.4);
}
for(let i=0;i<2;i++){
 const w0=screen(i),w1=screen(i+1),ax=lerp(xs[i],w0[0],.65),ay=lerp(yy,w0[1],.65),bx=lerp(xs[i+1],w1[0],.65),by=lerp(yy,w1[1],.65),dx=bx-ax,dy=by-ay,d=Math.hypot(dx,dy);
 const pts=[[ax,ay]];for(let j=0;j<=54;j++){let u=j/54,off=j<3||j>51?0:Math.sin((j-2)*Math.PI*.5)*4.8;pts.push([ax+dx*u-dy/d*off,ay+dy*u+dx/d*off])}pts.push([bx,by]);line(g,pts,p[0]>.001?'#b39482':'#4b4650',1.5);
}
for(let i=0;i<3;i++){const b=screen(i);joint(g,xs[i],yy,7.5,'#a7998c','#353443');circle(g,...b,16.5,cols[i],'#10151e',2);circle(g,b[0]-4,b[1]-6,3,'#f5e5cb');text(g,xs[i],289,'0'+(i+1),cols[i],10,'center')}
line(g,[[64,313],[736,313]],'#494e5f');text(g,65,332,'ENERGY / RECENT HISTORY','#949aac',10);
for(let i=0;i<3;i++){
const y=355+i*22;text(g,67,y,'E'+(i+1),cols[i],10);line(g,[[97,y+5],[735,y+5]],'#373d4d');
const hist=s._hist,points=hist.map((e,j)=>[735-(hist.length-1-j)*638/224,y+5-15*Math.min(1,e[i]/2)]);if(points.length>1)line(g,points,cols[i],1.8);circle(g,735,y+5-15*Math.min(1,E[i]/2),2.7,cols[i]);
}
g.restore()
}});

function swift(g,x,y,z,phase,ink,back,belly){
g.save();g.translate(x,y);g.scale(z,z);
const lift=Math.sin(phase),fold=(1-Math.cos(phase))*.5;
const wing=(offset,fac,col)=>{g.beginPath();g.moveTo(-1,-2);g.quadraticCurveTo(-6,-8+lift*12*fac,-12-offset,-7+lift*22*fac);g.lineTo(-27+fold*11-offset,-1+lift*40*fac);g.quadraticCurveTo(-11,4+lift*17*fac,7,0);g.fillStyle=col;g.fill()};
wing(2,.78,back);
g.beginPath();g.moveTo(-10,1);g.quadraticCurveTo(2,-4,10,-3);g.quadraticCurveTo(16,-8,20,-2);g.lineTo(26,0);g.lineTo(19,1);g.quadraticCurveTo(12,8,-9,5);g.lineTo(-29,13);g.lineTo(-21,4);g.lineTo(-31,1);g.closePath();g.fillStyle=ink;g.fill();
g.beginPath();g.moveTo(-8,4);g.quadraticCurveTo(7,7,17,1);g.quadraticCurveTo(10,7,-8,5);g.fillStyle=belly;g.fill();
wing(0,1,ink);circle(g,17,-2,.75,belly);g.restore()
}
experiments.push({
id:'swallow-wheel',title:'The Swallow Wheel',category:'Kinetics',
description:'Sixteen ink birds share a spinning animation disc. A virtual shutter samples the wheel without flashing the screen.',
method:'At each shutter tick the instrument holds the current disc angle. The observation window magnifies the nearest printed bird at the fixed top gate; similar disc and shutter rates create stroboscopic aliasing.',
gesture:'Drag around the disc to turn it by hand and inspect individual drawings.',
params:[P('Disc RPM',12,90,1,42),P('Samples / second',2,24,.5,11)],
draw(g,w,h,t,p,s){
const pos=stage(g,w,h,'#20324c'),q=ptr(s),dt=tstep(s,t),cx=251,cy=228,R=170,N=16,delta=T/N;
corner(g,'#657589');text(g,38,34,'OPTICAL TOYS / PLATE 16','#c1c7c0',11);text(g,762,34,'SAMPLED • NO FLASH','#adaeaa',11,'right');
if(!Number.isFinite(s._real)){s._real=(s.seed%16)*delta;s._sample=s._real;s._clock=0}
if(q.down){
 const m=pos(q),ang=Math.atan2(m[1]-cy,m[0]-cx);
 if(s._drag)s._real+=Math.atan2(Math.sin(ang-s._oldAng),Math.cos(ang-s._oldAng));
 s._oldAng=ang;s._sample=s._real;s._clock=0;
}else{s._real+=dt*p[0]*T/60;s._clock+=dt;const period=1/p[1];if(s._clock>=period){s._clock%=period;s._sample=s._real-s._clock*p[0]*T/60}}
s._drag=q.down;
const idx=((Math.round(-s._sample/delta)%N)+N)%N;
circle(g,cx+3,cy+4,R+3,'#19293c');circle(g,cx,cy,R,'#d9cba6','#f1debb',3);circle(g,cx,cy,R-9,null,'#827c68',.8);circle(g,cx,cy,R-22,null,'#9b9072',1);circle(g,cx,cy,84,'#bc9d78','#8b7a67',1.3);
g.save();g.translate(cx,cy);g.rotate(s._sample);for(let j=0;j<N;j++){g.save();g.rotate(j*delta);
line(g,[[0,-R+5],[0,-R+16]],'#172e42',3.2);g.rotate(delta/2);line(g,[[0,-R+24],[0,-81]],'#b4a582',.8);g.rotate(-delta/2);
swift(g,0,-116,.59,j*delta,'#223743','#8c9589','#ede0be');g.restore()}
circle(g,0,0,62,'#43515a','#e6d5b0',1.4);circle(g,0,0,48,null,'#b69e76',1);
for(let j=0;j<8;j++){const a=j*T/8;circle(g,38*Math.cos(a),38*Math.sin(a),2,'#ccb28d')}
joint(g,0,0,15,'#e2bc87','#5b5953');line(g,[[-5,5],[5,-5]],'#675d4a',2);g.restore();
poly(g,[[cx-8,47],[cx+8,47],[cx,58]],'#ef9572');
line(g,[[474,89],[744,89]],'#6d7987');text(g,478,108,'OBSERVATION WINDOW','#d3ccbc',10);
g.fillStyle='#e8dfca';g.beginPath();g.rect(478,127,264,187);g.fill();g.save();g.beginPath();g.rect(478,127,264,187);g.clip();
for(let j=0;j<6;j++){const y=150+j*29;line(g,[[478,y],[742,y]],'#dbcfb7',.7)}
circle(g,611,214,58,null,'#d5c8ad',1);swift(g,611,216,1.95,idx*delta,'#1e3746','#899589','#e8dfca');g.restore();
text(g,480,336,'PRINT  '+String(idx+1).padStart(2,'0')+' / 16','#e4d2b5',11);text(g,740,336,p[1].toFixed(1)+' Hz','#e4d2b5',11,'right');
for(let j=0;j<N;j++){g.fillStyle=j===idx?'#f3aa86':'#5a6979';g.fillRect(479+j*16.4,354,12,4)}
text(g,479,390,'FIXED GATE   ↑   TOP OF DISC','#aab4b8',10);g.restore()
}});

experiments.push({
id:'inversor-cell',title:'The Inversor',category:'Kinetics',
description:'A cage of seven linked rods turns a circular arc into a straight stroke. Move the pivot off its special position and the line bows.',
method:'Equal side rods and a rhombus enforce OC × OD = l² − r². A circle through the fixed joint O inverts to a line; displacing the crank pivot instead yields an arc.',
gesture:'Drag horizontally to sweep the input crank by hand.',
params:[P('Pivot offset',-18,18,1,0),P('Sweep angle (°)',25,82,1,70)],
draw(g,w,h,t,p,s){
const pos=stage(g,w,h,'#e8e7da'),q=ptr(s),k=170*170-112*112,crank=64,sep=crank+p[0],sweep=p[1]*Math.PI/180;
corner(g,'#929d96');text(g,40,35,'LINKAGE ARCHIVE / INVERSION CELL','#43544e',11);text(g,762,35,p[0]===0?'LOCUS: STRAIGHT LINE':'LOCUS: CIRCULAR ARC','#8b6147',11,'right');
const xx=241,yy=226,z=1.04;
for(let i=47;i<768;i+=19)for(let j=64;j<393;j+=19){g.fillStyle='#c3c8b9';g.fillRect(i,j,1.2,1.2)}
const solve=ph=>{
const x=sep+crank*Math.cos(ph),y=crank*Math.sin(ph),d=Math.hypot(x,y),out=k/d,mid=(d+out)/2,h0=Math.sqrt(Math.max(0,170*170-mid*mid)),ux=x/d,uy=y/d;
return {C:[x,y],D:[ux*out,uy*out],A:[ux*mid-uy*h0,uy*mid+ux*h0],B:[ux*mid+uy*h0,uy*mid-ux*h0]}
};
if(!Number.isFinite(s._phase))s._phase=(s.seed%29)/9;
if(q.down){s._phase=Math.asin(clamp((pos(q)[0]-400)/305,-1,1))}else{s._phase+=tstep(s,t)*.83}s._lastT=t;
const phase=Math.sin(s._phase)*sweep,{A,B,C,D}=solve(phase);
g.save();g.translate(xx,yy);g.scale(z,z);
line(g,[[-100,0],[335,0]],'#a8b1a3',.75,[3,3]);circle(g,sep,0,crank,null,'#a0afa0',.9);
const path=[];for(let i=0;i<=88;i++)path.push(solve(-sweep+2*sweep*i/88).D);
line(g,path,'#bc6749',2.7);for(const j of [0,path.length-1])circle(g,...path[j],2.6,'#bc6749');
const rod=(v1,v2,width,edge,face)=>{line(g,[v1,v2],edge,width+1.8);line(g,[v1,v2],face,width);if(width>6)line(g,[v1,v2],edge,.55)};
rod([0,0],A,8,'#556759','#aab9a1');rod([0,0],B,8,'#556759','#aab9a1');
rod([sep,0],C,7,'#806446','#d4b387');
rod(A,D,6,'#455850','#809688');rod(D,B,6,'#455850','#809688');rod(A,C,6,'#586660','#c7cdc1');rod(C,B,6,'#586660','#c7cdc1');
joint(g,0,0,8.5,'#d2cab5','#465b4f');joint(g,sep,0,5.8,'#d2b98b','#715a41');
for(const v of [A,B,C])joint(g,...v,4.6,'#f1e7c9','#516057');joint(g,...D,5.7,'#c67e5b','#76533e');g.restore();
const xy=v=>[xx+z*v[0],yy+z*v[1]];
text(g,xx-13,yy+16,'O','#364c42',12,'right');
const d=xy(D);line(g,[[d[0]+8,d[1]],[d[0]+21,d[1]-11],[d[0]+45,d[1]-11]],'#ac6f53');text(g,d[0]+49,d[1]-11,'D','#8b4f36',11);
line(g,[[588,112],[746,112]],'#aeb6a7');text(g,588,132,'GEOMETRIC INVARIANT','#4d6053',10);
text(g,588,167,'OC × OD','#536657',19);text(g,588,194,'= '+k.toLocaleString('en-US'),'#926044',16);
line(g,[[588,218],[746,218]],'#aeb6a7');text(g,588,242,'INPUT   '+Math.hypot(...C).toFixed(1),'#556256',11);text(g,588,267,'OUTPUT  '+Math.hypot(...D).toFixed(1),'#556256',11);
text(g,588,315,'●   PEN LOCUS','#a56143',10);text(g,42,413,'O  FIXED JOINT','#5b6b5c',10);text(g,760,413,'SEVEN MOVING LINKS','#5b6b5c',10,'right');
g.restore()
}});
})();
