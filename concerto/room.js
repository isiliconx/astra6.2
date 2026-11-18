(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const file = path => window.SHORE_FILES?.[path] || path;
  const NS = 'http://www.w3.org/2000/svg';
  const dom = (tag,cls,txt) => { const el = document.createElement(tag); if (cls) el.className=cls; if(txt !== undefined) el.textContent=txt; return el; };
  const svg = (tag,attrs) => { const el=document.createElementNS(NS,tag); Object.entries(attrs).forEach(([k,v])=>el.setAttribute(k,v)); return el; };
  const clamp = (v,a,b) => Math.min(Math.max(v,a),b);
  const clock = (v,round=false) => { if(!Number.isFinite(v)) return '–:––'; let s=Math.max(0,(round?Math.round:Math.floor)(v)); return Math.floor(s/60)+':'+String(s%60).padStart(2,'0'); };
  const reduced = matchMedia('(prefers-reduced-motion: reduce)');
  const sound=$('sound'), stage=$('scoreStage'), seek=$('seek'), barNo=$('barNo'), chapter=$('chapter');
  const roman=['I','II','III'];
  let movements=[], maps=[], index=[], i=0, bar=0, cue=-1, pendingTime=null, audioSerial=0;
  let system=null, drawing=null, priorRect=null, activeEdge=null, loopIndex=null, dragging=false, ready=false, loadedMap=false, didFinish=false;
  let playError=false, wantFull=false, take=null, takeSerial=0, sourceKey='';
  const editions={original:{name:'Original',map:'program.json'},learned:{name:'Learned',map:'expressive.json'}};
  const fullPath=(k,n)=>'audio/'+(k==='learned'?'expressive-':'')+n+'.mp3';
  const fetches=new Map(), programmes=new Map();
  const firstTake=()=>{try{return new URL(window.location.href).searchParams.get('take')==='original'?'original':'learned';}catch{return 'learned';}};
  let desired=firstTake();
  function shareTake(k){try{const url=new URL(window.location.href);url.searchParams.set('take',k);window.history.replaceState(window.history.state,'',url);}catch{/* An embedded or file-based edition may not permit history changes. */}}
  const sample=$('sample');
  let sampleScene=1,sampleTake='learned',sampleKey='',sampleSerial=0,samplePending=0,sampleWanted=false;
  const sampleDuration=()=>Number.isFinite(sample.duration)&&sample.duration>0?sample.duration:0;
  const sampleFraction=()=>samplePending!==null?samplePending:(sampleDuration()?clamp(sample.currentTime/sampleDuration(),0,1):0);
  // In the downloadable gallery each asset can have a local Blob URL.
  for(const el of document.querySelectorAll('[href],[src]')) {
    const attr=el.hasAttribute('src')?'src':'href', p=el.getAttribute(attr);
    if(p && file(p)!==p) el.setAttribute(attr,file(p));
  }
  for(const a of document.querySelectorAll('a[download]')) {
    const path=Object.keys(window.SHORE_FILES||{}).find(k=>window.SHORE_FILES[k]===a.getAttribute('href'))||a.getAttribute('href');
    if(path && !path.startsWith('blob:')) a.download=path.split('/').pop();
  }
  const json=async path=>{const r=await fetch(file(path));if(!r.ok) throw Error(path);return r.json();};
  const track=()=>movements[i], bars=()=>track().bars, chapters=()=>track().chapters;
  const totalTime=()=>sound.readyState>=1&&Number.isFinite(sound.duration)&&sound.duration>0?sound.duration:track().seconds;
  const name=title=>String(title).replace(/^[IVX]+\s*[.:)\-]\s*/i,'');
  const say=(s)=>{if($('playerStatus').textContent!==s)$('playerStatus').textContent=s;};
  function locate(arr,key,value){
    let lo=0,hi=arr.length-1;while(lo<hi){let m=Math.ceil((lo+hi)/2);if(Number(arr[m][key])<=value+.00001)lo=m;else hi=m-1;}return lo;
  }
  function updateButtons(){
    const live=wantFull&&!sound.ended;
    $('play').querySelector('use').setAttribute('href',live?'#i-pause':'#i-play');
    $('play').setAttribute('aria-label',live?'Pause movement':'Play movement');
    $('heroPlay').querySelector('use').setAttribute('href',live?'#i-pause':'#i-play');
    $('heroVerb').textContent=live?'Pause the concerto':didFinish?'Play again':(i!==0||sound.currentTime>1)?'Resume listening':'Play the concerto';
  }
  function clearLoop(){loopIndex=null;$('loop').setAttribute('aria-pressed','false');$('loop').querySelector('span').textContent='Loop passage';}
  function setLoop(k){loopIndex=k;$('loop').setAttribute('aria-pressed','true');$('loop').querySelector('span').textContent='Looping passage';}
  function doPlay(){
    const token=audioSerial;
    if(didFinish){selectMovement(0,true,0);return;}
    pauseSample();wantFull=true;updateButtons();
    if(sound.error) {const t=pendingTime??sound.currentTime;pendingTime=t;sound.load();}
    playError=false;say('');
    sound.play().catch(err=>{if(audioSerial!==token||err.name==='AbortError')return;
      wantFull=false;playError=true;say(err.name==='NotAllowedError'?'Press play to start the recording.':'This movement could not play. Try play again, or open its MP3 in The edition.');updateButtons();
    });
  }
  function haltFull(){wantFull=false;sound.pause();updateButtons();}
  function toggle(){if(wantFull&&!sound.ended)haltFull();else doPlay();}
  function setTime(t,manual=true){
    if(!ready)return;
    t=clamp(Number(t)||0,0,totalTime());didFinish=false;
    if(manual && loopIndex!==null){const b=locate(bars(),'t',t)+1;setLoop(locate(chapters(),'bar',b));}
    pendingTime=t;
    if(sound.readyState>=1){try{sound.currentTime=t;pendingTime=null;}catch{}}
    refresh(t,true);
  }
  function goBar(b){if(!ready||!Number.isFinite(b))return; b=clamp(Math.round(b),1,bars().length);setTime(bars()[b-1].t);}
  function chooseChapter(k){k=clamp(Number(k),0,chapters().length-1);if(loopIndex!==null)setLoop(k);goBar(chapters()[k].bar);}
  function displayTracks(){
    const tracks=$('tracks');tracks.replaceChildren();
    movements.forEach((m,j)=>{
      const b=dom('button');b.type='button';b.dataset.movement=String(j);b.setAttribute('aria-label','Play movement '+roman[j]+': '+name(m.title)+', '+m.subtitle);b.setAttribute('aria-current',j===i?'true':'false');
      const num=dom('i',null,roman[j]),col=dom('span'),txt=dom('span','track-name',name(m.title)),sub=dom('span','track-sub',m.subtitle),d=dom('span','track-time',clock(m.seconds,true));num.setAttribute('aria-hidden','true');col.append(txt,sub);b.append(num,col,d);b.addEventListener('click',()=>selectMovement(j,true,0));tracks.append(b);
    });
  }
  function selectMovement(j,play=false,t=0,keepLoop=null){
    if(!ready)return;
    const key=fullPath(take,j+1);i=j;
    if(sourceKey!==key){audioSerial++;haltFull();sourceKey=key;pendingTime=t;sound.src=file(key);sound.load();}
    clearLoop();playError=false;say('');didFinish=false;
    sound.playbackRate=Number($('speed').value);sound.defaultPlaybackRate=sound.playbackRate;
    document.querySelectorAll('#tracks button').forEach((b,k)=>b.setAttribute('aria-current',k===i?'true':'false'));
    const m=track();$('nowTitle').textContent=roman[i]+'. '+m.subtitle;seek.max=m.seconds;$('duration').textContent=clock(m.seconds,true);
    chapter.replaceChildren();
    chapters().forEach((c,k)=>{const o=dom('option',null,'Bar '+c.bar+' · '+c.title);o.value=k;chapter.append(o);});
    bar=0;cue=-1;barNo.max=bars().length;$('barCount').textContent='of '+bars().length;system=null;drawing=null;
    setTime(t);if(keepLoop!==null)setLoop(clamp(keepLoop,0,chapters().length-1));updateButtons();if(play)doPlay();
  }
  function renderScore(b,force=false){
    const rec=index[i]?.[b];if(!rec){if(loadedMap){stage.replaceChildren(dom('p',null,'The engraved strip is unavailable. Open the printed part above.'));}return;}
    const s=rec.s,m=rec.b;const paperLink=$('scorePdf');
    const partial=stage.clientWidth<650;
    // Coordinates are normalized to the full page width, including the y axis after multiplying by ratio.
    let left=0,right=1;
    if(partial){
      // Grow the window to fit a very wide engraved bar, otherwise show a readable group of neighbours.
      const w=Math.min(1,Math.max(m.r-m.x+.07,stage.clientWidth/860));
      const mid=(m.x+m.r)/2;left=clamp(mid-w/2,0,1-w);right=left+w;
    }
    const yTop=s.top*s.ratio,yBot=s.bot*s.ratio;
    const desc='Movement '+roman[i]+', page '+s.page+', bars '+s.bars[0].b+' to '+s.bars.at(-1).b+'. Click a bar to seek.';
    if(force||s!==system||!drawing){
      system=s;
      const v=svg('svg',{role:'group','aria-label':desc,preserveAspectRatio:'xMidYMid meet'});
      v.style.isolation='isolate';v.style.backgroundColor='var(--sheet)';
      const im=svg('image',{x:0,y:0,width:1,height:s.ratio,href:file(s.img),preserveAspectRatio:'none','aria-hidden':'true'});
      im.addEventListener('error',()=>{if(drawing===v){stage.replaceChildren(dom('p',null,'This page image could not load. Open the printed part above to see it.'));drawing=null;}},{once:true});
      v.append(im);
      const center=s.y*s.ratio;
      const htop=Math.max(yTop,center-.043), hbot=Math.min(yBot,center+.045);
      for(const bb of s.bars){
        const hit=svg('rect',{x:bb.x,y:htop,width:bb.r-bb.x,height:hbot-htop,class:'bar-hit','data-b':bb.b,role:'button','aria-label':'Seek to bar '+bb.b,tabindex:'-1'});
        const title=svg('title',{});title.textContent='Bar '+bb.b;hit.append(title);
        hit.addEventListener('click',()=>goBar(bb.b));
        hit.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();goBar(bb.b);}else if(e.key==='ArrowRight'||e.key==='ArrowLeft'){e.preventDefault();const next=clamp(bb.b+(e.key==='ArrowRight'?1:-1),1,bars().length);goBar(next);drawing?.querySelector('[data-b="'+next+'"]')?.focus();}});
        v.append(hit);
      }
      activeEdge=svg('line',{class:'bar-edge',x1:m.x,x2:m.x,y1:htop,y2:hbot,'aria-hidden':'true'});v.append(activeEdge);
      drawing=v;priorRect=null;stage.replaceChildren(v);paperLink.href=file('edition/clarinet-in-a.pdf')+'#page='+s.page;
    }
    if(!drawing)return;
    drawing.setAttribute('viewBox',[left,yTop,right-left,yBot-yTop].join(' '));
    if(priorRect){priorRect.classList.remove('active');priorRect.setAttribute('tabindex','-1');priorRect.removeAttribute('aria-current');}
    priorRect=drawing.querySelector('[data-b="'+b+'"]');if(priorRect){priorRect.classList.add('active');priorRect.setAttribute('aria-current','true');priorRect.setAttribute('tabindex','0');}
    activeEdge.setAttribute('x1',m.x);activeEdge.setAttribute('x2',m.x);
    $('pageNo').textContent='Part p. '+s.page+(m.rest?' · '+m.rest+'-bar rest':'');
  }
  function refresh(t=sound.currentTime,force=false){
    if(!ready)return;
    const duration=totalTime();seek.max=duration;
    if(!dragging){seek.value=t;seek.style.setProperty('--pos',clamp(100*t/duration,0,100)+'%');}
    $('elapsed').textContent=clock(t);$('duration').textContent=clock(duration,true);seek.setAttribute('aria-valuetext',clock(t)+' of '+clock(duration,true));
    const b=locate(bars(),'t',t)+1;
    if(force||b!==bar){
      bar=b;if(document.activeElement!==barNo||force)barNo.value=b;
      $('prevBar').disabled=b<=1;$('nextBar').disabled=b>=bars().length;
      renderScore(b);
      const k=locate(chapters(),'bar',b);
      if(cue!==k||force){cue=k;chapter.value=k;$('chapterNote').textContent=chapters()[k].description||'';}
    }
    updateButtons();
  }
  function tick(){
    if(!ready||pendingTime!==null)return;
    const t=sound.currentTime;
    if(loopIndex!==null&&!sound.paused&&!sound.seeking && loopIndex<chapters().length-1){
      const end=bars()[chapters()[loopIndex+1].bar-1].t;
      if(t>=end){setTime(bars()[chapters()[loopIndex].bar-1].t,false);return;}
    }
    refresh(t);
  }
  $('play').addEventListener('click',toggle);
  $('heroPlay').addEventListener('click',e=>{if(!ready&&!sourceKey)return;e.preventDefault();toggle();document.getElementById('listening').scrollIntoView({behavior:reduced.matches?'auto':'smooth'});});
  $('prevBar').addEventListener('click',()=>goBar(bar-1));$('nextBar').addEventListener('click',()=>goBar(bar+1));
  $('barForm').addEventListener('submit',e=>{e.preventDefault();goBar(barNo.valueAsNumber);});
  barNo.addEventListener('blur',()=>{if(ready&&!barNo.value)barNo.value=bar;});
  chapter.addEventListener('change',()=>chooseChapter(chapter.value));
  $('loop').addEventListener('click',()=>{if(!ready)return;if(loopIndex===null)setLoop(cue);else clearLoop();});
  $('speed').addEventListener('change',()=>{sound.defaultPlaybackRate=sound.playbackRate=Number($('speed').value);});
  seek.addEventListener('pointerdown',()=>{dragging=true;});['pointerup','pointercancel'].forEach(ev=>window.addEventListener(ev,()=>{dragging=false;}));
  seek.addEventListener('input',()=>{if(!ready)return;const t=Number(seek.value);setTime(t);seek.style.setProperty('--pos',100*t/totalTime()+'%');});
  ['loadedmetadata','durationchange'].forEach(ev=>sound.addEventListener(ev,()=>{if(!ready)return;sound.playbackRate=Number($('speed').value);if(pendingTime!==null&&sound.readyState>=1)setTime(pendingTime,false);else if(pendingTime===null)refresh();}));
  ['timeupdate','seeked'].forEach(ev=>sound.addEventListener(ev,tick));
  sound.addEventListener('play',()=>{if(!sound.paused){pauseSample();wantFull=true;}updateButtons();});
  sound.addEventListener('playing',()=>{if(sound.paused)return;pauseSample();wantFull=true;say('');updateButtons();});
  sound.addEventListener('pause',()=>{if(!ready&&sound.paused)wantFull=false;updateButtons();});
  sound.addEventListener('error',()=>{if(!ready||!sound.error)return;wantFull=false;say('The recording could not load. Retry play or use the MP3 links under The edition.');updateButtons();});
  sound.addEventListener('ended',()=>{if(!ready)return;if(loopIndex!==null){goBar(chapters()[loopIndex].bar);doPlay();}else if(i<movements.length-1)selectMovement(i+1,true,0);else{wantFull=false;didFinish=true;updateButtons();say('The concerto has ended.');}});
  let raf=0;new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(ready&&bar)renderScore(bar);});}).observe(stage);
  function buildMap(data){maps=data;index=maps.map(systems=>{const by=[];for(const s of systems){for(const b of s.bars)by[b.b]={s,b};}return by;});loadedMap=true;if(ready)renderScore(bar||1,true);}
  function setSampleUI(){
    $('abPlay').querySelector('use').setAttribute('href',sampleWanted?'#i-pause':'#i-play');
    $('abPlay').querySelector('span').textContent=sampleWanted?'Pause excerpt':'Play excerpt';
    $('abOriginal').setAttribute('aria-pressed',String(sampleTake==='original'));$('abLearned').setAttribute('aria-pressed',String(sampleTake==='learned'));
    const f=sampleFraction(),d=sampleDuration();$('abSeek').value=f;$('abSeek').style.setProperty('--pos',(f*100)+'%');
    $('abTime').textContent=d?clock(f*d)+' / '+clock(d,true):'0:00';$('abSeek').setAttribute('aria-valuetext',d?clock(f*d)+' of '+clock(d,true):Math.round(f*100)+' percent');
  }
  function pauseSample(){sampleWanted=false;if(!sample.paused)sample.pause();setSampleUI();}
  function sampleTo(f){
    samplePending=clamp(Number(f)||0,0,1);
    if(sample.readyState>=1&&sampleDuration()){try{sample.currentTime=samplePending*sampleDuration();samplePending=null;}catch{}}
    setSampleUI();
  }
  function prepareSample(){
    const key='audio/ab-'+sampleScene+'-'+(sampleTake==='learned'?'expressive':'original')+'.mp3';
    if(key===sampleKey)return false;
    ++sampleSerial;sampleKey=key;sample.preload='metadata';sample.src=file(key);sample.load();return true;
  }
  function playSample(){
    haltFull();
    if(sample.ended&&samplePending===null)samplePending=0;
    const fraction=sampleFraction();
    prepareSample();if(sample.error){++sampleSerial;samplePending=fraction;sample.load();}
    if(samplePending!==null)sampleTo(samplePending);
    const token=sampleSerial;sampleWanted=true;setSampleUI();$('abStatus').textContent='';
    sample.play().catch(err=>{if(token!==sampleSerial||err.name==='AbortError')return;sampleWanted=false;setSampleUI();$('abStatus').textContent=err.name==='NotAllowedError'?'Press play to hear the excerpt.':'This excerpt could not load. Retry play, or compare the full performances above.';});
  }
  function clipPosition(f,scene,fromTake,toTake){
    const from=programmes.get(fromTake)?.[scene-1],to=programmes.get(toTake)?.[scene-1];
    if(!from||!to||f<=0||f>=1)return f;
    const [start,end]=[[40,48],[0,4],[0,8]][scene-1];
    const a=from.bars[start].t, d=from.bars[end].t-a, b=to.bars[start].t, e=to.bars[end].t-b;
    return clamp((mapPosition(a+d*f,from,to)-b)/e,0,1);
  }
  function configureSample(scene,k){
    if(scene===sampleScene&&k===sampleTake)return;
    const resume=sampleWanted,position=scene===sampleScene?clipPosition(sampleFraction(),scene,sampleTake,k):0;
    sampleScene=scene;sampleTake=k;pauseSample();samplePending=position;prepareSample();
    $('abStatus').textContent='';sampleTo(position);if(resume)playSample();
  }
  $('abPlay').addEventListener('click',()=>{if(sampleWanted)pauseSample();else playSample();});
  $('abOriginal').addEventListener('click',()=>configureSample(sampleScene,'original'));$('abLearned').addEventListener('click',()=>configureSample(sampleScene,'learned'));
  $('scene').addEventListener('change',()=>configureSample(Number($('scene').value),sampleTake));
  $('abSeek').addEventListener('input',()=>{const f=Number($('abSeek').value);prepareSample();sampleTo(f);});
  ['loadedmetadata','durationchange'].forEach(ev=>sample.addEventListener(ev,()=>{if(sample.readyState>=1&&samplePending!==null)sampleTo(samplePending);else setSampleUI();}));
  ['timeupdate','seeked'].forEach(ev=>sample.addEventListener(ev,setSampleUI));
  sample.addEventListener('playing',()=>{if(!sample.paused){haltFull();sampleWanted=true;setSampleUI();}});
  sample.addEventListener('ended',()=>{sampleWanted=false;setSampleUI();$('abStatus').textContent='Excerpt ended. The full concerto is still at your saved position.';});
  sample.addEventListener('error',()=>{if(!sample.error)return;sampleWanted=false;setSampleUI();$('abStatus').textContent='This excerpt could not load. Choose another take or try play again.';});
  function getProgramme(k){
    if(!fetches.has(k)){
      const req=json(editions[k].map).then(data=>{
        const ms=data.movements;if(!Array.isArray(ms)||ms.length!==3||!ms.every(m=>Number.isFinite(m.seconds)&&m.seconds>0&&m.bars?.length&&m.chapters?.length&&m.bars.every((b,n)=>Number.isFinite(b.t)&&(n===0||b.t>m.bars[n-1].t))))throw Error('Invalid performance timing');
        programmes.set(k,ms);return ms;
      }).catch(err=>{fetches.delete(k);throw err;});fetches.set(k,req);
    }
    return fetches.get(k);
  }
  function mapPosition(t,from,to){
    const old=from.bars,nu=to.bars,b=locate(old,'t',t),k=clamp(b,0,nu.length-1);
    const start=old[b].t,end=old[b+1]?.t??from.seconds,span=end-start;
    const newStart=nu[k].t,newEnd=nu[k+1]?.t??to.seconds;
    const usable=g=>Array.isArray(g)&&g.length>1&&g[0]===0&&g.every((v,j)=>Number.isFinite(v)&&(!j||v>g[j-1]));
    const g0=old[b].grid,g1=nu[k].grid;
    let beatFraction=clamp((t-start)/Math.max(.001,span),0,1);
    if(usable(g0)){
      const elapsed=clamp(t-start,0,g0.at(-1));let n=0;while(n<g0.length-2&&g0[n+1]<=elapsed)n++;
      beatFraction=(n+(elapsed-g0[n])/(g0[n+1]-g0[n]))/(g0.length-1);
    }
    if(usable(g1)){
      const nth=clamp(beatFraction,0,1)*(g1.length-1),n=Math.min(Math.floor(nth),g1.length-2);
      return newStart+g1[n]+(nth-n)*(g1[n+1]-g1[n]);
    }
    return newStart+beatFraction*(newEnd-newStart);
  }
  function takeButtons(k){$('takeOriginal').setAttribute('aria-pressed',String(k==='original'));$('takeLearned').setAttribute('aria-pressed',String(k==='learned'));}
  function initializeControls(){
    sound.controls=false;sound.hidden=true;document.querySelectorAll('.js-only, #barTools').forEach(el=>el.hidden=false);
    for(const el of document.querySelectorAll('.cue-link')){
      const n=Number(el.dataset.m);if(!movements[n].chapters.some(ch=>ch.title===el.dataset.cue))continue;
      el.hidden=false;el.addEventListener('click',()=>{const c=movements[n].chapters.find(ch=>ch.title===el.dataset.cue);if(!c)return;selectMovement(n,true,movements[n].bars[c.bar-1].t);$('listening').scrollIntoView({behavior:reduced.matches?'auto':'smooth'});});
    }
    json('edition/score-map.json').then(buildMap).catch(()=>{loadedMap=true;renderScore(bar||1);});
  }
  async function chooseTake(k,{share=true,fallback=true}={}){
    const serial=++takeSerial;desired=k;takeButtons(k);
    if(ready&&take===k){$('takeNote').textContent='Switch takes without losing your place.';if(share)shareTake(k);return;}
    $('takeNote').textContent='Loading '+editions[k].name.toLowerCase()+' performance…';
    if(!ready){
      const key=fullPath(k,i+1);if(sourceKey!==key){
        const resume=wantFull&&!sound.ended;audioSerial++;if(sourceKey)haltFull();sourceKey=key;pendingTime=null;
        if(sound.getAttribute('src')!==file(key))sound.src=file(key);
        if(resume)doPlay();
      }
      // Slow or blocked timing data need not prevent listening from the native links.
      [...$('tracks').querySelectorAll('a')].forEach((a,n)=>a.href=file(fullPath(k,n+1)));
    }
    try{
      const ms=await getProgramme(k);if(serial!==takeSerial)return;
      const wasReady=ready,t=pendingTime??sound.currentTime??0,resume=wantFull||(!sound.paused&&!sound.ended),keep=loopIndex,ended=didFinish;
      const position=wasReady?mapPosition(t,track(),ms[i]):t;movements=ms;take=k;ready=true;
      const sum=movements.reduce((a,m)=>a+m.seconds,0);$('heroTime').textContent='Three movements · '+clock(sum,true);
      displayTracks();if(!wasReady)initializeControls();
      selectMovement(i,resume&&!ended,position,keep);didFinish=ended;updateButtons();takeButtons(k);if(share)shareTake(k);
      $('takeNote').textContent=wasReady?'Same passage, '+editions[k].name.toLowerCase()+' performance.':'Switch takes without losing your place.';
    }catch{
      if(serial!==takeSerial)return;
      if(ready){desired=take;takeButtons(take);$('takeNote').textContent=editions[k].name+' timing could not load. The '+editions[take].name.toLowerCase()+' take is still selected. Try switching again.';}
      else if(fallback){
        const alternate=k==='learned'?'original':'learned';await chooseTake(alternate,{share:false,fallback:false});
        if(ready&&take===alternate&&desired===alternate)$('takeNote').textContent=editions[k].name+' timing is unavailable. Showing the '+editions[alternate].name.toLowerCase()+' performance.';
      }else{
        $('scoreStage').replaceChildren(dom('p',null,'The timing maps could not load. Use the movement links above and the printed PDF part.'));
        $('takeNote').textContent='Timing unavailable. Choose either take to retry.';say('Choose a movement above to open its recording.');
      }
    }
  }
  // A single media transport for both the engraved score and its optional visual stage.
  // The child receives score position, not copies of the recordings or an animation timer.
  window.TideScoreTransport={
    snapshot(){
      if(!ready)return {ready:false,take:desired,playing:false};
      const m=track(),t=clamp(pendingTime??sound.currentTime??0,0,m.seconds),b=locate(m.bars,'t',t);
      const bb=m.bars[b],span=(m.bars[b+1]?.t??m.seconds)-bb.t,dt=clamp(t-bb.t,0,span),g=bb.grid;
      let phase=dt/span;
      if(g){let j=0;while(j<g.length-2&&g[j+1]<=dt)j++;phase=clamp((j+(dt-g[j])/(g[j+1]-g[j]))/(g.length-1),0,1);}
      return {ready:true,movement:i+1,take,bar:b+1,phase,elapsed:t,duration:m.seconds,playing:!sound.paused&&!sound.ended,intent:wantFull,ended:didFinish,rate:sound.playbackRate,
        error:sound.error?'The recording could not load. Return to the score for the MP3 links.':''};
    },
    toggle,
    seek(t){if(ready&&Number.isFinite(t))setTime(t);},
    cue(j,b,fraction=0){if(!ready||!Number.isInteger(j)||j<1||j>3)return;const m=movements[j-1],n=clamp(Math.round(Number(b)||1),1,m.bars.length);
      const bb=m.bars[n-1],f=clamp(Number(fraction)||0,0,1),g=bb.grid;let t=bb.t;
      if(g){const v=f*(g.length-1),a=Math.min(g.length-2,Math.floor(v));t+=g[a]+(v-a)*(g[a+1]-g[a]);}
      else t+=f*((m.bars[n]?.t??m.seconds)-bb.t);
      if(i!==j-1)selectMovement(j-1,wantFull,t);else setTime(t);},
    take(k){if(k==='original'||k==='learned')return chooseTake(k);},
    pauseExcerpt:pauseSample
  };
  $('takeLearned').addEventListener('click',()=>chooseTake('learned'));$('takeOriginal').addEventListener('click',()=>chooseTake('original'));
  $('takePanel').hidden=false;$('comparison').hidden=false;setSampleUI();chooseTake(desired,{share:false});
  // Two compact score maps enable the same eighth-note transfer in the excerpt player.
  getProgramme(desired==='learned'?'original':'learned').catch(()=>{});
})();
