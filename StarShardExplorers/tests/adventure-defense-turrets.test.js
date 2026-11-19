import test from 'node:test';import assert from 'node:assert/strict';
import {createDefense,stepDefense,aggroDefenseEnemy,releaseDefenseAggro,DEFENSE_HOME} from '../src/adventure-defense.js';
import {createDefenseTurrets,nearbyTurret,defenseRearBlocked,fireTurret,stepTurrets,turretTargets,turretStrike,laserContact,pushDefenseEnemy,aimTurret,DEFENSE_PLATFORM,TURRET_RULES} from '../src/adventure-defense-turrets.js';
test('all defenders approach core from front and never start as player hunters',()=>{const d=createDefense();for(let n=0;n<29;n++){d.nextWave=0;const r=stepDefense(d,[],.01);assert.ok(r.fresh.every(e=>e.y<DEFENSE_HOME.y-300&&e.defenseTarget==='house'));}});
test('aggro is fifty percent on field hits and drops when player enters rear operating zone',()=>{const e={hp:100,defenseTarget:'house'};assert.equal(aggroDefenseEnemy(e,{x:1300,y:1000},()=>.5),false);assert.equal(aggroDefenseEnemy(e,{x:1300,y:1000},()=>.499),true);assert.equal(releaseDefenseAggro({...e,x:1300,y:1100},{x:1300,y:1250}),true);assert.equal(aggroDefenseEnemy(e,{x:1300,y:1250},()=>0),false);});
test('mount prompt only appears behind cannon and player cannot cross rear boundary',()=>{const ts=createDefenseTurrets();assert.equal(nearbyTurret(ts,{x:1150,y:1250}),ts[0]);assert.equal(nearbyTurret(ts,{x:1150,y:1100}),null);assert.equal(nearbyTurret(ts,{x:1250,y:1250}),null);assert.equal(defenseRearBlocked(1300,1330),true);assert.equal(defenseRearBlocked(1300,1250),false);});
test('heart firing spends one charge per grenade with no idle recharge',()=>{const ts=createDefenseTurrets(),t=ts[0];assert.equal(fireTurret(t).kind,'heart');assert.equal(Math.round(t.energy),80);assert.equal(fireTurret(t),false);stepTurrets(ts,t,1);assert.equal(Math.round(t.energy),80);stepTurrets(ts,null,1);assert.equal(Math.round(t.energy),80);});
test('heart blast hits wide radius and knocks away from actual impact center without entering rear zone',()=>{const t=createDefenseTurrets()[0],e={x:t.aim.x+80,y:t.aim.y,hp:100,radius:22};assert.deepEqual(turretTargets(t,[e]),[e]);pushDefenseEnemy(e,t.aim,105);assert.equal(e.x,t.aim.x+185);assert.ok(e.y<=DEFENSE_PLATFORM.enemyRear);});
test('laser ticks every .2 seconds and pushes nearest group rather than damaging distant targets through it',()=>{const ts=createDefenseTurrets(),t=ts[1],front={x:t.x,y:t.y-300,hp:100,radius:22},stacked={x:t.x,y:t.y-335,hp:100,radius:22},far={x:t.x,y:t.y-500,hp:100,radius:22};assert.deepEqual(turretTargets(t,[far,front,stacked]),[front,stacked]);assert.equal(fireTurret(t).kind,'laser');assert.equal(fireTurret(t),false);stepTurrets(ts,t,.2);assert.equal(fireTurret(t).kind,'laser');assert.equal(t.energy,96);pushDefenseEnemy(front,t,17);assert.equal(front.y,t.y-317);});
test('both turret directions remain in forward arc and heart aim is range bounded',()=>{const [h,l]=createDefenseTurrets();aimTurret(h,1,1,100);assert.ok(Math.hypot(h.aim.x-h.x,h.aim.y-h.y)<=540.0001);aimTurret(l,1,0,100);assert.ok(l.angle<0);aimTurret(l,-1,0,100);assert.ok(l.angle>-Math.PI);});

test('heart cannon can spend all five displayed rounds without floating point locking the last one',()=>{const ts=createDefenseTurrets(),t=ts[0];for(let i=0;i<5;i++){assert.equal(fireTurret(t).kind,'heart');stepTurrets(ts,t,1);}assert.equal(Math.round(t.energy),0);assert.equal(fireTurret(t),false);});

test('heart cannon can aim near core and damage every enemy in its actual blast',()=>{const t=createDefenseTurrets()[0];t.rawAim={x:1300,y:1100};aimTurret(t,0,0,0);assert.equal(fireTurret(t).kind,'heart');const e={x:1300,y:1120,hp:100,radius:22};assert.deepEqual(turretTargets(t,[e]),[e]);});
test('five waves of 25 overlap at ten remaining and require all 125 kills to finish',()=>{
 const d=createDefense(),enemies=[];d.house.hp=100000;let previous=0;
 for(let wave=1;wave<=5;wave++){
  if(wave>1){const alive=enemies.filter(e=>e.hp>0);while(alive.length>11)alive.shift().hp=0;assert.equal(stepDefense(d,enemies,2).fresh.length,0);alive.shift().hp=0;}
  for(let batch=0;batch<13;batch++){const out=stepDefense(d,enemies,2);assert.equal(out.fresh.length,batch===12?1:2);enemies.push(...out.fresh);}
  assert.equal(d.wave,wave);assert.equal(d.spawned,previous+25);previous=d.spawned;
 }
 assert.equal(new Set(enemies.map(e=>e.id)).size,125);assert.equal(stepDefense(d,enemies,0).complete,false);enemies.forEach(e=>e.hp=0);assert.equal(stepDefense(d,enemies,0).complete,true);
});

