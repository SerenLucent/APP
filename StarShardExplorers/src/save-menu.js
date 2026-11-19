import {openEmailMenu} from './email-menu.js';
import {emailAccountStatus,logoutPlayer} from './adventure-wallet.js';
import {lockDialogScroll} from './dialog-scroll-lock.js';
export function mountSaveMenu(parent){
 const button=document.createElement('button');button.className='mode-stats-button';button.textContent='이메일 연동';parent.append(button);
 const logout=document.createElement('button');logout.className='account-logout';logout.textContent='로그아웃';logout.hidden=true;parent.append(logout);
 async function refresh(){try{const result=await emailAccountStatus();button.textContent=result.linked?'이메일 연동됨':'이메일 연동';button.disabled=result.linked;logout.hidden=!result.linked;}catch{button.textContent='이메일 연동';}}
 button.onclick=()=>{const dialog=openEmailMenu({mode:'link'});dialog.addEventListener('close',refresh,{once:true});};
 logout.onclick=()=>{
  const dialog=document.createElement('dialog');dialog.className='battle-shop email-dialog';
  dialog.innerHTML='<header><h2>로그아웃할까요?</h2><button data-close aria-label="닫기">×</button></header><p>저장된 기록은 유지돼요. 이메일 인증으로 다시 이어할 수 있어요.</p><p>로그아웃 후에는 게스트로 새로 시작할 수 있어요.</p><p role="status" aria-live="polite"></p><button data-confirm class="battle-primary">로그아웃</button>';
  document.body.append(dialog);dialog.showModal();lockDialogScroll(dialog);let busy=false;
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.querySelector('[data-confirm]').onclick=async()=>{busy=true;for(const b of dialog.querySelectorAll('button'))b.disabled=true;try{await logoutPlayer();location.href=import.meta.env.BASE_URL;}catch(e){dialog.querySelector('[role=status]').textContent=e.message;busy=false;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}};
 };
 refresh();
}
