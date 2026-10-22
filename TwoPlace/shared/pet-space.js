export const GRID_SIZE=8;
export const FLOOR={cx:50,top:42,halfWidth:44,halfHeight:22};
const footprints={cushion:[1,1],plant:[1,1],table:[2,2],rug:[3,2],lamp:[1,1],fence:[2,1]};
export function toWorld(point){return {u:(point.x-10)/80,v:(point.y-45)/43};}
export function fromWorld(u,v){return {x:10+u*80,y:45+v*43};}
export function project(point){const {u,v}=toWorld(point);return {x:FLOOR.cx+FLOOR.halfWidth*(u-v),y:FLOOR.top+FLOOR.halfHeight*(u+v)};}
export function unproject(x,y){const dx=(x-FLOOR.cx)/FLOOR.halfWidth,dy=(y-FLOOR.top)/FLOOR.halfHeight;return fromWorld((dx+dy)/2,(dy-dx)/2);}
export function insideFloor(point){const {u,v}=toWorld(point);return u>=0 && u<=1 && v>=0 && v<=1;}
export function cellAt(point){const {u,v}=toWorld(point);return {c:Math.min(7,Math.max(0,Math.floor(u*8))),r:Math.min(7,Math.max(0,Math.floor(v*8)))};}
export function cellCenter(c,r){return fromWorld((c+.5)/8,(r+.5)/8);}
export function snap(point){const {c,r}=cellAt(point);return cellCenter(c,r);}
export function footprint(item){const size=footprints[item.product] || [1,1];return item.rotation===90 ? [size[1],size[0]] : size;}
// Fixed living-room sofa (2 × 4) and kitchen (4 × 1) share the floor grid.
function builtInOverlap(space,u,v,w,h){
  if(space!=='home')return false;
  const e=1e-6;
  return (u-w/16<.25-e && v+h/16>.5+e) || (u+w/16>.5+e && v-h/16<.125-e);
}
export function placementAllowed(items,item,space,point,rotation=item.rotation || 0){
  if(!insideFloor(point)) return false;
  const {u,v}=toWorld(point),[w,h]=footprint({...item,rotation});
  const margin=1e-6;
  if(u-w/16 < -margin || u+w/16>1+margin || v-h/16 < -margin || v+h/16>1+margin) return false;
  if(builtInOverlap(space,u,v,w,h))return false;
  if(item.product==='rug')return true;
  return !items.some(other=>{
    if(other.id===item.id || other.space!==space || other.product==='rug')return false;
    const pos=toWorld(other),[ow,oh]=footprint(other);
    return Math.abs(pos.u-u)<(w+ow)/16-.008 && Math.abs(pos.v-v)<(h+oh)/16-.008;
  });
}
export function walkable(items,space,c,r){
  if(c<0||r<0||c>=8||r>=8)return false;
  const pos=toWorld(cellCenter(c,r));
  if(builtInOverlap(space,pos.u,pos.v,1,1))return false;
  return !items.some(item=>{
    if(item.space!==space || item.product==='rug')return false;
    const p=toWorld(item),[w,h]=footprint(item);
    return Math.abs(p.u-pos.u)<w/16+.012 && Math.abs(p.v-pos.v)<h/16+.012;
  });
}
export function findPath(items,space,start,end,canStep=()=>true){
  if(!walkable(items,space,end.c,end.r))return [];
  const key=p=>`${p.c},${p.r}`,queue=[start],seen=new Set([key(start)]),parents=new Map();
  for(let i=0;i<queue.length;i++){
    const current=queue[i];
    if(current.c===end.c&&current.r===end.r){
      const result=[];let p=current;
      while(key(p)!==key(start)){result.unshift(p);p=parents.get(key(p));}
      return result;
    }
    for(const [dc,dr] of [[1,1],[-1,-1],[1,-1],[-1,1],[1,0],[-1,0],[0,1],[0,-1]]){
      const next={c:current.c+dc,r:current.r+dr};
      if(seen.has(key(next))||!walkable(items,space,next.c,next.r)||!canStep(current,next))continue;
      if(dc&&dr&&(!walkable(items,space,current.c+dc,current.r)||!walkable(items,space,current.c,current.r+dr)))continue;
      seen.add(key(next));parents.set(key(next),current);queue.push(next);
    }
  }
  return [];
}
export function facingForVector(dx,dy){
  if(Math.abs(dx)<.01&&Math.abs(dy)<.01)return {pose:'front',flip:1};
  if(Math.abs(dy)>=Math.abs(dx)*.75)return {pose:dy<0?'back':'front',flip:1};
  return {pose:'side',flip:dx<0?-1:1};
}

// Reserve the whole swept body area, including the segment still being animated.
export function petStepClear(from,to,others){
  const normalized=p=>{const q=project(p);return {x:q.x/21,y:q.y/23};};
  const a=normalized(from),b=normalized(to);
  const pointDistance=(p,a,b)=>{
    const dx=b.x-a.x,dy=b.y-a.y,length=dx*dx+dy*dy;
    const t=length?Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/length)):0;
    return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);
  };
  const cross=(a,b,c)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
  return others.every(segment=>{
    const c=normalized(segment.from),d=normalized(segment.to);
    const intersects=cross(a,b,c)*cross(a,b,d)<0 && cross(c,d,a)*cross(c,d,b)<0;
    return !intersects && Math.min(pointDistance(a,c,d),pointDistance(b,c,d),pointDistance(c,a,b),pointDistance(d,a,b))>=1;
  });
}
