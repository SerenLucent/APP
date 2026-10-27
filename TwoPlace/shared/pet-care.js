export const CARE_PERIOD=4*3600000;
export function petLevel(pet,kind,now=Date.now()){
 if(kind==='hunger')return Math.max(0,(pet.hungerBase??pet.hunger)-Math.floor(Math.max(0,now-pet.updatedAt)/3600000)*4);
 const value=pet[kind]??100,at=pet.sampledAt??(kind==='hunger'?pet.updatedAt:pet[kind+'At']??pet.updatedAt);
 return Math.max(0,Math.min(100,value-Math.floor(Math.max(0,now-at)/1000)*1000/CARE_PERIOD*100));
}
export function starving(home,now=Date.now()){return !!home.pets&&['mochi','kuki'].every(id=>petLevel(home.pets[id],'hunger',now)<=0);}
export const CARE_BONUS_INTERVAL=30*60000;
export const CARE_BONUS_LIMIT=5;
export function careDay(now){return new Date(now+9*3600000).toISOString().slice(0,10);}
export function careBonus(home,pet,type,now=Date.now()){
 const saved=home.careBonuses?.[pet]?.[type],count=saved?.day===careDay(now)?saved.count:0,last=saved?.lastAt;
 return {count,remaining:Math.max(0,CARE_BONUS_LIMIT-count),nextAt:last===undefined?0:last+CARE_BONUS_INTERVAL,ready:count<CARE_BONUS_LIMIT&&(last===undefined||now-last>=CARE_BONUS_INTERVAL)};
}
export function careRewardReady(home,pet,type,now=Date.now()){return careBonus(home,pet,type,now).ready;}
