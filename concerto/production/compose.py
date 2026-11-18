#!/usr/bin/env python3
"""The Other Shore: An Imagined Second Clarinet Concerto, by Astra.
Original symbolic composition, in concert pitch. No imported melodies or models.
Each of the 288 source measures in the phrase books is composed as a line over
a specified bass and harmony. The itinerary below is the through-score: keys,
leaders, orchestration, revoicings, variation, dynamic and pace are deliberate.
"""
from pathlib import Path
import re as regex, json, math, statistics, collections
D=Path(__file__).parent
P='cl fl bn hn v1 v2 va vc'.split()
MIDI={'A':57,'E':52,'D':62,'G':55,'C':60,'F':53,'B':59,'a':57,'e':52,'d':62,'g':55,'b':59,'f#':54,'c#':61,'F#':54,'Bb':58}
MAJ=(0,2,4,5,7,9,11); MIN=(0,2,3,5,7,8,10)
limits={'cl':(49,90),'fl':(65,91),'bn':(40,69),'hn':(44,69),'v1':(56,94),'v2':(55,83),'va':(48,74),'vc':(36,68)}
def cap(n,lo,hi):
 while n<lo:n+=12
 while n>hi:n-=12
 return n
def ev(p,d,**other):return dict(p=p,d=d,**other)
def scale(key,n):
 q,r=divmod(n-1,7);return MIDI[key]+12*q+(MIN if key[0].islower() else MAJ)[r]
def tok(key,s):
 m=regex.fullmatch(r'(-?\d+)([#b]?)',s);return scale(key,int(m[1]))+{'':0,'#':1,'b':-1}[m[2]]
def chord(key,s):
 root,_,inv=s.partition('/')
 bass=tok(key,inv) if inv else tok(key,root.rstrip('+o-'))
 di=int(root.rstrip('+o-#b')); v=tok(key,root.rstrip('+o-'))
 # Locally diatonic harmony, with the leading-tone dominant in minor.
 tri=[v,scale(key,di+2),scale(key,di+4)]
 if root.endswith('+') or (di==5 and key[0].islower() and not root.endswith('-')):tri=[v,v+4,v+7]
 if root.endswith('o'):tri=[v,v+3,v+6]
 if root.endswith('-'):tri=[v,v+3,v+7]
 return tri,bass
def reg(key,degree,part,oct):
 shifts={'cl':0,'fl':12,'v1':12,'bn':-12,'vc':-12,'va':0,'v2':0,'hn':-12}
 return cap(tok(key,degree)+shifts[part]+12*oct,*limits[part])
BOOK=[{}, {}, {}]
def phrase(m,id,body):
 lines=[x.strip() for x in body.split('|') if x.strip()]
 b=[]
 for line in lines:
  h,notes=line.split(' ',1); events=[]
  for t in notes.split():
   pitch,_,dur=t.partition(':');d=int(dur) if dur else (12 if m==3 else 24)
   events.append((pitch,d))
  assert sum(d for _,d in events)==[96,72,72][m-1],(id,line,sum(d for _,d in events))
  b.append((h,events))
 assert len(b)==8,(id,len(b));BOOK[m-1][id]=b
