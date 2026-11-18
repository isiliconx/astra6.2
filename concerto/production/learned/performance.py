"""An interpretation, not a new score. The conductor's rubato, notation-aware roles and seats are authored; solo timbre/envelope inference is learned from CC0 instrumental takes."""
from pathlib import Path
import sys,json,math,functools,bisect,hashlib
import numpy as np
from scipy import signal
from scipy.io import wavfile
D=Path(__file__).resolve().parent;src=D.parent;sys.path.insert(0,str(src));import render as ref, compose as composition
R=ref.R;S=D/'stems';S.mkdir(exist_ok=True);P=ref.O
# A phrase character has three independent parameters: time elasticity, dynamic crest, release shape.
CHAR={'shore':(.84,.54,.83),'water':(1.12,.62,1.0),'water2':(1.07,.68,.92),'lens':(1.12,.51,.93),'lamp':(1.32,.58,1.16),'lament':(1.12,.72,1.08),'promise':(1.02,.66,1.16),'cross':(1.0,.62,1.06),'ember':(1.24,.52,1.05),'dim':(1.48,.46,1.2),'star':(1.05,.65,1.06),'swell':(1.22,.84,.83),'gait':(.63,.52,.82),'turn':(.70,.54,.77),'window':(1.39,.57,1.12),'reed':(.93,.62,.93),'reed2':(.95,.68,.91),'chase':(.74,.70,.73),'cad1':(1.45,.64,1.15),'cad2':(1.58,.78,1.19),'land':(.87,.58,1.11),'home':(.78,.66,1.1)}
def cue(mn,b):
 q,j=divmod(b,8);th,key,voices,tex,var,dyn,oct,bpm,sect,ds=composition.PLAN[mn-1][q]; leaders=voices.split('/')
 return th,tex,leaders[min(len(leaders)-1,j*len(leaders)//8)],q,j
def conduct(i,m):
 pg,tr=ref.frames(m);bpq=[96,72,72][i-1];div=bpq//12
 # Every eighth note has a mapped clock point; smooth continuous interpolation between these knots.
 ticks=[0.]; times=[0.]; timescore=0
 for b,bb in enumerate(m['bars']):
  th,tex,ld,q,j=cue(i,b);el,_,end=CHAR.get(th,(.84,.62,.93));base=.5*60/bb['tempo']
  eighth=[]
  for l in range(div):
   v=(l+.5)/div;u=(j+v)/8
   # The antecedent leans through its middle; a longer comma closes its consequent.
   s=(-.041*math.sin(math.pi*u)-.023*math.sin(2*math.pi*u)+.103*math.exp(-((u-.974)/.079)**2)+.046*math.exp(-((u-.482)/.047)**2))*el
   if i==2:s+=.041*math.cos(2*math.pi*(v-.15)) + .025*math.sin(math.pi*u)
   elif i==3:s+=.012*(1 if l in [0,3] else -.5)-.015
   if th in ('shore','lamp','window') and j in (0,4):s+=.065*math.exp(-((v-.48)/.22)**2)
   if tex=='cad':s+=.119*math.sin(2*math.pi*(v-.18))+.077*math.sin(2*math.pi*(u+.19))
   if tex=='seal' and j>=6:s+=.045*(j-5)+.059*v
   if i==1 and b==39:s+=.08*v  # the string phrase makes room before the solo entrance
   eighth.append(base*np.clip(1+s,.78,1.30))
  elapsed=np.r_[0,np.cumsum(eighth)];pg['bars'][b]=dict(t=round(timescore,6),tempo=round(60*(bpq/24)/elapsed[-1],4),grid=[round(t,7) for t in elapsed])
  for k,t in enumerate(elapsed[1:],1):ticks.append(b*bpq+k*12);times.append(timescore+t)
  timescore+=elapsed[-1]
 pg['seconds']=round(timescore,6)
 return pg,np.array(ticks),np.array(times)
def traced(m):
 """Map musical source events into note groups, retaining exact ties, articulation, and breaths."""
 div=24*4*m['meter'][0]//m['meter'][1];tr={k:[] for k in ref.IDS}
 for k in ref.IDS:
  active=False;vel=72
  for b,bb in enumerate(m['bars']):
   off=0
   for ev in bb['parts'][k]:
    st=div*b+off;dur=ev['d'];off+=dur; p=ev['p'];sl=ev.get('slur','')
    if ev.get('dyn'):vel=ref.VEL[ev['dyn']]
    inside=active and sl!='start'
    if sl=='start':active=True
    if p is None:active=False;continue
    if ev.get('tie') in ('continue','stop'):tr[k][-1]['end']=st+dur
    else:tr[k].append(dict(p=p,st=st,end=st+dur,b=b,off=st-b*div,v=vel,art=ev.get('art',''),leg=inside,bs=bool(ev.get('breath')),slur=sl))
    if sl=='stop':active=False
 return tr,div
ALT=json.loads((D/'ensemble-files.json').read_text()) if (D/'ensemble-files.json').is_file() else []
@functools.lru_cache(maxsize=80)
def altfile(name):
 sr,y=wavfile.read(D/'ensemble-raw'/name);dtype=y.dtype;y=y.astype('f')/float(np.iinfo(dtype).max) if dtype.kind=='i' else y.astype('f');y=y.mean(1) if y.ndim>1 else y;w=sr//250;pk=np.percentile(abs(y[::18]),95);r=np.max(abs(y[:len(y)//w*w].reshape(-1,w)),axis=1);hit=np.where(r>max(.0008,pk*.05))[0];lead=max(0,(hit[0]*w if len(hit) else 0)-sr//120);y=y[lead:];x=y[min(len(y)//5,int(sr*.17)):max(int(sr*.12),min(len(y)*3//4,sr*2))];norm=max(np.sqrt(np.mean(x*x)),np.max(abs(y))*0.12,.003);return sr,y/norm
@functools.lru_cache(maxsize=150)
def carrier(inst,kind,p,variant):
 opts=[z for z in ref.VOICES if z['kind']==kind and z['inst']==inst];best=min(opts,key=lambda z:abs(z['note']-p))
 alt=next((z for z in ALT if z['base']==best['sha']),None) if variant else None
 if not alt:return ref.samplevoice(inst,kind,p)
 sr,mono=altfile(alt['file']);step=sr/R*2**((p-alt['note'])/12);return np.interp(np.arange(0,len(mono)-1,step),np.arange(len(mono)),mono).astype('f')
def hilow(a,k):
 return a if k==1 else signal.sosfilt(signal.butter(2,k,fs=R,output='sos'),a).astype('f')
def dynamic(i,e,div,lead,k):
 th,tex,ld,q,j=cue(i,e['b']);v=e['off']/div;u=(j+v)/8;el,crest,end=CHAR.get(th,(.9,.62,1.))
 # Hand-shaped tension/release in two unequal halves, as in question and answer.
 summit=math.exp(-((u-crest)/.21)**2);sub=math.exp(-((u-.275)/.15)**2)
 curve=3.8*summit+1.65*sub-1.95*math.exp(-((u-.48)/.073)**2)-4.0*end*math.exp(-((u-1)/.087)**2)-.75
 if i==2:curve*=1.27
 if not lead:curve*=.67
 if e['bs']:curve-=.78
 if e['art']=='accent':curve+=1.1
 if e['art']=='marcato':curve+=1.6
 if e['off']==0 and i==3 and e['dsec']<.6:curve+=.65
 if i==3 and e['off'] in (12,48):curve-=.63
 if k=='cl' and e['p']>82:curve-=.20*(e['p']-82)
 return curve
def room(stem,i,ch,solo=False):
 """Direct/early balance is stable across a movement. Stereo taps plus decorrelated, band-limited decay."""
 pan=-.08 if solo else ref.PAN[ch]*1.16; left=math.cos((pan+1)*math.pi/4);right=math.sin((pan+1)*math.pi/4)
 wet=.69 if solo else .90 if ch in (1,2,3) else .87
 g=np.random.default_rng(831540+i*20+ch);out=np.empty((len(stem),2),'f')
 for lr,side in enumerate((left,right)):
  ir=np.zeros(round(R*.83),dtype='f')
  for ms,db in [(17.9,.13),(29.2,.10),(43.7,.069),(62.1,.052),(91.3,.035)]:ir[round((ms+lr*2.8+ch*.95)*.001*R)]+=db
  n=np.arange(len(ir))/R;noise=signal.sosfilt(signal.butter(2,4700,fs=R,output='sos'),g.normal(size=len(ir)));ir+=(noise*np.exp(-7.4*n)*(n>.047)*.0068).astype('f')
  out[:,lr]=stem*side + signal.oaconvolve(stem,ir,mode='full')[:len(stem)].astype('f')*(.52+.13*side)*wet
 return out
def perform(i,m,pg,tt,ss,only='both'):
 notes,div=traced(m);nframe=round((pg['seconds']+1.38)*R);orch=np.zeros((nframe,2),'f') if only!='solo' else None; diagnostics={};reed=None
 if only!='orchestra':
  sys.path.insert(0,str(D/'model'));from reed_model import load;reed=load()
 quant=lambda x:float(np.interp(x,tt,ss))
 for ch,k in enumerate(ref.IDS):
  if k=='cl' and only=='orchestra' or k!='cl' and only=='solo':continue
  stem=np.zeros(nframe,'f');seq=notes[k];inst=ref.INST[ch];prior_note=None;counts={};delta=[];quiet=[]
  for n,e in enumerate(seq):
   th,tex,ld,q,j=cue(i,e['b']);lead=ld==k;start=quant(e['st']);stop=quant(e['end']);d=stop-start;e['dsec']=d;v=e['v'];p=e['p'];art=e['art'];le=e['leg']
   # Musicians share a conductor; winds can enter just after the chord in a song, outer strings lead groove.
   drag=(.011 if i==2 and k in ('cl','fl','bn') else .001 if k=='cl' else [.0,-.002,.006,.010,-.004,.008,.005,-.004][ch])
   offset=drag+(.001 if k=='cl' else .004)*math.sin(n*1.79+ch*.8)
   if tex=='cad' and k=='cl':offset+=.009*math.sin(e['off']/div*2*np.pi)
   start=max(0,start+offset);nextt=quant(seq[n+1]['st'])+drag if n+1<len(seq) else stop+1.0
   gap=nextt-stop;ph=dynamic(i,e,div,lead,k);rep=prior_note==p;prior_note=p
   if k=='cl':
    # Real phrase ends and marked breaths are allowed to clear. Connected notes overlap a little to eliminate keyboard retriggering at legato transitions.
    mode='short' if art=='staccato' or (i==3 and not le and d<.19 and tex not in ('glass','dusk')) else 'legato' if le and (n>0 and e['st']==seq[n-1]['end']) else 'normal'
    if mode=='short':length=d*(.59 if i==3 else .66)+.014
    elif e['bs']:length=max(d*.77,d-min(.095,d*.22))
    elif art=='tenuto':length=min(d+.012,nextt-start+.010)
    elif n+1<len(seq) and seq[n+1]['leg'] and gap<.06:length=nextt-start+.021
    else:length=d*(.94 if i!=3 else .90)+(.019 if d>.48 else .008)
    if gap>.06:length=min(length,d+.018)
    dyn=np.clip(.11+(v-44)/93+ph/37,.045,.95)
    # Widen presence selectively where the scoring competes with the reed, without taking away counter-melodies.
    density=sum(any(a['p'] is not None for a in m['bars'][e['b']]['parts'][kk]) for kk in ref.IDS if kk!='cl')
    base_db=2.15 + (.48*max(0,density-2)) + (1.2 if i==3 and tex not in ('glass','dusk') else 0) + (.9 if i==2 and (104<=e['b']<128) else 0)
    if tex=='cad':base_db=-.4
    if tex in ('storm','seal','lift'):base_db-=.65
    if i==2 and e['b']<8:base_db-=1.1
    # Seat the three contrasting movements separately. The fast dance needs stronger articulation
    # against overlapping bows; exposed suspended writing needs less direct reed, not held-down strings.
    base_db-={1:5.8,2:7.3,3:2.0}[i]
    if i==1 and tex in ('air','glass'):base_db-=1.45
    if i==3 and tex=='lace' and th=='gait':base_db-=2.5
    if not lead:base_db-=2.4
    # Only a mild additional velocity law: acoustic model already gives pressure-dependent level and colour.
    boost=.90*10**((base_db+.66*ph+.038*(v-74))/20)
    a=reed.render(pitch=p,seconds=max(.026,length),dynamics=float(dyn),articulation=mode,seed=17000*i+n,sr=R).astype('f',copy=False)
    # Long-note direction is not the same arch for every tone: carry into the apex, taper over a resolution.
    if len(a)>.28*R:
     u=np.linspace(0,1,len(a),dtype='f'); nxt=(seq[n+1]['p'] if n+1<len(seq) else p)
     amplitude=(1 if nxt>p and not e['bs'] else -.74 if nxt<p or e['bs'] else .3)
     a=a*(10**((amplitude*(u-.31)*1.75+(.4 if i==2 else .18)*np.sin(np.pi*u))/20)).astype('f')
    a=a*boost;counts[mode]=counts.get(mode,0)+1;quiet.append(round(float(dyn),3));delta.append(round(base_db,3))
   else:
    short=art=='staccato' or (d<.19 and not le);kind='short' if short else 'sus'
    lowcolor=v<=62 or (v<=76 and ((j+ch)%4 in (1,2))) or (short and n%2==1);s=carrier(inst,kind,p,int(lowcolor))
    # A bow already on the string can change note without replaying its full attack.
    skip=min(.12,d*.17) if le and not short else (.01+(n%4)*.004 if rep and not short else 0)
    skip=min(len(s)//4,round(skip*R))
    length=(d*(.56 if i==3 else .61)+.036) if short else d*(.976 if lead or le else .90)+(.056 if inst in ['vn','vc','va'] else .04)
    if e['bs']:length=min(length,d*.83)
    if le and gap<.035:length=max(length,min(d+.043,nextt-start+.041))
    a=s[skip:skip+int(length*R)].copy();N=len(a)
    if N<5:continue
    rel=min(int((.095 if not short and inst in ('vn','va','vc') else .060 if not short else .043)*R),N//2)
    atk=min(N//3,int((.031 if le else .011 if not short else .004)*R));a[:atk]*=np.sin(np.linspace(0,np.pi/2,atk))**2;a[-rel:]*=np.cos(np.linspace(0,np.pi/2,rel))**2
    if not short and d>.24:
     x=np.linspace(0,1,N,dtype='f');swell=.20 if lead and i==2 else .13 if lead else .095;a*=.91+swell*np.sin(np.pi*x)+.055*x*math.sin(j*.97+ch)
    if ld=='cl':
     # No broadband bus sidechain. Retain the breathing bass and woodwind echoes; quietly seated inner strings in cantabile, more brilliant in tuttis.
     adj={'v1':-2.4,'v2':-2.0,'va':-1.35,'vc':-.4,'fl':-1.15,'bn':-.25,'hn':-1.35}[k]
     if tex in ('storm','seal','lift'):adj+=.7
     if k in ('fl','bn') and e['off']>div*.40:adj+=1.65
    else:adj=1.75 if lead else (.35 if tex in ('storm','seal','lift','drive') else -.30);adj+=.3 if k=='vc' else 0
    if tex=='cad' and k!='cl':raise ValueError('unexpected orchestral sound in written cadenza')
    a*=((v/84)**1.68)*ref.MIX[ch]*.106*10**((adj+ph*.80)/20)*(1+.017*math.sin(n*.59+ch))
    counts[kind]=counts.get(kind,0)+1
   ix=round(start*R);sz=min(len(a),nframe-ix);stem[ix:ix+sz]+=a[:sz]
  if k=='cl':
   sol=room(stem,i,ch,True);wavfile.write(S/f'{i}-learned-cl.wav',R,sol);del sol
   diagnostics[k]={'events':len(seq),'articulations':counts,'roleTrimDbRange':[min(delta),max(delta)],'dynamicsRange':[min(quiet),max(quiet)]}
  else:orch+=room(stem,i,ch);diagnostics[k]={'events':len(seq),'issued':counts}
 if orch is not None:wavfile.write(S/f'{i}-learned-orch.wav',R,orch)
 (D/f'performance-{only}-{i}.json').write_text(json.dumps(diagnostics,indent=1));print(only,i,round(pg['seconds'],3),diagnostics['cl'] if 'cl' in diagnostics else len(diagnostics),flush=True)
def main():
 mode=sys.argv[1] if len(sys.argv)>1 else 'both';items=[];store={'title':'The Other Shore','movements':[]}
 for i,m in enumerate(ref.W['movements'],1):
  pg,tt,ss=conduct(i,m);items.append((i,m,pg,tt,ss));store['movements'].append(pg)
 (P/'expressive.json').write_text(json.dumps(store,separators=(',',':'),ensure_ascii=False))
 if mode!='map':
  for item in items:perform(*item,mode)
if __name__=='__main__':main()
