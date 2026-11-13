import {openCharacterMenu} from './adventure-character-menu.js';
import {confirmCharacterReset} from './adventure-reset-menu.js';
import {lockDialogScroll} from './dialog-scroll-lock.js';
import {ADVENTURE_STATS, adventureLevel, characterStats, statStardustCost, availableStatStardust,statInvestmentTotal} from '../shared/adventure-progression.js';
import {createAdventureWallet} from './adventure-wallet.js';
import {openSkillMenu} from './adventure-skill-menu.js';
import './adventure-stat-menu.css';

const pets = {
 momo: {name:'모모', image:'mochi-standing-v2.png'},
 kuki: {name:'쿠키', image:'kuki-standing-v2.png'},
};
const portrait = id => import.meta.env.BASE_URL+'pets/'+pets[id].image;
const statValues = stats => ({
 strength: ['공격력', stats.minAttack+'–'+stats.maxAttack],
 vitality: ['최대 HP', stats.maxHp],
 stamina: ['최대 SP', stats.maxSp],
 dexterity: ['재주', stats.dexterity+'%'],
 luck: ['치명타', (stats.critical*100).toFixed(1)+'%'],
});

export function mountAdventureStatMenu(button){
 const wallet=createAdventureWallet();
 const updateHighlight=()=>button.classList.toggle('has-points',availableStatStardust(wallet.profile)>=200||wallet.profile.skillPoints>0);
 let loading;
 function load(){
  loading ||= wallet.init().then(updateHighlight).finally(()=>{loading=null;});
  return loading;
 }
 void load().catch(()=>{});
 window.addEventListener('adventure-wallet-change',()=>{void load().catch(()=>{});});
 window.addEventListener('pageshow',event=>{if(event.persisted)void load().catch(()=>{});});
 button.onclick=()=>openCharacterMenu({wallet,load,updateHighlight,button});
}

