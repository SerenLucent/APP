import {placementAllowed} from '../shared/pet-space.js';

export const HOUR = 3600000;
export const HEARTS_PER_HOUR = 10;
export const SPACES = ['yard','terrace','home','momoRoom','kukiRoom'];
export const CATALOG = [
  {id:'snack',name:'별사탕 먹이',price:10,type:'food',symbol:'✦',description:'한 마리의 배고픔을 25 채워 줘요'},
  {id:'cushion',name:'구름 방석',price:30,type:'furniture',symbol:'☁',description:'낮잠이 솔솔 오는 포근한 자리'},
  {id:'plant',name:'초록 화분',price:25,type:'furniture',symbol:'♧',description:'어디에 놓아도 싱그러운 작은 초록'},
  {id:'table',name:'동그란 테이블',price:50,type:'furniture',symbol:'◒',description:'둘이 마주 앉는 작은 테이블'},
  {id:'rug',name:'햇살 러그',price:40,type:'furniture',symbol:'◉',description:'발끝까지 따뜻해지는 햇살 한 조각'},
  {id:'lamp',name:'달빛 조명',price:45,type:'furniture',symbol:'☾',description:'우리 집에 내려앉은 작은 달빛'},
  {id:'fence',name:'하얀 울타리',price:35,type:'furniture',symbol:'▥',description:'앞마당에 둘러 주는 아담한 울타리'},
];
export class PetError extends Error {
  constructor(message,status=400) { super(message); this.status=status; }
}
export function initialPetHome(now=Date.now()) {
  return {version:0, hearts:120, snacks:4, lastClaim:now, pets:{mochi:{hunger:75,updatedAt:now},kuki:{hunger:75,updatedAt:now}}, items:[]};
}
export function hunger(pet,now=Date.now()) { return Math.max(0,pet.hunger - Math.max(0,Math.floor((now-pet.updatedAt)/HOUR))*4); }
export function claimable(home,now=Date.now()) { return now-home.lastClaim>=HOUR ? HEARTS_PER_HOUR : 0; }
export function petSnapshot(home,now=Date.now()) {
  return {...home, serverNow:now, claimable:claimable(home,now), nextClaimAt:home.lastClaim+HOUR, pets:Object.fromEntries(Object.entries(home.pets).map(([id,pet]) => [id,{...pet,hunger:hunger(pet,now)}]))};
}
export function changePetHome(current,action,now=Date.now(),idFactory=()=>crypto.randomUUID()) {
  if (!action || !Number.isSafeInteger(action.version) || action.version !== current.version) throw new PetError('상대가 먼저 펫 공간을 바꿨어요. 최신 상태에서 다시 시도해 주세요.',409);
  const home = structuredClone(current);
  switch(action.type) {
    case 'claim': {
      const amount = claimable(home,now);
      if (!amount) throw new PetError('하트가 모이고 있어요. 한 시간이 지나면 받을 수 있어요.');
      home.hearts += amount;
      home.lastClaim = now;
      break;
    }
    case 'buy': {
      const product = CATALOG.find(item=>item.id === action.product);
      if (!product) throw new PetError('이 상품은 찾을 수 없어요.');
      if (home.hearts < product.price) throw new PetError('하트가 부족해요. 하트를 더 모아 주세요.');
      if (product.type === 'food' && home.snacks >= 100) throw new PetError('먹이는 최대 100개까지 보관할 수 있어요.');
      if (product.type === 'furniture' && home.items.length >= 40) throw new PetError('가구는 최대 40개까지 보관할 수 있어요.');
      home.hearts -= product.price;
      if (product.type === 'food') home.snacks++;
      else home.items.push({id:idFactory(),product:product.id,space:null,x:50,y:65});
      break;
    }
    case 'feed': {
      if (!['mochi','kuki'].includes(action.pet)) throw new PetError('어떤 친구에게 줄지 골라 주세요.');
      if (home.snacks < 1) throw new PetError('먹이가 없어요. 상점에서 구매해 주세요.');
      const level = hunger(home.pets[action.pet],now);
      if (level >= 100) throw new PetError('이미 배가 든든해요. 나중에 먹이를 주세요.');
      home.snacks--;
      home.pets[action.pet] = {hunger:Math.min(100,level+25),updatedAt:now};
      break;
    }
    case 'place': {
      const item = home.items.find(item=>item.id === action.item);
      if (!item) throw new PetError('보유한 가구만 배치할 수 있어요.');
      if (!SPACES.includes(action.space) || !Number.isFinite(action.x) || !Number.isFinite(action.y) || action.x<10 || action.x>90 || action.y<45 || action.y>88) throw new PetError('공간 안의 배치할 위치를 골라 주세요.');
      const rotation=action.rotation ?? item.rotation ?? 0;
      if(![0,90].includes(rotation))throw new PetError('가구 방향을 확인해 주세요.');
      if(!placementAllowed(home.items,item,action.space,{x:action.x,y:action.y},rotation))throw new PetError('다른 가구와 겹치거나 바닥을 벗어나는 자리예요. 초록색 자리를 골라 주세요.');
      Object.assign(item,{space:action.space,x:action.x,y:action.y,rotation});
      break;
    }
    case 'store': {
      const item = home.items.find(item=>item.id === action.item);
      if (!item) throw new PetError('가구를 찾을 수 없어요.');
      item.space = null;
      break;
    }
    default: throw new PetError('할 수 없는 동작이에요.');
  }
  home.version++;
  return home;
}
