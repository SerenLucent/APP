export const MINE_SECONDS=180;
export const MINE_FIELD_VERSION=1;
export const MINE_CAVE_NAMES=['반짝 동굴','푸른 동굴','깊은 동굴','비밀 동굴'];
export const MINE_DAMAGE_PER_SHARD=50;
export const MINE_BREAK_SHARDS=2;
export function createMine(random=Math.random){
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

export function createSeededMine(seed){let value=seed>>>0;return createMine(()=>((value=(Math.imul(value,1664525)+1013904223)>>>0)/4294967296));}
export function mineOreLimits(seed,level=1){return new Map(createSeededMine(seed).caves.flatMap(c=>c.ores.map(o=>[o.id,Math.floor(Math.round(o.hp*(1+.2*Math.max(0,level-1)))/MINE_DAMAGE_PER_SHARD)+MINE_BREAK_SHARDS])));}
