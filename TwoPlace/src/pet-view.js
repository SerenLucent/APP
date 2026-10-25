import {INVENTORY_TABS,inventoryCategory} from './pet-inventory.js';
import {initialPlacement} from './pet-placement.js';
import {actorDepth,motionPoint} from './pet-depth.js';
import {petLevel,careRewardReady,starving} from '../shared/pet-care.js';
import {mountPetBackground} from './pet-background.js';
import {petImage,PET_POSES} from './pet-sprites.js';
import {isTabletop} from '../shared/household-catalog.js';
import {TABLE_SURFACES,tableSlot,availableTableSlot,foodPlacementAvailability} from '../shared/tabletop.js';
import {furnishingModel} from './furnishing-model.js';
import {furnitureLayout} from '../shared/furniture-layout.js';
import {furnitureSprites} from './furniture-assets.js';
import {PRODUCT_ACTIONS,PRODUCT_SPACES,usableInSpace} from '../shared/pet-products.js';
import {mountPetCamera} from './pet-camera.js';
import './pets.css';
import './pets-iso.css';
import {isoScenery,isoFurniture} from './pet-art.js';
import {project,unproject,insideFloor,cellCenter,cellAt,snap,placementAllowed,walkable,findPath,petStepClear,facingForVector,fromWorld,GRID_SIZE,footprint} from '../shared/pet-space.js';

