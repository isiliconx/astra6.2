"""Reflow unchanged engraved solo systems onto better booklet turns. Keeps vector notes and exact glyph positions inside each system."""
from pathlib import Path
import sys,json,fitz,numpy as np
from PIL import Image
D=Path(__file__).resolve().parent;O=D.parent/'edition'
def repaginate():
 mapf=O/'score-map.json';rows=json.loads(mapf.read_text());src=fitz.open(O/'clarinet-in-a.pdf');out=fitz.open()
 if any(row['bars'][0]['b']==197 and row['page']==4 for row in rows[0]) and any(row['bars'][0]['b']==185 and row['page']==10 for row in rows[2]):pass
 else:return
 tw,th=src[0].rect.width,src[0].rect.height; ph=th-48-30;pw=ph*2100/2870
 if pw>tw-28:pw=tw-28;ph=pw*2870/2100
 gap=6.2;pgrows={}
 for mi,rr in enumerate(rows):
  # The WebP corresponding to each auto-engraving page stays the glyph-coordinate source.
  for i,row in enumerate(rr):
   og=row['page'];p=og
   if mi==0 and og==4 and row['bars'][0]['b']<197:p=3
   if mi==2 and og==10 and row['bars'][0]['b']<185:p=9
   if p==og and p not in [3,4,9,10]:continue
   img=Image.open(O.parent/row['img']);a=np.asarray(img.convert('L'));H,WW=a.shape; rowsw=(a<165).sum(axis=1)
   def blank_boundary(pos,above):
    y=round(pos*H);w=int(H*.023);cand=np.arange(max(0,y-w),min(H,y+w+1));zz=np.flatnonzero(rowsw[cand]==0)
    if len(zz):return int(cand[zz[np.argmin(abs(cand[zz]-y))]])
    return y
   top=blank_boundary(row['top'],True);bot=blank_boundary(row['bot'],False)
   # guard to current system and trim large whitespace; map follows the same semantic staff row.
   ix=np.flatnonzero(rowsw[top:bot]>1)
   assert len(ix)
   top2=max(0,top+ix[0]-6);bot2=min(H,top+ix[-1]+7)
   if bot2<=top2:raise Exception(row)
   row['top']=round(top2/H,7);row['bot']=round(bot2/H,7);row['page']=p
   clip=fitz.Rect((tw-pw)/2,48+ph*top2/H,(tw+pw)/2,48+ph*bot2/H)
   pgrows.setdefault(p,[]).append((og,clip))
 for i,page in enumerate(src):
  num=i+1
  if num not in pgrows:out.insert_pdf(src,from_page=i,to_page=i);continue
  new=out.new_page(width=tw,height=th);items=pgrows[num];need=sum(q.height for _,q in items);available=th-51-32
  scale=min(1,(available-(len(items)-1)*gap)/need);assert scale>.86,(num,scale)
  # Header/footer are a separate layer, preserving the same readily legible type and numbering.
  for r in [fitz.Rect(0,0,tw,40),fitz.Rect(0,th-28,tw,th)]:new.show_pdf_page(r,src,i,clip=r)
  spacing=min(16,(available-need*scale)/(max(1,len(items)-1)));y=47
  for og,c in items:
   h=c.height*scale;w=c.width*scale
   new.show_pdf_page(fitz.Rect((tw-w)/2,y,(tw+w)/2,y+h),src,og-1,clip=c);y+=h+spacing
  print('reflow',num,len(items),'staff scale',round(scale,4),'gap',round(spacing,1))
 out.set_toc(src.get_toc());out.set_metadata(src.metadata);out.save(O/'clarinet-final.tmp.pdf',garbage=4,deflate=True);out.close();src.close();(O/'clarinet-final.tmp.pdf').replace(O/'clarinet-in-a.pdf');mapf.write_text(json.dumps(rows,separators=(',',':')))
if __name__=='__main__':repaginate()
