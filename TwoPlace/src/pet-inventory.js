import {HOUSEHOLD_PRODUCTS,isTabletop} from '../shared/household-catalog.js';
export const INVENTORY_TABS={all:'전체',furniture:'가구',decoration:'장식',food:'음식',other:'기타'};
const decorations=new Set(['cushion','plant','rug','lamp','flowerbed','pond','lantern','pottedTree','flowerCart','birdbath']);
const other=new Set(['toybox','bowl','catTower','wateringCan','laundryBasket','fence']);
const furniture=new Set(['table','bed','sofa','bookshelf','desk','wardrobe','nightstand','bench',...HOUSEHOLD_PRODUCTS.map(p=>p.id)]);
export function inventoryCategory(product){if(isTabletop(product))return 'food';if(decorations.has(product))return 'decoration';if(other.has(product))return 'other';return furniture.has(product)?'furniture':'other';}
