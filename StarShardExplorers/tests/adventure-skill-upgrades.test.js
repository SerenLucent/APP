import test from 'node:test';
import assert from 'node:assert/strict';
import {skillBalance} from '../shared/adventure-skills.js';
import {createHeartMeteor,stepHeartMeteor} from '../src/adventure-heart-meteor.js';
test('upgraded meteor lands fourteen times, keeps half-second cadence and finishes only once',()=>{
 const sequence=createHeartMeteor({x:500,y:500},skillBalance(10).meteorCount),hits=[];
 assert.equal(sequence.impacts.length,14);
 assert.ok(Math.abs(sequence.impacts[13].at-sequence.impacts[0].at-6.5)<1e-9);
 stepHeartMeteor(sequence,20,(_,index,final)=>hits.push({index,final}));
 stepHeartMeteor(sequence,20,()=>assert.fail('duplicate landing'));
 assert.equal(hits.length,14);assert.equal(hits.filter(h=>h.final).length,1);
});
test('tail stun and slam coverage reach their maximum at level ten',()=>{
 assert.equal(skillBalance(1).tailStunChance,.1);assert.equal(skillBalance(10).tailStunChance,1);
 assert.equal(skillBalance(9).tailMultiplier,46);assert.equal(skillBalance(10).tailMultiplier,50);
 assert.equal(skillBalance(1).slamCoverage,.5);assert.equal(skillBalance(10).slamCoverage,1);
});

