const HEART_HISTORY_DAY=86400000;
export function heartHistoryDay(at){return new Date(at+9*3600000).toISOString().slice(0,10);}
export function recordHeartChange(home,{at=Date.now(),amount,kind,label,actor={},product=null,quantity=null}){
 if(!Number.isSafeInteger(amount)||!amount)return home;
 const role=['owner','partner'].includes(actor.role)?actor.role:null,character=['momo','kuki'].includes(actor.character)?actor.character:null;
 home.heartHistory=(home.heartHistory||[]).filter(e=>e.at>=at-31*HEART_HISTORY_DAY);
 home.heartHistory.push({at,amount,balance:home.hearts,kind,label,role,character,...(product?{product,quantity}:{})});
 home.heartHistorySince=home.heartHistorySince??at;return home;
}
export function filterHeartHistory(entries,start,end,tab='all'){
 const valid=s=>/^\d{4}-\d{2}-\d{2}$/.test(s)&&Number.isFinite(Date.parse(s))&&new Date(s).toISOString().slice(0,10)===s;
 if(!valid(start)||!valid(end)||end<start||(Date.parse(end)-Date.parse(start))/HEART_HISTORY_DAY>30)throw new Error('조회 기간은 최대 31일(1개월)로 선택해 주세요.');
 return entries.filter(e=>{const day=heartHistoryDay(e.at);return day>=start&&day<=end&&(tab==='all'||(tab==='purchase'?e.amount<0:e.amount>0));}).map((e,i)=>({...e,order:i})).sort((a,b)=>b.at-a.at||b.order-a.order);
}