test('beam stops at first body contact; empty line continues to screen edge',()=>{const t=createDefenseTurrets()[1];t.range=900;t.rayOrigin={x:t.x,y:t.y-40};const front={x:t.x,y:t.y-300,hp:100,radius:22};const contact=laserContact(t,front,{x:t.x,y:t.y-80});assert.equal(contact.hit,true);assert.ok(contact.length<300);assert.equal(laserContact(t,null,{}).length,900);});

test('heart joystick retains normal range and forward angles without a core dead zone',()=>{const t=createDefenseTurrets()[0];for(let i=0;i<2000;i++){aimTurret(t,Math.sin(i*.2),Math.cos(i*.1),.04);assert.ok(Math.hypot(t.aim.x-t.x,t.aim.y-t.y)<=540.00001);assert.ok(Number.isFinite(t.aim.x)&&Number.isFinite(t.aim.y));}});

test('small per-frame left and right inputs accumulate across snapped heart directions',()=>{for(const direction of [-1,1]){const t=createDefenseTurrets()[0],start=t.aim.x;for(let i=0;i<60;i++)aimTurret(t,direction,0,1/60);assert.ok((t.aim.x-start)*direction>100);assert.ok((t.angle+Math.PI/2)*direction>0);}});
test('diagonal laser aim does not pull horizontal input back toward center',()=>{const [a,b]=[createDefenseTurrets()[1],createDefenseTurrets()[1]];for(let i=0;i<30;i++){aimTurret(a,1,0,1/60);aimTurret(b,1,-1,1/60);}assert.equal(a.angle,b.angle);});



test('laser hits bodies on its firing line even inside the core rectangle',()=>{const t=createDefenseTurrets()[1];t.angle=-130*Math.PI/180;t.rayOrigin={x:1450,y:1130};const e={x:1380,y:1046,hp:100,radius:22};assert.deepEqual(turretTargets(t,[e]),[e]);});

test('laser consumes ten percent per second at five ticks per second',()=>{const ts=createDefenseTurrets(),t=ts[1];for(let i=0;i<5;i++){assert.ok(fireTurret(t));stepTurrets(ts,t,.2);}assert.equal(t.energy,90);});

test('five heart grenades each deal triple basic damage; five laser supplies fund twenty-five basic attacks',()=>{const basic={damage:15,critical:false};assert.equal(turretStrike('heart',basic).damage,45);assert.equal(TURRET_RULES.heart.capacity,5);assert.equal(TURRET_RULES.heart.cost,20);const perTick=turretStrike('laser',basic).damage;assert.equal(perTick,15);assert.equal(perTick*5,15*5);assert.equal(50/TURRET_RULES.laser.cost*perTick,15*25);assert.equal(turretStrike('heart',{damage:90,critical:true}).critical,true);assert.equal(turretStrike('heart',{damage:90,critical:true}).damage,270);});

test('small mobile stick motions immediately steer both cannons without sprite-angle dead zones',()=>{for(const t of createDefenseTurrets()){const before=t.angle;aimTurret(t,.15,0,1/60);assert.ok(t.angle>before,t.kind);const right=t.angle;aimTurret(t,-.3,0,1/60);assert.ok(t.angle<right,t.kind);}});

import {ENEMY_RULES} from '../src/adventure-enemies.js';
test('core attackers use the same movement speed as character pursuit',()=>{const r=stepDefense(createDefense(),[],2);assert.ok(r.fresh.length);assert.ok(r.fresh.every(e=>e.speed===ENEMY_RULES.speed));});

test('aggro cap counts ten unique monsters per wave independently even when waves overlap',()=>{
 const d=createDefense(),p={x:1300,y:1000},make=(wave,i)=>({id:'defense-'+wave+'-'+i,wave,hp:100,defenseTarget:'house',x:1300,y:1000});
 const first=Array.from({length:11},(_,i)=>make(1,i)),second=Array.from({length:11},(_,i)=>make(2,i));
 assert.equal(aggroDefenseEnemy(first[0],p,()=>.9,d),false);assert.equal(d.aggroByWave[1],undefined);
 for(let i=0;i<10;i++)assert.equal(aggroDefenseEnemy(first[i],p,()=>0,d),true);
 assert.equal(d.aggroByWave[1],10);let rolled=false;assert.equal(aggroDefenseEnemy(first[10],p,()=>{rolled=true;return 0;},d),false);assert.equal(rolled,false);
 first[0].hp=0;assert.equal(aggroDefenseEnemy(first[10],p,()=>0,d),false);
 for(let i=0;i<10;i++)assert.equal(aggroDefenseEnemy(second[i],p,()=>0,d),true);
 assert.equal(d.aggroByWave[2],10);assert.equal(aggroDefenseEnemy(second[10],p,()=>0,d),false);assert.equal(d.aggroByWave[1],10);
});
test('repeated hits and losing aggro do not count the same monster twice or reopen a full wave quota',()=>{
 const d=createDefense(),p={x:1300,y:1000},e={id:'defense-1-0',hp:100,defenseTarget:'house',x:1300,y:1000};
 assert.equal(aggroDefenseEnemy(e,p,()=>0,d),true);assert.equal(aggroDefenseEnemy(e,p,()=>0,d),false);assert.equal(d.aggroByWave[1],1);
 releaseDefenseAggro(e,{x:1300,y:1250});assert.equal(aggroDefenseEnemy(e,p,()=>0,d),true);assert.equal(d.aggroByWave[1],1);
 d.aggroByWave[1]=10;releaseDefenseAggro(e,{x:1300,y:1250});assert.equal(aggroDefenseEnemy(e,p,()=>0,d),false);assert.equal(e.defenseTarget,'house');
 assert.deepEqual(createDefense().aggroByWave,{});
});
