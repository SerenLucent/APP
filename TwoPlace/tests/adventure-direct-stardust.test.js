import test from 'node:test';import assert from 'node:assert/strict';
import {initialPetHome,changePetHome} from '../server/pets.js';
import {initialAdventure,statStardustCost,investAdventureStardust} from '../shared/adventure-progression.js';
test('direct stats use per-stat 200/300 tiers and atomic shared currency across both characters',()=>{
 assert.equal(statStardustCost(0,10),2000);assert.equal(statStardustCost(9,2),500);
 const p=initialAdventure();p.stardust=600;const next=investAdventureStardust(p,{momo:{strength:2},kuki:{stamina:1}});assert.equal(next.stardust,0);assert.equal(next.stats.momo.strength,2);assert.equal(next.stats.kuki.stamina,1);assert.equal(p.stats.momo.strength,0);
 assert.throws(()=>investAdventureStardust(p,{momo:{strength:4}}),/별조각/);assert.throws(()=>investAdventureStardust(p,{momo:{unknown:1}}));
});
test('legacy points convert once, and stat and skill batches debit shards without duplicate charges',()=>{
 let h=initialPetHome();h.adventure=initialAdventure();h.adventure.points=2;h.adventure.skillPoints=3;
 const act=(type,body={},id=type+'-operation-000001')=>{h=changePetHome(h,{type,...body,actionId:id,version:h.version},1000,()=>'',{role:'owner'});return h;};
 act('adventureConvertPoints');assert.equal(h.adventure.stardust,1200);assert.equal(h.adventure.points,0);assert.equal(h.adventure.skillPoints,0);
 act('adventureConvertPoints',{},'repeat-conversion-00001');assert.equal(h.adventure.stardust,1200);
 act('adventureInvestStardustBatch',{allocations:{momo:{strength:1}}});assert.equal(h.adventure.stardust,1000);
 act('adventureInvestStardustBatch',{allocations:{momo:{strength:1}}});assert.equal(h.adventure.stardust,1000);
 act('adventureSkillInvestStardustBatch',{allocations:{momo:{charge:1}}});assert.equal(h.adventure.stardust,520);assert.equal(h.adventure.skills.momo.charge,2);
});
