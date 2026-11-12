import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {prepareClearReward,CLEAR_MINIMUM_MS} from '../src/adventure-clear-transition.js';
import {ADVENTURE_REWARDS,rouletteTier} from '../shared/adventure-progression.js';
const tick=()=>new Promise(setImmediate);
const source=fs.readFileSync('src/adventure-progress-view.js','utf8'),start=source.indexOf(' function roulette('),end=source.indexOf('\n refresh();return',start);
class Element{
 constructor(){this.children=new Map();this.open=false;this.style={setProperty(){}};}
 querySelector(selector){if(!this.children.has(selector)){const element=new Element();if(selector==='[data-clear-retry]')element.hidden=true;this.children.set(selector,element);}return this.children.get(selector);}
 addEventListener(){}setAttribute(){}showModal(){this.open=true;}close(){this.open=false;}remove(){this.removed=true;}
}
function screen(){
 const dialogs=[],timers=[],requests=[];let now=0;
 const context=vm.createContext({document:{createElement(){const e=new Element();dialogs.push(e);return e;},body:{append(){}}},pause(){},getState:()=>({active:'momo',playTimeMs:120000}),performance:{now:()=>now},wallet:{local:false,finish(){return new Promise((resolve,reject)=>requests.push({resolve,reject}));}},ADVENTURE_REWARDS,rouletteTier,CLEAR_MINIMUM_MS,prepareClearReward:(fn,ms)=>prepareClearReward(fn,ms,delay=>new Promise(resolve=>timers.push({delay,resolve}))),refresh(){},timeLabel:()=> '2분 00초',});
 vm.runInContext(source.slice(start,end).replaceAll('import.meta.env.BASE_URL',"'/'"),context);context.roulette('run',[]);
 return {clear:dialogs[1],roulette:dialogs[0],timers,requests,time:value=>{now=value;}};
}
const reward={id:'heart3',label:'하트 3개',hearts:3,index:0,segments:['heart3','heart2'],stardust:110};
test('clear immediately shows readable amount and starts network preparation, but waits at least three seconds',async()=>{
 const h=screen();assert.ok(h.clear.innerHTML.includes('별조각 +110 획득'));assert.ok(!h.clear.innerHTML.includes('확인 중'));assert.ok(h.clear.innerHTML.includes('보상 룰렛을 준비 중입니다.'));
 assert.equal(h.clear.open,true);assert.equal(h.roulette.open,false);assert.equal(h.requests.length,1);assert.equal(h.timers[0].delay,3000);
 h.requests[0].resolve(reward);await tick();assert.equal(h.roulette.open,false);
 h.time(3000);h.timers[0].resolve();await tick();assert.equal(h.roulette.open,true);assert.equal(h.clear.open,false);assert.equal(h.roulette.querySelector('.roulette-spin').disabled,false);
});
test('slow server keeps clear visible past three seconds until roulette is ready',async()=>{
 const h=screen();h.time(3000);h.timers[0].resolve();await tick();assert.equal(h.clear.open,true);assert.equal(h.roulette.open,false);
 h.requests[0].resolve(reward);await tick();assert.equal(h.roulette.open,true);assert.equal(h.clear.removed,true);
});
test('save failure stays on clear with retry, and retry does not require another full three-second wait',async()=>{
 const h=screen();h.time(4000);h.timers[0].resolve();h.requests[0].reject(Error('서버 연결 확인'));await tick();
 assert.equal(h.clear.open,true);assert.equal(h.clear.querySelector('[data-clear-retry]').hidden,false);assert.equal(h.roulette.open,false);
 h.clear.querySelector('[data-clear-retry]').onclick();assert.equal(h.timers[1].delay,0);
 h.requests[1].resolve(reward);h.timers[1].resolve();await tick();assert.equal(h.roulette.open,true);
});
