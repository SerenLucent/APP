import test from 'node:test';import assert from 'node:assert/strict';
import {initialAdventure,characterStats,rollAttack,investAdventurePoint} from '../shared/adventure-progression.js';
test('independent stats have requested bases, point increments and 100-point caps',()=>{assert.deepEqual(characterStats('momo'),{maxHp:100,maxSp:100,minAttack:8,maxAttack:15,critical:.1,dexterity:0});assert.equal(characterStats('kuki').critical,.05);const max=characterStats('kuki',{strength:100,vitality:100,stamina:100,luck:100,dexterity:100});assert.equal(max.maxHp,600);assert.equal(max.maxSp,600);assert.equal(max.minAttack,110);assert.equal(max.maxAttack,220);assert.equal(max.critical,.55);let p=initialAdventure();p.points=2;p=investAdventurePoint(p,'momo','strength');assert.equal(p.stats.momo.strength,1);assert.equal(p.stats.kuki.strength,0);p.stats.momo.strength=100;assert.throws(()=>investAdventurePoint(p,'momo','strength'));});
test('dexterity biases damage toward maximum and is exactly max at 100, crit is separate',()=>{const rng=()=>.5;assert.ok(rollAttack('momo',{dexterity:70},rng).base>rollAttack('momo',{},rng).base);assert.equal(rollAttack('kuki',{dexterity:100},rng).base,20);let n=0;const crit=rollAttack('momo',{},()=>n++===0?.5:0);assert.equal(crit.critical,true);assert.equal(crit.damage,crit.base*2);});
import {applyAdventureAction,adventureState,ADVENTURE_REWARDS,rouletteTable,rouletteTier} from '../shared/adventure-progression.js';
import {adventureLevel} from '../shared/adventure-progression.js';
import {createDefense,DEFENSE_TOTAL,DEFENSE_WAVES,stepDefense} from '../src/adventure-defense.js';

