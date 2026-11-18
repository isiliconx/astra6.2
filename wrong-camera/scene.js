/* One blocking track, three lenses. All space coordinates are in metres. */
(function(g,f){const api=f();if(typeof module!=='undefined')module.exports=api;if(g)g.GloveFilm=api})(typeof window!=='undefined'?window:null,()=>{
 const clamp=t=>Math.max(0,Math.min(1,t)),mix=(a,b,t)=>a+(b-a)*t,s=(a,b,t)=>{let k=clamp((t-a)/(b-a));return k*k*(3-2*k)},vMix=(a,b,t)=>a.map((v,i)=>mix(v,b[i],t)),tau=2*Math.PI,DURATION=25;
 function owner(t){const x=-3.55+.30*s(0,3,t)+6.15*s(3,11,t)-.70*s(16,19,t)+1.3*s(22.5,25,t),z=.02+.46*s(3,9,t)-.25*s(16,19,t);return{x,z,face:t<13?1:t<21.7?-1:1,crouch:0,walk:x+3.55}}
 function ownerHand(t){const a=owner(t);return[a.x+mix(.27,-.27,s(12,13,t)),1.02+.11*s(17.4,20,t),a.z+.21]}
 const drop=ownerHand(3),floor=[drop[0]+.14,.125,drop[2]+.14];
 function porter(t){const pickX=floor[0]-.28,x=.71+(pickX-.71)*s(3.7,8.15,t)+(1.56-pickX)*s(10.2,18.9,t)-.82*s(23,25,t),z=.69-.27*s(3.7,8,t)+.03*s(10.5,18,t);return{x,z,face:t<10?-1:1,crouch:s(7.4,8.65,t)*(1-s(9,10.65,t)),walk:x-.71}}
 function porterHand(t){const a=porter(t),reach=s(18.1,21.6,t),hand=[a.x+.28,1.02-.90*a.crouch,a.z-.04];const align=s(7.8,8.68,t)*(1-s(8.7,9.7,t));return vMix(vMix(hand,floor,align),ownerHand(t),reach*(1-s(22.0,23,t)))}
 function world(t){t=Math.max(0,Math.min(25,t));let glove=t<3?ownerHand(t):t<4.3?vMix(drop,floor,Math.pow(clamp((t-3)/1.3),1.8)):t<8.7?floor:t<21.6?porterHand(t):ownerHand(t);return{t,owner:owner(t),porter:porter(t),ownerHand:ownerHand(t),porterHand:porterHand(t),glove,carrier:t<3?'traveler':t<4.3?'falling':t<8.7?'on platform':t<21.6?'porter':'traveler'}}
 const cuts={
 suspicion:[{t:0,n:'The watcher',e:[2.45,1.65,3.55],a:[.72,1.36,.68],f:38},{t:4.4,n:'The approach',e:[-.6,1.6,4.7],a:[-1.8,1.0,.38],f:37},{t:7.7,n:'The taking hand',e:[-2.25,.72,2.15],a:[floor[0],.42,.39],f:36},{t:10.6,n:'Behind the cases',e:[.1,1.5,5.4],a:[-.7,1.03,.5],f:32},{t:17.7,n:'What the frame omits',e:[.99,1.74,2.40],a:[1.45,1.64,.44],f:18},{t:22.1,n:'Empty hands',e:[-.6,1.35,2.4],a:[1.24,1.19,.49],f:25}],
 kindness:[{t:0,n:'The waiting room',e:[.2,2.75,8.0],a:[-.65,1.0,.0],f:46},{t:2.8,n:'The traveler drops it',e:[-1.22,1.53,3.65],a:[-2.76,.91,.35],f:36},{t:6.0,n:'Someone notices',e:[-3.25,2.05,5.1],a:[-2.0,1,.25],f:39},{t:10.9,n:'Crossing the platform',e:[-.9,2.27,6.6],a:[.1,1.05,.22],f:52},{t:18.25,n:'The return',e:[2.0,1.55,4.1],a:[1.96,1.10,.4],f:33},{t:22.2,n:'Two travelers',e:[-.1,2.55,7.9],a:[1.46,1.1,.25],f:43}]
 };
 function shot(t,edit,lens=1){if(edit==='witness')return{e:[0,10.8,2.2],a:[0,.15,-.05],f:55/lens,n:'Overhead witness',i:0};const C=cuts[edit],i=Math.max(0,C.findLastIndex(k=>k.t<=t)),c=C[i];return{...c,i,f:c.f/lens}}
 function norm(a){let d=Math.hypot(...a)||1;return a.map(x=>x/d)}const sub=(a,b)=>a.map((x,i)=>x-b[i]),dot=(a,b)=>a.reduce((z,x,i)=>z+x*b[i],0),cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
 function projection(cam,w,h){const d=norm(sub(cam.a,cam.e)),r=norm(cross(d,[0,1,0])),u=cross(r,d),f=(h*.5)/Math.tan(cam.f*Math.PI/360);return v=>{const o=sub(v,cam.e),z=dot(o,d);return{x:w*.5+f*dot(o,r)/z,y:h*.505-f*dot(o,u)/z,z,s:f/z}}}
 const tint=(hex,k)=>{const n=parseInt(hex.slice(1),16);return 'rgb('+[n>>16,(n>>8)&255,n&255].map(x=>Math.max(0,Math.min(255,Math.round(x*k)))).join(',')+')'};
 function render(c,w,h,W,cam,options={}){const P=projection(cam,w,h),draw=[],witness=cam.n==='Overhead witness',T=W.t;let grad=c.createLinearGradient(0,0,0,h);grad.addColorStop(0,'#08222c');grad.addColorStop(.53,'#24414b');grad.addColorStop(1,'#745347');c.fillStyle=grad;c.fillRect(0,0,w,h);
 function poly(verts,color,bias=0,stroke){const vs=verts.map(P);if(vs.some(a=>a.z<.13))return;draw.push({z:vs.reduce((n,a)=>n+a.z,0)/vs.length+bias,fn(){c.beginPath();vs.forEach((p,i)=>i?c.lineTo(p.x,p.y):c.moveTo(p.x,p.y));c.closePath();c.fillStyle=color;c.fill();if(stroke){c.strokeStyle=stroke;c.lineWidth=.6;c.stroke()}}})}
 function line(a,b,color,rad=.023){const p=P(a),q=P(b);if(p.z<.1||q.z<.1)return;draw.push({z:(p.z+q.z)/2,fn(){c.lineCap='round';c.lineWidth=Math.max(.6,rad*(p.s+q.s));c.strokeStyle=color;c.beginPath();c.moveTo(p.x,p.y);c.lineTo(q.x,q.y);c.stroke()}})}
 function ell(o,rx,ry,color,bias=0,shade=true){const p=P(o);if(p.z<.15)return;draw.push({z:p.z+bias,fn(){c.beginPath();c.ellipse(p.x,p.y,Math.max(.6,p.s*rx),Math.max(.6,p.s*ry),0,0,tau);if(shade){const g=c.createRadialGradient(p.x-p.s*rx*.32,p.y-p.s*ry*.42,0,p.x,p.y,p.s*Math.max(rx,ry)*1.17);g.addColorStop(0,tint(color,1.24));g.addColorStop(.6,color);g.addColorStop(1,tint(color,.57));c.fillStyle=g}else c.fillStyle=color;c.fill()}})}
 function box(x,y,z,dx,dy,dz,col){const v=(i,j,k)=>[x+(i-.5)*dx,y+j*dy,z+(k-.5)*dz];const face=(arr,l)=>poly(arr.map(a=>v(...a)),tint(col,l));face([[0,0,0],[1,0,0],[1,1,0],[0,1,0]],.62);face([[0,0,0],[0,1,0],[0,1,1],[0,0,1]],.75);face([[1,0,0],[1,0,1],[1,1,1],[1,1,0]],.87);face([[0,0,1],[0,1,1],[1,1,1],[1,0,1]],1);face([[0,1,0],[1,1,0],[1,1,1],[0,1,1]],1.21)}
 function lathe(x,y,z,height,rb,rt,rz,col){const vs=Array.from({length:13},(_,i)=>[Math.cos(i/12*tau),Math.sin(i/12*tau)]);for(let i=0;i<12;i++){const a=vs[i],b=vs[i+1];poly([[x+a[0]*rb,y,z+a[1]*rb*rz],[x+b[0]*rb,y,z+b[1]*rb*rz],[x+b[0]*rt,y+height,z+b[1]*rt*rz],[x+a[0]*rt,y+height,z+a[1]*rt*rz]],tint(col,.83+.27*(-a[0]*.66+a[1]*.55)))}}
 function label(o,txt,col,sz){const p=P(o);if(p.z<.14)return;draw.push({z:p.z-.01,fn(){c.fillStyle=col;c.textAlign='center';c.font='bold '+Math.max(4,sz*p.s)+'px Georgia';c.fillText(txt,p.x,p.y);c.textAlign='left'}})}
 // Small floor tiles avoid depth-order artefacts from a single camera-crossing polygon.
 for(let x=-8;x<8;x++)for(let z=-4;z<5;z++){const col=(x+z)%2?'#776056':'#806959';poly([[x,0,z],[x+1,0,z],[x+1,0,z+1],[x,0,z+1]],col,1.6);if(z===1)poly([[x,.012,1.78],[x+1,.012,1.78],[x+1,.012,1.85],[x,.012,1.85]],'#bca476',.24)}
 // Art deco glazed wall panels and distant night windows, open to the top witness camera.
 for(let i=-5;i<=5;i++){const x=i*1.45;box(x,.015,-2.23,1.43,.91,.12,'#25464a');box(x,.95,-2.3,1.39,1.59,.07,i%2?'#476064':'#3d5c61');for(let j=0;j<2;j++)box(x+(j-.5)*.65,1.11,-2.235,.53,1.2,.026,'#253c4a');box(x,1.55,-2.18,1.4,.032,.035,'#9c8565');box(x+.70,0,-2.14,.075,2.64,.10,'#9a8065');box(x,2.55,-2.22,1.45,.06,.12,'#a78e69')}
 for(let i=0;i<4;i++){const x=-5.8+i*3.8;box(x,0,-1.82,.15,2.98,.17,'#42605c');box(x,2.7,-1.82,.28,.19,.25,'#a98955');line([x,2.8,-1.86],[x+.58,3.25,-1.86],'#ab8b65',.034);line([x,2.8,-1.86],[x-.58,3.25,-1.86],'#ab8b65',.034)}
 box(-.1,1.68,-2.07,2.21,.61,.11,'#24383b');box(-.1,1.72,-1.998,2.12,.52,.024,'#856b50');box(-.1,1.746,-1.979,2.06,.465,.03,'#293d40');label([-.1,1.94,-1.955],'FINCH STREET','#e7d3a5',.179);
 for(let i=-1;i<=1;i++){const x=3.35+i*.1;line([x,1.26,-2.02],[x+.11,2.10,-2.02],'#ba976e',.013)}
 // Painted destination boards, brass clocks and station elevation lines.
 for(const [ax,title,num] of [[-4.8,'NORTH','01'],[3.3,'SOUTH','02']]){
 box(ax,1.21,-2.03,.79,.73,.075,'#b18d63');box(ax,1.235,-1.98,.71,.65,.04,'#36575a');
 label([ax,1.63,-1.947],title,'#e5d4aa',.102);label([ax,1.34,-1.943],num,'#ebd7a6',.22)}
 const timeX=-2.32,cy=2.03;ell([timeX,cy,-1.98],.212,.212,'#a78d64');ell([timeX,cy,-1.94],.182,.182,'#e2ce9e');
 for(let i=0;i<12;i++){const v=i*tau/12;line([timeX+Math.sin(v)*.142,cy+Math.cos(v)*.142,-1.90],[timeX+Math.sin(v)*.163,cy+Math.cos(v)*.163,-1.90],'#624e3b',.005)}
 line([timeX,cy,-1.889],[timeX-.067,cy+.068,-1.889],'#534338',.010);line([timeX,cy,-1.889],[timeX+.040,cy+.138,-1.889],'#685640',.006);
 const bench=(x)=>{box(x,.43,-.65,1.7,.08,.47,'#a8794e');for(let j=0;j<3;j++)box(x,.66+j*.11,-.85,1.72,.07,.06,'#9d7450');for(let k of [-.67,.67])box(x+k,.015,-.66,.065,.45,.31,'#344649')};bench(-3.28);bench(3.48);
 for(let i of [-4.9,2.42,5.3]){line([i,3.3,-1.0],[i,2.81,-1.0],'#8d8469',.018);lathe(i,2.72,-1,.14,.23,.08,.78,'#a58851');ell([i,2.70,-1.0],.115,.064,'#ffd797')}
 function trunk(x,y,z,dx,dy,dz,col){box(x,y,z,dx,dy,dz,col);for(const o of [-.31,.31]){box(x+o*dx,y+.007,z+dz*.504,.045,dy,.01,'#b49268');box(x+o*dx,y+dy,z,.045,.011,dz,'#c1a37c')}line([x-.07,y+dy+.03,z],[x+.07,y+dy+.03,z],'#332c28',.021)}
 trunk(-4.77,0,.68,.92,.43,.56,'#685446');trunk(-4.72,.44,.66,.65,.29,.40,'#826044');trunk(.02,0,1.50,.82,.55,.58,'#675345');trunk(-.05,.55,1.49,.62,.34,.44,'#8c6948');trunk(3.48,0,-.23,.58,.38,.39,'#927255');
 function puppet(a,id,hand){const port=id==='porter',x=a.x,z=a.z,cr=a.crouch,face=a.face,bob=.025*Math.sin(a.walk*5.5)**2,hy=1.63-.65*cr+bob,col=port?'#38616a':'#b56f38',leg='#323e43',skin=port?'#ca9473':'#dcac85';const stride=.18*Math.sin(a.walk*4.7)*(port?(s(3.7,5,T)*(1-s(7,8.2,T))+s(10.1,12,T)*(1-s(17.7,19,T))):(s(2.8,4,T)*(1-s(9,11,T))+s(22,23,T)));
 const shadow=Array.from({length:16},(_,i)=>[x+.27*Math.cos(i*tau/16),.02,z+.16*Math.sin(i*tau/16)]);poly(shadow,'#443f3c',-.1);for(const k of [-1,1]){const xx=x+k*.11,knee=[xx+k*stride*.6+.16*cr,.40-.085*cr,z+.04+k*.025],foot=[xx+k*stride,.09,z+.06+k*.03];line([xx,.81-.37*cr,z],knee,leg,.067);line(knee,foot,leg,.063);ell([foot[0]+.045*face,.075,foot[2]+.03],.12,.062,'#342f2e')}
 const waist=.64-.31*cr+bob;lathe(x,waist,z,.78-.27*cr,port?.235:.285,.19,.64,col);ell([x,hy,z],.150,.196,skin,0);ell([x+.126*face,hy-.01,z+.05],.056,.052,skin,-.005);ell([x+.064*face,hy+.03,z+.122],.017,.019,'#2d2927',-.006);
 if(port){lathe(x,hy+.105,z+.003,.11,.175,.16,.82,'#29444c');ell([x+.071*face,hy+.105,z+.065],.174,.034,'#24333b',-.008);ell([x,hy+.17,z+.137],.03,.018,'#d2ab60',-.008);
 for(let k=0;k<3;k++)ell([x+.016,waist+.56-k*.11,z+.14],.014,.017,'#dbb572',-.01);
 }else{ell([x-.080*face,hy+.078,z-.02],.157,.113,'#4b3735');lathe(x,hy+.125,z,.092,.18,.13,.89,'#664e45');ell([x-.027,hy+.125,z+.005],.215,.035,'#7d5140',-.007);line([x-.09,hy-.17,z+.13],[x+.07,waist+.10,z+.15],'#e0b886',.025)}
 const shoulder=[x+.12,hy-.24,z+.075],elbow=[mix(shoulder[0],hand[0],.55)+.065,mix(shoulder[1],hand[1],.57)-.10,mix(shoulder[2],hand[2],.55)];line(shoulder,elbow,col,.064);line(elbow,hand,tint(col,.91),.052);ell(hand,.057,.065,skin,-.015);const other=[x-.21,hy-.57,z+.03];line([x-.14,hy-.24,z-.01],other,tint(col,.82),.051);ell(other,.045,.057,skin);if(!port){line(other,[x-.22,hy-.70,z+.09],'#54413a',.018);trunk(x-.22,hy-.91,z+.08,.21,.24,.15,'#743d39')}}
 puppet(W.owner,'traveler',W.ownerHand);puppet(W.porter,'porter',W.porterHand);
 // One extruded glove silhouette, not a marker sphere. The palm turns onto the boards as it falls.
 const [gx,gy,gz]=W.glove,tilt=s(3,4.3,T)*(1-s(8.7,9.25,T)),ang=tilt*1.45,co=Math.cos(ang),si=Math.sin(ang);
 const mitten=[[-.064,.042],[-.068,-.012],[-.113,-.055],[-.125,-.076],[-.116,-.092],[-.102,-.091],[-.065,-.055],[-.052,-.119],[-.051,-.154],[-.041,-.163],[-.031,-.153],[-.026,-.107],[-.021,-.175],[-.011,-.184],[0,-.174],[.002,-.111],[.010,-.161],[.021,-.171],[.031,-.163],[.028,-.107],[.036,-.141],[.048,-.147],[.057,-.14],[.061,-.052],[.054,.042]];
 const gv=(u,v,d=0)=>[gx+u,gy+v*co+d*si,gz+.072-v*si+d*co];
 for(let i=0;i<mitten.length;i++){const a=mitten[i],b=mitten[(i+1)%mitten.length];poly([gv(...a,0),gv(...b,0),gv(...b,.02),gv(...a,.02)],'#9d342c',-.026)}
 poly(mitten.map(([u,v])=>gv(u,v,.02)),'#e85d45',-.072);poly([gv(-.07,.043,.02),gv(.06,.043,.02),gv(.064,.009,.02),gv(-.071,.009,.02)],'#a93529',-.085);
 for(const x of [-.026,0,.025])line(gv(x,-.067,.024),gv(x+.002,-.032,.024),'#efac78',.002);
 draw.sort((a,b)=>b.z-a.z);for(const e of draw)e.fn();
 const vign=c.createRadialGradient(w*.5,h*.52,h*.25,w*.5,h*.52,w*.65);vign.addColorStop(0,'#11202500');vign.addColorStop(1,'#0a12196b');c.fillStyle=vign;c.fillRect(0,0,w,h);
 const bar=h*.043;c.fillStyle='#101820';c.fillRect(0,0,w,bar);c.fillRect(0,h-bar,w,bar);if(options.frame!==false){c.fillStyle='#e3d0a880';c.font=Math.max(8,h*.027)+'px monospace';c.fillText('FINCH STREET  /  '+(witness?'WITNESS':'35 MM'),w*.021,h-bar-7)}
 return{project:P}}
 return{DURATION,cuts,world,shot,projection,render,floor,ownerHand,porterHand};
});
