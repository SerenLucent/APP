// Generated Code.gs also includes the same validation, pet economy and geometry as Node.
const GITHUB_OWNER='SerenLucent';
const GITHUB_REPO='APP';
const GITHUB_BRANCH='main';
const ROOM_PREFIX='TwoPlace/remote-data/couples/';
function setupTwoPlace(){
  const response=github_('', 'GET');
  if(response.permissions && response.permissions.push===false)fail_(403,'APP 저장소의 Contents 쓰기 권한이 필요해요.');
  return 'TwoPlace GitHub storage is ready.';
}
// Run from the Apps Script editor once. Store the token in a password manager.
// Running it again rotates the token and invalidates the previous one.
function issueAdminToken() {
  const token=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');
  PropertiesService.getScriptProperties().setProperty('ADMIN_TOKEN_HASH',digest_(token));
  console.log('TwoPlace administrator token (save privately): '+token);
  return token;
}
function digest_(value) {
  return Utilities.computeDigest(Utilities.DigestAlgorithm.SHA_256,value,Utilities.Charset.UTF_8).map(x=>((x+256)%256).toString(16).padStart(2,'0')).join('');
}
function fail_(status,message){const e=new Error(message);e.status=status;throw e;}
function props_(){return PropertiesService.getScriptProperties();}
function github_(path,method,payload){
  const token=props_().getProperty('GITHUB_TOKEN');
  if(!token)fail_(503,'앱스크립트의 GITHUB_TOKEN 설정이 필요해요.');
  const response=UrlFetchApp.fetch('https://api.github.com/repos/'+GITHUB_OWNER+'/'+GITHUB_REPO+path,{
    method:method.toLowerCase(),muteHttpExceptions:true,
    headers:{Authorization:'Bearer '+token,Accept:'application/vnd.github+json','X-GitHub-Api-Version':'2022-11-28'},
    ...(payload?{contentType:'application/json',payload:JSON.stringify(payload)}:{})
  });
  const status=response.getResponseCode();
  if(status===409||status===422)fail_(409,'GitHub 파일이 먼저 바뀌었어요. 다시 불러와 주세요.');
  if(status===401||status===403)fail_(503,'GitHub 토큰과 APP 저장소 권한을 확인해 주세요.');
  if(status===404)fail_(404,'GitHub 저장 파일을 찾을 수 없어요.');
  if(status<200||status>=300)fail_(502,'GitHub 저장에 실패했어요. 잠시 후 다시 시도해 주세요.');
  return JSON.parse(response.getContentText());
}
function roomPath_(code){if(!/^\d{12}$/.test(code))fail_(400,'방 코드를 확인해 주세요.');return ROOM_PREFIX+code+'/room.json';}
function validPath_(path){
  if(typeof path!=='string'||!/^TwoPlace\/remote-data\/couples\/\d{12}\/(room\.json|backups\/[a-zA-Z0-9_-]+\.json)$/.test(path))fail_(400,'TwoPlace 저장 경로만 사용할 수 있어요.');
  return path.split('/').map(encodeURIComponent).join('/');
}
function readRoom_(path){
  const data=github_('/contents/'+validPath_(path)+'?ref='+GITHUB_BRANCH,'GET');
  const text=Utilities.newBlob(Utilities.base64Decode(data.content.replace(/\s/g,''))).getDataAsString('UTF-8');
  return {path,sha:data.sha,room:JSON.parse(text)};
}
function writeJson_(path,room,sha,message){
  const result=github_('/contents/'+validPath_(path),'PUT',{
    message:message||'Update TwoPlace couple data',branch:GITHUB_BRANCH,
    content:Utilities.base64Encode(JSON.stringify(room,null,2),Utilities.Charset.UTF_8),...(sha?{sha}:{})
  });
  return result.content.sha;
}
function saveRoom_(entry){entry.room.updatedAt=Date.now();entry.sha=writeJson_(entry.path,entry.room,entry.sha);}
function snapshot_(room,role){return {code:room.code,role,memberCount:room.members.length,revision:room.revision,state:room.state,petHome:petSnapshot(room.petHome),catalog:CATALOG};}
function member_(token){
  if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail_(401,'커플방에 다시 입장해 주세요.');
  const hashed=digest_(token),fileId=props_().getProperty('github-member:'+hashed);
  if(!fileId)fail_(401,'커플방에 다시 입장해 주세요.');
  const entry=readRoom_(fileId),member=entry.room.members.find(m=>m.hash===hashed);
  if(!member)fail_(401,'입장 정보를 확인해 주세요.');
  return {...entry,role:member.role};
}
function admissionLimit_(kind){
  const cache=CacheService.getScriptCache(),key='admission:'+kind+':'+Math.floor(Date.now()/60000);
  const count=Number(cache.get(key)||0)+1;
  if(count> (kind==='create'?10:60))fail_(429,'잠시 후 다시 시도해 주세요.');
  cache.put(key,String(count),120);
}
function admin_(token){
  const expected=props_().getProperty('ADMIN_TOKEN_HASH');
  if(!expected||typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token)||digest_(token)!==expected)fail_(403,'관리자 토큰을 확인해 주세요.');
}
function json_(data){return ContentService.createTextOutput(JSON.stringify(data)).setMimeType(ContentService.MimeType.JSON);}
function doGet(){return json_({service:'TwoPlace',storage:'github-json',repository:'SerenLucent/APP',prefix:ROOM_PREFIX,version:2});}
function doPost(e){
  const lock=LockService.getScriptLock();let locked=false;
  try {
    const raw=e&&e.postData&&e.postData.contents;
    if(!raw||raw.length>1000000)fail_(400,'요청 내용을 확인해 주세요.');
    let req;try{req=JSON.parse(raw);}catch(_){fail_(400,'요청 내용을 확인해 주세요.');}
    if(!req||typeof req!=='object')fail_(400,'요청 내용을 확인해 주세요.');
    locked=lock.tryLock(20000);if(!locked)fail_(503,'다른 저장을 처리 중이에요. 잠시 후 다시 시도해 주세요.');
    const data=route_(req);
    return json_({status:200,data});
  }catch(error){return json_({status:error.status||500,data:{error:error.status?error.message:'서버에서 처리하지 못했어요. 잠시 후 다시 시도해 주세요.'}});}
  finally{if(locked)lock.releaseLock();}
}
function route_(req){
  const body=req.body||{},path=req.path,method=req.method||'GET';
  if(path==='/health')return {ok:true};
  if((path==='/rooms'||path==='/rooms/join')&&method==='POST'){
    const token=body.requestToken;
    if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail_(400,'입장 요청 정보를 확인해 주세요.');
    const hashed=digest_(token),existingId=props_().getProperty('github-member:'+hashed);
    const joining=path==='/rooms/join',code=typeof body.code==='string'?body.code.replace(/[\s-]/g,''):'';
    if(existingId){
      const entry=member_(token);
      if(entry.role!==(joining?'partner':'owner')||(joining&&entry.room.code!==code))fail_(409,'다른 방에 사용한 요청이에요.');
      return {token,...snapshot_(entry.room,entry.role)};
    }
    admissionLimit_(joining?'join':'create');
    if(joining){
      if(!/^\d{12}$/.test(code))fail_(400,'숫자 12자리 방 코드를 입력해 주세요.');
      const fileId=props_().getProperty('github-room:'+code);if(!fileId)fail_(404,'방 코드를 찾을 수 없어요.');
      const entry=readRoom_(fileId);
      if(entry.room.members.length>=2)fail_(409,'이미 두 사람이 입장한 커플방이에요.');
      entry.room.members.push({hash:hashed,role:'partner'});
      saveRoom_(entry);props_().setProperty('github-member:'+hashed,fileId);
      return {token,...snapshot_(entry.room,'partner')};
    }
    let newCode;
    do{newCode=String(parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,12),16)%1000000000000).padStart(12,'0');}while(props_().getProperty('github-room:'+newCode));
    const now=Date.now(),room={schemaVersion:1,code:newCode,createdAt:now,updatedAt:now,revision:0,state:{startDate:null,events:[],notes:[]},petHome:initialPetHome(now),members:[{hash:hashed,role:'owner'}]};
    const filePath=roomPath_(newCode);
    writeJson_(filePath,room,null,'Create TwoPlace couple room');
    props_().setProperties({['github-room:'+newCode]:filePath,['github-member:'+hashed]:filePath});
    return {token,...snapshot_(room,'owner')};
  }
  if(path==='/room'&&method==='GET'){const e=member_(req.token);return snapshot_(e.room,e.role);}
  if(path==='/room/state'&&method==='PUT'){
    const e=member_(req.token),state=cleanState(body.state);
    if(!Number.isSafeInteger(body.revision)||body.revision!==e.room.revision)fail_(409,'상대가 먼저 수정했어요. 최신 내용을 확인해 주세요.');
    e.room.state=state;e.room.revision++;saveRoom_(e);return snapshot_(e.room,e.role);
  }
  if(path==='/room/pets'&&method==='POST'){
    const e=member_(req.token);
    e.room.petHome=changePetHome(e.room.petHome,body,Date.now(),()=>Utilities.getUuid().replace(/-/g,''));
    saveRoom_(e);return snapshot_(e.room,e.role);
  }
  if(path==='/admin/rooms'&&method==='GET'){
    admin_(req.token);
    // Paginate the property index so listing never returns every room's private contents.
    const keys=Object.keys(props_().getProperties()).filter(k=>k.indexOf('github-room:')===0).sort();
    const offset=Math.max(0,Number(body.offset)||0),selected=keys.slice(offset,offset+50);
    return {rooms:selected.map(k=>({code:k.slice(12)})),nextOffset:offset+50<keys.length?offset+50:null};
  }
  if(path==='/admin/room'&&(method==='GET'||method==='PUT')){
    admin_(req.token);
    if(!/^\d{12}$/.test(body.code))fail_(400,'방 코드를 확인해 주세요.');
    const id=props_().getProperty('github-room:'+body.code);if(!id)fail_(404,'방이 없어요.');
    const e=readRoom_(id);
    if(method==='PUT'){
      if(body.revision!==e.room.revision||body.petVersion!==e.room.petHome.version)fail_(409,'방 데이터가 바뀌었어요. 다시 불러와 주세요.');
      const state=cleanState(body.state),pets=cleanAdminPets_(body.petHome);
      writeJson_(ROOM_PREFIX+e.room.code+'/backups/'+Date.now()+'_'+Utilities.getUuid()+'.json',e.room,null,'Back up TwoPlace couple before administrator edit');
      e.room.state=state;e.room.revision++;e.room.petHome={...pets,version:e.room.petHome.version+1};saveRoom_(e);
    }
    return snapshot_(e.room,'admin');
  }
  fail_(404,'요청한 기능이 없어요.');
}
function cleanAdminPets_(data){
  if(!data||!Number.isSafeInteger(data.hearts)||data.hearts<0||data.hearts>100000000||!Number.isSafeInteger(data.snacks)||data.snacks<0||data.snacks>100||!Array.isArray(data.items)||data.items.length>40)fail_(400,'하트·먹이·가구 값을 확인해 주세요.');
  const now=Date.now(),pets={};
  for(const id of ['mochi','kuki']){
    const pet=data.pets&&data.pets[id];
    if(!pet||!Number.isFinite(pet.hunger)||pet.hunger<0||pet.hunger>100)fail_(400,'펫 배부름 값을 확인해 주세요.');
    pets[id]={hunger:pet.hunger,updatedAt:now};
  }
  const ids=new Set(),items=[];
  for(const item of data.items){
    if(!item||typeof item.id!=='string'||!item.id||item.id.length>64||ids.has(item.id)||!CATALOG.some(p=>p.type==='furniture'&&p.id===item.product)||![null,...SPACES].includes(item.space)||![0,90].includes(item.rotation||0)||!Number.isFinite(item.x)||!Number.isFinite(item.y))fail_(400,'가구 데이터를 확인해 주세요.');
    const clean={id:item.id,product:item.product,space:item.space,x:item.x,y:item.y,rotation:item.rotation||0};
    if(clean.space&&!placementAllowed(items,clean,clean.space,clean,clean.rotation))fail_(400,'가구 위치가 겹치거나 바닥 밖에 있어요.');
    ids.add(clean.id);items.push(clean);
  }
  // Validate all pairs, independent of input ordering (rugs are allowed underneath).
  for(const item of items)if(item.space&&!placementAllowed(items,item,item.space,item,item.rotation))fail_(400,'가구 위치를 확인해 주세요.');
  return {version:0,hearts:data.hearts,snacks:data.snacks,lastClaim:now,pets,items};
}
