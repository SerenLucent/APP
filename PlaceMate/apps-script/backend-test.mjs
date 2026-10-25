import vm from 'node:vm';
import {readFileSync} from 'node:fs';
import assert from 'node:assert/strict';
import {createHash, randomUUID} from 'node:crypto';
const context=vm.createContext({console,Utilities:{getUuid:randomUUID,computeDigest:(_,value)=>[...createHash('sha256').update(value).digest()],DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'utf8'}}});
vm.runInContext(readFileSync(new URL('./PlaceMate.gs',import.meta.url),'utf8'),context);
const store=new Map(),copy=v=>v==null?null:JSON.parse(JSON.stringify(v));
function command(uid,action,payload={}){const staged=new Map(),tx={read:p=>staged.has(p)?staged.get(p):copy(store.get(p)),write:(p,v)=>staged.set(p,v)};const result=context.dispatch_(tx,uid,action,payload);for(const [p,v]of staged){assert.ok(p.startsWith('PlaceMate/'));store.set(p,copy(v));}return copy(result);}
const a='u_'+'a'.repeat(64),b='u_'+'b'.repeat(64),c='u_'+'c'.repeat(64);
const person=id=>copy(store.get(`PlaceMate/users/${id}/personal.json`));
const room=key=>copy(store.get(`PlaceMate/rooms/${key}/room.json`));
const merged=key=>copy(store.get(`PlaceMate/rooms/${key}/merged.json`));
const mustFail=(fn,code)=>assert.throws(fn,e=>e.pmCode===code);
for(const [id,nickname]of [[a,'방장'],[b,'메이트'],[c,'외부인']])command(id,'register',{nickname});
const r1=command(a,'createRoom',{name:'친구방'}).room.key;
const r2=command(a,'createRoom',{name:'여행방'}).room.key;
mustFail(()=>command(b,'getRoom',{roomKey:r1}),'NOT_A_MEMBER');
command(b,'requestJoin',{roomKey:r1});
assert.equal(room(r1).members.length,1);
mustFail(()=>command(b,'getRoom',{roomKey:r1}),'NOT_A_MEMBER');
mustFail(()=>command(b,'approve',{roomKey:r1,userId:c,expectedRevision:room(r1).revision}),'NOT_A_MEMBER');
command(a,'approve',{roomKey:r1,userId:b,expectedRevision:room(r1).revision});
command(b,'requestJoin',{roomKey:r2});command(a,'approve',{roomKey:r2,userId:b,expectedRevision:room(r2).revision});
const place={id:'own-place',canonicalId:'common-cafe',name:'카페',category:'카페',address:'성수',lat:37.54,lng:127.04};
let p=person(b);
command(b,'savePersonal',{expectedRevision:p.revision,nickname:p.nickname,places:[place],visits:[{canonicalId:'common-cafe',visited:true,rating:5,custom:[{label:'의자 편안함',score:2}],comment:'커피는 좋아요'}]});
assert.equal(merged(r1).places.length,0,'new places are never automatically shared');
for(const key of[r1,r2])command(b,'share',{roomKey:key,expectedRevision:room(key).revision,placeIds:['own-place']});
assert.equal(merged(r1).visits[0].custom[0].label,'의자 편안함');
mustFail(()=>command(a,'share',{roomKey:r1,expectedRevision:room(r1).revision,placeIds:['own-place']}),'NOT_YOUR_PLACE');
p=person(b);place.name='수정된 카페';
command(b,'savePersonal',{expectedRevision:p.revision,nickname:p.nickname,places:[place],visits:p.visits});
assert.equal(merged(r1).places[0].name,'수정된 카페');assert.equal(merged(r2).places[0].name,'수정된 카페');
mustFail(()=>command(b,'savePersonal',{expectedRevision:p.revision,nickname:p.nickname,places:[],visits:[]}),'STALE_REVISION');
command(a,'ban',{roomKey:r1,userId:b,expectedRevision:room(r1).revision});
assert.equal(merged(r1).places.length,0);assert.equal(merged(r1).visits.length,0);
assert.equal(merged(r2).places.length,1);assert.equal(person(b).places.length,1);assert.equal(person(b).visits.length,1);
mustFail(()=>command(b,'getRoom',{roomKey:r1}),'NOT_A_MEMBER');
mustFail(()=>command(b,'requestJoin',{roomKey:r1}),'BANNED');
command(a,'unban',{roomKey:r1,userId:b,expectedRevision:room(r1).revision});
command(b,'requestJoin',{roomKey:r1});command(a,'approve',{roomKey:r1,userId:b,expectedRevision:room(r1).revision});
assert.equal(merged(r1).places.length,0,'rejoining does not restore sharing without consent');
command(a,'transfer',{roomKey:r1,userId:b,expectedRevision:room(r1).revision});
assert.equal(room(r1).masterId,b);
mustFail(()=>command(a,'ban',{roomKey:r1,userId:b,expectedRevision:room(r1).revision}),'MASTER_ONLY');
mustFail(()=>command(b,'leave',{roomKey:r1,expectedRevision:room(r1).revision}),'TRANSFER_BEFORE_LEAVE');
command(a,'leave',{roomKey:r1,expectedRevision:room(r1).revision});assert.equal(room(r1).members.length,1);
p=person(b);command(b,'savePersonal',{expectedRevision:p.revision,nickname:p.nickname,places:[],visits:p.visits});
assert.equal(merged(r2).places.length,0);assert.equal(merged(r2).visits.length,0);assert.equal(person(b).visits.length,1);
mustFail(()=>context.validatePlaces_([{...place,id:'../../escape'}]),'INVALID_ID');
mustFail(()=>context.validateVisits_([{canonicalId:'x',visited:false,custom:[],rating:null}]),'VISIT_REQUIRED');
mustFail(()=>context.validateVisits_([{canonicalId:'x',visited:true,custom:[{label:'주차',score:0}],rating:null}]),'INVALID_SCORE');
assert.equal(context.validateVisits_([{canonicalId:'x',visited:true,custom:[],rating:null}])[0].rating,null);
console.log('PASS: approval, authorization, opt-in sharing, cross-room sync, stale-write protection, bans, preserved personal data, rejoin, delegation, leaving, deletion and validation');

