import {skillBalance} from './adventure-skills.js';
export const CHARGE_DELAY=.5;
export const CHARGE_FILL=3;
export const MAX_CHARGE=CHARGE_DELAY+CHARGE_FILL;
export const SPIN_TICK=.32;
// Level-1 full spin: 11 contacts, about 450 total against one target at base attack.
export const SPIN_HIT_MULTIPLIER=450/(11*11.5);
export function chargeFillSeconds(dexterity=0){return CHARGE_FILL-2*Math.max(0,Math.min(100,dexterity))/100;}
export function skillPlan(id,seconds,stamina=100,level=1,dexterity=0){
 const power=Math.max(0,Math.min(1,(seconds-CHARGE_DELAY)/chargeFillSeconds(dexterity))),available=Math.max(0,stamina);
 if(seconds<=CHARGE_DELAY)return {ready:false,power:0,cost:0,requiredCost:0,duration:0,usableDuration:0,damage:0,drainRate:0};
 const balance=skillBalance(level);
 const requiredCost=8+62*power,cost=Math.min(requiredCost,available),ratio=cost/requiredCost;
 const duration=id==='momo'?.65+(balance.spinDuration-.65)*power:.48;
 const multiplier=1+(balance.tailMultiplier-1)*power;
 return {ready:true,power,cost,requiredCost,duration,multiplier,usableDuration:id==='momo'?duration*ratio:duration,drainRate:id==='momo'?requiredCost/duration:0,damage:id==='momo'?11.5*SPIN_HIT_MULTIPLIER:15*multiplier*ratio};
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

export function basicGaugeGain(damage,min,max,dexterity=0){
 const fraction=max>min?Math.max(0,Math.min(1,(damage-min)/(max-min))):1;
 const band=Math.min(4,Math.floor(fraction*5));
 return Math.round(Math.round(5+band*5/4)*(1+Math.max(0,Math.min(100,dexterity))/100)*100)/100;
}
export function gainBasicGauge(pet,hit,amount=10){if(hit)pet.gauge=Math.min(100,Math.round(((pet.gauge||0)+amount)*100)/100);}
export function spendGauge(pet){if((pet.gauge||0)<100)return false;pet.gauge=0;return true;}
export function eatPowerHeart(pet){pet.powerTime=Math.min(90,(pet.powerTime||0)+10);}
export function powerMultiplier(id,pet){return id==='kuki'&&pet.powerTime>0?1.2:1;}
// Simultaneous contacts share one freeze; every later critical can trigger it again.
export function requestCriticalHitStop(state,critical){if(critical)state.hitStop=Math.max(state.hitStop||0,.1);}
export function consumeHitStop(state,elapsed){const frozen=Math.min(state.hitStop||0,elapsed);state.hitStop=Math.max(0,(state.hitStop||0)-frozen);return Math.max(0,elapsed-frozen);}
