"""MusicXML + Verovio editions from the original concert-pitch performance manuscript."""
from pathlib import Path
import sys,json,math,itertools,zipfile,re,io,collections,os
from lxml import etree as X
import fitz
from PIL import Image
D=Path(__file__).resolve().parent; O=D.parent/'edition'
sys.path.insert(0,str(D/'tooling'));import verovio
W=D/'engraving'; W.mkdir(exist_ok=True); O.mkdir(exist_ok=True,parents=True)
IDS=['cl','fl','bn','hn','v1','v2','va','vc'];NAME=['Clarinet in A','Flute','Bassoon','Horn in F','Violin I','Violin II','Viola','Violoncello'];SHORT=['Cl.','Fl.','Bsn.','Hn.','Vn. I','Vn. II','Va.','Vc.'];PROG=[72,74,71,61,49,49,49,43]
DUR={96:('whole',0),72:('half',1),48:('half',0),36:('quarter',1),24:('quarter',0),18:('eighth',1),12:('eighth',0),9:('16th',1),6:('16th',0),3:('32nd',0)}
def a(el,k,text=None,**kw):
 e=X.SubElement(el,k,{str(k):str(v) for k,v in kw.items()});e.text=str(text) if text is not None else None;return e
names="C D E F G A B".split();natural=[0,2,4,5,7,9,11]
def keyalts(f):
 o={s:0 for s in names}
 for s in ('FCGDAEB' if f>=0 else 'BEADGCF')[:abs(f)]:o[s]=1 if f>0 else -1
 return o
def pitch(p,k,alts):
 pos=[]
 for i,s in enumerate(names):
  for alt in [-1,0,1]:
   if (p-natural[i]-alt)%12:continue
   oct=(p-natural[i]-alt)//12-1
   cost=1.1*abs(alt-alts[s])+.1*abs(alt)+(.18 if (k>=0 and alt<0 or k<0 and alt>0) else 0)
   pos.append((cost,s,oct,alt))
 return min(pos)[1:]
def direction(m,value,kind='words',compound=False):
 d=a(m,'direction',placement='below' if kind=='dyn' else 'above'); t=a(d,'direction-type')
 if kind=='words':a(t,'rehearsal',value)
 elif kind=='tempo':
  met=a(t,'metronome',parentheses='no');a(met,'beat-unit','quarter');
  if compound:a(met,'beat-unit-dot')
  a(met,'per-minute',round(value*(2/3 if compound else 1)));a(d,'sound',tempo=value)
 elif kind=='dyn':a(a(t,'dynamics'),value)
def rests(m):
 out={}; bars=m['bars'];ix=0
 while ix<len(bars):
  if bars[ix].get('section'):
   ix+=1;continue
  j=ix
  while j<len(bars) and (j==ix or not bars[j].get('section')) and j<ix+(8-ix%8) and all(e['p'] is None for e in bars[j]['parts']['cl']):j+=1
  if j-ix>=2:out[ix+1]=j-ix
  ix=max(j,ix+1)
 return out
