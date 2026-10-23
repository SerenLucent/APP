import {createPlaceMateClient} from './cloud-client.js';

export const CLOUD_ENDPOINT='https://script.google.com/macros/s/AKfycbx-5N5NHF29K7b8gusjOgnzv8Gew0meEbow8xbFd6wE4ZpE6t5EN1e-QdhckQVR0cU/exec';
export const SESSION_KEY='jidomate-personal-key';

export class CloudStore {
  constructor(client){this.client=client;this.personal=null;this.snapshots=[];this.active=false;}
  static connect(key){return new CloudStore(createPlaceMateClient({endpoint:CLOUD_ENDPOINT,personalKey:key}));}
  async refresh(){
    const personal=await this.client.call('getPersonal');
    const snapshots=[];
    for(const roomKey of personal.roomKeys){
      try{snapshots.push(await this.client.call('getRoom',{roomKey}));}
      catch(error){if(error.code==='NOT_A_MEMBER')continue;throw error;}
    }
    // Swap only after all reads succeed, retaining the last confirmed view on failure.
    this.personal=personal;this.snapshots=snapshots;this.active=true;
    return this.toView();
  }
  toView(){
    const p=this.personal, alias=id=>id===p.id?'me':id;
    const users=new Map([['me',{id:'me',name:p.nickname,color:'#e7ecd8'}]]);
    const places=new Map(),visits=new Map();
    const addVisit=(v,uid)=>visits.set(`${uid}:${v.canonicalId}`,{place:v.canonicalId,user:alias(uid),visited:true,rating:v.rating??0,custom:v.custom||[],comment:v.comment||'',visitedAt:v.visitedAt});
    for(const item of p.places)places.set(`me:${item.id}`,{...item,checked:item.checkedAt,owner:'me',rooms:[]});
    for(const s of this.snapshots){
      for(const member of [...(s.merged?.members||[]),...(s.pendingProfiles||[])])users.set(alias(member.id),{id:alias(member.id),name:member.nickname,color:'#e5eadb'});
      for(const item of s.merged?.places||[]){
        const owner=alias(item.ownerId),key=`${owner}:${item.id}`;
        if(!places.has(key))places.set(key,{...item,id:owner==='me'?item.id:`${owner}:${item.id}`,checked:item.checkedAt,owner,rooms:[]});
        const place=places.get(key);if(!place.rooms.includes(s.room.key))place.rooms.push(s.room.key);
      }
      for(const v of s.merged?.visits||[])if(v.userId!==p.id)addVisit(v,v.userId);
    }
    // Personal visits take precedence over snapshots read before a concurrent update.
    for(const v of p.visits)addVisit(v,p.id);
    const rooms=this.snapshots.map(({room:r})=>({id:r.key,code:r.key,name:r.name,description:r.description,emoji:'🌿',master:alias(r.masterId),members:r.members.map(alias),pending:(r.pending||[]).map(alias),bans:(r.bans||[]).map(alias),revision:r.revision}));
    return {users:[...users.values()],places:[...places.values()],reviews:[...visits.values()],rooms};
  }
  async saveView(db){
    const places=db.places.filter(p=>p.owner==='me').map(p=>({id:p.id,canonicalId:p.canonicalId||p.id,name:p.name,address:p.address,category:p.category,lat:p.lat,lng:p.lng,checkedAt:p.checked||null}));
    const seen=new Map();
    for(const r of db.reviews.filter(r=>r.user==='me'&&r.visited)){
      const match=db.places.find(p=>p.id===r.place);
      const canonicalId=match?.canonicalId||r.place;
      seen.set(canonicalId,{canonicalId,visited:true,visitedAt:r.visitedAt||null,rating:r.rating||null,custom:r.custom.filter(c=>c.score>0),comment:r.comment||''});
    }
    await this.client.call('savePersonal',{expectedRevision:this.personal.revision,nickname:db.users.find(u=>u.id==='me').name,places,visits:[...seen.values()]});
  }
  async command(action,payload){return this.client.call(action,payload);}
  async searchPlaces(query){return this.client.call('searchPlaces',{query});}
}

export async function getMapConfig(){
  const response=await fetch(CLOUD_ENDPOINT+'?action=mapConfig&v=3&t='+Date.now(),{credentials:'omit',cache:'no-store'});
  if(!response.ok)throw new Error('MAP_CONFIG_FAILED');
  const result=await response.json();
  if(!result.ok||!result.data)throw new Error('NAVER_BACKEND_UPDATE_REQUIRED');
  return result.data;
}

export function cloudError(error){
  const messages={CONFIG_REQUIRED:'Apps Script의 GitHub 설정값을 확인해주세요.',PRIVATE_REPOSITORY_REQUIRED:'Apps Script가 이전 버전이에요. 최신 PlaceMate.gs로 교체하고 기존 배포를 새 버전으로 업데이트해주세요.',GITHUB_ACCESS_DENIED:'GitHub 토큰의 저장소 접근 및 Contents 읽기·쓰기 권한을 확인해주세요.',GITHUB_ERROR:'GitHub 저장소 또는 브랜치 설정을 확인해주세요.',GITHUB_CONFLICT:'다른 저장과 겹쳤어요. 새로고침한 뒤 변경 내용을 다시 확인해주세요.',STALE_REVISION:'다른 기기에서 기록이 바뀌었어요. 새로고침한 뒤 다시 수정해주세요.',ACCOUNT_NOT_FOUND:'이 개인키로 저장된 계정을 찾지 못했어요.',ACCOUNT_EXISTS:'이미 등록된 개인키예요. 기존 개인키로 접속해주세요.',INVALID_PERSONAL_KEY:'개인키는 64자리 영문 소문자·숫자 코드예요.',ROOM_NOT_FOUND:'해당 방키를 찾지 못했어요.',INVALID_ROOM_KEY:'방키는 12자리 영문·숫자 코드예요.',ALREADY_MEMBER:'이미 참여 중인 방이에요.',ALREADY_PENDING:'이미 가입 승인을 기다리고 있어요.',BANNED:'이 방에 가입할 수 없는 계정이에요.',NOT_A_MEMBER:'현재 이 방의 승인된 멤버가 아니에요. 새로고침해주세요.',MASTER_ONLY:'방장만 할 수 있는 작업이에요.',TRANSFER_BEFORE_LEAVE:'방장을 위임한 뒤 탈퇴해주세요.',BUSY:'다른 저장을 처리 중이에요. 잠시 뒤 다시 시도해주세요.',ROOM_LIMIT:'방의 인원 또는 가입 가능한 방 수를 확인해주세요.',TOO_MANY_ROOMS:'가입 가능한 방 수를 초과했어요.'};
  if(error.name==='AbortError')return '응답 시간이 길어졌어요. 저장 여부를 먼저 새로고침으로 확인해주세요.';
  if(error instanceof TypeError)return '서버에 연결하지 못했어요. 인터넷 연결과 Apps Script의 접근 권한·CORS 설정을 확인해주세요.';
  return messages[error.code||error.message]||'저장 결과를 확인하지 못했어요. 새로고침으로 저장 여부를 확인해주세요. ('+(error.code||error.message||'오류')+')';
}

