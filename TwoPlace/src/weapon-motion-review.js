import {WEAPON_DIRECTIONS,drawWeaponPose} from './weapon-motion.js';
import './weapon-motion-review.css';
const root=document.querySelector('#weapon-review'),images={};let selected='momo',mode='play',started=performance.now();
root.innerHTML='<header><small>TWOPLACE · WEAPON MOTION STUDY</small><h1>하트봉과 별망치</h1><p>대기 → 내려치기 · 직접 만든 5방향 + 좌우 대칭 3방향</p><aside>모션 시안 전용 · 실제 게임과 커플방 데이터는 바뀌지 않아요.</aside></header><nav aria-label="캐릭터"><button data-pet="momo" aria-pressed="true">모모 · 하트 마법봉</button><button data-pet="kuki" aria-pressed="false">쿠키 · 별망치</button></nav><div class="motion-controls" aria-label="모션 재생"><button data-mode="play" aria-pressed="true">▶ 반복 재생</button><button data-mode="idle" aria-pressed="false">대기 자세</button><button data-mode="strike" aria-pressed="false">내려치기 자세</button><button data-once>한 번 공격</button><span role="status" data-loading>이미지를 준비하고 있어요…</span></div><section class="motion-grid">'+WEAPON_DIRECTIONS.map(d=>'<article><h2>'+d.label+(d.flip?'<small>대칭</small>':'')+'</h2><canvas width="360" height="360" data-direction="'+d.id+'" aria-label="'+d.label+' 무기 모션"></canvas><p data-phase>대기</p></article>').join('')+'</section><footer>위 방향은 등, 아래 방향은 얼굴이 보이는 기준이에요. 오른쪽 계열은 왼쪽 이미지를 대칭으로 사용해요.</footer>';
const status=root.querySelector('[data-loading]');

await Promise.all(['momo','kuki'].map(async id=>{const im=new Image();im.src=import.meta.env.BASE_URL+'adventure/weapons/'+id+'-weapon-motion-v3.png';try{await im.decode();images[id]=im;}catch{status.textContent='이미지를 불러오지 못했어요. 새로고침해 주세요.';}}));
if(images.momo&&images.kuki)status.textContent='두 캐릭터 모션 준비 완료';
root.querySelectorAll('[data-pet]').forEach(b=>b.onclick=()=>{selected=b.dataset.pet;started=performance.now();root.querySelectorAll('[data-pet]').forEach(x=>x.setAttribute('aria-pressed',String(x===b)));});
root.querySelectorAll('[data-mode]').forEach(b=>b.onclick=()=>{mode=b.dataset.mode;started=performance.now();updateButtons();});
root.querySelector('[data-once]').onclick=()=>{mode='once';started=performance.now();updateButtons();};
function updateButtons(){root.querySelectorAll('[data-mode]').forEach(b=>b.setAttribute('aria-pressed',String(mode===b.dataset.mode)));}
function frame(now){let phase='idle';if(mode==='strike')phase='strike';else if(mode==='play'){if((now-started)%1500>1050)phase='strike';}else if(mode==='once'){const elapsed=now-started;if(elapsed>220&&elapsed<620)phase='strike';if(elapsed>=800){mode='idle';updateButtons();}}
 const age=mode==='play'?((now-started)%1500-1050)/450:mode==='once'?(now-started-220)/400:mode==='strike'?.4:-1;
 for(const c of root.querySelectorAll('canvas')){const ctx=c.getContext('2d');ctx.clearRect(0,0,c.width,c.height);if(images[selected])drawWeaponPose(ctx,images[selected],c.dataset.direction,phase,selected,age,c.width,c.height);c.nextElementSibling.textContent=phase==='strike'?'내려치기':'대기';}requestAnimationFrame(frame);}
requestAnimationFrame(frame);