const esc = value => String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const names = {mochi:'모모',kuki:'쿠키'};
const spaces = {yard:'앞마당',home:'거실',momoRoom:'모모네방',kukiRoom:'쿠키네방'};
function sceneDoors(){
  if(ui.space==='yard')return '<button class="scene-door house-entry" data-pet-space="home" aria-label="집 문 열고 거실로 들어가기" title="거실로 들어가기"></button>';
  if(ui.space==='home')return '<button class="scene-door room-entry momo-entry" data-pet-space="momoRoom" aria-label="모모네방 들어가기" title="모모네방"></button><button class="scene-door room-entry kuki-entry" data-pet-space="kukiRoom" aria-label="쿠키네방 들어가기" title="쿠키네방"></button><button class="scene-exit" data-pet-space="yard">← 앞마당으로</button>';
  return '<button class="scene-door bedroom-exit-door" data-pet-space="home" aria-label="방 문 열고 거실로 나가기" title="거실로 나가기"></button><button class="scene-exit" data-pet-space="home">← 거실로</button>';
}
const petIds = ['mochi','kuki'];
const ui = {space:'yard',panel:'care',pet:'mochi',selectedPet:null,placing:null,rotation:0,draft:null,furniture:null,feeding:null,status:false,placeSaving:false,focusPlacement:false,inventoryTab:'all'};
const facings={mochi:{pose:'front',flip:1},kuki:{pose:'front',flip:1}};
const walkTokens={mochi:0,kuki:0};
const motions={};
const furnitureUses={};
const furnitureReservations={};
const litFurniture=new Set();
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
function reward(home) { return !starving(home,now())&&now()-home.lastClaim>=3600000?10:0; }
function countdown(home) {
  const remaining = Math.max(0,Math.ceil((home.lastClaim+3600000-now())/1000));
  return `${String(Math.floor(remaining/60)).padStart(2,'0')}:${String(remaining%60).padStart(2,'0')}`;
}
function furnitureArt(product,rotation=0) { return isoFurniture(product,rotation); }
function settleMotion(id){
 const motion=motions[id];if(!motion)return;
 const t=Math.min(1,Math.max(0,(Date.now()-motion.startedAt)/motion.duration));
 positions[id]={x:motion.from.x+(motion.to.x-motion.from.x)*t,y:motion.from.y+(motion.to.y-motion.from.y)*t};
 const actor=document.querySelector(`.actor-${id}`);if(actor){const point=project(positions[id]);actor.style.transition='none';actor.style.left=point.x+'%';actor.style.top=point.y+'%';actor.style.zIndex=String(actorDepth(positions[id]));actor.getBoundingClientRect();actor.style.transition='';}
 delete motions[id];
}
function setSelection(id){
  if(id)delete furnitureReservations[id];
  if(id&&furnitureUses[id])releaseFurniture(id);
  ui.selectedPet=id;
  document.querySelectorAll('.pet-actor').forEach(actor=>{
    const selected=actor.dataset.pet===id;
    actor.classList.toggle('is-selected',selected);
    actor.setAttribute('aria-pressed',String(selected));
    if(selected){
      walkTokens[id]++;
      settleMotion(id);
      actor.classList.remove('walking');
      actor.dataset.mood='';
      actor.querySelector('.pet-speech').textContent='';
    }
  });
}
function selectCarePet(id){
 ui.pet=id;
  document.querySelectorAll('[data-select-pet]').forEach(profile=>{
    const selected=profile.dataset.selectPet===ui.pet;
    profile.classList.toggle('chosen',selected);
    profile.setAttribute('aria-pressed',String(selected));
  });
  const feedLabel=document.querySelector('[data-pet-action="feed"] strong');
  if(feedLabel&&!ui.feeding)feedLabel.textContent=`${names[ui.pet]} 먹이 주기`;const panel=document.querySelector('.pet-panel');if(ui.panel==='care'&&panel)panel.innerHTML=carePanel(hooks.home());
}
function flashFloorCell(scene,world,blocked=false){
  scene.querySelectorAll('.move-cell-feedback').forEach(marker=>marker.remove());
  const {c,r}=cellAt(world);
  const vertices=[[c,r],[c+1,r],[c+1,r+1],[c,r+1]].map(([x,y])=>{
    const point=project(fromWorld(x/GRID_SIZE,y/GRID_SIZE));return `${point.x},${point.y}`;
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
function placedFurniture(item,catalog,items=[]){
  const parent=items.find(i=>i.id===item.parentId),surface=parent?tableSlot(parent,item.slot):null,rotation=surface?((parent.rotation||0)+(item.rotation||0))%360:(item.rotation||0);
  const point=surface?.screen||project(item),layout=furnitureLayout(item),frame=furnitureSprites[item.product]?.frames[layout.rotation/90];
 const model=furnishingModel(item.product,rotation),width=model?model.width*44*(1000/12)/100/20:layout.widthPercent*GRID_SIZE*(1000/12)/100,ratio=model?model.width/model.height:frame?frame.w/frame.h:1;
 return `<button class="placed-furniture" data-product="${item.product}" data-use-furniture="${item.id}" aria-label="${esc(catalog.find(p=>p.id===item.product)?.name||'가구')} 사용하기" style="left:${point.x}%;top:${point.y}%;z-index:${item.product==='rug'?1:surface?Math.round(project(parent).y*10)+10:Math.round(point.y*10)+9};--item-size:${width}px;--sprite-height:${width/ratio}px;--ground-depth:${width/4}px;--anchor-x:${(model?.anchorX??.5)*100}%;--anchor-y:${(model?.anchorY??.75)*100}%">${furnitureArt(item.product,rotation)}</button>`;
}
function placementGrid(home){
 const item=home.items.find(item=>item.id===ui.placing);if(!item)return '';
 const draft=ui.draft,valid=draft&&(isTabletop(item.product)?draft.parentId&&availableTableSlot(home.items,draft.parentId,draft.slot,item.id):placementAllowed(home.items,item,ui.space,draft,ui.rotation));
 let targets='';if(isTabletop(item.product)){targets=home.items.filter(i=>i.space===ui.space&&TABLE_SURFACES[i.product]).map(parent=>{const surface=TABLE_SURFACES[parent.product];return Array.from({length:surface.columns*surface.rows},(_,slot)=>{const p=tableSlot(parent,slot).screen;return '<button class="tabletop-slot" data-table-parent="'+parent.id+'" data-table-slot="'+slot+'" style="left:'+p.x+'%;top:'+p.y+'%" '+(availableTableSlot(home.items,parent.id,slot,item.id)?'':'disabled')+'>＋</button>';}).join('');}).join('');}
 const preview=draft?placedFurniture({...item,...draft,rotation:ui.rotation},hooks?.catalog||[],home.items).replace('data-use-furniture="'+item.id+'"','data-draft="true"').replace('class="placed-furniture"','class="placed-furniture draft-furniture '+(valid?'valid':'invalid')+'"'):'';
 return '<div class="placement-hint" role="status" aria-busy="'+ui.placeSaving+'"><span class="placement-message">'+(ui.placeSaving?'서버에 저장 중입니다…':'터치하거나 가구를 드래그한 뒤 확인해 주세요')+'</span><div class="placement-buttons"><button data-pet-action="rotate-place" '+(ui.placeSaving?'disabled':'')+'>회전</button><button data-pet-action="confirm-place" '+(valid&&!ui.placeSaving?'':'disabled')+'>'+(ui.placeSaving?'저장 중…':'확인')+'</button><button data-pet-action="cancel-place" '+(ui.placeSaving?'disabled':'')+'>취소</button></div></div>'+preview+'<div class="placement-grid tabletop-targets">'+targets+'</div>';
}
function furnitureMenu(home){const item=home.items.find(i=>i.id===ui.furniture);if(!item||item.space!==ui.space||ui.placing)return '';return '<div class="furniture-actions"><button data-use-furniture-now="'+item.id+'">사용</button><button data-place="'+item.id+'">변경</button><button data-store="'+item.id+'">보관</button></div>';}
function beginPlacement(id){const item=hooks.home().items.find(i=>i.id===id);if(!item)return;if(isTabletop(item.product)&&!foodPlacementAvailability(hooks.home().items,ui.space,item.id).hasSpace){hooks.toast('먼저 이 공간에 빈자리가 있는 식탁을 배치해 주세요.');return;}ui.placing=id;ui.furniture=null;ui.rotation=item.rotation||0;ui.draft=initialPlacement(hooks.home().items,item,ui.space,ui.rotation);ui.focusPlacement=true;ui.panel='decorate';hooks.render();requestAnimationFrame(()=>document.querySelector('.pet-map-shell')?.scrollIntoView({behavior:matchMedia('(prefers-reduced-motion: reduce)').matches?'instant':'smooth',block:'start'}));}
function previewAt(point){if(ui.placeSaving)return;const item=hooks.home().items.find(i=>i.id===ui.placing);if(!item||isTabletop(item.product))return;const snapped=snap(point);if(ui.draft?.x===snapped.x&&ui.draft?.y===snapped.y)return;ui.draft=snapped;const scene=document.querySelector('.pet-scene'),old=scene.closest('.pet-viewport').querySelector('.placement-hint');old?.remove();scene.querySelector('.draft-furniture')?.remove();scene.querySelector('.tabletop-targets')?.remove();scene.insertAdjacentHTML('beforeend',placementGrid(hooks.home()));const menu=scene.querySelector('.placement-hint');if(menu)scene.closest('.pet-viewport').append(menu);}

function careIcon(type,filled){const shapes={feed:'<path d="m12 2 3.1 6.3 6.9 1-5 4.9 1.2 6.9L12 17.8l-6.2 3.3L7 14.2l-5-4.9 6.9-1Z"/>',pat:'<path d="M12 21S2 15 2 8.5C2 2 9 1 12 6c3-5 10-4 10 2.5C22 15 12 21 12 21Z"/>',sleep:'<path d="M20.8 15.6A9.5 9.5 0 0 1 8.4 3.2 9.6 9.6 0 1 0 20.8 15.6Z"/>',status:'<circle cx="12" cy="12" r="9"/><path d="M12 10v7m0-11v1" fill="none"/>'};return '<svg class="care-icon '+(filled?'filled':'outlined')+' icon-'+type+'" viewBox="0 0 24 24" aria-hidden="true">'+shapes[type]+'</svg>';}
function carePanel(home) {
 const feed=home.snacks>0&&petLevel(home.pets[ui.pet],'hunger',now())<100,pat=careRewardReady(home,ui.pet,'pat',now()),sleep=careRewardReady(home,ui.pet,'sleep',now());
 return '<div class="pet-profiles">'+petIds.map(id=>'<button class="pet-profile '+(ui.pet===id?'chosen':'')+'" data-select-pet="'+id+'" aria-pressed="'+(ui.pet===id)+'"><img src="'+petImage(id)+'" alt=""><span><strong>'+names[id]+'</strong><small>'+(id==='mochi'?'하트처럼 포근한 친구':'별빛처럼 다정한 친구')+'</small><span class="hunger-track" role="progressbar" aria-label="'+names[id]+' 배부름" aria-valuemin="0" aria-valuemax="100" aria-valuenow="'+Math.ceil(petLevel(home.pets[id],'hunger',now()))+'"><i style="width:'+petLevel(home.pets[id],'hunger',now())+'%"></i></span><small>배부름 '+Math.ceil(petLevel(home.pets[id],'hunger',now()))+'%</small></span></button>').join('')+'</div><div class="care-actions">'+
 '<button data-pet-action="feed" '+(ui.feeding?'disabled aria-busy="true" class="is-busy"':'')+'><span>'+careIcon('feed',feed)+'</span><strong>'+(ui.feeding?'먹이를 주는 중입니다…':names[ui.pet]+' 먹이 주기')+'</strong><small>보유 먹이 '+home.snacks+'개</small></button>'+
 '<button data-pet-action="pat"><span>'+careIcon('pat',pat)+'</span><strong>쓰다듬기</strong><small>'+(pat?'친밀도 0% · +1 하트':'친밀도를 100% 채워요')+'</small></button>'+
 '<button data-pet-action="sleep"><span>'+careIcon('sleep',sleep)+'</span><strong>잠깐 쉬기</strong><small>'+(sleep?'휴식을 주면 +1 하트':'체력을 100% 채워요')+'</small></button>'+
 '<button data-pet-action="status"><span>'+careIcon('status',false)+'</span><strong>'+names[ui.pet]+' 상태보기</strong><small>배부름 · 친밀도 · 체력</small></button></div><div class="care-rules"><p>모모와 쿠키 모두 배부름이 0%가 되면<br>시간 하트를 받지 못해요.</p><p>친밀도와 체력은 4시간에 걸쳐 100%에서 0%로 줄어요.</p><p>친밀도 0%일 때 쓰다듬으면 +1 하트, 체력 0%일 때 휴식을 주면 +1 하트. 보상은 친구마다 종류별 4시간에 한 번씩 받을 수 있어요.</p></div>';
}
function showPetStatus(){
 const dialog=document.createElement('dialog');dialog.className='pet-status-dialog';dialog.innerHTML='<button class="status-close" aria-label="상태보기 닫기">×</button><h2>'+names[ui.pet]+' 상태보기</h2><p>돌보기 메뉴에서 게이지를 채워 주세요.</p>'+[['hunger','배부름'],['affinity','친밀도'],['energy','체력']].map(([key,label])=>'<div class="status-stat"><div>'+label+'<strong data-stat-value="'+key+'"></strong></div><div class="status-track" role="progressbar" aria-label="'+label+'" aria-valuemin="0" aria-valuemax="100" data-stat-gauge="'+key+'"><i></i></div></div>').join('')+'<p>배부름은 1시간에 4%씩 줄어요.<br>친밀도와 체력은 4시간에 걸쳐<br>100%에서 0%로 줄어요.<br>먹이로 배부름을, 쓰다듬기로 친밀도를,<br>휴식으로 체력을 채울 수 있어요.</p>';
 dialog.dataset.petStatus=ui.pet;document.body.append(dialog);dialog.querySelector('button').onclick=()=>dialog.close();dialog.addEventListener('close',()=>dialog.remove(),{once:true});dialog.showModal();updateStatus();
}
function updateCareDisplay(home){
 for(const profile of document.querySelectorAll('[data-select-pet]')){const value=petLevel(home.pets[profile.dataset.selectPet],'hunger',now()),gauge=profile.querySelector('[role="progressbar"]');gauge.setAttribute('aria-valuenow',Math.ceil(value));gauge.querySelector('i').style.width=value+'%';profile.querySelector('small:last-child').textContent='배부름 '+Math.ceil(value)+'%';}
 for(const type of ['feed','pat','sleep']){const button=document.querySelector('[data-pet-action="'+type+'"]');if(!button)continue;const ready=type==='feed'?home.snacks>0&&petLevel(home.pets[ui.pet],'hunger',now())<100:careRewardReady(home,ui.pet,type,now()),icon=button.querySelector('svg');icon?.classList.toggle('filled',ready);icon?.classList.toggle('outlined',!ready);if(type!=='feed')button.querySelector('small').textContent=ready?(type==='pat'?'친밀도 0% · +1 하트':'휴식을 주면 +1 하트'):(type==='pat'?'친밀도를 100% 채워요':'체력을 100% 채워요');}
}
function updateStatus(){const dialog=document.querySelector('[data-pet-status]');if(!dialog)return;const pet=hooks.home().pets[dialog.dataset.petStatus];for(const key of ['hunger','affinity','energy']){const value=petLevel(pet,key,now());dialog.querySelector('[data-stat-value="'+key+'"]').textContent=Math.ceil(value)+'%';const gauge=dialog.querySelector('[data-stat-gauge="'+key+'"]');gauge.setAttribute('aria-valuenow',String(Math.ceil(value)));gauge.querySelector('i').style.width=value+'%';}}

function shopPanel(home,catalog) {
  return `<div class="pet-shop-note">${spaces[ui.space]}에 어울리는 가구 · 하트로 작은 행복을 선물해 주세요.<span>보유 ♡ ${home.hearts}</span></div><div class="pet-shop-grid">${catalog.filter(product=>usableInSpace(product.id,ui.space)).map(product=>`<article class="shop-product">${product.type === 'food' ? '<span class="food-art">'+careIcon('feed',true)+'</span>' : furnitureArt(product.id)}<strong>${esc(product.name)}</strong><p>${isTabletop(product.id)?'식탁 위 전용 · ':product.type==='furniture'?footprint({product:product.id,rotation:0}).join(' × ')+'셀 · ':''}${esc(product.description)}</p><button data-buy="${product.id}" ${home.hearts<product.price ? 'disabled' : ''} aria-label="${esc(product.name)} 구매 ${product.price}하트">♡ ${product.price} <span>${home.hearts<product.price ? '하트 부족' : '구매하기'}</span></button></article>`).join('')}</div>`;
}
function decoratePanel(home,catalog) {
  const items=home.items.filter(item=>ui.inventoryTab==='all'||inventoryCategory(item.product)===ui.inventoryTab);
  const tabs=`<div class="inventory-tabs" aria-label="보관함 분류">${Object.entries(INVENTORY_TABS).map(([id,label])=>`<button data-inventory-tab="${id}" aria-pressed="${ui.inventoryTab===id}" class="${ui.inventoryTab===id?'active':''}">${label}<span>${home.items.filter(item=>id==='all'||inventoryCategory(item.product)===id).length}</span></button>`).join('')}</div>`;
  if (!home.items.length) return tabs+'<div class="pet-empty"><span>⌂</span><strong>우리만의 공간을 꾸며 봐요</strong><p>상점에서 가구를 구매하면 여기에 모여요.<br>가구를 고른 뒤 원하는 위치를 눌러 배치하세요.</p><button data-pet-panel="shop">상점 구경하기 ↗</button></div>';
  return `${tabs}<p class="decorate-guide">구매한 가구가 모든 공간에서 여기에 보여요.<br>각 공간에 맞는 가구만 배치할 수 있어요.</p><div class="inventory-list">${items.map(item=>{const product=catalog.find(p=>p.id===item.product),food=isTabletop(item.product),availability=food?foodPlacementAvailability(home.items,ui.space,item.id):null;return `<div class="inventory-item ${ui.placing === item.id ? 'picked' : ''}">${furnitureArt(item.product,item.rotation)}<span><strong>${esc(product?.name || '가구')}</strong><small>${item.space ? (spaces[item.space]||'이전 테라스')+'에 배치됨' : '보관함에 있어요'}</small></span><button data-place="${item.id}" ${food&&!availability.hasSpace?`disabled title="${availability.hasTable?'식탁 위에 빈자리가 없어요':'먼저 이 공간에 식탁을 배치해 주세요'}"`:''} ${usableInSpace(item.product,ui.space) ? '' : `data-place-space="${(PRODUCT_SPACES[item.product]||[]).find(space=>spaces[space])||'home'}"`}>${food&&!availability.hasSpace?(availability.hasTable?'자리 없음':'식탁 필요'):ui.placing === item.id ? '선택됨' : '배치'}</button>${item.space ? `<button class="store-item" data-store="${item.id}">보관</button>` : ''}</div>`;}).join('')||`<div class="inventory-empty">아직 ${INVENTORY_TABS[ui.inventoryTab]} 항목이 없어요.</div>`}</div>`;
}
export function petPage(home,catalog) {
  if (!home) return '<div class="empty">모모와 쿠키의 집을 준비하고 있어요.</div>';
  const settled=[];
  for(const id of petIds){
    const current=cellAt(positions[id]);
    const safe=point=>petStepClear(point,point,settled.map(other=>({from:positions[other],to:positions[other]})));
    if(!walkable(home.items,ui.space,current.c,current.r)||!safe(positions[id])){
      const candidates=[];
      for(let c=0;c<GRID_SIZE;c++)for(let r=0;r<GRID_SIZE;r++){
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
  return `<section class="pet-heading"><div><span class="eyebrow">MOMO & KUKI'S LITTLE HOME</span><h1>모모와 쿠키의 집<span>♡</span></h1><p>둘이 돌보는, 두 친구의 작은 세상.</p></div><div class="heart-wallet" aria-label="보유 하트 ${home.hearts}"><span>♡</span><strong>${home.hearts}</strong><small>우리의 하트</small></div></section><div class="space-tabs" aria-label="펫 공간">${Object.entries(spaces).filter(([id])=>id==='yard'||id==='home').map(([id,label])=>`<button data-pet-space="${id}" aria-pressed="${(ui.space===id || id==='home'&&ui.space.endsWith('Room'))}" class="${(ui.space===id || id==='home'&&ui.space.endsWith('Room')) ? 'active' : ''}">${label}</button>`).join('')}</div><div class="pet-map-shell"><div class="camera-controls" aria-label="공간 확대 축소"><button data-camera="out" aria-label="축소">−</button><button data-camera="reset" class="camera-level" aria-label="전체 공간 보기">100%</button><button data-camera="in" aria-label="확대">＋</button></div><div class="pet-viewport"><span class="camera-help">20 × 20 셀 · 두 손가락 확대 · 드래그로 둘러보기</span><section class="pet-world pet-scene iso-scene scene-${ui.space} ${ui.placing ? 'placing' : ''}" aria-label="${spaces[ui.space]} · 모모와 쿠키가 함께 지내는 공간">${isoScenery(ui.space)}${sceneDoors()}<span class="scene-location">${spaces[ui.space]} · ${ui.space==='yard'?'문을 눌러 집으로 들어가요':ui.space==='home'?'우리의 포근한 거실과 작은 주방':'우리만의 방을 꾸며요'}</span>${placed.filter(item=>item.id!==ui.placing).map(item=>placedFurniture(item,catalog,home.items)).join('')}${petIds.map(actor).join('')}${ui.placing ? placementGrid(home) : furnitureMenu(home)}<span class="scene-tip">${ui.placing ? '구매한 가구로 우리 공간을 채워요' : '친구를 고르고 바닥을 누르면 따라와요'}</span></section></div></div><button class="claim-hearts" data-pet-action="claim"><span class="claim-heart">♡</span><span><strong>시간당 하트 받기</strong><small>한 번에 10하트 · 받은 뒤 1시간 대기</small></span><span class="claim-value" id="claim-value">${reward(home) ? `+${reward(home)} 받기` : countdown(home)}</span></button><div class="pet-panel-tabs" aria-label="펫 활동">${[['care','돌보기'],['shop','상점'],['decorate','보관함']].map(([id,label])=>`<button data-pet-panel="${id}" class="${ui.panel===id ? 'active' : ''}" aria-pressed="${ui.panel===id}">${label}</button>`).join('')}</div><section class="pet-panel">${ui.panel === 'care' ? carePanel(home) : ui.panel === 'shop' ? shopPanel(home,catalog) : decoratePanel(home,catalog)}</section><p class="pet-shared-note">♡ 하트, 먹이, 가구와 배치는 같은 커플방에서 함께 사용해요.</p>`;
}
export function stopPets() {
  for(const id of petIds){releaseFurniture(id);delete furnitureReservations[id];}
  document.querySelector('.pet-status-dialog')?.remove();
  controller?.abort(); controller=null;
  for(const id of petIds){walkTokens[id]++;settleMotion(id);}
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
function movePet(id,target,onArrive){
  if(!onArrive)delete furnitureReservations[id];
  if(furnitureUses[id])releaseFurniture(id);
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
    if(!path.length){actor.classList.remove('walking');if(current.c===target.c&&current.r===target.r)onArrive?.();else delete furnitureReservations[id];return;}
    const point=cellCenter(path[0].c,path[0].r),old=project(positions[id]),next=project(point);
    if(!petStepClear(positions[id],point,otherPetSegments(id))){delete furnitureReservations[id];actor.classList.remove('walking');return;}
    const distance=Math.hypot((next.x-old.x)*scene.clientWidth/100,(next.y-old.y)*scene.clientHeight/100),duration=Math.max(160,Math.round(distance/85*1000));
    actor.style.setProperty('--move-duration',duration+'ms');
    motions[id]={from:{...positions[id]},to:point,startedAt:Date.now(),duration,until:Date.now()+duration};
    faceActor(id,facingForVector((next.x-old.x)*scene.clientWidth,(next.y-old.y)*scene.clientHeight));
    actor.classList.add('walking');
    actor.style.left=`${next.x}%`;actor.style.top=`${next.y}%`;
    const motion=motions[id];function paintDepth(){if(!actor.isConnected||motions[id]!==motion||token!==walkTokens[id])return;actor.style.zIndex=String(actorDepth(motionPoint(motion,Date.now())));if(Date.now()<motion.until)requestAnimationFrame(paintDepth);}paintDepth();
    actor.style.setProperty('--depth',.8+(next.y-42)/44*.25);
    positions[id]=point;
    later(step,duration+20);
  }
  step();return true;
}

function releaseFurniture(id){
  const use=furnitureUses[id];if(!use)return;
  positions[id]=use.exit;delete furnitureUses[id];
  const actor=document.querySelector(`.actor-${id}`);
  if(actor){actor.dataset.using='';actor.dataset.mood='';actor.querySelector('.pet-speech').textContent='';const p=project(positions[id]);actor.style.left=`${p.x}%`;actor.style.top=`${p.y}%`;actor.style.zIndex=String(actorDepth(positions[id]));}
}
function useFurniture(itemId){
  const home=hooks.home(),item=home.items.find(i=>i.id===itemId&&i.space===ui.space);
  if(!item)return;
  const action=PRODUCT_ACTIONS[item.product];
  if(action==='light'){
    if(litFurniture.has(itemId))litFurniture.delete(itemId);else litFurniture.add(itemId);
    document.querySelector(`[data-use-furniture="${itemId}"]`)?.classList.toggle('is-lit',litFurniture.has(itemId));
    hooks.toast(litFurniture.has(itemId)?'따뜻한 불빛을 켰어요':'불을 껐어요');return;
  }
  if(!action){hooks.toast('위치를 바꾸려면 보관함에서 가구를 골라 주세요.');return;}
  if(Object.values(furnitureUses).some(use=>use.item===itemId)||Object.values(furnitureReservations).includes(itemId)){hooks.toast('다른 친구가 사용 중이거나 가고 있어요.');return;}
  const id=ui.pet;walkTokens[id]++;settleMotion(id);
  const actor=document.querySelector(`.actor-${id}`);if(!actor)return;
  actor.dataset.mood='';
  const target=cellAt(item),[w,h]=footprint(item),candidates=[];
  for(let c=0;c<GRID_SIZE;c++)for(let r=0;r<GRID_SIZE;r++){
    if(Math.abs(c-target.c)>Math.ceil(w/2)+1||Math.abs(r-target.r)>Math.ceil(h/2)+1)continue;
    const point=cellCenter(c,r);if(!walkable(home.items,ui.space,c,r)||!petStepClear(point,point,otherPetSegments(id)))continue;
    const current=cellAt(positions[id]),path=findPath(home.items,ui.space,current,{c,r},(a,b)=>petStepClear(cellCenter(a.c,a.r),cellCenter(b.c,b.r),otherPetSegments(id)));
    if(path.length||current.c===c&&current.r===r)candidates.push({c,r,d:Math.abs(c-target.c)+Math.abs(r-target.r),length:path.length});
  }
  candidates.sort((a,b)=>a.d-b.d||a.length-b.length);
  if(!candidates.length){hooks.toast('가구 옆으로 갈 길이 없어요. 주변 셀을 비워 주세요.');return;}
  const arrive=()=>{
    if(!actor.isConnected||furnitureReservations[id]!==itemId)return;
    delete furnitureReservations[id];
    const exit={...positions[id]};furnitureUses[id]={item:itemId,exit};
    actor.dataset.mood='using';actor.dataset.using=action;actor.classList.remove('walking');faceActor(id,{pose:action==='sleep'?'side':'front',flip:1});
    if(['sleep','rest'].includes(action)){
      positions[id]={x:item.x,y:item.y};const p=project(item);actor.style.left=`${p.x}%`;actor.style.top=`${p.y-2}%`;actor.style.zIndex=String(Math.round(p.y*10)+11);
    }
    const messages={sleep:'z z z…',rest:'폭신폭신 ♡',read:'한 장 더…',study:'끄적끄적 ✎',tea:'따뜻한 차 한 잔',play:'통통! 재밌어',drink:'꿀꺽꿀꺽',water:'쑥쑥 자라라',watch:'물고기다!',dress:'오늘도 단정하게 ♡',tidy:'차곡차곡'};
    actor.querySelector('.pet-speech').textContent=messages[action]||'♡';
    hooks.toast(`${names[id]} · ${messages[action]||'가구를 사용해요'}`);
    later(()=>releaseFurniture(id),action==='sleep'?16000:9000);
  };
  const next=candidates[0],current=cellAt(positions[id]);
  furnitureReservations[id]=itemId;
  if(current.c===next.c&&current.r===next.r)arrive();else if(!movePet(id,next,arrive)){delete furnitureReservations[id];hooks.toast('친구가 움직이는 중이에요. 잠시 후 눌러 주세요.');}
}
function wander(id) {
  if (controller?.signal.aborted) return;
  const actor=document.querySelector(`.actor-${id}`);
  if (!actor) return;
  if (!actor.dataset.mood && !ui.placing && ui.selectedPet!==id) {
    for(let i=0;i<12;i++)if(movePet(id,{c:Math.floor(Math.random()*GRID_SIZE),r:Math.floor(Math.random()*GRID_SIZE)}))break;
  }
  later(()=>wander(id),6500+Math.random()*3500);
}
function updateFeeding(){
 const feeding=!!ui.feeding;
 document.querySelectorAll('.care-actions button,[data-select-pet]').forEach(button=>button.disabled=feeding);
 const button=document.querySelector('[data-pet-action="feed"]');if(!button)return;
 button.classList.toggle('is-busy',feeding);button.setAttribute('aria-busy',String(feeding));
 button.querySelector('strong').textContent=feeding?'먹이를 주는 중입니다…':names[ui.pet]+' 먹이 주기';
}
async function act(action,success) {
  if(pending) return false;
  pending=true;const careButton=document.querySelector('[data-pet-action="'+action.type+'"]');if(['pat','sleep'].includes(action.type)&&careButton){careButton.disabled=true;careButton.classList.add('is-busy');careButton.setAttribute('aria-busy','true');careButton.querySelector('strong').textContent=action.type==='pat'?'쓰다듬는 중입니다…':'쉬게 하는 중입니다…';}
  try { await hooks.action(action); if(success) hooks.toast(success); return true; }
  catch(error) { hooks.toast(error.message); return false; }
  finally { pending=false;if(['pat','sleep'].includes(action.type)&&ui.panel==='care'){const panel=document.querySelector('.pet-panel');if(panel)panel.innerHTML=carePanel(hooks.home());} }
}
export function mountPets(options) {
  stopPets(); hooks=options;
  controller=new AbortController();
  const root=document.querySelector('#app');
  const viewport=root.querySelector('.pet-viewport');if(viewport){const camera=mountPetCamera(viewport,ui.space,controller.signal);if(ui.focusPlacement&&ui.draft){camera.focus(project(ui.draft));ui.focusPlacement=false;}mountPetBackground(viewport.querySelector('.pet-world'),ui.space,controller.signal);for(const menu of viewport.querySelectorAll('.placement-hint,.furniture-actions'))viewport.append(menu);}
  let drag=null;
  root.addEventListener('pointerdown',e=>{if(pending||ui.placeSaving||!e.target.closest('[data-draft]'))return;e.stopPropagation();const scene=e.target.closest('.pet-scene');const bounds=scene.getBoundingClientRect(),start=unproject((e.clientX-bounds.left)/bounds.width*100,(e.clientY-bounds.top)/bounds.height*100);drag={id:e.pointerId,scene,moved:false,x:e.clientX,y:e.clientY,start,before:{...ui.draft}};scene.dataset.draggingFurniture='true';root.setPointerCapture(e.pointerId);},{signal:controller.signal});
  root.addEventListener('pointermove',e=>{if(!drag||drag.id!==e.pointerId)return;if(Math.hypot(e.clientX-drag.x,e.clientY-drag.y)<5&&!drag.moved)return;drag.moved=true;const r=drag.scene.getBoundingClientRect();const point=unproject((e.clientX-r.left)/r.width*100,(e.clientY-r.top)/r.height*100);previewAt({x:drag.before.x+point.x-drag.start.x,y:drag.before.y+point.y-drag.start.y});e.preventDefault();},{signal:controller.signal});
  for(const event of ['pointerup','pointercancel'])root.addEventListener(event,e=>{if(!drag||drag.id!==e.pointerId)return;delete drag.scene.dataset.draggingFurniture;drag=null;},{signal:controller.signal});
  document.addEventListener('click',e=>{
    if(e.target instanceof Element&&ui.furniture&&e.target.closest('.pet-viewport')&&!e.target.closest('.furniture-actions')&&(!e.target.closest('button')||e.target.closest('[data-pet]'))){ui.furniture=null;document.querySelector('.furniture-actions')?.remove();}
    if(!ui.selectedPet || !(e.target instanceof Element))return;
    if(e.target.closest('[data-pet], [data-select-pet]'))return;
    const scene=e.target.closest('.pet-scene');
    if(!scene)return;
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
        if(item&&isTabletop(item.product)){hooks.toast('음식은 식탁 상판의 빈 자리를 눌러 올려 주세요.');return;}
        if(!item||!placementAllowed(hooks.home().items,item,ui.space,point,ui.rotation)){hooks.toast('다른 가구와 겹치는 자리예요. 초록색 자리를 골라 주세요.');return;}
        previewAt(point);
      }else if(ui.selectedPet){
        const target=cellAt(world);
        flashFloorCell(scene,world,!walkable(hooks.home().items,ui.space,target.c,target.r)||!petStepClear(cellCenter(target.c,target.r),cellCenter(target.c,target.r),otherPetSegments(ui.selectedPet)));
        if(!movePet(ui.selectedPet,target))hooks.toast('친구나 가구가 있는 셀은 피해서 골라 주세요.');setSelection(null);
      }
      return;
    }
    if (!button || pending) return;
    if(button.dataset.petSpace){ui.space=button.dataset.petSpace;ui.placing=null;ui.draft=null;ui.furniture=null;setSelection(null);for(const id of petIds)walkTokens[id]++; hooks.render(); return;}
    if(button.dataset.inventoryTab){ui.inventoryTab=button.dataset.inventoryTab;hooks.render();return;}
    if(button.dataset.petPanel){ui.panel=button.dataset.petPanel; ui.placing=null; hooks.render();return;}
    if(button.dataset.selectPet){selectCarePet(button.dataset.selectPet);return;}
    if(button.dataset.pet){setSelection(button.dataset.pet);return;}
    if(button.dataset.tableParent){const parentId=button.dataset.tableParent,slot=Number(button.dataset.tableSlot);ui.draft={...tableSlot(hooks.home().items.find(i=>i.id===parentId),slot),parentId,slot};hooks.render();return;}
    if(button.dataset.useFurnitureNow){useFurniture(button.dataset.useFurnitureNow);return;}if(button.dataset.useFurniture){ui.furniture=button.dataset.useFurniture;hooks.render();return;}if(button.dataset.rotateFurniture){beginPlacement(button.dataset.rotateFurniture);ui.rotation=(ui.rotation+90)%360;hooks.render();return;}
    if(button.dataset.buy){await act({type:'buy',product:button.dataset.buy},'우리 집에 작은 선물이 생겼어요');return;}
    if(button.dataset.place || button.dataset.furniture){const selected=hooks.home().items.find(item=>item.id===(button.dataset.place||button.dataset.furniture));if(selected&&!usableInSpace(selected.product,ui.space)){const allowed=(PRODUCT_SPACES[selected.product]||[]).filter(space=>spaces[space]).map(space=>spaces[space]).join(' · ');hooks.toast(`${allowed||'다른 공간'}용 가구입니다. 해당 공간에서 배치해 주세요.`);return;}beginPlacement(button.dataset.place||button.dataset.furniture);return;}
    if(button.dataset.store){await act({type:'store',item:button.dataset.store},'가구를 보관함에 넣었어요');return;}
    if(button.dataset.slot){const [x,y]=button.dataset.slot.split(',').map(Number);const id=ui.placing;if(await act({type:'place',item:id,space:ui.space,x,y,rotation:ui.rotation},'여기에 놓았어요')){ui.placing=null;hooks.render();}return;}
    switch(button.dataset.petAction){
      case 'claim': await act({type:'claim'},'하트를 받았어요 ♡');break;
      case 'feed': {const id=ui.pet;ui.feeding=id;updateFeeding();try{if(await act({type:'feed',pet:id},`${names[id]}가 맛있게 먹었어요`))react(id,'eat');}finally{ui.feeding=null;updateFeeding();}break;}
      case 'status':showPetStatus();break;case 'pat':{const id=ui.pet;if(await act({type:'pat',pet:id},'친밀도를 100% 채웠어요 ♡'))react(id,'happy');break;}
      case 'sleep':{const id=ui.pet;if(await act({type:'sleep',pet:id},'체력을 100% 채웠어요'))react(id,'sleep');break;}
      case 'confirm-place':{const d=ui.draft;if(!d)break;const action=d.parentId?{type:'placeOnTable',item:ui.placing,parentId:d.parentId,slot:d.slot,rotation:ui.rotation}:{type:'place',item:ui.placing,space:ui.space,x:d.x,y:d.y,rotation:ui.rotation};ui.placeSaving=true;const hint=document.querySelector('.placement-hint');if(hint){hint.setAttribute('aria-busy','true');hint.querySelector('.placement-message').textContent='서버에 저장 중입니다…';hint.querySelectorAll('button').forEach(button=>button.disabled=true);hint.querySelector('[data-pet-action="confirm-place"]').textContent='저장 중…';}try{if(await act(action,'여기에 배치했어요')){ui.placing=null;ui.draft=null;}}finally{ui.placeSaving=false;hooks.render();}break;}case 'cancel-place': ui.placing=null;ui.draft=null;hooks.render();break;
      case 'rotate-place': ui.rotation=(ui.rotation+90)%360;hooks.render();break;
    }
  },{signal:controller.signal});
  // Movement is a local visual effect; shared care and furniture are server state.
  const reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  for(const id of petIds)for(const pose of PET_POSES){const img=new Image();img.src=petImage(id,pose);}
  if(!reduced){later(()=>wander('mochi'),1200);later(()=>wander('kuki'),2500);}
  clock=setInterval(()=>{
    const target=document.querySelector('#claim-value'),home=hooks.home();
    if(target && home) target.textContent=starving(home,now())?'먼저 먹이를 주세요':reward(home) ? `+${reward(home)} 받기` : countdown(home);updateStatus();if(ui.panel==='care'&&!pending)updateCareDisplay(home);
  },1000);
}
