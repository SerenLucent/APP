import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventLabel, eventsOn, dateSpan } from '../src/calendar-model.js';
import {cleanState,memberState} from '../shared/room-state.js';

test('calendar labels show off days and compact departure times without losing minutes', () => {
  assert.equal(eventLabel({kind:'work',workType:'leave',time:'19:00'}),'퇴근 19');
  assert.equal(eventLabel({kind:'work',workType:'leave',time:'09:00'}),'퇴근 9');
  assert.equal(eventLabel({kind:'work',workType:'leave',time:'19:30'}),'퇴근 19:30');
  assert.equal(eventLabel({kind:'work',workType:'off',time:''}),'휴무');
  assert.equal(eventLabel({kind:'trip',title:'여행'}),'여행');
  assert.equal(eventLabel({title:'기존 일정'}),'기존 일정');
  assert.deepEqual(eventsOn([{date:'2026-10-22',title:'퇴근'},{date:'2026-10-23',title:'휴무'}],'2026-10-22'),[{date:'2026-10-22',title:'퇴근'}]);
});
test('ranges include both dates and handle month and leap-year boundaries',()=>{
  assert.deepEqual(dateSpan('2028-02-28','2028-03-01'),['2028-02-28','2028-02-29','2028-03-01']);
  assert.deepEqual(dateSpan('2026-10-23','2026-10-23'),['2026-10-23']);
  assert.throws(()=>dateSpan('2026-10-24','2026-10-23'));
  assert.throws(()=>dateSpan('2026-02-30','2026-03-02'));
  assert.throws(()=>dateSpan('2025-01-01','2026-12-31'));
});
test('independent start/end times label shifts and retain legacy departure schedules',()=>{
  assert.equal(eventLabel({kind:'work',workType:'shift',startTime:'09:00',endTime:''}),'출근 9');
  assert.equal(eventLabel({kind:'work',workType:'shift',startTime:'',endTime:'19:30'}),'퇴근 19:30');
  assert.equal(eventLabel({kind:'work',workType:'shift',startTime:'09:00',endTime:'19:00'}),'근무 9~19');
  assert.equal(eventLabel({kind:'work',workType:'shift'}),'근무');
  assert.equal(eventLabel({kind:'date',title:'데이트',startTime:'18:00',endTime:'20:00'}),'데이트 18~20');
});
test('state validates optional times, preserves author identity and changes only the caller character',()=>{
  const current={startDate:null,characters:{owner:'momo',partner:'kuki'},events:[{id:'existing',date:'2026-10-23',title:'근무',kind:'work',workType:'shift',authorRole:'owner',startTime:'09:00',endTime:'19:00'}],notes:[]};
  const input=structuredClone(current);input.characters.owner='kuki';input.characters.partner='momo';input.events[0].authorRole='partner';input.events.push({id:'new',date:'2026-10-24',title:'휴무',kind:'work',workType:'off',authorRole:'owner'});
  const result=memberState(current,input,'partner');
  assert.deepEqual(result.characters,{owner:'momo',partner:'momo'});
  assert.equal(result.events[0].authorRole,'owner');assert.equal(result.events[1].authorRole,'partner');
  for(const bad of [{...current.events[0],startTime:'25:00'},{...current.events[0],workType:'off'}])assert.throws(()=>cleanState({...current,events:[bad]}));
  assert.deepEqual(memberState(current,{...current,characters:undefined},'owner').characters,current.characters);
});
