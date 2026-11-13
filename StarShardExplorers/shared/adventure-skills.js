export function skillBalance(level=1){
 const current=Math.max(1,Math.min(10,Math.floor(Number(level)||1)));
 return {
  level:current,
  spinDuration:3.5+(current-1)*.5,
  tailMultiplier:30+(current-1)*2+(current===10?2:0),
  tailStunChance:current/10,
  meteorCount:current+4,
  slamCoverage:.5+(current-1)/18,
  ultimateMultiplier:1+(current-1)*.1,
 };
}
