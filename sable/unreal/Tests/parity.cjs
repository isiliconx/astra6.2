// Optional: compare the independent native and web solvers, including every ray endpoint.
// Run from the repo; pass the compiled optics_test executable as argument.
const cp = require('node:child_process'), path = require('node:path');
const fs=require('node:fs'), bundled=path.join(__dirname,'WebReference','game.js');
const web = require(fs.existsSync(bundled)?bundled:'../../game.js'), executable=process.argv[2];
if(!executable) throw Error('Pass the path to the compiled optics test.');
const lines=cp.execFileSync(path.resolve(executable), ['--states'],{encoding:'utf8',maxBuffer:4*1024*1024}).trim().split('\n');
let rays=0;
for(const line of lines){
    const [n,k,bits,count,...xy]=line.split(' ').map(Number), l=web.levels[n];
    const steps=l.mirrors.map((_,i)=>Math.floor(k/8**i)%8);
    const r=web.solve(l,steps), expected=r.lit.reduce((s,b,i)=>s+(b?2**i:0),0);
    if(bits!==expected||count!==r.beams.length) throw Error('receiver/count mismatch: '+n+' '+k);
    for(let i=0;i<count;++i) {
        const b=r.beams[i];
        if(Math.hypot(b.x2-xy[i*2],b.z2-xy[i*2+1])>1e-6) throw Error('endpoint mismatch: '+n+' '+k+' '+i);
        rays++;
    }
}
if(lines.length!==4168) throw Error('State coverage incomplete.');
console.log('PASS -- native/web parity: '+lines.length+' states, '+rays+' endpoints, all receive masks; end-point tolerance 1 micrometre.');
