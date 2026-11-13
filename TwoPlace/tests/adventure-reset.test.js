import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPetHome,changePetHome} from '../server/pets.js';
import {initialAdventure,adventureLevel} from '../shared/adventure-progression.js';
function fixture(){let home=initialPetHome();home.adventure=initialAdventure();home.adventure.stardust=10000;let n=0;return {get home(){return home;},act(type,body={},id){home=changePetHome(home,{type,...body,actionId:id||'reset-test-operation-'+(++n),version:home.version},1000,()=>'',{role:'owner'});}};}
test('stat and skill resets refund only their own investment and charge 500 each, once',()=>{
 const f=fixture();f.act('adventureInvestStardustBatch',{allocations:{momo:{strength:10},kuki:{vitality:1}}});
 f.act('adventureSkillInvestStardustBatch',{allocations:{momo:{ultimate:2}}});
 const before=f.home.adventure.stardust;
 f.act('adventureReset',{pet:'momo',kind:'stats'},'reset-stat-operation-00001');
 assert.equal(f.home.adventure.stardust,before+2000-500);assert.equal(f.home.adventure.stats.momo.strength,0);assert.equal(f.home.adventure.skills.momo.ultimate,3);assert.equal(f.home.adventure.stats.kuki.vitality,1);assert.equal(f.home.adventure.statInvestment.momo,1200);
 const saved=f.home.adventure.stardust;f.act('adventureReset',{pet:'momo',kind:'stats'},'reset-stat-operation-00001');assert.equal(f.home.adventure.stardust,saved);
 f.act('adventureReset',{pet:'momo',kind:'skills'});assert.equal(f.home.adventure.stardust,saved+1200-500);assert.equal(f.home.adventure.skills.momo.ultimate,1);assert.equal(adventureLevel(f.home.adventure.stats.momo,f.home.adventure.statInvestment.momo).level,1);
});
test('reset requires the fee before refund and rejects invalid or empty resets without charging',()=>{
 const f=fixture();assert.throws(()=>f.act('adventureReset',{pet:'momo',kind:'stats'}),/초기화할/);assert.equal(f.home.adventure.stardust,10000);
 assert.throws(()=>f.act('adventureReset',{pet:'momo',kind:'both'}),/항목/);
 f.act('adventureInvestStardustBatch',{allocations:{momo:{strength:30}}});assert.equal(f.home.adventure.stardust,1000);
 f.act('adventurePurchase',{product:'hpPotion',quantity:120});assert.equal(f.home.adventure.stardust,400);
 assert.throws(()=>f.act('adventureReset',{pet:'momo',kind:'stats'}),/500/);assert.equal(f.home.adventure.stats.momo.strength,30);assert.equal(f.home.adventure.stardust,400);
});
