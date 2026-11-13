import {MINE_SECONDS,MINE_FIELD_VERSION,mineOreLimits} from './adventure-mine-field.js';
import {skillBalance} from './adventure-skills.js';
export const ADVENTURE_STATS={strength:{name:'힘',description:'공격력 최소 +1 · 최대 +2'},vitality:{name:'체력',description:'최대 HP +5'},stamina:{name:'기력',description:'최대 SP +5'},dexterity:{name:'재주',description:'최대 피해 확률·스킬 충전량·차지 속도 증가'},luck:{name:'운',description:'치명타 확률 +0.7%'}};
export function initialAdventure(){const stat=()=>Object.fromEntries(Object.keys(ADVENTURE_STATS).map(k=>[k,0]));return {stardust:0,skillPoints:0,skills:{momo:{charge:1,ultimate:1},kuki:{charge:1,ultimate:1}},hpPotions:0,staminaPotions:0,points:0,totalClears:0,history:[],stats:{momo:stat(),kuki:stat()},runs:{}};}
export function adventureState(saved){const fresh=initialAdventure();if(!saved)return fresh;return {...fresh,...saved,investmentIncludesSkills:true,statInvestment:{momo:(saved.statInvestment?.momo??statInvestmentTotal(saved.stats?.momo))+(saved.investmentIncludesSkills?0:skillInvestmentTotal(saved.skills?.momo)),kuki:(saved.statInvestment?.kuki??statInvestmentTotal(saved.stats?.kuki))+(saved.investmentIncludesSkills?0:skillInvestmentTotal(saved.skills?.kuki))},history:[...(saved.history||[])],skills:{momo:{charge:skillBalance(saved.skills?.momo?.charge).level,ultimate:skillBalance(saved.skills?.momo?.ultimate).level},kuki:{charge:skillBalance(saved.skills?.kuki?.charge).level,ultimate:skillBalance(saved.skills?.kuki?.ultimate).level}},stats:{momo:{...fresh.stats.momo,...saved.stats?.momo},kuki:{...fresh.stats.kuki,...saved.stats?.kuki}},runs:{...saved.runs}};}
export function characterStats(id,points={}){const strength=points.strength||0,vitality=points.vitality||0,stamina=points.stamina||0,luck=points.luck||0,dexterity=points.dexterity||0;return {maxHp:100+vitality*5,maxSp:100+stamina*5,minAttack:(id==='momo'?8:10)+strength,maxAttack:(id==='momo'?15:20)+strength*2,critical:(id==='momo'?.1:.05)+luck*.007,dexterity};}
export function rollAttack(id,points={},random=Math.random){const stats=characterStats(id,points),bias=stats.dexterity/100,roll=Math.max(0,Math.min(.999999999,random())),raw=stats.minAttack+Math.floor((stats.maxAttack-stats.minAttack+1)*(bias+(1-bias)*roll)),damage=Math.min(stats.maxAttack,raw),critical=random()<stats.critical;return {damage:damage*(critical?2:1),base:damage,critical};}
export function statPointCost(current,amount=1){
 let cost=0;
 for(let i=0;i<amount;i++)cost+=2+Math.floor((current+i)/10);
 return cost;
}
export function statStardustCost(current,amount=1){let cost=0;for(let i=0;i<amount;i++)cost+=200+100*Math.floor((current+i)/10);return cost;}
export function availableStatStardust(profile){return (profile.stardust||0)+((profile.points||0)+(profile.skillPoints||0))*240;}
export function convertAdventurePoints(current){const data=adventureState(current),total=availableStatStardust(data);if(!Number.isSafeInteger(total))adventureFail('별조각 수량을 확인해 주세요.');data.stardust=total;data.points=0;data.skillPoints=0;return data;}
export function investAdventureStardust(current,allocations){
 if(!allocations||typeof allocations!=='object'||Array.isArray(allocations))adventureFail('배분할 능력치를 확인해 주세요.');
 const data=adventureState(current);let cost=0;
 for(const [pet,stats] of Object.entries(allocations)){
  if(!['momo','kuki'].includes(pet)||!stats||typeof stats!=='object'||Array.isArray(stats))adventureFail('배분할 친구를 확인해 주세요.');
  for(const [key,amount] of Object.entries(stats)){
   if(!Object.prototype.hasOwnProperty.call(ADVENTURE_STATS,key)||!Number.isInteger(amount)||amount<1||amount>100)adventureFail('배분할 능력치를 확인해 주세요.');
   const old=data.stats[pet][key];if(old+amount>100)adventureFail('능력치는 최대 100까지 강화할 수 있어요.');
   const paid=statStardustCost(old,amount);cost+=paid;data.statInvestment = data.statInvestment || {momo:0,kuki:0};data.statInvestment[pet]+=paid;data.stats[pet][key]+=amount;
  }
 }
 if(!cost)adventureFail('배분할 능력치를 선택해 주세요.');
 const available=availableStatStardust(data);if(!Number.isSafeInteger(available)||available<cost)adventureFail('별조각이 부족해요.');
 data.stardust=available-cost;data.points=0;data.skillPoints=0;return data;
}
export function investAdventurePoint(current,id,key){
 return investAdventurePoints(current,{[id]:{[key]:1}});
}

