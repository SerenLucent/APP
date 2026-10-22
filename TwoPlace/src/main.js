import './style.css';
import './room.css';
import './calendar.css';
import { eventLabel, eventsOn, categoryNames, eventKinds } from './calendar-model.js';
import { petPage, mountPets, stopPets } from './pet-view.js';
import { dateKey, togetherDays } from './model.js';
import { loadSession, storeSession, clearSession, request, pendingRequest, finishRequest, pollInterval, demoMode, resetDemo } from './room-client.js';

import './menu-theme.css';
import {mountEventEditor} from './calendar-form.js';

const icons = {
  heart: '<path d="M20.8 4.6a5.5 5.5 0 0 0-7.8 0L12 5.7l-1.1-1.1a5.5 5.5 0 0 0-7.8 7.8L12 21l8.8-8.6a5.5 5.5 0 0 0 0-7.8Z"/>',
  calendar: '<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M16 3v4M8 3v4M3 11h18M8 15h2M14 15h2"/>',
  note: '<path d="M14 3H6a3 3 0 0 0-3 3v12a3 3 0 0 0 3 3h12a3 3 0 0 0 3-3v-8M14 3v7h7M14 3l7 7M7 14h10M7 17h6"/>',
  pin: '<path d="M20 10c0 6-8 12-8 12S4 16 4 10a8 8 0 1 1 16 0Z"/><circle cx="12" cy="10" r="3"/>',
  plus: '<path d="M12 5v14M5 12h14"/>',
  arrow: '<path d="m9 5 7 7-7 7"/>',
  home: '<path d="m3 10 9-7 9 7v10a1 1 0 0 1-1 1h-5v-7H9v7H4a1 1 0 0 1-1-1Z"/>',
  back: '<path d="m14 5-7 7 7 7"/>',
};
const icon = (name, cls = '') => `<svg class="icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${icons[name] || icons.heart}</svg>`;
const esc = value => String(value).replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const app = document.querySelector('#app');
const newId = () => Array.from(crypto.getRandomValues(new Uint8Array(16)), b => b.toString(16).padStart(2,'0')).join('');
const modal = document.querySelector('#modal');
let state = {startDate:null, events:[], notes:[]};
let petHome = null;
let petCatalog = [];
let session = loadSession();
let room = null;
let booting = Boolean(session);
let bootError = '';
let saving = false;
let refreshing = false;
let connected = true;
let view = demoMode ? (new URLSearchParams(location.search).get('view') === 'home' ? 'home' : 'calendar') : 'home';
let month = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
let selected = dateKey();
let timer;
let launchTimer;
const launchStarted=performance.now();
function finishLaunch(){
  const screen=document.querySelector('#launch-screen');
  if(!screen||booting||launchTimer)return;
  launchTimer=setTimeout(()=>{screen.classList.add('is-done');setTimeout(()=>screen.remove(),320);},Math.max(0,900-(performance.now()-launchStarted)));
}
function toast(message) {
  document.querySelector('#toast').textContent = message;
  document.querySelector('#toast').classList.add('visible');
  clearTimeout(timer);
  timer = setTimeout(() => document.querySelector('#toast').classList.remove('visible'), 3000);
}
function applyRoom(data) {
  if (data.petHome && (!petHome || data.code !== room?.code || data.petHome.version >= petHome.version)) {
    petHome = data.petHome;
    petCatalog = data.catalog || [];
  }
  if (room?.code === data.code && data.revision < room.revision) return;
  room = {code:data.code, role:data.role, recoveryEnabled:data.recoveryEnabled, memberCount:data.memberCount, revision:data.revision};
  state = data.state;
  connected = true;
}
async function save(next) {
  if (!room || saving) return false;
  saving = true;
  try {
    applyRoom(await request('/room/state', {token:session.token, method:'PUT',body:{state:next,revision:room.revision}}));
    return true;
  } catch(error) {
    if (error.status === 409) {
      try { applyRoom(await request('/room',{token:session.token})); render(); } catch { connected = false; }
    }
    toast(error.message);
    return false;
  } finally { saving = false; }
}
async function restoreRoom() {
  if (!session) return;
  booting = true; bootError = ''; render();
  try { applyRoom(await request('/room',{token:session.token})); }
  catch(error) {
    if (error.status === 401) { clearSession(); session = null; }
    else bootError = error.message;
  } finally { booting = false; render(); }
}
async function refreshRoom() {
  if (!session || !room || saving || refreshing || modal.open || document.hidden) return;
  refreshing = true;
  try {
    const data = await request('/room',{token:session.token});
    const changed = data.recoveryEnabled !== room.recoveryEnabled || data.revision !== room.revision || data.memberCount !== room.memberCount || data.petHome?.version !== petHome?.version || data.petHome?.claimable !== petHome?.claimable || data.petHome?.pets.mochi.hunger !== petHome?.pets.mochi.hunger || data.petHome?.pets.kuki.hunger !== petHome?.pets.kuki.hunger || !connected;
    applyRoom(data);
    if (changed && view !== 'places') render();
  } catch(error) {
    if (error.status === 401) { clearSession(); session = null; room = null; render(); toast(error.message); }
    else if (connected) { connected = false; render(); }
  } finally { refreshing = false; }
}
async function enterRoom(kind, code, button, password) {
  if (button.disabled) return;
  button.disabled = true;
  const original = button.textContent;
  button.textContent = kind === 'create' ? '방을 만드는 중…' : '입장하는 중…';
  try {
    // Verify storage before consuming one of the room's two membership slots.
    const probe = 'twoplace:storage-check'; localStorage.setItem(probe,'1'); localStorage.removeItem(probe);
    const requestToken = pendingRequest(kind,code);
    const data = await request(kind === 'create' ? '/rooms' : '/rooms/join',{method:'POST',body:kind === 'create' ? {requestToken,password} : {code,requestToken}});
    storeSession(data);
    finishRequest();
    session = {token:data.token}; applyRoom(data); view = 'home'; bootError = '';
    if (modal.open) modal.close();
    render(); toast(kind === 'create' ? '커플방을 만들었어요. 방 코드를 상대에게 알려 주세요.' : '같은 커플방에 입장했어요');
  } catch(error) {
    const message = error.name === 'QuotaExceededError' || error.name === 'SecurityError' ? '입장 정보를 저장할 수 없어요. 브라우저 저장 공간을 확인해 주세요.' : error.message;
    const errorBox = modal.open && modal.querySelector('[role="alert"]');
    if (errorBox) errorBox.textContent = message; else toast(message);
  } finally { button.disabled = false; button.textContent = original; }
}
function joinDialog() {
  openDialog('커플방 입장하기', '<p class="muted">상대가 만든 방 코드번호를 입력해 주세요.</p><form><label for="room-code">방 코드번호</label><input id="room-code" name="code" inputmode="numeric" autocomplete="off" placeholder="1234 5678 9012" maxlength="14" pattern="[0-9\\s-]{12,14}" required><p class="form-error" role="alert"></p><button class="primary" type="submit">커플방 입장하기</button></form>');
  modal.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const code = new FormData(e.target).get('code').replace(/[\s-]/g,'');
    if (!/^\d{12}$/.test(code)) { modal.querySelector('[role="alert"]').textContent = '숫자 12자리를 입력해 주세요.'; return; }
    await enterRoom('join',code,e.target.querySelector('button[type="submit"]'));
  };
}
function createDialog(){
  openDialog('커플 등록하기','<p class="muted">두 사람 모두 연결을 잃어도 방 코드와 이 암호로 돌아올 수 있어요. 두 사람이 함께 보관해 주세요.</p><form><label>복구 암호<input name="password" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><label>암호 확인<input name="confirm" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><p class="muted">8자 이상 · 시작일만 쓰기보다 둘만 아는 문구를 추천해요.</p><p class="form-error" role="alert"></p><button class="primary" type="submit">방 만들기</button></form>');
  modal.querySelector('form').onsubmit=async e=>{e.preventDefault();const f=e.target;if(f.elements.password.value!==f.elements.confirm.value){f.querySelector('[role="alert"]').textContent='암호가 서로 달라요.';return;}await enterRoom('create',null,f.querySelector('button[type="submit"]'),f.elements.password.value);};
}
function recoveryDialog(settings=false){
  const changing=settings&&room.recoveryEnabled;
  openDialog(settings?'복구 암호 설정':'연결 복구하기',`<p class="muted">${settings?'방은 접속하지 않아도 폐기되지 않아요. 방 코드와 복구 암호를 두 사람이 함께 보관해 주세요.':'기존 일정·메모·펫은 그대로 두고 내 연결만 새 기기로 옮겨요. 이전 기기의 내 연결은 해제되며 상대방은 유지돼요.'}</p><form>${settings?'':`<label>방 코드<input name="code" inputmode="numeric" maxlength="14" required></label><label>내 자리<select name="role"><option value="owner">처음 방을 만든 사람</option><option value="partner">초대받아 입장한 사람</option></select></label>`}${changing?'<label>현재 복구 암호<input name="currentPassword" type="password" autocomplete="current-password" required></label>':''}<label>${settings?'새 복구 암호':'복구 암호'}<input name="password" type="password" minlength="8" maxlength="128" autocomplete="${settings?'new-password':'current-password'}" required></label>${settings?'<label>새 암호 확인<input name="confirm" type="password" minlength="8" maxlength="128" autocomplete="new-password" required></label><p class="muted">8자 이상 · 시작일만 쓰기보다 둘만 아는 문구를 추천해요.</p>':''}<p class="form-error" role="alert"></p><button class="primary" type="submit">${settings?'암호 저장하기':'내 연결 복구하기'}</button></form>`);
  modal.querySelector('form').onsubmit=async e=>{
    e.preventDefault();const f=e.target,b=f.querySelector('button[type="submit"]');
    if(settings&&f.elements.password.value!==f.elements.confirm.value){f.querySelector('[role="alert"]').textContent='암호가 서로 달라요.';return;}
    b.disabled=true;
    try{
      let data;
      if(settings)data=await request('/room/recovery',{method:'PUT',token:session.token,body:{password:f.elements.password.value,currentPassword:f.elements.currentPassword?.value}});
      else{
        const probe='twoplace:storage-check';localStorage.setItem(probe,'1');localStorage.removeItem(probe);
        const code=f.elements.code.value.replace(/[\s-]/g,''),role=f.elements.role.value;
        const requestToken=pendingRequest('recover:'+role,code);
        data=await request('/rooms/recover',{method:'POST',body:{code,role,password:f.elements.password.value,requestToken}});
        storeSession(data);session=loadSession();finishRequest();
      }
      applyRoom(data);modal.close();view='home';render();toast(settings?'복구 암호를 저장했어요. 상대에게도 알려 주세요.':'기존 커플방 연결을 복구했어요');
    }catch(error){f.querySelector('[role="alert"]').textContent=error.message;}
    finally{b.disabled=false;}
  };
}
async function copyCode() {
  if (!room) return;
  try { await navigator.clipboard.writeText(room.code); toast('방 코드를 복사했어요'); }
  catch {
    openDialog('방 코드 복사하기', `<p class="muted">코드를 길게 눌러 복사한 뒤 상대에게 알려 주세요.</p><input aria-label="복사할 방 코드" readonly value="${room.code}">`);
    modal.querySelector('input').select();
  }
}
function welcome() {
  if (booting) return '<section class="welcome"><span class="welcome-heart">♡</span><h1>우리 공간을 여는 중…</h1><p>잠시만 기다려 주세요.</p></section>';
  if (bootError) return `<section class="welcome"><span class="welcome-heart">♡</span><h1>우리 방에 연결하지 못했어요</h1><p role="alert">${esc(bootError)}</p><button class="primary" data-action="retry">다시 연결하기</button></section>`;
  return `<section class="welcome"><span class="eyebrow">TWO OF US, ONE PLACE</span><div class="welcome-mascots"><img src="${import.meta.env.BASE_URL}pets/mochi-standing-v2.png" alt="모모" width="128" height="128"><img src="${import.meta.env.BASE_URL}pets/kuki-standing-v2.png" alt="쿠키" width="128" height="128"><span aria-hidden="true">♡</span></div><h1>우리 둘만의 공간을<br>시작해 볼까요<span class="accent">?</span></h1><p>한 사람이 커플방을 만들고,<br>다른 한 사람이 방 코드로 입장하면 돼요.</p><div class="welcome-actions"><button class="primary" data-action="create">커플 등록하기</button><span aria-hidden="true">|</span><button class="secondary" data-action="join">커플방 입장하기</button></div><button class="text-button recovery-entry" data-action="recover">연결 복구하기</button><a class="demo-link" href="${import.meta.env.BASE_URL}demo.html">커플 등록 없이 모의 테스트</a><span class="welcome-hint">우리의 하루와 약속, 이제 같은 공간에.</span></section>`;
}
function openDialog(title, body) {
  modal.innerHTML = `<div class="dialog-head"><h2>${title}</h2><button class="close" type="button" aria-label="닫기">×</button></div>${body}`;
  modal.querySelector('.close').onclick = () => modal.close();
  if (!modal.open) modal.showModal();
}
function dateDialog() {
  openDialog('우리의 시작일', `<p class="muted">처음 만난 날을 1일로 함께 세어 볼게요.</p><form id="date-form"><label for="start">처음 만난 날</label><input id="start" name="date" type="date" max="${dateKey()}" value="${state.startDate || ''}" required><button class="primary" type="submit">${state.startDate ? '변경하기' : '디데이 시작하기'}</button></form>`);
  modal.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const startDate = new FormData(e.target).get('date');
    if (startDate > dateKey()) return;
    if (await save({...state, startDate})) { modal.close(); render(); toast('우리의 시작일을 저장했어요'); }
  };
}
function home() {
  const todayLabel = new Intl.DateTimeFormat('ko-KR', {month:'long', day:'numeric', weekday:'long'}).format(new Date());
  return `<div class="recovery-tools"><span>${room.recoveryEnabled ? '복구 암호가 설정되어 있어요' : '휴대폰을 바꾸기 전에 복구 암호를 설정해 주세요'}</span><button class="text-button" data-action="recovery-settings">${room.recoveryEnabled ? '복구 암호 변경' : '복구 암호 설정'}</button></div><section class="greeting"><span class="eyebrow">A LITTLE SPACE FOR TWO</span><h1>우리 둘의 하루가<br>모이는 곳<span class="accent">.</span></h1><p>사소한 순간도, 함께라서 특별하니까.</p></section>
  <section class="spaces"><div class="section-head"><div><span class="eyebrow">OUR SPACE</span><h2>둘이 함께 쓰는 공간</h2></div><span class="little-heart">♡</span></div><div class="menu-grid">
  <button class="menu-card calendar-card" data-view="calendar"><span class="tile-icon">${icon('calendar')}</span><span class="card-title">공유 캘린더</span><span class="card-desc">우리의 다음 약속</span><span class="card-bottom">${state.events.length ? `저장한 일정 ${state.events.length}개` : '함께할 하루를 기록해요'} ${icon('arrow')}</span></button>
  <button class="menu-card note-card" data-view="notes"><span class="tile-icon">${icon('note')}</span><span class="card-title">커플 메모장</span><span class="card-desc">잊지 않고 싶은 이야기</span><span class="card-bottom">${state.notes.length ? `쌓인 이야기 ${state.notes.length}개` : '둘만의 생각을 담아요'} ${icon('arrow')}</span></button>
  <button class="menu-card place-card" data-action="place"><span class="tile-icon">${icon('pin')}</span><span class="card-title">플레이스 메이트</span><span class="card-desc">둘만의 맛집 지도</span><span class="card-bottom"><span class="badge">둘만의 공유 플레이스</span> ${icon('arrow')}</span></button>
  <button class="menu-card pet-menu-card" data-view="pets"><span class="tile-icon">${icon('heart')}</span><span class="card-title">펫 키우기</span><span class="card-desc">모모와 쿠키, 둘이 함께 돌봐요</span><span class="card-bottom">우리만의 집 꾸미기 ${icon('arrow')}</span></button>
  </div></section><aside class="today"><span class="today-flower">✳</span><div><span>${todayLabel}</span><p>오늘도 서로의 가장 가까운 편이 되어 주세요.</p></div></aside>`;
}
function eventDot(event){
  const character=state.characters?.[event.authorRole],name=character==='momo'?'모모':character==='kuki'?'쿠키':'작성자 미설정';
  return `<span class="author-dot author-${character||'unknown'}" role="img" aria-label="${name}" title="${name}"></span>`;
}
function characterDialog(){
  const current=state.characters?.[room.role];
  openDialog('내 캐릭터',`<p class="muted">일정 앞의 점이 내 캐릭터 색으로 표시돼요.</p><div class="character-options">${[['momo','모모','기본 여성 · 연핑크','mochi-standing-v2.png'],['kuki','쿠키','기본 남성 · 연파랑','kuki-standing-v2.png']].map(([id,name,hint,image])=>`<button class="character-choice ${current===id?'selected':''}" data-choose-character="${id}" aria-pressed="${current===id}"><img src="${import.meta.env.BASE_URL}pets/${image}" alt="${name}"><strong>${name}</strong><small>${hint}</small></button>`).join('')}</div>`);
  modal.querySelectorAll('[data-choose-character]').forEach(button=>button.onclick=async()=>{
    button.disabled=true;
    if(await save({...state,characters:{...state.characters,[room.role]:button.dataset.chooseCharacter}})){modal.close();render();toast('내 캐릭터를 설정했어요');}
    button.disabled=false;
  });
}
function calendar() {
  const year = month.getFullYear(), m = month.getMonth();
  const offset = new Date(year, m, 1).getDay();
  const count = new Date(year, m + 1, 0).getDate();
  const days = Array.from({length: offset}, () => '<span class="blank-day" aria-hidden="true"></span>');
  for (let d = 1; d <= count; d++) {
    const key = dateKey(new Date(year, m, d));
    const events = eventsOn(state.events,key);
    days.push(`<button class="day ${key === selected ? 'selected' : ''} ${key === dateKey() ? 'is-today' : ''}" data-date="${key}" aria-label="${key} ${esc(events.length ? events.map(eventLabel).join(', ') : '일정 없음')}" ${key === dateKey() ? 'aria-current="date"' : ''}><span class="day-number">${d}</span><span class="day-labels">${events.slice(0,3).map(event => `<span class="event-chip kind-${eventKinds.includes(event.kind) ? event.kind : 'general'}">${eventDot(event)}${esc(eventLabel(event))}</span>`).join('')}${events.length > 3 ? `<span class="more-events">+${events.length - 3}개</span>` : ''}</span></button>`);
  }
  while (days.length % 7) days.push('<span class="blank-day" aria-hidden="true"></span>');
  const events = eventsOn(state.events,selected);
  return `<section class="page-heading calendar-heading"><h1>공유 캘린더</h1><p>퇴근과 휴무, 둘이 함께할 약속까지.</p></section><div class="calendar-legend"><span><i class="legend-dot kind-work"></i>일 · 퇴근 / 휴무</span><span><i class="legend-dot kind-trip"></i>여행</span><span><i class="legend-dot kind-date"></i>데이트</span></div><section class="calendar-panel"><div class="month-head"><button data-month="-1" aria-label="이전 달">‹</button><h2>${year}년 ${m + 1}월</h2><button data-month="1" aria-label="다음 달">›</button></div><div class="week">${['일','월','화','수','목','금','토'].map(w => `<span>${w}</span>`).join('')}</div><div class="days">${days.join('')}</div></section><p class="calendar-tip">날짜를 누르면 그날의 일정과 상세 내용을 볼 수 있어요.</p><div class="section-head"><h2>${selected.replaceAll('-', '. ')} 일정</h2><button class="text-button" data-action="event">+ 일정 추가</button></div><div class="entries">${events.length ? events.map(event => `<article class="entry"><button class="event-summary-button" data-detail-event="${esc(event.id)}"><h3>${eventDot(event)}${esc(eventLabel(event))}</h3><p>${esc(categoryNames[event.kind] || '일반')}${event.place ? ` · ${esc(event.place)}` : ''}</p><span class="detail-link">상세보기 ↗</span></button></article>`).join('') : '<div class="empty">아직 약속이 없는 날이에요.<br>우리의 다음 약속을 남겨 볼까요?</div>'}</div>`;
}
function dayDialog() {
  const events = eventsOn(state.events,selected);
  openDialog(`${selected.replaceAll('-', '. ')} 일정`, `<div class="day-events">${events.length ? events.map(event => `<button class="day-event" data-detail-event="${esc(event.id)}"><span class="day-event-copy"><strong>${eventDot(event)}${esc(eventLabel(event))}</strong><small>${esc(categoryNames[event.kind] || '일반')}${event.place ? ` · ${esc(event.place)}` : ''}</small></span><span class="detail-link">상세보기 ↗</span></button>`).join('') : '<p class="muted">아직 등록한 일정이 없어요.</p>'}</div><button class="primary" data-action="event">+ 이 날짜에 일정 추가</button>`);
}
function eventDetail(id) {
  const event=state.events.find(e=>e.id===id);if(!event)return toast('이 일정은 더 이상 존재하지 않아요.');
  const work=event.kind==='work',start=event.startTime||(!work?event.time:''),end=event.endTime||(work?event.time:'');
  openDialog(esc(eventLabel(event)),`<button class="dialog-back" data-action="day-list">‹ 그날의 일정으로</button><div class="event-detail-body"><dl><dt>날짜</dt><dd>${esc(event.date.replaceAll('-', '. '))}</dd><dt>작성</dt><dd>${eventDot(event)}${state.characters?.[event.authorRole]==='momo'?'모모':state.characters?.[event.authorRole]==='kuki'?'쿠키':'캐릭터 미설정'}</dd><dt>분류</dt><dd>${esc(categoryNames[event.kind]||'일반')}${work?` · ${event.workType==='off'?'휴무':'근무'}`:''}</dd>${start?`<dt>${work?'출근':'시작'}</dt><dd>${esc(start)}</dd>`:''}${end?`<dt>${work?'퇴근':'종료'}</dt><dd>${esc(end)}</dd>`:''}${event.place?`<dt>갈 곳</dt><dd>${esc(event.place)}</dd>`:''}<dt>계획</dt><dd>${esc(event.details||'아직 적어 둔 내용이 없어요.')}</dd></dl></div><div class="event-detail-actions"><button data-edit-event="${esc(event.id)}">수정하기</button><button class="danger" data-delete-event="${esc(event.id)}">삭제하기</button></div>`);
}

