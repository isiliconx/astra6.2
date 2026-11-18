/* Reduced shell instrument. SI inside the solver; display units only at its boundary. */
(function(root, make){const api=make();if(typeof module!=='undefined'&&module.exports)module.exports=api;else root.Kiln=api})(globalThis,function(){
  'use strict';
  const TAU=2*Math.PI,E=55e9,RHO=2350,NU=.22,ORDERS=[2,3,4,5,6];
  const profiles=[
    [[0,.43],[.045,.47],[.11,.63],[.28,.89],[.51,1],[.67,.92],[.79,.67],[.85,.50],[.94,.49],[1,.54]],
    [[0,.42],[.04,.47],[.10,.64],[.25,.89],[.49,1],[.65,.96],[.78,.79],[.90,.51],[.95,.49],[1,.51]],
    [[0,.34],[.055,.38],[.10,.45],[.24,.61],[.43,.77],[.71,.94],[.9,.99],[1,1]]
  ];
  const names=['Sienna flask','Indigo jar','Celadon bowl'];
  const defaults=[{kind:0,radius:10.2,height:18.5,wall:3.5},{kind:1,radius:9.6,height:14.1,wall:3.4},{kind:2,radius:9.2,height:8.8,wall:3.1}];
  function profile(kind,u){
    const p=profiles[kind];if(u<=0)return p[0][1];if(u>=1)return p[p.length-1][1];
    let j=0;while(p[j+1][0]<u)j++;const a=p[j],b=p[j+1],h=b[0]-a[0],x=(u-a[0])/h;
    function slope(i){const s=k=>(p[k+1][1]-p[k][1])/(p[k+1][0]-p[k][0]);if(!i)return s(0);if(i===p.length-1)return s(i-1);let l=s(i-1),r=s(i);return l*r<=0?0:2*l*r/(l+r);}
    return (1-3*x*x+2*x*x*x)*a[1]+(3*x*x-2*x*x*x)*b[1]+h*((x-2*x*x+x*x*x)*slope(j)+(x*x*x-x*x)*slope(j+1));
  }
  const envelope=u=>u*u*(3-u)/2;
  function surface(n,u,theta){return envelope(u)*Math.cos(n*theta)}
  function tangent(n,u,theta){return -envelope(u)*Math.sin(n*theta)/n}
  const cache=new Map();
  function angular(n,N){
    let key=n+':'+N;if(cache.has(key))return cache.get(key);
    let ds=TAU/N,curv=0,rad=0,mass=0;for(let i=0;i<N;i++){let a=i*ds,w=Math.cos(n*a),v=-Math.sin(n*a)/n;
      let L=(Math.cos(n*(a-ds))-2*w+Math.cos(n*(a+ds)))/(ds*ds)+w;
      curv+=L*L;rad+=w*w;mass+=w*w+v*v;
    }let v={curv,rad,mass};cache.set(key,v);return v;
  }
  function integrate(radius,height,thickness,trial,orders=ORDERS,N=96,M=64){
    const ds=[],r=[],w=[];for(let i=0;i<=M;i++){r.push(radius(i/M));w.push(trial(i/M));if(i)ds.push(Math.hypot(height/M,r[i]-r[i-1]));}
    let S=0,B=0,T=0;
    for(let i=0;i<=M;i++){
      const left=ds[Math.max(0,i-1)],right=ds[Math.min(M-1,i)],area=r[i]*((i?left:0)+(i<M?right:0))/2;
      // One-sided three-point estimate at endpoints; non-uniform central difference inside.
      const k=i===0?1:i===M?M-1:i;
      const d2=2*((w[k+1]-w[k])/ds[k]-(w[k]-w[k-1])/ds[k-1])/(ds[k]+ds[k-1]);
      S+=area*w[i]**2/r[i]**4; B+=area*d2*d2;T+=area*w[i]**2;
    }
    return orders.map((n,i)=>{const a=angular(n,N),f=thickness/TAU*Math.sqrt(E/(12*RHO*(1-NU*NU))*(a.curv*S+a.rad*B)/(a.mass*T));
      return {n,f,weight:[1,.43,.23,.12,.07][i]??.1,tau:1.22/(1+.38*i)};
    });
  }
  function modes(g,N=96,M=64){return integrate(u=>g.radius*.01*profile(g.kind,u),g.height*.01,g.wall*.001,envelope,ORDERS,N,M)}
  function reference(N){let R=.1,h=.003;return integrate(()=>R,.1,h,()=>1,ORDERS,N,64).map(m=>{const n=m.n,exact=h/TAU/R**2*Math.sqrt(E/(12*RHO*(1-NU**2)))*n*(n*n-1)/Math.sqrt(n*n+1);return {...m,exact,error:100*Math.abs(m.f-exact)/exact}});}
  function note(f){let m=69+12*Math.log2(f/440),k=Math.round(m);return {name:['C','C♯','D','E♭','E','F','F♯','G','A♭','A','B♭','B'][((k%12)+12)%12]+(Math.floor(k/12)-1),cents:Math.round(100*(m-k))};}
  function tune(g,target){return g.wall*target/modes(g)[0].f}
  return {TAU,defaults,names,profile,envelope,surface,tangent,modes,integrate,reference,note,tune};
});
