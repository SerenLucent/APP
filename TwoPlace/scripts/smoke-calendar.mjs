import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes,randomUUID} from 'node:crypto';
const endpoint=JSON.parse(fs.readFileSync('public/web-config.json','utf8')).apiUrl;
const owner=randomBytes(32).toString('hex'),partner=randomBytes(32).toString('hex');
async function call(path,method,body,token){
  const response=await fetch(endpoint+'?request='+randomUUID(),{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({path,method,body,token}),signal:AbortSignal.timeout(60000)});
  const result=await response.json();assert.equal(result.status,200,JSON.stringify(result));return result.data;
}
const room=await call('/rooms','POST',{requestToken:owner});
await call('/rooms/join','POST',{code:room.code,requestToken:partner});
const events=['2026-10-23','2026-10-24','2026-10-25'].map(date=>({id:randomUUID(),date,title:'근무',kind:'work',workType:'shift',endTime:'19:00',authorRole:'owner',details:'캘린더 배포 검증용 일정'}));
let saved=await call('/room/state','PUT',{revision:0,state:{startDate:null,characters:{owner:'momo'},events,notes:[]}},owner);
saved=await call('/room/state','PUT',{revision:1,state:{...saved.state,characters:{owner:'kuki',partner:'kuki'}}},partner);
const shared=await call('/room','GET',null,owner);
assert.deepEqual(shared.state.characters,{owner:'momo',partner:'kuki'});
assert.equal(shared.state.events.length,3);
assert.ok(shared.state.events.every(e=>e.endTime==='19:00'&&e.authorRole==='owner'));
console.log('PASS: live two-member character preferences, three-day schedules and author preservation.');
