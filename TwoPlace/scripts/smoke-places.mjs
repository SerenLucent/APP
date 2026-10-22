import fs from 'node:fs';
import assert from 'node:assert/strict';
import {randomBytes} from 'node:crypto';
const endpoint=JSON.parse(fs.readFileSync('public/web-config.json','utf8')).apiUrl;
const token=()=>randomBytes(32).toString('hex'),owner=token(),partner=token(),other=token();
async function call(path,method='GET',body,auth){
  for(let attempt=0;attempt<3;attempt++){
    const r=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain'},body:JSON.stringify({path,method,body,token:auth}),signal:AbortSignal.timeout(60000)});
    let result;try{result=await r.json();}catch{if(attempt<2)continue;throw new Error('Apps Script did not return JSON');}
    if(!Number.isInteger(result.status)){if(attempt<2)continue;throw new Error('Unexpected Apps Script response fields: '+Object.keys(result).join(','));}
    console.log(method,path,result.status);return result;
  }
}
const created=await call('/rooms','POST',{requestToken:owner});assert.equal(created.status,200);
const code=created.data.code;
assert.equal((await call('/rooms/join','POST',{code,requestToken:partner})).status,200);
assert.equal((await call('/rooms','POST',{requestToken:other})).status,200);
assert.equal((await call('/room/places','GET',null,owner)).data.revision,0);
const place={id:'live-test-cafe',canonicalId:'live-test-cafe',name:'지도 공유 배포 검증용 카페',address:'서울 성동구 · 실제 방문 장소 아님',category:'카페',lat:37.5462,lng:127.046,checked:null};
assert.equal((await call('/room/places','PUT',{revision:0,nickname:'지도 테스트 1',places:[place],reviews:[]},owner)).status,200);
const shared=await call('/room/places','GET',null,partner);assert.equal(shared.data.places[0].name,place.name);
const review={place:place.id,visited:true,rating:5,custom:[{label:'분위기',score:4}],comment:'두 기기 공유 확인용 테스트입니다.'};
assert.equal((await call('/room/places','PUT',{revision:1,nickname:'지도 테스트 2',places:[],reviews:[review]},partner)).status,200);
assert.equal((await call('/room/places','PUT',{revision:1,nickname:'충돌',places:[place],reviews:[]},owner)).status,409);
assert.equal((await call('/room/places','GET',null,owner)).data.reviews[0].comment,review.comment);
assert.equal((await call('/room/places','GET',null,other)).data.places.length,0);
assert.equal((await call('/room/places','GET',null,token())).status,401);
console.log('PASS: separate couple map, two-member places/reviews, conflict and room isolation.');
