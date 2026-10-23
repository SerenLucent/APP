import {test} from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
test('client exports initialize before network requests and share one asynchronous configuration load',async()=>{
  const previousDocument=globalThis.document,previousFetch=globalThis.fetch;
  let calls=0,resolve;
  globalThis.document={documentElement:{dataset:{}}};
  globalThis.fetch=()=>{calls++;return new Promise(done=>{resolve=done;});};
  try{
    const source=fs.readFileSync('src/room-client.js','utf8')
      .replace("import { Capacitor } from '@capacitor/core';","const Capacitor={isNativePlatform:()=>false};")
      .replaceAll('import.meta.env',JSON.stringify({PROD:true,BASE_URL:'/TwoPlace/'}));
    const client=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
    assert.equal(client.pollInterval,15000);assert.equal(client.gasUrl,'');assert.equal(calls,0);
    const first=client.initializeClient(),second=client.initializeClient();
    assert.equal(first,second);assert.equal(calls,1);
    assert.equal(client.pollInterval,15000);
    resolve({ok:true,json:async()=>({apiUrl:'https://script.google.com/macros/s/test/exec'})});
    await first;assert.equal(client.gasUrl,'https://script.google.com/macros/s/test/exec');
  }finally{globalThis.document=previousDocument;globalThis.fetch=previousFetch;}
});
