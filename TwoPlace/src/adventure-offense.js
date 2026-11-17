export const OFFENSE_BASE={x:1300,y:600,spawn:{x:1300,y:690},start:{x:1300,y:675}};
export const OUTPOST_MAX_HP=5000,REBUILD_SECONDS=20;
export const TOWER_SIDE_OFFSET=300,CANNON_RANGE=TOWER_SIDE_OFFSET*2;
export function cannonDirection(dx,dy){return (Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8;}
export function createOffense(){
 const {x,y}=OFFENSE_BASE;
 const house={id:'outpost-house',type:'house',x,y,hp:OUTPOST_MAX_HP,max:OUTPOST_MAX_HP,radius:100,halfWidth:100,halfDepth:33,collisionY:22,hitHalfWidth:76,hitHalfDepth:24,hitOffsetY:8,name:'뭉치 요새 본체',flash:0};
 const parts=['gate','tower'].flatMap(type=>[-1,1].map(side=>({id:type+'-'+side,type,reserveFootprint:true,x:x+side*(type==='gate'?185:TOWER_SIDE_OFFSET),y:y+(type==='gate'?12:110),hp:200,max:200,radius:type==='gate'?46:36,halfWidth:type==='gate'?46:36,halfDepth:25,hitHalfWidth:type==='gate'?44:30,hitHalfDepth:22,name:type==='gate'?'출입문':'방어타워',flash:0,rebuild:0,facing:side<0?0:4,shot:5+(side+1)})));
 return {objects:[house,...parts],wave:0,nextWave:6,elapsed:0,spawned:0,ready:2.5,projectiles:[],impacts:[]};
}
export function offenseProgress(objects){const h=objects.find(o=>o.type==='house');return {remainingHp:Math.max(0,h?.hp||0),maxHp:h?.max||1,complete:!!h&&h.hp<=0};}
export function offenseDamage(target,damage){return damage;}
export function spawnOffenseWave(offense,enemies,objects,player){
 const alive=enemies.filter(e=>e.hp>0),gates=objects.filter(o=>o.type==='gate'&&o.hp>0);if(alive.length>=18||!gates.length)return [];
 const count=Math.min(gates.length*2,18-alive.length),fresh=[];
 for(let i=0;i<count;i++){const gate=gates[i%gates.length];
 if(alive.some(e=>e.emerging&&e.emerging.gateId===gate.id))continue;
 const x=gate.x,y=gate.y-8;
 fresh.push({id:'guard-'+offense.spawned++,type:'enemy',name:'뭉치',x,y,homeX:x,homeY:gate.y+75,hp:100,max:100,radius:22,mode:'emerging',offense:true,facing:0,emerging:{gateId:gate.id,gateY:gate.y,startY:y,endY:gate.y+75,delay:Math.floor(i/gates.length)*.3,t:0},flash:0,cooldown:1,windup:0,repath:0,path:[]});}

 offense.wave++;return fresh;
}
export function stepOffense(offense,enemies,objects,dt,player){
 offense.impacts=[];if(offenseProgress(objects).complete)return [];offense.elapsed+=dt;
 for(const o of objects){if(o.type==='house')continue;if(o.hp<=0){o.rebuild=Math.min(REBUILD_SECONDS,(o.rebuild||0)+dt);if(o.rebuild>=REBUILD_SECONDS){o.hp=o.max;o.rebuild=0;o.shot=5;}continue;}if(o.type==='tower'&&player){o.shot=Math.max(0,o.shot-dt);if(Math.hypot(player.x-o.x,player.y-o.y)>CANNON_RANGE)continue;o.facing=cannonDirection(player.x-o.x,player.y-o.y);if(o.shot<=0){o.shot=5;offense.projectiles.push({x:o.x+Math.cos(o.facing*Math.PI/4)*24,y:o.y-110+Math.sin(o.facing*Math.PI/4)*10,tx:player.x,ty:player.y,age:-dt,life:2});}}}
 for(const q of offense.projectiles){q.age+=dt;if(q.age>=q.life)offense.impacts.push({x:q.tx,y:q.ty,hit:!!player&&Math.hypot(player.x-q.tx,player.y-q.ty)<52});}offense.projectiles=offense.projectiles.filter(q=>q.age<q.life);
 offense.nextWave-=dt;if(offense.nextWave>0)return [];offense.nextWave=6;return spawnOffenseWave(offense,enemies,objects,player);
}
