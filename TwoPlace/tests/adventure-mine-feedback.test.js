import test from 'node:test';
import assert from 'node:assert/strict';
import {basicGaugeGain,gainBasicGauge} from '../src/adventure-model.js';
import {createSeededMine,stepMine} from '../src/adventure-mine.js';
import {ultimateEnemyDelta,KUKI_SLAM_IMPACT_TIME} from '../src/adventure-cinematics.js';
import {HEART_LAUNCH_END} from '../src/adventure-heart-meteor.js';
test('basic hit damage bands reward five integer gauge amounts with clamped endpoints',()=>{
 assert.deepEqual([10,12,14,16,18,20].map(n=>basicGaugeGain(n,10,20)),[5,6,8,9,10,10]);
 assert.equal(basicGaugeGain(-10,10,20),5);assert.equal(basicGaugeGain(100,10,20),10);assert.equal(basicGaugeGain(20,20,20),10);
 const m={gauge:98},k={gauge:0};gainBasicGauge(m,true,5);gainBasicGauge(k,false,10);assert.equal(m.gauge,100);assert.equal(k.gauge,0);
});
test('mine pickup feedback fires once and never before a shard can be collected',()=>{
 const m=createSeededMine(42);m.room=0;const d={oreId:m.caves[0].ores[0].id,x:1000,y:1000,age:0,value:1};m.caves[0].drops=[d];let count=0;
 stepMine(m,{x:1000,y:1000},.1,()=>count++);assert.equal(count,0);
 stepMine(m,{x:1000,y:1000},.3,()=>count++);assert.equal(count,1);assert.equal(m.total,1);
 stepMine(m,{x:1000,y:1000},.1,()=>count++);assert.equal(count,1);
});
test('mine clock can exclude the exact frozen part of a skill frame',()=>{
 assert.equal(ultimateEnemyDelta({id:'momo',t:0},.04),0);
 assert.ok(Math.abs(ultimateEnemyDelta({id:'momo',t:HEART_LAUNCH_END-.01},.04)-.03)<1e-9);
 assert.equal(ultimateEnemyDelta({id:'kuki',t:KUKI_SLAM_IMPACT_TIME},.04),.04);
});
