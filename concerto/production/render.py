"""Render The Other Shore from the concert manuscript, using CC0 VSCO2 multisamples, and make synchronized MIDI and program tracks."""
from pathlib import Path
import io,math,sys,json,warnings,zipfile,struct,subprocess,hashlib
import numpy as np
from scipy.io import wavfile
from scipy import signal
from functools import lru_cache
warnings.filterwarnings('ignore',category=wavfile.WavFileWarning)
D=Path(__file__).resolve().parent;O=D.parent; R=32000
IDS=['cl','fl','bn','hn','v1','v2','va','vc']; INST=['cl','fl','bn','hn','vn','vn','va','vc'];PROG=[71,73,70,60,48,48,41,42];NAMES=['Solo clarinet in A','Flute','Bassoon','Horn in F','Violin I','Violin II','Viola','Violoncello']
PAN=[-.06,-.32,.17,.45,-.50,-.28,.19,.35]; MIX=[1.25,.67,.79,.58,.83,.59,.66,.82]
VEL={'ppp':40,'pp':50,'p':60,'mp':72,'mf':84,'f':97,'ff':109,'fff':117}; AK={'staccato':.5,'accent':.86,'tenuto':.995,'marcato':.72}
VOICES=json.loads((D/'sample-index.json').read_text());W=json.loads((D/'work.json').read_text())
def frames(m):
 t=0;tick=0;tim=[];tracks={k:[] for k in IDS};dv=dict.fromkeys(IDS,74);sl=dict.fromkeys(IDS,False); sec=[]
 for bi,b in enumerate(m['bars']):
  bpm=b['tempo'];bt=60/bpm/24;length=24*4*m['meter'][0]//m['meter'][1]
  if b.get('section'):sec.append(dict(bar=bi+1,title=b['section'],description=('The opening solo stays intact as the answer shifts between desks.' if m['meter']==[6,8] and bi==56 else b.get('description',''))))
  tim.append(dict(t=round(t,6),tempo=bpm))
  for k in IDS:
   dt=0
   for e in b['parts'][k]:
    dur=e['d'];p=e['p'];start=tick+dt;startsec=t+dt*bt;ds=dur*bt;dt+=dur
    if e.get('dyn'):dv[k]=VEL[e['dyn']]
    if e.get('slur')=='start':sl[k]=True
    if p is not None:
     art=e.get('art','');gate=AK.get(art,1.005 if sl[k] else .905 if k not in ['v1','v2','va','vc'] else .94)
     if e.get('breath'):gate=min(gate,.87)
     v=dv[k]+(6 if art in ['accent','marcato'] else 0)- (2 if dt-dur and (dt-dur)%(36 if m['meter']==[6,8] else 24) else 0)
     rec=dict(p=p,t=startsec,d=ds*gate,tick=start,dur=dur*gate,vel=v,art=art,sl=sl[k],tie=e.get('tie',''))
     if e.get('tie') in ['stop','continue']:
      last=tracks[k][-1];assert last['p']==p;last['d']=startsec+ds*gate-last['t'];last['dur']=start+dur*gate-last['tick']
     else:tracks[k].append(rec)
    if e.get('slur')=='stop':sl[k]=False
   assert dt==length,(bi,k,dt)
  tick+=length;t+=length*bt
 return {'title':m['title'],'subtitle':m['subtitle'],'meter':m['meter'],'seconds':round(t,6),'bars':tim,'chapters':sec},tracks
