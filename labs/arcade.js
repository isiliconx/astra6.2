/* Three small, self-contained arcade instruments. All coordinates below are
   in an 800 x 500 logical viewport. Simulation time is independent of paint. */
(()=>{
'use strict';
const A=window.ASTRA=window.ASTRA||[], TAU=Math.PI*2;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),mix=(a,b,t)=>a+(b-a)*t;
const param=(name,min,max,step,value)=>({name,min,max,step,value});
function rand(i,s=0){let v=(Math.imul(i+73,1597334677)^(s|0))|0;v=Math.imul(v^(v>>>16),0x45d9f3b);v=Math.imul(v^(v>>>16),0x45d9f3b);return ((v^(v>>>16))>>>0)/4294967296}
function rect(c,x,y,w,h,k){c.fillStyle=k;c.fillRect(x,y,w,h)}
function circ(c,x,y,r,k){c.beginPath();c.arc(x,y,r,0,TAU);c.fillStyle=k;c.fill()}
function line(c,pts,k,l=1,close=false){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));if(close)c.closePath();c.strokeStyle=k;c.lineWidth=l;c.stroke()}
function poly(c,pts,k){c.beginPath();pts.forEach((p,i)=>i?c.lineTo(...p):c.moveTo(...p));c.closePath();c.fillStyle=k;c.fill()}
function txt(c,txt,x,y,k,sz=17,align='left',mono=false){c.fillStyle=k;c.font=(mono?'normal ':'bold ')+sz+'px '+(mono?'ui-monospace, monospace':'system-ui, sans-serif');c.textAlign=align;c.textBaseline='middle';c.fillText(txt,x,y)}
function grad(c,a,b){let g=c.createLinearGradient(0,0,0,500);g.addColorStop(0,a);g.addColorStop(1,b);rect(c,0,0,800,500,g)}
function band(c,ink,paper,left,right){rect(c,0,454,800,46,paper);txt(c,left,21,477,ink,19);txt(c,right,779,477,ink,16,'right',true)}
function panel(c,title,reason,action){rect(c,96,155,608,151,'rgba(10,18,27,.94)');rect(c,96,155,6,151,'#ffe48c');txt(c,title,400,191,'#fff5d2',30,'center');txt(c,reason,400,235,'#e1e7e6',19,'center');txt(c,action,400,275,'#ffe48c',17,'center',true)}
function input(t,s,key,create){
 let g=s[key];if(!g||t+.001<g.last||g.seed!==(s.seed|0)){g=s[key]=Object.assign(create(),{seed:s.seed|0,last:t,held:false,restart:false,phase:'idle',score:0})}
 const q=s.pointer||{}, k=s.keys||{}, held=!!(q.down||k.Space||k.Enter||k.ArrowUp||k.ArrowDown||k.ArrowLeft||k.ArrowRight||k.Digit1||k.Digit2||k.Digit3);
 const hit=held&&!g.held, restart=!!k.KeyR&&!g.restart,dt=clamp(t-g.last,0,.09);
 g.held=held;g.restart=!!k.KeyR;g.last=t;
 if(restart||(hit&&g.phase!=='run'))Object.assign(g,create(),{phase:'run',score:0});
 return {g,q,k,dt}
}
const ridge=(x,seed,base,amp)=>base+amp*(.44*Math.sin(x*.012+seed)+.25*Math.sin(x*.026+seed*.7)+.13*Math.cos(x*.049+seed)+.18*Math.abs(Math.sin(x*.075+seed)));
function moonY(x){
 if(x>=486&&x<=644)return 386;
 let y=ridge(x,8,356,46);
 if(x>446&&x<486)y=mix(y,386,(x-446)/40);
 if(x>644&&x<680)y=mix(386,y,(x-644)/36);
 return y;
}
function lunarBackdrop(c,t,seed){
 grad(c,'#181b37','#a46982');
 for(let i=0;i<125;i++){let x=rand(i,seed)*800,y=rand(i+145,seed)*300;circ(c,x,y,rand(i+512,seed)*1.45+.5,i%5?'#d5cdee':'#fff4cb')}
 const sun=c.createRadialGradient(590,122,41,590,122,97);sun.addColorStop(0,'#febca0');sun.addColorStop(.11,'#db8d85');sun.addColorStop(.25,'rgba(219,132,130,.2)');sun.addColorStop(1,'rgba(219,132,130,0)');circ(c,590,122,97,sun);circ(c,590,122,48,'#ffd5b3');circ(c,583,118,46,'#494061');
 for(let i=0;i<3;i++){let pts=[[0,455]];for(let x=0;x<=804;x+=8)pts.push([x,ridge(x,2+3*i,263+29*i,39+i*5)]);pts.push([804,455]);poly(c,pts,['#896f91','#665c7b','#474560'][i])}
 let pts=[[0,455]];for(let x=0;x<=804;x+=4)pts.push([x,moonY(x)]);pts.push([804,455]);poly(c,pts,'#282d43');line(c,pts.slice(1,-1),'#d2a2ab',2);
 for(let j=0;j<6;j++){let trace=[];for(let x=-2;x<808;x+=8)trace.push([x,moonY(x)+7+j*10+Math.sin(x*.027+j*1.7)*(j+1)]);line(c,trace,j%2?'#4f465a':'#3c3b50',1)}
 for(let i=0;i<105;i++){let x=rand(i+1200,seed)*800,y=moonY(x)+rand(i+1742,seed)*88+6;rect(c,x,y,rand(i+3000,seed)*4+1,1,'#7d6977')}
 rect(c,489,385,152,4,'#f3cf9a');
 for(const x of [490,640]){rect(c,x-2,365,4,19,'#e1d5ce');circ(c,x,363,4,'#fcbd69');circ(c,x,363,8+Math.sin(t*3)*1.3,'rgba(255,199,113,.2)')}
 txt(c,'H · 04',565,410,'#dfc9bc',16,'center',true)
}
function lander(c,x,y,angle,thrust,t){
 c.save();c.translate(x,y);c.rotate(angle);
 if(thrust){poly(c,[[-11,14],[-7,34],[0,49+8*Math.sin(t*30)],[9,31],[11,14]],'#f78659');poly(c,[[-7,13],[-3,33],[0,38+4*Math.cos(t*20)],[5,28],[7,13]],'#ffe6a5')}
 line(c,[[-11,7],[-23,22],[-32,22]],'#ffdaa0',3);line(c,[[11,7],[23,22],[32,22]],'#ffdaa0',3);
 poly(c,[[-14,5],[14,5],[18,14],[-18,14]],'#9f7887');rect(c,-15,5,30,4,'#f9b87f');
 poly(c,[[-17,3],[-16,-12],[-7,-21],[7,-21],[17,-11],[18,3]],'#f8d5ae');
 poly(c,[[-10,-12],[-3,-17],[5,-17],[12,-10],[10,-4],[-10,-4]],'#49657b');line(c,[[-7,-9],[-2,-13],[4,-13]],'#adcfcd',2);
 line(c,[[8,-20],[14,-29],[20,-29]],'#f3e8d8',2);circ(c,20,-29,2,'#ffad78');c.restore()
}
const newMoon=()=>({x:292,y:152,vx:0,vy:9,fuel:100,thrust:false,age:0,reason:''});
A.push({id:'mare-approach',title:'Mare Approach',category:'Arcade',description:'Fly a short final approach to H-04. Trade fuel for braking and put both feet on the illuminated pad.',method:'A damped lateral controller steers the lander while limited thrust opposes gravity. Contact speed and pad position determine the landing score.',gesture:'Hold to burn; drag toward the pad to steer. Release to descend. Keyboard: arrows to steer, Space to burn, R to retry.',params:[param('Gravity',14,32,1,21),param('Pad tolerance',16,38,1,28)],
 draw(c,w,h,t,p,s){const {g,q,k,dt}=input(t,s,'_mare',newMoon);c.save();c.scale(w/800,h/500);
 if(g.phase==='run'){let steps=Math.max(1,Math.ceil(dt*120)),d=dt/steps;
 for(let z=0;z<steps&&g.phase==='run';z++){g.age+=d;let burn=(q.down||k.Space||k.ArrowUp)&&g.fuel>0;g.thrust=!!burn;
 let aim=q.down?clamp((q.x*800-g.x)*1.42-g.vx*.85,-69,69):0;
 if(k.ArrowLeft||k.KeyA)aim=-62;if(k.ArrowRight||k.KeyD)aim=62;
 g.vx+=(aim-g.vx*.78)*d;g.vy+=((p[0]??21)-(burn?53:0))*d;g.fuel=Math.max(0,g.fuel-(burn?5.9:0)*d);
 g.x+=g.vx*d;g.y+=g.vy*d;if(g.y<45){g.y=45;g.vy=Math.max(0,g.vy)}
 g.score=Math.max(g.score,Math.round(clamp((g.y-152)/212,0,1)*200));
 let bottom=moonY(g.x)-22;if(g.x<12||g.x>788){g.phase='lost';g.reason='Left the approach corridor.'}
 else if(g.y>=bottom){g.y=bottom;let pad=g.x>=505&&g.x<=625,slow=g.vy<=(p[1]??28)&&Math.abs(g.vx)<=27;g.phase=pad&&slow?'won':'lost';g.reason=pad?'Brake sooner to reduce touchdown speed.':'Aim between the two amber beacons.';if(g.phase==='won')g.score+=500+Math.round(g.fuel*3+Math.max(0,30-Math.abs(g.vy))*5)}
 }}
 lunarBackdrop(c,t,g.seed);
 const idle=g.phase==='idle',x=idle?316+Math.sin(t*.45)*11:g.x,y=idle?179+Math.sin(t*.6)*6:g.y;
 if(idle){c.save();c.setLineDash([3,10]);line(c,[[x+28,y+15],[445,274],[565,367]],'#e0b9bb',2);c.restore()}
 lander(c,x,y,idle?-.09:clamp(g.vx*.004,-.24,.24),idle||g.phase==='run'&&g.thrust,t);
 txt(c,'FUEL',24,31,'#e0d6e8',15,'left',true);for(let i=0;i<14;i++)rect(c,77+i*10,24,7,14,i*100/14<g.fuel?'#ffcd99':'#574e66');
 txt(c,'↓ '+(idle?'09':String(Math.max(0,Math.round(g.vy))).padStart(2,'0'))+' m/s',777,31,'#fff2d9',19,'right',true);
 band(c,'#f6dfc6','#25293d',idle?'Hold to ignite':'H-04  /  lunar descent',idle?'LAND BELOW '+(p[1]??28)+' m/s':'SCORE '+g.score);
 if(g.phase==='won'||g.phase==='lost')panel(c,g.phase==='won'?'Soft touchdown':'Contact lost',g.phase==='won'?'H-04 is secure. Landing score: '+g.score:g.reason,'Tap to fly again');c.restore()
 }});
