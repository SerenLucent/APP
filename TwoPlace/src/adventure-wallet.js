import {EXPLORATION_FIELD_VERSION} from '../shared/adventure-field.js';
import {loadSession,request} from './room-client.js';
import {changePetHome,initialPetHome} from '../server/pets.js';
import {adventureState} from '../shared/adventure-progression.js';
export function createAdventureWallet(){
 const session=new URLSearchParams(location.search).get('demo')==='1'?null:loadSession(),local=!session,key='twoplace:adventure-wallet:v1',pendingKey='twoplace:adventure-pending:'+ (local?'demo':'room');let home={...initialPetHome(),hearts:0},role='owner',busy=false,cachedHome=null,cachedProfile=null;
 const read=()=>{try{const saved=JSON.parse(localStorage.getItem(key)||'null');if(saved)home=saved;}catch{}};
 const persist=()=>{localStorage.setItem(key,JSON.stringify(home));};
 const refresh=async()=>{if(local)read();else{const data=await request('/room',{token:session.token});home=data.petHome;role=data.role;}return home;};
 async function mutate(type,body={}){
  if(busy)throw Error('다른 저장을 처리하고 있어요.');busy=true;let pending;
  try{pending=JSON.parse(localStorage.getItem(pendingKey)||'null');}catch{}
  if(pending&&(pending.type!==type||JSON.stringify(pending.body)!==JSON.stringify(body))){busy=false;throw Error('직전 저장 결과를 먼저 확인해 주세요. 같은 버튼으로 다시 시도해 주세요.');}
  pending ||= {type,body,actionId:crypto.randomUUID()};localStorage.setItem(pendingKey,JSON.stringify(pending));
  try{for(let retry=0;retry<3;retry++){await refresh();try{const action={type,...body,actionId:pending.actionId,version:home.version};if(local){home=changePetHome(home,action,Date.now(),()=>crypto.randomUUID(),{role,character:body.pet||'momo',local:true});persist();}else{const data=await request('/room/pets',{token:session.token,method:'POST',body:action});home=data.petHome;role=data.role;}localStorage.removeItem(pendingKey);return home;}catch(e){if(retry===2||e.status&&e.status!==409){if(e.status&&e.status!==409)localStorage.removeItem(pendingKey);throw e;}}}}finally{busy=false;}
 }
 return {local,get profile(){if(cachedHome!==home){cachedHome=home;cachedProfile=adventureState(home.adventure);}return cachedProfile;},get hearts(){return home.hearts;},get role(){return role;},get busy(){return busy;},get run(){return home.adventure?.runs?.[role];},async init(){await refresh();if(local&&['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&new URLSearchParams(location.search).get('testPoints')==='1000'&&!home.localPointGrantV1){home.adventure=adventureState(home.adventure);home.adventure.points=1000;home.localPointGrantV1=true;persist();}let old;try{old=JSON.parse(localStorage.getItem(pendingKey));}catch{}if(old)await mutate(old.type,old.body);return home;},async start(restart=false,mode='explore'){await mutate('adventureStart',{mode,...(mode==='explore'?{fieldVersion:EXPLORATION_FIELD_VERSION}:{}),...(restart?{restart:true}:{})});return this.run;},async finish(runId,cleared,pet='momo',playTimeMs){await mutate('adventureFinish',{runId,cleared,pet,playTimeMs});return this.run.reward;},investBatch:allocations=>mutate('adventureInvestBatch',{allocations}),potion:(pet,potion)=>mutate('adventurePotion',{pet,potion})};
}
