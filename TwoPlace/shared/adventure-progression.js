export const ADVENTURE_STATS={strength:{name:'힘',description:'공격력 최소 +1 · 최대 +2'},vitality:{name:'체력',description:'최대 HP +5'},stamina:{name:'스태미나',description:'최대 스태미나 +5'},luck:{name:'운',description:'치명타 확률 +0.5%'},dexterity:{name:'손재주',description:'최대 피해 쪽으로 보정 · 100이면 항상 최대 피해'}};
export function initialAdventure(){const stat=()=>Object.fromEntries(Object.keys(ADVENTURE_STATS).map(k=>[k,0]));return {hpPotions:0,staminaPotions:0,points:0,totalClears:0,history:[],stats:{momo:stat(),kuki:stat()},runs:{}};}
export function adventureState(saved){const fresh=initialAdventure();if(!saved)return fresh;return {...fresh,...saved,history:[...(saved.history||[])],stats:{momo:{...fresh.stats.momo,...saved.stats?.momo},kuki:{...fresh.stats.kuki,...saved.stats?.kuki}},runs:{...saved.runs}};}
export function characterStats(id,points={}){const strength=points.strength||0,vitality=points.vitality||0,stamina=points.stamina||0,luck=points.luck||0,dexterity=points.dexterity||0;return {maxHp:100+vitality*5,maxSp:100+stamina*5,minAttack:(id==='momo'?8:10)+strength,maxAttack:(id==='momo'?15:20)+strength*2,critical:(id==='momo'?.1:.05)+luck*.005,dexterity};}
export function rollAttack(id,points={},random=Math.random){const stats=characterStats(id,points),bias=stats.dexterity/100,roll=Math.max(0,Math.min(.999999999,random())),raw=stats.minAttack+Math.floor((stats.maxAttack-stats.minAttack+1)*(bias+(1-bias)*roll)),damage=Math.min(stats.maxAttack,raw),critical=random()<stats.critical;return {damage:damage*(critical?2:1),base:damage,critical};}
export function investAdventurePoint(current,id,key){if(!['momo','kuki'].includes(id)||!Object.prototype.hasOwnProperty.call(ADVENTURE_STATS,key))adventureFail('능력치를 확인해 주세요.');const data=adventureState(current);if(data.points<1)adventureFail('스테이터스 포인트가 없어요.');if(data.stats[id][key]>=100)adventureFail('이 능력치는 이미 100포인트예요.');data.stats={...data.stats,[id]:{...data.stats[id],[key]:data.stats[id][key]+1}};data.points--;return data;}

export function adventureLevel(stats){
 const spent=Object.keys(ADVENTURE_STATS).reduce((sum,key)=>sum+(stats?.[key]??0),0);
 return {level:1+Math.floor(spent/10),progress:spent%10};
}

export function investAdventurePoints(current,allocations){
 if(!allocations||typeof allocations!=='object'||Array.isArray(allocations))adventureFail('배분할 능력치를 확인해 주세요.');
 const data=adventureState(current);
 let spent=0;
 for(const [pet,stats] of Object.entries(allocations)){
  if(!['momo','kuki'].includes(pet)||!stats||typeof stats!=='object'||Array.isArray(stats))adventureFail('배분할 친구를 확인해 주세요.');
  for(const [key,amount] of Object.entries(stats)){
   if(!Object.prototype.hasOwnProperty.call(ADVENTURE_STATS,key)||!Number.isInteger(amount)||amount<1||amount>100)adventureFail('배분할 능력치를 확인해 주세요.');
   const next=data.stats[pet][key]+amount;
   if(next>100)adventureFail(ADVENTURE_STATS[key].name+'은 최대 100포인트까지 배분할 수 있어요.');
   data.stats[pet][key]=next;
   spent+=amount;
  }
 }
 if(!spent)adventureFail('배분할 포인트를 선택해 주세요.');
 if(spent>data.points)adventureFail('보유 스테이터스 포인트가 부족해요.');
 data.points-=spent;
 return data;
}
import {createObstacles,EXPLORATION_FIELD_VERSION,EXPLORATION_GOALS} from './adventure-field.js';
export const ADVENTURE_REWARDS=[{id:'heart1',label:'하트 1개',hearts:1},{id:'heart3',label:'하트 3개',hearts:3},{id:'heart5',label:'하트 5개',hearts:5},{id:'staminaPotion',label:'스태미나 회복약 1개',field:'staminaPotions'},{id:'hpPotion',label:'HP 회복약 1개',field:'hpPotions'},{id:'point',label:'스테이터스 포인트 2개',field:'points',amount:2}];
export function rouletteTier(durationMs){return durationMs<=300000?{id:'S',label:'S · 5분 이내'}:durationMs<=480000?{id:'A',label:'A · 8분 이내'}:durationMs<=720000?{id:'B',label:'B · 12분 이내'}:{id:'C',label:'C · 완주'};}
export function rouletteTable(durationMs){const tier=rouletteTier(durationMs).id;return {C:['point','staminaPotion','point','hpPotion','heart1','point','staminaPotion','heart3','hpPotion','point','heart1','heart5'],B:['point','staminaPotion','heart3','point','hpPotion','heart5','point','staminaPotion','heart3','point','heart1','heart5'],A:['point','heart5','heart3','point','staminaPotion','heart5','point','hpPotion','heart3','point','heart1','heart5'],S:['point','heart5','heart3','point','staminaPotion','heart5','point','hpPotion','heart5','point','heart3','heart5']}[tier];}