export function skillInvestmentTotal(skills){return ['charge','ultimate'].reduce((sum,key)=>{const level=skillBalance(skills?.[key]).level;return sum+(level*(level+1)/2-1)*240;},0);}
export function statInvestmentTotal(stats){return Object.keys(ADVENTURE_STATS).reduce((sum,key)=>sum+statStardustCost(0,stats?.[key]??0),0);}
export function investmentLevel(total=0){let level=1,progress=Math.max(0,Math.floor(total)),required=1000;while(progress>=required){progress-=required;level++;required=1000+500*Math.floor((level-1)/10);}return {level,progress,required,invested:Math.max(0,Math.floor(total))};}
export function adventureLevel(stats,investment){return investmentLevel(investment??statInvestmentTotal(stats));}

export function recommendedMapLevel(profile){return Math.max(1,Math.floor((adventureLevel(profile?.stats?.momo,profile?.statInvestment?.momo).level+adventureLevel(profile?.stats?.kuki,profile?.statInvestment?.kuki).level)/2));}
export function mapScaling(level=1){const n=Math.max(0,level-1);return {hp:1+n*.25,damage:1+n*.2};}
export const minimumMapLevel=recommended=>Math.max(1,recommended-2);
export const mapRewardFactor=(level,recommended)=>.5**Math.max(0,recommended-level);
export function mapStardustReward(base,level=1,recommended=1){return Math.floor(base*(1+.5*Math.floor(Math.max(0,level-1)/10))*mapRewardFactor(level,recommended));}
export function scaleMapTarget(target,level=1){if(target.mapScaled)return target;const factor=mapScaling(level).hp;target.hp=Math.round(target.hp*factor);target.max=Math.round(target.max*factor);target.mapScaled=true;return target;}
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
   data.stats[pet][key]=next;data.statInvestment = data.statInvestment || {momo:0,kuki:0};data.statInvestment[pet]+=statStardustCost(next-amount,amount);
   spent+=statPointCost(data.stats[pet][key]-amount,amount);
  }
 }
 if(!spent)adventureFail('배분할 포인트를 선택해 주세요.');
 if(spent>data.points)adventureFail('보유 스테이터스 포인트가 부족해요.');
 data.points-=spent;
 return data;
}
import {createObstacles,DEFENSE_WAVES,DEFENSE_TOTAL,EXPLORATION_FIELD_VERSION,EXPLORATION_GOALS} from './adventure-field.js';
export const BATTLE_PRODUCTS=[
 {id:'statPoint',name:'스탯 포인트',price:240,field:'points',description:'능력치 강화에 사용해요.'},
 {id:'skillPoint',name:'스킬 포인트',price:240,field:'skillPoints',description:'모모와 쿠키의 스킬을 강화해요.'},
 {id:'hpPotion',name:'HP 회복약',price:5,field:'hpPotions',description:'현재 캐릭터의 HP를 20 회복해요.'},
 {id:'spPotion',name:'SP 회복약',price:8,field:'staminaPotions',description:'현재 캐릭터의 SP를 20 회복해요.'},
];
export const ADVENTURE_REWARDS=[2,3,4,5].map(hearts=>({id:'heart'+hearts,label:'하트 '+hearts+'개',hearts}));
export function rouletteTier(durationMs,mode='explore'){
 const baseline=mode==='defense'?150000:120000;
 return durationMs<=baseline*.85?{id:'S',label:'S',stardust:60}
  :durationMs<=baseline?{id:'A',label:'A',stardust:50}
  :durationMs<=baseline*1.25?{id:'B',label:'B',stardust:45}
  :{id:'C',label:'C',stardust:40};
}
export function rouletteTable(durationMs,level=null,recommended=1){
 if(level!==null)return Array.from({length:12},(_,i)=>level<recommended?(recommended-level===1?'heart2':'heart1'):['heart3','heart4','heart5','heart6'][i%4]);
 return ['heart2','heart3','heart2','heart4','heart2','heart3','heart4','heart2','heart3','heart5'];
}

