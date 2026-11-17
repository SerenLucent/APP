export function targetContact(origin,target){
 const cx=target.x,cy=target.y+(target.hitOffsetY||0),hw=target.hitHalfWidth,hd=target.hitHalfDepth;
 const x=Math.max(cx-hw,Math.min(cx+hw,origin.x)),y=Math.max(cy-hd,Math.min(cy+hd,origin.y));
 const dx=x-origin.x,dy=y-origin.y;return {dx,dy,distance:Math.hypot(dx,dy)};
}
export function basicAttackTargets(player,targets){
 const enemies=[],structures=[];
 for(const target of targets){
  if(target.hp<=0)continue;
  const rect=target.hitHalfWidth!==undefined;
  const {dx,dy,distance}=rect?targetContact(player,target):{dx:target.x-player.x,dy:target.y-player.y,distance:Math.hypot(target.x-player.x,target.y-player.y)};
  const reach=rect?62:88+(target.radius||0);
  if(distance>=reach||distance>=25&&(dx*player.fx+dy*player.fy)/distance<=.25)continue;
  if(rect)structures.push({target,distance});else enemies.push(target);
 }
 structures.sort((a,b)=>a.distance-b.distance);
 // A direct strike lands on the nearest building, rather than passing through it.
 if(structures.length)enemies.push(structures[0].target);
 return enemies;
}
