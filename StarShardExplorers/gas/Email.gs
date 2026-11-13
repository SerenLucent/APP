// OTPs and email indexes stay in the same private Drive root; raw recovery tokens are never persisted.
const EXPLORER_OTP_LIFETIME=10*60*1000;
function explorerEmail_(value){const email=String(value||'').trim().toLowerCase();if(email.length>254||! /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email))explorerFail_(400,'이메일 주소를 확인해 주세요.');return email;}
function explorerEmailSecret_(){const props=PropertiesService.getScriptProperties();let secret=props.getProperty('EXPLORER_EMAIL_SECRET');if(!secret){secret=Utilities.getUuid().replace(/-/g,'')+Utilities.getUuid().replace(/-/g,'');props.setProperty('EXPLORER_EMAIL_SECRET',secret);}return secret;}
function explorerHmac_(value){return Utilities.computeHmacSha256Signature(value,explorerEmailSecret_(),Utilities.Charset.UTF_8).map(n=>((n+256)%256).toString(16).padStart(2,'0')).join('');}
function explorerMaskEmail_(email){const parts=email.split('@');return parts[0].slice(0,Math.min(2,parts[0].length))+'***@'+parts[1];}
function explorerEmailFolder_(email,create){const root=explorerChild_(explorerRoot_(),'_email-accounts',create);return root?explorerChild_(root,explorerHmac_('email:'+email),create):null;}
function explorerEmailAccount_(folder){const file=folder&&explorerFile_(folder,'account.json');return file?explorerRead_(file):null;}
function explorerSessionFolder_(hash){const sessions=explorerChild_(explorerRoot_(),'_device-sessions',false),file=sessions&&explorerFile_(sessions,hash+'.json');return file?DriveApp.getFolderById(explorerRead_(file).playerFolderId):null;}
function explorerAccountStatus_(token){const entry=explorerPlayer_(token,false);return {linked:!!entry.record.linkedEmail,maskedEmail:entry.record.linkedEmail?explorerMaskEmail_(entry.record.linkedEmail):null};}
function explorerEmailCodeHash_(challenge,code){return explorerHmac_(JSON.stringify([challenge.requestId,challenge.email,challenge.purpose,challenge.boundHash,code]));}
function explorerEmailRequest_(request){
 const body=request.body||{},email=explorerEmail_(body.email),purpose=body.purpose,id=body.requestId,now=Date.now();
 if(!['link','login'].includes(purpose)||typeof id!=='string'||! /^[a-zA-Z0-9_-]{16,80}$/.test(id))explorerFail_(400,'인증 요청을 확인해 주세요.');
 const entry=purpose==='link'?explorerPlayer_(request.token,false):null;
 if(entry&&entry.record.linkedEmail){if(entry.record.linkedEmail!==email)explorerFail_(409,'이미 다른 이메일에 연결된 기록이에요.');return {alreadyLinked:true,maskedEmail:explorerMaskEmail_(email)};}
 const folder=explorerEmailFolder_(email,true),account=explorerEmailAccount_(folder),boundHash=entry?explorerDigest_(request.token):null;
 if(entry&&account&&account.playerFolderId!==entry.folder.getId())explorerFail_(409,'이미 다른 기록이 연결된 이메일이에요. 이메일로 이어하기를 이용해 주세요.');
 const existingFile=explorerFile_(folder,'challenge.json'),existing=existingFile?explorerRead_(existingFile):null;
 if(existing&&existing.requestId===id){if(existing.purpose!==purpose||existing.boundHash!==boundHash)explorerFail_(400,'인증 요청을 확인해 주세요.');if(existing.sent&&existing.expiresAt>now)return {challengeId:id,expiresAt:existing.expiresAt,resendAt:existing.createdAt+60000};explorerFail_(400,'인증번호를 다시 요청해 주세요.');}
 const rateFile=explorerFile_(folder,'rate.json'),rate=rateFile?explorerRead_(rateFile):{last:0,hour:now,count:0};
 if(rate.last&&now-rate.last<60000)explorerFail_(429,'인증번호는 1분 후 다시 보낼 수 있어요.');
 if(now-rate.hour>=3600000){rate.hour=now;rate.count=0;}if(rate.count>=5)explorerFail_(429,'인증 요청이 많아요. 1시간 후 다시 시도해 주세요.');
 const shouldSend=purpose==='link'||!!account;
 const props=PropertiesService.getScriptProperties(),today=Utilities.formatDate(new Date(now),'Asia/Seoul','yyyy-MM-dd');let usage=JSON.parse(props.getProperty('EXPLORER_EMAIL_USAGE')||'null');if(!usage||usage.day!==today)usage={day:today,count:0};
 if(shouldSend&&(MailApp.getRemainingDailyQuota()<1||usage.count>=Number(props.getProperty('EXPLORER_EMAIL_DAILY_LIMIT')||80)))explorerFail_(503,'오늘 인증메일 발송량을 모두 사용했어요. 나중에 다시 시도해 주세요.');
 const code=String(Number.parseInt(Utilities.getUuid().replace(/-/g,'').slice(0,8),16)%1000000).padStart(6,'0');
 const challenge={requestId:id,email:email,purpose:purpose,boundHash:boundHash,playerFolderId:entry?entry.folder.getId():account?account.playerFolderId:null,createdAt:now,expiresAt:now+EXPLORER_OTP_LIFETIME,attempts:0,sent:false};challenge.codeHash=explorerEmailCodeHash_(challenge,code);
 const file=explorerWrite_(folder,'challenge.json',challenge,existingFile);rate.last=now;rate.count++;explorerWrite_(folder,'rate.json',rate,rateFile);
 if(shouldSend){usage.count++;props.setProperty('EXPLORER_EMAIL_USAGE',JSON.stringify(usage));try{MailApp.sendEmail({to:email,name:'별조각 탐험대 · LUCENTY LABS',subject:'[별조각 탐험대] '+(purpose==='link'?'이메일 연동':'이어하기')+' 인증번호',body:'인증번호: '+code+'\n\n별조각 탐험대에서 '+(purpose==='link'?'현재 게스트 기록을 이메일에 연결':'기존 기록으로 이어하기')+'하려면 이 번호를 입력해 주세요.\n인증번호는 10분 동안 유효하며, 다른 사람에게 알려주지 마세요.\n본인이 요청하지 않았다면 이 메일을 무시해 주세요.\n\nLUCENTY LABS'});}catch(error){explorerFail_(503,'인증메일을 보내지 못했어요. 잠시 후 다시 시도해 주세요.');}}
 challenge.sent=true;explorerWrite_(folder,'challenge.json',challenge,file);return {challengeId:id,expiresAt:challenge.expiresAt,resendAt:now+60000};
}
function explorerEmailVerify_(request){
 const body=request.body||{},email=explorerEmail_(body.email),folder=explorerEmailFolder_(email,false),file=folder&&explorerFile_(folder,'challenge.json'),challenge=file?explorerRead_(file):null,now=Date.now();
 if(!challenge||challenge.requestId!==body.challengeId||challenge.purpose!==body.purpose||!challenge.sent||challenge.expiresAt<=now)explorerFail_(400,'인증 요청이 만료됐어요. 번호를 다시 받아 주세요.');
 let linkedEntry=null,deviceHash=null;
 if(challenge.purpose==='link'){
  linkedEntry=explorerPlayer_(request.token,false);if(explorerDigest_(request.token)!==challenge.boundHash||linkedEntry.folder.getId()!==challenge.playerFolderId)explorerFail_(403,'번호를 요청한 기기에서 연동해 주세요.');
 }else{
  if(typeof body.deviceToken!=='string'||! /^[a-f0-9]{64}$/.test(body.deviceToken))explorerFail_(400,'기기 연결을 확인해 주세요.');deviceHash=explorerDigest_(body.deviceToken);
 }
 if(challenge.completedAt&&challenge.completedDeviceHash!==deviceHash)explorerFail_(400,'이미 사용한 인증번호예요. 번호를 다시 받아 주세요.');
 if(challenge.attempts>=5)explorerFail_(429,'인증번호를 여러 번 틀렸어요. 번호를 다시 받아 주세요.');
 if(! /^\d{6}$/.test(String(body.code||''))||explorerEmailCodeHash_(challenge,String(body.code))!==challenge.codeHash||!challenge.playerFolderId){challenge.attempts++;explorerWrite_(folder,'challenge.json',challenge,file);explorerFail_(400,'인증번호를 확인해 주세요.');}
 if(challenge.purpose==='link'){
  const account=explorerEmailAccount_(folder);if(account&&account.playerFolderId!==linkedEntry.folder.getId())explorerFail_(409,'다른 기록이 이미 연결되어 있어요. 현재 기록은 변경하지 않았어요.');
  if(linkedEntry.record.linkedEmail&&linkedEntry.record.linkedEmail!==email)explorerFail_(409,'이미 다른 이메일이 연결되어 있어요.');
  explorerWrite_(folder,'account.json',{playerFolderId:linkedEntry.folder.getId(),linkedAt:now},explorerFile_(folder,'account.json'));
  linkedEntry.record.linkedEmail=email;linkedEntry.record.emailLinkedAt=now;explorerWrite_(linkedEntry.folder,'profile.json',linkedEntry.record,linkedEntry.file);
 }else{
  const account=explorerEmailAccount_(folder);if(!account||account.playerFolderId!==challenge.playerFolderId)explorerFail_(400,'인증번호를 다시 받아 주세요.');
  const direct=explorerChild_(explorerRoot_(),deviceHash,false),alias=explorerSessionFolder_(deviceHash);if(direct&&direct.getId()!==account.playerFolderId||alias&&alias.getId()!==account.playerFolderId)explorerFail_(409,'이 기기 연결 요청을 다시 시작해 주세요.');
  const sessions=explorerChild_(explorerRoot_(),'_device-sessions',true);explorerWrite_(sessions,deviceHash+'.json',{playerFolderId:account.playerFolderId,createdAt:now},explorerFile_(sessions,deviceHash+'.json'));CacheService.getScriptCache().put('player:'+deviceHash,account.playerFolderId,21600);
 }
 challenge.completedAt=challenge.completedAt||now;challenge.completedDeviceHash=deviceHash;explorerWrite_(folder,'challenge.json',challenge,file);
 return {linked:true,maskedEmail:explorerMaskEmail_(email)};
}
function explorerEmailRoute_(request){
 if(request.path==='/api/account'&&(request.method||'GET')==='GET')return explorerAccountStatus_(request.token);
 if(request.method!=='POST')explorerFail_(405,'지원하지 않는 요청이에요.');
 if(request.path==='/api/email/request')return explorerEmailRequest_(request);
 if(request.path==='/api/email/verify')return explorerEmailVerify_(request);
 explorerFail_(404,'요청한 기능을 찾을 수 없어요.');
}
