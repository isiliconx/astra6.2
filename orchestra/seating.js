/* The orchestra pit. Original engraved SVG, with no external assets. */
(() => {
  'use strict';
  const NS = 'http://www.w3.org/2000/svg', PI = Math.PI, cx=360, cy=309, ys=.84;
  const p=(r,a)=>[cx+r*Math.sin(a*PI/180),cy-r*ys*Math.cos(a*PI/180)];
  const f=n=>Number(n.toFixed(2)), xy=pt=>pt.map(f).join(' ');
  const arc=(r,a,b)=>'M '+xy(p(r,a))+' A '+f(r)+' '+f(r*ys)+' 0 0 1 '+xy(p(r,b));
  const band=(r,R,a,b)=>arc(R,a,b)+' L '+xy(p(r,b))+' A '+f(r)+' '+f(r*ys)+' 0 0 0 '+xy(p(r,a))+' Z';
  const path=(d,attrs='')=>'<path d="'+d+'" '+attrs+'/>';
  let serial=0;
  const glyphs={
    violin:'<g transform="rotate(35)"><path d="M-1-9c-3-1-7 1-6 5 0 2 3 2 2 5-1 2-4 2-4 6 0 7 16 7 16 0 0-4-3-4-4-7 0-2 3-2 3-5 0-3-4-5-6-4l1-10-2-1z"/><path d="M-1-18v25m-3-4h6m-5 6 2-4 1 4m5-28h-6m4-3h-3M-4-2q2 1 0 4m7-4q-2 1 0 4M12-20v33m1-30v27"/></g>',
    viola:'<g transform="rotate(-30)"><path d="M-2-9q-7-2-7 4 0 2 3 4 2 3-2 5-3 1-3 5 1 9 12 7 7-1 7-7 0-3-3-5-4-3-1-5 4-2 3-5-1-5-7-4l1-11-3-1z"/><path d="M-1-20v31m-4-5h8m-5 9 1-5 2 4m-7-15q3 1 0 5m9-5q-3 1 0 5m-5-23h-5m2-4h5M15-19v34m-1-31v26"/></g>',
    cello:'<g transform="rotate(13)"><path d="M-1-11q-8-1-8 5 0 3 4 5 2 3-3 5-4 2-4 7 1 6 11 6 11 0 11-7 0-4-5-7-3-2-2-5 4-1 4-5 0-5-7-4l1-11-3-1z"/><path d="M0-21v32m-5-5h9m-5 7 1-4 2 4m-2 5v5M-6-3q3 2 1 5m10-5q-3 2-1 5m-7-21h6m-6-4h5m13 3-5 36"/></g>',
    flute:'<g transform="rotate(-28)"><path d="M-23-3h46v4h-46zm5 0v4m5-4v4m31-4v4m-28 0 2 3h21"/><g fill="currentColor" stroke="none"><circle cx="-7" cy="-1" r="1.4"/><circle cx="-2" cy="-1" r="1.4"/><circle cx="3" cy="-1" r="1.4"/><circle cx="8" cy="-1" r="1.4"/><circle cx="13" cy="-1" r="1.4"/></g></g>',
    clarinet:'<g transform="rotate(34)"><path d="M-1-22l3-2 1 6-1 3 1 24q0 6 5 10-6 4-15 0 5-4 5-10l1-24z"/><path d="M-2-15h4m-4 9h5m-6 13h6m-7 10q5 2 11 0m-8-20h3m-3 3h3m-3 4h3m3-11 1 12"/></g>',
    horn:'<g transform="rotate(-9)"><path d="M-12-5c-12 13 1 25 13 18 7-4 7-13 3-17-6-7-16-5-19 1-5 10 7 19 13 12 5-6-2-11-5-8-2 2-1 5 2 5m6-3q7-2 10-12l6 8q-9 4-14 10m5-16 4-5 8 11-4 2m-21 1q-3-10-10-9l-4 0v-3l5 1q8-1 11 9m2 2-2-5m5 5-2-6m4 6-1-5"/></g>',
    timpani:'<g><ellipse cx="-7" cy="-3" rx="13" ry="5"/><path d="M-20-3c1 16 23 16 26 0m-22 5 2-4m14 7 1-6m-10 10-2 5m6-5 2 5"/><ellipse cx="13" cy="-9" rx="9" ry="3.6"/><path d="M6-6q8 11 15-2m-8 8-1 4m-26-15 17-9m-12 11 18-4"/><circle cx="4" cy="-20" r="2"/><circle cx="10" cy="-13" r="2"/></g>'
  };
  const sectors=[
    ['horn','Horns',264,321,-80,-1,-39,'#694745'],
    ['timpani','Timpani',264,321,1,80,39,'#694744'],
    ['flute','Flute',189,257,-80,-1,-39,'#6a3c43'],
    ['clarinet','Clarinet',189,257,1,80,39,'#6a3c43'],
    ['violin','Violins',67,181,-80,-27,-54,'#814946'],
    ['viola','Violas',67,181,-25,25,0,'#784047'],
    ['cello','Cellos',67,181,27,80,54,'#814946']
  ];
  class OrchestraSeating{
    constructor(element,parts,onToggle){
      const id='pit'+(++serial)+'-',gold='#dfbc86',lit='#ffdc91';
      this.nodes=new Map();this.muted=new Set();this.sounding=new Set();
      const use=(name,x,y,a=0,s=1)=>'<use href="#'+id+name+'" transform="translate('+f(x)+' '+f(y)+') rotate('+f(a)+') scale('+s+')"/>';
      const style='<style>.pit-fan .halo,.pit-fan .halo-rim{opacity:0}.pit-fan .sounding .halo{opacity:.53}.pit-fan .sounding .halo-rim{opacity:1}.pit-fan .sounding .engraving,.pit-fan .sounding .sector-label{color:#fff2cd;fill:#fff2cd}.pit-fan .sounding .engraving{fill:none}.pit-fan .sector:focus-visible{outline:none}.pit-fan .sector:focus-visible .outline{stroke:#fff4d3;stroke-width:3}.pit-fan .sector:hover .outline{stroke:#ffdeb0}.pit-fan .sector[aria-pressed=false] .outline{stroke-dasharray:4 4}@media(max-width:580px){.pit-fan .sector-label{font-size:22px}} </style>';
      let defs='<defs><radialGradient id="'+id+'light"><stop stop-color="#ffce82"/><stop offset=".45" stop-color="#e88857" stop-opacity=".63"/><stop offset="1" stop-color="#c67748" stop-opacity="0"/></radialGradient>';
      defs+='<pattern id="'+id+'hatch" width="5" height="5" patternUnits="userSpaceOnUse"><path d="M-1 1 1-1m-1 6 5-5m-1 6 2-2" stroke="#e7ba88" stroke-width=".55" opacity=".38"/></pattern>';
      defs+='<g id="'+id+'desk" fill="none" stroke="currentColor" stroke-linecap="round" stroke-linejoin="round"><path d="M-5-3q5-4 10 0l-1 5q-4 2-8 0zm-1-2q6-4 12 0m-10 7-1 2m8-2 1 2M0 5v2m-4 1 4-1 4 1"/><path d="M-4 5 0 4l4 1" stroke-width="1.8"/></g>';
      for(const [k,v] of Object.entries(glyphs))defs+='<g id="'+id+k+'">'+v+'</g>';
      defs+='</defs>';
      let art='<g fill="none" stroke="#997358" aria-hidden="true">';
      // The architectural rail: twin stringcourses, fluting and corner pilasters.
      for(const r of [327,331,339,344])art+=path(arc(r,-80.75,80.75),'stroke-width="'+(r===331?2:.85)+'"');
      for(let a=-80;a<=80;a+=1.5)art+=path('M'+xy(p(332,a))+'L'+xy(p(338,a+.27)),'opacity=".82"');
      for(let a=-72;a<80;a+=12){const pt=p(335,a);art+='<circle cx="'+f(pt[0])+'" cy="'+f(pt[1])+'" r="2.4" fill="#edc18d" stroke="#43303a"/>'}
      art+=path(band(42,325,-81,81),'fill="#3a2530" stroke="#af8968" stroke-width=".8"');
      for(const a of [-81,81]){
        art+=path('M'+xy(p(46,a))+'L'+xy(p(343,a)),'stroke-width="2"');
        for(let r=54;r<340;r+=10)art+=path('M'+xy(p(r,a))+'L'+xy(p(r+1,a+(a<0?-1:1))),'opacity=".85"');
      }
      art+=path(arc(60,-79,79),'stroke="#bb906b"')+path(arc(56,-79,79),'stroke="#816056"');
      art+='</g>';
      let groups='';
      for(const [key,label,r,R,a,b,mid,ink] of sectors){
        const [x,y]=p((r+R)/2+(r<100?12:0),mid),shape=band(r,R,a,b),tilt=r<100?0:Math.atan(ys*Math.tan(mid*PI/180))*180/PI,title=(parts||[]).find(v=>v.id===key)?.name||label;
        groups+='<g class="sector" data-section="'+key+'" tabindex="0" role="button" aria-pressed="true" aria-label="'+title+', audible"><title>'+title+' · toggle section</title>'+path(shape,'class="outline" fill="'+ink+'" stroke="#af876e" stroke-width="1.1"');
        groups+=path(band(R-6,R-2,a+.3,b-.3),'fill="url(#'+id+'hatch)"')+path(arc(r+3,a+1,b-1),'fill="none" stroke="#dfa47d" stroke-opacity=".65" stroke-width=".7"');
        groups+='<g aria-hidden="true" color="#e3b89b" opacity=".58">';
        const rows=r<100?[r+16,R-35,R-16]:[r+15,R-17];
        for(const rad of rows){
          const n=Math.max(2,Math.floor((b-a)*Math.PI/180*rad/21));
          for(let i=0;i<n;i++){
            const ang=a+(b-a)*(i+.5)/n,pt=p(rad,ang);
            const dx=pt[0]-x,dy=pt[1]-y,ct=Math.cos(tilt*PI/180),st=Math.sin(tilt*PI/180);
            if(Math.abs(dx*ct+dy*st)<(key==='clarinet'||key==='timpani'?51:42)&&Math.abs(-dx*st+dy*ct)<30)continue;
            groups+=use('desk',pt[0],pt[1],ang*.8,rad>190?.85:.75);
          }
        }
        groups+='</g><g transform="rotate('+f(tilt)+' '+f(x)+' '+f(y)+')"><ellipse aria-hidden="true" class="halo" cx="'+f(x)+'" cy="'+f(y-1)+'" rx="48" ry="35" fill="url(#'+id+'light)"/>';
        groups+='<g class="engraving" aria-hidden="true" color="'+gold+'" fill="none" stroke="currentColor" stroke-width="1.35" stroke-linecap="round" stroke-linejoin="round">'+use(key,x,y-(r<100?8:10),0,r<100?.87:key==='flute'?.99:.77)+'</g>';
        groups+='<text class="sector-label" x="'+f(x)+'" y="'+f(y+(r<100?23:20))+'" fill="#ffdfad" text-anchor="middle" font-size="'+(r<100?18.8:18)+'" font-family="Georgia,serif" aria-hidden="true">'+label+'</text></g>';
        groups+=path(arc(r+3,a+2,b-2),'class="halo-rim" fill="none" stroke="'+lit+'" stroke-width="2.2" aria-hidden="true"')+'</g>';
      }
      // A conductor's open score and baton, framed by the lip of the podium.
      let podium='<g aria-hidden="true" transform="translate(360 292)" fill="none" stroke="'+gold+'" stroke-linecap="round" stroke-linejoin="round"><ellipse cy="1" rx="33" ry="17" stroke="#87634f"/><ellipse cy="1" rx="30" ry="14" stroke="#9e775b" stroke-dasharray="1 3"/><path d="M-16 0q8-3 15 0 9-3 16-1l-3 8q-6-2-13 0-7-2-13 0z" fill="#493039"/><path d="M-1 0v7m-10-5 6 .5m-6 2 6 .5m5-2 8-.8m-8 3 7-.8m1-10 15-14" stroke-width="1.25"/><circle cx="10" cy="-7" r="1.7" fill="'+gold+'"/><text y="39" fill="#d8b98f" stroke="none" text-anchor="middle" font-family="Georgia,serif" font-style="italic" font-size="16">Conductor</text></g>';
      const svg=document.createElementNS(NS,'svg');svg.setAttribute('viewBox','0 0 720 345');svg.setAttribute('class','pit-fan');svg.setAttribute('role','group');svg.setAttribute('aria-label','Interactive chamber orchestra seating plan');
      svg.innerHTML=style+defs+art+groups+podium;element.replaceChildren(svg);
      svg.querySelectorAll('.sector').forEach(node=>{const key=node.dataset.section;this.nodes.set(key,node);const toggle=()=>onToggle?.(key);node.addEventListener('click',toggle);node.addEventListener('keydown',ev=>{if(ev.key===' '||ev.key==='Enter'){ev.preventDefault();if(!ev.repeat)toggle();}});});
    }
    setMuted(values){this.muted=new Set(values||[]);for(const [id,node] of this.nodes){const off=this.muted.has(id);node.setAttribute('aria-pressed',String(!off));node.setAttribute('aria-label',sectors.find(s=>s[0]===id)[1]+(off?', muted':', audible'));node.classList.toggle('sounding',!off&&this.sounding.has(id));}}
    setBeat(beat,events,playing){const next=new Set();if(playing)for(const e of events||[]){if(e.t<=beat && beat<e.t+e.d)next.add(e.part);}for(const id of this.sounding)if(!next.has(id))this.nodes.get(id)?.classList.remove('sounding');for(const id of next)if(!this.sounding.has(id)&&!this.muted.has(id))this.nodes.get(id)?.classList.add('sounding');this.sounding=next;}
  }
  window.OrchestraSeating=OrchestraSeating;
})();
