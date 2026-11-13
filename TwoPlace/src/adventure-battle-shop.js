import {BATTLE_PRODUCTS} from '../shared/adventure-progression.js';
import {createAdventureWallet} from './adventure-wallet.js';
import './adventure-battle-shop.css';

const shardPrice=value=>'<span class="battle-shard-price"><img src="'+import.meta.env.BASE_URL+'adventure/star-shard-v1.png" alt="별조각"><b>'+value.toLocaleString()+'</b></span>';
const purchaseLabel=(name,quantity,price)=>'<span>'+name+' '+quantity+'개 구매</span>'+shardPrice(price*quantity);
export function mountBattleShop(button,{wallet=createAdventureWallet(),onChange=()=>{}}={}){
 button.onclick=async()=>{
  const dialog=document.createElement('dialog');
  dialog.className='battle-shop';
  dialog.setAttribute('aria-label','전투상점');
  dialog.innerHTML='<header><h2>전투상점</h2><button data-close aria-label="닫기">×</button></header><div data-body><p role="status">상점을 불러오는 중…</p></div>';
  document.body.append(dialog);
  dialog.showModal();
  let busy=false,message='',selected='hpPotion',quantity=1;
  const body=dialog.querySelector('[data-body]');
  dialog.querySelector('[data-close]').onclick=()=>{if(!busy)dialog.close();};
  dialog.addEventListener('cancel',event=>{if(busy)event.preventDefault();});
  dialog.addEventListener('close',()=>{dialog.remove();onChange();button.focus();},{once:true});

  function render(){
   const profile=wallet.profile,product=BATTLE_PRODUCTS.find(item=>item.id===selected);
   const maximum=Math.min(1000,Math.floor(profile.stardust/product.price));
   quantity=Math.max(1,Math.min(quantity,maximum||1));
   dialog.querySelector('[data-close]').disabled=busy;
   body.innerHTML='<div class="battle-wallet"><strong class="battle-wallet-balance">'+shardPrice(profile.stardust)+'<span>별조각</span></strong><span>회복약을 구매해요.</span></div>';
    body.insertAdjacentHTML('beforeend','<div class="battle-products">'+BATTLE_PRODUCTS.filter(item=>['hpPotion','spPotion'].includes(item.id)).map(item=>
     '<button data-product="'+item.id+'" aria-pressed="'+(selected===item.id)+'"><span class="battle-potion-image '+(item.id==='hpPotion'?'hp':'sp')+'" aria-hidden="true" style="background-image:url('+import.meta.env.BASE_URL+'adventure/potions/hp-sp-v3.png)"></span><span class="battle-product-title"><b>'+item.name+'</b>'+shardPrice(item.price)+'</span><small>'+item.description+'</small><small>보유 '+profile[item.field]+'개</small></button>'
    ).join('')+'</div><div class="battle-quantity"><button data-quantity="-1" aria-label="구매 수량 줄이기" '+(busy||quantity<=1?'disabled':'')+'>−</button><label>수량 <input data-count type="number" min="1" max="'+maximum+'" value="'+quantity+'" '+(busy||!maximum?'disabled':'')+'></label><button data-quantity="1" aria-label="구매 수량 늘리기" '+(busy||quantity>=maximum?'disabled':'')+'>+</button></div><button class="battle-primary" data-buy '+(busy||!maximum?'disabled':'')+'>'+(busy?'구매 중…':purchaseLabel(product.name,quantity,product.price))+'</button>');
   const feedback=document.createElement('p');
   feedback.className='battle-feedback';feedback.setAttribute('role','status');feedback.textContent=message;
   body.append(feedback);
  }
  body.oninput=event=>{
   if(busy||!event.target.matches('[data-count]'))return;
   const value=Number(event.target.value);
   const product=BATTLE_PRODUCTS.find(item=>item.id===selected);
   const maximum=Math.min(1000,Math.floor(wallet.profile.stardust/product.price));
   const valid=Number.isSafeInteger(value)&&value>0&&value<=maximum;
   quantity=value;
   const buy=body.querySelector('[data-buy]');
   buy.disabled=!valid;
   buy.innerHTML=valid?product.name+' '+quantity+'개 구매 · ✦ '+product.price*quantity:'구매 가능한 수량을 입력해 주세요.';
   body.querySelector('[data-quantity="-1"]').disabled=!valid||quantity<=1;
   body.querySelector('[data-quantity="1"]').disabled=!valid||quantity>=maximum;
  };
  body.onclick=async event=>{
   const control=event.target.closest('button');
   if(!control||control.disabled||busy)return;
   if(control.dataset.product){selected=control.dataset.product;quantity=1;message='';render();return;}
   if(control.dataset.quantity){quantity+=Number(control.dataset.quantity);render();return;}
   if(!control.hasAttribute('data-buy'))return;
   busy=true;message='';render();
   try{
    await wallet.purchase(selected,quantity);
    message='구매했어요.';
    onChange();
   }catch(error){message=error.message;}
   finally{busy=false;render();}
  };
  try{await wallet.init();if(dialog.open)render();}
  catch(error){body.querySelector('[role="status"]').textContent=error.message;}
 };
}