test('batch applies both friends in one version, rejects the whole invalid batch and deduplicates retries',()=>{
 const home=initialPetHome();
 home.adventure=initialAdventure();
 home.adventure.points=24;
 const action={type:'adventureInvestBatch',actionId:'invest-batch-000001',version:home.version,allocations:{momo:{strength:10},kuki:{luck:2}}};
 const apply=(current,request)=>changePetHome(current,request,1000,()=>'',{role:'owner'});
 assert.throws(()=>apply(home,{...action,allocations:{momo:{strength:10},kuki:{luck:3}}}));
 assert.equal(home.adventure.stats.momo.strength,0);
 assert.equal(home.adventure.points,24);
 const updated=apply(home,action);
 assert.equal(updated.version,home.version+1);
 assert.equal(updated.adventure.points,0);
 assert.deepEqual(adventureLevel(updated.adventure.stats.momo),{level:2,progress:0});
 assert.deepEqual(adventureLevel(updated.adventure.stats.kuki),{level:1,progress:2});
 assert.deepEqual(apply(updated,{...action,version:updated.version}).adventure,updated.adventure);
});
import {createObstacles,EXPLORATION_FIELD_VERSION,explorationProof} from '../shared/adventure-field.js';
import {changePetHome,initialPetHome} from '../server/pets.js';
test('mixed field clears require 50 trees and 30 rocks, including after migrating an existing run',()=>{
 const home={hearts:0};
 const start=(actionId,fieldVersion,id)=>applyAdventureAction(home,{type:'adventureStart',actionId,fieldVersion},1000,()=>id,'owner');
 start('legacy-start-000000',1,'12345678-1234-1234-1234-123456789012');
 const previous=home.adventure.runs.owner;
 start('mixed-start-0000000',EXPLORATION_FIELD_VERSION,'22345678-1234-1234-1234-123456789012');
 const run=home.adventure.runs.owner;
 assert.notEqual(run.id,previous.id);
 const objects=createObstacles(run.seed,run.fieldVersion);
 const trees=objects.filter(o=>o.type==='tree'), rocks=objects.filter(o=>o.type==='rock');
 assert.equal(trees.length,100);
 assert.equal(rocks.length,60);
 const finish=cleared=>applyAdventureAction(home,{type:'adventureFinish',actionId:'mixed-finish-000000',runId:run.id,cleared},2000,()=>'', 'owner');
 assert.throws(()=>finish([...trees.slice(0,51),...rocks.slice(0,29)].map(o=>o.id)),/나무 50개와 바위 30개/);
 for(const item of [...trees.slice(0,70),...rocks.slice(0,30)])item.hp=0;
 finish(explorationProof(objects));
 const [entry]=home.adventure.history;
 assert.deepEqual([entry.obstacles,entry.trees,entry.rocks],[80,50,30]);
});
test('each roulette reward is granted once and only after 100 distinct field obstacles from the current run',()=>{
 for(let i=0;i<ADVENTURE_REWARDS.length;i++){const home={hearts:0};applyAdventureAction(home,{type:'adventureStart',actionId:'start-action-00000000'},1000,()=>('12345678-1234-1234-1234-123456789012'),'owner');const run=home.adventure.runs.owner,ids=createObstacles(run.seed).slice(0,100).map(o=>o.id);assert.equal(createObstacles(run.seed).length,160);assert.throws(()=>applyAdventureAction(home,{type:'adventureFinish',actionId:'finish-action-000000',runId:run.id,cleared:ids.slice(1)},2000,()=>'', 'owner'));assert.throws(()=>applyAdventureAction(home,{type:'adventureFinish',actionId:'finish-action-000000',runId:run.id,cleared:Array(100).fill(ids[0])},2000,()=>'', 'owner'));applyAdventureAction(home,{type:'adventureFinish',actionId:'finish-action-000000',runId:run.id,cleared:ids},1000000,()=>'', 'owner',()=>rouletteTable(999000).indexOf(ADVENTURE_REWARDS[i].id)/rouletteTable().length+.001);const r=ADVENTURE_REWARDS[i];if(r.hearts)assert.equal(home.hearts,r.hearts);else assert.equal(home.adventure[r.field],r.amount||1);const previous=JSON.stringify(home);applyAdventureAction(home,{type:'adventureFinish',actionId:'finish-action-retry0',runId:run.id,cleared:ids},3000,()=>'', 'owner',()=>.9);assert.equal(JSON.stringify(home),previous);}
});
test('potion and point spending is atomic, independent by character, idempotent and version guarded',()=>{let home=initialPetHome();home.adventure=adventureState();home.adventure.hpPotions=1;home.adventure.points=2;const action={type:'adventurePotion',actionId:'potion-action-000000',pet:'momo',potion:'hp',version:home.version};const next=changePetHome(home,action,1000,()=>'',{role:'owner'});assert.equal(next.adventure.hpPotions,0);assert.equal(home.adventure.hpPotions,1);assert.throws(()=>changePetHome(next,action,1000,()=>'',{role:'partner'}),e=>e.status===409);const retry=changePetHome(next,{...action,version:next.version},1000,()=>'',{role:'owner'});assert.equal(retry.adventure.hpPotions,0);const upgraded=changePetHome(retry,{type:'adventureInvest',actionId:'invest-action-000000',pet:'kuki',stat:'luck',version:retry.version},1000,()=>'',{role:'partner'});assert.equal(upgraded.adventure.points,0);assert.equal(upgraded.adventure.stats.kuki.luck,1);assert.equal(upgraded.adventure.stats.momo.luck,0);assert.throws(()=>changePetHome(upgraded,{type:'adventurePotion',actionId:'potion-action-new000',pet:'momo',potion:'hp',version:upgraded.version},1000,()=>'',{role:'owner'}));});

test('clear grades reward more stardust while shared history remains replay-safe',()=>{let previous=0;for(const time of [180000,140000,115000,100000]){const tier=rouletteTier(time);assert.ok(tier.stardust>previous);previous=tier.stardust;}assert.equal(rouletteTier(102000).id,'S');assert.equal(rouletteTier(102001).id,'A');const home={hearts:0,adventure:initialAdventure()};home.adventure.totalClears=19;applyAdventureAction(home,{type:'adventureStart',actionId:'history-start-000000'},1000,()=> 'abcdef01-1111-1111-1111-123456789012','owner');let run=home.adventure.runs.owner;assert.equal(run.enemyCount,24);const action={type:'adventureFinish',actionId:'history-finish-00000',runId:run.id,cleared:createObstacles(run.seed).slice(0,100).map(o=>o.id),pet:'kuki',playTimeMs:200000};applyAdventureAction(home,action,301000,()=>'', 'owner',()=>.99);assert.equal(home.adventure.totalClears,20);assert.equal(home.adventure.history.length,1);assert.equal(home.adventure.history[0].durationMs,200000);assert.equal(home.adventure.history[0].character,'kuki');applyAdventureAction(home,{...action,actionId:'history-retry-000000'},400000,()=>'', 'owner');assert.equal(home.adventure.history.length,1);applyAdventureAction(home,{type:'adventureStart',actionId:'history-start-next00',restart:true},401000,()=> 'bcdef012-1111-1111-1111-123456789012','owner');assert.equal(home.adventure.runs.owner.enemyCount,28);assert.equal(home.adventure.history.length,1);});

