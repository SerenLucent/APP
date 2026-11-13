import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';
import {createGameMusic,MAP_MUSIC,shouldPauseGameMusic} from '../src/adventure-music.js';
const flush=()=>new Promise(setImmediate);
function setup(mode,blocked=false){let starts=0;const audio={paused:true,currentTime:0,load(){},pause(){this.paused=true;},play(){starts++;if(blocked)return Promise.reject(Error('NotAllowedError'));this.paused=false;return Promise.resolve();}};return {audio,music:createGameMusic({base:'/APP/TwoPlace/',mode,audioFactory:()=>audio}),starts:()=>starts,allow:()=>blocked=false};}
test('each map uses its named MP3, including the supplied defence spelling, and loops at background volume',()=>{
 for(const [mode,file] of Object.entries(MAP_MUSIC)){assert.ok(fs.statSync('public/audio/'+file).size>0);const h=setup(mode);assert.equal(h.audio.src,'/APP/TwoPlace/audio/'+file);assert.equal(h.audio.loop,true);assert.equal(h.audio.preload,'auto');assert.equal(h.starts(),0);}
});
test('music starts only after loading and follows pause, mute and page exit without restarting on ordinary touches',async()=>{
 const h=setup('explore');h.music.unlock();assert.equal(h.starts(),0);h.music.setReady(true);await flush();assert.equal(h.starts(),1);h.music.unlock();assert.equal(h.starts(),1);h.music.setPaused(true);assert.equal(h.audio.paused,true);h.music.setPaused(false);await flush();assert.equal(h.starts(),2);h.music.setMuted(true);assert.equal(h.audio.paused,true);h.music.unlock();assert.equal(h.starts(),2);h.music.setMuted(false);await flush();assert.equal(h.starts(),3);h.music.stop();h.music.unlock();assert.equal(h.starts(),3);
});
test('blocked autoplay is harmless and retries on the next user gesture',async()=>{
 const h=setup('defense',true);h.music.setReady(true);await flush();assert.equal(h.starts(),1);h.allow();h.music.unlock();await flush();assert.equal(h.starts(),2);assert.equal(h.audio.paused,false);
});

test('clear and roulette keep music playing until leaving, while loading, normal pause and hidden pages stay silent',()=>{
 assert.equal(shouldPauseGameMusic({paused:true,won:true}),false);assert.equal(shouldPauseGameMusic({paused:true,won:false}),true);assert.equal(shouldPauseGameMusic({paused:true,won:true,hidden:true}),true);assert.equal(shouldPauseGameMusic({won:true,loading:true}),true);assert.equal(shouldPauseGameMusic({loadError:true}),true);
});
