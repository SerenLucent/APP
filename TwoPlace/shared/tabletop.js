import {toWorld,fromWorld,GRID_SIZE,FLOOR,project} from './pet-space.js';
export const TABLE_SURFACES={table:{columns:2,rows:2,width:1.6,depth:1.5,height:1.47},diningtable:{columns:3,rows:2,width:2.55,depth:1.55,height:1.58},picnicTable:{columns:3,rows:2,width:2.55,depth:1.55,height:1.58}};
export function tableSlot(parent,slot){
 const surface=TABLE_SURFACES[parent?.product];if(!surface||!parent.space||!Number.isInteger(slot)||slot<0||slot>=surface.columns*surface.rows)return null;
 let u=((slot%surface.columns+.5)/surface.columns-.5)*surface.width,v=((Math.floor(slot/surface.columns)+.5)/surface.rows-.5)*surface.depth;
 const turn=((parent.rotation||0)/90)%4;[u,v]=turn===0?[u,v]:turn===1?[-v,u]:turn===2?[-u,-v]:[v,-u];
 const position=toWorld(parent),world=fromWorld(position.u+u/GRID_SIZE,position.v+v/GRID_SIZE),point=project(world);
 return {...world,space:parent.space,screen:{x:point.x,y:point.y-surface.height*FLOOR.halfWidth/GRID_SIZE},height:surface.height};
}
export function availableTableSlot(items,parentId,slot,exceptId){const parent=items.find(i=>i.id===parentId),point=tableSlot(parent,slot);return !!point&&!items.some(i=>i.id!==exceptId&&i.parentId===parentId&&i.slot===slot);}
export function syncTabletopItems(items){
 for(const item of items.filter(i=>i.parentId)){const parent=items.find(i=>i.id===item.parentId),point=tableSlot(parent,item.slot);if(!point){item.space=null;delete item.parentId;delete item.slot;}else Object.assign(item,{x:point.x,y:point.y,space:point.space});}
}
