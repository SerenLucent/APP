import test from 'node:test';import assert from 'node:assert/strict';
import {startSwitch,stepSwitch,switchVisual,visibleShake,SWITCH_TOTAL} from '../src/adventure-switch.js';
import {gainBasicGauge,spendGauge} from '../src/adventure-model.js';
const initial=()=>({active:'momo',pets:{momo:{hp:100},kuki:{hp:100}},p:{x:100,y:200,fx:1,fy:0,walking:true},invuln:0,swap:0,basic:0,target:{x:50,y:50},switching:null});
test('switch holds the front raised-hand pose for half a second, rises out, then drops the other character',()=>{const s=initial();assert.equal(startSwitch(s),true);assert.ok(s.invuln>=SWITCH_TOTAL+1);assert.equal(s.target,null);assert.equal(s.p.fy,1);assert.equal(startSwitch(s),false);stepSwitch(s,.3);assert.equal(switchVisual(s.switching).phase,'pose');stepSwitch(s,.2);stepSwitch(s,.15);assert.equal(switchVisual(s.switching).phase,'rise');assert.ok(switchVisual(s.switching).offsetY<0);assert.equal(s.active,'momo');const change=stepSwitch(s,.21);assert.equal(change.changed,true);assert.equal(s.active,'kuki');assert.equal(switchVisual(s.switching).phase,'fall');assert.equal(switchVisual(s.switching).raised,false);s.invuln=0;const land=stepSwitch(s,1);assert.equal(land.landed,true);assert.equal(s.switching,null);assert.equal(s.invuln,1);});
test('switch cannot interrupt an attack or summon a defeated character',()=>{for(const key of ['attack','charge','burst']){const s=initial();s[key]={};assert.equal(startSwitch(s),false);assert.equal(s.switching,null);}const s=initial();s.pets.kuki.hp=0;assert.equal(startSwitch(s),false);});
test('paused or completed gameplay always has zero camera shake regardless of residual impact strength',()=>{assert.equal(visibleShake(12,true,false),0);assert.equal(visibleShake(12,false,true),0);assert.equal(visibleShake(7,false,false),7);});

test('switching preserves each gauge and spending affects only the active character',()=>{
 const state=initial();
 state.pets.momo.gauge=100;
 state.pets.kuki.gauge=30;
 assert.ok(startSwitch(state));
 stepSwitch(state,SWITCH_TOTAL);
 assert.equal(state.active,'kuki');
 assert.equal(spendGauge(state.pets[state.active]),false);
 gainBasicGauge(state.pets[state.active],true);
 state.swap=0;
 assert.ok(startSwitch(state));
 stepSwitch(state,SWITCH_TOTAL);
 assert.equal(state.active,'momo');
 assert.equal(spendGauge(state.pets[state.active]),true);
 assert.equal(state.pets.momo.gauge,0);
 assert.equal(state.pets.kuki.gauge,40);
});
