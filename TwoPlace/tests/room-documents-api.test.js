import test from 'node:test';
import assert from 'node:assert/strict';
import {once} from 'node:events';
import {createServer} from 'node:http';
import {createRoomApi} from '../server/api.js';
test('split SQL API loads content on demand, shares calendar rewards and history, preserves notes and denies foreign rooms',async()=>{
 const api=createRoomApi({dbPath:':memory:'}),server=createServer(api.handle);server.listen(0,'127.0.0.1');await once(server,'listening');
 const base='http://127.0.0.1:'+server.address().port+'/api';
 async function call(path,method='GET',body,token){const response=await fetch(base+path,{method,headers:{'X-TwoPlace-Storage':'2','Content-Type':'application/json',...(token?{Authorization:'Bearer '+token}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,data:await response.json()};}
 try{
  const owner=(await call('/rooms','POST',{})).data,partner=(await call('/rooms/join','POST',{code:owner.code})).data,foreign=(await call('/rooms','POST',{})).data;
  const first=await call('/room','GET',null,owner.token);assert.equal(first.status,200);assert.equal(first.data.storageVersion,2);assert.equal(first.data.petHome.items,undefined);assert.equal(first.data.state.events,undefined);
  const next={revision:0,scope:'calendar',years:['2026'],state:{events:[{id:'event',date:'2026-11-11',title:'데이트',authorRole:'owner'}]}};
  const saved=await call('/room/state','PUT',next,owner.token);assert.equal(saved.status,200);assert.equal(saved.data.petHome.hearts,125);
  assert.equal((await call('/room/state','PUT',next,partner.token)).status,409);
  const calendar=(await call('/room/content','POST',{section:'calendar',years:['2026']},partner.token)).data;assert.equal(calendar.state.events[0].title,'데이트');
  const read=await call('/room/calendar/read','POST',{year:'2026',eventId:'event'},partner.token);assert.equal(read.data.petHome.hearts,126);
  const notes=await call('/room/state','PUT',{revision:1,scope:'notes',state:{notes:[{id:'memo',date:'2026-11-11',body:'따로 저장'}]}},owner.token);assert.equal(notes.status,200);
  const layout=await call('/room/content','POST',{section:'housing'},owner.token);assert.deepEqual(layout.data.petHome.items,[]);
  const history=(await call('/room/history','POST',{kind:'heart',start:'2026-11-11',end:'2026-11-11'},owner.token)).data;assert.equal(history.entries.reduce((n,e)=>n+e.amount,0),6);
  const empty=await call('/room/content','POST',{section:'calendar',years:['2026']},foreign.token);assert.deepEqual(empty.data.state.events,[]);
  assert.equal((await call('/room/content','POST',{section:'housing'})).status,401);
  assert.equal((await call('/room/content','POST',{section:'calendar',years:['../../']},owner.token)).status,400);
 }finally{await new Promise(resolve=>server.close(resolve));api.close();}
});
