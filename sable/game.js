/* SABLE RELAY | field controls, chamber plans and an independent geometric light solver.
   No build step. In a console: SableOptics.audit() exhaustively verifies all three layouts.
   In Node: node -e "console.table(require('./game.js').audit())" */
(() => {
  'use strict';
  const ROOT = typeof window === 'undefined' ? globalThis : window;
  const STEP = Math.PI / 8, PI = Math.PI, TAU = 2 * PI, EPS = 1e-5;
  const clamp = (v, lo, hi) => Math.min(hi, Math.max(lo, v));
  const dist = (a, b) => Math.hypot(a.x - b.x, a.z - b.z);
  const wrap = n => (n % 8 + 8) % 8;
  const point = (x, z) => ({x, z});
  const lens = (x, z, step) => ({x, z, step, angle:step*STEP});
  const source = (x, z, dx, dz) => ({x, z, dx, dz});
  const levels = [
    {name:'First Light', call:'Align the first mirror with the far receiver.', spawn:[-.5,-8.7], yaw:-.08,
      emitters:[source(-6.4,-1,1,0)], mirrors:[lens(-1,-1,1)], targets:[point(-1,6.6)], answer:[2]},
    {name:'Switchback', call:'Make two turns. Follow the beam from one mirror to the next.', spawn:[-.5,-8.7], yaw:-.25,
      emitters:[source(-6.4,-4,1,0)], mirrors:[lens(-2.7,-4,1),lens(-2.7,4,0)], targets:[point(5.8,4)], answer:[2,2]},
    {name:'Parallax', call:'Cross the two beams. Both receivers must stay lit.', spawn:[-.5,-8.7], yaw:-.12,
      emitters:[source(-6.6,-5,1,0),source(5,-7,0,1)], mirrors:[lens(-3,-5,0),lens(-3,3,7),lens(5,-1,4),lens(1,-1,2)],
      targets:[point(6.6,3),point(1,8)], answer:[2,2,6,6]}
  ].map((l,i)=>({...l,id:i+1,exit:point(0,10.3)}));

  // Nearest positive ray/segment and ray/disc hits in x,z at the 1.25 m optical plane.
  function disc(x,z,dx,dz,c,r) {
    const vx=c.x-x, vz=c.z-z, along=vx*dx+vz*dz;
    const perp2=(vx*dz-vz*dx)**2, h=r*r-perp2;
    if (h<0) return Infinity;
    const t=along-Math.sqrt(h);
    return t>EPS?t:Infinity;
  }
  function trace(emitters,mirrors,targets) {
    const lit=targets.map(()=>false), beams=[], paths=[];
    emitters.forEach((s,src)=>{
      let {x,z,dx,dz}=s, previous=-1;
      const seen=new Set(), path=[]; paths.push(path);
      for (let bounce=0;bounce<16;bounce++) {
        let t=Math.min(dx>EPS?(8-x)/dx:dx< -EPS?(-8-x)/dx:Infinity,
                       dz>EPS?(11-z)/dz:dz< -EPS?(-11-z)/dz:Infinity);
        let tag='wall',index=-1;
        function hit(d,type,i) { if (d>EPS && d<t) {t=d;tag=type;index=i;} }
        mirrors.forEach((m,i)=>{
          if(i===previous)return;
          const tx=Math.cos(m.angle),tz=Math.sin(m.angle);
          const den=dx*tz-dz*tx;
          if(Math.abs(den)<EPS)return;
          const vx=m.x-x,vz=m.z-z;
          const u=(vx*dz-vz*dx)/den;
          if(Math.abs(u)<=.90+EPS) hit((vx*tz-vz*tx)/den,'mirror',i);
        });
        targets.forEach((p,i)=>hit(disc(x,z,dx,dz,p,.30),'receiver',i));
        emitters.forEach((p,i)=>{ if(bounce!==0||i!==src)hit(disc(x,z,dx,dz,p,.26),'source',i); });
        if(!Number.isFinite(t)||t<EPS)break;
        const ex=x+dx*t,ez=z+dz*t;
        beams.push({x1:x,z1:z,x2:ex,z2:ez,source:src}); path.push({kind:tag,index});
        if(tag==='receiver')lit[index]=true;
        if(tag!=='mirror')break;
        // r = 2(d·t)t - d. The mirror has two reflective faces.
        const tx=Math.cos(mirrors[index].angle),tz=Math.sin(mirrors[index].angle), a=2*(dx*tx+dz*tz);
        dx=a*tx-dx; dz=a*tz-dz;
        const mag=Math.hypot(dx,dz);dx/=mag;dz/=mag;
        const cycle=[index,Math.round(ex*1e4),Math.round(ez*1e4),Math.round(dx*1e4),Math.round(dz*1e4)].join('/');
        if(seen.has(cycle))break;seen.add(cycle);
        x=ex;z=ez;previous=index;
      }
    });
    return {lit,beams,paths,open:lit.every(Boolean)};
  }
  function layout(level,steps) {
    return level.mirrors.map((m,i)=>lens(m.x,m.z,steps?steps[i]:m.step));
  }
  function solve(level,steps){return trace(level.emitters,layout(level,steps),level.targets);}
  function audit() {
    return levels.map(l=>{
      const witness=solve(l,l.answer),initial=solve(l),states=8**l.mirrors.length;
      let reachable=0,minimum=Infinity;
      for(let i=0;i<states;i++){
        const steps=l.mirrors.map((m,j)=>Math.floor(i/(8**j))%8);
        if(solve(l,steps).open){reachable++;const turns=steps.reduce((acc,s,j)=>acc+wrap(s-l.mirrors[j].step),0);minimum=Math.min(minimum,turns);}
      }
      const used=new Set(witness.paths.flat().filter(h=>h.kind==='mirror').map(h=>h.index));
      return {chamber:l.name,configurations:states,winningConfigurations:reachable,minimumForwardClicks:minimum,
        witness:witness.paths.map(p=>p.map(h=>(h.kind==='mirror'?'M':h.kind==='receiver'?'R':'X')+(h.index+1)).join('>')).join(' / '),
        passed:!initial.open&&witness.open&&used.size===l.mirrors.length&&reachable>0&&minimum>0};
    });
  }
  const optics=Object.freeze({levels,solve,trace,audit,stepRadians:STEP});
  ROOT.SableLevels=levels; ROOT.SableOptics=optics;
  if(typeof module!=='undefined'&&module.exports)module.exports=optics;
  if(typeof document==='undefined')return;

  function mount() {
    const id=k=>document.getElementById(k), viewport=id('viewport'), map=id('map');
    let canvas=id('world'); if(!canvas||!viewport)return;
    const ui={}; ['begin','pause','reset','rotate','advance','hud-stage','hud-hint','hud-count','hud-engine','hud-clock','crosshair','intro','touch'].forEach(k=>ui[k]=id(k));
    const write=(k,v)=>{if(ui[k]&&ui[k].textContent!==v)ui[k].textContent=v;};
    const button=(k,fn)=>{if(ui[k])ui[k].addEventListener('click',fn);};
    const show=(node,b)=>{if(node){node.hidden=!b;node.classList.toggle('hidden',!b);}};
    const pad=(n)=>String(n).padStart(2,'0');
    const clock=(t)=>pad(Math.floor(t/60))+':'+pad(Math.floor(t)%60);
    const label=i=>String.fromCharCode(65+i);
    const keys=new Set(), activeTouches=new Map();
    const bindKey=(k)=>keys.has(k)||Array.from(activeTouches.values()).includes(k);
    let state,phase='intro',renderer=null, tactical=null, mapContext=null, engine='Starting optics', format3D=true;
    let elapsed=0,turns=0,stageTurns=0,walk=0,near=-1,path=[],goalName='',hint='',hintUntil=0,previous=performance.now(),epoch=0,lastSolve=false;
    let pauseReason='',transitionT=0,selectedMirror=-1,drag=null,anim=0,closed=false;
    const reduceMotion=window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    try{mapContext=map?.getContext('2d');}catch{}
    function tune(i,steps) {
      const l=levels[i], mirrors=layout(l,steps);
      state={time:0,level:i,rooms:[],mirrors,emitters:l.emitters.map(e=>({...e})),targets:l.targets.map(t=>({...t,lit:false})),
        beams:[],cam:[l.spawn[0],1.66,l.spawn[1]],yaw:l.yaw,pitch:-.055,exit:{...l.exit,open:false}};
      near=-1;path=[];goalName='';walk=0;stageTurns=0;lastSolve=false;selectedMirror=-1;
      recompute(false);notice(l.call,6);scan();
    }
    function player(){return point(state.cam[0],state.cam[2]);}
    function recompute(flash=true) {
      const r=trace(state.emitters,state.mirrors,state.targets);
      state.beams=r.beams;state.targets.forEach((p,i)=>p.lit=r.lit[i]);state.exit.open=r.open;
      if(flash&&r.open&&!lastSolve){notice('Gate powered. Walk through the north arch.',6);}
      lastSolve=r.open;
    }
    function notice(msg,t=2){hint=msg;hintUntil=performance.now()+t*1000;}
    function scan(){
      const p=player(); near=-1; let best=2.05;
      state.mirrors.forEach((m,i)=>{const d=dist(m,p);if(d<best){best=d;near=i;}});
    }
    function rotate(dir=1){
      if(phase!=='play')return;
      scan(); if(near<0){notice('Approach a mirror first. Tap its mark on the map to walk there.',3);return;}
      const i=near,m=state.mirrors[i]; const before=state.targets.filter(t=>t.lit).length;
      m.step=wrap(m.step+dir);m.angle=m.step*STEP;selectedMirror=i;turns++;stageTurns++;path=[];
      notice('Mirror '+label(i)+'  /  '+(m.step*22.5)+'°',1.25);
      recompute();
      const after=state.targets.filter(t=>t.lit).length;
      if(after>before&&!state.exit.open)notice('Receiver acquired. Keep this line live.',2.2);
      updateHUD();
    }
    function blocked(x,z){
      if(x< -7.58||x>7.58||z< -10.6||z>10.68)return true;
      for(const m of state.mirrors)if((x-m.x)**2+(z-m.z)**2<1.12**2)return true;
      for(const t of [...state.emitters,...state.targets])if((x-t.x)**2+(z-t.z)**2<.65**2)return true;
      if(!state.exit.open&&Math.abs(x-state.exit.x)<1.18&&Math.abs(z-state.exit.z)<.55)return true;
      return false;
    }
    function move(dx,dz){
      const a=state.cam,ox=a[0],oz=a[2];
      // Axis separation makes sliding along plinths smooth even at low frame rates.
      const n=Math.ceil(Math.hypot(dx,dz)/.16)||1;
      for(let i=0;i<n;i++){
        if(!blocked(a[0]+dx/n,a[2]))a[0]+=dx/n;
        if(!blocked(a[0],a[2]+dz/n))a[2]+=dz/n;
      }
      walk+=Math.hypot(a[0]-ox,a[2]-oz);
      return Math.hypot(a[0]-ox,a[2]-oz);
    }

    // Navigation on the little floor plan uses the very same footprint tests as walking.
    // Eight-way flood with no diagonal corner cutting; clicks on solid devices approach their base.
    function route(x,z,name='Waypoint'){
      if(phase!=='play')return;
      const step=.4,nx=39,nz=54,xx=i=>-7.6+(i%nx)*step,zz=i=>-10.6+Math.floor(i/nx)*step;
      const idx=(x,z)=>clamp(Math.round((x+7.6)/step),0,nx-1)+nx*clamp(Math.round((z+10.6)/step),0,nz-1);
      const n=nx*nz,open=new Uint8Array(n),parent=new Int16Array(n).fill(-2),q=new Int16Array(n);
      for(let i=0;i<n;i++)open[i]=blocked(xx(i),zz(i))?0:1;
      let start=idx(state.cam[0],state.cam[2]);if(!open[start]){
        let m=Infinity;for(let i=0;i<n;i++)if(open[i]){const d=Math.hypot(xx(i)-state.cam[0],zz(i)-state.cam[2]);if(d<m){m=d;start=i;}}
      }
      parent[start]=-1;q[0]=start;let a=0,b=1,dMin=Infinity,best=start;
      while(a<b){const at=q[a++],ix=at%nx,iz=Math.floor(at/nx),d=(xx(at)-x)**2+(zz(at)-z)**2;
        if(d<dMin){best=at;dMin=d;}
        for(const [dx,dz] of [[0,1],[1,0],[-1,0],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){
          const j=at+dx+dz*nx;
          if(ix+dx<0||ix+dx>=nx||iz+dz<0||iz+dz>=nz||!open[j]||parent[j]!==-2)continue;
          if(dx&&dz&&(!open[at+dx]||!open[at+dz*nx]))continue;
          parent[j]=at;q[b++]=j;
        }
      }
      const seq=[];for(let i=best;i!==-1;i=parent[i])seq.push(point(xx(i),zz(i)));
      path=seq.reverse();goalName=name;notice('Walking to '+name.toLowerCase()+'.',1);
    }
    function facing(y){return Math.atan2(Math.sin(y),Math.cos(y));}
    function advance(){
      if(phase==='finished'){newRun();return;}
      if(phase!=='play')return;
      if(!state.exit.open){notice('The gate needs every receiver lit.',2);return;}
      route(state.exit.x,state.exit.z,'north gate');
    }
    function reach(){
      if(phase!=='play')return;
      phase='transit';transitionT=.7;path=[];keys.clear();activeTouches.clear();
      turns=Math.max(0,turns);notice('Chamber sealed. Transferring light…',1);
      updateHUD();
    }
    function finish(){
      phase='finished';clearInput();
      let best=elapsed;
      try{const old=Number(localStorage.getItem('sable.best.v1'));if(old>0)best=Math.min(best,old);localStorage.setItem('sable.best.v1',String(best));}catch{}
      overlay('Circuit complete','All three chambers are carrying light.','Time '+clock(elapsed)+'   ·   '+turns+' adjustments   ·   Best '+clock(best),'Run again',newRun);
      notice('Circuit complete. All receivers live.',99999);updateHUD();
    }
    let panel=null;
    function overlay(title,copy,meta,cta,fn){
      panel?.remove(); panel=document.createElement('section');panel.setAttribute('role','dialog');panel.setAttribute('aria-label',title);
      Object.assign(panel.style,{position:'absolute',inset:'0',zIndex:'9',display:'grid',placeContent:'center',padding:'24px',background:'rgba(6,18,20,.78)',backdropFilter:'blur(5px)',textAlign:'center',color:'#edf8e5'});
      const line=document.createElement('small');line.textContent='SABLE  /  FIELD RECORD';Object.assign(line.style,{font:'600 10px monospace',letterSpacing:'.2em',color:'#8ddcc9'});
      const h=document.createElement('h2');h.textContent=title;Object.assign(h.style,{fontSize:'clamp(32px, 6vw, 74px)',lineHeight:'.96',letterSpacing:'-.055em',margin:'18px 0 12px'});
      const p=document.createElement('p');p.textContent=copy;Object.assign(p.style,{margin:'0 0 10px',fontSize:'15px'});
      const m=document.createElement('p');m.textContent=meta;Object.assign(m.style,{font:'11px monospace',color:'#b1c7b8',margin:'0 0 24px'});
      const b=document.createElement('button');b.type='button';b.textContent=cta;Object.assign(b.style,{justifySelf:'center',background:'#bde9ba',color:'#13271f',padding:'10px 22px',border:'0',borderRadius:'4px',fontWeight:'700',cursor:'pointer'});b.addEventListener('click',fn);panel.append(line,h,p,m,b);viewport.append(panel);b.focus({preventScroll:true});
    }
    function clearInput(){keys.clear();activeTouches.clear();path=[];drag=null;}
    function focusGame(){try{canvas.focus({preventScroll:true});}catch{}}
    function hideIntro(){show(ui.intro,false);}
    function enter(){
      if(phase==='finished'){newRun();return;}
      if(phase==='paused'){resume();return;}
      if(phase!=='intro')return;
      hideIntro();phase='play';previous=performance.now();focusGame();notice(levels[state.level].call,4);updateHUD();
    }
    function newRun(){
      panel?.remove();panel=null;elapsed=0;turns=0;clearInput();tune(0);phase='intro';enter();
    }
    function pause(reason=''){
      if(phase!=='play')return;phase='paused';pauseReason=reason;clearInput();
      overlay('Relay paused',reason||'The light holds its position.',levels[state.level].name+'   ·   '+clock(elapsed),'Resume',resume);updateHUD();
    }
    function resume(){
      if(phase!=='paused')return;panel?.remove();panel=null;phase='play';pauseReason='';previous=performance.now();focusGame();updateHUD();
    }
    function reset(){
      if(phase==='finished'){newRun();return;}if(phase==='transit')return;
      if(phase==='paused')resume();
      if(phase==='intro'){enter();return;}
      clearInput();tune(state.level);notice('Chamber reset. '+levels[state.level].call,3.2);focusGame();updateHUD();
    }
    function tick(dt){
      if(phase==='transit'){
        transitionT-=dt;if(transitionT<=0){if(state.level===levels.length-1){finish();}else{tune(state.level+1);phase='play';focusGame();}}return;
      }
      if(phase!=='play')return;
      const lr=Number(bindKey('ArrowRight'))-Number(bindKey('ArrowLeft'));
      const f=Number(bindKey('KeyW')||bindKey('ArrowUp'))-Number(bindKey('KeyS')||bindKey('ArrowDown'));
      const s=Number(bindKey('KeyD'))-Number(bindKey('KeyA'));
      if(f||s||lr)path=[];
      state.yaw=facing(state.yaw+lr*1.9*dt);
      if(f||s){
        const g=dt*(bindKey('ShiftLeft')||bindKey('ShiftRight')?4.8:3.3)/Math.max(1,Math.hypot(f,s));
        move((Math.sin(state.yaw)*f+Math.cos(state.yaw)*s)*g,(Math.cos(state.yaw)*f-Math.sin(state.yaw)*s)*g);
      }else if(path.length){
        let remaining=dt*3.55;
        while(remaining>.0001&&path.length){
          const x=path[0].x-state.cam[0],z=path[0].z-state.cam[2],l=Math.hypot(x,z);
          if(l<.06){path.shift();continue;}
          const g=Math.min(remaining,l),h=Math.atan2(x,z);
          state.yaw=facing(state.yaw+clamp(facing(h-state.yaw),-dt*4.5,dt*4.5));
          const moved=move(x*g/l,z*g/l);remaining-=g;
          if(moved<.0001){path=[];break;}if(l<=g+.005)path.shift();
        }
        if(!path.length&&selectedMirror>=0){const m=state.mirrors[selectedMirror];if(dist(m,player())<=2.05)state.yaw=Math.atan2(m.x-state.cam[0],m.z-state.cam[2]);}
      }
      const bob=(!reduceMotion&&(f||s||path.length))?Math.sin(walk*6)*.025:0;
      state.cam[1]=1.66+bob;
      scan();
      if(state.exit.open&&Math.abs(state.cam[0]-state.exit.x)<.84&&state.cam[2]>=state.exit.z-.26)reach();
    }
    function updateHUD(){
      const l=levels[state.level],ready=phase==='play',lit=state.targets.filter(t=>t.lit).length;
      write('hud-stage',pad(l.id)+' / 03 · '+l.name);write('hud-count',lit+' / '+state.targets.length);write('hud-engine',engine);write('hud-clock',clock(elapsed));
      let msg=performance.now()<hintUntil?hint:'';
      if(phase==='intro')msg='Route light from the source to the receiver.';
      else if(phase==='paused')msg=pauseReason||'Paused.';
      else if(!msg&&path.length)msg='Walking to '+goalName.toLowerCase()+'…';
      else if(!msg&&state.exit.open)msg='Gate powered. Walk north through the lit arch.';
      else if(!msg&&near!==-1)msg='Mirror '+label(near)+' · E to turn +22.5° · Q to turn back.';
      else if(!msg)msg='Approach a mirror, or tap it on the map to walk there.';
      write('hud-hint',msg);
      if(ui.rotate){ui.rotate.disabled=!ready||near===-1;ui.rotate.title=near<0?'Move within two meters of a mirror':'Rotate mirror '+label(near)+' by 22.5°';}
      if(ui.advance){ui.advance.disabled=!ready||!state.exit.open;ui.advance.title='Walk to the powered exit';}
      if(ui.pause){ui.pause.disabled=!ready&&phase!=='paused';ui.pause.setAttribute('aria-pressed',String(phase==='paused'));}
      if(ui.crosshair)ui.crosshair.style.opacity=ready&&format3D?(near>=0?'1':'.52'):'0';
      viewport.dataset.phase=phase;viewport.dataset.engine=format3D?'perspective':'tactical';viewport.dataset.power=state.exit.open?'on':'off';
    }
    function dimensions(c,large){
      const r=c.getBoundingClientRect(),w=r.width||c.clientWidth||1,h=r.height||c.clientHeight||1,dpr=Math.min(window.devicePixelRatio||1,large?1.75:2);
      const ww=Math.max(1,Math.round(w*dpr)),hh=Math.max(1,Math.round(h*dpr));
      if(c.width!==ww)c.width=ww;if(c.height!==hh)c.height=hh;
      const k=Math.min(w/(large?20:18),h/(large?25.7:24.2));
      return {w,h,dpr,k,cx:w*.5,cy:h*.5};
    }
    function drawPlan(c,g,large){
      if(!c||!g)return;
      const {w,h,dpr,k,cx,cy}=dimensions(c,large);if(k<.1)return;
      const X=x=>cx+x*k,Z=z=>cy-z*k;
      g.setTransform(dpr,0,0,dpr,0,0);g.clearRect(0,0,w,h);
      const rect=(x,y,rw,rh,col)=>{g.fillStyle=col;g.fillRect(x,y,rw,rh);};
      const stroke=(color,width,points,close=false)=>{g.beginPath();g.strokeStyle=color;g.lineWidth=width;
        points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));if(close)g.closePath();g.stroke();};
      const dot=(x,y,r,fill,line=null,sw=1)=>{g.beginPath();g.arc(x,y,r,0,TAU);if(fill){g.fillStyle=fill;g.fill();}if(line){g.strokeStyle=line;g.lineWidth=sw;g.stroke();}};
      const text=(t,x,y,n,col,align='left')=>{g.font='500 '+n+'px ui-monospace, SFMono-Regular, Consolas, monospace';g.textAlign=align;g.fillStyle=col;g.fillText(t,x,y);};
      if(large){
        const grad=g.createRadialGradient(cx,cy,0,cx,cy,Math.max(w,h)*.75);grad.addColorStop(0,'#122d30');grad.addColorStop(1,'#051013');rect(0,0,w,h,grad);
        g.lineWidth=.6;g.strokeStyle='#173235';g.beginPath();
        for(let x=cx%k;x<w;x+=k){g.moveTo(x,0);g.lineTo(x,h);}for(let y=cy%k;y<h;y+=k){g.moveTo(0,y);g.lineTo(w,y);}g.stroke();
        if(w>610&&h>260){text('S / R',22,h*.56,12,'#779991');text('N ↑',w-22,h*.56,12,'#779991','right');}
      }else rect(0,0,w,h,'#0e1a1c');
      const ax=X(-8),ay=Z(11),ww=16*k,hh=22*k;
      rect(ax,ay,ww,hh,large?'#112226':'#142325');g.lineWidth=1;g.strokeStyle=large?'#46665e':'#47615c';g.strokeRect(ax,ay,ww,hh);
      g.beginPath();g.strokeStyle=large?'#253b3c':'#203533';g.lineWidth=large?.8:.6;
      for(let x=-6;x<8;x+=2){g.moveTo(X(x),ay);g.lineTo(X(x),ay+hh);}for(let z=-10;z<11;z+=2){g.moveTo(ax,Z(z));g.lineTo(ax+ww,Z(z));}g.stroke();
      if(large&&k>9){
        g.fillStyle='#55746b';for(let x=-7;x<=7;x+=2){for(let z=-10;z<=10;z+=2){g.fillRect(X(x)-.8,Z(z)-.8,1.6,1.6);}}
        for(let z=-8;z<=8;z+=4){rect(ax-1,Z(z)-.36*k,3,.72*k,'#72887a');rect(ax+ww-2,Z(z)-.36*k,3,.72*k,'#72887a');}
      }
      const gateColor=state.exit.open?'#a0ffd1':'#d58b65';
      stroke(gateColor,large?2.6:1.6,[[X(-1.1),Z(10.05)],[X(-1.1),Z(10.6)],[X(1.1),Z(10.6)],[X(1.1),Z(10.05)]]);
      if(large&&k>10)text('EXIT',X(0),Z(10.7)-5,9,gateColor,'center');
      if(path.length){
        g.setLineDash([2,3]);stroke('#a6b4a0',1,[[X(state.cam[0]),Z(state.cam[2])],...path.map(p=>[X(p.x),Z(p.z)])]);g.setLineDash([]);
      }
      for(const b of state.beams){
        const arr=[[X(b.x1),Z(b.z1)],[X(b.x2),Z(b.z2)]];
        if(large){stroke('rgba(95,255,219,.10)',7,arr);stroke('rgba(95,255,219,.23)',3,arr);}stroke('#7ff2d3',large?1.7:1.15,arr);
      }
      state.emitters.forEach((p,i)=>{const x=X(p.x),y=Z(p.z),r=Math.max(large?4:1.8,k*.30);
        rect(x-r,y-r,2*r,2*r,'#77e8c6');rect(x-r*.4,y-r*.4,r*.8,r*.8,'#123d35');
        if(large&&k>11)text('S'+(i+1),x,y+r+13,9,'#a7cdba','center');});
      state.targets.forEach((p,i)=>{const x=X(p.x),y=Z(p.z),r=Math.max(large?5:2.5,k*.39),col=p.lit?'#a3ffbe':'#eeab72';
        if(p.lit&&large)dot(x,y,r*1.8,'rgba(132,255,166,.10)');
        stroke(col,large?2:1.35,[[x,y-r],[x+r,y],[x,y+r],[x-r,y]],true);if(p.lit)dot(x,y,r*.44,col);
        if(large&&k>11)text('R'+(i+1),x,y+r+13,9,col,'center');});
      state.mirrors.forEach((p,i)=>{const x=X(p.x),y=Z(p.z),r=.9*k,tx=Math.cos(p.angle)*r,tz=-Math.sin(p.angle)*r;
        const col=i===near&&phase==='play'?'#ffe1a2':'#d6e6e1';
        dot(x,y,Math.max(large?4:2.5,r*.8),large?'#1d3536':'#243633',large?'#4d6c63':null);
        stroke(col,large?3:1.6,[[x-tx,y-tz],[x+tx,y+tz]]);
        if(large&&k>11)text(label(i),x+r+3,y-4,10,col);});
      const x=X(state.cam[0]),y=Z(state.cam[2]),r=Math.max(large?4:3,k*.38);
      g.save();g.translate(x,y);g.rotate(state.yaw);g.fillStyle='#f5e0a3';g.beginPath();
      g.moveTo(0,-r*1.7);g.lineTo(r,r);g.lineTo(0,r*.60);g.lineTo(-r,r);g.closePath();g.fill();g.restore();
    }
    function mapPick(event,large=false){
      if(phase!=='play')return;
      const c=large?canvas:map,{cx,cy,k}=dimensions(c,large),r=c.getBoundingClientRect();
      const x=(event.clientX-r.left-cx)/k,z=-(event.clientY-r.top-cy)/k;
      if(x< -8.9||x>8.9||z< -11.8||z>11.8)return;
      const tap=point(x,z);let closest=Math.max(.95,Math.min(1.7,8/k)),i=-1;
      state.mirrors.forEach((m,j)=>{const d=dist(m,tap);if(d<closest){closest=d;i=j;}});
      if(i>=0){selectedMirror=i;if(dist(state.mirrors[i],player())<=2.05){scan();rotate();}else route(state.mirrors[i].x,state.mirrors[i].z,'mirror '+label(i));return;}
      selectedMirror=-1;
      if(dist(tap,state.exit)<1.55&&state.exit.open){advance();return;}
      route(clamp(x,-7.5,7.5),clamp(z,-10.5,10.5));
    }
    function fallback(){
      if(tactical||closed)return;
      renderer?.destroy?.();renderer=null;
      // A canvas that acquired a 3D context cannot acquire a 2D one.
      const fresh=canvas.cloneNode(false);canvas.replaceWith(fresh);canvas=fresh;
      canvas.tabIndex=0;format3D=false;engine='Tactical / 2D';try{tactical=canvas.getContext('2d');}catch{}
      updateHUD();
    }
    async function startRenderer(){
      if(!window.SableRenderer?.create){fallback();return;}
      const ticket=++epoch;const timeout=setTimeout(()=>{if(!renderer&&ticket===epoch){epoch++;fallback();}},12000);
      try{
        const r=await window.SableRenderer.create(canvas,{sealUrl:window.SABLE_SEAL});
        if(ticket!==epoch||closed){r?.destroy?.();return;}
        if(!r||typeof r.draw!=='function')throw Error('No graphics pipeline');
        renderer=r;engine=r.kind||'Perspective';format3D=true;updateHUD();
      }catch{if(ticket===epoch)fallback();}finally{clearTimeout(timeout);}
    }
    function frame(now){
      if(closed)return;
      const real=Math.max(0,(now-previous)/1000);previous=now;
      if(phase==='play')elapsed+=real;
      // Substeps preserve navigation speed during moderately slow render frames.
      let remaining=Math.min(real,.32);while(remaining>.00001){const d=Math.min(.04,remaining);tick(d);remaining-=d;}
      state.time=reduceMotion?0:now/1000;
      if(renderer){try{renderer.draw(state);}catch{fallback();}}
      if(tactical)drawPlan(canvas,tactical,true);
      drawPlan(map,mapContext,false);updateHUD();anim=requestAnimationFrame(frame);
    }
    button('begin',enter);button('pause',()=>phase==='paused'?resume():pause());
    button('rotate',()=>rotate());button('reset',reset);button('advance',advance);
    const gameKeys=new Set(['KeyW','KeyA','KeyS','KeyD','KeyE','KeyQ','ArrowLeft','ArrowRight','ArrowUp','ArrowDown','ShiftLeft','ShiftRight','Escape','KeyP']);
    window.addEventListener('keydown',e=>{
      if(e.altKey||e.ctrlKey||e.metaKey||e.target?.matches?.('input,textarea,select,[contenteditable=true]'))return;
      if(!gameKeys.has(e.code)||phase==='intro'||phase==='finished')return;
      if((e.code==='Escape'||e.code==='KeyP')&&!e.repeat){e.preventDefault();if(phase==='paused')resume();else pause();return;}
      if(phase!=='play')return;e.preventDefault();keys.add(e.code);
      if(!e.repeat&&(e.code==='KeyE'||e.code==='KeyQ'))rotate(e.code==='KeyQ'||e.shiftKey?-1:1);
    });
    window.addEventListener('keyup',e=>keys.delete(e.code));
    window.addEventListener('blur',()=>{clearInput();if(phase==='play')pause('Window focus changed.');});
    document.addEventListener('visibilitychange',()=>{if(document.hidden){clearInput();if(phase==='play')pause('The relay was left on standby.');}});
    if(map){
      map.style.touchAction='none';map.title='Floor plan • tap a mirror to approach it, tap again to turn • tap the gate to walk there';
      map.setAttribute('aria-label','Interactive floor plan. Tap a mirror to approach it, then tap again to rotate.');
      map.addEventListener('click',e=>mapPick(e));
    }
    const onButtons=ui.touch?.querySelectorAll('[data-key]')||[];
    for(const el of onButtons){
      el.style.touchAction='none';
      el.addEventListener('pointerdown',e=>{if(phase!=='play')return;e.preventDefault();activeTouches.set(e.pointerId,el.dataset.key);el.setPointerCapture?.(e.pointerId);el.setAttribute('data-down','true');});
      const up=e=>{activeTouches.delete(e.pointerId);el.removeAttribute('data-down');};
      el.addEventListener('pointerup',up);el.addEventListener('lostpointercapture',up);el.addEventListener('pointercancel',up);
    }
    viewport.addEventListener('pointerdown',e=>{
      if(e.target!==canvas||phase!=='play'||e.button!==0)return;
      e.preventDefault();focusGame();drag={id:e.pointerId,x:e.clientX,y:e.clientY,span:0};canvas.setPointerCapture?.(e.pointerId);
    });
    viewport.addEventListener('pointermove',e=>{
      if(!drag||e.pointerId!==drag.id||phase!=='play')return;
      const dx=e.clientX-drag.x,dy=e.clientY-drag.y;drag.span+=Math.abs(dx)+Math.abs(dy);drag.x=e.clientX;drag.y=e.clientY;
      if(format3D){path=[];const ratio=e.pointerType==='touch'?.007:.004;state.yaw=facing(state.yaw+dx*ratio);state.pitch=clamp(state.pitch-dy*ratio,-1.08,.98);}
    });
    viewport.addEventListener('pointerup',e=>{
      if(!drag||e.pointerId!==drag.id)return;
      if(drag.span<8&&!format3D)mapPick(e,true);
      drag=null;
    });
    viewport.addEventListener('pointercancel',()=>drag=null);
    viewport.addEventListener('webglcontextlost',e=>{e.preventDefault();epoch++;fallback();},true);
    canvas.tabIndex=0;canvas.style.touchAction='none';tune(0);updateHUD();
    ROOT.SableGame=Object.freeze({inspect:()=>({phase,engine,elapsed,turns,stageTurns,near,pathLength:path.length,state:JSON.parse(JSON.stringify(state))})});
    startRenderer();anim=requestAnimationFrame(frame);
    window.addEventListener('pagehide',e=>{if(!e.persisted){closed=true;epoch++;cancelAnimationFrame(anim);renderer?.destroy?.();}},{once:true});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',mount,{once:true});else mount();
})();