function adventureFail(message,status=400){const error=new Error(message);error.status=status;throw error;}
export function applyAdventureAction(home,action,now,idFactory,role,random=Math.random){
 if(!['owner','partner'].includes(role))adventureFail('커플방 연결을 확인해 주세요.',403);
 if(typeof action.actionId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(action.actionId))adventureFail('저장 요청 번호를 확인해 주세요.');
 let data=adventureState(home.adventure);data.runs={...data.runs};data.operations=[...(data.operations||[])];
 if(data.operations.includes(action.actionId)){home.adventure=data;return;}
 if(action.type==='adventureStart'){
  const mode=action.mode??'explore';if(!['explore','offense','defense','mine'].includes(mode))adventureFail('모험 종류를 확인해 주세요.');
  const fieldVersion=mode==='mine'?MINE_FIELD_VERSION:mode==='explore'&&action.fieldVersion===EXPLORATION_FIELD_VERSION?EXPLORATION_FIELD_VERSION:1;
  const recommendedLevel=recommendedMapLevel(data),level=action.level??1;if(!Number.isInteger(level)||level<minimumMapLevel(recommendedLevel)||level>recommendedLevel)adventureFail('선택 가능한 맵 레벨을 확인해 주세요.');
  const previous=data.runs[role];
  if(previous?.requestId===action.actionId||previous&&!previous.finishedAt&&!action.restart&&(previous.mode||'explore')===mode&&(previous.fieldVersion??1)===fieldVersion&&(previous.level??1)===level){home.adventure=data;return;}
  const id=idFactory(),seed=Number.parseInt(id.replace(/-/g,'').slice(0,8),16)>>>0;
  const enemyCount=mode==='defense'?DEFENSE_TOTAL:['offense','mine'].includes(mode)?0:24+Math.floor((data.totalClears||0)/20)*4;
  data.runs[role]={id,seed,mode,fieldVersion,level:action.level===undefined?undefined:level,recommendedLevel,requestId:action.actionId,startedAt:now,enemyCount,finishedAt:null,reward:null};
 }else if(action.type==='adventureFinish'){
  const run=data.runs[role];if(!run||run.id!==action.runId)adventureFail('현재 탐험 기록이 아니에요. 새 탐험을 시작해 주세요.',409);
  if(run.finishedAt){home.adventure=data;return;}
  const mode=run.mode||'explore',ids=action.cleared;
  if(mode==='mine'){
   finishMineAdventure(home,data,run,action,now,role);data.operations=[...data.operations,action.actionId].slice(-128);home.adventure=data;return;
  }
  if(mode==='offense'){if(!Array.isArray(ids)||ids.length!==1||ids[0]!=='outpost-house')adventureFail('산채 본체를 파괴해야 해요.');}
  else if(mode==='defense'){
   const defeated=new Set(Array.isArray(ids)?ids:[]);
   const complete=Array.isArray(ids)&&ids.length===DEFENSE_TOTAL&&DEFENSE_WAVES.every((count,wave)=>Array.from({length:count},(_,i)=>`defense-${wave+1}-${i}`).every(id=>defeated.has(id)));
   if(!complete)adventureFail('방울이를 모두 막아야 해요.');
  }
  else{
   const mixed=run.fieldVersion===EXPLORATION_FIELD_VERSION;
   const required=mixed?EXPLORATION_GOALS.tree+EXPLORATION_GOALS.rock:100;
   if(!Array.isArray(ids)||ids.length!==required||new Set(ids).size!==required)adventureFail(mixed?'나무 50개와 바위 30개를 정리해야 해요.':'서로 다른 장애물 100개를 정리해야 해요.');
   const valid=new Map(createObstacles(run.seed,run.fieldVersion).map(o=>[o.id,o.type]));
   if(ids.some(id=>!valid.has(id)))adventureFail('필드의 장애물 기록을 확인해 주세요.');
   if(mixed&&ids.filter(id=>valid.get(id)==='tree').length!==EXPLORATION_GOALS.tree)adventureFail('나무 50개와 바위 30개를 정리해야 해요.');
  }
  const elapsed=Math.max(0,now-run.startedAt),durationMs=Number.isFinite(action.playTimeMs)&&action.playTimeMs>=0?Math.min(Math.round(action.playTimeMs),elapsed):elapsed,segments=rouletteTable(durationMs,run.level??null,run.recommendedLevel??1),tier=rouletteTier(durationMs,mode),index=Math.min(segments.length-1,Math.floor(Math.max(0,random())*segments.length)),reward={...[...ADVENTURE_REWARDS,{id:'heart1',label:'하트 1개',hearts:1},{id:'heart6',label:'하트 6개',hearts:6}].find(r=>r.id===segments[index]),index,segments,tier,stardust:mapStardustReward(tier.stardust,run.level??1,run.recommendedLevel??1)};home.hearts+=reward.hearts;data.stardust+=reward.stardust;
  const mixed=run.fieldVersion===EXPLORATION_FIELD_VERSION;
  data.totalClears=(data.totalClears||0)+1;data.history=[...(data.history||[]),{runId:run.id,clearNo:data.totalClears,at:now,startedAt:run.startedAt,durationMs,role,character:['momo','kuki'].includes(action.pet)?action.pet:'momo',enemyCount:run.enemyCount??24,mode,obstacles:mode==='explore'?ids.length:0,...(mixed?{trees:EXPLORATION_GOALS.tree,rocks:EXPLORATION_GOALS.rock}:{}),houses:mode==='offense'?1:0,reward:{...reward,index}}];
  data.runs[role]={...run,clearNo:data.totalClears,finishedAt:now,reward:{...reward,index},cleared:ids};
 }else if(action.type==='adventureInvest'){
  data=investAdventurePoint(data,action.pet,action.stat);
  }else if(action.type==='adventureReset'){
  const {pet,kind}=action;
  if(!['momo','kuki'].includes(pet)||!['stats','skills'].includes(kind))adventureFail('초기화 항목을 확인해 주세요.');
  data=convertAdventurePoints(data);
  if(data.stardust<500)adventureFail('초기화에는 별조각 500개가 필요해요.');
  const refund=kind==='stats'?statInvestmentTotal(data.stats[pet]):skillInvestmentTotal(data.skills[pet]);
  if(!refund)adventureFail('초기화할 강화 내역이 없어요.');
  data.stardust+=refund-500;
  data.statInvestment[pet]=Math.max(0,data.statInvestment[pet]-refund);
  if(kind==='stats')data.stats[pet]=initialAdventure().stats[pet];
  else data.skills[pet]={charge:1,ultimate:1};
 }else if(action.type==='adventureConvertPoints') {
  data=convertAdventurePoints(data);
 }else if(action.type==='adventureInvestStardustBatch'){
  data=investAdventureStardust(data,action.allocations);
 }else if(action.type==='adventureInvestBatch'){
  data=investAdventurePoints(data,action.allocations);
 }else if(action.type==='adventurePurchase'){
  const product=BATTLE_PRODUCTS.find(item=>item.id===action.product),quantity=action.quantity??1;
  if(!product||!Number.isSafeInteger(quantity)||quantity<1||quantity>1000)adventureFail('구매할 상품과 수량을 확인해 주세요.');
  const total=product.price*quantity;
  if(data.stardust<total)adventureFail('별조각이 부족해요.');
  if(!Number.isSafeInteger(data[product.field]+quantity))adventureFail('보유 수량을 확인해 주세요.');
  data.stardust-=total;
  data[product.field]+=quantity;
 }else if(action.type==='adventureSkillInvestBatch'||action.type==='adventureSkillInvestStardustBatch'){
  const allocations=action.allocations;
  if(!allocations||typeof allocations!=='object'||Array.isArray(allocations))adventureFail('강화할 스킬을 확인해 주세요.');
  let cost=0;
  for(const [pet,skills] of Object.entries(allocations)){
   if(!['momo','kuki'].includes(pet)||!skills||typeof skills!=='object'||Array.isArray(skills))adventureFail('강화할 친구를 확인해 주세요.');
   for(const [key,amount] of Object.entries(skills)){
    if(!['charge','ultimate'].includes(key)||!Number.isInteger(amount)||amount<1||data.skills[pet][key]+amount>10)adventureFail('스킬은 10레벨까지 강화할 수 있어요.');
    let paid=0;for(let i=1;i<=amount;i++)paid+=data.skills[pet][key]+i;cost+=paid;data.statInvestment = data.statInvestment || {momo:0,kuki:0};data.statInvestment[pet]+=paid*240;
    data.skills[pet][key]+=amount;
   }
  }
  if(action.type==='adventureSkillInvestStardustBatch'){data=convertAdventurePoints(data);if(!cost||cost*240>data.stardust)adventureFail('별조각이 부족해요.');data.stardust-=cost*240;}else{if(!cost||cost>data.skillPoints)adventureFail('스킬 포인트가 부족해요.');data.skillPoints-=cost;}
 }else if(action.type==='adventurePotion'){
  if(!['momo','kuki'].includes(action.pet)||!['hp','stamina'].includes(action.potion))adventureFail('회복할 친구와 물약을 확인해 주세요.');
  const field=action.potion==='hp'?'hpPotions':'staminaPotions';if(data[field]<1)adventureFail('보유한 회복약이 없어요.');data[field]--;
 }else adventureFail('탐험 동작을 확인해 주세요.');
 data.operations=[...(data.operations||[]),action.actionId].slice(-128);home.adventure=data;
}

