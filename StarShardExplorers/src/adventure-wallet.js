import {sendSaveRequest} from './save-transport.js';
import {EXPLORATION_FIELD_VERSION} from '../shared/adventure-field.js';
import {adventureState,initialAdventure} from '../shared/adventure-progression.js';
const TOKEN_KEY='star-shard-explorers:gas-player:v1',PENDING_KEY='star-shard-explorers:gas-pending:v1';
let boot,tail=Promise.resolve();
const newToken=()=>Array.from(crypto.getRandomValues(new Uint8Array(32)),n=>n.toString(16).padStart(2,'0')).join('');
let configuredUrl=(import.meta.env.VITE_GAS_URL||'').trim(),configReady;
async function resolveSaveEndpoint(){
 if(!configReady)configReady=(async()=>{if(!configuredUrl){try{const r=await fetch(import.meta.env.BASE_URL+'runtime-config.json',{cache:'no-store'});if(r.ok)configuredUrl=String((await r.json()).gasUrl||'').trim();}catch{}}
 if(configuredUrl&&!/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec$/.test(configuredUrl))throw Error('저장 서버 주소를 확인해 주세요.');
 if(!configuredUrl&&!['localhost','127.0.0.1','[::1]'].includes(location.hostname))throw Error('개인 저장 서버 연결을 준비 중이에요. 잠시 후 다시 접속해 주세요.');return configuredUrl;})().catch(e=>{configReady=null;throw e;});
 return configReady;
}
export async function saveRequest(path,{method='GET',body,token=localStorage.getItem(TOKEN_KEY)}={}){
 return sendSaveRequest({gasUrl:await resolveSaveEndpoint(),base:import.meta.env.BASE_URL,path,method,body,token});
}

async function ensurePlayer(){
 if(!boot)boot=(async()=>{let token=localStorage.getItem(TOKEN_KEY);if(!token){token=newToken();localStorage.setItem(TOKEN_KEY,token);localStorage.setItem(TOKEN_KEY+':creating','1');}if(localStorage.getItem(TOKEN_KEY+':creating')){await saveRequest('player',{method:'POST',token});localStorage.removeItem(TOKEN_KEY+':creating');}})().catch(e=>{boot=null;throw e;});
 return boot;
}
export async function exportPlayer(){await ensurePlayer();const state=await saveRequest('save');return {format:'star-shard-explorers-save',provider:'gas-private-drive',version:1,savedAt:new Date().toISOString(),recoveryCode:localStorage.getItem(TOKEN_KEY),snapshot:state};}
export async function restorePlayer(token){token=String(token).trim();if(!/^[a-f0-9]{64}$/.test(token))throw Error('복구코드를 확인해 주세요.');await saveRequest('save',{token});localStorage.setItem(TOKEN_KEY,token);localStorage.removeItem(PENDING_KEY);localStorage.removeItem(TOKEN_KEY+':creating');boot=null;}
export function createAdventureWallet(){
 let home={version:0,hearts:0,adventure:initialAdventure()},busy=false;
 async function refresh(){await ensurePlayer();home=await saveRequest('save');return home;}
 async function mutate(type,body={}){
  if(busy)throw Error('다른 저장을 처리하고 있어요.');busy=true;
  const execute=async()=>{
   await ensurePlayer();let pending;try{pending=JSON.parse(localStorage.getItem(PENDING_KEY)||'null');}catch{throw Error('이전 저장 요청을 읽을 수 없어요. 저장 관리에서 복구해 주세요.');}
   if(pending&&(pending.type!==type||JSON.stringify(pending.body)!==JSON.stringify(body)))throw Error('직전 저장 결과를 먼저 확인해 주세요. 같은 버튼으로 다시 시도해 주세요.');
   pending ||= {type,body,actionId:crypto.randomUUID()};localStorage.setItem(PENDING_KEY,JSON.stringify(pending));
   for(let retry=0;retry<3;retry++){await refresh();try{home=await saveRequest('action',{method:'POST',body:{type,...body,actionId:pending.actionId,version:home.version}});localStorage.removeItem(PENDING_KEY);return home;}catch(e){if(e.status&&e.status!==409)localStorage.removeItem(PENDING_KEY);if(retry===2||e.status&&e.status!==409)throw e;}}
  };
  const operation=tail.then(execute);tail=operation.catch(()=>{});try{return await operation;}finally{busy=false;}
 }
 return {local:false,get profile(){return adventureState(home.adventure);},get hearts(){return home.hearts;},get role(){return 'player';},get busy(){return busy;},get run(){return home.adventure.runs.player;},
  async init(){await refresh();let pending;try{pending=JSON.parse(localStorage.getItem(PENDING_KEY)||'null');}catch{}if(pending)await mutate(pending.type,pending.body);return home;},
  history:(start,end)=>saveRequest('history?'+new URLSearchParams({start,end})),
  async start(restart=false,mode='explore',level){await mutate('adventureStart',{mode,...(level===undefined?{}:{level}),...(mode==='explore'?{fieldVersion:EXPLORATION_FIELD_VERSION}:{}),...(restart?{restart:true}:{})});return this.run;},
  async finish(runId,cleared,pet='momo',playTimeMs){await mutate('adventureFinish',{runId,cleared,pet,playTimeMs});return this.run.reward;},
  async finishMine(runId,mineProof,brokenOres,pet='momo'){await mutate('adventureFinish',{runId,mineProof,brokenOres,pet,playTimeMs:180000});return this.run.reward;},
  reset:(pet,kind)=>mutate('adventureReset',{pet,kind}),purchase:(product,quantity)=>mutate('adventurePurchase',{product,quantity}),investStardust:allocations=>mutate('adventureInvestStardustBatch',{allocations}),investSkillsStardust:allocations=>mutate('adventureSkillInvestStardustBatch',{allocations}),potion:(pet,potion)=>mutate('adventurePotion',{pet,potion}),
 };
}

export async function emailAccountStatus(){await ensurePlayer();return saveRequest('account');}
export async function requestEmailCode(email,purpose,requestId){if(purpose==='link')await ensurePlayer();return saveRequest('email/request',{method:'POST',token:purpose==='link'?localStorage.getItem(TOKEN_KEY):null,body:{email,purpose,requestId}});}
export async function verifyEmailCode(email,purpose,challengeId,code){
 if(purpose==='login'&&localStorage.getItem(PENDING_KEY))throw Error('이전 게임 저장을 먼저 완료한 뒤 이어하기를 이용해 주세요.');
 const key=TOKEN_KEY+':email-login';let pending;try{pending=JSON.parse(localStorage.getItem(key)||'null');}catch{}
 if(purpose==='login'&&(!pending||pending.challengeId!==challengeId)){pending={challengeId,deviceToken:newToken()};localStorage.setItem(key,JSON.stringify(pending));}
 const result=await saveRequest('email/verify',{method:'POST',token:purpose==='link'?localStorage.getItem(TOKEN_KEY):null,body:{email,purpose,challengeId,code,...(purpose==='login'?{deviceToken:pending.deviceToken}:{})}});
 if(purpose==='login'){await restorePlayer(pending.deviceToken);localStorage.removeItem(key);}return result;
}
