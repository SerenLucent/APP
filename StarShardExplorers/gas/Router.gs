// Personal saves are private Drive files. Never reuses the TwoPlace script or folders.
const EXPLORER_ACTIONS=['adventureStart','adventureFinish','adventureInvestStardustBatch','adventureSkillInvestStardustBatch','adventureReset','adventurePurchase','adventurePotion'];
function explorerFail_(status,message){throw Object.assign(new Error(message),{status:status});}
function explorerJson_(status,data,error){return ContentService.createTextOutput(JSON.stringify({status:status,...(error?{error:error}:{data:data})})).setMimeType(ContentService.MimeType.JSON);}
function explorerDigest_(value){return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(n=>((n+256)%256).toString(16).padStart(2,'0')).join('');}
function setupStarShardExplorers(){
 const properties=PropertiesService.getScriptProperties();let id=properties.getProperty('EXPLORER_ROOT_FOLDER_ID');
 if(!id){const folder=DriveApp.createFolder('StarShardExplorers · Private Players');id=folder.getId();properties.setProperty('EXPLORER_ROOT_FOLDER_ID',id);}
 console.log('별조각 탐험대 개인 저장 폴더: https://drive.google.com/drive/folders/'+id);
 return id;
}
function explorerRoot_(){const id=PropertiesService.getScriptProperties().getProperty('EXPLORER_ROOT_FOLDER_ID');if(!id)explorerFail_(503,'개인 저장 서버를 준비 중이에요.');return DriveApp.getFolderById(id);}
function explorerChild_(parent,name,create){const matches=parent.getFoldersByName(name);return matches.hasNext()?matches.next():create?parent.createFolder(name):null;}
function explorerFile_(parent,name){const matches=parent.getFilesByName(name);return matches.hasNext()?matches.next():null;}
function explorerRead_(file){return JSON.parse(file.getBlob().getDataAsString('UTF-8'));}
function explorerWrite_(folder,name,data,file){const text=JSON.stringify(data);return file?(file.setContent(text),file):folder.createFile(name,text,MimeType.PLAIN_TEXT);}
function explorerPlayer_(token,create){
 if(typeof token!=='string'||! /^[a-f0-9]{64}$/.test(token))explorerFail_(401,'저장 복구코드를 확인해 주세요.');
 const hash=explorerDigest_(token),cache=CacheService.getScriptCache(),key='player:'+hash;
 let folder,id=cache.get(key);if(id){try{folder=DriveApp.getFolderById(id);folder.getName();}catch(e){folder=null;cache.remove(key);}}
 if(!folder){folder=explorerChild_(explorerRoot_(),hash,false)||explorerSessionFolder_(hash);if(!folder&&create){const admission='create:'+Math.floor(Date.now()/60000),count=Number(cache.get(admission)||0);if(count>=30)explorerFail_(429,'새 플레이어 생성이 많아요. 잠시 후 다시 시도해 주세요.');cache.put(admission,String(count+1),120);folder=explorerChild_(explorerRoot_(),hash,true);}if(folder)cache.put(key,folder.getId(),21600);}
 if(!folder)explorerFail_(401,'저장 정보를 찾을 수 없어요. 복구코드를 확인해 주세요.');
 let file=explorerFile_(folder,'profile.json');if(!file){if(!create)explorerFail_(401,'저장 정보를 찾을 수 없어요.');file=explorerWrite_(folder,'profile.json',{schema:1,createdAt:Date.now(),state:{version:0,hearts:0,adventure:initialAdventure()},historySince:null,historyOutbox:[]});}
 const record=explorerRead_(file),entry={folder:folder,file:file,record:record};explorerFlush_(entry);return entry;
}
function explorerBucket_(at){const day=Utilities.formatDate(new Date(at),'Asia/Seoul','yyyy-MM-dd').split('-'),start=Number(day[2])-((Number(day[2])-1)%3);return {year:day[0],month:day[1],name:'clear_'+day[0]+'_'+day[1]+'_'+String(start).padStart(2,'0')+'.json'};}
function explorerHistoryFolder_(player,bucket,create){let folder=explorerChild_(player,'game-history',create);if(!folder)return null;folder=explorerChild_(folder,bucket.year,create);return folder?explorerChild_(folder,bucket.month,create):null;}
function explorerFlush_(entry){
 const outbox=entry.record.historyOutbox||[];if(!outbox.length)return;
 // Durable outbox: interrupted history writes are retried before any response.
 for(const event of outbox){const bucket=explorerBucket_(event.at),folder=explorerHistoryFolder_(entry.folder,bucket,true),file=explorerFile_(folder,bucket.name),log=file?explorerRead_(file):{entries:[]};if(!log.entries.some(e=>e.runId===event.runId)){log.entries.push(event);explorerWrite_(folder,bucket.name,log,file);}}
 entry.record.historyOutbox=[];explorerWrite_(entry.folder,'profile.json',entry.record,entry.file);
}
function explorerHistory_(entry,query){
 const start=query.start,end=query.end;if(!/^\d{4}-\d{2}-\d{2}$/.test(start||'')||!/^\d{4}-\d{2}-\d{2}$/.test(end||''))explorerFail_(400,'조회 기간을 확인해 주세요.');
 const from=Date.parse(start+'T00:00:00+09:00'),to=Date.parse(end+'T23:59:59.999+09:00');if(!Number.isFinite(from)||!Number.isFinite(to)||to<from||to-from>32*86400000)explorerFail_(400,'이력은 최대 31일간 조회할 수 있어요.');
 const seen={},events=[];for(let at=from;at<=to;at+=86400000){const bucket=explorerBucket_(at);if(seen[bucket.name])continue;seen[bucket.name]=true;const folder=explorerHistoryFolder_(entry.folder,bucket,false),file=folder&&explorerFile_(folder,bucket.name);if(file)events.push(...explorerRead_(file).entries.filter(e=>e.at>=from&&e.at<=to));}
 return {entries:events.sort((a,b)=>b.at-a.at),since:entry.record.historySince};
}
function explorerRoute_(request){
 const path=request.path,method=request.method||'GET';
 if(path==='/api/account'||path==='/api/email/request'||path==='/api/email/verify')return explorerEmailRoute_(request);
 if(path==='/api/health')return {game:'StarShardExplorers',storage:'private-drive-json',version:1};
 if(!['/api/player','/api/save','/api/action','/api/history'].includes(path))explorerFail_(404,'요청한 기능을 찾을 수 없어요.');
 if(path==='/api/player'&&method!=='POST'||['/api/save','/api/history'].includes(path)&&method!=='GET'||path==='/api/action'&&method!=='POST')explorerFail_(405,'지원하지 않는 요청이에요.');
 const entry=explorerPlayer_(request.token,path==='/api/player'),state=entry.record.state;
 if(path==='/api/history')return explorerHistory_(entry,request.query||{});
 if(path!=='/api/action')return state;
 const action=request.body;if(!action||!EXPLORER_ACTIONS.includes(action.type))explorerFail_(400,'지원하지 않는 게임 동작이에요.');
 if(state.adventure.operations&&state.adventure.operations.includes(action.actionId))return state;
 if(action.version!==state.version)explorerFail_(409,'다른 화면의 저장 내용을 확인하고 있어요. 다시 시도해 주세요.');
 applyAdventureAction(state,action,Date.now(),()=>Utilities.getUuid(),'player');
 const events=state.adventure.history||[];entry.record.historyOutbox=events;
 if(events.length)entry.record.historySince=entry.record.historySince===null?events[0].at:Math.min(entry.record.historySince,events[0].at);
 state.adventure.history=[];state.version++;entry.record.updatedAt=Date.now();explorerWrite_(entry.folder,'profile.json',entry.record,entry.file);explorerFlush_(entry);return state;
}
function doGet(){return explorerJson_(200,{game:'StarShardExplorers',storage:'private-drive-json',version:1});}
function doPost(e){
 const lock=LockService.getScriptLock();let locked=false;
 try{const raw=e&&e.postData&&e.postData.contents;if(!raw||raw.length>262144)explorerFail_(400,'저장 요청을 확인해 주세요.');let request;try{request=JSON.parse(raw);}catch(_){explorerFail_(400,'저장 요청을 확인해 주세요.');}if(!request||typeof request!=='object'||Array.isArray(request))explorerFail_(400,'저장 요청을 확인해 주세요.');if(!lock.tryLock(20000))explorerFail_(503,'다른 저장을 처리하고 있어요. 잠시 후 다시 시도해 주세요.');locked=true;return explorerJson_(200,explorerRoute_(request));}
 catch(error){const status=error.status||500;return explorerJson_(status,null,status===500?'개인 저장에 실패했어요. 잠시 후 다시 시도해 주세요.':error.message);}
 finally{if(locked)lock.releaseLock();}
}
