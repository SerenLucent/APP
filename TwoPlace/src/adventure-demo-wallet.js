import {initialAdventure,adventureState,applyAdventureAction} from '../shared/adventure-progression.js';
import {EXPLORATION_FIELD_VERSION} from '../shared/adventure-field.js';
export function localDemoEnabled(hostname,search){return ['localhost','127.0.0.1','[::1]'].includes(hostname)&&new URLSearchParams(search).get('demo')==='1';}
export function createDemoWallet(){
 const home={hearts:0,version:0,adventure:initialAdventure()};
 const mutate=(type,body={})=>{applyAdventureAction(home,{type,...body,actionId:crypto.randomUUID()},Date.now(),()=>crypto.randomUUID(),'player');home.version++;return home;};
 const wallet={local:true,role:'player',busy:false,get profile(){return adventureState(home.adventure);},get hearts(){return home.hearts;},get run(){return home.adventure.runs.player;},async init(){return home;},async history(){return {entries:home.adventure.history};},
 async start(restart=false,mode='explore',level=1){home.adventure.cooldowns={};mutate('adventureStart',{mode,level,restart,fieldVersion:EXPLORATION_FIELD_VERSION});return wallet.run;},
 async finish(runId,cleared,pet='momo',playTimeMs){mutate('adventureFinish',{runId,cleared,pet,playTimeMs});return wallet.run.reward;},async finishMine(runId,mineProof,brokenOres,pet='momo'){mutate('adventureFinish',{runId,mineProof,brokenOres,pet,playTimeMs:180000});return wallet.run.reward;},
 reset:(pet,kind)=>mutate('adventureReset',{pet,kind}),purchase:(product,quantity)=>mutate('adventurePurchase',{product,quantity}),investStardust:allocations=>mutate('adventureInvestStardustBatch',{allocations}),investSkillsStardust:allocations=>mutate('adventureSkillInvestStardustBatch',{allocations}),potion:(pet,potion)=>mutate('adventurePotion',{pet,potion})};return wallet;
}
