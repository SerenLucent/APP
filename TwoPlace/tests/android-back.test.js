import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
const script=fs.readFileSync('android/app/src/main/res/raw/twoplace_back.js','utf8');
const dispatch=(handler,readyState='complete')=>vm.runInNewContext(script,{window:handler===undefined?{}:{twoPlaceBack:handler},document:{readyState}});
test('Android back consumes pet/game/dialog navigation and requests exit only when the web home reports it',()=>{
 assert.equal(dispatch(()=>true),'handled');assert.equal(dispatch(()=>false),'home');assert.equal(dispatch(()=>undefined),'handled');assert.equal(dispatch(undefined,'loading'),'loading');assert.equal(dispatch(undefined),'fallback');assert.equal(dispatch(()=>{throw Error('cached game');}),'fallback');
});
test('native exit requires the Yes button and missing game handlers load the home URL instead of finishing',()=>{
 const java=fs.readFileSync('android/app/src/main/java/com/twoplace/app/MainActivity.java','utf8').replace(/^\s*\/\/.*$/gm,'');
 assert.equal((java.match(/finishAndRemoveTask\(\)/g)||[]).length,1);assert.doesNotMatch(java,/\.goBack\(|super\.onBackPressed\(|\bfinish\(\)/);
 const callback=java.slice(java.indexOf('public void handleOnBackPressed()'),java.indexOf('private String readBackScript'));
 assert.match(callback,/BackNavigationPolicy.resolve\(url, result\)/);assert.match(callback,/loadUrl\(HOME_URL\)/);assert.doesNotMatch(callback,/finishAndRemoveTask/);
 assert.ok(java.indexOf('R.id.exit_yes')<java.indexOf('finishAndRemoveTask()'));
});
test('adventure selection back closes its dialog or returns to the main page without exiting',()=>{
 const source=fs.readFileSync('src/adventure-menu.js','utf8'),hook=source.slice(source.indexOf('window.twoPlaceBack='),source.indexOf('\nroot.innerHTML'));
 let closed=0,url;const context=vm.createContext({window:{},base:'/APP/TwoPlace/',demo:false,document:{querySelector:()=>({close(){closed++;}})},location:{replace(value){url=value;}}});
 vm.runInContext(hook,context);assert.equal(context.window.twoPlaceBack(),true);assert.equal(closed,1);assert.equal(url,undefined);context.document.querySelector=()=>null;assert.equal(context.window.twoPlaceBack(),true);assert.equal(url,'/APP/TwoPlace/index.html');
});
test('the actual web hook sends pets to home first, then permits the native home confirmation',()=>{
 const source=fs.readFileSync('src/main.js','utf8'),hook=source.slice(source.indexOf('window.twoPlaceBack='),source.indexOf("\nwindow.addEventListener('popstate'"));
 const navigations=[];let dialog=null;const context=vm.createContext({window:{},view:'pets',document:{querySelector:()=>dialog},navigateView(next,replace){navigations.push({next,replace});context.view=next;}});
 vm.runInContext(hook,context);assert.equal(context.window.twoPlaceBack(),true);assert.equal(context.view,'home');assert.deepEqual(navigations,[{next:'home',replace:true}]);assert.equal(context.window.twoPlaceBack(),false);
 let closed=false;dialog={close(){closed=true;}};assert.equal(context.window.twoPlaceBack(),true);assert.equal(closed,true);
});
