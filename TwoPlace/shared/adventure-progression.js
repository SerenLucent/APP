export const ADVENTURE_STATS={strength:{name:'힘',description:'공격력 최소 +1 · 최대 +2'},vitality:{name:'체력',description:'최대 HP +5'},stamina:{name:'스태미나',description:'최대 스태미나 +5'},luck:{name:'운',description:'치명타 확률 +0.5%'},dexterity:{name:'손재주',description:'최대 피해 쪽으로 보정 · 100이면 항상 최대 피해'}};
export function initialAdventure(){const stat=()=>Object.fromEntries(Object.keys(ADVENTURE_STATS).map(k=>[k,0]));return {hpPotions:0,staminaPotions:0,points:0,totalClears:0,history:[],stats:{momo:stat(),kuki:stat()},runs:{}};}
export function adventureState(saved){const fresh=initialAdventure();if(!saved)return fresh;return {...fresh,...saved,history:[...(saved.history||[])],stats:{momo:{...fresh.stats.momo,...saved.stats?.momo},kuki:{...fresh.stats.kuki,...saved.stats?.kuki}},runs:{...saved.runs}};}
export function characterStats(id,points={}){const strength=points.strength||0,vitality=points.vitality||0,stamina=points.stamina||0,luck=points.luck||0,dexterity=points.dexterity||0;return {maxHp:100+vitality*5,maxSp:100+stamina*5,minAttack:(id==='momo'?8:10)+strength,maxAttack:(id==='momo'?15:20)+strength*2,critical:(id==='momo'?.1:.05)+luck*.005,dexterity};}
export function rollAttack(id,points={},random=Math.random){const stats=characterStats(id,points),bias=stats.dexterity/100,roll=Math.max(0,Math.min(.999999999,random())),raw=stats.minAttack+Math.floor((stats.maxAttack-stats.minAttack+1)*(bias+(1-bias)*roll)),damage=Math.min(stats.maxAttack,raw),critical=random()<stats.critical;return {damage:damage*(critical?2:1),base:damage,critical};}
export function investAdventurePoint(current,id,key){if(!['momo','kuki'].includes(id)||!Object.prototype.hasOwnProperty.call(ADVENTURE_STATS,key))adventureFail('능력치를 확인해 주세요.');const data=adventureState(current);if(data.points<1)adventureFail('스테이터스 포인트가 없어요.');if(data.stats[id][key]>=100)adventureFail('이 능력치는 이미 100포인트예요.');data.stats={...data.stats,[id]:{...data.stats[id],[key]:data.stats[id][key]+1}};data.points--;return data;}
import {createObstacles} from './adventure-field.js';
export const ADVENTURE_REWARDS=[{id:'heart1',label:'하트 1개',hearts:1},{id:'heart3',label:'하트 3개',hearts:3},{id:'heart5',label:'하트 5개',hearts:5},{id:'staminaPotion',label:'스태미나 회복약 1개',field:'staminaPotions'},{id:'hpPotion',label:'HP 회복약 1개',field:'hpPotions'},{id:'point',label:'스테이터스 포인트 1개',field:'points'}];
export function rouletteTier(durationMs){return durationMs<=300000?{id:'S',label:'S · 5분 이내'}:durationMs<=480000?{id:'A',label:'A · 8분 이내'}:durationMs<=720000?{id:'B',label:'B · 12분 이내'}:{id:'C',label:'C · 완주'};}
export function rouletteTable(durationMs){const tier=rouletteTier(durationMs).id;return {C:['heart1','staminaPotion','point','heart3','hpPotion','heart1','point','staminaPotion','heart3','hpPotion','heart1','heart5'],B:['heart1','heart5','point','heart3','staminaPotion','heart5','point','heart1','hpPotion','heart3','point','heart5'],A:['heart3','heart5','point','heart1','heart5','staminaPotion','heart3','heart5','point','hpPotion','heart3','heart5'],S:['heart3','heart5','point','heart5','staminaPotion','heart3','heart5','point','heart5','hpPotion','heart3','heart5']}[tier];}

function adventureFail(message,status=400){const error=new Error(message);error.status=status;throw error;}
export function applyAdventureAction(home,action,now,idFactory,role,random=Math.random){
 if(!['owner','partner'].includes(role))adventureFail('커플방 연결을 확인해 주세요.',403);
 if(typeof action.actionId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(action.actionId))adventureFail('저장 요청 번호를 확인해 주세요.');
 let data=adventureState(home.adventure);data.runs={...data.runs};data.operations=[...(data.operations||[])];
 if(data.operations.includes(action.actionId)){home.adventure=data;return;}
 if(action.type==='adventureStart'){
  const previous=data.runs[role];
  if(previous?.requestId===action.actionId||previous&&!previous.finishedAt&&!action.restart){home.adventure=data;return;}
  const id=idFactory(),seed=Number.parseInt(id.replace(/-/g,'').slice(0,8),16)>>>0;
  data.runs[role]={id,seed,requestId:action.actionId,startedAt:now,enemyCount:24+Math.floor((data.totalClears||0)/20)*4,finishedAt:null,reward:null};
 }else if(action.type==='adventureFinish'){
  const run=data.runs[role];if(!run||run.id!==action.runId)adventureFail('현재 탐험 기록이 아니에요. 새 탐험을 시작해 주세요.',409);
  if(run.finishedAt){home.adventure=data;return;}
  const ids=action.cleared;if(!Array.isArray(ids)||ids.length!==100||new Set(ids).size!==100)adventureFail('서로 다른 장애물 100개를 정리해야 해요.');
  const valid=new Set(createObstacles(run.seed).map(o=>o.id));if(ids.some(id=>!valid.has(id)))adventureFail('필드의 장애물 기록을 확인해 주세요.');
  const elapsed=Math.max(0,now-run.startedAt),durationMs=Number.isFinite(action.playTimeMs)&&action.playTimeMs>=0?Math.min(Math.round(action.playTimeMs),elapsed):elapsed,segments=rouletteTable(durationMs),tier=rouletteTier(durationMs),index=Math.min(segments.length-1,Math.floor(Math.max(0,random())*segments.length)),reward={...ADVENTURE_REWARDS.find(r=>r.id===segments[index]),index,segments,tier};if(reward.hearts)home.hearts+=reward.hearts;else data[reward.field]++;
  data.totalClears=(data.totalClears||0)+1;data.history=[...(data.history||[]),{runId:run.id,clearNo:data.totalClears,at:now,startedAt:run.startedAt,durationMs,role,character:['momo','kuki'].includes(action.pet)?action.pet:'momo',enemyCount:run.enemyCount??24,obstacles:100,reward:{...reward,index}}];
  data.runs[role]={...run,clearNo:data.totalClears,finishedAt:now,reward:{...reward,index},cleared:ids};
 }else if(action.type==='adventureInvest'){
  data=investAdventurePoint(data,action.pet,action.stat);
 }else if(action.type==='adventurePotion'){
  if(!['momo','kuki'].includes(action.pet)||!['hp','stamina'].includes(action.potion))adventureFail('회복할 친구와 물약을 확인해 주세요.');
  const field=action.potion==='hp'?'hpPotions':'staminaPotions';if(data[field]<1)adventureFail('보유한 회복약이 없어요.');data[field]--;
 }else adventureFail('탐험 동작을 확인해 주세요.');
 data.operations=[...(data.operations||[]),action.actionId].slice(-128);home.adventure=data;
}
