import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
import {createHash,createHmac,randomUUID} from 'node:crypto';
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
  const context=vm.createContext({console:{log(){}},Date,Set,Map,PropertiesService:{getScriptProperties:()=>props},UrlFetchApp:{fetch},Utilities:{getUuid:randomUUID,Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeHmacSha256Signature:(value,key)=>Array.from(createHmac('sha256',key).update(value).digest()),computeDigest:(_alg,value)=>Array.from(createHash('sha256').update(value).digest()),base64Encode:value=>Buffer.from(value).toString('base64'),base64Decode:value=>Buffer.from(value,'base64'),newBlob:value=>({getDataAsString:()=>Buffer.from(value).toString('utf8')})},CacheService:{getScriptCache:()=>({get:k=>cache.get(k),put:(k,v)=>cache.set(k,v)})},LockService:{getScriptLock:()=>({tryLock:()=>true,releaseLock(){}})},ContentService:{MimeType:{JSON:'json'},createTextOutput:text=>({setMimeType:()=>text})}});
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

test('Both lost devices recover their own slots, preserve all data and revoke old devices',()=>{
  const h=harness(),owner='1'.repeat(64),partner='2'.repeat(64),freshOwner='3'.repeat(64),freshPartner='4'.repeat(64);
  const password='our-private-phrase';
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner,password}}).data;
  assert.equal(room.recoveryEnabled,true);
  h.call({path:'/rooms/join',method:'POST',body:{code:room.code,requestToken:partner}});
  const state={startDate:'2026-10-22',events:[],notes:[{id:'test-note',date:'2026-10-22',body:'keep our memories'}]};
  assert.equal(h.call({path:'/room/state',method:'PUT',token:owner,body:{state,revision:0}}).status,200);
  const recover=(token,role,p=password)=>h.call({path:'/rooms/recover',method:'POST',body:{code:room.code,password:p,role,requestToken:token}});
  assert.equal(recover(freshOwner,'owner','wrong-password').status,403);
  const recovered=recover(freshOwner,'owner');assert.equal(recovered.status,200);assert.deepEqual(recovered.data.state,state);
  assert.equal(h.call({path:'/room',token:owner}).status,401);
  assert.equal(h.call({path:'/room',token:partner}).status,200);
  assert.equal(recover(freshOwner,'owner').status,200);
  assert.equal(recover(freshPartner,'partner').status,200);
  assert.equal(h.call({path:'/room',token:partner}).status,401);
  const shared=h.call({path:'/room',token:freshPartner}).data;
  assert.deepEqual(shared.state,state);assert.equal(shared.memberCount,2);assert.deepEqual(shared.petHome.items,room.petHome.items);assert.equal(shared.petHome.hearts,room.petHome.hearts);assert.equal(shared.petHome.snacks,room.petHome.snacks);
  assert.ok(![...h.files.values()][0].text.includes(password));
  assert.equal(shared.recovery,undefined);
});

test('Existing rooms opt into recovery; password changes require the old password and attempts are limited',()=>{
  const h=harness(),owner='5'.repeat(64),fresh='6'.repeat(64);
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner}}).data;
  assert.equal(room.recoveryEnabled,false);
  const setup=(password,currentPassword)=>h.call({path:'/room/recovery',method:'PUT',token:owner,body:{password,currentPassword}});
  assert.equal(setup('short').status,400);assert.equal(setup('original-password').status,200);
  assert.equal(setup('new-password','incorrect').status,403);
  assert.equal(setup('new-password','original-password').status,200);
  const recover=p=>h.call({path:'/rooms/recover',method:'POST',body:{code:room.code,role:'owner',requestToken:fresh,password:p}});
  for(let i=0;i<10;i++)assert.equal(recover('original-password').status,403);
  assert.equal(recover('new-password').status,429);
  h.properties['recovery-attempt:'+room.code]=JSON.stringify({at:Date.now()-900001,count:10});
  assert.equal(recover('new-password').status,200);
});

test('couple places use a separate per-room JSON and survive recovery without exposing other rooms',()=>{
  const h=harness(),owner='7'.repeat(64),partner='8'.repeat(64),outsider='9'.repeat(64),fresh='0'.repeat(64);
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner,password:'places-recovery-password'}}).data;
  h.call({path:'/rooms/join',method:'POST',body:{requestToken:partner,code:room.code}});
  h.call({path:'/rooms',method:'POST',body:{requestToken:outsider}});
  const read=t=>h.call({path:'/room/places',token:t});
  assert.equal(read(owner).data.revision,0);
  const place={id:'shared-cafe',canonicalId:'shared-cafe',name:'둘만의 카페',address:'서울 성동구',category:'카페',lat:37.54,lng:127.04,checked:null};
  const saved=h.call({path:'/room/places',method:'PUT',token:owner,body:{revision:0,nickname:'모모',places:[place],reviews:[]}});
  assert.equal(saved.status,200);assert.equal(read(partner).data.places[0].name,place.name);
  assert.equal(read(outsider).data.places.length,0);assert.equal(read('f'.repeat(64)).status,401);
  assert.equal(h.call({path:'/room/places',method:'PUT',token:partner,body:{revision:0,nickname:'쿠키',places:[],reviews:[]}}).status,409);
  assert.ok(h.files.has('TwoPlace/remote-data/couples/'+room.code+'/places.json'));
  const roomJson=JSON.parse(h.files.get('TwoPlace/remote-data/couples/'+room.code+'/room.json').text);
  assert.equal(roomJson.state.events.length,0);assert.equal(roomJson.places,undefined);assert.equal(roomJson.revision,0);
  assert.equal(h.call({path:'/rooms/recover',method:'POST',body:{code:room.code,role:'partner',requestToken:fresh,password:'places-recovery-password'}}).status,200);
  assert.equal(read(partner).status,401);assert.equal(read(fresh).data.places[0].name,place.name);
});
test('Apps Script shares character preferences and preserves schedule authors across partner edits',()=>{
  const h=harness(),owner='a'.repeat(64),partner='b'.repeat(64);
  const room=h.call({path:'/rooms',method:'POST',body:{requestToken:owner}}).data;
  h.call({path:'/rooms/join',method:'POST',body:{code:room.code,requestToken:partner}});
  const save=(token,revision,state)=>h.call({path:'/room/state',method:'PUT',token,body:{revision,state}});
  let state={...room.state,characters:{owner:'momo'}};
  assert.equal(save(owner,0,state).status,200);
  state={...state,characters:{owner:'kuki',partner:'kuki'}};
  let response=save(partner,1,state);assert.equal(response.status,200);assert.deepEqual(response.data.state.characters,{owner:'momo',partner:'kuki'});
  state={...response.data.state,events:[{id:'shift',date:'2026-10-23',title:'근무',kind:'work',workType:'shift',startTime:'09:00',endTime:'19:00',authorRole:'partner'}]};
  response=save(owner,2,state);assert.equal(response.data.state.events[0].authorRole,'owner');
  state=response.data.state;state.events[0].authorRole='partner';state.events[0].endTime='20:00';
  response=save(partner,3,state);assert.equal(response.status,200);assert.equal(response.data.state.events[0].authorRole,'owner');assert.equal(response.data.state.events[0].endTime,'20:00');
});
