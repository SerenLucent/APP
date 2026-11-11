export const HIT_JOLT_DURATION=.18;
export function triggerHitJolt(target){
 target.hitJolt=HIT_JOLT_DURATION;
 target.hitJoltPhase=((target.x||0)*.17+(target.y||0)*.11)%(Math.PI*2);
}
export function stepHitJolt(target,dt){target.hitJolt=Math.max(0,(target.hitJolt||0)-dt);}
export function hitJoltOffset(target){
 const remaining=target?.hitJolt||0;if(!remaining)return {x:0,y:0};
 const age=HIT_JOLT_DURATION-remaining,fade=remaining/HIT_JOLT_DURATION,phase=target.hitJoltPhase||0;
 return {x:Math.sin(age*Math.PI*2*22+phase)*2.6*fade,y:Math.sin(age*Math.PI*2*29+phase)*.65*fade};
}
export function drawWithHitJolt(ctx,target,draw){
 const offset=hitJoltOffset(target);
 if(!offset.x&&!offset.y){draw();return;}
 ctx.save();try{ctx.translate(offset.x,offset.y);draw();}finally{ctx.restore();}
}