def fullxml(m,i,solo,written=False):
 x=X.Element('score-partwise',version='4.0'); w=a(x,'work');a(w,'work-title','The Other Shore');a(x,'movement-number',i);a(x,'movement-title',m['title']); idn=a(x,'identification');a(idn,'creator','Astra',type='composer');a(idn,'rights','Original composition by Astra for the Astra Observatory. Not a work by W. A. Mozart.'); pl=a(x,'part-list')
 bars=m['bars']; mrests=rests(m) if solo else {}; chosen=['cl'] if solo else IDS
 for j,k in enumerate(chosen):
  idx=IDS.index(k)
  if not solo and k in ['fl','v1']:
   gr=a(pl,'part-group',type='start',number=1 if k=='fl' else 2);a(gr,'group-symbol','bracket');a(gr,'group-barline','yes')
  part=a(pl,'score-part',id='P'+k);a(part,'part-name',NAME[idx]);a(part,'part-abbreviation',SHORT[idx]);si=a(part,'score-instrument',id='I'+k);a(si,'instrument-name',NAME[idx]);mi=a(part,'midi-instrument',id='I'+k);a(mi,'midi-channel',idx+1);a(mi,'midi-program',PROG[idx])
  if not solo and k in ['hn','vc']:a(pl,'part-group',type='stop',number=1 if k=='hn' else 2)
 for k in chosen:
  idx=IDS.index(k);part=a(x,'part',id='P'+k);prevtempo=None;lastD=None
  for ib,b in enumerate(bars):
   me=a(part,'measure',number=ib+1,id='m%d_%s_%d'%(i,k,ib+1));raw=b['parts'][k];delta=(3 if k=='cl' else 7 if k=='hn' else 0) if (written or solo) else 0;key=m['keyFifths']+{3:-3,7:1,0:0}[delta];alts=keyalts(key)
   if ib==0:
    atr=a(me,'attributes');a(atr,'divisions',24);a(a(atr,'key'),'fifths',key);tm=a(atr,'time');a(tm,'beats',m['meter'][0]);a(tm,'beat-type',m['meter'][1]);cle=a(atr,'clef');sg,ln={'bn':('F',4),'vc':('F',4),'va':('C',3),'hn':('G',2)}.get(k,('G',2));a(cle,'sign',sg);a(cle,'line',ln)
    if delta:
     tr=a(atr,'transpose');a(tr,'diatonic',-2 if delta==3 else -4);a(tr,'chromatic',-delta)
   if ib+1 in mrests:
    at=me.find('attributes')
    if at is None:at=a(me,'attributes')
    a(a(at,'measure-style'),'multiple-rest',mrests[ib+1])
   if k=='cl':
    if b.get('section'):direction(me,chr(65+sum(bool(z.get('section')) for z in bars[:ib]))+'. '+(lambda t:t[:1].upper()+t[1:])(re.sub(r'^(?:Rondo )?[ABC]: ', '',b['section'])))
    if (ib==0 or b.get('section')) and not (i==1 and ib==232):direction(me,b['tempo'],'tempo',m['meter']==[6,8])
    elif b['tempo']!=prevtempo:a(me,'sound',tempo=b['tempo'])
    if i==1 and ib==232:
     dr=a(me,'direction',placement='above');a(a(dr,'direction-type'),'words','Liberamente')
    prevtempo=b['tempo']
   currents={};off=0; tiles=[]
   for ind,e in enumerate(raw):
    dur=e['d']; pp=e['p'];beat=36 if m['meter']==[6,8] else 24
    if e.get('dyn') and e['dyn']!=lastD:direction(me,e['dyn'],'dyn');lastD=e['dyn']
    no=a(me,'note',id='n%d_%s_%d_%d'%(i,k,ib+1,ind))
    isfull=len(raw)==1 and pp is None
    if pp is None:a(no,'rest',**({'measure':'yes'} if isfull else {}))
    else:
     s,oct,alt=pitch(pp+delta,key,alts);pe=a(no,'pitch');a(pe,'step',s)
     if alt:a(pe,'alter',alt)
     a(pe,'octave',oct)
    a(no,'duration',dur)
    tie=e.get('tie'); ties=['stop','start'] if tie=='continue' else [tie] if tie else []
    for t in ties:a(no,'tie',type=t)
    a(no,'voice',1)
    if not isfull:
     typ,dot=DUR[dur];a(no,'type',typ)
     if dot:a(no,'dot')
    if pp is not None:
     if currents.get((s,oct),alts[s])!=alt and tie not in ['stop','continue']:a(no,'accidental',{-1:'flat',0:'natural',1:'sharp'}[alt])
     currents[s,oct]=alt
    # Explicit beam groups respect the notated pulse; rests break beams.
    offset=off;off+=dur
    depth=(0 if pp is None else {3:3,6:2,9:2,12:1,18:1}.get(dur,0))
    tiles.append((no,offset,depth))
    if (e.get('slur') or e.get('art') or e.get('breath') or ties):
     nots=a(no,'notations')
     for t in ties:a(nots,'tied',type=t)
     if e.get('slur'):a(nots,'slur',type=e['slur'],number=1)
     if e.get('art') or e.get('breath'):
      aa=a(nots,'articulations')
      if e.get('art'):a(aa,{'marcato':'strong-accent'}.get(e['art'],e['art']))
      if e.get('breath'):a(aa,'breath-mark')
   for it,(no,off,depth) in enumerate(tiles):
    for lev in range(1,depth+1):
     left=it>0 and tiles[it-1][1]//beat==off//beat and tiles[it-1][2]>=lev
     right=it+1<len(tiles) and tiles[it+1][1]//beat==off//beat and tiles[it+1][2]>=lev
     if left or right:
      bm=X.Element('beam',number=str(lev));bm.text='continue' if left and right else 'end' if left else 'begin';nn=no.find('notations');no.insert(no.index(nn) if nn is not None else len(no),bm)
   if ib==len(bars)-1:a(a(me,'barline',location='right'),'bar-style','light-heavy')
 return X.tostring(x,encoding='UTF-8',xml_declaration=True,doctype='<!DOCTYPE score-partwise PUBLIC "-//Recordare//DTD MusicXML 4.0 Partwise//EN" "http://www.musicxml.org/dtds/partwise.dtd">')
