import {gasRequest,gasUrl,initializeClient} from './room-client.js';
import './admin.css';
const root=document.querySelector('#admin');
let token='',selected=null,offset=0,busy=false;
root.innerHTML=`<header><p>TWOPLACE ADMIN</p><h1>커플방 관리</h1><a href="./">앱으로 돌아가기</a></header><section><label>관리자 토큰<input id="admin-token" type="password" autocomplete="off" placeholder="앱스크립트에서 발급한 관리자 토큰"></label><button id="connect">방 목록 불러오기</button><button id="logout">연결 해제</button><p>토큰은 이 화면의 메모리에만 보관합니다. GitHub 업로드용 토큰과 다릅니다.</p></section><p id="status" role="status"></p><section><h2>커플방</h2><div id="rooms"></div><button id="more" hidden>다음 50개</button></section><section id="editor" hidden><h2 id="room-title"></h2><p>저장 전 원본 JSON을 GitHub의 해당 커플 폴더에 자동 백업합니다.</p><label>디데이 · 일정 · 메모<textarea id="state" spellcheck="false"></textarea></label><label>펫 · 하트 · 먹이 · 가구<textarea id="pets" spellcheck="false"></textarea></label><button id="save">이 방의 변경 내용 저장</button><button id="reload">다시 불러오기</button><button id="download">JSON 내려받기</button></section>`;
const $=id=>document.getElementById(id);
function status(text){$('status').textContent=text;}
async function run(task){if(busy)return;busy=true;root.setAttribute('aria-busy','true');try{await task();}catch(e){status(e.message);}finally{busy=false;root.setAttribute('aria-busy','false');}}
async function list(){
  const data=await gasRequest('/admin/rooms',{token,body:{offset}});
  if(!offset)$('rooms').replaceChildren();
  for(const room of data.rooms){const b=document.createElement('button');b.textContent=room.code;b.addEventListener('click',()=>run(()=>openRoom(room.code)));$('rooms').append(b);}
  offset=data.nextOffset;$('more').hidden=offset===null;status('관리자 인증 완료 · 방을 선택하세요.');
}
async function openRoom(code){
  const data=await gasRequest('/admin/room',{token,body:{code}});selected=data;
  $('room-title').textContent=`방 ${data.code} · ${data.memberCount}명`;
  $('state').value=JSON.stringify(data.state,null,2);$('pets').value=JSON.stringify(data.petHome,null,2);
  $('editor').hidden=false;status('방 데이터를 불러왔어요.');
}
$('connect').onclick=()=>run(async()=>{token=$('admin-token').value.trim();offset=0;await list();$('admin-token').value='';});
$('more').onclick=()=>run(list);
$('logout').onclick=()=>{token='';selected=null;offset=0;$('admin-token').value='';$('state').value='';$('pets').value='';$('rooms').replaceChildren();$('editor').hidden=true;$('more').hidden=true;status('연결을 해제했어요.');};
$('reload').onclick=()=>run(()=>openRoom(selected.code));
$('save').onclick=()=>run(async()=>{
  let state,petHome;try{state=JSON.parse($('state').value);petHome=JSON.parse($('pets').value);}catch{throw new Error('JSON 문법을 확인해 주세요.');}
  const data=await gasRequest('/admin/room',{token,method:'PUT',body:{code:selected.code,revision:selected.revision,petVersion:selected.petHome.version,state,petHome}});
  selected=data;$('state').value=JSON.stringify(data.state,null,2);$('pets').value=JSON.stringify(data.petHome,null,2);status('원본을 백업하고 변경 내용을 저장했어요.');
});
$('download').onclick=()=>{if(!selected)return;const blob=new Blob([JSON.stringify(selected,null,2)],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=`TwoPlace-${selected.code}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
initializeClient().then(()=>{if(!gasUrl)status('앱스크립트 주소 설정 후 이용할 수 있어요.');});
