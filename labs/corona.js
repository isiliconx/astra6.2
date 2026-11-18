window.ASTRA.push({
 id:'corona-loom',title:'Corona Loom',category:'Light',description:'Pull a copper-and-ice ribbon through itself. Turn it edge-on and the folds reveal where the bright lines in the cover came from.',
 method:'A family of filaments winds around a warped toroidal centerline. Each filament is offset across a twisting ribbon. This interactive wire version draws fewer samples than the CUDA print, allowing the folds to turn in real time.',
 gesture:'Drag sideways to turn the ribbon; drag vertically to tilt it.',params:[{name:'Twist',min:.5,max:4.5,step:.1,value:2.5},{name:'Ribbon width',min:.03,max:.42,step:.01,value:.23}],
 draw(c,w,h,t,p,s){
 c.fillStyle='#0b0e13';c.fillRect(0,0,w,h);
 if(!s.cc){s.cc=[0,.03,0];s.ang=0;s.tilt=.52}
 let q=s.pointer;
 if(q.down){if(s.last){s.ang+=(q.x-s.last[0])*4;s.tilt=Math.max(-1,Math.min(1,s.tilt+(q.y-s.last[1])*2))}s.last=[q.x,q.y]}else s.last=null;
 const phase=.08*Math.sin(t*.11),dir=s.ang+phase,tau=Math.PI*2,size=Math.min(w*.414,h*.625);
 c.save();c.translate(w*.5,h*.50);c.globalCompositeOperation='lighter';const sin=Math.sin,cos=Math.cos;
 const n=w<600?115:155, lines=w<600?74:112;
 if(!s.cache||s.cache.n!==n){s.cache={n,table:Array.from({length:n+1},(_,i)=>{const a=i/n*tau;return[a,sin(a),cos(a),sin(2*a+.52),cos(3*a-.25),.74+.12*cos(3*a+.4)+.085*sin(2*a+.6),.54*sin(3*a),cos(2*a+.5)]})}}
 for(let j=0;j<lines;j++){const v=2*j/(lines-1)-1,pal=(j%8)/8;c.lineWidth=Math.max(.45,.0014*size);for(let part=0;part<10;part++){c.beginPath();let angle=(part+.5)/10*tau,k=(.5+.5*sin(angle-1.2+.5*v))**3;
 c.strokeStyle='rgba('+[Math.round(218-136*k),Math.round(69+99*k+49*(v+1)),Math.round(31+179*k),(.26+.28*pal)].join(',')+')';
 const start=Math.floor(n*part/10),end=Math.floor(n*(part+1)/10);for(let i=start;i<=end;i++){let[a,sa,ca,s2,c3,core,tw]=s.cache.table[i],twist=p[0]*a+tw+.44+v*.36,off=v*p[1]+.028*sin(10*a+3*v)+.014*sin(27*a+3*v),r=core+off*cos(twist),x=r*ca,y=r*sa,z=.21*s2+.19*c3+off*sin(twist);const xx=x*cos(dir)-y*sin(dir),yy=x*sin(dir)+y*cos(dir);let px=size*(.98*xx+.12*yy),py=size*(-.18*xx+yy*s.tilt-z*Math.sqrt(1-s.tilt*s.tilt));if(i===start)c.moveTo(px,py);else c.lineTo(px,py)} c.stroke();}}
 c.restore();
 }});
