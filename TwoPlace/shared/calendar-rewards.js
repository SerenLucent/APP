// Rewards are recorded in the server-owned pet wallet, never in editable calendar state.
export function calendarRewards(home,previous,next,now=Date.now(),{retroactive=false,readRole=null,eventId=null}={}){
 const updated=JSON.parse(JSON.stringify(home)),ledger=updated.calendarRewards||{registration:{},reads:{},seen:[]};
 ledger.registration=ledger.registration||{};ledger.reads=ledger.reads||{};ledger.seen=ledger.seen||[];let amount=0;
 const old=new Map(previous.events.map(e=>[e.id,e.date]));
 for(const e of next.events){if(!retroactive&&old.get(e.id)===e.date)continue;
 const day=e.date,key=day;
 if(!ledger.registration[key]){ledger.registration[key]=true;amount+=5;}}
 if(readRole){const event=next.events.find(e=>e.id===eventId);if(!event||!event.authorRole||event.authorRole===readRole)throw Object.assign(new Error('상대방의 일정만 확인할 수 있어요.'),{status:400});
 const seen=readRole+':'+event.date+':'+event.id,key=event.date;if(!ledger.seen.includes(seen)){ledger.seen.push(seen);if(!ledger.reads[key]){ledger.reads[key]=true;amount++;}}}
 updated.calendarRewards=ledger;if(amount||JSON.stringify(home.calendarRewards)!==JSON.stringify(ledger)){updated.hearts+=amount;updated.version++;}return updated;
}
export function backfillCalendarRewards(home,state,now=Date.now()){
 if(home.calendarRewards?.backfilled)return home;
 const next=calendarRewards(home,{events:[]},state,now,{retroactive:true});next.calendarRewards.backfilled=true;return next;
}
