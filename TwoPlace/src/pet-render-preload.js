export function petFurniturePlan(items=[]){
 const jobs=new Map();
 for(const item of items)for(const rotation of new Set([0,item.rotation||0]))jobs.set(item.product+':'+rotation,{product:item.product,rotation});
 return [...jobs.values()];
}
export async function preparePetScenes(home,{spaces,prepareFurniture,prepareBackground,yieldControl,isCurrent=()=>true,onProgress=()=>{},backgroundConcurrency=1}){
 const jobs=petFurniturePlan(home.items),total=jobs.length+spaces.length;let done=0;
 for(const job of jobs){if(!isCurrent())return false;onProgress('가구 그림을 준비하고 있어요',done,total);await prepareFurniture(job);done++;await yieldControl();}
 let next=0;
 async function worker(){while(next<spaces.length){if(!isCurrent())return;const space=spaces[next++];onProgress('방 배경을 준비하고 있어요',done,total);await prepareBackground(space);done++;await yieldControl();}}
 await Promise.all(Array.from({length:Math.min(spaces.length,Math.max(1,Math.min(2,backgroundConcurrency)))},worker));
 onProgress('방 준비가 끝났어요',done,total);return isCurrent();
}
