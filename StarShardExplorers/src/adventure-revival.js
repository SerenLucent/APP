export const REVIVAL_SECONDS=60;
export function stepRevivals(state,dt){
 const revived=[];if(state.won||state.defense?.house.hp===0)return revived;
 for(const [id,pet] of Object.entries(state.pets)){
  pet.revivalFlash=Math.max(0,(pet.revivalFlash||0)-dt);
  if(pet.hp>0){pet.revivalElapsed=0;continue;}
  pet.revivalElapsed=Math.min(REVIVAL_SECONDS,(pet.revivalElapsed||0)+Math.max(0,dt));
  if(pet.revivalElapsed<REVIVAL_SECONDS-1e-8)continue;
  pet.hp=(pet.maxHp??100)/2;pet.revivalElapsed=0;pet.revivalFlash=1.2;revived.push(id);
 }
 if(state.dead&&state.knockout?.completed&&revived.length){state.active=revived.includes(state.active)?state.active:revived[0];state.dead=false;state.knockout=null;state.invuln=1;Object.assign(state.p,state.spawn||{x:550,y:1040});}
 return revived;
}
