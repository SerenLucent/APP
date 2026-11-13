export const HEART_ORBIT_END=1;
export const HEART_LAUNCH_END=1.24;
export const HEART_FIRST_IMPACT=1.72;
export const HEART_IMPACT_INTERVAL=.5;
export const HEART_FALL_TIME=.42;
export const HEART_IMPACT_RADIUS=112;
const offsets=[[-48,-30],[54,-27],[-52,29],[55,27],[0,-38]];
export function createHeartMeteor(origin,count=5){
 return {origin:{x:origin.x,y:origin.y},age:0,next:0,impacts:Array.from({length:count},(_,i)=>{const [dx,dy]=offsets[i%offsets.length];return ({
  x:Math.max(90,Math.min(2510,origin.x+dx)),y:Math.max(160,Math.min(1710,origin.y+dy)),at:HEART_FIRST_IMPACT+i*HEART_IMPACT_INTERVAL,
 });})};
}
export function stepHeartMeteor(sequence,dt,onImpact){
 sequence.age+=dt;
 while(sequence.next<sequence.impacts.length&&sequence.age+1e-9>=sequence.impacts[sequence.next].at){
  const impact=sequence.impacts[sequence.next++];onImpact(impact,sequence.next,sequence.next===sequence.impacts.length);
 }
 return sequence.next===sequence.impacts.length;
}
export function heartImpactTargets(impact,enemies){return enemies.filter(enemy=>enemy.hp>0&&Math.hypot(enemy.x-impact.x,enemy.y-impact.y)<=HEART_IMPACT_RADIUS+(enemy.radius??0));}
