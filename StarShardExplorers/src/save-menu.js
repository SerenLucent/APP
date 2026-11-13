import {exportPlayer,restorePlayer} from './adventure-wallet.js';
import {lockDialogScroll} from './dialog-scroll-lock.js';
export function mountSaveMenu(parent){
 const button=document.createElement('button');button.className='mode-stats-button';button.textContent='저장 관리';parent.append(button);
 button.onclick=()=>{
  const dialog=document.createElement('dialog');dialog.className='battle-shop';dialog.setAttribute('aria-label','개인 저장 관리');
  dialog.innerHTML='<header><h2>개인 저장 관리</h2><button data-close aria-label="닫기">×</button></header><p>진행과 재화는 이 플레이어의 서버 저장에 자동 반영돼요.</p><p>복구코드는 저장에 접근하는 열쇠예요. 다른 사람에게 공개하지 말고 따로 보관해 주세요.</p><button class="battle-primary" data-export>복구 파일 내려받기</button><label class="save-code-label">복구코드<input data-code type="password" autocomplete="off" placeholder="보관한 복구코드 입력"></label><label class="save-code-label">복구 파일 선택<input type="file" data-file accept="application/json,.json"></label><button class="battle-primary" data-restore>저장 연결 복구</button><p class="battle-feedback" role="status"></p>';
  document.body.append(dialog);dialog.showModal();lockDialogScroll(dialog);let busy=false;
  const status=dialog.querySelector('[role=status]'),controls=()=>dialog.querySelectorAll('button,input');
  const run=async task=>{if(busy)return;busy=true;for(const c of controls())c.disabled=true;try{await task();}catch(e){status.textContent=e.message;}finally{busy=false;for(const c of controls())c.disabled=false;}};
  dialog.querySelector('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});dialog.addEventListener('close',()=>dialog.remove(),{once:true});
  dialog.querySelector('[data-export]').onclick=()=>run(async()=>{status.textContent='저장 정보를 준비하고 있어요…';const data=await exportPlayer(),url=URL.createObjectURL(new Blob([JSON.stringify(data,null,2)],{type:'application/json'})),a=document.createElement('a');a.href=url;a.download='StarShardExplorers-save-'+new Date().toISOString().slice(0,10)+'.json';a.click();setTimeout(()=>URL.revokeObjectURL(url),30000);status.textContent='복구 파일을 내려받았어요. 안전한 곳에 보관해 주세요.';});
  dialog.querySelector('[data-restore]').onclick=()=>run(async()=>{
   let token=dialog.querySelector('[data-code]').value;const file=dialog.querySelector('[data-file]').files[0];
   if(file){if(file.size>2*1024*1024)throw Error('복구 파일이 너무 커요.');let data;try{data=JSON.parse(await file.text());}catch{throw Error('올바른 복구 JSON 파일을 선택해 주세요.');}if(data.format!=='star-shard-explorers-save'||data.version!==1)throw Error('별조각 탐험대 복구 파일을 선택해 주세요.');token=data.recoveryCode;}
   status.textContent='저장 정보를 확인하고 있어요…';await restorePlayer(token);location.reload();
  });
 };
}
