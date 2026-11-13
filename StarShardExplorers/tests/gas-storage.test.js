import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';import {createHash,randomUUID} from 'node:crypto';
function fixture(){
 let now=1000,failHistory=false;const folders=new Map(),props=new Map(),cache=new Map();
 const iterator=items=>{let i=0;return {hasNext:()=>i<items.length,next:()=>items[i++]};};
 class Folder{constructor(name){this.name=name;this.id=randomUUID();this.children=[];this.files=[];folders.set(this.id,this);}getId(){return this.id;}getName(){return this.name;}getFoldersByName(name){return iterator(this.children.filter(f=>f.name===name));}createFolder(name){const f=new Folder(name);this.children.push(f);return f;}getFilesByName(name){return iterator(this.files.filter(f=>f.name===name));}createFile(name,text){if(failHistory&&name.startsWith('clear_')){failHistory=false;throw Error('simulated Drive failure');}const f={name,text,getBlob(){return {getDataAsString:()=>this.text};},setContent(text){this.text=text;}};this.files.push(f);return f;}}
 const context=vm.createContext({console:{log(){}},Date:class extends Date{constructor(...args){super(...(args.length?args:[now]));}static now(){return now;}},Utilities:{getUuid:randomUUID,DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'},computeDigest:(_,text)=>[...createHash('sha256').update(text).digest()],formatDate:(date)=>new Date(Number(date)+9*3600000).toISOString().slice(0,10)},PropertiesService:{getScriptProperties:()=>({getProperty:k=>props.get(k),setProperty:(k,v)=>props.set(k,v)})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v),remove:k=>cache.delete(k)})},DriveApp:{createFolder:name=>new Folder(name),getFolderById:id=>{if(!folders.has(id))throw Error('missing folder');return folders.get(id);}},MimeType:{PLAIN_TEXT:'text/plain'},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType(){return JSON.parse(text);}})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})}});
 vm.runInContext(fs.readFileSync('gas/Code.gs','utf8'),context);context.setupStarShardExplorers();
 return {context,folders,call:(path,token,method='GET',body,query)=>context.doPost({postData:{contents:JSON.stringify({path,token,method,body,query})}}),time:v=>now=v,failHistory:()=>failHistory=true};
}
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
