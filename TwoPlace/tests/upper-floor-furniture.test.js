import test from 'node:test';
import assert from 'node:assert/strict';
import {CATALOG,initialPetHome,changePetHome} from '../server/pets.js';
import {usableInSpace} from '../shared/pet-products.js';
import {isTabletop} from '../shared/household-catalog.js';
import {cellCenter} from '../shared/pet-space.js';
test('second floor offers and accepts all living-room and bedroom floor furniture',()=>{
 const products=CATALOG.filter(p=>p.type==='furniture'&&!isTabletop(p.id)&&(usableInSpace(p.id,'home')||usableInSpace(p.id,'momoRoom')));
 for(const product of products){
  assert.equal(usableInSpace(product.id,'upperFloor'),true,product.id);
  let home={...initialPetHome(0),hearts:2000};
  home=changePetHome(home,{type:'buy',product:product.id,version:home.version},0,()=>product.id);
  home=changePetHome(home,{type:'place',item:product.id,space:'upperFloor',...cellCenter(10,10),version:home.version},0);
  assert.equal(home.items.find(i=>i.id===product.id).space,'upperFloor');
 }
});
test('second-floor dining table accepts food decorations',()=>{
 let home={...initialPetHome(0),hearts:2000};
 for(const product of ['diningtable','teaSet'])home=changePetHome(home,{type:'buy',product,version:home.version},0,()=>product);
 home=changePetHome(home,{type:'place',item:'diningtable',space:'upperFloor',...cellCenter(10,10),version:home.version},0);
 home=changePetHome(home,{type:'placeOnTable',item:'teaSet',space:'upperFloor',parentId:'diningtable',slot:0,version:home.version},0);
 assert.equal(home.items.find(i=>i.id==='teaSet').space,'upperFloor');
});
