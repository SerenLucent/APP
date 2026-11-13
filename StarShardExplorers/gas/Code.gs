// GENERATED. Run npm run build:gas. StarShardExplorers only.
const EXPLORATION_FIELD_VERSION=2;
const EXPLORATION_GOALS={tree:50,rock:30};
const DEFENSE_WAVES=[4,6,8,4,6,8,4,6,8,4];
const DEFENSE_TOTAL=DEFENSE_WAVES.reduce((total,count)=>total+count,0);

function createObstacles(initialSeed=74129,fieldVersion=1){
 if(fieldVersion===EXPLORATION_FIELD_VERSION)return createMixedField(initialSeed);
 let seed=initialSeed>>>0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const items=[];
 // A deliberately gentle clearing, then denser woods toward the abandoned house.
 for(let i=0;i<400&&items.length<158;i++){
  const x=210+rand()*2160,y=190+rand()*1390;
  if(Math.hypot(x-550,y-1040)<240||Math.hypot(x-2070,y-420)<200)continue;
  const type=rand()<.56?'tree':'rock',hp=type==='tree'?60:200;
  items.push({id:i,x,y,type,hp,max:hp,radius:type==='tree'?26:32,flash:0});
 }
 items.unshift({id:'first-tree',x:680,y:1040,type:'tree',hp:60,max:60,radius:26,flash:0},{id:'first-rock',x:490,y:860,type:'rock',hp:200,max:200,radius:32,flash:0});
 return items;
}

function createMixedField(initialSeed){
 let seed=initialSeed>>>0;
 const random=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const items=[];
 const remaining={tree:100,rock:60};
 function add(type,x,y){
  const hp=type==='tree'?60:200;
  items.push({id:'field-'+items.length,x,y,type,hp,max:hp,radius:type==='tree'?26:32,flash:0});
  remaining[type]--;
 }
 add('tree',680,1040);
 add('rock',490,860);
 const exclusions=[[550,1040,220],[2070,420,200],[1030,1040,102],[1520,690,92],[1870,1040,102]];
 const open=(x,y)=>x>=210&&x<=2370&&y>=190&&y<=1580
  &&!exclusions.some(([cx,cy,r])=>Math.hypot(x-cx,y-cy)<r)
  &&!items.some(item=>Math.hypot(x-item.x,y-item.y)<82);
 const place=(x,y)=>{if(open(x,y)){add(random()*(remaining.tree+remaining.rock)<remaining.tree?'tree':'rock',x,y);return true;}return false;};
 for(const [cx,cy] of [[470,440],[1030,420],[1320,1300],[1990,1380],[2250,815]]){
  for(let attempts=0,placed=0;attempts<180&&placed<12;attempts++){
   const angle=random()*Math.PI*2,r=260*Math.sqrt(random());
   if(place(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r))placed++;
  }
 }
 for(let attempt=0;attempt<4000&&items.length<160;attempt++)place(210+random()*2160,190+random()*1390);
 for(let y=190;y<=1580&&items.length<160;y+=42){
  for(let x=210;x<=2370&&items.length<160;x+=42)place(x,y);
 }
 return items;
}

function explorationProof(objects){
 return Object.entries(EXPLORATION_GOALS).flatMap(([type,count])=>
  objects.filter(item=>item.type===type&&item.hp<=0).slice(0,count).map(item=>item.id));
}

function skillBalance(level=1){
 const current=Math.max(1,Math.min(10,Math.floor(Number(level)||1)));
 return {
  level:current,
  spinDuration:3.5+(current-1)*.5,
  tailMultiplier:30+(current-1)*2+(current===10?2:0),
  tailStunChance:current/10,
  meteorCount:current+4,
  slamCoverage:.5+(current-1)/18,
  ultimateMultiplier:1+(current-1)*.1,
 };
}

