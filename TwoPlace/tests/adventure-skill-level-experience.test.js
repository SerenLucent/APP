import test from 'node:test';import assert from 'node:assert/strict';
import {initialPetHome,changePetHome} from '../server/pets.js';
import {initialAdventure,adventureState,adventureLevel} from '../shared/adventure-progression.js';
test('stat and skill spending contribute to the same per-character level once',()=>{
 let h=initialPetHome();h.adventure=initialAdventure();h.adventure.stardust=10000;
 const act=(type,allocations,id)=>h=changePetHome(h,{type,allocations,actionId:id,version:h.version},1000,()=>'',{role:'owner'});
 act('adventureInvestStardustBatch',{momo:{strength:3}},'stat-exp-operation-000001');
 act('adventureSkillInvestStardustBatch',{momo:{charge:1}},'skill-exp-operation-00001');
 assert.equal(h.adventure.statInvestment.momo,1080);assert.equal(adventureLevel(h.adventure.stats.momo,h.adventure.statInvestment.momo).level,2);assert.equal(h.adventure.statInvestment.kuki,0);
 act('adventureSkillInvestStardustBatch',{momo:{charge:1}},'skill-exp-operation-00001');assert.equal(h.adventure.statInvestment.momo,1080);
});
test('existing upgraded skills are counted once when adopting combined investment',()=>{
 const p=initialAdventure();p.statInvestment={momo:2000,kuki:0};p.skills.momo.charge=3;
 const loaded=adventureState(p);assert.equal(loaded.statInvestment.momo,3200);assert.equal(loaded.investmentIncludesSkills,true);
 assert.equal(adventureState(JSON.parse(JSON.stringify(loaded))).statInvestment.momo,3200);
});
