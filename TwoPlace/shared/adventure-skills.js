export function skillBalance(level=1){
 const current=Math.max(1,Math.min(10,Math.floor(Number(level)||1)));
 return {
  level:current,
  spinDuration:3.5+(current-1)*.5,
  tailMultiplier:30+(current-1)*.5+(current===10?.5:0),
  ultimateMultiplier:1+(current-1)*.03+(current===10?.03:0),
 };
}
