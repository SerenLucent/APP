import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
const source=fs.readFileSync('src/main.js','utf8');
const loader=source.slice(source.indexOf('async function loadViewContent(){'),source.indexOf('\nlet view ='));
const navigation=source.slice(source.indexOf('function navigateView('),source.indexOf('\nwindow.twoPlaceBack='));
function harness(){
 let resolve,reject;const renders=[],requests=[],order=[];
 const context=vm.createContext({room:{},session:{token:'test'},petCatalog:[],petHome:{version:0},view:'home',contentSequence:0,contentBusy:'',contentError:'',month:new Date(2026,10,1),history:{state:{},pushState(){},replaceState(){}},window:{scrollTo(){}},
  request(path,options){requests.push({path,options});return new Promise((yes,no)=>{resolve=yes;reject=no;});},
  render(){if(context.view==='pets'&&!context.contentBusy&&!context.contentError&&!Array.isArray(context.petHome.items))throw Error('Rendered pet room before layout loaded');renders.push(context.contentBusy?'loading':context.contentError?'error':'ready');},
  async warmPetCharacters(){},applyRoom(data){context.petHome=data.petHome;},async warmPetAssets(home){assert.ok(Array.isArray(home.items));order.push('assets');}});
 vm.runInContext(loader+'\n'+navigation,context);
 return {context,renders,requests,order,resolve:data=>resolve(data),reject:error=>reject(error)};
}
test('pet navigation from thin room snapshot renders loading before reading layout and only mounts after assets',async()=>{
 const h=harness();h.context.navigateView('pets');assert.deepEqual(h.renders,['loading']);assert.equal(h.requests[0].path,'/room/content');assert.equal(h.requests[0].options.body.section,'housing');
 h.resolve({petHome:{version:0,items:[]}});await new Promise(setImmediate);
 assert.deepEqual(h.order,['assets']);assert.deepEqual(h.renders,['loading','ready']);assert.equal(h.context.contentBusy,'');
});
test('failed pet layout request shows retry state instead of blank screen',async()=>{
 const h=harness();h.context.navigateView('pets');h.reject(Error('서버 연결 확인'));await new Promise(setImmediate);
 assert.deepEqual(h.renders,['loading','error']);assert.equal(h.context.contentError,'서버 연결 확인');
});
test('room stays behind loading while render preparation is pending and passes a cancellation guard',async()=>{
 const h=harness();let finish,options;h.context.warmPetAssets=async(home,opts)=>{options=opts;await new Promise(resolve=>finish=resolve);};
 h.context.navigateView('pets');h.resolve({petHome:{items:[]}});await new Promise(setImmediate);assert.deepEqual(h.renders,['loading']);assert.equal(options.isCurrent(),true);
 h.context.navigateView('home');assert.equal(options.isCurrent(),false);finish();await new Promise(setImmediate);assert.deepEqual(h.renders,['loading','ready']);assert.equal(h.context.view,'home');
});
test('leaving pets during layout load does not repaint the old pet screen',async()=>{
 const h=harness();h.context.navigateView('pets');h.context.navigateView('home');h.resolve({petHome:{items:[]}});await new Promise(setImmediate);
 assert.equal(h.context.view,'home');assert.deepEqual(h.renders,['loading','ready']);assert.deepEqual(h.order,[]);
});
