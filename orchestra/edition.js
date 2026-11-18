/* The published form is a 30-bar Convergence: five studies and a full return. */
(()=>{'use strict';const bars=Object.freeze([2,2,2,4,4,16]);
 function concert(run){let t=0;const events=[],markers=[];run.stages.forEach((stage,i)=>{const n=bars[i]*4;markers.push({beat:t,title:stage.title});for(const e of stage.events){if(e.t>=n)break;const d=Math.min(e.d,n-e.t);if(d>.001)events.push({...e,t:e.t+t,d})}t+=n});return{title:'The complete Convergence',bars:t/4,bpm:run.bpm,beatsPerBar:4,events,markers}}
 function wave(buffer){const ch=Math.min(2,buffer.numberOfChannels),n=buffer.length,rate=buffer.sampleRate,sz=n*ch*2,raw=new ArrayBuffer(44+sz),v=new DataView(raw);function tag(k,s){for(let i=0;i<s.length;i++)v.setUint8(k+i,s.charCodeAt(i))}tag(0,'RIFF');v.setUint32(4,sz+36,true);tag(8,'WAVE');tag(12,'fmt ');v.setUint32(16,16,true);v.setUint16(20,1,true);v.setUint16(22,ch,true);v.setUint32(24,rate,true);v.setUint32(28,rate*ch*2,true);v.setUint16(32,ch*2,true);v.setUint16(34,16,true);tag(36,'data');v.setUint32(40,sz,true);
 const channels=Array.from({length:ch},(_,i)=>buffer.getChannelData(i));for(let i=0,pos=44;i<n;i++)for(let j=0;j<ch;j++,pos+=2){const x=Math.max(-1,Math.min(1,channels[j][i]));v.setInt16(pos,Math.round(x<0?x*32768:x*32767),true)}return raw}
 window.ConvergenceEdition={bars,concert,wave};
})();
