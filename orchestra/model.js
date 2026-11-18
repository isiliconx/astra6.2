/* The Unwritten Symphony. Deterministic, dependency-free symbolic music model.
   Training examples are generated etudes, not recordings or quotations.
   The arrangement, phrase shape and cadential constraints are authored; the
   browser fits the pitch, rhythm, harmonic and interval distributions. */
(function (root, factory) {
  const api = factory();
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  if (root) root.OrchestraModel = api;
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';
  const SCALE = [0,2,4,5,7,9,11], KEYS = [[60,'C'],[62,'D'],[63,'E♭'],[65,'F'],[67,'G'],[58,'B♭']];
  const PARTS = [
    ['violin','Violins','Vln.','#f3b862'], ['viola','Violas','Vla.','#d98460'],
    ['cello','Cellos','Vc.','#d26379'], ['flute','Flute','Fl.','#8addd2'],
    ['clarinet','Clarinet','Cl.','#89afe6'], ['horn','Horns','Hn.','#e0c16c'],
    ['timpani','Timpani','Timp.','#b99bdd']
  ].map(([id,name,short,color])=>({id,name,short,color}));
  const mod=(a,n)=>((a%n)+n)%n, clip=(v,a,b)=>Math.max(a,Math.min(b,v));
  const pitch=(root,d)=>root+12*Math.floor(d/7)+SCALE[mod(d,7)];
  const choose=(r,a)=>a[Math.floor(r()*a.length)];
  function hash(s) { let x=2166136261; for(const c of String(s)) x=Math.imul(x^c.charCodeAt(0),16777619); return x>>>0; }
  function rng(seed) { let a=hash(seed); return ()=>{ let t=a=(a+0x6D2B79F5)>>>0; t=Math.imul(t^t>>>15,t|1); t^=t+Math.imul(t^t>>>7,t|61); return ((t^t>>>14)>>>0)/4294967296; }; }
  function draw(r,weights) { let k=r()*weights.reduce((a,b)=>a+b,0); for(let i=0;i<weights.length;i++) if((k-=weights[i])<0)return i; return weights.length-1; }
  function near(degs,target,lo=-21,hi=22) {
    let best=null;for(let i=lo;i<=hi;i++)if(degs.includes(mod(i,7)) && (best===null || Math.abs(i-target)<Math.abs(best-target)))best=i;
    return best;
  }
  // Each cell fills half a 4/4 bar. Integers are quarter-beat ticks.
  const CELLS=[[4,4],[6,2],[2,2,4],[4,2,2],[2,2,2,2],[8],[3,1,4],[4,3,1]];
  const H=['I','I6','ii','IV','V','V7','vi','Cad64'];
  const TONES=[[0,2,4],[0,2,4],[1,3,5],[3,5,0],[4,6,1],[4,6,1,3],[5,0,2],[0,2,4]];
  const BASS=[0,2,1,3,4,4,5,4];
  // Local teaching grammar: imperfect cadences at the midpoint, authentic at the close.
  const FOLLOW=[[0,1,1,2,3,4,6],[2,3,4,6],[4,5,7],[1,2,4,7],[0,1,6],[0,0,6],[1,2,3],[4,5]];
  function etude(r) {
    const bars=[]; let old=0, deg=4, dir=1;
    for(let b=0;b<8;b++) {
      const h=b===0||b===7?0:b===3?4:b===6?5:choose(r,FOLLOW[old]); old=h;
      const cells=[],notes=[];
      for(let half=0;half<2;half++) {
        const ci=draw(r,half===0?[5,4,5,7,3,1,2,1]:[4,3,6,4,2,4,2,2]); cells.push(ci);
        let tick=half*8;
        for(let k=0;k<CELLS[ci].length;k++) {
          const d=CELLS[ci][k];
          if(r()<.34 || deg>=11 || deg<=1)dir=deg>=11?-1:deg<=1?1:-dir;
          let aim=clip(deg+dir*choose(r,[0,1,1,1,1,2,2,3]),0,13);
          if(!k)aim=near(TONES[h],aim,0,13);
          deg=aim;notes.push({deg,tick,len:d});tick+=d;
        }
      }
      bars.push({h,cells,notes});
    }
    return bars;
  }
  const counts=(n,p=0)=>Array(n).fill(p);
  const table=(n,k,p)=>Array.from({length:n},()=>counts(k,p));
  function learn(corpus) {
    const m={pc:counts(12,.05),rh:table(2,8,.4),hm:table(8,8,.5),step:table(6,13,.7),notes:0};
    for(const bars of corpus) {
      let prev=null,dir=0,old=null;
      for(const b of bars) {
        if(old!==null)m.hm[old][b.h]++;old=b.h;
        b.cells.forEach((c,i)=>m.rh[i][c]++);
        for(const n of b.notes) {
          m.notes++;m.pc[SCALE[n.deg%7]]++;
          if(prev!==null){let z=n.deg-prev; m.step[(Math.sign(dir)+1)*2+ +(n.tick%8===0)][clip(z,-6,6)+6]++;dir=z;}
          prev=n.deg;
        }
      }
    }
    return m;
  }
  function validation(m,corpus) {
    const accum={pitch:[0,0,12],rhythm:[0,0,8],harmony:[0,0,8],motion:[0,0,13]};
    function obs(k,row,x){accum[k][0]-=Math.log2(row[x]/row.reduce((a,b)=>a+b));accum[k][1]++;}
    for(const bars of corpus){
      let prev=null,dir=0,old=null;
      for(const b of bars){
        if(old!==null)obs('harmony',m.hm[old],b.h);old=b.h;
        b.cells.forEach((c,i)=>obs('rhythm',m.rh[i],c));
        for(const n of b.notes){obs('pitch',m.pc,SCALE[n.deg%7]);
          if(prev!==null){const z=n.deg-prev;obs('motion',m.step[(Math.sign(dir)+1)*2+ +(n.tick%8===0)],clip(z,-6,6)+6);dir=z;}prev=n.deg;}
      }
    }
    return Object.fromEntries(Object.entries(accum).map(([name,[sum,n,k]])=>[name,{observations:n,uniformBits:Math.log2(k),fittedBits:sum/n}]));
  }
  function add(out,part,t,d,p,v){out.push({part,t:+t.toFixed(3),d:+d.toFixed(3),p,v:+clip(v,.04,.98).toFixed(3)});}
  // One identity for the entire run. The form specifies the turn (leap, then
  // recoil); the teacher's tables supply its particular size, sign and rhythm.
  function seedCell(r,m) {
    const candidates=[-4,-3,-2,2,3,4], row=m.step[2];
    const leap=candidates[draw(r,candidates.map(k=>row[k+6]))];
    const rhythm=draw(r,m.rh[0].map((w,i)=>CELLS[i].length===3?w:0));
    const deg=[0,leap,leap-Math.sign(leap)], ticks=CELLS[rhythm].slice();
    return deg.map((d,i)=>({deg:d,ticks:ticks[i]}));
  }
  const mark=(event,slot,occurrence)=>Object.assign(event,{cellSlot:slot,cellOccurrence:occurrence});
  // The recomposed backgrounds are deliberately separate from the cell. Marked
  // attacks keep their identity, so a listener can follow the same thread.
  function sketches(seed,m,key,stage,cell){
    const out=[],pieces=['violin','viola','cello','flute','clarinet'];
    const r=rng('field:'+seed), formR=rng('field cells:'+seed), carrier=rng('carrier:'+seed);
    function tonal(r,aim){
      // Condition the pitch histogram on proximity to an observed height.
      const offsets=[-2,-1,0,1,2], w=offsets.map(d=>m.pc[mod(aim+d-key,12)]*[1,4,12,4,1][d+2]);
      return aim+offsets[draw(r,w)];
    }
    for(let half=0;half<16;half++){
      const isCell=half%4===0, base=half*2;
      const pattern=isCell?cell.map(n=>n.ticks):CELLS[draw(formR,m.rh[half%2])];
      let tick=0;
      for(let j=0;j<pattern.length;j++){
        const q=pattern[j]/4, thread=isCell?carrier:r;
        const skew=(.06+thread()*.37)*q, start=base+tick/4+(stage<2?skew:0);
        const octave=choose(thread,[-1,0,0,1]);
        const aim=isCell?pitch(key,7+cell[j].deg)+octave*12+choose(thread,[-2,-1,1,2]):key+octave*12+Math.floor(thread()*12);
        const fitted=tonal(thread,aim), noise=thread();
        const part=isCell?'violin':pieces[(half+j)%pieces.length];
        const p=stage===0?aim:fitted;
        add(out,part,start,q*(stage<2?.36+.15*noise:.82),p,(isCell?.59:.37)+noise*.13);
        if(isCell)mark(out.at(-1),j,half/4);
        tick+=pattern[j];
      }
    }
    return out;
  }
  function harmonizeCell(events,root,hs,cell){
    for(let b=0;b<hs.length;b+=2){
      const ct=TONES[hs[b]],anchor=near(ct,7,4,10);let tick=0;
      cell.forEach((n,j)=>{
        add(events,'violin',b*4+tick/4,n.ticks/4*.85,pitch(root,near(ct,anchor+n.deg,0,16)),.66);
        mark(events.at(-1),j,b/2);tick+=n.ticks;
      });
    }
  }
  // Form is constrained, not learned end-to-end. Intermediate chords use
  // fitted transition likelihoods, including the likelihood of reaching a goal.
  function bridge(r,m,start,goal,len) {
    const Z=(from,n)=>n===0?+(from===goal):m.hm[from].reduce((a,w,j)=>a+w/m.hm[from].reduce((s,x)=>s+x)*Z(j,n-1),0);
    const out=[start];for(let left=len-1;left>1;left--){let h=out[out.length-1];
      out.push(draw(r,m.hm[h].map((w,j)=>(j===7||j===5?0:1)*w*Z(j,left-1))));}
    out.push(goal);return out;
  }
  function plan(r,m,long){
    const q=bridge(r,m,0,4,4), a=[0,choose(r,[1,3,6]),5,0];
    return long?[...q,...a,6,choose(r,[1,3]),2,4,3,7,5,0]:[...q,...a];
  }
  function motif(r,m) {
    const half=draw(r,m.rh[0].map((w,i)=>[1,2,3,6].includes(i)?w:0)),
          answer=draw(r,m.rh[1].map((w,i)=>[0,2,3,4,6].includes(i)?w:0));
    let deg=choose(r,[2,4,7]),dir=1;
    const phrase=[];
    for(const ci of [half,answer]){
      let j=0;for(const ticks of CELLS[ci]){
        if(phrase.length){
          const row=m.step[(Math.sign(dir)+1)*2+ +(j===0)];
          let step=draw(r,row.map((w,i)=>Math.abs(i-6)>3?0:w*(i===6?.12:(phrase.length<3?i>6:i<6)?2.6:.7)))-6;
          dir=step;deg+=step;
        }
        phrase.push({deg,ticks});j++;
      }
    }
    const first=phrase[0].deg;return phrase.map(n=>({...n,deg:n.deg-first}));
  }
  // Viterbi voice-leading balances the fitted interval language, a transformed
  // seed motif, instrumental range, and chord-tone landings on strong beats.
  function decode(r,m,h,aims,durs,old,oldDir,finish=null) {
    let states=[{p:old,dir:oldDir,score:0,path:[]}],ticks=0;
    for(let n=0;n<aims.length;n++){
      const next=new Map(), strong=ticks%8===0, slots=[];
      for(let p=0;p<=16;p++){
        if(n===aims.length-1 && finish!==null && p!==finish)continue;
        if(strong && !TONES[h].includes(p%7))continue;
        slots.push([p,r()*.42]);
      }
      for(const s of states)for(const [p,jitter] of slots){
        const jump=p-s.p,dir=Math.sign(jump),row=m.step[(s.dir+1)*2+ +strong];
        const z=s.score+.38*Math.log(row[clip(jump,-6,6)+6]/row.reduce((a,b)=>a+b))-.77*Math.abs(p-aims[n])-.72*Math.max(0,Math.abs(jump)-3)-(n && jump===0?.48:0)+jitter;
        const code=p*3+dir+1,cur=next.get(code);
        if(!cur || z>cur.score)next.set(code,{p,dir,score:z,path:[...s.path,p]});
      }
      states=[...next.values()].sort((a,b)=>b.score-a.score).slice(0,12);ticks+=durs[n];
    }
    return states[0].path;
  }
  function theme(r,m,hs,cell){
    const B=motif(r,m), second=CELLS[draw(r,m.rh[1])]; let response=cell.at(-1).deg;
    const A=[...cell,...second.map(ticks=>{response+=choose(r,[-1,0,1]);return {ticks,deg:response};})];
    const outlines=[4,6,5,4,7,8,6,7,9,11,12,10,9,8,6,7];
    const bars=[];let pitch0=4,dir=1;
    for(let b=0;b<hs.length;b++){
      const last=b===hs.length-1, cadence=b===hs.length-2;
      const type=[0,0,1,2,0,1,1,2,1,1,0,2,0,1,2,2][b];
      const base=type===0?A:B,anchor=near(TONES[hs[b]],outlines[b],1,15);
      let lens=base.map(n=>n.ticks),aims=base.map(n=>anchor+n.deg*(b===5||b===9?-1:1)), end=null;
      if(type===2){lens=[6,2,4,4];aims=[anchor,anchor-1,anchor-2,anchor-3];}
      if(b===3 || (b===11&&hs.length===16)){lens=[4,2,2,8];aims=[8,7,6,4];end=4;}
      if(b===7&&!last){lens=[6,2,8];aims=[9,8,7];end=7;}
      if(cadence){lens=[4,2,2,4,4];aims=[8,7,6,8,6];end=6;}
      if(last){lens=[16];aims=[7];end=7;}
      // Literal entrance and recapitulation, with the next half-bar decoded
      // FROM the last fixed pitch (not concatenated after an unrelated line).
      const statement=b===0 || (b===12 && hs.length===16);
      let line;
      if(statement){
        const literal=cell.map(n=>7+n.deg),tail=decode(r,m,hs[b],aims.slice(3),lens.slice(3),literal[2],Math.sign(literal[2]-literal[1]));
        line=[...literal,...tail];
      }else line=decode(r,m,hs[b],aims,lens,pitch0,dir,end);
      let tick=0;bars.push(line.map((deg,i)=>{const n={deg,tick,len:lens[i]};if(statement&&i<3)mark(n,i,b===0?0:1);tick+=lens[i];return n;}));
      dir=Math.sign(line.length>1?line[line.length-1]-line[line.length-2]:line[0]-pitch0);
      pitch0=line[line.length-1];
    }
    return bars;
  }
  function windows(bars,n=9){
    const notes=bars.flat(); const result=[];
    for(let i=0;i<=notes.length-n;i++){
      const base=notes[i].deg;result.push(notes.slice(i,i+n).map(v=>(v.deg-base)+':'+v.len).join('/'));
    }return result;
  }
  function orchestrate(r,root,hs,line,level){
    const events=[],n=hs.length;
    const solo=n===16?['violin','violin','flute','flute','violin','violin','clarinet','clarinet','clarinet','violin','flute','flute','violin','violin','violin','violin']:Array(n).fill('violin');
    const shape=[.80,.84,.74,.70,.82,.88,.78,.72,.63,.73,.89,.83,.90,.95,.98,.92];
    const anchors={viola:-3,horn:-1,clarinet:3,flute:8};let lastBass=-7;
    for(let b=0;b<n;b++){
      const t=b*4,h=hs[b],ct=TONES[h],final=b===n-1,pnen=b===n-2,full=level===5,dyn=full?shape[b]:.8;
      const note=(id,offset,len,deg,vel,gate=.90,lead=false)=>{
        add(events,id,t+offset,len*gate,pitch(root,deg),vel*dyn);
        const e=events[events.length-1];e.len=len;if(lead)e.lead=true;
      };
      const nearest=(id,target,range=[-12,12])=>anchors[id]=near(ct,target,range[0],range[1]);
      const bass=near([BASS[h]],-11,-16,-7);
      if(final){
        note('cello',0,4,-14,.74,.97);
        note('viola',0,4,near([2],-4,-10,0),.48,.96);
        if(full){
          note('clarinet',0,4,4,.47,.95); note('flute',0,4,9,.44,.95);
          note('horn',0,4,-3,.56,.96); note('timpani',0,2,-14,.69,.80);
        }
      }else{
        // Foundation: a walking bass in transitions, open space under the winds.
        const nxt=near([BASS[hs[b+1]]],bass,-17,-5), towards=nxt>bass?1:-1;
        if(level===3 || (full && [2,3,6,7,8].includes(b))){
          note('cello',0,2,bass,.66,.94);note('cello',2,2,near([ct[2]],bass+3,-14,-3),.51,.90);
        }else if(pnen) {
          note('cello',0,2,bass,.76,.91);note('cello',2,1,bass,.67,.72);note('cello',3,1,bass,.75,.76);
        }else{
          note('cello',0,1.5,bass,.69,.9);note('cello',1.5,.5,bass+7,.45,.75);
          note('cello',2,1,near([ct[2]],bass+4,-16,-2),.56,.87);
          note('cello',3,1,Math.abs(nxt-bass)>1?nxt-towards:near(ct,(bass+nxt)/2,-16,-5),.47,.86);
        }
        lastBass=bass;
        // Inner strings trade off-beats for a flowing broken-chord texture in the development.
        const mid=nearest('viola',anchors.viola,[-8,1]),hi=near([ct[1]],0,-7,4);
        if(level===3){
          note('viola',0,4,hi,.49,.92); note('clarinet',0,4,near([ct[2]],4,-2,9),.43,.91);
        }else if(full && [8,9,10,11,13].includes(b)){
          const tones=[mid,hi,near([ct[2]],2,-4,5),hi];
          for(let i=0;i<8;i++)note('viola',i*.5,.5,tones[i%4],i%2?.34:.43,.70);
        }else{
          for(let i=0;i<4;i++)note('viola',i+.5,.5,i%2?hi:mid,.39+(i===1?.04:0),.65);
        }
        if(full){
          // Wind solos have room: no high counterline on their initial attack.
          if(solo[b]==='violin' && [1,5,9,13,14].includes(b)){
            const hiLead=line[b].at(-1).deg, a=near(ct,hiLead+2,6,14);
            note('flute',2,1,a,.48,.95);note('flute',3,.5,a-1,.43,.87);note('flute',3.5,.5,a-2,.39,.82);
          }
          if(solo[b]==='violin' && [0,4,12,13,14].includes(b)){
            const c=nearest('clarinet',anchors.clarinet,[0,6]);
            note('clarinet',0,2,c,.40,.90);note('clarinet',2,2,near(ct,c+1,0,7),.37,.87);
          }
          if(solo[b]!=='violin'){
            const inner=near(ct,line[b][0].deg-3,-1,7);
            note('violin',0,2,inner,.43,.91);
            note('violin',2.5,.5,near(ct,inner+1,0,8),.34,.77);
            note('violin',3,.75,near(ct,inner+2,0,8),.39,.83);
          }
          if([0,3,4,7,11,12,13,14].includes(b)){
            const horn=nearest('horn',anchors.horn,[-6,2]);
            note('horn',0,b===14?2:3,horn,.43,.95);
            if(b===14)note('horn',2,2,near([6],-1,-8,5),.50,.91);
          }
          if([0,7,12,14].includes(b)){
            note('timpani',0,b===14?1:2,h===4||h===5||h===7?-17:-14,.39+(b===14?.17:0),.75);
            if(b===14){note('timpani',2,1,-17,.43,.75);note('timpani',3,1,-17,.53,.80);}
          }
        }
      }
      if(level>=4){
        const sel=full?solo[b]:'violin';
        for(let i=0;i<line[b].length;i++){
          const q=line[b][i],len=q.len/4;
          const vel=.83+.055*Math.sin(Math.PI*i/line[b].length)+(q.tick===0?.04:0);
          note(sel,q.tick/4,len,q.deg,vel,final?.985:i===line[b].length-1?.84:len>=1?.94:.85,true);
          if(q.cellSlot!==undefined)mark(events.at(-1),q.cellSlot,q.cellOccurrence);
        }
      }
    }
    return events;
  }
  const metric=(label,value,detail)=>({label,value:String(value),detail});
  const pct=(x)=>Math.round(100*x)+'%';
  const fit=(x)=>x.fittedBits.toFixed(2)+' bits';
  const fitMetric=(v,name,caption)=>metric(name,fit(v),caption+' Held-out surprisal per observation; a uniform model needs '+v.uniformBits.toFixed(2)+' bits. Lower is better.');
  function build(seed=1742) {
    const keyR=rng('signature:'+seed),[root,keyName]=choose(keyR,KEYS), key=keyName+' major',bpm=choose(keyR,[104,108,112,116,120,124]);
    // Fixed training/validation split, independent of concert seed and of each other.
    const trainR=rng('atelier train 1'),valR=rng('atelier test 2');
    const train=Array.from({length:40},()=>etude(trainR)), held=Array.from({length:12},()=>etude(valR));
    const trained=learn(train), heldout=validation(trained,held);
    const corpusIndex=new Set(train.flatMap(bars=>windows(bars.map(b=>b.notes))));
    const heldIndex=new Set(held.flatMap(bars=>windows(bars.map(b=>b.notes))));
    const cell=seedCell(rng('convergence:'+seed),trained);
    const shifts=cell.map(n=>n.deg), pulse=cell.map(n=>n.ticks);
    const describeLeap=['unison','second','third','fourth','fifth'][Math.abs(shifts[1])];
    const gesture='A '+describeLeap+' '+(shifts[1]>0?'up':'down')+', then one scale step back; '+pulse.join('–')+' sixteenths.';
    const transforms=['The call is scattered in time, detuned and split across octaves.','The same attacks keep their timing but draw pitch from the fitted key.','The three attacks lock to their identifying two-beat rhythm.','Violin plays the rhythm in chord tones above the moving bass.','Violin states the exact turn, then varies it in a new eight-bar line.','The literal cell opens the new concert and returns in bar 13.'];
    const stages=[],scaleHits=e=>e.filter(n=>SCALE.includes(mod(n.p-root,12))).length, gridHits=e=>e.filter(n=>Math.abs(Math.round(n.t*4)-n.t*4)<.00001).length;
    const emit=(title,subtitle,bars,tempo,events,metrics,annotation,extra={})=>{
      events.sort((a,b)=>a.t-b.t||+(!!b.lead)-+(!!a.lead)||a.p-b.p);
      stages.push({title,subtitle,bars,beatsPerBar:4,bpm:tempo,key,tonic:root,events,metrics,annotation,transformation:transforms[stages.length],...extra});
    };
    for(let i=0;i<3;i++){
      const ev=sketches(seed,trained,root,i,cell);
      const s=scaleHits(ev),g=gridHits(ev);
      const keyMetric=metric('In key',pct(s/ev.length),s+' of '+ev.length+' sounding notes belong to '+key+'.');
      const gridMetric=metric('On grid',pct(g/ev.length),g+' of '+ev.length+' attacks land on the sixteenth-note grid.');
      if(i===0)emit('Noise','No musical rules yet',8,bpm,ev,[keyMetric,gridMetric,metric('Attacks',ev.length,'Sounding notes, including four scattered appearances of the three-attack cell.')],'Listen for three violin flecks at the opening. Octave jumps, detuning and displaced attacks hide a turn that will become the theme. The chromatic field is not pitch-corrected yet.');
      if(i===1)emit('Key','A tonal center appears',8,bpm,ev,[keyMetric,gridMetric,fitMetric(heldout.pitch,'Pitch cost','The fitted pitch-class distribution is measured on unseen etudes.')],'The timing is unchanged. The same scattered pitches are redrawn nearby using the teaching pieces’ pitch frequencies. Listen to the violin as the cloud gathers around '+key+'.');
      if(i===2)emit('Pulse','The attacks find a shared clock',8,bpm,ev,[gridMetric,keyMetric,fitMetric(heldout.rhythm,'Rhythm cost','The fitted rhythm-cell distribution is measured on unseen etudes.')],'Listen to the first three violin attacks and their return two bars later. The timing haze lifts to reveal the seed rhythm ('+pulse.join('–')+' sixteenths), chosen from the fitted cell counts; its pitches still jump between octaves.');
    }
    const hs=plan(rng('short harmony:'+seed),trained,false);
    const shell=orchestrate(rng(seed),root,hs,null,3),symbol=hs.map(h=>H[h]);
    harmonizeCell(shell,root,hs,cell);
    emit('Harmony','A bass line gives the notes somewhere to go',8,bpm,shell,[metric('Chord colors',new Set(hs).size,'Distinct chord labels in these eight bars.'),metric('Cadence',symbol.slice(-2).join(' → '),'The last two harmonic functions.'),fitMetric(heldout.harmony,'Chord cost','A fitted transition table links harmonic functions.')],'The violin keeps the three attacks but now sounds only chord tones. Listen beneath it: the cello draws a bass route from fitted chord transitions toward a designed cadence.',{chords:symbol});
    const melody=theme(rng('short theme:'+seed),trained,hs,cell),chamber=orchestrate(rng(seed),root,hs,melody,4);
    const lead=chamber.filter(e=>e.lead);
    const steps=lead.slice(1).filter((n,i)=>Math.abs(n.p-lead[i].p)<=2).length;
    emit('Melody','A motif becomes a question and an answer',8,bpm,chamber,[metric('Lead notes',lead.length,'Notes in the generated foreground line.'),metric('Close motion',pct(steps/(lead.length-1)),'Adjacent lead pitches at most two semitones apart, including repetitions.'),fitMetric(heldout.motion,'Motion cost','Previous direction and metrical accent condition the next interval.')],'The violin finally discloses the cell: '+gesture+' The rest of the line varies it under fitted interval costs and harmonic constraints.',{chords:symbol});
    let finalLine, longHs, checks, attempts=0;
    do{
      const r=rng('concert:'+seed+':'+attempts++);longHs=plan(r,trained,true);finalLine=theme(r,trained,longHs,cell);
      const w=windows(finalLine);
      checks={tested:w.length,trainingMatches:w.filter(x=>corpusIndex.has(x)).length,validationMatches:w.filter(x=>heldIndex.has(x)).length};
      if(attempts>64)throw new Error('Could not certify a fresh phrase for this seed.');
    }while(checks.trainingMatches||checks.validationMatches);
    const concert=orchestrate(rng(seed),root,longHs,finalLine,5),parts=new Set(concert.map(e=>e.part)).size;
    const alt=concert.filter(e=>e.lead).sort((a,b)=>a.t-b.t).map(e=>e.part).filter((v,i,a)=>i===0||v!==a[i-1]);
    emit('Performance','The complete chamber orchestra',16,bpm,concert,[metric('Ensemble',parts+' parts','Distinct instrumental parts in the final arrangement.'),metric('Solo handoffs',alt.length-1,'Changes of foreground instrument across the sixteen bars.'),metric('Copied runs','0 / '+checks.tested,'Nine-note lead windows matching any teaching or validation etude, allowing transposition; measured on pitch intervals and rhythm.')],'Hear the three-note signature in the first two beats. Winds take over its variations; after the development the violin gives the literal signature again at bar 13, over a different chord. The rest of this concert was generated separately from the rehearsal.',{chords:longHs.map(h=>H[h]),sections:[{bar:1,label:'Exposition'},{bar:5,label:'Answer'},{bar:9,label:'Development'},{bar:13,label:'Return'}]});
    return {seed,key,bpm,stages,parts:PARTS.map(p=>({...p})),evidence:{
      convergence:{name:'Convergence',description:'A theme is disclosed by the successive recovery of its constraints, not stated before its variations.',gesture,scaleDegrees:shifts.map(d=>d+8),degreeOffsets:shifts,ticks:pulse,checkpoints:transforms.slice(),literalBars:[1,13]},
      method:'Count-based symbolic learning with a constrained melodic decoder and a hand-authored chamber arrangement. No recordings, pretrained weights or existing compositions.',
      curriculum:'40 procedurally written eight-bar teaching etudes; 12 independently generated etudes reserved for evaluation.',
      trainingEtudes:train.length,validationEtudes:held.length,trainingNotes:trained.notes,heldout,
      novelty:{...checks,windowNotes:9,attempts,trainingWindows:corpusIndex.size,validationWindows:heldIndex.size,description:'Every contiguous nine-note lead window is compared by relative diatonic pitch and notated rhythm against both etude sets. This is not a global originality claim.'},
      constraints:'Meter, scale vocabulary, checkpoint order, phrase goals, orchestration and the final V7–I cadence are designed. Distributions and generated melodic details are fitted or sampled.'
    }};
  }
  return {build};
});
