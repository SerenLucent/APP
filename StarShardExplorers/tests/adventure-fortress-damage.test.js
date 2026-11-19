import test from 'node:test';import assert from 'node:assert/strict';import {fortressDamageStage} from '../src/adventure-fortress-damage.js';
test('headquarters changes artwork at damage thresholds and collapses only at zero HP',()=>{for(const [hp,stage] of [[10000,1],[7501,1],[7500,2],[5001,2],[5000,3],[2501,3],[2500,3],[1,3],[0,4]])assert.equal(fortressDamageStage({remainingHp:hp,maxHp:10000,complete:hp===0}),stage);assert.equal(fortressDamageStage({complete:true}),4);});

test('a nearly defeated headquarters remains standing until its final hit',()=>{assert.equal(fortressDamageStage({remainingHp:1,maxHp:5000,complete:false}),3);assert.equal(fortressDamageStage({remainingHp:0,maxHp:5000,complete:false}),4);});
