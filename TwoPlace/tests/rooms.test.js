import { test } from 'node:test';
import assert from 'node:assert/strict';
import { createServer } from 'node:http';
import { once } from 'node:events';
import { mkdtempSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { createRoomApi } from '../server/api.js';

async function setup(dbPath = ':memory:') {
  const api = createRoomApi({dbPath});
  const server = createServer(api.handle);
  server.listen(0,'127.0.0.1'); await once(server,'listening');
  const base = `http://127.0.0.1:${server.address().port}/api`;
  return {
    call: async (path, method='GET', body, token, origin) => {
      const res = await fetch(base + path,{method, headers:{...(body ? {'Content-Type':'application/json'} : {}),...(token ? {Authorization:`Bearer ${token}`} : {}),...(origin ? {Origin:origin} : {})},...(body ? {body:JSON.stringify(body)} : {})});
      return {status:res.status, data:await res.json()};
    },
    close: async () => { await new Promise(resolve => server.close(resolve)); api.close(); },
  };
}
test('two independent clients join the same room, share state and reject a third member',async () => {
  const s = await setup();
  try {
    const owner = await s.call('/rooms','POST',{});
    assert.equal(owner.status,201); assert.match(owner.data.code,/^\d{12}$/);
    assert.equal(owner.data.memberCount,1);
    const partner = await s.call('/rooms/join','POST',{code:owner.data.code.match(/.{4}/g).join(' ')});
    assert.equal(partner.status,200); assert.equal(partner.data.code,owner.data.code);
    assert.equal(partner.data.memberCount,2); assert.notEqual(owner.data.token,partner.data.token);
    const state = {startDate:'2026-10-01',events:[{id:'event1',title:'저녁 약속',date:'2026-10-22'}],notes:[{id:'note1',body:'함께 보는 메모',date:'2026-10-22'}]};
    assert.equal((await s.call('/room/state','PUT',{state,revision:0},owner.data.token)).status,200);
    const shared = await s.call('/room','GET',null,partner.data.token);
    assert.deepEqual(shared.data.state,state); assert.equal(shared.data.revision,1);
    assert.equal((await s.call('/room/state','PUT',{state:{...state,notes:[]},revision:0},partner.data.token)).status,409);
    assert.deepEqual((await s.call('/room','GET',null,owner.data.token)).data.state,state);
    assert.equal((await s.call('/rooms/join','POST',{code:owner.data.code})).status,409);
    assert.equal((await s.call('/room')).status,401);
    assert.equal((await s.call('/room','GET',null,'a'.repeat(64))).status,401);
    const other = await s.call('/rooms','POST',{});
    assert.equal((await s.call('/room','GET',null,other.data.token)).data.state.notes.length,0);
  } finally { await s.close(); }
});
test('validates codes, state and browser origins; limits join guessing',async () => {
  const s = await setup();
  try {
    assert.equal((await s.call('/rooms/join','POST',{code:'123'})).status,400);
    assert.equal((await s.call('/rooms/join','POST',{code:'000000000000'})).status,404);
    assert.equal((await s.call('/rooms','POST',{},null,'https://untrusted.invalid')).status,403);
    const owner = await s.call('/rooms','POST',{});
    assert.equal((await s.call('/room/state','PUT',{state:{startDate:'2026-02-30',events:[],notes:[]},revision:0},owner.data.token)).status,400);
    assert.equal((await s.call('/room/state','PUT',{state:{startDate:null,events:[],notes:[null]},revision:0},owner.data.token)).status,400);
    for (let i=0;i<29;i++) await s.call('/rooms/join','POST',{code:'1'});
    assert.equal((await s.call('/rooms/join','POST',{code:'1'})).status,429);
  } finally { await s.close(); }
});
test('rooms and membership survive a server restart',async () => {
  const dir = mkdtempSync(join(tmpdir(),'twoplace-test-'));
  let s;
  try {
    s = await setup(join(dir,'rooms.sqlite'));
    const owner = await s.call('/rooms','POST',{});
    assert.equal((await s.call('/room/pets','POST',{type:'buy',product:'cushion',version:0},owner.data.token)).status,200);
    await s.close(); s = await setup(join(dir,'rooms.sqlite'));
    const restored = await s.call('/room','GET',null,owner.data.token);
    assert.equal(restored.status,200); assert.equal(restored.data.code,owner.data.code);
    assert.equal(restored.data.petHome.hearts,90); assert.equal(restored.data.petHome.items[0].product,'cushion');
  } finally { if (s) await s.close(); rmSync(dir,{recursive:true,force:true}); }
});
test('retrying a timed-out create or join does not consume another member slot',async () => {
  const s = await setup();
  try {
    const requestToken = 'b'.repeat(64);
    const owner = await s.call('/rooms','POST',{requestToken});
    const retry = await s.call('/rooms','POST',{requestToken});
    assert.equal(retry.data.code,owner.data.code); assert.equal(retry.data.memberCount,1);
    const joinBody = {code:owner.data.code,requestToken:'c'.repeat(64)};
    const partner = await s.call('/rooms/join','POST',joinBody);
    const joinRetry = await s.call('/rooms/join','POST',joinBody);
    assert.equal(partner.status,200); assert.equal(joinRetry.status,200);
    assert.equal(joinRetry.data.token,partner.data.token); assert.equal(joinRetry.data.memberCount,2);
  } finally { await s.close(); }
});
test('work, days off, trips and date plans persist for both members with legacy events',async () => {
  const s = await setup();
  try {
    const owner = await s.call('/rooms','POST',{});
    const partner = await s.call('/rooms/join','POST',{code:owner.data.code});
    const events = [
      {id:'legacy',title:'예전 약속',date:'2026-10-22'},
      {id:'work',title:'퇴근',date:'2026-10-22',kind:'work',workType:'leave',time:'19:00',place:'',details:'퇴근 후 연락'},
      {id:'off',title:'휴무',date:'2026-10-23',kind:'work',workType:'off',time:'',place:'',details:''},
      {id:'trip',title:'여행',date:'2026-10-22',kind:'trip',time:'',place:'',details:'기차표와 숙소 예약하기'},
      {id:'date',title:'데이트',date:'2026-10-24',kind:'date',time:'14:30',place:'성수동 카페',details:'커피 마시고 서울숲 산책'},
    ];
    const state = {startDate:null,notes:[],events};
    assert.equal((await s.call('/room/state','PUT',{state,revision:0},owner.data.token)).status,200);
    assert.deepEqual((await s.call('/room','GET',null,partner.data.token)).data.state.events,events);
    const updated = {...state,events:events.map(event => event.id === 'date' ? {...event,place:'한강공원'} : event)};
    assert.equal((await s.call('/room/state','PUT',{state:updated,revision:1},partner.data.token)).status,200);
    assert.deepEqual((await s.call('/room','GET',null,owner.data.token)).data.state,updated);
    for (const invalid of [
      {...events[1],time:'25:00'}, {...events[1],time:''}, {...events[2],time:'19:00'},
      {...events[1],workType:'unknown'}, {...events[3],kind:'unknown'},
      {...events[4],place:'x'.repeat(201)}, {...events[3],details:'x'.repeat(5001)},
    ]) {
      assert.equal((await s.call('/room/state','PUT',{state:{...state,events:[invalid]},revision:2},owner.data.token)).status,400);
    }
  } finally { await s.close(); }
});
test('pet wallet, food and furniture are shared; stale simultaneous purchases cannot double spend',async()=>{
  const s=await setup();
  try{
    const owner=(await s.call('/rooms','POST',{})).data;
    const partner=(await s.call('/rooms/join','POST',{code:owner.code})).data;
    assert.equal(owner.petHome.hearts,120);assert.equal(partner.petHome.snacks,4);
    const results=await Promise.all([
      s.call('/room/pets','POST',{type:'buy',product:'plant',version:0},owner.token),
      s.call('/room/pets','POST',{type:'buy',product:'table',version:0},partner.token),
    ]);
    assert.deepEqual(results.map(r=>r.status).sort(),[200,409]);
    let shared=(await s.call('/room','GET',null,partner.token)).data;
    assert.equal(shared.petHome.items.length,1);assert.equal(shared.petHome.version,1);
    const balance=shared.petHome.hearts;
    const item=shared.petHome.items[0];
    assert.equal((await s.call('/room/pets','POST',{type:'place',item:item.id,space:'home',x:45,y:64,version:1},partner.token)).status,200);
    assert.equal((await s.call('/room','GET',null,owner.token)).data.petHome.items[0].space,'home');
    assert.equal((await s.call('/room/pets','POST',{type:'feed',pet:'kuki',version:2},owner.token)).status,200);
    shared=(await s.call('/room','GET',null,partner.token)).data;
    assert.equal(shared.petHome.pets.kuki.hunger,100);assert.equal(shared.petHome.snacks,3);
    assert.equal((await s.call('/room/pets','POST',{type:'claim',version:3},owner.token)).status,400);
    assert.equal((await s.call('/room/pets','POST',{type:'buy',product:'snack',version:3})).status,401);
    const update=await s.call('/room/state','PUT',{revision:0,state:{startDate:null,events:[],notes:[],hearts:999999,petHome:{hearts:999999}}},owner.token);
    assert.equal(update.status,200);assert.equal(update.data.petHome.hearts,balance);
    assert.equal(update.data.petHome.items[0].space,'home');
  }finally{await s.close();}
});