const MINE_SECONDS=180;
const MINE_FIELD_VERSION=1;
const MINE_CAVE_NAMES=['반짝 동굴','푸른 동굴','깊은 동굴','비밀 동굴'];
const MINE_DAMAGE_PER_SHARD=50;
const MINE_BREAK_SHARDS=2;
function createMine(random=Math.random){
 const caves=MINE_CAVE_NAMES.map((name,c)=>{
  const rich=random()<.12,groups=[1,2,3,...(rich?[4,5]:[])],extra=rich?2:3+Math.floor(random()*2);
  for(let i=0;i<extra;i++){const roll=random();groups.push(rich?(roll<.4?3:roll<.75?4:5):(roll<.24?1:roll<.65?2:roll<.98?3:4));}
  // Separate veins leave walking lanes; stones within a vein touch without sharing collision centers.
  const centers=[],ores=[];
  for(let g=0;g<groups.length;g++){
   let x=g===0?1560:g===1?1300:650+random()*1300,y=g===0?1290:g===1?1170:530+random()*650;
   for(let attempt=0;g>1&&centers.some(p=>Math.hypot(p.x-x,p.y-y)<245)&&attempt<60;attempt++){x=650+random()*1300;y=530+random()*650;}
   if(centers.some(p=>Math.hypot(p.x-x,p.y-y)<220)){const slots=[[740,650],[1060,650],[1380,650],[1730,650],[740,970],[1740,990],[1020,960],[1950,1240]];const slot=slots.find(([sx,sy])=>centers.every(p=>Math.hypot(p.x-sx,p.y-sy)>=220));if(slot)[x,y]=slot;}
   centers.push({x,y});
   const count=groups[g],rotation=random()*Math.PI*2,offsets=count===1?[[0,0]]:count===2?[[-42,0],[42,0]]:count===3?[[-42,0],[42,0],[0,-73]]:count===4?[[-42,-42],[42,-42],[-42,42],[42,42]]:[[-84,0],[0,0],[84,0],[-42,-73],[42,-73]];
   const veinHp=160+random()*520;
   for(const [dx,dy] of offsets){const hp=Math.round((veinHp*(.8+random()*.4))/10)*10;ores.push({id:'ore-'+c+'-'+ores.length,type:'ore',name:'별조각 원석',vein:g,veinSize:count,x:x+dx*Math.cos(rotation)-dy*Math.sin(rotation),y:y+dx*Math.sin(rotation)+dy*Math.cos(rotation),radius:32,hp,max:hp,flash:0,harvest:0,tint:random()});}
  }
  return {name,rich,veins:groups,ores,drops:[],broken:0};
 });
 return {room:-1,caves,total:0,collectedByOre:{},broken:0,travelLock:0,finished:false};
}

function createSeededMine(seed){let value=seed>>>0;return createMine(()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296));}
function mineOreBudget(ore,level=1){
 const baseHp=ore.baseHp??ore.max??ore.hp,factor=1+.25*Math.max(0,level-1),baseDeposit=Math.floor(baseHp/100)+1,depositFactor=1+.5*Math.floor(Math.max(0,level-1)/10);
 return {baseHp,hp:Math.round(baseHp*factor),deposit:Math.floor(baseDeposit*depositFactor)};
}
function prepareMineLevel(mine,level=1){for(const cave of mine.caves)for(const ore of cave.ores){const b=mineOreBudget(ore,level);Object.assign(ore,{baseHp:b.baseHp,hp:b.hp,max:b.hp,deposit:b.deposit,emitted:0,harvest:0});}return mine;}
function mineOreLimits(seed,level=1){return new Map(createSeededMine(seed).caves.flatMap(c=>c.ores.map(o=>[o.id,mineOreBudget(o,level).deposit])));}

