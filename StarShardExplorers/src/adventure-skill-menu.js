import {confirmCharacterReset} from './adventure-reset-menu.js';
import {lockDialogScroll} from './dialog-scroll-lock.js';
import {adventureLevel,investmentLevel,skillInvestmentTotal} from '../shared/adventure-progression.js';
import {skillBalance} from '../shared/adventure-skills.js';
import './adventure-battle-shop.css';

const skillShardAmount=value=>'<span class="battle-shard-price"><img src="'+import.meta.env.BASE_URL+'adventure/star-shard-v1.png" alt="별조각"><b>'+value.toLocaleString()+'</b></span>';
const names={momo:'모모',kuki:'쿠키'};
const skillNames={momo:{charge:'귀 회오리',ultimate:'하트 운석'},kuki:{charge:'꼬리 강타',ultimate:'별똥별 쿵'}};
function effect(pet,key,level){
 const balance=skillBalance(level);
 if(key==='ultimate')return '피해 +'+Math.round((balance.ultimateMultiplier-1)*100)+'% · '+(pet==='momo'?balance.meteorCount+'발':'화면 범위 '+Math.round(balance.slamCoverage*100)+'%');
 return pet==='momo'?'풀차지 '+balance.spinDuration.toFixed(1)+'초':'풀차지 '+Math.round(balance.tailMultiplier*100)+'% · 기절 '+Math.round(balance.tailStunChance*100)+'%';
}

export function openSkillMenu({wallet,pet,onClose}){
 const dialog=document.createElement('dialog');
 dialog.className='battle-shop character-skills';
 dialog.setAttribute('aria-label',names[pet]+' 스킬 강화');
 dialog.innerHTML='<header><h2>'+names[pet]+' 스킬 강화</h2><button data-close aria-label="캐릭터 레벨업으로 돌아가기">×</button></header><div data-body></div>';
 document.body.append(dialog);
 const body=dialog.querySelector('[data-body]'),draft={};
 let busy=false,message='';
 const cost=()=>Object.entries(draft).reduce((total,[key,amount])=>total+240*amount*(2*wallet.profile.skills[pet][key]+amount+1)/2,0);
 function render(){
  const profile=wallet.profile,spent=cost(),savedLevel=adventureLevel(profile.stats[pet],profile.statInvestment?.[pet]),nextLevel=investmentLevel(savedLevel.invested+spent);
  dialog.querySelector('[data-close]').disabled=busy;
  body.innerHTML='<div class="battle-wallet"><strong class="battle-wallet-balance">'+skillShardAmount(profile.stardust)+'<span>별조각</span></strong><span class="skill-wallet-after">적용 후 '+skillShardAmount(profile.stardust-spent)+' 별조각</span></div>'+
   '<img class="skill-portrait" src="'+import.meta.env.BASE_URL+'pets/'+(pet==='momo'?'mochi':'kuki')+'-standing-v2.png" alt="'+names[pet]+'">'+
   '<div class="skill-character-level"><strong>'+names[pet]+' Lv.'+savedLevel.level+(nextLevel.level>savedLevel.level?' → Lv.'+nextLevel.level:'')+'</strong><small>다음 레벨 '+skillShardAmount(nextLevel.progress)+' / '+nextLevel.required.toLocaleString()+'</small><progress value="'+nextLevel.progress+'" max="'+nextLevel.required+'" aria-label="다음 레벨까지 투자한 별조각"></progress></div>'+
   '<section class="battle-skills">'+['charge','ultimate'].map(key=>{
    const current=profile.skills[pet][key],pending=draft[key]||0,next=current+pending;
    return '<article class="skill-upgrade-row"><div class="skill-description"><b>'+skillNames[pet][key]+' · Lv. '+current+(pending?' → '+next:'')+'</b><small>'+effect(pet,key,current)+(pending?' → '+effect(pet,key,next):'')+'</small></div>'+
     '<div class="skill-controls"><span class="skill-cost">'+(next===10?'최고 레벨':'필요 별조각 : '+skillShardAmount((next+1)*240))+'</span><button data-key="'+key+'" data-step="-1" aria-label="'+skillNames[pet][key]+' 강화 취소" '+(busy||!pending?'disabled':'')+'>−</button><button data-key="'+key+'" data-step="1" aria-label="'+skillNames[pet][key]+' 강화" '+(busy||next>=10||spent+(next+1)*240>profile.stardust?'disabled':'')+'>+</button></div></article>';
   }).join('')+'</section><button class="battle-primary" data-apply '+(busy||!spent?'disabled':'')+'>'+(busy?'적용 중…':'강화 적용 · '+skillShardAmount(spent)+' 별조각')+'</button>';
  const feedback=document.createElement('p');
  feedback.className='battle-feedback';feedback.setAttribute('role','status');feedback.textContent=message;
  body.append(feedback);
  const reset=document.createElement('button');reset.className='character-reset';reset.dataset.resetSkills='';reset.textContent='스킬 초기화 · 별조각 500';reset.disabled=busy||profile.stardust<500||!skillInvestmentTotal(profile.skills[pet]);body.append(reset);
 }
 body.onclick=async event=>{
  const control=event.target.closest('button');
  if(!control||control.disabled||busy)return;
  if(control.dataset.step){
   const {key,step}=control.dataset,next=(draft[key]||0)+Number(step);
   if(next)draft[key]=next;else delete draft[key];
   message='';render();return;
  }
  if(control.hasAttribute('data-reset-skills')){confirmCharacterReset({wallet,pet,kind:'skills',onDone:()=>{for(const key of Object.keys(draft))delete draft[key];message='스킬을 초기화했어요.';render();}});return;}
  if(!control.hasAttribute('data-apply'))return;
  busy=true;message='';render();
  try{
   await wallet.investSkillsStardust({[pet]:{...draft}});
   for(const key of Object.keys(draft))delete draft[key];
   message='스킬을 강화했어요.';window.dispatchEvent(new Event('adventure-wallet-change'));
  }catch(error){message=error.message;}
  finally{busy=false;render();}
 };
 dialog.querySelector('[data-close]').onclick=()=>{if(!busy)dialog.close();};
 dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
 dialog.addEventListener('close',()=>{dialog.remove();onClose();},{once:true});
 render();dialog.showModal();lockDialogScroll(dialog);
}
