import {lockDialogScroll} from './dialog-scroll-lock.js';
import './adventure-navigation.css';
export function confirmAdventureExit({leave,pause=()=>{},resume=()=>{},fromMenu=false}){
 if(document.querySelector('.adventure-exit-dialog[open]'))return;
 pause();const dialog=document.createElement('dialog');dialog.className='adventure-exit-dialog';dialog.setAttribute('aria-label','화면 이동 확인');dialog.innerHTML='<h2>모험을 나갈까요?</h2><p>완료하지 않은 모험의 보상은 받을 수 없어요.</p><div><button data-stay>계속 플레이</button><button data-leave>나가기</button></div>';if(fromMenu){dialog.querySelector('h2').textContent='화면을 이동할까요?';dialog.querySelector('p').textContent='성장과 저장된 기록은 그대로 유지돼요.';dialog.querySelector('[data-stay]').textContent='취소';dialog.querySelector('[data-leave]').textContent='이동하기';}document.body.append(dialog);dialog.showModal();lockDialogScroll(dialog);let leaving=false;
 dialog.querySelector('[data-stay]').onclick=()=>dialog.close();dialog.querySelector('[data-leave]').onclick=()=>{leaving=true;leave();dialog.close();};dialog.addEventListener('close',()=>{dialog.remove();if(!leaving)resume();},{once:true});
}
export function installAdventureEntries(root){
 for(const old of root.querySelectorAll('a.mode-card')){const card=document.createElement('article');card.className=old.className;card.innerHTML=old.innerHTML;const label=card.querySelector(':scope > b'),button=document.createElement('button');button.type='button';button.dataset.enter='';button.dataset.destination=old.href;button.textContent=label.textContent;label.replaceWith(button);old.replaceWith(card);}
 root.addEventListener('click',event=>{const button=event.target.closest('button[data-enter]');if(!button||button.disabled||button.closest('.mode-card')?.getAttribute('aria-disabled')==='true')return;location.assign(button.dataset.destination);});
}
export function installAdventureMenuClosing(options,actions,isPaused){
 actions.addEventListener('click',event=>{const button=event.target.closest('button');if(!button)return;queueMicrotask(()=>{options.open=button.matches('[data-pause]')&&isPaused();});});
}
