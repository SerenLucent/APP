import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
function harness(){
  let count=0;const properties={},files=new Map(),folders=new Map(),cache=new Map();
  function folder(name){const id='folder'+(++count),f={name,id,getId:()=>id,createFolder:n=>folder(n),createFile:(name,text)=>{const id='file'+(++count),file={name,text,getId:()=>id,getBlob:()=>({getDataAsString:()=>file.text}),setContent:t=>{file.text=t;},getParents:()=>{let read=false;return {hasNext:()=>!read,next:()=>{read=true;return f;}};}};files.set(id,file);return file;}};folders.set(id,f);return f;}
  const props={getProperty:k=>properties[k]||null,setProperty:(k,v)=>{properties[k]=v;},setProperties:o=>Object.assign(properties,o),getProperties:()=>({...properties})};
  const context=vm.createContext({console:{log(){}},Date,Set,Map,PropertiesService:{getScriptProperties:()=>props},DriveApp:{createFolder:folder,getFolderById:id=>folders.get(id),getFileById:id=>files.get(id)},MimeType:{PLAIN_TEXT:'text/plain'},Utilities:{getUuid:randomUUID,Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_alg,value)=>Array.from(createHash('sha256').update(value).digest())},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>text})}});
  vm.runInContext(fs.readFileSync('gas/Code.gs','utf8'),context);
  context.setupTwoPlace();
  return {context,files,call:req=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(req)}}))};
}
test('GAS creates private per-couple JSON, retries safely and shares only the authenticated room',()=>{
  const h=harness(),owner='a'.repeat(64),partner='b'.repeat(64),third='c'.repeat(64);
  const create=h.call({path:'/rooms',method:'POST',body:{requestToken:owner}});
  assert.equal(create.status,200);const code=create.data.code;
  assert.match(code,/^\d{12}$/);assert.equal(h.files.size,1);assert.equal([...h.files.values()][0].name,'room.json');
  assert.equal(h.call({path:'/rooms',method:'POST',body:{requestToken:owner}}).data.code,code);assert.equal(h.files.size,1);
  assert.equal(h.call({path:'/rooms/join',method:'POST',body:{code,requestToken:partner}}).data.memberCount,2);
  assert.equal(h.call({path:'/rooms/join',method:'POST',body:{code,requestToken:partner}}).status,200);
  assert.equal(h.call({path:'/rooms/join',method:'POST',body:{code,requestToken:third}}).status,409);
  const state={startDate:'2026-10-22',events:[],notes:[]};
  assert.equal(h.call({path:'/room/state',method:'PUT',token:owner,body:{revision:0,state}}).status,200);
  const shared=h.call({path:'/room',token:partner});assert.deepEqual(shared.data.state,state);assert.equal(shared.data.members,undefined);
  assert.equal(h.call({path:'/room/state',method:'PUT',token:partner,body:{revision:0,state}}).status,409);
  assert.equal(h.call({path:'/room',token:third}).status,401);
  assert.equal(h.call({path:'/admin/rooms',token:owner}).status,403);
});
test('GAS admin requires a separate token, checks versions and backs up edits',()=>{
  const h=harness(),owner='d'.repeat(64);
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner}}).data;
  const token=h.context.issueAdminToken();
  assert.equal(h.call({path:'/admin/rooms',token}).data.rooms[0].code,room.code);
  const body={code:room.code,revision:room.revision,petVersion:room.petHome.version,state:{startDate:'2026-10-22',events:[],notes:[]},petHome:{...room.petHome,hearts:999}};
  const saved=h.call({path:'/admin/room',method:'PUT',token,body});
  assert.equal(saved.status,200);assert.equal(saved.data.petHome.hearts,999);assert.equal(h.files.size,2);
  assert.ok([...h.files.values()].some(file=>file.name.startsWith('backup_')));
  assert.equal(h.call({path:'/admin/room',method:'PUT',token,body}).status,409);
  h.context.issueAdminToken();assert.equal(h.call({path:'/admin/rooms',token}).status,403);
});
