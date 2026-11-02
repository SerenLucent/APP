export const WALL_ROOMS=['momoRoom','kukiRoom'];
export const WALL_PRODUCTS=[
{id:'wallpaperCream',name:'크림 린넨 벽지',price:35,color:'#f5e8d3',pattern:'linen'},
{id:'wallpaperRose',name:'로즈 밀크 벽지',price:40,color:'#f2d9df',pattern:'stripe'},
{id:'wallpaperLilac',name:'라벤더 벽지',price:40,color:'#e3ddf1',pattern:'stripe'},
{id:'wallpaperMint',name:'민트 리넨 벽지',price:40,color:'#dce9df',pattern:'linen'},
{id:'wallFrame',name:'빈 원목 액자',price:30,art:'frame'},
{id:'wallClock',name:'동그란 벽시계',price:55,art:'clock'},
{id:'wallShelf',name:'작은 벽걸이 선반',price:65,art:'shelf'},
{id:'wallStar',name:'별빛 벽걸이',price:45,art:'star'}
].map(p=>({...p,type:'wall',surface:p.color?'wallpaper':'wall',spaces:WALL_ROOMS,description:p.color?'좌우 벽면에 따로 적용하는 벽지':'방의 벽 전용 칸에 거는 장식'}));
export function wallProduct(id){return WALL_PRODUCTS.find(p=>p.id===id);}
export function isWallProduct(id){return !!wallProduct(id);}
export function wallSlotAllowed(items,item,space,side,col,row){
 const product=wallProduct(item?.product);if(!product||!WALL_ROOMS.includes(space)||!['left','right'].includes(side))return false;
 if(product.surface==='wallpaper')return true;
 if(!Number.isInteger(col)||!Number.isInteger(row)||col<0||col>3||row<0||row>2)return false;
 // Preserve the built-in window on the left and the exit door on the right.
 if(side==='left'&&col<3||side==='right'&&col<2)return false;
 return !items.some(i=>i.id!==item.id&&i.space===space&&wallProduct(i.product)?.surface==='wall'&&i.wallSide===side&&i.wallCol===col&&i.wallRow===row);
}
export function applyWallPlacement(home,item,space,side,col=0,row=0){
 if(!wallSlotAllowed(home.items,item,space,side,col,row))throw Object.assign(new Error('창문·문 또는 다른 장식과 겹치지 않는 벽 칸을 골라 주세요.'),{status:400});
 if(wallProduct(item.product).surface==='wallpaper')for(const other of home.items)if(other.id!==item.id&&other.space===space&&other.wallSide===side&&wallProduct(other.product)?.surface==='wallpaper'){other.space=null;delete other.wallSide;delete other.wallCol;delete other.wallRow;}
 Object.assign(item,{space,wallSide:side,wallCol:col,wallRow:row,rotation:0});
}
