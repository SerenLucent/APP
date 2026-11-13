import test from 'node:test';import assert from 'node:assert/strict';
import {investmentLevel,initialAdventure,investAdventureStardust,adventureState,adventureLevel,recommendedMapLevel} from '../shared/adventure-progression.js';
test('investment level uses 1000, 1500 and 2000 shard bands with exact boundary carry',()=>{
 for(const [total,level,progress,required] of [[0,1,0,1000],[999,1,999,1000],[1000,2,0,1000],[10000,11,0,1500],[11499,11,1499,1500],[11500,12,0,1500],[25000,21,0,2000],[43000,30,0,2000]])assert.deepEqual(investmentLevel(total),{level,progress,required,invested:total});
});
test('actual per-character stat spending advances the shared recommended map level and persists',()=>{
 const p=initialAdventure();p.stardust=5000;const first=investAdventureStardust(p,{momo:{strength:5},kuki:{stamina:5}});assert.equal(first.statInvestment.momo,1000);assert.equal(first.statInvestment.kuki,1000);assert.equal(recommendedMapLevel(first),2);assert.equal(first.stardust,3000);
 const second=investAdventureStardust(first,{momo:{strength:5}});assert.equal(second.statInvestment.momo,2000);assert.equal(adventureLevel(second.stats.momo,second.statInvestment.momo).level,3);assert.equal(adventureState(JSON.parse(JSON.stringify(second))).statInvestment.momo,2000);
 assert.equal(adventureState({stats:{momo:{strength:10}}}).statInvestment.momo,2000);
});
