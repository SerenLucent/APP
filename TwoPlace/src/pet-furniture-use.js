import {fromWorld,toWorld,project,GRID_SIZE,footprint,facingForVector,FLOOR} from '../shared/pet-space.js';
import {actorDepth} from './pet-depth.js';
// Heights and local offsets in the same cell units as furnishing-model.js.
const seats={cushion:.5,sofa:1.05,bench:1.05,armchair:.9,ottoman:.9,diningchair:1.4};
export function furnitureApproach(item){
 const turn=((item.rotation||0)%360+360)%360/90,base=toWorld(item),[width,depth]=footprint({...item,rotation:0});
 const rear=(turn===1||turn===2)&&['premiumTV','premiumFridge'].includes(item.product);
 const distance=depth/2+(item.product==='premiumTV'?3:item.product==='premiumWasher'?2.2:item.product==='premiumFridge'?1.8:1.5);
 const local=rear?[(turn===1?-1:1)*width*.4,depth/2+1]:[0,distance],offset=[[local[0],local[1]],[-local[1],local[0]],[-local[0],-local[1]],[local[1],-local[0]]][turn];
 const back=rear?(item.product==='premiumFridge'?2.1:.85):0;
 const side=rear&&item.product==='premiumFridge'?(turn===1?-.65:.65):0;
 return fromWorld(base.u+(offset[0]-back+side/2)/GRID_SIZE,base.v+(offset[1]-back-side/2)/GRID_SIZE);
}
export function interactionSpriteFrame(column){return column<2?{column,flip:1}:{column:3,flip:column===3?-1:1};}
export function furnitureUsePose(item,action,exit,items=[]){
 const turn=((item.rotation||0)%360+360)%360/90;
 const sleep=item.product==='bed'&&action==='sleep',sit=item.product in seats||action==='cinema';
 const appliance=['premiumTV','premiumFridge','premiumWasher'].includes(item.product);
 const kind=sleep?'sleep':appliance||action==='water'?'interact':sit?'sit':['watch'].includes(action)?'stand':'reach';
 const local=sleep?[0,-.94]:item.product in seats?[0,.08]:null;
 let position={...exit},height=0;
 if(local){const [u,v]=local,offset=[[u,v],[-v,u],[-u,-v],[v,-u]][turn],base=toWorld(item);position=fromWorld(base.u+offset[0]/GRID_SIZE,base.v+offset[1]/GRID_SIZE);height=sleep?1.65:seats[item.product];}
 const screen=project(position);screen.y-=height*FLOOR.halfWidth/GRID_SIZE;
 let depth=local?actorDepth(item)+1:actorDepth(position);
 // A table in front of the seat must cover the seated legs, including its dishes.
 if(sit)for(const other of items){if(other.space!==item.space||!['table','diningtable','coffeeTable','picnicTable','desk'].includes(other.product))continue;const a=toWorld(other),b=toWorld(item);if(Math.hypot(a.u-b.u,a.v-b.v)*GRID_SIZE<4&&Math.round(project(other).y*10)>Math.round(project(item).y*10)+2)depth=Math.min(depth,Math.round(project(other).y*10)+8);}
 const toward=project(item),dx=toward.x-project(exit).x,dy=toward.y-project(exit).y;
 const column=local?(sleep?[3,0,1,2]:[1,2,3,0])[turn]:dy>=0?(dx>=0?0:1):(dx<0?2:3);
 const facing=facingForVector(dx*10,dy*9);
 return {kind,position,screen,depth,column,facing,action,product:item.product,rotation:item.rotation||0};
}
export function useSpriteStyle(id,pose){const frame=pose.kind==='reach'?interactionSpriteFrame(pose.column):{column:pose.column,flip:1};const row=(pose.kind==='sleep'?2:0)+(id==='kuki'?1:0);const head=[[68,90],[32,90],[45,70],[55,70]][pose.column];return `--reach-scale:${['premiumFridge','premiumWasher'].includes(pose.product)?.72:1};--interaction-flip:${frame.flip};--seated-scale:${pose.product==='diningchair'?.85:.65};--seat-anchor:${pose.product==='diningchair'?100:82}%;--sleep-head-x:${head[0]}%;--sleep-head-y:${head[1]}%;--pose-column:${frame.column*100/3}%;--pose-row:${row*100/3}%;--hand-x:${[0,3].includes(pose.column)?64:36}%;`;}
