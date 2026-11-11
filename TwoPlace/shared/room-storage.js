// Storage schema 2: current state and append-only history have separate documents.
import {initialPetHome,petSnapshot,CATALOG,changePetHome,remodelPetHome} from '../server/pets.js';
import {memberState} from './room-state.js';
import {calendarRewards} from './calendar-rewards.js';
const STORAGE_DAY=86400000;
const storageClone=value=>JSON.parse(JSON.stringify(value));
function storageError(message,status=400){throw Object.assign(new Error(message),{status});}
export function historyPeriod(kind,at){
 if(!['heart','clear'].includes(kind)||!Number.isFinite(at))storageError('이력 날짜를 확인해 주세요.');
 const day=new Date(at+9*3600000).toISOString().slice(0,10),[year,month,d]=day.split('-');
 const start=String(1+Math.floor((Number(d)-1)/3)*3).padStart(2,'0');
 return `${kind==='heart'?'heart-history':'game-history'}/${year}/${month}/${kind}_${year}_${month}_${start}.json`;
}
export function historyFiles(kind,start,end){
 const valid=d=>typeof d==='string'&&/^\d{4}-\d{2}-\d{2}$/.test(d)&&Number.isFinite(Date.parse(d))&&new Date(d).toISOString().slice(0,10)===d;
 if(!valid(start)||!valid(end)||end<start||Date.parse(end)-Date.parse(start)>30*STORAGE_DAY)storageError('조회 기간은 최대 31일로 선택해 주세요.');
 const paths=new Set();
 for(let at=Date.parse(start)-9*3600000;at<=Date.parse(end)-9*3600000;at+=STORAGE_DAY)paths.add(historyPeriod(kind,at));
 return [...paths];
}
function compactClear(row){
 const copy=storageClone(row);
 if(copy.reward){delete copy.reward.segments;delete copy.reward.index;if(copy.reward.tier)copy.reward.tier={id:copy.reward.tier.id};}
 return copy;
}
function yearRewards(rewards,year){
 const r=rewards||{};
 return {registration:Object.fromEntries(Object.entries(r.registration||{}).filter(([day])=>day.startsWith(year+'-'))),reads:Object.fromEntries(Object.entries(r.reads||{}).filter(([day])=>day.startsWith(year+'-'))),seen:(r.seen||[]).filter(key=>key.split(':')[1]?.startsWith(year+'-')),backfilled:true};
}
function joinRewards(calendars){
 const rewards={registration:{},reads:{},seen:[],backfilled:true};
 for(const calendar of calendars){Object.assign(rewards.registration,calendar.rewards?.registration);Object.assign(rewards.reads,calendar.rewards?.reads);rewards.seen.push(...(calendar.rewards?.seen||[]));}
 return rewards;
}
export function partitionLegacyRoom(input,now=Date.now()){
 const room=storageClone(input),home=room.petHome||initialPetHome(now),documents={};
 const years=new Set((room.state.events||[]).map(e=>e.date.slice(0,4)));
 for(const day of [...Object.keys(home.calendarRewards?.registration||{}),...Object.keys(home.calendarRewards?.reads||{})])years.add(day.slice(0,4));
 for(const key of home.calendarRewards?.seen||[])if(/^\d{4}-/.test(key.split(':')[1]||''))years.add(key.split(':')[1].slice(0,4));
 for(const year of years)documents[`calendar/calendar_${year}.json`]={events:room.state.events.filter(e=>e.date.startsWith(year+'-')),rewards:yearRewards(home.calendarRewards,year)};
 documents['notes/notes.json']={notes:room.state.notes||[]};
 documents['housing/layout.json']={items:home.items||[],layoutVersion:home.layoutVersion,remodel:home.remodel};
 const adventure=storageClone(home.adventure||{}),clears=adventure.history||[];delete adventure.history;
 if(clears.length)adventure.bestDurationMs=Math.min(...clears.map(e=>e.durationMs));
 documents['adventure/profile.json']=adventure;
 const hearts=home.heartHistory||[];
 for(const [kind,rows] of [['heart',hearts],['clear',clears]])for(const row of rows){const name=historyPeriod(kind,row.at);if(!documents[name])documents[name]={schemaVersion:1,kind,timezone:'Asia/Seoul',entries:[]};documents[name].entries.push(kind==='clear'?compactClear(row):row);}
 delete home.items;delete home.layoutVersion;delete home.remodel;delete home.adventure;delete home.calendarRewards;delete home.heartHistory;
 documents['wallet/current.json']=home;
 room.schemaVersion=2;room.storageVersion=2;room.state={startDate:room.state.startDate,characters:room.state.characters||{}};delete room.petHome;
 room.content={calendarYears:[...years].sort(),eventCount:input.state.events.length,noteCount:input.state.notes.length,heartSince:hearts.length?Math.min(...hearts.map(e=>e.at)):null,clearSince:clears.length?Math.min(...clears.map(e=>e.at)):null};
 documents['room.json']=room;
 return documents;
}

