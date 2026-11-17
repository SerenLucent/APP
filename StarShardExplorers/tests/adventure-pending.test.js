import test from 'node:test';
import assert from 'node:assert/strict';
import {recoverAdventurePending} from '../src/adventure-pending.js';
function storage(pending){const data=new Map([['pending',JSON.stringify(pending)]]);return {getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)};}
test('stale finish is archived without changing current run, balances or history',()=>{
 const pending={type:'adventureFinish',body:{runId:'old',cleared:['outpost-house']},actionId:'a'},s=storage(pending),home={hearts:20,adventure:{stardust:80,runs:{owner:{id:'new'}},history:[]}},before=structuredClone(home);
 assert.equal(recoverAdventurePending(s,'pending',home,'owner',123),null);assert.equal(s.getItem('pending'),null);assert.deepEqual(JSON.parse(s.getItem('pending:superseded')).pending,pending);assert.deepEqual(home,before);
});
test('current finish and other purchase requests remain retryable',()=>{
 for(const p of [{type:'adventureFinish',body:{runId:'current'},actionId:'a'},{type:'adventurePurchase',body:{product:'hpPotion'},actionId:'b'}]){const s=storage(p);assert.deepEqual(recoverAdventurePending(s,'pending',{adventure:{runs:{owner:{id:'current'}}}},'owner'),p);assert.notEqual(s.getItem('pending'),null);}
});
test('already acknowledged actions leave no pending retry or duplicate reward',()=>{
 const s=storage({type:'adventureFinish',actionId:'done',body:{runId:'old'}});assert.equal(recoverAdventurePending(s,'pending',{adventure:{operations:['done']}},'owner'),null);assert.equal(s.getItem('pending:superseded'),null);
});
