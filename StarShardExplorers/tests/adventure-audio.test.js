import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createCombatAudio,COMBAT_SOUNDS} from '../src/adventure-audio.js';
import {chargeFocus} from '../src/adventure-charge-art.js';
function setup(){const played=[],stopped=[],sources=[];const context={state:'running',destination:{},resume:async()=>{},decodeAudioData:async value=>value,createGain:()=>({gain:{},connect(){},disconnect(){}}),createBufferSource(){return {connect(){},disconnect(){},start(){sources.push(this);played.push({name:this.buffer.name,loop:this.loop});},stop(){stopped.push(this.buffer.name);}};}};return {played,stopped,sources,audio:createCombatAudio({base:'/game/',contextFactory:()=>context,fetchFile:async url=>({ok:true,arrayBuffer:async()=>({name:url.split('/').at(-1).replace('.mp3','')})})})};}
const flush=()=>new Promise(setImmediate);
test('all supplied MP3 files exist and spin hits cycle 1,2,3,4 only when connected',async()=>{
 for(const name of COMBAT_SOUNDS)assert.ok(fs.statSync('public/audio/'+name+'.mp3').size>0);
 const {audio,played}=setup();await audio.preload();audio.spinHit(false);for(let i=0;i<6;i++)audio.spinHit(true);await flush();assert.deepEqual(played.map(p=>p.name),['momo_charge1','momo_charge2','momo_charge3','momo_charge4','momo_charge1','momo_charge2']);
});
test('charging plays once without looping, cancellation stops it, and pause/mute suppress queued sounds',async()=>{
 const {audio,played,stopped}=setup();await audio.preload();audio.charge(true);audio.charge(true);await flush();assert.deepEqual(played,[{name:'charge',loop:false}]);audio.charge(false);assert.deepEqual(stopped,['charge']);
 audio.play('hit');audio.stop();await flush();assert.equal(played.length,1);audio.setMuted(true);audio.play('cookie_skill');await flush();assert.equal(played.length,1);audio.setMuted(false);audio.play('cookie_charge');await flush();assert.equal(played.at(-1).name,'cookie_charge');
});
test('charge focus remains at the heart above Momo and follows Kuki tail across five source directions',()=>{
 for(const pose of ['front','side','back','diagonal-front','diagonal-back']){const momo=chargeFocus('momo',pose),kuki=chargeFocus('kuki',pose);assert.ok(momo.y<-95);assert.ok(kuki.y>-50&&kuki.y<-32);assert.ok(Math.abs(kuki.x)<54);}
 assert.ok(chargeFocus('kuki','front').x>40);assert.ok(chargeFocus('kuki','side').x<-35);
});
test('game sound hooks use confirmed basic hits, spin-hit batches and actual ultimate landing functions',()=>{
 const source=fs.readFileSync('src/adventure.js','utf8');assert.match(source,/if\(hit\)combatAudio.basicHit\(\)/);assert.match(source,/spinHit\(connected\)/);assert.match(source,/impactHeartMeteor\(impact,index,final\)\{\s*combatAudio.play\('momo_skill'\)/);assert.match(source,/impactKukiSlam\(origin\)\{\s*combatAudio.play\('cookie_skill'\)/);assert.match(source,/cancelCharge\(\)\{combatAudio.charge\(false\)/);
});

test('a finished charge sound does not restart while held, on another touch, or after unmuting',async()=>{
 const {audio,played,sources}=setup();await audio.preload();audio.charge(true);await flush();sources[0].onended();audio.charge(true);audio.unlock();audio.setMuted(true);audio.setMuted(false);await flush();assert.equal(played.length,1);audio.charge(false);audio.charge(true);await flush();assert.equal(played.length,2);assert.equal(played[1].loop,false);
});

test('basic hit variants are random with no adjacent repeats',async()=>{
 const {audio,played}=setup();await audio.preload();for(let i=0;i<30;i++)audio.basicHit();await flush();assert.equal(played.length,30);assert.ok(played.every(p=>['hit','hit2','hit3'].includes(p.name)));for(let i=1;i<played.length;i++)assert.notEqual(played[i].name,played[i-1].name);
});
