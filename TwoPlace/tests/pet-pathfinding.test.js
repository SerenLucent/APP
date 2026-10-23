import {test} from 'node:test';import assert from 'node:assert/strict';
import {findPath,clearPathSegment,cellCenter,petStepClear} from '../shared/pet-space.js';
test('open floor moves straight to diagonal and unequal-axis destinations without L turns',()=>{
 for(const end of [{c:12,r:8},{c:2,r:15},{c:17,r:17},{c:18,r:4}])assert.deepEqual(findPath([],'yard',{c:1,r:1},end),[end]);
});
test('smoothed routes preserve furniture clearance and never cut blocked corners',()=>{
 const items=[{id:'wall',product:'wardrobe',space:'momoRoom',...cellCenter(7,7)}];
 const start={c:2,r:2},end={c:14,r:14};assert.equal(clearPathSegment(items,'momoRoom',start,end),false);const path=findPath(items,'momoRoom',start,end);assert.ok(path.length>1);let previous=start;for(const point of path){assert.ok(clearPathSegment(items,'momoRoom',previous,point));previous=point;}assert.deepEqual(path.at(-1),end);
 const corner=[{id:'plant',product:'plant',space:'yard',...cellCenter(2,1)}];assert.equal(clearPathSegment(corner,'yard',{c:1,r:1},{c:2,r:2}),false);
});
test('long straight moves cannot pass through a friend or overlap a reserved collinear path',()=>{
 const p=(c,r)=>cellCenter(c,r);assert.equal(petStepClear(p(0,0),p(10,10),[{from:p(5,5),to:p(5,5)}]),false);
 assert.equal(petStepClear(p(3,3),p(4,3),[{from:p(0,3),to:p(7,3)}]),false);
 assert.equal(petStepClear(p(0,1),p(10,1),[{from:p(5,2),to:p(5,2)}]),true);
 const canStep=(a,b)=>petStepClear(p(a.c,a.r),p(b.c,b.r),[{from:p(5,5),to:p(5,5)}]);const path=findPath([],'yard',{c:0,r:0},{c:10,r:10},canStep);assert.ok(path.length>1);let last={c:0,r:0};for(const step of path){assert.ok(clearPathSegment([],'yard',last,step,canStep));last=step;}
});
