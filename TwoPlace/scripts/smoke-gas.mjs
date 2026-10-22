// Optional real-deployment check. Creates one labeled test couple; never prints tokens.
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const endpoint=process.env.TWOPLACE_GAS_URL;
if(!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(endpoint||''))throw new Error('Set TWOPLACE_GAS_URL to the deployed /exec URL.');
async function call(path,{token,method='GET',body}={}){
  const response=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify({path,method,token,body}),signal:AbortSignal.timeout(45000)});
  const text=await response.text();
  let data;try{data=JSON.parse(text);}catch{const title=text.match(/<title>([^<]*)<\/title>/i)?.[1]||'non-JSON response';throw new Error(method+' '+path+': HTTP '+response.status+' '+title);}
  console.log(method+' '+path+': '+data.status);
  return data;
}
const owner=randomBytes(32).toString('hex'),partner=randomBytes(32).toString('hex'),third=randomBytes(32).toString('hex');
const created=await call('/rooms',{method:'POST',body:{requestToken:owner}});
assert.equal(created.status,200);const code=created.data.code;
assert.equal((await call('/rooms',{method:'POST',body:{requestToken:owner}})).data.code,code);
assert.equal((await call('/rooms/join',{method:'POST',body:{requestToken:partner,code}})).data.memberCount,2);
assert.equal((await call('/rooms/join',{method:'POST',body:{requestToken:third,code}})).status,409);
const state={startDate:'2026-10-22',events:[],notes:[{id:'deployment-check',date:'2026-10-22',body:'배포 연결 확인용 테스트방입니다.'}]};
assert.equal((await call('/room/state',{method:'PUT',token:owner,body:{revision:0,state}})).status,200);
assert.deepEqual((await call('/room',{token:partner})).data.state,state);
assert.equal((await call('/room/state',{method:'PUT',token:partner,body:{revision:0,state}})).status,409);
assert.equal((await call('/admin/rooms',{token:owner})).status,403);
assert.equal((await call('/room/pets',{method:'POST',token:owner,body:{type:'buy',product:'plant',version:0}})).status,200);
const shared=await call('/room',{token:partner});assert.equal(shared.data.petHome.items.length,1);
assert.equal((await call('/room/pets',{method:'POST',token:partner,body:{type:'place',item:shared.data.petHome.items[0].id,version:1,space:'momoRoom',x:45,y:64}})).status,200);
assert.equal((await call('/room',{token:owner})).data.petHome.items[0].space,'momoRoom');
console.log('PASS: live GAS create/join, private authorization, shared JSON, revision conflict and pet furniture storage.');
console.log('One labeled deployment test room was retained in the GitHub storage.');
