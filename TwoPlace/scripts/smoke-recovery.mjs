import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const url=JSON.parse(fs.readFileSync('public/web-config.json','utf8')).apiUrl;
const secret=()=>randomBytes(32).toString('hex');
const owner=secret(),partner=secret(),freshOwner=secret(),freshPartner=secret(),password=secret();
async function call(path,method,body,token){
  for(let i=0;i<3;i++){
    try{
      const r=await fetch(url,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({path,method,body,token}),signal:AbortSignal.timeout(60000)});
      const data=await r.json();assert.ok(Number.isInteger(data.status));console.log(method,path,data.status);return data;
    }catch(e){if(i===2)throw new Error('Apps Script did not return a valid response');}
  }
}
const created=await call('/rooms','POST',{requestToken:owner});assert.equal(created.status,200);
const code=created.data.code;
assert.equal((await call('/rooms/join','POST',{code,requestToken:partner})).status,200);
assert.equal((await call('/room/recovery','PUT',{password},owner)).status,200);
const state={startDate:null,events:[],notes:[{id:'recovery-smoke',date:'2026-10-22',body:'연결 복구 배포 확인용 테스트방입니다.'}]};
assert.equal((await call('/room/state','PUT',{revision:0,state},owner)).status,200);
const recover=(requestToken,role,p=password)=>call('/rooms/recover','POST',{code,requestToken,role,password:p});
assert.equal((await recover(freshOwner,'owner','incorrect-password')).status,403);
assert.equal((await recover(freshOwner,'owner')).status,200);
assert.equal((await recover(freshOwner,'owner')).status,200);
assert.equal((await call('/room','GET',null,owner)).status,401);
assert.equal((await call('/room','GET',null,partner)).status,200);
assert.equal((await recover(freshPartner,'partner')).status,200);
assert.equal((await call('/room','GET',null,partner)).status,401);
const restored=await call('/room','GET',null,freshPartner);
assert.equal(restored.status,200);assert.equal(restored.data.memberCount,2);assert.deepEqual(restored.data.state,state);
assert.equal(restored.data.petHome.hearts,created.data.petHome.hearts);
console.log('PASS: both lost devices recovered, old devices revoked, same room and data preserved.');
