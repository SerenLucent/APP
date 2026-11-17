import test from 'node:test';
import assert from 'node:assert/strict';
import {createOffense} from '../src/adventure-offense.js';
import {basicAttackTargets,targetContact} from '../src/adventure-targeting.js';
import {skillHits} from '../src/adventure-model.js';
test('attacking either gate does not also hit the main fortress',()=>{
 const {objects}=createOffense(),house=objects[0];
 for(const gate of objects.filter(o=>o.type==='gate')){
  const player={x:gate.x,y:gate.y+50,fx:0,fy:-1},hits=basicAttackTargets(player,objects);
  assert.deepEqual(hits.map(o=>o.id),[gate.id]);assert.ok(!hits.includes(house));
 }
});
test('a basic strike hits only the closest forward structure, while foes can share its reach',()=>{
 const player={x:0,y:80,fx:0,fy:-1},front={x:0,y:40,hp:100,hitHalfWidth:20,hitHalfDepth:10},back={x:0,y:0,hp:100,hitHalfWidth:30,hitHalfDepth:20},enemy={x:10,y:45,radius:10,hp:20};
 assert.deepEqual(basicAttackTargets(player,[back,enemy,front]),[enemy,front]);
});
test('a fortress is not treated as a tall circle and area attacks can still hit two nearby structures',()=>{
 const {objects}=createOffense(),house=objects[0],gate=objects.find(o=>o.type==='gate');
 assert.equal(skillHits({x:house.x,y:house.y+150},house,'momo'),false);
 const p={x:(house.x+gate.x)/2,y:gate.y+50};
 assert.equal(skillHits(p,house,'momo'),true);assert.equal(skillHits(p,gate,'momo'),true);
 assert.ok(targetContact(p,house).distance<104);
});
