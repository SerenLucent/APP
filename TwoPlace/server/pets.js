import {CARE_PERIOD,petLevel,starving,careRewardReady,careBonus,careDay,hourlyHeartAmount} from '../shared/pet-care.js';
import {availableTableSlot,syncTabletopItems,tableSlot} from '../shared/tabletop.js';
import {HOUSEHOLD_PRODUCTS,TABLETOP_PRODUCTS,isTabletop} from '../shared/household-catalog.js';
import {PRODUCT_SPACES,usableInSpace} from '../shared/pet-products.js';
import {placementAllowed} from '../shared/pet-space.js';

export const HOUR = 3600000;
export const HEARTS_PER_HOUR = 10;
export const SPACES = ['yard','terrace','home','momoRoom','kukiRoom'];
export const CATALOG = [
  {id:'snack',name:'별사탕 먹이',price:4,type:'food',symbol:'✦',description:'한 마리의 배고픔을 25 채워 줘요'},
  {id:'cushion',name:'구름 방석',price:30,type:'furniture',symbol:'☁',description:'낮잠이 솔솔 오는 포근한 자리'},
  {id:'plant',name:'초록 화분',price:25,type:'furniture',symbol:'♧',description:'어디에 놓아도 싱그러운 작은 초록'},
  {id:'table',name:'동그란 테이블',price:50,type:'furniture',symbol:'◒',description:'둘이 마주 앉는 작은 테이블'},
  {id:'rug',name:'햇살 러그',price:40,type:'furniture',symbol:'◉',description:'발끝까지 따뜻해지는 햇살 한 조각'},
  {id:'lamp',name:'달빛 조명',price:45,type:'furniture',symbol:'☾',description:'우리 집에 내려앉은 작은 달빛'},
  {id:'bed',name:'포근한 구름 침대',price:90,type:'furniture',symbol:'☾',description:'누르면 선택한 친구가 침대에 누워 쉬어요'},
  {id:'sofa',name:'둘이 앉는 소파',price:80,type:'furniture',symbol:'♡',description:'폭신한 자리에 앉아 잠깐 쉬어요'},
  {id:'bookshelf',name:'이야기 책장',price:65,type:'furniture',symbol:'▤',description:'마음에 드는 책을 꺼내 읽어요'},
  {id:'desk',name:'작은 작업 책상',price:75,type:'furniture',symbol:'✎',description:'오늘의 이야기를 끄적이는 자리'},
  {id:'wardrobe',name:'원목 옷장',price:85,type:'furniture',symbol:'▥',description:'친구가 옷장 앞에서 단장해요'},
  {id:'nightstand',name:'달빛 협탁',price:35,type:'furniture',symbol:'☾',description:'잠들기 전 작은 소지품을 정리해요'},
  {id:'toybox',name:'장난감 바구니',price:40,type:'furniture',symbol:'✦',description:'모모와 쿠키가 장난감을 가지고 놀아요'},
  {id:'bowl',name:'도자기 물그릇',price:20,type:'furniture',symbol:'◡',description:'산책 후 시원한 물을 마셔요'},
  {id:'bench',name:'햇살 정원 벤치',price:60,type:'furniture',symbol:'⌑',description:'앞마당에 앉아 햇볕을 쬐어요'},
  {id:'flowerbed',name:'작은 꽃밭',price:45,type:'furniture',symbol:'❀',description:'꽃에 물을 주며 정원을 돌봐요'},
  {id:'pond',name:'조약돌 연못',price:100,type:'furniture',symbol:'≈',description:'잔물결과 작은 물고기를 구경해요'},
  {id:'lantern',name:'정원 랜턴',price:30,type:'furniture',symbol:'☼',description:'누르면 따뜻한 불빛이 켜져요'},
  ...HOUSEHOLD_PRODUCTS,...TABLETOP_PRODUCTS,
].map(product=>({...product,spaces:PRODUCT_SPACES[product.id]}));
export class PetError extends Error {
  constructor(message,status=400) { super(message); this.status=status; }
}
export function initialPetHome(now=Date.now()) {
  return {calendarRewards:{registration:{},reads:{},seen:[],backfilled:true},layoutVersion:1,version:0, hearts:120, snacks:4, lastClaim:now, pets:{mochi:{hunger:75,updatedAt:now},kuki:{hunger:75,updatedAt:now}}, items:[]};
}
export function hunger(pet,now=Date.now()) { return petLevel(pet,'hunger',now); }
export function claimable(home,now=Date.now()) { return hourlyHeartAmount(home,now); }
export function petSnapshot(home,now=Date.now()) {
  const items=JSON.parse(JSON.stringify(home.items));syncTabletopItems(items);
  return {...home,items, serverNow:now, claimable:claimable(home,now), nextClaimAt:home.lastClaim+HOUR, pets:Object.fromEntries(Object.entries(home.pets).map(([id,pet]) => [id,{...pet,hunger:hunger(pet,now),hungerBase:pet.hunger,affinity:petLevel(pet,'affinity',now),energy:petLevel(pet,'energy',now),sampledAt:now}]))};
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
      const quantity=action.quantity===undefined?1:action.quantity;
      if(!Number.isSafeInteger(quantity)||quantity<1||quantity>100||(product.type!=='food'&&quantity!==1))throw new PetError('구매 수량을 확인해 주세요.');
      const total=product.price*quantity;
      if (home.hearts < total) throw new PetError('하트가 부족해요. 하트를 더 모아 주세요.');
      if (product.type === 'food' && home.snacks+quantity > 100) throw new PetError('먹이는 최대 100개까지 보관할 수 있어요.');
      if (product.type === 'furniture' && home.items.length >= 120) throw new PetError('가구는 최대 120개까지 보관할 수 있어요.');
      home.hearts -= total;
      if (product.type === 'food') home.snacks+=quantity;
      else home.items.push({id:idFactory(),product:product.id,space:null,x:50,y:65});
      break;
    }
    case 'feed': {
      if (!['mochi','kuki'].includes(action.pet)) throw new PetError('어떤 친구에게 줄지 골라 주세요.');
      if (home.snacks < 1) throw new PetError('먹이가 없어요. 상점에서 구매해 주세요.');
      const level = hunger(home.pets[action.pet],now);
      if (level >= 100) throw new PetError('이미 배가 든든해요. 나중에 먹이를 주세요.');
      home.snacks--;
      const pet=home.pets[action.pet];home.pets[action.pet] = {...pet,affinityAt:pet.affinityAt??pet.updatedAt,energyAt:pet.energyAt??pet.updatedAt,hunger:Math.min(100,level+25),updatedAt:now};
      break;
    }
    case 'pat':
    case 'sleep':{
      if(!['mochi','kuki'].includes(action.pet))throw new PetError('돌볼 친구를 골라 주세요.');
      const kind=action.type==='pat'?'affinity':'energy',pet=home.pets[action.pet],reward=careRewardReady(home,action.pet,action.type,now);
      pet[kind]=100;pet[kind+'At']=now;if(reward){home.hearts++;home.careBonuses={...home.careBonuses,[action.pet]:{...home.careBonuses?.[action.pet],[action.type]:{day:careDay(now),count:careBonus(home,action.pet,action.type,now).count+1,lastAt:now}}};}break;
    }
    case 'placeOnTable': {
      const item=home.items.find(i=>i.id===action.item);
      if(!item||!isTabletop(item.product))throw new PetError('식탁에 올릴 음식을 골라 주세요.');
      if(![0,90,180,270].includes(action.rotation??0))throw new PetError('방향을 확인해 주세요.');
      if(!availableTableSlot(home.items,action.parentId,action.slot,item.id))throw new PetError('빈 식탁 상판 자리를 골라 주세요.');
      Object.assign(item,{parentId:action.parentId,slot:action.slot,rotation:action.rotation??0});syncTabletopItems(home.items);
      break;
    }
    case 'place': {
      const item = home.items.find(item=>item.id === action.item);
      if (!item) throw new PetError('보유한 가구만 배치할 수 있어요.');
      if(isTabletop(item.product))throw new PetError('음식은 식탁 위에만 배치할 수 있어요.');
      if (!SPACES.includes(action.space) || !Number.isFinite(action.x) || !Number.isFinite(action.y) || action.x<10 || action.x>90 || action.y<45 || action.y>88) throw new PetError('공간 안의 배치할 위치를 골라 주세요.');
      if(!usableInSpace(item.product,action.space))throw new PetError('이 가구는 해당 공간에 배치할 수 없어요.');
      const rotation=action.rotation ?? item.rotation ?? 0;
      if(![0,90,180,270].includes(rotation))throw new PetError('가구 방향을 확인해 주세요.');
      if(!placementAllowed(home.items,item,action.space,{x:action.x,y:action.y},rotation))throw new PetError('다른 가구와 겹치거나 바닥을 벗어나는 자리예요. 초록색 자리를 골라 주세요.');
      Object.assign(item,{space:action.space,x:action.x,y:action.y,rotation});syncTabletopItems(home.items);
      break;
    }
    case 'store': {
      const item = home.items.find(item=>item.id === action.item);
      if (!item) throw new PetError('가구를 찾을 수 없어요.');
      item.space = null;delete item.parentId;delete item.slot;syncTabletopItems(home.items);
      break;
    }
    default: throw new PetError('할 수 없는 동작이에요.');
  }
  syncTabletopItems(home.items);home.version++;
  return home;
}

// Keep ownership and currency; retire only placements invalid in the remodel.
export function remodelPetHome(current){
 if(current.layoutVersion>=1)return current;
 const home=JSON.parse(JSON.stringify(current)),placed=[];let stored=0;
 for(const item of home.items){if(!item.space||item.parentId)continue;if(!usableInSpace(item.product,item.space)||!placementAllowed(placed,item,item.space,item,item.rotation||0)){item.space=null;delete item.parentId;delete item.slot;stored++;}else placed.push(item);}
 syncTabletopItems(home.items);home.layoutVersion=1;home.version++;home.remodel={version:1,stored};return home;
}
