/* SABLE RELAY • ray-traced orbital instrument. No scene textures or external runtime. */
(() => {
  'use strict';
  const MIR=4, EM=8, TG=12, BM=16, SLOTS=37;
  // One scene, two shader languages. This deliberately tiny transliterator only handles the
  // declarations used below; the math and traversal remain identical on both backends.
  const scene = `
float sat(float a){return clamp(a,0.0,1.0);}
float h12(vec2 p){vec3 q=fract(vec3(p.x,p.y,p.x)*0.1031);q=q+vec3(dot(q,q.yzx+vec3(33.33)));return fract((q.x+q.y)*q.z);}
float noise(vec2 p){vec2 i=floor(p);vec2 f=fract(p);f=f*f*(vec2(3.0)-2.0*f);return mix(mix(h12(i),h12(i+vec2(1.0,0.0)),f.x),mix(h12(i+vec2(0.0,1.0)),h12(i+vec2(1.0)),f.x),f.y);}
float waves(vec2 p){return .54*noise(p)+.27*noise(p*2.07+vec2(12.6,5.1))+.13*noise(p*4.11+vec2(2.0,19.8))+.06*noise(p*8.13);}
vec3 sun(){return normalize(vec3(-.56,.67,.42));}
vec3 photon(){return mix(vec3(.10,1.25,.97),vec3(.24,.82,1.43),sat(U[1].w*.23));}
float box3(vec3 p,vec3 b){vec3 q=abs(p)-b;return length(max(q,vec3(0.0)))+min(max(q.x,max(q.y,q.z)),0.0);}
float cyl(vec3 p,float r,float h){vec2 q=vec2(length(p.xz)-r,abs(p.y)-h);return length(max(q,vec2(0.0)))+min(max(q.x,q.y),0.0);}
// 2D chamfered rectangular profile; local z is the optical axis.
float bevel(vec2 p,vec2 b,float c){vec2 q=abs(p)-b;return max(max(q.x,q.y),(.707107*(q.x+q.y+c)));}
vec2 pick(vec2 a,vec2 b){if(a.x<b.x){return a;}return b;}
float nz(float x){if(abs(x)>.00001){return x;}if(x<0.0){return -.00001;}return .00001;}
vec2 slab(vec3 p,vec3 d,vec3 b){vec3 v=vec3(1.0/nz(d.x),1.0/nz(d.y),1.0/nz(d.z));vec3 l=(-b-p)*v;vec3 r=(b-p)*v;vec3 a=min(l,r);vec3 c=max(l,r);return vec2(max(max(a.x,a.y),a.z),min(min(c.x,c.y),c.z));}
vec3 into(vec3 p,vec2 cs){return vec3(dot(p.xz,cs),p.y,dot(p.xz,vec2(-cs.y,cs.x)));}
vec3 back(vec3 p,vec2 cs){return vec3(p.x*cs.x-p.z*cs.y,p.y,p.x*cs.y+p.z*cs.x);}
// Gallery masonry. Walls are open, not rectangular stage backdrops. In each bay,
// tapered load-bearing stone fins sit over a low parapet and a recessed clerestory.
vec2 gallery(vec3 p,float mode){float run=11.9;float period=3.8;if(mode>1.5){run=8.5;period=3.25;}
 float along=min(abs(p.x),run+.8);float cell=(fract(along/period+.5)-.5)*period;float cut=abs(p.x)-run;
 float y=p.y;float thick=.24+.38*sat(1.0-y*.41);float spine=max(abs(cell)-thick,abs(p.z-.16)-(.43+.35*sat(1.0-y*.35)));
 float height=3.65+.56*floor(fract(floor(along/period+.5)*.61+.3)*3.0);if(mode>1.5){height=3.0+.82*floor(fract(floor(along/period+.5)*.61+.3)*3.0);}
 float shaft=max(spine,max(-y,y-height));float facet=max(abs(cell)+.26*(p.z+.45)-thick-.13,abs(p.z-.12)-.74);shaft=max(shaft,facet);
 float base=box3(vec3(cell,y-.17,p.z-.12),vec3(.72,.17,.86));float rib=box3(vec3(cell,y-height+.53,p.z-.62),vec3(.36,.61,.51));
 float d=min(shaft,min(base,rib));float ledge=box3(vec3(p.x,y-.27,p.z-.89),vec3(run,.27,.47));
 float rear=box3(vec3(cell,y-(height*.45),p.z-1.19),vec3(.57,height*.45,.28));d=min(d,min(ledge,rear));
 if(mode<1.5){float lintel=box3(vec3(p.x,y-3.49,p.z-.99),vec3(run,.15,.46));d=min(d,lintel);}
 d=max(d,cut);if(mode>1.5){d=max(d,2.03-abs(p.x));float archOuter=bevel(vec2(p.x,y-2.36),vec2(3.40,2.36),.96);
 float archInner=bevel(vec2(p.x,y-1.95),vec2(2.91,2.47),1.05);float arch=max(max(archOuter,-archInner),abs(p.z-.53)-.26);d=min(d,arch);}
 return vec2(d,2.0);}
vec2 apparatus(vec3 p,float mode,float flag){
 if(mode<2.5){return gallery(p,mode);}
 if(mode<3.5){vec3 q=p-vec3(0.0,1.25,0.0);float outer=bevel(q.xy,vec2(.92,.64),.16);float face=bevel(q.xy,vec2(.836,.552),.115);float frame=max(max(outer,-face),abs(q.z)-.095);
 vec2 h=vec2(frame,4.0);h=pick(h,vec2(max(face,abs(q.z)-.064),5.0));float rod=cyl(p-vec3(0.0,.43,0.0),.119,.32);
 float foot=cyl(p-vec3(0.0,.09,0.0),.43,.09);float collar=cyl(p-vec3(0.0,.235,0.0),.25,.075);
 h=pick(h,vec2(min(foot,rod),3.0));h=pick(h,vec2(collar,4.0));return h;}
 if(mode<5.5){float isTarget=step(4.5,mode);float rad=.35+.07*isTarget;float base=cyl(p-vec3(0.0,.10,0.0),rad+.09,.10);
 float stem=cyl(p-vec3(0.0,.51,0.0),.21,.37);float shoulder=cyl(p-vec3(0.0,.87,0.0),rad,.085);
 float cap=cyl(p-vec3(0.0,1.60,0.0),rad*.92,.053);float rings=min(shoulder,cap);vec2 h=pick(vec2(min(base,stem),3.0),vec2(rings,4.0));
 vec3 a=p-vec3(0.0,1.25,0.0);float crystal=length(a)-(.209+.029*isTarget);if(isTarget>.5){crystal=(abs(a.x)+abs(a.y)*.8+abs(a.z)-.29)*.58;}
 float m=6.0;if(isTarget>.5&&flag<.5){m=7.0;}h=pick(h,vec2(crystal,m));
 float strut=box3(vec3(abs(p.x)-rad*.76,p.y-1.23,abs(p.z)-rad*.42),vec3(.021,.34,.022));h=pick(h,vec2(strut,3.0));
 return h;}
 vec3 q=p-vec3(0.0,1.45,0.0);float outer=bevel(q.xy,vec2(1.18,1.45),.42);float inner=bevel(q.xy,vec2(.96,1.31),.38);
 float frame=max(max(outer,-inner),abs(q.z)-.23);vec2 h=vec2(frame,3.0);
 float stripe=max(max(inner,-(inner+.048)),abs(q.z)-.16);float m=8.0;if(flag>.5){m=6.0;}h=pick(h,vec2(stripe,m));
 float plinth=box3(vec3(p.x,p.y-.075,p.z),vec3(1.42,.075,.51));h=pick(h,vec2(plinth,2.0));
 float panel=10.0;if(flag>.5){panel=9.0;}h=pick(h,vec2(max(inner,abs(q.z)-.028),panel));return h;}
Hit miss(float farT){return Hit(farT,vec3(0.0,1.0,0.0),0.0);}
Hit localRay(Hit hit,vec3 ro,vec3 rd,vec3 center,vec2 cs,vec3 bound,float mode,float flag,int budget,float detail){vec3 o=into(ro-center,cs);vec3 d=into(rd,cs);vec2 w=slab(o-vec3(0.0,bound.y,0.0),d,bound);float t=max(.012,w.x);float endT=min(hit.t,w.y);if(t>endT){return hit;}
 for(int k=0;k<48;k++){if(k>=budget||t>endT){break;}vec3 p=o+d*t;vec2 g=apparatus(p,mode,flag);float e=.0014+t*.00024;
 if(g.x<e){vec3 n=vec3(0.0,1.0,0.0);if(detail>.5){float s=e*.7;vec3 v1=vec3(1.0,-1.0,-1.0);vec3 v2=vec3(-1.0,-1.0,1.0);vec3 v3=vec3(-1.0,1.0,-1.0);vec3 v4=vec3(1.0);n=normalize(v1*apparatus(p+v1*s,mode,flag).x+v2*apparatus(p+v2*s,mode,flag).x+v3*apparatus(p+v3*s,mode,flag).x+v4*apparatus(p+v4*s,mode,flag).x);}
 return Hit(t,back(n,cs),g.y);}t=t+max(e*.79,g.x*.91);}return hit;}
Hit castScene(vec3 ro,vec3 rd,float farT,int budget,float detail){Hit h=miss(farT);if(rd.y<-.0001){float f=-ro.y/rd.y;if(f>.012&&f<h.t){h=Hit(f,vec3(0.0,1.0,0.0),1.0);}}
 for(int i=0;i<4;i++){if(float(i)>=U[2].x){break;}vec4 b=U[4+i];h=localRay(h,ro,rd,vec3(b.x,0.0,b.y),b.zw,vec3(.96,1.0,.46),3.0,0.0,budget,detail);}
 for(int i=0;i<4;i++){if(float(i)>=U[2].y){break;}vec4 b=U[8+i];h=localRay(h,ro,rd,vec3(b.x,0.0,b.y),vec2(1.0,0.0),vec3(.53,.85,.53),4.0,1.0,budget,detail);}
 for(int i=0;i<4;i++){if(float(i)>=U[2].z){break;}vec4 b=U[12+i];h=localRay(h,ro,rd,vec3(b.x,0.0,b.y),vec2(1.0,0.0),vec3(.55,.85,.55),5.0,b.z,budget,detail);}
 vec4 ext=U[3];vec2 ecs=vec2(1.0,0.0);if(abs(ext.x)*1.36>abs(ext.y)){ecs=vec2(0.0,1.0);}h=localRay(h,ro,rd,vec3(ext.x,0.0,ext.y),ecs,vec3(1.45,1.48,.53),6.0,ext.z,budget,detail);
 h=localRay(h,ro,rd,vec3(8.55,0.0,0.0),vec2(0.0,-1.0),vec3(12.0,3.0,1.6),1.0,0.0,budget,detail);
 h=localRay(h,ro,rd,vec3(-8.55,0.0,0.0),vec2(0.0,1.0),vec3(12.0,3.0,1.6),1.0,0.0,budget,detail);
 h=localRay(h,ro,rd,vec3(0.0,0.0,11.72),vec2(1.0,0.0),vec3(8.55,3.0,1.6),2.0,0.0,budget,detail);
 h=localRay(h,ro,rd,vec3(0.0,0.0,-11.72),vec2(-1.0,0.0),vec3(8.55,3.0,1.6),2.0,0.0,budget,detail);return h;}
vec3 sky(vec3 rd){float iy=sat(rd.y);float az=atan(rd.x,rd.z);float haze=exp(-max(0.0,rd.y)*5.6);float sd=max(dot(rd,sun()),0.0);
 vec3 horizon=mix(vec3(.38,.435,.46),vec3(.83,.52,.285),pow(sd,4.0));vec3 col=mix(vec3(.012,.042,.071),horizon,haze);
 col=col+vec3(.74,.43,.19)*pow(sd,24.0)+vec3(3.0,2.3,1.4)*smoothstep(.9991,.99955,sd);
 vec2 st=vec2(az*105.0,rd.y*160.0);float spark=h12(floor(st));col=col+vec3(.35,.5,.54)*step(.994,spark)*pow(max(0.0,1.0-2.0*length(fract(st)-vec2(.5))),4.0)*smoothstep(.11,.6,rd.y);
 // A real ray/planet intersection plus a tilted ring plane. Near and far ring arcs
 // naturally pass in front of and behind the planet.
 vec3 pc=vec3(7.4,7.1,27.5);float radius=4.18;float b=dot(pc,rd);float disc=b*b-dot(pc,pc)+radius*radius;float planetT=200.0;
 if(disc>0.0&&b>0.0){planetT=b-sqrt(disc);vec3 n=normalize(rd*planetT-pc);float turb=waves(vec2(n.x*5.0+n.y*2.2,n.z*4.0));float lat=n.y*.93+n.x*.22;
 float band=.5+.5*sin(lat*35.0+3.5*turb+sin(lat*6.0));float fine=.5+.5*sin(lat*132.0+7.0*turb);
 vec3 cl=mix(vec3(.26,.22,.20),vec3(.77,.64,.47),.12+.62*band+.26*fine);float nl=dot(n,normalize(vec3(-.82,.42,-.25)));vec3 body=cl*(.20+.93*max(nl,0.0))+vec3(.11,.22,.27)*pow(1.0-max(0.0,dot(n,-rd)),3.7);col=mix(col,body,.92);}
 vec3 rn=normalize(vec3(-.30,.86,-.40));float den=dot(rd,rn);if(abs(den)>.0001){float tr=dot(pc,rn)/den;if(tr>0.0&&tr<planetT){vec3 pt=rd*tr-pc;float r=length(pt)/radius;if(r>1.33&&r<2.33){float rings=.40+.29*sin(r*60.0)+.21*sin(r*100.0)+.10*sin(r*26.0);float strength=smoothstep(1.33,1.42,r)*(1.0-smoothstep(2.19,2.33,r));strength=strength*(.28+.65*smoothstep(.07,.28,abs(r-1.89)*8.0));vec3 rc=mix(vec3(.42,.33,.24),vec3(1.15,.93,.62),rings);col=mix(col,rc,strength*(.57+.34*rings));}}}
 // Distant stratified crater rim, rendered in angular coordinates, behind playable walls.
 float hill=.012+.035*noise(vec2(az*7.0,3.17))+.019*noise(vec2(az*20.0,14.0))+.009*noise(vec2(az*63.0,4.0));
 col=mix(col,vec3(.23,.293,.307),1.0-smoothstep(hill-.001,hill+.002,rd.y));float h2=hill*.5+.008*sin(az*20.2);col=mix(col,vec3(.14,.197,.203),1.0-smoothstep(h2-.001,h2+.002,rd.y));return col;}
float segdist(vec2 p,vec2 a,vec2 b){vec2 v=b-a;return length(p-a-v*sat(dot(p-a,v)/max(dot(v,v),.0001)));}
vec3 beamGlow(vec3 ro,vec3 rd,float maxT,float spread){vec3 col=vec3(0.0);for(int i=0;i<20;i++){if(float(i)>=U[2].w){break;}vec4 g=U[16+i];vec3 a=vec3(g.x,1.25,g.y);vec3 e=vec3(g.z,1.25,g.w)-a;float ee=dot(e,e);if(ee<.00001){continue;}vec3 v=ro-a;float de=dot(rd,e);float u=sat((dot(e,v)-de*dot(rd,v))/max(.00001,ee-de*de));float t=clamp(dot(a+e*u-ro,rd),.0,maxT);u=sat(dot(ro+rd*t-a,e)/ee);float dist=length(ro+rd*t-a-e*u);float w=.010+max(.001,t*U[36].z)*.67+spread;float core=exp(-dist*dist/(w*w));float halo=exp(-dist/(.047+spread));float veil=exp(-dist/(.18+spread));float stop=smoothstep(.018,.15,t);
 col=col+stop*(photon()*(halo*.94+veil*.11)+vec3(1.05,1.53,1.22)*core*2.1);}
 return col;}
vec3 surface(vec3 p,vec3 rd,Hit h,float shadowed){vec3 n=h.n;float m=h.mat;vec3 al=vec3(.14,.17,.17);float metal=.05;float gloss=23.0;vec3 emission=vec3(0.0);
 float grain=h12(floor(p.xz*98.0+p.xy*59.0));float weather=noise(p.xz*1.6+p.xy*.64);
 if(m<1.5){vec2 tile=vec2(p.x/2.35,p.z/3.50);tile=vec2(tile.x+floor(tile.y)*.5,tile.y);vec2 fr=abs(fract(tile)-vec2(.5));vec2 ed=(vec2(.5)-fr)*vec2(2.35,3.5);float edge=min(ed.x,ed.y);float gr=smoothstep(.009,.023,edge);float stone=h12(floor(tile));float wet=.5+.5*sin(p.x*.32+p.z*.33+weather*7.0);
 al=mix(vec3(.038,.062,.078),vec3(.175,.19,.177),stone*.36+weather*.42+grain*.09+wet*.13);al=al*(.42+.58*gr);metal=.15+.17*wet;gloss=64.0;
 float ax=abs(p.x);float az=abs(p.z);float track=1.0-smoothstep(.014,.028,abs(ax-6.74));float stitch=(1.0-smoothstep(.025,.047,abs(ax-6.57)))*step(.57,fract(p.z*1.12));float edgeBand=max(track,stitch)*(1.0-smoothstep(9.8,10.3,az));
 al=mix(al,vec3(.53,.35,.13),edgeBand*.77);float pit=length(vec2(ed.x-.09,ed.y-.10));al=al*(.64+.36*smoothstep(.014,.035,pit));
 }else if(m<2.5){vec2 st=vec2(p.x+p.z,p.y);float lift=abs(fract((p.y+.1)/1.43)-.5);float joint=smoothstep(.002,.011,.5-lift);float seam=1.0-smoothstep(.002,.013,abs(fract((st.x+floor(p.y*.7)*.9)/2.4)-.5));al=mix(vec3(.069,.079,.088),vec3(.215,.227,.210),.28+.35*weather+.20*noise(vec2(st.x*9.1,st.y*.34))+.135*grain);al=al*(.75+.25*joint)*(1.0-.19*seam);float flutes=sin(st.x*46.0)*.02;al=al+vec3(flutes*(1.0-abs(n.y)));metal=.03;
 float along=abs(p.z);float period=3.8;if(abs(p.z)>10.7){along=abs(p.x);period=3.25;}float cell=(fract(along/period+.5)-.5)*period;
 float kerf=(1.0-smoothstep(.016,.032,abs(abs(cell)-.155)))*smoothstep(.88,1.05,p.y)*(1.0-smoothstep(2.02,2.12,p.y));
 float stencil=(1.0-smoothstep(.02,.045,abs(p.y-.76)))*step(abs(cell),.35);
 al=mix(al,vec3(.62,.36,.11),.85*stencil);emission=vec3(.65,.32,.066)*kerf*.82;
 }
 else if(m<3.5){al=mix(vec3(.066,.082,.081),vec3(.17,.174,.15),.35*weather+.4*grain);metal=.41;gloss=70.0;}
 else if(m<4.5){al=vec3(.74,.435,.133)*(.80+.12*weather+.08*grain);metal=.73;gloss=83.0;}
 else if(m<5.5){al=vec3(.58,.39,.18);metal=.92;gloss=140.0;}
 else if(m<6.5){al=vec3(.28,.53,.42);emission=photon()*(1.7+.11*sin(U[0].w*2.2));}
 else if(m<7.5){al=vec3(.42,.15,.055);emission=vec3(.83,.21,.044);}
 else if(m<8.5){al=vec3(.65,.35,.10);emission=vec3(1.09,.50,.10);}
 else{vec4 ex=U[3];vec2 ecs=vec2(1.0,0.0);if(abs(ex.x)*1.36>abs(ex.y)){ecs=vec2(0.0,1.0);}
 vec2 panel=into(p-vec3(ex.x,1.45,ex.y),ecs).xy;vec2 stamp=vec2(panel.x,-panel.y)/vec2(1.94)+vec2(.5);vec3 ink=reliefTex(clamp(stamp,vec2(.003),vec2(.997)));
 float inside=(1.0-smoothstep(.46,.49,max(abs(stamp.x-.5),abs(stamp.y-.5))))*U[36].w;
 if(m>9.5){float band=step(.966,fract((p.y+.1)*17.3));al=mix(vec3(.11,.115,.103)*(1.0-band*.23),ink*vec3(.82,.76,.65),inside);metal=.60;gloss=80.0;}
 else{al=vec3(.07,.26,.22);float scan=.83+.17*sin(p.y*60.0-U[0].w*2.7);emission=photon()*(.40+.20*sin(p.y*2.0+U[0].w))*scan+ink*inside*.18;}}
 float nd=max(0.0,dot(n,sun()));float vis=.25+.75*shadowed;float ambient=.20+.29*max(0.0,n.y)+.07*(1.0-max(0.0,n.y));vec3 key=vec3(1.71,1.30,.79);vec3 diffuse=al*(vec3(.64,.84,.91)*ambient+key*nd*vis);
 vec3 H=normalize(-rd+sun());float spec=pow(max(dot(H,n),0.0),gloss);vec3 color=diffuse+key*spec*vis*(.1+.63*metal)+emission;
 if(m<1.5){float ground=99.0;float mind=50.0;for(int i=0;i<4;i++){if(float(i)>=U[2].x){break;}mind=min(mind,length(p.xz-U[4+i].xy)-.37);}for(int i=0;i<4;i++){if(float(i)>=U[2].y){break;}mind=min(mind,length(p.xz-U[8+i].xy)-.31);}for(int i=0;i<4;i++){if(float(i)>=U[2].z){break;}mind=min(mind,length(p.xz-U[12+i].xy)-.34);}color=color*(.60+.40*smoothstep(-.17,.68,mind));for(int i=0;i<20;i++){if(float(i)>=U[2].w){break;}vec4 seg=U[16+i];ground=min(ground,segdist(p.xz,seg.xy,seg.zw));}color=color+photon()*.065*exp(-ground*2.0);}
 return color;}
vec3 render(vec2 frag){vec4 cfg=U[36];vec2 uv=(frag*2.0-cfg.xy)/cfg.y;float yaw=U[1].x;float pitch=U[1].y;vec3 f=vec3(sin(yaw)*cos(pitch),sin(pitch),cos(yaw)*cos(pitch));vec3 right=vec3(cos(yaw),0.0,-sin(yaw));vec3 up=cross(f,right);vec3 rd=normalize(f+U[1].z*(right*uv.x+up*uv.y));vec3 ro=U[0].xyz;Hit h=castScene(ro,rd,110.0,46,1.0);vec3 color=vec3(0.0);
 if(h.mat<.5){color=sky(rd);}else{vec3 p=ro+rd*h.t;float vis=1.0;if(h.mat<5.5&&dot(h.n,sun())>.02){Hit sh=castScene(p+h.n*(.016+h.t*.00052),sun(),35.0,23,0.0);if(sh.mat>.5){vis=.0;}}
 color=surface(p,rd,h,vis);if(h.mat>4.5&&h.mat<5.5){vec3 rr=reflect(rd,h.n);vec3 oo=p+h.n*(.017+h.t*.00052);Hit b=castScene(oo,rr,75.0,32,1.0);vec3 ricochet=vec3(0.0);if(b.mat<.5){ricochet=sky(rr);}else{ricochet=surface(oo+rr*b.t,rr,b,.83);}ricochet=ricochet+beamGlow(oo,rr,b.t,.009);color=mix(color,ricochet*vec3(1.07,.87,.59)+vec3(.054,.037,.014),.82);}
 if(h.mat<1.5){vec3 rr=reflect(rd,h.n);float fr=.034+.25*pow(1.0-max(0.0,-rd.y),5.0);vec3 roughSky=mix(vec3(.023,.061,.076),vec3(.43,.43,.37),exp(-4.8*max(0.0,rr.y)));color=mix(color,roughSky,fr);color=color+beamGlow(p+vec3(0.0,.019,0.0),rr,22.0,.065)*.12;}
 float fog=1.0-exp(-h.t*.014);color=mix(color,vec3(.25,.34,.35),fog*.45);}
 color=color+beamGlow(ro,rd,h.t,0.0);float v=1.0-.17*sat(dot(uv,uv)*.46);color=color*(v*1.13);color=max(vec3(0.0),color-vec3(.008));color=color*(vec3(.04)+color*2.1)/(vec3(.29)+color*(vec3(.77)+color*2.15));color=pow(max(color,vec3(0.0)),vec3(.45455));float dither=(h12(frag)-.5)/255.0;return clamp(color+vec3(dither),vec3(0.0),vec3(1.0));}
`;
  const glVertex = `#version 300 es
precision highp float;
void main(){vec2 t=vec2(float((gl_VertexID<<1)&2),float(gl_VertexID&2));gl_Position=vec4(t*2.0-1.0,0.0,1.0);}`;
  const glFragment = `#version 300 es
precision highp float;
precision highp int;
uniform vec4 U[${SLOTS}]; uniform sampler2D seal;
vec3 reliefTex(vec2 uv){return textureLod(seal,uv,0.0).rgb;}
struct Hit{float t;vec3 n;float mat;};
${scene}
out vec4 color;void main(){color=vec4(render(gl_FragCoord.xy),1.0);}`;
  // Normalize decimal literals (WGSL requires a leading zero). Translate function
  // signatures before locals so that arguments are emitted as WGSL name:type pairs.
  function wgslBody(src){const gtypes='(float|int|vec2|vec3|vec4|Hit)';const name='([a-zA-Z_]\\w*)';
    const type=t=>({float:'f32',int:'i32',vec2:'vec2f',vec3:'vec3f',vec4:'vec4f',Hit:'Hit'})[t];
    return src.replace(new RegExp('\\b'+gtypes+'\\s+'+name+'\\(([^(){}]*)\\)\\s*\\{','g'),(_,t,n,args)=>'fn '+n+'('+args.replace(new RegExp('\\b'+gtypes+'\\s+'+name,'g'),(_,t,n)=>n+':'+type(t))+')->'+type(t)+'{')
      .replace(new RegExp('\\b'+gtypes+'\\s+'+name+'\\s*=','g'),(_,t,n)=>'var '+n+':'+type(t)+'=')
      .replace(/\b(float|int|vec2|vec3|vec4)\(/g,(_,t)=>type(t)+'(').replace(/\batan\(/g,'atan2(')
      .replace(/(?<![\w\d])\.(\d)/g,'0.$1').replace(/\bU\[/g,'data.u[');
  }
  const gpuSource=`struct Hit{t:f32,n:vec3f,mat:f32}; struct SceneData{u:array<vec4f,${SLOTS}>};
@group(0) @binding(0) var<uniform> data:SceneData;
@group(0) @binding(1) var seal:texture_2d<f32>; @group(0) @binding(2) var sealSampler:sampler;
fn reliefTex(uv:vec2f)->vec3f{return textureSampleLevel(seal,sealSampler,uv,0.0).rgb;}
@vertex fn vs(@builtin(vertex_index) i:u32)->@builtin(position) vec4f{let q=vec2f(f32((i<<1u)&2u),f32(i&2u));return vec4f(q*2.0-vec2f(1.0),0.0,1.0);}
${wgslBody(scene)}
@fragment fn fs(@builtin(position) p:vec4f)->@location(0) vec4f{return vec4f(render(vec2f(p.x,data.u[36].y-p.y)),1.0);}`;
  function pack(a,s,w,h,hasSeal){a.fill(0);const c=s.cam||[0,1.65,-8.5],fov=s.fov||.99;
    a.set([c[0],c[1],c[2],(s.time||0)%1e5,s.yaw||0,s.pitch||0,Math.tan(fov*.5),s.level||0],0);
    const sets=[s.mirrors||[],s.emitters||[],s.targets||[],s.beams||[]], bases=[MIR,EM,TG,BM];
    for(let k=0;k<4;k++){const n=Math.min(sets[k].length,k===3?20:4);a[8+k]=n;
      for(let i=0;i<n;i++){const x=sets[k][i],j=(bases[k]+i)*4;if(k===3){a.set([x.x1,x.z1,x.x2,x.z2],j);}else{a[j]=x.x;a[j+1]=x.z;if(k===0){a[j+2]=Math.cos(x.angle||0);a[j+3]=Math.sin(x.angle||0);}if(k===2)a[j+2]=+!!x.lit;}}}
    const ex=s.exit||{x:0,z:10};a.set([ex.x,ex.z,+!!ex.open,0],12);a.set([w,h,2*Math.tan(fov*.5)/h,+!!hasSeal],36*4);
  }
  async function getSeal(opts){try{const url=opts.sealUrl??new URL('assets/seal.png',document.baseURI).href;if(!url || String(url).startsWith('file:'))return null;
    const resp=await fetch(url,{signal:AbortSignal.timeout(4500)});if(!resp.ok)return null;return await createImageBitmap(await resp.blob(),{premultiplyAlpha:'none',colorSpaceConversion:'none'});
    }catch{return null;}}
  // An adapter can compile WGSL successfully and still have no presentable swapchain
  // (notably remote/headless desktops). Test a sacrificial canvas before locking the
  // game's canvas to a context type; if presentation fails, WebGL2 remains available.
  async function canPresent(device,format){
    const tmp=document.createElement('canvas');tmp.width=4;tmp.height=4;const cx=tmp.getContext('webgpu');
    if(!cx)throw Error('WebGPU canvas unavailable');let read=null,timer;
    try{cx.configure({device,format,usage:GPUTextureUsage.RENDER_ATTACHMENT|GPUTextureUsage.COPY_SRC,alphaMode:'opaque'});
      const img=cx.getCurrentTexture(),e=device.createCommandEncoder();const pass=e.beginRenderPass({colorAttachments:[{view:img.createView(),loadOp:'clear',storeOp:'store',clearValue:{r:.4,g:.6,b:.2,a:1}}]});pass.end();
      read=device.createBuffer({size:256,usage:GPUBufferUsage.COPY_DST|GPUBufferUsage.MAP_READ});e.copyTextureToBuffer({texture:img},{buffer:read,bytesPerRow:256},[1,1]);device.queue.submit([e.finish()]);
      await Promise.race([read.mapAsync(GPUMapMode.READ),new Promise((_,rej)=>{timer=setTimeout(()=>rej(Error('WebGPU presentation probe timed out')),6500);})]);
      const rgba=new Uint8Array(read.getMappedRange());if(rgba[1]<125||rgba[3]<250)throw Error('WebGPU canvas readback failed');read.unmap();
    }finally{clearTimeout(timer);if(read)read.destroy();cx.unconfigure();}}
  async function webgpu(canvas,opts,bitmap){if(!navigator.gpu)throw Error('WebGPU unavailable');
    const adapter=await navigator.gpu.requestAdapter({powerPreference:'high-performance'});if(!adapter)throw Error('No WebGPU adapter');
    const device=await adapter.requestDevice();let context=null,buf=null,tex=null;
    try{const format=navigator.gpu.getPreferredCanvasFormat();await canPresent(device,format);const module=device.createShaderModule({label:'Sable / gallery transport',code:gpuSource});
      if(module.getCompilationInfo){const info=await module.getCompilationInfo();const bad=info.messages.filter(v=>v.type==='error');if(bad.length)throw Error(bad.slice(0,8).map(e=>e.lineNum+':'+e.linePos+' '+e.message).join('\n'));}
      const desc={layout:'auto',vertex:{module,entryPoint:'vs'},fragment:{module,entryPoint:'fs',targets:[{format}]},primitive:{topology:'triangle-list'}};
      const pipe=await device.createRenderPipelineAsync(desc);
      buf=device.createBuffer({size:SLOTS*16,usage:GPUBufferUsage.UNIFORM|GPUBufferUsage.COPY_DST});
      tex=device.createTexture({size:[bitmap?.width||1,bitmap?.height||1],format:'rgba8unorm',usage:GPUTextureUsage.TEXTURE_BINDING|GPUTextureUsage.COPY_DST|GPUTextureUsage.RENDER_ATTACHMENT});
      if(bitmap)device.queue.copyExternalImageToTexture({source:bitmap},{texture:tex},[bitmap.width,bitmap.height]);else device.queue.writeTexture({texture:tex},new Uint8Array([132,118,89,255]),{},[1,1]);
      const bind=device.createBindGroup({layout:pipe.getBindGroupLayout(0),entries:[{binding:0,resource:{buffer:buf}},{binding:1,resource:tex.createView()},{binding:2,resource:device.createSampler({minFilter:'linear',magFilter:'linear'})}]});
      let lostReason='';device.lost.then(info=>{lostReason=info.message||'WebGPU device lost';});context=canvas.getContext('webgpu');if(!context)throw Error('GPU canvas unavailable');context.configure({device,format,alphaMode:'opaque'});
      return {kind:'WebGPU',submit(a){if(lostReason)throw Error(lostReason);device.queue.writeBuffer(buf,0,a);const cmd=device.createCommandEncoder();const pass=cmd.beginRenderPass({colorAttachments:[{view:context.getCurrentTexture().createView(),loadOp:'clear',storeOp:'store',clearValue:{r:.06,g:.09,b:.1,a:1}}]});pass.setPipeline(pipe);pass.setBindGroup(0,bind);pass.draw(3);pass.end();device.queue.submit([cmd.finish()]);},destroy(){context.unconfigure();buf.destroy();tex.destroy();device.destroy();}};
    }catch(e){if(context)context.unconfigure();if(buf)buf.destroy();if(tex)tex.destroy();device.destroy();throw e;}}
  function webgl(canvas,opts,bitmap){const gl=canvas.getContext('webgl2',{alpha:false,antialias:false,depth:false,stencil:false,powerPreference:'high-performance',preserveDrawingBuffer:!!opts.preserveDrawingBuffer});if(!gl)throw Error('WebGL2 unavailable');const shaders=[];
    function compile(type,src){const ss=gl.createShader(type);shaders.push(ss);gl.shaderSource(ss,src);gl.compileShader(ss);if(!gl.getShaderParameter(ss,gl.COMPILE_STATUS))throw Error(gl.getShaderInfoLog(ss));return ss;}
    const pg=gl.createProgram();gl.attachShader(pg,compile(gl.VERTEX_SHADER,glVertex));gl.attachShader(pg,compile(gl.FRAGMENT_SHADER,glFragment));gl.linkProgram(pg);for(const s of shaders)gl.deleteShader(s);
    if(!gl.getProgramParameter(pg,gl.LINK_STATUS))throw Error(gl.getProgramInfoLog(pg));const loc=gl.getUniformLocation(pg,'U[0]');const tex=gl.createTexture();gl.activeTexture(gl.TEXTURE0);gl.bindTexture(gl.TEXTURE_2D,tex);
    gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MAG_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_MIN_FILTER,gl.LINEAR);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_S,gl.CLAMP_TO_EDGE);gl.texParameteri(gl.TEXTURE_2D,gl.TEXTURE_WRAP_T,gl.CLAMP_TO_EDGE);
    if(bitmap)gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,gl.RGBA,gl.UNSIGNED_BYTE,bitmap);else gl.texImage2D(gl.TEXTURE_2D,0,gl.RGBA,1,1,0,gl.RGBA,gl.UNSIGNED_BYTE,new Uint8Array([132,118,89,255]));
    const vao=gl.createVertexArray();gl.useProgram(pg);gl.uniform1i(gl.getUniformLocation(pg,'seal'),0);return {kind:'WebGL2',submit(a,w,h){gl.viewport(0,0,w,h);gl.useProgram(pg);gl.bindVertexArray(vao);gl.uniform4fv(loc,a);gl.drawArrays(gl.TRIANGLES,0,3);},destroy(){gl.deleteVertexArray(vao);gl.deleteTexture(tex);gl.deleteProgram(pg);}};
  }
  async function create(canvas,opts={}){let gpuError='';let backend;const bitmap=await getSeal(opts);if(!opts.forceWebGL){try{backend=await webgpu(canvas,opts,bitmap);}catch(e){gpuError=String(e);console.info('Sable: switching from WebGPU to WebGL2.',gpuError);}}
    try{if(!backend)backend=webgl(canvas,opts,bitmap);}catch(e){bitmap?.close();throw Error((gpuError?gpuError+' / ':'')+e.message);}
    const hasSeal=!!bitmap;bitmap?.close();const a=new Float32Array(SLOTS*4);let last=0,avg=16.7,frames=0,scale=1,dead=false;
    const maxPixels=opts.maxPixels||235000,minPixels=Math.min(maxPixels,opts.minPixels||72000);
    return {kind:backend.kind,draw(state){if(dead)return;const now=performance.now();if(last&&now-last<220){avg=avg*.94+Math.max(1,now-last)*.06;}last=now;
      if(++frames%45===0&&!opts.fixedResolution){if(avg>39)scale=Math.max(minPixels/maxPixels,scale*.82);else if(avg<20.5)scale=Math.min(1,scale*1.09);}
      const css=canvas.getBoundingClientRect();const cw=Math.max(2,Math.round(css.width||canvas.clientWidth||640)),ch=Math.max(2,Math.round(css.height||canvas.clientHeight||360));
      const r=Math.min(window.devicePixelRatio||1,Math.sqrt(maxPixels*scale/(cw*ch)));const w=Math.max(2,Math.round(cw*r)),h=Math.max(2,Math.round(ch*r));
      if(canvas.width!==w||canvas.height!==h){canvas.width=w;canvas.height=h;}pack(a,state,w,h,hasSeal);backend.submit(a,w,h);},destroy(){if(!dead){dead=true;backend.destroy();}}};}
  window.SableRenderer=Object.freeze({create});
})();
