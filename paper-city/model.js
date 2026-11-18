/* All lengths are millimetres, world axes x across / y along spine / z up. */
(function(root){
const stalls=[
 {id:'A',name:'Grand Hotel',sign:'HOTEL',a:19,b:15,p:70,y:41,w:24,wall:'#bc705f',ink:'#532f39',trim:'#ffd593',stripe:'#af5246',windows:3,levels:4},
 {id:'B',name:'Star Cinema',sign:'STAR',a:34,b:13,p:62,y:17,w:17,wall:'#619791',ink:'#224c51',trim:'#ffe5a6',stripe:'#397f79',windows:3,levels:2},
 {id:'C',name:'Lantern Tea Hall',sign:'TEA HALL',a:13,b:28,p:64,y:-23,w:23,wall:'#daa352',ink:'#594642',trim:'#ffe7ac',stripe:'#ab4340',windows:4,levels:2},
 {id:'D',name:'Moon Post',sign:'POST',a:24,b:14,p:52,y:-61,w:22,wall:'#80a8a4',ink:'#294752',trim:'#ffe5a6',stripe:'#478b89',windows:3,levels:2}
];
const rad=Math.PI/180, leaf=(x,y,t)=>[x*Math.sin(t*rad/2),y,Math.abs(x)*Math.cos(t*rad/2)];
function frame(s,t){
 const A=leaf(-s.a,0,t),B=leaf(s.b,0,t), L=s.p-s.a,R=s.p-s.b;
 if(t===0)return {A,B,P:[0,0,s.p],L,R};
 const dx=B[0]-A[0],dz=B[2]-A[2],d=Math.hypot(dx,dz),h=(L*L-R*R+d*d)/(2*d),k=Math.sqrt(Math.max(0,L*L-h*h));
 return {A,B,P:[A[0]+(h*dx-k*dz)/d,0,A[2]+(h*dz+k*dx)/d],L,R}
}
function progress(t){return Math.max(0,Math.min(1,(t-85)/85))}
function point(s,t,side,v,y,out=0){const f=frame(s,t),base=side===1?f.B:f.A,len=side===1?f.R:f.L;
 const ux=(f.P[0]-base[0])/len,uz=(f.P[2]-base[2])/len;
 return [base[0]+ux*v+side*uz*out,y,base[2]+uz*v-side*ux*out]}
function canopy(s,t,side,y,q){const f=frame(s,t),len=side===1?f.R:f.L,th=progress(t)*1.15;
 return point(s,t,side,.52*len-q*Math.cos(th),y,q*Math.sin(th))}
const api={stalls,leaf,frame,point,canopy,progress};root.City=api;if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
