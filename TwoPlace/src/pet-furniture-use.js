import {fromWorld,toWorld,project,GRID_SIZE} from '../shared/pet-space.js';
import {actorDepth} from './pet-depth.js';
// Heights and local offsets in the same cell units as furnishing-model.js.
const seats={cushion:.5,sofa:1.05,bench:1.05,armchair:.9,ottoman:.9,diningchair:1.4};
export function furnitureUsePose(item,action,exit,items=[]){
 const turn=((item.rotation||0)%360+360)%360/90;
 const sleep=item.product==='bed'&&action==='sleep',sit=item.product in seats;
 const kind=sleep?'sleep':sit?'sit':['watch'].includes(action)?'stand':'reach';
 const local=sleep?[0,-.12]:sit?[0,.08]:null;
 let position={...exit},height=0;
 if(local){const [u,v]=local,offset=[[u,v],[-v,u],[-u,-v],[v,-u]][turn],base=toWorld(item);position=fromWorld(base.u+offset[0]/GRID_SIZE,base.v+offset[1]/GRID_SIZE);height=sleep?1.48:seats[item.product];}
 const screen=project(position);screen.y-=height*2.2*(1000/900);
 let depth=local?actorDepth(item)+1:actorDepth(position);
 // A table in front of the seat must cover the seated legs, including its dishes.
 if(sit)for(const other of items){if(other.space!==item.space||!['table','diningtable','coffeeTable','picnicTable','desk'].includes(other.product))continue;const a=toWorld(other),b=toWorld(item);if(Math.hypot(a.u-b.u,a.v-b.v)*GRID_SIZE<4&&Math.round(project(other).y*10)>Math.round(project(item).y*10)+2)depth=Math.min(depth,Math.round(project(other).y*10)+8);}
 const toward=project(item),dx=toward.x-project(exit).x,dy=toward.y-project(exit).y;
 const column=local?(sleep?[3,0,1,2]:[1,2,3,0])[turn]:dy>=0?(dx>=0?0:1):(dx<0?2:3);
 return {kind,position,screen,depth,column,action,rotation:item.rotation||0};
}
export function useSpriteStyle(id,pose){const row=(pose.kind==='sleep'?2:0)+(id==='kuki'?1:0);return `--pose-column:${pose.column*100/3}%;--pose-row:${row*100/3}%;--hand-x:${[0,3].includes(pose.column)?64:36}%;`;}
