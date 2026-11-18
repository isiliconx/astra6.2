/* Type-1 MIDI, 480 pulses per quarter; concert pitch, one track per desk. */
(()=>{'use strict';
 const be=(v,n)=>Array.from({length:n},(_,i)=>(v>>>(8*(n-1-i)))&255);
 const ascii=s=>Array.from(s,x=>x.charCodeAt(0)&127),vlq=n=>{n=Math.max(0,Math.trunc(n));const a=[n&127];while(n>>>=7)a.unshift((n&127)|128);return a};
 const chunk=(k,bytes)=>[...ascii(k),...be(bytes.length,4),...bytes], text=(s)=>[255,3,...vlq(s.length),...ascii(s)];
 const trk=events=>{events.sort((a,b)=>a[0]-b[0]||a[1]-b[1]);let pos=0;const bytes=[];for(const [at,,msg] of events){bytes.push(...vlq(at-pos),...msg);pos=at}bytes.push(0,255,47,0);return chunk('MTrk',bytes)};
 const gm={violin:40,viola:41,cello:42,flute:73,clarinet:71,horn:60,timpani:47};
 window.OrchestraMIDI={encode(run,stageIndex){const st=typeof stageIndex==="object"?stageIndex:run.stages[stageIndex],parts=run.parts,tempo=Math.round(6e7/st.bpm);
 const markers=(st.markers||[]).map(m=>[Math.round(m.beat*480),4,[255,6,...vlq(m.title.length),...ascii(m.title)]]);const con=trk([[0,0,text('Convergence '+run.seed+' - '+st.title)],[0,1,[255,81,3,...be(tempo,3)]],[0,2,[255,88,4,4,2,24,8]],...markers]);
 const out=[...chunk('MThd',[0,1,...be(parts.length+1,2),1,224]),...con];for(const [ch,p] of parts.entries()){
 const ev=[[0,0,text(p.name)],[0,1,[192|ch,gm[p.id]??0]]];for(const e of st.events)if(e.part===p.id){const t=Math.round(e.t*480),end=Math.max(t+1,Math.round((e.t+e.d)*480));ev.push([t,3,[144|ch,e.p,Math.max(1,Math.min(127,Math.round(e.v*127)))]],[end,2,[128|ch,e.p,0]])}out.push(...trk(ev))}return new Uint8Array(out)}};
})();