const lanes=[126,246,366],cargo=['#f16a4d','#36aa9d','#e2ae34'], cargoName=['Triangle','Circle','Square'];
function icon(c,i,x,y,r,k){if(i===0)poly(c,[[x,y-r],[x+r,y+r*.78],[x-r,y+r*.78]],k);else if(i===1)circ(c,x,y,r*.88,k);else rect(c,x-r*.8,y-r*.8,r*1.6,r*1.6,k)}
function smooth(u){u=clamp(u,0,1);return u*u*(3-2*u)}
function track(x,i){return 246+(lanes[i]-246)*smooth((x-326)/232)}
function railPoints(i,x0,x1){let pts=[];for(let x=x0;x<x1;x+=6)pts.push([x,track(x,i)]);pts.push([x1,track(x1,i)]);return pts}
function rail(c,i,on){
 let pts=railPoints(i,321,701);line(c,pts,'#b0aa8b',18);for(let x=334;x<702;x+=16){let y=track(x,i),slope=(track(x+1,i)-track(x-1,i))/2,sz=9/Math.sqrt(1+slope*slope);line(c,[[x-sz*slope,y+sz],[x+sz*slope,y-sz]],'#7a806e',3)}line(c,pts,on?'#2f4849':'#798274',8);line(c,pts,on?'#e6d99e':'#c3c2a6',4)
}
function train(c,x,y,ang,id){
 c.save();c.translate(x,y);c.rotate(ang);let dark='#283b3d';rect(c,-37,-12,64,28,'rgba(45,55,46,.20)');
 for(const xx of [-21,15]){rect(c,xx-4,-15,9,30,dark)}
 poly(c,[[-36,-12],[16,-12],[31,-7],[34,0],[31,8],[16,12],[-36,12]],dark);
 rect(c,-32,-9,32,18,cargo[id]);for(let d=0;d<4;d++)rect(c,-29+d*7,-8,2,16,'rgba(34,46,41,.22)');
 poly(c,[[4,-9],[15,-9],[25,-5],[25,5],[15,9],[4,9]],'#fcdf9b');rect(c,12,-7,7,14,'#537274');rect(c,28,-5,3,10,'#fff9c8');
 c.restore()
}
function signal(c,x,y,lit){rect(c,x-5,y,10,12,'#586052');circ(c,x,y,8,'#394a42');circ(c,x,y,4,lit?'#f5ce54':'#b19177')}
function yard(c,g,t,idle){
 rect(c,0,0,800,500,'#dfd9b4');
 for(let i=0;i<210;i++){let x=rand(i+540,g.seed)*800,y=rand(i+753,g.seed)*450;rect(c,x,y,2,1,'#c6c3a3')}
 // Survey grid and a river culvert under the single main line.
 for(let x=20;x<800;x+=40)line(c,[[x,53],[x,445]],'rgba(102,125,108,.09)');
 for(let y=70;y<452;y+=40)line(c,[[12,y],[788,y]],'rgba(102,125,108,.09)');
 poly(c,[[89,51],[122,51],[159,90],[164,133],[198,172],[196,215],[214,253],[210,312],[243,352],[240,389],[272,454],[237,454],[208,396],[212,363],[177,326],[179,266],[158,220],[161,181],[131,146],[125,105]],'#8eb9ab');
 line(c,[[108,68],[143,106],[150,140],[178,178],[176,217],[195,258],[194,321],[224,360],[225,393],[251,447]],'#bed4ba',3);
 // Warehouse roofs, a tank farm, stacks, and landscaped sidings.
 for(let i=0;i<3;i++){let x=244+40*i,y=88;rect(c,x+3,y+3,34,50,'#b8b494');rect(c,x,y,34,50,'#a4aa90');rect(c,x+2,y+2,30,43,'#c6c5a6');for(let a=1;a<5;a++)line(c,[[x+3,y+a*8],[x+30,y+a*8]],'#adb49a',1)}
 for(let i=0;i<4;i++){let x=49+i%2*28,y=343+Math.floor(i/2)*29;circ(c,x+2,y+3,13,'#b0b190');circ(c,x,y,12,'#9ca891');circ(c,x,y,9,'#d0ceab');line(c,[[x-6,y+5],[x+6,y-5]],'#aaba9e',2)}
 for(let i=0;i<25;i++){let x=398+rand(i+856,g.seed)*110,y=370+rand(i+938,g.seed)*44;circ(c,x+2,y+2,6,'#a7ac87');circ(c,x,y,6,'#9ba77e');circ(c,x-1.5,y-1.8,3.8,'#b1b793')}
 line(c,[[0,246],[326,246]],'#b0aa8b',18);for(let x=3;x<326;x+=17)line(c,[[x,235],[x,257]],'#7b8375',3);line(c,[[0,246],[326,246]],'#354a45',8);line(c,[[0,246],[326,246]],'#e4d9a8',4);
 const selected=g.selected;for(let i=0;i<3;i++)if(i!==selected)rail(c,i,false);rail(c,selected,true);
 for(let i=0;i<3;i++){let y=lanes[i];rect(c,667,y-32,97,65,'#b6ad8c');rect(c,663,y-36,97,65,'#344b48');rect(c,668,y-31,87,55,'#ede2b8');rect(c,669,y-30,12,54,cargo[i]);icon(c,i,709,y-4,12,'#324742');txt(c,'0'+(i+1),738,y+12,'#59685a',13,'center',true);signal(c,627,y-15,i===selected)}
 circ(c,327,246,14,'#374841');circ(c,327,246,7,'#f9cf65');line(c,[[327,246],[349,246+(selected-1)*13]],'#344942',4);circ(c,349,246+(selected-1)*13,5,'#344942');
 let displayX=idle?224+Math.sin(t*.6)*12:g.x;let y=track(displayX,g.locked<0?g.selected:g.locked),lane=g.locked<0?g.selected:g.locked;let a=Math.atan((track(displayX+2,lane)-track(displayX-2,lane))/4);
 train(c,displayX,y,a,g.dest);
 rect(c,0,0,800,53,'#344b48');txt(c,'FREIGHT',22,27,'#d4d7bd',17,'left',true);icon(c,g.dest,140,27,11,cargo[g.dest]);txt(c,cargoName[g.dest]+' depot',163,27,'#fff0c9',20);
 txt(c,'IN '+g.good+'/8     MISS '+g.bad+'/3',779,27,'#f8e8b9',17,'right',true);
 if(g.feedback>0){rect(c,24,283,234,35,'#344b48');txt(c,g.correct?'Shipment delivered':'Wrong depot',36,300,g.correct?'#fbefbd':'#ffb79e',17)}
 band(c,'#fff1d0','#344b48',idle?'Tap a depot to dispatch':g.locked<0?'Set the switch before the fork':'Route locked',idle?'MATCH THE SYMBOL':'SCORE '+g.score)
}
const newYard=()=>({x:35,selected:1,locked:-1,dest:0,good:0,bad:0,serial:0,feedback:0,correct:false});
A.push({id:'switchyard',title:'Switchyard No. 3',category:'Arcade',description:'Three terminal tracks, one switch. Read the shape on each freight order and route eight trains before three misdeliveries.',method:'Each order is generated from a seeded dispatch schedule. The selected path is latched at the junction, then the train follows its continuous track curve.',gesture:'Tap the upper, middle or lower depot to set the switch. Keys 1, 2 and 3 select the tracks; R restarts.',params:[param('Train speed',85,230,5,145)],
 draw(c,w,h,t,p,s){const {g,q,k,dt}=input(t,s,'_yard',newYard);c.save();c.scale(w/800,h/500);
 if(g.phase==='run'){if(q.down)g.selected=clamp(Math.round((q.y*500-lanes[0])/120),0,2);
 for(let i=0;i<3;i++)if(k['Digit'+(i+1)]||k['Numpad'+(i+1)])g.selected=i;
 g.feedback=Math.max(0,g.feedback-dt);g.x+=dt*((p[0]??145)+g.good*3);
 if(g.x>=326&&g.locked<0)g.locked=g.selected;
 if(g.x>=680){g.correct=g.locked===g.dest;g.feedback=1.05;if(g.correct){g.good++;g.score+=100+g.good*5}else{g.bad++;g.score=Math.max(0,g.score-35)}
 if(g.good>=8)g.phase='won';else if(g.bad>=3)g.phase='lost';else{g.serial++;g.dest=(g.dest+1+Math.floor(rand(g.serial,g.seed)*2))%3;g.x=30;g.locked=-1}}
 }
 yard(c,g,t,g.phase==='idle');
 if(g.phase==='lost'||g.phase==='won')panel(c,g.phase==='won'?'Shift complete':'Dispatch suspended',g.good+' correct deliveries. Shift score: '+g.score,'Tap a depot to play again');c.restore()
 }});
