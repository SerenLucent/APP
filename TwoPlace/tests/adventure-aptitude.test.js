import test from 'node:test';
import assert from 'node:assert/strict';
import {basicGaugeGain,gainBasicGauge} from '../src/adventure-model.js';
import {characterStats,rollAttack} from '../shared/adventure-progression.js';
test('maximum aptitude fills basic gauge in five successful attacks, retaining fractional gains',()=>{
 const p={gauge:0},stats=characterStats('momo',{dexterity:100});
 for(let i=0;i<5;i++){const hit=rollAttack('momo',{dexterity:100},()=>.99);gainBasicGauge(p,true,basicGaugeGain(hit.base,stats.minAttack,stats.maxAttack,stats.dexterity));assert.equal(p.gauge,(i+1)*20);}
 assert.equal(basicGaugeGain(20,10,20,1),10.1);
 gainBasicGauge(p,false,20);assert.equal(p.gauge,100);
});
test('luck grants 0.7 percentage points per investment for both characters',()=>{
 assert.ok(Math.abs(characterStats('momo',{luck:1}).critical-.107)<1e-9);
 assert.ok(Math.abs(characterStats('momo',{luck:100}).critical-.8)<1e-9);
 assert.ok(Math.abs(characterStats('kuki',{luck:100}).critical-.75)<1e-9);
});
