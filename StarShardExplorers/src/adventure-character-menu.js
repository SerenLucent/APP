import {lockDialogScroll} from './dialog-scroll-lock.js';
import {adventureLevel,characterStats} from '../shared/adventure-progression.js';
import {skillBalance} from '../shared/adventure-skills.js';
import {openStatUpgrade} from './adventure-stat-menu.js';
import {openSkillMenu} from './adventure-skill-menu.js';

export async function openCharacterMenu({wallet,load,updateHighlight,button}){
 const dialog=document.createElement('dialog');dialog.className='adventure-stat-menu character-overview';
 dialog.setAttribute('aria-label','캐릭터 레벨업');
 dialog.innerHTML='<div class="stats-header"><h2>캐릭터 레벨업</h2><button data-close aria-label="닫기">×</button></div><div data-character-body role="status">캐릭터 정보를 불러오는 중…</div>';
 document.body.append(dialog);dialog.showModal();lockDialogScroll(dialog);
 let selected='momo';const body=dialog.querySelector('[data-character-body]');
 const names={momo:'모모',kuki:'쿠키'},image=id=>import.meta.env.BASE_URL+'pets/'+(id==='momo'?'mochi':'kuki')+'-standing-v2.png';
 const shard=import.meta.env.BASE_URL+'adventure/star-shard-v1.png';
 const refresh=()=>{updateHighlight();render();window.dispatchEvent(new Event('adventure-wallet-change'));};
 function render(){
  const p=wallet.profile,stats=characterStats(selected,p.stats[selected]),level=adventureLevel(p.stats[selected],p.statInvestment?.[selected]),skills=p.skills[selected],charge=skillBalance(skills.charge),ultimate=skillBalance(skills.ultimate);
  body.innerHTML='<div class="stats-characters">'+Object.keys(names).map(id=>'<button data-pet="'+id+'" aria-pressed="'+(id===selected)+'"><img src="'+image(id)+'" alt=""><b>'+names[id]+'</b><small>Lv. '+adventureLevel(p.stats[id],p.statInvestment?.[id]).level+'</small></button>').join('')+'</div>'+ 
   '<div class="stats-hero"><img src="'+image(selected)+'" alt="'+names[selected]+'"><strong>'+names[selected]+' Lv.'+level.level+'</strong><small class="stats-next-level">다음 레벨 <img src="'+shard+'" alt="별조각"> '+level.progress.toLocaleString()+' / '+level.required.toLocaleString()+'</small><progress value="'+level.progress+'" max="'+level.required+'" aria-label="다음 레벨까지 투자한 별조각"></progress></div>'+ 
   '<dl class="stats-current">'+[['공격력',stats.minAttack+'–'+stats.maxAttack],['최대 HP',stats.maxHp],['최대 SP',stats.maxSp],['재주',stats.dexterity+'%'],['치명타',(stats.critical*100).toFixed(1)+'%']].map(([k,v])=>'<div><dt>'+k+'</dt><dd>'+v+'</dd></div>').join('')+'</dl>'+ 
   '<section class="character-skill-summary"><article><b>'+(selected==='momo'?'귀 회오리':'꼬리 강타')+' · Lv.'+skills.charge+'</b><p>'+(selected==='momo'?'풀차지 회전 '+charge.spinDuration.toFixed(1)+'초':'풀차지 '+Math.round(charge.tailMultiplier*100)+'% · 3초 기절 확률 '+Math.round(charge.tailStunChance*100)+'%')+'</p></article><article><b>'+(selected==='momo'?'하트 운석':'별똥별 쿵')+' · Lv.'+skills.ultimate+'</b><p>피해 +'+Math.round((ultimate.ultimateMultiplier-1)*100)+'% · '+(selected==='momo'?'운석 '+ultimate.meteorCount+'발':'화면 범위 '+Math.round(ultimate.slamCoverage*100)+'% · 3초 기절')+'</p></article></section>'+ 
   '<div class="character-upgrade-actions"><button class="stats-skill-button" data-stats>스탯 강화</button><button class="stats-skill-button" data-skills>스킬 강화</button></div>';
 }
 body.onclick=e=>{const control=e.target.closest('button');if(!control)return;if(control.dataset.pet){selected=control.dataset.pet;render();}else if(control.hasAttribute('data-stats'))openStatUpgrade({wallet,pet:selected,onClose:refresh});else if(control.hasAttribute('data-skills'))openSkillMenu({wallet,pet:selected,onClose:refresh});};
 dialog.querySelector('[data-close]').onclick=()=>dialog.close();
 dialog.addEventListener('close',()=>{dialog.remove();button.focus({preventScroll:true});},{once:true});
 try{await load();if(dialog.open)render();}catch(e){body.textContent=e.message;}
}
