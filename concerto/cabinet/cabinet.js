/* The musical clock lives in the score room, so leaving or entering this cabinet never reloads its recording. */
(()=>{
'use strict';
const $=id=>document.getElementById(id),clamp=(x,l=0,h=1)=>Math.min(h,Math.max(l,x)),ease=x=>(x=clamp(x),x*x*(3-2*x));
let bridge;try{bridge=window.parent!==window&&window.parent.TideCabinetBridge;}catch{}
if(!bridge){
  if(window.parent===window){const u=new URL('../',location.href);for(const [k,v] of new URL(location.href).searchParams)if(['m','bar','take'].includes(k))u.searchParams.set(k,v);u.searchParams.set('view','cabinet');u.hash='cabinet';location.replace(u);return;}
  $('status').textContent='Open the listening room to enter the theatre.';return;
}
const host=bridge.transport;const native=$('audio');native.removeAttribute('src');native.hidden=true;
const data=window.TideManuscript,players=['cl','fl','bn','hn','v1','v2','va','vc'],names={cl:'Solo clarinet',fl:'Flute',bn:'Bassoon',hn:'Horn',v1:'First violins',v2:'Second violins',va:'Viola',vc:'Cello'};
const acts=[
 [[1,'The shore calls','Four pieces of sailcloth take the shape of the violins’ call: up a sixth, then down two steps. The skiff is still at the bank.','overture'],[9,'An answer from below','The bassoon answers from a different station. Watch the lantern leave the first violins before the flute takes it.','overture'],[41,'The skiff carries the call','Forty bars in, the clarinet takes the violins’ four notes. The shore keeps its place; the light moves aboard.','voyage'],[73,'Open water','The second subject breathes more slowly. The solo line makes longer turns while the accompanying desks keep a little distance.','voyage'],[105,'Broken crossings','The call breaks apart in F-sharp minor. Follow the light between clarinet, bassoon and viola rather than looking for the whole tune.','voyage'],[161,'The bank remembers','The opening returns in the strings before it comes back aboard the skiff. The same hinged sails take a familiar shape.','voyage'],[233,'One player left','The orchestra falls silent for sixteen bars. Only the clarinet can move the little theatre now.','cadenza'],[249,'A shared landing','Clarinet and violins hand the closing statement back and forth. The ensemble supplies the final strokes.','harbour']],
 [[1,'The far lamp','The same leap now takes two long breaths. The caged amber lantern is the Adagio’s keepsake. Remember its shape.','lantern'],[25,'The answer lies low','The bassoon takes the song from the clarinet. Its station lights before the soloist answers in the low register.','lantern'],[49,'Through the minor','The song moves into shadow, then rises toward its broadest statement. The skiff no longer has the whole stage to itself.','lantern'],[81,'After the crest','The viola and bassoon keep the line afloat when the upper voice withdraws.','lantern'],[105,'The lamp returns','Hear the opening notes again, this time with an answering string line. The same lantern returns to the clarinet.','lantern'],[129,'Across the last water','A brief string memory and a low clarinet answer close the movement. The lamp will be heard again.','harbour']],
 [[1,'A dancing crossing','The four familiar pitches fit inside a quick 6/8 step. The hinged sails fold sooner; strings answer through the gaps.','refrain'],[17,'Reed song','A second idea alternates long and short syllables against the dance.','refrain'],[57,'The refrain returns','The opening dance comes back without changing its outline; the answering station on the bank changes.','refrain'],[81,'The wooded bank','The minor-key bassoon and viola take the rhythm away from the soloist. Follow their exchange along the shore.','refrain'],[129,'Closer pursuit','The refrain rises an octave and the relay tightens. These are still the four sails from the opening.','refrain'],[153,'A light from the Adagio','The dance makes room for the slow movement’s two long notes. The tidewheel disengages and the same caged lantern returns, now inside the rondo.','memory'],[169,'The dance wakes','The reed song returns. Its smaller exchanges make the long-breathed memory feel distant again.','refrain'],[209,'The last crossing','The refrain comes home by way of the subdominant. Soloist and orchestra trade the call one final time.','harbour']]
];
const score=data.map(m=>{
 const rows={};for(const [v,b64] of Object.entries(m.voices)){const str=atob(b64);const a=[];for(let i=0;i<str.length;i+=7){const u=k=>str.charCodeAt(i+k);a.push([u(0)+256*u(1),u(2)+256*u(3),u(4),u(5),u(6)]);}rows[v]=a;}
 const roles=Array.from({length:m.bars},(_,n)=>{const ls=m.phrases[n>>3][2].split('/');return ls[Math.floor(n%8*ls.length/8)];});
 return {...m,rows,roles};
});
function at(rows,t){let lo=0,hi=rows.length;while(lo<hi){const j=(lo+hi)>>1;if(rows[j][0]<=t+1e-6)lo=j+1;else hi=j;}return lo-1;}
function scene(s){const a=acts[s.movement-1];return Math.max(0,at(a,s.bar));}
// The first four bars of the Adagio song and its rondo memory share identical pitches, but not durations.
function hinge(s){
 const paired=s.movement===2&&s.bar<=4||s.movement===3&&s.bar>=153&&s.bar<=156;
 if(!paired)return {m:2,b:1,phase:0,inside:false};
 const dest=s.movement===2?3:2,b=s.movement===2?s.bar+152:s.bar-152;
 const cuts=(m,k)=>{const u=(k-1)*m.div,a=m.rows.cl;let i=Math.max(0,at(a,u));const t=[0,m.div];
  while(i<a.length&&a[i][0]<u+m.div){const [when,len]=a[i++];if(when>=u)t.push(when-u);if(when+len>u&&when+len<u+m.div)t.push(when+len-u);}
  return [...new Set(t)].sort((a,b)=>a-b).map(q=>q/m.div);};
 const x=cuts(score[s.movement-1],s.bar),y=cuts(score[dest-1],b);
 let i=0;while(i<x.length-2&&s.phase>=x[i+1])i++;
 return {m:dest,b,phase:y[i]+(y[i+1]-y[i])*clamp((s.phase-x[i])/(x[i+1]-x[i])),inside:true};
}
function world(s,still,focus){
 const m=score[s.movement-1],idx=s.bar-1,sc=scene(s),act=acts[s.movement-1][sc],tick=(idx+s.phase)*m.div,leader=m.roles[idx];
 let begin=idx;while(begin>0&&m.roles[begin-1]===leader)begin--;const leaderPrev=m.roles[Math.max(0,begin-1)];
 const [theme,texture]=m.phrases[idx>>3];const amplitudes={},pitches={};
 for(const v of players){const a=m.rows[v],q=a[at(a,tick)],d=q?tick-q[0]:-1;
  const length=q?q[1]*(q[4]===1?.61:.96):0;
  amplitudes[v]=!q||d<0||d>length?0:(q[3]/117)*clamp(.36+d/3)*clamp((length-d)/4);
  pitches[v]=amplitudes[v]>.01?q[2]:null;
 }
 let prevCall=at(m.calls,tick);while(prevCall>=0&&m.calls[prevCall][1]!==players.indexOf(leader))prevCall--;
 const c=m.calls[prevCall],gesture=[.21,.22,.18,.17];let callNote=-1;
 if(c&&tick-c[0]<(c[4]+c[5]+m.div*2.5)){
  const dt=tick-c[0],u=[0,c[2],c[3],c[4]],decay=1-ease((dt-c[4]-c[5])/m.div/2.5);
  u.forEach((x,k)=>{const last=k<3?u[k+1]:x+c[5];const hit=dt>=x&&dt<last;gesture[k]=clamp(.18+(.50*ease((dt-x+1)/4)+(hit?.28:0))*decay);if(hit)callNote=k;});
 }else{
  // Outside literal statements, let the sails rest between recognitions rather than becoming an equalizer.
  const p=pitches[leader],lift=p!=null?clamp((p-47)/42):.22;gesture[1]+=.17*lift;gesture[2]+=.09*lift;
 }
 return {movement:s.movement,bar:s.bar,phase:s.phase,beat:tick/12,theme,texture,leader,leaderPrev,leaderMix:begin===0?1:ease((idx-begin+s.phase)/.68),
 amplitudes,pitches,pitch:pitches.cl,gesture,callNote,memory:s.movement===2?.92:act[3]==='memory'?1:(s.movement===3&&idx>=232&&idx<240?.39:0),cadenza:act[3]==='cadenza'?1:0,arc:(idx+s.phase)/m.bars,act:act[3],scene:act[1],motion:!still,focus};
}
const media=matchMedia('(prefers-reduced-motion:reduce)');let still=media.matches,preference=false,hidden=false,focus='stage',raf=0,wakeup=0,lastDraw='',lastFrame=-Infinity,dirty=true,visible=true,sceneKey='',lastMovement=0,renderer=null,failed=false,draws=0;
const cv=$('theatre'),stage=$('stageWrap');const fmt=n=>Math.floor(Math.max(0,n||0)/60)+':'+String(Math.floor(Math.max(0,n||0))%60).padStart(2,'0');
function text(id,str){const e=$(id);if(e.textContent!==str)e.textContent=str;}
function mode(){const b=$('motion');b.setAttribute('aria-pressed',String(still));const au=$('audioOnly');au.setAttribute('aria-pressed',String(hidden));const z=au.querySelector('span');if(z)z.textContent=hidden?'Show stage':'Hide stage';stage.hidden=hidden;dirty=true;wake();}
function choices(m,k){
 const wrap=$('waypoints');if(m!==lastMovement){
  lastMovement=m;wrap.replaceChildren(...acts[m-1].map((a,j)=>{const b=document.createElement('button');b.type='button';b.dataset.index=j;b.dataset.bar=a[0];b.setAttribute('aria-label','Bar '+a[0]+': '+a[1]);const num=document.createElement('small');num.textContent='m. '+a[0];const name=document.createElement('span');name.textContent=a[1];b.append(num,name);b.addEventListener('click',()=>{host.cue(m,a[0]);dirty=true;wake();});return b;}));}
 for(let j=0;j<wrap.children.length;j++){const b=wrap.children[j];if(j===k)b.setAttribute('aria-current','step');else b.removeAttribute('aria-current');}
}
function ui(s,w){
 const k=scene(s),a=acts[s.movement-1][k],key=s.movement+':'+k;
 if(key!==sceneKey){sceneKey=key;choices(s.movement,k);text('sceneIndex','Scene '+(k+1)+' of '+acts[s.movement-1].length);text('sceneTitle',a[1]);text('sceneCopy',a[2]);}
 const h=s.movement===2&&s.bar<=4?'Hear these notes inside the rondo':s.movement===3&&s.bar>=153&&s.bar<=156?'Hear these notes in the Adagio':'Find the Adagio memory';
 const hv=$('memoryHinge').querySelector('span');if(hv.textContent!==h)hv.textContent=h;
 text('barRead','Bar '+s.bar+' of '+score[s.movement-1].bars);text('speaker',names[w.leader]+' '+(w.leader==='v1'||w.leader==='v2'?'carry':'carries')+' the line.');
 $('movement').value=s.movement;$('take').value=s.take;$('play').setAttribute('aria-pressed',String(s.intent&&!s.ended));text('playLabel',s.ended?'Replay concerto':s.intent?'Pause':'Play');text('clock',fmt(s.elapsed));text('end',fmt(s.duration));
 const seek=$('seek');seek.max=s.duration;seek.value=s.elapsed;seek.style.setProperty('--progress',100*s.elapsed/s.duration+'%');seek.setAttribute('aria-valuetext',fmt(s.elapsed)+', bar '+s.bar);
 if(s.error)text('status',s.error);else if(!failed&&s.ended)text('status','The concerto has ended.');else if(!failed)text('status','');
}
function fail(){failed=true;cv.style.visibility='hidden';text('status','The moving stage is unavailable. The engraving, scene notes and music still follow the performance.');}
function frame(ts){
 raf=0;clearTimeout(wakeup);if(!bridge.visible||document.hidden)return;
 const s=host.snapshot();if(!s.ready){text('status','Setting the stage…');wakeup=setTimeout(wake,100);return;}
 const w=world(s,still,focus);ui(s,w);
 // No note-by-note movement in still mode. Only a new scene or a handoff earns a new plate.
 let plateBar=s.bar;if(still){const floor=acts[s.movement-1][scene(s)][0],roles=score[s.movement-1].roles;while(plateBar>floor&&roles[plateBar-2]===w.leader)plateBar--;}
 const key=still?[s.movement,scene(s),plateBar,w.leader,focus,cv.clientWidth,cv.clientHeight].join(':'):[s.movement,s.bar,Math.round(s.phase*1000),focus,cv.clientWidth,cv.clientHeight].join(':');
 const cadence=(cv.clientWidth<650?1000/24:1000/30);
 if(!hidden&&!failed&&(dirty||key!==lastDraw)&&(!s.playing||ts-lastFrame>=cadence||dirty)){
  try{renderer=renderer||window.TideTheatre(cv);const pose=still?world({...s,bar:plateBar,phase:.68},true,focus):w;if(still){pose.leaderMix=1;pose.leaderPrev=pose.leader;}renderer.draw(pose);draws++;lastDraw=key;lastFrame=ts;dirty=false;}
  catch(err){console.warn('Theatre picture unavailable:',err.message);fail();}
 }
 cv.dataset.act=w.act;cv.dataset.leader=w.leader;cv.dataset.bar=String(s.bar);cv.dataset.memory=String(w.memory);
 if(s.playing&&!hidden&&!still)raf=requestAnimationFrame(frame);else wakeup=setTimeout(wake,s.playing?110:240);
}
function wake(){if(!raf){clearTimeout(wakeup);raf=requestAnimationFrame(frame);}}
window.TideCabinetWake=wake;
$('memoryHinge').addEventListener('click',()=>{const s=host.snapshot();if(!s.ready)return;const h=hinge(s);host.cue(h.m,h.b,h.phase);dirty=true;wake();});
$('scoreBack').addEventListener('click',e=>{e.preventDefault();bridge.exit();});
$('play').addEventListener('click',()=>{host.toggle();wake();});
$('seek').addEventListener('input',()=>{host.seek(Number($('seek').value));dirty=true;wake();});
$('movement').addEventListener('change',()=>{host.cue(Number($('movement').value),1);dirty=true;wake();});
$('take').addEventListener('change',()=>{host.take($('take').value)?.then(()=>{dirty=true;wake();});});
$('focus').addEventListener('change',()=>{focus=$('focus').value;dirty=true;wake();});
$('motion').addEventListener('click',()=>{preference=true;still=!still;mode();});
$('audioOnly').addEventListener('click',()=>{hidden=!hidden;mode();});
cv.addEventListener('click',e=>{if(!renderer?.pick)return;const box=cv.getBoundingClientRect(),chosen=renderer.pick(e.clientX-box.left,e.clientY-box.top);if(['stage','lamp','skiff'].includes(chosen)){focus=chosen===focus?'stage':chosen;$('focus').value=focus;dirty=true;wake();}});
media.addEventListener?.('change',()=>{if(!preference){still=media.matches;mode();}});
document.addEventListener('keydown',e=>{if(e.key==='Escape'){e.preventDefault();bridge.exit();}});
document.addEventListener('visibilitychange',wake);new ResizeObserver(()=>{dirty=true;wake();}).observe(cv);
bridge.ready();mode();
})();
