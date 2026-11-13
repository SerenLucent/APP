export const WEAPON_DURABILITY=10;
export function weaponMultiplier(pet){return pet.weaponDurability>0?1.5:1;}
export function rollWeaponDrop(owner,x,y,random=Math.random){return random()<.02?{owner,x,y,life:45}:null;}
export function collectWeapon(pet,drop,character){if(drop.owner!==character)return false;pet.weaponDurability=WEAPON_DURABILITY;return true;}
export function wearWeapon(pet,hit){if(hit&&pet.weaponDurability>0)pet.weaponDurability--;}
export function weaponDirection(x,y){const angle=Math.atan2(y,x),index=(Math.round(angle/(Math.PI/4))+8)%8;return ['right','downRight','down','downLeft','left','upLeft','up','upRight'][index];}
