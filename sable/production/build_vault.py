"""Build the Sable Relay optical vault and exit seal in Blender 4.3+.
blender -b --factory-startup -P build_vault.py -- ./out [preview|final] [CPU|OPTIX|CUDA]
Outputs: editable .blend, a glTF seal, square seal map, and a Cycles beauty plate.
"""
import bpy, math, sys, random, os, json, time
from pathlib import Path
from mathutils import Vector
args=sys.argv[sys.argv.index('--')+1:] if '--' in sys.argv else []
OUT=Path(args[0] if args else 'sable-assets').resolve();OUT.mkdir(parents=True,exist_ok=True)
FINAL=len(args)>1 and args[1]=='final';DEVICE=args[2] if len(args)>2 else 'CPU';random.seed(413)
S=bpy.context.scene;PI=math.pi;TAU=2*PI
bpy.ops.object.select_all(action='SELECT');bpy.ops.object.delete(use_global=False)
def mat(name,col,metal=0,rough=.45,noise=0,emission=0):
 m=bpy.data.materials.new(name);m.diffuse_color=(*col,1);m.use_nodes=True;n=m.node_tree.nodes;L=m.node_tree.links;s=n.get('Principled BSDF');s.inputs['Base Color'].default_value=(*col,1);s.inputs['Metallic'].default_value=metal;s.inputs['Roughness'].default_value=rough
 if noise:
  tc=n.new('ShaderNodeTexCoord');nt=n.new('ShaderNodeTexNoise');nt.inputs['Scale'].default_value=noise;nt.inputs['Detail'].default_value=2.7;nt.inputs['Roughness'].default_value=.72;L.new(tc.outputs['Generated'],nt.inputs['Vector']);cr=n.new('ShaderNodeValToRGB')
  cr.color_ramp.elements[0].position=.19;cr.color_ramp.elements[0].color=(*[v*.53 for v in col],1);cr.color_ramp.elements[1].position=.87;cr.color_ramp.elements[1].color=(*[min(1,v*1.37) for v in col],1);L.new(nt.outputs['Fac'],cr.inputs['Fac']);L.new(cr.outputs['Color'],s.inputs['Base Color'])
  bump=n.new('ShaderNodeBump');bump.inputs['Strength'].default_value=.15;bump.inputs['Distance'].default_value=.035;L.new(nt.outputs['Fac'],bump.inputs['Height']);L.new(bump.outputs['Normal'],s.inputs['Normal'])
 if emission:s.inputs['Emission Color'].default_value=(*col,1);s.inputs['Emission Strength'].default_value=emission
 return m
basalt=mat('Quarried blue basalt',(.052,.078,.085),.12,.39,7);deep=mat('Cold basalt shadow',(.021,.037,.046),.23,.34,8);bronze=mat('Brushed auric brass',(.50,.245,.062),.76,.27,8);pale=mat('Ceramic edge',(.76,.67,.44),.42,.30,3);gilt=mat('Sunlit brass',(.91,.48,.105),.8,.23,3);iron=mat('Patinated iron',(.054,.12,.122),.62,.32,5);wet=mat('Blue schist',(.052,.087,.099),.42,.24,12);grout=mat('Stone grout',(.035,.051,.055),.1,.6);cyan=mat('Relay phosphor',(.075,.83,.78),.1,.18,0,2.6);amber=mat('Pilot lamp',(.98,.36,.045),.15,.24,0,2);mirror=mat('Black optical silver',(.78,.85,.85),1,.10);sunMat=mat('Solar disc',(1,.49,.165),0,.5,0,2.4)
def mesh_obj(name,verts,faces,m):
 me=bpy.data.meshes.new(name);me.from_pydata(verts,[],faces);me.update();o=bpy.data.objects.new(name,me);bpy.context.collection.objects.link(o);o.data.materials.append(m);return o
def bevel(o,width=.025,seg=2):
 if width:
  mod=o.modifiers.new('Milled corners','BEVEL');mod.width=width;mod.segments=seg
  n=o.modifiers.new('Face normals','WEIGHTED_NORMAL');n.keep_sharp=True
 return o
