import {blocksPoint} from './adventure-collision.js';
export const DROP_FLIGHT_SECONDS=.65;
// Keep loot outside solid foundations, including reserved rebuilding footprints.
export function launchWeaponDrop(drop,source,colliders=[],player){
 const angle=player?Math.atan2(player.y-source.y,player.x-source.x):Math.PI/2;
 const obstacles=[...colliders];if(!obstacles.includes(source)&&source.type!=='enemy')obstacles.push(source);
 let landing=null;
 for(let radius=40;radius<=640&&!landing;radius+=15){
  for(let i=0;i<16;i++){
   const turn=(i%2?1:-1)*Math.ceil(i/2)*Math.PI/8,a=angle+turn;
   const x=source.x+Math.cos(a)*radius,y=source.y+(source.collisionY||0)+Math.sin(a)*radius;
   if(x<90||x>2510||y<160||y>1710||source.reserveFootprint&&y<source.y||obstacles.some(o=>blocksPoint(o,x,y,24)))continue;
   landing={x,y};break;
  }
 }
 if(!landing)return null;
 Object.assign(drop,{x:source.x,y:source.y,flight:{fromX:source.x,fromY:source.y,toX:landing.x,toY:landing.y,age:0},landed:false});
 return drop;
}
export function stepWeaponDrop(drop,dt){
 if(!drop.flight)return;
 const f=drop.flight;f.age=Math.min(DROP_FLIGHT_SECONDS,f.age+dt);const u=f.age/DROP_FLIGHT_SECONDS;
 drop.x=f.fromX+(f.toX-f.fromX)*u;drop.y=f.fromY+(f.toY-f.fromY)*u;
 if(u>=1){drop.landed=true;drop.flight=null;}
}
export function weaponDropLift(drop){return drop.flight?Math.sin(drop.flight.age/DROP_FLIGHT_SECONDS*Math.PI)*34:0;}