def fixture():
 import copy
 b={'tempo':100,'section':'A. The far bank','parts':{}}
 for k in IDS:b['parts'][k]=[{'p':60,'d':24,'dyn':'p','slur':'start'},{'p':69,'d':24,'slur':'stop'},{'p':68,'d':12},{'p':66,'d':12,'art':'staccato'},{'p':None,'d':24}]
 bars=[copy.deepcopy(b) for _ in range(24)]
 for j,b in enumerate(bars):
  if j:b['section']=''
  if j in [1,2,3,4]:b['parts']['cl']=[{'p':None,'d':96}]
 return {'movements':[{'title':'I. Allegro aperto','subtitle':'The far bank','keyFifths':3,'meter':[4,4],'bars':bars}]}
def getsvg(m,i,s,fixturemode=False):
 t=verovio.toolkit(); opts={'inputFrom':'musicxml','pageWidth':2100 if s else 2670,'pageHeight':2870 if s else 3400,'pageMarginLeft':70,'pageMarginRight':70,'pageMarginTop':60,'pageMarginBottom':40,'unit':9 if s else 8,'spacingStaff':8 if s else 4,'spacingSystem':10 if s else 5,'header':'none','footer':'none','breaks':'auto','svgViewBox':True,'spacingLinear':.23,'spacingNonLinear':.58,'mnumInterval':0,'xmlIdChecksum':True}
 t.setOptions(opts);xml=fullxml(m,i,s);assert t.loadData(xml.decode());svgs=[]
 for pg in range(1,t.getPageCount()+1):
  svg=t.renderToSVG(pg);svgs.append(svg)
  if fixturemode:(W/('test-%s-%d.svg'%(s,pg))).write_text(svg)
 return xml,svgs
if __name__=='__main__' and '--test' in sys.argv:
 for s in [True,False]:
  xml,svgs=getsvg(fixture()['movements'][0],1,s,True);print(s,len(xml),len(svgs),len(svgs[0])); (W/('test-%s.musicxml'%s)).write_bytes(xml)
from rsvg import write as pdfsvg
S='{http://www.w3.org/2000/svg}'
def clean(svg,compound=False):
 root=X.fromstring(svg.encode())
 for n in root.xpath('//*[contains(concat(" ",@class," ")," placeholder ")]'):n.getparent().remove(n)
 # Each movement uses one unchanging clef per instrument. Omit redundant courtesy clefs created by some multi-rest imports.
 for system in root.xpath('//*[@class="system"]'):
  if len(system.xpath('./*[@class="measure"][1]/*[@class="staff"]'))==1:
   clefs=system.xpath('.//*[@class="clef"]')
   for duplicate in clefs[1:]:duplicate.getparent().remove(duplicate)
 # Long rehearsal texts are centered on their bar by the engraver. Slide the box inward at the page edges, leaving its vertical lane intact.
 vx=float(root.find(S+'svg').get('viewBox').split()[2]);mar=float(re.findall(r'[-\d.]+',root.xpath('//*[@class="page-margin"]')[0].get('transform'))[0])
 for g in root.xpath('//*[@class="reh"]'):
  rect=g.find(S+'rect')
  if rect is None:continue
  x0=float(rect.get('x'));ww=float(rect.get('width'));delta=max(100-x0,min(0,vx-2*mar-100-ww-x0))
  if delta:g.set('transform',f'translate({delta:.1f},0)')
 for g in root.xpath('//*[@class="tempo"]'):
  t=g.find(S+'text')
  if t is None:continue
  x,y=float(t.get('x')),float(t.get('y'));val=''.join(t.itertext()).split('=')[-1].strip()
  if not re.fullmatch(r'\d+(\.\d+)?',val):continue
  g.remove(t)
  def z(n,**atts):return X.SubElement(g,S+n,{k:str(v) for k,v in atts.items()})
  z('ellipse',cx=x+65,cy=y-20,rx=76,ry=49,transform=f'rotate(-22 {x+65} {y-20})')
  z('path',d=f'M{x+133} {y-47} v-226',stroke='black',**{'stroke-width':'14'})
  if compound:z('circle',cx=x+191,cy=y-38,r=21)
  z('text',x=x+(244 if compound else 191),y=y,**{'font-size':'300px','font-family':'serif'}).text='= '+val
 return root
