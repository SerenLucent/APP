export function rollEnemyAttack(multiplier=1,random=Math.random,min=5,max=10){
 const base=min+Math.min(max-min,Math.floor(Math.max(0,random())*(max-min+1))),critical=random()<.05;
 return {base,critical,damage:Math.round(base*multiplier*(critical?2:1))};
}
