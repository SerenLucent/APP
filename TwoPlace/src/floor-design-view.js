import {floorProduct,isFloorProduct} from '../shared/floor-designs.js';
import {isoScenery} from './pet-art.js';
const names={yard:'앞마당',home:'거실',momoRoom:'모모네방',kukiRoom:'쿠키네방'};
export function chooseFloor({item,space,home,action,toast}){
 const p=floorProduct(item.product),d=document.createElement('dialog');let busy=false;
 d.className='pet-status-dialog floor-picker';
 const current=home().items.find(i=>i.space===space&&isFloorProduct(i.product));
 const preview=[...home().items.filter(i=>!isFloorProduct(i.product)),{...item,space}];
 d.innerHTML=`<button class="status-close" aria-label="바닥 미리보기 닫기">×</button><h2>${p.name}</h2><p>${names[space]} 전체에 적용해요. 기존 바닥은 보관함으로 돌아가요.</p><div class="floor-room-preview">${isoScenery(space,preview)}</div><p class="floor-dimensions">20 × 20 셀 유지 · 가구 위치와 이동 경로 유지</p><p>현재 바닥: ${floorProduct(current?.product)?.name||'기본 바닥'}</p><button class="wall-confirm" data-apply-floor>${current?.id===item.id?'이미 적용된 바닥':names[space]+'에 적용'}</button><p role="status" data-floor-status></p>`;
 document.body.append(d);const b=d.querySelector('[data-apply-floor]'),close=d.querySelector('.status-close');b.disabled=current?.id===item.id;
 close.onclick=()=>d.close();d.addEventListener('cancel',e=>{if(busy)e.preventDefault();});d.addEventListener('close',()=>d.remove(),{once:true});
 b.onclick=async()=>{if(busy)return;busy=true;b.disabled=close.disabled=true;b.textContent='서버에 저장 중입니다…';d.setAttribute('aria-busy','true');try{await action({type:'applyFloor',item:item.id,space});toast?.(names[space]+' 바닥을 '+p.name+'로 바꿨어요');d.close();}catch(e){d.querySelector('[data-floor-status]').textContent=e.message;busy=false;b.disabled=close.disabled=false;b.textContent='다시 적용';d.setAttribute('aria-busy','false');}};
 d.showModal();
}
