// Lacquer Harp · self-contained, gesture-gated physical-model instrument.
(() => {
  'use strict';
  const N=13, tau=2*Math.PI, sin=Math.sin, cos=Math.cos;
  const notes=[48,50,52,55,57,60,62,64,67,69,72,74,76];
  const names=['C3','D3','E3','G3','A3','C4','D4','E4','G4','A4','C5','D5','E5'];
  const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
  const xAt=i=>.13+i*.74/(N-1);
  const shoulder=u=>.14+.38*(.19*u+.81*u*u);
  const bridge=u=>.79-.055*Math.sin(Math.PI*u)+.011*u;
  const f=i=>440*Math.pow(2,(notes[i]-69)/12);
  const now=()=>performance.now()*.001;
  function tone(s,i,ring,along,when){
    const a=s.harpAudio;if(!a||!s.harpOut)return;
    // A fractional-delay Karplus–Strong loop: the first period is a displaced
    // triangular string. The first-order averaging filter models bridge loss.
    const sr=a.sampleRate, freq=f(i), len=sr/freq-.5, n=Math.floor(len), frac=len-n;
    const L=n+4, loop=new Float32Array(L), dur=ring*1.08, buf=a.createBuffer(1,Math.ceil(sr*dur),sr);
    const out=buf.getChannelData(0), damp=Math.pow(.002,1/(ring*freq));
    const pick=.11+.35*along;let prev=0,idx=0;
    for(let k=0;k<L;k++){let u=(k%Math.max(2,Math.round(len)))/len;loop[k]=.42*((u<pick?u/pick:(1-u)/(1-pick))*2-1);}
    for(let k=0;k<out.length;k++){
      const a0=(idx+L-n)%L,a1=(a0+L-1)%L;
      const y=loop[a0]*(1-frac)+loop[a1]*frac;
      loop[idx]=(y+prev)*.5*damp;prev=y;idx=(idx+1)%L;
      out[k]=y*Math.min(k/(sr*.0025),1)*Math.min(1,(out.length-k)/(sr*.025));
    }
    const src=a.createBufferSource();src.buffer=buf;src.connect(s.harpOut);
    s.harpVoices.add(src);src.onended=()=>{src.disconnect();s.harpVoices?.delete(src)};
    // Keep repeated fast strums bounded.
    if(s.harpVoices.size>32){const old=s.harpVoices.values().next().value;s.harpVoices.delete(old);try{old.stop()}catch(_){}}
    src.start(when);
  }
  function arm(s){
    const AC=window.AudioContext||window.webkitAudioContext;if(!AC)return;
    try{
      if(!s.harpAudio){const a=new AC();s.harpAudio=a;s.harpOut=a.createGain();s.harpOut.gain.value=.35;
        const limiter=a.createDynamicsCompressor();limiter.threshold.value=-14;limiter.ratio.value=8;
        s.harpOut.connect(limiter);limiter.connect(a.destination);s.harpVoices=new Set()}
      // Only a real canvas press may call arm().
      if(s.harpAudio.state!=='running')s.harpAudio.resume().catch(()=>{});
    }catch(_){}
  }
  function indexAt(x,y){
    const i=clamp(Math.round((x-.13)/.74*(N-1)),0,N-1),u=i/(N-1);
    return Math.abs(x-xAt(i))<.74/(N-1)*.58&&y>=shoulder(u)-.035&&y<=bridge(u)+.058?i:-1;
  }
  function mute(s){if(!s.harpAudio)return;
    for(const node of s.harpVoices){try{node.stop()}catch(_){}}s.harpVoices.clear();
  }
  function body(c){c.beginPath();c.moveTo(.087,.125);c.bezierCurveTo(.39,.086,.62,.314,.913,.507);
    c.bezierCurveTo(.936,.525,.947,.547,.944,.595);c.lineTo(.927,.826);
    c.bezierCurveTo(.922,.886,.878,.898,.837,.882);c.bezierCurveTo(.58,.805,.39,.829,.165,.88);
    c.bezierCurveTo(.091,.902,.053,.84,.057,.775);c.lineTo(.057,.221);c.quadraticCurveTo(.056,.145,.087,.125);c.closePath();}
  function curve(c,fn,col,wd,yoff=0){
    c.beginPath();for(let j=0;j<=140;j++){let q=j/140,x=.09+.82*q,y=fn((x-.13)/.74)+yoff;j?c.lineTo(x,y):c.moveTo(x,y)}
    c.strokeStyle=col;c.lineWidth=wd;c.stroke();
  }
  function plaque(c,x,y,r){
    c.save();c.translate(x,y);c.scale(1,1.55);
    for(let n=5;n>0;n--){c.fillStyle=['#131515','#ac8354','#342420','#ae8659','#2b2220'][n-1];
      c.beginPath();c.arc(0,0,r*(.72+n*.055),0,tau);c.fill();}
    for(let j=0;j<16;j++){const a=j*tau/16,b=(j+1)*tau/16;c.strokeStyle='#b18a5c';c.lineWidth=.0009;
      c.beginPath();c.moveTo(r*.25*cos(a),r*.25*sin(a));c.quadraticCurveTo(r*.96*cos(a+.34),r*.96*sin(a+.34),r*.73*cos(b),r*.73*sin(b));c.quadraticCurveTo(r*.75*cos(a),r*.75*sin(a),r*.25*cos(a),r*.25*sin(a));c.stroke();}
    c.fillStyle='#d5ae70';c.beginPath();c.arc(0,0,.004,0,tau);c.fill();c.restore();
  }
  function label(c,txt,x,y,size,color,align='left',font='monospace'){
    c.fillStyle=color;c.font=size+'px '+font;c.textAlign=align;c.textBaseline='middle';c.fillText(txt,x,y);
  }
  window.ASTRA.push({
    id:'aeolian-harp',title:'Lacquer Harp',category:'Signals',
    description:'Thirteen strings over an engraved sound hole. Sweep a chord from the copper bass strings to the bright treble.',
    method:'A triangular pluck travels around a fractional-delay Karplus–Strong loop. Each pass through the virtual bridge loses energy and softens the high harmonics. The strings follow a C major pentatonic scale.',
    gesture:'Tap a string or drag across several to strum. Pluck near the top for a brighter attack. Sound starts only when you play.',
    params:[{name:'Ring (s)',min:.4,max:3.2,step:.1,value:1.8},{name:'Mute (0 off · 1 on)',min:0,max:1,step:1,value:0}],
    onInput(type,s,p){
      if(type==='param'){if(+p[1])mute(s);return;}
      if(type==='up'){s.harpPrev=null;s.harpHeld=false;return;}
      if(type!=='down'&&type!=='move')return;
      const ptr=s.pointer||{},x=ptr.x,y=ptr.y,i=indexAt(x,y);
      if(type==='down'){s.harpPrev=null;s.harpHeld=true;if(+p[1]===0)arm(s);}
      if(!s.harpHeld||(type==='move'&&!ptr.down))return;
      const last=s.harpPrev;s.harpPrev={x,y,i};if(i<0||last?.i===i)return;
      const indices=[];
      if(last&&last.i>=0){const step=Math.sign(i-last.i);for(let j=last.i+step;j!==i+step;j+=step)indices.push(j)}
      else indices.push(i);
      s.harpHits=s.harpHits||new Array(N).fill(-1e6);
      const base=s.harpAudio?.currentTime||0;
      indices.forEach((j,k)=>{const u=j/(N-1),h=clamp((y-shoulder(u))/(bridge(u)-shoulder(u)),0,1),delta=.009*k;
        s.harpHits[j]=now()+delta;s.harpLast=j;
        if(!+p[1])tone(s,j,clamp(+p[0]||1.8,.4,3.2),h,base+delta);
      });
    },
    cleanup(s){if(!s)return;mute(s);const a=s.harpAudio;s.harpAudio=null;s.harpOut=null;s.harpPrev=null;s.harpHeld=false;
      if(a&&a.state!=='closed')a.close().catch(()=>{});
    },
    draw(c,w,h,t,p,s){
      const T=now();c.save();c.scale(w,h);
      const bg=c.createLinearGradient(0,0,1,.65);bg.addColorStop(0,'#17262a');bg.addColorStop(1,'#091517');c.fillStyle=bg;c.fillRect(0,0,1,1);
      // Engraved furniture, rather than a UI keyboard.
      c.save();c.translate(0,.023);body(c);c.fillStyle='#070e10';c.fill();c.restore();
      body(c);const wood=c.createLinearGradient(.05,.08,.93,.76);
      wood.addColorStop(0,'#a35736');wood.addColorStop(.25,'#8b422e');wood.addColorStop(.66,'#673227');wood.addColorStop(1,'#411f20');c.fillStyle=wood;c.fill();
      c.save();c.clip();
      for(let j=0;j<115;j++){const y=.09+j*.0073;c.beginPath();for(let k=0;k<=50;k++){const x=k/50,yy=y+.019*sin(x*7.1+j*.056)+.006*cos(17*x+j*.16);k?c.lineTo(x,yy):c.moveTo(x,yy)}
        c.strokeStyle=j%3?'rgba(249,172,104,.08)':'rgba(30,13,15,.17)';c.lineWidth=.0009;c.stroke();}
      body(c);c.strokeStyle='#241b1b';c.lineWidth=.027;c.stroke();body(c);c.strokeStyle='#c29861';c.lineWidth=.018;c.stroke();body(c);c.strokeStyle='#5d382c';c.lineWidth=.012;c.stroke();
      plaque(c,.435,.495,.109);
      curve(c,bridge,'#301e1b',.022,.008);curve(c,bridge,'#b28557',.005,-.001);c.restore();
      const hasPoint=s.pointer&&Number.isFinite(s.pointer.x);let hover=hasPoint&&s.harpPrev?indexAt(s.pointer.x,s.pointer.y):-1;
      for(let j=0;j<N;j++){const u=j/(N-1),x=xAt(j),yt=shoulder(u),yb=bridge(u),age=T-(s.harpHits?.[j]??-1e6),env=age>=0?Math.exp(-4*age/(+p[0]||1.8)):0;
        const tonecol=j<5?'#d89d68':j<9?'#f1cb9d':'#d9ddce';
        for(const y of [yt,yb]){c.beginPath();c.ellipse(x,y+.004,.007,.012,0,0,tau);c.fillStyle='#35271f';c.fill();c.beginPath();c.ellipse(x,y,.0048,.008,0,0,tau);c.fillStyle='#b89662';c.fill();c.beginPath();c.moveTo(x-.0028,y+.002);c.lineTo(x+.0027,y-.002);c.strokeStyle='#483428';c.lineWidth=.0015;c.stroke();}
        if(env>.025){c.beginPath();c.ellipse(x,yt,.013+env*.008,.018+env*.012,0,0,tau);c.strokeStyle='rgba(255,222,155,'+env*.68+')';c.lineWidth=.0012;c.stroke();}
        for(let pass=0;pass<2;pass++){c.beginPath();for(let k=0;k<=38;k++){const q=k/38,dx=env<.005?0:.011*env*sin(q*Math.PI)*sin(34*age+j+4*q);
            const xx=x+dx+(pass?0:.0035),yy=yt+q*(yb-yt)+(pass?0:.007);k?c.lineTo(xx,yy):c.moveTo(xx,yy);}
          c.strokeStyle=pass?(env>.4||hover===j?'#fff1bd':tonecol):'rgba(28,16,17,.75)';c.lineWidth=pass?(.0026-.0013*u):.0028;c.stroke();}
      }
      c.restore();
      const fs=clamp(w*.012,7,12);label(c,'C MAJOR  /  PENTATONIC',.07*w,.058*h,fs,'#c6bca1');
      const last=s.harpLast;label(c,p[1]?'MUTED':last==null?'13 STRINGS':names[last]+'   '+f(last).toFixed(1)+' Hz',.93*w,.058*h,fs,'#d2c6a4','right');
      for(let j=0;j<N;j++){const x=xAt(j)*w,y=(bridge(j/(N-1))+.045)*h;label(c,names[j],x,y,fs*.90,'#f0d2a7','center');}
    }
  });
})();
