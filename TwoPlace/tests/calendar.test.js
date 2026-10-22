import { test } from 'node:test';
import assert from 'node:assert/strict';
import { eventLabel, eventsOn } from '../src/calendar-model.js';

test('calendar labels show off days and compact departure times without losing minutes', () => {
  assert.equal(eventLabel({kind:'work',workType:'leave',time:'19:00'}),'퇴근 19');
  assert.equal(eventLabel({kind:'work',workType:'leave',time:'09:00'}),'퇴근 9');
  assert.equal(eventLabel({kind:'work',workType:'leave',time:'19:30'}),'퇴근 19:30');
  assert.equal(eventLabel({kind:'work',workType:'off',time:''}),'휴무');
  assert.equal(eventLabel({kind:'trip',title:'여행'}),'여행');
  assert.equal(eventLabel({title:'기존 일정'}),'기존 일정');
  assert.deepEqual(eventsOn([{date:'2026-10-22',title:'퇴근'},{date:'2026-10-23',title:'휴무'}],'2026-10-22'),[{date:'2026-10-22',title:'퇴근'}]);
});
