import {launchWeaponDrop,stepWeaponDrop} from './adventure-drop-flight.js';
export const SUPPLY_CHANCE=.05;
export function rollDefenseSupply(enemy,now,random=Math.random){if(random()>=SUPPLY_CHANCE)return null;enemy.supplyAt=now;return {kind:random()<.5?'heart':'laser',life:45};}
export function launchDefenseSupply(drop,enemy,colliders,player){return launchWeaponDrop(drop,enemy,[...colliders,{x:1300,y:1510,hp:1,halfWidth:1300,halfDepth:235}],player);}
export function collectDefenseSupply(turrets,drop,player,mounted=false){if(mounted||drop.flight||drop.landed===false||Math.hypot(drop.x-player.x,drop.y-player.y)>32)return false;const t=turrets.find(t=>t.kind===drop.kind);if(!t||t.energy>=100-1e-6)return false;t.energy=Math.min(100,t.energy+(drop.kind==='heart'?20:10));return true;}
export function stepDefenseSupplies(defense,player,dt,onCollect){for(const d of defense.supplies){stepWeaponDrop(d,dt);d.life-=dt;if(d.life>0&&collectDefenseSupply(defense.turrets,d,player,!!defense.mounted)){d.life=0;onCollect?.(d);}}defense.supplies=defense.supplies.filter(d=>d.life>0);}
