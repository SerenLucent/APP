import test from 'node:test';import assert from 'node:assert/strict';
import {furnitureUsePose} from '../src/pet-furniture-use.js';
import {project} from '../shared/pet-space.js';
const base={id:'seat',product:'diningchair',space:'home',x:50,y:65};
test('seated pet is above chair but below a nearby front table',()=>{const table={id:'table',product:'table',space:'home',x:54,y:68};const pose=furnitureUsePose(base,'rest',{x:46,y:65},[base,table]);assert.equal(pose.kind,'sit');assert.ok(pose.screen.y<project(base).y);assert.ok(pose.depth>Math.round(project(base).y*10)+9);assert.ok(pose.depth<Math.round(project(table).y*10)+9);});
test('beds and chairs use four distinct directions without rotating standing sprites',()=>{for(const product of ['bed','diningchair','sofa','bench']){const poses=[0,90,180,270].map(rotation=>furnitureUsePose({...base,product,rotation},product==='bed'?'sleep':'rest',base));assert.equal(new Set(poses.map(p=>p.column)).size,4);assert.ok(poses.every(p=>p.kind===(product==='bed'?'sleep':'sit')));}});
test('appliance use stays on accessible approach cell',()=>{const exit={x:40,y:60},pose=furnitureUsePose({...base,product:'fridge'},'tidy',exit);assert.deepEqual(pose.position,exit);assert.equal(pose.kind,'reach');});
