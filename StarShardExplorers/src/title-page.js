import {openEmailMenu} from './email-menu.js';
import {installAppTouchPolicy} from './app-touch.js';
import './title-page.css';
installAppTouchPolicy();
const base=import.meta.env.BASE_URL;
document.querySelector('#title-page').innerHTML=`
 <div class="title-sky" aria-hidden="true"><i>✦</i><i>✧</i><i>✦</i><i>✧</i><i>✦</i><i>✧</i></div>
 <section class="title-content" aria-labelledby="game-title">
  <span class="title-brand">LUCENTY LABS</span>
  <div class="title-wordmark"><p>모모와 쿠키의</p><h1 id="game-title">별조각 탐험대</h1><span>작은 발걸음, 반짝이는 모험</span></div>
  <div class="title-friends" aria-label="탐험 친구 모모와 쿠키">
   <div class="title-glow" aria-hidden="true"></div>
   <img class="title-momo" src="${base}pets/mochi-standing-v2.png" alt="모모" fetchpriority="high">
   <img class="title-shard" src="${base}adventure/star-shard-v1.png" alt="" aria-hidden="true">
   <img class="title-kuki" src="${base}pets/kuki-standing-v2.png" alt="쿠키" fetchpriority="high">
  </div>
  <a class="title-start" href="${base}adventure-menu.html">게스트로 시작하기 <span aria-hidden="true">→</span></a>
  <p class="title-start-note">가입 없이 바로 모험을 시작해요.</p>
  <div class="title-email-note"><p>다른 웹브라우저나 다른 기기에서도<br>이어서 하고 싶다면?</p><button type="button" data-email-login>이메일로 이어하기</button></div>
 </section>
 <footer>© LUCENTY LABS. All rights reserved.</footer>`;

document.querySelector('[data-email-login]').onclick=()=>openEmailMenu({mode:'login'});