function eventDialog(id) {
  const existing=state.events.find(e=>e.id===id);
  mountEventEditor({modal,openDialog,event:existing,selected,role:room.role,newId,
    onSave:entries=>save({...state,events:[...state.events.filter(e=>e.id!==existing?.id),...entries]}),
    onDone:entries=>{selected=entries[0].date;const [y,m]=selected.split('-').map(Number);month=new Date(y,m-1,1);render();dayDialog();toast(demoMode?'모의 일정을 현재 탭에 저장했어요.':'일정을 저장했어요. 둘이 함께 볼 수 있어요.');}
  });
}

function notes() {
  return `<section class="page-heading"><span class="eyebrow">LITTLE NOTES, BIG LOVE</span><h1>커플 메모장</h1><p>장보기 목록부터, 문득 전하고 싶은 마음까지.</p></section><button class="new-note" data-action="note">${icon('plus')} 새로운 메모 남기기</button><section class="notes-list">${state.notes.length ? state.notes.map(n => `<article class="note-paper"><span class="eyebrow">${esc(n.date || '')}</span><p>${esc(n.body)}</p><div class="note-actions"><button data-edit-note="${esc(n.id)}">수정</button><button data-delete-note="${esc(n.id)}">삭제</button></div></article>`).join('') : `<div class="empty">${icon('note')}<h2>첫 번째 이야기를 기다려요</h2><p>둘이 함께 기억하고 싶은 내용을 남겨 보세요.</p></div>`}</section>`;
}
function render() {
  stopPets();
  finishLaunch();
  if(room&&view==='places'){
    app.innerHTML=`<section class="place-frame-shell"><header class="place-frame-header"><button class="back" data-view="home">${icon('back')} 메인화면으로</button><strong>플레이스 메이트</strong><span>둘만의 공유 지도</span></header><iframe title="커플방 플레이스 메이트 공유 지도" src="${import.meta.env.BASE_URL}placemate/index.html" referrerpolicy="strict-origin-when-cross-origin"></iframe></section>`;
    return;
  }
  const header = room ? `<header class="room-header"><button class="header-dday" data-action="dday">${icon('heart')}<span><small>OUR DAYS</small>${state.startDate ? `<strong>함께한 지 ${togetherDays(state.startDate)}일</strong>` : '<strong>커플 디데이 설정하기</strong>'}</span></button><button class="room-code" data-action="copy" aria-label="방 코드 ${room.code} 복사하기"><small>${demoMode ? 'DEMO · 모의 테스트' : 'ROOM CODE · 복사하기'}</small><strong>${room.code.match(/.{4}/g).join(' ')} <span aria-hidden="true">⧉</span></strong></button></header><div class="room-status" role="status"><span>${demoMode ? '모의 커플방 · 실제 연결 없이 둘러보기' : connected ? (room.memberCount === 2 ? '♡ 둘이 함께 연결되었어요' : '♡ 상대를 기다리는 중 · 방 코드를 알려 주세요') : '서버 연결을 확인하고 있어요 · 변경 내용을 저장하려면 연결이 필요해요'}</span><button class="my-character" data-action="character">${state.characters?.[room.role]?`<span class="author-dot author-${state.characters[room.role]}"></span>내 캐릭터 · ${state.characters[room.role]==='momo'?'모모':'쿠키'}`:'내 캐릭터 설정'}</button></div>` : `<header><a class="brand" href="#" aria-label="TwoPlace 홈">${icon('heart')}<span>two<span class="brand-light">place</span><span class="brand-dot">.</span></span></a><span class="header-note">우리 둘의 작은 공간</span></header>`;
  app.innerHTML = `<div class="shell">${header}${demoMode ? '<aside class="demo-banner"><div><strong>모의 테스트 · 실제 커플방과 별개예요</strong>일정은 현재 탭에만 저장돼요. 자유롭게 추가·수정해 보세요.</div><button data-action="demo-reset">샘플 초기화</button></aside>' : ''}<main>${!room ? welcome() : view === 'home' ? home() : `<button class="back" data-view="home">${icon('back')} 메인화면으로</button>${view === 'calendar' ? calendar() : view === 'pets' ? petPage(petHome,petCatalog) : notes()}`}</main><footer><span>MADE OF OUR LITTLE MOMENTS</span><span>two of us, one place.</span></footer></div>${room ? `<nav class="bottom-nav" aria-label="주 메뉴">${[['home','home','우리 공간'],['calendar','calendar','캘린더'],['notes','note','메모장'],['pets','heart','펫 키우기']].map(([v,i,t]) => `<button data-view="${v}" class="${view === v ? 'active' : ''}" ${view === v ? 'aria-current="page"' : ''}>${icon(i)}<span>${t}</span></button>`).join('')}</nav>` : ''}`;
  if(room && view === 'pets' && petHome) mountPets({home:()=>petHome,render,toast,action:async action=>{
    if(saving) throw new Error('이전 동작이 끝나면 다시 시도해 주세요.');
    saving=true;
    try {
      applyRoom(await request('/room/pets',{token:session.token,method:'POST',body:{...action,version:petHome.version}}));
      render();
    } catch(error) {
      if(error.status===409){try {applyRoom(await request('/room',{token:session.token}));render();}catch{/* Keep the original conflict message. */}}
      throw error;
    } finally {saving=false;}
  }});
}
function noteDialog(id) {
  const existing = state.notes.find(n => n.id === id);
  openDialog(existing ? '메모 수정' : '우리의 새 메모', `<form><label for="body">기억하고 싶은 이야기</label><textarea id="body" name="body" rows="7" maxlength="5000" placeholder="다음 데이트에 하고 싶은 일은…" required>${esc(existing?.body || '')}</textarea><button class="primary" type="submit">메모 저장하기</button></form>`);
  modal.querySelector('form').onsubmit = async e => {
    e.preventDefault();
    const body = new FormData(e.target).get('body').trim();
    if (!body) return;
    const note = {id: existing?.id || newId(), date: dateKey(), body};
    const notes = existing ? state.notes.map(n => n.id === id ? note : n) : [note, ...state.notes];
    if (await save({...state, notes})) { modal.close(); render(); toast('메모를 저장했어요'); }
  };
}
document.addEventListener('click', async e => {
  const el = e.target.closest('button, .brand');
  if (!el) return;
  if (el.matches('.brand')) { e.preventDefault(); view = 'home'; render(); }
  if (el.dataset.view) { view = el.dataset.view; render(); window.scrollTo(0, 0); }
  if (el.dataset.month) { month = new Date(month.getFullYear(), month.getMonth() + Number(el.dataset.month), 1); render(); }
  if (el.dataset.date) { selected = el.dataset.date; render(); dayDialog(); }
  if (el.dataset.detailEvent) eventDetail(el.dataset.detailEvent);
  if (el.dataset.editEvent) eventDialog(el.dataset.editEvent);
  if (el.dataset.editNote) noteDialog(el.dataset.editNote);
  const deleteId = el.dataset.deleteNote || el.dataset.deleteEvent;
  if (deleteId) {
    const key = el.dataset.deleteNote ? 'notes' : 'events';
    openDialog('삭제할까요?', '<p class="muted">삭제한 내용은 되돌릴 수 없어요.</p><button class="primary" id="confirm-delete">삭제하기</button>');
    modal.querySelector('#confirm-delete').onclick = async () => { if (await save({...state, [key]: state[key].filter(item => item.id !== deleteId)})) { modal.close(); render(); } };
  }
  switch (el.dataset.action) {
    case 'create': createDialog(); break;
    case 'recover': recoveryDialog(); break;
    case 'recovery-settings': if(demoMode)toast('실제 방 연결을 바꾸지 않는 모의 테스트예요.');else recoveryDialog(true); break;
    case 'join': joinDialog(); break;
    case 'copy': if(demoMode)toast('모의 테스트용 방이에요. 실제 입장 코드는 없어요.');else await copyCode(); break;
    case 'demo-reset': if(demoMode){room=null;petHome=null;applyRoom(resetDemo());view='calendar';selected=dateKey();month=new Date(new Date().getFullYear(),new Date().getMonth(),1);modal.close();render();toast('샘플 일정을 다시 준비했어요');}break;
    case 'retry': await restoreRoom(); break;
    case 'dday': dateDialog(); break;
    case 'character': characterDialog();break;
    case 'note': noteDialog(); break;
    case 'place': view='places';render();break;
    case 'more': toast('앞으로 추가할 메뉴를 위한 자리예요'); break;
    case 'event': eventDialog(); break;
    case 'day-list': dayDialog(); break;
  }
});
window.addEventListener('storage', event => {
  if (!demoMode && event.key === 'twoplace:room-session:v1') { session = loadSession(); room = null; if (session) restoreRoom(); else render(); }
});
window.addEventListener('focus', refreshRoom);
window.addEventListener('message',async event=>{
  const frame=app.querySelector('.place-frame-shell iframe'),data=event.data;
  if(event.origin!==location.origin||!frame||event.source!==frame.contentWindow||data?.type!=='twoplace:places:request'||typeof data.id!=='string'||data.id.length>40||!['GET','PUT','SEARCH','CONFIG'].includes(data.method)||!session)return;
  const response={type:'twoplace:places:response',id:data.id};
  try{response.data=await request(data.method==='SEARCH'?'/room/places/search':data.method==='CONFIG'?'/room/places/map-config':'/room/places',{token:session.token,method:data.method==='SEARCH'?'POST':data.method==='CONFIG'?'GET':data.method,body:['PUT','SEARCH'].includes(data.method)?data.body:undefined});}
  catch(error){response.error={message:error.message,status:error.status||503};}
  if(frame.isConnected)event.source.postMessage(response,location.origin);
});
document.addEventListener('visibilitychange', refreshRoom);
setInterval(refreshRoom, pollInterval);
render();
if (session) restoreRoom();