# I: spoken opening, an echo phrase, mobile bridge, and a contrasting E-major cantabile.
phrase(1,'shore',"""
1 3 8:36 7:12 6 |4/6 4:48 6:12 5:12 4 |2/4 2:36 3:12 4 6 |5 5:48 r 2 |
1/3 3:12 2:12 3 8 9 |4 10:36 9:12 8 6 |5 7:12 6:12 5 4:12 3:12 2 |1 1:72 r""")
phrase(1,'answer',"""
6 6:36 5:12 3 1 |2 2:12 4:12 6:36 5:12 4 |5/7 2 7 6:12 5:12 4 |1 3:48 r 5 |
4 6:12 5:12 4 8:36 6:12 |2/4 4:12 3:12 2 6:12 5:12 4 |5 2:36 3:12 4 7 |5 5:72 r""")
phrase(1,'bridge',"""
1 3:12 5:12 8:12 7:12 8 5 |5/7 2:12 5:12 7:12 6:12 7 5 |6 3:12 6:12 8:12 7:12 8 6 |3 5:48 r 3:12 5:12 |
4 6:12 8:12 11:24 10:12 9:12 8:12 6:12 |2+ 6:12 9:12 11#:24 10:12 9:12 6:12 4#:12 |5 5:12 7:12 9:12 11:12 10:12 9:12 8:12 7:12 |5 5:36 7:12 9 r""")
phrase(1,'water',"""
1 5:48 3:36 2:12 |1/3 1:36 2:12 3 5 |4 6:72 5:12 4:12 |2/4 2:48 r 2 |
5/7 4:36 3:12 2:36 1:12 |6 3:12 4:12 5 6 8 |2 6:36 5:12 4 2 |5 5:72 r""")
phrase(1,'water2',"""
1 8:48 5:36 4:12 |3/5 3:36 4:12 5 7 |4 8:36 9:12 10 8 |6 6:48 3 r |
2 4:12 6:12 9:36 8:12 6 |5 7:12 6:12 5:36 4:12 2 |1/3,5 3:36 5:12 4:12 3:12 2 |1 1:72 r""")
phrase(1,'lace',"""
1 5:12 3:12 2:12 3:12 5:12 8:12 7:12 8:12 |5/7 9:12 7:12 6:12 7:12 9:12 5:12 4:12 2:12 |
6 3:12 6:12 5:12 6:12 8:12 10:12 9:12 8:12 |3/5 7:36 5:12 3 r |
4 4:12 6:12 8:12 11:12 10:12 9:12 8:12 6:12 |2 4:12 2:12 3:12 4:12 6:12 9:12 8:12 6:12 |
1/5,5 5:12 8:12 10:12 8:12 7:12 5:12 4:12 2:12 |1 3:12 2:12 1:48 r""")
phrase(1,'signal',"""
1 8:12 r:12 8 5:12 3:12 1 |1/3 3:12 r:12 3 5:12 8:12 10 |4 11:36 10:12 8 6 |5 7:48 5 r |
6 8:12 r:12 8 10:12 9:12 8 |4 6:12 r:12 6 8:12 6:12 4 |1/5,5 5 3 2:12 4:12 7:12 9:12 |1 8:48 r:48""")
phrase(1,'split',"""
1 r 3 8:36 7:12 |4/6 6:36 5:12 4 r |2 r 2 7:36 6:12 |5 5:48 4 2 |
6 r:12 3:12 6 10:36 9:12 |4 8:12 6:12 4:36 3:12 1 |2+ 2:12 4#:12 6:12 9:12 8:12 6:12 4#:12 2:12 |5 5:72 r""")
phrase(1,'undertow',"""
1 1:36 3:12 5 4 |4/6 6:36 8:12 6 4 |7o 2:12 4:12 7 6:12 4:12 2 |3+ 3:48 7 r |
6 6:12 8:12 10:12 9:12 8 6 |2/4 4:12 6:12 9:12 8:12 6 4 |5 2:12 5:12 7:12 9:12 8:12 7:12 5:12 2:12 |5 5:36 4:12 2 r""")
phrase(1,'lens',"""
1 3:72 8 |6/3 6:48 5 3 |4 4:72 6 |2/4 2:48 r 4 |
7o 7:36 6:12 4 2 |1/3 3:36 2:12 1 3 |2+ 4#:48 6:36 9:12 |5 7:72 r""")
phrase(1,'threshold',"""
5 2:48 5:36 4:12 |5 2:36 4:12 7 5 |1/5 3:12 5:12 8:12 7:12 8:36 5:12 |5 4:12 5:12 7:12 6:12 7:36 5:12 |
4/5 4 6 8 11 |1/5 10:12 9:12 8:12 7:12 5:12 3:12 2:12 1:12 |5 2:12 4:12 7:12 9:12 11:12 9:12 7:12 5:12 |5 2:48 r:48""")
phrase(1,'cad1',"""
1/5 3:36 r:12 8:36 7:12 |4 6:48 4:12 3:12 1 |2 2:12 4:12 6:12 9:12 11:36 10:12 |5 9:48 7 r |
6 -1:12 1:12 3:12 6:12 8:12 10:12 13:12 12:12 |2/4 11:12 9:12 6:12 4:12 2:12 4:12 6:12 9:12 |
5 12:36 11:12 9:12 7:12 5:12 2:12 |5 0:48 r 2:12 4:12""")
phrase(1,'cad2',"""
4 6:36 8:12 11:36 10:12 |2 9:12 6:12 4:12 2:12 -1:12 2:12 4:12 6:12 |
1/5 8:36 10:12 12:24 10:12 8:12 |5 7:12 5:12 4:12 2:12 0:12 2:12 4:12 5:12 |
6 6:36 5:12 3:12 1:12 -1 |2+ 2:12 4#:12 6:12 9:12 11#:12 9:12 6:12 4#:12 |
5 5:12 7:12 9:12 11:12 12:12 11:12 9:12 7:12 |5 9:72 r""")
phrase(1,'land',"""
1 3 8:36 7:12 6 |4/6 4:48 1 4 |2 6:12 4:12 2 9:36 8:12 |5 7:48 5 r |
4 11:36 10:12 8:12 6:12 4 |1/5,5 5:12 8:12 10:24 9:12 7:12 5 |1 8:48 5 3 |1 1:72 r""")
# II: The lamp. Unmeasured-looking suspensions meet three measured quarter pulses.
phrase(2,'lamp',"""
1 3:48 8 |6 7:12 6:36 5 |4 4:48 3:12 1:12 |1/3 3:48 r |
2 2:36 3:12 4 |4/6 6:48 8 |1/5,5 5:36 4:12 2 |1 1:48 r""")
phrase(2,'promise',"""
6 6:48 8 |2/4 9:36 8:12 6 |5/7 7:48 5 |1 3:48 r |
4 4:12 5:12 6:36 8:12 |2+ 9:36 6:12 4# |5 5:48 7:12 6:12 |5 5:48 r""")
phrase(2,'after',"""
1 5:36 3:12 1 |4/6 4 6:36 5:12 |1/5 3:48 5 |5 4:12 3:12 2 r |
6 1:12 3:12 6:36 5:12 |2 4:48 2 |5 4:36 3:12 2 |1 1:72""")
phrase(2,'low',"""
1 1:48 -2 |5/7 0:36 -1:12 -2 |6 -1:48 3 |4 4:36 3:12 1 |
2 -1:12 1:12 2:36 4:12 |6/3 3:48 1 |2+ 2:36 4#:12 6 |5 5:48 r""")
phrase(2,'cross',"""
1 3:48 5 |3/5 7:36 6:12 5 |4 8:48 11 |2/4 9:36 8:12 6 |
7o 7:12 6:12 4:36 2:12 |3+ 3:36 5#:12 7 |6 8:48 6 |6 3:48 r""")
phrase(2,'lament',"""
1 5:36 4#:12 5 |4 6:48 4 |2o/4 2:12 4:12 6:36 5:12 |5 7#:48 r |
6 8:36 7:12 6 |4 4:48 1 |2o 2:36 4:12 6 |5 5:48 r""")
phrase(2,'swell',"""
1 3 5 8 |4 11:36 10:12 8 |2o 9 11 13 |5 12:48 11 |
6 13:36 12:12 10 |4 11:12 10:12 8 6 |2o,5 4:36 6:12 7# |1 8:48 r""")
phrase(2,'ember',"""
4 6:48 8 |1/3 5:36 3:12 1 |2 4:48 6 |6/3 3:48 r |
4 1:12 4:12 6:36 5:12 |1/5 3:48 5 |5 4:36 2:12 0 |5 2:48 r""")
phrase(2,'star',"""
1 8:36 10:12 12 |5/7 11:12 10:12 9:36 7:12 |6 8:48 6 |3 5:48 r |
4 6 8:36 10:12 |2 9:36 8:12 6 |5 7:36 5:12 2 |1 3:48 r""")
phrase(2,'dim',"""
4 6:48 4 |1/3 3:48 1 |2 2:48 4 |1/5,5 3:24 2:48 |
4 4:36 3:12 1 |5 2:48 0 |1 1:72 |1 1:48 r""")
# III: a crooked little 6/8 dance with silence on its heels. Scale 3 to 8 spans
# the first dot; the Adagio later comes back against the dance in broad values.
phrase(3,'gait',"""
1 3 8 7 6:24 5 |4 4 6 8 6 r 4 |2 2 4 6 9 8 6 |5 7:36 5:24 r |
1/3 3 8 7 8:24 5 |4 4 6 8 11:24 10 |5 9 7 5 4 2 0 |1 1:36 1:24 r""")
phrase(3,'turn',"""
6 3 6 8 10:24 9 |2 6 4 2 4 6 9 |5/7 7 9 11 9 7 5 |1 3:36 5 r 3 |
4 4 4 6 8:24 6 |2+ 4# 4# 6 9:24 6 |5 5 7 9 7 5 4 |5 2:36 5:24 r""")
phrase(3,'reed',"""
1 5:24 3 5:24 8 |3/5 7 5 3 5:24 r |4 6:24 4 6:24 8 |2/4 9 8 6 4:24 r |
5 2:24 4 7:24 6 |6 3:24 5 8:24 6 |2+ 4# 6 9 8 6 4# |5 5:36 5:24 r""")
phrase(3,'reed2',"""
1 8:24 5 3:24 1 |6 -1 1 3 6:24 5 |2 4:24 6 9:24 8 |5/7 7 6 4 2:24 r |
4 4 6 8 11 10 8 |1/5 5 8 10 12:24 10 |5 9 7 5 4 3 2 |1 1:36 r:36""")
phrase(3,'loom',"""
1 3 5 8 10 8 5 |5/7 2 5 7 9 7 5 |6 3 6 8 10 8 6 |3/5 3 5 7 12:24 7 |
4 6 8 11 13 11 8 |2 6 9 11 13 11 9 |1/5,5 10 8 5 7 5 2 |1 3 2 1 1:24 r""")
phrase(3,'wood',"""
1 1:24 3 5:24 4 |4 6 5 4 1:24 r |7o 2 4 7 6 4 2 |3+ 3:36 7:24 r |
6 6:24 8 10:24 9 |2o 11 9 6 4:24 2 |5 7# 5 2 4 2 0# |1 1:36 1:24 r""")
phrase(3,'wood2',"""
6 6 8 10 13:24 12 |4 11 10 8 6:24 4 |2o 2 4 6 9:24 8 |5 7#:36 5:24 r |
1 3 1 -2 1:24 3 |4 4 1 -1 1:24 4 |2o,5 2 4 6 7# 5 2 |1 1:36 r:36""")
phrase(3,'ferry',"""
1 8:24 7 5:24 3 |4/6 6:36 4 1 4 |2 9:24 8 6:24 4 |5 7:36 5 2 5 |
6 10:24 9 8:24 6 |2+ 9 6 4# 2:24 4# |5 5 7 9 11 9 7 |5 5:36 r:36""")
phrase(3,'chase',"""
1 3 r 8 5 3 1 |1/3 3 5 8 10 r 8 |4 6 r 11 8 6 4 |2/4 4 6 9 11 r 9 |
5 7 5 2 0 2 5 |6 8 6 3 1 3 6 |2+ 9 6 4# 2 4# 6 |5 7 5 2 5:24 r""")
phrase(3,'window',"""
1 3:36 8:36 |6 7:24 6 5:36 |4 4:36 3:24 1 |1/3 3:36 r:36 |
2 2:36 4:36 |4/6 6:36 8:36 |1/5,5 5:36 4 3 2 |1 1:36 r:36""")
phrase(3,'bells',"""
1 8:24 5 3:24 8 |4 11:24 8 6:24 4 |2 9:24 6 4:24 2 |5 7:24 5 2:24 r |
6 8 10 13 12 10 8 |4 6 8 11 10 8 6 |1/5,5 5 8 10 9 7 5 |1 8:36 5:24 r""")
phrase(3,'home',"""
1 3 8 7 6:24 5 |4 4 6 8 11:24 10 |2 9 6 4 2:24 4 |5 7 5 2 0:24 r |
4 4 6 8 11 10 8 |1/5,5 10 8 5 9 7 5 |1 8:24 5 3:24 1 |1 1:36 r:36""")
# Format of each phrase cue: theme.key.leaders.texture.variation.dynamic.register.
# Slash within a leader cue distributes equal spans of the phrase to those desks.
PLAN=[[],[],[]]
def chap(m,title,desc,bpm,cues):
 v=cues.strip().split()
 for j,x in enumerate(v):
  a=x.split('.');assert len(a)==7,x
  th,k,voices,tex,var,dyn,oct=a;assert th in BOOK[m-1]
  PLAN[m-1].append((th,k,voices,tex,var,dyn,int(oct),bpm,title if j==0 else '',desc if j==0 else ''))
