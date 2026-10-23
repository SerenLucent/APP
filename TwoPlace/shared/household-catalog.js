// Dimensions are floor cells, before 90-degree rotation. No render-time guesses.
const householdIndoor=['home','momoRoom','kukiRoom'],householdBedrooms=['momoRoom','kukiRoom'];
const householdEntries=[
 ['armchair','폭신한 독서 의자',65,[2,2],householdIndoor,'rest'],['ottoman','동글 패브릭 풋스툴',35,[1,1],householdIndoor,'rest'],
 ['diningchair','원목 식탁 의자',35,[1,1],['home'],'rest'],['diningtable','둘이 쓰는 식탁',90,[3,2],['home'],'tea'],
 ['coffeeTable','서랍 소파 테이블',60,[2,1],['home'],'tidy'],['tvstand','라탄 거실장',80,[3,1],['home'],'tidy'],
 ['television','아날로그 TV 세트',100,[2,1],['home'],'watch'],['recordplayer','턴테이블 수납장',85,[2,1],householdIndoor,'watch'],
 ['coffeestation','홈카페 커피장',80,[2,1],['home'],'tea'],['fridge','크림색 냉장고',100,[2,2],['home'],'tidy'],
 ['kitchencounter','원목 조리대',70,[2,1],['home'],'tidy'],['stove','오븐 가스레인지',95,[2,2],['home'],'watch'],
 ['sinkunit','접시 있는 싱크대',90,[2,1],['home'],'tidy'],['dishrack','그릇 수납 선반',55,[2,1],['home'],'tidy'],
 ['pantry','유리문 식료품장',85,[2,1],['home'],'tidy'],['shoeCabinet','현관 신발장',60,[2,1],['home'],'tidy'],
 ['coatRack','우드 코트 행거',45,[1,1],householdIndoor,'dress'],['laundryBasket','담요 빨래 바구니',35,[1,1],householdIndoor,'tidy'],
 ['washingMachine','드럼 세탁기',95,[2,2],['home'],'watch'],['towelCabinet','수건 정리장',60,[2,1],householdIndoor,'tidy'],
 ['vanity','거울 화장대',85,[2,1],householdBedrooms,'dress'],['mirrorStand','둥근 전신 거울',55,[1,1],householdBedrooms,'dress'],
 ['bookCart','책과 머그 트롤리',45,[1,1],householdIndoor,'read'],['sewingDesk','재봉 작업대',90,[2,2],householdBedrooms,'study'],
 ['catTower','친구들의 놀이 타워',80,[2,2],householdIndoor,'play'],['wateringCan','물뿌리개와 화분',30,[1,1],['yard'],'water'],
 ['birdbath','정원 물 받침',55,[1,1],['yard'],'watch'],['greenhouse','작은 온실 선반',100,[3,2],['yard'],'water'],
 ['barbecue','바비큐 그릴',85,[2,2],['yard'],'watch'],['picnicTable','정원 피크닉 테이블',95,[3,3],['yard'],'tea'],
 ['pottedTree','레몬 나무 화분',70,[2,2],['yard','home'],'water'],['flowerCart','꽃 수레',75,[2,2],['yard'],'water']
];
export const HOUSEHOLD_PRODUCTS=householdEntries.map(([id,name,price,footprint,spaces,action])=>({id,name,price,footprint,spaces,action,type:'furniture',symbol:'⌂',description:'네 방향으로 배치하는 우리 집 세간살이'}));
export const TABLETOP_PRODUCTS=[
 ['mealPlate','따뜻한 한 끼',20],['toastPlate','토스트 브런치',15],['fruitPlate','과일 접시',15],['cakePlate','딸기 케이크',25],['teaSet','둘의 찻잔',20],['soupBowl','따뜻한 수프',15]
].map(([id,name,price])=>({id,name,price,type:'furniture',symbol:'◡',surface:'dining',footprint:[.65,.65],spaces:['home','yard'],description:'식탁 상판에만 올리는 음식 장식'}));
export function isTabletop(product){return TABLETOP_PRODUCTS.some(p=>p.id===product);}