export async function openStatUpgrade({wallet,pet,onClose}){
 const load=()=>Promise.resolve(),updateHighlight=()=>{};
 {
  const dialog=document.createElement('dialog');
  dialog.className='adventure-stat-menu';
  dialog.setAttribute('aria-label','스탯 강화');
  dialog.innerHTML='<div class="stats-header"><h2>스탯 강화</h2><button type="button" data-close aria-label="닫기">×</button></div><div data-stat-content><p role="status">캐릭터 정보를 불러오는 중…</p></div>';
  document.body.append(dialog);
  dialog.showModal();lockDialogScroll(dialog);
  const content=dialog.querySelector('[data-stat-content]');
  let selected=pet, saving=false, message='';
  const draft={momo:{},kuki:{}};
  const count=id=>Object.values(draft[id]).reduce((total,amount)=>total+amount,0);
  dialog.querySelector('[data-close]').onclick=()=>{if(!saving)dialog.close();};
  dialog.addEventListener('cancel',event=>{if(saving)event.preventDefault();});
  dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});

  function render(){
   const {stats,points,skillPoints,stardust}=wallet.profile;
   const available=availableStatStardust(wallet.profile);
   const spent=Object.entries(draft).reduce((total,[id,values])=>total+Object.entries(values).reduce((sum,[key,amount])=>sum+statStardustCost(stats[id][key],amount),0),0);
   content.innerHTML='<div class="stats-characters">'+Object.keys(pets).map(id=>
    '<button type="button" data-pet="'+id+'" aria-pressed="'+(selected===id)+'" '+(saving?'disabled':'')+'><img src="'+portrait(id)+'" alt=""><b>'+pets[id].name+'</b><small>Lv. '+adventureLevel(stats[id],wallet.profile.statInvestment?.[id]).level+'</small></button>'
   ).join('')+'</div>';
   const saved=stats[selected];
   const pending=Object.fromEntries(Object.keys(ADVENTURE_STATS).map(key=>[key,saved[key]+(draft[selected][key]||0)]));
   const current=statValues(characterStats(selected,saved));
   const preview=statValues(characterStats(selected,pending));
   const savedLevel=adventureLevel(saved,wallet.profile.statInvestment?.[selected]),selectedCost=Object.entries(draft[selected]).reduce((sum,[key,amount])=>sum+statStardustCost(saved[key],amount),0),nextLevel=adventureLevel(pending,savedLevel.invested+selectedCost);
   content.insertAdjacentHTML('beforeend',`
    <div class="stats-hero">
     <img src="${portrait(selected)}" alt="">
     <strong>${pets[selected].name} Lv.${savedLevel.level}${nextLevel.level>savedLevel.level?' → Lv.'+nextLevel.level:''}</strong>
     <small class="stats-next-level">다음 레벨 <img src="${import.meta.env.BASE_URL}adventure/star-shard-v1.png" alt="별조각"> ${nextLevel.progress.toLocaleString()} / ${nextLevel.required.toLocaleString()}</small>
     <progress value="${nextLevel.progress}" max="${nextLevel.required}" aria-label="다음 레벨까지 투자한 별조각"></progress>
    </div>
    <dl class="stats-current" aria-label="현재 적용된 능력치">${Object.values(current).map(([label,value])=>'<div><dt>'+label+'</dt><dd>'+value+'</dd></div>').join('')}</dl>
    <div class="stats-stardust-summary" aria-label="별조각 사용 미리보기">
     <span><img src="${import.meta.env.BASE_URL}adventure/star-shard-v1.png" alt="별조각"><b>${available.toLocaleString()}</b><small>보유</small></span>
     <span class="stats-stardust-cost">− <b>${spent.toLocaleString()}</b><small>사용 별조각</small></span>
     <span class="stats-stardust-remaining"><img src="${import.meta.env.BASE_URL}adventure/star-shard-v1.png" alt="별조각"><b>${(available-spent).toLocaleString()}</b><small>남은 별조각</small></span>
    </div>
    <div class="stats-rows">${Object.entries(ADVENTURE_STATS).map(([key,stat])=>`
     <div class="stats-row">
      <div class="stats-name"><b>${stat.name}</b><small>${pending[key]}/100</small><small class="stats-effect">${stat.description}</small><small class="stats-cost">${pending[key]<100?'필요 별조각 : '+statStardustCost(pending[key]):'최대 수치'}</small></div>
      <span class="stats-delta">${current[key][0]} <strong>${current[key][1]}${draft[selected][key]?' → '+preview[key][1]:''}</strong></span>
      <button type="button" data-minus="${key}" aria-label="${stat.name} 1포인트 빼기" ${saving||!draft[selected][key]?'disabled':''}>−</button>
      <button type="button" data-plus="${key}" aria-label="${stat.name} 1포인트 추가" ${saving||spent+statStardustCost(pending[key])>available||pending[key]>=100?'disabled':''}>+</button>
     </div>`).join('')}</div>
    <button type="button" class="stats-apply" data-apply ${saving||!spent?'disabled':''}>${saving?'적용 중…':spent?'적용 · '+spent.toLocaleString()+' 별조각':'적용'}</button>
    <p class="stats-hint" role="status"></p>`);
   content.insertAdjacentHTML('beforeend','<button type="button" class="character-reset" data-reset-stats '+(saving||available<500||!statInvestmentTotal(saved)?'disabled':'')+'>스탯 초기화 · 별조각 500</button>');
   content.querySelector('[role="status"]').textContent=message||'각 능력치의 첫 10회는 200개, 다음 10회는 300개 · 적용할 때 별조각이 차감돼요.';
   dialog.querySelector('[data-close]').disabled=saving;
  }

  content.addEventListener('click',async event=>{
   const control=event.target.closest('button');
   if(!control||control.disabled||saving)return;
   if(control.hasAttribute('data-reset-stats')){
    confirmCharacterReset({wallet,pet:selected,kind:'stats',onDone:()=>{draft.momo={};draft.kuki={};message='스탯을 초기화했어요.';render();}});return;
   }
   if(control.hasAttribute('data-skills')){
    openSkillMenu({wallet,pet:selected,onClose:()=>{
     updateHighlight();render();
     content.querySelector('[data-skills]').focus({preventScroll:true});
     window.dispatchEvent(new Event('adventure-wallet-change'));
    }});
    return;
   }
   if(control.dataset.pet){
    selected=control.dataset.pet;
    render();
    content.querySelector('[data-pet="'+selected+'"]').focus({preventScroll:true});
    return;
   }
   const key=control.dataset.plus||control.dataset.minus;
   if(key){
    const points=(draft[selected][key]||0)+(control.dataset.plus?1:-1);
    if(points)draft[selected][key]=points;
    else delete draft[selected][key];
    message='';
    render();
    content.querySelector('[data-'+(control.dataset.plus?'plus':'minus')+'="'+key+'"]').focus({preventScroll:true});
   }else if(control.hasAttribute('data-apply')){
    saving=true;
    message='스테이터스를 적용하는 중이에요.';
    render();
    try{
     await wallet.investStardust(draft);
     updateHighlight();
     draft.momo={};
     draft.kuki={};
     message='스테이터스를 적용했어요.';
     window.dispatchEvent(new Event('adventure-wallet-change'));
    }catch(error){
     message=error.message;
    }finally{
     saving=false;
     render();
    }
   }
  });

  try{
   await load();
   if(dialog.open)render();
  }catch(error){
   content.querySelector('[role="status"]').textContent=error.message;
  }
 };
}
