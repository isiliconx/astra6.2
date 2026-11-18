/* Heliostat: five mechanical light-routing puzzles, rendered entirely on canvas.
   Direction is E,S,W,N. A wheel is [column,row,backslash,initiallyFlipped,axle?].
   Wheels sharing a numbered axle rotate together. */
(()=>{
'use strict';
const levels=[
 {name:'First light',source:[0,3,0],target:[6,4],wheels:[[2,3,0,0],[2,1,0,1],[6,1,1,1],[4,4,0,0]],prisms:[[2,2],[4,1]],stops:[[0,1],[4,2],[5,4],[7,3]],par:2},
 {name:'Switchback',source:[1,0,1],target:[5,3],wheels:[[1,4,1,1],[6,4,0,0],[6,1,1,1],[3,1,0,1],[3,3,1,0],[7,2,0,1]],prisms:[[1,2],[4,4],[4,1],[4,3]],stops:[[4,2],[2,5],[0,4],[7,3]],par:3},
 {name:'The crossing',source:[0,4,0],target:[4,3],wheels:[[6,4,0,0],[6,1,1,1],[2,1,0,1],[2,5,1,1],[7,5,0,0],[7,0,1,1],[4,0,0,1],[0,2,0,0]],prisms:[[3,4],[5,1],[2,3],[5,5],[7,3],[4,2]],stops:[[0,0],[5,2],[0,3],[1,5]],par:5},
 {name:'Twin axle',source:[0,0,0],target:[5,1],wheels:[[6,0,1,1,1],[6,4,0,1],[1,4,1,0],[1,2,0,1,1],[7,2,1,1],[7,5,0,0],[3,5,1,1],[3,1,0,1]],prisms:[[3,0],[6,3],[2,4],[4,2],[7,4],[5,5],[3,3]],stops:[[0,2],[2,3],[4,3],[5,3]],par:5},
 {name:'Night shift',source:[4,5,3],target:[6,2],wheels:[[4,0,1,1,1],[0,0,0,1,2],[0,4,1,1],[7,4,0,1,1],[7,1,1,1],[2,1,0,1,2],[2,3,1,0],[6,3,0,1]],prisms:[[4,2],[2,0],[0,2],[3,4],[7,2],[5,1],[2,2],[5,3]],stops:[[1,3],[1,5],[6,5],[6,0]],par:5}
];
const tau=Math.PI*2,dx=[1,0,-1,0],dy=[0,1,0,-1],eq=(a,x,y)=>a[0]===x&&a[1]===y,serial=(x,y)=>y*8+x;
function trace(L,bits){
 let [x,y,d]=L.source,seen=new Set(),lit=new Set(),route=[[x+.5,y+.5]],why='Beam escaped';
 while(true){
  const nx=x+dx[d],ny=y+dy[d],inside=nx>=0&&nx<8&&ny>=0&&ny<6;
  if(!inside||L.stops.some(q=>eq(q,nx,ny))){let f=inside?.65:.5;route.push([x+.5+f*dx[d],y+.5+f*dy[d]]);if(inside)why='Beam blocked';break}
  x=nx;y=ny;route.push([x+.5,y+.5]);
  if(eq(L.target,x,y)){why=lit.size===L.prisms.length?'Signal locked':'Missed a prism';break}
  if(eq(L.source,x,y)){why='Reflected to source';break}
  let key=serial(x,y)*4+d;if(seen.has(key)){why='Closed circuit';break}seen.add(key);
  if(L.prisms.some(q=>eq(q,x,y)))lit.add(serial(x,y));
  let wi=L.wheels.findIndex(q=>eq(q,x,y));if(wi>=0)d=bits[wi]?d^1:3-d;
 }
 return {route,lit,why,win:why==='Signal locked'};
}
function init(s,n=0,total=0){
 const L=levels[n],bits=L.wheels.map(q=>q[2]^q[3]);return s.heli={n,total,bits,hist:[],angles:bits.map(b=>b?Math.PI/4:-Math.PI/4),sel:0,showFocus:false,keys:{},held:false,ray:trace(L,bits)};
}
function turn(g,i){if(i<0||g.ray.win)return;const L=levels[g.n],axle=L.wheels[i][4];g.hist.push(g.bits.slice());for(let j=0;j<g.bits.length;j++)if(j===i||(axle&&axle===L.wheels[j][4]))g.bits[j]^=1;g.sel=i;g.ray=trace(L,g.bits)}
function undo(g){if(!g.hist.length)return;g.bits=g.hist.pop();g.ray=trace(levels[g.n],g.bits)}
function next(s){const g=s.heli;if(!g.ray.win)return;const z=g.n+1;const h=init(s,z%levels.length,z===levels.length?0:g.total+g.hist.length);h.held=true;h.keys=g.keys}
const board={x:43,y:62,u:53};const right=506;
function hit(s){
 const g=s.heli;if(!g||!g.view)return;const {w,h,scale,ox,oy}=g.view;
 const x=(s.pointer.x*w-ox)/scale,y=(s.pointer.y*h-oy)/scale;
 if(x>=right&&x<775&&y>=333&&y<=389){if(g.ray.win)next(s);else undo(g);return}
 const col=Math.floor((x-board.x)/board.u),row=Math.floor((y-board.y)/board.u);
 const idx=levels[g.n].wheels.findIndex(q=>eq(q,col,row));if(idx>=0){g.showFocus=false;turn(g,idx)}
}
function arrows(g,dir){const L=levels[g.n],p=L.wheels[g.sel],a=dx[dir],b=dy[dir];let best=Infinity,choice=g.sel;
 L.wheels.forEach((q,i)=>{const u=q[0]-p[0],v=q[1]-p[1],forward=a*u+b*v,across=Math.abs(b*u-a*v);if(forward<=0)return;const cost=across*3+Math.hypot(u,v);if(cost<best){best=cost;choice=i}});
 if(choice===g.sel){ // wrap to the opposite edge in the same general lane
  L.wheels.forEach((q,i)=>{let u=q[0]-p[0],v=q[1]-p[1],f=a*u+b*v;if(f>=0)return;let cost=f+Math.abs(b*u-a*v)*3;if(cost<best){best=cost;choice=i}});
 }
 g.showFocus=true;g.sel=choice
}
function tick(s,t){let g=s.heli;const k=s.keys||{},edge=v=>!!k[v]&&!g.keys[v];
 if(edge('KeyR')){const old=g;g=init(s,old.n,old.total);g.view=old.view;g.keys={...k};return}
 if(!g.ray.win){['ArrowRight','ArrowDown','ArrowLeft','ArrowUp'].forEach((v,i)=>{if(edge(v))arrows(g,i)})}
 if(edge('Space')||edge('Enter')){if(g.ray.win){next(s);g=s.heli}else{g.showFocus=true;turn(g,g.sel)}}
 if(s.pointer&&s.pointer.down&&!g.held)hit(s);g=s.heli;g.held=!!(s.pointer&&s.pointer.down);g.keys={...k};
 const blend=g.prev===undefined?1:1-Math.exp(-Math.min(.25,Math.max(0,t-g.prev))*18);g.prev=t;g.bits.forEach((b,i)=>{let aim=b?Math.PI/4:-Math.PI/4;g.angles[i]+=(aim-g.angles[i])*blend});
}
function text(c,v,x,y,size,color,font='mono',align='left'){c.fillStyle=color;c.textBaseline='middle';c.textAlign=align;c.font=(font==='serif'?'italic '+size+'px Georgia,serif':font==='bold'?'600 '+size+'px system-ui,sans-serif':size+'px ui-monospace,monospace');c.fillText(String(v),x,y)}
function circle(c,x,y,r,fill,stroke,lw=1){c.beginPath();c.arc(x,y,r,0,tau);if(fill){c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function path(c,pts,stroke,lw=1,fill){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));if(fill){c.closePath();c.fillStyle=fill;c.fill()}if(stroke){c.strokeStyle=stroke;c.lineWidth=lw;c.stroke()}}
function rect(c,x,y,w,h,col){c.fillStyle=col;c.fillRect(x,y,w,h)}
const C={bg:'#131d1c',panel:'#203130',cream:'#fff0cc',amber:'#ffb966',copper:'#b88b62',mute:'#9cae9f',mint:'#93e1c6',link:'#ccb2fc'};
function wheel(c,x,y,a,axle,sel){c.save();c.translate(x,y);
 circle(c,0,2,19.5,'#101b1b');circle(c,0,0,18.2,'#354946','#889c8a',1);circle(c,0,0,14.2,'#182d2d','#496762');
 [[0,1],[1,0],[0,-1],[-1,0]].forEach(([i,j])=>circle(c,16*i,16*j,1.1,'#b3ac8d'));
 if(axle){const ink=axle===1?C.link:'#ff9a8d';c.strokeStyle=ink;c.lineWidth=2;c.beginPath();c.arc(0,0,21,-2.7,-.45);c.stroke();text(c,String.fromCharCode(64+axle),17,17,10,ink,'bold','center')}
 if(sel){c.strokeStyle=C.cream;c.lineWidth=2;c.setLineDash([3,3]);circle(c,0,0,24,null,C.cream,2);c.setLineDash([])}
 c.rotate(a);path(c,[[-18,-1],[16,-4],[20,1],[17,4],[-16,4]],null,0,'#769c9d');path(c,[[-18,-1],[-15,-4],[16,-4],[18,-1]],null,0,'#e5fff1');path(c,[[-15,1],[16,1]],'#bddece',1);c.restore()
}
function gem(c,x,y,on){const top=[x,y-10],r=[x+8,y],b=[x,y+10],l=[x-8,y],m=[x-1,y+1];
 path(c,[top,r,b,l],on?'#fff4c1':'#79a79a',1.3,on?'#f2b054':'#31645c');path(c,[top,m,l],null,0,on?'#fff0b0':'#81ad9c');path(c,[r,b,m],null,0,on?'#cd743e':'#28544e')
}
function port(c,x,y,source,lit,d,t){const ink=source?C.amber:lit?C.cream:C.mint;c.save();c.translate(x,y);circle(c,0,0,19,'#1d2929',ink,1.7);
 if(source){c.rotate(d*Math.PI/2);for(let i=0;i<3;i++)path(c,[[-10+i*5,-7],[-4+i*5,0],[-10+i*5,7]],ink,i===2?3:1.2)}
 else{for(let i=0;i<6;i++){let a=i*tau/6-.1;path(c,[[Math.cos(a)*13,Math.sin(a)*13],[Math.cos(a+.45)*7,Math.sin(a+.45)*7],[Math.cos(a+1.1)*7,Math.sin(a+1.1)*7]],ink,1.6)}circle(c,0,0,4.3,lit?'#ffed9b':'#63b99b')}
 c.restore()
}
function draw(c,w,h,t,p,s){if(!s.heli)init(s);const scale=Math.min(w/800,h/432),ox=(w-800*scale)/2,oy=(h-432*scale)/2;const view={w,h,scale,ox,oy};s.heli.view=view;tick(s,t);const g=s.heli,L=levels[g.n],r=g.ray;g.view=view;
 c.save();rect(c,0,0,w,h,C.bg);c.translate(ox,oy);c.scale(scale,scale);
 const {x:bx,y:by,u}=board,point=(x,y)=>[bx+(x+.5)*u,by+(y+.5)*u];
 text(c,'H E L I O S T A T',23,25,18,C.cream,'bold');text(c,'OPTICAL RELAY   /   SERIES H',777,24,13,C.mute,'mono','right');rect(c,22,46,756,1,'#4c5a4f');
 rect(c,bx-5,by-5,u*8+10,u*6+10,'#0b1616');rect(c,bx-1,by-1,u*8+2,u*6+2,'#768474');
 for(let y=0;y<6;y++){for(let x=0;x<8;x++){let xx=bx+x*u,yy=by+y*u;rect(c,xx,yy,u,u,'#52635b');rect(c,xx+.8,yy+.8,u-1.6,u-1.6,(x+y)%2?'#253937':'#283c38');circle(c,xx+4,yy+4,1.1,'#849380');}
 text(c,'ABCDEF'[y],bx-14,by+(y+.5)*u,11,C.mute,'mono','center')}
 for(let x=0;x<8;x++)text(c,String(x+1),bx+(x+.5)*u,by+6*u+15,11,C.mute,'mono','center');
 for(const [x,y] of L.stops){const [cx,cy]=point(x,y);rect(c,cx-16,cy-15,32,32,'#152321');rect(c,cx-15,cy-16,30,28,'#44564b');for(let j=0;j<4;j++){path(c,[[cx-11,cy-9+j*6],[cx+11,cy-9+j*6]],'#71806b',1.6)}}
 const pts=r.route.map(([x,y])=>[bx+x*u,by+y*u]);c.lineJoin='round';c.lineCap='round';path(c,pts,'rgba(255,156,73,.12)',13);path(c,pts,'rgba(255,168,75,.33)',6);path(c,pts,'#ffb35d',2.9);path(c,pts,'#ffe5a5',.9);
 const speed=p[0]??1; if(speed>0){c.save();c.setLineDash([3.5,34]);c.lineDashOffset=-t*28*speed;path(c,pts,'#fff8d6',2.6);c.restore()}
 L.prisms.forEach(([x,y])=>gem(c,...point(x,y),r.lit.has(serial(x,y))));
 L.wheels.forEach(([x,y,,,link],i)=>wheel(c,...point(x,y),g.angles[i],link,g.showFocus&&i===g.sel));
 port(c,...point(...L.source),true,true,L.source[2],t);port(c,...point(...L.target),false,r.win,0,t);
 const status=r.win?'RELAY LOCKED':'FIELD NOTES';
 text(c,'CHAMBER   '+String(g.n+1).padStart(2,'0')+' / 05',right,75,15,C.amber);
 text(c,L.name,right,115,34,C.cream,'serif');
 for(let i=0;i<5;i++)rect(c,right+i*49,146,42,3,i<=g.n?C.amber:'#46564d');
 text(c,status,right,178,12,C.mute);text(c,r.why,right,202,22,r.win?C.amber:C.cream,'bold');
 text(c,'PRISMS',right,242,13,C.mute);text(c,r.lit.size+' / '+L.prisms.length,right+204,242,18,C.mint,'mono','right');
 for(let i=0;i<L.prisms.length;i++)gem(c,right+12+i*24,269,i<r.lit.size);
 rect(c,right,292,241,1,'#536156');text(c,'TURNS',right,312,13,C.mute);text(c,g.hist.length+'   /   PAR '+L.par,right+240,312,16,C.cream,'mono','right');
 rect(c,right,338,241,46,r.win?C.amber:g.hist.length?'#3b5149':'#293b36');text(c,r.win?(g.n===4?'Run complete · Replay ↻':'Next chamber  →'):'↶  Undo turn',right+120.5,361,18,r.win?C.bg:g.hist.length?C.cream:'#a1b2a3','bold','center');
 rect(c,22,403,756,1,'#46574e');text(c,r.win?(g.n===4?'ALL FIVE CHAMBERS ALIGNED   •   '+(g.total+g.hist.length)+' TOTAL TURNS':'All prisms are carrying light. Advance when ready.'):g.n>=3?'Matching axle letters turn together.':'Turn mirrors to light every prism and reach the round receiver.',23,418,13,r.win?C.amber:C.mute);
 c.restore()
}
window.ASTRA.push({id:'heliostat',title:'Heliostat',category:'Arcade',description:'Turn silver mirrors inside a brass optical bench. Thread one beam through every prism and into the receiver across five chambers.',method:'A grid ray follows each 45° reflection until it reaches a wall, a boundary, a loop, or the receiver. Later chambers couple mirrors on matching lettered axles. Par is the fewest turns from the starting arrangement.',gesture:'Tap a mirror to turn it. Undo backs up one turn. Keyboard: arrows select a mirror, Space or Enter turns it or advances a solved chamber, R resets the chamber.',params:[{name:'Light pulse speed',min:0,max:3,step:.25,value:1}],draw,onInput(type,s){if(type==='down'){if(!s.heli)init(s);s.heli.held=true;hit(s)}else if(type==='up'&&s.heli)s.heli.held=false}});
})();
