import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {ultimateEnemyDelta,KUKI_SLAM_IMPACT_TIME} from '../src/adventure-cinematics.js';
import {HEART_LAUNCH_END} from '../src/adventure-heart-meteor.js';
test('Momo freezes until heart launch ends; Kuki freezes until landing, without freezing the rest of his animation',()=>{
 assert.equal(ultimateEnemyDelta(null,.04),.04);
 assert.equal(ultimateEnemyDelta({id:'momo',t:0},.04),0);
 assert.equal(ultimateEnemyDelta({id:'momo',t:HEART_LAUNCH_END-.1},.04),0);
 assert.ok(Math.abs(ultimateEnemyDelta({id:'momo',t:HEART_LAUNCH_END-.02},.04)-.02)<1e-9);
 assert.equal(ultimateEnemyDelta({id:'kuki',t:KUKI_SLAM_IMPACT_TIME},.04),.04);
 assert.equal(ultimateEnemyDelta({id:'kuki',t:.8},.04),.04);
});
const source=fs.readFileSync('src/adventure.js','utf8'),start=source.indexOf('function update(dt){'),end=source.indexOf('\nfunction hurtPlayer',start);
function frame(burst,{offense=false,defense=false}={}){
 const calls=[];const state={burst,active:'momo',p:{x:500,y:500},pets:{momo:{powerTime:0},kuki:{powerTime:0}},swap:0,basic:0,invuln:0,dead:false,won:false,colliders:[],objects:[],enemies:[{hp:100}],hearts:[],weaponDrops:[],trees:0,rocks:0,particles:[],texts:[]};
 const context=vm.createContext({stepRevivals:()=>[],state,Math,clock:0,shake:0,hudClock:0,keys:new Set(),stick:{x:0,y:0},ultimateEnemyDelta,KUKI_SLAM_IMPACT_TIME,offenseMode:offense,defenseMode:defense,thorns:[],usesMixedField:()=>false,recoverPet(){},stepHitJolt(){},combatTargets:()=>[],hud(){},move(){},stepEnemy(enemy,p,colliders,dt){calls.push(['enemy',dt]);return false;},stepOffense(a,b,c,dt){calls.push(['spawn',dt]);return [];},offenseProgress:()=>({complete:false}),updateDefense(dt){calls.push(['defense',dt]);},impactKukiSlam(){calls.push(['impact']);},});
 vm.runInContext(source.slice(start,end),context);context.update(.04);return {state,calls};
}
test('actual update keeps skill animation advancing while AI and both wave systems stay frozen',()=>{
 for(const options of [{},{offense:true},{defense:true}]){
  const h=frame({id:'momo',t:.2,duration:HEART_LAUNCH_END},options);assert.deepEqual(h.calls,[]);assert.ok(Math.abs(h.state.burst.t-.24)<1e-9);assert.equal(h.state.enemyClock,0);
 }
 const landing=frame({id:'kuki',t:.6,duration:1,hit:false});assert.equal(landing.calls[0][0],'impact');assert.equal(landing.calls[1][0],'enemy');assert.ok(Math.abs(landing.calls[1][1]-.02)<1e-9);
 const defense=frame({id:'kuki',t:.7,duration:1,hit:true},{defense:true});assert.deepEqual(defense.calls,[['defense',.04]]);
});
