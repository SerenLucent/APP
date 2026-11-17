import test from 'node:test';
import assert from 'node:assert/strict';
import {launchWeaponDrop,stepWeaponDrop,weaponDropLift,DROP_FLIGHT_SECONDS} from '../src/adventure-drop-flight.js';
import {collectWeapon} from '../src/adventure-weapons.js';
import {blocksPoint} from '../src/adventure-collision.js';
import {createOffense,cannonDirection,stepOffense,OFFENSE_BASE} from '../src/adventure-offense.js';
test('loot arcs outside every fortress foundation and cannot be collected before landing',()=>{
 for(const source of createOffense().objects){
  const colliders=createOffense().objects,drop=launchWeaponDrop({owner:'momo',life:45},source,colliders,{x:source.x,y:source.y+100}),pet={weaponDurability:0};
  assert.ok(drop);assert.equal(collectWeapon(pet,drop,'momo'),false);
  stepWeaponDrop(drop,DROP_FLIGHT_SECONDS/2);assert.ok(weaponDropLift(drop)>30);assert.equal(collectWeapon(pet,drop,'momo'),false);
  stepWeaponDrop(drop,DROP_FLIGHT_SECONDS/2);assert.equal(drop.landed,true);assert.equal(weaponDropLift(drop),0);
  assert.ok(!colliders.some(o=>blocksPoint(o,drop.x,drop.y,24)));assert.equal(collectWeapon(pet,drop,'kuki'),false);assert.equal(collectWeapon(pet,drop,'momo'),true);
 }
});
test('reserved destroyed foundations and adjacent structures cannot trap drops',()=>{
 const source={x:1100,y:650,hp:0,halfWidth:50,halfDepth:25,type:'gate',reserveFootprint:true},neighbor={x:1100,y:720,hp:100,radius:40};
 const d=launchWeaponDrop({owner:'kuki'},source,[source,neighbor],{x:1100,y:800});stepWeaponDrop(d,1);
 assert.ok(![source,neighbor].some(o=>blocksPoint(o,d.x,d.y,24)));assert.ok(d.y>=source.y);
});
test('cannon facing selects all eight directions around a fixed tower base',()=>{
 for(let i=0;i<8;i++)assert.equal(cannonDirection(Math.cos(i*Math.PI/4),Math.sin(i*Math.PI/4)),i);
});
test('tower state follows its target and the starting player is outside every foundation',()=>{
 const f=createOffense(),tower=f.objects.find(o=>o.type==='tower');
 assert.ok(f.objects.every(o=>!blocksPoint(o,OFFENSE_BASE.start.x,OFFENSE_BASE.start.y,12)));
 for(let i=0;i<8;i++){stepOffense(f,[],f.objects,.01,{x:tower.x+Math.cos(i*Math.PI/4)*100,y:tower.y+Math.sin(i*Math.PI/4)*100});assert.equal(tower.facing,i);}
});
