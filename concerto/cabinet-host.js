/* The theatre is a second view of the existing audio element, never a second player. */
(()=>{
  'use strict';
  const transport=window.TideScoreTransport, album=document.getElementById('listening');
  if(!transport)return;
  const param=()=>new URL(location.href).searchParams;
  const route=()=>param().get('view')==='cabinet';
  let dialog,frame,active=false,source=null,previousOverflow='',loadTimer=0;
  const notify=()=>{try{frame.contentWindow.TideCabinetWake?.();}catch{}};
  function closeLocal(notifyRoute=false){
    if(!active)return;active=false;clearTimeout(loadTimer);
    try{dialog.close();}catch{dialog.removeAttribute('open');}
    document.documentElement.style.overflow=previousOverflow;
    window.TideCabinetBridge.visible=false;notify();
    if(notifyRoute){let u=new URL(location.href);u.searchParams.delete('view');u.searchParams.delete('m');u.searchParams.delete('bar');u.hash='listening';try{history.replaceState(history.state,'',u);}catch{}}
    if(source){source.focus({preventScroll:true});source=null;}
    else{album.scrollIntoView({block:'start'});document.getElementById('cabinetInvite')?.focus({preventScroll:true});}
  }
  function ensure(){
    if(dialog)return;
    dialog=document.createElement('dialog');dialog.id='tideDialog';dialog.setAttribute('aria-label','The Tide Cabinet, visual listening theatre');
    frame=document.createElement('iframe');frame.title='The Tide Cabinet, a mechanical theatre for The Other Shore';frame.allow='autoplay';if(window.SHORE_CABINET_DOC)frame.srcdoc=window.SHORE_CABINET_DOC;else frame.src='cabinet/?stage=1';
    dialog.append(frame);document.body.append(dialog);
    dialog.addEventListener('cancel',e=>{e.preventDefault();closeLocal(true);});
  }
  function open(el,write=true){
    if(active)return;ensure();active=true;source=el||null;previousOverflow=document.documentElement.style.overflow;
    document.documentElement.style.overflow='hidden';transport.pauseExcerpt();window.TideCabinetBridge.visible=true;
    try{dialog.showModal();}catch{dialog.setAttribute('open','');}frame.focus();notify();
    if(write){const u=new URL(location.href);u.searchParams.set('view','cabinet');u.hash='cabinet';try{history.pushState(history.state,'',u);}catch{}}
    clearTimeout(loadTimer);loadTimer=setTimeout(()=>{
      try{if(frame.contentWindow.TideCabinetWake)return;}catch{}
      if(!active)return;
      let back=dialog.querySelector('.frame-retry');if(!back){back=document.createElement('button');back.className='frame-retry';back.textContent='Visual stage unavailable · Return to score';back.onclick=()=>closeLocal(true);dialog.append(back);}
    },7000);
  }
  window.TideCabinetBridge={transport,visible:false,exit:()=>closeLocal(true),ready(){clearTimeout(loadTimer);dialog?.querySelector('.frame-retry')?.remove();},};
  document.querySelectorAll('[data-cabinet-open]').forEach(a=>a.addEventListener('click',e=>{if(e.button!==0||e.metaKey||e.ctrlKey||e.shiftKey||e.altKey)return;e.preventDefault();open(a);}));
  addEventListener('popstate',()=>{if(route()){open(null,false);}else closeLocal(false);});
  if(route()){
    const m=Number(param().get('m')),b=Number(param().get('bar'));
    if(Number.isInteger(m)&&m>=1&&m<=3){
      const start=performance.now();const check=()=>{if(!active)return;if(transport.snapshot().ready)transport.cue(m,b||1);else if(performance.now()-start<6500)setTimeout(check,70);};setTimeout(check,0);
    }
    open(null,false);
  }
})();
