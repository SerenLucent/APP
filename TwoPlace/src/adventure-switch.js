export const SWITCH_POSE_SECONDS=.5,SWITCH_RISE_SECONDS=.35,SWITCH_FALL_SECONDS=.45;
export const SWITCH_TOTAL=SWITCH_POSE_SECONDS+SWITCH_RISE_SECONDS+SWITCH_FALL_SECONDS;
export function startSwitch(state){
 if(state.knockout||state.switching||state.dead||state.won||state.burst||state.attack||state.charge||state.basic>0||state.swap>0)return false;
 const to=state.active==='momo'?'kuki':'momo';if(state.pets[to].hp<=0)return false;
 state.switching={from:state.active,to,t:0};state.target=null;state.p.walking=false;state.p.fx=0;state.p.fy=1;state.invuln=Math.max(state.invuln||0,SWITCH_TOTAL+1);state.swap=SWITCH_TOTAL;return true;
}
export function stepSwitch(state,dt){
 const sw=state.switching;if(!sw)return {changed:false,landed:false};sw.t=Math.min(SWITCH_TOTAL,sw.t+dt);let changed=false;
 if(sw.t>=SWITCH_POSE_SECONDS+SWITCH_RISE_SECONDS&&state.active!==sw.to){state.active=sw.to;changed=true;}
 if(sw.t>=SWITCH_TOTAL){state.switching=null;state.invuln=Math.max(state.invuln||0,1);return {changed,landed:true};}
 return {changed,landed:false};
}
export function switchVisual(sw,height=400){if(sw.t<SWITCH_POSE_SECONDS)return {id:sw.from,raised:true,offsetY:0,phase:'pose'};if(sw.t<SWITCH_POSE_SECONDS+SWITCH_RISE_SECONDS){const p=(sw.t-SWITCH_POSE_SECONDS)/SWITCH_RISE_SECONDS;return {id:sw.from,raised:true,offsetY:-height*p*p,phase:'rise'};}const p=Math.min(1,(sw.t-SWITCH_POSE_SECONDS-SWITCH_RISE_SECONDS)/SWITCH_FALL_SECONDS);return {id:sw.to,raised:false,offsetY:-height*(1-p)*(1-p),phase:'fall'};}
export function visibleShake(amount,paused,finished){return paused||finished?0:amount;}
