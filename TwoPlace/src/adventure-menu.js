import {mountBattleShop} from './adventure-battle-shop.js';
import {createAdventureWallet} from './adventure-wallet.js';
import {DEFENSE_WAVES} from './adventure-defense.js';
import {mountAdventureStatMenu} from './adventure-stat-menu.js';
import {installAppTouchPolicy} from './app-touch.js';
installAppTouchPolicy();
import './adventure-menu.css';
const base=import.meta.env.BASE_URL,demo=new URLSearchParams(location.search).get('demo')==='1',root=document.querySelector('#mode-menu');
window.twoPlaceBack=()=>{const dialog=document.querySelector('dialog[open]');if(dialog){dialog.close();return true;}location.replace(base+(demo?'demo.html?view=home':'index.html'));return true;};
root.innerHTML=`<header><a href="${base+(demo?'demo.html?view=home':'index.html')}">‹ 메인화면으로</a><button type="button" class="mode-stats-button" data-battle-shop>전투상점</button><button type="button" class="mode-stats-button" data-adventure-stats>캐릭터 레벨업</button></header><section class="mode-intro"><div><p>오늘은 어디로 떠날까?</p><h1>둘이 함께, 작은 모험</h1><span>모모의 회오리와 쿠키의 별꼬리로 도전해요.</span></div><div class="mode-pets"><img src="${base}pets/mochi-standing-v2.png" alt="모모"><img src="${base}pets/kuki-standing-v2.png" alt="쿠키"></div></section><div class="mode-list"><a class="mode-card explore" href="${base}adventure.html${demo?'?demo=1':''}"><span class="mode-number">01 · EXPLORE</span><h2>개척</h2><p>숲에 흩어진 나무 50개와 바위 30개를 정리해요.</p><small>나무 50개 · 바위 30개 · 룰렛 보상</small><b>개척 시작하기 →</b></a><a class="mode-card offense" href="${base}adventure.html?mode=offense${demo?'&demo=1':''}"><span class="mode-number">02 · OFFENSE</span><h2>원정</h2><p>사방에서 몰려오는 집 지킴이를 상대하며 산채 본체를 무너뜨려요.</p><small>산채 본체 파괴 · 룰렛 보상</small><b>원정 시작하기 →</b></a><a class="mode-card defense" href="${base}adventure.html?mode=defense${demo?'&demo=1':''}"><span class="mode-number">03 · DEFENSE</span><h2>방어</h2><p>모모와 쿠키를 교체하며 우리 집으로 몰려오는 방울이를 막아요.</p><small>우리 집 지키기 · ${DEFENSE_WAVES.length}차 공격 · 룰렛 보상</small><b>${demo?'방어 모의 테스트':'방어 시작하기'} →</b></a></div><aside><strong>세 가지 모험, 둘만의 한 바퀴</strong><p>최종 규칙은 두 사람이 각각 개척·원정·방어를 한 번씩 완료하면 다시 열리는 방식이에요. 지금은 세 모험을 원하는 순서로 즐길 수 있어요.</p></aside>`;

mountAdventureStatMenu(root.querySelector('[data-adventure-stats]'));

const battleWallet=createAdventureWallet();
const balance=document.createElement('p');
balance.style.cssText='color:#ffe2a0;font-size:15px;margin:0 0 18px';
root.querySelector('.mode-intro').after(balance);
const refreshBattleBalance=async()=>{
 try{await battleWallet.init();balance.textContent='✦ 별조각 '+battleWallet.profile.stardust.toLocaleString()+' · 스탯포인트 : '+battleWallet.profile.points+' · 스킬포인트 : '+battleWallet.profile.skillPoints;}
 catch(error){balance.textContent=error.message;}
};
mountBattleShop(root.querySelector('[data-battle-shop]'),{wallet:battleWallet,onChange:()=>{void refreshBattleBalance();window.dispatchEvent(new Event('adventure-wallet-change'));}});
void refreshBattleBalance();
