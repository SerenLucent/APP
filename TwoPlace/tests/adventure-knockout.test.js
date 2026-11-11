import test from 'node:test';import assert from 'node:assert/strict';
import fs from 'node:fs';import vm from 'node:vm';
import {beginKnockout,stepKnockout,drawKnockedOut} from '../src/adventure-knockout.js';
function state(){return {active:'momo',pets:{momo:{hp:0,sp:8},kuki:{hp:65,sp:40}},p:{x:10,y:20,fx:1,walking:true},attack:{},charge:{},burst:{},basic:.2,hitStop:.1};}
test('fallen character stays visible for a full two seconds before a living partner takes over',()=>{
 const s=state();assert.equal(beginKnockout(s),true);assert.equal(s.attack,null);assert.equal(s.charge,null);assert.equal(s.p.walking,false);assert.equal(s.hitStop,0);
 assert.equal(stepKnockout(s,1.99),null);assert.equal(s.active,'momo');assert.equal(s.dead,undefined);assert.equal(stepKnockout(s,.01),'switch');assert.equal(s.active,'kuki');assert.equal(s.knockout,null);assert.equal(s.pets.kuki.hp,65);assert.equal(s.pets.kuki.sp,40);assert.equal(s.invuln,1);
});
test('the second fallen character also remains for two seconds before final defeat, without repeated defeat events',()=>{
 const s=state();beginKnockout(s);stepKnockout(s,2);s.pets.kuki.hp=0;assert.equal(beginKnockout(s),true);stepKnockout(s,1.999);assert.equal(s.dead,undefined);assert.equal(s.active,'kuki');assert.equal(stepKnockout(s,.001),'defeat');assert.equal(s.dead,true);assert.equal(s.knockout.completed,true);assert.equal(stepKnockout(s,1),null);
});
test('duplicate hits cannot restart the countdown and an already pending heal does not switch away from a revived pet',()=>{
 const s=state();beginKnockout(s);stepKnockout(s,1);assert.equal(beginKnockout(s),false);assert.equal(s.knockout.t,1);s.pets.momo.hp=20;assert.equal(stepKnockout(s,1),'revived');assert.equal(s.active,'momo');assert.equal(s.knockout,null);
});
test('Momo and Kuki use their own prone rows and finish on the ground rather than rotating a standing sprite',()=>{
 for(const [id,row] of [['momo',2],['kuki',3]]){const calls=[],ctx=new Proxy({globalAlpha:1,drawImage(...args){calls.push(args);}},{get(target,key){return target[key]??(()=>{});},set(target,key,value){target[key]=value;return true;}}),s=state();s.active=id;s.knockout={t:2};const sheet={complete:true,naturalWidth:1280,naturalHeight:1280};drawKnockedOut(ctx,s,sheet,null);assert.equal(calls.length,1);assert.equal(calls[0][2],row*320);assert.equal(calls[0][3],320);assert.equal(calls[0][7],118);}
});
test('actual basic, charge and ultimate handlers ignore input during the two-second knockout',()=>{
 const source=fs.readFileSync('src/adventure.js','utf8');
 for(const name of ['basic','beginCharge','gaugeSkill']){const start=source.indexOf('function '+name+'('),end=source.indexOf('\nfunction ',start+1),context=vm.createContext({paused:false,state:{knockout:{t:1}}});vm.runInContext(source.slice(start,end),context);assert.doesNotThrow(()=>context[name]('pointer'));}
});
