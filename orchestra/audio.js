/* Chamber score renderer. All excitation, resonances and space are generated locally. */
(() => {
  'use strict';
  const G = globalThis, clamp = (x, lo, hi) => Math.min(hi, Math.max(lo, x));
  const hz = p => 440 * 2 ** ((p - 69) / 12);
  const finite = (x, fallback) => Number.isFinite(+x) ? +x : fallback;
  const BANK = {
    violin:   {pan:-.56, amp:.28, atk:.061, rel:.105, vib:14, speed:5.9, noise:.022, color:2900, strings:1, body:[480,1200,2750]},
    viola:    {pan:-.20, amp:.26, atk:.080, rel:.130, vib:12, speed:5.3, noise:.029, color:2220, strings:1, body:[370,860,2170]},
    cello:    {pan: .42, amp:.37, atk:.088, rel:.165, vib:10, speed:4.9, noise:.032, color:1650, strings:1, body:[235,640,1580]},
    flute:    {pan:-.30, amp:.31, atk:.055, rel:.095, vib: 9, speed:5.4, noise:.045, color:4800},
    clarinet: {pan: .16, amp:.30, atk:.052, rel:.080, vib: 3, speed:4.7, noise:.013, color:2500},
    horn:     {pan: .55, amp:.32, atk:.109, rel:.180, vib: 4, speed:4.3, noise:.015, color:1400},
    timpani:  {pan: .05, amp:.57, atk:.004, rel:.360, vib: 0, speed:0,   noise:.10,  color: 810}
  };
  function rng(seed) {
    let s = seed >>> 0;
    return () => ((s = (Math.imul(1664525, s) + 1013904223) >>> 0) / 4294967296);
  }
  function colorWave(ctx, assets, name, p) {
    const bucket = Math.round(p / 4), key = name + ':' + bucket;
    if (assets.waves.has(key)) return assets.waves.get(key);
    const re = new Float32Array(41), im = new Float32Array(41);
    const spec = BANK[name], f = hz(bucket*4);
    for (let h=1; h<im.length && f*h < ctx.sampleRate*.46; h++) {
      let a;
      if (spec.strings) {
        // Broad body modes and bridge hill depend on absolute frequency, not note number.
        const peak = (at,w) => Math.exp(-.5*(Math.log(h*f/at)/w)**2);
        a = (0.68 + .82*peak(spec.body[0],.31) + .65*peak(spec.body[1],.32) + 1.8*peak(spec.body[2],.25))
          * (.75+.25*Math.abs(Math.sin(h*.83))) / h**1.06;
      } else if (name==='clarinet') {
        a = (h%2 ? 1 : .075 + .15*clamp((p-55)/24,0,1)) / h**1.18;
      } else if (name==='flute') {
        a = ([0,1,.19,.105,.036,.015,.008][h] || .008/h) * (h>1 ? .84+clamp((p-58)/42,0,.65) : 1);
      } else { // Conical brass; mellow at low dynamics, an open midrange with more pressure.
        a = Math.exp(-h*.13) * (.8 + .85*Math.exp(-.5*((h*f-880)/470)**2)) / h**.82;
      }
      const ph = spec.strings ? .45*Math.sin(h*2.12) : .16*Math.sin(h*1.4);
      re[h] = Math.sin(ph)*a; im[h] = Math.cos(ph)*a;
    }
    const w = ctx.createPeriodicWave(re, im); assets.waves.set(key, w); return w;
  }
  const assetsByContext = new WeakMap();
  function getAssets(ctx) {
    if (assetsByContext.has(ctx)) return assetsByContext.get(ctx);
    const rand = rng(0x1caa2);
    const noise = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const n = noise.getChannelData(0);
    for (let i=0;i<n.length;i++) n[i]=rand()*2-1;
    const ir = ctx.createBuffer(2,Math.ceil(ctx.sampleRate*1.16),ctx.sampleRate);
    for (let c=0;c<2;c++) {
      const out=ir.getChannelData(c); let prev=0;
      for(let i=0;i<out.length;i++) {
        const t=i/ctx.sampleRate;
        prev=.52*prev+.48*(rand()*2-1);
        if(t>.031) out[i]=prev*Math.exp(-6.5*t)*Math.min(1,(t-.031)*29)*.46;
      }
      [.014,.023,.036,.049,.071,.092].forEach((t,j)=>{
        out[Math.round((t+c*.0019*(1+j%2))*ctx.sampleRate)]+=(j%2?-1:1)*(.82-j*.1);
      });
    }
    const a={noise,ir,waves:new Map()}; assetsByContext.set(ctx,a); return a;
  }
  const gain = (ctx,value) => {const n=ctx.createGain(); n.gain.value=value; return n;};
  class Chamber {
    constructor(ctx, muted) {
      this.ctx=ctx; this.assets=getAssets(ctx); this.nodes=[]; this.voices=[]; this.buses=new Map();
      const own=n=>(this.nodes.push(n),n);
      const sum=own(gain(ctx,1)), wet=own(gain(ctx,.25)), verb=own(ctx.createConvolver());
      this.out=own(gain(ctx,.85));
      const comp=own(ctx.createDynamicsCompressor()); comp.threshold.value=-14; comp.knee.value=12;
      comp.ratio.value=3; comp.attack.value=.011; comp.release.value=.18;
      const rumble=own(ctx.createBiquadFilter()); rumble.type='highpass'; rumble.frequency.value=30; rumble.Q.value=.6;
      verb.buffer=this.assets.ir; verb.connect(wet); wet.connect(sum); sum.connect(rumble); rumble.connect(comp);
      comp.connect(this.out); this.out.connect(ctx.destination);
      for(const [part,s] of Object.entries(BANK)) {
        const level=own(gain(ctx,muted.has(part)?0:1)), pan=ctx.createStereoPanner ? own(ctx.createStereoPanner()) : own(gain(ctx,1));
        if(pan.pan) pan.pan.value=s.pan;
        level.connect(pan); pan.connect(sum); pan.connect(verb); this.buses.set(part,level);
      }
    }
    mute(muted) {
      const now=this.ctx.currentTime;
      for(const [part,bus] of this.buses) {bus.gain.cancelScheduledValues(now);bus.gain.setTargetAtTime(muted.has(part)?0:1,now,.009);}
    }
    note(e,start,length,catchup=false) {
      const s=BANK[e.part], c=this.ctx;
      if (!s || length<.014 || e.v<=0) return;
      this.voices=this.voices.filter(x=>x.end>start);
      const seed=(Math.round(e.t*991)+Math.round(e.p*373)+e.part.charCodeAt(0)*857)>>>0;
      const rnd=rng(seed), vel=clamp(e.v,0,1), f=hz(e.p), isDrum=e.part==='timpani';
      const st=start + (catchup?0:rnd()*.008);
      let dur=Math.max(.016,length*(isDrum?1:.965));
      if(isDrum) dur=Math.min(dur+.24,2.2);
      const rel=isDrum?s.rel:Math.min(s.rel*(.85+vel*.24),.19);
      const end=st+dur+rel;
      if(this.voices.length>=28){
        const victim=this.voices.reduce((a,b)=>a.end<b.end?a:b);
        victim.kill.gain.setTargetAtTime(0,st,.006);
        victim.sources.forEach(x=>{try{x.stop(st+.036)}catch{}});
        this.voices=this.voices.filter(x=>x!==victim);
      }
      const nodes=[],src=[];
      const own=n=>(nodes.push(n),n), source=n=>(src.push(n),own(n));
      const env=own(gain(c,0)), kill=own(gain(c,1)); env.connect(kill); kill.connect(this.buses.get(e.part));
      const v0=s.amp * vel**.90 * (.975+rnd()*.05);
      if(isDrum) {
        env.gain.setValueAtTime(0,st); env.gain.linearRampToValueAtTime(v0,st+.004);
        env.gain.exponentialRampToValueAtTime(Math.max(.00007,v0*.26),st+Math.min(.16,dur*.65));
        env.gain.exponentialRampToValueAtTime(.00004,end);
        [[1,1],[1.5,.43],[2.02,.25],[2.46,.16],[2.93,.10]].forEach(([ratio,a],i)=>{
          const osc=source(c.createOscillator()), g=own(gain(c,0));
          osc.frequency.setValueAtTime(f*ratio*(1.035+i*.004),st);
          osc.frequency.exponentialRampToValueAtTime(f*ratio,st+.081);
          g.gain.setValueAtTime(a,st);g.gain.exponentialRampToValueAtTime(Math.max(.0001,a/(1+i*2)),end);
          osc.connect(g);g.connect(env);osc.start(st);osc.stop(end+.01);
        });
      } else {
        const attack=Math.min(catchup?.019:s.atk*(1.25-.53*vel)*(.89+rnd()*.20),dur*.30);
        const peak=st+attack, hold=st+dur*.71;
        env.gain.setValueAtTime(0,st);env.gain.linearRampToValueAtTime(v0*.92,peak);
        env.gain.linearRampToValueAtTime(v0,hold);env.gain.linearRampToValueAtTime(v0*.88,st+dur);
        env.gain.exponentialRampToValueAtTime(.000035,end);
        const lp=own(c.createBiquadFilter());lp.type='lowpass';lp.Q.value=.56;
        const open=clamp(s.color*(.76+vel*.79)+f*1.8,450,c.sampleRate*.44);
        lp.frequency.setValueAtTime(open*(e.part==='horn'?.38:.70),st);
        lp.frequency.exponentialRampToValueAtTime(open,peak+.012);
        lp.frequency.exponentialRampToValueAtTime(open*.81,end);
        lp.connect(env);
        const vibr=source(c.createOscillator()), depth=own(gain(c,0));
        vibr.frequency.value=s.speed*(.93+rnd()*.13);vibr.connect(depth);
        depth.gain.setValueAtTime(0,st);
        depth.gain.linearRampToValueAtTime(s.vib*(.7+.3*vel),st+Math.min(.26,dur*.74));
        vibr.start(st);vibr.stop(end+.01);
        const wave=colorWave(c,this.assets,e.part,e.p);
        (s.strings?[[1,-2.8],[.36,4.3]]:[[1,0]]).forEach(([a,detune],i)=>{
          const osc=source(c.createOscillator()), g=own(gain(c,a));
          osc.setPeriodicWave(wave);osc.frequency.value=f;depth.connect(osc.detune);
          osc.detune.setValueAtTime(detune+(catchup?0:(rnd()-.66)*(e.part==='horn'?24:10)),st);
          osc.detune.linearRampToValueAtTime(detune,st+Math.min(.086,dur*.47));
          osc.connect(g);g.connect(lp);osc.start(st+i*.003);osc.stop(end+.01);
        });
      }
      const breath=source(c.createBufferSource()), band=own(c.createBiquadFilter()), rasp=own(gain(c,0));
      breath.buffer=this.assets.noise;breath.loop=true;
      band.type='bandpass';band.frequency.value=s.color*(.83+rnd()*.32);band.Q.value=isDrum?.65:1.12;
      rasp.gain.setValueAtTime(s.noise*(catchup?.30:1.7),st);
      rasp.gain.exponentialRampToValueAtTime(Math.max(.0001,s.noise*(isDrum?.025:.27)),st+Math.min(.105,dur*.86));
      breath.connect(band);band.connect(rasp);rasp.connect(env);
      breath.start(st,rnd()*.77);breath.stop(end+.015);
      const voice={end,kill,sources:src};this.voices.push(voice);
      breath.onended=()=>{nodes.forEach(n=>{try{n.disconnect()}catch{}}); const i=this.voices.indexOf(voice);if(i>=0)this.voices.splice(i,1);};
    }
    retire() {
      const t=this.ctx.currentTime; this.out.gain.cancelScheduledValues(t);this.out.gain.setTargetAtTime(0,t,.007);
      this.voices.forEach(v=>v.sources.forEach(n=>{try{n.stop(t+.048)}catch{}}));
      setTimeout(()=>this.nodes.forEach(n=>{try{n.disconnect()}catch{}}),90);
    }
  }
  function readStage(s) {
    if(!s || !Array.isArray(s.events)) throw new Error('No playable score is loaded.');
    const events=s.events.filter(e=>e && Object.hasOwn(BANK,e.part) && Number.isFinite(+e.t) && Number.isFinite(+e.p) && +e.d>0)
      .map(e=>({part:e.part,p:clamp(+e.p,0,127),t:Math.max(0,+e.t),d:clamp(+e.d,.01,512),v:clamp(finite(e.v,.7),0,1)})).sort((a,b)=>a.t-b.t);
    const end=finite(s.bars,0)*finite(s.beatsPerBar,4);
    return {events,bpm:clamp(finite(s.bpm,104),20,320),end:end>0?end:Math.max(1,events.reduce((m,e)=>Math.max(m,e.t+e.d),0))};
  }
  class ScoreAudio {
    constructor({onTick=()=>{},onEnd=()=>{},onState=()=>{}}={}) {
      this.onTick=onTick;this.onEnd=onEnd;this.onState=onState;this.state='stopped';this.rate=1;this.beat=0;
      this.muted=new Set();this.epoch=0;this.disposed=false;this._hide=()=>this.stop();
      G.addEventListener?.('pagehide',this._hide);
    }
    _state(s) {if(this.state!==s){this.state=s;this.onState(s);}}
    _clear(){clearInterval(this.timer);this.timer=null;if(this.rack){this.rack.retire();this.rack=null;}}
    getBeat() {
      return this.state==='playing'&&this.ctx?clamp(this.beat+(this.ctx.currentTime-this.anchor)/this.spb,this.beat,this.score.end):this.beat;
    }
    async play(stage,fromBeat=0) {
      if(this.disposed) throw new Error('This audio player is closed.');
      const score=readStage(stage), seq=++this.epoch;
      this._clear();this.score=score;this.beat=clamp(finite(fromBeat,0),0,score.end);
      if(this.state==='playing') this._state('paused');
      try{
        const AC=G.AudioContext||G.webkitAudioContext;
        if(!AC) throw new Error('Web Audio is unavailable in this browser.');
        if(!this.ctx || this.ctx.state==='closed') this.ctx=new AC({latencyHint:'interactive'});
        // Only play() creates/resumes a live context. Call it directly from a button gesture.
        if(this.ctx.state!=='running') await this.ctx.resume();
        if(seq!==this.epoch) return;
        if(this.ctx.state!=='running') throw new Error('Tap Play again to enable sound.');
        this._start(this.beat);
      }catch(err){if(seq===this.epoch){this._clear();this._state('stopped');}throw err;}
    }
    _start(beat) {
      this._clear();this.beat=clamp(beat,0,this.score.end);this.spb=60/(this.score.bpm*this.rate);
      this.rack=new Chamber(this.ctx,this.muted);this.anchor=this.ctx.currentTime+.021;
      this.cursor=0;
      const es=this.score.events;
      while(this.cursor<es.length && es[this.cursor].t<this.beat-.00001){
        const e=es[this.cursor++], remaining=Math.min(this.score.end,e.t+e.d)-this.beat;
        if(remaining>0 && (e.part!=='timpani' || this.beat-e.t<.12)) this.rack.note(e,this.anchor,remaining*this.spb,true);
      }
      this._state('playing');this.timer=setInterval(()=>this._pump(),30);this._pump();
    }
    _pump(){
      if(this.state!=='playing') return;
      const now=this.ctx.currentTime, es=this.score.events, horizon=now+.155;
      const b=this.getBeat();
      while(this.cursor<es.length) {
        const e=es[this.cursor], t=this.anchor+(e.t-this.beat)*this.spb;
        if(t>horizon) break;
        ++this.cursor;
        const onset=Math.max(t,now+.001), len=Math.min(e.d,this.score.end-e.t)*this.spb-Math.max(0,onset-t);
        if(len>.013) this.rack.note(e,onset,len,onset-t>.03);
      }
      this.onTick(b);
      if(b>=this.score.end){
        this.beat=this.score.end;clearInterval(this.timer);this.timer=null;
        this._state('ended');this.onEnd();
      }
    }
    pause(){++this.epoch;if(this.state==='playing') this.beat=this.getBeat();this._clear();this._state('paused');this.onTick(this.beat);}
    seek(beat){if(!this.score) return;const b=clamp(finite(beat,0),0,this.score.end);
      if(this.state==='playing') this._start(b);else{this.beat=b;this.onTick(b);}
    }
    setMuted(ids){this.muted=new Set(ids||[]);this.rack?.mute(this.muted);}
    setRate(rate){const b=this.getBeat();this.rate=clamp(finite(rate,1),.6,1.5);if(this.state==='playing')this._start(b);}
    stop(){++this.epoch;this._clear();this.beat=0;this._state('stopped');this.onTick(0);}
    dispose(){this.stop();this.disposed=true;G.removeEventListener?.('pagehide',this._hide);
      if(this.ctx&&this.ctx.state!=='closed')this.ctx.close().catch(()=>{});}
    static async renderExcerpt(stage,{fromBeat=0,beats=16,sampleRate=44100,muted=[],rate=1}={}){
      const score=readStage(stage), from=clamp(finite(fromBeat,0),0,score.end), to=Math.min(score.end,from+clamp(finite(beats,16),.05,512));
      const spb=60/(score.bpm*clamp(finite(rate,1),.6,1.5)), sr=Math.round(clamp(finite(sampleRate,44100),12000,96000));
      const AC=G.OfflineAudioContext||G.webkitOfflineAudioContext;if(!AC) throw new Error('Offline audio rendering is not available.');
      const c=new AC(2,Math.ceil(((to-from)*spb+1.45)*sr),sr), rack=new Chamber(c,new Set(muted));
      score.events.forEach(e=>{
        const a=Math.max(from,e.t),b=Math.min(to,e.t+e.d);
        if(b>a && (e.part!=='timpani'||from-e.t<.12))rack.note(e,.018+(a-from)*spb,(b-a)*spb,e.t<from);
      });
      return c.startRendering();
    }
  }
  G.ScoreAudio=ScoreAudio;
})();
