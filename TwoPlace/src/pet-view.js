import './pets.css';
import './pets-iso.css';
import {isoScenery,isoFurniture} from './pet-art.js';
import {project,unproject,insideFloor,cellCenter,cellAt,snap,placementAllowed,walkable,findPath,petStepClear,facingForVector,fromWorld} from '../shared/pet-space.js';

const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names = {mochi:'모모',kuki:'쿠키'};
const petImage = (id,pose='front') => pose==='front' ? `${import.meta.env.BASE_URL}pets/${id}-standing-v2.png` : `${import.meta.env.BASE_URL}pets/${id}-${pose}-v3.png`;
const spaces = {yard:'앞마당',home:'거실',momoRoom:'모모네방',kukiRoom:'쿠키네방'};
function sceneDoors(){
  if(ui.space==='yard')return '<button class="scene-door house-entry" data-pet-space="home" aria-label="집 문 열고 거실로 들어가기" title="거실로 들어가기"></button>';
  if(ui.space==='home')return '<button class="scene-door room-entry momo-entry" data-pet-space="momoRoom" aria-label="모모네방 들어가기" title="모모네방"></button><button class="scene-door room-entry kuki-entry" data-pet-space="kukiRoom" aria-label="쿠키네방 들어가기" title="쿠키네방"></button><button class="scene-exit" data-pet-space="yard">← 앞마당으로</button>';
  return '<button class="scene-door bedroom-exit-door" data-pet-space="home" aria-label="방 문 열고 거실로 나가기" title="거실로 나가기"></button><button class="scene-exit" data-pet-space="home">← 거실로</button>';
}
const petIds = ['mochi','kuki'];
const ui = {space:'yard',panel:'care',pet:'mochi',selectedPet:'mochi',placing:null,rotation:0};
const facings={mochi:{pose:'front',flip:1},kuki:{pose:'front',flip:1}};
const walkTokens={mochi:0,kuki:0};
const motions={};
function otherPetSegments(id){return petIds.filter(other=>other!==id).map(other=>{
  const moving=motions[other];
  return moving && moving.until>Date.now()?moving:{from:positions[other],to:positions[other]};
});}
const positions = {mochi:{x:32,y:72},kuki:{x:69,y:77}};
let controller, timers=[], clock;
let clockOffset=0;
let hooks;
let pending=false;
const later = (callback,delay) => { const id=setTimeout(callback,delay); timers.push(id); return id; };
function now() { return Date.now()+clockOffset; }
function reward(home) { return now()-home.lastClaim>=3600000?10:0; }
function countdown(home) {
  const remaining = Math.max(0,Math.ceil((home.lastClaim+3600000-now())/1000));
  return `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
}
function furnitureArt(product,rotation=0) { return isoFurniture(product,rotation); }
function setSelection(id){
  ui.selectedPet=id;
  if(id)ui.pet=id;
  document.querySelectorAll('.pet-actor').forEach(actor=>{
    const selected=actor.dataset.pet===id;
    actor.classList.toggle('is-selected',selected);
    actor.setAttribute('aria-pressed',String(selected));
    if(selected){
      walkTokens[id]++;
      actor.classList.remove('walking');
      actor.dataset.mood='';
      actor.querySelector('.pet-speech').textContent='';
    }
  });
  document.querySelectorAll('[data-select-pet]').forEach(profile=>{
    const selected=profile.dataset.selectPet===ui.pet;
    profile.classList.toggle('chosen',selected);
    profile.setAttribute('aria-pressed',String(selected));
  });
  const feedLabel=document.querySelector('[data-pet-action="feed"] strong');
  if(feedLabel)feedLabel.textContent=`${names[ui.pet]} 먹이 주기`;
}
function flashFloorCell(scene,world,blocked=false){
  scene.querySelectorAll('.move-cell-feedback').forEach(marker=>marker.remove());
  const {c,r}=cellAt(world);
  const vertices=[[c,r],[c+1,r],[c+1,r+1],[c,r+1]].map(([x,y])=>{
    const point=project(fromWorld(x/8,y/8));return `${point.x},${point.y}`;
  }).join(' ');
  const marker=document.createElementNS('http://www.w3.org/2000/svg','svg');
  marker.setAttribute('viewBox','0 0 100 100');
  marker.setAttribute('preserveAspectRatio','none');
  marker.setAttribute('aria-hidden','true');
  marker.classList.add('move-cell-feedback');
  marker.dataset.blocked=String(blocked);
  const polygon=document.createElementNS('http://www.w3.org/2000/svg','polygon');
  polygon.setAttribute('points',vertices);marker.append(polygon);scene.append(marker);
  later(()=>marker.remove(),1350);
}
function actor(id) {
  const point=project(positions[id]),face=facings[id];
  return `<button class="pet-actor actor-${id} ${ui.selectedPet===id ? 'is-selected' : ''}" data-pet="${id}" aria-pressed="${ui.selectedPet===id}" data-facing="${face.pose}" aria-label="${names[id]} 선택" style="left:${point.x}%;top:${point.y}%;z-index:${Math.round(point.y*10)+10};--depth:${.8+(point.y-42)/44*.25};--facing-flip:${face.flip}"><span class="pet-shadow"></span><span class="pet-body"><span class="pet-sprite"><img src="${petImage(id,face.pose)}" alt="${names[id]}" draggable="false"></span></span><span class="pet-speech" aria-hidden="true"></span><span class="pet-name">${names[id]}</span></button>`;
}
function placedFurniture(item,catalog){
  const point=project(item),size={rug:112,table:88,plant:65,cushion:67,lamp:73,fence:82}[item.product]||75;
  return `<button class="placed-furniture" data-product="${item.product}" data-furniture="${item.id}" aria-label="${esc(catalog.find(p=>p.id===item.product)?.name||'가구')} 위치 바꾸기" style="left:${point.x}%;top:${point.y}%;z-index:${item.product==='rug'?1:Math.round(point.y*10)+9};--item-size:${size}px">${furnitureArt(item.product,item.rotation)}</button>`;
}
function placementGrid(home){
  const item=home.items.find(item=>item.id===ui.placing);
  if(!item)return '';
  let cells='';
  for(let c=0;c<8;c++)for(let r=0;r<8;r++){
    const world=cellCenter(c,r),point=project(world),allowed=placementAllowed(home.items,item,ui.space,world,ui.rotation);
    cells+=`<button class="floor-slot ${allowed?'allowed':'blocked'}" data-slot="${world.x},${world.y}" style="left:${point.x}%;top:${point.y}%" aria-label="바닥 ${c+1}열 ${r+1}행에 배치${allowed?'':' · 배치 불가'}" ${allowed?'':'disabled'}></button>`;
  }
  return `<div class="placement-hint" role="status">초록색 자리에 놓아 주세요 <button data-pet-action="rotate-place">회전</button><button data-pet-action="cancel-place">취소</button></div><div class="placement-grid" aria-label="가구 배치 위치">${cells}</div>`;
}
function carePanel(home) {
  return `<div class="pet-profiles">${petIds.map(id=>`<button class="pet-profile ${ui.pet === id ? 'chosen' : ''}" data-select-pet="${id}" aria-pressed="${ui.pet === id}"><img src="${petImage(id)}" alt=""><span><strong>${names[id]}</strong><small>${id === 'mochi' ? '하트처럼 포근한 친구' : '별빛처럼 다정한 친구'}</small><span class="hunger-track" role="progressbar" aria-label="${names[id]} 배부름" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${home.pets[id].hunger}"><i style="width:${home.pets[id].hunger}%"></i></span><small>배부름 ${home.pets[id].hunger}%</small></span></button>`).join('')}</div><div class="care-actions"><button data-pet-action="feed"><span>✦</span><strong>${names[ui.pet]} 먹이 주기</strong><small>보유 먹이 ${home.snacks}개</small></button><button data-pet-action="pat"><span>♡</span><strong>쓰다듬기</strong><small>사랑을 전해 주세요</small></button><button data-pet-action="sleep"><span>☾</span><strong>잠깐 쉬기</strong><small>포근한 낮잠 시간</small></button></div>`;
}
function shopPanel(home,catalog) {
  return `<div class="pet-shop-note">하트로 작은 행복을 선물해 주세요.<span>보유 ♡ ${home.hearts}</span></div><div class="pet-shop-grid">${catalog.map(product=>`<article class="shop-product">${product.type === 'food' ? '<span class="food-art">✦</span>' : furnitureArt(product.id)}<strong>${esc(product.name)}</strong><p>${esc(product.description)}</p><button data-buy="${product.id}" ${home.hearts<product.price ? 'disabled' : ''} aria-label="${esc(product.name)} 구매 ${product.price}하트">♡ ${product.price} <span>${home.hearts<product.price ? '하트 부족' : '구매하기'}</span></button></article>`).join('')}</div>`;
}
function decoratePanel(home,catalog) {
  if (!home.items.length) return '<div class="pet-empty"><span>⌂</span><strong>우리만의 공간을 꾸며 봐요</strong><p>상점에서 가구를 구매하면 여기에 모여요.<br>가구를 고른 뒤 원하는 위치를 눌러 배치하세요.</p><button data-pet-panel="shop">상점 구경하기 ↗</button></div>';
  return `<p class="decorate-guide">가구를 골라 바닥의 초록색 자리에 놓아 주세요.<br>회전해서 방향을 바꾸거나 키보드로 자리를 골라도 돼요.</p><div class="inventory-list">${home.items.map(item=>{const product=catalog.find(p=>p.id===item.product);return `<div class="inventory-item ${ui.placing === item.id ? 'picked' : ''}">${furnitureArt(item.product,item.rotation)}<span><strong>${esc(product?.name || '가구')}</strong><small>${item.space ? (spaces[item.space]||'이전 테라스')+'에 배치됨' : '보관함에 있어요'}</small></span><button data-place="${item.id}">${ui.placing === item.id ? '선택됨' : '배치'}</button>${item.space ? `<button class="store-item" data-store="${item.id}">보관</button>` : ''}</div>`;}).join('')}</div>`;
}
export function petPage(home,catalog) {
  if (!home) return '<div class="empty">모모와 쿠키의 집을 준비하고 있어요.</div>';
  const settled=[];
  for(const id of petIds){
    const current=cellAt(positions[id]);
    const safe=point=>petStepClear(point,point,settled.map(other=>({from:positions[other],to:positions[other]})));
    if(!walkable(home.items,ui.space,current.c,current.r)||!safe(positions[id])){
      const candidates=[];
      for(let c=0;c<8;c++)for(let r=0;r<8;r++){
        const point=cellCenter(c,r);
        if(walkable(home.items,ui.space,c,r)&&safe(point))candidates.push({point,d:(c-current.c)**2+(r-current.r)**2});
      }
      candidates.sort((a,b)=>a.d-b.d);
      if(candidates[0])positions[id]=candidates[0].point;
    }
    settled.push(id);
  }
  clockOffset = home.serverNow-Date.now();
  const placed=home.items.filter(item=>item.space===ui.space);
  return `<section class="pet-heading"><div><span class="eyebrow">MOMO & KUKI'S LITTLE HOME</span><h1>모모와 쿠키의 집<span>♡</span></h1><p>둘이 돌보는, 두 친구의 작은 세상.</p></div><div class="heart-wallet" aria-label="보유 하트 ${home.hearts}"><span>♡</span><strong>${home.hearts}</strong><small>우리의 하트</small></div></section><div class="space-tabs" aria-label="펫 공간">${Object.entries(spaces).filter(([id])=>id==='yard'||id==='home').map(([id,label])=>`<button data-pet-space="${id}" aria-pressed="${(ui.space===id || id==='home'&&ui.space.endsWith('Room'))}" class="${(ui.space===id || id==='home'&&ui.space.endsWith('Room')) ? 'active' : ''}">${label}</button>`).join('')}</div><section class="pet-scene iso-scene scene-${ui.space} ${ui.placing ? 'placing' : ''}" aria-label="${spaces[ui.space]} · 모모와 쿠키가 함께 지내는 공간">${isoScenery(ui.space)}${sceneDoors()}<span class="scene-location">${spaces[ui.space]} · ${ui.space==='yard'?'문을 눌러 집으로 들어가요':ui.space==='home'?'우리의 포근한 거실과 작은 주방':'우리만의 방을 꾸며요'}</span>${placed.map(item=>placedFurniture(item,catalog)).join('')}${petIds.map(actor).join('')}${ui.placing ? placementGrid(home) : ''}<span class="scene-tip">${ui.placing ? '구매한 가구로 우리 공간을 채워요' : '친구를 고르고 바닥을 누르면 따라와요'}</span></section><button class="claim-hearts" data-pet-action="claim"><span class="claim-heart">♡</span><span><strong>시간당 하트 받기</strong><small>한 번에 10하트 · 받은 뒤 1시간 대기</small></span><span class="claim-value" id="claim-value">${reward(home) ? `+${reward(home)} 받기` : countdown(home)}</span></button><div class="pet-panel-tabs" aria-label="펫 활동">${[['care','돌보기'],['shop','상점'],['decorate','꾸미기']].map(([id,label])=>`<button data-pet-panel="${id}" class="${ui.panel===id ? 'active' : ''}" aria-pressed="${ui.panel===id}">${label}</button>`).join('')}</div><section class="pet-panel">${ui.panel === 'care' ? carePanel(home) : ui.panel === 'shop' ? shopPanel(home,catalog) : decoratePanel(home,catalog)}</section><p class="pet-shared-note">♡ 하트, 먹이, 가구와 배치는 같은 커플방에서 함께 사용해요.</p>`;
}
export function stopPets() {
  controller?.abort(); controller=null;
  for(const id of petIds){walkTokens[id]++;delete motions[id];}
  timers.forEach(clearTimeout); timers=[];
  clearInterval(clock);
}
function react(id,mood) {
  const actor=document.querySelector(`.actor-${id}`);
  if (!actor) return;
  actor.dataset.mood=mood;
  walkTokens[id]++;
  faceActor(id,{pose:'front',flip:1});
  actor.classList.remove('walking');
  const speech=actor.querySelector('.pet-speech');
  speech.textContent=mood==='sleep' ? 'z z z' : mood==='eat' ? '냠냠 ✦' : '♡ 좋아!';
  later(()=>{if(actor.isConnected){actor.dataset.mood=''; speech.textContent='';}},mood==='sleep' ? 14000 : 5000);
}
function faceActor(id,face){
  facings[id]=face;
  const actor=document.querySelector(`.actor-${id}`);
  if(!actor)return;
  actor.dataset.facing=face.pose;
  actor.style.setProperty('--facing-flip',face.flip);
  const img=actor.querySelector('.pet-body img');
  if(img.getAttribute('src')!==petImage(id,face.pose))img.src=petImage(id,face.pose);
}
function movePet(id,target){
  const home=hooks.home(),actor=document.querySelector(`.actor-${id}`);
  if(!actor || actor.dataset.mood || ui.placing || motions[id]?.until>Date.now())return false;
  const canStep=(a,b)=>petStepClear(cellCenter(a.c,a.r),cellCenter(b.c,b.r),otherPetSegments(id));
  if(!findPath(home.items,ui.space,cellAt(positions[id]),target,canStep).length)return false;
  const token=++walkTokens[id],scene=actor.closest('.pet-scene');
  function step(){
    if(!actor.isConnected || token!==walkTokens[id] || actor.dataset.mood || ui.placing)return;
    // Re-plan at every step; the other pet may have started moving in the meantime.
    const current=cellAt(positions[id]);
    const path=findPath(hooks.home().items,ui.space,current,target,canStep);
    if(!path.length){actor.classList.remove('walking');return;}
    const point=cellCenter(path[0].c,path[0].r),old=project(positions[id]),next=project(point);
    if(!petStepClear(positions[id],point,otherPetSegments(id))){actor.classList.remove('walking');return;}
    motions[id]={from:{...positions[id]},to:point,until:Date.now()+640};
    faceActor(id,facingForVector((next.x-old.x)*scene.clientWidth,(next.y-old.y)*scene.clientHeight));
    actor.classList.add('walking');
    actor.style.left=`${next.x}%`;actor.style.top=`${next.y}%`;
    actor.style.zIndex=String(Math.round(next.y*10)+10);
    actor.style.setProperty('--depth',.8+(next.y-42)/44*.25);
    positions[id]=point;
    later(step,660);
  }
  step();return true;
}

