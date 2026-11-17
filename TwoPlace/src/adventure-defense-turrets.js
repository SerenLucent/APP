import {blocksPoint} from './adventure-collision.js';
export const DEFENSE_PLATFORM={left:1030,right:1570,front:1130,rear:1275,enemyRear:1200};
export const TURRET_ANGLES=Array.from({length:7},(_,i)=>(-165+i*25)*Math.PI/180);
export function turretDirection(angle){return Math.max(0,Math.min(6,Math.round((angle*180/Math.PI+165)/25)));}
export function snapTurretAngle(angle){return TURRET_ANGLES[turretDirection(angle)];}
export const TURRET_RULES={heart:{cost:20,capacity:5,cooldown:.8,radius:150,multiplier:3},laser:{cost:2,cooldown:.2,radius:22,dpsMultiplier:4},recharge:0,range:540};
export function createDefenseTurrets(){return ['heart','laser'].map((kind,i)=>({kind,x:1150+i*300,y:1175,hp:1,halfWidth:30,halfDepth:24,collisionY:0,energy:100,cooldown:0,angle:-Math.PI/2,rawAngle:-Math.PI/2,aim:{x:1150+i*300,y:760},beam:0}));}
export function defenseRearBlocked(x,y){return y>DEFENSE_PLATFORM.rear-12;}
export function defenseSafe(player){return player.y>DEFENSE_PLATFORM.enemyRear;}
export function nearbyTurret(turrets,p){return turrets.find(t=>Math.abs(p.x-t.x)<46&&p.y>=t.y+34&&p.y<=t.y+100)||null;}
export function aimTurret(t,dx,dy,dt){if(t.kind==='heart'){t.rawAim ||= {...t.aim};t.rawAim.x+=dx*220*dt;t.rawAim.y=Math.min(1200,Math.max(400,t.rawAim.y+dy*220*dt));const distance=Math.max(80,Math.min(TURRET_RULES.range,Math.hypot(t.rawAim.x-t.x,t.rawAim.y-t.y)));t.angle=snapTurretAngle(Math.atan2(t.rawAim.y-t.y,t.rawAim.x-t.x));let safeDistance=distance;t.aim={x:t.x+Math.cos(t.angle)*safeDistance,y:t.y+Math.sin(t.angle)*safeDistance};const rawDistance=Math.max(80,Math.min(TURRET_RULES.range,safeDistance));const rawAngle=Math.max(TURRET_ANGLES[0],Math.min(TURRET_ANGLES[6],Math.atan2(t.rawAim.y-t.y,t.rawAim.x-t.x)));t.rawAim={x:t.x+Math.cos(rawAngle)*rawDistance,y:t.y+Math.sin(rawAngle)*rawDistance};}else{t.rawAngle=Math.max(TURRET_ANGLES[0],Math.min(TURRET_ANGLES[6],(t.rawAngle??t.angle)+dx*1.8*dt));t.angle=snapTurretAngle(t.rawAngle);}}

export function turretTargets(t,enemies){const r=TURRET_RULES[t.kind];if(t.kind==='heart')return enemies.filter(e=>e.hp>0&&Math.hypot(e.x-t.aim.x,e.y-t.aim.y)<=r.radius+(e.radius||22));const origin=t.rayOrigin||t,along=e=>(e.x-origin.x)*Math.cos(t.angle)+(e.y-origin.y)*Math.sin(t.angle),candidates=enemies.filter(e=>e.hp>0&&along(e)>=0&&along(e)<=(t.range||TURRET_RULES.range)&&Math.abs((e.x-origin.x)*Math.sin(t.angle)-(e.y-origin.y)*Math.cos(t.angle))<=r.radius+(e.radius||22)).sort((a,b)=>along(a)-along(b));return candidates.length?candidates.filter(e=>along(e)<=along(candidates[0])+(candidates[0].radius||22)+(e.radius||22)):[];}

export function pushDefenseEnemy(e,origin,distance,colliders=[]){const dx=e.x-origin.x,dy=e.y-origin.y,d=Math.hypot(dx,dy),ux=d?dx/d:0,uy=d?dy/d:-1;for(let n=0;n<Math.ceil(distance/5);n++){const step=Math.min(5,distance-n*5),x=e.x+ux*step,y=Math.min(DEFENSE_PLATFORM.enemyRear,e.y+uy*step);if(!colliders.some(o=>blocksPoint(o,x,y,e.radius||22))){e.x=x;e.y=y;}}e.windup=0;e.repath=0;e.path=[];e.knockback=.18;}
export function fireTurret(t){const r=TURRET_RULES[t.kind];if(t.energy+1e-6<r.cost||t.cooldown>0)return false;if(!t.infiniteEnergy)t.energy=Math.max(0,t.energy-r.cost);t.cooldown=Math.max(0,r.cooldown-(t.overrun||0));t.overrun=0;if(t.kind==='laser'){t.beam=.22;return {kind:'laser'};}return {kind:'heart',x:t.x,y:t.y-75,tx:t.aim.x,ty:t.aim.y,age:0,life:.7};}
export function stepTurrets(turrets,mounted,dt){for(const t of turrets){const remaining=t.cooldown-dt;t.overrun=t.cooldown>0?Math.max(0,-remaining):0;t.cooldown=Math.max(0,remaining);t.beam=Math.max(0,t.beam-dt);}}

export function laserContact(t,enemy,muzzle){if(!enemy)return {length:t.range||TURRET_RULES.range,hit:false};const origin=t.rayOrigin||t,length=(enemy.x-origin.x)*Math.cos(t.angle)+(enemy.y-origin.y)*Math.sin(t.angle)-(enemy.radius||22)*.65;return {length:Math.max(0,length),hit:true};}

export function turretStrike(kind,basicHit){const rule=TURRET_RULES[kind],multiplier=kind==='heart'?rule.multiplier:rule.dpsMultiplier*rule.cooldown;return {...basicHit,damage:basicHit.damage*multiplier};}
