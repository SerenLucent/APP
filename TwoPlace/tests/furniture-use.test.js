import test from 'node:test';import assert from 'node:assert/strict';
import {furnitureUsePose} from '../src/pet-furniture-use.js';
import {project} from '../shared/pet-space.js';
const base={id:'seat',product:'diningchair',space:'home',x:50,y:65};
test('seated pet is above chair but below a nearby front table',()=>{const table={id:'table',product:'table',space:'home',x:54,y:68};const pose=furnitureUsePose(base,'rest',{x:46,y:65},[base,table]);assert.equal(pose.kind,'sit');assert.ok(pose.screen.y<project(base).y);assert.ok(pose.depth>Math.round(project(base).y*10)+9);assert.ok(pose.depth<Math.round(project(table).y*10)+9);});
test('beds and chairs use four distinct directions without rotating standing sprites',()=>{for(const product of ['bed','diningchair','sofa','bench']){const poses=[0,90,180,270].map(rotation=>furnitureUsePose({...base,product,rotation},product==='bed'?'sleep':'rest',base));assert.equal(new Set(poses.map(p=>p.column)).size,4);assert.ok(poses.every(p=>p.kind===(product==='bed'?'sleep':'sit')));}});
test('appliance use stays on accessible approach cell',()=>{const exit={x:40,y:60},pose=furnitureUsePose({...base,product:'fridge'},'tidy',exit);assert.deepEqual(pose.position,exit);assert.equal(pose.kind,'reach');});

import {furnitureApproach,interactionSpriteFrame} from '../src/pet-furniture-use.js';
import {toWorld} from '../shared/pet-space.js';
test('front-side approach rotates with the appliance door and reaches toward its center',()=>{for(const product of ['plant','premiumFridge','premiumWasher'])for(const [i,rotation] of [0,90,180,270].entries()){const item={product,rotation,x:50,y:65},exit=furnitureApproach(item),a=toWorld(exit),b=toWorld(item),front=[[0,1],[-1,0],[0,-1],[1,0]][i],pose=furnitureUsePose(item,'water',exit);assert.ok((a.u-b.u)*front[0]+(a.v-b.v)*front[1]>0);assert.ok([0,1,2,3].includes(pose.column));}});
test('upper-right reach mirrors upper-left, instead of reusing the wrong-facing back frame',()=>{assert.deepEqual(interactionSpriteFrame(2),{column:3,flip:1});assert.deepEqual(interactionSpriteFrame(3),{column:3,flip:-1});});

test('bed height uses the live square world projection, without the old 1000x900 preview ratio',()=>{const item={...base,product:'bed',rotation:0};const pose=furnitureUsePose(item,'sleep',base);const ground=project(pose.position);assert.ok(Math.abs((ground.y-pose.screen.y)-1.65*44/20)<1e-10);});
