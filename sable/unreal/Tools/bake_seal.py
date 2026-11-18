"""Bake the project's self-authored Blender GLB into five material batches. No dependencies.
This intentionally supports the local export's flat, indexed static meshes, not arbitrary glTF.
python Tools/bake_seal.py ../assets/seal.glb Content/Relay/seal.srm
"""
import hashlib, json, math, struct, sys
from pathlib import Path

def bake(source):
    raw=source.read_bytes()
    magic,ver,n,js,_=struct.unpack_from('<4s4I',raw)
    assert magic==b'glTF' and ver==2 and n==len(raw)
    data=json.loads(raw[20:20+js]); blen,btyp=struct.unpack_from('<II',raw,20+js)
    binary=raw[28+js:28+js+blen]
    def read(index):
        a=data['accessors'][index]; view=data['bufferViews'][a['bufferView']]
        scalar={5123:'H',5125:'I',5126:'f'}[a['componentType']]
        count={'VEC3':3,'SCALAR':1}[a['type']]; form=struct.Struct('<'+str(count)+scalar)
        offset=view.get('byteOffset',0)+a.get('byteOffset',0); stride=view.get('byteStride',form.size)
        return [form.unpack_from(binary,offset+i*stride) for i in range(a['count'])]
    def cross(a,b): return (a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0])
    def turn(v,q):
        r=q[:3]; k=cross(r,v); h=cross(r,k)
        return [v[i]+2*(q[3]*k[i]+h[i]) for i in range(3)]
    names=['Patinated iron','Brushed auric brass','Sunlit brass','Ceramic edge','Cold basalt shadow']
    sections=[([],[]) for _ in names]
    for node in data['nodes']:
        assert 'children' not in node and 'matrix' not in node and list(node.get('scale',[1,1,1]))==[1,1,1]
        tr=node.get('translation',(0,0,0)); rot=node.get('rotation',(0,0,0,1))
        for p in data['meshes'][node['mesh']]['primitives']:
            assert p.get('mode',4)==4
            vertices,indices=sections[names.index(data['materials'][p['material']]['name'])]
            points,normals=read(p['attributes']['POSITION']),read(p['attributes']['NORMAL'])
            assert len(points)==len(normals)
            base=len(vertices)
            for v,norm in zip(points,normals):
                x,y,z=[a+b for a,b in zip(turn(v,rot),tr)]
                nx,ny,nz=turn(norm,rot)
                coords=[-z,x,y]; normals=[-nz,nx,ny]
                assert max(abs(a) for a in coords)<1.05 and .98<math.sqrt(sum(v*v for v in normals))<1.02
                vertices.append(struct.pack('<6h',*[round(v*30000) for v in coords+normals]))
            indices.extend(base+i for i, in read(p['indices']))
    out=bytearray(b'SRM1')+struct.pack('<I',len(sections))
    total=0
    for vs,tris in sections:
        assert vs and max(tris)<len(vs)<65536 and len(tris)%3==0
        out.extend(struct.pack('<II',len(vs),len(tris))+b''.join(vs)+struct.pack('<%dH'%len(tris),*tris))
        total+=len(tris)//3
    return out,dict(source_sha256=hashlib.sha256(raw).hexdigest(),node_count=len(data['nodes']),
                    triangles=total,sections=len(sections),bytes=len(out),packed_sha256=hashlib.sha256(out).hexdigest())
if __name__=='__main__':
    source,destination=map(Path,sys.argv[1:3]); content,stats=bake(source)
    destination.write_bytes(content)
    print(json.dumps(stats,indent=2))
