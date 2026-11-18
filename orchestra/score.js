/* Conductor's copy: proportional concert-pitch notation for the event stream.
   The two unmetered sketches retain their true onset times; note values there
   are approximate. Everything is drawn in SVG and needs no music font. */
(function (global) {
  'use strict';
  const NS='http://www.w3.org/2000/svg', INK='#34252a', RULE='#998a70', RED='#a33e28';
  const GAP=4.6, HALF=GAP/2, mono='ui-monospace,Consolas,monospace';
  const limit=(v,l,h)=>Math.max(l,Math.min(h,v));
  const svg=(tag,attrs={},value)=>{const n=document.createElementNS(NS,tag); for(const [k,v] of Object.entries(attrs))n.setAttribute(k,v); if(value!=null)n.textContent=value; return n;};
  const add=(p,t,a,s)=>p.appendChild(svg(t,a,s));
  const line=(p,x1,y1,x2,y2,color=INK,w=.9)=>add(p,'line',{x1,y1,x2,y2,stroke:color,'stroke-width':w});
  const path=(p,d,a={})=>add(p,'path',{d,...a});
  const txt=(p,x,y,s,a={})=>add(p,'text',{x,y,...a},s);
  const order=['flute','clarinet','horn','timpani','violin','viola','cello'];
  const stepsSharp=[0,0,1,1,2,3,3,4,4,5,5,6],stepsFlat=[0,1,1,2,2,3,4,4,5,5,6,6],white=[0,2,4,5,7,9,11];
  function spelling(p,flats){const pc=((p%12)+12)%12,s=(flats?stepsFlat:stepsSharp)[pc];return {n:(Math.floor(p/12)-1)*7+s,alt:pc-white[s]};}
  const bottom={treble:30,alto:24,bass:18}; // E4, F3, G2
  function clefFor(id,scene){return scene<2?'treble':id==='cello'||id==='timpani'?'bass':id==='viola'?'alto':'treble';}
  function drawClef(parent,x,y,type){
    const g=add(parent,'g',{transform:'translate('+x+' '+y+')',fill:INK});
    if(type==='bass'){
      path(g,'M1 9 Q0 4 4 1 Q10 -3 14 2 Q18 11 4 19 Q13 10 11 4 Q10 -1 5 1 Q2 2 2 6 Q6 2 8 6 Q8 10 4 10 Z');
      for(const v of [2.3,7])add(g,'circle',{cx:17,cy:v,r:1.35});
    } else if(type==='alto'){
      add(g,'rect',{x:0,y:0,width:2.7,height:4*GAP});add(g,'rect',{x:4,y:0,width:1,height:4*GAP});
      path(g,'M7 0 C18 -4 20 6 11 8.8 C20 14 16 21 7 18.4 Q13 18 12 13 Q11 10 8 9.2 Q11 7.6 12 5 Q13 .6 7 0Z'); 
    }else{
      path(g,'M10.5 27.1 C5.2 30.5 1.6 25.1 4.1 23.6 C5.6 22.8 7.1 24.1 6.5 25.4 C6.2 26.3 5.2 26.6 4.6 26.2 C5.7 28.8 10.4 28.5 10.5 25.4 L7.2 2.3 C6.1 -3.7 7.6 -7.5 10.7 -10 C13.3 -5.6 11.9 .1 8.6 3.6 C6.1 6.7 2.2 9.6 2.4 13.9 C2.8 19.3 10.7 21.1 13.3 16.4 C15.6 12.4 11.5 8.9 8.1 10.7 C5.8 11.9 5.8 14.9 8.3 16.1 C3.2 14.9 3.8 9.6 7.3 8 C12.1 5.8 17.3 10.2 15.4 15.5 C12.4 22.8 1.9 21.1 .6 14.8 C-.6 8.8 4.7 4.7 8 .7 C10.7 -2.7 11.4 -5.5 10.8 -7.1 C8.8 -5.6 7.7 -2.5 8.1 1.2 L11.6 24.7 Q12 26.4 10.5 27.1 Z');
    }
  }
  function nearest(v){return [.25,.375,.5,.75,1,1.5,2,3,4].reduce((a,b)=>Math.abs(b-v)<Math.abs(a-v)?b:a);}
  function flags(d){return d<.49?2:d<.99?1:0;}
  function rest(g,x,y,d){
    if(d>=2){add(g,'rect',{x:x-3.5,y:y+(d>=4?GAP:2*GAP-2.3),width:7,height:2.3,fill:INK});return;}
    if(d>=1){path(g,'M-2 -6 L3 -2 L0 2 L3 5 Q-3 2 -2 7 Q-7 2 -1 1 L-3 -1 L0 -4 Z',{transform:'translate('+x+' '+(y+2*GAP)+')'});}
    else{const count=flags(d);line(g,x+2.5,y+6,x-.7,y+16);for(let j=0;j<count;j++){path(g,'M0 0 Q1 4 5 1 Q3.7 5 0 3.4 Q-2 3.1 -2 1.4 Q-1.8 -.3 0 0Z',{transform:'translate('+(x-2-j)+' '+(y+6+j*3.3)+')'});}}
  }
  class ConductorScore{
    constructor(container,{onSeek,onPart}={}){
      this.el=container;this.seek=onSeek;this.part=onPart;this.beat=0;this.page=-1;this.muted=new Set();this.width=0;this.rows=new Map();
      this.resize=()=>{const w=Math.round(this.el.getBoundingClientRect().width)||640;if(this.width!==w){this.width=w;this.render();}};
      this.click=e=>{if(!this.stage)return;const hit=e.target.closest&&e.target.closest('[data-part]');if(hit){this.part?.(hit.getAttribute('data-part'));return;}
        const r=this.drawing.getBoundingClientRect(),x=(e.clientX-r.left)*this.width/r.width;if(x>=this.left-6&&x<=this.right+4){const f=limit((x-this.left)/this.barW,0,this.nBars-.00001),bar=Math.floor(f),within=limit(((f-bar)*this.barW-this.pad)/(this.barW-this.pad-5),0,1);this.seek?.(this.start+(bar+within)*this.meter);}};
      this.keys=e=>{const h=e.target.closest&&e.target.closest('[data-part]');if(h&&['Enter',' '].includes(e.key)){e.preventDefault();this.part?.(h.getAttribute('data-part'));}};
      container.addEventListener('click',this.click);container.addEventListener('keydown',this.keys);
      if(global.ResizeObserver){this.observer=new ResizeObserver(this.resize);this.observer.observe(container);}else global.addEventListener('resize',this.resize);
      this.resize();
    }
    setStage(stage,parts,index){this.stage=stage;this.parts=parts||[];this.index=index??0;this.beat=0;this.page=-1;this.render();}
    setMuted(ids){this.muted=new Set(ids||[]);for(const [id,row] of this.rows){let off=this.muted.has(id);row.staff.setAttribute('opacity',off?'.31':'1');row.label.setAttribute('fill',off?'#847565':INK);row.label.setAttribute('aria-pressed',String(!off));}}
    setBeat(beat){if(!this.stage)return;this.beat=limit(Number(beat)||0,0,this.stage.bars*this.meter);if(this.page!==this.pageFor())this.render();else this.move();}
    pageFor(){return Math.floor(Math.min(this.beat,this.stage.bars*this.meter-.0001)/(this.viewBars*this.meter));}
    at(t){const rel=limit((t-this.start)/this.meter,0,this.nBars);if(rel===this.nBars)return this.right;const b=Math.floor(rel);return this.left+b*this.barW+this.pad+(rel-b)*(this.barW-this.pad-5);}
    move(){if(this.cursor)this.cursor.setAttribute('transform','translate('+this.at(this.beat)+' 0)');}
    render(){
      if(!this.stage||!this.width)return;
      const stage=this.stage,W=this.width,N=stage.events||[],idx=this.index;this.meter=stage.beatsPerBar||4;this.viewBars=W<590?2:4;this.page=this.pageFor();
      const first=this.page*this.viewBars;this.start=first*this.meter;this.nBars=Math.min(this.viewBars,stage.bars-first);
      this.left=W<420?58:W<590?73:88;this.right=W-12;this.barW=(this.right-this.left)/this.nBars;this.pad=this.barW<110?6:9;
      const flats=/[♭]|^F\b/.test(stage.key||''),present=new Set(N.map(e=>e.part));
      const parts=this.parts.filter(p=>present.has(p.id)).sort((a,b)=>order.indexOf(a.id)-order.indexOf(b.id));
      const pageNotes=N.filter(e=>e.t>=this.start&&e.t<this.start+this.nBars*this.meter);
      let y=34;const tracks=parts.map(p=>{
        const clef=clefFor(p.id,idx),base=bottom[clef],notes=pageNotes.filter(e=>e.part===p.id).map(e=>{const s=spelling(e.p,flats),dy=(base+8-s.n)*HALF;return {e,...s,dy,x:this.at(e.t),d:nearest(e.len??(idx===2?e.d/.73:e.d))};});
        const a=Math.min(-5,...notes.map(n=>n.dy)),b=Math.max(4*GAP+5,...notes.map(n=>n.dy));
        const top=y+Math.max(0,-a-5);y=top+b+17;
        return {p,clef,base,notes,top};
      });
      const H=Math.ceil(y+3),root=svg('svg',{xmlns:NS,viewBox:'0 0 '+W+' '+H,role:'group','aria-label':'Conductor’s score, bars '+(first+1)+' through '+(first+this.nBars)+'. Notes shown at concert pitch.'});root.style.cssText='width:100%;height:auto;display:block;user-select:none;cursor:crosshair;touch-action:manipulation';
      this.rows.clear();this.drawing=root;
      txt(root,10,16,'PART',{fill:RULE,'font-family':mono,'font-size':8,'letter-spacing':1.4});
      for(let i=0;i<this.nBars;i++){
        const x=this.left+i*this.barW;
        txt(root,x+3,16,String(first+i+1).padStart(2,'0'),{fill:RED,'font-family':mono,'font-size':9});
        const sec=(stage.sections||[]).find(s=>s.bar===first+i+1);if(sec&&this.barW>105)txt(root,x+21,16,sec.label,{fill:RULE,'font-family':'Georgia,serif','font-size':10,'font-style':'italic'});
        if(stage.chords?.[first+i])txt(root,x+this.barW-5,16,stage.chords[first+i],{fill:'#735d43','text-anchor':'end','font-family':'Georgia,serif','font-size':11,'font-style':'italic'});
      }
      tracks.forEach(({p,clef,base,notes,top})=>{
        const staff=add(root,'g',{fill:INK,'aria-hidden':'true'}),label=add(root,'g',{'data-part':p.id,role:'button',tabindex:0,'aria-label':'Toggle '+p.name,style:'cursor:pointer'});this.rows.set(p.id,{staff,label});
        add(label,'title',{},'Mute or unmute '+p.name);add(label,'rect',{x:0,y:top-6,width:this.left-21,height:31,fill:'transparent'});
        txt(label,8,top+13,W<590?p.short:p.name,{'font-size':W<420?10:12,'font-family':'Georgia,serif'});
        const sx=this.left-22;
        for(let j=0;j<5;j++)line(staff,sx,top+j*GAP,this.right,top+j*GAP,RULE,.65);
        drawClef(staff,sx+1,top,clef);
        for(let i=0;i<=this.nBars;i++)line(staff,this.left+i*this.barW,top,this.left+i*this.barW,top+4*GAP,RULE,.85);
        if(first+this.nBars===stage.bars){line(staff,this.right-2,top,this.right-2,top+4*GAP,INK,2.1);line(staff,this.right-5,top,this.right-5,top+4*GAP,INK,.8);}
        for(let b=0;b<this.nBars;b++){
          const t=this.start+b*this.meter,en=t+this.meter,nn=notes.filter(n=>n.e.t>=t&&n.e.t<en),acc=new Map();
          if(!nn.length){rest(staff,this.left+(b+.5)*this.barW,top,4);continue;}
          let end=t;
          for(let k=0;k<nn.length;k++){
            const n=nn[k],x=n.x,ny=top+n.dy;n.y=ny;
            if(idx>=2&&n.e.t-end>=.49)rest(staff,this.at(end)+(n.e.t-end<1?2:4),top,nearest(n.e.t-end));
            end=n.e.t+n.d;
            const rel=n.n-base;
            if(rel<0)for(let j=-2;j>=rel;j-=2)line(staff,x-5.3,top+(8-j)*HALF,x+5.3,top+(8-j)*HALF,INK,.8);
            if(rel>8)for(let j=10;j<=rel;j+=2)line(staff,x-5.3,top+(8-j)*HALF,x+5.3,top+(8-j)*HALF,INK,.8);
            if((acc.get(n.n)||0)!==n.alt){txt(staff,x-4.3,ny+3.5,n.alt>0?'♯':n.alt<0?'♭':'♮',{'font-family':'Georgia,serif','font-size':12,'text-anchor':'end'});acc.set(n.n,n.alt);}
            add(staff,'ellipse',{cx:x,cy:ny,rx:n.d>=4?4.3:3.4,ry:2.2,transform:'rotate(-18 '+x+' '+ny+')',fill:n.d>=2?'#f3edda':INK,stroke:INK,'stroke-width':n.d>=2?1.25:.7});
            if([.375,.75,1.5,3].includes(n.d))add(staff,'circle',{cx:x+6,cy:ny-(rel%2===0?HALF:0),r:.9});
          }
          if(idx>=2&&en-end>=.49)rest(staff,this.at(end)+2,top,nearest(en-end));
          for(let k=0;k<nn.length;){
            const g=[nn[k++]];if(idx>=2&&flags(g[0].d))while(k<nn.length&&flags(nn[k].d)&&Math.floor((g[0].e.t+.001)/2)===Math.floor((nn[k].e.t+.001)/2)&&Math.abs(g.at(-1).e.t+g.at(-1).d-nn[k].e.t)<.02)g.push(nn[k++]);
            const dir=g.reduce((v,n)=>v+n.dy,0)/g.length>=2*GAP?-1:1;
            const stemX=n=>n.x-dir*3.05,beam=(dir<0?Math.min:Math.max)(...g.map(n=>n.y))+dir*12.6;
            for(let j=0;j<g.length;j++){
              const n=g[j];if(n.d>=4)continue;const sx=stemX(n),stemY=g.length===1?n.y+dir*13:beam;line(staff,sx,n.y,sx,stemY,INK,1);
              if(g.length===1){for(let f=0;f<flags(n.d);f++){const fy=stemY-dir*f*3.6;path(staff,'M'+sx+' '+fy+' q6 '+(-dir*3)+' 3 '+(-dir*8)+' q1 '+(dir*4)+' -3 '+(dir*5)+'z');}}
              else if(j===0)line(staff,sx,beam,stemX(g.at(-1)),beam,INK,2.4);
              if(g.length>1&&flags(n.d)===2){const prev=g[j-1],next=g[j+1];if(next&&flags(next.d)===2)line(staff,sx,beam-dir*3.5,stemX(next),beam-dir*3.5,INK,1.9);else if(!prev||flags(prev.d)!==2)line(staff,sx,beam-dir*3.5,sx+(next?4:-4),beam-dir*3.5,INK,1.9);}
            }
          }
        }
      });
      this.cursor=add(root,'g',{'pointer-events':'none','aria-hidden':'true'});line(this.cursor,0,23,0,H-5,RED,1.25);path(this.cursor,'M-3 21 H3 L0 26 Z',{fill:RED});
      this.el.replaceChildren(root);this.setMuted(this.muted);this.move();
    }
    destroy(){this.observer?.disconnect();global.removeEventListener('resize',this.resize);this.el.removeEventListener('click',this.click);this.el.removeEventListener('keydown',this.keys);this.el.replaceChildren();this.rows.clear();this.stage=null;}
  }
  global.ConductorScore=ConductorScore;
})(window);
