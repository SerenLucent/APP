import {DEFENSE_WAVES,DEFENSE_TOTAL} from '../shared/adventure-field.js';
export {DEFENSE_WAVES,DEFENSE_TOTAL};
export const DEFENSE_HOME={x:1300,y:900,radius:62,max:1000};
export const DEFENSE_START={x:1300,y:1010};

export function createDefense(){
 return {house:{...DEFENSE_HOME,hp:DEFENSE_HOME.max,flash:0},wave:0,nextWave:2};
}

export function stepDefense(defense,enemies,dt){
 const house=defense.house;
 if(house.hp<=0)return {fresh:[],damage:0,complete:false};
 const living=enemies.filter(enemy=>enemy.hp>0);
 const finalWave=defense.wave===DEFENSE_WAVES.length;
 if(finalWave&&!living.length)return {fresh:[],damage:0,complete:true};

 let damage=0;
 for(const enemy of living){
  if(enemy.defenseTarget==='player')continue;
  if(enemy.stun>0){
   enemy.stun=Math.max(0,enemy.stun-dt);
   enemy.windup=0;
   continue;
  }
  enemy.cooldown=Math.max(0,enemy.cooldown-dt);
  const dx=house.x-enemy.x,dy=house.y-enemy.y,distance=Math.hypot(dx,dy);
  const reach=house.radius+enemy.radius+6;
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
   damage+=5;
   enemy.cooldown=1.15;
  }
 }
 house.hp=Math.max(0,house.hp-damage);
 house.flash=damage?.16:Math.max(0,house.flash-dt);
 if(finalWave||house.hp<=0)return {fresh:[],damage,complete:false};

 defense.nextWave=Math.min(defense.nextWave,living.length?Infinity:1.5)-dt;
 if(defense.nextWave>0)return {fresh:[],damage,complete:false};
 const wave=++defense.wave;
 const count=DEFENSE_WAVES[wave-1];
 const strengthStep=Math.min(wave-1,2);
 defense.nextWave=11;
 const fresh=Array.from({length:count},(_,index)=>{
  const angle=index/count*Math.PI*2+wave*.44;
  const hp=60+strengthStep*15;
  return {
   id:'defense-'+wave+'-'+index,type:'enemy',mode:'chase',hp,max:hp,radius:22,
   defenseTarget:(index+1)%4===0?'player':'house',repath:0,path:[],
   x:house.x+Math.cos(angle)*310,y:house.y+Math.sin(angle)*250,
   speed:73+strengthStep*9,cooldown:0,windup:0,flash:0,
  };
 });
 return {fresh,damage,complete:false};
}