function wander(id) {
  if (controller?.signal.aborted) return;
  const actor=document.querySelector(`.actor-${id}`);
  if (!actor) return;
  if (!actor.dataset.mood && !ui.placing && ui.selectedPet!==id) {
    for(let i=0;i<12;i++)if(movePet(id,{c:Math.floor(Math.random()*8),r:Math.floor(Math.random()*8)}))break;
  }
  later(()=>wander(id),6500+Math.random()*3500);
}
async function act(action,success) {
  if(pending) return false;
  pending=true;
  try { await hooks.action(action); if(success) hooks.toast(success); return true; }
  catch(error) { hooks.toast(error.message); return false; }
  finally { pending=false; }
}
export function mountPets(options) {
  stopPets(); hooks=options;
  controller=new AbortController();
  const root=document.querySelector('#app');
  document.addEventListener('click',e=>{
    if(!ui.selectedPet || !(e.target instanceof Element))return;
    if(e.target.closest('[data-pet], [data-select-pet]'))return;
    const scene=e.target.closest('.pet-scene');
    if(scene && !e.target.closest('button') && !ui.placing){
      const bounds=scene.getBoundingClientRect();
      const world=unproject((e.clientX-bounds.left)/bounds.width*100,(e.clientY-bounds.top)/bounds.height*100);
      if(insideFloor(world))return;
    }
    setSelection(null);
  },{capture:true,signal:controller.signal});
  root.addEventListener('click',async e=>{
    const button=e.target.closest('button');
    const scene=e.target.closest('.pet-scene');
    if(!button && scene && !pending){
      const bounds=scene.getBoundingClientRect();
      const world=unproject((e.clientX-bounds.left)/bounds.width*100,(e.clientY-bounds.top)/bounds.height*100);
      if(!insideFloor(world)){if(ui.placing)hooks.toast('바닥의 초록색 자리를 골라 주세요.');return;}
      if(ui.placing){
        const point=snap(world),item=hooks.home().items.find(item=>item.id===ui.placing);
        if(!item||!placementAllowed(hooks.home().items,item,ui.space,point,ui.rotation)){hooks.toast('다른 가구와 겹치는 자리예요. 초록색 자리를 골라 주세요.');return;}
        if(await act({type:'place',item:ui.placing,space:ui.space,...point,rotation:ui.rotation},'여기에 놓았어요')){ui.placing=null;hooks.render();}
      }else if(ui.selectedPet){
        const target=cellAt(world);
        flashFloorCell(scene,world,!walkable(hooks.home().items,ui.space,target.c,target.r)||!petStepClear(cellCenter(target.c,target.r),cellCenter(target.c,target.r),otherPetSegments(ui.selectedPet)));
        if(!movePet(ui.selectedPet,target))hooks.toast('친구나 가구가 있는 셀은 피해서 골라 주세요.');
      }
      return;
    }
    if (!button || pending) return;
    if(button.dataset.petSpace){ui.space=button.dataset.petSpace;ui.placing=null;setSelection(null);for(const id of petIds)walkTokens[id]++; hooks.render(); return;}
    if(button.dataset.petPanel){ui.panel=button.dataset.petPanel; ui.placing=null; hooks.render();return;}
    if(button.dataset.selectPet){setSelection(button.dataset.selectPet);return;}
    if(button.dataset.pet){setSelection(button.dataset.pet);return;}
    if(button.dataset.buy){await act({type:'buy',product:button.dataset.buy},'우리 집에 작은 선물이 생겼어요');return;}
    if(button.dataset.place || button.dataset.furniture){ui.placing=button.dataset.place || button.dataset.furniture;ui.rotation=hooks.home().items.find(item=>item.id===ui.placing)?.rotation||0;ui.panel='decorate';hooks.render();return;}
    if(button.dataset.store){await act({type:'store',item:button.dataset.store},'가구를 보관함에 넣었어요');return;}
    if(button.dataset.slot){const [x,y]=button.dataset.slot.split(',').map(Number);const id=ui.placing;if(await act({type:'place',item:id,space:ui.space,x,y,rotation:ui.rotation},'여기에 놓았어요')){ui.placing=null;hooks.render();}return;}
    switch(button.dataset.petAction){
      case 'claim': await act({type:'claim'},'하트를 받았어요 ♡');break;
      case 'feed': {const id=ui.pet;if(await act({type:'feed',pet:id},`${names[id]}가 맛있게 먹었어요`))react(id,'eat');break;}
      case 'pat': react(ui.pet,'happy');break;
      case 'sleep': react(ui.pet,'sleep');break;
      case 'cancel-place': ui.placing=null;hooks.render();break;
      case 'rotate-place': ui.rotation=ui.rotation===90?0:90;hooks.render();break;
    }
  },{signal:controller.signal});
  // Movement is a local visual effect; shared care and furniture are server state.
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const id of petIds)for(const pose of ['front','side','back']){const img=new Image();img.src=petImage(id,pose);}
  if(!reduced){later(()=>wander('mochi'),1200);later(()=>wander('kuki'),2500);}
  clock=setInterval(()=>{
    const target=document.querySelector('#claim-value'),home=hooks.home();
    if(target && home) target.textContent=reward(home) ? `+${reward(home)} 받기` : countdown(home);
  },1000);
}
