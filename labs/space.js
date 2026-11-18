/* Sculpture cabinet. All surfaces, visibilities and projections are computed in this file. */
(() => {
  'use strict';
  const catalogue=window.ASTRA||(window.ASTRA=[]),TAU=2*Math.PI,PI=Math.PI;
  const C=Math.cos,S=Math.sin,cl=(x,a,b)=>Math.min(b,Math.max(a,x)),mix=(a,b,q)=>a+(b-a)*q;
  const add=(a,b)=>a.map((x,i)=>x+b[i]), sub=(a,b)=>a.map((x,i)=>x-b[i]), mul=(a,q)=>a.map(x=>x*q);
  const dot=(a,b)=>a[0]*b[0]+a[1]*b[1]+a[2]*b[2], cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const norm=a=>mul(a,1/(Math.hypot(...a)||1)), par=(name,min,max,step,value)=>({name,min,max,step,value});
  const rgb=(a,b)=>'rgb('+a.map(x=>Math.round(cl(x*b,0,255))).join(',')+')';
  const line=(g,p,col,weight=1,close=false)=>{if(!p.length)return;g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)g.lineTo(p[i][0],p[i][1]);if(close)g.closePath();g.strokeStyle=col;g.lineWidth=weight;g.stroke()};
  const poly=(g,p,col,edge,lw=.6)=>{if(p.length<3)return;g.beginPath();g.moveTo(p[0][0],p[0][1]);for(let i=1;i<p.length;i++)g.lineTo(p[i][0],p[i][1]);g.closePath();g.fillStyle=col;g.fill();if(edge){g.strokeStyle=edge;g.lineWidth=lw;g.stroke()}};
  function canvas(g,w,h,bg,glow){
    g.save();g.fillStyle=bg;g.fillRect(0,0,w,h);
    let k=Math.min(w/750,h/450);g.translate(w/2,h/2);g.scale(k,k);g.lineJoin='round';g.lineCap='round';
    let r=g.createRadialGradient(-25,-32,1,0,0,395);r.addColorStop(0,glow);r.addColorStop(1,bg);g.fillStyle=r;g.fillRect(-w/k/2,-h/k/2,w/k,h/k);
    return [w/(2*k),h/(2*k)];
  }
  function caption(g,bounds,ink,left,right){
    const x=bounds[0]-21,y=bounds[1]-17;g.fillStyle=ink;g.font='11px ui-monospace,monospace';g.textBaseline='bottom';g.textAlign='left';g.fillText(left,-x,y);g.textAlign='right';g.fillText(right,x,y);
    for(const cx of [-x,x]){line(g,[[cx,-y],[cx,-y+9]],ink,.8);line(g,[[cx,-y],[cx+(cx<0?9:-9),-y]],ink,.8)}
  }
  function shadow(g,y,rx,ry,color){g.save();g.translate(0,y);g.scale(rx,ry);const f=g.createRadialGradient(0,0,0,0,0,1);f.addColorStop(0,color);f.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=f;g.fillRect(-1,-1,2,2);g.restore()}
  // Drag deltas accumulate, so grabbing an object doesn't jump its orientation.
  function orbit(s,t,auto=.08){
    const q=s.pointer||{x:.5,y:.5,down:false},o=s.sculptOrbit||(s.sculptOrbit={yaw:0,pitch:0,last:t,spin:0});
    if(q.down&&o.held){o.yaw+=(q.x-o.x)*5.4;o.pitch=cl(o.pitch+(q.y-o.y)*2.65,-.99,.99)}
    if(!q.down)o.spin+=cl(t-o.last,0,.15)*auto;
    o.x=q.x;o.y=q.y;o.held=q.down;o.last=t;return[o.yaw+o.spin,o.pitch];
  }
  function cam(yaw,pitch,scale,dy=0,dx=0){
    const cy=C(yaw),sy=S(yaw),ce=C(pitch),se=S(pitch);
    return v=>{const x=v[0]*cy+v[2]*sy,z=v[2]*cy-v[0]*sy, y=v[1]*ce-z*se,depth=z*ce+v[1]*se;return [x*scale+dx,-y*scale+dy,depth]};
  }
  function painter(proj){
    const list=[];let order=0;
    return {
      face(verts,ink,edge=null,lw=.6,detail=null){const p=verts.map(proj);list.push({d:p.reduce((a,v)=>a+v[2],0)/p.length,i:order++,go:g=>{poly(g,p,ink,edge,lw);if(detail)detail(g,p)}})},
      wire(verts,ink,lw=1,offset=.003){const p=verts.map(proj);list.push({d:p.reduce((a,v)=>a+v[2],0)/p.length+offset,i:order++,go:g=>line(g,p,ink,lw)})},
      paint(g){list.sort((a,b)=>(a.d-b.d)||(a.i-b.i));for(const f of list)f.go(g)}
    };
  }
  function cuboid(z,x0,x1,y0,y1,z0,z1,cols){
    const v=[[x0,y0,z0],[x1,y0,z0],[x1,y0,z1],[x0,y0,z1],[x0,y1,z0],[x1,y1,z0],[x1,y1,z1],[x0,y1,z1]];
    for(const [j,idx] of [[0,[0,1,5,4]],[1,[1,2,6,5]],[2,[2,3,7,6]],[3,[3,0,4,7]],[4,[4,5,6,7]]])z.face(idx.map(i=>v[i]),cols[j],null);
  }
  function rod(z,a,b,col,r=.013){
    const d=norm(sub(b,a)),v=norm(cross(d,Math.abs(d[1])>.8?[1,0,0]:[0,1,0])),u=norm(cross(d,v)),n=6;
    for(let i=0;i<n;i++){const o=q=>mul(add(mul(v,C(q)),mul(u,S(q))),r),o1=o(i*TAU/n),o2=o((i+1)*TAU/n);z.face([add(a,o1),add(b,o1),add(b,o2),add(a,o2)],rgb(col,.78+.18*C(i*TAU/n)))}
  }

  catalogue.push({id:'copper-selvedge',title:'Copper Selvedge',category:'Sculpture',
    description:'One continuous length of enamelled cable closes into a knot. Follow the ivory tracer through its crossings.',
    method:'A (2,q) torus knot supplies the centreline. Cross products build a local frame at each station; a rotating material stripe winds around that frame. Tube faces are depth-sorted before painting.',
    gesture:'Drag to orbit. Increase the crossing count to change the topology, then tighten the cable to reveal its inner passage.',
    params:[par('Crossing count',3,9,2,3),par('Cable radius',.065,.245,.005,.175)],
    draw(g,w,h,t,p,s){
      const b=canvas(g,w,h,'#151321','#373046'),[y,e]=orbit(s,t,.115),q=Math.round(p[0])|1,thick=p[1],pr=cam(y-.33,.34+e,105,0);
      shadow(g,139,174,21,'rgba(3,2,7,.50)');
      const z=painter(pr),n=112,m=12,seed=((s.seed||0)%941)/941*.72;
      const pt=a=>{let r=1.02+.49*C(q*a+seed);return [r*C(2*a),r*S(2*a),.59*S(q*a+seed)]};
      const rr=[];
      for(let i=0;i<n;i++){
        const a=i*TAU/n,P=pt(a),T=norm(sub(pt(a+.0001),pt(a-.0001))),v=norm(cross(T,[0,0,1])),u=norm(cross(T,v));
        rr[i]=[];for(let j=0;j<m;j++){
          const phi=(j/m+2*i/n)*TAU,N=add(mul(v,C(phi)),mul(u,S(phi)));
          rr[i][j]={v:add(P,mul(N,thick)),l:N};
        }
      }
      const light=norm([-.42,.82,.7]);
      for(let i=0;i<n;i++)for(let j=0;j<m;j++){
        const A=rr[i][j],B=rr[(i+1)%n][j],D=rr[i][(j+1)%m],E=rr[(i+1)%n][(j+1)%m],N=norm(add(add(A.l,B.l),add(D.l,E.l))),hue=j===0?[255,230,177]:j===1?[103,57,57]:j===6?[235,125,75]:[206,92,69];
        const l=.58+.48*Math.max(0,dot(N,light))+.13*Math.pow(Math.max(0,dot(N,norm([-.1,.6,.94]))),8),col=rgb(hue,l);
        z.face([A.v,B.v,E.v,D.v],col,col,.52);
      }z.paint(g);caption(g,b,'#bca7ad','KNOT  /  2 : '+q,'CLOSED CURVE');g.restore();
    }
  });

  catalogue.push({id:'pecten-valve',title:'Pecten Cabinet',category:'Sculpture',
    description:'A ribbed fan shell, modelled from its hinge outward. Fine growth bands pass over the broader radial folds.',
    method:'A polar fan expands into a domed valve. Radial corrugations deform both its surface and lip; repeated pigment bands share the growth coordinate. The hinge ears are separate triangular extensions.',
    gesture:'Drag to turn the specimen over. Change rib count or dome depth to see which features survive a change in profile.',
    params:[par('Radial ribs',8,24,1,15),par('Valve depth',.12,.75,.01,.45)],
    draw(g,w,h,t,p,s){
      const b=canvas(g,w,h,'#e0cdad','#f8e7c9'),[yaw,e]=orbit(s,t,0),pr=cam(.18+yaw+.10*S(t*.23),-.13+e,140,-1),z=painter(pr);
      const ribs=Math.round(p[0]),depth=p[1],sk=.02*S((s.seed||0)*.17),L=norm([-.55,.82,.78]),na=ribs*6,nr=26;
      shadow(g,147,161,17,'rgba(77,49,30,.27)');
      function val(i,j){
        const a=i/na,theta=(a-.5)*2.82,r=.023+.977*(j/nr),ridge=C(TAU*ribs*a),edge=r*(1+.022*ridge*Math.pow(r,2))*(1+.10*C(theta*2)+sk*S(3*theta));
        const x=1.28*edge*S(theta),y=-.92+1.84*edge*C(theta),d=depth*(Math.pow(S(PI*r),.88)*(.42+.58*C(theta))+.13*(.5+.5*ridge)*Math.pow(r,.64))+.047*(.5+.5*ridge)*r;
        return [x,y,d];
      }
      const mesh=Array.from({length:na+1},(_,i)=>Array.from({length:nr+1},(_,j)=>val(i,j)));
      const earcols=['#d2a47f','#ac765d','#bd876a'];
      for(let sg of [-1,1])for(let i=0;i<6;i++){
        const P=[sg*.03,-.92,-.012],a1=i/6,a2=(i+1)/6;
        const E=a=>[sg*(.24+.15*a),-.64-.29*a,.016-.04*a];
        z.face([P,E(a1),E(a2)],earcols[i%3],'#b58267',.65);
      }
      for(let i=0;i<na;i++)for(let j=0;j<nr;j++){
        const A=mesh[i][j],B=mesh[i+1][j],D=mesh[i][j+1],E=mesh[i+1][j+1],N=norm(cross(sub(B,A),sub(D,A))),a=(i+.5)/na,r=(j+.5)/nr;
        const stripe=.5+.5*C(TAU*(2.85*r+.23*S(11*a)+.12*C(31*a))),band=Math.pow(stripe,3.3)*(.35+.65*r),ridge=.5+.5*C(TAU*ribs*a),pigment=cl(band*.75+.13*(1-ridge)+.12*(1-r),0,.96);
        const hue=[mix(248,172,pigment),mix(211,77,pigment),mix(157,53,pigment)];
        const col=rgb(hue,.71+.30*Math.max(0,dot(N,L))+.06*ridge);
        z.face([A,B,E,D],col,col,.48,j%3===2?(ctx,ps)=>line(ctx,[ps[2],ps[3]],'rgba(94,53,39,.25)',.72):null);
      }
      z.paint(g);caption(g,b,'#745746','VALVA   /   '+ribs+' COSTAE','MORPHOLOGY STUDY');g.restore();
    }
  });

  catalogue.push({id:'saddle-house',title:'Saddle House',category:'Sculpture',
    description:'A rust-red roof spans four pins. Its apparent double curve is built entirely from straight courses.',
    method:'The roof height is a bilinear function of plan coordinates. Each constant-u or constant-v curve is therefore a straight ruling. A second offset skin gives the edge thickness; columns terminate exactly at the four corner heights.',
    gesture:'Drag to walk around the model. Raise the saddle to pull opposite corners apart, or reduce the number of courses to expose its construction.',
    params:[par('Corner rise',.22,1.10,.02,.85),par('Roof courses',6,24,1,15)],
    draw(g,w,h,t,p,s){
      const b=canvas(g,w,h,'#c8cec8','#e5e7d8'),[a,e]=orbit(s,t,.055),pr=cam(.43+a,.39+e*.65,87,8),z=painter(pr),base=painter(pr),rise=p[0],n=Math.round(p[1]),lx=1.75,lz=1.17,ground=-.96;
      const roof=(u,v,d=0)=>[lx*u,.44+rise*u*v+.06*u+d,lz*v],ink='#664039',brass='#b5865b';
      const floor=[[-2.13,ground,-1.55],[2.13,ground,-1.55],[2.13,ground,1.55],[-2.13,ground,1.55]];
      shadow(g,153,215,25,'rgba(37,60,51,.24)');
      cuboid(base,-2.16,2.16,ground-.13,ground,-1.58,1.58,['#8e9388','#959c8b','#999c8e','#a5ab96','#c1c3ae']);base.paint(g);
      // Plan lines and the four-corner shadow sit on top of the separate plinth pass.
      for(let i=-8;i<=8;i++)line(g,[pr([i*.25,ground,-1.55]),pr([i*.25,ground,1.55])],'rgba(68,83,73,.22)',.65);
      for(let i=-6;i<=6;i++)line(g,[pr([-2.12,ground,i*.25]),pr([2.12,ground,i*.25])],'rgba(68,83,73,.22)',.65);
      poly(g,floor.map(([x,y,z])=>pr([x*.83+.18,y,z*.76+.16])),'rgba(65,76,60,.14)',null);
      // An off-centre bench sets the scale without obstructing the open span.
      const concrete=['#92917e','#858976','#909783','#abb09b','#c7c8b2'];
      for(const x of [-.72,.04])cuboid(z,x-.05,x+.05,ground,ground+.21,-.28,-.04,concrete);
      cuboid(z,-.89,.21,ground+.21,ground+.25,-.33,.02,['#977456','#8c674d','#976e52','#a18060','#b3926c']);
      for(let u of [-1,1])for(let v of [-1,1]){
        const T=roof(u*.93,v*.93,-.09),foot=[T[0],ground,T[2]];
        cuboid(z,T[0]-.082,T[0]+.082,ground,ground+.10,T[2]-.082,T[2]+.082,['#777d6d','#9a9f8c','#828b78','#a3a78e','#b9bba7']);
        rod(z,foot,T,[97,92,72],.034);
      }
      for(let i=0;i<n;i++)for(let j=0;j<n;j++){
        const u=i*2/n-1,v=j*2/n-1,U=(i+1)*2/n-1,V=(j+1)*2/n-1,top=[roof(u,v),roof(U,v),roof(U,V),roof(u,V)];
        const nrm=norm([-rise*(v+V)/(2*lx),1,-rise*(u+U)/(2*lz)]);
        const col=rgb([184,79,55],.81+.27*dot(nrm,norm([-.55,.85,-.20]))+(i%4===0?.025:0));
        z.face(top,col,col,.6,(c,p)=>{line(c,[p[0],p[3]],'rgba(94,45,30,.6)',.85);line(c,[p[0],p[1]],'rgba(242,166,112,.53)',.68)});
        if(i===0||i===n-1){const k=i===0?u:U;z.face([roof(k,v),roof(k,V),roof(k,V,-.09),roof(k,v,-.09)],ink,ink,.5)}
        if(j===0||j===n-1){const k=j===0?v:V;z.face([roof(u,k),roof(U,k),roof(U,k,-.09),roof(u,k,-.09)],'#9a5741','#9a5741',.5)}
      }
      for(let i=0;i<=n;i+=2){const u=i*2/n-1;for(let j=0;j<8;j++){const v=j/4-1;z.wire([roof(u,v,-.10),roof(u,v+.25,-.10)],brass,1.25)}}
      z.paint(g);caption(g,b,'#51665b','STRUCTURE  /  HYPAR','1 : 100   MODEL');g.restore();
    }
  });

  catalogue.push({id:'cleavage-plane',title:'Cleavage Plane',category:'Sculpture',
    description:'Lower a lapidary saw through a cluster of violet crystals. The fresh faces reveal nested growth zones.',
    method:'Each crystal is a tilted, terminated hexagonal prism. A horizontal half-space clips every face. Edge intersections are sorted around their centroid to construct the exposed section; the rings are a stylized growth-zone diagram.',
    gesture:'Drag to rotate the cluster. Lower the cut from the tips toward the roots, or spread the crystals to inspect one section at a time.',
    params:[par('Section height',-.65,1.85,.025,1.08),par('Cluster spread',.55,1.36,.01,.98)],
    draw(g,w,h,t,p,s){
      const b=canvas(g,w,h,'#1d2734','#39434d'),[a,e]=orbit(s,t,.09),pr=cam(-.31+a,.30+e*.65,107,27),z=painter(pr),cut=p[0],spread=p[1],seed=((s.seed||0)%65521)/65521*TAU;
      shadow(g,117,171,24,'rgba(1,7,13,.54)');
      // x,z, radius, shaft height, outward tilt X/Z
      const cluster=[[-.88,.13,.36,1.34,-.38,.05],[-.57,-.47,.41,1.83,-.14,-.18],[.04,-.30,.53,2.29,.05,-.04],[.64,-.43,.31,1.56,.28,-.16],[.86,.17,.40,1.63,.31,.10],[.36,.52,.35,1.29,.16,.21],[-.32,.45,.33,1.14,-.17,.25]];
      const tint=[[130,119,205],[151,131,211],[140,117,192],[118,129,209],[157,138,221],[148,116,195],[135,153,209]];
      for(let k=0;k<cluster.length;k++){
        const [x,z0,r,H,tx,tz]=cluster[k],tw=.47*k+.18*S(seed+k),base=-.88,cent=(j,u,h)=>[x*spread+tx*h+r*u*C(tw+j*TAU/6),base+h,z0*spread+tz*h+r*u*S(tw+j*TAU/6)];
        let rings=[[0,.78],[.13,1],[H*.72,1],[H-.18,.88],[H+.25,.03]].map(([h,u])=>Array.from({length:6},(_,i)=>cent(i,u,h)));
        let hits=[];
        for(let j=0;j<4;j++)for(let i=0;i<6;i++){
          const idx=(i+1)%6,F=[rings[j][i],rings[j+1][i],rings[j+1][idx],rings[j][idx]],out=[];
          for(let n=0;n<F.length;n++){let u=F[n],v=F[(n+1)%F.length],uIn=u[1]<=cut,vIn=v[1]<=cut;if(uIn)out.push(u);if(uIn!==vIn){const q=(cut-u[1])/(v[1]-u[1]),I=add(u,mul(sub(v,u),q));out.push(I);if(!hits.some(P=>Math.hypot(P[0]-I[0],P[2]-I[2])<1e-5))hits.push(I)}}
          if(out.length<3)continue;
          const normal=norm(cross(sub(F[1],F[0]),sub(F[2],F[0]))),l=.66+.35*dot(normal,norm([-.63,.67,.4]))+.05*j,col=rgb(tint[k],l),edge=rgb(tint[k],l*1.13);
          z.face(out,col,edge,.85,(ctx,P)=>{if(j===1||j===2){for(let q=1;q<=4;q++){const u=q*.10+.26,pa=P[0],pb=P[1],pc=P[P.length-2],pd=P[P.length-1];if(pa&&pb&&pc&&pd)line(ctx,[[mix(pa[0],pd[0],u),mix(pa[1],pd[1],u)],[mix(pb[0],pc[0],u),mix(pb[1],pc[1],u)]],'rgba(224,225,250,.13)',.70)}}});
        }
        if(hits.length>=3){
          const center=mul(hits.reduce((A,Q)=>add(A,Q),[0,0,0]),1/hits.length);hits.sort((A,B)=>Math.atan2(A[2]-center[2],A[0]-center[0])-Math.atan2(B[2]-center[2],B[0]-center[0]));
          let tone=k%2?'#ddcae4':'#d5d4fc';z.face(hits,tone,'#f5e8ea',1,(ctx,P)=>{const M=pr(center);for(let j=6;j>=1;j--){let u=.11+j*.126;const pp=P.map(v=>[mix(M[0],v[0],u),mix(M[1],v[1],u)]);poly(ctx,pp,j%2?'#b9a8d5':'#cec3e5',null)}});
        }
      }z.paint(g);caption(g,b,'#aebbc4','SECTION   /   '+cut.toFixed(2),'CRYSTAL SYSTEM  VI');g.restore();
    }
  });

  catalogue.push({id:'folding-score',title:'Folding Score',category:'Sculpture',
    description:'A sheet of folded paper contracts in two directions at once. Alternating creases divide it into one family of rigid tiles.',
    method:'The Miura pattern is generated from two alternating edge vectors. Their lengths and mutual angle remain fixed as fold angle changes. Width and depth contract together while each parallelogram keeps its original shape.',
    gesture:'Drag to turn the sheet. Change the fold angle to compress it or let the automatic breath cycle around the chosen angle.',
    params:[par('Fold angle (°)',4,57,1,36),par('Breathing arc (°)',0,15,1,7)],
    draw(g,w,h,t,p,s){
      const b=canvas(g,w,h,'#113c3c','#29615a'),[yaw,e]=orbit(s,t,.018),pr=cam(-.52+yaw,.76+e*.60,84,0),z=painter(pr),nx=9,nz=6,angle=cl(p[0]+p[1]*S(t*.64+((s.seed||0)%61)*.011),1,59)*PI/180;
      const A=.61,B=.65,gamma=65*PI/180,L=A*C(angle),H=A*S(angle),shift=B*C(gamma)/C(angle),D=Math.sqrt(Math.max(0,B*B-shift*shift));
      const get=(i,j)=>[(i-nx/2)*L+((j&1)-.5)*shift,((i&1)-.5)*H,(j-nz/2)*D];
      shadow(g,104,197,24,'rgba(0,21,22,.52)');
      for(let i=0;i<nx;i++)for(let j=0;j<nz;j++){
        const A=get(i,j),B=get(i+1,j),C=get(i+1,j+1),D=get(i,j+1),N=norm(cross(sub(D,A),sub(B,A)));
        const colset=j===1?[226,126,85]:j===2?[241,181,109]:j===4?[144,198,167]:[211,221,180],br=.70+.33*Math.max(0,dot(N,norm([-.8,.64,-.33]))),col=rgb(colset,br);
        z.face([A,B,C,D],col,'rgba(37,78,69,.8)',.8,(ctx,P)=>{
          const [a,b,c,d]=P;
          for(let k=1;k<=3;k++){const r=.18+k*.115;line(ctx,[[mix(a[0],b[0],r),mix(a[1],b[1],r)],[mix(d[0],c[0],r),mix(d[1],c[1],r)]],'rgba(68,95,76,.18)',.72)}
          line(ctx,[a,b],(j&1)?'rgba(245,234,191,.88)':'rgba(65,91,75,.42)',.9);
        });
      }z.paint(g);caption(g,b,'#b1c7b5','MIURA  /  '+Math.round(angle*180/PI)+'°','54 RIGID FACETS');g.restore();
    }
  });
})();
