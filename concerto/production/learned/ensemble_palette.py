"""Pin alternative orchestral bow/tongue carriers to the same CC0 VSCO release as edition 1."""
from pathlib import Path
import json,re,urllib.request,urllib.parse,concurrent.futures,time,hashlib
D=Path(__file__).resolve().parent;PATH=D/'ensemble-raw';PATH.mkdir(exist_ok=True)
ORIG=D.parent;PIN='440300901dfe9275fd84e0b7763af1f8443ae62e'
def setup():
 if (D/'ensemble-files.json').is_file():out=json.loads((D/'ensemble-files.json').read_text())
 else:
  old=json.loads((ORIG/'sample-index.json').read_text());tree={x['path']:x for x in json.loads((ORIG/'sample-tree.json').read_text())['tree'] if x['type']=='blob'};out=[]
  for v in old:
   if v['inst']=='cl':continue
   candidates=[]
   if v['kind']=='sus':
    for lev in ['1','3','2']:candidates.append(re.sub(r'_v[123]', '_v'+lev,v['path']))
   else:
    candidates+=[re.sub('rr1','rr2',v['path'],flags=re.I),re.sub('RR1','RR2',v['path']),re.sub(r'_v[23]', '_v1',v['path'])]
   t=next((p for p in candidates if p!=v['path'] and p in tree),None)
   if t:
    o=tree[t];out.append({'path':t,'sha':o['sha'],'file':o['sha']+'.wav','kind':v['kind'],'note':v['note'],'inst':v['inst'],'base':v['sha'],'purpose':'softer color' if v['kind']=='sus' and '_v1' in t else 'alternate color'})
  (D/'ensemble-files.json').write_text(json.dumps(out,indent=1))
 def get(x):
  p=PATH/x['file']
  for j in range(3):
   try:
    if p.is_file():b=p.read_bytes()
    else:b=urllib.request.urlopen('https://raw.githubusercontent.com/sgossner/VSCO-2-CE/'+PIN+'/'+urllib.parse.quote(x['path']),timeout=25).read()
    assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\x00'+b).hexdigest()==x['sha'];p.write_bytes(b);return
   except Exception:
    if j==2:raise
    time.sleep(1+j)
 with concurrent.futures.ThreadPoolExecutor(5) as ex:list(ex.map(get,out))
 print('verified alternate carriers',len(out))
if __name__=='__main__':setup()
