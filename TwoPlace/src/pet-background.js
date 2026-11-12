import {createRenderCache} from './pet-render-cache.js';
const textures=new Map();
function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
function texture(url){if(!textures.has(url))textures.set(url,fetch(url,{signal:AbortSignal.timeout(20000)}).then(r=>{if(!r.ok)throw Error('바닥 이미지를 불러오지 못했어요.');return r.blob();}).then(dataURL).catch(e=>{textures.delete(url);throw e;}));return textures.get(url);}
async function decodedImage(url){const image=new Image();image.src=url;await image.decode();return image;}
const backgrounds=createRenderCache({limit:24,dispose:entry=>URL.revokeObjectURL(entry.url),build:async markup=>{
 const holder=document.createElement('div');holder.innerHTML=markup;const svg=holder.querySelector('svg');
 svg.setAttribute('xmlns','http://www.w3.org/2000/svg');svg.setAttribute('width','1280');svg.setAttribute('height','1280');
 await Promise.all([...svg.querySelectorAll('image')].map(async image=>image.setAttribute('href',await texture(image.getAttribute('href')))));
 const source=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(svg)],{type:'image/svg+xml'}));let url;
 try{
  const image=await decodedImage(source),canvas=document.createElement('canvas');canvas.width=canvas.height=1280;
  const context=canvas.getContext('2d');if(!context)throw Error('방 배경을 준비하지 못했어요.');context.drawImage(image,0,0);
  const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('방 배경을 준비하지 못했어요.');
  url=URL.createObjectURL(blob);const decoded=await decodedImage(url);return {url,image:decoded};
 }catch(error){if(url)URL.revokeObjectURL(url);throw error;}finally{URL.revokeObjectURL(source);}
}});
const keyFor=(space,markup)=>space+'\n'+markup;
export function preparePetBackground(space,markup){return backgrounds.prepare(keyFor(space,markup),markup);}
export function petBackgroundMarkup(space,markup){const ready=backgrounds.ready(keyFor(space,markup));return ready?`<img class="iso-scenery scenery-bitmap" src="${ready.url}" alt="" draggable="false" decoding="sync">`:markup;}
export function mountPetBackground(world,space,signal){
 const svg=world.querySelector('svg.iso-scenery');if(!svg)return;
 preparePetBackground(space,svg.outerHTML).then(entry=>{if(signal.aborted||!svg.isConnected)return;const image=entry.image.cloneNode();image.className='iso-scenery scenery-bitmap';image.alt='';image.draggable=false;image.decoding='sync';svg.replaceWith(image);}).catch(()=>{/* Keep the visible SVG if an edited background fails. */});
}
