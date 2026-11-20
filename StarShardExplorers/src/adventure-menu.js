import {createMapEntryGate,adventureLoadReason} from './adventure-entry-gate.js';
import {mountTutorialPreference} from './adventure-tutorial.js';
import {confirmAdventureExit,installAdventureEntries} from './adventure-navigation.js';
import {mountSaveMenu} from './save-menu.js';
import {recommendedMapLevel,mapScaling,adventureLevel,minimumMapLevel,mapRewardFactor,ADVENTURE_COOLDOWNS} from '../shared/adventure-progression.js';
import {mountBattleShop} from './adventure-battle-shop.js';
import {createAdventureWallet} from './adventure-wallet.js';
import {DEFENSE_WAVES} from './adventure-defense.js';
import {mountAdventureStatMenu} from './adventure-stat-menu.js';
import {installAppTouchPolicy} from './app-touch.js';
installAppTouchPolicy();
import './adventure-menu.css';
const base=import.meta.env.BASE_URL,demo=new URLSearchParams(location.search).get('demo')==='1',root=document.querySelector('#mode-menu');
window.gameBack=()=>{const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return true;}confirmAdventureExit({fromMenu:true,leave:()=>location.replace(base+'index.html')});return true;};
root.innerHTML=`<header><button type="button" class="mode-stats-button" data-title-home>‹ 타이틀 화면으로</button><button type="button" class="mode-stats-button" data-battle-shop>전투상점</button><button type="button" class="mode-stats-button" data-adventure-stats>캐릭터 레벨업</button></header><section class="mode-intro"><div><p>오늘은 어디로 떠날까?</p><h1>별조각 탐험대</h1><span>모모의 회오리와 쿠키의 별꼬리로 도전해요.</span></div><div class="mode-pets"><img src="${base}pets/mochi-standing-v2.png" alt="모모"><img src="${base}pets/kuki-standing-v2.png" alt="쿠키"></div></section><div class="mode-list"><a class="mode-card explore" href="${base}adventure.html${demo?'?demo=1':''}"><span class="mode-number">01 · EXPLORE</span><h2>개척</h2><p>나무·바위·뭉치를 쓰러뜨려 개척 게이지를 채워요.</p><small>개척 100% · 나무 1% / 바위 2% / 뭉치 2%</small><b>개척 시작하기 →</b></a><a class="mode-card offense" href="${base}adventure.html?mode=offense${demo?'&demo=1':''}"><span class="mode-number">02 · OFFENSE</span><h2>원정</h2><p>사방에서 몰려오는 집 지킴이를 상대하며 산채 본체를 무너뜨려요.</p><small>산채 본체 파괴 · 룰렛 보상</small><b>원정 시작하기 →</b></a><a class="mode-card defense" href="${base}adventure.html?mode=defense${demo?'&demo=1':''}"><span class="mode-number">03 · DEFENSE</span><h2>방어</h2><p>모모와 쿠키를 교체하며 우리 집으로 몰려오는 방울이를 막아요.</p><small>우리 집 지키기 · ${DEFENSE_WAVES.length}차 공격 · 룰렛 보상</small><b>${demo?'방어 모의 테스트':'방어 시작하기'} →</b></a></div><aside><strong>모모와 쿠키, 함께 떠나는 모험</strong><p>플레이 기록과 성장은 개인별로 자동 저장돼요. 이메일을 연동하면 다른 기기에서도 이어할 수 있어요.</p></aside>`;

mountAdventureStatMenu(root.querySelector('[data-adventure-stats]'));

const battleWallet=createAdventureWallet();
const balance=document.createElement('p');
balance.className='mode-shard-balance';
balance.style.cssText='color:#ffe2a0;font-size:15px;margin:0';
const toolbar=document.createElement('div');toolbar.className='mode-resource-toolbar';toolbar.append(balance);mountTutorialPreference(toolbar,{compact:true});root.querySelector('.mode-intro').after(toolbar);
const entryGate=createMapEntryGate();let balanceRefresh=0,mapError=null;
const refreshBattleBalance=async()=>{
 const sequence=++balanceRefresh,ticket=entryGate.begin();mapError=null;renderRebuildTimers();balance.textContent='맵 레벨 조정중...';root.querySelector('.mode-list').setAttribute('aria-busy','true');
 try{await battleWallet.init();if(sequence!==balanceRefresh)return;updateLevelChoices();balance.innerHTML='<img class="mode-shard-icon" src="'+base+'adventure/star-shard-v1.png" alt=""><strong>'+battleWallet.profile.stardust.toLocaleString()+'</strong><span>별조각</span>';balance.setAttribute('aria-label',battleWallet.profile.stardust.toLocaleString()+' 별조각');entryGate.finish(ticket,true);balance.removeAttribute('role');balance.style.whiteSpace='';}
 catch(error){if(sequence===balanceRefresh){entryGate.finish(ticket,false);balance.setAttribute('role','alert');balance.style.whiteSpace='normal';balance.textContent=adventureLoadReason(error,'맵 갱신');mapError=error;}}
 finally{if(sequence===balanceRefresh){root.querySelector('.mode-list').setAttribute('aria-busy',String(entryGate.blocked));renderRebuildTimers();}}
};
mountBattleShop(root.querySelector('[data-battle-shop]'),{wallet:battleWallet,onChange:()=>{window.dispatchEvent(new Event('adventure-wallet-change'));}});

root.querySelector('.mode-list').insertAdjacentHTML('beforeend','<a class="mode-card mine" href="'+base+'adventure.html?mode=mine'+(demo?'&demo=1':'')+'"><span class="mode-number">04 · MINE</span><h2>별조각 광산</h2><p>동굴을 오가며 원석을 부수고 흩어진 별조각을 모아요.</p><small>3분 제한 · 무작위 원석 · 별조각만 획득</small><b>광산 들어가기 →</b></a>');

