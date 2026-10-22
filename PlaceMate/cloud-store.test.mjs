import assert from 'node:assert/strict';
import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import {randomUUID,webcrypto} from 'node:crypto';
import {CloudStore,cloudError} from './cloud-store.js';
import {createPlaceMateClient,generatePersonalKey} from './cloud-client.js';

const ctx=vm.createContext({Utilities:{getUuid:randomUUID}});
vm.runInContext(readFileSync('apps-script/PlaceMate.gs','utf8'),ctx);
const files=new Map(),copy=v=>v==null?null:JSON.parse(JSON.stringify(v));
function client(uid){return {async call(action,payload={}){
  const staged=new Map(),tx={read:path=>staged.has(path)?staged.get(path):copy(files.get(path)),write:(path,value)=>staged.set(path,value)};
  const result=ctx.dispatch_(tx,uid,action,payload);for(const [path,value]of staged)files.set(path,copy(value));return copy(result);
}};}
const a='u_'+'a'.repeat(64),b='u_'+'b'.repeat(64);
const ca=client(a),cb=client(b);
await ca.call('register',{nickname:'방장'});await cb.call('register',{nickname:'메이트'});
const sa=new CloudStore(ca),sb=new CloudStore(cb);
await sa.refresh();await sb.refresh();
assert.equal(sa.toView().users[0].name,'방장');
const first=await ca.call('createRoom',{name:'친구방'});
const second=await ca.call('createRoom',{name:'여행방'});
for(const roomKey of [first.room.key,second.room.key]){
  await cb.call('requestJoin',{roomKey});
  const snapshot=await ca.call('getRoom',{roomKey});
  assert.equal(snapshot.pendingProfiles[0].nickname,'메이트');
  await ca.call('approve',{roomKey,expectedRevision:snapshot.room.revision,userId:b});
}
let db=await sb.refresh();
db.places.push({id:'cafe1',canonicalId:'shared-cafe',name:'카페',category:'카페',address:'서울',lat:37.5,lng:127,owner:'me',rooms:[]});
db.reviews.push({place:'shared-cafe',user:'me',visited:true,rating:0,custom:[{label:'의자',score:2}],comment:'내 기준'});
await sb.saveView(db);db=await sb.refresh();
assert.equal(db.places[0].rooms.length,0);
for(const r of db.rooms)await cb.call('share',{roomKey:r.id,expectedRevision:r.revision,placeIds:['cafe1']});
let view=await sa.refresh();assert.equal(view.places.length,1);assert.equal(view.places[0].rooms.length,2);
assert.equal(view.reviews[0].place,'shared-cafe');assert.equal(view.reviews[0].rating,0);
// Visiting a mate's shared place uses the same canonical identity without taking ownership.
view.reviews.push({place:'shared-cafe',user:'me',visited:true,rating:5,custom:[],comment:'나도 가봤어요'});
await sa.saveView(view);view=await sa.refresh();
assert.equal(view.reviews.filter(r=>r.user==='me').length,1);
assert.equal(view.places.filter(p=>p.owner==='me').length,0);
// Removing my visit must not resurrect it from a stale merged snapshot.
view.reviews=view.reviews.filter(r=>r.user!=='me');await sa.saveView(view);view=await sa.refresh();
assert.equal(view.reviews.filter(r=>r.user==='me').length,0);
// Saving a mate's place creates an independent original, reusing canonical visits.
view.places.push({...view.places[0],id:'copy-cafe',owner:'me',rooms:[]});
await sa.saveView(view);view=await sa.refresh();
assert.equal(view.places.filter(p=>p.owner==='me').length,1);
assert.equal(view.places.find(p=>p.owner==='me').canonicalId,'shared-cafe');
await sa.command('ban',{roomKey:first.room.key,expectedRevision:view.rooms.find(r=>r.id===first.room.key).revision,userId:b});
db=await sb.refresh();assert.equal(db.rooms.length,1);assert.equal(db.places[0].owner,'me');assert.equal(db.reviews[0].comment,'내 기준');

// Transport reports server-side failures instead of pretending a save worked.
const originalFetch=globalThis.fetch;
try{
  let captured;
  globalThis.fetch=async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({ok:false,error:'PRIVATE_REPOSITORY_REQUIRED'})};};
  const key='f'.repeat(64),api=createPlaceMateClient({endpoint:'https://script.google.com/macros/s/example/exec',personalKey:key});
  await assert.rejects(api.call('getPersonal'),e=>e.code==='PRIVATE_REPOSITORY_REQUIRED');
  assert.equal(captured.options.headers['Content-Type'],'text/plain;charset=utf-8');
  assert.equal(captured.url.includes(key),false);
  assert.equal(captured.options.mode,undefined);
  assert.equal(JSON.parse(captured.options.body).personalKey,key);
  assert.match(cloudError({code:'PRIVATE_REPOSITORY_REQUIRED'}),/새 버전/);
  assert.match(generatePersonalKey(),/^[a-f0-9]{64}$/);
}finally{globalThis.fetch=originalFetch;}
console.log('PASS: frontend↔backend schema, identity mapping, canonical visits, opt-in sharing, cross-room reads, ban refresh, no stale own visits, recovery-key generation and transport error handling');