test('roulette spreads duplicate rewards apart, including the wraparound seam',()=>{for(const time of [900000,600000,400000,200000]){const table=rouletteTable(time);for(let i=0;i<table.length;i++)assert.notEqual(table[i],table[(i+1)%table.length]);}});

test('roulette contains only hearts with the agreed distribution',()=>{
 assert.deepEqual(ADVENTURE_REWARDS.map(reward=>reward.hearts),[2,3,4,5]);
 const table=rouletteTable();
 assert.equal(table.length,10);
 assert.deepEqual([2,3,4,5].map(amount=>table.filter(id=>id==='heart'+amount).length),[4,3,2,1]);
});

test('defense rewards a complete set of waves once in the room wallet',()=>{
 const home={hearts:0},id=()=> 'abcdef01-1111-1111-1111-123456789012';
 const start={type:'adventureStart',mode:'defense',actionId:'defense-start-000000'};
 const random=()=>.99;
 applyAdventureAction(home,start,1000,id,'owner',random);
 const defense=createDefense(),cleared=[];
 for(const count of DEFENSE_WAVES){
  const {fresh}=stepDefense(defense,[],2);
  assert.equal(fresh.length,count);
  cleared.push(...fresh.map(enemy=>enemy.id));
 }
 assert.equal(stepDefense(defense,[],0).complete,true);
 const finish={type:'adventureFinish',actionId:'defense-finish-000000',runId:id(),cleared,playTimeMs:3000};
 assert.throws(()=>applyAdventureAction(home,finish,5000,id,'partner',random));
 for(const invalid of [cleared.slice(0,-1),[...cleared.slice(0,-1),cleared[0]]]){
  assert.throws(()=>applyAdventureAction(home,{...finish,cleared:invalid},5000,id,'owner',random));
 }
 applyAdventureAction(home,finish,5000,id,'owner',random);
 applyAdventureAction(home,{...finish,actionId:'defense-retry-000000'},6000,id,'owner',random);
 assert.equal(home.hearts,5);
 assert.equal(home.adventure.history.length,1);
 assert.equal(home.adventure.history[0].mode,'defense');
 assert.equal(home.adventure.history[0].enemyCount,DEFENSE_TOTAL);
});

test('offense grants the common roulette once, records the house objective and isolates modes and roles',()=>{
 const home={hearts:0};let sequence=0;const id=()=>`abcdef0${sequence++}-1111-1111-1111-123456789012`;
 const start=(mode,role='owner')=>applyAdventureAction(home,{type:'adventureStart',mode,actionId:`offense-start-${sequence}-000000`},1000,id,role);
 assert.throws(()=>start('unknown'));start('offense');const run=home.adventure.runs.owner;assert.equal(run.mode,'offense');assert.equal(run.enemyCount,0);
 const finish={type:'adventureFinish',actionId:'offense-finish-000000',runId:run.id,pet:'kuki',playTimeMs:3000};
 for(const cleared of [[],['wrong-house'],['outpost-house','outpost-house']])assert.throws(()=>applyAdventureAction(home,{...finish,cleared},5000,id,'owner'));
 assert.throws(()=>applyAdventureAction(home,{...finish,cleared:['outpost-house']},5000,id,'partner'));
 applyAdventureAction(home,{...finish,cleared:['outpost-house']},5000,id,'owner',()=>.99);assert.equal(home.hearts,5);assert.equal(home.adventure.totalClears,1);
 const history=home.adventure.history[0];assert.equal(history.mode,'offense');assert.equal(history.houses,1);assert.equal(history.durationMs,3000);assert.equal(history.character,'kuki');
 applyAdventureAction(home,{...finish,actionId:'offense-retry-0000000',cleared:['outpost-house']},6000,id,'owner',()=>0);assert.equal(home.hearts,5);assert.equal(home.adventure.history.length,1);
 start('explore');const explore=home.adventure.runs.owner;assert.equal(explore.mode,'explore');start('offense');assert.notEqual(home.adventure.runs.owner.id,explore.id);
 assert.throws(()=>applyAdventureAction(home,{...finish,actionId:'stale-finish-00000000',runId:explore.id,cleared:['outpost-house']},6000,id,'owner'),e=>e.status===409);
 start('explore');assert.throws(()=>applyAdventureAction(home,{...finish,actionId:'wrong-mode-finish0000',runId:home.adventure.runs.owner.id,cleared:['outpost-house']},6000,id,'owner'));
 assert.equal(home.adventure.history.length,1);
});
