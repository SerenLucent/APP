import './adventure-battle-shop.css';
import {adventureMenuUrl} from './adventure-collision.js';
import {ADVENTURE_REWARDS,rouletteTier,mapStardustReward} from '../shared/adventure-progression.js';
import {prepareClearReward,CLEAR_MINIMUM_MS} from './adventure-clear-transition.js';
export function mountAdventureProgress({root,wallet,getState,pause,notify}){
 const top=root.querySelector('.top-actions');const historyButton=document.createElement('button');historyButton.textContent='클리어 이력';historyButton.dataset.clearHistory='';top.prepend(historyButton);
 const note=root.querySelector('.prototype-note');note.textContent=getState().defense&&wallet.local?'방어 모의 테스트 · 룰렛 보상은 이 브라우저의 테스트 재화로 저장돼요.':wallet.local?'테스트 재화 · 이 브라우저에 저장돼요 · 커플방 재화와 별개예요':'커플방 공유 재화 · 물약·포인트·능력치를 커플방에 저장해요';
 const potions=document.createElement('div');potions.className='adventure-potions';potions.innerHTML='<button data-potion="hp"><b>HP 회복약</b><span>× 0</span></button><button data-potion="stamina"><b>스태미나 회복약</b><span>× 0</span></button>';root.querySelector('.stage').append(potions);
 const balance=document.createElement('div');balance.className='adventure-balance';root.querySelector('.under-stage').after(balance);let pending=false;

 function refresh(){const p=wallet.profile,s=getState(),pet=s?.pets?.[s.active];balance.textContent=(wallet.local?'테스트 재화':'공유 재화')+' · ♥ '+wallet.hearts+' · 스테이터스 포인트 '+p.points+' · 클리어 '+(p.totalClears||0)+'회 · 다음 적 '+(24+Math.floor((p.totalClears||0)/20)*4)+'마리';if(s?.offense)balance.textContent=(wallet.local?'원정 테스트':'커플방 원정')+' · ♥ '+wallet.hearts+' · 포인트 '+p.points+' · 클리어 '+(p.totalClears||0)+'회 · 적 '+s.enemies.filter(e=>e.hp>0).length+'마리 / 퇴치 '+s.defeated+'마리';if(s?.defense)balance.textContent=(wallet.local?'방어 테스트':'커플방 방어')+' · ♥ '+wallet.hearts+' · 포인트 '+p.points;balance.textContent+=' · ✦ 별조각 '+p.stardust+' · 스킬 포인트 '+p.skillPoints;for(const b of potions.querySelectorAll('button')){const hp=b.dataset.potion==='hp',count=hp?p.hpPotions:p.staminaPotions;b.querySelector('span').textContent='× '+count;b.disabled=pending||!!(s.knockout&&!s.knockout.completed)||!pet||!count||s.won||s.defense?.house.hp===0||(hp?pet.hp>=pet.maxHp:pet.sp>=pet.maxSp);b.title=(hp?'HP':'SP')+' 20 회복';}}
 for(const b of potions.querySelectorAll('button'))b.onclick=async()=>{if(pending)return;const s=getState(),id=s.active,pet=s.pets[id],hp=b.dataset.potion==='hp';if(!pet||(s.knockout&&!s.knockout.completed)||s.won||s.defense?.house.hp===0)return;pending=true;refresh();b.querySelector('b').textContent='저장 중…';try{await wallet.potion(id,b.dataset.potion);if(hp){pet.hp=Math.min(pet.maxHp,pet.hp+20);if(s.dead){s.knockout=null;s.dead=false;s.invuln=1;Object.assign(s.p,s.spawn||{x:550,y:1040});root.querySelector('.stage-message').hidden=true;}}else pet.sp=Math.min(pet.maxSp,pet.sp+20);notify((id==='momo'?'모모':'쿠키')+' '+(hp?'HP':'스태미나')+' 20 회복!');}catch(e){notify(e.message);}finally{pending=false;b.querySelector('b').textContent=hp?'HP 회복약':'스태미나 회복약';refresh();}};
 function timeLabel(ms){const seconds=Math.floor(ms/1000);return Math.floor(seconds/60)+'분 '+String(seconds%60).padStart(2,'0')+'초';}
 async function history(){
  pause(true);const d=document.createElement('dialog');d.className='progress-dialog history-dialog';document.body.append(d);d.showModal();
  d.addEventListener('close',()=>{d.remove();pause(false);},{once:true});
  let rows=[],loading=false,error='',end=new Date(Date.now()+9*3600000).toISOString().slice(0,10),since=null,canLoadMore=true;
  function draw(){if(!d.open)return;const p=wallet.profile,best=p.bestDurationMs??(rows.length?Math.min(...rows.map(r=>r.durationMs)):null);
   d.innerHTML='<button class="progress-close" aria-label="이력 닫기">×</button><h2>클리어 이력</h2><p>누적 <b>'+p.totalClears+'회</b> · '+(best===null?'아직 기록이 없어요.':'최고 기록 <b>'+timeLabel(best)+'</b>')+'</p>'+rows.map(r=>'<article class="adventure-clear-entry"><b>'+(r.mode==='mine'?'광산 '+r.mineNo+'회 채굴':r.clearNo+'회 클리어')+' · '+timeLabel(r.durationMs)+'</b><small>'+new Date(r.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' · '+(r.role==='owner'?'방 만든 사람':'초대받은 사람')+' / '+(r.character==='kuki'?'쿠키':'모모')+'</small><span>'+(r.mode==='mine'?'광산':r.mode==='defense'?'방어':r.mode==='offense'?'원정':'개척')+' · ✦ '+(r.reward?.stardust||0)+' · '+(r.reward?.label||'')+'</span></article>').join('')+(loading?'<p role="status">이전 게임 이력을 읽고 있습니다.</p>':error?'<p role="alert">'+String(error).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</p><button class="history-more">다시 불러오기</button>':canLoadMore?'<button class="history-more">이전 기록 더 보기</button>':'<p>모든 기록을 불러왔어요.</p>');
   d.querySelector('.progress-close').onclick=()=>d.close();const more=d.querySelector('.history-more');if(more)more.onclick=loadMore;
  }
  async function loadMore(){if(loading)return;loading=true;error='';draw();const start=new Date(Date.parse(end)-30*86400000).toISOString().slice(0,10);try{const result=await wallet.history(start,end);rows=[...rows,...result.entries].sort((a,b)=>b.at-a.at);since=result.since;canLoadMore=since!=null&&since<Date.parse(start)-9*3600000;end=new Date(Date.parse(start)-86400000).toISOString().slice(0,10);}catch(e){error=e.message;}finally{loading=false;draw();}}
  await loadMore();
 }
 historyButton.onclick=history;
 function roulette(runId,cleared){pause(true);const d=document.createElement('dialog');d.className='progress-dialog roulette-dialog';const state=getState(),playTimeMs=state.playTimeMs||0,pet=state.active,clearStarted=performance.now(),mode=state.defense?'defense':state.offense?'offense':'explore',fixedReward=(wallet.run?.level??1)<(wallet.run?.recommendedLevel??1),estimatedStars=mapStardustReward(rouletteTier(playTimeMs,mode).stardust,wallet.run?.level??1,wallet.run?.recommendedLevel??1);let working=false,claimed=false,savedReward=null,preparing=false;d.innerHTML='<h2>'+ (state.defense?'방어 성공!':state.offense?'산채 원정 성공!':'개척 성공!') +'</h2><p>클리어 타임 <b>'+timeLabel(playTimeMs)+'</b> · 빠른 기록일수록 별조각 보너스가 늘어나요</p><p class="roulette-grade"></p><div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="reward-wheel">'+ADVENTURE_REWARDS.map((r,i)=>'<span style="--segment:'+i+'">'+r.label.replace('스테이터스 포인트','스탯 포인트').replace('스태미나 회복약','SP 물약').replace('HP 회복약','HP 물약')+'</span>').join('')+'</div></div><p data-result role="status">룰렛을 준비하고 있어요…</p><button class="roulette-spin" disabled>룰렛 로딩 중…</button>';document.body.append(d);d.addEventListener('cancel',e=>e.preventDefault());const clear=document.createElement('dialog');clear.className='progress-dialog stage-clear-dialog';clear.innerHTML='<h2>스테이지 클리어!</h2><p>'+(state.defense?state.defense.wave+'웨이브를 모두 막고 우리 집을 지켰어요.':state.offense?'산채 본체를 파괴했어요.':'개척 목표를 모두 달성했어요.')+'</p><div class="clear-stardust"><img src="'+import.meta.env.BASE_URL+'adventure/star-shard-v1.png" alt="" width="72" height="72"><strong data-clear-stars>별조각 +'+estimatedStars+' 획득</strong></div><p data-clear-preparing role="status">보상 룰렛을 준비 중입니다.</p><button data-clear-retry hidden>다시 준비하기</button>';if(fixedReward)clear.querySelector('[data-clear-preparing]').textContent='획득 보상을 준비 중입니다.';clear.setAttribute('aria-label','스테이지 클리어!');clear.addEventListener('cancel',e=>e.preventDefault());document.body.append(clear);clear.showModal();const b=d.querySelector('.roulette-spin');


 function drawWheel(segments,tier){const wheel=d.querySelector('.reward-wheel'),colors={heart2:'#f8ccd8',heart4:'#ffc68c',heart1:'#f4c7d7',heart3:'#ffe49a',heart6:'#acd9ff',heart5:'#f5b9d1',staminaPotion:'#c8dce0',hpPotion:'#d8cae8',point:'#cfd8b2'},short={heart2:'♥ 2',heart4:'♥ 4',heart1:'♥ 1',heart3:'♥ 3',heart6:'♥ 6',heart5:'♥ 5',staminaPotion:'SP 약',hpPotion:'HP 약',point:'스탯 +2'};wheel.style.setProperty('--slice',360/segments.length+'deg');wheel.style.setProperty('--half-slice',180/segments.length+'deg');wheel.style.background='conic-gradient('+segments.map((id,i)=>colors[id]+' '+(i*360/segments.length)+'deg '+((i+1)*360/segments.length)+'deg').join(',')+')';wheel.innerHTML=segments.map((id,i)=>'<span style="--segment:'+i+'">'+short[id]+'</span>').join('');d.querySelector('.roulette-grade').textContent=[...new Set(segments)].length===1?'하위 레벨 · 하트 2개':'하트 3개부터 6개 · 행운의 룰렛';}
 async function save(){
  if(preparing)return;preparing=true;b.disabled=true;b.textContent=fixedReward?'보상을 준비 중…':'룰렛 로딩 중…';
  const retry=clear.querySelector('[data-clear-retry]'),preparation=clear.querySelector('[data-clear-preparing]');retry.hidden=true;preparation.textContent=fixedReward?'획득 보상을 준비 중입니다.':'보상 룰렛을 준비 중입니다.';
  try{
   savedReward=await prepareClearReward(()=>wallet.finish(runId,cleared,pet,playTimeMs),CLEAR_MINIMUM_MS-(performance.now()-clearStarted));
   clear.querySelector('[data-clear-stars]').textContent='별조각 +'+(savedReward.stardust??estimatedStars)+' 획득';
   const fixed=fixedReward||savedReward.segments?.length&&new Set(savedReward.segments).size===1;
   if(fixed){
    d.querySelector('.wheel-wrap').hidden=true;
    d.querySelector('h2').textContent='하트 '+savedReward.hearts+'개 획득!';
    d.querySelector('.roulette-grade').textContent='하위 레벨 고정 보상';
    d.querySelector('[data-result]').textContent='♥ '+savedReward.hearts+' · 별조각 '+(savedReward.stardust??estimatedStars)+'개 획득';
    b.textContent='확인';claimed=true;
   }else{
    drawWheel(savedReward.segments||ADVENTURE_REWARDS.map(r=>r.id),savedReward.tier);
    d.querySelector('[data-result]').textContent='✦ 별조각 +'+(savedReward.stardust??estimatedStars)+' · 룰렛을 돌려 보상을 확인해요.';b.textContent='룰렛 돌리기';
   }
   refresh();clear.close();clear.remove();d.showModal();b.disabled=false;
  }catch(error){preparation.textContent=error.message;retry.hidden=false;}
  finally{preparing=false;}
 }
 clear.querySelector('[data-clear-retry]').onclick=()=>{void save();};
 void save();
 b.onclick=async()=>{if(working)return;if(claimed){location.assign(adventureMenuUrl(import.meta.env.BASE_URL,wallet.local));return;}working=true;try{if(!savedReward)return;b.disabled=true;const reward=savedReward,wheel=d.querySelector('.reward-wheel');wheel.style.transform='rotate('+(2160+360-(reward.index*360/(reward.segments?.length||ADVENTURE_REWARDS.length)+180/(reward.segments?.length||ADVENTURE_REWARDS.length)))+'deg)';b.textContent='두근두근…';await new Promise(resolve=>setTimeout(resolve,3100));d.querySelector('[data-result]').textContent=reward.label+' 획득!';b.textContent='보상받기';claimed=true;refresh();}finally{working=false;b.disabled=false;}};
 }

 refresh();return {refresh,roulette};
}