unit={}
def cube(name,loc,dim,m,b=.0,rot=(0,0,0)):
 bpy.ops.mesh.primitive_cube_add(size=1,location=loc);o=bpy.context.object;o.name=name;o.dimensions=dim;bpy.ops.object.transform_apply(location=False,rotation=False,scale=True);o.rotation_euler=rot;o.data.materials.append(m);return bevel(o,b)
def cyl(name,loc,r,depth,m,rot=(0,0,0),v=48,b=.008):
 bpy.ops.mesh.primitive_cylinder_add(vertices=v,radius=r,depth=depth,location=loc,rotation=rot);o=bpy.context.object;o.name=name;o.data.materials.append(m);return bevel(o,b)
def ring(name,x,y,z,ri,ro,start,end,depth,m,steps=28):
 vs=[];fs=[]
 for i in range(steps+1):
  a=start+(end-start)*i/steps;cs=math.cos(a);sn=math.sin(a)
  for yy,r in [(y-depth/2,ri),(y-depth/2,ro),(y+depth/2,ro),(y+depth/2,ri)]:vs.append((x+r*cs,yy,z+r*sn))
 for i in range(steps):
  for j in range(4):fs.append((4*i+j,4*i+(j+1)%4,4*(i+1)+(j+1)%4,4*(i+1)+j))
 fs.extend([(0,3,2,1),(4*steps,4*steps+1,4*steps+2,4*steps+3)]);return mesh_obj(name,vs,fs,m)
def beam(name,a,b,r,m):
 d=Vector(b)-Vector(a);o=cyl(name,(Vector(a)+Vector(b))/2,r,d.length,m,v=14,b=0);o.rotation_euler=d.to_track_quat('Z','Y').to_euler();return o
def area(name,pos,aim,power,color,size):
 bpy.ops.object.light_add(type='AREA',location=pos);o=bpy.context.object;o.name=name;o.data.energy=power;o.data.color=color;o.data.shape='DISK';o.data.size=size;o.rotation_euler=(Vector(aim)-o.location).to_track_quat('-Z','Y').to_euler();return o
def world(color,strength):
 S.world.use_nodes=True;n=S.world.node_tree.nodes.get('Background');n.inputs[0].default_value=(*color,1);n.inputs[1].default_value=strength
def camera(pos,aim,lens):
 bpy.ops.object.camera_add(location=pos);cam=bpy.context.object;cam.data.lens=lens;cam.rotation_euler=(Vector(aim)-cam.location).to_track_quat('-Z','Y').to_euler();S.camera=cam;return cam
def cfg():
 S.render.engine='CYCLES';S.cycles.samples=96 if FINAL else 12;S.cycles.use_denoising=DEVICE!='CPU';S.cycles.max_bounces=6;S.cycles.diffuse_bounces=3;S.cycles.glossy_bounces=4
 if DEVICE!='CPU':
  pref=bpy.context.preferences.addons['cycles'].preferences;pref.compute_device_type=DEVICE;pref.refresh_devices();use=[d for d in pref.devices if d.type==DEVICE]
  if not use:raise RuntimeError('Requested Cycles GPU backend unavailable: '+DEVICE)
  for d in pref.devices:d.use=d.type==DEVICE
  S.cycles.device='GPU'
  print('ACTIVE_RENDER_DEVICE',[(d.type,d.name) for d in use],flush=True)
 else:S.cycles.device='CPU'
 S.render.resolution_percentage=100;S.render.film_transparent=False
 S.view_settings.view_transform='AgX';S.view_settings.exposure=.25
def render(name,w,h,fmt):
 S.render.resolution_x=w;S.render.resolution_y=h;S.render.image_settings.file_format=fmt;S.render.image_settings.color_mode='RGB';S.render.image_settings.quality=92;S.render.filepath=str(OUT/name);tic=time.perf_counter();bpy.ops.render.render(write_still=True);return round(time.perf_counter()-tic,2)
cfg()
# A mechanical brass rosette. The register notches are individually modelled, never painted on.
cyl('R_hub', (0,0,0),1.0,.18,iron,(PI/2,0,0),96)
for idx,(r,rr,y,m) in enumerate([(.92,1.0,-.10,bronze),(.86,.89,-.12,gilt),(.64,.68,-.13,pale),(.43,.46,-.16,bronze),(.19,.23,-.18,gilt)]):
 ring('R_race_%d'%idx,0,y,0,r,rr,0,TAU,.035,m,80)
