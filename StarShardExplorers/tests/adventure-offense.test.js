import test from 'node:test';import assert from 'node:assert/strict';
import {createOffense,offenseProgress,stepOffense,OFFENSE_BASE,REBUILD_SECONDS,CANNON_RANGE} from '../src/adventure-offense.js';
import {enemyPath,stepEnemy} from '../src/adventure-enemies.js';
import {blocksPoint} from '../src/adventure-collision.js';
test('fortress has five independent targets and only the main body ends the round',()=>{const f=createOffense();assert.equal(f.objects.length,5);assert.equal(offenseProgress(f.objects).maxHp,5000);for(const p of f.objects.slice(1))p.hp=0;assert.equal(offenseProgress(f.objects).complete,false);f.objects[0].hp=0;assert.equal(offenseProgress(f.objects).complete,true);});
test('destroyed gates stop their own reinforcements until rebuilt',()=>{const f=createOffense(),gates=f.objects.filter(o=>o.type==='gate');gates[0].hp=0;let wave=stepOffense(f,[],f.objects,6,OFFENSE_BASE.start);assert.equal(wave.length,2);assert.ok(wave.every(e=>e.x>OFFENSE_BASE.x));const g=createOffense();for(const gate of g.objects.filter(o=>o.type==='gate'))gate.hp=0;assert.equal(stepOffense(g,[],g.objects,6,OFFENSE_BASE.start).length,0);});
test('parts restore their scaled maximum HP after twenty seconds, not the main body',()=>{const f=createOffense(),p=f.objects[1];p.max=750;p.hp=0;stepOffense(f,[],f.objects,19);assert.equal(p.hp,0);assert.equal(p.rebuild,19);stepOffense(f,[],f.objects,1);assert.equal(p.hp,750);assert.equal(p.rebuild,0);f.objects[0].hp=0;p.hp=0;stepOffense(f,[],f.objects,20);assert.equal(p.hp,0);});
test('tower projectiles mark a fixed landing point, hit only nearby players, and expire',()=>{const f=createOffense(),p={x:1300,y:900};f.objects.find(o=>o.type==='tower'&&o.x>OFFENSE_BASE.x).shot=Infinity;stepOffense(f,[],f.objects,5,p);assert.equal(f.projectiles.length,1);assert.equal(f.impacts.length,0);stepOffense(f,[],f.objects,1.9,p);assert.equal(f.impacts.length,0);stepOffense(f,[],f.objects,.1,p);assert.equal(f.impacts.length,1);assert.equal(f.impacts[0].hit,true);assert.equal(f.projectiles.length,0);const g=createOffense();g.objects.find(o=>o.type==='tower'&&o.x>OFFENSE_BASE.x).shot=Infinity;stepOffense(g,[],g.objects,5,p);stepOffense(g,[],g.objects,2,{x:1500,y:900});assert.equal(g.impacts.length,1);assert.equal(g.impacts[0].hit,false);});
test('broken towers do not fire and fire again after reconstruction',()=>{const f=createOffense();for(const o of f.objects.filter(o=>o.type==='tower'))o.hp=0;stepOffense(f,[],f.objects,REBUILD_SECONDS-1,OFFENSE_BASE.start);assert.equal(f.projectiles.length,0);stepOffense(f,[],f.objects,1,OFFENSE_BASE.start);stepOffense(f,[],f.objects,5,OFFENSE_BASE.start);assert.equal(f.projectiles.length,2);});
test('spawns are outside structure colliders and retain the live cap and six second cadence',()=>{const f=createOffense(),first=stepOffense(f,[],f.objects,6,OFFENSE_BASE.start);assert.equal(first.length,4);for(const e of first){assert.ok(e.emerging);for(let i=0;i<45;i++)stepEnemy(e,OFFENSE_BASE.start,f.objects,1/30);assert.ok(!f.objects.some(o=>blocksPoint(o,e.x,e.y,22)));}assert.equal(stepOffense(f,first,f.objects,5.9).length,0);assert.equal(stepOffense(f,first,f.objects,.1).length,4);const enemies=Array.from({length:18},(_,i)=>({hp:100,x:90+i*50,y:1000}));assert.equal(stepOffense(f,enemies,f.objects,6).length,0);});
test('both gates remain reachable from the player start',()=>{const f=createOffense();for(const gate of f.objects.filter(o=>o.type==='gate'))assert.ok(enemyPath(OFFENSE_BASE.start,{x:gate.x,y:gate.y+65},f.objects).length>0);});
test('destroyed gate and tower footprints keep blocking player and enemy clearance until and after reconstruction',()=>{
 for(const kind of ['gate','tower']){const f=createOffense(),part=f.objects.find(o=>o.type===kind);part.hp=0;
 assert.equal(blocksPoint(part,part.x,part.y,12),true);
 assert.equal(blocksPoint(part,part.x+part.halfWidth+11,part.y,12),true);
 assert.equal(blocksPoint(part,part.x+part.halfWidth+20,part.y,22),true);
 assert.equal(blocksPoint(part,part.x+part.halfWidth+30,part.y,12),false);
 const player={x:part.x+part.halfWidth+30,y:part.y};stepOffense(f,[],f.objects,19,player);assert.equal(part.hp,0);stepOffense(f,[],f.objects,1,player);assert.equal(part.hp,part.max);assert.equal(part.rebuild,0);
 }
});
test('ordinary destroyed objects remain walkable and enemy paths avoid reserved rubble',()=>{
 assert.equal(blocksPoint({type:'rock',x:100,y:100,radius:30,hp:0},100,100,12),false);
 const f=createOffense(),gate=f.objects.find(o=>o.type==='gate');gate.hp=0;
 const path=enemyPath({x:gate.x-150,y:gate.y+70},{x:gate.x+150,y:gate.y+70},f.objects);
 assert.ok(path.length>0);for(const point of path)assert.equal(blocksPoint(gate,point.x,point.y,18),false);
});

