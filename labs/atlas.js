/* Atlas • five portable canvas instruments. Angles are radians internally. */
(() => {
  'use strict';
  const A=window.ASTRA, T=Math.PI*2, D=Math.PI/180, clamp=(a,l=0,r=1)=>Math.max(l,Math.min(r,a)), mix=(a,b,t)=>a+(b-a)*t, mod=(a,n)=>((a%n)+n)%n;
  const param=(name,min,max,step,value)=>({name,min,max,step,value});
  const pointer=s=>s.pointer || {x:.5,y:.5,down:false};
  function rand(n){let x=n|0;return ()=>{x|=0;x=x+0x6d2b79f5|0;let z=Math.imul(x^(x>>>15),1|x);z^=z+Math.imul(z^(z>>>7),61|z);return ((z^(z>>>14))>>>0)/4294967296;};}
  const ink=(c,col,w,h)=>{c.fillStyle=col;c.fillRect(0,0,w,h)};
  const dot=(c,x,y,r,col)=>{c.beginPath();c.arc(x,y,r,0,T);c.fillStyle=col;c.fill()};
  function path(c,pts,fill,stroke,width=1,close=false){if(!pts.length)return;c.beginPath();c.moveTo(...pts[0]);for(let i=1;i<pts.length;i++)c.lineTo(...pts[i]);if(close)c.closePath();if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=width;c.stroke()}}
  const line=(c,a,b,col,n=1)=>path(c,[a,b],null,col,n);
  const poly=(c,pts,col)=>path(c,pts,col,null,1,true);
  function type(c,text,x,y,col,size=10,align='left'){c.fillStyle=col;c.font=size+'px ui-monospace, SFMono-Regular, Consolas, monospace';c.textBaseline='middle';c.textAlign=align;c.fillText(text,x,y)}
  const fs=(w,h)=>clamp(Math.min(w/53,h/30),8,12);
  function raysHull(pts){pts.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);const cr=(a,b,c)=>(b[0]-a[0])*(c[1]-a[1])-(b[1]-a[1])*(c[0]-a[0]);let a=[],b=[];for(const p of pts){while(a.length>1&&cr(a.at(-2),a.at(-1),p)<=0)a.pop();a.push(p)}for(let i=pts.length-1;i>=0;i--){let p=pts[i];while(b.length>1&&cr(b.at(-2),b.at(-1),p)<=0)b.pop();b.push(p)}return a.slice(0,-1).concat(b.slice(0,-1))}
  function buildings(seed){let rs=rand(seed^9203),z=[];for(let i=0;i<8;i++)for(let j=0;j<8;j++){
    let garden=rs()<.14||(i===3&&j===3),t=Math.exp(-((i-3.7)**2+(j-3.4)**2)/7);
    z.push({i,j,garden,dx:.55+rs()*.19,dy:.54+rs()*.22,h:(.2+rs()*.55+t*(.7+rs()*1.8)),roof:rs(),tree:rs(),skin:rs()});
  }return z.sort((a,b)=>a.i+a.j-b.i-b.j||a.i-b.i)}
  A.push({id:'long-shadow',title:'Long Shadow Borough',category:'Atlas',
    description:'Move the sun across a small axonometric borough and watch its towers borrow daylight from the streets.',
    method:'Ground-plane shadows are the convex hull of each footprint and its projection away from the sun. A painter’s pass then restores the visible façades.',
    gesture:'Drag across the city to steer the solar azimuth.',params:[param('Solar elevation',12,78,1,31),param('Tower height',45,145,1,95)],
    draw(c,w,h,t,p,s){const pt=pointer(s),u=Math.min(w/17.8,h/10.7),oy=h*.48-u*3.65,ox=w*.5,f=fs(w,h),Q=(a,b,z=0)=>[ox+(a-b)*u,oy+(a+b)*u*.49-z*u];if(!s.boro||s.boroSeed!==s.seed){s.boro=buildings(s.seed);s.boroSeed=s.seed;s.boroAngle=null}
      if(pt.down)s.boroAngle=pt.x*T;const angle=s.boroAngle??(1.3+.4*Math.sin(t*.09)),L=1/Math.tan(p[0]*D),m=p[1]/100;
      ink(c,'#eadbc3',w,h);
      // Survey-paper registration crosses.
      for(let y=18;y<h;y+=Math.max(26,u*1.4))for(let x=15;x<w;x+=Math.max(26,u*1.4)){line(c,[x-1.8,y],[x+1.8,y],'#cfbca4',.65);line(c,[x,y-1.8],[x,y+1.8],'#cfbca4',.65)}
      const estate=[Q(-.06,-.06),Q(8.06,-.06),Q(8.06,8.06),Q(-.06,8.06)];poly(c,estate,'#b4b0a0');c.save();path(c,estate,null,null,1,true);c.clip();
      for(const b of s.boro){const {i,j}=b;poly(c,[Q(i+.085,j+.085),Q(i+.915,j+.085),Q(i+.915,j+.915),Q(i+.085,j+.915)],b.garden?'#859785':'#dfd1b9')}
      for(let i=0;i<=8;i++){line(c,Q(i,0),Q(i,8),'#e6d9c1',.6);line(c,Q(0,i),Q(8,i),'#e6d9c1',.6)}
      c.fillStyle='rgba(42,56,58,.26)';c.beginPath();
      for(const b of s.boro){if(b.garden)continue;const x=b.i+.5,y=b.j+.5,H=b.h*m,dx=b.dx/2,dy=b.dy/2,shx=-Math.cos(angle)*H*L,shy=-Math.sin(angle)*H*L;
        const raw=[[x-dx,y-dy],[x+dx,y-dy],[x+dx,y+dy],[x-dx,y+dy]],pts=raysHull(raw.concat(raw.map(([xx,yy])=>[xx+shx,yy+shy])).map(([xx,yy])=>Q(xx,yy)));c.moveTo(...pts[0]);pts.slice(1).forEach(q=>c.lineTo(...q));c.closePath();
      }c.fill();for(let i=0;i<18;i++){let a=mod(t*(i%2?.14:-.18)+i*2.383,8),b=i%7+1,v=i%2?Q(a,b):Q(b,a);line(c,v,[v[0]+u*.11,v[1]+(i%2?1:-1)*u*.054],i%4===0?'#a84b36':'#f0e8cc',Math.max(1,u*.057))}c.restore();
      for(const b of s.boro){let {i,j}=b,x=i+.5,y=j+.5;
        if(b.garden){for(let a=0;a<4;a++){let tx=x+((a%2)-.5)*.39,ty=y+(((a/2)|0)-.5)*.39,[xx,yy]=Q(tx,ty);line(c,[xx,yy],[xx,yy-u*.22],'#575c4e',1);dot(c,xx,yy-u*.22,u*(.12+b.tree*.075),a%2?'#62765f':'#748568')}continue}
        let dx=b.dx/2,dy=b.dy/2,H=b.h*m,base=[[x-dx,y-dy],[x+dx,y-dy],[x+dx,y+dy],[x-dx,y+dy]],top=base.map(([a,b])=>Q(a,b,H)),bot=base.map(([a,b])=>Q(a,b));
        let red=b.skin>.79;
        poly(c,[top[3],top[2],bot[2],bot[3]],red?'#a75d45':'#b49173');poly(c,[top[2],top[1],bot[1],bot[2]],red?'#774d41':'#887563');poly(c,top,red?'#e4a77d':'#ebd8b6');
        let n=Math.floor(H*4.2);for(let k=1;k<=n;k++){let z=k*H/(n+1);line(c,Q(x-dx*.83,y+dy,z),Q(x+dx*.83,y+dy,z),red?'#884e41':'#9c7f68',Math.max(.65,u*.033));line(c,Q(x+dx,y-dy*.84,z),Q(x+dx,y+dy*.84,z),red?'#604539':'#706356',Math.max(.65,u*.035))}
        if(b.roof>.45){let z=H+.055;poly(c,[Q(x-dx*.45,y-dy*.38,z),Q(x+dx*.4,y-dy*.38,z),Q(x+dx*.4,y+dy*.4,z),Q(x-dx*.45,y+dy*.4,z)],'#c5ad91')}
      }type(c,'SUN  '+String(Math.round(p[0])).padStart(2,'0')+'° ALT',14,h-16,'#604735',f);type(c,'AZ  '+String(Math.round(mod(angle/D,360))).padStart(3,'0')+'°',w-14,h-16,'#604735',f,'right');
    }});

  // Schematic continental silhouettes for the illuminated dot plate (not navigational).
  const lands=[
    [[-169,66],[-158,71],[-136,69],[-124,70],[-110,75],[-95,72],[-83,78],[-67,72],[-78,65],[-65,61],[-56,53],[-65,43],[-72,41],[-80,31],[-80,25],[-84,30],[-91,29],[-97,26],[-97,20],[-91,18],[-87,21],[-86,16],[-81,9],[-78,8],[-83,8],[-89,14],[-102,17],[-107,23],[-115,29],[-112,32],[-118,34],[-124,42],[-124,49],[-132,54],[-140,59],[-151,60],[-161,55],[-166,55],[-159,60],[-168,60]],
    [[-81,12],[-72,11],[-61,10],[-50,1],[-44,-2],[-35,-5],[-39,-18],[-44,-23],[-51,-33],[-54,-35],[-61,-40],[-66,-49],[-67,-55],[-73,-52],[-75,-40],[-72,-31],[-71,-18],[-76,-14],[-81,-6],[-78,2]],
    [[-53,60],[-44,60],[-22,71],[-18,77],[-26,82],[-46,84],[-62,80],[-67,74],[-56,70]],
    [[-9,37],[-10,43],[-2,44],[-5,49],[2,51],[6,54],[10,55],[8,59],[5,61],[18,70],[28,71],[35,66],[45,68],[58,69],[69,73],[84,74],[98,77],[115,72],[130,72],[142,73],[153,69],[171,70],[179,65],[171,59],[160,61],[155,57],[158,52],[155,50],[150,59],[140,55],[138,50],[139,45],[132,42],[128,36],[126,36],[125,40],[121,40],[121,32],[116,24],[108,21],[105,18],[109,12],[106,9],[100,13],[101,4],[104,1],[102,1],[96,13],[93,20],[88,21],[81,16],[78,8],[75,12],[72,19],[66,25],[60,25],[56,27],[51,25],[56,23],[58,19],[52,16],[44,12],[40,17],[34,29],[30,31],[32,36],[26,36],[23,40],[24,35],[19,39],[15,45],[17,41],[16,38],[12,42],[8,44],[5,43],[0,40],[-1,36]],
    [[-17,15],[-16,24],[-10,30],[-6,35],[2,37],[10,37],[12,33],[19,31],[25,32],[32,31],[35,26],[39,18],[44,12],[51,12],[48,4],[42,-2],[40,-10],[36,-18],[35,-25],[29,-31],[21,-35],[16,-29],[12,-17],[11,-8],[8,-3],[9,4],[3,6],[-5,5],[-10,7],[-15,10]],
    [[113,-22],[114,-29],[116,-35],[125,-33],[130,-32],[135,-35],[138,-35],[141,-38],[148,-38],[153,-28],[151,-22],[147,-18],[143,-11],[141,-12],[140,-18],[136,-14],[136,-12],[131,-12],[128,-15],[124,-14],[121,-19],[116,-20]],
    [[-10,50],[-5,51],[-6,55],[-5,59],[-2,58],[1,52]],[[130,31],[134,32],[136,35],[139,35],[142,40],[140,41],[136,37]],[[44,-25],[47,-25],[50,-14],[48,-13],[45,-17]],[[166,-46],[169,-46],[174,-40],[178,-37],[177,-38],[172,-41]],[[95,5],[101,2],[105,-5],[103,-5]],[[109,-1],[113,-4],[118,2],[118,5],[113,4]],[[130,-3],[140,-8],[151,-10],[145,-5],[135,-2]]
  ];
  function inside(x,y,ring){let on=false;for(let i=0,j=ring.length-1;i<ring.length;j=i++){let a=ring[i],b=ring[j];if((a[1]>y)!=(b[1]>y)&&x<(b[0]-a[0])*(y-a[1])/(b[1]-a[1])+a[0])on=!on}return on}
  const vec=(lon,lat)=>[Math.cos(lat)*Math.cos(lon),Math.sin(lat),Math.cos(lat)*Math.sin(lon)];
  const dp=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2];
  let dots;
  function makeLand(){const d=[];for(let lat=-84;lat<84;lat+=2.1){let step=2.05/Math.cos(lat*D);for(let lon=-180;lon<180;lon+=step){if(lat< -73+3*Math.sin(lon*.06)||lands.some(a=>inside(lon,lat,a)))d.push(vec(lon*D,lat*D))}}return d}
  A.push({id:'great-circle',title:'The Short Way Round',category:'Atlas',
    description:'From Lisbon, chart two routes to the same point: a steady compass bearing and the shortest arc on a globe.',
    method:'The solid route interpolates on the unit sphere. The dashed route is straight in Mercator coordinates. Distances use a spherical Earth with a 6,371 km radius.',
    gesture:'Drag to turn the globe and inspect the far side.',params:[param('Destination °E',-170,170,1,119),param('Destination °N',-65,70,1,29)],
    draw(c,w,h,t,p,s){if(!dots)dots=makeLand();const pt=pointer(s),f=fs(w,h),r=Math.min(w*.38,h*.408),cx=w*.5,cy=h*.49,lo=-9.14*D,la=38.72*D,L=p[0]*D,B=p[1]*D,dl=mod(L-lo+Math.PI,T)-Math.PI,base=lo+dl*.5,avg=(la+B)*.5+.19;
      if(pt.down){if(s.gDrag){s.rot+= (pt.x-s.gDrag[0])*4.8;s.lat=clamp(s.lat+(pt.y-s.gDrag[1])*3,-1,1)}s.gDrag=[pt.x,pt.y]}else s.gDrag=null;s.rot=s.rot||0;s.lat=s.lat||0;
      const yaw=base+s.rot,tilt=clamp(avg+s.lat,-1.48,1.48),u=[-Math.sin(yaw),0,Math.cos(yaw)],v=[-Math.cos(yaw)*Math.sin(tilt),Math.cos(tilt),-Math.sin(yaw)*Math.sin(tilt)],n=vec(yaw,tilt);
      const q=a=>[cx+r*dp(a,u),cy-r*dp(a,v),dp(a,n)],a=vec(lo,la),b=vec(L,B),om=Math.acos(clamp(dp(a,b),-1,1)),psi=x=>Math.log(Math.tan(Math.PI/4+x/2)),dpz=psi(B)-psi(la),qq=Math.abs(dpz)>1e-8?(B-la)/dpz:Math.cos(la),rhDist=Math.hypot(B-la,qq*dl)*6371;
      function gc(f){if(om<1e-6)return a;let k=Math.sin(om),aa=Math.sin((1-f)*om)/k,bb=Math.sin(f*om)/k;return a.map((x,i)=>x*aa+b[i]*bb)}
      function drawArc(fn,steps,color,width){c.strokeStyle=color;c.lineWidth=width;c.beginPath();let last=false;for(let i=0;i<=steps;i++){const [x,y,z]=q(fn(i/steps));if(z>-.002){if(last)c.lineTo(x,y);else c.moveTo(x,y);last=true}else last=false}c.stroke()}
      ink(c,'#131f25',w,h);
      c.save();c.translate(cx,cy);for(let i=0;i<72;i++){let a=i*T/72;line(c,[Math.cos(a)*(r+5),Math.sin(a)*(r+5)],[Math.cos(a)*(r+(i%6?8:13)),Math.sin(a)*(r+(i%6?8:13))],i%6?'#43514f':'#788378',1)}c.restore();
      let g=c.createRadialGradient(cx-r*.45,cy-r*.44,r*.06,cx,cy,r);g.addColorStop(0,'#30484a');g.addColorStop(.84,'#243838');g.addColorStop(1,'#1c2c2d');dot(c,cx,cy,r,g);
      for(let i=-75;i<=75;i+=15)drawArc(k=>vec(k*T,i*D),170,'#52635b',.48);for(let i=-180;i<180;i+=15)drawArc(k=>vec(i*D,(k-.5)*Math.PI),85,'#52635b',.48);
      c.fillStyle='#b0b299';for(const d of dots){if(dp(d,n)>.005){let x=cx+r*dp(d,u),y=cy-r*dp(d,v),rr=Math.max(.78,r*.007);c.fillRect(x-rr*.5,y-rr*.5,rr,rr)}}
      c.save();c.setLineDash([3.5,3.5]);drawArc(k=>vec(lo+dl*k,2*Math.atan(Math.exp(mix(psi(la),psi(B),k)))-Math.PI/2),160,'#decbb0',1.35);c.restore();drawArc(gc,180,'#ff835a',Math.max(2,r*.018));
      [[a,'LIS'],[b,'B']].forEach(([d,name])=>{let [x,y,z]=q(d);if(z>0){dot(c,x,y,3.4,'#fff0d6');type(c,name,x+6,y-7,'#fff0d6',f)}});let [x,y,z]=q(gc(mod(t*.075,1)));if(z>0){dot(c,x,y,5,'#ff845b');dot(c,x,y,2,'#ffefd2')}
      type(c,'ARC  '+Math.round(om*6371).toLocaleString('en-US')+' km',14,h-15,'#ff9e75',f);type(c,'RHUMB  '+Math.round(rhDist).toLocaleString('en-US')+' km',w-14,h-15,'#decbb0',f,'right');
    }});
  A.push({id:'lee-wave',title:'On the Lee Side',category:'Atlas',
    description:'Follow air over a single ridge. Change the wind and a train of standing waves stretches or contracts downstream.',
    method:'In this idealized cross-section, the chosen wind speed U and buoyancy frequency N set the approximate wave spacing to 2πU/N. Clouds mark sufficiently lifted parcels, not a weather forecast.',
    gesture:'Drag vertically to change the lift needed for cloud to form.',params:[param('Wind · m/s',8,30,1,18),param('Buoyancy N · mrad/s',6,22,1,14)],
    draw(c,w,h,t,p,s){let pt=pointer(s),f=fs(w,h),rs=rand(s.seed^11391),L=T*p[0]/p[1],X=x=>x*w/45,Y=z=>h*(.82-z*.118),rough=rs()*.6;
      if(pt.down)s.moist=.1+.8*clamp(pt.y);let threshold=s.moist??.38;
      const ridge=x=>2.11*Math.exp(-((x-12)**2)/9)+.38*Math.exp(-((x-8)**2)/13)+.12+.065*Math.sin(x*.8+rough)+.036*Math.sin(x*2.4+rough);
      function wave(x,z){let xx=x-12;if(xx<0)return 0;return 1.07*(1-Math.exp(-xx/2.6))*Math.sin(T*xx/L-.25)*Math.exp(-xx/38)*Math.min(1,z/1.9)*Math.exp(-((z-3)**2)/14)}
      function lift(x,z){return ridge(x)*Math.exp(-z/2.25)+wave(x,z)}
      function S(x,z){return [X(x),Y(z+lift(x,z))]}
      let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,'#496f86');g.addColorStop(.65,'#93b4b7');g.addColorStop(1,'#dfd1ae');ink(c,g,w,h);
      for(let z=0;z<=6;z++){line(c,[0,Y(z)],[w,Y(z)],'rgba(237,234,207,.19)',.65)}
      // Moist layers: smooth lens-shaped patches confined to crests of the displaced streamlines.
      for(let layer=0;layer<4;layer++){let z0=2.42+layer*.64;
        let upper=[],lower=[];const flush=()=>{if(upper.length>2){let alpha=[.84,.63,.54,.39][layer];poly(c,upper.concat(lower.reverse()),'rgba(254,244,215,'+alpha+')')}upper=[];lower=[]};
        for(let k=0;k<=224;k++){let x=k*45/224,ww=wave(x,z0),v=ww-threshold*(1+layer*.04);if(v>0){let z=z0+lift(x,z0);upper.push([X(x),Y(z+.54*v)]);lower.push([X(x),Y(z-.15*v)])}else flush()}flush()
      }
      for(let j=0;j<21;j++){let z=.22+j*.26,pts=[];for(let k=0;k<=120;k++)pts.push(S(k*45/120,z));path(c,pts,null,j%4?'rgba(244,244,216,.32)':'rgba(249,244,215,.57)',j%4?.55:1.1)}
      c.lineCap='round';for(let i=0;i<103;i++){let z=.34+rs()*5.55,a=mod(rs()*45+t*(p[0]/17)*1.3,45),len=.15+rs()*.48,c0=rs()<.16?'#ffe2a1':'rgba(255,247,221,.80)';path(c,[S(a-len,z),S(a-len/2,z),S(a,z)],null,c0,Math.max(.75,w*.0021))}c.lineCap='butt';
      let terrain=[];for(let k=0;k<=190;k++){let x=k*45/190;terrain.push([X(x),Y(ridge(x))])}poly(c,terrain.concat([[w,h],[0,h]]),'#4e6761');
      c.save();path(c,terrain.concat([[w,h],[0,h]]),null,null,1,true);c.clip();
      for(let j=0;j<12;j++){let pts=[];for(let i=0;i<=112;i++){let x=i*45/112;pts.push([X(x),Y(ridge(x)*Math.exp(-j*.1)-j*.17+.075*Math.sin(x*.46+j*.5))])}path(c,pts,null,j%3?'#617870':'#8e9d83',.75)}c.restore();
      type(c,'→  '+p[0]+' m/s',14,17,'#f3eacb',f);type(c,'λ  '+L.toFixed(1)+' km',w-14,17,'#f3eacb',f,'right');type(c,'WINDWARD',14,h-14,'#f1e4be',f);type(c,'LEE',w-14,h-14,'#f1e4be',f,'right')
    }});

  // Fraction of each limb-darkened annulus hidden by an opaque planet.
  function occult(z,r){let block=0,total=0;for(let i=0;i<64;i++){let d=(i+.5)/64,flux=d*(.38+.62*Math.sqrt(1-d*d));total+=flux;if(z<1e-9){if(d<r)block+=flux;continue}let v=(d*d+z*z-r*r)/(2*d*z);if(v<=-1)block+=flux;else if(v<1)block+=flux*Math.acos(v)/Math.PI}return block/total}
  function starSheet(seed){let R=rand(seed^434636),tex=[],sky=[],loop=[];for(let i=0;i<580;i++){let a=R()*T,r=Math.sqrt(R());tex.push([Math.cos(a)*r,Math.sin(a)*r,.002+R()*.011,R()*.15])}for(let i=0;i<117;i++)sky.push([R(),R(),R(),R()]);for(let i=0;i<55;i++)loop.push([R()*T,.012+R()*.12,.021+R()*.16]);return {tex,sky,loop}}
  A.push({id:'transit-negative',title:'Transit Negative',category:'Atlas',
    description:'A black planetary silhouette crosses a star. Its passage leaves the tiny, measurable dip plotted below.',
    method:'The model integrates a linear limb-darkening law across 64 stellar annuli. At each sample it computes the arc of each annulus blocked by the planet.',
    gesture:'Drag horizontally to scrub the transit and its light curve.',params:[param('Planet radius · % star',4,28,1,16),param('Impact · % radius',0,116,1,37)],
    draw(c,w,h,t,p,s){let pt=pointer(s),f=fs(w,h),r=Math.min(h*.274,w*.228),cx=w*.50,cy=h*.355,rr=p[0]/100,B=p[1]/100;
      if(!s.stars||s.starSeed!==s.seed){s.stars=starSheet(s.seed);s.starSeed=s.seed}s.phaseOffset=s.phaseOffset??.49;if(pt.down)s.phaseOffset=clamp(pt.x)-t*.049;let phase=mod(t*.049+s.phaseOffset,1),xx=mix(-1.52,1.52,phase),z=Math.hypot(xx,B),loss=occult(z,rr);
      ink(c,'#15171e',w,h);for(let [x,y,sz,al] of s.stars.sky){dot(c,w*x,h*y,.22+sz*1.05,'rgba(243,228,201,'+(.18+al*.56)+')')}
      let halo=c.createRadialGradient(cx,cy,r*.91,cx,cy,r*1.49);halo.addColorStop(0,'rgba(254,133,52,.42)');halo.addColorStop(.43,'rgba(236,100,37,.15)');halo.addColorStop(1,'rgba(237,91,31,0)');dot(c,cx,cy,r*1.49,halo);
      c.save();c.translate(cx,cy);
      for(let [ang,extent,bend] of s.stars.loop){let a=ang+t*.005;let a2=a+bend;let x0=r*.99*Math.cos(a),y0=r*.99*Math.sin(a),x1=r*.99*Math.cos(a2),y1=r*.99*Math.sin(a2),a3=a+bend*.3;c.beginPath();c.moveTo(x0,y0);c.quadraticCurveTo(r*(1+extent*2)*Math.cos(a3),r*(1+extent*2)*Math.sin(a3),x1,y1);c.strokeStyle='rgba(245,141,57,.45)';c.lineWidth=Math.max(.6,r*.007);c.stroke()}
      let sun=c.createRadialGradient(0,0,0,0,0,r);sun.addColorStop(0,'#ffe2a0');sun.addColorStop(.59,'#ffcf78');sun.addColorStop(.91,'#f9a84f');sun.addColorStop(1,'#bd5d34');dot(c,0,0,r,sun);
      c.save();c.beginPath();c.arc(0,0,r,0,T);c.clip();for(let [x,y,sz,al] of s.stars.tex){dot(c,x*r,y*r,sz*r,'rgba(142,60,31,'+(.05+al)+')')}c.restore();
      dot(c,xx*r,-B*r,r*rr,'#191d21');c.restore();
      let l=w*.075,gt=h*.722,gb=h*.90,gw=w*.85,dy=Math.max(.045,rr*rr*1.44);for(let j=0;j<3;j++){let y=mix(gt,gb,j*.5);line(c,[l,y],[l+gw,y],'#4c4544',.75)}const key=rr+':'+B;if(s.transitKey!==key){s.transitKey=key;s.curve=Array.from({length:161},(_,i)=>occult(Math.hypot(mix(-1.52,1.52,i/160),B),rr))}let pts=s.curve.map((y,i)=>[l+gw*i/160,gt+(gb-gt)*y/dy]);poly(c,pts.concat([[l+gw,gb],[l,gb]]),'rgba(221,141,66,.07)');path(c,pts,null,'#ffbf78',Math.max(1.6,h*.005));let px=l+phase*gw,py=gt+loss/dy*(gb-gt);line(c,[px,gt-4],[px,gb+3],'#9c8775',1);dot(c,px,py,3,'#fff3c7');
      type(c,'RELATIVE FLUX',l,gt-f*1.35,'#c4b8ac',f);type(c,((1-loss)*100).toFixed(2)+'%',w-l,gt-f*1.35,'#ffcc89',f,'right');type(c,'INGRESS',l,h*.954,'#a49e99',f);type(c,'EGRESS',l+gw,h*.954,'#a49e99',f,'right')
    }});

  // Transfer-aware arrival times: each graph state is a station / service pair.
  function metro(seed){let rs=rand(seed^3906),nodes=[],routes=[[0,1,2,3,4,5,6],[7,8,9,10,11,12,13],[14,15,16,17,18,19,20],[21,22,23,24,25,26,27],[1,8,15,22],[4,11,18,25],[0,7,15,23,24],[5,12,19,27],[2,9,17,25],[6,13,20,26]];
    for(let row=0;row<4;row++)for(let col=0;col<7;col++){let x=.07+.143*col+(rs()-.5)*.043, y=.18+row*.21+.045*Math.sin(col*.96+row*.41)+(rs()-.5)*.063;nodes.push({x,y,edges:[]})}
    routes.forEach((r,rt)=>{for(let i=1;i<r.length;i++){let a=r[i-1],b=r[i],na=nodes[a],nb=nodes[b],cost=Math.max(2,Math.round(28*Math.hypot(na.x-nb.x,(na.y-nb.y)*.64)));na.edges.push({n:b,rt,cost});nb.edges.push({n:a,rt,cost})}});return {nodes,routes}
  }
  function times(nodes,start,fee){let q=[[0,start,-1]],best=Array.from(nodes,()=>Object.create(null)),out=nodes.map(()=>Infinity);best[start][-1]=0;while(q.length){q.sort((a,b)=>b[0]-a[0]);let [val,id,rt]=q.pop();if(val!==best[id][rt])continue;out[id]=Math.min(out[id],val);nodes[id].edges.forEach(e=>{let d=val+e.cost+(rt<0||rt===e.rt?0:fee);if(d<(best[e.n][e.rt]??Infinity)){best[e.n][e.rt]=d;q.push([d,e.n,e.rt])}})}return out}
  A.push({id:'last-train',title:'The Last Connection',category:'Atlas',
    description:'Choose a departure station and a time budget. A transfer penalty redraws the part of this paper city you can reach.',
    method:'A shortest-path search tracks both station and current line, so changing trains costs time while riding through a transfer station does not. Coloured track is reachable within budget.',
    gesture:'Tap any station to make it the departure point.',params:[param('Time budget · min',4,38,1,14),param('Transfer · min',0,10,1,4)],
    draw(c,w,h,t,p,s){const f=fs(w,h),pt=pointer(s),u=Math.min(w,h);if(!s.network||s.netSeed!==s.seed){s.network=metro(s.seed);s.netSeed=s.seed;s.start=9;s.ttKey=''}const {nodes,routes}=s.network;if(pt.down){let nearest=0,dist=1e30;nodes.forEach((d,i)=>{let k=((d.x-pt.x)*w)**2+((d.y-pt.y)*h)**2;if(k<dist){dist=k;nearest=i}});s.start=nearest}
      let key=s.start+'-'+p[1];if(s.ttKey!==key){s.tt=times(nodes,s.start,p[1]);s.ttKey=key}let arr=s.tt,budget=p[0],col=['#bc4f3f','#256b7d','#b47926','#53745a','#9c516c','#697ba1','#b96f48','#5b8c8a','#8c687c','#677e52'];ink(c,'#f0e8d8',w,h);
      // Block outlines and service alleys under the rail map, like an archival routing sheet.
      c.save();c.translate(w*.5,h*.5);c.rotate(-.15);for(let j=-10;j<=10;j++)for(let i=-13;i<=13;i++){let ww=Math.max(16,w*.059),hh=Math.max(13,h*.062),cx=i*ww+((j%3)===1?ww*.16:0),cy=j*hh;c.fillStyle=(i*7+j*11)%8===0?'#dedfcb':'#e5ddcf';c.fillRect(cx,cy,ww-2.4,hh-2.2)}c.restore();
      function pos(i){return [nodes[i].x*w,nodes[i].y*h]}const wt=clamp(u*.0105,2.1,5.7);
      c.lineJoin=c.lineCap='round';routes.forEach((r,i)=>{path(c,r.map(pos),null,'#f8f1df',wt*1.8);path(c,r.map(pos),null,'#c3bcae',wt)});
      // Highlight traversable line segments, including partial journeys before the budget expires.
      let states=Array.from(nodes,()=>Object.create(null)),q=[[0,s.start,-1]];states[s.start][-1]=0;
      while(q.length){let [v,id,rt]=q.pop();if(states[id][rt]!==v)continue;for(let e of nodes[id].edges){let d=v+e.cost+(rt===-1||rt===e.rt?0:p[1]);if(d<=(states[e.n][e.rt]??Infinity)-1&&d<=budget){states[e.n][e.rt]=d;q.push([d,e.n,e.rt])}}}
      function depart(id,rt){let v=Infinity;for(let [a,b] of Object.entries(states[id]))v=Math.min(v,b+(+a===-1||+a===rt?0:p[1]));return v}
      routes.forEach((r,rt)=>{for(let j=1;j<r.length;j++){let aa=r[j-1],bb=r[j],v=pos(aa),z=pos(bb),cost=nodes[aa].edges.find(e=>e.n===bb&&e.rt===rt).cost;let a=clamp((budget-depart(aa,rt))/cost),b=clamp((budget-depart(bb,rt))/cost),P=k=>[mix(v[0],z[0],k),mix(v[1],z[1],k)];if(a+b>=1)line(c,v,z,col[rt],wt);else{if(a>0)line(c,v,P(a),col[rt],wt);if(b>0)line(c,z,P(1-b),col[rt],wt)}}});
      let rad=clamp(u*.0125,2.8,6.7);nodes.forEach((n,i)=>{const [x,y]=pos(i),active=arr[i]<=budget,transfer=new Set(n.edges.map(e=>e.rt)).size>1;dot(c,x,y,rad*(transfer?1.1:.76),active?'#373f3d':'#99978a');dot(c,x,y,rad*(transfer?.68:.38),active?'#fff3d7':'#e4dfd0')});c.lineCap='butt';
      const [xx,yy]=pos(s.start);let phase=mod(t*.63,1);c.beginPath();c.arc(xx,yy,rad*(1.5+1.6*phase),0,T);c.strokeStyle='rgba(56,64,61,'+(.5*(1-phase))+')';c.lineWidth=1;c.stroke();dot(c,xx,yy,rad*1.37,'#283f3f');dot(c,xx,yy,rad*.55,'#fff0cc');
      type(c,'FROM  '+String.fromCharCode(65+(s.start/7|0))+(s.start%7+1),14,h-15,'#383f3c',f);type(c,arr.filter(v=>v<=budget).length+' / 28 STATIONS',w-14,h-15,'#383f3c',f,'right')
    }});
})();
