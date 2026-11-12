export const OFFENSE_BASE={x:1500,y:860,spawn:{x:1500,y:965},start:{x:1500,y:1120}};
export const OUTPOST_MAX_HP=4000;
export function createOffense(){
 const house={id:'outpost-house',type:'house',x:OFFENSE_BASE.x,y:OFFENSE_BASE.y,hp:OUTPOST_MAX_HP,max:OUTPOST_MAX_HP,radius:64,name:'방울이 산채 본체',flash:0};
 return {objects:[house],wave:0,nextWave:2,elapsed:0,spawned:0};
}
export function offenseProgress(objects){const house=objects.find(o=>o.type==='house');return {remainingHp:Math.max(0,house?.hp||0),maxHp:house?.max||1,complete:!!house&&house.hp<=0};}
export function offenseDamage(target,damage){return damage;}
export function spawnOffenseWave(offense,enemies,objects,player){
 const alive=enemies.filter(e=>e.hp>0);if(alive.length>=18)return [];
 const count=Math.min(3+Math.floor(offense.wave/3),5,18-alive.length),fresh=[];
 // Rotate each wave around the house, rather than feeding enemies through one doorway.
 for(let i=0;i<count;i++){let at=null;for(let k=0;k<60;k++){const angle=offense.wave*2.39996+i/count*Math.PI*2+k*.37,r=180+(k%4)*30,x=OFFENSE_BASE.x+Math.cos(angle)*r,y=OFFENSE_BASE.y+Math.sin(angle)*r;if(player&&Math.hypot(player.x-x,player.y-y)<100)continue;if(objects.some(o=>o.hp>0&&Math.hypot(o.x-x,o.y-y)<o.radius+23)||[...alive,...fresh].some(e=>Math.hypot(e.x-x,e.y-y)<46))continue;at={x,y};break;}if(!at)continue;const hp=100+Math.floor(offense.wave/4)*20;fresh.push({id:'guard-'+offense.spawned++,type:'enemy',name:'집 지킴이',...at,homeX:at.x,homeY:at.y,hp,max:hp,radius:22,mode:'chase',offense:true,flash:0,cooldown:1,windup:0,repath:0,path:[]});}
 offense.wave++;return fresh;
}
export function stepOffense(offense,enemies,objects,dt,player){offense.elapsed+=dt;offense.nextWave-=dt;if(offenseProgress(objects).complete||offense.nextWave>0)return [];offense.nextWave=5;return spawnOffenseWave(offense,enemies,objects,player);}
