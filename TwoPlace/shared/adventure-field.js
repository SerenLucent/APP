export const EXPLORATION_FIELD_VERSION=4;
export const EXPLORATION_GOALS={tree:50,rock:30};
export const DEFENSE_WAVES=Array(7).fill(20);
export const DEFENSE_TOTAL=DEFENSE_WAVES.reduce((total,count)=>total+count,0);

export function createObstacles(initialSeed=74129,fieldVersion=1){
 if(fieldVersion>=2)return createMixedField(initialSeed,fieldVersion===3,fieldVersion>=4);
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

function createMixedField(initialSeed,compact=false,spacious=false){
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
 const bounds=spacious?{left:160,right:2440,top:170,bottom:1640}:compact?{left:450,right:2150,top:350,bottom:1400}:{left:210,right:2370,top:190,bottom:1580};
 const open=(x,y)=>x>=bounds.left&&x<=bounds.right&&y>=bounds.top&&y<=bounds.bottom
  &&!exclusions.some(([cx,cy,r])=>Math.hypot(x-cx,y-cy)<r)
  &&!items.some(item=>Math.hypot(x-item.x,y-item.y)<(spacious?108:compact?74:82));
 const place=(x,y)=>{if(open(x,y)){add(random()*(remaining.tree+remaining.rock)<remaining.tree?'tree':'rock',x,y);return true;}return false;};
 for(const [cx,cy] of (compact?[[850,1050],[1100,650],[1450,1050],[1800,650],[2000,1200]]:[[470,440],[1030,420],[1320,1300],[1990,1380],[2250,815]])){
  for(let attempts=0,placed=0;attempts<180&&placed<(spacious?6:compact?20:12);attempts++){
   const angle=random()*Math.PI*2,r=260*Math.sqrt(random());
   if(place(cx+Math.cos(angle)*r,cy+Math.sin(angle)*r))placed++;
  }
 }
 for(let attempt=0;attempt<4000&&items.length<160;attempt++)place(bounds.left+random()*(bounds.right-bounds.left),bounds.top+random()*(bounds.bottom-bounds.top));
 for(let y=bounds.top;y<=bounds.bottom&&items.length<160;y+=24){
  for(let x=bounds.left;x<=bounds.right&&items.length<160;x+=24)place(x,y);
 }
 return items;
}

export const EXPLORATION_WEIGHTS={tree:.5,rock:1.5,enemy:1};
export function explorationPercent(counts){return Math.min(100,(counts.tree||0)*.5+(counts.rock||0)*1.5+(counts.enemy||0));}
export function explorationEnemyCount(clears=0){return Math.round((24+Math.floor(clears/20)*4)*1.5);}
export function explorationProof(objects,enemies=[],version=EXPLORATION_FIELD_VERSION){if(version>=3)return [...objects,...enemies].filter(o=>o.hp<=0&&['tree','rock','enemy'].includes(o.type)).map(o=>o.id);return Object.entries(EXPLORATION_GOALS).flatMap(([type,count])=>objects.filter(item=>item.type===type&&item.hp<=0).slice(0,count).map(item=>item.id));}
