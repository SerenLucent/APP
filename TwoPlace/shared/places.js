const placeId=value=>typeof value==='string'&&/^[a-zA-Z0-9_-]{1,80}$/.test(value);
function placesError(status,message){const e=new Error(message);e.status=status;throw e;}
function placeText(value,max,required=false){if(typeof value!=='string'||value.length>max||(required&&!value.trim()))placesError(400,'장소 정보를 확인해 주세요.');return value.trim();}
export function initialPlaces(){return {schemaVersion:1,revision:0,updatedAt:0,profiles:{owner:{nickname:'방을 만든 사람'},partner:{nickname:'초대받은 사람'}},places:[],reviews:[]};}
export function changePlaces(current,body,role,now){
  if(!['owner','partner'].includes(role))placesError(403,'커플방 연결을 확인해 주세요.');
  if(!Number.isSafeInteger(body.revision)||body.revision!==current.revision)placesError(409,'상대가 먼저 지도를 수정했어요. 새로고침 후 다시 저장해 주세요.');
  if(!Array.isArray(body.places)||body.places.length>200||!Array.isArray(body.reviews)||body.reviews.length>400)placesError(400,'장소는 한 사람당 200개까지 저장할 수 있어요.');
  const nickname=placeText(body.nickname,15,true),other=current.places.filter(p=>p.owner!==role),ids=new Set(other.map(p=>p.id));
  const places=body.places.map(p=>{
    if(!p||!placeId(p.id)||!placeId(p.canonicalId)||ids.has(p.id)||(typeof p.category!=='string'||!p.category.trim()||p.category.length>30)||!Number.isFinite(p.lat)||Math.abs(p.lat)>85||!Number.isFinite(p.lng)||Math.abs(p.lng)>180)placesError(400,'장소 이름·분류·좌표를 확인해 주세요.');
    ids.add(p.id);
    return {id:p.id,canonicalId:p.canonicalId,owner:role,name:placeText(p.name,60,true),address:placeText(p.address,150,true),category:p.category.trim(),wanted:p.wanted===true,lat:p.lat,lng:p.lng,checked:p.checked&&/^\d{4}-\d{2}-\d{2}$/.test(p.checked)?p.checked:null};
  });
  const all=[...other,...places],canonical=new Set(all.map(p=>p.canonicalId)),seen=new Set();
  const reviews=body.reviews.filter(r=>r?.visited).map(r=>{
    if(!placeId(r.place)||!canonical.has(r.place)||seen.has(r.place)||!Number.isInteger(r.rating)||r.rating<0||r.rating>5||!Array.isArray(r.custom)||r.custom.length>15)placesError(400,'방문 장소와 별점을 확인해 주세요.');
    seen.add(r.place);
    return {place:r.place,user:role,visited:true,rating:r.rating,custom:r.custom.map(c=>{if(!c||!Number.isInteger(c.score)||c.score<1||c.score>5)placesError(400,'평가 항목의 별점을 확인해 주세요.');return {label:placeText(c.label,25,true),score:c.score};}),comment:placeText(r.comment,300),visitedAt:typeof r.visitedAt==='string'?r.visitedAt.slice(0,32):null};
  });
  return {schemaVersion:1,revision:current.revision+1,updatedAt:now,profiles:{...current.profiles,[role]:{nickname}},places:all,reviews:[...current.reviews.filter(r=>r.user!==role&&canonical.has(r.place)),...reviews]};
}
