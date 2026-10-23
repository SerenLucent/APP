import {test} from 'node:test';import assert from 'node:assert/strict';
import {HOUSEHOLD_PRODUCTS} from '../shared/household-catalog.js';
import {CATALOG,initialPetHome,changePetHome} from '../server/pets.js';
import {footprint,cellCenter} from '../shared/pet-space.js';
test('new household products buy and persist their registered dimensions and all four rotations',()=>{
 assert.equal(HOUSEHOLD_PRODUCTS.length,32);assert.equal(CATALOG.filter(p=>p.type==='furniture').length,55);
 for(const product of HOUSEHOLD_PRODUCTS){let home={...initialPetHome(0),hearts:1000};home=changePetHome(home,{type:'buy',product:product.id,version:home.version},0,()=>product.id);assert.equal(home.hearts,1000-product.price);
  for(const rotation of [0,90,180,270]){home=changePetHome(home,{type:'place',item:product.id,version:home.version,space:product.spaces[0],rotation,...cellCenter(10,10)},0);assert.equal(home.items[0].rotation,rotation);assert.deepEqual(footprint(home.items[0]),rotation%180?[...product.footprint].reverse():product.footprint);}
  const invalid=['yard','home','momoRoom'].find(space=>!product.spaces.includes(space));if(invalid)assert.throws(()=>changePetHome(home,{type:'place',item:product.id,version:home.version,space:invalid,...cellCenter(10,10)},0));
 }
});
test('outdoor placement rejects indoor appliances and bedrooms reject kitchen appliances',()=>{
 for(const product of ['fridge','stove','washingMachine','sinkunit','diningtable']){let home={...initialPetHome(0),hearts:1000};home=changePetHome(home,{type:'buy',product,version:0},0,()=>product);
  for(const space of ['yard','momoRoom','kukiRoom'])assert.throws(()=>changePetHome(home,{type:'place',item:product,space,...cellCenter(10,10),version:home.version},0),/해당 공간/);
 }
});
