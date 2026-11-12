import {CHARGE_DELAY} from '../src/adventure-model.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {skillPlan,MAX_CHARGE,SPIN_TICK,advanceSpin,recoverPet,skillHits,createObstacles} from '../src/adventure-model.js';
test('charge fills independently of stamina while actual spending remains bounded',()=>{
 for(const id of ['momo','kuki']){const short=skillPlan(id,1.3),long=skillPlan(id,MAX_CHARGE);assert.ok(long.cost>short.cost);assert.ok(long.cost<=100);assert.equal(skillPlan(id,100).power,1);assert.equal(skillPlan(id,CHARGE_DELAY,7).ready,false);for(const sp of [8,20,40,100])assert.ok(skillPlan(id,MAX_CHARGE,sp).cost<=sp+1e-8);}
 assert.ok(skillPlan('momo',2).duration>skillPlan('momo',1.3).duration);assert.ok(skillPlan('kuki',2).damage>skillPlan('kuki',1.3).damage);
});
test('reserve recovers HP and stamina, active only stamina, and defeated pets cannot revive',()=>{const p={hp:70,sp:20};recoverPet(p,2,true);assert.equal(p.hp,71);assert.equal(p.sp,24);recoverPet(p,200,true);assert.deepEqual(p,{hp:100,sp:100});const active={hp:50,sp:50};recoverPet(active,4,false);assert.deepEqual(active,{hp:50,sp:51});const defeated={hp:0,sp:0};recoverPet(defeated,100,true);assert.deepEqual(defeated,{hp:0,sp:0});});
test('spin hits surrounding obstacles and the stage generation is repeatable with different HP targets',()=>{assert.equal(skillHits({x:0,y:0,fx:1,fy:0},{x:-70,y:0,radius:20},'momo'),true);assert.equal(skillHits({x:0,y:0,fx:1,fy:0},{x:300,y:0,radius:20},'momo'),false);assert.deepEqual(createObstacles(),createObstacles());assert.ok(createObstacles().some(o=>o.type==='rock'&&o.hp===200));});

import {gainBasicGauge,spendGauge,eatPowerHeart,powerMultiplier} from '../src/adventure-model.js';
test('only basic hits charge each character, spending is one-time and buffs extend instead of stacking damage',()=>{const m={gauge:0},k={gauge:0,powerTime:0};gainBasicGauge(m,false);assert.equal(m.gauge,0);for(let i=0;i<10;i++)gainBasicGauge(m,true);assert.equal(m.gauge,100);assert.equal(k.gauge,0);gainBasicGauge(m,true);assert.equal(m.gauge,100);assert.equal(spendGauge(m),true);assert.equal(m.gauge,0);assert.equal(spendGauge(m),false);eatPowerHeart(k);assert.equal(k.powerTime,10);assert.equal(powerMultiplier('kuki',k),1.2);for(let i=0;i<20;i++)eatPowerHeart(k);assert.equal(k.powerTime,90);assert.equal(powerMultiplier('kuki',k),1.2);assert.equal(powerMultiplier('momo',k),1);k.powerTime=0;assert.equal(powerMultiplier('kuki',k),1);});

test('half-second startup cannot fire or consume stamina; Kuki has a stronger single hit',()=>{for(const id of ['momo','kuki'])for(const t of [0,.1,.25,.5]){const p=skillPlan(id,t);assert.equal(p.ready,false);assert.equal(p.cost,0);assert.equal(p.power,0);}assert.equal(skillPlan('momo',.51).ready,true);const m=skillPlan('momo',MAX_CHARGE),k=skillPlan('kuki',MAX_CHARGE);assert.equal(m.cost,k.cost);assert.equal(m.duration,3.5);assert.equal(k.damage,450);assert.equal(m.requiredCost,70);assert.ok(k.damage>m.damage);assert.ok(skillPlan('kuki',1.3).damage>skillPlan('kuki',1.1).damage);});

