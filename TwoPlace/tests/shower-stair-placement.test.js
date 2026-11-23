import test from 'node:test';
import assert from 'node:assert/strict';
import {wallLayer} from '../src/wall-decor-view.js';
import {cellCenter,placementAllowed,walkable} from '../shared/pet-space.js';
test('shower points into the room on either wall and cancels wall shear',()=>{
 for(const [side,direction,shear] of [['left','right','.5'],['right','left','-.5']]){
  const html=wallLayer({items:[{id:'shower',product:'bathShower',space:'shower',wallSide:side,wallCol:2,wallRow:1}]},'shower');
  assert.ok(html.includes('data-shower-facing="'+direction+'"'));
  assert.ok(html.includes('matrix(1 '+Number(shear)+' 0 1 0 0)'));
 }
});
test('stairs reserve rail clearance for every furniture footprint and rotation on both floors',()=>{
 for(const space of ['home','upperFloor'])for(const product of ['plant','table','rug'])for(const rotation of [0,90,180,270]){
  const item={id:'new',product,rotation};
  for(const [c,r] of [[16,2],[19,2],[17,5]])assert.equal(placementAllowed([],item,space,cellCenter(c,r)),false);
 }
 assert.equal(walkable([],'home',16,2),true);
 assert.equal(placementAllowed([],{product:'plant'},'home',cellCenter(15,7)),true);
 assert.equal(placementAllowed([],{product:'plant'},'shower',cellCenter(18,2)),true);
});
