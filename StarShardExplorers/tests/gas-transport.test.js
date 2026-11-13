import test from 'node:test';import assert from 'node:assert/strict';
import {sendSaveRequest} from '../src/save-transport.js';
test('Pages transport sends tokens only in POST body without a CORS preflight and unwraps GAS status',async()=>{
 let captured;const data=await sendSaveRequest({gasUrl:'https://script.google.com/macros/s/test/exec',path:'history?start=2026-11-01&end=2026-11-03',token:'secret-token',fetcher:async(url,options)=>{captured={url,options};return {ok:true,json:async()=>({status:200,data:{entries:[]}})};}});
 assert.equal(captured.options.method,'POST');assert.equal(captured.options.headers['Content-Type'],'text/plain;charset=utf-8');assert.ok(!captured.url.includes('secret-token'));const body=JSON.parse(captured.options.body);assert.equal(body.path,'/api/history');assert.equal(body.query.start,'2026-11-01');assert.equal(body.token,'secret-token');assert.deepEqual(data,{entries:[]});
 await assert.rejects(sendSaveRequest({gasUrl:'https://script.google.com/macros/s/test/exec',path:'save',fetcher:async()=>({ok:true,json:async()=>({status:401,error:'복구코드 확인'})})}),e=>e.status===401&&e.message==='복구코드 확인');
});
