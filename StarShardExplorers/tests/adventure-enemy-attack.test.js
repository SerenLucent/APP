import test from 'node:test';import assert from 'node:assert/strict';
import {rollEnemyAttack} from '../src/adventure-enemy-attack.js';
import {createDefense,stepDefense} from '../src/adventure-defense.js';
import {OUTPOST_MAX_HP} from '../src/adventure-offense.js';
const roll=(value,crit,multiplier=1)=>{let i=0;return rollEnemyAttack(multiplier,()=>[value,crit][i++]);};
test('enemy damage uses six equally sized 5 to 10 bands and five percent double criticals',()=>{
 assert.deepEqual([0,1,2,3,4,5].map(n=>roll((n+.5)/6,.5).damage),[5,6,7,8,9,10]);
 assert.equal(roll(0,.049).damage,10);assert.equal(roll(0,.05).damage,5);assert.equal(roll(.999,.01,1.2).damage,24);
 let total=0,criticals=0;for(let n=0;n<100;n++){const h=roll(.5,(n+.5)/100);total+=h.damage;if(h.critical)criticals++;}assert.equal(criticals,5);assert.equal(total,840);
});
test('defense house takes independently rolled hits, with fixed house damage even at a high map level',()=>{
 const d=createDefense();assert.equal(d.house.max,2000);assert.equal(OUTPOST_MAX_HP,6000);d.wave=10;d.damageScale=5.6;
 const enemies=[1,2].map((id)=>({id,hp:100,x:d.house.x,y:d.house.y+80,radius:22,speed:100,cooldown:0,windup:.01}));
 let i=0;const rolls=[0,.5,.999,.01];const r=stepDefense(d,enemies,.02,()=>rolls[i++]);assert.deepEqual(r.hits.map(h=>h.damage),[4,14]);assert.equal(d.house.hp,1982);
});

test('offense and defense range is four through seven with unchanged five percent criticals',()=>{
 for(let n=0;n<4;n++){let i=0;assert.equal(rollEnemyAttack(1,()=>[(n+.5)/4,.5][i++],4,7).damage,4+n);}
 let i=0;assert.equal(rollEnemyAttack(1,()=>[.999,.049][i++],4,7).damage,14);
});
