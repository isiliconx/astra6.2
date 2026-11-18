'use strict';(()=>{const {stalls,leaf,frame,point,canopy}=City, el=id=>document.getElementById(id), dr=el('drawing'), angle=el('angle'), fmt=v=>v.toFixed(2);
let t=180,side=1,carX=57,anim=0,ride=0,html='',moving=false;
function pj(p){const [x,y,z]=p, xf=x*side; const d=.53*xf-.70*y+.48*z, k=3.30/(1-d/520);
 return [449+(x*.80+y*.605*side)*k,298+(xf*.29-y*.383-z*.878)*k]}
const xy=p=>pj(p).map(fmt).join(','), polygon=(pts,c,stroke='#333d38',sw=.62)=>{html+='<polygon points="'+pts.map(xy).join(' ')+'" fill="'+c+'" stroke="'+stroke+'" stroke-width="'+sw+'" stroke-linejoin="round"/>'},line=(pts,col,w=.8,dash='')=>html+='<polyline fill="none" stroke="'+col+'" stroke-width="'+w+'" stroke-linecap="round" stroke-linejoin="round" '+(dash?'stroke-dasharray="'+dash+'"':'')+' points="'+pts.map(xy).join(' ')+'"/>', palette=(hex,k)=>'#'+[1,3,5].map(i=>Math.max(0,Math.min(255,parseInt(hex.slice(i,i+2),16)+k)).toString(16).padStart(2,'0')).join('');
function circ(p,r,c){let q=pj(p);html+='<circle cx="'+fmt(q[0])+'" cy="'+fmt(q[1])+'" r="'+fmt(r)+'" fill="'+c+'"/>'}
function quad(map,u,v,w,h,c,stroke='none',sw=.5){polygon([[u,v],[u+w,v],[u+w,v+h],[u,v+h]].map(p=>map(...p)),c,stroke,sw)}
function panelText(map,u,v,label,size,color,maxwidth=0){let p=pj(map(u,v)),a=pj(map(u+.1,v)),b=pj(map(u,v+.1)),dx=(a[0]-p[0])*10,dy=(a[1]-p[1])*10,sx=dx<0?-1:1;
html+='<text transform="matrix('+[dx*sx,dy*sx,(p[0]-b[0])*10,(p[1]-b[1])*10,...p].map(fmt).join(' ')+')" text-anchor="middle" font-family="Georgia,serif" font-weight="bold" font-size="'+size+'" fill="'+color+'" '+(maxwidth?'textLength="'+maxwidth+'" lengthAdjust="spacingAndGlyphs"':'')+'>'+label+'</text>'}
function floor(x,y,z=0){let p=leaf(x,y,t);p[0]+=Math.sign(x)*z*Math.cos(t*Math.PI/360)*-1;p[2]+=z*Math.sin(t*Math.PI/360);return p}
function book(s){
 let X=s*94;const m=(u,v)=>floor(s*u,v);
 const rect=(u,v,w,h,col,st,sw)=>quad(m,u,v,w,h,col,st,sw);
 const face=[floor(0,-73),floor(X,-73),floor(X,73),floor(0,73)],down=(p,z)=>[p[0],p[1],p[2]-z];
 polygon(face.map(p=>down(p,3.8)),'#a05242','#503b38',1.5);
 for(let j of [0,1,2]){const p=face[j],q=face[(j+1)%4];polygon([p,q,down(q,3),down(p,3)],'#ddc998','#52483c',.7);for(let n=1;n<3;n++)line([down(p,n),down(q,n)],'#a89671',.45)}
 polygon(face,s===1?'#8eafa6':'#a8b9a7','#344a45',1);
 rect(2,-70,89,140,'none','#536d64',.6);rect(3,-69,87,138,'none','#bbc6a9',.65);
 // Fine cadastral blocks printed directly on the base, not additional solids.
 for(let row=0;row<7;row++)for(let i=0;i<4;i++){let u=30+i*14+(row%2)*2,v=-62+row*19;if(v<16&&v>-10)continue;rect(u,v,10,11,s===1?'#85a69b':'#9fac97','#718979',.55);rect(u+1,v+1,8,9,'none','#adbdab',.5);for(let q=2;q<8;q+=2.2)line([m(u+q,v+2),m(u+q+1.6,v+4.7)],'#91aa98',.5)}
 rect(2,-8.5,89,23,'#d0c5a2','#8a8970',.7);
 for(let z=4;z<91;z+=3)rect(z,1.9,.9,7.3,'#8b8370');
 for(let yy of [3.5,8]){line([m(0,yy),m(92,yy)],'#4c6159',2.1);line([m(0,yy+.24),m(92,yy+.24)],'#ece3c3',.7)}
 for(let y of [-36,35]){rect(1,y,88,3,'#b8bba2');line([m(4,y+1.5),m(87,y+1.5)],'#8d9c83',.6,'3 4')}
 // Letterpress title block, tiny stall indexes and a diagrammatic compass.
 const by=s===1?-58:43,bx=45,bw=39,bh=17;rect(bx,by,bw,bh,'#c4c4a5','#617b6c',.8);rect(bx+.85,by+.85,bw-1.7,bh-1.7,'none','#829680',.5);
 panelText(m,bx+bw/2,by+9.1,s===1?'NIGHT MARKET':'EVENING LINE',3.55,'#4f695b',bw-5);
 panelText(m,bx+bw/2,by+4.1,s===1?'FOLDING DISTRICT · 04':'STATION INDEX · 04',1.4,'#617867',bw-9);
 for(const of of [2,bw-2]){line([m(bx+of,by+bh-2),m(bx+of+(of===2?3:-3),by+bh-2)],'#617867',.7)}
 const cx=67,cy=s===1?46:-47;const disk=(r,col)=>polygon(Array.from({length:40},(_,i)=>m(cx+r*Math.cos(i*Math.PI/20),cy+r*Math.sin(i*Math.PI/20))),col,'#718671',.6);
 disk(9,'#b2b99c');disk(7.5,'none');for(let i=0;i<8;i++){const a=i*Math.PI/4,r=i%2?4.3:6.8;
 polygon([m(cx,cy),m(cx+1.2*Math.cos(a+.5*Math.PI),cy+1.2*Math.sin(a+.5*Math.PI)),m(cx+r*Math.cos(a),cy+r*Math.sin(a))],i%2?'#8b977e':'#5c7768','none')}
 for(const st of stalls){let dist=s===1?st.b:st.a;let y=st.y+st.w/2;line([m(dist+2,y),m(dist+6.5,y)],'#607b69',.8);polygon([[dist+7,y],[dist+9.5,y+2.3],[dist+12,y],[dist+9.5,y-2.3]].map(z=>m(...z)),'#758a74','none');panelText(m,dist+9.5,y-.6,st.id,1.7,'#f1e0aa')}
 // Dotted framing and printer registration marks.
 for(const y of [-65,63])for(let i=0;i<4;i++){line([m(55+i*7,y),m(59+i*7,y)],'#677f73',.75)}
 for(const st of stalls){const u=s===1?st.b:st.a;rect(u-1,st.y-.8,3,st.w+1.6,'#738c7d');}
}
function building(st){
 const f=frame(st,t);for(const sd of [-side,side]){const L=sd===1?f.R:f.L,y=st.y,w=st.w,m=(u,v)=>point(st,t,sd,v,y+u), near=sd===side;
 const col=palette(st.wall,near?0:-24);quad(m,0,0,w,L,col,'#394139',.9);
 // Scribed mortar courses and a hand-inked cornice.
 for(let v=2;v<L-1;v+=3.1){line([m(.6,v),m(w-.6,v)],palette(col,-10),.46);for(let u=(Math.round(v)%2)*2.1+.6;u<w-1;u+=4.2)line([m(u,v),m(u,v+1.4)],palette(col,-11),.35)}
 quad(m,.3,.2,w-.6,1.7,st.ink);quad(m,.4,L-3.1,w-.8,2.5,st.ink);quad(m,.4,L-2.3,w-.8,.45,st.trim);
 for(let u of [.7,w-1.8]){quad(m,u,1,1.0,L-3,st.trim);quad(m,u+.23,1,.25,L-3,palette(col,-21))}
 for(let u=2;u<w-1;u+=2.2)quad(m,u,L-3.7,.8,.65,st.ink);
 const n=st.windows,bay=(w-3.7)/n;
 for(let row=0;row<st.levels;row++){let v= L*(.58+row*.32/st.levels),h=L*.27/st.levels;
 for(let i=0;i<n;i++){let u=2.1+i*bay,b=bay-.9;quad(m,u-.2,v-.3,b+.4,h+.65,st.ink);
 const arch=[[u,v],[u+b,v],[u+b,v+h*.74],[u+b*.76,v+h],[u+b*.24,v+h],[u,v+h*.74]].map(p=>m(...p));
 polygon(arch,(i+row+(st.id==='A'?1:0))%4===0?'#63847c':(i%2?'#ffd584':'#f8e0a2'),'none');
 line([m(u+b*.51,v),m(u+b*.51,v+h-.15)],st.ink,.85);line([m(u,v+h*.58),m(u+b,v+h*.58)],st.ink,.65);quad(m,u-.28,v-.43,b+.56,.38,st.trim)}
 }
 // Storefront, transom lights, pickets, posters, door handles.
 for(let i=0;i<n;i++){let u=2+i*bay,b=bay-.7,h=L*.255;
 quad(m,u,1.8,b,h,st.ink);quad(m,u+.4,2.2,b-.8,h*.73,i===1?'#b8b998':'#f3c97b');
 for(let j=1;j<3;j++)line([m(u+.5,2.2+j*h*.19),m(u+b-.5,2.2+j*h*.19)],palette(st.ink,24),.7);
 quad(m,u+.45,2+h*.78,b-.9,h*.13,st.trim);
 if(i%2===0){quad(m,u+b*.41,2.5,.4,h*.63,st.ink);circ(m(u+b*.68,2+h*.31),.9,st.ink)}
 }
 const v=L*.34;
 quad(m,1,v-.7,w-2,L*.119,st.ink);quad(m,1.45,v-.33,w-2.9,L*.107,'none',st.trim,.5);
 panelText(m,w/2,v+.1,st.sign,Math.min(4,L*.10),st.trim,w*.73);
 // Two printed lantern medallions hang on silken strokes beside the display windows.
 for(let u of [2.85,w-2.85]){const yc=L*.29,r=.86;line([m(u,yc+2.6),m(u,yc+.8)],st.ink,.56);
 polygon(Array.from({length:12},(_,i)=>m(u+1.2*r*Math.cos(i*Math.PI/6),yc+1.45*r*Math.sin(i*Math.PI/6))),'#d76d45',st.ink,.46);
 line([m(u-.6,yc),m(u+.6,yc)],'#ffd084',.55);line([m(u,yc-1.1),m(u,yc-1.9)],'#b95332',.6)}
 // Articulated canopy. Width exactly equals the maker's separate awning.
 const am=(u,q)=>canopy(st,t,sd,y+u,q),stripes=9;
 for(let j=0;j<stripes;j++){let w1=(w-2)/stripes;quad(am,1+j*w1,0,w1,6,j%2?st.stripe:st.trim,'none');
 let a=1+j*w1;polygon([[a,6],[a+w1,6],[a+w1*.80,6.65],[a+w1*.5,6.9],[a+w1*.18,6.65]].map(p=>am(...p)),j%2?palette(st.stripe,-15):palette(st.trim,-13),'none')}
 line([am(1,0),am(w-1,0)],st.ink,.7);line([m(0,0),m(0,L)],st.trim,1);
 }
 const fL=f.A,fR=f.B,peak=f.P,end=st.y;
 for(const q of [fL,fR])line([[q[0],end,q[2]],[peak[0],end,peak[2]]],'#ead49d',1.3);
 line([[peak[0],end,peak[2]],[peak[0],end+st.w,peak[2]]],'#634738',1.7)
}
function tram(){if(t<150)return;let u=carX;let base=floor(u,5.75),ax=u<0?-1:1,h=t*Math.PI/360;
 const m=(x,y,z)=>[base[0]+x*Math.sin(h)-ax*z*Math.cos(h),base[1]+y,base[2]+x*ax*Math.cos(h)+z*Math.sin(h)];
 const q=(a,c,st='#513e39',w=.7)=>polygon(a.map(p=>m(...p)),c,st,w);
 for(let xx of [-6.4,6.3]){for(let yy of [-2.8,2.8]){q([[xx-1.65,yy,2],[xx-.9,yy,.25],[xx+.9,yy,.25],[xx+1.65,yy,2],[xx+.8,yy,3],[xx-1,yy,3]],'#414a46')}}
 q([[-10,-3.6,2],[10,-3.6,2],[10,-3.6,10],[-10,-3.6,10]],'#c06340');
 for(let x=-8.7;x<8.8;x+=3){q([[x,-3.62,5.1],[x+2.2,-3.62,5.1],[x+2.2,-3.62,8.9],[x,-3.62,8.9]],'#ffe4a0','#613f32',.6)}
 q([[-10,-3.64,3.5],[10,-3.64,3.5],[10,-3.64,4.15],[-10,-3.64,4.15]],'#f2c773','none');
 const e=side*10;q([[e,-3.6,2],[e,3.6,2],[e,3.6,10],[e,-3.6,10]],'#a9543b');q([[e,-2.7,5.5],[e,2.7,5.5],[e,2.7,8.9],[e,-2.7,8.9]],'#f8d68b');
 circ(m(e,-2.2,3.6),1.65,'#fff2ba');circ(m(e,2.2,3.6),1.65,'#fff2ba');
 q([[-10.6,-4.2,10],[10.6,-4.2,10],[10.6,4.2,10],[-10.6,4.2,10]],'#f2d198');q([[-6,-2.1,10.1],[5,-2.1,10.1],[5,2.1,10.1],[-6,2.1,10.1]],'#7e9a88');
 line([m(-2,0,10.3),m(-4,0,12.7),m(2,0,14.6),m(4,0,11),m(-2,0,10.3)],'#384d4a',1.15)
}
function cover(){const s=side,m=(u,v)=>floor(s*u,v,-.12);quad(m,0,-73,94,146,'#7e4740','#513935',1.1);quad(m,2,-71,90,142,'none','#cd9c67',.9);quad(m,3.5,-69.5,87,139,'none','#bd895b',.5);
 for(let i=0;i<6;i++)line([m(2+i*.72,-70),m(2+i*.72,70)],i%2?'#805043':'#9c6b52',1);
 const label=(u,v,str,size,col,w)=>panelText((a,b)=>m(v+b,u+a),0,0,str,size,col,w);
 for(let y of [-59,59]){for(let i=0;i<3;i++)line([m(12+i*1.9,y-2+i*1.25),m(80-i*1.9,y-2+i*1.25)],'#c59563',.7)}
 const ornament=(u,v,r)=>polygon([[u-r,v],[u,v+r*1.65],[u+r,v],[u,v-r*1.65]].map(p=>m(...p)),'none','#cda56d',.95);
 ornament(53,0,24);ornament(53,0,22.75);quad(m,45,-33,16,66,'#7e4740');label(0,54,'THE NIGHT MARKET',5.7,'#f0cc90',57);label(0,47,'P A P E R   M E C H A N I C S',2.1,'#e1ba7f',41);
 label(0,76,'04',4,'#d3b176',6);
}
function draw(){html='';let a=pj([0,0,0]);html+='<ellipse cx="'+a[0]+'" cy="'+(a[1]+55)+'" rx="'+(165+120*Math.sin(t*Math.PI/360))+'" ry="65" fill="#091f22" opacity=".55" filter="url(#blur)"/>';
 book(-side);book(side);
 if(t>130){for(const st of stalls){const f=frame(st,t);for(let sd of [-1,1]){let off=sd>0?st.b:st.a;polygon([[sd*off,st.y],[sd*off,st.y+st.w],[sd*(off+3),st.y+st.w+1.3],[sd*(off+2),st.y+.6]].map(p=>floor(...p)),'#728c7b','none')}}}
 for(let i=0;i<stalls.length;i++){if(i===2)tram();building(stalls[i])}if(t<2*Math.atan(.53/.48)*180/Math.PI)cover();dr.innerHTML=html;el('degrees').value=t+'°';angle.value=t;angle.setAttribute('aria-valuetext',t+' degrees open');el('tram').disabled=t!==180||moving; }
function stop(){if(anim)cancelAnimationFrame(anim);if(ride)cancelAnimationFrame(ride);anim=ride=0;moving=false;el('play').innerHTML='↺ <span>Replay opening</span>'}
const setmsg=s=>el('status').textContent=s;
angle.oninput=()=>{stop();t=+angle.value;draw();setmsg(t===180?'The market is open.':t===0?'All four houses lie flat.':'Open to 180° to run the tram.')};
const reduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
el('play').onclick=()=>{if(anim){stop();draw();setmsg('Opening paused.');return}stop();if(reduced()){t=t===180?0:180;draw();setmsg(t?'The market is open.':'All four houses lie flat.');return}let start=performance.now();el('play').innerHTML='Ⅱ <span>Pause opening</span>';setmsg('Unfolding the market…');function step(n){let x=Math.min(1,(n-start)/3400);t=Math.round(180*(.5-.5*Math.cos(x*Math.PI)));draw();if(x<1)anim=requestAnimationFrame(step);else{stop();setmsg('The market is open.')}}anim=requestAnimationFrame(step)};
el('tram').onclick=()=>{stop();if(t!==180)return;let start=performance.now(),a=carX,b=-carX;if(reduced()){carX=b;draw();setmsg('Tram arrived across the spine.');return}moving=true;setmsg('Tram crossing the book…');function step(n){let x=Math.min(1,(n-start)/2700);carX=a+(b-a)*(.5-.5*Math.cos(x*Math.PI));draw();if(x<1)ride=requestAnimationFrame(step);else{stop();draw();setmsg('Tram arrived across the spine.')}}ride=requestAnimationFrame(step)};
el('turn').onclick=()=>{side*=-1;draw();setmsg(side===1?'East-side view.':'West-side view.')};draw();
})();
