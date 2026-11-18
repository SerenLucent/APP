import {rollEnemyAttack} from './adventure-enemy-attack.js';
import {DEFENSE_WAVES,DEFENSE_TOTAL} from '../shared/adventure-field.js';
export {DEFENSE_WAVES,DEFENSE_TOTAL};
export const DEFENSE_HOME={x:1300,y:1175,radius:44,halfWidth:40,halfDepth:26,collisionY:0,max:2000};
export const DEFENSE_START={x:1300,y:1250};

export function createDefense(){
 return {house:{...DEFENSE_HOME,hp:DEFENSE_HOME.max,flash:0},wave:0,nextWave:2,spawned:0};
}

export function stepDefense(defense,enemies,dt,random=Math.random){
 const house=defense.house;
 if(house.hp<=0)return {fresh:[],damage:0,complete:false};
 const living=enemies.filter(enemy=>enemy.hp>0);
 const finalWave=defense.spawned>=DEFENSE_TOTAL;
 if(finalWave&&!living.length)return {fresh:[],damage:0,complete:true};

 let damage=0;const hits=[];
 for(const enemy of living){
  if(enemy.defenseTarget==='player')continue;
  if(enemy.knockback>0){enemy.knockback=Math.max(0,enemy.knockback-dt);continue;}
  if(enemy.stun>0){
   enemy.stun=Math.max(0,enemy.stun-dt);
   enemy.windup=0;
   continue;
  }
  enemy.cooldown=Math.max(0,enemy.cooldown-dt);
  const nearestX=Math.max(house.x-house.halfWidth,Math.min(house.x+house.halfWidth,enemy.x)),nearestY=house.y-house.halfDepth;
  const dx=nearestX-enemy.x,dy=nearestY-enemy.y,distance=Math.hypot(dx,dy);
  const reach=enemy.radius+6;
  // The last movement step can leave the enemy a fraction past the attack boundary.
  if(distance>reach+1e-6){
   const travel=Math.min(distance-reach,enemy.speed*dt);
   enemy.x+=dx/distance*travel;
   enemy.y+=dy/distance*travel;
   continue;
  }
  if(enemy.cooldown>0)continue;
  if(!enemy.windup){enemy.windup=.45;continue;}
  enemy.windup=Math.max(0,enemy.windup-dt);
  if(enemy.windup===0){
   const hit=rollEnemyAttack(1,random,4,7);damage+=hit.damage;hits.push(hit);
   enemy.cooldown=1.15;
  }
 }
 house.hp=Math.max(0,house.hp-damage);
 house.flash=damage?.16:Math.max(0,house.flash-dt);
 if(finalWave||house.hp<=0)return {fresh:[],damage,hits,complete:false};

 let waveLimit=DEFENSE_WAVES.slice(0,Math.max(1,defense.wave)).reduce((a,b)=>a+b,0);
 if(defense.spawned>=waveLimit){if(living.length>10)return {fresh:[],damage,hits,complete:false};waveLimit+=DEFENSE_WAVES[defense.wave]||0;}
 defense.nextWave-=dt;
 if(defense.nextWave>0)return {fresh:[],damage,hits,complete:false};
 const fresh=[];for(let n=0;n<2&&defense.spawned<DEFENSE_TOTAL&&defense.spawned<waveLimit;n++){let offset=defense.spawned,wave=1;while(offset>=DEFENSE_WAVES[wave-1]){offset-=DEFENSE_WAVES[wave-1];wave++;}const index=offset,hp=60+Math.min(wave-1,2)*15,angle=defense.spawned*2.39996;defense.spawned++;defense.wave=wave;fresh.push({id:'defense-'+wave+'-'+index,type:'enemy',mode:'chase',hp,max:hp,radius:22,defenseTarget:'house',repath:0,path:[],x:house.x+Math.sin(angle)*360,y:house.y-430-Math.abs(Math.cos(angle))*100,speed:27.5+Math.min(wave-1,2)*3,cooldown:0,windup:0,flash:0});}defense.nextWave=2;
 return {fresh,damage,hits,complete:false};
}

export function aggroDefenseEnemy(enemy,player,random=Math.random){if(enemy.hp>0&&player.y<=1200&&random()<.5){enemy.defenseTarget='player';enemy.mode='chase';enemy.windup=0;enemy.repath=0;enemy.path=[];return true;}return false;}
export function releaseDefenseAggro(enemy,player){if(enemy.defenseTarget==='player'&&(player.y>1200||Math.hypot(enemy.x-player.x,enemy.y-player.y)>380)){enemy.defenseTarget='house';enemy.windup=0;enemy.path=[];enemy.repath=0;return true;}return false;}
