import test from 'node:test';
import assert from 'node:assert/strict';
import {createHeartMeteor,stepHeartMeteor,heartImpactTargets,HEART_FIRST_IMPACT} from '../src/adventure-heart-meteor.js';

test('heart meteors land five times, half a second apart, and split only at the final impact',()=>{
 const origin={x:550,y:1040},sequence=createHeartMeteor(origin),hits=[];
 origin.x+=300;
 const hit=(point,index,final)=>hits.push({point,index,final});
 assert.equal(stepHeartMeteor(sequence,HEART_FIRST_IMPACT-.001,hit),false);
 assert.equal(hits.length,0);
 stepHeartMeteor(sequence,.001,hit);
 assert.equal(hits.length,1);
 assert.ok(hits[0].point.x<650);
 for(let i=0;i<4;i++)stepHeartMeteor(sequence,.5,hit);
 assert.equal(stepHeartMeteor(sequence,1,hit),true);
 assert.deepEqual(hits.map(h=>h.index),[1,2,3,4,5]);
 assert.deepEqual(hits.map(h=>h.final),[false,false,false,false,true]);
});

test('overlapping strikes damage all living nearby enemies, leaving distant targets alone',()=>{
 const sequence=createHeartMeteor({x:550,y:1040});
 const near={x:550,y:1040,hp:100,radius:22},far={x:740,y:1040,hp:100,radius:22},dead={...near,hp:0};
 stepHeartMeteor(sequence,4,impact=>{for(const target of heartImpactTargets(impact,[near,far,dead]))target.hp-=12;});
 assert.equal(near.hp,40);
 assert.equal(far.hp,100);
 assert.equal(dead.hp,0);
});
