import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialPetHome,changePetHome,petSnapshot,claimable,hunger,HOUR,CATALOG} from '../server/pets.js';
import {usableInSpace} from '../shared/pet-products.js';
import {cellCenter} from '../shared/pet-space.js';

test('expanded furniture catalog is space-specific and fences cannot be purchased',()=>{
  assert.ok(CATALOG.length>=18);assert.equal(CATALOG.some(p=>p.id==='fence'),false);
  assert.equal(usableInSpace('bed','yard'),false);assert.equal(usableInSpace('bed','momoRoom'),true);
  assert.equal(usableInSpace('bench','home'),false);assert.equal(usableInSpace('bench','yard'),true);
  const home={...initialPetHome(0),hearts:500};
  assert.throws(()=>changePetHome(home,{type:'buy',product:'fence',version:0},0));
  const bought=changePetHome(home,{type:'buy',product:'bed',version:0},0,()=> 'bed');
  assert.throws(()=>changePetHome(bought,{type:'place',item:'bed',space:'yard',...cellCenter(5,5),version:1},0));
  const placed=changePetHome(bought,{type:'place',item:'bed',space:'momoRoom',...cellCenter(5,5),version:1},0);
  assert.equal(placed.items[0].space,'momoRoom');assert.equal(placed.hearts,410);
});

test('claims pay only ten hearts after any wait and restart a full hour without duplicates',()=>{
  const t=1000000,home=initialPetHome(t);
  assert.equal(claimable(home,t+HOUR-1),0);
  assert.equal(claimable(home,t+HOUR),10);
  assert.equal(claimable(home,t+2*HOUR),10);
  assert.equal(claimable(home,t+99*HOUR),10);
  assert.equal(claimable(home,t-HOUR),0);
  const claimed=changePetHome(home,{type:'claim',version:0},t+2.5*HOUR);
  assert.equal(claimed.hearts,130);assert.equal(claimed.lastClaim,t+2.5*HOUR);
  assert.throws(()=>changePetHome(claimed,{type:'claim',version:1},t+2.5*HOUR));
  assert.equal(claimable(claimed,t+3.5*HOUR-1),0);
  assert.equal(claimable(claimed,t+3.5*HOUR),10);
  assert.throws(()=>changePetHome(claimed,{type:'claim',version:0},t+2.5*HOUR),e=>e.status===409);
  assert.equal(home.hearts,120);
});
test('buying furniture and food costs hearts; placement must be owned and inside the scene',()=>{
  let home=initialPetHome(0);
  home=changePetHome(home,{type:'buy',version:0,product:'plant'},0,()=> 'plant-1');
  assert.equal(home.hearts,95);assert.equal(home.items[0].space,null);
  home=changePetHome(home,{type:'place',version:1,item:'plant-1',space:'terrace',x:20,y:65},0);
  assert.equal(home.items[0].space,'terrace');
  assert.throws(()=>changePetHome(home,{type:'place',version:2,item:'not-owned',space:'home',x:50,y:60},0));
  assert.throws(()=>changePetHome(home,{type:'place',version:2,item:'plant-1',space:'home',x:500,y:60},0));
  home=changePetHome(home,{type:'store',version:2,item:'plant-1'},0);
  assert.equal(home.items[0].space,null);
  home=changePetHome(home,{type:'buy',version:3,product:'snack'},0);
  assert.equal(home.hearts,85);assert.equal(home.snacks,5);
  assert.throws(()=>changePetHome({...home,hearts:0},{type:'buy',version:4,product:'snack'},0));
  assert.throws(()=>changePetHome(home,{type:'buy',version:3,product:'snack'},0),e=>e.status===409);
});
test('two pets have independent fullness and eating consumes shared food only on success',()=>{
  let home=initialPetHome(0);
  home=changePetHome(home,{type:'feed',pet:'mochi',version:0},0);
  assert.equal(home.snacks,3);assert.equal(home.pets.mochi.hunger,100);assert.equal(home.pets.kuki.hunger,75);
  assert.throws(()=>changePetHome(home,{type:'feed',pet:'mochi',version:1},0));
  assert.equal(home.snacks,3);
  assert.equal(hunger(home.pets.mochi,5*HOUR),80);
  assert.equal(hunger(home.pets.kuki,100*HOUR),0);
  const snapshot=petSnapshot(home,5*HOUR);
  assert.equal(snapshot.pets.mochi.hunger,80);assert.equal(snapshot.pets.kuki.hunger,55);
  assert.equal(home.pets.mochi.hunger,100);
});
test('server rejects overlapping furniture and persists the selected orientation',()=>{
  let home=initialPetHome(0);
  home=changePetHome(home,{type:'buy',version:0,product:'plant'},0,()=> 'plant');
  home=changePetHome(home,{type:'buy',version:1,product:'table'},0,()=> 'table');
  home=changePetHome(home,{type:'place',version:2,item:'plant',space:'home',...cellCenter(3,3)},0);
  assert.throws(()=>changePetHome(home,{type:'place',version:3,item:'table',space:'home',...cellCenter(3,3)},0));
  home=changePetHome(home,{type:'place',version:3,item:'table',space:'home',...cellCenter(6,6),rotation:90},0);
  assert.equal(home.items.find(item=>item.id==='table').rotation,90);
});

test('bedrooms save separate furniture layouts and retain them when visiting another room',()=>{
  let home=initialPetHome(0);
  home=changePetHome(home,{type:'buy',version:0,product:'plant'},0,()=> 'momo-plant');
  home=changePetHome(home,{type:'buy',version:1,product:'plant'},0,()=> 'kuki-plant');
  home=changePetHome(home,{type:'place',version:2,item:'momo-plant',space:'momoRoom',...cellCenter(3,3)},0);
  home=changePetHome(home,{type:'place',version:3,item:'kuki-plant',space:'kukiRoom',...cellCenter(3,3)},0);
  assert.deepEqual(petSnapshot(home,0).items.map(item=>item.space),['momoRoom','kukiRoom']);
  assert.throws(()=>changePetHome(home,{type:'place',version:4,item:'kuki-plant',space:'momoRoom',...cellCenter(3,3)},0));
  assert.throws(()=>changePetHome(home,{type:'place',version:4,item:'kuki-plant',space:'home',...cellCenter(19,0)},0));
  assert.equal(home.items[1].space,'kukiRoom');
});