const ADVENTURE_STATS={strength:{name:'힘',description:'공격력 최소 +1 · 최대 +2'},vitality:{name:'체력',description:'최대 HP +5'},stamina:{name:'기력',description:'최대 SP +5'},dexterity:{name:'재주',description:'최대 피해 확률·스킬 충전량·차지 속도 증가'},luck:{name:'운',description:'치명타 확률 +0.7%'}};
function initialAdventure(){const stat=()=>Object.fromEntries(Object.keys(ADVENTURE_STATS).map(k=>[k,0]));return {stardust:0,skillPoints:0,skills:{momo:{charge:1,ultimate:1},kuki:{charge:1,ultimate:1}},hpPotions:0,staminaPotions:0,points:0,totalClears:0,history:[],stats:{momo:stat(),kuki:stat()},runs:{}};}
function adventureState(saved){const fresh=initialAdventure();if(!saved)return fresh;return {...fresh,...saved,investmentIncludesSkills:true,statInvestment:{momo:(saved.statInvestment?.momo??statInvestmentTotal(saved.stats?.momo))+(saved.investmentIncludesSkills?0:skillInvestmentTotal(saved.skills?.momo)),kuki:(saved.statInvestment?.kuki??statInvestmentTotal(saved.stats?.kuki))+(saved.investmentIncludesSkills?0:skillInvestmentTotal(saved.skills?.kuki))},history:[...(saved.history||[])],skills:{momo:{charge:skillBalance(saved.skills?.momo?.charge).level,ultimate:skillBalance(saved.skills?.momo?.ultimate).level},kuki:{charge:skillBalance(saved.skills?.kuki?.charge).level,ultimate:skillBalance(saved.skills?.kuki?.ultimate).level}},stats:{momo:{...fresh.stats.momo,...saved.stats?.momo},kuki:{...fresh.stats.kuki,...saved.stats?.kuki}},runs:{...saved.runs}};}
function characterStats(id,points={}){const strength=points.strength||0,vitality=points.vitality||0,stamina=points.stamina||0,luck=points.luck||0,dexterity=points.dexterity||0;return {maxHp:100+vitality*5,maxSp:100+stamina*5,minAttack:(id==='momo'?8:10)+strength,maxAttack:(id==='momo'?15:20)+strength*2,critical:(id==='momo'?.1:.05)+luck*.007,dexterity};}
function rollAttack(id,points={},random=Math.random){const stats=characterStats(id,points),bias=stats.dexterity/100,roll=Math.max(0,Math.min(.999999999,random())),raw=stats.minAttack+Math.floor((stats.maxAttack-stats.minAttack+1)*(bias+(1-bias)*roll)),damage=Math.min(stats.maxAttack,raw),critical=random()<stats.critical;return {damage:damage*(critical?2:1),base:damage,critical};}
function statPointCost(current,amount=1){
 let cost=0;
 for(let i=0;i<amount;i++)cost+=2+Math.floor((current+i)/10);
 return cost;
}
function statStardustCost(current,amount=1){let cost=0;for(let i=0;i<amount;i++)cost+=200+100*Math.floor((current+i)/10);return cost;}
function availableStatStardust(profile){return (profile.stardust||0)+((profile.points||0)+(profile.skillPoints||0))*240;}
function convertAdventurePoints(current){const data=adventureState(current),total=availableStatStardust(data);if(!Number.isSafeInteger(total))adventureFail('별조각 수량을 확인해 주세요.');data.stardust=total;data.points=0;data.skillPoints=0;return data;}
function investAdventureStardust(current,allocations){
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
function investAdventurePoint(current,id,key){
 return investAdventurePoints(current,{[id]:{[key]:1}});
}

function skillInvestmentTotal(skills){return ['charge','ultimate'].reduce((sum,key)=>{const level=skillBalance(skills?.[key]).level;return sum+(level*(level+1)/2-1)*240;},0);}
function statInvestmentTotal(stats){return Object.keys(ADVENTURE_STATS).reduce((sum,key)=>sum+statStardustCost(0,stats?.[key]??0),0);}
function investmentLevel(total=0){let level=1,progress=Math.max(0,Math.floor(total)),required=1000;while(progress>=required){progress-=required;level++;required=1000+500*Math.floor((level-1)/10);}return {level,progress,required,invested:Math.max(0,Math.floor(total))};}
function adventureLevel(stats,investment){return investmentLevel(investment??statInvestmentTotal(stats));}

function recommendedMapLevel(profile){return Math.max(1,Math.floor((adventureLevel(profile?.stats?.momo,profile?.statInvestment?.momo).level+adventureLevel(profile?.stats?.kuki,profile?.statInvestment?.kuki).level)/2));}
function mapScaling(level=1){const n=Math.max(0,level-1);return {hp:1+n*.25,damage:1+n*.2};}
const minimumMapLevel=recommended=>Math.max(1,recommended-2);
const mapRewardFactor=(level,recommended)=>.5**Math.max(0,recommended-level);
function mapStardustReward(base,level=1,recommended=1){return Math.floor(base*(1+.5*Math.floor(Math.max(0,level-1)/10))*mapRewardFactor(level,recommended));}
function scaleMapTarget(target,level=1){if(target.mapScaled)return target;const factor=mapScaling(level).hp;target.hp=Math.round(target.hp*factor);target.max=Math.round(target.max*factor);target.mapScaled=true;return target;}
function investAdventurePoints(current,allocations){
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
const BATTLE_PRODUCTS=[
 {id:'statPoint',name:'스탯 포인트',price:240,field:'points',description:'능력치 강화에 사용해요.'},
 {id:'skillPoint',name:'스킬 포인트',price:240,field:'skillPoints',description:'모모와 쿠키의 스킬을 강화해요.'},
 {id:'hpPotion',name:'HP 회복약',price:5,field:'hpPotions',description:'현재 캐릭터의 HP를 20 회복해요.'},
 {id:'spPotion',name:'SP 회복약',price:8,field:'staminaPotions',description:'현재 캐릭터의 SP를 20 회복해요.'},
];
const ADVENTURE_COOLDOWNS={explore:600000,offense:600000,defense:600000,mine:300000};
const ADVENTURE_REWARDS=[180,200,220,240].map(stardust=>({id:'shard'+stardust,label:'별조각 '+stardust+'개',stardust,hearts:0}));
function rouletteTier(durationMs,mode='explore'){
 const baseline=mode==='defense'?150000:120000;
 return durationMs<=baseline*.85?{id:'S',label:'S',stardust:60}
  :durationMs<=baseline?{id:'A',label:'A',stardust:50}
  :durationMs<=baseline*1.25?{id:'B',label:'B',stardust:45}
  :{id:'C',label:'C',stardust:40};
}
function rouletteTable(durationMs,level=null,recommended=1){
 return Array.from({length:12},(_,i)=>ADVENTURE_REWARDS[i%4].id);
}

function adventureFail(message,status=400){const error=new Error(message);error.status=status;throw error;}
function applyAdventureAction(home,action,now,idFactory,role,random=Math.random){
 if(role!=='player')adventureFail('플레이어 저장을 확인해 주세요.',403);
 if(typeof action.actionId!=='string'||!/^[a-zA-Z0-9_-]{16,80}$/.test(action.actionId))adventureFail('저장 요청 번호를 확인해 주세요.');
 let data=adventureState(home.adventure);data.runs={...data.runs};data.operations=[...(data.operations||[])];
 if(data.operations.includes(action.actionId)){home.adventure=data;return;}
 if(action.type==='adventureStart'){
  const mode=action.mode??'explore';if(!['explore','offense','defense','mine'].includes(mode))adventureFail('모험 종류를 확인해 주세요.');
  const fieldVersion=mode==='mine'?MINE_FIELD_VERSION:mode==='explore'&&action.fieldVersion===EXPLORATION_FIELD_VERSION?EXPLORATION_FIELD_VERSION:1;
  const recommendedLevel=recommendedMapLevel(data),level=action.level??1;if(!Number.isInteger(level)||level<minimumMapLevel(recommendedLevel)||level>recommendedLevel)adventureFail('선택 가능한 맵 레벨을 확인해 주세요.');
  const previous=data.runs[role];
  if(previous?.requestId===action.actionId||previous&&!previous.finishedAt&&!action.restart&&(previous.mode||'explore')===mode&&(previous.fieldVersion??1)===fieldVersion&&(previous.level??1)===level){home.adventure=data;return;}
  const remaining=(data.cooldowns?.[mode]||0)-now;if(remaining>0)adventureFail('재건중이에요. '+Math.ceil(remaining/1000)+'초 후 입장할 수 있어요.',429);
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
  const elapsed=Math.max(0,now-run.startedAt),durationMs=Number.isFinite(action.playTimeMs)&&action.playTimeMs>=0?Math.min(Math.round(action.playTimeMs),elapsed):elapsed,segments=rouletteTable(durationMs,run.level??null,run.recommendedLevel??1),tier=rouletteTier(durationMs,mode),index=Math.min(segments.length-1,Math.floor(Math.max(0,random())*segments.length)),selected=ADVENTURE_REWARDS.find(r=>r.id===segments[index]),amount=mapStardustReward(selected.stardust,run.level??1,run.recommendedLevel??1),reward={...selected,label:'별조각 '+amount+'개',index,segments,tier,stardust:amount};data.stardust+=reward.stardust;
  const mixed=run.fieldVersion===EXPLORATION_FIELD_VERSION;
  data.totalClears=(data.totalClears||0)+1;data.history=[...(data.history||[]),{runId:run.id,clearNo:data.totalClears,at:now,startedAt:run.startedAt,durationMs,role,character:['momo','kuki'].includes(action.pet)?action.pet:'momo',enemyCount:run.enemyCount??24,mode,obstacles:mode==='explore'?ids.length:0,...(mixed?{trees:EXPLORATION_GOALS.tree,rocks:EXPLORATION_GOALS.rock}:{}),houses:mode==='offense'?1:0,reward:{...reward,index}}];
  data.cooldowns={...data.cooldowns,[mode]:now+ADVENTURE_COOLDOWNS[mode]};
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
 data.cooldowns={...data.cooldowns,mine:now+ADVENTURE_COOLDOWNS.mine};
 data.runs[role]={...run,finishedAt:now,reward,cleared:broken};
}

// Personal saves are private Drive files. Never reuses the TwoPlace script or folders.
const EXPLORER_ACTIONS=['adventureStart','adventureFinish','adventureInvestStardustBatch','adventureSkillInvestStardustBatch','adventureReset','adventurePurchase','adventurePotion'];
function explorerFail_(status,message){throw Object.assign(new Error(message),{status:status});}
function explorerJson_(status,data,error){return ContentService.createTextOutput(JSON.stringify({status:status,...(error?{error:error}:{data:data})})).setMimeType(ContentService.MimeType.JSON);}
function explorerDigest_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(n=>((n+256)%256).toString(16).padStart(2,'0')).join('');}
function setupStarShardExplorers(){
 const properties=PropertiesService.getScriptProperties();let id=properties.getProperty('EXPLORER_ROOT_FOLDER_ID');
 if(!id){const folder=DriveApp.createFolder('StarShardExplorers · Private Players');id=folder.getId();properties.setProperty('EXPLORER_ROOT_FOLDER_ID',id);}
 console.log('별조각 탐험대 개인 저장 폴더: https://drive.google.com/drive/folders/'+id);
 return id;
}
function explorerRoot_(){const id=PropertiesService.getScriptProperties().getProperty('EXPLORER_ROOT_FOLDER_ID');if(!id)explorerFail_(503,'개인 저장 서버를 준비 중이에요.');return DriveApp.getFolderById(id);}
function explorerChild_(parent,name,create){const matches=parent.getFoldersByName(name);return matches.hasNext()?matches.next():create?parent.createFolder(name):null;}
function explorerFile_(parent,name){const matches=parent.getFilesByName(name);return matches.hasNext()?matches.next():null;}
function explorerRead_(file){return JSON.parse(file.getBlob().getDataAsString('UTF-8'));}
function explorerWrite_(folder,name,data,file){const text=JSON.stringify(data);return file?(file.setContent(text),file):folder.createFile(name,text,MimeType.PLAIN_TEXT);}
function explorerPlayer_(token,create){
 if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))explorerFail_(401,'저장 복구코드를 확인해 주세요.');
 const hash=explorerDigest_(token),cache=CacheService.getScriptCache(),key='player:'+hash;
 let folder,id=cache.get(key);if(id){try{folder=DriveApp.getFolderById(id);folder.getName();}catch(e){folder=null;cache.remove(key);}}
 if(!folder){folder=explorerChild_(explorerRoot_(),hash,false)||explorerSessionFolder_(hash);if(!folder&&create){const admission='create:'+Math.floor(Date.now()/60000),count=Number(cache.get(admission)||0);if(count>=30)explorerFail_(429,'새 플레이어 생성이 많아요. 잠시 후 다시 시도해 주세요.');cache.put(admission,String(count+1),120);folder=explorerChild_(explorerRoot_(),hash,true);}if(folder)cache.put(key,folder.getId(),21600);}
 if(!folder)explorerFail_(401,'저장 정보를 찾을 수 없어요. 복구코드를 확인해 주세요.');
 let file=explorerFile_(folder,'profile.json');if(!file){if(!create)explorerFail_(401,'저장 정보를 찾을 수 없어요.');file=explorerWrite_(folder,'profile.json',{schema:1,createdAt:Date.now(),state:{version:0,hearts:0,adventure:initialAdventure()},historySince:null,historyOutbox:[]});}
 const record=explorerRead_(file),entry={folder:folder,file:file,record:record};explorerFlush_(entry);return entry;
}
function explorerBucket_(at){const day=Utilities.formatDate(new Date(at),'Asia/Seoul','yyyy-MM-dd').split('-'),start=Number(day[2])-((Number(day[2])-1)%3);return {year:day[0],month:day[1],name:'clear_'+day[0]+'_'+day[1]+'_'+String(start).padStart(2,'0')+'.json'};}
function explorerHistoryFolder_(player,bucket,create){let folder=explorerChild_(player,'game-history',create);if(!folder)return null;folder=explorerChild_(folder,bucket.year,create);return folder?explorerChild_(folder,bucket.month,create):null;}
function explorerFlush_(entry){
 const outbox=entry.record.historyOutbox||[];if(!outbox.length)return;
 // Durable outbox: interrupted history writes are retried before any response.
 for(const event of outbox){const bucket=explorerBucket_(event.at),folder=explorerHistoryFolder_(entry.folder,bucket,true),file=explorerFile_(folder,bucket.name),log=file?explorerRead_(file):{entries:[]};if(!log.entries.some(e=>e.runId===event.runId)){log.entries.push(event);explorerWrite_(folder,bucket.name,log,file);}}
 entry.record.historyOutbox=[];explorerWrite_(entry.folder,'profile.json',entry.record,entry.file);
}
function explorerHistory_(entry,query){
 const start=query.start,end=query.end;if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||''))explorerFail_(400,'조회 기간을 확인해 주세요.');
 const from=Date.parse(start+'T00:00:00+09:00'),to=Date.parse(end+'T23:59:59.999+09:00');if(!Number.isFinite(from)||!Number.isFinite(to)||to<from||to-from>32*86400000)explorerFail_(400,'이력은 최대 31일간 조회할 수 있어요.');
 const seen={},events=[];for(let at=from;at<=to;at+=86400000){const bucket=explorerBucket_(at);if(seen[bucket.name])continue;seen[bucket.name]=true;const folder=explorerHistoryFolder_(entry.folder,bucket,false),file=folder&&explorerFile_(folder,bucket.name);if(file)events.push(...explorerRead_(file).entries.filter(e=>e.at>=from&&e.at<=to));}
 return {entries:events.sort((a,b)=>b.at-a.at),since:entry.record.historySince};
}
function explorerRoute_(request){
 const path=request.path,method=request.method||'GET';
 if(path==='/api/account'||path==='/api/email/request'||path==='/api/email/verify')return explorerEmailRoute_(request);
 if(path==='/api/health')return {game:'StarShardExplorers',storage:'private-drive-json',version:1};
 if(!['/api/player','/api/save','/api/action','/api/history'].includes(path))explorerFail_(404,'요청한 기능을 찾을 수 없어요.');
 if(path==='/api/player'&&method!=='POST'||['/api/save','/api/history'].includes(path)&&method!=='GET'||path==='/api/action'&&method!=='POST')explorerFail_(405,'지원하지 않는 요청이에요.');
 const entry=explorerPlayer_(request.token,path==='/api/player'),state=entry.record.state;
 if(path==='/api/history')return explorerHistory_(entry,request.query||{});
 if(path!=='/api/action')return state;
 const action=request.body;if(!action||!EXPLORER_ACTIONS.includes(action.type))explorerFail_(400,'지원하지 않는 게임 동작이에요.');
 if(state.adventure.operations&&state.adventure.operations.includes(action.actionId))return state;
 if(action.version!==state.version)explorerFail_(409,'다른 화면의 저장 내용을 확인하고 있어요. 다시 시도해 주세요.');
 applyAdventureAction(state,action,Date.now(),()=>Utilities.getUuid(),'player');
 const events=state.adventure.history||[];entry.record.historyOutbox=events;
 if(events.length)entry.record.historySince=entry.record.historySince===null?events[0].at:Math.min(entry.record.historySince,events[0].at);
 state.adventure.history=[];state.version++;entry.record.updatedAt=Date.now();explorerWrite_(entry.folder,'profile.json',entry.record,entry.file);explorerFlush_(entry);return state;
}
function doGet(){return explorerJson_(200,{game:'StarShardExplorers',storage:'private-drive-json',version:1});}
function doPost(e){
 const lock=LockService.getScriptLock();let locked=false;
 try{const raw=e&&e.postData&&e.postData.contents;if(!raw||raw.length>262144)explorerFail_(400,'저장 요청을 확인해 주세요.');let request;try{request=JSON.parse(raw);}catch(_){explorerFail_(400,'저장 요청을 확인해 주세요.');}if(!request||typeof request!=='object'||Array.isArray(request))explorerFail_(400,'저장 요청을 확인해 주세요.');if(!lock.tryLock(20000))explorerFail_(503,'다른 저장을 처리하고 있어요. 잠시 후 다시 시도해 주세요.');locked=true;return explorerJson_(200,explorerRoute_(request));}
 catch(error){const status=error.status||500;return explorerJson_(status,null,status===500?'개인 저장에 실패했어요. 잠시 후 다시 시도해 주세요.':error.message);}
 finally{if(locked)lock.releaseLock();}
}

