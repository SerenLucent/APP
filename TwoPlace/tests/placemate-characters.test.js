import test from 'node:test';
import assert from 'node:assert/strict';
import {coupleProfiles} from '../public/placemate/couple-profiles.js';
const base={role:'owner',memberCount:2,profiles:{owner:{nickname:'방을 만든 사람'},partner:{nickname:'초대받은 사람'}}};
test('distinct couple characters label either role with the calendar character colors',()=>{
 for(const role of ['owner','partner'])for(const owner of ['momo','kuki']){
 const s={...base,role,characters:{owner,partner:owner==='momo'?'kuki':'momo'}},before=structuredClone(s),users=coupleProfiles(s);
 assert.deepEqual(users.map(u=>u.name),owner==='momo'?['모모','쿠키']:['쿠키','모모']);
 assert.deepEqual(users.map(u=>u.color),owner==='momo'?['#f2a9c8','#9dcff5']:['#9dcff5','#f2a9c8']);
 assert.equal(users.find(u=>u.id==='me').name,s.characters[role]==='momo'?'모모':'쿠키');assert.deepEqual(s,before);
 }
});
test('each configured member uses their character independently, including identical choices',()=>{
 for(const owner of [undefined,'momo','kuki','unknown'])for(const partner of [undefined,'momo','kuki','unknown']){
  const users=coupleProfiles({...base,characters:{owner,partner}});
  for(const [i,c] of [owner,partner].entries())assert.equal(users[i].name,c==='momo'?'모모':c==='kuki'?'쿠키':i===0?'방을 만든 사람':'초대받은 사람');
 }
 assert.deepEqual(coupleProfiles(base).map(u=>u.name),['방을 만든 사람','초대받은 사람']);
});
