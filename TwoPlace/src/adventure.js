import {beginKnockout,stepKnockout,drawKnockedOut} from './adventure-knockout.js';
import {createGameMusic} from './adventure-music.js';
import {createCombatAudio} from './adventure-audio.js';
import {drawChargeGather} from './adventure-charge-art.js';
import {ultimateEnemyDelta,KUKI_SLAM_IMPACT_TIME} from './adventure-cinematics.js';
import {triggerHitJolt,stepHitJolt,drawWithHitJolt} from './adventure-hit-jolt.js';
import {drawStunStars} from './adventure-stun.js';
import {skillBalance} from './adventure-skills.js';
import {DEFENSE_HOME,DEFENSE_WAVES,DEFENSE_TOTAL,DEFENSE_START,createDefense,stepDefense} from './adventure-defense.js';
import {EXPLORATION_FIELD_VERSION,EXPLORATION_GOALS,explorationProof} from '../shared/adventure-field.js';
import {KUKI_SLAM_RADIUS,KUKI_SLAM_MULTIPLIER,KUKI_WAVE_LIFE,drawGroundWave,drawPowerStar} from './adventure-kuki-slam.js';
import {HEART_ORBIT_END,HEART_LAUNCH_END,HEART_FALL_TIME,HEART_IMPACT_RADIUS,createHeartMeteor,stepHeartMeteor,heartImpactTargets} from './adventure-heart-meteor.js';
import {loadWeaponPickups,drawWeaponPickup} from './weapon-pickups.js';
import {weaponMultiplier,rollWeaponDrop,collectWeapon,wearWeapon,weaponDirection} from './adventure-weapons.js';
import {drawWeaponPose} from './weapon-motion.js';
import {EXPLORATION_HOUSE,explorationHouseCollider,blocksPoint} from './adventure-collision.js';
import {loadEnvironment,drawEnvironmentProp,drawEnvironmentGround} from './adventure-environment.js';
import {startSwitch,stepSwitch,switchVisual,visibleShake} from './adventure-switch.js';
import {installAppTouchPolicy} from './app-touch.js';
installAppTouchPolicy();
import {OFFENSE_BASE,OUTPOST_MAX_HP,createOffense,offenseProgress,stepOffense,offenseDamage} from './adventure-offense.js';
import {drawOutpost,drawOutpostPart} from './adventure-offense-art.js';
import {bindImmediateAction,bindMovementPointer,installGameTouchGuards} from './adventure-input.js';
import {createAdventureWallet} from './adventure-wallet.js';
import {mountAdventureProgress} from './adventure-progress-view.js';
import {characterStats,rollAttack} from '../shared/adventure-progression.js';
import {createEnemies,stepEnemy,ENEMY_RULES} from './adventure-enemies.js';
import {facingForVector} from '../shared/pet-space.js';
import './adventure.css';
import {requestCriticalHitStop,consumeHitStop,MAX_CHARGE,CHARGE_DELAY,SPIN_TICK,skillPlan,advanceSpin,recoverPet,skillHits,createObstacles,gainBasicGauge,spendGauge,eatPowerHeart,powerMultiplier} from './adventure-model.js';
const base=import.meta.env.BASE_URL,root=document.querySelector('#adventure');
const gameMusic=createGameMusic({base,mode:new URLSearchParams(location.search).get('mode')||'explore'});
const combatAudio=createCombatAudio({base});void combatAudio.preload();
let soundMuted=false;try{soundMuted=localStorage.getItem('twoplace:game-muted')==='1';}catch{}combatAudio.setMuted(soundMuted);gameMusic.setMuted(soundMuted);
document.addEventListener('pointerdown',()=>{combatAudio.unlock();gameMusic.unlock();},{capture:true,passive:true});document.addEventListener('keydown',()=>{combatAudio.unlock();gameMusic.unlock();},{capture:true});window.addEventListener('pagehide',()=>{combatAudio.stop();gameMusic.stop();});
root.innerHTML=`<div class="adventure-app"><header class="adventure-top"><div><div class="eyebrow">MOMO & KUKI · PLAY LAB</div><h1>별잠산의 작은 개척자들<span>CHARGE & SWITCH</span></h1></div><div class="top-actions"><button data-home>‹ 메인화면으로</button><button data-help>조작 안내</button><button data-pause>일시정지</button><button data-reset>처음부터</button></div></header><section class="duo-hud" aria-label="캐릭터 상태">${['momo','kuki'].map((id,i)=>`<article class="fighter" data-fighter="${id}"><img src="${base}pets/${i?'kuki':'mochi'}-standing-v2.png" alt=""><div class="fighter-body"><div class="fighter-title"><strong>${i?'쿠키':'모모'}</strong><span data-state>출전</span></div><div class="meter-row"><span>HP</span><div class="meter"><i data-hp></i></div><small data-hp-text>100</small></div><div class="meter-row stamina"><span>스태미나</span><div class="meter"><i data-sp></i></div><small data-sp-text>100</small></div><div class="meter-row skill-meter"><span>스킬</span><div class="meter"><i data-gauge></i></div><small data-gauge-text>0/100</small></div><small class="power-badge" data-power hidden></small></div></article>`).join('')}</section><section class="stage"><canvas tabindex="0" aria-label="별잠산 액션 게임. WASD 또는 방향키 이동, J 공격, 스페이스 차지 후 놓기, Q 교체"></canvas><div class="mission"><small data-run-clock>플레이 00:00</small><strong>나무 50개와 바위 30개를 정리해요</strong><p data-progress>나무 0 · 바위 0 정리</p><p data-enemy-status>숲 방울이 · 대기 중</p></div><div class="location">별잠산 · 탐험 테스트</div><div class="charge-readout" hidden><strong></strong><span></span><div class="charge-bar"><i></i></div></div><div class="stage-message" hidden><strong></strong><span></span></div></section><div class="under-stage"><span data-status role="status">나무는 모모로 넓게, 단단한 바위는 쿠키로 한 방에!</span></div><section class="play-controls" aria-label="게임 조작"><div class="joystick" role="application" aria-label="드래그해서 이동"><b></b></div><div class="gauge-panel"><div class="gauge-heading"><strong data-gauge-name>하트 팡!</strong><span data-gauge-value>0 / 100</span></div><div class="skill-track" role="progressbar" aria-label="스킬 게이지" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><i></i></div><div class="gauge-bottom"><small data-gauge-help>공격 적중 +10 · 교체해도 유지</small><button data-gauge-skill disabled>게이지 스킬 <kbd>E</kbd></button></div></div><div class="control-hint"><kbd>WASD / 방향키</kbd> 이동 · <kbd>J</kbd> 공격<br><kbd>SPACE</kbd> 누르고 차지 → 놓기 · <kbd>Q</kbd> 교체<br>대기 회복: HP +0.5/s · 스태미나 +2%/초</div><div class="action-buttons"><button data-basic>공격<small>J · 소모 없음</small></button><button class="special" data-special>차지 필살기<small>누르기 → 놓아서 발동</small></button><button class="switch" data-switch>교체<small>Q · 쿠키로</small></button></div></section><p class="prototype-note">로컬 프로토타입 · 실제 커플방 하트와 무관해요 · 길의 붉은 가시덤불은 HP를 깎아요 · 숲 방울이: 접근하면 추격 / 멀어지면 귀환 · 진행은 저장되지 않아요</p></div><dialog class="help-dialog"><h2>필요한 만큼만, 차지!</h2><p><strong>모모</strong>는 차지한 만큼 계속 회전해요. 발동 후에는 멈출 수 없지만 이동 방향은 바꿀 수 있어요.</p><p><strong>쿠키</strong>는 몸을 한 바퀴 돌며 꼬리 끝 별로 후려쳐요. 차지가 길수록 한 방의 위력이 커져요.</p><p>누른 직후 게이지가 나타나고, 0.5초 준비 후 3초에 걸쳐 충전돼요. 0.5초 안에 놓으면 공격과 소모 없이 취소돼요. 차지 중 이동속도는 절반이에요. 누르는 동안 예상 지속시간·위력과 스태미나 소모를 확인하세요. 스태미나가 부족해도 게이지는 끝까지 차올라요. 모모는 회전 중 스태미나를 쓰고 0이면 멈춰요. 쿠키는 필요한 스태미나 대비 실제 사용량 비율만큼 위력이 적용돼요.</p><p>타격할 때 2% 확률로 전용 무기가 나와요. 모모는 하트봉, 쿠키는 별망치만 주울 수 있어요. 무기는 공격과 차지 피해를 1.5배로 높이고, 적중한 휘두르기 10회 후 사라져요. 여러 대상을 함께 맞혀도 1회만 소모하며, 다시 주우면 내구도가 10회로 회복돼요.</p><p>교체하면 정면으로 손을 들고 0.5초 준비한 뒤 하늘로 올라가요. 다음 친구가 내려와 착지하며, 교체 연출 중과 착지 후 1초는 무적이에요.</p><p>대기 중인 친구는 HP와 스태미나를 회복해요. HP 0인 친구는 자연 회복하지 못해요. HP 회복약으로 출전 친구를 다시 일으킬 수 있어요. 출전 중에는 공격하지 않을 때 스태미나만 4초마다 1% 회복해요.</p><p>기본 공격 적중 시 게이지 +10. 차지 필살기로 적을 맞히면 타격마다 모모 +1, 쿠키 +2가 차요. 게이지 100에서 필살기 버튼이나 E로 사용해요. 모모는 하트 운석을 0.5초 간격으로 5번 떨어뜨려 매번 주변 적에게 기본 공격력만큼 피해를 줘요. 마지막 착지에서 하트 5개가 퍼져요. 쿠키가 먹으면 공격력 +20%, 1개당 +10초(최대 90초). 대기 중 버프 시간은 멈춰요. 쿠키의 별똥별은 넓은 범위에 기본 공격 5회분의 피해를 주고, 적을 3초간 기절시켜요. 떨어진 노란 별 5개는 모모가 주울 수 있어요. 두 필살기 모두 공격력 버프와 무기 효과가 적용돼요.</p><p>숲 방울이는 240 거리 안에서 발견하면 쫓아와요. 350 이상 멀어지거나 자기 자리에서 440 이상 벗어나면 원래 자리로 돌아가요. 돌아가는 동안은 재추격하지 않아요. 가까이 오면 공격 준비 표시 후 타격하니 피해 보세요. 공격·차지·스킬로 퇴치할 수 있어요.</p><p>지도를 클릭하거나 터치하면 그곳으로 이동해요. 모바일에서는 왼쪽 조이스틱을 드래그하세요. 필드에서 나무 50개와 바위 30개를 없애면 완료! 적 처치는 개척 목표에 포함되지 않아요.</p><button data-close-help>시작하기</button></dialog>`;
const $=s=>root.querySelector(s),canvas=$('canvas'),ctx=canvas.getContext('2d'),stage=$('.stage');
// Keep mission information outside the field and separate the two thumb zones.
const mission=$('.mission');$('.adventure-top>div:first-child').append(mission);
const skillHelp=$('[data-gauge-help]');$('.gauge-heading').append(skillHelp);
$('.action-buttons').append($('[data-gauge-skill]'));
$('.gauge-bottom').remove();
const images={};for(const id of ['momo','kuki'])for(const pose of ['front','side','back','diagonal-front','diagonal-back']){const pet=id==='momo'?'mochi':'kuki',v=pose.startsWith('diagonal')?(id==='kuki'?'v3':'v1'):'v3',file=pose==='front'?`${pet}-standing-v2.png`:`${pet}-${pose}-${v}.png`;const image=new Image();image.src=base+'pets/'+file;images[id+'-'+pose]=image;}

