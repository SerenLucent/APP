import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {createHash,randomUUID} from 'node:crypto';
import {initialPetHome} from '../server/pets.js';
function storageGas(){
 const code='123456789012',token='a'.repeat(64),base='TwoPlace/remote-data/couples/'+code+'/',hash=createHash('sha256').update(token).digest('hex');
 const home=initialPetHome();home.heartHistory=[{at:Date.now(),amount:1,balance:120,label:'기존'}];
 const legacy={code,revision:0,members:[{hash,role:'owner'}],state:{startDate:null,events:[],notes:[]},petHome:home};
 let head='commit0',seq=0,failRef=false;
 const snapshots=new Map([[head,new Map([[base+'room.json',JSON.stringify(legacy)]])]]),trees=new Map([['tree0',snapshots.get(head)]]),commits=new Map([[head,{tree:{sha:'tree0'}}]]),reads=[];
 const properties={'GITHUB_TOKEN':'fake',['github-member:'+hash]:base+'room.json'};
 const response=(status,data)=>({getResponseCode:()=>status,getContentText:()=>JSON.stringify(data)});
 const fetch=(url,options)=>{
  const endpoint=url.slice('https://api.github.com/repos/SerenLucent/APP'.length),payload=options.payload?JSON.parse(options.payload):null;
  if(endpoint==='/git/ref/heads/main')return response(200,{object:{sha:head}});
  if(endpoint.startsWith('/git/commits/')&&options.method==='get')return response(200,commits.get(endpoint.split('/').at(-1)));
  if(endpoint==='/git/trees'){
   const tree=new Map(trees.get(payload.base_tree));for(const item of payload.tree)tree.set(item.path,item.content);const sha='tree'+(++seq);trees.set(sha,tree);return response(200,{sha});
  }
  if(endpoint==='/git/commits'){
   const sha='commit'+(++seq);commits.set(sha,{tree:{sha:payload.tree},parents:payload.parents});snapshots.set(sha,trees.get(payload.tree));return response(200,{sha});
  }
  if(endpoint==='/git/refs/heads/main'){
   if(failRef||commits.get(payload.sha).parents[0]!==head)return response(422,{});head=payload.sha;return response(200,{});
  }
  if(endpoint.startsWith('/contents/')){const [part,query]=endpoint.slice(10).split('?'),name=decodeURIComponent(part),ref=new URLSearchParams(query).get('ref'),text=snapshots.get(ref)?.get(name);reads.push(name);return text?response(200,{sha:'blob',content:Buffer.from(text).toString('base64')}):response(404,{});}
  throw Error('Unexpected '+endpoint);
 };
 const context=vm.createContext({Date,Set,Map,console,PropertiesService:{getScriptProperties:()=>({getProperty:key=>properties[key]||null})},UrlFetchApp:{fetch},Utilities:{getUuid:randomUUID,Charset:{UTF_8:'utf8'},DigestAlgorithm:{SHA_256:'sha256'},computeDigest:(_,text)=>[...createHash('sha256').update(text).digest()],base64Decode:text=>Buffer.from(text,'base64'),newBlob:value=>({getDataAsString:()=>Buffer.from(value).toString('utf8')})}});
 vm.runInContext(fs.readFileSync('gas/Code.gs','utf8'),context);
 return {base,token,reads,get files(){return snapshots.get(head);},set failRef(value){failRef=value;},call:(path,method='GET',body)=>JSON.parse(JSON.stringify(context.route_({path,method,body,token,storageProtocol:2})))};
}
test('GAS migrates with original backup, reads no logs on home, and atomically commits wallet + new history',()=>{
 const h=storageGas();const first=h.call('/room');assert.equal(first.storageVersion,2);assert.equal(first.petHome.hearts,120);
 assert.equal(first.petHome.items,undefined);assert.ok([...h.files.keys()].some(file=>file.includes('/backups/storage-v2_')));
 assert.equal(JSON.parse(h.files.get(h.base+'room.json')).petHome,undefined);
 h.reads.length=0;h.call('/room');assert.deepEqual(h.reads,[h.base+'room.json',h.base+'wallet/current.json']);
 const saved=h.call('/room/pets','POST',{type:'pat',pet:'mochi',version:first.petHome.version});assert.equal(saved.petHome.hearts,121);
 const day=new Date(Date.now()+9*3600000).toISOString().slice(0,10),history=h.call('/room/history','POST',{kind:'heart',start:day,end:day});assert.equal(history.entries.length,2);
 const before=JSON.stringify([...h.files]);h.failRef=true;
 assert.throws(()=>h.call('/room/pets','POST',{type:'sleep',pet:'mochi',version:saved.petHome.version}),e=>e.status===409);assert.equal(JSON.stringify([...h.files]),before);
 h.failRef=false;assert.equal(h.call('/room/pets','POST',{type:'sleep',pet:'mochi',version:saved.petHome.version}).petHome.hearts,122);
});
