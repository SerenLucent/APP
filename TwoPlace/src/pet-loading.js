import {petImage,PET_POSES} from './pet-sprites.js';
import {furnitureSprites} from './furniture-assets.js';
import {furnishingModel} from './furnishing-model.js';
import {furnishingImage} from './furniture-rasterizer.js';
import {isoScenery,furnitureForeground} from './pet-art.js';
import {preparePetBackground} from './pet-background.js';
import {preparePetScenes} from './pet-render-preload.js';
const petAssetPromises=new Map();
function decodeAsset(url){
 if(!petAssetPromises.has(url))petAssetPromises.set(url,new Promise((resolve,reject)=>{
  const image=new Image(),timer=setTimeout(()=>reject(Error('방 이미지 준비가 지연되고 있어요. 다시 시도해 주세요.')),25000);
  const done=(callback,value)=>{clearTimeout(timer);callback(value);};
  image.onload=()=>{Promise.resolve(image.decode?image.decode():undefined).then(()=>done(resolve),error=>done(reject,error));};image.onerror=()=>done(reject,Error('방 이미지를 불러오지 못했어요. 다시 시도해 주세요.'));image.src=url;
 }).catch(error=>{petAssetPromises.delete(url);throw error;}));
 return petAssetPromises.get(url);
}
export function warmPetCharacters(){
 const base=import.meta.env?.BASE_URL||'/',urls=new Set(['mochi','kuki'].flatMap(id=>PET_POSES.map(pose=>petImage(id,pose))));
 for(const file of ['furniture-poses-v1.png','interaction-poses-v1.png'])urls.add(base+'pets/'+file);
 return Promise.all([...urls].map(decodeAsset));
}
export async function warmPetAssets(home,{catalog=[],isCurrent=()=>true,onProgress=()=>{}}={}){
 const base=import.meta.env?.BASE_URL||'/';
 const assets=warmPetCharacters();
 const houseReady=catalog.some(p=>p.id==='bathStool'),spaces=houseReady?['yard','home','upperFloor','momoRoom','kukiRoom','toilet','shower']:['yard','home','momoRoom','kukiRoom'];
 const render=preparePetScenes(home,{spaces,backgroundConcurrency:2,isCurrent,onProgress,yieldControl:()=>new Promise(resolve=>setTimeout(resolve,0)),
  async prepareFurniture({product,rotation}){
   const model=furnishingModel(product,rotation);if(!model){const sprite=furnitureSprites[product];if(sprite?.url)await decodeAsset(base+sprite.url);return;}
   const images=[furnishingImage(model)];furnitureForeground(product,rotation);if(model.foregroundImage)images.push(model.foregroundImage);
   await Promise.all(images.map(decodeAsset));
  },prepareBackground:space=>preparePetBackground(space,isoScenery(space,home.items,{legacyHouse:!houseReady}))});
 await Promise.all([assets,render]);
}
export function contentLoadingMarkup(message,pets=false){
 return `<section class="content-loading" role="status" aria-live="polite">${pets?`<div class="content-loading-pets"><img src="${petImage('mochi')}" alt="모모"><img src="${petImage('kuki')}" alt="쿠키"></div>`:''}<strong>${message}</strong><p>잠시만 기다려 주세요.</p></section>`;
}
