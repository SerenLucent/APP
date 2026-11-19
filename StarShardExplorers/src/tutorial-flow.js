export const PRACTICE_STEPS=['move','basic','charge','momoSkill','toKuki','heart','kukiSkill','toMomo','star'];
export function nextPracticeStep(step,event){const expected={move:'moved',basic:'basicHit',charge:'charged',momoSkill:'momoUltimate',toKuki:'kuki',heart:'heart',kukiSkill:'kukiUltimate',toMomo:'momo',star:'star'};return expected[step]===event?PRACTICE_STEPS[PRACTICE_STEPS.indexOf(step)+1]||'done':step;}

export function practiceTargetReached(player,target){if(!target)return false;const dx=target.x-player.x,dy=target.y-player.y,d=Math.hypot(dx,dy);return d<85&&(d<25||(dx*player.fx+dy*player.fy)/d>.25);}
