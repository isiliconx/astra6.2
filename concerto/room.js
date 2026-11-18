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
  let playError=false;
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
  const totalTime=()=>Number.isFinite(sound.duration)&&sound.duration>0?sound.duration:track().seconds;
  const name=title=>String(title).replace(/^[IVX]+\s*[.:)\-]\s*/i,'');
  const say=(s)=>{if($('playerStatus').textContent!==s)$('playerStatus').textContent=s;};
  function locate(arr,key,value){
    let lo=0,hi=arr.length-1;while(lo<hi){let m=Math.ceil((lo+hi)/2);if(Number(arr[m][key])<=value+.00001)lo=m;else hi=m-1;}return lo;
  }
  function updateButtons(){
    const live=!sound.paused&&!sound.ended;
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
    if(sound.error) {const t=pendingTime??sound.currentTime;pendingTime=t;sound.load();}
    playError=false;say('');
    sound.play().catch(err=>{if(audioSerial!==token||err.name==='AbortError')return;
      playError=true;say(err.name==='NotAllowedError'?'Press play to start the recording.':'This movement could not play. Try play again, or open its MP3 in The edition.');updateButtons();
    });
  }
  function toggle(){if(sound.paused||sound.ended)doPlay();else sound.pause();}
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
  function selectMovement(j,play=false,t=0){
    if(!ready)return;
    if(j!==i||!sound.getAttribute('src')){audioSerial++;sound.pause();i=j;pendingTime=t;sound.src=file('audio/'+(i+1)+'.mp3');sound.load();}
    clearLoop();playError=false;say('');didFinish=false;
    sound.playbackRate=Number($('speed').value);sound.defaultPlaybackRate=sound.playbackRate;
    document.querySelectorAll('#tracks button').forEach((b,k)=>b.setAttribute('aria-current',k===i?'true':'false'));
    const m=track();$('nowTitle').textContent=roman[i]+'. '+m.subtitle;seek.max=m.seconds;$('duration').textContent=clock(m.seconds,true);
    chapter.replaceChildren();
    chapters().forEach((c,k)=>{const o=dom('option',null,'Bar '+c.bar+' · '+c.title);o.value=k;chapter.append(o);});
    bar=0;cue=-1;barNo.max=bars().length;$('barCount').textContent='of '+bars().length;system=null;drawing=null;
    setTime(t);updateButtons();if(play)doPlay();
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
  $('heroPlay').addEventListener('click',e=>{if(!ready)return;e.preventDefault();toggle();document.getElementById('listening').scrollIntoView({behavior:reduced.matches?'auto':'smooth'});});
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
  sound.addEventListener('playing',()=>{say('');updateButtons();});
  sound.addEventListener('pause',updateButtons);
  sound.addEventListener('error',()=>{if(!ready)return;say('The recording could not load. Retry play or use the MP3 links under The edition.');updateButtons();});
  sound.addEventListener('ended',()=>{if(!ready)return;if(loopIndex!==null){goBar(chapters()[loopIndex].bar);doPlay();}else if(i<movements.length-1)selectMovement(i+1,true,0);else{didFinish=true;updateButtons();say('The concerto has ended.');}});
  let raf=0;new ResizeObserver(()=>{cancelAnimationFrame(raf);raf=requestAnimationFrame(()=>{if(ready&&bar)renderScore(bar);});}).observe(stage);
  function buildMap(data){maps=data;index=maps.map(systems=>{const by=[];for(const s of systems){for(const b of s.bars)by[b.b]={s,b};}return by;});loadedMap=true;if(ready)renderScore(bar||1,true);}
  // The player remains usable if only the score-map request fails.
  json('program.json').then(data=>{
    movements=data.movements;if(!movements?.length||!movements.every(m=>m.bars?.length&&m.chapters?.length))throw Error('programme');
    const sum=movements.reduce((a,m)=>a+Number(m.seconds),0);$('heroTime').textContent='Three movements · '+clock(sum,true);
    displayTracks();ready=true;sound.controls=false;sound.hidden=true;
    document.querySelectorAll('.js-only, #barTools').forEach(el=>el.hidden=false);
    for(const el of document.querySelectorAll('.cue-link')){
      const m=Number(el.dataset.m),c=movements[m].chapters.find(ch=>ch.title===el.dataset.cue);if(!c)continue;el.hidden=false;
      el.addEventListener('click',()=>{selectMovement(m,true,movements[m].bars[c.bar-1].t);$('listening').scrollIntoView({behavior:reduced.matches?'auto':'smooth'});});
    }
    selectMovement(0);
    json('edition/score-map.json').then(buildMap).catch(()=>{loadedMap=true;renderScore(bar||1);});
  }).catch(()=>{
    $('scoreStage').replaceChildren(dom('p',null,'The interactive programme could not load. Use the movement links above and the PDF part.'));
    $('heroVerb').textContent='Listen to the concerto';
    say('Choose a movement above to open its recording.');
  });
})();