for i in range(60):
 a=TAU*i/60;r=.905;ln=.065 if i%5==0 else .028
 cube('R_index_%02d'%i,(r*math.cos(a),-.121,r*math.sin(a)),(ln,.025,.013),pale if i%5==0 else bronze,0,(0,-a,0))
for i in range(9):
 a=i*TAU/9;pts=[(.235,a+.20),(.38,a-.14),(.79,a+.11),(.78,a+.23),(.40,a+.10)]
 vs=[(r*math.cos(q),y,r*math.sin(q)) for y in [-.18,-.12] for r,q in pts];fs=[tuple(range(4,-1,-1)),tuple(range(5,10))]+[(j,(j+1)%5,(j+1)%5+5,j+5) for j in range(5)]
 bevel(mesh_obj('R_turbine_leaf_%d'%i,vs,fs,bronze if i%3 else gilt),.009)
 r=.746;ring('R_concentric_%d'%i,0,-.12,0,r,r+.018,a+.30,a+.56,.018,gilt,12)
cyl('R_core',(0,-.195,0),.143,.07,gilt,(PI/2,0,0),9)
for i in range(3):
 a=i*TAU/3;beam('R_triad%d'%i,(.12*math.cos(a),-.241,.12*math.sin(a)),(.12*math.cos(a+TAU/3),-.241,.12*math.sin(a+TAU/3)),.012,deep)
seal_objs=[o for o in bpy.context.scene.objects if o.name.startswith('R_')]
bpy.ops.object.select_all(action='DESELECT')
for o in seal_objs:o.select_set(True)
bpy.context.view_layer.objects.active=seal_objs[0]
bpy.ops.export_scene.gltf(filepath=str(OUT/'seal.glb'),export_format='GLB',use_selection=True,export_apply=True,export_materials='EXPORT')
world((.08,.115,.13),.48);key=area('Seal softbox',(-2,-3,3),(0,0,0),420,(1,.83,.57),2.4);fill=area('Seal strip',(2,-2,.2),(0,0,0),180,(.38,.8,.95),1.2)
cam=camera((0,-4,0),(0,0,0),55);cam.data.type='ORTHO';cam.data.ortho_scale=2.14
seal_secs=render('seal.png',256,256,'PNG')
for o in [key,fill,cam]:bpy.data.objects.remove(o,do_unlink=True)
# Move authored seal to the northern vault wall.
for o in seal_objs:
 o.location=Vector((o.location.x*1.61,9.65+o.location.y*1.61,2.63+o.location.z*1.61));o.scale*=1.61
# Tessellated wet slate and long inlaid guidance rules.
cube('Foundation',(0,1,-.32),(18,29,.6),grout)
for j in range(12):
 for i in range(6):
  x=(i-2.5)*2.57 + (.28 if j%2 else -.28);y=-11.6+j*2.03
  cube('Quarry slab %02d.%02d'%(i,j),(x,y,-.06+random.uniform(-.012,.012)),(2.53,2.0,.15),wet if (i+j)%5 else basalt,.018)
for side in [-1,1]:
 for j in range(11):
  y=-10.4+j*2.0; x=side*7.85
  cube('Side wall',(x,y,2.30),(1.05,1.96,4.64),basalt if j%3 else deep,.075)
  cube('Shadow reveal',(side*7.23,y,1.77),(.32,1.44,3.58),deep,.04)
  cube('Bronze mile',(side*7.04,y-.76,1.46),(.09,.06,2.9),bronze,.014)
  cube('Wet curb',(side*6.9,y,.22),(.88,1.96,.44),deep,.04)
  if j%2==0:
   cube('Buttress',(side*7.35,y-.51,3.10),(1.27,.68,6.15),basalt,.06)
   cube('Top cleat',(side*7.25,y-.51,6.18),(1.33,.74,.15),gilt,.025)
 for j in range(8):
  cube('Runway rule',(side*4.45,-9+j*2.43,.036),(.034,1.93,.018),bronze)
 for j in range(5):
  cube('Survey index',(side*4.59,-8+j*3.55,.038),(.27,.036,.018),pale)
