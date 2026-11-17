// Only retire a request after a fresh save proves it cannot belong to this run.
// Keep the retired payload locally; do not reset progression or award stale rewards.
export function recoverAdventurePending(storage,key,home,role,now=Date.now()){
 let pending;try{pending=JSON.parse(storage.getItem(key)||'null');}catch{return null;}
 if(!pending)return null;
 const applied=home.adventure?.operations?.includes(pending.actionId);
 const superseded=pending.type==='adventureFinish'&&typeof pending.body?.runId==='string'&&pending.body.runId!==home.adventure?.runs?.[role]?.id;
 if(!applied&&!superseded)return pending;
 if(!applied)storage.setItem(key+':superseded',JSON.stringify({pending,at:now,reason:'run-replaced'}));
 storage.removeItem(key);return null;
}
