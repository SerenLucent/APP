export function fortressDamageStage(progress){if(progress.complete)return 4;const ratio=progress.maxHp>0?Math.max(0,progress.remainingHp)/progress.maxHp:1;return ratio<=0?4:ratio>.75?1:ratio>.5?2:3;}
