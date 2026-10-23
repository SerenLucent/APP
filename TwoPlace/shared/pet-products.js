import {HOUSEHOLD_PRODUCTS,TABLETOP_PRODUCTS} from './household-catalog.js';
const indoor=['home','momoRoom','kukiRoom'];
const bedrooms=['momoRoom','kukiRoom'];
export const PRODUCT_SPACES={
  snack:['yard',...indoor],cushion:indoor,plant:['yard','terrace',...indoor],table:['home'],rug:indoor,lamp:indoor,
  bed:bedrooms,nightstand:bedrooms,wardrobe:bedrooms,desk:bedrooms,bookshelf:indoor,sofa:['home'],toybox:indoor,
  bowl:['yard',...indoor],bench:['yard'],flowerbed:['yard'],pond:['yard'],lantern:['yard'],fence:['yard','terrace']
};
export const PRODUCT_ACTIONS={bed:'sleep',cushion:'rest',sofa:'rest',bench:'rest',bookshelf:'read',desk:'study',table:'tea',toybox:'play',bowl:'drink',flowerbed:'water',pond:'watch',lamp:'light',lantern:'light',wardrobe:'dress',nightstand:'tidy',plant:'water'};
export function usableInSpace(product,space){return !!PRODUCT_SPACES[product]?.includes(space);}

for(const item of [...HOUSEHOLD_PRODUCTS,...TABLETOP_PRODUCTS]){PRODUCT_SPACES[item.id]=item.spaces;PRODUCT_ACTIONS[item.id]=item.action;}
