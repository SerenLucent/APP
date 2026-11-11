import test from 'node:test';import assert from 'node:assert/strict';
import {initialPetHome,changePetHome,remodelPetHome} from '../server/pets.js';
import {cellCenter,walkable,placementAllowed} from '../shared/pet-space.js';
import {wallSlotAllowed} from '../shared/wall-decor.js';
import {isoScenery} from '../src/pet-art.js';
const action=(h,a)=>changePetHome(h,{version:h.version,...a},0,()=>a.product);
test('both floors reserve only the compact stair footprint; the former kitchen is available',()=>{
 for(const space of ['home','upperFloor']){for(const [c,r] of [[17,0],[18,4]])assert.equal(walkable([],space,c,r),false);for(const [c,r] of [[16,0],[19,0],[17,5]])assert.equal(walkable([],space,c,r),true);}
});
test('bathroom floor and wallpaper are fixed; shower fixtures and upstairs furniture save with correct space restrictions',()=>{
 let h={...initialPetHome(0),hearts:5000};
 for(const [product,space] of [['bathToilet','toilet'],['bathStool','shower'],['armchair','upperFloor']]){h=action(h,{type:'buy',product});h=action(h,{type:'place',item:product,space,...cellCenter(10,10)});assert.equal(h.items.at(-1).space,space);}
 h=action(h,{type:'buy',product:'floorCreamTile'});assert.throws(()=>action(h,{type:'applyFloor',item:'floorCreamTile',space:'toilet'}));
 h=action(h,{type:'buy',product:'wallpaperCream'});assert.throws(()=>action(h,{type:'placeWall',item:'wallpaperCream',space:'shower',side:'left'}));
 h=action(h,{type:'buy',product:'bathShower'});h=action(h,{type:'placeWall',item:'bathShower',space:'shower',side:'right',col:2,row:1});assert.equal(h.items.at(-1).wallSide,'right');
 assert.equal(wallSlotAllowed([],h.items.at(-1),'toilet','right',2,1),false);
});
test('new stairs return overlapping furniture to storage once, preserving ownership, wallet, wall decor and tabletop links',()=>{
 const h={...initialPetHome(0),layoutVersion:1,items:[{id:'table',product:'table',space:'home',...cellCenter(18,3)},{id:'plate',product:'mealPlate',space:'home',parentId:'table',slot:0},{id:'frame',product:'wallFrame',space:'momoRoom',wallSide:'right',wallCol:3,wallRow:0,...cellCenter(10,10)}]};
 const next=remodelPetHome(h);assert.equal(next.hearts,h.hearts);assert.equal(next.version,h.version);assert.equal(next.items.length,3);assert.equal(next.items[0].space,null);assert.equal(next.items[1].space,null);assert.equal(next.items[2].space,'momoRoom');assert.equal(remodelPetHome(next),next);
});
test('live scenery has stairs and relocated doors, bathroom tiles and visible exits',()=>{
 assert.match(isoScenery('home'),/화장실/);assert.doesNotMatch(isoScenery('home'),/built-in-kitchen/);assert.match(isoScenery('upperFloor'),/모모네방/);assert.doesNotMatch(isoScenery('upperFloor'),/window/i);for(const space of ['toilet','shower'])assert.match(isoScenery(space),/거실로/);
});