test('empty and low stamina still fill charge; Momo drains over time and stops at zero, Kuki damage scales to actual spending',()=>{for(const id of ['momo','kuki'])for(const sp of [0,5,20,100])assert.equal(skillPlan(id,MAX_CHARGE,sp).power,1);const weak=skillPlan('kuki',MAX_CHARGE,20);assert.equal(weak.cost,20);assert.ok(Math.abs(weak.damage-450*20/70)<1e-8);assert.equal(skillPlan('kuki',MAX_CHARGE,0).damage,0);const a={...skillPlan('momo',MAX_CHARGE,20),t:0},pet={sp:20};assert.equal(a.duration,3.5);assert.ok(Math.abs(a.usableDuration-1)<1e-8);let step=advanceSpin(a,pet,.5);assert.equal(pet.sp,10);assert.equal(step.done,false);step=advanceSpin(a,pet,10);assert.equal(pet.sp,0);assert.equal(step.done,true);assert.ok(Math.abs(a.t-1)<1e-8);const full={...skillPlan('momo',MAX_CHARGE),t:0},rest={sp:100};step=advanceSpin(full,rest,10);assert.equal(rest.sp,30);assert.equal(step.done,true);assert.equal(full.t,3.5);});
import {requestCriticalHitStop,consumeHitStop} from '../src/adventure-model.js';
test('Every critical hitstop freezes 100ms without spending spin time or stamina and retriggers without cooldown',()=>{const state={hitStop:0},pet={sp:50},attack={t:1,duration:5,drainRate:10};requestCriticalHitStop(state,false);assert.equal(state.hitStop,0);requestCriticalHitStop(state,true);requestCriticalHitStop(state,true);assert.equal(state.hitStop,.1);for(let i=0;i<2;i++){const dt=consumeHitStop(state,.04);if(dt>0)advanceSpin(attack,pet,dt);assert.equal(dt,0);}assert.equal(attack.t,1);assert.equal(pet.sp,50);assert.ok(Math.abs(consumeHitStop(state,.04)-.02)<1e-9);assert.equal(state.hitStop,0);requestCriticalHitStop(state,true);assert.equal(state.hitStop,.1);assert.ok(Math.abs(consumeHitStop(state,.15)-.05)<1e-9);});
test('Kuki charge scales to the skill level cap before stamina scaling',()=>{
 const start=skillPlan('kuki',CHARGE_DELAY+.000001),half=skillPlan('kuki',CHARGE_DELAY+1.5),full=skillPlan('kuki',MAX_CHARGE);
 assert.ok(Math.abs(start.damage/15-1)<.0001);
 assert.equal(half.damage/15,15.5);
 assert.equal(full.damage/15,30);
 assert.ok(Math.abs(skillPlan('kuki',MAX_CHARGE,35).damage/15-15)<1e-9);
 assert.equal(skillPlan('kuki',MAX_CHARGE,100,9).multiplier,34);
 assert.equal(skillPlan('kuki',MAX_CHARGE,100,10).multiplier,35);
});
import {skillBalance} from '../src/adventure-skills.js';
test('skill level endpoints and final level bonuses follow the balance plan',()=>{
 assert.equal(MAX_CHARGE,3.5);
 assert.equal(skillPlan('momo',MAX_CHARGE,100,1).duration,3.5);
 assert.equal(skillPlan('momo',MAX_CHARGE,100,10).duration,8);
 for(const id of ['momo','kuki'])for(const level of [1,9,10]){
  const plan=skillPlan(id,MAX_CHARGE,100,level);
  assert.equal(plan.cost,70);
  if(id==='momo'){
   const pet={sp:100},attack={...plan,t:0};
   advanceSpin(attack,pet,10);
   assert.ok(Math.abs(pet.sp-30)<1e-8);
  }
 }
 assert.ok(Math.abs(skillBalance(9).ultimateMultiplier-1.24)<1e-9);
 assert.ok(Math.abs(skillBalance(10).ultimateMultiplier-1.3)<1e-9);
});

test('level-one charge balance targets 450 damage, retains stat scaling and costs 70 SP',()=>{for(const fps of [30,60,120]){const a={...skillPlan('momo',MAX_CHARGE),t:0,tick:0},pet={sp:100};let hits=0;for(let i=0;i<2000;i++){const step=advanceSpin(a,pet,1/fps);a.tick-=step.activeDt;if(step.activeDt>0&&a.tick<=0){hits++;a.tick=.32;}if(step.done)break;}assert.ok(Math.abs(hits*a.damage-450)<1e-7);assert.ok(Math.abs(pet.sp-30)<1e-7);}const full=skillPlan('kuki',MAX_CHARGE);assert.equal(full.damage,450);assert.equal(full.multiplier,30);assert.equal(full.cost,70);});
