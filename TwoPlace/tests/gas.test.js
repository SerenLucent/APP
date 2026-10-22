import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash,randomUUID} from 'node:crypto';
function harness(){
  let count=0;const properties={GITHUB_TOKEN:'test-token'},files=new Map(),cache=new Map();
  const props={getProperty:k=>properties[k]||null,setProperty:(k,v)=>{properties[k]=v;},setProperties:o=>Object.assign(properties,o),getProperties:()=>({...properties})};
  const response=(status,value)=>({getResponseCode:()=>status,getContentText:()=>JSON.stringify(value)});
  const fetch=(url,options)=>{
    assert.equal(options.headers.Authorization,'Bearer test-token');
    const prefix='https://api.github.com/repos/SerenLucent/APP';assert.ok(url.startsWith(prefix));
    if(url===prefix)return response(200,{permissions:{push:true}});
    const path=decodeURIComponent(url.slice((prefix+'/contents/').length).split('?')[0]);
    assert.match(path,/^TwoPlace\/remote-data\/couples\//);
    const existing=files.get(path);
    if(options.method==='get')return existing?response(200,{sha:existing.sha,content:Buffer.from(existing.text).toString('base64')}):response(404,{});
    const body=JSON.parse(options.payload);
    if((existing&&body.sha!==existing.sha)||(!existing&&body.sha))return response(409,{});
    const sha='sha'+(++count);files.set(path,{name:path.split('/').at(-1),text:Buffer.from(body.content,'base64').toString('utf8'),sha});
    return response(200,{content:{sha}});
  };
  const context=vm.createContext({console:{log(){}},Date,Set,Map,PropertiesService:{getScriptProperties:()=>props},UrlFetchApp:{fetch},Utilities:{getUuid:randomUUID,Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_alg,value)=>Array.from(createHash('sha256').update(value).digest()),base64Encode:value=>Buffer.from(value).toString('base64'),base64Decode:value=>Buffer.from(value,'base64'),newBlob:value=>({getDataAsString:()=>Buffer.from(value).toString('utf8')})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>text})}});
  vm.runInContext(fs.readFileSync('gas/Code.gs','utf8'),context);
  context.setupTwoPlace();
  return {context,files,properties,call:req=>JSON.parse(context.doPost({postData:{contents:JSON.stringify(req)}}))};
}

test('Apps Script creates GitHub per-couple JSON, retries safely and shares only the authenticated room',()=>{
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
  const bought=h.call({path:'/room/pets',method:'POST',token:owner,body:{type:'buy',product:'plant',version:0}});
  assert.equal(bought.status,200);assert.equal(bought.data.petHome.items.length,1);
  const item=bought.data.petHome.items[0];
  const placed=h.call({path:'/room/pets',method:'POST',token:partner,body:{type:'place',item:item.id,version:1,space:'momoRoom',x:45,y:64}});
  assert.equal(placed.status,200);assert.equal(h.call({path:'/room',token:owner}).data.petHome.items[0].space,'momoRoom');
});
test('GAS admin requires a separate token, checks versions and backs up edits',()=>{
  const h=harness(),owner='d'.repeat(64);
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner}}).data;
  const token=h.context.issueAdminToken();
  assert.equal(h.call({path:'/admin/rooms',token}).data.rooms[0].code,room.code);
  const body={code:room.code,revision:room.revision,petVersion:room.petHome.version,state:{startDate:'2026-10-22',events:[],notes:[]},petHome:{...room.petHome,hearts:999}};
  const saved=h.call({path:'/admin/room',method:'PUT',token,body});
  assert.equal(saved.status,200);assert.equal(saved.data.petHome.hearts,999);assert.equal(h.files.size,2);
  assert.ok([...h.files.keys()].some(path=>path.includes('/backups/')));
  assert.equal(h.call({path:'/admin/room',method:'PUT',token,body}).status,409);
  h.context.issueAdminToken();assert.equal(h.call({path:'/admin/rooms',token}).status,403);
});

test('GitHub writes are restricted to TwoPlace and stale Git SHAs cannot overwrite edits',()=>{
  const h=harness(),owner='e'.repeat(64);
  assert.throws(()=>h.context.writeJson_('OtherApp/room.json',{},null));
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner}}).data;
  const path='TwoPlace/remote-data/couples/'+room.code+'/room.json';
  const stale=h.context.readRoom_(path);
  h.context.saveRoom_(h.context.readRoom_(path));
  assert.throws(()=>h.context.saveRoom_(stale),e=>e.status===409);
  delete h.properties.GITHUB_TOKEN;
  assert.throws(()=>h.context.setupTwoPlace(),e=>e.status===503);
});
