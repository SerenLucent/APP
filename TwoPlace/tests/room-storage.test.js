import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import {initialPetHome} from '../server/pets.js';
import {createRoomDocuments,partitionLegacyRoom,historyFiles} from '../shared/room-storage.js';
import {createObstacles,EXPLORATION_FIELD_VERSION,DEFENSE_WAVES} from '../shared/adventure-field.js';
const now=Date.parse('2026-11-11T12:00:00+09:00');
function fixture(){return {code:'123456789012',revision:0,members:[{role:'owner'},{role:'partner'}],state:{startDate:null,characters:{owner:'momo',partner:'kuki'},events:[{id:'old',date:'2025-12-31',title:'지난 약속',authorRole:'owner'},{id:'new',date:'2026-11-11',title:'약속',authorRole:'owner'}],notes:[{id:'note',date:'2026-11-11',body:'메모'}]},petHome:{...initialPetHome(now-3600000),heartHistory:[{at:now,amount:10,label:'하트',balance:120}],adventure:{totalClears:1,history:[{at:now,runId:'before',durationMs:90000,reward:{id:'heart2',label:'하트 2개',hearts:2,segments:['heart2','heart3'],index:0}}]},items:[{id:'table',product:'table',space:'home',x:50,y:65}]}};}
function store(room=fixture()){
 let files=partitionLegacyRoom(room,now),reads=[],writes=[];
 return {get files(){return files;},reads,writes,open({fail=false}={}){return createRoomDocuments(files['room.json'],{read:name=>{reads.push(name);return files[name]?structuredClone(files[name]):null;},commit:changes=>{if(fail)throw Error('network');writes.push(Object.keys(changes));files={...files,...structuredClone(changes)};},now:()=>now,idFactory:()=> '1234567890abcdef1234567890abcdef'});}};
}
test('migration separates calendar years, notes, layout, wallet, game profile and histories without mutating input',()=>{
 const input=fixture(),before=JSON.stringify(input),files=partitionLegacyRoom(input,now);
 assert.equal(JSON.stringify(input),before);
 assert.ok(files['calendar/calendar_2025.json']);assert.ok(files['calendar/calendar_2026.json']);
 assert.equal(files['notes/notes.json'].notes.length,1);assert.equal(files['housing/layout.json'].items.length,1);
 assert.equal(files['wallet/current.json'].items,undefined);assert.equal(files['wallet/current.json'].heartHistory,undefined);assert.equal(files['wallet/current.json'].calendarRewards,undefined);
 assert.equal(files['room.json'].petHome,undefined);assert.equal(files['room.json'].state.events,undefined);
 assert.equal(files['adventure/profile.json'].history,undefined);assert.equal(files['adventure/profile.json'].bestDurationMs,90000);
 assert.equal(files['game-history/2026/11/clear_2026_11_10.json'].entries[0].reward.segments,undefined);
});
test('storage migration does not trigger old calendar backfill or furniture remodeling',()=>{
 const input=fixture();delete input.petHome.calendarRewards;delete input.petHome.layoutVersion;
 const files=partitionLegacyRoom(input,now);
 assert.equal(files['wallet/current.json'].hearts,input.petHome.hearts);
 assert.deepEqual(files['housing/layout.json'].items,input.petHome.items);
 assert.equal(files['wallet/current.json'].version,input.petHome.version);
 assert.equal(Object.entries(files).filter(([k])=>k.startsWith('heart-history/')).reduce((n,[,v])=>n+v.entries.length,0),input.petHome.heartHistory.length);
});
test('home reads only wallet; on-demand reads select one year or only relevant history files across month/year boundaries',()=>{
 const s=store(),session=s.open(),snapshot=session.snapshot('owner');
 assert.deepEqual(s.reads,['wallet/current.json']);assert.equal(snapshot.petHome.items,undefined);assert.equal(snapshot.petHome.adventure,undefined);
 session.content('calendar',['2026']);assert.equal(session.snapshot('owner').state.events.length,1);assert.ok(!s.reads.includes('calendar/calendar_2025.json'));
 assert.deepEqual(historyFiles('heart','2026-12-31','2027-01-02'),['heart-history/2026/12/heart_2026_12_31.json','heart-history/2027/01/heart_2027_01_01.json']);
 assert.equal(session.history('heart','2026-11-09','2026-11-11').entries.length,1);
 assert.throws(()=>session.history('heart','2026-10-01','2026-11-11'));
});
test('care atomically saves wallet and one new history row, without reading layout, calendar or old game history',()=>{
 const s=store(),session=s.open();session.petAction({type:'pat',pet:'mochi',version:0},'owner');
 assert.equal(s.files['wallet/current.json'].hearts,121);
 assert.equal(s.files['heart-history/2026/11/heart_2026_11_10.json'].entries.length,2);
 assert.equal(s.files['housing/layout.json'].items.length,1);
 assert.equal(s.files['wallet/current.json'].heartHistory,undefined);
 assert.deepEqual(s.reads,['wallet/current.json','heart-history/2026/11/heart_2026_11_10.json']);
 assert.equal(s.writes.length,1);assert.ok(s.writes[0].includes('wallet/current.json'));
 assert.throws(()=>s.open().petAction({type:'pat',pet:'mochi',version:0},'owner'),e=>e.status===409);
});
test('calendar edits preserve unloaded years and notes; year reward ledger prevents repeat payouts',()=>{
 const s=store(),session=s.open();session.content('calendar',['2026']);
 const snapshot=session.snapshot('owner'),next={...snapshot.state,events:[...snapshot.state.events,{id:'extra',date:'2026-11-12',title:'추가',authorRole:'owner'}]};
 session.updateState({revision:0,scope:'calendar',years:['2026'],state:next},'owner');
 assert.equal(s.files['calendar/calendar_2025.json'].events[0].id,'old');assert.equal(s.files['notes/notes.json'].notes.length,1);
 assert.equal(s.files['calendar/calendar_2026.json'].events.length,2);assert.equal(s.files['wallet/current.json'].hearts,125);assert.equal(s.files['room.json'].content.eventCount,3);
 const repeat=s.open();repeat.content('calendar',['2026']);repeat.updateState({revision:1,scope:'calendar',years:['2026'],state:repeat.snapshot('owner').state},'owner');
 assert.equal(s.files['wallet/current.json'].hearts,125);
 const reader=s.open();reader.readCalendar({year:'2026',eventId:'extra'},'partner');assert.equal(s.files['wallet/current.json'].hearts,126);
 s.open().readCalendar({year:'2026',eventId:'extra'},'partner');assert.equal(s.files['wallet/current.json'].hearts,126);
});
test('failed commit leaves wallet and history unchanged; notes and furniture remain in their own documents',()=>{
 const s=store(),before=JSON.stringify(s.files);assert.throws(()=>s.open({fail:true}).petAction({type:'pat',pet:'mochi',version:0},'owner'));
 assert.equal(JSON.stringify(s.files),before);
 const notes=s.open();notes.content('notes');notes.updateState({revision:0,scope:'notes',state:{notes:[]}},'owner');assert.deepEqual(s.files['notes/notes.json'].notes,[]);assert.equal(s.files['calendar/calendar_2026.json'].events.length,1);
 const home=s.open();home.petAction({type:'buy',product:'plant',version:0},'owner');assert.equal(s.files['housing/layout.json'].items.length,2);assert.equal(s.files['wallet/current.json'].hearts,95);
});
test('existing real room migration preserves balances, all calendar events, notes, furniture and history counts',()=>{
 const file='releases/APP/TwoPlace/remote-data/couples/438941217334/room.json';
 if(!fs.existsSync(file))return;
 let input=JSON.parse(fs.readFileSync(file));
 if(input.storageVersion===2){const folder=file.replace(/room\.json$/,'backups/'),backup=fs.readdirSync(folder).find(name=>name.startsWith('storage-v2_'));assert.ok(backup,'Migrated room retains original backup');input=JSON.parse(fs.readFileSync(folder+backup));}
 const files=partitionLegacyRoom(input,now);
 assert.equal(files['wallet/current.json'].hearts,input.petHome.hearts);
 assert.equal(files['housing/layout.json'].items.length,input.petHome.items.length);
 assert.equal(files['notes/notes.json'].notes.length,input.state.notes.length);
 assert.equal(Object.entries(files).filter(([k])=>k.startsWith('calendar/')).reduce((n,[,v])=>n+v.events.length,0),input.state.events.length);
 for(const [prefix,expected] of [['heart-history/',input.petHome.heartHistory.length],['game-history/',input.petHome.adventure.history.length]])assert.equal(Object.entries(files).filter(([k])=>k.startsWith(prefix)).reduce((n,[,v])=>n+v.entries.length,0),expected);
});
test('game rewards and repeated finish requests keep profile, wallet and history consistent without reading layout',()=>{
 const s=store(),start=s.open();start.petAction({type:'adventureStart',mode:'explore',actionId:'split-start-request0',version:0},'owner');
 const run=start.snapshot('owner').petHome.adventure.runs.owner,done=s.open();
 const finish={type:'adventureFinish',actionId:'split-finish-request',version:1,runId:run.id,cleared:createObstacles(run.seed).slice(0,100).map(e=>e.id),playTimeMs:0,pet:'momo'};
 done.petAction(finish,'owner');assert.equal(s.files['adventure/profile.json'].totalClears,2);assert.equal(s.files['game-history/2026/11/clear_2026_11_10.json'].entries.length,2);
 assert.equal(s.files['adventure/profile.json'].history,undefined);assert.ok(s.files['adventure/profile.json'].stardust>0);
 const balance=s.files['wallet/current.json'].hearts;
 s.open().petAction({...finish,version:2},'owner');assert.equal(s.files['wallet/current.json'].hearts,balance);assert.equal(s.files['game-history/2026/11/clear_2026_11_10.json'].entries.length,2);
 assert.equal(s.reads.some(name=>name.startsWith('housing/')||name.startsWith('calendar/')||name.startsWith('notes/')),false);
});
test('all three current modes award split currency, then battle purchases, stat/skill upgrades and potions work together',()=>{
 const input=fixture();input.petHome.adventure={stardust:1000};const s=store(input);let sequence=0;
 const act=action=>{const session=s.open();session.petAction({...action,actionId:'release-game-action-'+String(++sequence).padStart(4,'0'),version:s.files['wallet/current.json'].version},'owner');return session.snapshot('owner');};
 for(const mode of ['explore','offense','defense']){
  const started=act({type:'adventureStart',mode,fieldVersion:EXPLORATION_FIELD_VERSION}),run=started.petHome.adventure.runs.owner;
  const objects=createObstacles(run.seed,EXPLORATION_FIELD_VERSION),cleared=mode==='explore'?[...objects.filter(o=>o.type==='tree').slice(0,50),...objects.filter(o=>o.type==='rock').slice(0,30)].map(o=>o.id):mode==='offense'?['outpost-house']:DEFENSE_WAVES.flatMap((count,wave)=>Array.from({length:count},(_,i)=>`defense-${wave+1}-${i}`));
  const completed=act({type:'adventureFinish',runId:run.id,cleared,pet:'kuki',playTimeMs:0});
  assert.ok(completed.petHome.adventure.runs.owner.reward.hearts>=2);assert.ok(completed.petHome.adventure.runs.owner.reward.hearts<=5);
  assert.equal(completed.petHome.adventure.runs.owner.reward.stardust,60);
 }
 assert.equal(s.files['adventure/profile.json'].totalClears,3);assert.equal(s.files['adventure/profile.json'].stardust,1180);
 for(const [product,quantity] of [['statPoint',2],['skillPoint',2],['hpPotion',2],['spPotion',2]])act({type:'adventurePurchase',product,quantity});
 act({type:'adventureInvestBatch',allocations:{momo:{strength:1}}});act({type:'adventureSkillInvestBatch',allocations:{momo:{charge:1}}});
 assert.equal(s.files['adventure/profile.json'].points,0);assert.equal(s.files['adventure/profile.json'].skillPoints,0);assert.equal(s.files['adventure/profile.json'].stats.momo.strength,1);assert.equal(s.files['adventure/profile.json'].skills.momo.charge,2);
 act({type:'adventurePotion',pet:'momo',potion:'hp'});act({type:'adventurePotion',pet:'kuki',potion:'stamina'});
 assert.equal(s.files['adventure/profile.json'].hpPotions,1);assert.equal(s.files['adventure/profile.json'].staminaPotions,1);assert.equal(s.files['adventure/profile.json'].stardust,194);
 const history=s.open().history('clear','2026-11-11','2026-11-11');assert.deepEqual(history.entries.map(e=>e.mode).sort(),['defense','explore','offense']);
});
