// The exploration cottage is scenery, separate from the 100 breakable targets.
export const EXPLORATION_HOUSE={x:2070,y:420};
export function explorationHouseCollider(){return {id:'exploration-house',type:'scenery',x:EXPLORATION_HOUSE.x,y:EXPLORATION_HOUSE.y+22,halfWidth:105,halfDepth:33,hp:Infinity};}
export function blocksPoint(o,x,y,padding=0){
 if(o.hp<=0)return false;
 if(o.halfWidth!==undefined){const dx=Math.max(0,Math.abs(x-o.x)-o.halfWidth),dy=Math.max(0,Math.abs(y-o.y)-o.halfDepth);return dx===0&&dy===0||Math.hypot(dx,dy)<padding;}
 return Math.hypot(x-o.x,y-o.y)<o.radius+padding;
}
export function adventureMenuUrl(base,local){return base+'adventure-menu.html'+(local?'?demo=1':'');}
