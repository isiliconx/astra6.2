'use strict';
const assert=require('node:assert/strict'),crypto=require('node:crypto'),fs=require('node:fs'),g=require('./model.js'),m=g.build();
// Flood 6-neighbors, not corner or edge adjacency.
const vis=new Uint8Array(m.cells.length),{X,Y,Z}=g;let pieces=0,largest=0;for(let i=0;i<vis.length;i++){if(!m.cells[i]||vis[i])continue;pieces++;let stack=[i],count=0;vis[i]=1;while(stack.length){let j=stack.pop(),x=j%X,y=(j/X|0)%Y,z=j/(X*Y)|0;count++;for(let [a,b,c] of g.axisSteps){if(!m.has(x+a,y+b,z+c))continue;let n=x+a+X*(y+b+Y*(z+c));if(!vis[n]){vis[n]=1;stack.push(n)}}}largest=Math.max(largest,count)}
const buf=Buffer.from(g.stl(m));assert.equal(buf.readUint32LE(80),m.quads.length*2);assert.equal(buf.length,84+100*m.quads.length);
// Independent audit of serialized STL. Exact float coordinate keys, paired edge orientation,
// one cyclic link for every vertex (catches bow ties), signed volume, orthographic masks.
const points=[],index=new Map(),edge=new Map(),links=new Map(),surface=[],projs=g.dims.map(([w,h])=>new Uint8Array(w*h));let volume=0;
const id=p=>{const s=p.join(',');if(!index.has(s)){index.set(s,points.length);points.push(p)}return index.get(s)};
for(let off=84;off<buf.length;off+=50){let p=[0,1,2].map(i=>[0,1,2].map(j=>buf.readFloatLE(off+12+12*i+4*j)));let ids=p.map(id);surface.push(ids);
let [a,b,c]=p;volume+=(a[0]*(b[1]*c[2]-b[2]*c[1])+a[1]*(b[2]*c[0]-b[0]*c[2])+a[2]*(b[0]*c[1]-b[1]*c[0]))/6;
for(let j=0;j<3;j++){let a=ids[j],b=ids[(j+1)%3],c=ids[(j+2)%3],key=Math.min(a,b)+','+Math.max(a,b),e=edge.get(key)||[0,0];e[0]++;e[1]+=a<b?1:-1;edge.set(key,e);if(!links.has(a))links.set(a,[]);links.get(a).push([b,c])}
// Only triangles facing the camera contribute to its projected area. Each is half a unit cell.
for(let k=0;k<3;k++){const n=k===0?0:k===1?1:2,sign=k===0?-1:1;if(buf.readFloatLE(off+4*n)!==sign)continue;const i=k===2?0:2,j=k===1?0:1;let a=Math.floor((p[0][i]+p[1][i]+p[2][i])/(3*g.pitch)),b=Math.floor((p[0][j]+p[1][j]+p[2][j])/(3*g.pitch));projs[k][a+g.dims[k][0]*b]=1}}
let nonManifoldEdges=[...edge.values()].filter(([n,s])=>n!==2||s!==0).length,badVerts=0;
for(let pairs of links.values()){let adj=new Map();for(let [a,b] of pairs){if(!adj.has(a))adj.set(a,[]);if(!adj.has(b))adj.set(b,[]);adj.get(a).push(b);adj.get(b).push(a)}let seen=new Set(),st=[adj.keys().next().value];while(st.length){let n=st.pop();if(seen.has(n))continue;seen.add(n);st.push(...adj.get(n))}if(seen.size!==adj.size||[...adj.values()].some(x=>x.length!==2))badVerts++}
for(let i=0;i<3;i++)assert.deepEqual(projs[i],m.actual[i]);
let report={voxels:m.count,components:pieces,largest,vertices:points.length,triangles:m.quads.length*2,nonManifoldEdges,nonManifoldVertices:badVerts,volumeMM3:+volume.toFixed(3),projectionIoU:m.iou,bytes:buf.length,sha256:crypto.createHash('sha256').update(buf).digest('hex')};console.log(JSON.stringify(report,null,2));
if(process.argv.includes('--write'))fs.writeFileSync(__dirname+'/impossible-alphabet.stl',buf);
assert.equal(pieces,1);assert.equal(nonManifoldEdges,0);assert.equal(badVerts,0);assert.ok(Math.abs(volume-m.count*g.pitch**3)<.04);assert.ok(m.iou.every(v=>v>.98));
const perturbs=g.dims.map((_,k)=>[-5,0,5].map(d=>g.offAxis(m,k,d)));
for(let i=0;i<3;i++){assert.ok(Math.abs(perturbs[i][1]-m.iou[i])<1e-10);assert.ok(perturbs[i][0]>.80&&perturbs[i][2]>.80);assert.ok(perturbs[i][0]<perturbs[i][1]&&perturbs[i][2]<perturbs[i][1])}
assert.deepEqual(buf,fs.readFileSync(__dirname+'/impossible-alphabet.stl'));console.log('STL bytes match checked-in file. [−5°, aligned, +5°] fixed-frame overlap:',perturbs);
const height=[...new Set(points.map(p=>p[2]))].sort((a,b)=>a-b);assert.equal(height.length,X+1);let unsupported=0,bed=0,first=null,last=null;
for(let x=0;x<X;x++)for(let y=0;y<Y;y++)for(let z=0;z<Z;z++)if(m.has(x,y,z)){if(!x)bed++;else if(!m.has(x-1,y,z)){unsupported++;first??=x;last=x}}
assert.equal(bed,576);assert.equal(unsupported,212);console.log('Print orientation: bed area '+(bed*g.pitch*g.pitch).toFixed(2)+' mm². '+unsupported+' cells first appear without a cell directly below in slices '+first+'–'+last+'.');
