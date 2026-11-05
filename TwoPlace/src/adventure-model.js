export const CHARGE_DELAY=1;
export const CHARGE_FILL=2.4;
export const MAX_CHARGE=CHARGE_DELAY+CHARGE_FILL;
export const SPIN_TICK=.32;
export function skillPlan(id,seconds,stamina=100){
 const power=Math.max(0,Math.min(1,(seconds-CHARGE_DELAY)/CHARGE_FILL)),available=Math.max(0,stamina);
 if(seconds<=CHARGE_DELAY)return {ready:false,power:0,cost:0,requiredCost:0,duration:0,usableDuration:0,damage:0,drainRate:0};
 const requiredCost=8+52*power,cost=Math.min(requiredCost,available),ratio=cost/requiredCost,duration=id==='momo'?.65+4.35*power:.48;
 return {ready:true,power,cost,requiredCost,duration,usableDuration:id==='momo'?duration*ratio:duration,drainRate:id==='momo'?requiredCost/duration:0,damage:id==='momo'?7:(30+270*power)*ratio};
}
export function advanceSpin(attack,pet,dt){
 const activeDt=Math.max(0,Math.min(dt,attack.duration-attack.t,pet.sp/attack.drainRate));attack.t+=activeDt;pet.sp=Math.max(0,pet.sp-attack.drainRate*activeDt);if(pet.sp<1e-8)pet.sp=0;
 return {activeDt,done:pet.sp<=0||attack.t>=attack.duration-1e-8};
}
export function recoverPet(pet,dt,reserve){
 if(pet.hp<=0)return;
 pet.hp=Math.min(pet.maxHp??100,pet.hp+(reserve?.5:0)*dt);
 pet.sp=Math.min(pet.maxSp??100,pet.sp+(reserve?.02:.0025)*(pet.maxSp??100)*dt);
}
export function skillHits(player,target,id){
 const dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);
 if(id==='momo')return d<104+target.radius;
 return d<145+target.radius&&(d<25||(dx*player.fx+dy*player.fy)/d>.25);
}
export {createObstacles} from '../shared/adventure-field.js';

export function gainBasicGauge(pet,hit){if(hit)pet.gauge=Math.min(100,(pet.gauge||0)+10);}
export function spendGauge(pet){if((pet.gauge||0)<100)return false;pet.gauge=0;return true;}
export function eatPowerHeart(pet){pet.powerTime=Math.min(90,(pet.powerTime||0)+10);}
export function powerMultiplier(id,pet){return id==='kuki'&&pet.powerTime>0?1.2:1;}