@lru_cache(None)
def sample(file):
 sr,ar=wavfile.read(D/'samples'/file); ar=ar.astype(np.float32)/float(np.iinfo(ar.dtype).max) if ar.dtype.kind=='i' else ar.astype(np.float32)
 if ar.ndim==1:ar=ar[:,None]
 mono=ar.mean(axis=1)
 peak=np.percentile(abs(mono[::15]),95)
 vol=np.max(abs(mono[:min(len(mono)//2,sr*2)]))
 # Trim sample file lead, not the recorded instrument attack.
 win=max(12,sr//250);block=np.max(abs(mono[:len(mono)//win*win].reshape(-1,win)),axis=1)
 cand=np.where(block>max(.001,peak*.055))[0]
 lead=max(0,(cand[0]*win if len(cand) else 0)-sr//120)
 mono=mono[lead:]
 # Gain-match root samples over sounding frames to avoid keyboard-zone level jumps.
 rms=np.sqrt(np.mean(np.square(mono[max(0,min(len(mono)//5,sr//5)):max(sr//8,min(len(mono)*3//4,sr*2))],dtype=np.float64)))
 norm=max(rms,vol*.12,.003)
 return sr,np.ascontiguousarray(mono/norm,dtype=np.float32)
@lru_cache(None)
def samplevoice(inst,kind,p):
 best=min((z for z in VOICES if z['kind']==kind and z['inst']==inst),key=lambda z:abs(z['note']-p))
 sr,mono=sample(best['file']);step=sr/R*2**((p-best['note'])/12)
 return np.interp(np.arange(0,len(mono)-1,step),np.arange(len(mono),dtype=np.float64),mono).astype('f')
def midi_vl(v):
 n=int(round(v));s=[n&127];n>>=7
 while n:s.append((n&127)|128);n>>=7
 return bytes(reversed(s))
def meta(kind,s):return bytes([255,kind])+midi_vl(len(s))+s
def trk(events,fin):
 x=bytearray();pr=0
 for t,order,v in sorted(events,key=lambda a:(a[0],a[1])):
  tt=int(round(t));x+=midi_vl(tt-pr)+v;pr=tt
 x+=midi_vl(max(0,round(fin)-pr))+b'\xff\x2f\x00';return b'MTrk'+struct.pack('>I',len(x))+x
def make_midi(items):
 voice=[[] for _ in range(8)];c=[(0,0,meta(3,b'The Other Shore - Astra'))];base=0
 for m,pg,tracks in items:
  l=24*4*m['meter'][0]//m['meter'][1];bt=36 if m['meter']==[6,8] else 24
  c.extend([(base,0,meta(6,m['title'].encode())),(base,0,meta(0x58,bytes([m['meter'][0],int(math.log2(m['meter'][1])),bt,8]))),(base,0,meta(0x59,bytes([m['keyFifths']%256,0])))])
  prev=None
  for j,b in enumerate(m['bars']):
   if prev!=b['tempo']:c.append((base+j*l,2,meta(0x51,round(60e6/b['tempo']).to_bytes(3,'big'))));prev=b['tempo']
   if b.get('section'):c.append((base+j*l,3,meta(6,b['section'].encode())))
  for ch,k in enumerate(IDS):
   events=voice[ch]
   if base==0:events.extend([(0,0,meta(3,NAMES[ch].encode())),(0,0,bytes([192+ch,PROG[ch]])),(0,0,bytes([176+ch,10,round(64+PAN[ch]*60)]))])
   seq=tracks[k]
   for j,e in enumerate(seq):
    ti=base+e['tick'];du=int(round(e['dur']));du=min(du,(seq[j+1]['tick']-e['tick']) if j+1<len(seq) else du)
    events.extend([(ti,2,bytes([144+ch,e['p'],e['vel']])),(ti+max(1,du),1,bytes([128+ch,e['p'],0]))])
  base+=l*len(m['bars'])
 return b'MThd'+struct.pack('>IHHH',6,1,9,24)+trk(c,base)+b''.join(trk(x,base) for x in voice)
def render(i,m,pg,tr):
 nframe=round((pg['seconds']+1.35)*R); zz=np.zeros((nframe,2),dtype='f'); rng=np.random.default_rng(6211+i); counts={}
 for ch,k in enumerate(IDS):
  stem=np.zeros(nframe,dtype='f'); inst=INST[ch]
  for e in tr[k]:
   p,v,d=e['p'],e['vel'],e['d'];kind='short' if e['art']=='staccato' or (d<(.205 if inst in ['vn','vc','va'] else .185) and not e['sl']) else 'sus'
   s=samplevoice(inst,kind,p);counts[kind]=counts.get(kind,0)+1
   ii=round(e['t']*R);short=kind=='short';rel=.072 if short else .102 if inst in ['vn','va','vc'] else .065
   length=min(int((d+rel)*R),len(s),nframe-ii);base=s[:length].copy();rr=max(1,min(length,int(rel*R)));base[-rr:]*=(np.cos(np.linspace(0,math.pi/2,rr,dtype='f'))**2)
   # Written slurs avoid repeating the sampled onset at full pressure; gentle phrase-level swells shape sustained winds.
   attack=.006 if short else .018 if not e['sl'] else .027;aa=min(length,int(attack*R))
   base[:aa]*=np.sin(np.linspace(0,math.pi/2,aa,dtype='f'))
   if not short and d>.48:
    env=np.linspace(0,1,length,dtype='f');base*=.92+.13*np.sin(np.pi*env)
   level=(v/84)**1.8*MIX[ch]*.109*float(rng.uniform(.974,1.025));stem[ii:ii+length]+=base*level
  left=math.cos((PAN[ch]+1)*math.pi/4);right=math.sin((PAN[ch]+1)*math.pi/4)
  zz[:,0]+=stem*left; zz[:,1]+=stem*right
 # Deterministic light chamber response. Preserve direct-onset time.
 for ch in range(2):
  ir=np.zeros(round(.72*R),dtype='f');t=np.arange(len(ir))/R;noise=rng.normal(size=len(ir));post=t>.046
  ir[post]=(noise[post]*np.exp(-8.7*t[post])*.0090).astype('f')
  for ms,gain in [(19,.12),(33,.09),(48,.061),(72,.045)]:ir[int((ms+2.1*ch)*.001*R)]+=gain
  zz[:,ch]+=signal.oaconvolve(zz[:,ch],ir,mode='full')[:nframe].astype('f')*.64
 pcm=D/f'{i}-drymix.wav';wavfile.write(pcm,R,zz); del zz
 dest=O/'audio'/f'{i}.mp3';dest.parent.mkdir(parents=True,exist_ok=True)
 # Two-pass EBU normalization, level-only with true-peak safeguard; the three dynamic arcs survive.
 pre=subprocess.run(['ffmpeg','-hide_banner','-nostats','-i',str(pcm),'-af','loudnorm=I=-19:TP=-1.5:LRA=15:print_format=json','-f','null','-'],capture_output=True,text=True,check=True)
 loud=json.JSONDecoder().raw_decode(pre.stderr[pre.stderr.rindex('{'):])[0];gain=min(-19-float(loud['input_i']),-1.65-float(loud['input_tp']))
 subprocess.run(['ffmpeg','-v','error','-y','-i',str(pcm),'-af',f'volume={gain:.3f}dB','-c:a','libmp3lame','-b:a','112k','-ar','32000','-metadata','artist=Astra','-metadata','album=The Other Shore','-metadata','title='+m['title'],str(dest)],check=True)
 return dict(seconds=pg['seconds'],fileBytes=dest.stat().st_size,pcmLoudness=loud,appliedGainDb=round(gain,3),sampleTypes=counts)
def main():
 items=[];program={'title':'The Other Shore','movements':[]}
 for m in W['movements']:
  pg,tr=frames(m);items.append((m,pg,tr));program['movements'].append(pg)
 (O/'program.json').write_text(json.dumps(program,separators=(',',':'),ensure_ascii=False))
 with zipfile.ZipFile(O/'edition/performance-midi.zip','w',zipfile.ZIP_DEFLATED) as z:
  for i,item in enumerate(items,1):z.writestr(f'{i:02}-movement.mid',make_midi([item]))
  z.writestr('Full-concerto.mid',make_midi(items))
 if '--manifest' in sys.argv:return
 out=[]
 for i,(m,pg,tr) in enumerate(items,1):
  stats=render(i,m,pg,tr);print(i,stats,flush=True);out.append(stats)
 (D/'recording.json').write_text(json.dumps(out,indent=2))
if __name__=='__main__':main()
