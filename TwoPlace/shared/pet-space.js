import {HOUSEHOLD_PRODUCTS,TABLETOP_PRODUCTS,isTabletop} from './household-catalog.js';
export const GRID_SIZE=20;
export const FLOOR={cx:50,top:42,halfWidth:44,halfHeight:22};
const footprints={cushion:[1,1],plant:[1,1],table:[2,2],rug:[3,2],lamp:[1,1],fence:[2,1],bed:[2,3],sofa:[3,2],bookshelf:[2,1],desk:[2,2],wardrobe:[2,1],nightstand:[1,1],toybox:[1,1],bowl:[1,1],bench:[3,1],flowerbed:[2,2],pond:[3,3],lantern:[1,1]};
for(const item of [...HOUSEHOLD_PRODUCTS,...TABLETOP_PRODUCTS])footprints[item.id]=item.footprint;
export function toWorld(point){return {u:(point.x-10)/80,v:(point.y-45)/43};}
export function fromWorld(u,v){return {x:10+u*80,y:45+v*43};}
export function project(point){const {u,v}=toWorld(point);return {x:FLOOR.cx+FLOOR.halfWidth*(u-v),y:FLOOR.top+FLOOR.halfHeight*(u+v)};}
export function unproject(x,y){const dx=(x-FLOOR.cx)/FLOOR.halfWidth,dy=(y-FLOOR.top)/FLOOR.halfHeight;return fromWorld((dx+dy)/2,(dy-dx)/2);}
export function insideFloor(point){const {u,v}=toWorld(point);return u>=0 && u<=1 && v>=0 && v<=1;}
export function cellAt(point){const {u,v}=toWorld(point);return {c:Math.min(GRID_SIZE-1,Math.max(0,Math.floor(u*GRID_SIZE))),r:Math.min(GRID_SIZE-1,Math.max(0,Math.floor(v*GRID_SIZE)))};}
export function cellCenter(c,r){return fromWorld((c+.5)/GRID_SIZE,(r+.5)/GRID_SIZE);}
export function snap(point){const {c,r}=cellAt(point);return cellCenter(c,r);}
export function footprint(item){const size=footprints[item.product] || [1,1];return item.rotation%180===90 ? [size[1],size[0]] : size;}
// Fixed living-room sofa (2 × 4) and kitchen (4 × 1) share the floor grid.
function builtInOverlap(space,u,v,w,h){
  if(space!=='home')return false;
  const e=1e-6;
  return u+w/(GRID_SIZE*2)>1-4/GRID_SIZE+e && v-h/(GRID_SIZE*2)<1/GRID_SIZE-e;
}
export function placementAllowed(items,item,space,point,rotation=item.rotation || 0){
  if(isTabletop(item.product))return false;
  if(!insideFloor(point)) return false;
  const {u,v}=toWorld(point),[w,h]=footprint({...item,rotation});
  const margin=1e-6;
  if(u-w/(GRID_SIZE*2) < -margin || u+w/(GRID_SIZE*2)>1+margin || v-h/(GRID_SIZE*2) < -margin || v+h/(GRID_SIZE*2)>1+margin) return false;
  if(builtInOverlap(space,u,v,w,h))return false;
  if(item.product==='rug')return true;
  return !items.some(other=>{
    if(other.id===item.id || other.space!==space || other.product==='rug'||isTabletop(other.product))return false;
    const pos=toWorld(other),[ow,oh]=footprint(other);
    return Math.abs(pos.u-u)<(w+ow)/(GRID_SIZE*2)-.008 && Math.abs(pos.v-v)<(h+oh)/(GRID_SIZE*2)-.008;
  });
}
export function walkable(items,space,c,r){
  if(c<0||r<0||c>=GRID_SIZE||r>=GRID_SIZE)return false;
  const pos=toWorld(cellCenter(c,r));
  if(builtInOverlap(space,pos.u,pos.v,1,1))return false;
  return !items.some(item=>{
    if(item.space!==space || item.product==='rug'||isTabletop(item.product))return false;
    const p=toWorld(item),[w,h]=footprint(item);
    return Math.abs(p.u-pos.u)<w/(GRID_SIZE*2)+.012 && Math.abs(p.v-pos.v)<h/(GRID_SIZE*2)+.012;
  });
}
// Supercover traversal checks the full segment, including furniture corners.
function segmentCells(start,end,onCell,onCorner=()=>true){
 let c=start.c,r=start.r;const dx=end.c-c,dy=end.r-r,sx=Math.sign(dx),sy=Math.sign(dy),tx=dx?1/Math.abs(dx):Infinity,ty=dy?1/Math.abs(dy):Infinity;let mx=tx/2,my=ty/2;
 while(c!==end.c||r!==end.r){
  if(Math.abs(mx-my)<1e-10){if(!onCorner(c+sx,r)||!onCorner(c,r+sy))return false;c+=sx;r+=sy;mx+=tx;my+=ty;}
  else if(mx<my){c+=sx;mx+=tx;}else{r+=sy;my+=ty;}
  if(!onCell(c,r))return false;
 }
 return true;
}
export function clearPathSegment(items,space,start,end,canStep=()=>true){
 if(!canStep(start,end))return false;
 return segmentCells(start,end,(c,r)=>walkable(items,space,c,r),(c,r)=>walkable(items,space,c,r));
}
const pathDistance=(a,b)=>Math.hypot((a.c-b.c)-(a.r-b.r),((a.c-b.c)+(a.r-b.r))*.5);
export function findPath(items,space,start,end,canStep=()=>true){
 if(!walkable(items,space,end.c,end.r)||start.c===end.c&&start.r===end.r)return [];
 if(clearPathSegment(items,space,start,end,canStep))return [{...end}];
 const key=p=>p.c+','+p.r,open=[{...start,g:0,f:pathDistance(start,end)}],scores=new Map([[key(start),0]]),parents=new Map();
 while(open.length){open.sort((a,b)=>a.f-b.f||pathDistance(a,end)-pathDistance(b,end));const current=open.shift(),currentKey=key(current);if(current.g>scores.get(currentKey)+1e-9)continue;
  if(current.c===end.c&&current.r===end.r){const route=[];let p=current;while(key(p)!==key(start)){route.unshift({c:p.c,r:p.r});p=parents.get(key(p));}
   const smooth=[];let anchor=start,index=0;while(index<route.length){let furthest=index;for(let j=route.length-1;j>index;j--)if(clearPathSegment(items,space,anchor,route[j],canStep)){furthest=j;break;}smooth.push(route[furthest]);anchor=route[furthest];index=furthest+1;}return smooth;
  }
  for(const [dc,dr] of [[1,1],[-1,-1],[1,-1],[-1,1],[1,0],[-1,0],[0,1],[0,-1]]){const next={c:current.c+dc,r:current.r+dr};if(!clearPathSegment(items,space,current,next,canStep))continue;const g=current.g+pathDistance(current,next),k=key(next);if(g+1e-9>=(scores.get(k)??Infinity))continue;scores.set(k,g);parents.set(k,current);open.push({...next,g,f:g+pathDistance(next,end)});}
 }
 return [];
}
export function facingForVector(dx,dy){
  if(Math.abs(dx)<.01&&Math.abs(dy)<.01)return {pose:'front',flip:1};
  const sector=(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;
  return [{pose:'side',flip:1},{pose:'diagonal-front',flip:1},{pose:'front',flip:1},{pose:'diagonal-front',flip:-1},{pose:'side',flip:-1},{pose:'diagonal-back',flip:-1},{pose:'back',flip:1},{pose:'diagonal-back',flip:1}][sector];
}

// Reserve occupied cells and crossing steps, while allowing every neighboring cell.
export function petStepClear(from,to,others){
  const a=cellAt(from),b=cellAt(to);
  const same=(p,q)=>p.c===q.c&&p.r===q.r;
  const cross=(p,q,r)=>(q.c-p.c)*(r.r-p.r)-(q.r-p.r)*(r.c-p.c);
  return others.every(segment=>{
    const c=cellAt(segment.from),d=cellAt(segment.to);
    if(same(b,c)||same(b,d))return false;
    if(!segmentCells(a,b,(x,y)=>!same({c:x,r:y},c)&&!same({c:x,r:y},d)))return false;
    const on=(p,q,r)=>Math.abs(cross(p,q,r))<1e-8&&r.c>=Math.min(p.c,q.c)&&r.c<=Math.max(p.c,q.c)&&r.r>=Math.min(p.r,q.r)&&r.r<=Math.max(p.r,q.r);
    return !(cross(a,b,c)*cross(a,b,d)<0&&cross(c,d,a)*cross(c,d,b)<0||on(a,b,c)||on(a,b,d)||on(c,d,a)||on(c,d,b));
  });
}
