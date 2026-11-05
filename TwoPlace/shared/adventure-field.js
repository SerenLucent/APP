export function createObstacles(initialSeed=74129){
 let seed=initialSeed>>>0;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 const items=[];
 // A deliberately gentle clearing, then denser woods toward the abandoned house.
 for(let i=0;i<400&&items.length<158;i++){
  const x=210+rand()*2160,y=190+rand()*1390;
  if(Math.hypot(x-550,y-1040)<240||Math.hypot(x-2070,y-420)<200)continue;
  const type=rand()<.56?'tree':'rock',hp=type==='tree'?45:160;
  items.push({id:i,x,y,type,hp,max:hp,radius:type==='tree'?26:32,flash:0});
 }
 items.unshift({id:'first-tree',x:680,y:1040,type:'tree',hp:45,max:45,radius:26,flash:0},{id:'first-rock',x:490,y:860,type:'rock',hp:160,max:160,radius:32,flash:0});
 return items;
}