function sea(c,scroll,t,seed){
 grad(c,'#828cb4','#f4bd9c');
 const sun=c.createRadialGradient(590,170,4,590,170,90);sun.addColorStop(0,'#ffe39c');sun.addColorStop(1,'#f9c998');circ(c,590,164,68,sun);
 for(let i=0;i<8;i++){let y=80+rand(i+30,seed)*165,x=((rand(i,seed)*1120-scroll*.10)%1120+1120)%1120-140,r=6+rand(i+60,seed)*10;leafCloud(c,x,y,1+r/12)}
 for(let j=0;j<2;j++){
 let pts=[[0,365]];const offset=scroll*(.1+j*.05);
 for(let x=0;x<=804;x+=6){let z=x+offset,y=306+j*19+Math.sin(z*.006+j)*11+Math.sin(z*.015-j)*18+Math.max(0,Math.sin(z*.035+j))*7;
 pts.push([x,y])}pts.push([804,365]);poly(c,pts,j?'#728297':'#9a99a5')
 }
 let g=c.createLinearGradient(0,335,0,454);g.addColorStop(0,'#78929c');g.addColorStop(.45,'#557e8a');g.addColorStop(1,'#305d71');rect(c,0,337,800,117,g);
 for(let i=0;i<95;i++){const y=338+rand(i+144,seed)*112,x=((rand(i+270,seed)*900-scroll*.16-t*(3+(y-338)*.07))%900+900)%900-50,l=(3+rand(i+510,seed)*22)*(1+(y-338)/100);line(c,[[x,y],[x+l,y]],i%3?'rgba(211,226,209,.42)':'rgba(232,191,166,.69)',.7+(y-338)/150)}
 for(let i=0;i<18;i++){let x=579+rand(i+630,seed)*73-36+18*Math.sin(i*8+t*.2),y=339+i*3.8;line(c,[[x-7-i*.6,y],[x+7+i*.6,y]],'rgba(251,211,163,.59)',1.4)}
 // Seamarks below the three flight lanes give the horizon a scale reference.
 const lightX=(((1170-scroll*.24)%1130+1130)%1130)-25;
 poly(c,[[lightX-32,339],[lightX-12,332],[lightX+16,332],[lightX+35,340]],'#506172');
 poly(c,[[lightX-4,331],[lightX-2,307],[lightX+3,307],[lightX+5,331]],'#efe0c0');rect(c,lightX-3,313,7,6,'#a76b63');rect(c,lightX-4,304,8,4,'#4c6271');poly(c,[[lightX-5,304],[lightX,299],[lightX+5,304]],'#52606c')
}
function leafCloud(c,x,y,s){c.save();c.translate(x,y);c.scale(s,s);c.beginPath();c.moveTo(-34,4);c.bezierCurveTo(-34,0,-26,-2,-18,-2);c.bezierCurveTo(-14,-12,-5,-13,2,-7);c.bezierCurveTo(12,-12,20,-8,22,-3);c.bezierCurveTo(34,-3,42,2,45,4);c.closePath();c.fillStyle='rgba(253,232,211,.58)';c.fill();c.restore()}
function kite(c,x,y,roll,t,scale=1){
 c.save();c.translate(x,y);c.scale(scale,scale);c.rotate(roll);
 // Curved stitched foil and the taut bridles of a speed wing.
 const arch=q=>-24-25*Math.sin(q*Math.PI),base=q=>arch(q)+9+6*Math.sin(Math.PI*q);
 for(let i=0;i<11;i++){let u=i/11,v=(i+1)/11;poly(c,[[-50+100*u,arch(u)],[-50+100*v,arch(v)],[-50+100*v,base(v)],[-50+100*u,base(u)]],['#e65f53','#f2a184','#f6d3a9','#ce504a','#e77362','#f8c08e','#f7d7a8','#cd4d4b','#e76d58','#f3aa82','#e46254'][i])}
 const up=[],lo=[];for(let i=0;i<=22;i++){let u=i/22;up.push([-50+100*u,arch(u)]);lo.push([-50+100*u,base(u)])}
 line(c,up,'#924e58',1.6);line(c,lo,'#914f55',1.2);for(let i=0;i<6;i++){let u=i/5;line(c,[[-50+100*u,base(u)],[u<.5?-5:5,9]],'rgba(48,58,72,.82)',1.35)}
 circ(c,0,6,4,'#f7d3a2');circ(c,.6,4.6,3.8,'#364555');line(c,[[-6,7],[0,13],[7,6]],'#45576a',2.5);line(c,[[0,11],[-3,20],[5,21],[10,18]],'#323e4c',4);
 c.restore()
}
function hoop(c,x,y,r,id,passed){
 if(x<-30||x>832)return;
 let ink=passed?'rgba(246,234,195,.48)':'#fff0bd';
 // Air slalom gates are two floating lozenges with an open flying corridor.
 c.save();c.setLineDash([3,7]);line(c,[[x,y-r],[x,y+r]],passed?'rgba(241,216,179,.25)':'rgba(255,242,203,.66)',2);c.restore();
 for(let z of [-1,1]){let yy=y+z*r;poly(c,[[x-6,yy+z*9],[x-6,yy-z*1],[x,yy-z*7],[x+6,yy-z*1],[x+6,yy+z*9]],'#a4524d');poly(c,[[x-6,yy+z*8],[x,yy+z*1],[x+6,yy+z*8],[x+6,yy+z*15],[x-6,yy+z*15]],ink)}
 txt(c,String(id).padStart(2,'0'),x,y-r-27,ink,14,'center',true)
}
function gateY(id,seed){return id===1?205:120+rand(id,seed^719)*163}
const newCape=()=>({y:205,vy:0,aim:205,dist:0,next:1,passed:0,miss:0,flash:0,hit:false,age:0});
A.push({id:'lee-shore',title:'Lee Shore',category:'Arcade',description:'Pilot a speed wing down a quiet coast. Thread eight aerial gates before your third miss.',method:'The wing tracks a commanded altitude through a damped spring, with changing coastal gusts. Gates are evaluated when they cross the pilot’s flight line.',gesture:'Hold and drag to set your flight height, or use the up and down arrows. Fly the pilot between the flags. R starts a new run.',params:[param('Airspeed',75,195,5,120),param('Gate opening',24,60,2,40)],
 draw(c,w,h,t,p,s){const {g,q,k,dt}=input(t,s,'_cape',newCape);c.save();c.scale(w/800,h/500);const idle=g.phase==='idle',r=p[1]??40,speed=p[0]??120,pilot=216;
 if(g.phase==='run'){let sub=Math.max(1,Math.ceil(dt*100)),d=dt/sub;for(let j=0;j<sub&&g.phase==='run';j++){
 g.age+=d;g.flash=Math.max(0,g.flash-d);if(q.down)g.aim=clamp(q.y*500,72,330);if(k.ArrowUp||k.KeyW)g.aim=Math.max(72,g.aim-178*d);if(k.ArrowDown||k.KeyS)g.aim=Math.min(330,g.aim+178*d);
 const wind=Math.sin(g.age*1.53)*23+Math.cos(g.age*.71+g.seed)*11;
 g.vy+=((g.aim-g.y)*11.2-g.vy*5.5+wind)*d;g.y+=g.vy*d;g.dist+=speed*d;
 if(575+(g.next-1)*325-g.dist<=pilot){g.hit=Math.abs(g.y-gateY(g.next,g.seed))<=r;g.flash=.9;
 if(g.hit){g.passed++;g.score+=100+Math.round((1-Math.abs(g.y-gateY(g.next,g.seed))/r)*50)}else g.miss++;
 g.next++;if(g.passed>=8)g.phase='won';else if(g.miss>=3)g.phase='lost'}
 }}
 sea(c,idle?t*8:g.dist,t,g.seed);
 let d0=idle?0:g.dist;for(let i=Math.max(1,g.next-1);i<=g.next+2;i++)hoop(c,575+(i-1)*325-d0,gateY(i,g.seed),r,i,i<g.next);
 let y=idle?209+5*Math.sin(t*.72):g.y;
 for(let i=0;i<3;i++){let pts=[];for(let x=0;x<135;x+=5){let u=x/135;pts.push([pilot-27-x,y+4+i*4+u*(13*Math.sin(t*1.8-x*.028+i*.34)+4*Math.sin(x*.09))])}line(c,pts,'rgba(247,236,214,'+(.39-i*.09)+')',1.2)}
 kite(c,pilot,y-8,clamp(g.vy*.0014,-.23,.23)+(idle?-.09:0),t,1.2);
 rect(c,0,0,800,46,'rgba(39,58,80,.74)');txt(c,'GATES  '+g.passed+' / 8',22,24,'#f8ebcd',17,'left',true);txt(c,'MISSED  '+g.miss+' / 3',777,24,'#f8ebcd',17,'right',true);
 if(g.flash>0){txt(c,g.hit?'Cleared':'Gate missed',pilot+8,y+43,g.hit?'#fff2cb':'#752f33',18,'center')}
 band(c,'#f4e8cc','#344e5e',idle?'Touch to take flight':'Coastal slalom',idle?'8 GATES TO FINISH':'SCORE '+g.score);
 if(g.phase==='won'||g.phase==='lost')panel(c,g.phase==='won'?'Course cleared':'Course ended',g.passed+' gates cleared. Flight score: '+g.score,'Tap to fly again');
 c.restore()
 }});
})();
