import {mountSaveMenu} from './save-menu.js';
import {recommendedMapLevel,mapScaling,adventureLevel,minimumMapLevel,mapRewardFactor} from '../shared/adventure-progression.js';
import {mountBattleShop} from './adventure-battle-shop.js';
import {createAdventureWallet} from './adventure-wallet.js';
import {DEFENSE_WAVES} from './adventure-defense.js';
import {mountAdventureStatMenu} from './adventure-stat-menu.js';
import {installAppTouchPolicy} from './app-touch.js';
installAppTouchPolicy();
import './adventure-menu.css';
const base=import.meta.env.BASE_URL,demo=new URLSearchParams(location.search).get('demo')==='1',root=document.querySelector('#mode-menu');
window.gameBack=()=>{const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return true;}location.replace(base+'index.html');return true;};
root.innerHTML=`<header><a href="${base+'index.html'}">별조각 탐험대</a><button type="button" class="mode-stats-button" data-battle-shop>전투상점</button><button type="button" class="mode-stats-button" data-adventure-stats>캐릭터 레벨업</button></header><section class="mode-intro"><div><p>오늘은 어디로 떠날까?</p><h1>별조각 탐험대</h1><span>모모의 회오리와 쿠키의 별꼬리로 도전해요.</span></div><div class="mode-pets"><img src="${base}pets/mochi-standing-v2.png" alt="모모"><img src="${base}pets/kuki-standing-v2.png" alt="쿠키"></div></section><div class="mode-list"><a class="mode-card explore" href="${base}adventure.html${demo?'?demo=1':''}"><span class="mode-number">01 · EXPLORE</span><h2>개척</h2><p>숲에 흩어진 나무 50개와 바위 30개를 정리해요.</p><small>나무 50개 · 바위 30개 · 룰렛 보상</small><b>개척 시작하기 →</b></a><a class="mode-card offense" href="${base}adventure.html?mode=offense${demo?'&demo=1':''}"><span class="mode-number">02 · OFFENSE</span><h2>원정</h2><p>사방에서 몰려오는 집 지킴이를 상대하며 산채 본체를 무너뜨려요.</p><small>산채 본체 파괴 · 룰렛 보상</small><b>원정 시작하기 →</b></a><a class="mode-card defense" href="${base}adventure.html?mode=defense${demo?'&demo=1':''}"><span class="mode-number">03 · DEFENSE</span><h2>방어</h2><p>모모와 쿠키를 교체하며 우리 집으로 몰려오는 방울이를 막아요.</p><small>우리 집 지키기 · ${DEFENSE_WAVES.length}차 공격 · 룰렛 보상</small><b>${demo?'방어 모의 테스트':'방어 시작하기'} →</b></a></div><aside><strong>모모와 쿠키, 함께 떠나는 모험</strong><p>플레이 기록과 성장은 개인별로 자동 저장돼요. 저장 관리에서 복구코드를 보관하면 다른 기기에서도 이어할 수 있어요.</p></aside>`;

mountAdventureStatMenu(root.querySelector('[data-adventure-stats]'));

const battleWallet=createAdventureWallet();
const balance=document.createElement('p');
balance.className='mode-shard-balance';
balance.style.cssText='color:#ffe2a0;font-size:15px;margin:0 0 18px';
root.querySelector('.mode-intro').after(balance);
let balanceRefresh=0;
const refreshBattleBalance=async()=>{
 const sequence=++balanceRefresh;balance.textContent='맵 레벨 조정중...';root.querySelector('.mode-list').setAttribute('aria-busy','true');
 try{await battleWallet.init();if(sequence!==balanceRefresh)return;updateLevelChoices();balance.innerHTML='<img class="mode-shard-icon" src="'+base+'adventure/star-shard-v1.png" alt=""><strong>'+battleWallet.profile.stardust.toLocaleString()+'</strong><span>별조각</span>';balance.setAttribute('aria-label',battleWallet.profile.stardust.toLocaleString()+' 별조각');}
 catch(error){if(sequence===balanceRefresh)balance.textContent=error.message;}
 finally{if(sequence===balanceRefresh)root.querySelector('.mode-list').removeAttribute('aria-busy');}
};
mountBattleShop(root.querySelector('[data-battle-shop]'),{wallet:battleWallet,onChange:()=>{void refreshBattleBalance();window.dispatchEvent(new Event('adventure-wallet-change'));}});
void refreshBattleBalance();

root.querySelector('.mode-list').insertAdjacentHTML('beforeend','<a class="mode-card mine" href="'+base+'adventure.html?mode=mine'+(demo?'&demo=1':'')+'"><span class="mode-number">04 · MINE</span><h2>별조각 광산</h2><p>동굴을 오가며 원석을 부수고 흩어진 별조각을 모아요.</p><small>3분 제한 · 무작위 원석 · 별조각만 획득</small><b>광산 들어가기 →</b></a>');

const chosenLevels=new Map();
function updateLevelChoices(){
 const max=recommendedMapLevel(battleWallet.profile),previous=Number(balance.dataset.recommendedLevel||0),test=new URLSearchParams(location.search).get('mapTest')==='1';
 if(max>previous)chosenLevels.clear();
 for(const card of root.querySelectorAll('.mode-card')){
  const mode=['explore','offense','defense','mine'].find(id=>card.classList.contains(id));
  let picker=card.querySelector('.map-level-picker');
  if(!picker){picker=document.createElement('div');picker.className='map-level-picker';card.querySelector('h2').after(picker);}
  const min=minimumMapLevel(max),level=Math.max(min,Math.min(max,chosenLevels.get(mode)??max));chosenLevels.set(mode,level);const factors=mapScaling(level),low=level<max;
  picker.innerHTML='<button type="button" data-level-step="-1" aria-label="맵 레벨 낮추기" '+(level===min?'disabled':'')+'>‹</button><strong>Lv '+level+'</strong><button type="button" data-level-step="1" aria-label="맵 레벨 높이기" '+(level===max?'disabled':'')+'>›</button><small>HP '+Math.round(factors.hp*100)+'% · 적 피해 '+Math.round(factors.damage*100)+'%<br>'+(low?'하위 레벨 · 별조각 '+(mapRewardFactor(level,max)*100)+'%'+(mode==='mine'?'':' · 하트 '+(max-level===1?2:1)+'개'):mode==='mine'?'적정 레벨 · 매장량 '+Math.round((1+.5*Math.floor((level-1)/10))*100)+'%':'적정 레벨 · 별조각 '+Math.round((1+.5*Math.floor((level-1)/10))*100)+'% · 하트 3·4·5·6')+'</small>';
  for(const button of picker.querySelectorAll('button'))button.onclick=event=>{event.preventDefault();event.stopPropagation();chosenLevels.set(mode,Math.max(min,Math.min(max,level+Number(button.dataset.levelStep))));updateLevelChoices();};
  const url=new URL('adventure.html',location.href);url.searchParams.set('mode',mode);url.searchParams.set('level',level);if(demo)url.searchParams.set('demo','1');if(test)url.searchParams.set('mapTest','1');card.href=url.href;
 }
 balance.dataset.recommendedLevel=max;
}
window.addEventListener('adventure-wallet-change',()=>void refreshBattleBalance());

mountSaveMenu(root.querySelector('header'));

root.insertAdjacentHTML('beforeend','<footer class="standalone-footer">© LUCENTY LABS. All rights reserved.</footer>');
