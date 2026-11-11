import {petImage,PET_POSES} from './pet-sprites.js';
import {furnitureSprites} from './furniture-assets.js';
const petAssetPromises=new Map();
export async function warmPetAssets(home){
 const urls=new Set(['mochi','kuki'].flatMap(id=>PET_POSES.map(pose=>petImage(id,pose))));
 for(const item of home.items||[]){const sprite=furnitureSprites[item.product];if(sprite?.url)urls.add((import.meta.env.BASE_URL||'/')+sprite.url);}
 await Promise.all([...urls].map(url=>{
  if(!petAssetPromises.has(url))petAssetPromises.set(url,new Promise((resolve,reject)=>{const image=new Image();image.onload=()=>{if(image.decode)image.decode().then(resolve,reject);else resolve();};image.onerror=()=>reject(Error('방 이미지를 불러오지 못했어요. 다시 시도해 주세요.'));image.src=url;}).catch(error=>{petAssetPromises.delete(url);throw error;}));
  return petAssetPromises.get(url);
 }));
}
export function contentLoadingMarkup(message,pets=false){
 return `<section class="content-loading" role="status" aria-live="polite">${pets?`<div class="content-loading-pets"><img src="${petImage('mochi')}" alt="모모"><img src="${petImage('kuki')}" alt="쿠키"></div>`:''}<strong>${message}</strong><p>잠시만 기다려 주세요.</p></section>`;
}