function finishMineAdventure(home,data,run,action,now,role){
 if(run.fieldVersion!==MINE_FIELD_VERSION)adventureFail('광산이 업데이트됐어요. 새 채굴을 시작해 주세요.',409);
 if(!Number.isFinite(action.playTimeMs)||action.playTimeMs<MINE_SECONDS*1000||now-run.startedAt<MINE_SECONDS*1000)adventureFail('3분 채굴이 끝난 뒤 저장할 수 있어요.');
 const proof=action.mineProof;if(!proof||typeof proof!=='object'||Array.isArray(proof)||Object.keys(proof).length>200)adventureFail('별조각 수집 기록을 확인해 주세요.');
 const limits=mineOreLimits(run.seed,run.level??1);let amount=0;
 for(const [id,count] of Object.entries(proof)){if(!limits.has(id)||!Number.isSafeInteger(count)||count<1||count>limits.get(id))adventureFail('원석별 별조각 수집 기록을 확인해 주세요.');amount+=count;}
 const broken=action.brokenOres;if(!Array.isArray(broken)||new Set(broken).size!==broken.length||broken.some(id=>!limits.has(id)))adventureFail('광산 원석 기록을 확인해 주세요.');
 if(!Number.isSafeInteger(data.stardust+amount))adventureFail('별조각 수량을 확인해 주세요.');
 amount=Math.floor(amount*mapRewardFactor(run.level??1,run.recommendedLevel??1));
 const reward={id:'mine-stardust',label:'광산 채굴',stardust:amount,hearts:0};data.stardust+=amount;data.totalMines=(data.totalMines||0)+1;
 data.history=[...(data.history||[]),{runId:run.id,mineNo:data.totalMines,at:now,startedAt:run.startedAt,durationMs:MINE_SECONDS*1000,role,character:action.pet==='kuki'?'kuki':'momo',mode:'mine',obstacles:broken.length,reward}];
 data.runs[role]={...run,finishedAt:now,reward,cleared:broken};
}
