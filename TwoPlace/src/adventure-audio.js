export const COMBAT_SOUNDS=['hit','hit2','hit3','momo_skill_effect','momo_skill','momo_charge_wind','momo_charge1','momo_charge2','momo_charge3','momo_charge4','cookie_skill','cookie_charge','charge'];
export function createCombatAudio({base='/',contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)(),fetchFile=fetch,now=()=>performance.now(),random=Math.random}={}){
 let context,muted=false,charging=false,chargePlayed=false,chargeVoice=null,spinIndex=0,lastBasic=null,generation=0;const buffers=new Map(),voices=new Set();
 function ctx(){try{return context||(context=contextFactory());}catch{return null;}}
 function load(name){if(!COMBAT_SOUNDS.includes(name))return Promise.resolve(null);if(!buffers.has(name))buffers.set(name,(async()=>{const audio=ctx();if(!audio)return null;const r=await fetchFile(base+'audio/'+name+'.mp3');if(!r.ok)throw Error('audio');return audio.decodeAudioData(await r.arrayBuffer());})().catch(()=>{buffers.delete(name);return null;}));return buffers.get(name);}
 function stop(voice){if(!voice)return;try{voice.source.stop();}catch{}voices.delete(voice);if(chargeVoice===voice)chargeVoice=null;}
 function start(name,buffer,loop=false){const audio=ctx();if(!buffer||muted||audio?.state!=='running')return null;
  if(voices.size>=12)stop(voices.values().next().value);
  const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;source.loop=loop;gain.gain.value=name==='charge'?.32:name==='momo_charge_wind'?.65:.7;source.connect(gain);gain.connect(audio.destination);
  const voice={source,gain,name};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();if(chargeVoice===voice)chargeVoice=null;};source.start();return voice;
 }
 function play(name){if(muted)return;const requested=now(),epoch=generation;void load(name).then(buffer=>{if(epoch===generation&&now()-requested<200)start(name,buffer);});}
 function charge(enabled){if(enabled&&!charging)chargePlayed=false;charging=enabled;if(!enabled){stop(chargeVoice);chargePlayed=false;return;}if(chargePlayed||chargeVoice||muted)return;void load('charge').then(buffer=>{if(charging&&!chargePlayed&&!chargeVoice&&!muted){chargeVoice=start('charge',buffer,false);if(chargeVoice)chargePlayed=true;}});}
 return {
  preload:()=>Promise.all(COMBAT_SOUNDS.map(load)),
  unlock(){const audio=ctx();if(!audio)return;void audio.resume().then(()=>{if(charging)charge(true);}).catch(()=>{});},
  play,charge,
  basicHit(){const choices=['hit','hit2','hit3'].filter(name=>name!==lastBasic);lastBasic=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];play(lastBasic);},
  spinHit(hit){if(!hit)return;play('momo_charge'+(spinIndex+1));spinIndex=(spinIndex+1)%4;},
  setMuted(value){muted=value;if(muted){generation++;for(const voice of [...voices])stop(voice);}else if(charging)charge(true);},
  reset(){generation++;charging=false;spinIndex=0;for(const voice of [...voices])stop(voice);},
  stop(){generation++;charging=false;for(const voice of [...voices])stop(voice);}
 };
}
