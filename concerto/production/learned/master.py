"""Master without normalizing away phrase dynamics; compare corresponding score ranges, not identical waveform times."""
from pathlib import Path
import json,subprocess as sp,os,re,sys,concurrent.futures
from scipy.io import wavfile
import numpy as np
D=Path(__file__).resolve().parent;S=D/'stems';P=Path(os.environ['SHORE_ROOM']) if 'SHORE_ROOM' in os.environ else D.parent.parent
A=P/'audio'; SR=32000; SEG=[(41,49),(1,5),(1,9)]
def run(args):return sp.run(['ffmpeg','-hide_banner','-nostats','-nostdin','-y']+args,check=True,stdout=sp.DEVNULL,stderr=sp.PIPE).stderr.decode()
def meter(p):
 o=run(['-i',str(p),'-af','ebur128=peak=true:framelog=verbose','-f','null','-']).split('Summary:')[-1]
 return {k:float(re.search(re.escape(label)+r':\s*([-\d.]+)',o).group(1)) for k,label in [('LUFS','I'),('LRA','LRA'),('dBTP','Peak')]}
def enc(src,dst,gain,ceiling=-1.85):
 f=f'volume={gain:.4f}dB,alimiter=limit={10**(ceiling/20):.8f}:level=false:attack=4:release=90:latency=true'
 run(['-i',str(src),'-af',f,'-map_metadata','-1','-c:a','libmp3lame','-b:a','112k','-ar',str(SR),'-ac','2',str(dst)])
def gainmatch(src,dst,target,prem=None,tol=.13):
 pre=prem or meter(src);gain=target-pre['LUFS']+.35
 for attempt in range(3):
  enc(src,dst,gain);final=meter(dst)
  if abs(final['LUFS']-target)<=tol:break
  gain+=target-final['LUFS']
 assert abs(final['LUFS']-target)<=max(tol,.205),(dst,pre,gain,target,final)
 assert final['dBTP']<=-1.0,(dst,final)
 return dict(measured=final,source=pre,appliedGainDb=round(gain,3))
def work(i):
 orig=A/f'{i}.mp3';new=A/f'expressive-{i}.mp3'; cache=D/f'reference-{i}.json'
 if cache.is_file():old=json.loads(cache.read_text())
 else:old=meter(orig);cache.write_text(json.dumps(old))
 if '--reference-only' in sys.argv:return
 z=wavfile.read(S/f'{i}-learned-cl.wav',mmap=True)[1];y=wavfile.read(S/f'{i}-learned-orch.wav',mmap=True)[1];assert z.shape==y.shape and z.shape[1]==2
 raw=S/f'{i}-pre.wav';wavfile.write(raw,SR,z+y);del z,y
 full=gainmatch(raw,new,old['LUFS'],tol=.21)
 report=dict(original=old,learned=full,clips={});clips={};bar1,stop=SEG[i-1]
 for take,pg,input in [('original','program',orig),('expressive','expressive',new)]:
  m=json.loads((P/(pg+'.json')).read_text())['movements'][i-1]['bars'];t=m[bar1-1]['t'];d=m[stop-1]['t']-t
  clip=S/f'{i}-{take}-clip.wav'
  # Seek after opening so exact format duration and gapless tags are honored. No synthetic padding.
  run(['-i',str(input),'-ss',f'{t:.7f}','-t',f'{d:.7f}','-acodec','pcm_f32le',str(clip)])
  fade=S/f'{i}-{take}-fade.wav'
  run(['-i',str(clip),'-af',f'afade=t=in:d=.025,afade=t=out:st={d-.045:.7f}:d=.045'.replace('d=.','d=0.'),'-c:a','pcm_f32le',str(fade)])
  clips[take]=(fade,meter(fade),d)
 target=round(min([-21.5]+[m['LUFS']-m['dBTP']-1.9 for _,m,_ in clips.values()]),1)
 for take,(src,m,d) in clips.items():
  result=gainmatch(src,A/f'ab-{i}-{take}.mp3',target,prem=m,tol=.101);result.update(seconds=round(d,4),bars=[bar1,stop-1]);report['clips'][take]=result
 oldc,newc=[x['measured']['LUFS'] for x in report['clips'].values()]
 assert abs(newc-oldc)<.201
 (D/f'master-{i}.json').write_text(json.dumps(report,indent=2)); print(i,old,full['measured'],[oldc,newc],flush=True)
if __name__=='__main__':
 with concurrent.futures.ThreadPoolExecutor(3) as ex:list(ex.map(work,[1,2,3]))
