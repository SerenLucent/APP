import test from 'node:test';import assert from 'node:assert/strict';import {mkdtempSync,rmSync,readFileSync} from 'node:fs';import {tmpdir} from 'node:os';import {join} from 'node:path';
import {createPlayerStore} from '../server/store.js';
import {createGameServer} from '../server/index.js';
import {createObstacles,EXPLORATION_FIELD_VERSION,DEFENSE_WAVES} from '../shared/adventure-field.js';
const a='a'.repeat(64),b='b'.repeat(64);
function clear(s,token,mode='explore',n=0){let state=s.get(token);state=s.action(token,{type:'adventureStart',mode,fieldVersion:EXPLORATION_FIELD_VERSION,level:1,version:state.version,actionId:'start-operation-'+mode+'-'+n},1000);const run=state.adventure.runs.player,objects=createObstacles(run.seed,EXPLORATION_FIELD_VERSION);const cleared=mode==='offense'?['outpost-house']:mode==='defense'?DEFENSE_WAVES.flatMap((count,w)=>Array.from({length:count},(_,i)=>`defense-${w+1}-${i}`)):[...objects.filter(o=>o.type==='tree').slice(0,50),...objects.filter(o=>o.type==='rock').slice(0,30)].map(o=>o.id);const action={type:'adventureFinish',runId:run.id,cleared,pet:'momo',playTimeMs:120000,version:state.version,actionId:'finish-operation-'+mode+'-'+n};return {action,state:s.action(token,action,121000)};}
test('individual saves persist across restarts, rewards never cross to another player and retries never double pay',()=>{
 const dir=mkdtempSync(join(tmpdir(),'star-shard-')),file=join(dir,'players.sqlite');let s=createPlayerStore(file);try{
  assert.equal(s.create(a).adventure.stardust,0);assert.equal(s.create(a).adventure.points,0);s.create(b);
  for(const [n,mode] of ['explore','offense','defense'].entries()){const result=clear(s,a,mode,n);assert.ok(result.state.adventure.stardust>0);assert.equal(result.state.adventure.history.length,0);const duplicate=s.action(a,result.action,121001);assert.equal(duplicate.hearts,result.state.hearts);}
  assert.equal(s.get(b).hearts,0);assert.equal(s.get(b).adventure.stardust,0);assert.equal(s.get(a).adventure.totalClears,3);
  assert.equal(s.history(a,'1970-01-01','1970-01-02').entries.length,3);assert.equal(s.history(b,'1970-01-01','1970-01-02').entries.length,0);
  const before=s.get(a),after=s.action(a,{type:'adventurePurchase',product:'hpPotion',quantity:2,version:before.version,actionId:'purchase-operation-00001'});assert.equal(after.adventure.hpPotions,2);assert.equal(after.adventure.stardust,before.adventure.stardust-10);
  assert.throws(()=>s.action(a,{type:'adventurePurchase',product:'hpPotion',version:0,actionId:'stale-operation-00001'}),e=>e.status===409);
  assert.throws(()=>s.action(a,{type:'buy',product:'plant'}),e=>e.status===400);
  s.close();s=createPlayerStore(file);assert.equal(s.get(a).adventure.hpPotions,2);assert.equal(s.create(a).adventure.totalClears,3);assert.ok(!readFileSync(file).includes(Buffer.from(a)));
 }finally{s.close();rmSync(dir,{recursive:true,force:true});}
});
test('public API creates isolated players, requires recovery token and rejects unrelated mutations and origins',async()=>{
 const server=createGameServer({database:':memory:'});await new Promise(r=>server.listen(0,'127.0.0.1',r));const base='http://127.0.0.1:'+server.address().port;
 try{
  let r=await fetch(base+'/api/save');assert.equal(r.status,401);
  r=await fetch(base+'/api/player',{method:'POST',headers:{Authorization:'Bearer '+a}});assert.equal(r.status,200);assert.equal((await r.json()).adventure.stardust,0);
  r=await fetch(base+'/api/player',{method:'POST',headers:{Authorization:'Bearer '+b}});assert.equal(r.status,200);
  r=await fetch(base+'/api/action',{method:'POST',headers:{Authorization:'Bearer '+a,'Content-Type':'application/json'},body:JSON.stringify({type:'place',item:'x'})});assert.equal(r.status,400);
  r=await fetch(base+'/api/save',{headers:{Authorization:'Bearer '+a,Origin:'https://unrelated.example'}});assert.equal(r.status,403);
  r=await fetch(base+'/api/health');assert.equal((await r.json()).game,'StarShardExplorers');
 }finally{await new Promise(r=>server.close(r));}
});
import {mineOreLimits} from '../shared/adventure-mine-field.js';
test('mine rewards save only once and stay outside the heart roulette',()=>{
 const s=createPlayerStore(':memory:');try{
  let state=s.create(a);state=s.action(a,{type:'adventureStart',mode:'mine',level:1,version:0,actionId:'mine-start-operation-0001'},1000);
  const run=state.adventure.runs.player,[id,amount]=mineOreLimits(run.seed,1).entries().next().value;
  const action={type:'adventureFinish',runId:run.id,pet:'kuki',mineProof:{[id]:amount},brokenOres:[id],playTimeMs:180000,version:state.version,actionId:'mine-finish-operation-001'};
  assert.throws(()=>s.action(a,action,180000),/3분/);
  const result=s.action(a,action,181000);assert.equal(result.hearts,0);assert.equal(result.adventure.stardust,amount);assert.equal(s.action(a,action,181001).adventure.stardust,amount);assert.equal(s.history(a,'1970-01-01','1970-01-02').entries[0].mode,'mine');
 }finally{s.close();}
});