installAdventureEntries(root.querySelector('.mode-list'));
const homeLink=root.querySelector('[data-title-home]');homeLink.addEventListener('click',event=>{event.preventDefault();confirmAdventureExit({fromMenu:true,leave:()=>location.replace(base+'index.html')});});
const chosenLevels=new Map();
function updateLevelChoices(){
 const max=recommendedMapLevel(battleWallet.profile),previous=Number(balance.dataset.recommendedLevel||0),test=new URLSearchParams(location.search).get('mapTest')==='1';
 if(max>previous)chosenLevels.clear();
 for(const card of root.querySelectorAll('.mode-card')){
  const mode=['explore','offense','defense','mine'].find(id=>card.classList.contains(id));
  let picker=card.querySelector('.map-level-picker');
  if(!picker){picker=document.createElement('div');picker.className='map-level-picker';card.querySelector('h2').after(picker);}
  const min=minimumMapLevel(max),level=Math.max(min,Math.min(max,chosenLevels.get(mode)??max));chosenLevels.set(mode,level);const factors=mapScaling(level),low=level<max;
  picker.innerHTML='<button type="button" data-level-step="-1" aria-label="맵 레벨 낮추기" '+(level===min?'disabled':'')+'>‹</button><strong>Lv '+level+'</strong><button type="button" data-level-step="1" aria-label="맵 레벨 높이기" '+(level===max?'disabled':'')+'>›</button><small>HP '+Math.round(factors.hp*100)+'% · 적 피해 '+Math.round(factors.damage*100)+'%<br>'+(low?'하위 레벨 · 별조각 '+(mapRewardFactor(level,max)*100)+'%':mode==='mine'?'적정 레벨 · 매장량 '+Math.round((1+.5*Math.floor((level-1)/10))*100)+'%':'적정 레벨 · 별조각 '+Math.round((1+.5*Math.floor((level-1)/10))*100)+'% · 별조각 룰렛')+'</small>';
  for(const button of picker.querySelectorAll('button'))button.onclick=event=>{event.preventDefault();event.stopPropagation();chosenLevels.set(mode,Math.max(min,Math.min(max,level+Number(button.dataset.levelStep))));updateLevelChoices();};
  const url=new URL('adventure.html',location.href);url.searchParams.set('mode',mode);url.searchParams.set('level',level);if(demo)url.searchParams.set('demo','1');if(test)url.searchParams.set('mapTest','1');card.querySelector('[data-enter]').dataset.destination=url.href;
 }
 balance.dataset.recommendedLevel=max;
 renderRebuildTimers();
}
window.addEventListener('adventure-wallet-change',()=>void refreshBattleBalance());

mountSaveMenu(root.querySelector('header'));

root.insertAdjacentHTML('beforeend','<footer class="standalone-footer">© '+new Date().getFullYear()+' LUCENTY LABS. All rights reserved.</footer>');

function renderRebuildTimers(){
 for(const card of root.querySelectorAll('.mode-card')){
  const mode=['explore','offense','defense','mine'].find(id=>card.classList.contains(id)),remaining=Math.max(0,(battleWallet.profile.cooldowns?.[mode]||0)-Date.now()),blocked=remaining>0||entryGate.blocked;
  let panel=card.querySelector('.map-rebuild');if(!panel){panel=document.createElement('div');panel.className='map-rebuild';panel.innerHTML='<div><strong></strong><time></time></div><progress max="100" value="100"></progress>';card.append(panel);}
  const seconds=Math.ceil(remaining/1000);panel.querySelector('strong').textContent=mapError?'연결 확인 필요':entryGate.blocked?(entryGate.saving?'성장 저장중...':'맵 레벨 조정중...'):remaining>0?'재건중':'입장 가능';panel.querySelector('time').textContent=mapError?'아래 버튼으로 다시 시도':entryGate.blocked?'잠시 기다려 주세요':remaining>0?Math.floor(seconds/60)+':'+String(seconds%60).padStart(2,'0'):'준비 완료';panel.querySelector('progress').value=100*(1-remaining/ADVENTURE_COOLDOWNS[mode]);panel.querySelector('progress').setAttribute('aria-label',blocked?'재건 진행률':'입장 준비 완료');card.classList.toggle('rebuilding',blocked);card.setAttribute('aria-disabled',String(blocked&&!mapError));const enter=card.querySelector('[data-enter]');enter.dataset.readyLabel ||= enter.textContent;enter.disabled=entryGate.blocked?!mapError:remaining>0;enter.textContent=mapError?'다시 시도':enter.dataset.readyLabel;
 }
}
root.querySelector('.mode-list').addEventListener('click',event=>{const card=event.target.closest('.mode-card');if(card?.getAttribute('aria-disabled')==='true'&&!event.target.closest('[data-level-step]')){event.preventDefault();}});
setInterval(renderRebuildTimers,1000);

window.addEventListener('adventure-save-state',event=>{entryGate.setSaving(event.detail.busy);root.querySelector('.mode-list').setAttribute('aria-busy',String(entryGate.blocked));renderRebuildTimers();if(!event.detail.busy){if(event.detail.success)void refreshBattleBalance();else{mapError=new Error('저장 결과 확인이 필요해요.');renderRebuildTimers();}}});
root.querySelector('.mode-list').addEventListener('click',event=>{if(entryGate.blocked&&event.target.closest('[data-enter],[data-level-step]')){event.preventDefault();event.stopImmediatePropagation();if(mapError&&event.target.closest('[data-enter]'))void refreshBattleBalance();}},true);

void refreshBattleBalance();
