const rooms=['home','momoRoom','kukiRoom'];
export const FLOOR_PRODUCTS=[
 {id:'floorHoney',name:'허니 오크 마루',price:100,pattern:'plank',base:'#dbb98d',accent:'#bd9265',light:'#efd4ad',spaces:rooms,description:'따뜻한 나뭇결과 엇갈린 이음새의 원목 마루'},
 {id:'floorRosewood',name:'내추럴 월넛 마루',price:120,pattern:'plank',base:'#b99572',accent:'#927153',light:'#d0b18d',spaces:rooms,description:'차분한 호두나무 색과 깊은 나뭇결의 원목 마루'},
 {id:'floorHerringbone',name:'비스킷 헤링본',price:180,pattern:'herringbone',base:'#d6b38c',accent:'#b5906d',light:'#ebd3b4',spaces:rooms,description:'작은 나무 조각을 직각으로 맞물린 헤링본 마루'},
 {id:'floorCreamTile',name:'크림 체크 타일',price:140,pattern:'tile',base:'#f0e7d5',accent:'#dad1be',light:'#fff7e8',spaces:rooms,description:'부드러운 크림색 타일과 가느다란 줄눈'},
 {id:'floorTerrazzo',name:'밀크 테라조',price:200,pattern:'terrazzo',base:'#eee3d7',accent:'#c7b8a5',light:'#fff5e8',spaces:rooms,description:'살구·민트·라벤더 조각이 박힌 작은 돌 바닥'},
 {id:'floorMochaCheck',name:'모카 크림 체크',price:160,pattern:'tile',base:'#bba58e',accent:'#b5a18b',light:'#f5ead8',spaces:rooms,description:'모카와 크림이 번갈아 이어지는 카페 체크 타일'},
 {id:'floorSageCheck',name:'세이지 체크 타일',price:160,pattern:'tile',base:'#b4c0a7',accent:'#a8b39e',light:'#f3ecdc',spaces:rooms,description:'차분한 세이지 그린과 아이보리 체크 타일'},
 {id:'floorOctagon',name:'아이보리 옥타곤',price:220,pattern:'octagon',base:'#f2e9d9',accent:'#c5b69e',light:'#928d7b',spaces:rooms,description:'팔각 타일 사이에 작은 올리브색 포인트가 있는 빈티지 바닥'},
 {id:'floorFlorence',name:'블루밍 포슬린',price:240,pattern:'flower',base:'#f3ecdf',accent:'#b8c7c6',light:'#d8b983',spaces:rooms,description:'도자기빛 꽃무늬와 작은 금빛 중심의 패턴 타일'},
 {id:'floorBasket',name:'오크 바스켓 마루',price:210,pattern:'basket',base:'#cda780',accent:'#ae8863',light:'#e8ccaa',spaces:rooms,description:'세 장씩 가로세로 엮어 짠 고전적인 원목 패턴'},
 {id:'floorDiamond',name:'샌드 다이아몬드',price:190,pattern:'diamond',base:'#eee1cd',accent:'#c9b492',light:'#a48f74',spaces:rooms,description:'샌드색 사각 타일 안에 작은 다이아몬드를 새긴 바닥'},
 {id:'floorMeadow',name:'포근한 잔디밭',price:80,pattern:'grass',base:'#c4d3a0',accent:'#99b279',light:'#dae4b9',spaces:['yard'],description:'짧은 풀잎이 촘촘한 보송보송 잔디 바닥'},
 {id:'floorBrick',name:'살구 벽돌길',price:150,pattern:'brick',base:'#d9ab93',accent:'#af8574',light:'#edc8b0',spaces:['yard'],description:'모서리가 부드러운 벽돌을 엇갈리게 깐 마당'},
 {id:'floorStone',name:'크림 정원 석재',price:170,pattern:'stone',base:'#ded9c7',accent:'#b6b4a1',light:'#f1ead9',spaces:['yard'],description:'자연스러운 돌 표면과 이음새가 있는 정원 바닥'}
].map(p=>({...p,type:'floor',surface:'floor',description:p.description+' · 공간 전체 적용'}));
export const floorProduct=id=>FLOOR_PRODUCTS.find(p=>p.id===id);
export const isFloorProduct=id=>!!floorProduct(id);
export function applyFloorPlacement(home,item,space){
 const p=floorProduct(item?.product);
 if(!p||!p.spaces.includes(space))throw Object.assign(new Error('이 공간에 맞는 바닥을 골라 주세요.'),{status:400});
 for(const other of home.items)if(other.id!==item.id&&other.space===space&&isFloorProduct(other.product))other.space=null;
 Object.assign(item,{space,x:50,y:65,rotation:0});
}
