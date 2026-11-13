import {HEART_LAUNCH_END} from './adventure-heart-meteor.js';
export const KUKI_SLAM_IMPACT_TIME=.62;
// Visual effects keep advancing; AI, attacks and wave timers consume only unpaused time.
export function ultimateEnemyDelta(burst,dt){
 if(!burst)return dt;
 const end=burst.id==='momo'?HEART_LAUNCH_END:burst.id==='kuki'?KUKI_SLAM_IMPACT_TIME:0;
 return Math.max(0,dt-Math.min(dt,Math.max(0,end-burst.t)));
}