function adventureFail(message,status=400){const error=new Error(message);error.status=status;throw error;}
export function applyAdventureAction(home,action,now,idFactory,role,random=Math.random){
 if(!['owner','partner'].includes(role))adventureFail('커플방 연결을 확인해 주세요.',403);
 if(typeof action.actionId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(action.actionId))adventureFail('저장 요청 번호를 확인해 주세요.');
 let data=adventureState(home.adventure);data.runs={...data.runs};data.operations=[...(data.operations||[])];
 if(data.operations.includes(action.actionId)){home.adventure=data;return;}
 if(action.type==='adventureStart'){
  const mode=action.mode??'explore';if(!['explore','offense'].includes(mode))adventureFail('모험 종류를 확인해 주세요.');
  const fieldVersion=mode==='explore'&&action.fieldVersion===EXPLORATION_FIELD_VERSION?EXPLORATION_FIELD_VERSION:1;
  const previous=data.runs[role];
  if(previous?.requestId===action.actionId||previous&&!previous.finishedAt&&!action.restart&&(previous.mode||'explore')===mode&&(previous.fieldVersion??1)===fieldVersion){home.adventure=data;return;}
  const id=idFactory(),seed=Number.parseInt(id.replace(/-/g,'').slice(0,8),16)>>>0;
  data.runs[role]={id,seed,mode,fieldVersion,requestId:action.actionId,startedAt:now,enemyCount:mode==='offense'?0:24+Math.floor((data.totalClears||0)/20)*4,finishedAt:null,reward:null};
 }else if(action.type==='adventureFinish'){
  const run=data.runs[role];if(!run||run.id!==action.runId)adventureFail('현재 탐험 기록이 아니에요. 새 탐험을 시작해 주세요.',409);
  if(run.finishedAt){home.adventure=data;return;}
  const mode=run.mode||'explore',ids=action.cleared;
  if(mode==='offense'){if(!Array.isArray(ids)||ids.length!==1||ids[0]!=='outpost-house')adventureFail('산채 본체를 파괴해야 해요.');}
  else{
   const mixed=run.fieldVersion===EXPLORATION_FIELD_VERSION;
   const required=mixed?EXPLORATION_GOALS.tree+EXPLORATION_GOALS.rock:100;
   if(!Array.isArray(ids)||ids.length!==required||new Set(ids).size!==required)adventureFail(mixed?'나무 50개와 바위 30개를 정리해야 해요.':'서로 다른 장애물 100개를 정리해야 해요.');
   const valid=new Map(createObstacles(run.seed,run.fieldVersion).map(o=>[o.id,o.type]));
   if(ids.some(id=>!valid.has(id)))adventureFail('필드의 장애물 기록을 확인해 주세요.');
   if(mixed&&ids.filter(id=>valid.get(id)==='tree').length!==EXPLORATION_GOALS.tree)adventureFail('나무 50개와 바위 30개를 정리해야 해요.');
  }
  const elapsed=Math.max(0,now-run.startedAt),durationMs=Number.isFinite(action.playTimeMs)&&action.playTimeMs>=0?Math.min(Math.round(action.playTimeMs),elapsed):elapsed,segments=rouletteTable(durationMs),tier=rouletteTier(durationMs),index=Math.min(segments.length-1,Math.floor(Math.max(0,random())*segments.length)),reward={...ADVENTURE_REWARDS.find(r=>r.id===segments[index]),index,segments,tier};if(reward.hearts)home.hearts+=reward.hearts;else data[reward.field]+=reward.amount||1;
  const mixed=run.fieldVersion===EXPLORATION_FIELD_VERSION;
  data.totalClears=(data.totalClears||0)+1;data.history=[...(data.history||[]),{runId:run.id,clearNo:data.totalClears,at:now,startedAt:run.startedAt,durationMs,role,character:['momo','kuki'].includes(action.pet)?action.pet:'momo',enemyCount:run.enemyCount??24,mode,obstacles:mode==='offense'?0:ids.length,...(mixed?{trees:EXPLORATION_GOALS.tree,rocks:EXPLORATION_GOALS.rock}:{}),houses:mode==='offense'?1:0,reward:{...reward,index}}];
  data.runs[role]={...run,clearNo:data.totalClears,finishedAt:now,reward:{...reward,index},cleared:ids};
 }else if(action.type==='adventureInvest'){
  data=investAdventurePoint(data,action.pet,action.stat);
 }else if(action.type==='adventureInvestBatch'){
  data=investAdventurePoints(data,action.allocations);
 }else if(action.type==='adventurePotion'){
  if(!['momo','kuki'].includes(action.pet)||!['hp','stamina'].includes(action.potion))adventureFail('회복할 친구와 물약을 확인해 주세요.');
  const field=action.potion==='hp'?'hpPotions':'staminaPotions';if(data[field]<1)adventureFail('보유한 회복약이 없어요.');data[field]--;
 }else adventureFail('탐험 동작을 확인해 주세요.');
 data.operations=[...(data.operations||[]),action.actionId].slice(-128);home.adventure=data;
}
