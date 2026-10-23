import {test} from 'node:test';
import assert from 'node:assert/strict';
import vm from 'node:vm';
import fs from 'node:fs';
function boot(){
  const listeners={},timers=[];
  const element=()=>({children:[],hidden:false,classList:{contains:()=>false},appendChild(child){this.children.push(child);}});
  const screen=element();screen.isConnected=true;screen.querySelector=()=>null;
  const location={href:'https://example.test/TwoPlace/?view=home',replace(url){this.replaced=url;}};
  vm.runInNewContext(fs.readFileSync('public/startup-recovery.js','utf8'),{URL,Date,location,navigator:{userAgent:'Test Safari'},document:{getElementById:()=>screen,createElement:element},setTimeout(fn){timers.push(fn);return 1;},clearTimeout(){timers.length=0;},window:{addEventListener(name,fn){listeners[name]=fn;},removeEventListener(name){delete listeners[name];}}});
  return {screen,location,listeners,timers,recovery:screen.children[0]};
}
test('startup recovery works without app modules, preserves URL parameters and never accesses storage',()=>{
  const h=boot();assert.equal(h.recovery.hidden,true);
  h.listeners.error();assert.equal(h.recovery.hidden,false);
  h.recovery.children[1].onclick();
  const next=new URL(h.location.replaced);assert.equal(next.searchParams.get('view'),'home');assert.ok(next.searchParams.get('refresh'));
  // No storage API is provided: successful execution proves recovery needs no storage access.
});
test('slow startup offers manual recovery and successful startup cancels the watchdog',()=>{
  const slow=boot();slow.timers[0]();assert.equal(slow.recovery.hidden,false);
  const ready=boot();ready.listeners['twoplace:ready']();assert.equal(ready.timers.length,0);assert.equal(ready.listeners.error,undefined);
});
test('image errors do not claim startup failure, while script errors expose safe diagnostics',()=>{
  const h=boot();h.listeners.error({target:{tagName:'IMG'}});assert.equal(h.recovery.hidden,true);
  h.listeners.error({target:{tagName:'SCRIPT'},message:'Failed https://test.invalid/file?token=private',lineno:4});
  assert.equal(h.recovery.hidden,false);
  const text=h.recovery.children[3].children[1].textContent;
  assert.ok(text.includes('줄 4'));assert.equal(text.includes('private'),false);
});
