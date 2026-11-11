// Git trees publish changed documents + wallet + logs in one atomic commit.
function storageRead_(code,name,ref){
 const path=ROOM_PREFIX+code+'/'+name;
 try{const file=github_('/contents/'+validPath_(path)+'?ref='+ref,'GET');return {data:JSON.parse(Utilities.newBlob(Utilities.base64Decode(file.content.replace(/\s/g,''))).getDataAsString('UTF-8')),sha:file.sha};}
 catch(error){if(error.status===404)return null;throw error;}
}
function storageCommit_(entry,changes){
 const treeBase=github_('/git/commits/'+entry.head,'GET').tree.sha;
 const tree=github_('/git/trees','POST',{base_tree:treeBase,tree:Object.entries(changes).map(function(pair){const full=ROOM_PREFIX+entry.room.code+'/'+pair[0];validPath_(full);return {path:full,mode:'100644',type:'blob',content:JSON.stringify(pair[1],null,2)};})});
 const commit=github_('/git/commits','POST',{message:'Save TwoPlace split room data',tree:tree.sha,parents:[entry.head]});
 github_('/git/refs/heads/'+GITHUB_BRANCH,'PATCH',{sha:commit.sha,force:false});
 entry.head=commit.sha;
}
function storageSession_(entry){return createRoomDocuments(entry.room,{read:function(name){const file=storageRead_(entry.room.code,name,entry.head);return file?file.data:null;},commit:function(changes){storageCommit_(entry,changes);entry.room=changes['room.json'];},idFactory:function(){return Utilities.getUuid().replace(/-/g,'');}});}
function storageMember_(token){
 if(typeof token!=='string'||!/^[a-f0-9]{64}$/.test(token))fail_(401,'커플방에 다시 입장해 주세요.');
 const hashed=digest_(token),path=props_().getProperty('github-member:'+hashed);if(!path)fail_(401,'커플방에 다시 입장해 주세요.');
 const head=github_('/git/ref/heads/'+GITHUB_BRANCH,'GET').object.sha;
 const code=path.split('/').slice(-2)[0],file=storageRead_(code,'room.json',head);
 if(!file)fail_(404,'커플방을 찾을 수 없어요.');
 const member=file.data.members.find(function(m){return m.hash===hashed;});if(!member)fail_(401,'입장 정보를 확인해 주세요.');
 const entry={room:file.data,head:head,role:member.role};
 if(entry.room.storageVersion!==2){
  const documents=partitionLegacyRoom(entry.room);
  // This backup and all split files become visible together. A failed commit leaves the old room intact.
  documents['backups/storage-v2_'+head+'.json']=entry.room;
  storageCommit_(entry,documents);entry.room=documents['room.json'];
 }
 return entry;
}
function storageAll_(session,room){for(const section of ['housing','notes','adventure'])session.content(section);session.content('calendar',room.content.calendarYears);}
function routePartitioned_(req){
 const paths=['/room','/room/content','/room/history','/room/state','/room/calendar/read','/room/pets'];
 if(!paths.includes(req.path)||req.storageProtocol!==2)return null;
 const entry=storageMember_(req.token),session=storageSession_(entry),body=req.body||{},method=req.method||'GET';
 if(req.path==='/room'&&method==='GET')return {data:session.snapshot(entry.role)};
 if(req.path==='/room/content'&&method==='POST'){session.content(body.section,body.years||[]);return {data:session.snapshot(entry.role)};}
 if(req.path==='/room/history'&&method==='POST'){if(!['heart','clear'].includes(body.kind))fail_(400,'이력 종류를 확인해 주세요.');return {data:session.history(body.kind,body.start,body.end)};}
 if(req.path==='/room/state'&&method==='PUT')session.updateState(body,entry.role);
 else if(req.path==='/room/calendar/read'&&method==='POST')session.readCalendar(body,entry.role);
 else if(req.path==='/room/pets'&&method==='POST')session.petAction(body,entry.role);
 else fail_(404,'요청한 기능이 없어요.');
 return {data:session.snapshot(entry.role)};
}
