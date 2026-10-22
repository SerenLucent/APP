import {cleanState,memberState} from '../shared/room-state.js';
import {initialPetHome,petSnapshot,changePetHome,CATALOG} from '../server/pets.js';
import {initialPlaces,changePlaces} from '../shared/places.js';
const KEY='twoplace:demo:v2';
function day(date){return [date.getFullYear(),String(date.getMonth()+1).padStart(2,'0'),String(date.getDate()).padStart(2,'0')].join('-');}
export function createDemoClient({storage,now=()=>Date.now()}={}){
  function seed(){
    const today=new Date(now()),on=offset=>{const d=new Date(today);d.setDate(d.getDate()+offset);return day(d);};
    return {seedDay:on(0),revision:0,state:{startDate:on(-99),characters:{owner:'momo',partner:'kuki'},events:[
      {authorRole:'owner',id:'demo-off',date:on(-1),title:'휴무',kind:'work',workType:'off',time:'',place:'',details:'오늘은 푹 쉬는 날이에요.'},
      {authorRole:'partner',id:'demo-leave',date:on(0),title:'퇴근',kind:'work',workType:'leave',time:'19:00',place:'',details:'퇴근 후 저녁 같이 먹기'},
      {authorRole:'owner',id:'demo-date',date:on(0),title:'카페 데이트',kind:'date',time:'20:00',place:'성수동 카페',details:'저녁 먹고 카페에서 이야기해요.'},
      {id:'demo-note',date:on(0),title:'장보기',kind:'general',time:'',place:'',details:'우유와 과일 사기'},
      {id:'demo-anniversary',date:on(0),title:'우리 기념일',kind:'general',time:'',place:'',details:'한 날짜에 일정이 여러 개 있을 때의 예시예요.'},
      {authorRole:'partner',id:'demo-trip',date:on(1),title:'주말 여행',kind:'trip',time:'10:00',place:'',details:'함께 근교 여행 가기 · 준비물과 계획을 적어보세요.'},
      {id:'demo-off-next',date:on(3),title:'휴무',kind:'work',workType:'off',time:'',place:'',details:''}
    ],notes:[{id:'demo-memo',date:on(0),body:'모의 테스트 메모예요. 자유롭게 바꾸어 보세요.'}]},petHome:initialPetHome(now()),places:initialPlaces()};
  }
  let data=seed();
  try{const saved=JSON.parse(storage?.getItem(KEY)||'null');if(saved?.seedDay===data.seedDay){cleanState(saved.state);if(Number.isSafeInteger(saved.revision)&&saved.petHome&&saved.places)data=saved;}}catch{/* Invalid demo storage starts from the samples. */}
  const persist=()=>{try{storage?.setItem(KEY,JSON.stringify(data));}catch{/* Demo remains usable in memory. */}};
  const snapshot=()=>structuredClone({code:'000000000000',role:'owner',memberCount:2,recoveryEnabled:false,revision:data.revision,state:data.state,petHome:petSnapshot(data.petHome,now()),catalog:CATALOG});
  return {
    reset(){data=seed();persist();return snapshot();},
    async request(path,{method='GET',body={}}={}){
      if(path==='/room'&&method==='GET')return snapshot();
      if(path==='/room/state'&&method==='PUT'){
        if(body.revision!==data.revision){const e=new Error('모의 데이터를 새로 불러와 주세요.');e.status=409;throw e;}
        data.state=memberState(data.state,body.state,'owner');data.revision++;persist();return snapshot();
      }
      if(path==='/room/pets'&&method==='POST'){data.petHome=changePetHome(data.petHome,body,now(),()=>crypto.randomUUID());persist();return snapshot();}
      if(path==='/room/places'&&['GET','PUT'].includes(method)){if(method==='PUT'){data.places=changePlaces(data.places,body,'owner',now());persist();}return structuredClone({code:'000000000000',role:'owner',memberCount:2,...data.places});}
      throw new Error('모의 테스트에서는 실제 방 생성·입장·복구를 하지 않아요.');
    }
  };
}
