/* Fieldwork: five small instruments for observing synthetic landscapes. */
(() => {
  'use strict';
  const K = Math.PI * 2, clamp = (x,a=0,b=1)=>Math.max(a,Math.min(x,b)), mix=(a,b,u)=>a+(b-a)*u;
  const param=(name,min,max,step,value)=>({name,min,max,step,value});
  const rnd = seed => {let a=seed>>>0; return ()=>{a=(a+0x6D2B79F5)>>>0; let z=Math.imul(a^(a>>>15),1|a); z^=z+Math.imul(z^(z>>>7),61|z); return ((z^(z>>>14))>>>0)/4294967296}};
  const disk=(c,x,y,r,col)=>{c.fillStyle=col;c.beginPath();c.arc(x,y,r,0,K);c.fill()};
  const line=(c,x,y,X,Y,col,l=1)=>{c.beginPath();c.strokeStyle=col;c.lineWidth=l;c.moveTo(x,y);c.lineTo(X,Y);c.stroke()};
  function type(c,txt,x,y,col,sz,align='left'){c.fillStyle=col;c.textAlign=align;c.textBaseline='middle';c.font=sz+'px ui-monospace, SFMono-Regular, Consolas, monospace';c.fillText(txt,x,y)}
  function plate(c,w,h,top,bottom){let g=c.createLinearGradient(0,0,0,h);g.addColorStop(0,top);g.addColorStop(1,bottom);c.fillStyle=g;c.fillRect(0,0,w,h)}
  function surface(c,w,h){let o=(c.canvas.ownerDocument||document).createElement('canvas');o.width=w;o.height=h;return o}
  const noteSize=(w,h)=>clamp(Math.min(w/46,h/32),8,12);
  const P=s=>s.pointer||{x:.5,y:.5,down:false};

  // A set of offset island peaks and multi-octave smooth value noise, sampled in
  // projected coordinates. Contour quantization is in metres, not screen pixels.
  function makeChart(seed){
    const r=rnd(seed^14591), table=Float32Array.from({length:256},()=>r()*2-1);
    const lobes=[[-.40,-.06,.28,.39,1.15],[-.06,.12,.43,.20,.99],[.36,-.20,.25,.30,.94],[.57,.23,.19,.16,.86],[-.55,.32,.14,.14,.73],[.11,-.45,.16,.17,.60]];
    for(const l of lobes){l[0]+=(r()-.5)*.13;l[1]+=(r()-.5)*.12;l[4]+=(r()-.5)*.16}
    const n=(x,y)=>{let i=Math.floor(x),j=Math.floor(y),a=x-i,b=y-j;a=a*a*(3-2*a);b=b*b*(3-2*b);let k=(i+j*37)&255;return mix(mix(table[k],table[(k+1)&255],a),mix(table[(k+37)&255],table[(k+38)&255],a),b)};
    return (x,y)=>{
      let X=x+.09*n(3*x+13,3*y+18),Y=y+.07*n(3*x+41,3*y+7),z=-.65;
      for(const l of lobes){let a=(X-l[0])/l[2],b=(Y-l[1])/l[3];z+=l[4]*Math.exp(-1.6*(a*a+b*b))}
      return z+.25*n(5*x+11,5*y+17)+.085*n(14*x-22,14*y+9)+.032*n(39*x,39*y)+.009*n(97*x,97*y);
    };
  }
  window.ASTRA.push({
    id:'tidal-sheet',title:'The Tidal Sheet',category:'Fieldwork',
    description:'Read an invented archipelago as the tide exposes rock shelves and cuts its islands apart.',
    method:'A synthetic elevation field combines warped island peaks with four bands of terrain noise. Changing the datum floods every point below it; contour lines mark equal depth or height in metres.',
    gesture:'Press or drag to take a sounding. Change the tide to watch the same bench of rock become a shoal.',
    params:[param('Tide datum (m)',-20,18,1,-5),param('Contour interval (m)',2,10,1,4)],
    draw(c,w,h,t,p,s){
      if(w<1||h<1)return;
      if(!s.chart||s.chart.seed!==s.seed){s.chart={seed:s.seed,field:makeChart(s.seed)}}
      let a=s.chart, field=a.field, m=Math.min(w/1.65,h/1.14), xy=(u,v)=>[(u-.5)*w/m,(v-.5)*h/m], datum=p[0], interval=p[1], key=[w,h,datum,interval].join('/');
      if(key!==a.key){
        const W=Math.max(1,Math.round(Math.min(640,w))),H=Math.max(1,Math.round(W*h/w)),o=surface(c,W,H),b=o.getContext('2d'),img=b.createImageData(W,H),buf=img.data;
        for(let j=0;j<H;j++)for(let i=0;i<W;i++){
          let x=(i/W-.5)*w/m,y=(j/H-.5)*h/m,z=field(x,y)*65-datum,sub=z<0,D=clamp(Math.abs(z)/(sub?50:48)),stripe=(Math.abs(z)/interval)%1;
          const base=sub?[mix(37,8,D),mix(112,27,D),mix(122,46,D)]:[mix(204,68,D),mix(178,83,D),mix(114,61,D)];
          let k=(i+j*W)*4,br=Math.abs(z)<.68?1.42:(stripe<.15?(sub?.72:.73):1),tex=(((i*13+j*617+(i^j)*197)&15)/15-.5)*4;
          for(let q=0;q<3;q++)buf[k+q]=base[q]*br+tex;
          buf[k+3]=255;
        }
        b.putImageData(img,0,0);a.image=o;a.key=key;
      }
      c.drawImage(a.image,0,0,w,h);
      const sz=noteSize(w,h), pad=sz*1.8;
      c.save();c.setLineDash([1,6]);for(let i=1;i<6;i++){line(c,w*i/6,0,w*i/6,h,'rgba(219,238,218,.20)');if(i<4)line(c,0,h*i/4,w,h*i/4,'rgba(219,238,218,.20)')}c.restore();
      // A moving chain of pale current marks only in open water.
      c.lineWidth=1;c.strokeStyle='rgba(177,224,211,.43)';c.beginPath();
      for(let j=0;j<7;j++)for(let i=0;i<15;i++){let u=(i+.4+.16*Math.sin(t*.45+j+i))/15,v=(j+.55+.21*Math.sin(i+j*.4))/7;let [x,y]=xy(u,v);if(field(x,y)*65-datum>-17)continue;let xx=u*w,yy=v*h,q=m*.018;c.moveTo(xx,yy);c.quadraticCurveTo(xx+q*.5,yy-q*.26,xx+q,yy-q*.12)}c.stroke();
      let ptr=P(s);if(ptr.down){a.u=clamp(ptr.x);a.v=clamp(ptr.y)}
      let u=a.u??.69,v=a.v??.58,[x,y]=xy(u,v),zm=field(x,y)*65-datum,X=u*w,Y=v*h;
      c.strokeStyle='#fff0b5';c.lineWidth=1.4;c.beginPath();c.arc(X,Y,sz*.82,0,K);c.stroke();
      line(c,X-sz*1.6,Y,X-sz*.52,Y,'#fff0b5');line(c,X+sz*.52,Y,X+sz*1.6,Y,'#fff0b5');line(c,X,Y-sz*1.6,X,Y-sz*.52,'#fff0b5');line(c,X,Y+sz*.52,X,Y+sz*1.6,'#fff0b5');
      let tag=(zm>=0?'Exposed +':'Depth ')+Math.abs(zm).toFixed(1)+' m',tw=tag.length*sz*.67+sz*1.4,tx=clamp(X+sz*1.4,4,Math.max(4,w-tw-4)),ty=clamp(Y+sz*1.5,sz,Math.max(sz,h-2*sz));
      c.fillStyle='#09252bdc';c.fillRect(tx,ty-sz*.9,tw,sz*1.8);type(c,tag,tx+sz*.55,ty,'#eff4d7',sz);
      // Compass and a projected map-scale segment.
      line(c,w-pad,pad+sz,w-pad,pad+sz*2.85,'#e7eecc',1.4);type(c,'N',w-pad,pad,'#e7eecc',sz,'center');
      line(c,pad,h-pad,pad+m*.11,h-pad,'#cce9d5',2);line(c,pad,h-pad-3,pad,h-pad+3,'#cce9d5');line(c,pad+m*.11,h-pad-3,pad+m*.11,h-pad+3,'#cce9d5');
    }
  });

  // A feathered frond built outward from an articulated rachis. Each pinna
  // is itself a small feather: distinct, nearly touching pairs of pinnules.
  function specimen(c,baseX,baseY,L,lean,unfurl,density,phase,ink,vein){
    let N=44,pts=[{x:baseX,y:baseY,a:0}],x=baseX,y=baseY;
    for(let i=1;i<=N;i++){
      let u=(i-.5)/N, a=-Math.PI/2+lean + .26*Math.sin(u*2.55+phase)-.26*Math.sin(phase) +
        (.18+2.8*(1-unfurl))*u**2.8 + 4.5*(1-unfurl)*u**8;
      x+=L/N*Math.cos(a);y+=L/N*Math.sin(a);pts.push({x,y,a});
    }
    c.strokeStyle=vein;c.lineWidth=Math.max(.85,L*.006);c.beginPath();pts.forEach((v,i)=>i?c.lineTo(v.x,v.y):c.moveTo(v.x,v.y));c.stroke();
    let rows=Math.round(density);
    for(let j=0;j<rows;j++)for(let side=-1;side<=1;side+=2){
      let u=.12+.83*(j+(side===1?.26:0))/rows,P=pts[Math.round(u*N)],span=L*.205*Math.sin(Math.PI*(u-.04))**.75*(1-.68*u)*Math.sqrt(unfurl);
      let ang=P.a+side*(1.12-.44*u),B=9,x0=P.x,y0=P.y,x1=x0,y1=y0,dx=Math.cos(ang),dy=Math.sin(ang);
      c.strokeStyle=vein;c.lineWidth=Math.max(.45,L*.002);c.beginPath();c.moveTo(x0,y0);
      for(let k=1;k<=B;k++){let v=k/B,aa=ang-side*.42*v;x1+=span/B*Math.cos(aa);y1+=span/B*Math.sin(aa);c.lineTo(x1,y1)}
      c.stroke();x1=x0;y1=y0;c.fillStyle=ink;c.beginPath();
      for(let k=0;k<B;k++){let v=(k+.4)/B,aa=ang-side*.42*v,seg=span/B;dx=Math.cos(aa);dy=Math.sin(aa);x1+=seg*dx;y1+=seg*dy;
        for(let h=-1;h<=1;h+=2){let blade=span*(.32-.22*v)*Math.sin(Math.PI*(.18+.75*v)),a2=aa+h*(.94-.34*v),bx=Math.cos(a2)*blade,by=Math.sin(a2)*blade,wx=-Math.sin(a2)*seg*.73,wy=Math.cos(a2)*seg*.73;
          c.moveTo(x1,y1);c.quadraticCurveTo(x1+bx*.49+wx,y1+by*.49+wy,x1+bx,y1+by);c.quadraticCurveTo(x1+bx*.61-wx*.55,y1+by*.61-wy*.55,x1,y1);
        }
      }c.fill();
    }
  }
  window.ASTRA.push({
    id:'frond-room',title:'Frond Room',category:'Fieldwork',
    description:'Unroll a fern against a cyanotype ground and inspect the little feathers that make each larger feather.',
    method:'An articulated spine carries alternating pinnae, each with paired, tapered pinnules. The unfurling control transfers curvature out of the tip; the count changes branching density, not a texture.',
    gesture:'Press to bend the specimen toward your finger. Move the unfurling control to open its curled tip.',
    params:[param('Unfurling (%)',20,100,1,84),param('Pinna pairs',8,30,1,20)],
    draw(c,w,h,t,p,s){
      if(w<1||h<1)return;
      let key=[w,h,s.seed].join('/'),pad=Math.min(w,h)*.065;
      if(!s.paper||s.paperKey!==key){let o=surface(c,Math.max(1,Math.round(Math.min(800,w))),Math.max(1,Math.round(Math.min(800,w)*h/w))),b=o.getContext('2d'),W=o.width,H=o.height,r=rnd(s.seed^3229);
        plate(b,W,H,'#152c49','#163951');let g=b.createRadialGradient(.5*W,.55*H,0,.5*W,.55*H,.68*Math.max(W,H));g.addColorStop(0,'#285672');g.addColorStop(1,'#10233f');b.fillStyle=g;b.fillRect(0,0,W,H);
        for(let i=0;i<Math.min(W*H/36,8500);i++){let v=r();b.fillStyle=v>.56?'rgba(209,243,231,.13)':'rgba(7,17,42,.22)';b.fillRect(r()*W,r()*H,.5+r()*1.2,.5+r()*1.3)}
        s.paper=o;s.paperKey=key;
      }
      c.drawImage(s.paper,0,0,w,h);
      let ptr=P(s),bend=ptr.down?(ptr.x-.5)*1.3:.035*Math.sin(t*.58),un=p[0]/100,L=Math.min(h*.89,w*.94),bx=w*.50,by=h*.92;
      let ph=(s.seed%103)*.023;
      specimen(c,bx,by,L*.67,-.79+bend*.5,Math.min(1,un+.06),p[1]*.75,ph,'#72a5ad','#88afb7');
      specimen(c,bx+L*.013,by,L*.69,.69+bend*.68,clamp(un-.04,.12,1),p[1]*.84,ph+1,'#a0c6c3','#c1d8cf');
      specimen(c,bx,by,L,-.16+bend,un,p[1],ph+.67,'#d6e6d4','#f3edda');
      let sz=noteSize(w,h),ry=h-pad,rx=w-pad;
      for(let i=0;i<9;i++)line(c,rx-(i%4===0?sz:sz*.52),ry-i*sz*.67,rx,ry-i*sz*.67,'#a1c3c6',.9);
      line(c,rx,ry,rx,ry-8*sz*.67,'#a1c3c6',.8);
      type(c,'Pinnae / '+Math.round(p[1])+' pairs',pad,ry,'#bed5cc',sz);
    }
  });

  function birds(seed){
    let r=rnd(seed^7601),N=112,l=[];
    for(let i=0;i<N;i++){let a=r()*K,d=Math.sqrt(r()),u=d*Math.cos(a),v=d*Math.sin(a),z=r();
      l.push({x:.48+u*.28,y:.43+v*.105+Math.sin(u*3)*.09,vx:.065+r()*.033,vy:.008+Math.sin(u*4)*.025,z,ph:r()*K})}
    return l;
  }
  function fly(bo,t,dt,align,tight,ptr){
    const ds=.13**2,n=bo.length,next=[];
    for(let i=0;i<n;i++){
      const b=bo[i];let cnt=0,px=0,py=0,avx=0,avy=0,rx=0,ry=0;
      for(let j=0;j<n;j++){if(j===i)continue;let a=bo[j],dx=a.x-b.x,dy=a.y-b.y,d2=dx*dx+dy*dy;if(d2>=ds||d2<1e-10)continue;
        cnt++;px+=dx;py+=dy;avx+=a.vx;avy+=a.vy;
        if(d2<.023**2){let k=(.023**2/d2-1);rx-=dx*k;ry-=dy*k}
      }
      let gx=.49+.20*Math.cos(t*.37),gy=.40+.10*Math.sin(t*.61),ax=(gx-b.x)*.36,ay=(gy-b.y)*.39;
      if(cnt){ax+=px/cnt*tight+align*(avx/cnt-b.vx)+rx*.93;ay+=py/cnt*tight+align*(avy/cnt-b.vy)+ry*.93}
      ax+=Math.cos(t*.68+b.ph)*.013;ay+=Math.sin(t*.81+b.ph)*.013;
      if(ptr.down){let dx=b.x-ptr.x,dy=b.y-ptr.y,d=Math.hypot(dx,dy);if(d<.27){let k=(.27-d)*2.7/(d+.015);ax+=dx*k;ay+=dy*k}}
      let vx=b.vx+ax*dt,vy=b.vy+ay*dt,sp=Math.hypot(vx,vy)||.001,v=clamp(sp,.045,.18)/sp;
      next.push([vx*v,vy*v]);
    }
    for(let i=0;i<n;i++){const b=bo[i],[vx,vy]=next[i];b.vx=vx;b.vy=vy;b.x+=vx*dt;b.y+=vy*dt;
      if(b.x<.035||b.x>.965){b.x=clamp(b.x,.035,.965);b.vx*=-1}if(b.y<.065||b.y>.80){b.y=clamp(b.y,.065,.80);b.vy*=-1}}
  }
  window.ASTRA.push({
    id:'roost-count',title:'Before the Roost',category:'Fieldwork',
    description:'A flock writes and rewrites its shape above a dusk reed bed. One startled bird can turn its neighbors.',
    method:'Each bird combines short-range separation, local alignment and attraction toward nearby birds. A slowly moving roost target keeps the flock in view. Two sliders separate matching a neighbor’s course from following its position.',
    gesture:'Press near the flock to scatter it. Increase cohesion to see how quickly the scattered birds reassemble.',
    params:[param('Alignment',0,3,.1,1.2),param('Cohesion',0,3,.1,1.15)],
    draw(c,w,h,t,p,s){
      if(w<1||h<1)return;
      const k=[s.seed,w,h].join('/'),sz=noteSize(w,h);
      if(s.roostKey!==k){const W=Math.max(1,Math.round(w)),H=Math.max(1,Math.round(h)),o=surface(c,W,H),b=o.getContext('2d'),r=rnd(s.seed^1821),g=b.createLinearGradient(0,0,0,H);
        g.addColorStop(0,'#1b283d');g.addColorStop(.36,'#745d77');g.addColorStop(.66,'#d48b83');g.addColorStop(.84,'#f7b584');g.addColorStop(1,'#453c52');b.fillStyle=g;b.fillRect(0,0,W,H);
        let sun=Math.min(W,H)*.082;disk(b,W*.76,H*.70,sun,'#ffd9a7');
        for(let j=0;j<13;j++){let x=r()*W,y=H*(.56+r()*.22),v=W*(.10+.45*r());b.fillStyle='rgba(157,111,127,.24)';b.fillRect(x,y,v,.6+r()*1.6)}
        for(let j=0;j<3;j++){b.fillStyle=['#826778','#594f65','#303a4b'][j];b.beginPath();b.moveTo(0,H);
          for(let i=0;i<=80;i++){let u=i/80,y=(.80+.040*j)+.014*Math.sin(u*9+j*1.9)+.009*Math.sin(u*27+j)+.004*r();b.lineTo(u*W,y*H)}
          b.lineTo(W,H);b.closePath();b.fill()}
        for(let i=0;i<220;i++){let x=r()*W,hh=(.005+r()**3*.077)*H,y=H*(.91+.07*r()),lean=(r()-.32)*hh*.4;b.strokeStyle=r()>.5?'#313847':'#333c4a';b.lineWidth=.5+r();b.beginPath();b.moveTo(x,y+hh);b.quadraticCurveTo(x+lean*.2,y,x+lean,y-hh);b.stroke()}
        s.roostSky=o;s.roostKey=k;
      }
      c.drawImage(s.roostSky,0,0,w,h);
      let f=s.flock;if(!f||f.seed!==s.seed||t<f.last){f=s.flock={seed:s.seed,b:birds(s.seed),last:t,rem:0}}
      let ptr=P(s),dt=Math.max(0,Math.min(.15,t-f.last));f.last=t;f.rem+=dt;
      while(f.rem>=1/30){fly(f.b,t-f.rem,1/30,p[0],p[1],ptr);f.rem-=1/30}
      f.b.forEach((b,i)=>{let x=b.x*w,y=b.y*h,k=clamp(Math.min(w,h)*(.006+b.z*.010),1.35,8),flap=Math.sin(t*7.3+b.ph),dir=Math.atan2(b.vy*h,b.vx*w),dx=Math.cos(dir),dy=Math.sin(dir),nx=-dy,ny=dx;
        let sweep=.50+.20*flap,span=.4+.62*Math.abs(flap);
        c.fillStyle=b.z>.42?'#181f2f':'#3b3548';c.beginPath();c.moveTo(x+dx*k*.62,y+dy*k*.62);
        c.quadraticCurveTo(x+nx*k*.50,y+ny*k*.50,x+nx*k*span-dx*k*sweep,y+ny*k*span-dy*k*sweep);
        c.lineTo(x-dx*k*.48,y-dy*k*.48);
        c.lineTo(x-nx*k*span-dx*k*sweep,y-ny*k*span-dy*k*sweep);
        c.quadraticCurveTo(x-nx*k*.5,y-ny*k*.5,x+dx*k*.62,y+dy*k*.62);c.fill()});
      if(ptr.down){c.strokeStyle='rgba(253,218,175,.65)';c.beginPath();c.arc(ptr.x*w,ptr.y*h,sz*1.6,0,K);c.stroke()}
      type(c,f.b.length+' birds',sz*1.7,h-sz*1.6,'#e2cbba',sz);
    }
  });

  const rocks=['#7f8f91','#e6c89a','#b76b51','#4c6470','#d99870','#a3a6a0','#866571','#cab998','#6c7477','#bc856c','#6a5967','#c5a181','#766971','#323d4d'];
  function makeStrata(seed){
    let r=rnd(seed^912),phase=r()*K,delta=0,depths=[0];
    for(let i=0;i<rocks.length-1;i++){delta+=i===0?.032:.039+.038*r();depths.push(delta)}
    const horizon=(x,j,fold)=>{let d=depths[j],bed=.20+.020*Math.sin(x*6+phase)+.014*Math.sin(x*19+phase*.5);
      if(j===0)return bed;
      return bed+d +fold*(1-Math.exp(-d*7))*(.11*Math.sin(x*8+phase)+.036*Math.sin(17*x-phase)+.08*(x-.5));
    };
    return {depths,horizon};
  }
  window.ASTRA.push({
    id:'fault-archive',title:'Fault Archive',category:'Fieldwork',
    description:'Slice through a painted ridge and follow a displaced bed across a fault. Its stripes are rock units, not a color scale.',
    method:'Procedural depositional boundaries are folded and split into two blocks by an inclined fault. The hanging block is displaced vertically. A virtual borehole samples the exposed section at its current position.',
    gesture:'Drag the borehole across the break. Change the throw to bring marker beds on opposite sides back into alignment.',
    params:[param('Fault throw (m)',0,90,1,43),param('Fold intensity (%)',0,100,1,66)],
    draw(c,w,h,t,p,s){
      if(w<1||h<1)return;
      let key=[s.seed,w,h,p[0],p[1]].join('/'),v=s.geol;
      if(!v||v.seed!==s.seed)v=s.geol={...makeStrata(s.seed),seed:s.seed};
      const fold=p[1]/100,th=p[0]/430,fx=y=>.47+y*.17, yof=(x,j,right)=>v.horizon(x,j,fold)+(right?th:0);
      if(s.sectionKey!==key){
        let o=surface(c,Math.max(1,Math.round(w)),Math.max(1,Math.round(h))),b=o.getContext('2d'),W=o.width,H=o.height,r=rnd(s.seed^52321);
        plate(b,W,H,'#1e303e','#566271');let peaks=[.14,.16,.18];peaks.forEach((base,j)=>{b.fillStyle=['#3b4b59','#485764','#59616b'][j];b.beginPath();b.moveTo(0,H);for(let i=0;i<=100;i++){let x=i/100;b.lineTo(x*W,H*(base+.015*Math.sin(x*18+j)+.012*Math.sin(29*x+j*.35)+.006*r()))}b.lineTo(W,H);b.fill()});
        // Grained linework is generated once per geology, not once per animation frame.
        for(let side=0;side<2;side++){
          b.save();b.beginPath();b.moveTo(fx(0)*W,0);b.lineTo(fx(1)*W,H);b.lineTo(side?W:0,H);b.lineTo(side?W:0,0);b.closePath();b.clip();
          for(let j=0;j<rocks.length;j++){
            b.fillStyle=rocks[j];b.beginPath();b.moveTo(0,H);for(let i=0;i<=104;i++){let u=i/104;b.lineTo(u*W,yof(u,j,side)*H)}b.lineTo(W,H);b.fill();
            for(let n=0;n<3+(j%3);n++){let f=(n+.5)/(4+j%3);
              b.strokeStyle=n%2?'#f5d7b037':'#382f3d42';b.lineWidth=n%2?.7:1;b.beginPath();
              for(let i=0;i<=88;i++){let u=i/88,Y=yof(u,j,side),next=j<rocks.length-1?yof(u,j+1,side):Y+.12,yy=mix(Y,next,f)+.0011*Math.sin(91*u+j+n);
                if(i)b.lineTo(u*W,yy*H);else b.moveTo(0,yy*H)}b.stroke()}
            const count=Math.min(750,Math.round(W*.56));
            for(let k=0;k<count;k++){let u=r(),Y=yof(u,j,side),Z=j<rocks.length-1?yof(u,j+1,side):Y+.12,f=r(),y=mix(Y,Z,f)*H,x=u*W;
              b.fillStyle=k%3?'#201d2b34':'#ffe1b95e';b.fillRect(x,y,.4+r()*(j%3===0?3.2:1.5),.5+r()*.7)}
          }
          b.restore();
        }
        let fTop=Math.min(yof(.5,0,0),yof(.5,0,1));line(b,fx(fTop)*W,fTop*H,fx(1)*W,H,'#2d2932cc',2);
        s.sectionKey=key;s.section=o;
      }
      c.drawImage(s.section,0,0,w,h);let ptr=P(s);if(ptr.down)s.bore=clamp(ptr.x,.035,.965);
      let bx=s.bore??.72,sz=noteSize(w,h),tip=ptr.down?clamp(ptr.y,.22,.95):s.boreY??.63;if(ptr.down)s.boreY=tip;
      let side=bx>fx(tip),unit=-1;for(let j=0;j<rocks.length;j++)if(yof(bx,j,side)<=tip)unit=j;
      c.save();c.setLineDash([sz*.42,sz*.36]);line(c,bx*w,h*.10,bx*w,tip*h,'#f5ecd8',1.3);c.restore();
      disk(c,bx*w,tip*h,sz*.57,'#1d2a35');disk(c,bx*w,tip*h,sz*.29,'#f4e4c8');
      let txt=unit<0?'Above surface':'Bed '+String(unit+1).padStart(2,'0'),tw=sz*txt.length*.62+sz*1.5,tx=clamp(bx*w-tw/2,4,w-tw-4);
      c.fillStyle='#162632e6';c.fillRect(tx,h*.10-sz*1.8,tw,sz*1.8);type(c,txt,tx+tw/2,h*.10-sz*.87,'#f4e4c8',sz,'center');
      const dh=h*50/430,y=h*.94,x=sz*1.6;line(c,x,y,x,y-dh,'#faf1d9',1.5);line(c,x-2,y,x+4,y,'#faf1d9');line(c,x-2,y-dh,x+4,y-dh,'#faf1d9');type(c,'50 m',x+sz*.8,y-dh*.5,'#fff1d9',sz);
    }
  });

  // Local east, north and up components for a solar direction. Orthographic
  // projection sends the zenith to the center of a circular horizon.
  const sunDir=(lat,dec,ha)=>{let cd=Math.cos(dec),sd=Math.sin(dec),sl=Math.sin(lat),cl=Math.cos(lat),ch=Math.cos(ha);
    return [-cd*Math.sin(ha),cl*sd-sl*cd*ch,sl*sd+cl*cd*ch]};
  const decAt=d=>.4091*Math.sin(K*(d-80)/365.2422);
  window.ASTRA.push({
    id:'sun-register',title:'Sun Register',category:'Fieldwork',
    description:'Compile weeks of sunlight into one circular sky print. The sun’s path changes with season and observing latitude.',
    method:'The chart projects the sun’s local east, north and up components onto a horizontal plane. Each fine arc is one day. A sinusoidal declination approximates the seasons and neglects refraction and orbital eccentricity.',
    gesture:'Press anywhere to select a date within the exposure and read its daylight duration. East is right, north is up.',
    params:[param('Latitude (°)',-75,75,1,48),param('Exposure (days)',7,365,1,164)],
    draw(c,w,h,t,p,s){
      if(w<1||h<1)return;let lat=p[0]*Math.PI/180,span=Math.round(p[1]),R=Math.min(w*.393,h*.392),cx=w*.5,cy=h*.50,sz=noteSize(w,h),key=[s.seed,w,h,lat,span].join('/');
      const start=22+(Math.abs(s.seed)%25),xy=([e,n,u])=>[cx+R*e,cy-R*n,u];
      const arc=(b,d,col,width)=>{let active=false;b.beginPath();for(let i=0;i<=150;i++){let q=sunDir(lat,decAt(d),-Math.PI+i*K/150);if(q[2]<0){active=false;continue}let [x,y]=xy(q);if(active)b.lineTo(x,y);else b.moveTo(x,y);active=true}b.strokeStyle=col;b.lineWidth=width;b.stroke()};
      if(s.skyKey!==key){let o=surface(c,Math.max(1,Math.round(w)),Math.max(1,Math.round(h))),b=o.getContext('2d'),r=rnd(s.seed^347);plate(b,w,h,'#181b2c','#242335');
        let g=b.createRadialGradient(cx,cy,0,cx,cy,R);g.addColorStop(0,'#3c3849');g.addColorStop(.74,'#302e42');g.addColorStop(1,'#202535');disk(b,cx,cy,R,g);
        for(let i=0;i<1100;i++){let a=r()*K,d=Math.sqrt(r())*R;b.fillStyle=i%4?'#f0dfb012':'#cdb69928';b.fillRect(cx+d*Math.cos(a),cy+d*Math.sin(a),.7+r(),.7)}
        for(let alt of [0,30,60]){b.strokeStyle=alt?'#c9b9b449':'#cebbb790';b.lineWidth=alt?.7:1.2;b.beginPath();b.arc(cx,cy,R*Math.cos(alt*Math.PI/180),0,K);b.stroke()}
        for(let j=0;j<24;j++){let a=j*K/24,l=j%3?R*.026:R*.055,dx=Math.cos(a),dy=Math.sin(a);line(b,cx+(R-l)*dx,cy+(R-l)*dy,cx+R*dx,cy+R*dy,'#d1babc',.8);if(j%6===0)line(b,cx,cy,cx+R*dx,cy+R*dy,'#c6acac35',.7)}
        let count=Math.min(span,102),lw=Math.max(.68,R*.005);
        for(let i=0;i<count;i++){let f=count===1?0:i/(count-1),day=start+f*(span-1),hue=12+f*33;arc(b,day,'hsla('+hue+', 94%, '+(59+f*17)+'%, '+(count<30?.66:.34)+')',lw)}
        for(let [dir,a] of [['N',-Math.PI/2],['E',0],['S',Math.PI/2],['W',Math.PI]])type(b,dir,cx+(R+sz*1.22)*Math.cos(a),cy+(R+sz*1.22)*Math.sin(a),'#d4c6c7',sz,'center');
        s.skyKey=key;s.sky=o;
      }
      c.drawImage(s.sky,0,0,w,h);let ptr=P(s);if(ptr.down)s.solarSel=clamp(ptr.x);
      let day=Math.round(start+(s.solarSel??.68)*(span-1)),dec=decAt(day),v=-Math.tan(lat)*Math.tan(dec),limit=Math.acos(clamp(v,-1,1)),hours=24*limit/Math.PI,progress=(t*.035+.43)%1;
      if(hours>.01){arc(c,day,'#ffdfa2',Math.max(1.15,R*.009));let q=sunDir(lat,dec,mix(-limit,limit,progress)),[X,Y]=xy(q);
        disk(c,X,Y,sz*.85,'#ffe29729');disk(c,X,Y,sz*.42,'#ffeeb7')}
      let minutes=Math.round(hours*60),hm=Math.floor(minutes/60)+'h '+String(minutes%60).padStart(2,'0')+'m';
      type(c,'Day '+String(((day-1)%365)+1).padStart(3,'0'),sz*1.6,h-sz*1.55,'#d8c9c9',sz);type(c,hm+' daylight',w-sz*1.6,h-sz*1.55,'#f2d496',sz,'right');
    }
  });
})();
