from pathlib import Path
import re,json,hashlib,urllib.request,urllib.parse,concurrent.futures,time
D=Path(__file__).parent;sha='440300901dfe9275fd84e0b7763af1f8443ae62e';rows=[]
D1={'cl':'Woodwinds/Clarinet/susLong','fl':'Woodwinds/Flute/susvib','bn':'Woodwinds/Bassoon/sus','hn':'Brass/F Horn/sus','vn':'Strings/Violin Section/susVib','va':'Strings/Viola Section/susvib','vc':'Strings/Cello Section/susvib'}
D2={'cl':'Woodwinds/Clarinet/stac','fl':'Woodwinds/Flute/stac','bn':'Woodwinds/Bassoon/stac','hn':'Brass/F Horn/stac','vn':'Strings/Violin Section/Spic','va':'Strings/Viola Section/spic','vc':'Strings/Cello Section/spic'}
R={'cl':(49,90),'fl':(65,91),'bn':(40,69),'hn':(44,69),'vn':(55,94),'va':(48,74),'vc':(36,68)}
def nominal(f):
 m=re.search(r'_([A-G])([#b]?)(-?\d+)(?:[_.]|$)',f)
 return (int(m[3])+2)*12+'C D EF G A B'.index(m[1])+{'#':1,'b':-1,'':0}[m[2]]
def build():
 des=D/'samples';des.mkdir(exist_ok=True)
 def get(x):
  p=des/x['file']
  for i in range(4):
   try:
    if p.is_file():b=p.read_bytes()
    else:
     req=urllib.request.Request('https://raw.githubusercontent.com/sgossner/VSCO-2-CE/'+sha+'/'+urllib.parse.quote(x['path']),headers={'User-Agent':'Astra-Observatory-CC0-sampler'});b=urllib.request.urlopen(req,timeout=20).read()
    assert hashlib.sha1(b'blob '+str(len(b)).encode()+b'\0'+b).hexdigest()==x['sha']; p.write_bytes(b);return
   except Exception as e:
    if i==3:raise
    time.sleep(.5+i)
 sel=json.loads((D/'sample-index.json').read_text())
 print('selected',len(sel),sum(x['size'] for x in sel),flush=True)
 with concurrent.futures.ThreadPoolExecutor(8) as ex:list(ex.map(get,sel))
 (D/'sample-index.json').write_text(json.dumps(sel,indent=1));print('verified')
if __name__=='__main__':build()
