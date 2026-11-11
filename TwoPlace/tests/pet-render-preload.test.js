import test from 'node:test';import assert from 'node:assert/strict';
import {createRenderCache} from '../src/pet-render-cache.js';
import {petFurniturePlan,preparePetScenes} from '../src/pet-render-preload.js';
test('preload and first mount share one completed background; concurrent requests do not rasterize twice',async()=>{
 let calls=0,finish;const cache=createRenderCache({build:()=>{calls++;return new Promise(r=>finish=r);}});
 const a=cache.prepare('room','svg'),b=cache.prepare('room','svg');assert.equal(a,b);assert.equal(cache.ready('room'),null);
 await Promise.resolve();finish({url:'decoded'});await a;assert.equal(calls,1);assert.equal(cache.ready('room').url,'decoded');await cache.prepare('room','svg');assert.equal(calls,1);
});
test('a failed render retries and least-recently-used ready backgrounds release their object URLs',async()=>{
 let calls=0;const disposed=[],cache=createRenderCache({limit:2,dispose:v=>disposed.push(v),build:async v=>{if(++calls===1)throw Error('decode');return v;}});
 await assert.rejects(cache.prepare('one','one'));await cache.prepare('one','one');await cache.prepare('two','two');cache.ready('one');await cache.prepare('three','three');assert.deepEqual(disposed,['two']);assert.equal(cache.ready('one'),'one');assert.equal(cache.ready('two'),null);
});
test('same furniture across rooms is prepared once per saved angle plus the inventory thumbnail',()=>{
 assert.deepEqual(petFurniturePlan([{product:'bed',rotation:90},{product:'bed',rotation:90},{product:'sofa',rotation:0}]),[{product:'bed',rotation:0},{product:'bed',rotation:90},{product:'sofa',rotation:0}]);
});
test('loading remains pending until furniture and every destination background are decoded, yielding between jobs',async()=>{
 const order=[];let last;const home={items:[{product:'bed',rotation:90}]};
 const result=await preparePetScenes(home,{spaces:['home','upperFloor','toilet','shower'],prepareFurniture:async job=>order.push('furniture:'+job.rotation),prepareBackground:async space=>order.push(space),yieldControl:async()=>order.push('yield'),onProgress:(...args)=>last=args});
 assert.equal(result,true);assert.deepEqual(order,['furniture:0','yield','furniture:90','yield','home','yield','upperFloor','yield','toilet','yield','shower','yield']);assert.deepEqual(last,['방 준비가 끝났어요',6,6]);
});
test('leaving the pet page stops preparing subsequent rooms and errors reach the retry screen',async()=>{
 let active=true,calls=0;const opts={spaces:['home','shower'],prepareFurniture:async()=>{calls++;active=false;},prepareBackground:async()=>calls++,yieldControl:async()=>{},isCurrent:()=>active};
 assert.equal(await preparePetScenes({items:[{product:'bed'}]},opts),false);assert.equal(calls,1);
 await assert.rejects(preparePetScenes({items:[]},{...opts,isCurrent:()=>true,prepareBackground:async()=>{throw Error('background decode');}}),/background decode/);
});
