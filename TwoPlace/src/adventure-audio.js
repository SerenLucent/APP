export const COMBAT_SOUNDS=['hit','hit2','hit3','momo_skill_effect','momo_skill','momo_charge_wind','momo_charge1','momo_charge2','momo_charge3','momo_charge4','cookie_skill','cookie_charge','charge'];
export function createCombatAudio({base='/',contextFactory=()=>new (window.AudioContext||window.webkitAudioContext)(),fetchFile=fetch,now=()=>performance.now(),random=Math.random}={}){
 let context,muted=false,charging=false,chargePlayed=false,chargeVoice=null,spinIndex=0,turretIndex=0,turretVoice=null,turretBusy=false,turretPending=false,turretLastHit=-Infinity,turretSerial=0,lastBasic=null,generation=0;const buffers=new Map(),voices=new Set();
 function ctx(){try{return context||(context=contextFactory());}catch{return null;}}
 function load(name){if(!COMBAT_SOUNDS.includes(name))return Promise.resolve(null);if(!buffers.has(name))buffers.set(name,(async()=>{const audio=ctx();if(!audio)return null;const r=await fetchFile(base+'audio/'+name+'.mp3');if(!r.ok)throw Error('audio');return audio.decodeAudioData(await r.arrayBuffer());})().catch(()=>{buffers.delete(name);return null;}));return buffers.get(name);}
 function stop(voice){if(!voice)return;try{voice.source.stop();}catch{}voices.delete(voice);if(chargeVoice===voice)chargeVoice=null;if(turretVoice===voice){turretVoice=null;turretBusy=false;}}
 function start(name,buffer,loop=false,duration=null){const audio=ctx();if(!buffer||muted||audio?.state!=='running')return null;
  if(voices.size>=12)stop(voices.values().next().value);
  const source=audio.createBufferSource(),gain=audio.createGain();source.buffer=buffer;source.loop=loop;if(source.playbackRate)source.playbackRate.value=1;gain.gain.value=name==='charge'?.32:name==='momo_charge_wind'?.65:.7;source.connect(gain);gain.connect(audio.destination);
  const voice={source,gain,name};voices.add(voice);source.onended=()=>{voices.delete(voice);source.disconnect();gain.disconnect();if(chargeVoice===voice)chargeVoice=null;};if(duration){const begin=audio.currentTime||0;if(gain.gain.setValueAtTime&&gain.gain.linearRampToValueAtTime){gain.gain.setValueAtTime(gain.gain.value,begin+Math.max(0,duration-.02));gain.gain.linearRampToValueAtTime(0,begin+duration);}source.start(0,0,duration);}else source.start();return voice;
 }
 function play(name){if(muted)return;const requested=now(),epoch=generation;void load(name).then(buffer=>{if(epoch===generation&&now()-requested<200)start(name,buffer,false);});}
 function charge(enabled){if(enabled&&!charging)chargePlayed=false;charging=enabled;if(!enabled){stop(chargeVoice);chargePlayed=false;return;}if(chargePlayed||chargeVoice||muted)return;void load('charge').then(buffer=>{if(charging&&!chargePlayed&&!chargeVoice&&!muted){chargeVoice=start('charge',buffer,false);if(chargeVoice)chargePlayed=true;}});}
 function playTurretHit(){turretBusy=true;const name='momo_charge'+(turretIndex+1),serial=++turretSerial,epoch=generation;void load(name).then(buffer=>{if(serial!==turretSerial||epoch!==generation||muted)return;const voice=start(name,buffer,false,.19);if(!voice){turretBusy=false;return;}turretVoice=voice;turretIndex=(turretIndex+1)%4;const ended=voice.source.onended;voice.source.onended=()=>{ended();if(turretVoice===voice){turretVoice=null;turretBusy=false;}};});}
 return {
  preload:()=>Promise.all(COMBAT_SOUNDS.map(load)),
  unlock(){const audio=ctx();if(!audio)return;void audio.resume().then(()=>{if(charging)charge(true);}).catch(()=>{});},
  play,charge,
  basicHit(){const choices=['hit','hit2','hit3'].filter(name=>name!==lastBasic);lastBasic=choices[Math.min(choices.length-1,Math.floor(random()*choices.length))];play(lastBasic);},
  turretHit(hit){if(!hit||muted||turretBusy)return;playTurretHit();},
  spinHit(hit){if(!hit)return;play('momo_charge'+(spinIndex+1));spinIndex=(spinIndex+1)%4;},
  setMuted(value){muted=value;if(muted){generation++;turretSerial++;turretBusy=false;turretPending=false;for(const voice of [...voices])stop(voice);}else if(charging)charge(true);},
  reset(){generation++;charging=false;spinIndex=0;turretIndex=0;turretSerial++;turretVoice=null;turretBusy=false;turretPending=false;for(const voice of [...voices])stop(voice);},
  stop(){generation++;turretSerial++;turretBusy=false;turretPending=false;charging=false;for(const voice of [...voices])stop(voice);}
 };
}
