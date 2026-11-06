import test from 'node:test';import assert from 'node:assert/strict';import {drawEnvironmentProp} from '../src/adventure-environment.js';
test('missing sprites retain the original renderer fallback',()=>{assert.equal(drawEnvironmentProp({},'tree',{x:0,y:0},{width:66,height:144}),false);});
