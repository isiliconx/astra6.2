/* The five instruments of the Signals cabinet. Vanilla Canvas 2D. */
(() => {
  'use strict';
  const TAU = 2 * Math.PI, sin = Math.sin, cos = Math.cos;
  const clamp = (v,a,b) => Math.max(a,Math.min(b,v));
  const add = x => window.ASTRA.push(Object.assign({category:'Signals'},x));
  const knob = (name,min,max,step,value) => ({name,min,max,step,value});
  const point = s => [clamp(Number.isFinite(s.pointer?.x)?s.pointer.x:.5,0,1),clamp(Number.isFinite(s.pointer?.y)?s.pointer.y:.5,0,1)];
  const phase = s => ((s.seed>>>0)%7919)/7919*TAU;
  function base(c,w,h,bg,W=900,H=510){
    c.save(); c.globalAlpha=1; c.globalCompositeOperation='source-over'; c.fillStyle=bg;c.fillRect(0,0,w,h);
    const k=Math.max(.0001,Math.min(w/W,h/H)); c.translate(w/2,h/2);c.scale(k,k);c.translate(-W/2,-H/2);
    return {left:(W-w/k)/2,right:(W+w/k)/2,top:(H-h/k)/2,bottom:(H+h/k)/2};
  }
  function stroke(c,col,width){c.strokeStyle=col;c.lineWidth=width;c.stroke();}
  function segment(c,x,y,xx,yy,col,width){c.beginPath();c.moveTo(x,y);c.lineTo(xx,yy);stroke(c,col,width);}
  function disc(c,x,y,r,col){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=col;c.fill();}
  function type(c,txt,x,y,col,sz=11,align='left'){c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.font=`${sz}px ui-monospace, SFMono-Regular, Consolas, monospace`;c.fillText(txt,x,y);}
  function polygon(c,pts){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();}

  const vowels = [[.13,.74,.90],[.19,.56,.88],[.40,.54,.84],[.29,.38,.82],[.15,.27,.73]];
  // A voiced excitation samples three resonant spectral bands at harmonic intervals.
  add({id:'formant-atlas',title:'Formant Atlas',description:'Five silent vowels become a mountain range. The changing height of each ridge follows the strength of a resonant frequency.',method:'An analytic harmonic comb passes through three Gaussian formant bands. Each outlined slice is an older spectrum, drawn behind the next one.',gesture:'Move across the field to morph between vowels; move up or down to stretch the spectral peaks.',params:[knob('Fundamental',5,17,1,9),knob('Resonance',0.5,2.5,.05,1.35)],
    draw(c,w,h,t,p,s){
      base(c,w,h,'#101b20');const [px,py]=point(s),z=phase(s),nr=41,n=160;
      const bg=c.createLinearGradient(0,50,0,489);bg.addColorStop(0,'#14272c');bg.addColorStop(1,'#101b20');c.fillStyle=bg;c.fillRect(56,40,788,420);
      for(let j=0;j<=8;j++){let u=j/8;segment(c,115+646*u,169,62+755*u,414,'#284045',.8);}
      const mV=.55+px*2.9,amp=89+py*32;
      const verts=s.formantVerts&&s.formantVerts.length===n+1?s.formantVerts:(s.formantVerts=new Float32Array(n+1));
      for(let r=0;r<nr;r++){
        let v=r/(nr-1),tt=t*.50+(1-v)*2.4+z, vv=clamp(mV+.48*sin(tt*.65)+.27*sin(tt*1.37),0,3.99),i=vv|0,j=(i+1)%5,vf=vv-i, f=[];
        for(let k=0;k<3;k++) f.push(vowels[i][k]*(1-vf)+vowels[j][k]*vf);
        const left=128-69*v,width=629+137*v,baseline=178+235*v, pitch=.017+p[0]*.0023;
        for(let k=0;k<=n;k++){
          let u=k/n, e=0;
          for(let b=0;b<3;b++){const d=(u-f[b])/(.046+.013*b); e+=(1-.17*b)*Math.exp(-.5*d*d*p[1]);}
          let comb=.45+.55*Math.pow(.5+.5*cos(TAU*u/pitch+.22*sin(tt)),2), contour=Math.pow(Math.max(0,sin(Math.PI*u)),.65);
          verts[k]=baseline-amp*e*comb*contour*(.86+.14*sin(tt*2+u*9));
        }
        c.beginPath();c.moveTo(left,baseline);for(let k=0;k<=n;k++){c.lineTo(left+width*k/n,verts[k]);}c.lineTo(left+width,baseline+.3);c.closePath();
        c.fillStyle=`rgb(${Math.round(23+11*v)} ${Math.round(43+12*v)} ${Math.round(49+11*v)})`;c.fill();
        c.beginPath();for(let k=0;k<=n;k++){const x=left+width*k/n;k?c.lineTo(x,verts[k]):c.moveTo(x,verts[k]);}
        let highlight=r===32||r===14;stroke(c,highlight?'#ffb581':`rgb(${Math.round(74+90*v)} ${Math.round(124+81*v)} ${Math.round(126+72*v)})`,highlight?2:1.08);
      }
      segment(c,59,423,824,423,'#527474',.75);for(let k=0;k<=5;k++){let x=59+153*k;segment(c,x,424,x,429,'#8faaa7',.9);type(c,(k*.7).toFixed(1),x,441,'#a8c4bf',10,'center');}
      type(c,'RELATIVE FREQUENCY  /  kHz',442,465,'#7ca5a4',9,'center');c.restore();
    }});

  // International Telegraph Alphabet No. 2 (letters state).
  const ita={A:3,B:25,C:14,D:9,E:1,F:13,G:26,H:20,I:6,J:11,K:15,L:18,M:28,N:12,O:24,P:22,Q:23,R:10,S:5,T:16,U:7,V:30,W:19,X:29,Y:21,Z:17,' ':4};
  const messages=['LIGHT ARRIVES IN PACKETS ','A SIGNAL FROM THE SEA ','THE TIDE REMEMBERS ','SEND SUN AFTER RAIN '];
  add({id:'relay-ribbon',title:'Relay Ribbon',description:'A loop of punched paper carries a plain-text transmission. Each column holds a five-bit letter in the old teleprinter alphabet.',method:'Letters are encoded in ITA2, with a smaller sprocket hole between the second and third data tracks. A projected paper strip curls around the reader.',gesture:'Move left or right to place the read head. Move vertically to bow the ribbon.',params:[knob('Transport',0,2,.05,.65),knob('Curl',0,1,.02,.68)],
    draw(c,w,h,t,p,s){
      const frame=base(c,w,h,'#194442'),[px,py]=point(s),z=phase(s),mes=messages[(s.seed>>>0)%4];
      const left=-50,right=950,head=105+690*px,scroll=t*p[0]*19+z*21, pitch=25,amp=(16+26*p[1])*(.78+py*.45), golden=['#ffca76','#f3c58c','#f6deb3'];
      for(let i=0;i<3;i++){
        const offs=i===1?-scroll*.9:scroll*(i===2?.75:1),b=112+i*142;
        const y=x=>b+amp*sin(x/165+i*2.3+offs*.0036+z*.18)+11*cos(x/108+offs*.002+i);
        const d=x=>97*(.77+.20*cos(x/193+i*1.5+offs*.004));
        function strip(xa,xb,offset=0){c.beginPath();for(let x=xa;x<xb;x+=7){let q=y(x)-d(x)/2+offset;x===xa?c.moveTo(x,q):c.lineTo(x,q);}c.lineTo(xb,y(xb)-d(xb)/2+offset);for(let x=xb;x>xa;x-=7)c.lineTo(x,y(x)+d(x)/2+offset);c.lineTo(xa,y(xa)+d(xa)/2+offset);c.closePath();}
        strip(left,right,6);c.fillStyle='#103434';c.fill();
        strip(left,right);const g=c.createLinearGradient(0,0,860,0);
        for(let a=0;a<=12;a++){let lit=(.5+.5*cos(a/12*860/180+i*1.7+offs*.004)),low=[176,127,75],high=i===1?[251,223,183]:[255,203,120];g.addColorStop(a/12,`rgb(${low.map((v,k)=>Math.round(v+(high[k]-v)*lit)).join(' ')})`);}c.fillStyle=g;c.fill();
        c.beginPath();for(let x=left;x<=right;x+=5){let yy=y(x)-d(x)/2; x===left?c.moveTo(x,yy):c.lineTo(x,yy);}stroke(c,golden[i],1.4);
        const offset=offs+i*101, start=Math.floor((left+offset)/pitch)-1, end=Math.ceil((right+offset)/pitch)+1;
        c.save();strip(left,right);c.clip();c.beginPath();
        for(let k=start;k<=end;k++){
          let x=k*pitch-offset, idx=((k%mes.length)+mes.length)%mes.length,bits=ita[mes[idx]],Y=y(x),D=d(x);
          for(let a=0;a<6;a++){
            if(a!==2 && !(bits&(1<<(a<2?a:a-1))))continue;
            let f=[-.35,-.21,-.075,.065,.205,.345][a],r=a===2?2.15:4.35,cy=Y+D*f;
            c.moveTo(x+r,cy);c.ellipse(x,cy,r,r*(D/91),0,0,TAU);
          }
        }
        c.fillStyle='#214341';c.fill();c.restore();
        if(i===1){
          let ix=Math.round((head+offset)/pitch),x=ix*pitch-offset,idx=((ix%mes.length)+mes.length)%mes.length,chr=mes[idx],Y=y(x),D=d(x);
          c.strokeStyle='#a6402b';c.lineWidth=1.8;c.strokeRect(x-8,Y-D*.45,16,D*.90);
          segment(c,x,Y+D/2+1,x,Y+D/2+12,'#ffd8a2',1);c.fillStyle='#f3d8b3';c.fillRect(x-10,Y+D/2+11,20,18);type(c,chr===' '?'␣':chr,x,Y+D/2+20,'#522a22',13,'center');
        }
      }
      // Frame the tape at its physical width rather than drawing abrupt ends on ultrawide displays.
      if(frame.left<left){c.fillStyle='#194442';c.fillRect(frame.left,frame.top,left-frame.left,frame.bottom-frame.top);c.fillRect(right,frame.top,frame.right-right,frame.bottom-frame.top);}
      c.restore();
    }});

  const cross=(a,b)=>a[0]*b[1]-a[1]*b[0];
  function traverse(origin,ray,poly,index){
    const route=[origin];let start=origin,inside=false,skip=-1;
    for(let n=0;n<5;n++){
      let hit=-1,lowest=1e9;
      for(let i=0;i<3;i++){
        if(i===skip)continue;let a=poly[i],b=poly[(i+1)%3],e=[b[0]-a[0],b[1]-a[1]],q=[a[0]-start[0],a[1]-start[1]],den=cross(ray,e);
        if(Math.abs(den)<1e-6)continue;let dist=cross(q,e)/den, u=cross(q,ray)/den;
        if(dist>.001 && u>=0&&u<=1&&dist<lowest){lowest=dist;hit=i;}
      }
      if(hit<0){route.push([start[0]+ray[0]*1800,start[1]+ray[1]*1800]);break;}
      const h0=[start[0]+ray[0]*lowest,start[1]+ray[1]*lowest];route.push(h0);start=h0;skip=hit;
      let a=poly[hit],b=poly[(hit+1)%3],nx=b[1]-a[1],ny=a[0]-b[0],l=Math.hypot(nx,ny);nx/=l;ny/=l;
      if(ray[0]*nx+ray[1]*ny>0){nx=-nx;ny=-ny;}
      const cs=-(ray[0]*nx+ray[1]*ny), eta=inside?index:1/index, k=1-eta*eta*(1-cs*cs);
      if(k<0){ray=[ray[0]+2*cs*nx,ray[1]+2*cs*ny];}else{let q=eta*cs-Math.sqrt(k);ray=[eta*ray[0]+q*nx,eta*ray[1]+q*ny];inside=!inside;}
    }
    return route;
  }
  add({id:'crown-glass',title:'Crown Glass',description:'An incident beam splits inside a triangular block. Gently change the angle and the dispersed rays fold back into the glass.',method:'Each wavelength follows a two-dimensional Snell-law trace with wavelength-dependent refractive index. Rays reflect internally beyond the critical angle.',gesture:'Move sideways to change incidence. Move vertically to raise or lower the beam.',params:[knob('Dispersion',0.02,.18,.01,.11),knob('Apex',48,72,1,57)],
    draw(c,w,h,t,p,s){
      const bounds=base(c,w,h,'#0d1121'),[px,py]=point(s),z=phase(s),mid=465,top=73,bt=394,span=(bt-top)*Math.tan(p[1]*Math.PI/360);
      const tri=[[mid,top],[mid+span,bt],[mid-span,bt]],angle=-.24+(px-.5)*.28+.028*sin(t*.33+z),dir=[cos(angle),sin(angle)],by=262+(py-.5)*127,ox=Math.min(-100,bounds.left-20),oy=by+Math.tan(angle)*(ox-mid);
      const grd=c.createRadialGradient(mid,248,20,mid,248,455);grd.addColorStop(0,'#1f2545');grd.addColorStop(.72,'#12182a');grd.addColorStop(1,'#0d1121');c.fillStyle=grd;c.fillRect(bounds.left,bounds.top,bounds.right-bounds.left,bounds.bottom-bounds.top);
      // Sparse optical-bench registration marks.
      for(let i=0;i<=20;i++){const x=70+i*38;segment(c,x,441,x,441+(i%5===0?10:4),'#485069',.75);}segment(c,70,441,830,441,'#3f465d',.7);
      let glass=c.createLinearGradient(mid-span,bt,mid+span,130);glass.addColorStop(0,'rgba(64,88,132,.58)');glass.addColorStop(.44,'rgba(47,60,103,.66)');glass.addColorStop(.69,'rgba(74,80,130,.45)');glass.addColorStop(1,'rgba(46,61,104,.69)');polygon(c,tri);c.fillStyle=glass;c.fill();
      c.save();c.globalCompositeOperation='screen';const m=41;
      for(let j=0;j<m;j++){
        const f=j/(m-1),idx=1.452+p[0]*(1-f)*(1-f),lo=traverse([ox,oy-3.1],dir,tri,idx),hi=traverse([ox,oy+3.1],dir,tri,idx),hue=272-272*f;
        if(lo.length!==hi.length)continue;const ribbon=[...lo,...hi.reverse()];polygon(c,ribbon);c.fillStyle=`hsla(${hue},95%,58%,.245)`;c.fill();
        if(j%5===0){let poly=traverse([ox,oy],dir,tri,idx);c.beginPath();poly.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));stroke(c,`hsla(${hue},100%,72%,.60)`,.8);}
      }
      c.restore();const ent=traverse([ox,oy],dir,tri,1.49)[1];segment(c,ox,oy,ent[0],ent[1],'#e2e9f4',1.5);
      polygon(c,tri);stroke(c,'#9daec9',1.4);const inset=tri.map(([x,y])=>[mid+(x-mid)*.959,287+(y-287)*.959]);polygon(c,inset);stroke(c,'rgba(190,201,240,.28)',.8);
      for(const [x,y] of tri){disc(c,x,y,2.4,'#c7d3ea');}type(c,'01  /  INCIDENT',70,466,'#a8b1c3',10);type(c,`${p[1]}°  /  APEX`,830,466,'#a8b1c3',10,'right');c.restore();
    }});

  add({id:'jacquard-moon',title:'Jacquard Moon',description:'A small hanging textile draws its pattern one crossing at a time. The colored figure and the ground are the very same threads, woven on opposite faces.',method:'A geometric mask reverses the dominant thread in a twill draft. Warp and weft strokes are projected onto a rippling fabric surface.',gesture:'Slide horizontally to roll the motif through the weave; move vertically to shift its center.',params:[knob('Repeats',2,6,1,3),knob('Twill span',2,8,1,4)],
    draw(c,w,h,t,p,s){
      base(c,w,h,'#e1d7ba');const [px,py]=point(s),z=phase(s),cols=114, rows=62,ox=87,oy=63,W=726,H=356,ang=t*.42+z;
      const xAt=(u,v)=>ox+W*u+8*sin(v*4.3+ang*.6)+9*v-7;
      const yAt=(u,v)=>oy+v*H+(12+6*v)*sin(TAU*u+ang)+7*cos(u*13-ang*.77)+7*u;
      const warp=['#cc8b32','#e5ab47','#e7b95e','#b5742c'],weft=['#253f4e','#314b54','#bd4f36','#d4653d','#b9563c'];
      let X=new Float32Array((cols+1)*(rows+1)),Y=new Float32Array(X.length),dx=cols+1;
      for(let i=0;i<=cols;i++)for(let j=0;j<=rows;j++){let u=i/cols,v=j/rows,ind=j*dx+i;X[ind]=xAt(u,v);Y[ind]=yAt(u,v);}
      const sl=(m,gap)=>{let a=[];for(let i=0;i<=cols;i++)a.push([X[i]+m,Y[i]+gap]);for(let i=cols;i>=0;i--){let k=rows*dx+i;a.push([X[k]+m,Y[k]+gap]);}return a;};
      polygon(c,sl(4,9));c.fillStyle='#c5b89b';c.fill();
      // Individual fringe ends remain visible beyond the woven bottom edge.
      for(let i=0;i<cols;i++){let u=(i+.5)/cols,k=rows*dx+i,x=X[k]+3,y=Y[k],ln=17+4*sin(i*.71+z)+3*cos(i*5.3);segment(c,x,y,x+2*sin(i*1.5+ang),y+ln,i%3?'#c99243':'#efd598',2.05);}
      polygon(c,sl(0,0));c.fillStyle='#b7813e';c.fill();
      for(let j=0;j<rows;j++){
        let v=(j+.5)/rows,red=(j>23&&j<40)||(j>49&&j<54),colour=red?weft[2+j%3]:weft[j%2];c.beginPath();
        for(let i=0;i<=cols;i++){let k=j*dx+i,xx=(X[k]+X[k+dx])*.5,yy=(Y[k]+Y[k+dx])*.5;i?c.lineTo(xx,yy):c.moveTo(xx,yy);}stroke(c,colour,H/rows*.93);
      }
      const rep=Math.round(p[0]),period=Math.round(p[1]),groups=[[],[],[],[]];
      for(let i=0;i<cols;i++){
        let u=(i+.5)/cols,cell=u*rep+(px-.5)*.74,unit=cell-Math.floor(cell),column=Math.floor(cell), tone=(i%11===0?3:i%3),dest=groups[tone];
        for(let j=0;j<rows;j++){
          let v=(j+.5)/rows,du=unit-.5,dv=(v-.5-(py-.5)*.36)*1.50,rr=Math.hypot(du,dv),quadrant=(du*dv>=0)?1:0;
          let mask=rr<.49&&((Math.floor(rr*8.2+quadrant+(column%2===0?0:1))&1)===0);
          if(v<.052||v>.948)mask=!(j%3===0);let twill=((i+j)%period===0);
          if(mask===twill)continue;let k=j*dx+i,xx=(X[k]+X[k+1])*.5,yy=(Y[k]+Y[k+1])*.5,xx2=(X[k+dx]+X[k+dx+1])*.5,yy2=(Y[k+dx]+Y[k+dx+1])*.5;dest.push(xx,yy-.1,xx2,yy2+.1);
        }
      }
      for(let a=0;a<4;a++){c.beginPath();let arr=groups[a];for(let i=0;i<arr.length;i+=4){c.moveTo(arr[i],arr[i+1]);c.lineTo(arr[i+2],arr[i+3]);}stroke(c,warp[a],W/cols*.84);}
      // The same light falls continuously across both yarn directions.
      c.save();polygon(c,sl(0,0));c.clip();const light=c.createLinearGradient(ox,0,ox+W,0);
      for(let k=0;k<=16;k++){let pos=k/16,val=cos(TAU*pos+ang)*.65+cos(pos*13-ang*.77)*.35;light.addColorStop(pos,val<0?`rgba(27,30,35,${-val*.15})`:`rgba(255,234,189,${val*.14})`);}c.fillStyle=light;c.fillRect(60,20,795,448);c.restore();c.restore();
    }});

  add({id:'rose-engine',title:'Rose Engine',description:'Two offset oscillations cut a rosette from loops of colored ink. The smallest shift in phase can open a whole row of petals.',method:'A lobed radial carrier and a counter-winding circular oscillator are summed in polar coordinates. The second family of curves is phase-shifted like a second engraved plate.',gesture:'Move sideways to alter the phase between plates. Move vertically to open the center.',params:[knob('Lobes',3,16,1,8),knob('Excursion',8,55,1,31)],
    draw(c,w,h,t,p,s){
      base(c,w,h,'#f3e7d2');let [px,py]=point(s),z=phase(s),cx=450,cy=248,n=Math.round(p[0]),delta=(px-.5)*3.5+.18*sin(t*.32+z),baseR=123+py*23,amp=p[1],samples=Math.max(440,n*58);
      // The registration marks belong to the stationery, not to the moving plates.
      for(let q=0;q<4;q++){let x=q%2?789:111,y=q<2?84:415;segment(c,x-7,y,x+7,y,'#ad9a80',.7);segment(c,x,y-7,x,y+7,'#ad9a80',.7);}
      c.save();c.translate(cx,cy);c.rotate(-.06);
      for(let ring=0;ring<2;ring++){
        let major=ring===0?baseR:baseR*.71,minor=ring===0?amp:amp*.85,loops=ring===0?30:23;
        const offset=ring===0?0:Math.PI/n; c.beginPath();
        for(let i=0;i<loops;i++){
          const v=i/(loops-1),beta=TAU*v+delta*(ring?-1:1),rad=major+8*cos(beta+z*.12);
          for(let a=0;a<=samples;a++){
            let u=TAU*a/samples+offset, k=n*u,rr=rad+minor*cos(k+beta)+10*cos(2*k+delta*.65)+3*cos(k-2*beta), tangent=minor*.69*sin(k+beta)+11*sin(k-beta+delta);
            let X=(rr*cos(u)-tangent*sin(u))*1.18,Y=rr*sin(u)+tangent*cos(u);
            if(a)c.lineTo(X,Y);else c.moveTo(X,Y);
          }
        }
        stroke(c,ring?'rgba(142,46,44,.79)':'rgba(48,71,76,.84)',ring?.82:.91);
      }
      // A second, tightly ruled medallion leaves clear paper between the two plates.
      c.beginPath();for(let i=0;i<12;i++){let v=i/12;for(let j=0;j<=240;j++){let u=j/240*TAU,r=(30+v*9)+5*cos(n*u+TAU*v+delta);let x=1.18*cos(u)*r,y=sin(u)*r;j?c.lineTo(x,y):c.moveTo(x,y);}}stroke(c,'#996d4e',.72);
      c.restore();type(c,'PLATE  /  R·E',111,451,'#917560',10);type(c,`${String(n).padStart(2,'0')}  /  LOBES`,789,451,'#917560',10,'right');c.restore();
    }});
})();