chap(1,'Orchestral exposition','The violins call across a rising sixth. Bassoon and flute answer before the soloist enters.',101,
'''shore.A.v1.sail.plain.mf.0 answer.A.bn/fl.reed.plain.mp.0 bridge.A.v1.drive.plain.mf.0
water.A.fl/v1.air.plain.p.0 signal.A.v1.lift.plain.f.0''')
chap(1,'Solo exposition','The clarinet claims the opening in the middle register; the answering phrase passes briefly to the violins.',98,
'''shore.A.cl.chamber.turn.mp.0 answer.A.cl/v1.cloth.plain.mp.0 bridge.A.cl.lace.run.mf.0
threshold.E.bn/cl.air.plain.mp.0''')
chap(1,'Second subject in E','A longer-breathed subject begins on the fifth and folds inward. The clarinet elaborates its cadence.',96,
'''water.E.cl.air.plain.p.1 water2.E.cl.reed.turn.mp.1 lace.E.cl.lace.run.mf.1 signal.E.v1/fl.lift.plain.f.0''')
chap(1,'Development: broken crossings','In F-sharp minor the sixth splits into unanswered calls. The clarinet meets bassoon, flute and viola in smaller combinations.',103,
'''split.f#.cl/bn.shadow.plain.mp.0 undertow.c#.va/cl.lace.turn.mp.0 lens.E.fl/cl.glass.plain.p.0
split.D.cl/v1.drive.run.mf.0 undertow.b.cl.shadow.run.f.0''')
chap(1,'Dominant and return','The bass stays on E while fragments gather. The return begins in the strings, then yields to the soloist.',99,
'''threshold.A.bn/fl/v1/cl.cloth.plain.mp.0 threshold.A.cl.drive.turn.mf.1
shore.A.v1/cl.sail.plain.f.0 answer.A.cl.chamber.turn.mp.0 bridge.D.v1/cl.lace.run.mf.0''')
chap(1,'Second subject at home','The E-major melody now speaks in A. A passage through the minor subdominant darkens its second half.',96,
'''water.A.cl.air.turn.p.0 emberx.A.cl.air.plain.p.0'''.replace('emberx.A.cl.air.plain.p.0','water2.d.fl/cl.glass.plain.mp.0'))
chap(1,'Closing ritornello','Solo passagework gives way to a public orchestral cadence; the dominant is left open.',102,
'''water2.A.cl.reed.turn.mp.0 lace.A.cl.lace.run.mf.1 signal.A.v1.lift.plain.f.0 threshold.A.v1/bn.air.plain.mp.0''')
chap(1,'Cadenza','Two unaccompanied paragraphs: the call, an arpeggiated retreat and a winding ascent back to E.',81,
'''cad1.A.cl.cad.flex.p.0 cad2.A.cl.cad.rill.mf.0''')
chap(1,'Coda','Clarinet and violins share the closing statement. The orchestra answers with firm, short tonic strokes.',101,
'''shore.A.cl/v1.cloth.turn.mp.0 lace.A.cl.lace.run.mf.1 signal.A.fl/v1.lift.plain.f.0 land.A.cl/v1.seal.plain.f.0''')
chap(2,'The lamp','In D major the clarinet stretches the opening sixth across two gentle pulses. Strings leave space around its release.',51,
'''lamp.D.cl.glass.plain.p.0 promise.D.cl/tfl.tide.plain.mp.0 after.D.cl.air.turn.p.0'''.replace('tfl','fl'))
chap(2,'An answer in low light','Bassoon speaks almost alone; the soloist takes the line below the staff before the flute answers from above.',53,
'''low.D.bn/cl.dusk.plain.pp.0 cross.A.cl.tide.turn.mp.0 after.A.fl/cl.glass.plain.p.0''')
chap(2,'Through the minor','B minor and its shadow, E minor, carry the tune toward the movement’s orchestral crest.',55,
'''lament.b.cl.dusk.plain.mp.0 cross.G.va/cl.throb.plain.mp.0 lament.e.bn/cl.shadow.turn.mp.0
swell.b.cl.storm.plain.f.0''')
chap(2,'After the crest','The high note falls away. Viola and bassoon hold the fragments together on the journey home.',49,
'''ember.G.va/bn.dusk.plain.p.0 low.A.cl.glass.plain.pp.0 ember.D.fl/cl.air.plain.p.0''')
chap(2,'Return of the song','The lamp melody comes back with an intimate turn. The following ascent is brighter but quieter than the central climax.',52,
'''lamp.D.cl.tide.turn.p.0 promise.D.cl/bn.reed.turn.mp.0 star.D.cl.glass.plain.mp.0''')
chap(2,'Distant cadence','A brief string memory and a last, low clarinet answer close the song.',47,
'''after.D.v1/cl.air.plain.p.0 dim.D.cl.dusk.plain.pp.0''')
chap(3,'Rondo A: the inward step','Three quick notes make the sixth dance. The clarinet leaves holes for short string answers.',128,
'''gait.A.cl.skip.plain.mf.0 turn.A.v1/cl.lift.plain.mf.0''')
chap(3,'B: the reed song','A lilting second idea alternates long and short syllables; a running extension carries it to E.',128,
'''reed.A.cl.reed.plain.mp.0 ferry.E.fl/cl.cloth.plain.mp.0 reed2.E.cl.tide.turn.mf.1
loom.E.cl.lace.run.f.0 chase.E.v1/bn.skip.plain.mf.0''')
chap(3,'A, with an answer','The opening solo stays intact as the answer shifts between desks.',130,
'''gait.A.cl.skip.turn.mp.0 turn.A.fl/cl.cloth.turn.mf.0 bells.A.v1.lift.plain.f.0''')
chap(3,'C: the wooded bank','F-sharp minor puts the dance lower. Solo bassoon and viola trade its rhythm before a quick upward chase.',125,
'''wood.f#.bn/cl.shadow.plain.p.0 wood2.f#.cl.dusk.plain.mp.0 chase.D.va/cl.skip.run.mp.0
wood.b.cl/bn.throb.turn.mf.0 wood2.b.cl.shadow.run.f.0 ferry.E.fl/cl.glass.plain.mp.0''')
chap(3,'A, in close pursuit','The solo rises an octave against a lighter texture. Wind and string desks catch up in relay.',132,
'''gait.A.cl.lace.run.mf.1 turn.A.v1/fl/bn/cl.skip.plain.mp.0 loom.A.cl.drive.run.f.0''')
chap(3,'The song behind the dance','The slow movement’s melody is heard in dotted-quarter values, with the dance nearly asleep beneath it.',108,
'''window.D.cl.glass.plain.p.0 window.A.fl/cl.dusk.turn.pp.0''')
chap(3,'B renewed','The reed song returns in A: more intimate at first, then doubled back on itself in brighter figuration.',128,
'''reed.A.cl.chamber.turn.mp.0 reed2.D.cl/v1.tide.plain.mp.0 ferry.A.bn/cl.cloth.turn.mp.0
loom.A.cl.lace.run.mf.1 chase.A.v1/cl.skip.run.mf.0''')
chap(3,'A and the last crossing','The refrain is coloured by the subdominant before it comes home. The soloist and orchestra trade the final call.',132,
'''gait.D.fl/cl.skip.turn.mp.0 turn.A.cl.lace.run.mf.0 bells.A.v1.drive.plain.f.0
window.A.cl.chamber.plain.p.0 gait.A.cl.skip.run.mf.0 bells.A.cl/v1.lift.turn.f.0
chase.A.cl.lace.run.mf.1 home.A.cl/v1.seal.plain.f.0''')
DURS=[96,72,48,36,24,18,12,9,6,3]
def splitdur(d):
 if d in DURS:return [d]
 z=[]
 while d:
  n=next(v for v in DURS if v<=d);z.append(n);d-=n
 return z
