// Trusted, bundled PlaceMate couple mode. Credentials stay in the parent TwoPlace client.
let nextId=0;
const waiting=new Map();
window.addEventListener('message',event=>{
  if(event.origin!==location.origin||event.source!==parent||event.data?.type!=='twoplace:places:response')return;
  const pending=waiting.get(event.data.id);if(!pending)return;
  waiting.delete(event.data.id);clearTimeout(pending.timer);
  if(event.data.error){const e=new Error(event.data.error.message);e.status=event.data.error.status;pending.reject(e);}else pending.resolve(event.data.data);
});
function bridge(method,body){
  if(parent===window)return Promise.reject(new Error('TwoPlace의 플레이스메이트 메뉴에서 열어 주세요.'));
  return new Promise((resolve,reject)=>{
    const id=String(++nextId),timer=setTimeout(()=>{waiting.delete(id);reject(new Error('지도 저장 서버 응답을 확인하지 못했어요. 새로고침 후 저장 여부를 확인해 주세요.'));},65000);
    waiting.set(id,{resolve,reject,timer});
    parent.postMessage({type:'twoplace:places:request',id,method,body},location.origin);
  });
}
export class CloudStore{
  static connect(){return new CloudStore();}
  async refresh(){this.snapshot=await bridge('GET');this.active=true;this.personal={pendingRoomKeys:[],revision:this.snapshot.revision};return this.toView();}
  toView(){
    const s=this.snapshot,alias=role=>role===s.role?'me':role;
    return {users:['owner','partner'].map(role=>({id:alias(role),name:s.profiles[role].nickname,color:role==='owner'?'#f5dfd8':'#e6e0ee'})),rooms:[{id:s.code,code:s.code,name:'둘만의 공유 플레이스',description:'함께 가고 싶은 곳과 다녀온 추억을 같은 지도에 모아요.',emoji:'♡',master:alias('owner'),members:(s.memberCount===2?['owner','partner']:['owner']).map(alias),bans:[],pending:[],revision:s.revision}],places:s.places.map(p=>({...p,owner:alias(p.owner),rooms:[s.code]})),reviews:s.reviews.map(r=>({...r,user:alias(r.user)}))};
  }
  async saveView(db){
    const places=db.places.filter(p=>p.owner==='me').map(p=>({...p,canonicalId:p.canonicalId||p.id})),known=new Set(db.places.map(p=>p.canonicalId||p.id));
    const reviews=db.reviews.filter(r=>r.user==='me'&&r.visited&&known.has(r.place));
    const saved=await bridge('PUT',{revision:this.snapshot.revision,nickname:db.users.find(u=>u.id==='me').name,places,reviews});
    this.snapshot=saved;this.personal.revision=saved.revision;
  }
}
export const cloudError=error=>error.message||'지도를 불러오지 못했어요. 다시 연결해 주세요.';