loadWeaponPickups(base);
const weaponImages={};for(const id of ['momo','kuki']){const im=new Image();im.src=base+'adventure/weapons/'+id+'-weapon-motion-v3.png';weaponImages[id]=im;}
const switchImages={};for(const id of ['momo','kuki']){const im=new Image();im.src=base+'adventure/'+id+'-switch-v1.png';switchImages[id]=im;}
const knockoutSprite=new Image();knockoutSprite.src=base+'pets/furniture-poses-v1.png';
const momoSpin=new Image();momoSpin.src=base+'adventure/momo-spin-v1.png';
installGameTouchGuards(document);
const modeParams=new URLSearchParams(location.search);
const offenseMode=modeParams.get('mode')==='offense';
const defenseMode=modeParams.get('mode')==='defense';
document.documentElement.classList.toggle('offense-mode',offenseMode||defenseMode);
const wallet=createAdventureWallet();
const demoParams=new URLSearchParams(location.search);
const heartMeteorDemo=!offenseMode&&!defenseMode&&demoParams.get('demo')==='1'&&demoParams.get('heartMeteorTest')==='1';
const kukiSlamDemo=!offenseMode&&!defenseMode&&demoParams.get('demo')==='1'&&demoParams.get('kukiSlamTest')==='1';
const skillDemo=heartMeteorDemo||kukiSlamDemo;
const skillTest=wallet.local&&['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&demoParams.get('skillTest')==='1';
const testSkills={momo:{charge:1,ultimate:1},kuki:{charge:1,ultimate:1}};
function skillLevel(id,key){return skillBalance((skillTest?testSkills:wallet.profile.skills)?.[id]?.[key]).level;}
const modes=document.createElement('button');modes.textContent='모험 선택';modes.onclick=()=>location.replace(base+'adventure-menu.html'+(wallet.local?'?demo=1':''));$('.top-actions').prepend(modes);
const soundToggle=document.createElement('button');function soundLabel(){soundToggle.textContent=soundMuted?'소리 꺼짐':'소리 켜짐';soundToggle.setAttribute('aria-pressed',String(!soundMuted));}soundToggle.onclick=()=>{soundMuted=!soundMuted;combatAudio.setMuted(soundMuted);gameMusic.setMuted(soundMuted);try{localStorage.setItem('twoplace:game-muted',soundMuted?'1':'0');}catch{}soundLabel();};soundLabel();$('.top-actions').append(soundToggle);
if(defenseMode)mountDefenseHud();
if(offenseMode){$('.adventure-top h1').textContent='방울이 산채 원정';$('.location').textContent='원정 · 본체 파괴';$('.stage').insertAdjacentHTML('beforeend','<div class="outpost-health-panel"><div class="outpost-health-heading"><strong>산채 본체</strong><span data-outpost-hp>'+OUTPOST_MAX_HP.toLocaleString()+' / '+OUTPOST_MAX_HP.toLocaleString()+'</span></div><div class="outpost-health" role="progressbar" aria-label="산채 본체 HP" aria-valuemin="0" aria-valuemax="'+OUTPOST_MAX_HP+'"><i></i></div></div>');}

function returnHome(){location.replace(base+(wallet.local?'demo.html?view=home':'index.html'));}
$('[data-home]').onclick=returnHome;
window.twoPlaceBack=()=>{const dialog=document.querySelector('dialog[open]');if(dialog){if(dialog.classList.contains('roulette-dialog')||dialog.classList.contains('stage-clear-dialog'))return true;dialog.close();return true;}returnHome();return true;};let progressUI,round=null;
let state,keys=new Set(),stick={x:0,y:0},chargeSource=null,specialPointer=null,clock=0,last=0,hudClock=0,w=1000,h=600,dpr=1,paused=false,loading=true,loadError=false,shake=0;
const camera={x:0,y:0,scale:1};
function usesMixedField(){return !round||round.fieldVersion===EXPLORATION_FIELD_VERSION;}
function reset(){combatAudio.reset();loading=false;loadError=false;shake=0;state={active:'momo',pets:{momo:{hp:100,sp:100,gauge:0,powerTime:0},kuki:{hp:100,sp:100,gauge:0,powerTime:0}},p:{x:550,y:1040,fx:1,fy:0},objects:defenseMode?[]:createObstacles(round?.seed,usesMixedField()?EXPLORATION_FIELD_VERSION:1),cleared:[],enemies:[],defeated:0,particles:[],texts:[],weaponDrops:[],hearts:[],kukiWave:null,heartMeteor:null,burst:null,attack:null,charge:null,basic:0,invuln:0,swap:0,target:null,trees:0,rocks:0,won:false,clearDelay:0,clearAge:0,dead:false,hitStop:0,switching:null,knockout:null};if(defenseMode){
 state.defense=createDefense();
 Object.assign(state.p,DEFENSE_START,{fx:0,fy:-1});
 state.spawn=DEFENSE_START;
 }else if(offenseMode){state.offense=createOffense();state.objects=state.offense.objects;Object.assign(state.p,OFFENSE_BASE.start);state.spawn={...OFFENSE_BASE.start};state.enemies=[];}else state.enemies=createEnemies([...state.objects,explorationHouseCollider()],round?.enemyCount??24);if(skillDemo){state.objects=[];state.active=kukiSlamDemo?'kuki':'momo';state.pets[state.active].gauge=100;state.enemies=(kukiSlamDemo?[[-177,22],[164,-24],[15,65],[300,8]]:[[-64,-28],[62,-22],[10,54],[190,5]]).map(([dx,dy],i)=>({id:'heart-demo-'+i,type:'enemy',training:true,x:state.p.x+dx,y:state.p.y+dy,hp:kukiSlamDemo?150:2500,max:kukiSlamDemo?150:2500,radius:22,mode:'idle',flash:0,windup:0}));}state.colliders=defenseMode?[state.defense.house]:offenseMode?state.objects:[...state.objects,explorationHouseCollider()];if(wallet.local&&new URLSearchParams(location.search).get('weaponTest')==='1'){state.weaponDrops.push({owner:'momo',x:state.p.x-65,y:state.p.y,life:45},{owner:'kuki',x:state.p.x+65,y:state.p.y,life:45});}syncStats(true);keys.clear();stick={x:0,y:0};clock=0;chargeSource=null;specialPointer=null;paused=false;$('[data-pause]').disabled=false;$('[data-pause]').textContent='일시정지';$('.stage-message').hidden=true;status('나무는 모모로 넓게, 단단한 바위는 쿠키로 한 방에!');hud();}
function syncStats(fill=false){if(!state)return;for(const id of ['momo','kuki']){const stats=characterStats(id,wallet.profile.stats[id]),p=state.pets[id],oldHp=p.maxHp??100,oldSp=p.maxSp??100;p.maxHp=stats.maxHp;p.maxSp=stats.maxSp;p.hp=fill?p.maxHp:p.hp>0?Math.min(p.maxHp,p.hp+Math.max(0,p.maxHp-oldHp)):0;p.sp=fill?p.maxSp:Math.min(p.maxSp,p.sp+Math.max(0,p.maxSp-oldSp));}}
function activePowerMultiplier(id){return id==='momo'&&state.pets.momo.powerTime>0?1.2:powerMultiplier(id,state.pets[id]);}
function damageMultiplier(id){return activePowerMultiplier(id)*weaponMultiplier(state.pets[id]);}
function attackRoll(base=null){const id=state.active,hit=rollAttack(id,wallet.profile.stats[id]),normal=id==='momo'?11.5:15;return {...hit,damage:(base===null?hit.damage:base*hit.damage/normal)*damageMultiplier(id)};}
async function newRound(restart=false){gameMusic.setReady(false);loading=true;loadError=false;togglePause(true);status('탐험 기록을 준비하고 있어요…');try{await Promise.all([loadEnvironment(),knockoutSprite.decode().catch(()=>{})]);if(!skillDemo)round=await wallet.start(restart,defenseMode?'defense':offenseMode?'offense':'explore');reset();gameMusic.setPaused(false);gameMusic.setReady(true);progressUI?.refresh();status(defenseMode?'집을 향해 오는 방울이를 막으세요. 첫 공격이 곧 시작돼요.':kukiSlamDemo?'별똥별 쿵 시안 · E 또는 필살기 버튼을 눌러 보세요.':heartMeteorDemo?'하트 팡 테스트 · E 또는 필살기 버튼을 눌러 보세요.':offenseMode?'주변에서 몰려오는 적을 상대하며 산채 본체를 파괴하세요.':(wallet.local?'테스트 탐험':'커플방 탐험')+(usesMixedField()?' · 나무 50개와 바위 30개를 정리하세요!':' · 장애물 100개 정리 후 룰렛 보상!'));}catch(e){loading=false;loadError=true;status(e.message+' · 서버에 새 GAS 코드가 필요할 수 있어요.');togglePause(true);}}
function status(text){$('[data-status]').textContent=text;}
function float(x,y,text,color='#fff1b2',critical=false){state.texts.push({x,y,text,color,t:1.2,critical});}
function particles(x,y,color,n=14){for(let i=0;i<n;i++){const a=Math.random()*Math.PI*2,s=30+Math.random()*130;state.particles.push({x,y,vx:Math.cos(a)*s,vy:Math.sin(a)*s-45,t:.35+Math.random()*.45,color,size:2+Math.random()*5});}}
function starBurst(x,y,power=0){
 const count=8+Math.round(power*9),colors=['#ffe49a','#ffd16f','#fff4c7','#f7c2d7'];
 for(let i=0;i<count;i++){const angle=i/count*Math.PI*2+Math.random()*.3,speed=65+Math.random()*100+power*75,life=.45+Math.random()*.35;state.particles.push({x,y,vx:Math.cos(angle)*speed,vy:Math.sin(angle)*speed-30,t:life,life,color:colors[i%colors.length],size:4+Math.random()*5+power*4,star:true,spark:i%3===0,angle:Math.random()*6.28,spin:(Math.random()-.5)*10});}
 state.particles.push({x,y,vx:0,vy:0,t:.22,life:.22,color:'#fff1b5',size:23+power*26,burst:true});
 if(state.particles.length>300)state.particles.splice(0,state.particles.length-300);
}
function heartPose(heart){
 const age=heart.age??2,angle=heart.phase/5*Math.PI*2+Math.min(age,1)*Math.PI*2*1.25,ox=heart.originX??heart.x,oy=heart.originY??heart.y;
 if(heart.split){const t=Math.min(1,age/.55),ease=1-(1-t)**3;return {x:ox+(heart.x-ox)*ease,y:oy+(heart.y-oy)*ease,z:t<1?Math.sin(t*Math.PI)*38:Math.sin(clock*3+heart.phase)*3,scale:.65+.35*ease};}
 if(age<1)return {x:ox+Math.cos(angle)*72,y:oy+Math.sin(angle)*29,z:65+Math.sin(age*Math.PI)*10,scale:.75+.25*Math.min(1,age*5)};
 if(age<1.65){const t=(age-1)/.65,ease=t*t*(3-2*t),sx=ox+Math.cos(angle)*72,sy=oy+Math.sin(angle)*29;return {x:sx+(heart.x-sx)*ease,y:sy+(heart.y-sy)*ease,z:65*(1-t)+Math.sin(t*Math.PI)*15,scale:1};}
 return {x:heart.x,y:heart.y,z:Math.sin(clock*3+heart.phase)*3,scale:1};
}
function drawHeart(heart){const pos=heartPose(heart);ellipse(pos.x,pos.y+7,Math.max(3,12*(1-pos.z/150)),4,'#73445333');if(heart.kind==='star')drawPowerStar(ctx,pos.x,pos.y-13-pos.z,pos.scale,Math.min(1,heart.life/2));else drawHeartSprite(pos.x,pos.y-13-pos.z,pos.scale,Math.min(1,heart.life/2));}
function drawHeartSprite(x,y,scale,alpha=1){ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.shadowColor='#ffb9d4';ctx.shadowBlur=12;ctx.fillStyle='#f8a7c4';ctx.strokeStyle='#fff2f7';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(0,12);ctx.bezierCurveTo(-25,-3,-14,-21,0,-10);ctx.bezierCurveTo(14,-21,25,-3,0,12);ctx.fill();ctx.stroke();ctx.restore();}
function drawStar(q){
 ctx.save();ctx.translate(q.x,q.y);ctx.rotate(q.angle||0);const age=1-q.t/q.life,scale=Math.min(1,age*7)*Math.min(1,q.t*5);ctx.scale(scale,scale);ctx.shadowColor=q.color;ctx.shadowBlur=q.spark?5:8;ctx.fillStyle=q.color;ctx.strokeStyle='#fff8dc';ctx.lineWidth=1;ctx.lineJoin='round';ctx.beginPath();const points=q.spark?4:5;
 for(let i=0;i<points*2;i++){const a=i*Math.PI/points-Math.PI/2,r=i%2?q.size*(q.spark?.22:.46):q.size;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
function combatTargets(){return [...state.objects.filter(o=>o.type!=='core'),...state.enemies];}
function damageObject(o,damage,critical=false,owner=state.active){if(o.hp<=0)return;const drop=rollWeaponDrop(owner,o.x,o.y);if(drop)state.weaponDrops.push(drop);if(offenseMode)damage=offenseDamage(o,damage);requestCriticalHitStop(state,critical);o.hp=Math.max(0,o.hp-damage);o.flash=.12;triggerHitJolt(o);float(o.x,o.y-65,Math.round(damage).toString(),critical?'#ffe05e':'#ffffff',critical);starBurst(o.x,o.y-35,Math.min(1,damage/180));shake=Math.max(shake,critical?7:3);if(o.type==='enemy'&&o.hp>0&&o.mode!=='return'&&!o.training){o.mode='chase';o.repath=0;}if(o.hp===0&&o.type==='enemy'){o.mode='dead';state.defeated++;float(o.x,o.y-85,'방울이 퇴치!','#ffe0ae');particles(o.x,o.y-25,'#c1d2a1',20);return;}if(o.hp===0){state.cleared.push(o.id);particles(o.x,o.y-25,o.type==='tree'?'#a0b46d':'#c6cebb',20);if(o.type==='tree')state.trees++;else if(o.type==='rock')state.rocks++;}}
function hitChargedTargets(attack,inRange){
 const pet=state.pets[attack.id],gaugePerEnemy=attack.id==='momo'?1:2;
 let connected=false;
 for(const target of combatTargets()){
  if(target.hp<=0||!inRange(target))continue;
  const hit=attackRoll(attack.damage);
  damageObject(target,hit.damage,hit.critical);
  if(target.type==='enemy')pet.gauge=Math.min(100,pet.gauge+gaugePerEnemy);
  connected=true;
 }
 if(attack.id==='momo')combatAudio.spinHit(connected);
 wearWeapon(pet,connected);
}
function beginCharge(source){if(paused||state.knockout||state.switching||state.burst||state.attack||state.charge||state.dead||state.won)return false;state.charge={time:0};chargeSource=source;state.target=null;combatAudio.charge(true);return true;}
function cancelCharge(){combatAudio.charge(false);state.charge=null;chargeSource=null;specialPointer=null;}
function releaseCharge(source){if(!state.charge||source!==chargeSource)return;const plan=skillPlan(state.active,state.charge.time,state.pets[state.active].sp,skillLevel(state.active,'charge'));cancelCharge();if(!plan?.ready){status('차지 준비 취소 · 0.5초 뒤부터 힘이 모여요. 스태미나 소모 없음');hud();return;}if(plan.cost<=0){status('스태미나가 0이라 기술을 쓸 수 없어요. 교체해서 회복해 주세요.');hud();return;}if(state.active==='kuki')state.pets.kuki.sp-=plan.cost;state.attack={...plan,id:state.active,t:0,tick:0,hit:false};if(state.active==='momo')combatAudio.play('momo_charge_wind');status(state.active==='momo'?`귀 회오리 ${plan.duration.toFixed(1)}초! 이동 방향을 조절하세요.`:`별꼬리 회전! 공격 배율 ${Math.round(plan.damage/15*100*powerMultiplier(state.active,state.pets[state.active]))}% · 스태미나 ${Math.round(plan.cost)} 소모`);}
function basic(){if(paused||state.knockout||state.switching||state.burst||state.attack||state.charge||state.basic>0||state.dead||state.won)return;state.basicWeapon=state.pets[state.active].weaponDurability>0;state.basic=.28;let hit=false;const strike=attackRoll();for(const o of combatTargets()){if(o.hp>0&&skillHits(state.p,o,'kuki')&&Math.hypot(o.x-state.p.x,o.y-state.p.y)<88+o.radius){damageObject(o,strike.damage,strike.critical);hit=true;}}if(hit)combatAudio.basicHit();wearWeapon(state.pets[state.active],hit);gainBasicGauge(state.pets[state.active],hit);status(hit?'공격 적중! 게이지 +10 · 100이 되면 중앙 스킬 버튼 또는 E':'공격은 실제로 맞았을 때만 게이지가 차요.');hud();}
function gaugeSkill(){
 if(paused||state.knockout||state.switching||state.burst||state.attack||state.charge||state.basic>0||state.dead||state.won||(state.active==='momo'&&state.heartMeteor))return;
 if(!spendGauge(state.pets[state.active])){status('공격을 적중시켜 게이지 100을 모아 주세요.');return;}
 state.target=null;state.burst={id:state.active,t:0,duration:state.active==='momo'?HEART_LAUNCH_END:1,hit:false};
 if(state.active==='momo'){state.heartMeteor=createHeartMeteor(state.p);combatAudio.play('momo_skill_effect');}
 status(state.active==='momo'?'하트 팡! 시전 위치 근처에 하트 운석 다섯 개가 떨어져요.':'별똥별 쿵! 넓은 범위 공격 · 적 3초 기절');hud();
}
function dropHearts(p=state.p,split=false,kind='heart'){for(let i=0;i<5;i++){let x,y;for(let attempt=0;attempt<40;attempt++){const a=i/5*Math.PI*2+attempt*.31,r=65+attempt*3;x=Math.max(100,Math.min(2500,p.x+Math.cos(a)*r));y=Math.max(160,Math.min(1700,p.y+Math.sin(a)*r));if(!state.colliders.some(o=>blocksPoint(o,x,y,28)))break;}state.hearts.push({x,y,life:30,phase:i,age:0,split,kind,originX:p.x,originY:p.y});}if(state.hearts.length>30)state.hearts.splice(0,state.hearts.length-30);}

function swap(){if(paused||state.knockout)return;if(!startSwitch(state)){status(state.switching?'교체 중이에요.':state.pets[state.active==='momo'?'kuki':'momo'].hp<=0?'다른 친구가 쓰러져 있어요.':'발동한 기술이 끝난 뒤 교체할 수 있어요.');return;}status((state.active==='momo'?'모모':'쿠키')+' 교체 준비! · 연출 중 무적');hud();}
function move(dx,dy,dt){const p=state.p,speed=(state.charge?92:184),len=Math.hypot(dx,dy);if(!len)return;p.fx=dx/len;p.fy=dy/len;const mx=p.fx*speed*dt,my=p.fy*speed*dt;function clear(x,y){return !state.colliders.some(o=>blocksPoint(o,x,y,12));}const nx=Math.max(90,Math.min(2510,p.x+mx)),ny=Math.max(160,Math.min(1710,p.y+my));if(clear(nx,p.y))p.x=nx;if(clear(p.x,ny))p.y=ny;}
const thorns=[{x:1030,y:1040,r:65},{x:1520,y:690,r:55},{x:1870,y:1040,r:65}];
function update(dt){if(state.knockout&&!state.knockout.completed&&!state.dead){clock+=dt;shake=0;const outcome=stepKnockout(state,dt);if(outcome==='switch'){Object.assign(state.p,state.spawn||{x:550,y:1040});status('다른 친구가 나왔어요. 1초간 무적이에요.');}else if(outcome==='defeat'){message('잠깐 쉬어갈까요?','상단 처음부터 버튼으로 다시 도전할 수 있어요.');}hud();return;}const enemyDt=ultimateEnemyDelta(state.burst,dt);clock+=dt;const p=state.p;state.swap=Math.max(0,state.swap-dt);state.basic=Math.max(0,state.basic-dt);state.invuln=Math.max(0,state.invuln-dt);shake=Math.max(0,shake-dt*18);if(!state.dead&&!state.won){
 state.enemyClock=(state.enemyClock||0)+enemyDt;
 if(state.switching){const tag=stepSwitch(state,dt);if(tag.changed)particles(p.x,p.y-40,'#fff1b2',16);if(tag.landed){starBurst(p.x,p.y-15,.35);status((state.active==='momo'?'모모':'쿠키')+' 착지! · 1초간 무적');}}
 if(state.charge)state.charge.time=Math.min(MAX_CHARGE,state.charge.time+dt);
 let dx=(keys.has('d')||keys.has('arrowright')?1:0)-(keys.has('a')||keys.has('arrowleft')?1:0)+stick.x,dy=(keys.has('s')||keys.has('arrowdown')?1:0)-(keys.has('w')||keys.has('arrowup')?1:0)+stick.y;
 if((dx||dy)&&state.target)state.target=null;if(!dx&&!dy&&state.target){const tx=state.target.x-p.x,ty=state.target.y-p.y;if(Math.hypot(tx,ty)<8)state.target=null;else{dx=tx;dy=ty;}}
 const oldX=p.x,oldY=p.y;if(!state.burst&&!state.switching)move(dx,dy,dt);p.walking=Math.hypot(p.x-oldX,p.y-oldY)>.01;
 if(state.burst){const b=state.burst;b.t+=dt;if(b.id==='kuki'&&!b.hit&&b.t>=KUKI_SLAM_IMPACT_TIME){b.hit=true;impactKukiSlam(p);}if(b.t>=b.duration)state.burst=null;}
 if(state.heartMeteor&&stepHeartMeteor(state.heartMeteor,dt,impactHeartMeteor))state.heartMeteor=null;
 if(!state.switching){const pet=state.pets[state.active];pet.powerTime=Math.max(0,pet.powerTime-dt);for(const heart of state.hearts){const star=heart.kind==='star';if(state.active===(star?'momo':'kuki')&&heart.age>=(heart.split?.55:1.65)&&heart.life>0&&Math.hypot(heart.x-p.x,heart.y-p.y)<30){heart.life=0;eatPowerHeart(pet);float(p.x,p.y-90,'공격력 +20% · +10초',star?'#ffe994':'#ffcfdf');starBurst(p.x,p.y-35,.2);}}}
 for(const heart of state.hearts){heart.age+=dt;if(heart.age>=(heart.split?.55:1.65))heart.life-=dt;}state.hearts=state.hearts.filter(heart=>heart.life>0);
 if(state.attack){
  const attack=state.attack;
  if(attack.id==='momo'){
   const step=advanceSpin(attack,state.pets.momo,dt);
   attack.tick-=step.activeDt;
   if(step.activeDt>0&&attack.tick<=0){
    attack.tick=SPIN_TICK;
    hitChargedTargets(attack,target=>skillHits(p,target,'momo'));
   }
   if(step.done){
    state.attack=null;
    if(state.pets.momo.sp===0)status('스태미나가 0이 되어 회오리가 멈췄어요.');
   }
  }else{
   attack.t+=dt;
   if(!attack.hit&&attack.t>=.24){
    attack.hit=true;combatAudio.play('cookie_charge');
    hitChargedTargets(attack,target=>Math.hypot(target.x-p.x,target.y-p.y)<78+target.radius);
    shake=7;
    starBurst(p.x+p.fx*45,p.y-25+p.fy*30,attack.power);
   }
   if(attack.t>=attack.duration)state.attack=null;
  }
 }

 for(const drop of state.weaponDrops){drop.life-=dt;if(Math.hypot(drop.x-p.x,drop.y-p.y)<32&&collectWeapon(state.pets[state.active],drop,state.active)){drop.life=0;float(p.x,p.y-100,(state.active==='momo'?'하트봉':'별망치')+' 획득! ×1.5 · 10회',state.active==='momo'?'#ffb7d5':'#ffe495');}}state.weaponDrops=state.weaponDrops.filter(d=>d.life>0);
 for(const id of ['momo','kuki'])if(id!==state.active)recoverPet(state.pets[id],dt,true);else if(!state.burst&&!state.attack&&!state.charge&&!state.basic)recoverPet(state.pets[id],dt,false);
 if(enemyDt>0){
  if(offenseMode){const fresh=stepOffense(state.offense,state.enemies,state.objects,enemyDt,p);if(fresh.length){state.enemies=state.enemies.filter(e=>e.hp>0);state.enemies.push(...fresh);float(OFFENSE_BASE.spawn.x,OFFENSE_BASE.spawn.y-65,'집 지킴이 +'+fresh.length,'#ffd3ad');status('증원 '+state.offense.wave+'차 · 사방에서 집 지킴이가 몰려와요!');}}
  if(defenseMode)updateDefense(enemyDt);
  else for(const enemy of state.enemies)if(stepEnemy(enemy,p,offenseMode?state.colliders.filter(o=>!o.enemyPass):state.colliders,enemyDt))hurtPlayer(10);
  if(!offenseMode&&!defenseMode&&thorns.some(t=>Math.hypot(t.x-p.x,t.y-p.y)<t.r))hurtPlayer(12);
 }

 if(offenseMode&&offenseProgress(state.objects).complete){beginClear();}
 const explorationCleared=usesMixedField()
  ?state.trees>=EXPLORATION_GOALS.tree&&state.rocks>=EXPLORATION_GOALS.rock
  :state.trees+state.rocks>=100;
 if(!offenseMode&&!defenseMode&&explorationCleared)beginClear();
 }
 if(state.clearDelay>0){state.clearAge+=dt;state.clearDelay=Math.max(0,state.clearDelay-dt);if(!state.clearDelay){if(defenseMode)progressUI.roulette(round.id,state.enemies.filter(enemy=>enemy.hp<=0).map(enemy=>enemy.id));else if(offenseMode)completeOffense();else progressUI.roulette(round.id,usesMixedField()?explorationProof(state.objects):state.cleared.slice(0,100));}}
 for(const o of combatTargets()){o.flash=Math.max(0,o.flash-dt);stepHitJolt(o,dt);}if(state.defense)stepHitJolt(state.defense.house,dt);for(const q of state.particles){q.x+=q.vx*dt;q.y+=q.vy*dt;q.vy+=(q.star?110:q.burst?0:190)*dt;q.t-=dt;if(q.star)q.angle+=q.spin*dt;}state.particles=state.particles.filter(q=>q.t>0);for(const q of state.texts){q.y-=23*dt;q.t-=dt;}state.texts=state.texts.filter(q=>q.t>0);
 hudClock+=dt;if(hudClock>.08){hudClock=0;hud();}
}
function hurtPlayer(damage){if(state.knockout||state.switching||state.invuln||state.burst||state.dead||state.won)return;const p=state.p;state.pets[state.active].hp=Math.max(0,state.pets[state.active].hp-damage);state.invuln=1;float(p.x,p.y-85,'HP −'+damage,'#ffc0c0');shake=5;if(!state.pets[state.active].hp){cancelCharge();combatAudio.stop();beginKnockout(state);keys.clear();stick={x:0,y:0};shake=0;status((state.active==='momo'?'모모':'쿠키')+'가 쓰러졌어요…');hud();}}
function message(title,copy){const m=$('.stage-message');m.hidden=false;m.querySelector('strong').textContent=title;m.querySelector('span').textContent=copy;}
function hud(){progressUI?.refresh();for(const id of ['momo','kuki']){const c=$(`[data-fighter="${id}"]`),pet=state.pets[id],reserve=id!==state.active;c.classList.toggle('active',!reserve);c.querySelector('[data-state]').textContent=pet.hp<=0?'쓰러짐':reserve?(pet.hp>=100&&pet.sp>=100?'대기 · 회복 완료':'회복 중 ↑ HP · SP'):'PLAYING · 출전';c.querySelector('[data-hp]').style.width=pet.hp/pet.maxHp*100+'%';c.querySelector('[data-sp]').style.width=pet.sp/pet.maxSp*100+'%';c.querySelector('[data-hp-text]').textContent=Math.ceil(pet.hp)+'/'+pet.maxHp;c.querySelector('[data-sp-text]').textContent=Math.floor(pet.sp)+'/'+pet.maxSp;c.querySelector('[data-gauge]').style.width=pet.gauge+'%';c.querySelector('[data-gauge-text]').textContent=pet.gauge+'/100';const buff=c.querySelector('[data-power]');buff.hidden=!pet.powerTime;buff.textContent='공격력 +20% · '+Math.ceil(pet.powerTime)+'초'+(reserve?' (대기 중 정지)':'');}
 const pet=state.pets[state.active],ready=pet.gauge>=100,gaugeButton=$('[data-gauge-skill]');$('[data-gauge-name]').textContent=state.active==='momo'?'하트 팡!':'별똥별 쿵!';$('[data-gauge-value]').textContent=pet.gauge+' / 100';$('.skill-track i').style.width=pet.gauge+'%';$('.skill-track').setAttribute('aria-valuenow',String(pet.gauge));$('.gauge-panel').classList.toggle('ready',ready);gaugeButton.disabled=!ready||(state.active==='momo'&&!!state.heartMeteor)||!!state.knockout||!!state.switching||!!state.burst||!!state.attack||!!state.charge||state.basic>0||paused||state.dead||state.won;gaugeButton.innerHTML='필살기<small>'+(state.burst?'사용 중':ready?'사용 가능':pet.gauge+' / 100')+'</small>';gaugeButton.setAttribute('aria-label','필살기 · '+(ready?'사용 가능':pet.gauge+' / 100 · 충전 중'));$('[data-gauge-help]').textContent=state.active==='momo'?'운석 5회 · 쿠키 공격력 +20% 하트':'기본 공격 ×5 · 3초 기절 · 모모 공격력 +20% 별';
 const elapsed=Math.floor((state.playTimeMs||0)/1000);$('[data-run-clock]').textContent='플레이 '+String(Math.floor(elapsed/60)).padStart(2,'0')+':'+String(elapsed%60).padStart(2,'0');
 if(offenseMode){const progress=offenseProgress(state.objects),bar=$('.outpost-health');bar.querySelector('i').style.width=progress.remainingHp/progress.maxHp*100+'%';bar.setAttribute('aria-valuenow',Math.ceil(progress.remainingHp));$('[data-outpost-hp]').textContent=Math.ceil(progress.remainingHp).toLocaleString()+' / '+progress.maxHp.toLocaleString()+' · '+Math.ceil(progress.remainingHp/progress.maxHp*100)+'%';}
 const living=state.enemies.filter(e=>e.hp>0);$('[data-enemy-status]').textContent='추격 '+living.filter(e=>e.mode==='chase').length+' · 귀환 '+living.filter(e=>e.mode==='return').length+' · 대기 '+living.filter(e=>e.mode==='idle').length;
 $('.mission strong').textContent=offenseMode?'산채 본체 파괴':skillDemo?'필살기 연습':usesMixedField()?`나무 ${Math.min(state.trees,EXPLORATION_GOALS.tree)}/${EXPLORATION_GOALS.tree} · 바위 ${Math.min(state.rocks,EXPLORATION_GOALS.rock)}/${EXPLORATION_GOALS.rock}`:`장애물 ${state.trees+state.rocks} / 100`;$('[data-progress]').textContent=offenseMode?`증원 ${state.offense.wave}차`:`적 ${state.defeated} / ${state.enemies.length} 퇴치`;
 if(defenseMode)updateDefenseHud();
 const charge=$('.charge-readout');charge.hidden=!state.charge&&!state.attack;if(state.charge){const plan=skillPlan(state.active,state.charge.time,state.pets[state.active].sp,skillLevel(state.active,'charge'));charge.querySelector('strong').textContent=!plan.ready?`차지 준비${state.active==='kuki'?' · 100%':''} · ${Math.max(0,CHARGE_DELAY-state.charge.time).toFixed(1)}초 후 충전`:state.active==='momo'?`귀 회오리 · 목표 ${plan.duration.toFixed(1)}초 / 가능 ${plan.usableDuration.toFixed(1)}초`:`별꼬리 회전 · 공격 배율 ${Math.round(plan.multiplier*100)}%`;charge.querySelector('span').textContent=plan.ready?(state.active==='momo'?`회전 중 초당 ${plan.drainRate.toFixed(1)} 소모 · 0이면 멈춤`:`적용 ${Math.round(plan.damage/15*100*powerMultiplier(state.active,state.pets[state.active]))}% · 스태미나 ${Math.round(plan.cost)} / ${Math.round(plan.requiredCost)}`):'0.5초 이내에 놓으면 취소 · 이동속도 50%';charge.querySelector('i').style.width=plan.power*100+'%';}else if(state.attack){const a=state.attack;charge.querySelector('strong').textContent=a.id==='momo'?`회전 중 · ${Math.min(a.duration-a.t,state.pets.momo.sp/a.drainRate).toFixed(1)}초 남음`:'별꼬리 회전 타격!';charge.querySelector('span').textContent=a.id==='momo'?'스태미나가 계속 줄어요 · 0이면 회전 종료':'보유 스태미나에 맞춘 위력으로 타격해요';charge.querySelector('i').style.width=Math.max(0,(1-a.t/a.duration)*100)+'%';}
 $('[data-special]').classList.toggle('holding',!!state.charge);$('[data-basic]').disabled=!!state.knockout||!!state.switching||paused||state.dead||state.won;$('[data-special]').disabled=!!state.knockout||!!state.switching||paused||state.dead||state.won;$('[data-switch]').disabled=!!state.knockout||!!state.switching||!!state.burst||!!state.attack||!!state.charge||state.swap>0||state.dead||state.won;$('[data-switch] small').textContent=state.switching?'교체 중 · 무적':`Q · ${state.active==='momo'?'쿠키':'모모'}로`;
}
function ellipse(x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function path(points,color,stroke){ctx.beginPath();points.forEach(([x,y],i)=>i?ctx.lineTo(x,y):ctx.moveTo(x,y));ctx.closePath();ctx.fillStyle=color;ctx.fill();if(stroke){ctx.strokeStyle=stroke;ctx.lineWidth=2;ctx.stroke();}}
function tree(o){const {x,y}=o;if(o.hp<=0){ellipse(x,y,20,8,'#a48d60');ellipse(x,y-3,16,6,'#dac08c');return;}if(drawEnvironmentProp(ctx,'tree',o,{width:66,height:144,player:state.p}))return;ellipse(x+7,y+6,49,15,'#334e3533');ctx.fillStyle='#8a6746';ctx.fillRect(x-9,y-70,18,71);ctx.fillStyle='#b08b5b';ctx.fillRect(x-7,y-63,6,61);for(let l=0;l<3;l++){const by=y-40-l*29,r=55-l*9;path([[x-r,by],[x-r*.65,by-20],[x,by-78],[x+r*.65,by-20],[x+r,by],[x,by+12]],o.flash?'#e5e6b4':['#607b48','#759054','#92a568'][l]);path([[x-r,by],[x,by-78],[x-7,by+5]],'#ffffff0c');} }
function rock(o){const {x,y}=o;if(o.hp<=0){ellipse(x,y,25,8,'#52614b33');for(let i=0;i<4;i++)path([[x-20+i*12,y],[x-15+i*12,y-9],[x-8+i*12,y+2]],'#9ca58c');return;}if(drawEnvironmentProp(ctx,'rock',o,{width:87,height:65,player:state.p}))return;ellipse(x+6,y+7,42,13,'#3c513433');path([[x-37,y-9],[x-28,y-45],[x-4,y-61],[x+26,y-43],[x+38,y-5],[x+17,y+8],[x-15,y+8]],o.flash?'#f5edcf':'#909e8b','#6a7b68');path([[x-28,y-45],[x-4,y-61],[x+26,y-43],[x+5,y-25]],'#bfC6ab');path([[x+5,y-25],[x+26,y-43],[x+38,y-5],[x+17,y+8]],'#788a79');if(o.hp<o.max){ctx.strokeStyle='#5c6d5e';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(x,y-40);ctx.lineTo(x-6,y-22);ctx.lineTo(x+3,y-14);ctx.lineTo(x-4,y);ctx.stroke();}}
function drawEnemy(e){if(e.hp<=0)return;const chase=e.mode==='chase',home=e.mode==='return',bob=Math.sin((state.enemyClock||0)*8+e.x*.01)*(e.mode==='idle'?1:3);ctx.save();ellipse(e.x,e.y+5,27,9,'#283f3438');ctx.translate(e.x,e.y+bob);if(e.windup>0){ctx.strokeStyle='#f4b293';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(0,4,52,24,0,0,Math.PI*2);ctx.stroke();}if(!drawEnvironmentProp(ctx,'enemy',{x:0,y:0,flash:e.flash},{width:66,height:76,anchor:5})){ctx.fillStyle=e.flash?'#fff0ce':e.windup>0?'#d49c7a':chase?'#9fae7c':'#b2c595';ctx.beginPath();ctx.moveTo(-26,0);ctx.bezierCurveTo(-37,-36,-20,-62,0,-53);ctx.bezierCurveTo(22,-64,39,-32,27,0);ctx.quadraticCurveTo(0,12,-26,0);ctx.fill();ctx.strokeStyle='#6d8665';ctx.lineWidth=2;ctx.stroke();ellipse(-10,-24,3,5,'#3e5445');ellipse(10,-24,3,5,'#3e5445');ellipse(-15,-15,5,3,'#e1ab9e99');ellipse(15,-15,5,3,'#e1ab9e99');ctx.strokeStyle='#4c614b';ctx.lineWidth=2;ctx.beginPath();ctx.arc(0,-16,5,0,Math.PI);ctx.stroke();path([[-2,-52],[-10,-70],[6,-62],[12,-70],[6,-51]],'#64845a');}if(e.stun>0)drawStunStars(ctx,state.enemyClock||0,e.x);ctx.fillStyle='#253e32';ctx.fillRect(-28,-88,56,5);ctx.fillStyle='#eac5a1';ctx.fillRect(-28,-88,56*e.hp/e.max,5);ctx.textAlign='center';ctx.font='bold 10px sans-serif';ctx.fillStyle=chase?'#ffdfad':home?'#d9e9c7':'#ecf3d9';ctx.fillText(e.stun>0?'✦ 기절 '+Math.ceil(e.stun)+'초':e.windup>0?'공격 준비!':chase?'! 추격 중':home?'↩ 돌아가는 중':'숲 방울이',0,-95);ctx.font='9px sans-serif';ctx.fillText(Math.ceil(e.hp)+' / '+e.max,0,-74);ctx.restore();}
function house(){const {x,y}=EXPLORATION_HOUSE;if(drawEnvironmentProp(ctx,'house',{x,y},{width:250,height:225,anchor:55}))return;ellipse(x,y+60,170,50,'#344b3333');path([[x-115,y-75],[x+100,y-75],[x+100,y+65],[x-115,y+65]],'#c5af86','#877e5c');for(let i=0;i<8;i++){ctx.strokeStyle='#a28c67';ctx.beginPath();ctx.moveTo(x-115,y-65+i*17);ctx.lineTo(x+100,y-65+i*17);ctx.stroke();}path([[x-144,y-70],[x-13,y-173],[x+130,y-70]],'#717b60','#4f6550');path([[x-144,y-70],[x-13,y-173],[x-30,y-70]],'#879175');ctx.fillStyle='#5c6550';ctx.fillRect(x-25,y-20,48,85);ctx.fillStyle='#8ca694';ctx.fillRect(x-91,y-30,42,40);ctx.fillRect(x+48,y-30,32,40);ctx.strokeStyle='#a1875e';ctx.lineWidth=9;ctx.beginPath();ctx.moveTo(x-99,y-20);ctx.lineTo(x-40,y+1);ctx.stroke();ctx.fillStyle='#eef0ce';ctx.font='bold 15px sans-serif';ctx.textAlign='center';ctx.fillText('버려진 집',x,y-191);}
function poseForAngle(a){const face=facingForVector(Math.cos(a),Math.sin(a));return [face.pose,face.flip<0];}
function drawPlayer(){const p=state.p,id=state.active,a=state.attack;if(state.knockout||state.pets[id].hp<=0){drawKnockedOut(ctx,state,knockoutSprite,images[id+'-front']);return;}if(state.switching){const pose=switchVisual(state.switching,h/camera.scale+150),im=pose.raised?switchImages[pose.id]:images[pose.id+'-front'],fallback=images[pose.id+'-front'];ellipse(p.x,p.y+5,24,8,'#253d3438');ctx.save();ctx.translate(p.x,p.y+pose.offsetY);const sprite=im?.complete&&im.naturalWidth?im:fallback;if(sprite?.complete&&sprite.naturalWidth)ctx.drawImage(sprite,-54,-104,108,108);ctx.restore();return;}let angle=Math.atan2(p.fy,p.fx);if(a)angle+=a.id==='momo'?a.t*17:(a.t/a.duration)*Math.PI*2;else if(state.basic&&!state.basicWeapon)angle+=(.28-state.basic)/.28*Math.PI*2;
 const [pose,flip]=poseForAngle(angle),im=images[id+'-'+pose];ellipse(p.x,p.y+5,28,10,'#253d3440');
 if(state.charge){const q=skillPlan(id,state.charge.time,state.pets[id].sp,skillLevel(id,'charge')).power;ctx.strokeStyle=id==='momo'?'#ffbed7':'#ffe59a';ctx.lineWidth=3+q*3;ctx.beginPath();ctx.ellipse(p.x,p.y,36+q*16,14+q*6,0,0,Math.PI*2);ctx.stroke();for(let i=0;i<5;i++){const an=clock*3+i*1.256;ellipse(p.x+Math.cos(an)*(30+q*17),p.y-30+Math.sin(an)*25,2+q*2,2+q*2,'#fff2b7');}}
 if(a){ctx.strokeStyle=id==='momo'?'#ffd4e4bb':'#ffe1a4cc';ctx.lineWidth=id==='momo'?9:13;for(let i=0;i<3;i++){ctx.beginPath();ctx.ellipse(p.x,p.y-28,84-i*7,33-i*3,0,angle+i*.7,angle+i*.7+2.1);ctx.stroke();}}
 if(!state.invuln||Math.floor(clock*12)%2){ctx.save();ctx.translate(p.x,p.y+(state.charge?3:0)+(state.burst?.id==='kuki'&&state.burst.t<KUKI_SLAM_IMPACT_TIME?-Math.sin(state.burst.t/KUKI_SLAM_IMPACT_TIME*Math.PI)*105:0));ctx.scale(flip?-1:1,state.charge?.94:1);const bounce=a&&id==='momo'?Math.sin(a.t*25)*4:!state.charge&&p.walking?-Math.abs(Math.sin(clock*15))*5:0;if((state.pets[id].weaponDurability>0||state.basic&&state.basicWeapon)&&!a&&!state.burst&&!state.charge&&weaponImages[id]?.naturalWidth){ctx.save();ctx.scale(flip?-1:1,1);ctx.translate(-54,-104+bounce);const direction=weaponDirection(p.fx,p.fy);drawWeaponPose(ctx,weaponImages[id],direction,state.basic?'strike':'idle',id,state.basic?(.28-state.basic)/.28:-1,108,108);ctx.restore();}else if(a?.id==='momo'&&momoSpin.complete&&momoSpin.naturalWidth){const cellW=momoSpin.naturalWidth/2,cellH=momoSpin.naturalHeight,back=Math.sin(angle)<0?1:0;ctx.scale((Math.cos(angle)<0?-1:1)*(flip?-1:1),1);ctx.drawImage(momoSpin,back*cellW,0,cellW,cellH,-70,-126+bounce,140,140);}else if(im?.complete&&im.naturalWidth)ctx.drawImage(im,-54,-104+bounce,108,108);if(state.charge)drawChargeGather(ctx,{id,pose,time:clock,power:skillPlan(id,state.charge.time,state.pets[id].sp,skillLevel(id,'charge')).power});if(id==='kuki'&&state.pets.kuki.powerTime>0){const anchors={front:[.925,.595],side:[.14,.57],back:[.105,.61],'diagonal-front':[.125,.615],'diagonal-back':[.14,.625]},anchor=anchors[pose]||anchors.front,tx=-54+108*anchor[0],ty=-104+bounce+108*anchor[1],r=19+Math.sin(clock*5)*1.5,glow=ctx.createRadialGradient(tx-r*.2,ty-r*.2,1,tx,ty,r);glow.addColorStop(0,'#fff9dc80');glow.addColorStop(.65,'#ffe8a84d');glow.addColorStop(1,'#ffe09500');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(tx,ty,r,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#fff0b080';ctx.lineWidth=1.3;ctx.beginPath();ctx.arc(tx,ty,r*.8,0,Math.PI*2);ctx.stroke();}ctx.restore();}
 if(state.pets[id].weaponDurability>0){ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#ffe9b6';ctx.strokeStyle='#3e5842';ctx.lineWidth=3;const label='×1.5 · '+state.pets[id].weaponDurability+'/10';ctx.strokeText(label,p.x,p.y-112);ctx.fillText(label,p.x,p.y-112);}
 ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff8df';ctx.strokeStyle='#3e5842';ctx.lineWidth=3;ctx.strokeText(id==='momo'?'모모':'쿠키',p.x,p.y+24);ctx.fillText(id==='momo'?'모모':'쿠키',p.x,p.y+24);
}
function draw(){ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,w,h);const scale=defenseMode?Math.min(w/620,h/425,1):w<650?.82:1.04;camera.scale=scale;camera.x=(defenseMode?(state.p.x*.25+DEFENSE_HOME.x*.75):state.p.x)-w/(2*scale);camera.y=(defenseMode?(state.p.y*.25+DEFENSE_HOME.y*.75):state.p.y)-h*(defenseMode?.59:offenseMode?.6:.5)/scale;ctx.save();const sceneShake=visibleShake(shake,paused,state.won||state.dead);ctx.translate(-camera.x*scale+(Math.random()-.5)*sceneShake,-camera.y*scale+(Math.random()-.5)*sceneShake);ctx.scale(scale,scale);
 drawEnvironmentGround(ctx);
 for(const t of (offenseMode||defenseMode?[]:thorns)){if(!drawEnvironmentProp(ctx,'trap',t,{width:t.r*2.15,height:t.r*1.4,anchor:t.r*.5})){ellipse(t.x,t.y,t.r,t.r*.48,'#916f5855');ctx.strokeStyle='#aa765d';ctx.lineWidth=3;for(let i=0;i<9;i++){const x=t.x+Math.cos(i*2.4)*t.r*.7,y=t.y+Math.sin(i*2.4)*t.r*.3;ctx.beginPath();ctx.moveTo(x-9,y+5);ctx.lineTo(x,y-15);ctx.lineTo(x+9,y+4);ctx.stroke();}}ctx.fillStyle='#fff1b5';ctx.font='10px sans-serif';ctx.textAlign='center';ctx.fillText('가시덤불 · 주의',t.x,t.y+t.r*.55+12);}

 if(state.kukiWave)drawGroundWave(ctx,state.kukiWave.x,state.kukiWave.y,(clock-state.kukiWave.start)/KUKI_WAVE_LIFE);
 for(const particle of state.particles){
  if(particle.groundWave)drawGroundWave(ctx,particle.x,particle.y,1-particle.t/particle.life,particle.size,'pink');
 }
 const visible=state.objects.filter(o=>o.x>camera.x-130&&o.x<camera.x+w/scale+130&&o.y>camera.y-50&&o.y<camera.y+h/scale+180);const entities=visible.map(o=>({y:o.y,target:o,draw:()=>offenseMode?drawOutpostPart(ctx,o):o.type==='tree'?tree(o):rock(o)}));for(const drop of state.weaponDrops)entities.push({y:drop.y,draw:()=>drawWeaponDrop(drop)});for(const heart of state.hearts)entities.push({y:heartPose(heart).y,draw:()=>drawHeart(heart)});for(const e of state.enemies)if(e.hp>0&&Math.abs(e.x-state.p.x)<w/camera.scale&&Math.abs(e.y-state.p.y)<h/camera.scale)entities.push({y:e.y,target:e,draw:()=>drawEnemy(e)});entities.push({y:state.p.y,draw:drawPlayer},offenseMode?{y:OFFENSE_BASE.y,target:state.objects.find(o=>o.type==='house'),draw:()=>drawOutpost(ctx,offenseProgress(state.objects),clock,state.clearAge)}:defenseMode?{y:DEFENSE_HOME.y,target:state.defense.house,draw:drawDefenseHome}:{y:465,draw:house});entities.sort((a,b)=>a.y-b.y);for(const e of entities)drawWithHitJolt(ctx,e.target,e.draw);
 if(state.heartMeteor)drawHeartMeteor(state.heartMeteor);
 for(const o of visible)if(o.type!=='core'&&o.hp>0&&Math.hypot(o.x-state.p.x,o.y-state.p.y)<190){const yy=o.y-(o.type==='tree'?142:o.type==='wall'?110:78);ctx.fillStyle='#2f4439cc';ctx.fillRect(o.x-29,yy,58,6);ctx.fillStyle=o.type==='tree'?'#d0dba1':'#cad2bd';ctx.fillRect(o.x-29,yy,58*o.hp/o.max,6);ctx.font='10px sans-serif';ctx.fillStyle='#fff4d8';ctx.textAlign='center';ctx.fillText(`${o.name||(o.type==='tree'?'나무':'바위')} ${Math.ceil(o.hp)}/${o.max}`,o.x,yy-5);}
 for(const q of state.particles){if(q.groundWave)continue;ctx.globalAlpha=Math.min(1,q.t*2);if(q.star)drawStar(q);else if(q.burst){const age=1-q.t/q.life;ctx.strokeStyle=q.color;ctx.lineWidth=3*(1-age);ctx.beginPath();ctx.ellipse(q.x,q.y,q.size*(.3+age),q.size*(.3+age)*.65,0,0,Math.PI*2);ctx.stroke();}else{ctx.fillStyle=q.color;ctx.fillRect(q.x,q.y,q.size,q.size);}}ctx.globalAlpha=1;for(const q of state.texts){ctx.globalAlpha=Math.min(1,q.t*2);ctx.font='900 '+(q.critical?30:15)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle=q.color;ctx.strokeStyle='#263629';ctx.lineJoin='round';ctx.lineWidth=q.critical?5:3;ctx.strokeText(q.text,q.x,q.y);ctx.fillText(q.text,q.x,q.y);}ctx.globalAlpha=1;
 ctx.restore();
 if(paused){ctx.fillStyle='#172d2888';ctx.fillRect(0,0,w,h);ctx.fillStyle='#fff1c6';ctx.font='bold 23px sans-serif';ctx.textAlign='center';ctx.fillText(loading?'게임을 로딩중입니다':loadError?'게임을 불러오지 못했어요':'잠깐 쉬는 중',w/2,h/2);}
}
function beginClear(){state.knockout=null;state.won=true;state.clearDelay=1;state.clearAge=0;cancelCharge();state.attack=null;state.burst=null;state.heartMeteor=null;state.basic=0;state.target=null;state.p.walking=false;keys.clear();stick={x:0,y:0};shake=0;}
function completeOffense(){progressUI.roulette(round.id,['outpost-house']);}

function resize(){const b=stage.getBoundingClientRect();w=b.width;h=b.height;dpr=Math.min(2,devicePixelRatio||1);canvas.width=Math.round(w*dpr);canvas.height=Math.round(h*dpr);}
new ResizeObserver(resize).observe(stage);
function togglePause(force){if((loading||loadError)&&force!==true)return;paused=typeof force==='boolean'?force:!paused;gameMusic.setPaused(paused||loading||loadError);if(paused){combatAudio.stop();shake=0;cancelCharge();keys.clear();stick={x:0,y:0};} $('[data-pause]').disabled=loading||loadError;$('[data-pause]').textContent=loading?'로딩 중':loadError?'연결 확인 필요':paused?'계속하기':'일시정지';hud();}
const movement=['w','a','s','d','arrowup','arrowdown','arrowleft','arrowright'];
window.addEventListener('keydown',e=>{if(document.querySelector('dialog[open]'))return;const key=e.key.toLowerCase();if(movement.includes(key)||[' ','q','j','e','escape'].includes(key))e.preventDefault();if(movement.includes(key))keys.add(key);if(e.repeat)return;if(key===' ')beginCharge('key');if(key==='j')basic();if(key==='e')gaugeSkill();if(key==='q')swap();if(key==='escape')togglePause();});
window.addEventListener('keyup',e=>{keys.delete(e.key.toLowerCase());if(e.key===' ')releaseCharge('key');});window.addEventListener('blur',()=>togglePause(true));document.addEventListener('visibilitychange',()=>{if(document.hidden)togglePause(true);});
bindImmediateAction($('[data-gauge-skill]'),gaugeSkill);bindImmediateAction($('[data-basic]'),basic);bindImmediateAction($('[data-switch]'),swap);$('[data-pause]').onclick=()=>togglePause();$('[data-reset]').onclick=()=>{if(defenseMode&&wallet.local||confirm('탐험을 처음부터 다시 시작할까요?'))newRound(true);};
const special=$('[data-special]');special.addEventListener('pointerdown',e=>{if(specialPointer!==null||e.pointerType==='mouse'&&e.button!==0)return;e.preventDefault();if(!beginCharge('pointer'))return;specialPointer=e.pointerId;special.setPointerCapture(e.pointerId);});special.addEventListener('pointerup',e=>{if(e.pointerId!==specialPointer)return;specialPointer=null;releaseCharge('pointer');});special.addEventListener('pointercancel',e=>{if(e.pointerId===specialPointer)cancelCharge();});special.addEventListener('lostpointercapture',e=>{if(e.pointerId===specialPointer)cancelCharge();});special.addEventListener('contextmenu',e=>e.preventDefault());
const joystick=$('.joystick');function setStick(e){const b=joystick.getBoundingClientRect(),dx=e.clientX-b.left-b.width/2,dy=e.clientY-b.top-b.height/2,travel=Math.max(18,(b.width-joystick.querySelector('b').offsetWidth)/2-6),l=Math.max(1,Math.hypot(dx,dy)/travel);stick={x:dx/l/travel,y:dy/l/travel};joystick.querySelector('b').style.transform=`translate(${stick.x*travel}px,${stick.y*travel}px)`;state.target=null;}
bindMovementPointer(joystick,setStick,()=>{stick={x:0,y:0};joystick.querySelector('b').style.transform='';});
canvas.addEventListener('pointerdown',e=>{if(paused||state.knockout||state.switching)return;canvas.focus({preventScroll:true});const b=canvas.getBoundingClientRect();state.target={x:(e.clientX-b.left)/camera.scale+camera.x,y:(e.clientY-b.top)/camera.scale+camera.y};});
const help=$('dialog');$('[data-help]').onclick=()=>{togglePause(true);help.showModal();};$('[data-close-help]').onclick=()=>{help.close();togglePause(false);};help.addEventListener('cancel',()=>togglePause(false));
reset();progressUI=mountAdventureProgress({root,wallet,getState:()=>state,pause:togglePause,notify:status});if(offenseMode)$('.prototype-note').textContent='원정 · 산채 본체 파괴 시 룰렛 보상 · 5초마다 주변 적 증원';loading=true;togglePause(true);wallet.init().then(()=>newRound()).catch(e=>{loading=false;loadError=true;status('저장 연결 실패: '+e.message);togglePause(true);});if(skillDemo){$('.prototype-note').textContent=kukiSlamDemo?'별똥별 쿵 시안 · 착지 후 모모로 교체해 별을 주워 보세요. 커플방 보상은 지급되지 않아요.':'하트 팡 모의 테스트 · 고정 표적의 HP가 줄어드는 모습을 확인하세요. 커플방 보상은 지급되지 않아요.';if(kukiSlamDemo){$('.adventure-top h1').textContent='별똥별 쿵!';$('.location').textContent='쿠키 필살기 시안';}const replay=document.createElement('button');replay.textContent=kukiSlamDemo?'별똥별 쿵 다시 시전':'하트 팡 다시 시전';replay.onclick=()=>{if(!loading){reset();gaugeSkill();}};const refill=document.createElement('button');refill.type='button';refill.textContent='게이지 100% 채우기';refill.onclick=()=>{if(loading||loadError)return;state.pets.momo.gauge=100;state.pets.kuki.gauge=100;hud();status('테스트 · 모모와 쿠키의 필살기 게이지를 100% 채웠어요.');};$('.top-actions').append(refill,replay);}resize();function frame(now){const elapsed=Math.max(0,(now-last)||0),dt=Math.min(.04,elapsed/1000);last=now;const frozen=state.hitStop>0;if(!paused){if(!state.won&&!state.dead)state.playTimeMs=(state.playTimeMs||0)+elapsed;const activeDt=Math.min(dt,consumeHitStop(state,elapsed/1000));if(activeDt>0)update(activeDt);}if(paused||!frozen||state.hitStop<=0)draw();requestAnimationFrame(frame);}requestAnimationFrame(frame);

function drawWeaponDrop(drop){ellipse(drop.x,drop.y+4,18,5,'#32473544');drawWeaponPickup(ctx,drop,clock);ctx.save();ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff7dd';ctx.strokeStyle='#42543d';ctx.lineWidth=3;const label=drop.owner==='momo'?'모모 · 하트봉':'쿠키 · 별망치';ctx.strokeText(label,drop.x,drop.y+18);ctx.fillText(label,drop.x,drop.y+18);ctx.restore();}

function impactHeartMeteor(impact,index,final){
 combatAudio.play('momo_skill');
 const multiplier=damageMultiplier('momo')*skillBalance(skillLevel('momo','ultimate')).ultimateMultiplier;
 for(const target of heartImpactTargets(impact,combatTargets())){
  const hit=rollAttack('momo',wallet.profile.stats.momo);
  damageObject(target,hit.damage*multiplier,hit.critical,'momo');
 }
 state.particles.push({x:impact.x,y:impact.y,vx:0,vy:0,t:.6,life:.6,size:HEART_IMPACT_RADIUS,burst:true,groundWave:true});
 starBurst(impact.x,impact.y-9,.32);shake=Math.max(shake,4);
 status(final?'하트 팡! 쿠키로 교체해 떨어진 하트 5개를 주워 보세요.':`하트 운석 착지 ${index}/5`);
 if(final)dropHearts(impact,true);
}
function drawHeartMeteor(sequence){
 const {origin,age,impacts}=sequence;
 if(age<HEART_LAUNCH_END){const lift=Math.max(0,(age-HEART_ORBIT_END)/(HEART_LAUNCH_END-HEART_ORBIT_END));for(let i=0;i<5;i++){
  const pos=heartPose({originX:origin.x,originY:origin.y,x:origin.x,y:origin.y,phase:i,age:Math.min(age,.999)});
  drawHeartSprite(pos.x,pos.y-13-pos.z-Math.min(age,1)*20-lift*lift*280,pos.scale,1-lift*.35);
 }}
 for(const impact of impacts){const t=(age-impact.at+HEART_FALL_TIME)/HEART_FALL_TIME;if(t<0||t>=1)continue;
  const remaining=1-t*t,z=300*remaining,x=impact.x+145*remaining,y=impact.y-z;
  ellipse(impact.x,impact.y,15*t+4,5,'#91496a55');
  ctx.save();const trail=ctx.createLinearGradient(x,y,x+36,y-75);trail.addColorStop(0,'#ffc5e6bb');trail.addColorStop(1,'#ff9cca00');ctx.strokeStyle=trail;ctx.lineWidth=12;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+19,y-75);ctx.stroke();ctx.restore();
  drawHeartSprite(x,y-24,2);
 }
}

function impactKukiSlam(origin){
 combatAudio.play('cookie_skill');
 const {x,y}=origin,multiplier=KUKI_SLAM_MULTIPLIER*damageMultiplier('kuki')*skillBalance(skillLevel('kuki','ultimate')).ultimateMultiplier;
 for(const target of combatTargets()){
  if(target.hp<=0||Math.hypot(target.x-x,target.y-y)>KUKI_SLAM_RADIUS+target.radius)continue;
  const hit=rollAttack('kuki',wallet.profile.stats.kuki);
  damageObject(target,hit.damage*multiplier,hit.critical,'kuki');
  if(target.type==='enemy'&&target.hp>0){target.stun=3;target.windup=0;}
 }
 state.kukiWave={x,y,start:clock};shake=12;dropHearts(origin,true,'star');
 status('별똥별 쿵! 모모로 교체해 노란 별 5개를 주워 보세요.');
}

function mountDefenseHud(){
 $('.adventure-top h1').textContent='우리 집 방어';
 $('.stage').insertAdjacentHTML('beforeend',
  '<div class="outpost-health-panel"><div class="outpost-health-heading"><strong>우리 집 HP</strong><span data-defense-hp></span></div><div class="outpost-health" role="progressbar" aria-label="우리 집 HP" aria-valuemin="0" aria-valuemax="'+DEFENSE_HOME.max+'"><i></i></div></div>');
 const help=$('.help-dialog');
 help.querySelector('h2').textContent='우리 집 방어';
 help.querySelector('h2').insertAdjacentHTML('afterend','<p>사방에서 몰려오는 방울이를 막고 '+DEFENSE_WAVES.length+'차 공격을 버텨요. 일부 방울이는 모모와 쿠키를 추격해요. Q 또는 교체 버튼으로 캐릭터를 바꿀 수 있어요. 집 HP가 0이 되면 방어에 실패해요.</p>');
}
function updateDefenseHud(){
 const defense=state.defense,house=defense.house;
 const bar=$('.outpost-health');
 bar.querySelector('i').style.width=house.hp/house.max*100+'%';
 bar.setAttribute('aria-valuenow',String(house.hp));
 $('[data-defense-hp]').textContent=house.hp.toLocaleString()+' / '+house.max.toLocaleString();
 $('.mission strong').textContent='우리 집 지키기';
 $('[data-progress]').textContent=(defense.wave?defense.wave+' / '+DEFENSE_WAVES.length+'차':'첫 공격 준비 중')+' · 방울이 '+state.defeated+' / '+DEFENSE_TOTAL+'마리 저지';
 $('[data-enemy-status]').textContent=defense.wave<DEFENSE_WAVES.length&&!state.dead&&!state.won?'다음 공격까지 '+Math.max(0,Math.ceil(defense.nextWave))+'초':'';
}
function updateDefense(dt){
 const result=stepDefense(state.defense,state.enemies,dt),house=state.defense.house;
 if(result.fresh.length){
  state.enemies.push(...result.fresh);
  const hunters=result.fresh.filter(enemy=>enemy.defenseTarget==='player').length;
  status(state.defense.wave+'차 공격 · 집 공격 '+(result.fresh.length-hunters)+'마리 · 캐릭터 추격 '+hunters+'마리');
 }
 if(result.damage){
  triggerHitJolt(house);
  float(house.x,house.y-100,'집 HP −'+result.damage,'#ffc0c0');
  shake=Math.max(shake,5);
 }
 if(house.hp<=0||result.complete){
  state.dead=house.hp<=0;
  if(result.complete){
   beginClear();
   status('방어 성공 · '+DEFENSE_WAVES.length+'차 공격을 모두 막았어요.');
   hud();
   return;
  }
  state.attack=null;state.burst=null;state.heartMeteor=null;state.basic=0;
  cancelCharge();keys.clear();stick={x:0,y:0};state.p.walking=false;
  message('우리 집이 무너졌어요','상단 처음부터 버튼으로 다시 도전해 보세요.');
  status('방어 실패 · 집의 HP가 0이 됐어요.');
  hud();
  return;
 }
 for(const enemy of state.enemies){
  if(enemy.defenseTarget==='player'&&stepEnemy(enemy,state.p,state.colliders,dt))hurtPlayer(10);
 }
}
function drawDefenseHome(){
 const house=state.defense.house;
 ellipse(house.x,house.y+8,99,43,house.flash?'#ffd1b072':'#d7f1c657');
 if(house.hp>0)drawEnvironmentProp(ctx,'house',house,{width:175,height:165,anchor:26});
 else for(let i=0;i<7;i++)ellipse(house.x+(i-3)*17,house.y+i%2*10,14,6,'#97794d');
}

if(skillTest){
 const button=document.createElement('button');
 button.textContent='스킬 레벨 테스트';
 $('.top-actions').append(button);
 button.onclick=()=>{
  if(loading||loadError)return;
  if(state.attack||state.burst||state.heartMeteor){status('기술이 끝난 뒤 레벨을 바꿔 주세요.');return;}
  const wasPaused=paused;
  togglePause(true);
  const dialog=document.createElement('dialog');
  dialog.className='help-dialog';
  dialog.innerHTML='<h2>스킬 레벨 테스트</h2><p>준비 0.5초 + 힘 모으기 3초 · 풀차지 70 SP</p>'+
   ['momo','kuki'].map(id=>'<fieldset><legend>'+(id==='momo'?'모모':'쿠키')+'</legend>'+
    ['charge','ultimate'].map(key=>'<label style="display:block;margin:12px 0">'+
     (key==='charge'?'차지 스킬':'게이지 필살기')+' <select data-pet="'+id+'" data-skill="'+key+'">'+
     Array.from({length:10},(_,i)=>'<option value="'+(i+1)+'" '+(testSkills[id][key]===i+1?'selected':'')+'>Lv. '+(i+1)+'</option>').join('')+
     '</select><span data-effect="'+id+'-'+key+'" style="display:block;margin-top:6px"></span></label>').join('')+'</fieldset>').join('')+
   '<button data-refill>HP·SP·스킬 게이지 채우기</button> <button data-done>테스트 시작</button>';
  document.body.append(dialog);
  const describe=()=>{
   for(const id of ['momo','kuki']){
    const charge=skillBalance(testSkills[id].charge),ultimate=skillBalance(testSkills[id].ultimate);
    dialog.querySelector('[data-effect="'+id+'-charge"]').textContent=id==='momo'?'풀차지 회전 '+charge.spinDuration.toFixed(1)+'초':'풀차지 공격 배율 '+Math.round(charge.tailMultiplier*100)+'%';
    dialog.querySelector('[data-effect="'+id+'-ultimate"]').textContent='기본 피해 대비 +'+Math.round((ultimate.ultimateMultiplier-1)*100)+'%';
   }
  };
  dialog.onchange=event=>{
   const select=event.target;
   if(!select.matches('select'))return;
   testSkills[select.dataset.pet][select.dataset.skill]=Number(select.value);
   describe();
  };
  dialog.querySelector('[data-refill]').onclick=()=>{
   for(const pet of Object.values(state.pets)){pet.hp=pet.maxHp;pet.sp=pet.maxSp;pet.gauge=100;}
   hud();
   dialog.querySelector('[data-refill]').textContent='충전 완료 · HP·SP·스킬 100%';
  };
  dialog.querySelector('[data-done]').onclick=()=>dialog.close();
  dialog.addEventListener('close',()=>{dialog.remove();togglePause(wasPaused);},{once:true});
  describe();
  dialog.showModal();
 };
}

if(wallet.local&&['localhost','127.0.0.1','[::1]'].includes(location.hostname)&&demoParams.get('knockoutTest')==='1'){const test=document.createElement('button');test.textContent='쓰러짐 테스트';test.onclick=()=>{if(loading||paused||state.knockout||state.dead||state.won||state.switching)return;state.invuln=0;hurtPlayer(state.pets[state.active].hp);};$('.top-actions').append(test);}
