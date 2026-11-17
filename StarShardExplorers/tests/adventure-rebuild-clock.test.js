import test from 'node:test';
import assert from 'node:assert/strict';
import {drawRebuildClock,fortressSpriteSize} from '../src/adventure-fortress-art.js';
test('reconstruction uses a clock progress ring and countdown instead of an HP bar',()=>{
 const arcs=[],labels=[],ctx={save(){},restore(){},beginPath(){},roundRect(){},fill(){},stroke(){},moveTo(){},lineTo(){},arc(...args){arcs.push(args);},fillText(text){labels.push(text);}};
 drawRebuildClock(ctx,0,0,10);assert.deepEqual(labels,['재건 10초']);assert.equal(arcs.length,2);assert.ok(Math.abs(arcs[1][4]-arcs[1][3]-Math.PI)<1e-9);
});

test('cannon retains height with wider ruin art',()=>{const reference={w:260,h:400},ruin={w:900,h:1100};const live=fortressSpriteSize('tower',reference,83,reference),broken=fortressSpriteSize('tower',ruin,83,reference);assert.equal(broken.height,live.height);assert.ok(broken.width>live.width);});