def systems(root):
 trans=root.xpath('//*[@class="page-margin"]')[0].get('transform');ox,oy=map(float,re.findall(r'-?[\d.]+',trans))
 vb=list(map(float,root.find(S+'svg').get('viewBox').split()));ww,hh=vb[-2:]
 out=[]
 for ss in root.xpath('//*[@class="system"]'):
  bars=[]
  for mm in ss.xpath('./*[@class="measure"]'):
   sf=mm.xpath('./*[@class="staff"]')[0];d=sf.find(S+'path').get('d'); x,y,x2,_=map(float,re.findall(r'-?[\d.]+',d))
   bars.append({'b':int(mm.get('id').rsplit('_',1)[1]),'x':round((x+ox)/ww,6),'r':round((x2+ox)/ww,6)})
  if bars:out.append({'y':(y+oy+360)/hh,'bars':bars})
 return out
def pages(work,fixturemode=False):
 loc=(W/'trial' if fixturemode else O);loc.mkdir(parents=True,exist_ok=True)
 media=loc/'score';media.mkdir(exist_ok=True);bookmap=[]
 arc=zipfile.ZipFile(loc/'editable-scores.zip','w',zipfile.ZIP_DEFLATED,6)
 def settxt(page,xy,s,fontsize=12,font='Times-Roman',color=(0,0,0)):page.insert_text(xy,s,fontsize=fontsize,fontname=font,color=color)
 for solo in [True,False]:
  doc=fitz.open(); PW,PH=(595.28,841.89) if solo else (756,972)
  side=32;top=48;bottom=30
  page=doc.new_page(width=PW,height=PH)
  settxt(page,(side,74),'ASTRA OBSERVATORY  /  PERFORMING EDITIONS',10,'Helvetica')
  page.draw_line((side,88),(PW-side,88),color=(.22,.22,.22),width=.6)
  settxt(page,(side,PH*.31),'The Other Shore',45 if solo else 57,'Times-Italic')
  settxt(page,(side,PH*.31+38),'An Imagined Second Clarinet Concerto',21 if solo else 25)
  settxt(page,(side,PH*.31+73),'An original work by Astra',15)
  settxt(page,(side,PH*.31+123),('SOLO CLARINET IN A  /  WRITTEN PITCH' if solo else 'CONDUCTOR SCORE  /  CONCERT PITCH'),10,'Helvetica-Bold')
  y=PH*.61
  for j,m in enumerate(work['movements']):
   settxt(page,(side,y),m['title'].replace('—',':' ),16,'Times-Bold');y+=28
  page.insert_textbox(fitz.Rect(side,PH-177,PW-side,PH-60),'For solo clarinet in A, flute, bassoon, horn in F, two violins, viola and violoncello. A new concerto in dialogue with Mozart\'s K. 622, not a work by Mozart or a reconstruction. '+('This part is transposed: written C sounds A.' if solo else 'All eight staves sound as written in this score. The separate clarinet part and transposing MusicXML are written at instrumental pitch.'),fontname='Times-Roman',fontsize=12,lineheight=1.3)
  conts=[]
  for i,m in enumerate(work['movements'],1):
   xml,svgs=getsvg(m,i,solo);print('render',i,'part' if solo else 'full',len(svgs),flush=True);arc.writestr(f'{i:02}-'+('Clarinet-in-A' if solo else 'Conductor-concert-pitch')+'.musicxml',xml)
   if not solo:arc.writestr(f'{i:02}-Conductor-transposing.musicxml',fullxml(m,i,False,True))
   mp=[];conts.append([1,m['title'],doc.page_count+1])
   for j,svg in enumerate(svgs,1):
    root=clean(svg,m['meter']==[6,8]);v=root.get('viewBox').split();vw,vh=map(float,v[-2:])
    # Maintain geometry and margins while leaving a consistent running header/footer.
    ww=PW-2*14;hh=ww*vh/vw
    if hh>PH-top-bottom:hh=PH-top-bottom;ww=hh*vw/vh
    # use render area as photo coordinate reference, not paper trim
    q=W/f'render-{int(solo)}.pdf';pdfsvg(X.tostring(root,encoding='unicode'),q,ww,hh)
    f=fitz.open(q);page=doc.new_page(width=PW,height=PH);pp=page.number+1
    settxt(page,(side,25),m['title'].replace('—',':'),11,'Times-Bold')
    hdr='CLARINET IN A' if solo else 'FULL SCORE / IN C'
    tw=fitz.get_text_length(hdr,fontname='Helvetica',fontsize=8);settxt(page,(PW-side-tw,25),hdr,8,'Helvetica')
    page.draw_line((side,34),(PW-side,34),color=(.4,.4,.4),width=.45)
    rect=fitz.Rect((PW-ww)/2,top,(PW+ww)/2,top+hh);page.show_pdf_page(rect,f,0)
    settxt(page,(side,PH-14),'The Other Shore  /  Astra',8,'Times-Italic');settxt(page,(PW-side-18,PH-14),str(pp),9,'Helvetica')
    if solo:
     sy=systems(root);lens=rests(m)
     for sss in sy:
      extended=[]
      for col in sss['bars']:
       count=lens.get(col['b'],1);step=(col['r']-col['x'])/count
       for u in range(count):extended.append({'b':col['b']+u,'x':round(col['x']+u*step,6),'r':round(col['x']+(u+1)*step,6),**({'rest':count} if count>1 else {})})
      sss['bars']=extended
     pix=f[0].get_pixmap(matrix=fitz.Matrix(1600/ww,1600/ww),alpha=False)
     im=Image.frombytes('RGB',(pix.width,pix.height),pix.samples).convert('L')
     nm=f'{i}-{j:02}.webp';im.save(media/nm,lossless=True,method=4)
     for k,ss in enumerate(sy):
      ys=ss['y'];up=max(0,(ys+sy[k-1]['y'])/2 if k else ys-.084);dn=min(1,(ys+sy[k+1]['y'])/2 if k+1<len(sy) else ys+.067)
      ss.update(page=pp,img='edition/score/'+nm,top=round(up,6),bot=round(dn,6),ratio=round(im.height/im.width,7));mp.append(ss)
    f.close()
   if solo:bookmap.append(mp)
  doc.set_toc(conts);doc.set_metadata({'title':'The Other Shore: '+('Clarinet in A' if solo else 'Conductor score'),'author':'Astra','subject':'Original clarinet concerto after Mozart K. 622'});doc.save(loc/('clarinet-in-a.pdf' if solo else 'conductor-score.pdf'),garbage=4,deflate=True);doc.close()
 arc.writestr('READ-ME.txt','The Other Shore, an original composition by Astra.\nThree movements, each in standard MusicXML 4.0. The solo part is written for clarinet in A (C sounds A). Transposing conductor files encode A clarinet and F horn with MusicXML transpose elements; concert-pitch conductor files sound exactly as written.\n');arc.close()
 (loc/'score-map.json').write_text(json.dumps(bookmap,separators=(',',':')))
if __name__=='__main__' and '--test' not in sys.argv:
 trial='--fixture' in sys.argv;pages(fixture() if trial else json.loads((D/'work.json').read_text()),trial)
