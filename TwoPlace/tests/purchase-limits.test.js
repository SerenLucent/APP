import test from 'node:test';
import assert from 'node:assert/strict';
import {initialPetHome,changePetHome,CATALOG} from '../server/pets.js';
import {purchaseStock} from '../shared/purchase-limits.js';
import {wallSlotAllowed} from '../shared/wall-decor.js';
import {furnishingModel} from '../src/furnishing-model.js';
test('식탁의자는 배치와 보관 합계 4개로 제한하며 기존 초과 보유는 삭제하지 않는다',()=>{
 const home=initialPetHome();home.hearts=10000;home.items=Array.from({length:4},(_,n)=>({id:String(n),product:'diningchair',space:n?'home':null}));
 assert.deepEqual(purchaseStock(home,CATALOG.find(p=>p.id==='diningchair')),{count:4,limit:4,full:true});
 assert.throws(()=>changePetHome(home,{type:'buy',version:0,product:'diningchair'}),/최대 4개/);assert.equal(home.items.length,4);assert.equal(home.hearts,10000);
});
test('마지막 한도 구매는 허용하고 다른 품목 수량과 섞이지 않는다',()=>{
 const home=initialPetHome();home.items=Array.from({length:3},(_,n)=>({id:String(n),product:'diningchair'}));
 const next=changePetHome(home,{type:'buy',version:0,product:'diningchair'},Date.now(),()=> 'fourth');assert.equal(next.items.length,4);
 assert.equal(purchaseStock(next,CATALOG.find(p=>p.id==='bathToilet')).count,0);
});
test('욕실 가구 네 방향의 모든 접지점이 정의된 셀 안에 있다',()=>{
 for(const id of ['bathStool','bathToilet','bathBasin','bathHamper','bathMat'])for(const angle of [0,90,180,270]){
  const model=furnishingModel(id,angle);assert.ok(model.faces.length);assert.ok(model.contacts.length);assert.ok(Number.isFinite(model.anchorX));
  const size=CATALOG.find(p=>p.id===id).footprint,[w,d]=angle%180?[size[1],size[0]]:size;
  for(const [u,v] of model.contacts){assert.ok(Math.abs(u)<=w/2+.001,id);assert.ok(Math.abs(v)<=d/2+.001,id);}
 }
});
test('샤워기는 샤워실 벽에만 걸리며 기존 장식과 겹칠 수 없다',()=>{
 const item={id:'shower',product:'bathShower'};
 assert.equal(wallSlotAllowed([],item,'shower','right',1,1),true);
 assert.equal(wallSlotAllowed([],item,'toilet','right',1,1),false);
 assert.equal(wallSlotAllowed([],item,'home','right',1,1),false);
 assert.equal(wallSlotAllowed([{id:'other',product:'bathShelf',space:'shower',wallSide:'right',wallCol:1,wallRow:1}],item,'shower','right',1,1),false);
});