# Massive split terminus; a nested disc gate sits below the broken orbital crown.
for side in [-1,1]:
 cube('Northern abutment',(side*5.28,10.22,2.75),(6.45,1.05,5.55),basalt,.08)
 cube('Vault narthex',(side*2.48,10.03,3.20),(.90,1.70,6.45),deep,.055)
 cube('Upright brass',(side*1.95,9.41,2.77),(.065,.29,5.55),gilt,.013)
 for i in range(10):cube('Flute',(side*(3.08+i*.47),9.64,2.68),(.095,.13,5.2),deep,.018)
cyl('Optical bulkhead',(0,10.05,2.63),1.96,.66,deep,(PI/2,0,0),96)
for i in range(20):
 a=i*TAU/20;ring('Gate segment',0,9.60,2.63,1.66,1.91,a+.014,a+TAU/20-.014,.30,bronze if i%2 else iron,8)
 ring('Pilot on gate',0,9.43,2.63,1.764,1.79,a+.04,a+TAU/20-.04,.015,cyan,8)
for k,(rr,dep,off) in enumerate([(5.7,.68,12.5),(6.9,.46,14.0),(7.4,.23,15.2)]):
 for i in range(28):
  a=i*TAU/28
  if i in (1,10,16) and k!=1:continue
  ring('Orbital crown %d'%k,0,off,3.5,rr,rr+( .46 if k==0 else .22),a+.016,a+TAU/28-.016,dep,bronze if (i+k)%4 else gilt,5)
  if k==0 and i%2==0:ring('Phosphor key',0,off-dep*.51,3.5,rr+.07,rr+.105,a+.035,a+TAU/28-.035,.014,cyan,5)
# Two upright optics; their ray traces become the game's actual relay paths.
def optic(x,y,ang):
 cyl('Azimuth foot',(x,y,.17),.83,.32,deep,v=12);cyl('Graduated circle',(x,y,.355),.697,.09,bronze,v=60);cyl('Shaft',(x,y,.67),.18,.62,iron)
 for i in range(24):
  a=TAU*i/24
  cube('Azimuth notch',(x+.62*math.cos(a),y+.62*math.sin(a),.406),(.08 if i%3==0 else .04,.016,.01),pale,0,(0,0,a))
 tangent=Vector((math.cos(ang),math.sin(ang),0));normal=Vector((math.sin(ang),-math.cos(ang),0))
 cube('Optic cradle',(x,y,1.62),(1.99,.18,1.56),gilt,.08,(0,0,ang))
 mid=Vector((x,y,1.62))+normal*.102
 cube('Silver mirror slab',mid,(1.84,.05,1.43),mirror,.06,(0,0,ang))
 for sign in [-1,1]:
  q=Vector((x,y,1.62))+tangent*sign*1.02
  cyl('Facet bearing',q,.107,.18,bronze,(0,PI/2,ang),24)
  q2=Vector((x,y,1.28))+tangent*sign*.94+normal*.15
  beam('Mirror edge mark',q2,q2+Vector((0,0,.48)),.014,cyan)
optic(-2.60,-2.0,PI/4);optic(-2.60,4.10,PI/4);optic(3.80,.35,-PI*.31)
for x,y in [(-6.75,-2),(5.55,4.1)]:
 cube('Signal tower',(x,y,.88),(.71,.73,1.73),deep,.07);cube('Meter head',(x,y,1.55),(.85,.89,.69),bronze,.06)
for a,b in [[(-6.5,-2,1.52),(-2.60,-2,1.52)],[(-2.60,-2,1.52),(-2.60,4.1,1.52)],[(-2.60,4.1,1.52),(5.50,4.1,1.52)]]:beam('Carrier main',a,b,.019,cyan)
# Horizon basalt escarpments and a back-lit eclipse disc.
for i in range(34):
 x=-66+i*4.0; z=3.1+2.4*math.sin(.52*i)+random.uniform(-.7,1.4)
 o=cube('Ridge', (x,26+random.uniform(0,9),z-1),(5.9,6.9,max(1,z+4)),deep,.28,(0,random.uniform(-.25,.25),random.uniform(-.31,.31)))
