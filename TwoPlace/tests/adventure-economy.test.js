import test from 'node:test';
import assert from 'node:assert/strict';
import {changePetHome,initialPetHome} from '../server/pets.js';
import {adventureState,statPointCost,investAdventurePoints} from '../shared/adventure-progression.js';

test('legacy wallets gain empty economy fields while existing currency, points and skills survive',()=>{
 const saved={points:7,hpPotions:3,stats:{momo:{strength:10}},skills:{kuki:{charge:5}}};
 const profile=adventureState(saved);
 assert.equal(profile.stardust,0);
 assert.equal(profile.skillPoints,0);
 assert.equal(profile.points,7);
 assert.equal(profile.hpPotions,3);
 assert.equal(profile.stats.momo.strength,10);
 assert.deepEqual(profile.skills,{momo:{charge:1,ultimate:1},kuki:{charge:5,ultimate:1}});
 assert.equal(saved.stats.kuki,undefined);
});

test('bulk battle purchases debit once, preserve hearts and reject stale or invalid purchases',()=>{
 let home=initialPetHome();
 home.adventure={stardust:1000};
 const originalHearts=home.hearts;
 const buy={type:'adventurePurchase',product:'hpPotion',quantity:10,actionId:'economy-buy-000000',version:home.version};
 const transact=(current,action)=>changePetHome(current,action,1000,()=>'',{role:'owner'});
 home=transact(home,buy);
 assert.equal(home.adventure.stardust,950);
 assert.equal(home.adventure.hpPotions,10);
 assert.equal(home.hearts,originalHearts);
 const repeated=transact(home,{...buy,version:home.version});
 assert.equal(repeated.adventure.stardust,950);
 assert.equal(repeated.adventure.hpPotions,10);
 assert.throws(()=>transact(home,buy),error=>error.status===409);
 for(const quantity of [0,-1,1.5,1001]){
  assert.throws(()=>transact(home,{...buy,quantity,version:home.version,actionId:'economy-invalid-000'}));
 }
 assert.throws(()=>transact(home,{...buy,quantity:200,version:home.version,actionId:'economy-expensive-00'}));
 assert.equal(home.adventure.stardust,950);
 for(const [product,field,price] of [['statPoint','points',240],['skillPoint','skillPoints',240],['spPotion','staminaPotions',8]]){
  const previous=home.adventure.stardust;
  home=transact(home,{...buy,product,quantity:1,version:home.version,actionId:'economy-buy-'+product+'-000'});
  assert.equal(home.adventure[field],1);
  assert.equal(home.adventure.stardust,previous-price);
 }
});

test('stat investment charges across ten-point boundaries and uses 650 points to max one stat',()=>{
 assert.equal(statPointCost(0,100),650);
 const current=adventureState();
 current.stats.momo.strength=9;current.points=5;
 const next=investAdventurePoints(current,{momo:{strength:2}});
 assert.equal(next.stats.momo.strength,11);
 assert.equal(next.points,0);
 assert.equal(current.stats.momo.strength,9);
 assert.throws(()=>investAdventurePoints({...current,points:4},{momo:{strength:2}}));
});

test('skill upgrades apply a whole draft once and reject a partially affordable batch',()=>{
 const home=initialPetHome();
 home.adventure=adventureState();
 home.adventure.skillPoints=10;home.adventure.skills.momo.charge=9;
 const action={type:'adventureSkillInvestBatch',allocations:{momo:{charge:1}},actionId:'skill-batch-0000000',version:home.version};
 const apply=(current,request)=>changePetHome(current,request,1000,()=>'',{role:'owner'});
 assert.throws(()=>apply(home,{...action,allocations:{momo:{charge:1},kuki:{charge:1}}}));
 assert.equal(home.adventure.skills.momo.charge,9);
 const next=apply(home,action);
 assert.equal(next.adventure.skills.momo.charge,10);
 assert.equal(next.adventure.skills.kuki.charge,1);
 assert.equal(next.adventure.skillPoints,0);
 assert.equal(apply(next,{...action,version:next.version}).adventure.skillPoints,0);
 assert.throws(()=>apply(next,{...action,version:next.version,actionId:'skill-max-level-0000'}));
});
