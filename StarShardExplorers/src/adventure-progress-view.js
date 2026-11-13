import './adventure-battle-shop.css';
import {adventureMenuUrl} from './adventure-collision.js';
import {ADVENTURE_REWARDS,rouletteTier,mapStardustReward} from '../shared/adventure-progression.js';
import {prepareClearReward,CLEAR_MINIMUM_MS} from './adventure-clear-transition.js';
export function mountAdventureProgress({root,wallet,getState,pause,notify}){
 const top=root.querySelector('.top-actions');const historyButton=document.createElement('button');historyButton.textContent='클리어 이력';historyButton.dataset.clearHistory='';top.prepend(historyButton);
 const note=root.querySelector('.prototype-note');note.textContent='개인 플레이 기록 · 진행과 획득 재화는 자동 저장돼요.';
 const potions=document.createElement('div');potions.className='adventure-potions';potions.innerHTML=['hp','stamina'].map(id=>'<button data-potion="'+id+'"><span class="potion-bottle '+(id==='hp'?'potion-hp':'potion-sp')+'" aria-hidden="true" style="background-image:url('+import.meta.env.BASE_URL+'adventure/potions/hp-sp-v3.png)"></span><b>'+(id==='hp'?'HP':'SP')+' 회복</b><span data-potion-count>× 0</span></button>').join('');root.querySelector('.stage').append(potions);
 const balance=document.createElement('div');balance.className='adventure-balance';root.querySelector('.under-stage').after(balance);let pending=false;

 function refresh(){const p=wallet.profile,s=getState(),pet=s?.pets?.[s.active];balance.textContent='보유 재화'+' · '+' · 클리어 '+(p.totalClears||0)+'회 · 다음 적 '+(24+Math.floor((p.totalClears||0)/20)*4)+'마리';if(s?.offense)balance.textContent='원정'+' · '+' · 클리어 '+(p.totalClears||0)+'회 · 적 '+s.enemies.filter(e=>e.hp>0).length+'마리 / 퇴치 '+s.defeated+'마리';if(s?.defense)balance.textContent='방어';balance.textContent+=' · ✦ 별조각 '+p.stardust;for(const b of potions.querySelectorAll('button')){const hp=b.dataset.potion==='hp',count=hp?p.hpPotions:p.staminaPotions;b.querySelector('[data-potion-count]').textContent='× '+count;b.disabled=pending||!!(s.knockout&&!s.knockout.completed)||!pet||!count||s.won||s.defense?.house.hp===0||(hp?pet.hp>=pet.maxHp:pet.sp>=pet.maxSp);b.title=(hp?'HP':'SP')+' 20 회복';}}
 for(const b of potions.querySelectorAll('button'))b.onclick=async()=>{if(pending)return;const s=getState(),id=s.active,pet=s.pets[id],hp=b.dataset.potion==='hp';if(!pet||(s.knockout&&!s.knockout.completed)||s.won||s.defense?.house.hp===0)return;pending=true;refresh();b.querySelector('b').textContent='저장 중…';try{await wallet.potion(id,b.dataset.potion);if(hp){pet.hp=Math.min(pet.maxHp,pet.hp+20);if(s.dead){s.knockout=null;s.dead=false;s.invuln=1;Object.assign(s.p,s.spawn||{x:550,y:1040});root.querySelector('.stage-message').hidden=true;}}else pet.sp=Math.min(pet.maxSp,pet.sp+20);notify((id==='momo'?'모모':'쿠키')+' '+(hp?'HP':'SP')+' 20 회복!');}catch(e){notify(e.message);}finally{pending=false;b.querySelector('b').textContent=hp?'HP 회복':'SP 회복';refresh();}};
 function timeLabel(ms){const seconds=Math.floor(ms/1000);return Math.floor(seconds/60)+'분 '+String(seconds%60).padStart(2,'0')+'초';}
 async function history(){
  pause(true);const d=document.createElement('dialog');d.className='progress-dialog history-dialog';document.body.append(d);d.showModal();
  d.addEventListener('close',()=>{d.remove();pause(false);},{once:true});
  let rows=[],loading=false,error='',end=new Date(Date.now()+9*3600000).toISOString().slice(0,10),since=null,canLoadMore=true;
  function draw(){if(!d.open)return;const p=wallet.profile,best=p.bestDurationMs??(rows.length?Math.min(...rows.map(r=>r.durationMs)):null);
   d.innerHTML='<button class="progress-close" aria-label="이력 닫기">×</button><h2>클리어 이력</h2><p>누적 <b>'+p.totalClears+'회</b> · '+(best===null?'아직 기록이 없어요.':'최고 기록 <b>'+timeLabel(best)+'</b>')+'</p>'+rows.map(r=>'<article class="adventure-clear-entry"><b>'+(r.mode==='mine'?'광산 '+r.mineNo+'회 채굴':r.clearNo+'회 클리어')+' · '+timeLabel(r.durationMs)+'</b><small>'+new Date(r.at).toLocaleString('ko-KR',{timeZone:'Asia/Seoul',hour12:false})+' · '+'플레이어'+' / '+(r.character==='kuki'?'쿠키':'모모')+'</small><span>'+(r.mode==='mine'?'광산':r.mode==='defense'?'방어':r.mode==='offense'?'원정':'개척')+' · ✦ '+(r.reward?.stardust||0)+' · '+(r.reward?.label||'')+'</span></article>').join('')+(loading?'<p role="status">이전 게임 이력을 읽고 있습니다.</p>':error?'<p role="alert">'+String(error).replace(/[&<>]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;'}[c]))+'</p><button class="history-more">다시 불러오기</button>':canLoadMore?'<button class="history-more">이전 기록 더 보기</button>':'<p>모든 기록을 불러왔어요.</p>');
   d.querySelector('.progress-close').onclick=()=>d.close();const more=d.querySelector('.history-more');if(more)more.onclick=loadMore;
  }
  async function loadMore(){if(loading)return;loading=true;error='';draw();const start=new Date(Date.parse(end)-30*86400000).toISOString().slice(0,10);try{const result=await wallet.history(start,end);rows=[...rows,...result.entries].sort((a,b)=>b.at-a.at);since=result.since;canLoadMore=since!=null&&since<Date.parse(start)-9*3600000;end=new Date(Date.parse(start)-86400000).toISOString().slice(0,10);}catch(e){error=e.message;}finally{loading=false;draw();}}
  await loadMore();
 }
 historyButton.onclick=history;
 function roulette(runId,cleared){pause(true);const d=document.createElement('dialog');d.className='progress-dialog roulette-dialog';const state=getState(),playTimeMs=state.playTimeMs||0,pet=state.active,clearStarted=performance.now(),mode=state.defense?'defense':state.offense?'offense':'explore';let working=false,claimed=false,savedReward=null,preparing=false;d.innerHTML='<h2>'+ (state.defense?'방어 성공!':state.offense?'산채 원정 성공!':'개척 성공!') +'</h2><p>클리어 타임 <b>'+timeLabel(playTimeMs)+'</b></p><p class="roulette-grade"></p><div class="wheel-wrap"><div class="wheel-pointer">▼</div><div class="reward-wheel">'+ADVENTURE_REWARDS.map((r,i)=>'<span style="--segment:'+i+'">'+r.label.replace('스테이터스 포인트','스탯 포인트').replace('SP 회복','SP 물약').replace('HP 회복','HP 물약')+'</span>').join('')+'</div></div><p data-result role="status">룰렛을 준비하고 있어요…</p><button class="roulette-spin" disabled>룰렛 로딩 중…</button>';document.body.append(d);d.addEventListener('cancel',e=>e.preventDefault());const clear=document.createElement('dialog');clear.className='progress-dialog stage-clear-dialog';clear.innerHTML='<h2>스테이지 클리어!</h2><p>'+(state.defense?state.defense.wave+'웨이브를 모두 막고 우리 집을 지켰어요.':state.offense?'산채 본체를 파괴했어요.':'개척 목표를 모두 달성했어요.')+'</p><p data-clear-preparing role="status">보상 룰렛을 준비 중입니다.</p><button data-clear-retry hidden>다시 준비하기</button>';clear.setAttribute('aria-label','스테이지 클리어!');clear.addEventListener('cancel',e=>e.preventDefault());document.body.append(clear);clear.showModal();const b=d.querySelector('.roulette-spin');


 function drawWheel(segments,tier){const wheel=d.querySelector('.reward-wheel'),colors=['#ffe49a','#ffc68c','#f5b9d1','#acd9ff'];wheel.style.setProperty('--slice',360/segments.length+'deg');wheel.style.setProperty('--half-slice',180/segments.length+'deg');wheel.style.background='conic-gradient('+segments.map((id,i)=>colors[ADVENTURE_REWARDS.findIndex(r=>r.id===id)%4]+' '+(i*360/segments.length)+'deg '+((i+1)*360/segments.length)+'deg').join(',')+')';wheel.innerHTML=segments.map((id,i)=>{const r=ADVENTURE_REWARDS.find(r=>r.id===id),amount=mapStardustReward(r?.stardust||0,wallet.run?.level??1,wallet.run?.recommendedLevel??1);return '<span style="--segment:'+i+'"><img src="'+import.meta.env.BASE_URL+'adventure/star-shard-v1.png" alt="별조각" style="width:20px;height:20px;vertical-align:middle"> '+amount+'</span>';}).join('');d.querySelector('.roulette-grade').textContent='별조각 보상 룰렛';}

 async function save(){
  if(preparing)return;preparing=true;b.disabled=true;b.textContent='룰렛 로딩 중…';
  const retry=clear.querySelector('[data-clear-retry]'),preparation=clear.querySelector('[data-clear-preparing]');retry.hidden=true;preparation.textContent='보상 룰렛을 준비 중입니다.';
  try{
   savedReward=await prepareClearReward(()=>wallet.finish(runId,cleared,pet,playTimeMs),CLEAR_MINIMUM_MS-(performance.now()-clearStarted));
   drawWheel(savedReward.segments||ADVENTURE_REWARDS.map(r=>r.id),savedReward.tier);
   d.querySelector('[data-result]').textContent='룰렛을 돌려 별조각 보상을 확인해요.';b.textContent='룰렛 돌리기';
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
