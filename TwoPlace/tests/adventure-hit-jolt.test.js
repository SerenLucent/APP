import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {triggerHitJolt,stepHitJolt,hitJoltOffset,drawWithHitJolt,HIT_JOLT_DURATION} from '../src/adventure-hit-jolt.js';
test('all damageable target kinds get fast bounded visual motion that settles without altering collision coordinates',()=>{
 for(const type of ['tree','rock','enemy','house']){
  const target={type,x:123,y:456,hp:100};triggerHitJolt(target);let moved=false;
  for(let i=0;i<40;i++){const offset=hitJoltOffset(target);assert.ok(Math.abs(offset.x)<=2.6);assert.ok(Math.abs(offset.y)<=.65);moved ||= Math.abs(offset.x)>.1;stepHitJolt(target,1/120);}
  assert.equal(moved,true);assert.deepEqual(hitJoltOffset(target),{x:0,y:0});assert.equal(target.x,123);assert.equal(target.y,456);assert.equal(target.hp,100);
 }
});
test('repeated hits restart the short reaction without increasing amplitude or duration',()=>{
 const target={x:100,y:200};for(let i=0;i<100;i++){triggerHitJolt(target);stepHitJolt(target,.01);assert.ok(target.hitJolt<=HIT_JOLT_DURATION);assert.ok(Math.abs(hitJoltOffset(target).x)<=2.6);}
 stepHitJolt(target,1);assert.deepEqual(hitJoltOffset(target),{x:0,y:0});
});
test('drawing a hit reaction restores canvas transform even if a renderer throws',()=>{
 const calls=[],ctx={save(){calls.push('save');},translate(){calls.push('translate');},restore(){calls.push('restore');}},target={x:10,y:20};triggerHitJolt(target);
 assert.throws(()=>drawWithHitJolt(ctx,target,()=>{throw Error('renderer');}));assert.deepEqual(calls,['save','translate','restore']);
 calls.length=0;drawWithHitJolt(ctx,undefined,()=>calls.push('draw'));assert.deepEqual(calls,['draw']);
});
test('shared combat damage path triggers target reactions for attacks, meteors and slams',()=>{
 const source=fs.readFileSync('src/adventure.js','utf8'),start=source.indexOf('function damageObject('),end=source.indexOf('\nfunction ',start+1);
 const context=vm.createContext({state:{active:'momo',weaponDrops:[]},Math,shake:0,rollWeaponDrop:()=>null,offenseMode:false,requestCriticalHitStop(){},triggerHitJolt,float(){},starBurst(){}});
 vm.runInContext(source.slice(start,end),context);
 for(const type of ['tree','rock','enemy','house']){const target={type,x:123,y:456,hp:1000};context.damageObject(target,20,true,'momo');assert.equal(target.hp,980);assert.equal(target.hitJolt,HIT_JOLT_DURATION);}
});
test('defense house shakes on actual incoming house damage',()=>{
 const source=fs.readFileSync('src/adventure.js','utf8'),start=source.indexOf('function updateDefense(dt){'),end=source.indexOf('\nfunction drawDefenseHome',start);
 const house={x:1300,y:900,hp:995},context=vm.createContext({state:{defense:{house},enemies:[]},stepDefense:()=>({fresh:[],damage:5,complete:false}),triggerHitJolt,shake:0,Math,float(){}});
 vm.runInContext(source.slice(start,end),context);context.updateDefense(.04);assert.equal(house.hitJolt,HIT_JOLT_DURATION);
});
