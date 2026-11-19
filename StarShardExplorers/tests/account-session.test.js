import test from 'node:test';
import assert from 'node:assert/strict';
import {clearPlayerSession} from '../src/account-session.js';
const key='star-shard-explorers:gas-player:v1',pending='star-shard-explorers:gas-pending:v1';
function storage(values){return Object.assign({...values},{getItem(k){return this[k]??null;},removeItem(k){delete this[k];}});}
test('logout clears device credentials and pending email login without removing unrelated preferences',()=>{
 const s=storage({[key]:'old-token',[key+':email-login']:'pending-login',sound:'off'});
 clearPlayerSession(s,pending);assert.equal(s.getItem(key),null);assert.equal(s.getItem(key+':email-login'),null);assert.equal(s.sound,'off');
});
test('unfinished save prevents logout and preserves the current account',()=>{
 const s=storage({[key]:'old-token',[pending]:'unfinished'});assert.throws(()=>clearPlayerSession(s,pending),/저장/);assert.equal(s.getItem(key),'old-token');assert.equal(s.getItem(pending),'unfinished');
});
