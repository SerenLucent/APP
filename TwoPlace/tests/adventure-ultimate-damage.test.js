import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {rollAttack} from '../shared/adventure-progression.js';
import {skillBalance} from '../shared/adventure-skills.js';
import {heartImpactTargets} from '../src/adventure-heart-meteor.js';
import {KUKI_SLAM_RADIUS,KUKI_SLAM_MULTIPLIER} from '../src/adventure-kuki-slam.js';
const source=fs.readFileSync('src/adventure.js','utf8');
function setup(name,randomValues,targets){
 let rolls=0;const hits=[];
 const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1);
 const context=vm.createContext({combatAudio:{play(){}},wallet:{profile:{stats:{momo:{},kuki:{}}}},state:{active:name==='impactHeartMeteor'?'kuki':'momo',particles:[]},clock:0,shake:0,Math,
  rollAttack(id,stats){rolls++;return rollAttack(id,stats,()=>{assert.ok(randomValues.length);return randomValues.shift();});},
  damageMultiplier:()=>1.2*1.5,skillBalance,skillLevel:()=>10,combatTargets:()=>targets,heartImpactTargets,HEART_IMPACT_RADIUS:112,KUKI_SLAM_RADIUS,KUKI_SLAM_MULTIPLIER,
  damageObject(target,damage,critical,owner){hits.push({target:target.id,damage,critical,owner});target.hp=Math.max(0,target.hp-damage);},starBurst(){},meteorBurst(){},status(){},dropHearts(){}});
 vm.runInContext(source.slice(start,end),context);
 return {context,hits,get rolls(){return rolls;}};
}
test('each meteor rolls damage and critical per target and per landing, preserving buff, weapon, skill and Momo ownership',()=>{
 const near=[{id:'a',x:0,y:0,hp:1000,radius:10},{id:'b',x:10,y:0,hp:1000,radius:10}],far={id:'far',x:1000,y:0,hp:1000,radius:10},dead={id:'dead',x:0,y:0,hp:0,radius:10};
 const h=setup('impactHeartMeteor',[0,.99,.99,0,.5,.99,.25,.99],[...near,far,dead]);
 h.context.impactHeartMeteor({x:0,y:0},1,false);h.context.impactHeartMeteor({x:0,y:0},2,false);
 assert.equal(h.rolls,4);assert.deepEqual(h.hits.map(v=>v.critical),[false,true,false,false]);
 const expected=[8,30,12,10];h.hits.forEach((hit,i)=>{assert.ok(Math.abs(hit.damage-expected[i]*1.2*1.5*1.3)<1e-9);assert.equal(hit.owner,'momo');});
 assert.equal(far.hp,1000);assert.equal(dead.hp,0);
});
test('Kuki slam rolls separately for each living in-range target, preserves five-hit multiplier and survivor stun',()=>{
 const a={id:'a',type:'enemy',x:0,y:0,hp:10000,radius:10,windup:1},b={id:'b',type:'enemy',x:10,y:0,hp:10000,radius:10,windup:1},rock={id:'rock',type:'rock',x:5,y:0,hp:10000,radius:10},dead={id:'dead',x:0,y:0,hp:0,radius:10},far={id:'far',x:10000,y:0,hp:10000,radius:10};
 const h=setup('impactKukiSlam',[0,.99,.99,0,.5,.99],[a,b,rock,dead,far]);h.context.impactKukiSlam({x:0,y:0});
 assert.equal(h.rolls,3);assert.deepEqual(h.hits.map(v=>v.critical),[false,true,false]);
 const expected=[10,40,15];h.hits.forEach((hit,i)=>{assert.ok(Math.abs(hit.damage-expected[i]*KUKI_SLAM_MULTIPLIER*1.2*1.5*1.3)<1e-9);assert.equal(hit.owner,'kuki');});
 assert.equal(a.stun,3);assert.equal(b.stun,3);assert.equal(a.windup,0);assert.equal(rock.stun,undefined);assert.equal(far.hp,10000);assert.equal(dead.hp,0);
});
