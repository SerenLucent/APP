// Snapshot the completed PlaceMate UI; keep standalone PlaceMate accounts and rooms separate.
import fs from 'node:fs';
let s=fs.readFileSync('integrations/placemate/upstream-app.js','utf8').split('function setCloudBusy')[0];
s=s.replace("import {CloudStore,SESSION_KEY,cloudError,getMapConfig} from './cloud-store.js';","import {CloudStore,cloudError,getMapConfig} from './cloud-store.js';").replace("import {generatePersonalKey} from './cloud-client.js';",'');
s=s.replace(/^const initial=.*$/m,"const initial={users:[{id:'me',name:'나',color:'#e7ecd8'}],rooms:[{id:'couple',name:'둘만의 공유 플레이스',description:'커플방과 지도를 연결하고 있어요.',emoji:'♡',master:'me',members:['me'],bans:[],pending:[]}],places:[],reviews:[]};");
s=s.replace(/^let db;.*$/m,'let db=structuredClone(initial);').replace("let roomId='friends',selected='p1'","let roomId='couple',selected=null");
s=s.replace(/^const save=.*$/m,'const save=()=>{};');
s=s.replace("if(!cloud?.active){fn();save();close();render();if(message)toast(message);return;}","if(!cloud?.active)return toast('커플방 연결을 먼저 확인해 주세요.');");
s=s.replace("if(cloud?.active&&handleCloudAdmin(b))return;",'');
const labels=[['나의 취향 지도','내가 등록한 장소'],['지도메이트','플레이스 메이트'],['모두의 추천보다, 내 메이트의 추천.','둘이 발견하고, 함께 기억하는 곳.'],['내가 발견한 장소와 경험. 원하는 메이트에게만 나눠요.','내가 등록한 장소도 두 사람의 지도에 함께 저장돼요.'],['개인 지도에 저장돼요. 방에 나누고 싶을 땐 ‘내 장소 배포’를 눌러주세요.','저장하면 현재 TwoPlace 커플방에 바로 공유돼요.'],['내 지도에 저장했어요. 공유는 원하는 방에서 선택해 주세요.','둘만의 지도에 장소를 저장했어요.'],['공유한 모든 방에도 수정 내용이 반영됐어요.','우리 지도에 수정 내용을 저장했어요.'],['내 지도에 저장','공유 지도에 저장'],['이 지도는 우리 메이트에게만 보여요','현재 커플방과 연결된 공유 지도'],['내 기록은 나에게, 공유는 선택한 방에만','내가 등록한 장소도 상대와 함께 공유해요'],['내 기록은 언제나 나의 것으로.','작은 발견을 둘이 함께 모아요.'],['MY MATE ROOMS','OUR COUPLE MAP'],["?'PRIVATE':'MATES ONLY'","?'MY PLACES':'TWO OF US'"],["'내 기록'):'닉네임으로 시작'","'커플방 연결'):'연결 중'"],["roomId='personal';selected=id","roomId=cloud.snapshot.code;selected=id"]];
for(const [a,b]of labels)s=s.replaceAll(a,b);
s=s.replaceAll('내 지도','내가 등록한 곳');
s+=`
function setCloudBusy(value){cloudBusy=value;document.body.classList.toggle('cloud-busy',value);document.querySelector('#cloud-status')?.remove();if(value){const e=document.createElement('div');e.id='cloud-status';e.setAttribute('role','status');e.textContent='커플방에 지도 기록을 저장하고 있어요…';document.body.append(e);}}
function showCloudError(error){toast(cloudError(error));}
async function refreshCloud(){db=await cloud.refresh();cloudUnsure=false;if(!db.rooms.some(r=>r.id===roomId)&&roomId!=='personal')roomId=db.rooms[0].id;render();}
async function startCloud(){
  cloud=CloudStore.connect();setCloudBusy(true);
  try{await refreshCloud();roomId=db.rooms[0].id;render();}
  catch(error){app.innerHTML='<div class="empty"><h1>공유 지도를 연결하지 못했어요</h1><p>'+esc(cloudError(error))+'</p><button class="btn primary" data-action="refresh">다시 연결하기</button></div>';}
  finally{setCloudBusy(false);}
}
function action(a){
  if(a==='close'){close();return;}if(cloudBusy)return;
  if(a==='refresh'){if(!cloud?.active){startCloud();return;}setCloudBusy(true);refreshCloud().catch(e=>{cloudUnsure=true;showCloudError(e);}).finally(()=>setCloudBusy(false));return;}
  if(!cloud?.active)return toast('커플방 지도를 연결하고 있어요.');
  if(a==='connection'||a==='about'){modal('TwoPlace와 연결된 지도','<p class="intro">현재 커플방의 두 사람이 같은 장소와 방문 기록을 공유해요. 별도 가입은 필요 없어요.</p><p class="note-box">방 코드: '+esc(cloud.snapshot.code)+'<br>장소를 등록하면 자동 공유되며, 방문과 별점은 각자 기록해요. 약 15초마다 상대방 변경 내용을 확인해요.</p>');return;}
  if(a==='add'||a==='search-store'){searchPlaceForm();return;}if(a==='manual-place'){placeForm();return;}
  if(['menu','visited','add','edit-place','review','visit','zoom-in','zoom-out','recenter','add-rating','profile','export','delete-place'].includes(a))localAction(a);
}
document.addEventListener('keydown',e=>{if(e.key==='Escape')close();});
setInterval(async()=>{if(!cloud?.active||cloudBusy||cloudUnsure||document.hidden||modalRoot.firstChild||searchComposing||document.activeElement?.id==='search')return;cloudBusy=true;try{const previous=cloud.snapshot;const next=await cloud.refresh();if(previous.revision!==cloud.snapshot.revision||previous.memberCount!==cloud.snapshot.memberCount){db=next;render();}}catch(error){cloudUnsure=true;showCloudError(error);}finally{cloudBusy=false;}},15000);
render();startCloud();
`;
fs.writeFileSync('public/placemate/app.js',s);
