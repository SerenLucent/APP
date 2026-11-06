import {isFloorProduct} from '../shared/floor-designs.js';
import {wallProduct,isWallProduct} from '../shared/wall-decor.js';
import {isTabletop} from '../shared/household-catalog.js';
import {initialPlacement} from './pet-placement.js';
import {tableSlot} from '../shared/tabletop.js';
export function shopPreview(items,product,space){
 if(!product)return {items};
 const item={id:'shop-preview',product:product.id,space,rotation:0,x:50,y:65};
 if(isFloorProduct(product.id))return {items:[...items.filter(i=>i.space!==space||!isFloorProduct(i.product)),item]};
 if(isWallProduct(product.id)){
  Object.assign(item,{wallSide:'right',wallCol:3,wallRow:0});
  const paper=wallProduct(product.id).surface==='wallpaper';
  return {items:[...items.filter(i=>i.space!==space||i.wallSide!=='right'||(paper?wallProduct(i.product)?.surface!=='wallpaper':!(wallProduct(i.product)?.surface==='wall'&&i.wallCol===3&&i.wallRow===0))),item]};
 }
 if(product.type==='food')return {items,tray:true};
 const position=initialPlacement(items,{...item,space:null},space,0);
 if(isTabletop(product.id)&&!position.parentId)return {items,tray:true,notice:'식탁 위에 배치하는 음식이에요'};
 Object.assign(item,position);
 // A full table can still show its preview by visually replacing one occupied slot.
 const visible=position.parentId?items.filter(i=>!(i.parentId===position.parentId&&i.slot===position.slot)):items;
 if(position.parentId)Object.assign(item,tableSlot(items.find(i=>i.id===position.parentId),position.slot));
 return {items:[...visible,item],item};
}
