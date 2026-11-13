import {emailAccountStatus,requestEmailCode,verifyEmailCode} from './adventure-wallet.js';
import {lockDialogScroll} from './dialog-scroll-lock.js';
import './adventure-battle-shop.css';
import './email-menu.css';
export function openEmailMenu({mode='link',onAdvanced}={}){
 const dialog=document.createElement('dialog');dialog.className='battle-shop email-dialog';
 dialog.innerHTML='<header><h2></h2><button data-close aria-label="닫기">×</button></header><p data-description></p><form><label>이메일 주소<input data-email type="email" autocomplete="email" required maxlength="254" placeholder="사용하는 이메일 주소"></label><button type="button" data-send class="battle-primary">인증번호 받기</button><section data-verification hidden><label>인증번호<input data-code type="text" inputmode="numeric" autocomplete="one-time-code" maxlength="6" pattern="[0-9]{6}" placeholder="6자리 인증번호"></label><p>인증번호는 10분 동안 유효해요.</p><button data-edit type="button">이메일 다시 입력</button><button class="battle-primary" data-verify type="submit">인증하고 연결하기</button></section></form><p class="battle-feedback" role="status" aria-live="polite"></p><div class="email-extras"><button data-switch type="button">기존 이메일로 이어하기</button><button data-advanced type="button">복구 파일 사용</button></div>';
 document.body.append(dialog);dialog.showModal();lockDialogScroll(dialog);
 const q=s=>dialog.querySelector(s),email=q('[data-email]'),code=q('[data-code]'),status=q('[role=status]'),send=q('[data-send]');let busy=false,challenge=null,requestId=null,linked=false;
 function render(){q('h2').textContent=mode==='link'?'이메일 연동':'이메일로 이어하기';q('[data-description]').textContent=mode==='link'?'지금까지 키운 기록을 그대로 연결해요.':'인증번호로 다른 기기의 기록을 이어가요. 현재 게스트 기록과 합쳐지지는 않아요.';q('[data-switch]').hidden=mode==='login';q('[data-advanced]').hidden=!onAdvanced;
 const seconds=challenge?Math.max(0,Math.ceil((challenge.resendAt-Date.now())/1000)):0;
 for(const c of dialog.querySelectorAll('input,button'))c.disabled=busy;
 email.disabled=busy||!!challenge||linked;send.disabled=busy||linked||seconds>0;send.textContent=busy?'처리 중…':seconds?seconds+'초 후 다시 보내기':challenge?'인증번호 다시 받기':'인증번호 받기';q('[data-verify]').disabled=busy||linked;q('[data-verification]').hidden=!challenge||linked;q('form').hidden=linked;
 }
 async function run(task){if(busy)return;busy=true;render();try{await task();}catch(e){status.textContent=e.message;}finally{busy=false;render();if(challenge&&!linked)code.focus();}}
 q('[data-edit]').onclick=()=>{challenge=null;requestId=null;code.value='';status.textContent='';render();email.focus();};
 q('[data-close]').onclick=()=>dialog.close();dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});const timer=setInterval(render,1000);dialog.addEventListener('close',()=>{clearInterval(timer);dialog.remove();},{once:true});
 q('[data-switch]').onclick=()=>{mode='login';challenge=null;requestId=null;linked=false;code.value='';status.textContent='';render();};
 q('[data-advanced]').onclick=()=>{dialog.close();onAdvanced?.();};
 send.onclick=()=>{if(!email.reportValidity())return;run(async()=>{status.textContent='인증메일을 보내는 중…';requestId ||= crypto.randomUUID();const result=await requestEmailCode(email.value.trim(),mode,requestId);if(result.alreadyLinked){linked=true;status.textContent=result.maskedEmail+'에 연결되어 있어요.';return;}challenge=result;requestId=null;status.textContent='메일이 도착했다면 인증번호를 입력해 주세요. 보이지 않으면 스팸함도 확인해 주세요.';code.focus();});};
 q('form').onsubmit=e=>{e.preventDefault();if(!challenge||!/^\d{6}$/.test(code.value)){status.textContent='인증번호 6자리를 입력해 주세요.';return;}run(async()=>{status.textContent=mode==='link'?'기록을 연결하는 중…':'기록을 불러오는 중…';const result=await verifyEmailCode(email.value.trim(),mode,challenge.challengeId,code.value);code.value='';linked=true;status.textContent=result.maskedEmail+'에 연결했어요. 게스트로 키운 기록도 그대로예요.';if(mode==='login')location.href=import.meta.env.BASE_URL+'adventure-menu.html';});};
 render();if(mode==='link')run(async()=>{status.textContent='연결 상태를 확인하는 중…';const result=await emailAccountStatus();linked=result.linked;status.textContent=linked?result.maskedEmail+'에 연결되어 있어요.':'';});return dialog;
}
