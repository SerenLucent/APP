import test from 'node:test';
import assert from 'node:assert/strict';
import {createDefenseTurrets,fireTurret,turretHasAmmo} from '../src/adventure-defense-turrets.js';
test('last grenade consumes final round; a supply enables use again even during cooldown',()=>{
 const t=createDefenseTurrets()[0];for(let i=0;i<5;i++){t.cooldown=0;assert.ok(turretHasAmmo(t));assert.ok(fireTurret(t));}assert.equal(t.energy,0);assert.equal(turretHasAmmo(t),false);assert.equal(fireTurret(t),false);t.energy+=20;assert.equal(turretHasAmmo(t),true);
});
test('laser becomes unavailable after final tick and a ten percent pickup enables use again',()=>{
 const t=createDefenseTurrets()[1];for(let i=0;i<50;i++){t.cooldown=0;assert.ok(fireTurret(t));}assert.equal(turretHasAmmo(t),false);t.energy=10;assert.equal(turretHasAmmo(t),true);t.energy=1;assert.equal(turretHasAmmo(t),false);
});
