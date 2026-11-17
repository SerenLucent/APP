import test from 'node:test';
import assert from 'node:assert/strict';
import {dustDirection,updateDustFacing} from '../src/adventure-dust-goblin.js';
test('eight world directions select the matching sheet frame',()=>{
 for(const [x,y,frame] of [[0,1,0],[-1,1,1],[-1,0,2],[-1,-1,3],[0,-1,4],[1,-1,5],[1,0,6],[1,1,7]])assert.equal(dustDirection(x,y),frame);
});
test('movement determines facing and stopping keeps it without borrowing hit direction',()=>{
 const e={x:10,y:10,drawX:9,drawY:11,hitFacing:2};
 assert.equal(updateDustFacing(e,{x:0,y:0}),true);assert.equal(e.facing,5);assert.equal(e.hitFacing,2);
 assert.equal(updateDustFacing(e,{x:0,y:0}),false);assert.equal(e.facing,5);
 e.windup=.3;updateDustFacing(e,{x:10,y:20});assert.equal(e.facing,0);
});
