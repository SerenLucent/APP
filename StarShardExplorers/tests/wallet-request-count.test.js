import test from 'node:test';import assert from 'node:assert/strict';import vm from 'node:vm';import fs from 'node:fs';
test('wallet skips pre-save reads after init and refreshes on a version conflict',async()=>{
 const data=new Map([['star-shard-explorers:gas-player:lucenty-v1','a'.repeat(64)]]),calls=[];let version=0,conflict=false;
 const state=()=>({version,hearts:0,adventure:{runs:{player:null}}});
 const ctx=vm.createContext({console,Promise,URLSearchParams,location:{hostname:'example.com',search:''},localStorage:{getItem:k=>data.get(k)??null,setItem:(k,v)=>data.set(k,v),removeItem:k=>data.delete(k)},window:{dispatchEvent(){}},CustomEvent:class{},crypto:{randomUUID:()=>String(Math.random())},localDemoEnabled:()=>false,initialAdventure:()=>({runs:{player:null}}),adventureState:x=>x,recoverAdventurePending:()=>null,sendSaveRequest:async({path})=>{calls.push(path);if(path==='action'){if(conflict){conflict=false;version++;throw Object.assign(Error('conflict'),{status:409});}version++;}return state();}});
 let source=fs.readFileSync(new URL('../src/adventure-wallet.js',import.meta.url),'utf8').replace(/^import .*;\r?\n/gm,'').replaceAll('import.meta.env.VITE_GAS_URL',"'https://script.google.com/macros/s/test/exec'").replaceAll('import.meta.env.BASE_URL',"'/'").replaceAll('export ','');vm.runInContext(source,ctx);
 const wallet=ctx.createAdventureWallet();await wallet.init();await wallet.purchase('hpPotion',1);assert.deepEqual(calls,['save','action']);calls.length=0;conflict=true;await wallet.purchase('hpPotion',1);assert.deepEqual(calls,['action','save','action']);
});
