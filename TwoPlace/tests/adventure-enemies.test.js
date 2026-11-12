import {blocksPoint} from '../src/adventure-collision.js';
import test from 'node:test';
import assert from 'node:assert/strict';
import {createEnemies,enemyMode,enemyPath,stepEnemy,ENEMY_RULES} from '../src/adventure-enemies.js';
import {createObstacles} from '../src/adventure-model.js';
import {createDefense,stepDefense} from '../src/adventure-defense.js';

test('each first-wave house attacker strikes after reaching the house',()=>{
 const {fresh}=stepDefense(createDefense(),[],2);
 for(const enemy of fresh.filter(enemy=>enemy.defenseTarget==='house')){
  const defense=createDefense();
  let damage=0;
  for(let frame=0;frame<300&&!damage;frame++)damage=stepDefense(defense,[enemy],1/60).damage;
  assert.equal(damage,5,enemy.id);
 }
});

test('defense hunter reaches a player across the house without clipping the wall',()=>{
 const defense=createDefense();
 const {fresh}=stepDefense(defense,[],2);
 const hunter=fresh.find(enemy=>enemy.defenseTarget==='player');
 const player={x:1225,y:1030};
 let hit=false;
 for(let frame=0;frame<480&&!hit;frame++){
  hit=stepEnemy(hunter,player,[defense.house],1/60);
  assert.ok(!blocksPoint(defense.house,hunter.x,hunter.y,18));
 }
 assert.ok(hit);
});
test('slam stun cancels an attack and prevents movement until three seconds have passed',()=>{
 const enemy=createEnemies()[0];
 const player={x:enemy.x+20,y:enemy.y};
 const position=[enemy.x,enemy.y];
 enemy.windup=.01;
 enemy.stun=3;
 for(let i=0;i<12;i++)assert.equal(stepEnemy(enemy,player,[],.25),false);
 assert.deepEqual([enemy.x,enemy.y],position);
 assert.equal(enemy.windup,0);
 assert.equal(enemy.stun,0);
 stepEnemy(enemy,player,[],.04);
 assert.ok(enemy.windup>0);
});
test('enemies detect nearby player, drop distant targets, and finish returning before reacquiring',()=>{const e=createEnemies()[0];assert.equal(enemyMode(e,{x:e.x+300,y:e.y}),'idle');assert.equal(enemyMode(e,{x:e.x+100,y:e.y}),'chase');e.mode='chase';assert.equal(enemyMode(e,{x:e.x+400,y:e.y}),'return');e.x=e.homeX+100;e.mode='return';assert.equal(enemyMode(e,{x:e.x,y:e.y}),'return');e.x=e.homeX;assert.equal(enemyMode(e,{x:e.x,y:e.y}),'idle');e.mode='chase';e.x=e.homeX+ENEMY_RULES.leash+1;assert.equal(enemyMode(e,{x:e.x,y:e.y}),'return');e.hp=0;assert.equal(enemyMode(e,{x:e.x,y:e.y}),'dead');});
test('pursuit paths avoid obstacle clearance and return all the way home',()=>{const e=createEnemies()[0],home={x:e.x,y:e.y},obstacle={x:e.x+80,y:e.y,hp:100,radius:28},target={x:e.x+180,y:e.y};const path=enemyPath(e,target,[obstacle]);assert.ok(path.length>0);assert.ok(path.every(p=>Math.hypot(p.x-obstacle.x,p.y-obstacle.y)>=46));for(let i=0;i<180;i++)stepEnemy(e,target,[obstacle],.04);assert.ok(Math.hypot(e.x-target.x,e.y-target.y)<80);for(let i=0;i<250;i++)stepEnemy(e,{x:100,y:200},[obstacle],.04);assert.equal(e.mode,'idle');assert.ok(Math.hypot(e.x-home.x,e.y-home.y)<10);});
test('attacks have a dodgeable windup and cooldown; enemy spawn cells are clear',()=>{const e=createEnemies()[0],player={x:e.x+20,y:e.y};assert.equal(stepEnemy(e,player,[],.04),false);assert.ok(e.windup>0);let hit=false;for(let i=0;i<20;i++)if(stepEnemy(e,player,[],.04))hit=true;assert.equal(hit,true);assert.ok(e.cooldown>0);const o=createObstacles();for(const enemy of createEnemies(o))assert.ok(o.every(x=>Math.hypot(x.x-enemy.x,x.y-enemy.y)>=x.radius+18));});