// read(relative) and commit(changes) are synchronous and bound to one room.
// commit must publish the room and changed documents atomically.
export function createRoomDocuments(core,{read,commit,now=()=>Date.now(),idFactory}){
 core=storageClone(core);
 const loaded=new Map(),original=new Map();
 function load(name,fallback){
  if(!loaded.has(name)){const data=read(name);if(data===null&&fallback===undefined)storageError('저장 파일을 찾지 못했어요. 다시 불러와 주세요.',503);const value=data===null?storageClone(fallback):data;loaded.set(name,value);original.set(name,JSON.stringify(value));}
  return loaded.get(name);
 }
 let wallet=load('wallet/current.json');
 const sections={calendarYears:[],notes:false,housing:false,adventure:false};
 let state={...core.state,events:[],notes:[]},home={...wallet,items:[]};
 function calendar(years){
  if(!Array.isArray(years)||years.length>30)storageError('불러올 연도를 확인해 주세요.');
  for(const year of years){if(!/^\d{4}$/.test(String(year)))storageError('캘린더 연도를 확인해 주세요.');if(!sections.calendarYears.includes(String(year))){const name=`calendar/calendar_${year}.json`,value=load(name,core.content.calendarYears.includes(String(year))?undefined:{events:[],rewards:yearRewards({},String(year))});state.events.push(...value.events);sections.calendarYears.push(String(year));}}
  home.calendarRewards=joinRewards(sections.calendarYears.map(year=>load(`calendar/calendar_${year}.json`)));
 }
 function content(section,years=[]){
  if(section==='calendar')calendar(years);
  else if(section==='notes'){state.notes=load('notes/notes.json').notes;sections.notes=true;}
  else if(section==='housing'){const layout=load('housing/layout.json');Object.assign(home,layout);sections.housing=true;const remodeled=remodelPetHome(home);if(remodeled!==home){home=remodeled;save();}}
  else if(section==='adventure'){home.adventure={...load('adventure/profile.json'),history:[]};sections.adventure=true;}
  else storageError('불러올 항목을 확인해 주세요.');
 }
 function history(kind,start,end){
  const rows=historyFiles(kind,start,end).flatMap(file=>load(file,{entries:[]}).entries).filter(row=>{const day=new Date(row.at+9*3600000).toISOString().slice(0,10);return day>=start&&day<=end;});
  return {entries:rows.sort((a,b)=>b.at-a.at),start,end,since:core.content[kind==='heart'?'heartSince':'clearSince']};
 }
 function snapshot(role){
  const dataState={...core.state};if(sections.calendarYears.length)dataState.events=state.events;if(sections.notes)dataState.notes=state.notes;
  const safeHome=petSnapshot(home,now());if(!sections.housing)delete safeHome.items;
  delete safeHome.heartHistory;if(safeHome.adventure)delete safeHome.adventure.history;
  return {storageVersion:2,code:core.code,role,recoveryEnabled:!!core.recovery,memberCount:core.members.length,revision:core.revision,state:dataState,petHome:safeHome,catalog:CATALOG,sections:storageClone(sections),content:core.content};
 }
 function save(){
  for(const [kind,rows] of [['heart',home.heartHistory||[]],['clear',home.adventure?.history||[]]])for(const row of rows){const file=historyPeriod(kind,row.at),archive=load(file,{schemaVersion:1,kind,timezone:'Asia/Seoul',entries:[]});archive.entries.push(kind==='clear'?compactClear(row):row);const key=kind==='heart'?'heartSince':'clearSince';core.content[key]=core.content[key]===null?row.at:Math.min(core.content[key],row.at);}
  if(sections.housing)loaded.set('housing/layout.json',{items:home.items,layoutVersion:home.layoutVersion,...(home.remodel?{remodel:home.remodel}:{})});
  if(sections.notes){loaded.set('notes/notes.json',{notes:state.notes});core.content.noteCount=state.notes.length;}
  if(sections.calendarYears.length){
   for(const year of sections.calendarYears){const name=`calendar/calendar_${year}.json`,old=load(name),events=state.events.filter(e=>e.date.startsWith(year+'-'));core.content.eventCount+=events.length-old.events.length;loaded.set(name,{events,rewards:yearRewards(home.calendarRewards,year)});}
   core.content.calendarYears=[...new Set([...core.content.calendarYears,...sections.calendarYears])].sort();
  }
  if(sections.adventure){const adventure={...home.adventure};for(const row of adventure.history||[])adventure.bestDurationMs=Math.min(adventure.bestDurationMs??Infinity,row.durationMs);delete adventure.history;loaded.set('adventure/profile.json',adventure);home.adventure={...adventure,history:[]};}
  wallet={...home};for(const key of ['items','layoutVersion','remodel','adventure','calendarRewards','heartHistory'])delete wallet[key];loaded.set('wallet/current.json',wallet);delete home.heartHistory;
  core.state={startDate:state.startDate,characters:state.characters||{}};core.updatedAt=now();
  const changes={'room.json':core};for(const [file,data] of loaded)if(JSON.stringify(data)!==original.get(file))changes[file]=data;
  commit(changes);
  for(const [file,data] of loaded)original.set(file,JSON.stringify(data));
 }
 function updateState(body,role){
  if(body.revision!==core.revision)storageError('상대가 먼저 수정했어요. 최신 내용을 확인해 주세요.',409);
  const scope=body.scope||'all',years=body.years||core.content.calendarYears;
  if(!['all','profile','calendar','notes'].includes(scope))storageError('저장할 항목을 확인해 주세요.');
  if(scope==='all'||scope==='calendar')calendar(years);
  if(scope==='all'||scope==='notes')content('notes');
  const submitted=body.state||{};
  if(scope==='calendar'&&(!Array.isArray(submitted.events)||submitted.events.some(e=>!years.map(String).includes(e?.date?.slice(0,4)))))storageError('불러오지 않은 연도의 일정은 저장할 수 없어요.');
  const candidate={...state,...(scope==='all'?submitted:scope==='calendar'?{events:submitted.events}:scope==='notes'?{notes:submitted.notes}:{startDate:submitted.startDate,characters:submitted.characters})};
  const next=memberState(state,candidate,role);
  if(scope==='all'||scope==='calendar')home=calendarRewards(home,state,next,now(),{actor:{role,character:state.characters?.[role]}});
  state=next;core.revision++;save();
 }
 function readCalendar(body,role){calendar([String(body.year||body.date?.slice(0,4)||'')]);home=calendarRewards(home,state,state,now(),{readRole:role,eventId:body.eventId,actor:{role,character:state.characters?.[role]}});save();}
 function petAction(body,role){
  // Care/claims need only the wallet; furniture needs layout, games need profile.
  if(body.type?.startsWith('adventure'))content('adventure');
  else if(['buy','place','store','applyFloor','placeWall','placeOnTable'].includes(body.type))content('housing');
  home=changePetHome(home,body,now(),idFactory,{role,character:state.characters?.[role]});save();
 }
 return {content,history,snapshot,updateState,readCalendar,petAction,save};
}
