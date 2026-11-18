/* THE TIDE CABINET • an original score-driven mechanical theatre.
 * Local pinhole projection + painter's mesh renderer. No textures, font fetches or GL.
 * World: +Y up, +Z away from the audience. All motion comes from score position. */
(function(global) {
'use strict';
const PI=Math.PI, TAU=PI*2, sin=Math.sin, cos=Math.cos, pow=Math.pow, abs=Math.abs;
const clamp=(x,a=0,b=1)=>Math.max(a,Math.min(b,x)), mix=(a,b,t)=>a+(b-a)*t;
const ease=t=>(t=clamp(t),t*t*(3-2*t));
const rand=n=>()=>{n=(Math.imul(1664525,n)+1013904223)>>>0;return n/4294967296;};
const rgb=h=>{let n=parseInt(h.replace('#',''),16);return [(n>>16)&255,(n>>8)&255,n&255];};
const colour=(a,b,p)=>{let x=rgb(a),y=rgb(b);return 'rgb('+x.map((v,i)=>Math.round(mix(v,y[i],p))).join(',')+')';};
const shade=(h,k)=>{let [r,g,b]=rgb(h);return 'rgb('+[r,g,b].map(v=>clamp(Math.round(v*k),0,255)).join(',')+')';};
const avg=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t));
function path(c,p,close=true){if(!p.length)return;c.beginPath();c.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)c.lineTo(p[i][0],p[i][1]);if(close)c.closePath();}
function fill(c,p,col){path(c,p);c.fillStyle=col;c.fill();}
function line(c,p,col,w=1){if(!p.length||!w)return;path(c,p,false);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function ell(c,x,y,rx,ry,col){c.beginPath();c.ellipse(x,y,Math.max(.001,rx),Math.max(.001,ry),0,0,TAU);c.fillStyle=col;c.fill();}
function ring(c,x,y,rx,ry,col,w){c.beginPath();c.ellipse(x,y,Math.max(.001,rx),Math.max(.001,ry),0,0,TAU);c.strokeStyle=col;c.lineWidth=w;c.stroke();}
function linear(c,x1,y1,x2,y2,stops){let g=c.createLinearGradient(x1,y1,x2,y2);for(let i=0;i<stops.length;i++)g.addColorStop(i/(stops.length-1),stops[i]);return g;}
function radial(c,x,y,r,stops){let g=c.createRadialGradient(x,y,0,x,y,Math.max(.1,r));stops.forEach(([t,k])=>g.addColorStop(t,k));return g;}
function glow(c,x,y,r,col,level){let g=radial(c,x,y,r,[[0,'rgba('+col+','+level+')'],[.25,'rgba('+col+','+level*.65+')'],[.66,'rgba('+col+','+level*.20+')'],[1,'rgba('+col+',0)']]);c.fillStyle=g;c.fillRect(x-r,y-r,r*2,r*2);}
function smooth(c,p,col,w){if(p.length<3)return line(c,p,col,w);c.beginPath();c.moveTo(...p[0]);for(let i=1;i<p.length-1;i++){let a=p[i],b=p[i+1];c.quadraticCurveTo(a[0],a[1],(a[0]+b[0])/2,(a[1]+b[1])/2);}c.lineTo(...p[p.length-1]);c.lineWidth=w;c.strokeStyle=col;c.stroke();}
function seal(c,x,y,r,paint){c.save();c.translate(x,y);for(let k=0;k<8;k++){c.rotate(PI/4);let l=k%2?.55:1;fill(c,[[0,-r*l],[r*.085,0],[0,r*.1]],paint);fill(c,[[0,-r*l],[-r*.085,0],[0,r*.1]],'rgba(74,48,23,.55)');}ring(c,0,0,r*.42,r*.42,paint,r*.045);c.restore();}
const moonColours={day:['#244c55','#6f9d99','#b9b8a1','#ecd6a2'],night:['#0d2638','#274358','#647078','#a99c80']};
const terrain=[
[[-.05,.47],[.03,.41],[.08,.465],[.155,.38],[.19,.4],[.238,.336],[.28,.365],[.335,.445],[.375,.408],[.42,.475],[.49,.45],[.54,.468],[.59,.411],[.646,.412],[.69,.345],[.726,.336],[.79,.27],[.82,.266],[.885,.345],[.918,.294],[1.05,.31]],
[[-.05,.31],[.018,.34],[.058,.36],[.12,.423],[.177,.445],[.204,.48],[.273,.507],[.31,.47],[.347,.5],[.386,.49],[.43,.514],[.478,.522],[.525,.503],[.58,.522],[.623,.466],[.665,.458],[.725,.375],[.76,.389],[.81,.329],[.844,.362],[.896,.301],[.942,.356],[1.05,.275]],
[[-.05,.415],[.02,.416],[.05,.432],[.103,.452],[.137,.49],[.195,.527],[.248,.546],[.317,.542],[.38,.56],[.426,.541],[.49,.557],[.549,.537],[.61,.537],[.681,.483],[.717,.49],[.756,.45],[.81,.444],[.866,.374],[.91,.392],[.969,.318],[1.05,.35]]];
function valueLine(a,x){let i=0;while(i<a.length-2&&a[i+1][0]<x)i++;return mix(a[i][1],a[i+1][1],clamp((x-a[i][0])/(a[i+1][0]-a[i][0])));}
function sky(c,W,H,night){
 let rr=rand(193647),ww=W/820, scene=night?'night':'day';
 c.fillStyle=linear(c,0,0,0,H*.62,moonColours[scene]);c.fillRect(0,0,W,H);
 // A lithographic disc hangs on the counterweighted sky roll.
 let mx=W*.568,my=H*.232,mr=Math.min(W*.056,H*.093);
 glow(c,mx,my,mr*3,night?'171,181,172':'255,216,139',night?.11:.26);
 c.strokeStyle=night?'rgba(206,195,159,.25)':'rgba(238,213,157,.44)';
 c.lineWidth=ww*.7;c.beginPath();c.arc(mx,my,mr*1.25,-PI*.86,PI*.72);c.stroke();
 ring(c,mx,my,mr*1.39,mr*1.39,night?'rgba(219,205,153,.16)':'rgba(201,172,111,.55)',ww*.65);
 ell(c,mx,my,mr,mr,night?'#e3d6a9':'#efd19a');
 c.save();c.beginPath();c.arc(mx,my,mr,0,TAU);c.clip();
 for(let i=0;i<125;i++){let a=rr()*TAU,r=Math.sqrt(rr())*mr,x=mx+cos(a)*r,y=my+sin(a)*r;line(c,[[x,y],[x+mr*(.02+rr()*.18),y+.25*ww]],night?'rgba(85,99,101,.23)':'rgba(157,105,51,.26)',(.3+rr()*.45)*ww);}
 c.restore();if(night){for(let i=0;i<85;i++){let x=rr()*W,y=rr()*H*.45,r=ww*(.35+rr()*.75);ell(c,x,y,r,r,'rgba(237,215,161,'+(.23+rr()*.48)+')');}}
 // Engraved cirrus, each cluster a stack of open, unconnected burin cuts.
 for(let i=0;i<12;i++){let cx=rr()*W,cy=(.095+rr()*.31)*H,span=(.035+rr()*.1)*W;
   for(let j=0;j<8+rr()*6;j++){let y=cy+j*.0025*H,x=cx-span*rr();let w=span*(.2+.8*rr());smooth(c,[[x,y],[x+w*.33,y-H*.003],[x+w*.74,y+H*.0007],[x+w,y]],night?'rgba(202,202,178,.12)':'rgba(247,226,182,.22)',ww*(.45+.45*rr()));}
 }
 const cols=night?[['#758184','#586874','#a8a695'],['#4f626c','#374c59','#828c86'],['#344f59','#253f4b','#637773']]:[['#95a5a1','#778e8f','#d9ccab'],['#668989','#4a7278','#a9baab'],['#3c646a','#294d55','#6e9390']];
 terrain.forEach((ridge,L)=>{
 let shape=[];for(let i=0;i<ridge.length-1;i++){let a=ridge[i],b=ridge[i+1],n=Math.max(4,Math.round((b[0]-a[0])*260));for(let j=0;j<n;j++){let t=j/n;shape.push([mix(a[0],b[0],t)*W,(mix(a[1],b[1],t)+(rr()-.5)*.006*sin(t*PI))*H]);}}
 shape.push([W*1.07,ridge[ridge.length-1][1]*H]);let silhouette=[...shape,[W*1.07,H*.61],[-.08*W,H*.61]];
 fill(c,silhouette,cols[L][0]);c.save();path(c,silhouette);c.clip();
 // Pencil-cut planes descend from each ridge. Deliberate broken marks rather than triangle facets.
 for(let i=1;i<ridge.length-1;i++){let a=ridge[i],b=ridge[i+1],x=a[0]*W,y=a[1]*H,down=(.04+.10*rr())*H;
   if(ridge[i-1][1]>a[1]&&b[1]>a[1]){let p=[[x,y],[x+W*.007,y+down*.32],[x-W*.012,y+down*.45],[x+W*.007,y+down*.54],[x+W*.035,y+down],[x+W*.05,y+down*1.13],[mix(x,b[0]*W,.86),mix(y,b[1]*H,.86)]];fill(c,p,cols[L][1]);}
 }
 for(let i=0;i<185+L*20;i++){let u=rr(),x=u*W,base=valueLine(ridge,u)*H,y=base+pow(rr(),1.75)*(H*.58-base),len=(.009+.025*rr())*W,dy=(.003+.024*rr())*H;
 let pts=[[x,y],[x+len*.28,y+dy*.3],[x+len*.37,y+dy*.22],[x+len*.64,y+dy*.66],[x+len,y+dy]];
 c.globalAlpha=.25+rr()*.52;line(c,pts,(i%3?cols[L][2]:cols[L][1]),(.45+rr()*.58)*ww);}
 c.restore();line(c,shape,cols[L][2],.7*ww);
 });
 let horizon=.58*H;
 c.fillStyle=linear(c,0,horizon,0,H,[night?'#50666c':'#709190',night?'#294952':'#3b676a',night?'#183843':'#17434d',night?'#162e35':'#122f36']);c.fillRect(0,horizon,W,H-horizon);
 // Thin leaf-metal slivers are mounted across the varnished water boards.
 for(let j=0;j<510;j++){let u=rr(),v=pow(rr(),1.45),x=u*W,y=horizon+(H-horizon)*v;
   let len=(.002+pow(rr(),1.6)*.047)*W*(.3+v),h=(.3+rr()*.8)*ww*(.55+v);
   let lit=abs(u-.57)<(.025+.105*v)&&rr()<.5;
   let co=lit?(night?'rgba(231,211,153,.49)':'rgba(236,213,161,.6)'):(j%4===0?'rgba(9,41,47,.6)':night?'rgba(142,165,158,.29)':'rgba(160,189,176,.43)');
   fill(c,[[x,y],[x+len*.25,y-h*.43],[x+len,y],[x+len*.45,y+h],[x-len*.04,y+h*.4]],co);
 }
}
function pine(c,x,y,h,w,dark,light,seed){let r=rand(seed),p=[[x,y-h]],q=[];for(let i=0;i<7;i++){let f=(i+1)/7,yy=y-h+f*h*.84;let b=(.15+.85*f)*w;p.push([x-b*(.77+.22*r()),yy+h*.048],[x-b*.43,yy+h*.019]);q.push([x+b*(.81+.23*r()),yy+h*.060],[x+b*.39,yy+h*.019]);}fill(c,[...p,[x-1,y],[x+1,y],...q.reverse()],dark);for(let j=0;j<5;j++){let f=.2+j*.13;line(c,[[x-.2*w*f,y-h+f*h],[x-w*f*.86,y-h+(f+.092)*h],[x-w*f*.40,y-h+(f+.071)*h]],light,Math.max(.4,w*.065));}}
function land(c,W,H,night){let r=rand(98908),lw=W/820;
 const silhouette=[[.54,.626],[.60,.612],[.63,.594],[.679,.566],[.71,.555],[.758,.525],[.814,.538],[.865,.49],[.914,.506],[.978,.442],[1.05,.45],[1.06,.807],[.973,.792],[.941,.762],[.876,.748],[.835,.724],[.793,.710],[.751,.689],[.69,.674],[.646,.645],[.587,.638]].map(([x,y])=>[x*W,y*H]);
 let dark=night?'#1c3539':'#244a46',light=night?'#4c5e55':'#87937a';
 // The woodcut coast sits behind the musicians' wharf; the two banks never meet.
 for(let i=0;i<75;i++){let x=.63+r()*.43,b=(.585-(x-.63)*.30+.012*sin(x*120))*H;let h=(.016+.074*r())*H*(.55+(x-.62)*1.8);pine(c,x*W,b,h,h*(.16+r()*.11),night?'#344a48':'#42675b',night?'#677368':'#859581',i+35);}
 fill(c,silhouette,dark);c.save();path(c,silhouette);c.clip();for(let i=0;i<115;i++){let x=(.55+r()*.49)*W,y=(.47+r()*.33)*H,len=(.01+r()*.06)*W;line(c,[[x,y],[x+len*.34,y-H*.004],[x+len*.51,y+H*.003],[x+len,y+H*.007]],i%4?'rgba(167,166,121,.32)':'rgba(8,32,37,.71)',lw*(.5+r()*.8));}c.restore();
 for(let i=0;i<36;i++){let u=.67+r()*.37,b=.573-(u-.67)*.26+.015*sin(u*51),h=(.034+.114*r())*H*(.52+(u-.65)*1.8);pine(c,u*W,b*H,h,h*(.16+r()*.08),dark,light,100+i);}
 // A far headland with an ivory navigational marker.
 let left=[[-.03,.545],[.045,.524],[.075,.533],[.113,.553],[.143,.562],[.176,.583],[.207,.593],[.183,.605],[.105,.61],[.043,.627],[-.04,.62]].map(([x,y])=>[x*W,y*H]);fill(c,left,night?'#233f48':'#30575a');line(c,left.slice(0,7),night?'#74807b':'#8aa491',lw);
 for(let i=0;i<22;i++){let u=r()*.10,b=.53+u*.18;pine(c,u*W,b*H,(.015+r()*.036)*H,W*.0028,dark,light,i+352);}
}
function lighthouse(c,W,H,night){let x=W*.108,y=H*.556,h=H*.082,w=h*.23;
 fill(c,[[x-w*.48,y],[x-w*.31,y-h],[x+w*.31,y-h],[x+w*.5,y]],night?'#a5ab94':'#e0cfa9');
 fill(c,[[x+w*.04,y],[x+w*.07,y-h],[x+w*.31,y-h],[x+w*.5,y]],night?'#596a69':'#99a293');
 fill(c,[[x-w*.33,y-h*.68],[x+w*.34,y-h*.68],[x+w*.35,y-h*.54],[x-w*.36,y-h*.54]],'#a15c4b');
 c.fillStyle='#334b4b';c.fillRect(x-w*.5,y-h*1.02,w,h*.055);c.fillRect(x-w*.33,y-h*1.16,w*.66,h*.15);
 c.fillStyle='#edd899';c.fillRect(x-w*.19,y-h*1.142,w*.33,h*.096);
 fill(c,[[x-w*.54,y-h*1.16],[x,y-h*1.32],[x+w*.52,y-h*1.16]],'#93503f');
}
function frame(c,W,H){let u=Math.min(W/815,H/405),sw=Math.max(9,W*.022),top=Math.max(9,H*.033),bot=Math.max(17,H*.055);
 let r=rand(55638);let gold='#b79759',pale='#e1c187';
 const bands=[['#201c19','#35251e','#5e4030','#261f1c'],['#543728','#77543c','#503226','#36251e']];
 // Full-depth reveal; corner spandrels are pierced with a shell, not a flat picture-frame stroke.
 for(let side=0;side<2;side++){c.save();if(side){c.translate(W,0);c.scale(-1,1);}c.fillStyle=linear(c,0,0,sw,0,bands[0]);c.fillRect(0,0,sw,H);
 for(let j=0;j<28;j++){let x=r()*sw,y=r()*H; smooth(c,[[x,y],[x+u*1.6,y+H*.09],[x-u*.9,y+H*.15],[x+u,y+H*.32]],j%4?'rgba(211,151,95,.12)':'rgba(24,14,11,.29)',Math.max(.3,u*.5));}
 fill(c,[[sw-.3,top*.62],[sw+W*.08,top*.62],[sw+W*.049,top*1.05],[sw+W*.022,top*1.54],[sw+W*.007,top*2.64],[sw,top*4.0]],linear(c,0,0,sw+W*.08,top*3,['#382b24','#5d4535','#292621']));
 let co=[[sw+W*.085,top-.6],[sw+W*.048,top*1.21],[sw+W*.025,top*1.87],[sw+W*.011,top*2.72],[sw-.4,top*4.2],[sw-.4,H-bot]];
 smooth(c,co,'#1d211e',u*3.5);smooth(c,co,gold,u*.95);line(c,[[sw*.31,top],[sw*.31,H-bot]],'#a3804c',u*1.2);line(c,[[sw*.52,top],[sw*.52,H-bot]],'#211e18',u*2);
 for(let sy of [top*2,H-bot-top*.64]){let xx=sw*.49,rad=Math.max(1.15,sw*.13);ell(c,xx,sy,rad,rad,'#211d18');ell(c,xx-u*.35,sy-u*.6,rad*.73,rad*.73,'#bc9e64');line(c,[[xx-rad*.40,sy+rad*.33],[xx+rad*.4,sy-rad*.33]],'#514639',u*.8);}
 c.restore();}
 c.fillStyle=linear(c,0,0,0,top,bands[1]);c.fillRect(0,0,W,top);c.fillStyle=linear(c,0,H-bot,0,H,['#a58755','#493629','#352a24','#584030','#2a221e']);c.fillRect(0,H-bot,W,bot);
 for(let j=0;j<95;j++){let x=r()*W,y=r()*bot,len=(.02+r()*.17)*W;line(c,[[x,H-bot+y],[x+len*.35,H-bot+y+u*.45],[x+len,H-bot+y-u*.35]],j%3?'rgba(220,169,112,.13)':'rgba(25,14,12,.35)',u*.52);}
 for(let y of [top*.27,top*.63,H-bot+u*2,H-u*3.5])line(c,[[0,y],[W,y]],y===top*.63?'#a58a55':'#b29257',u*.75);
 line(c,[[0,top],[W,top]],'#24291f',u*1.3);
 // Scale tick strip and central artisan's maker-mark.
 let y=H-bot*.51,xm=W*.5;
 for(let side of [-1,1])for(let j=0;j<33;j++){let x=xm+side*(W*.085+j*W*.0118),ht=(j%4===0?3:1.45)*u;line(c,[[x,y-ht],[x,y+ht]],'rgba(199,168,111,.66)',u*.65);}
 let hw=Math.min(W*.074,49*u),hh=Math.min(bot*.33,6.6*u);
 for(let [k,col] of [[1,'#241d16'],[.90,'#ad8d56'],[.75,'#3b352b']])fill(c,[[xm-hw*k,y],[xm-hw*.82*k,y-hh*k],[xm+hw*.82*k,y-hh*k],[xm+hw*k,y],[xm+hw*.82*k,y+hh*k],[xm-hw*.82*k,y+hh*k]],col);
 for(let d of [-1,1])line(c,[[xm+d*hw*.56,y],[xm+d*hw*.2,y]],'#c4a66e',u*.7);
 seal(c,xm,y,hh*.74,pale);
}
function paperPattern(c){let cv=document.createElement('canvas');cv.width=cv.height=160;let z=cv.getContext('2d'),img=z.createImageData(160,160),r=rand(135221);for(let i=0;i<img.data.length;i+=4){let n=r(),v=n>.56?255:16;img.data[i]=v;img.data[i+1]=v;img.data[i+2]=v;img.data[i+3]=Math.round(3+14*pow(r(),1.4));}z.putImageData(img,0,0);return c.createPattern(cv,'repeat');}
// Cylinders, turned figures, planked hull strips and cloth skins all use this pinhole camera.
function Engine(c,W,H){
 const sc=Math.min(W/13.35,H/6.55),sv=Math.min(sc*1.30,H/6.35),cx=W*.5,base=H*.762;
 let q=[];let seq=0;
 function P(p){let f=24/(24+p[2]);return [cx+(p[0]+.069*p[2])*f*sc,base-(p[1]+.26*p[2])*f*sv];}
 function depth(p){return p[2]-.155*p[1];}
 function face(ps,col,opts={}){let pp=ps.map(P);let d=ps.reduce((s,p)=>s+depth(p),0)/ps.length+(opts.bias||0);if(opts.lit){let a=ps[0],b=ps[1],f=ps[2],v=b.map((x,i)=>x-a[i]),w=f.map((x,i)=>x-a[i]),n=[v[1]*w[2]-v[2]*w[1],v[2]*w[0]-v[0]*w[2],v[0]*w[1]-v[1]*w[0]],len=Math.hypot(...n)||1;let d=(-.45*n[0]+.71*n[1]-.54*n[2])/len;col=shade(col,.85+.23*d);}
 q.push([d,seq++,pp,col,0,opts.edge||null]);}
 function stroke(ps,col,w,bias=-.012){q.push([ps.reduce((s,p)=>s+depth(p),0)/ps.length+bias,seq++,ps.map(P),col,w*sc]);}
 function flush(){q.sort((a,b)=>b[0]-a[0]||a[1]-b[1]);for(let o of q){if(o[4])line(c,o[2],o[3],Math.max(.42,o[4]));else{fill(c,o[2],o[3]);if(o[5])line(c,[...o[2],o[2][0]],o[5],Math.max(.36,.009*sc));}}q.length=0;}
 function cylinder(a,b,ra,rb,col,n=8){let d=b.map((t,i)=>t-a[i]),l=Math.hypot(...d);if(l<.0001)return;d=d.map(v=>v/l);let p=abs(d[1])>.92?[1,0,0]:[d[2],0,-d[0]],ll=Math.hypot(...p);p=p.map(v=>v/ll);let h=[d[1]*p[2]-d[2]*p[1],d[2]*p[0]-d[0]*p[2],d[0]*p[1]-d[1]*p[0]];let aa=[],bb=[];for(let j=0;j<n;j++){let t=j*TAU/n,v=p.map((v,i)=>v*cos(t)+h[i]*sin(t));aa.push(v.map((q,i)=>a[i]+q*ra));bb.push(v.map((q,i)=>b[i]+q*rb));}for(let j=0;j<n;j++){let k=(j+1)%n;face([aa[j],aa[k],bb[k],bb[j]],col,{lit:true});}face(bb,col,{lit:true});}
 function lathe(origin,rings,col,n=8){let prev=null;for(let [y,rx,rz,off=0] of rings){let row=[];for(let i=0;i<n;i++){let t=TAU*i/n;row.push([origin[0]+off+cos(t)*rx,origin[1]+y,origin[2]+sin(t)*rz]);}if(prev)for(let j=0;j<n;j++){let k=(j+1)%n;face([prev[j],row[j],row[k],prev[k]],col,{lit:true});}prev=row;}}
 return {P,face,stroke,flush,cyl:cylinder,lathe,sc,sv,cx,base,wx:u=>(W*u-cx)/sc};
}
function box(E,x,y,z,w,h,d,co){let a=[x-w/2,y,z-d/2],b=[x+w/2,y,z-d/2],k=[x+w/2,y,z+d/2],l=[x-w/2,y,z+d/2],A=[a[0],y+h,a[2]],B=[b[0],y+h,b[2]],K=[k[0],y+h,k[2]],L=[l[0],y+h,l[2]];E.face([a,A,B,b],co,{lit:true});E.face([b,B,K,k],co,{lit:true});E.face([a,l,L,A],co,{lit:true});E.face([A,L,K,B],co,{lit:true});}
function wharf(E,W,night){
 let x1=E.wx(.616),x2=E.wx(.931),z=.73,d=1.7,y=.46,r=rand(8503);
 for(let t of [.045,.39,.70,.95])for(let zz of [z-d*.42,z+d*.40]){let x=mix(x1,x2,t);E.cyl([x,-.55,zz],[x,y,zz],.064,.095,night?'#403d30':'#594938',7);E.cyl([x,.23,zz],[x,.28,zz],.098,.098,'#afa071',8);}
 for(let i=0;i<3;i++){let a=mix(x1,x2,i/3+.03),b=mix(x1,x2,(i+1)/3-.03);E.cyl([a,-.30,z-d*.44],[b,.43,z-d*.44],.037,.037,'#67523d',5);}
 box(E,(x1+x2)/2,.38,z,x2-x1,.10,d,night?'#4e4838':'#675641');
 let n=18,dx=(x2-x1)/n;for(let i=0;i<n;i++){let x=x1+(i+.5)*dx;box(E,x,.48,z,dx-.013,.055,d+.031,night?['#675b44','#716047','#77664a'][i%3]:['#a28a61','#97805b','#a79068'][i%3]);if(i%2===0)E.stroke([[x,.538,z-.75],[x+.018,.539,z-.4],[x-.013,.539,z+.61]],'rgba(66,53,36,.62)',.009);}
 E.stroke([[x1,.413,z-d/2-.014],[x2,.413,z-d/2-.014]],'#c3a672',.021);
 for(let u of [0,.32,.67,1]){let x=mix(x1,x2,u);E.cyl([x,.5,z+.79],[x,.76,z+.79],.042,.037,'#775e40',7);E.cyl([x,.76,z+.79],[x,.8,z+.79],.051,.038,'#b99e64',8);}
}
function hull(E,B,night){
 let col=night?['#2e3733','#48483b','#6c5543','#8f593e','#b8a176']:['#37483e','#576252','#796049','#a45e42','#ccb284'];
 function tip(u){return .65+.42*pow(abs(u),2.4)+.07*u;}
 function side(u,v,sgn){let t=(u+1)/2,shape=pow(Math.max(0,sin(t*PI)),.72);return B(u*(2.77+.19*v),mix(tip(u)*pow(abs(u),3)-.12,tip(u),v),sgn*shape*(.10+.60*pow(v,.72)));}
 let n=16,levels=[0,.18,.38,.62,.86,1];
 for(let i=0;i<n;i++){let u=-1+2*i/n,w=-1+2*(i+1)/n;for(let sg of [1,-1])for(let j=0;j<levels.length-1;j++){
 let a=levels[j],b=levels[j+1],p=[side(u,a,sg),side(w,a,sg),side(w,b,sg),side(u,b,sg)];
 E.face(p,shade(col[j],(.77+.24*sin((i+.7)*PI/(n+2)))*(sg>0?.92:1)),{lit:false});E.stroke([side(u,b,sg*1.008),side(w,b,sg*1.008)],j===4?'#dfc38b':j===3?'#342f28':'#423e31',j===4?.038:.017,-.02);
 if(sg===-1&&j>0&&i>0&&i<n-1){for(let k=0;k<2;k++){let f=.19+(.41*k)+.07*sin(i*3+j);E.stroke([side(u+.018,mix(a,b,f),sg*1.007),side((u+w)*.5,mix(a,b,f+.04),sg*1.008),side(w-.012,mix(a,b,f-.017),sg*1.009)],k===0?'rgba(55,39,31,.43)':'rgba(232,200,144,.30)',.008,-.032);}}
 if(i%2&&sg===-1&&j>1){let pt=side(w-.065,mix(a,b,.36),sg*1.012);E.stroke([pt,[pt[0]+.017,pt[1]+.004,pt[2]]],'#cab080',.019,-.025);}
 }
 E.face([side(u,1,-1),side(w,1,-1),side(w,1,1),side(u,1,1)],i%2?'#8b7351':'#856d4c',{bias:.012});
 for(let sg of [1,-1])E.stroke([side(u,.974,sg*1.028),side(w,.974,sg*1.029)],'#342e29',.021,-.025);
 }
 for(let u of [-.69,-.37,.06,.48,.73]){let cp=side(u,1,1),cq=side(u,1,-1);E.stroke([cp,cq],'#483b2a',.086,-.01);E.stroke([[cp[0]-.015,cp[1]+.012,cp[2]],[cq[0]-.015,cq[1]+.012,cq[2]]],'#b39866',.055,-.023);}
 E.cyl(B(-2.78,.53,0),B(-3.07,1.07,0),.075,.04,'#78573d',7);
 E.face([B(-2.72,.57,0),B(-3.03,.61,0),B(-3.15,-.03,0),B(-2.87,.07,0)],'#744e35',{lit:true});E.cyl(B(-2.91,.91,0),B(-2.2,1.04,-.11),.035,.025,'#a68d59',6);
}
function rig(E,B,s,night,solo){
 const mast=-.34;E.cyl(B(mast,.67,0),B(mast+.055,3.93,0),.062,.032,'#a68b5f',9);
 for(let h of [.85,1.13,2.06,3.31,3.83])E.cyl(B(mast+.016*h,h,0),B(mast+.016*h,h+.053,0),.07-h*.005,.07-h*.005,'#c5ad74',8);
 E.cyl(B(2.31,.87,0),B(3.28,1.17,0),.045,.025,'#997c4f',7);
 for(let sg of [-1,1]){E.stroke([B(-.28,3.80,.01),B(-2.58,.99,sg*.26)],'#554c3a',.013);E.stroke([B(-.28,3.80,.01),B(3.24,1.17,.015)],'#5b513b',.016);}
 // Four separately hinged gaff-sail leaves. The boom and seam hems turn with their leaf.
 let shrine=s.movement===2||s.act==='memory',wc=s.gesture||[0,0,0,0];let sailCols=night?['#9fa69a','#b8b6a0','#c3c0a5','#d0c7a6']:['#c2b69a','#d9c9a6','#e3cfaa','#eed9b0'];
 for(let j=0;j<4;j++){let lo=j/4,hi=(j+1)/4,drive=solo?0:clamp(+wc[j]||0),open=solo?.117:shrine?.65:1,angle=(drive*.30+.035*sin(j*1.7)),clothes=night&&drive>.32?'#dbcaa5':sailCols[j];
  function v(a,b,off=0){let t=mix(lo,hi,.026+.945*b),z=(.085+.16*drive)*sin(a*PI)+a*.10+sin(PI*b)*.044+off;let y0=mix(1.11,3.45,lo),span=(2.34/4)*b*(.947-angle*.65);let y=y0+span+mix(-.10,.46,t)*a-.13*sin(PI*a)+.014*drive;let x=(mast+.02*t)-a*mix(2.07,1.36,t)*open; if(solo)y=y0+span+.03*a;return B(x,y,z-.19-a*.20*drive);}
  for(let k=0;k<6;k++){let a=k/6,b=(k+1)/6;let ps=[v(a,0),v(b,0),v(b,1),v(a,1)];E.face(ps,shade(clothes,.935+.062*sin((k+.5)*PI/6)+.012*cos(k*PI)),{bias:-.003});E.stroke([v(a,1,-.01),v(b,1,-.01)],'#927e59',.011,-.029);E.stroke([v(a,0,-.013),v(b,0,-.013)],night?'#a29472':'#ac946b',.018,-.031);if(k>0)E.stroke([v(a,.04,-.014),v(a,.96,-.014)],'rgba(112,88,52,.46)',.009,-.028);}
  // A stamped compass rose, printed before the panel is bound to the frame.
  if(!solo&&j===1){
   const mark=(x,y)=>v(.54+x/(open*1.84),.51+y/.577,-.054);
   for(let radius of [.204,.238]){let pts=[];for(let u=0;u<=40;u++){let a=TAU*u/40;pts.push(mark(radius*cos(a),radius*sin(a)));}E.stroke(pts,radius<.22?'#9c7759':'#ae8868',radius<.22?.013:.009,-.13);}
   for(let u=0;u<8;u++){let a=u*PI/4,r=u%2?.12:.178,tx=cos(a)*r,ty=sin(a)*r,sx=-sin(a)*.036,sy=cos(a)*.036;
     E.face([mark(tx,ty),mark(sx,sy),mark(0,0)],'#97684d',{bias:-.16});
     E.face([mark(tx,ty),mark(-sx,-sy),mark(0,0)],'#b38c66',{bias:-.16});}
  }
  // Hand-stitched reef eyelets; irregular diagonal tension creases.
  if(!solo)for(let k=1;k<=5;k++){let a=k/6;E.stroke([v(a-.013,.31,-.02),v(a+.01,.34,-.02)],'#8b7c59',.024,-.046);E.stroke([v(a,.32,-.02),v(a+.05,.23,-.02)],'rgba(130,108,67,.68)',.009,-.036);}
  E.stroke([v(0,.01,-.026),v(1,.01,-.026)],'#8c744f',.023,-.043);
  E.cyl(v(.01,0,-.029),v(.01,.205,-.029),.032,.032,'#b49a59',7);
 }
 // Cinnabar jib: narrow panels radiating from the tack, stamped with a faded band.
 let A=[-.22,3.38,.006],T=[2.70,1.18,.008],K=[.17,1.11,.014];
 if(shrine&&!solo){T=[.38,1.20,.05];K=[-.10,1.16,-.045];}if(solo){A=[-.23,3.04,0];T=[-.05,1.19,0];K=[-.22,1.15,0];}
 function jib(t,h,off=0){let foot=avg(K,T,t),p=avg(foot,A,h);return B(p[0],p[1]-.065*sin(PI*t)*(1-h),p[2]-.19*sin(PI*t)*(1-h)-.058*sin(PI*h)+off);}
 for(let k=0;k<7;k++){let a=k/7,b=(k+1)/7;E.face([jib(a,0),jib(b,0),jib(b,.994),jib(a,.994)],shade(night?'#94614e':'#bd694a',.90+.12*sin(PI*(k+.5)/7)));E.stroke([jib(a,.02,-.009),jib(a,.96,-.009)],'#764c3c',.012,-.03);if(!solo){let z=.22;E.face([jib(a,z,-.018),jib(b,z,-.018),jib(b,z+.029,-.018),jib(a,z+.029,-.018)],'#cb9b71',{bias:-.037});}}
 E.stroke([jib(0,0,-.02),jib(1,0,-.02)],'#e2b98a',.026,-.047);E.stroke([jib(1,0,-.02),jib(1,1,-.02)],'#dec496',.019,-.044);
 // Mast-head pennant and its ferrule.
 E.face([B(-.29,3.90,0),B(.19,3.96,.015),B(.45,3.89,.024),B(.23,3.86,.015),B(.09,3.83,0),B(-.29,3.78,0)],solo?'#795546':'#b95d43');
 E.cyl(B(-.28,3.91,0),B(-.28,3.965,0),.041,.024,'#dcc28a',8);
}
const people=[['bn',.736,1.27],['fl',.804,1.52],['hn',.877,1.33],['v1',.664,.27],['v2',.742,.20],['va',.817,.27],['vc',.899,.12]];
function player(E,key,u,z,s,night,solo,lead,am){
 let x=E.wx(u),y=.537,sc=key==='vc'?1.04:1,lim=solo?.05:clamp(am),active=lead>.35&&!solo;
 let p=(a,b,d)=>[x+a*sc,y+b*sc,z+d*sc],wood=solo?'#514f43':active?'#cc9464':'#b78f68',coat=solo?'#374344':active?'#aa6949':({v1:'#7b5447',v2:'#546261',va:'#696456',vc:'#5f5147',fl:'#55716c',bn:'#785646',hn:'#56605b'})[key];
 let t=s.armPose===undefined?(s.motion===false?0:sin((s.beat||0)*1.50+z*2.45)*lim):s.armPose;let h=key==='vc'?.88:1.0,off=(active?-.047:-.012)+.013*t;
 E.lathe(p(0,0,0),[[0,.14,.095],[.032,.16,.112],[.072,.128,.09]],active?'#bc965a':'#615845',7);
 for(let a of [-.066,.066])E.cyl(p(a,.052,0),p(a*.65,.31*h,0),.036,.051,'#3a413f',6);
 E.lathe(p(0,.235*h,0),[[0,.109,.078],[.25*h,.091,.074],[.43*h,.143,.092,off],[.465*h,.076,.069,off]],coat,9);
 E.face([p(off-.045,.693*h,-.047),p(off+.068,.687*h,-.057),p(off+.008,.57*h,-.095)],solo?'#79796c':'#d9c5a1',{bias:-.035});
 E.lathe(p(off,.706*h,0),[[0,.04,.047],[.05*h,.045,.047],[.071*h,.081,.069],[.166*h,.086,.076],[.208*h,.058,.055]],wood,8);
 E.lathe(p(off,.803*h,.009),[[0,.089,.075],[.099*h,.083,.074],[.132*h,.038,.046]],solo?'#39413e':'#514d40',8);
 E.cyl(p(off-.022,.801*h,-.056),p(off-.033,.791*h,-.096),.022,.009,wood,5);
 let arm=(a,b,d,e,f,g)=>{E.cyl(p(a,b*h,d),p(e,f*h,g),.034,.03,coat,6);};
 if(['v1','v2','va','vc'].includes(key)){
  let cello=key==='vc',cx=cello?-.08:-.088,cy=cello?.43:.66,sz=cello?1.04:.57,zz=-.126;
  let board=[[0,-.22],[-.092,-.20],[-.122,-.13],[-.111,-.061],[-.062,-.018],[-.066,.037],[-.087,.094],[-.064,.142],[0,.15],[.067,.139],[.089,.088],[.065,.034],[.069,-.021],[.113,-.064],[.12,-.126],[.093,-.202]];
  const vi=(a,b,dep=0)=>{let vx=a*sz,vy=b*sz,rot=cello?.16:1.06;return p(cx+vx*cos(rot)-vy*sin(rot),cy+vx*sin(rot)+vy*cos(rot),zz+dep);};
  E.face(board.map(([a,b])=>vi(a,b)),solo?'#766554':'#ae7446',{edge:solo?'#524d43':'#775039',bias:-.045});E.stroke([vi(0,-.12,-.02),vi(0,.35,-.02)],'#3e4039',.022,-.07);for(let a of [-.051,.051])E.stroke([vi(a,-.05,-.023),vi(a*.88,.004,-.023)],'#4c4637',.013,-.075);
  E.stroke([vi(-.052,-.04,-.028),vi(.052,-.04,-.028)],'#e0c28a',.014,-.075);
  let bend=t*.078;arm(.085,.64,-.018,.156,.54+bend,-.114);arm(.156,.54+bend,-.114,.04,.63+bend,-.20);arm(-.09,.65,0,-.14,.56,-.08);arm(-.14,.56,-.08,cello?-.14:-.192,cello?.64:.735,-.13);
  E.stroke([p(-.185,.43+bend,-.225),p(.171,.79+bend,-.19)],solo?'#716b56':'#d1b786',.016,-.10);
  if(cello)E.stroke([vi(0,-.17),p(-.073,.07,-.104)],'#544a39',.016);
 } else if(key==='fl'){
  arm(.09,.63,0,.15,.54,-.10);arm(.15,.54,-.10,.19,.75,-.14);arm(-.09,.63,0,-.12,.57,-.10);arm(-.12,.57,-.10,-.01,.76,-.16);E.cyl(p(-.09,.79,-.12),p(.37,.73+t*.025,-.15),.023,.017,solo?'#808274':'#cfccac',7);
 } else if(key==='bn'){
  arm(.09,.63,0,.13,.55,-.10);arm(.13,.55,-.10,-.045,.53,-.14);arm(-.09,.63,0,-.10,.7,-.125);E.cyl(p(.076,.26,-.10),p(-.16,1.02+t*.018,-.13),.032,.052,solo?'#675749':'#98583e',8);for(let y of [.32,.45,.59,.79,.99])E.stroke([p(mix(.076,-.16,(y-.26)/.76)-.019,y,-.154),p(mix(.076,-.16,(y-.26)/.76)+.026,y,-.157)],'#bda577',.021,-.04);
 } else{
  arm(-.09,.63,0,-.159,.55,-.10);arm(.09,.63,0,.126,.51,-.10);let pts=[];for(let j=0;j<=25;j++){let a=TAU*j/25;pts.push(p(-.023+.117*cos(a),.56+.105*sin(a),-.136));}E.stroke(pts,solo?'#797658':'#c6a662',.035,-.07);E.cyl(p(.055,.57,-.13),p(.206,.66,-.145),.017,.079,solo?'#797658':'#bb954f',8);E.stroke([p(-.101,.62,-.13),p(-.13,.72,-.12),p(-.042,.78,-.10)],'#b8a371',.018,-.05);
 }
}
function lantern(E,orig,level){
 let [x,y,z]=orig,p=(a,b,c)=>[x+a,y+b,z+c],metal=level>.23?'#ac864a':'#73694c',lit=level>.13;
 E.lathe(orig,[[0,.165,.14],[.052,.177,.147],[.071,.147,.128],[.105,.153,.13],[.133,.137,.117]],metal,12);
 let a0=-PI/2;for(let i=0;i<8;i++){let a=a0+TAU*i/8,b=a0+TAU*(i+1)/8;let corner=(ang,h,r)=>p(r*cos(ang),h,r*sin(ang)*.86);
   E.face([corner(a,.129,.133),corner(b,.129,.133),corner(b,.463,.172),corner(a,.463,.172)],lit?(sin((a+b)/2)<0?'rgba(255,219,139,.24)':'rgba(253,205,111,.46)'):'rgba(137,157,147,.24)');
   E.cyl(corner(a,.127,.137),corner(a,.47,.174),.0105,.012,metal,5);}
 if(lit){E.lathe(p(0,.127,0),[[0,.052,.042],[.10,.069,.055],[.22,.039,.038,-.014],[.275,.006,.006,.017]],level>.58?'#ffe9a6':'#dfb475',8);}
 E.lathe(orig,[[.458,.178,.15],[.482,.177,.150],[.508,.148,.132],[.542,.136,.117],[.616,.073,.067],[.636,.040,.037]],metal,12);
 let pts=[];for(let i=0;i<=19;i++){let a=TAU*i/19;pts.push(p(.070*cos(a),.694+.072*sin(a),0));}E.stroke(pts,'#c7a46b',.023,-.02);
 E.stroke([p(-.11,.159,-.105),p(-.125,.433,-.126)],lit?'rgba(255,246,205,.78)':'rgba(184,201,187,.50)',.013,-.027);
}
// A portable tabernacle: five folding gilt-and-marquetry pieces unfold on the skiff.
// Its punched five-lobed flower is identical in the Adagio and the rondo's memory.
function shrine(E,B,open){
 let k=ease(open);if(k<.01)return;let cx=.97,base=.86,bz=-.04,top=1.56;
 const P=(x,y,z=0)=>B(cx+x,base+y*k,bz+z);
 const arch=(hw,h)=>{let p=[[-hw,0],[hw,0],[hw,h*.61]];for(let i=0;i<=14;i++){let a=i*PI/14;p.push([hw*cos(a),h*.61+h*.39*sin(a)]);}p.push([-hw,0]);return p;};
 const panel=(pts,f,col,depth=0,bias=0)=>E.face(pts.map(([x,y])=>f(x,y,depth)),col,{bias});
 const pen=(pts,f,col,w,depth,bias=-.08)=>E.stroke(pts.map(([x,y])=>f(x,y,depth)),col,w,bias);
 // Cased arched back, with a solid return visible along its shoulder, and a brass bead mould.
 let p=arch(.46,top),A=(x,y,z)=>P(x,y,.24+z);
 panel(p,A,'#5f4c36',.10);for(let i=0;i<p.length-1;i++){let a=p[i],b=p[i+1];E.face([A(...a,.1),A(...b,.1),A(...b,-.018),A(...a,-.018)],'#8d714b',{lit:true});}
 panel(p,A,'#b69455',-.021,-.075);let inset=arch(.407,top-.095).map(([x,y])=>[x,y+.035]);panel(inset,A,'#2e4b49',-.04,-.095);pen(inset,A,'#dbc38a',.018,-.061,-.13);
 for(let sc of [.90,.76]){let arc=[];for(let i=0;i<=30;i++){let a=PI*i/30;arc.push([.40*sc*cos(a),.94+.54*sc*sin(a)]);}pen(arc,A,sc>.8?'#bd9d61':'#6e745b',.012,-.064,-.14);}
 // A pierced sunburst with a scalloped marquetry bed and jewel at the center.
 let cy=1.013,rr=.316,circle=[],scallop=[];for(let j=0;j<60;j++){let a=TAU*j/60,r=rr*(.89+.105*cos(5*a-PI*.52));scallop.push([r*cos(a),cy+r*sin(a)]);circle.push([rr*1.05*cos(a),cy+rr*1.05*sin(a)]);}
 panel(circle,A,'#7d5337',-.075,-.16);pen([...circle,circle[0]],A,'#d8b677',.023,-.08,-.19);panel(scallop,A,'#cba55c',-.085,-.2);
 for(let j=0;j<5;j++){let a=TAU*j/5-PI/2,pet=[];for(let i=0;i<=18;i++){let t=TAU*i/18,u=.156+.093*cos(t),v=.043*sin(t)*(1+.28*cos(t));pet.push([u*cos(a)-v*sin(a),cy+u*sin(a)+v*cos(a)]);}panel(pet,A,'#364b44',-.098,-.235);}
 let star=[];for(let i=0;i<10;i++){let a=i*PI/5-PI/2,r=i%2?.048:.11;star.push([r*cos(a),cy+r*sin(a)]);}panel(star,A,'#f1d79b',-.106,-.245);
 // Ivory folding shutters. Two outer louvres alternately show ivory face and dark walnut return.
 for(let sg of [-1,1]){
  const wing=(x,y,z=0)=>P(sg*(.43+x*(.25+.75*k)),y,.21-x*.60*k+z);
  const shapes=[
    [[0,0],[.32,.045],[.375,.12],[.37,.99],[.29,1.18],[.105,1.20],[0,1.38]],
    [[.34,.057],[.52,.12],[.55,.18],[.55,.87],[.49,.975],[.37,1.025]]];
  for(let j=0;j<2;j++){let verts=shapes[j];panel(verts,wing,j?'#977a49':'#55482f',.046,-.03);panel(verts,wing,j?'#aa8c5e':'#dfcb9a',-.018,-.11);pen([...verts,verts[0]],wing,'#c3a362',.026,-.04,-.15);}
  let folio=[[.054,.115],[.285,.14],[.31,.22],[.305,.92],[.239,1.078],[.146,1.068],[.052,1.166]];panel(folio,wing,'#6a7967',-.045,-.17);pen([...folio,folio[0]],wing,'#a89466',.017,-.052,-.18);
  // Cutwork sea-oats as a branching stem, a resolutely handmade motif.
  pen([[.15,.22],[.195,.47],[.146,.73],[.209,.94]],wing,'#dcc493',.015,-.068,-.20);
  for(let j=0;j<5;j++){let h=.34+j*.117,x=.17+.03*cos(j),sgn=j%2?1:-1;panel([[x,h],[x+sgn*.092,h+.045],[x+sgn*.10,h+.105],[x+sgn*.032,h+.08]],wing,'#c5b584',-.075,-.22);}
  for(let a of [.21,.77,1.08])E.cyl(wing(.01,a,-.062),wing(.01,a+.115,-.062),.032,.032,'#c9a86c',7);
  for(let a of [.26,.53,.82])pen([[.38,a],[.486,a+.023]],wing,'#786448',.014,-.055,-.17);
 }
 // Stepped walnut foot is a real deck-mounted socket, not a halo painted on the sky.
 for(let i=0;i<2;i++){
 let hw=.58-i*.046,h=.046+i*.047;E.face([P(-hw,h,-.32),P(hw,h,-.32),P(hw,h,.32),P(-hw,h,.32)],'#ac945e',{bias:-.075});
 E.face([P(-hw,h-.046,-.32),P(hw,h-.046,-.32),P(hw,h,-.32),P(-hw,h,-.32)],i?'#977c4d':'#604c35',{bias:-.09});}
}
// Six scoops in two groups of three, geared to the score's quaver clock. The wheel is
// seen edge-on at its waterline and face-on at its nave; it feathers during the quotation.
function tidewheel(E,s,feather){
 const hub=[E.wx(.681),.11,-.21],r=.66,phase=(s.motion===false?0:(+s.beat||0))*PI/3+.23,fold=clamp(feather);
 function P(x,y,z){return [hub[0]+x,hub[1]+y,hub[2]+z+x*.17];}
 const old='#806941',brass='#c3a465',light='#dfc488';
 // Load-bearing fork on the quay; worm-wheel and handle are at starboard.
 for(let sg of [-1,1]){E.cyl(P(-.68,.33,.32+sg*.1),P(0,0,.23+sg*.10),.050,.062,old,8);E.cyl(P(.49,.37,.32+sg*.07),P(0,0,.23+sg*.07),.049,.06,old,8);}
 E.cyl(P(0,0,.41),P(0,0,-.29),.078,.077,brass,10);
 for(let end of [.095,-.14]){
 let pts=[];for(let j=0;j<=60;j++){let a=TAU*j/60;pts.push(P(cos(a)*r,sin(a)*r,end));}E.stroke(pts,end>0?'#76623f':light,end>0?.034:.039,-.05);
 for(let j=0;j<6;j++){let a=phase+TAU*j/6,g=sg=>[cos(a+sg)*r,sin(a+sg)*r],tip=g(0),a1=g(-.08),a2=g(.08);let root=[cos(a)*.092,sin(a)*.092];E.face([P(root[0],root[1],end),P(a1[0],a1[1],end),P(tip[0],tip[1],end),P(a2[0],a2[1],end)],j%3===0?'#d9b774':brass,{bias:-.013});
 if(end<0){E.stroke([P(root[0],root[1],end-.011),P(tip[0],tip[1],end-.011)],'#ead29a',.013,-.042);}}
 }
 for(let j=0;j<6;j++){let a=phase+TAU*j/6,rr=r+.07,ax=cos(a)*rr,ay=sin(a)*rr,span=.185*(1-.85*fold),tan=[-sin(a)*span,cos(a)*span];let quad=[P(ax-tan[0],ay-tan[1],-.145),P(ax+tan[0],ay+tan[1],-.145),P(ax+tan[0],ay+tan[1],.13),P(ax-tan[0],ay-tan[1],.13)];E.face(quad,fold?'#766c56':j%3===0?'#b36748':'#a5804c',{lit:true});E.stroke([quad[0],quad[1]],'#dfba74',.028,-.028);}
 E.cyl(P(0,0,-.24),P(0,0,-.34),.139,.099,light,12);E.cyl(P(0,0,-.35),P(0,0,-.385),.061,.059,'#74593a',10);
}

function waterMark(c,E,P,W,H,beat,lum,night){
 let [x,y]=P,ww=E.sc,r=rand(8231);
 for(let j=0;j<32;j++){let v=j/31,py=y+pow(v,1.3)*ww*.96,pX=x+ww*((r()-.5)*(.38+v*.5)+.03*sin(beat*.30+j)),span=ww*(.038+r()*.32)*(1-.39*v),w=ww*(.008+.026*r());fill(c,[[pX-span*.75,py],[pX-span*.14,py-w],[pX+span,py-w*.13],[pX+span*.46,py+w*.32]],'rgba(245,201,122,'+(lum*(.59-.38*v))+')');}
}
function shadow(c,x,y,rx,ry,night){c.save();c.translate(x,y);c.scale(1,ry/rx);let g=radial(c,0,0,rx,[[0,night?'rgba(6,19,25,.76)':'rgba(7,30,34,.72)'],[.62,'rgba(9,31,35,.43)'],[1,'rgba(8,38,41,0)']]);ell(c,0,0,rx,rx,g);c.restore();}
function theatre(canvas){
 const ctx=canvas.getContext('2d',{alpha:false});if(!ctx)throw Error('Canvas unavailable');
 let W=0,H=0,D=0,layers={},actors=new Map(),grain=null,picks={},camera=null,dead=false;
 function off(){let cv=document.createElement('canvas');cv.width=canvas.width;cv.height=canvas.height;let c=cv.getContext('2d');c.setTransform(D,0,0,D,0,0);return [cv,c];}
 function colorPlate(night){let id=night?'dusk':'day';if(layers[id])return layers[id];let [cv,c]=off();
 sky(c,W,H,night);land(c,W,H,night);lighthouse(c,W,H,night);let E=Engine(c,W,H);let L=E.P([E.wx(.806),0,.67]);shadow(c,L[0],L[1]+E.sv*.16,W*.193,E.sv*.24,night);wharf(E,W,night);E.flush();layers[id]=cv;return cv;}
 function drawActor(E,id,u,z,s,night,solo,f,am){
  let bin=solo||s.motion===false?0:Math.round(sin((s.beat||0)*1.5+z*2.45)*clamp(am)*5);
  let key=id+':'+(solo?2:f>.35?1:0)+':'+bin,sprite=actors.get(key);
  if(!sprite){
   let origin=E.P([E.wx(u),.537,z]),x=Math.floor(origin[0]-E.sc*.47)-2,y=Math.floor(origin[1]-E.sv*1.22)-2;
   let w=Math.ceil(E.sc*.99)+5,h=Math.ceil(E.sv*1.39)+5,cv=document.createElement('canvas');cv.width=Math.ceil(w*D);cv.height=Math.ceil(h*D);
   let cp=cv.getContext('2d');cp.setTransform(D,0,0,D,-x*D,-y*D);cp.lineCap='round';cp.lineJoin='round';
   let ee=Engine(cp,W,H);player(ee,id,u,z,{armPose:bin/5},night,solo,f,am);ee.flush();sprite={cv,x,y};if(actors.size>170)actors.delete(actors.keys().next().value);actors.set(key,sprite);
  }
  ctx.drawImage(sprite.cv,sprite.x,sprite.y,sprite.cv.width/D,sprite.cv.height/D);
 }
 function edging(){if(layers.edge)return layers.edge;let [cv,c]=off();c.globalAlpha=.83;c.fillStyle=grain;c.fillRect(0,0,W,H);c.globalAlpha=1;let v=c.createRadialGradient(W*.48,H*.43,H*.38,W*.50,H*.5,Math.max(W*.58,H*.71));v.addColorStop(0,'rgba(16,27,26,0)');v.addColorStop(.78,'rgba(16,27,26,.065)');v.addColorStop(1,'rgba(16,23,21,.35)');c.fillStyle=v;c.fillRect(0,0,W,H);frame(c,W,H);layers.edge=cv;return cv;}
 function draw(s={}){
  if(dead)return;let rect=canvas.getBoundingClientRect();let w=Math.max(2,Math.round(rect.width||canvas.clientWidth||900)),h=Math.max(2,Math.round(rect.height||canvas.clientHeight||430)),d=Math.max(1,Math.min(global.devicePixelRatio||1,1.75,1550/w));if(w!==W||h!==H||d!==D){W=w;H=h;D=d;canvas.width=Math.round(W*D);canvas.height=Math.round(H*D);layers={};actors.clear();grain=paperPattern(ctx);}
  ctx.setTransform(D,0,0,D,0,0);ctx.lineJoin='round';ctx.lineCap='round';let E=Engine(ctx,W,H),m=+s.movement||1,bar=+s.bar||1,ph=clamp(+s.phase||0),beat=(s.motion===false?0:(+s.beat||0)),arc=clamp(+s.arc||0),solo=s.act==='cadenza'||s.cadenza>.55;
  let recalled=m===3&&bar>=153&&bar<169,night=m===2||recalled||solo;
  let light=s.leader||'v1',old=s.leaderPrev||light,k=s.leaderMix===undefined?1:clamp(s.leaderMix),amp=s.amplitudes||{},role=id=>(id===light?k:0)+(id===old?1-k:0);
  let bx=E.wx(m===1?.332+.062*ease((bar+ph-40)/40):m===2?.36+.027*sin(PI*arc):.353+.067*sin(PI*arc)),bz=-1.10,roll=(s.motion===false?0:.009*sin(beat*.128)+.002*sin(beat*.257)),bob=s.motion===false?0:.013*sin(beat*.198),yaw=-.155+.055*sin(arc*PI);
  function B(x,y,z){let xx=x*cos(roll)-y*sin(roll),yy=x*sin(roll)+y*cos(roll);return [bx+xx*cos(yaw)+z*sin(yaw),yy+bob,bz-xx*sin(yaw)+z*cos(yaw)];}
  // Each player has a fixed mechanical station; a single physical carriage slides between them.
  let onDeck=B(.97,.84,-.38);function station(id){if(id==='cl')return onDeck;let a=people.find(p=>p[0]===id)||people[3];return [E.wx(a[1])-.20,1.42,a[2]-.07];}
  let beacon=avg(station(old),station(light),k);beacon[1]+=.36*sin(k*PI);
  if(solo)beacon=onDeck.slice();
  if(recalled&&bar+ph<158){let travel=.17+.83*ease((bar+ph-153)/4.6);beacon=avg(station('bn'),onDeck,travel);beacon[1]+=.99*sin(travel*PI);}
  let reed=clamp(amp.cl||0),pitchLift=s.pitch==null?0:clamp((s.pitch-46)/41);let lum=solo?.63+.31*reed+.05*pitchLift:recalled?.91+.08*reed:m===2?.82+.11*reed+.045*pitchLift:.40+.26*(amp[light]||0);
  let L=E.P([beacon[0],beacon[1]+.30,beacon[2]]),C=E.P(B(0,1.72,0));let focus=s.focus||'stage',zoom=focus==='lamp'?1.54:focus==='skiff'?1.24:1,fx=focus==='lamp'?L[0]:C[0],fy=focus==='lamp'?L[1]:C[1],dx=focus==='stage'?0:clamp(W*.49-fx*zoom,W*(1-zoom),0),dy=focus==='stage'?0:clamp(H*.50-fy*zoom,H*(1-zoom),0);
  camera=[zoom,dx,dy];ctx.save();ctx.translate(dx,dy);ctx.scale(zoom,zoom);ctx.drawImage(colorPlate(night),0,0,W,H);
  // In the Adagio the back wall becomes a lantern chamber: rib shadows interrupt its light.
  if(m===2||recalled){let reach=E.sc*2.65;glow(ctx,L[0],L[1],reach,'242,173,77',.37);for(let j=0;j<4;j++){let a=-2.71+j*.19,b=a+.070,r=reach*1.15;let g=radial(ctx,L[0],L[1],r,[[0,'rgba(255,217,140,.08)'],[.40,'rgba(255,212,143,.08)'],[1,'rgba(244,198,117,0)']]);fill(ctx,[L,[L[0]+cos(a)*r,L[1]+sin(a)*r],[L[0]+cos(b)*r,L[1]+sin(b)*r]],g);}}
  if(solo){ctx.fillStyle='rgba(9,30,40,.37)';ctx.fillRect(0,0,W,H);glow(ctx,L[0],L[1],E.sc*2.0,'246,182,94',.29);}
  let ground=E.P(B(.05,.00,-.24));shadow(ctx,ground[0],ground[1]+E.sv*.06,E.sc*3.22,E.sv*.31,night);
  // Short reflected fragments of the hull rather than a mirror sprite.
  let rp=rand(179312);for(let i=0;i<52;i++){let u=(rp()-.5)*5.3,dist=(.5+rp())*(1-abs(u)/2.8),a=E.P(B(u,-.05-.19*dist,-.23-.42*rp())),span=E.sc*(.04+rp()*.28);line(ctx,[[a[0]-span*.4,a[1]],[a[0]+span*.61,a[1]+.3]],i%5?'rgba(9,34,38,.52)':'rgba(193,155,101,.50)',E.sc*(.007+.021*rp()));}
  waterMark(ctx,E,E.P([beacon[0],.017,beacon[2]-.23]),W,H,beat,lum,night);
  for(let [id,u,zs] of people){let a=E.P([E.wx(u),.555,zs]),f=role(id);if(f&&!solo){glow(ctx,a[0],a[1]-E.sv*.48,E.sc*.75,'245,200,127',.51*f);ell(ctx,a[0],a[1],E.sc*.225,E.sv*.052,'rgba(240,198,117,'+(.52*f)+')');}drawActor(E,id,u,zs,s,night,solo,f,amp[id]||0);}
  E.flush();
  if(m===3){let wheelState=recalled?{...s,beat:152*6,motion:false}:s;tidewheel(E,wheelState,recalled?1:0);E.flush();}
  hull(E,B,night);E.flush();rig(E,B,s,night,solo);E.flush();
  if(m===2||recalled){shrine(E,B,m===2?1:.46+.54*ease((bar+ph-153)/1.8));E.flush();}
  if(!recalled||bar>=158){if(light!=='cl'&&!solo&&k>.98){
    let hook=E.P([beacon[0],beacon[1]+.765,beacon[2]]);let floor=E.P([beacon[0]+.36,.54,beacon[2]+.16]);
    line(ctx,[[floor[0],floor[1]],[floor[0],hook[1]+E.sv*.05],[floor[0]-E.sc*.12,hook[1]-E.sv*.10],[hook[0],hook[1]-E.sv*.06],[hook[0],hook[1]+.85]],'#735f42',Math.max(.85,E.sc*.026));
    line(ctx,[[floor[0]-E.sc*.011,hook[1]+E.sv*.12],[floor[0]-E.sc*.011,hook[1]+E.sv*.035],[floor[0]-E.sc*.13,hook[1]-E.sv*.085],[hook[0],hook[1]-E.sv*.054]],'#c1a16c',Math.max(.46,E.sc*.012));}}
  if((recalled&&bar<158)||(light!==old&&k>.025&&k<.965)){let hook=E.P([beacon[0],beacon[1]+.765,beacon[2]]);line(ctx,[[hook[0],H*.036],[hook[0],hook[1]+.7]],'rgba(144,127,85,.72)',Math.max(.55,E.sc*.011));}
  let gr=E.sc*(night?1.18:.71);glow(ctx,L[0],L[1],gr,'253,193,102',lum*(night?.65:.56));lantern(E,beacon,lum);E.flush();glow(ctx,L[0],L[1],E.sc*.16,'255,225,148',lum*.40);
  ctx.restore();ctx.drawImage(edging(),0,0,W,H);
  let fo=E.P(B(-.01,1.52,0));picks={lamp:[L[0],L[1],Math.max(E.sc*.47,15),Math.max(E.sv*.54,18)],skiff:[fo[0],fo[1],E.sc*3.1,E.sv*2.28],stage:[.79*W,.66*H,W*.18,H*.24]};
 }
 function pick(x,y){if(!camera)return null;let [z,dx,dy]=camera;x=(x-dx)/z;y=(y-dy)/z;for(let name of ['lamp','skiff','stage']){let a=picks[name];if(a&&pow((x-a[0])/a[2],2)+pow((y-a[1])/a[3],2)<1.0)return name;}return null;}
 return {draw,pick,destroy(){dead=true;layers={};actors.clear();grain=null;picks={};}};
}
global.TideTheatre=theatre;
})(window);
