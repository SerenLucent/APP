import test from 'node:test';
import assert from 'node:assert/strict';
import {chargeFillSeconds,skillPlan,CHARGE_DELAY} from '../src/adventure-model.js';
test('aptitude linearly shortens charge filling while startup, full power and SP costs stay unchanged',()=>{
 for(const [dex,fill] of [[0,3],[50,2],[100,1]]){
  assert.equal(chargeFillSeconds(dex),fill);
  for(const id of ['momo','kuki']){
   const start=skillPlan(id,CHARGE_DELAY,100,10,dex);assert.equal(start.ready,false);assert.equal(start.cost,0);
   const half=skillPlan(id,CHARGE_DELAY+fill/2,100,10,dex);assert.equal(half.power,.5);
   const full=skillPlan(id,CHARGE_DELAY+fill,100,10,dex),base=skillPlan(id,3.5,100,10,0);
   assert.equal(full.power,1);assert.equal(full.cost,70);assert.equal(full.damage,base.damage);assert.equal(full.duration,base.duration);
  }
 }
 assert.equal(chargeFillSeconds(200),1);assert.equal(chargeFillSeconds(-10),3);
});
test('fast charge still respects low and empty SP',()=>{
 assert.equal(skillPlan('kuki',1.5,0,1,100).power,1);assert.equal(skillPlan('kuki',1.5,0,1,100).damage,0);
 assert.equal(skillPlan('kuki',1.5,35,1,100).damage,225);
});
