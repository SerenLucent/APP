import {test} from 'node:test';
import assert from 'node:assert/strict';
import {createDemoClient} from '../src/demo-client.js';
test('demo edits persist only in their separate session key and reset without touching real membership',async()=>{
  const values=new Map([['twoplace:room-session:v1','real-session-untouched']]);
  const storage={getItem:key=>values.get(key),setItem:(key,value)=>values.set(key,value)};
  const options={storage,now:()=>new Date('2026-10-23T09:00:00+09:00').getTime()};
  const client=createDemoClient(options),original=await client.request('/room');
  assert.equal(original.memberCount,2);
  assert.ok(original.state.events.some(e=>e.kind==='work'&&e.workType==='off'));
  assert.ok(original.state.events.some(e=>e.kind==='trip'));
  const next=structuredClone(original.state);next.events[0].details='모의 수정';
  await client.request('/room/state',{method:'PUT',body:{revision:0,state:next}});
  const restored=await createDemoClient(options).request('/room');
  assert.equal(restored.state.events[0].details,'모의 수정');
  assert.equal(values.get('twoplace:room-session:v1'),'real-session-untouched');
  await assert.rejects(()=>client.request('/rooms',{method:'POST'}));
  await assert.rejects(()=>client.request('/room/state',{method:'PUT',body:{revision:0,state:next}}),e=>e.status===409);
  const reset=client.reset();assert.equal(reset.revision,0);assert.deepEqual(reset.state,original.state);
});

test('shared claim restarts a full hour and simultaneous stale claims cannot double credit',async()=>{
  let now=Date.parse('2026-10-23T00:00:00Z');
  const client=createDemoClient({now:()=>now});
  const before=await client.request('/room');
  const results=await Promise.allSettled([0,1].map(()=>client.request('/room/pets',{method:'POST',body:{type:'claim',version:before.petHome.version}})));
  assert.equal(results.filter(r=>r.status==='fulfilled').length,1);
  const after=await client.request('/room');
  assert.equal(after.petHome.hearts,before.petHome.hearts+10);
  assert.equal(after.petHome.nextClaimAt-now,3600000);
  now+=3599999;
  await assert.rejects(()=>client.request('/room/pets',{method:'POST',body:{type:'claim',version:after.petHome.version}}));
  now++;
  const next=await client.request('/room/pets',{method:'POST',body:{type:'claim',version:after.petHome.version}});
  assert.equal(next.petHome.hearts,after.petHome.hearts+10);
});
