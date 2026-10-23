import {test} from 'node:test';import assert from 'node:assert/strict';
import {bedModel} from '../src/bed-model.js';
import {furnitureLayout} from '../shared/furniture-layout.js';
import {fromWorld,GRID_SIZE} from '../shared/pet-space.js';
test('all four bed views use the floor 2:1 axes and rotate footprint dimensions',()=>{
 for(const rotation of [0,90,180,270]){const bed=bedModel(rotation);assert.equal(bed.ground.length,4);
  for(let i=0;i<4;i++){const a=bed.ground[i],b=bed.ground[(i+1)%4];assert.ok(Math.abs(Math.abs((b.y-a.y)/(b.x-a.x))-.5)<1e-10);}
  const layout=furnitureLayout({product:'bed',rotation,...fromWorld(.5,.5)});
  assert.deepEqual([layout.columns,layout.rows],rotation%180?[3,2]:[2,3]);
  assert.equal(layout.origin.column+layout.columns/2,GRID_SIZE/2);
  assert.equal(layout.origin.row+layout.rows/2,GRID_SIZE/2);
 }
});
test('registration uses actual saved center instead of rounding to a different cell',()=>{
 const layout=furnitureLayout({product:'bed',rotation:0,...fromWorld(.513,.477)});
 assert.ok(Math.abs(layout.origin.column+1-.513*GRID_SIZE)<1e-10);
 assert.ok(Math.abs(layout.origin.row+1.5-.477*GRID_SIZE)<1e-10);
});
