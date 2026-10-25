import {starving} from '../shared/pet-care.js';
import './heart-reward.css';
const HOUR=3600000;
export function rewardStatus(home,now){
  const elapsed=Math.max(0,now-home.lastClaim),amount=!starving(home,now)&&elapsed>=HOUR?10:0;
  const seconds=Math.max(0,Math.ceil((HOUR-elapsed)/1000));
  return {amount,blocked:starving(home,now),progress:Math.min(100,elapsed/HOUR*100),remaining:`${String(Math.floor(seconds/60)).padStart(2,'0')}:${String(seconds%60).padStart(2,'0')}`};
}
export function heartCard(){return `<section class="heart-card"><div class="heart-card-copy"><h1>우리 둘의 하루가 모이는 곳</h1><p>사소한 순간도 함께라서 특별하니까</p></div><button class="hero-heart" data-action="claim-hearts" aria-label="쌓인 하트 받기">♥</button><p class="heart-reward-status" aria-live="polite"></p><div class="heart-reward-bottom"><div class="heart-gauge" role="progressbar" aria-label="다음 하트까지" aria-valuemin="0" aria-valuemax="100"><i></i></div><button class="heart-claim-button" data-action="claim-hearts">하트 받기</button></div></section>`;}
export function updateHeartCard(home,now,pending){
  const card=document.querySelector('.heart-card');if(!card||!home)return;
  const status=rewardStatus(home,now),ready=status.amount>0;
  card.querySelector('.heart-reward-status').textContent=status.blocked?'모모와 쿠키 모두 배부름이 0%예요. 먼저 먹이를 주세요.':ready?`하트가 쌓였어요 · ${status.amount}하트`:`다음 하트까지 ${status.remaining} · 1시간마다 10하트`;
  card.querySelector('.heart-gauge').setAttribute('aria-valuenow',String(Math.floor(status.progress)));
  card.querySelector('.heart-gauge i').style.width=`${status.progress}%`;
  card.querySelectorAll('[data-action="claim-hearts"]').forEach(button=>{button.disabled=pending||!ready;});
  card.querySelector('.heart-claim-button').textContent=pending?'받는 중…':'하트 받기';
}
export async function flyHearts(origin,amount){
  const wallet=document.querySelector('.main-heart-wallet'),target=wallet?.querySelector('span'),balance=wallet?.querySelector('strong');
  if(!wallet||!origin||!target||!balance)return;
  const before=Number(balance.textContent),source=document.querySelector('.hero-heart');
  if(matchMedia('(prefers-reduced-motion: reduce)').matches){balance.textContent=before+amount;return;}
  const end=target.getBoundingClientRect(),start={x:origin.x+origin.width/2,y:origin.y+origin.height/2},finish={x:end.x+end.width/2,y:end.y+end.height/2};
  const control={x:start.x+24,y:Math.max(24,Math.min(start.y,finish.y)-64)};
  const point=progress=>{const t=progress<.5?4*progress**3:1-(-2*progress+2)**3/2;return {x:(1-t)**2*start.x+2*(1-t)*t*control.x+t*t*finish.x,y:(1-t)**2*start.y+2*(1-t)*t*control.y+t*t*finish.y};};
  const layer=document.createElement('div');layer.className='heart-flight-layer';layer.setAttribute('aria-hidden','true');
  const heart=document.createElement('span');heart.className='single-flying-heart';heart.textContent='♥';
  const plus=document.createElement('span');plus.className='heart-flight-plus';plus.textContent='+'+amount;
  const sparks=Array.from({length:26},()=>{const star=document.createElement('i');star.textContent='✦';layer.append(star);return star;});
  layer.append(heart,plus);document.body.append(layer);if(source)source.style.visibility='hidden';
  await new Promise(resolve=>{
    const began=performance.now();
    function frame(now){
      if(!wallet.isConnected||document.hidden){layer.remove();if(source)source.style.visibility='';resolve();return;}
      const t=Math.min(1,(now-began)/1300),flight=Math.min(1,t/.64),settle=Math.max(0,(t-.64)/.36),p=point(flight),size=62-39*flight*flight;
      heart.style.cssText='left:'+p.x+'px;top:'+p.y+'px;font-size:'+size+'px;transform:translate(-50%,-50%) rotate('+(-Math.sin(flight*Math.PI)*.38)+'rad);opacity:'+(flight<1?1:0);
      sparks.forEach((star,i)=>{const progress=t/.64-.022*i;if(progress<0||progress>1){star.style.opacity=0;return;}const q=point(progress),fade=(1-i/27)*(1-Math.min(1,Math.max(0,(t/.64-1)*3)));star.style.cssText='left:'+(q.x+Math.sin(i*2.4)*(5+i*.4))+'px;top:'+(q.y+Math.cos(i*1.8)*7)+'px;font-size:'+(5+i%4*2)+'px;opacity:'+fade*.85;});
      if(settle>0){balance.textContent=before+Math.floor(amount*(1-(1-settle)**3));wallet.style.transform='scale('+(1+Math.sin(settle*Math.PI)*.14)+')';plus.style.cssText='left:'+finish.x+'px;top:'+(finish.y+20-settle*14)+'px;opacity:'+(1-settle*settle);if(source)source.style.visibility='';}
      if(t<1)requestAnimationFrame(frame);else{balance.textContent=before+amount;wallet.style.transform='';layer.remove();resolve();}
    }
    requestAnimationFrame(frame);
  });
}
