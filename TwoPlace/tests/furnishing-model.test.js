import {test} from 'node:test';import assert from 'node:assert/strict';
import {furnishingModel} from '../src/furnishing-model.js';
import {CATALOG} from '../server/pets.js';
test('every saleable furnishing has four floor-registered solid views',()=>{
 for(const {id} of CATALOG.filter(p=>p.id!=='snack'))for(const rotation of [0,90,180,270]){
  const model=furnishingModel(id,rotation);assert.ok(model,`${id} ${rotation}`);
  assert.ok(model.width>0&&model.height>0);assert.ok(model.anchorX>0&&model.anchorX<1);assert.ok(model.anchorY>0&&model.anchorY<1);
  for(let i=0;i<4;i++){const a=model.ground[i],b=model.ground[(i+1)%4];assert.ok(Math.abs(Math.abs((b.y-a.y)/(b.x-a.x))-.5)<1e-10);}
  assert.ok(!model.svg.includes('NaN'));assert.ok(model.svg.includes('polygon'));
 }
});
test('desk and bed preserve real vertical thickness and independent views',()=>{
 for(const id of ['bed','desk']){const front=furnishingModel(id,0),back=furnishingModel(id,180);assert.notEqual(front.svg,back.svg);assert.ok(front.anchorY*front.height>20);}
});
import {footprint} from '../shared/pet-space.js';
test('ground contact points remain inside registered cells after every rotation',()=>{
 for(const {id} of CATALOG.filter(p=>p.type==='furniture'))for(const rotation of [0,90,180,270]){
  const model=furnishingModel(id,rotation),[w,d]=footprint({product:id,rotation});
  assert.ok(model.contacts.length,`${id} has ground contact`);
  for(const [x,y,z] of model.contacts){assert.ok(Math.abs(x)<=w/2+.03,`${id} ${rotation} x=${x}`);assert.ok(Math.abs(y)<=d/2+.03,`${id} ${rotation} y=${y}`);assert.ok(z>=-1e-8);}
 }
});
