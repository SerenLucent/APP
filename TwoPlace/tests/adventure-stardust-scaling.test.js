import test from 'node:test';import assert from 'node:assert/strict';
import {mapStardustReward} from '../shared/adventure-progression.js';
import {createSeededMine,prepareMineLevel,mineOreBudget,mineOreLimits} from '../shared/adventure-mine-field.js';
import {scatterMineShards} from '../src/adventure-mine.js';
test('adventure reward grows per ten-level band and lower-level penalty applies once',()=>{assert.deepEqual([1,10,11,21].map(l=>mapStardustReward(50,l,l)),[50,50,75,100]);assert.equal(mapStardustReward(50,2,3),25);});
test('mine HP and deposit independently scale from base values without a second payout multiplier',()=>{
 for(const level of [1,2,3,5,10,11,20,21])for(const damage of [7,137,100000]){
  const mine=prepareMineLevel(createSeededMine(123),level);mine.room=0;const ore=mine.caves[0].ores[0],base=createSeededMine(123).caves[0].ores[0];
  const expected=Math.floor((Math.floor(base.max/100)+1)*(1+.5*Math.floor((level-1)/10)));
  assert.equal(ore.deposit,expected);assert.equal(ore.max,Math.round(base.max*(1+.25*(level-1))));
  while(ore.hp>0){const hit=Math.min(ore.hp,damage);ore.hp-=hit;scatterMineShards(mine,ore,hit,()=>.5);}
  assert.equal(mine.caves[0].drops.length,expected);assert.equal(mineOreLimits(123,level).get(ore.id),expected);
  scatterMineShards(mine,ore,999,()=>.5);assert.equal(mine.caves[0].drops.length,expected);assert.equal(mine.broken,1);
  assert.equal(mineOreBudget(ore,level).deposit,expected);
 }
});

test('requested ore sizes give two, four, six and nine shards across the first ten levels',()=>{for(const level of [1,5,10])assert.deepEqual([150,300,500,800].map(hp=>mineOreBudget({hp,max:hp},level).deposit),[2,4,6,9]);assert.deepEqual([11,21].map(level=>mineOreBudget({hp:300,max:300},level).deposit),[6,8]);});