test('two guards emerge per live doorway, staggered before chasing or attacking',()=>{const f=createOffense(),gates=f.objects.filter(o=>o.type==='gate'),wave=stepOffense(f,[],f.objects,6,OFFENSE_BASE.start);assert.equal(wave.length,4);for(let i=0;i<4;i++){const e=wave[i],gate=gates[i%2];assert.equal(e.x,gate.x);assert.equal(e.y,gate.y-8);assert.equal(e.mode,'emerging');assert.equal(stepEnemy(e,{x:e.x,y:e.y},f.objects,.4),false);assert.equal(e.windup,0);assert.ok(e.emerging);stepEnemy(e,OFFENSE_BASE.start,f.objects,.9);assert.equal(e.emerging,null);assert.equal(e.mode,'chase');assert.ok(e.y>=gate.y+75);}});

test('cannon towers flank the battlefield below the gates and auxiliary structures use two hundred base HP',()=>{const f=createOffense(),gates=f.objects.filter(o=>o.type==='gate'),towers=f.objects.filter(o=>o.type==='tower');for(let i=0;i<2;i++){assert.ok(towers[i].y-gates[i].y>=90);assert.ok(Math.abs(towers[i].x-OFFENSE_BASE.x)>Math.abs(gates[i].x-OFFENSE_BASE.x));assert.equal(towers[i].max,200);assert.equal(gates[i].max,200);}assert.equal(REBUILD_SECONDS,20);});
test('cannon range equals the tower-to-tower span and stops new shots outside it',()=>{
 const f=createOffense(),towers=f.objects.filter(o=>o.type==='tower');assert.equal(CANNON_RANGE,Math.hypot(towers[1].x-towers[0].x,towers[1].y-towers[0].y));
 const tower=towers[0],objects=[f.objects[0],tower],outside={x:tower.x,y:tower.y+CANNON_RANGE+1};
 stepOffense(f,[],objects,20,outside);assert.equal(f.projectiles.length,0);
 const inside={x:tower.x,y:tower.y+CANNON_RANGE-1};stepOffense(f,[],objects,.01,inside);assert.equal(f.projectiles.length,1);
 const shot=f.projectiles[0];stepOffense(f,[],objects,.5,outside);assert.equal(shot.tx,inside.x);assert.equal(shot.ty,inside.y);
});
