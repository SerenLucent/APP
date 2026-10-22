import vm from 'node:vm';
import fs from 'node:fs';
import assert from 'node:assert/strict';
import {createHash} from 'node:crypto';
import {NaverMapView} from './naver-map.js';
const properties={NAVER_MAP_CLIENT_ID:'browser-map-id',NAVER_SEARCH_CLIENT_ID:'search-id',NAVER_SEARCH_CLIENT_SECRET:'server-only-secret'};
const cache=new Map();let calls=0,lastRequest;
let status=200;
const ctx=vm.createContext({Date,PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||null,setProperty:(key,value)=>properties[key]=value})},CacheService:{getScriptCache:()=>({get:key=>cache.get(key),put:(key,value)=>cache.set(key,value)})},Utilities:{formatDate:()=>new Date().toISOString().slice(0,10),computeDigest:(_,value)=>[...createHash('sha256').update(value).digest()],DigestAlgorithm:{SHA_256:'sha256'},Charset:{UTF_8:'UTF-8'}},UrlFetchApp:{fetch:(url,options)=>{calls++;lastRequest={url,options};return {getResponseCode:()=>status,getContentText:()=>JSON.stringify({items:[{title:'<b>센터</b> &amp; 커피',category:'카페,디저트>카페',roadAddress:'서울 성동구',mapx:'1270433000',mapy:'375474000'},{title:'식당',category:'음식점>한식',address:'서울',mapx:'127.05',mapy:'37.55'},{title:'좌표 없음',mapx:'0',mapy:'0'}]})};}}});
vm.runInContext(fs.readFileSync('apps-script/Naver.gs','utf8'),ctx);
const config=ctx.pmNaverConfig_();assert.equal(config.mapClientId,'browser-map-id');assert.equal(config.searchReady,true);assert.equal(JSON.stringify(config).includes('server-only-secret'),false);
const result=ctx.pmNaverSearch_('성수 카페','member1');
assert.equal(result.items.length,2);assert.equal(result.items[0].name,'센터 & 커피');assert.equal(result.items[0].lng,127.0433);assert.equal(result.items[0].lat,37.5474);assert.equal(result.items[1].category,'맛집');assert.match(result.items[0].canonicalId,/^naver_[0-9a-f]{64}$/);
assert.equal(ctx.pmNaverSearch_('성수 카페','member1').items[0].canonicalId,result.items[0].canonicalId);
assert.ok(lastRequest.url.startsWith('https://naverapihub.apigw.ntruss.com/search/v1/local?'));assert.equal(lastRequest.options.headers['X-NCP-APIGW-API-KEY'],'server-only-secret');assert.equal(lastRequest.url.includes('server-only-secret'),false);
assert.throws(()=>ctx.pmNaverSearch_('a','member1'),e=>e.pmCode==='INVALID_SEARCH_QUERY');
status=403;assert.throws(()=>ctx.pmNaverSearch_('성수 카페','member1'),e=>e.pmCode==='NAVER_SEARCH_AUTH_FAILED');status=200;
properties.NAVER_SEARCH_DAILY_LIMIT='1';assert.throws(()=>ctx.pmNaverSearch_('성수 카페','member2'),e=>e.pmCode==='NAVER_SEARCH_DAILY_LIMIT');
delete properties.NAVER_SEARCH_CLIENT_SECRET;const before=calls;assert.throws(()=>ctx.pmNaverSearch_('성수 카페','member2'),e=>e.pmCode==='NAVER_SEARCH_NOT_CONFIGURED');assert.equal(calls,before);
console.log('PASS: NAVER HUB endpoint/headers, server-only secrets, Korean query, HTML stripping, scaled/decimal WGS84, stable common identity, categories, missing-key/auth/daily-limit errors');

let constructions=0;
const documentBefore=globalThis.document;
globalThis.document={createElement:()=>({style:{},parentNode:null})};
try{
  class LatLng{constructor(lat,lng){this.latitude=lat;this.longitude=lng;}lat(){return this.latitude;}lng(){return this.longitude;}}
  class FakeMap{constructor(_canvas,options){constructions++;this.center=options.center;this.zoom=options.zoom;}getCenter(){return this.center;}getZoom(){return this.zoom;}setCenter(c){this.center=c;}setZoom(z){this.zoom=z;}setSize(){}}
  class Marker{setMap(){}}
  const nav=new NaverMapView();nav.api={Map:FakeMap,LatLng,Marker,Size:class{},Event:{addListener(){},clearInstanceListeners(){}}};
  const host=()=>({clientWidth:600,clientHeight:400,replaceChildren(canvas){canvas.parentNode=this;}});
  const props={center:{lat:37.54,lng:127.04},zoom:15,places:[{id:'one',name:'카페',lat:37.54,lng:127.04}],selected:'one',onSelect(){},onMove(){}};
  nav.mount(host(),props);const canvas=nav.canvas;nav.mount(host(),props);
  assert.equal(constructions,1);assert.equal(nav.canvas,canvas);
  console.log('PASS: NAVER map/canvas reused across app renders instead of repeated billable map initialization');
}finally{globalThis.document=documentBefore;}
