import {test} from 'node:test';
import assert from 'node:assert/strict';
import {initialPlaces,changePlaces} from '../shared/places.js';
const place={id:'p1',canonicalId:'p1',name:'둘만의 카페',address:'서울 성동구',category:'카페',lat:37.55,lng:127.04,checked:null};
const body=(revision,places=[],reviews=[])=>({revision,nickname:'우리',places,reviews});
test('couple map separates authors, merges two reviews and rejects stale saves and forged IDs',()=>{
  let map=changePlaces(initialPlaces(),body(0,[place]),'owner',1);
  map=changePlaces(map,body(1,[],[{place:'p1',visited:true,rating:5,custom:[{label:'커피',score:5}],comment:'함께 또 오자'}]),'partner',2);
  assert.equal(map.places[0].owner,'owner');assert.equal(map.reviews[0].user,'partner');
  assert.throws(()=>changePlaces(map,body(0),'owner',3),e=>e.status===409);
  assert.throws(()=>changePlaces(map,body(2,[{...place,owner:'partner'}]),'partner',3),e=>e.status===400);
  map=changePlaces(map,body(2,[{...place,name:'수정한 카페'}],[{place:'p1',visited:true,rating:4,custom:[],comment:'나도 좋아'}]),'owner',3);
  assert.equal(map.reviews.length,2);assert.equal(map.reviews[0].comment,'함께 또 오자');
  map=changePlaces(map,body(3,[],[]),'partner',4);
  assert.equal(map.places.length,1);assert.equal(map.reviews.length,1);assert.equal(map.reviews[0].user,'owner');
});
test('map validates coordinates, review targets, text and ratings before saving',()=>{
  for(const bad of [{...place,lat:86},{...place,lng:Infinity},{...place,id:'bad"id'},{...place,name:''}])assert.throws(()=>changePlaces(initialPlaces(),body(0,[bad]),'owner',1),e=>e.status===400);
  const map=changePlaces(initialPlaces(),body(0,[place]),'owner',1);
  assert.throws(()=>changePlaces(map,body(1,[],[{place:'missing',visited:true,rating:5,custom:[],comment:''}]),'partner',2));
  assert.throws(()=>changePlaces(map,body(1,[],[{place:'p1',visited:true,rating:6,custom:[],comment:''}]),'partner',2));
});

test('custom category and wishlist survive couple round trips and registration can include a rating',()=>{let map=changePlaces(initialPlaces(),body(0,[{...place,category:'전시',wanted:true}]),'owner',1);assert.equal(map.places[0].wanted,true);assert.equal(map.places[0].category,'전시');map=changePlaces(map,body(1,[]),'partner',2);assert.equal(map.places[0].wanted,true);map=changePlaces(map,body(2,[{...place,category:'전시',wanted:false}],[{place:'p1',visited:true,rating:5,custom:[{label:'편안함',score:4}],comment:'바로 남긴 평가'}]),'owner',3);assert.equal(map.places[0].wanted,false);assert.equal(map.reviews[0].rating,5);assert.throws(()=>changePlaces(initialPlaces(),body(0,[{...place,category:''}]),'owner',1));});