// Verify actual Git tree transaction orchestration without live credentials.
const calls=[];
context.github_=(_cfg,method,path,body,allow404)=>{
  calls.push({method,path,body});
  if(path.startsWith('/git/ref/'))return {object:{sha:'head-1'}};
  if(path==='/git/commits/head-1')return {tree:{sha:'base-tree'}};
  if(path.startsWith('/contents/')){assert.ok(path.endsWith('?ref=head-1'));assert.equal(allow404,true);return null;}
  if(path==='/git/trees')return {sha:'new-tree'};
  if(path==='/git/commits')return {sha:'new-commit'};
  if(path.startsWith('/git/refs/'))return {};
  throw new Error('Unexpected API call '+path);
};
const tx=context.transaction_({branch:'main'});
assert.equal(tx.read(`PlaceMate/users/${a}/personal.json`),null);
tx.write(`PlaceMate/users/${a}/personal.json`,{id:a});
tx.write('PlaceMate/rooms/ABCDEF123456/room.json',{revision:1});
tx.write('PlaceMate/rooms/ABCDEF123456/merged.json',{revision:1});
tx.commit('PlaceMate: test');
const treeCall=calls.find(c=>c.path==='/git/trees');
assert.equal(treeCall.body.base_tree,'base-tree');
assert.equal(treeCall.body.tree.length,3);
assert.ok(treeCall.body.tree.every(e=>e.path.startsWith('PlaceMate/')));
assert.equal(calls.filter(c=>c.path==='/git/commits').length,1);
assert.equal(calls.at(-1).body.force,false);
assert.equal(calls.at(-1).body.sha,'new-commit');
mustFail(()=>tx.write('투플레이스/config.json',{}),'INVALID_PATH');
console.log('PASS: commit-pinned reads, preserved base tree, one atomic multi-file commit, non-force update and app-folder isolation');

// Same deployment settings as TwoPlace: token-only setup targets public APP/main.
let released=false;
context.PropertiesService={getScriptProperties:()=>({getProperty:name=>name==='GITHUB_TOKEN'?'test-token':null})};
context.LockService={getScriptLock:()=>({tryLock:()=>true,hasLock:()=>true,releaseLock:()=>{released=true;}})};
const config=context.config_();
assert.equal(config.owner,'SerenLucent');assert.equal(config.repo,'APP');assert.equal(config.branch,'main');
const priorGitHub=context.github_;
context.github_=(cfg,method,path,body,allow404)=>{
  assert.equal(cfg.owner,'SerenLucent');assert.equal(cfg.repo,'APP');
  // Public repository must not be rejected; setup may inspect it, API does not need to.
  if(path==='')return {private:false,permissions:{push:true}};
  return priorGitHub(cfg,method,path,body,allow404);
};
assert.match(context.setupPlaceMate(),/SerenLucent\/APP \(main\)/);
calls.length=0;
const created=context.placeMateApi({action:'register',personalKey:'f'.repeat(64),payload:{nickname:'공개 APP 테스트'}});
assert.equal(created.ok,true);
assert.equal(released,true);
assert.ok(calls.find(c=>c.path==='/git/trees').body.tree.every(e=>e.path.startsWith('PlaceMate/users/')));
assert.equal(calls.filter(c=>c.path==='/git/refs/heads/main').length,1);
context.PropertiesService={getScriptProperties:()=>({getProperty:name=>({GITHUB_TOKEN:'test-token',GITHUB_OWNER:'another-owner',GITHUB_REPO:'another-app',GITHUB_BRANCH:'data'}[name]||null)})};
const overridden=context.config_();assert.equal(overridden.owner,'another-owner');assert.equal(overridden.repo,'another-app');assert.equal(overridden.branch,'data');
console.log('PASS: public APP registration, TwoPlace-compatible token-only defaults, configured branch, lock release and PlaceMate-only generated paths');

const wish=context.validatePlaces_([{id:'wish1',canonicalId:'wish1',name:'전시장',address:'서울',category:'전시',lat:37.5,lng:127,wanted:true}]);assert.equal(wish[0].wanted,true);assert.equal(wish[0].category,'전시');assert.equal(context.validatePlaces_([{...wish[0],wanted:undefined}])[0].wanted,false);console.log('PASS: wishlist/custom category persistence and legacy default');