sun=cyl('Eclipsed star',(-8.5,31,12.0),4.7,.24,sunMat,(PI/2,0,0),128,0)
cyl('Occulting moon',(-8.0,30.78,12.5),4.30,.20,deep,(PI/2,0,0),128,0)
# A painted physical cyclorama supplies the graded eclipse sky seen by the camera
# and in the actual mirrors. This is an authored sky, not a stock environment.
sky=bpy.data.materials.new('Eclipse hour');sky.use_nodes=True;N=sky.node_tree.nodes;L=sky.node_tree.links;N.clear()
out=N.new('ShaderNodeOutputMaterial');em=N.new('ShaderNodeEmission');co=N.new('ShaderNodeTexCoord');sep=N.new('ShaderNodeSeparateXYZ');grad=N.new('ShaderNodeValToRGB')
for node in [grad]:
 node.color_ramp.elements[0].position=0;node.color_ramp.elements[0].color=(.62,.22,.077,1)
 node.color_ramp.elements[1].position=1;node.color_ramp.elements[1].color=(.005,.013,.029,1)
 for at,col in [(.16,(.40,.195,.103,1)),(.33,(.088,.134,.154,1)),(.61,(.018,.044,.063,1))]:node.color_ramp.elements.new(at).color=col
L.new(co.outputs['Generated'],sep.inputs['Vector']);L.new(sep.outputs['Z'],grad.inputs['Fac']);L.new(grad.outputs['Color'],em.inputs['Color']);em.inputs['Strength'].default_value=1.05;L.new(em.outputs[0],out.inputs['Surface'])
cube('Atmospheric cyclorama',(0,52,18),(200,.35,50),sky)
star=mat('Ionized starlight',(.64,.80,.86),0,.5,0,1.8);sv=[];sf=[]
for i in range(420):
 sx=random.uniform(-60,60);sz=random.uniform(8,42);sr=random.choice([.009,.011,.014,.021,.034]);base=len(sv);sv.extend([(sx-sr,50,sz-sr*.65),(sx+sr,50,sz-sr*.65),(sx,50,sz+sr)]);sf.append((base,base+1,base+2))
mesh_obj('Scattered stars',sv,sf,star)
# Inner reveal chisels and illuminated copper survey strips.
for side in [-1,1]:
 for j in range(10):
  y=-8.7+j*1.85
  for jj in range(3):
   z=.94+jj*.22;cube('Chiselled lower reveal',(side*7.03,y,z),(.10,.88,.055),bronze if jj==1 else deep,.008)
  if j%3==0: cube('Relay signature lamp',(side*6.62,y,.42),(.26,.33,.065),amber,.018)
for k in range(7):
 y=-9.5+k*2.35
 for side in [-1,1]:
  x=side*5.2;beam('Survey run inlet',(x,y,.039),(x+side*.62,y+.51,.039),.014,bronze)
world((.10,.16,.202),.28)
area('Warm slit above the gallery',(-5.6,2.7,12),(0,3.3,.2),4450,(1,.55,.20),4.5)
area('Cold vault fill',(3,-5,7),(-.6,4,.9),1250,(.24,.64,.85),5)
area('Gate key',(1.5,6.7,6.1),(0,9.6,2.5),1100,(1,.74,.41),2.3)
for x,y in [(-2.60,-2),(-2.60,4.1),(5.5,4.1)]:
 area('Carrier spill',(x,y,1.7),(x,y+.25,0),76,(.06,1,.80),1.0)
bpy.ops.object.light_add(type='SUN',location=(-7,-2,12));lamp=bpy.context.object;lamp.rotation_euler=(math.radians(39),math.radians(-38),math.radians(-36));lamp.data.energy=2.1;lamp.data.angle=.11;lamp.data.color=(1,.70,.41)
heroCam=camera((3.10,-10.60,2.27),(-.75,6.4,3.32),27)
heroCam.data.sensor_width=36
S.render.resolution_x=1440;S.render.resolution_y=900
bpy.ops.wm.save_as_mainfile(filepath=str(OUT/'Sable-Relay-Optical-Vault.blend'),compress=True)
hero_secs=render('vault.jpg',1440 if FINAL else 760,900 if FINAL else 475,'JPEG')
print('SABLE_BUILD',json.dumps(dict(backend=DEVICE,blender=bpy.app.version_string,samples=S.cycles.samples,seal_seconds=seal_secs,hero_seconds=hero_secs,object_count=len(S.objects),seal_objects=len(seal_objs))),flush=True)
