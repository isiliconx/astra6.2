/* Two circular period aliases with equal priors and a known continuum. */
(function(g,f){const api=f();if(typeof module!=='undefined')module.exports=api;if(g)g.TransitLab=api})(typeof window==='undefined'?null:window,()=>{
 'use strict';
 function rng(n){let s=2166136261;for(const c of String(n))s=Math.imul(s^c.charCodeAt(0),16777619);return()=>{s=(s+0x6d2b79f5)>>>0;let a=Math.imul(s^(s>>>15),s|1);a^=a+Math.imul(a^(a>>>7),a|61);return((a^(a>>>14))>>>0)/4294967296}}
 const normal=r=>Math.sqrt(-2*Math.log(Math.max(.0000001,r())))*Math.cos(2*Math.PI*r());
 function build(seed){const r=rng('star'+seed),p=4+r()*2.4,dep=1000+r()*1550,width=.11+r()*.065,q=1.5*p,truth=r()<.5?0:1;
 const make=(id,x,cloud=.8)=>({id,center:x*p+(r()-.5)*width*.28,sigma:Math.round((430+r()*490)*cloud),span:width*(2.25+r()*.35)});
 const rounds=Array.from({length:3},(_,k)=>[1,1.5,2,2.5,3,3.5].map((v,i)=>make('N'+(k+1)+'-'+(i+1),6*k+v,[1.35,1,.8,.85,1,.7][i])));const slots=rounds.flat();
 const future=make('sealed',r()<.5?16:16.5,1);return{seed:String(seed),p:[p,q],depth:dep,width,truth,slots,rounds,future}}
 function signal(s,t,j){const P=s.p[j],phase=Math.abs(t-Math.round(t/P)*P),h=s.width/2;return -s.depth*Math.max(0,Math.min(1,(h-phase)/(.29*h)))}
 function pred(s,slot,j){return signal(s,slot.center,j)<-.4*s.depth}
 function take(s,slot){const r=rng('photons '+s.seed+' '+slot.id);return Array.from({length:39},(_,i)=>{const t=slot.center+slot.span*(i/38-.5);return{t,y:signal(s,t,s.truth)+normal(r)*slot.sigma}})}
 function update(s,slot,data,priorLogOdds=0){let log=priorLogOdds;for(const e of data){const a=e.y-signal(s,e.t,0),b=e.y-signal(s,e.t,1);log+=(b*b-a*a)/(2*slot.sigma**2)}return log}
 function probability(log){return log>=0?1/(1+Math.exp(-log)):Math.exp(log)/(1+Math.exp(log))}
 function fluxGap(s,slot){let sum=0;for(let i=0;i<39;i++){const t=slot.center+slot.span*(i/38-.5),delta=signal(s,t,0)-signal(s,t,1);sum+=delta*delta}return sum/(2*slot.sigma**2)}
 function history(s,k){const slot={id:'archive'+k,center:k===0?-s.p[0]*3:0,span:s.width*2.45,sigma:680};return{slot,data:take(s,slot)}}
 function brier(p,b){return (p-(b?1:0))**2}
 return{build,signal,pred,take,update,probability,fluxGap,history,brier,rng};
});
