import {GRID_SIZE,cellCenter,placementAllowed} from '../shared/pet-space.js';
import {isTabletop} from '../shared/household-catalog.js';
import {TABLE_SURFACES,tableSlot,availableTableSlot} from '../shared/tabletop.js';
export function initialPlacement(items,item,space,rotation=0){
 if(item.space===space)return {x:item.x,y:item.y,...(item.parentId?{parentId:item.parentId,slot:item.slot}:{})};
 if(isTabletop(item.product)){let fallback;for(const parent of items.filter(i=>i.space===space&&TABLE_SURFACES[i.product])){const s=TABLE_SURFACES[parent.product];for(let slot=0;slot<s.columns*s.rows;slot++){const p={...tableSlot(parent,slot),parentId:parent.id,slot};fallback??=p;if(availableTableSlot(items,parent.id,slot,item.id))return p;}}return fallback||cellCenter(9,9);}
 const points=[];for(let c=0;c<GRID_SIZE;c++)for(let r=0;r<GRID_SIZE;r++)points.push({c,r,point:cellCenter(c,r)});
 points.sort((a,b)=>(a.c-9.5)**2+(a.r-9.5)**2-((b.c-9.5)**2+(b.r-9.5)**2));
 return points.find(p=>placementAllowed(items,item,space,p.point,rotation))?.point||cellCenter(9,9);
}
