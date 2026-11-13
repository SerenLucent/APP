import test from 'node:test';import assert from 'node:assert/strict';import {fixture} from './helpers/gas-fixture.js';
test('GAS private saves isolate players and allow recovery by the same code without exposing raw codes in Drive',()=>{
 const f=fixture(),a='a'.repeat(64),b='b'.repeat(64);
 assert.equal(f.call('/api/save',a).status,401);assert.equal(f.call('/api/player',a,'POST').status,200);f.call('/api/player',b,'POST');
 const result=f.call('/api/action',a,'POST',{type:'adventureStart',mode:'offense',level:1,version:0,actionId:'start-operation-000001'});assert.equal(result.status,200);const run=result.data.adventure.runs.player;f.time(121000);
 const action={type:'adventureFinish',runId:run.id,cleared:['outpost-house'],playTimeMs:120000,version:1,actionId:'finish-operation-00001'};
 const finish=f.call('/api/action',a,'POST',action);assert.equal(finish.status,200);assert.ok(finish.data.adventure.stardust>0);assert.equal(f.call('/api/action',a,'POST',action).data.hearts,finish.data.hearts);
 assert.equal(f.call('/api/player',a,'POST').data.adventure.stardust,finish.data.adventure.stardust);assert.equal(f.call('/api/save',b).data.adventure.stardust,0);
 assert.equal(f.call('/api/history',a,'GET',null,{start:'1970-01-01',end:'1970-01-03'}).data.entries.length,1);
 assert.equal(f.call('/api/action',a,'POST',{type:'place',version:2,actionId:'invalid-operation-0001'}).status,400);
 for(const folder of f.folders.values())for(const file of folder.files)assert.ok(!file.text.includes(a)&&!file.text.includes(b));
});
test('a committed reward with interrupted history flush recovers without double payment',()=>{
 const f=fixture(),token='c'.repeat(64);f.call('/api/player',token,'POST');const start=f.call('/api/action',token,'POST',{type:'adventureStart',mode:'offense',level:1,version:0,actionId:'start-outbox-operation'});f.time(121000);f.failHistory();const action={type:'adventureFinish',runId:start.data.adventure.runs.player.id,cleared:['outpost-house'],playTimeMs:120000,version:1,actionId:'finish-outbox-operation'};
 assert.equal(f.call('/api/action',token,'POST',action).status,500);const recovered=f.call('/api/action',token,'POST',action);assert.equal(recovered.status,200);assert.equal(recovered.data.adventure.totalClears,1);assert.equal(f.call('/api/history',token,'GET',null,{start:'1970-01-01',end:'1970-01-03'}).data.entries.length,1);
});
