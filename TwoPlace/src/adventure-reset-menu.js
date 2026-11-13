import {lockDialogScroll} from './dialog-scroll-lock.js';
import {statInvestmentTotal,skillInvestmentTotal} from '../shared/adventure-progression.js';
export function confirmCharacterReset({wallet,pet,kind,onDone}){
 const name=pet==='momo'?'모모':'쿠키',label=kind==='stats'?'스탯':'스킬';
 const refund=kind==='stats'?statInvestmentTotal(wallet.profile.stats[pet]):skillInvestmentTotal(wallet.profile.skills[pet]);
 const dialog=document.createElement('dialog');dialog.className='battle-shop';
 dialog.innerHTML='<h2>'+name+' '+label+' 초기화</h2><p>'+label+'만 초기화하며 다른 강화 항목은 유지돼요.</p><p>투자 별조각 '+refund.toLocaleString()+'개 반환 · 초기화 비용 500개</p><p>반환한 투자분만큼 캐릭터 레벨도 내려가요.</p><p role="status"></p><div class="character-upgrade-actions"><button data-cancel>취소</button><button class="battle-primary" data-confirm>초기화 · 별조각 500</button></div>';
 document.body.append(dialog);dialog.showModal();lockDialogScroll(dialog);let busy=false;
 dialog.querySelector('[data-cancel]').onclick=()=>dialog.close();
 dialog.addEventListener('cancel',e=>{if(busy)e.preventDefault();});
 dialog.addEventListener('close',()=>dialog.remove(),{once:true});
 dialog.querySelector('[data-confirm]').onclick=async()=>{if(busy)return;busy=true;for(const b of dialog.querySelectorAll('button'))b.disabled=true;dialog.querySelector('[role=status]').textContent='초기화하는 중이에요…';try{await wallet.reset(pet,kind);window.dispatchEvent(new Event('adventure-wallet-change'));onDone();dialog.close();}catch(e){dialog.querySelector('[role=status]').textContent=e.message;}finally{busy=false;for(const b of dialog.querySelectorAll('button'))b.disabled=false;}};
}