def re(n,d):
 # All palette durations are notatable; this covers a sustained five-eighth span.
 return [ev(n,v,**({} if len(splitdur(d))==1 or n is None else {'tie':['start','stop'][i==len(splitdur(d))-1] if i in [0,len(splitdur(d))-1] else 'continue'})) for i,v in enumerate(splitdur(d))]
def move(k,p,steps):
 if not steps:return p
 pool=[scale(k,i) for i in range(-30,45)]
 a=[v for v in pool if v>p] if steps>0 else [v for v in reversed(pool) if v<p]
 return a[abs(steps)-1]
def harmonyat(hs,t,total):
 return hs[0 if len(hs)==1 or t<total//2 else 1]
def foreground(m,th,key,leader,oct,var,j,dyn,phraseindex,raw,h):
 total=[96,72,72][m-1]; output=[]; t=0
 for i,(pitch,d) in enumerate(raw):
  if pitch=='r':
   output+=re(None,d);t+=d;continue
  note=reg(key,pitch,leader,oct)
  # Raise the leading tone in minor when the harmony explicitly asks for a major V.
  if key[0].islower() and not pitch.endswith(('#','b')) and (int(pitch)-1)%7==6 and harmonyat(h.split(','),t,total).split('/')[0]=='5':
   note+=1
  iend=i+1==len(raw);future=next((reg(key,v,leader,oct) for v,_ in raw[i+1:] if v!='r'),note)
  sign=1 if future>=note else -1; out=[(note,d)]
  if var in ('turn','flex','rill','run') and j in (0,2,4,5,6) and i==(0 if j%2==0 else 1) and d>=24 and not (th in ('shore','lamp','gait') and j==0):
   if m==2 and d in (48,36) and j in (2,4,6):
    out=[(note,d-12),(move(key,note,1),6),(note,6)]
   elif m==1 and d in (24,36,48):out=[(note,d-12),(move(key,note,1 if j!=5 else -1),6),(note,6)]
   elif m==3 and d in (24,36) and j in (2,4,6):out=[(note,d-12),(move(key,note,1),6),(note,6)]
  if var in ('run','rill') and d==12 and (j not in (3,7) or var=='rill') and (i+j+phraseindex)%3!=1 and future!=note:
   # Keep the downbeat attack. Fill the interval on its weak sixteenth.
   degree=move(key,note,sign); second=degree if abs(note-future)>=3 else move(key,note,-sign)
   out=[(note,6),(second,6)]
  if var=='rill' and j==7 and i==0: # final written-out trill, with a clear lifted release
   out=[(note if x%2==0 else move(key,note,1),6) for x in range(10)]+[(move(key,note,-1),6),(note,6)]
  if leader in ('cl','fl','bn','hn') and j in (2,5) and iend and len(out)==1 and d>=24 and (j+phraseindex)%3!=0:
   cut=6 if m!=3 else 12
   out=[(note,d-cut),(None,cut)]
  for n,du in out:
   if n is not None:n=cap(n,*limits[leader])
   output.extend(re(n,du))
  t+=d
 # Systematic but phrase-aware articulation; slurs are local to the bar.
 sounding=[k for k,e in enumerate(output) if e['p'] is not None]
 if not sounding:return output
 if m==3 and th not in ('window','reed','reed2','ferry') and j%2==0:
  for k in sounding:
   if k and k%3==2 and output[k]['d'] in (12,24):output[k]['art']='staccato'
 elif m==1 and th in ('signal','split','chase') and j in (0,1,4,5):output[sounding[0]]['art']='accent'
 elif m==2 and output[sounding[0]]['d']>=36 and j in (0,4):output[sounding[0]]['art']='tenuto'
 # Mark groups, rather than printing blanket slurs over rests and articulations.
 starts=[0]
 if m==3 and th not in ('window','reed','reed2','ferry'):starts=[0,36]
 for pos in starts:
  end=36 if pos==0 and len(starts)==2 else total
  ix=[];now=0
  for k,e in enumerate(output):
   if pos<=now<end:
    if e['p'] is None or e.get('art')=='staccato':
     if len(ix)>=2:break
     ix=[]
    else:ix.append(k)
   now+=e['d']
  if len(ix)>=2 and (m==2 or var!='plain' or j%3!=2):
   output[ix[0]]['slur']='start';output[ix[-1]]['slur']='stop'
 if leader in ('cl','fl','bn','hn') and j in (2,3,5,7) and (output[-1]['p'] is None or j==7):
  output[sounding[-1]]['breath']=True
 return output
# Accompaniment: a family of eight written rhythmic grammars, with an explicit
# seating/entry schedule. A response is played only when the floor has cleared.
def seat(part,tex,j,qi,m,leader):
 if tex=='cad' or part=='cl':return False
 if tex=='seal' and j==7:return part in ('v1','v2','va','vc','hn','bn')
 u=(j+qi)%8
 if part=='vc':
  return not ((tex in ('glass','dusk','chamber') and u in (2,6)) or (tex=='reed' and leader=='bn' and u%2==1))
 if part=='va':
  if tex in ('glass','dusk'):return u in (0,2,3,5,7)
  if tex in ('reed','chamber','air'):return u not in (1,2,6)
  return True
 if part=='v2':
  if tex in ('glass','dusk','reed'):return u in (1,3,4,6)
  if tex in ('chamber','air','shadow'):return u not in (0,3,5)
  return True
 if part=='v1':
  if tex in ('glass','dusk','reed'):return u in (2,4,6)
  if tex in ('chamber','air','shadow','lace'):return u in (0,2,3,5,7)
  return True
 if part=='hn':
  if tex in ('glass','dusk','chamber','lace','reed','air','skip'):return False
  if tex in ('seal','lift','storm','drive','sail'):return j in (0,2,3,4,6,7)
  return j in (3,7) and qi%2==0
 if part=='fl':
  if leader=='v1' and tex in ('seal','lift') and j in (0,4,6):return True
  if tex in ('dusk','chamber','glass','shadow','reed','air'):return j in ((3,7) if qi%2 else (1,5)) and qi%4!=0
  return j in ((1,3,6,7) if qi%2 else (0,2,5,7))
 if part=='bn':
  if tex in ('glass','dusk','chamber'):return j in ((2,6) if qi%2 else (3,7))
  if tex in ('shadow','reed','throb'):return j not in (0,3,5)
  return j in ((0,2,5,7) if qi%2 else (1,3,4,6))
def shape(m,part,tex,j,qi,lead):
 # Pattern durations and tones are independent of row order. Integers 0..2
 # refer to chord members, B is the notated inversion bass, x is a rest.
 total=[96,72,72][m-1]; skinny=tex in ('air','glass','dusk','chamber','reed')
 strong=tex in ('seal','lift','storm','drive','sail')
 u=(j+qi)%4;beat=24 if m!=3 else 36
 def seq(s):
  a=[(p,int(d)) for p,d in (tok.split(':') for tok in s.split())]
  assert sum(v for _,v in a)==total,(m,tex,part,s);return a
 def pattern(*ss):return seq(ss[u%len(ss)])
 def long(n):return [(n,total)]
 if tex=='seal' and j==7:
  return seq('B:72 x:24' if m==1 and part=='vc' else '0:72 x:24' if m==1 else 'B:36 x:36' if part=='vc' else '0:36 x:36')
 if part=='vc':
  if m==1:
   if skinny:return pattern('B:48 x:48','B:72 x:24','B:48 2:24 x:24','B:96')
   if tex in ('shadow','throb'):return pattern('B:36 2:12 1:24 x:24','B:24 x:12 2:12 B:24 1:24')
   if tex=='lace':return pattern('B:48 2:24 x:24','B:24 x:24 2:24 B:24','B:48 2:48')
   return pattern('B:24 x:12 2:12 B:24 2:24','B:48 2:24 1:24','B:24 2:24 B:24 x:24','B:48 2:24 x:24')
  if m==2:
   if skinny:return pattern('B:48 x:24','B:72','B:36 2:12 x:24')
   if tex in ('storm','throb'):return pattern('B:24 2:24 1:24','B:36 2:12 B:24')
   return pattern('B:48 2:24','B:24 x:24 2:24','B:72')
  if skinny:return pattern('B:36 x:36','B:36 2:24 x:12','B:72')
  return pattern('B:24 x:12 2:24 x:12','B:36 2:12 B:12 1:12','B:24 2:12 B:36','B:36 2:24 x:12')
 if part=='hn':
  if m==1:return pattern('0:48 x:48','x:48 2:48','2:72 x:24','0:96')
  if m==2:return pattern('0:48 x:24','2:72','x:24 0:48')
  return pattern('0:36 x:36','x:36 2:36','2:24 x:12 0:24 x:12')
 if part=='fl':
  if m==1:return pattern('x:48 2:24 1:12 0:12','x:24 1:36 2:12 0:24','2:48 x:48','x:48 1:12 2:12 0:24')
  if m==2:return pattern('x:24 2:36 1:12','x:36 1:12 0:24','2:48 x:24')
  return pattern('x:36 1:12 2:12 0:12','2:24 x:12 x:36','x:24 2:12 1:24 0:12','x:36 2:24 1:12')
 if part=='bn':
  if m==1:
   if skinny:return pattern('x:48 1:36 0:12','2:48 x:48','x:24 0:12 1:12 2:36 1:12')
   return pattern('0:24 x:24 1:24 2:24','x:24 1:12 2:12 0:48','2:36 1:12 0:24 x:24','x:48 2:12 1:12 0:24')
  if m==2:return pattern('x:24 1:24 2:24','2:48 1:24','x:36 1:12 0:24')
  return pattern('x:36 2:12 1:12 0:12','1:24 2:12 0:24 x:12','0:36 x:36','x:24 0:12 1:24 2:12')
 if part=='v1':
  if m==1:
   if skinny:return pattern('2:72 x:24','x:48 1:36 0:12','x:24 2:48 1:24')
   if tex=='lace':return pattern('x:48 2:36 1:12','1:48 x:48','2:72 x:24')
   return pattern('2:36 1:12 0:24 2:24','x:24 1:12 2:12 0:36 1:12','2:48 1:24 2:24','1:24 x:24 2:48')
  if m==2:return pattern('2:48 1:24','x:24 1:48','2:36 1:12 0:24','1:72')
  if skinny:return pattern('2:36 x:36','x:36 2:24 1:12','1:36 2:24 x:12')
  return pattern('2:24 1:12 0:24 x:12','x:36 1:12 2:12 0:12','2:36 x:12 1:12 2:12','1:24 x:12 2:36')
 if part=='v2':
  if m==1:
   if skinny:return pattern('1:48 2:48','2:72 x:24','x:24 1:48 2:24','1:96')
   if tex in ('lace','drive'):return pattern('x:12 1:12 2:12 1:12 x:12 1:12 2:12 1:12','0:24 1:12 2:12 1:24 x:24','x:12 1:12 2:24 x:12 1:12 2:24')
   return pattern('x:24 1:24 x:24 2:24','1:36 2:12 1:24 x:24','x:12 1:12 2:24 1:48','2:48 1:48')
  if m==2:
   if tex in ('tide','storm'):return pattern('x:12 1:12 2:12 1:12 0:24','1:24 2:12 1:12 0:24','x:12 1:12 2:24 1:24')
   return pattern('1:48 2:24','x:24 1:48','2:72','1:36 2:12 1:24')
  if skinny:return pattern('1:36 2:36','x:36 1:36','1:24 x:12 2:24 x:12')
  return pattern('x:12 1:12 2:12 x:12 2:12 1:12','1:24 x:12 2:24 x:12','x:12 1:24 x:12 2:24','1:12 2:12 1:12 0:24 x:12')
 if part=='va':
  if m==1:
   if skinny:return pattern('0:96','2:48 0:24 x:24','x:24 2:72')
   if tex in ('drive','lace'):return pattern('0:24 x:12 2:12 0:24 x:12 2:12','x:24 0:24 2:24 0:24')
   return pattern('0:48 2:24 x:24','2:24 x:24 0:48','x:24 2:24 x:24 0:24','0:72 x:24')
  if m==2:
   if tex in ('tide','storm','throb'):return pattern('0:24 x:12 2:12 0:24','x:24 2:24 0:24')
   return pattern('2:48 0:24','0:72','x:24 2:48','2:72')
  if skinny:return pattern('0:36 2:36','2:36 x:36','x:36 0:36')
  return pattern('0:24 x:12 2:36','x:12 2:24 0:24 x:12','2:36 x:12 0:24','0:36 2:24 x:12')
 raise ValueError(part)
def nearest(pc,center,lo,hi,old=None):
 opts=[x for x in range(lo,hi+1) if x%12==pc%12]
 return min(opts,key=lambda n:abs(n-center)+(0.43*abs(n-old) if old is not None else 0))
def acc(m,p,key,h,j,q,tex,leader,prev,leadEvents):
 total=[96,72,72][m-1]
 if not seat(p,tex,j,q,m,leader):return [ev(None,total)]
 sh=shape(m,p,tex,j,q,leader);hs=[chord(key,v) for v in h.split(',')]
 # All four desks have separate rows. Keep the inner desks below the
 # obligato; woodwind answers are intentionally free to cross the soloist.
 centers={'fl':78,'bn':54,'hn':54,'v1':71,'v2':64,'va':56,'vc':44}
 ranges={'fl':(67,89),'bn':(41,66),'hn':(43,65),'v1':(58,82),'v2':(55,74),'va':(48,65),'vc':(36,55)}
 point=centers[p]+(2 if tex in ('storm','lift') and p in ('fl','v1','v2') else -2 if tex in ('dusk','shadow') and p in ('va','bn','v1') else 0)
 leadnotes=[z['p'] for z in leadEvents if z['p'] is not None]
 if leader=='cl' and p in ('v1','v2') and leadnotes and tex not in ('lift','seal','storm'):
  point=min(point,max(62 if p=='v1' else 59,statistics.median(leadnotes)-4))
 offset=[0,1,0,-1,-1,0,1,0][j]
 last=prev; t=0;out=[]
 for item,d in sh:
  # Divide a held support into two voices of the new harmony at the half-bar.
  seg=[d]
  if len(hs)==2 and t<total//2<t+d:seg=[total//2-t,t+d-total//2]
  for du in seg:
   ps,bass=harmonyat(hs,t,total)
   if item=='x':n=None
   else:
    slot=int(item) if item!='B' else -1
    if tex=='seal' and j==7:slot={'va':2,'v2':1,'bn':2,'hn':0,'vc':-1,'v1':0,'fl':0}.get(p,0)
    pc=bass if slot==-1 else ps[slot]
    center=point+offset +(2 if slot==2 and p not in ('vc','bn','hn') else 0)
    if item=='B' and p=='vc':center-=1
    n=nearest(pc,center,*ranges[p],old=last);last=n
   out.extend(re(n,du));t+=du
 for k,z in enumerate(out):
  if z['p'] is None:continue
  if tex in ('skip','drive','lift','seal','lace') and z['d']<=24 and (m==3 or p in ('vc','va','v2')) and (k+j)%3!=1:z['art']='staccato'
  if tex in ('seal','lift','storm') and j in (0,4,6) and k==0 and z['d']>=24:z['art']='accent'
  if m==2 and tex in ('dusk','glass') and z['d']>=48 and (j+q)%3==0 and p in ('fl','bn','v1','va'):z['art']='tenuto'
 if p in ('fl','bn') and len(out)>2:
  a=[i for i,v in enumerate(out) if v['p'] is not None]
  if a and len(a)>=2 and all(out[k]['p'] is not None for k in range(a[0],a[-1]+1)) and (j+q)%2==1:
   out[a[0]]['slur']='start';out[a[-1]]['slur']='stop'
 return out
DYN='ppp pp p mp mf f ff'.split()
def dynamic(base,lead,tex,p,j,q,m):
 i=DYN.index(base)
 if not lead:i-=(1 if p in ('vc','va','v2','hn') or tex in ('glass','dusk','chamber','air') else 0)
 if not lead and p=='fl':i-=1
 if j==6 and tex in ('storm','seal','drive','lift'):i+=1
 if lead and j==4 and tex in ('tide','shadow','throb'):i+=1
 if j==7 and tex in ('dusk','glass'):i-=1
 return DYN[max(0,min(6,i))]
def tempo(m,bpm,j,tex,th,qi):
 if tex=='cad':
  return ([77,66,91,63,105,102,86,67] if th=='cad1' else [76,97,89,100,69,101,94,57])[j]
 elastic=([0,0,1,-1,1,2,1,-3] if m==1 else [0,-1,1,-2,0,1,-1,-3] if m==2 else [0,0,2,-1,0,2,1,-2])
 return bpm+elastic[j]+([0,1,0,-1][qi%4] if tex not in ('seal','cad') else ([-2,-6,-11,-20][j-4] if j>=4 and tex=='seal' else 0))
def mergeTies(bars,m):
 # Tie selected quiet accompanying strings over barlines. Never tie a lead
 # phrase or new dynamic/section into its next attack.
 for i in range(len(bars)-1):
  a,b=bars[i:i+2]
  if b['section'] or i%8==7:continue
  for p in ('v2','va','vc'):
   x=a['parts'][p][-1];y=b['parts'][p][0]
   if (x['p']==y['p'] and x['p'] is not None and x['d']>=36 and y['d']>=36 and
       not any(k in y for k in ('dyn','art','slur')) and not ('art' in x or 'slur' in x) and (i+P.index(p))%3==0):
    if x.get('tie')=='start' or y.get('tie')=='stop':continue
    x['tie']='continue' if x.get('tie')=='stop' else 'start';y['tie']='continue' if y.get('tie')=='start' else 'stop'
def build():
 work={'title':'The Other Shore: An Imagined Second Clarinet Concerto','composer':'Astra','movements':[]}
 names=['I. Allegro con respiro','II. Adagio cantabile','III. Rondo: Allegro leggiero']
 subs=['Across the water','The lamp on the far bank','The inward step']
 for mn,cues in enumerate(PLAN,1):
  m={'title':names[mn-1],'subtitle':subs[mn-1],'meter':[[4,4],[3,4],[6,8]][mn-1],'keyFifths':[3,2,3][mn-1],'bars':[]}
  work['movements'].append(m);prev={p:None for p in P};ds={p:None for p in P};vac={p:9 for p in P}
  for q,(th,key,voices,tex,var,dyn,oct,bpm,title,description) in enumerate(cues):
   leaders=voices.split('/');prof=BOOK[mn-1][th]
   for j,(h,raw) in enumerate(prof):
    # In the two minor-mode development episodes the subtonic is V/III,
    # not the diminished leading-tone chord from the major-mode prototype.
    if key[0].islower() and th in ('undertow','wood') and h=='7o':h='7+'
    if key[0].islower() and h=='2+':
     raw=[(a+'#' if a=='6' else a,d) for a,d in raw]  # fifth of V/V
    leader=leaders[min(len(leaders)-1,j*len(leaders)//8)]
    assert leader in P
    partdata={};bar={'tempo':tempo(mn,bpm,j,tex,th,q),'section':title if j==0 else '','parts':partdata}
    if title and j==0:bar['description']=description
    melody=foreground(mn,th,key,leader,oct if leader=='cl' else 0,var,j,dyn,q,raw,h)
    # Planned intakes verified with the performed tempo, not the page count.
    if leader=='cl' and (mn,q*8+j+1) in ((1,156),(1,245),(2,36)):
     assert melody[-1]['p'] is not None and melody[-1]['d'] in (12,24)
     melody[-1]['d']-=6;melody[-1]['breath']=True;melody.append(ev(None,6))
    for p in P:
     part=melody if p==leader else acc(mn,p,key,h,j,q,tex,leader,prev[p],melody)
     ns=[n for n in part if n['p'] is not None]
     if ns:
      d=dynamic(dyn,p==leader,tex,p,j,q,mn)
      if (d!=ds[p] and (j in (0,4,6,7) or p==leader or ds[p] is None)) or vac[p]>=4:
       ns[0]['dyn']=d;ds[p]=d
      prev[p]=ns[-1]['p'];vac[p]=0
     else:vac[p]+=1
     assert sum(n['d'] for n in part)==[96,72,72][mn-1],(mn,q,j,p,part)
     assert all(n['d'] in DURS and (n['p'] is None or limits[p][0]<=n['p']<=limits[p][1]) for n in part)
     partdata[p]=part
    m['bars'].append(bar)
  mergeTies(m['bars'],mn)
 return work
def report(work):
 out=['# The Other Shore: An Imagined Second Clarinet Concerto','Composer: Astra. Original material, no quotations or imported MIDI.','',
 'Concert pitch in this source; classical A clarinet, flute, bassoon, horn in F, two violin desks, viola, cello.','',
 'How to hear the piece:',
 'I. The first violin’s C-sharp–A–G-sharp–F-sharp (quarter, dotted quarter, eighth, quarter) is not a quotation. Its upward minor sixth opens a space which two steps partly close. The first solo entrance changes its register rather than changing its identity. The second subject begins on scale-degree five, stays there for two beats and then falls through three, two and one. Listen for an extroverted high answer as it continues. The development separates the low call from the top of the sixth, passing the pieces among bassoon, viola and soloist.',
 'II. F-sharp and a late high D occupy the opening D-major bar almost by themselves. The sighing C-sharp–B belongs to the next bar; it no longer has to share the leap’s rhythm. The dark woodwind and viola entries and two minor-key episodes precede the central rise. A later, quieter voice takes the song home.',
 'III. Three close eighth notes, followed by a long-short tail, turn the first movement’s wide gesture into a gigue. The B episode leans on repeated long-short pairs. C lowers the register, puts the dance in minor and introduces an articulated bassoon/clarinet conversation. The slow movement is heard in dotted-quarter values in the middle of the finale, and again quietly before the last refrain.',
 'The score is realized from 36 separately written eight-bar melodic/harmonic periods (288 source measures). Their sequence, keys, solo/orchestral exchanges, bell-like full closures, solo cadenzas, changes of register and ornamental treatment are specified individually; no audio or MIDI is imported. The return forms deliberately preserve identifiable material.',
 'Technical audit: tempo is stated in quarters per minute, including 6/8. All events use an integer multiple of three ticks, with 24 ticks per quarter, and exactly fill the measure independently on each desk. Durations below exclude inter-track silence and playback reverb.','']
 allsec=0
 for m in work['movements']:
  bars=m['bars'];beats=m['meter'][0]*4/m['meter'][1];ts=[beats*60/b['tempo'] for b in bars]
  tot=sum(ts);allsec+=tot
  out.append('%s | %s bars | %.2f s (%d:%02d)'%(m['title'],len(bars),tot,int(tot)//60,round(tot)%60))
  out.append('Chapters (1-based measure, start time):')
  for i,b in enumerate(bars):
   if b['section']:
    ss=round(sum(ts[:i]));out.append('  %3d %02d:%02d %s. %s'%(i+1,ss//60,ss%60,b['section'],b.get('description','')))
  for p in P:
   notes=[e for b in bars for e in b['parts'][p] if e['p'] is not None];rst=sum(sum(e['d'] for e in b['parts'][p] if e['p'] is None) for b in bars)
   silent=sum(all(e['p'] is None for e in b['parts'][p]) for b in bars)
   out.append('  %s: %d note events; MIDI %d–%d; rests %.1f%%; %d fully silent bars.'%(p,len(notes),min(x['p'] for x in notes),max(x['p'] for x in notes),100*rst/(len(bars)*beats*24),silent))
  dens=collections.Counter(sum(any(n['p'] is not None for n in b['parts'][p]) for p in P) for b in bars)
  out.append('  Active desks per measure (desks: count): '+str(dict(sorted(dens.items()))))
  vv=[tuple(tuple((e['p'],e['d']) for e in b['parts'][p]) for p in P) for b in bars]
  out.append('  Distinct full scores ignoring expression: %d of %d measures; %d of %d eight-measure periods.'%(len(set(vv)),len(vv),len(set(tuple(vv[n:n+8]) for n in range(0,len(vv),8))),len(vv)//8))
  out.append('')
 out.append('Total %.3f seconds (%d:%02d).'%(allsec,int(allsec)//60,round(allsec)%60));return '\n'.join(out)
if __name__=='__main__':
 work=build();(D/'work.json').write_text(json.dumps(work,separators=(',',':'))+'\n')
 audit=report(work);print(audit);(D/'composition-notes.txt').write_text(audit+'\n')
