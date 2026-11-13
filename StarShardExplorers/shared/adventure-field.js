export const EXPLORATION_FIELD_VERSION=2;
export const EXPLORATION_GOALS={tree:50,rock:30};
export const DEFENSE_WAVES=[4,6,8,4,6,8,4,6,8,4];
export const DEFENSE_TOTAL=DEFENSE_WAVES.reduce((total,count)=>total+count,0);

export function createObstacles(initialSeed=74129,fieldVersion=1){
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

export function explorationProof(objects){
 return Object.entries(EXPLORATION_GOALS).flatMap(([type,count])=>
  objects.filter(item=>item.type===type&&item.hp<=0).slice(0,count).map(item=>item.id));
}