// OTPs and email indexes stay in the same private Drive root; raw recovery tokens are never persisted.
const EXPLORER_OTP_LIFETIME=10*60*1000;
function explorerEmail_(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))explorerFail_(400,'이메일 주소를 확인해 주세요.');return email;}
function explorerEmailSecret_(){const props=PropertiesService.getScriptProperties();let secret=props.getProperty('EXPLORER_EMAIL_SECRET');if(!secret){secret=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');props.setProperty('EXPLORER_EMAIL_SECRET',secret);}return secret;}
function explorerHmac_(value){return Utilities.computeHmacSha256Signature(value,explorerEmailSecret_(),Utilities.Charset.UTF_8).map(n=>((n+256)%256).toString(16).padStart(2,'0')).join('');}
function explorerMaskEmail_(email){const parts=email.split('@');return parts[0].slice(0,Math.min(2,parts[0].length))+'***@'+parts[1];}
function explorerEmailFolder_(email,create){const root=explorerChild_(explorerRoot_(),'_email-accounts',create);return root?explorerChild_(root,explorerHmac_('email:'+email),create):null;}
function explorerEmailAccount_(folder){const file=folder&&explorerFile_(folder,'account.json');return file?explorerRead_(file):null;}
function explorerSessionFolder_(hash){const sessions=explorerChild_(explorerRoot_(),'_device-sessions',false),file=sessions&&explorerFile_(sessions,hash+'.json');return file?DriveApp.getFolderById(explorerRead_(file).playerFolderId):null;}
function explorerAccountStatus_(token){const entry=explorerPlayer_(token,false);return {linked:!!entry.record.linkedEmail,maskedEmail:entry.record.linkedEmail?explorerMaskEmail_(entry.record.linkedEmail):null};}
function explorerEmailCodeHash_(challenge,code){return explorerHmac_(JSON.stringify([challenge.requestId,challenge.email,challenge.purpose,challenge.boundHash,code]));}
function explorerEmailRequest_(request){
 const body=request.body||{},email=explorerEmail_(body.email),purpose=body.purpose,id=body.requestId,now=Date.now();
 if(!['link','login'].includes(purpose)||typeof id!=='string'||! /^[a-zA-Z0-9_-]{16,80}$/.test(id))explorerFail_(400,'인증 요청을 확인해 주세요.');
 const entry=purpose==='link'?explorerPlayer_(request.token,false):null;
 if(entry&&entry.record.linkedEmail){if(entry.record.linkedEmail!==email)explorerFail_(409,'이미 다른 이메일에 연결된 기록이에요.');return {alreadyLinked:true,maskedEmail:explorerMaskEmail_(email)};}
 const folder=explorerEmailFolder_(email,true),account=explorerEmailAccount_(folder),boundHash=entry?explorerDigest_(request.token):null;
 if(entry&&account&&account.playerFolderId!==entry.folder.getId())explorerFail_(409,'이미 다른 기록이 연결된 이메일이에요. 이메일로 이어하기를 이용해 주세요.');
 const existingFile=explorerFile_(folder,'challenge.json'),existing=existingFile?explorerRead_(existingFile):null;
 if(existing&&existing.requestId===id){if(existing.purpose!==purpose||existing.boundHash!==boundHash)explorerFail_(400,'인증 요청을 확인해 주세요.');if(existing.sent&&existing.expiresAt>now)return {challengeId:id,expiresAt:existing.expiresAt,resendAt:existing.createdAt+60000};explorerFail_(400,'인증번호를 다시 요청해 주세요.');}
 const rateFile=explorerFile_(folder,'rate.json'),rate=rateFile?explorerRead_(rateFile):{last:0,hour:now,count:0};
 if(rate.last&&now-rate.last<60000)explorerFail_(429,'인증번호는 1분 후 다시 보낼 수 있어요.');
 if(now-rate.hour>=3600000){rate.hour=now;rate.count=0;}if(rate.count>=5)explorerFail_(429,'인증 요청이 많아요. 1시간 후 다시 시도해 주세요.');
 const shouldSend=purpose==='link'||!!account;
 const props=PropertiesService.getScriptProperties(),today=Utilities.formatDate(new Date(now),'Asia/Seoul','yyyy-MM-dd');let usage=JSON.parse(props.getProperty('EXPLORER_EMAIL_USAGE')||'null');if(!usage||usage.day!==today)usage={day:today,count:0};
 if(shouldSend&&(MailApp.getRemainingDailyQuota()<1||usage.count>=Number(props.getProperty('EXPLORER_EMAIL_DAILY_LIMIT')||80)))explorerFail_(503,'오늘 인증메일 발송량을 모두 사용했어요. 나중에 다시 시도해 주세요.');
 const code=String(Number.parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,8),16)%1000000).padStart(6,'0');
 const challenge={requestId:id,email:email,purpose:purpose,boundHash:boundHash,playerFolderId:entry?entry.folder.getId():account?account.playerFolderId:null,createdAt:now,expiresAt:now+EXPLORER_OTP_LIFETIME,attempts:0,sent:false};challenge.codeHash=explorerEmailCodeHash_(challenge,code);
 const file=explorerWrite_(folder,'challenge.json',challenge,existingFile);rate.last=now;rate.count++;explorerWrite_(folder,'rate.json',rate,rateFile);
 if(shouldSend){usage.count++;props.setProperty('EXPLORER_EMAIL_USAGE',JSON.stringify(usage));try{MailApp.sendEmail({to:email,name:'별조각 탐험대 · LUCENTY LABS',subject:'[별조각 탐험대] '+(purpose==='link'?'이메일 연동':'이어하기')+' 인증번호',body:'인증번호: '+code+'\n\n별조각 탐험대에서 '+(purpose==='link'?'현재 게스트 기록을 이메일에 연결':'기존 기록으로 이어하기')+'하려면 이 번호를 입력해 주세요.\n인증번호는 10분 동안 유효하며, 다른 사람에게 알려주지 마세요.\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.\n\nLUCENTY LABS'});}catch(error){explorerFail_(503,'인증메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');}}
 challenge.sent=true;explorerWrite_(folder,'challenge.json',challenge,file);return {challengeId:id,expiresAt:challenge.expiresAt,resendAt:now+60000};
}
function explorerEmailVerify_(request){
 const body=request.body||{},email=explorerEmail_(body.email),folder=explorerEmailFolder_(email,false),file=folder&&explorerFile_(folder,'challenge.json'),challenge=file?explorerRead_(file):null,now=Date.now();
 if(!challenge||challenge.requestId!==body.challengeId||challenge.purpose!==body.purpose||!challenge.sent||challenge.expiresAt<=now)explorerFail_(400,'인증 요청이 만료됐어요. 번호를 다시 받아 주세요.');
 let linkedEntry=null,deviceHash=null;
 if(challenge.purpose==='link'){
  linkedEntry=explorerPlayer_(request.token,false);if(explorerDigest_(request.token)!==challenge.boundHash||linkedEntry.folder.getId()!==challenge.playerFolderId)explorerFail_(403,'번호를 요청한 기기에서 연동해 주세요.');
 }else{
  if(typeof body.deviceToken!=='string'||! /^[a-f0-9]{64}$/.test(body.deviceToken))explorerFail_(400,'기기 연결을 확인해 주세요.');deviceHash=explorerDigest_(body.deviceToken);
 }
 if(challenge.completedAt&&challenge.completedDeviceHash!==deviceHash)explorerFail_(400,'이미 사용한 인증번호예요. 번호를 다시 받아 주세요.');
 if(challenge.attempts>=5)explorerFail_(429,'인증번호를 여러 번 틀렸어요. 번호를 다시 받아 주세요.');
 if(! /^\d{6}$/.test(String(body.code||''))||explorerEmailCodeHash_(challenge,String(body.code))!==challenge.codeHash||!challenge.playerFolderId){challenge.attempts++;explorerWrite_(folder,'challenge.json',challenge,file);explorerFail_(400,'인증번호를 확인해 주세요.');}
 if(challenge.purpose==='link'){
  const account=explorerEmailAccount_(folder);if(account&&account.playerFolderId!==linkedEntry.folder.getId())explorerFail_(409,'다른 기록이 이미 연결되어 있어요. 현재 기록은 변경하지 않았어요.');
  if(linkedEntry.record.linkedEmail&&linkedEntry.record.linkedEmail!==email)explorerFail_(409,'이미 다른 이메일이 연결되어 있어요.');
  explorerWrite_(folder,'account.json',{playerFolderId:linkedEntry.folder.getId(),linkedAt:now},explorerFile_(folder,'account.json'));
  linkedEntry.record.linkedEmail=email;linkedEntry.record.emailLinkedAt=now;explorerWrite_(linkedEntry.folder,'profile.json',linkedEntry.record,linkedEntry.file);
 }else{
  const account=explorerEmailAccount_(folder);if(!account||account.playerFolderId!==challenge.playerFolderId)explorerFail_(400,'인증번호를 다시 받아 주세요.');
  const direct=explorerChild_(explorerRoot_(),deviceHash,false),alias=explorerSessionFolder_(deviceHash);if(direct&&direct.getId()!==account.playerFolderId||alias&&alias.getId()!==account.playerFolderId)explorerFail_(409,'이 기기 연결 요청을 다시 시작해 주세요.');
  const sessions=explorerChild_(explorerRoot_(),'_device-sessions',true);explorerWrite_(sessions,deviceHash+'.json',{playerFolderId:account.playerFolderId,createdAt:now},explorerFile_(sessions,deviceHash+'.json'));CacheService.getScriptCache().put('player:'+deviceHash,account.playerFolderId,21600);
 }
 challenge.completedAt=challenge.completedAt||now;challenge.completedDeviceHash=deviceHash;explorerWrite_(folder,'challenge.json',challenge,file);
 return {linked:true,maskedEmail:explorerMaskEmail_(email)};
}
function explorerEmailRoute_(request){
 if(request.path==='/api/account'&&(request.method||'GET')==='GET')return explorerAccountStatus_(request.token);
 if(request.method!=='POST')explorerFail_(405,'지원하지 않는 요청이에요.');
 if(request.path==='/api/email/request')return explorerEmailRequest_(request);
 if(request.path==='/api/email/verify')return explorerEmailVerify_(request);
 explorerFail_(404,'요청한 기능을 찾을 수 없어요.');
}
