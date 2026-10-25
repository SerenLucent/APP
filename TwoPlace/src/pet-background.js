// Rasterize the static SVG once per room; panning only composites a bitmap layer.
const backgrounds=new Map();let oak;
function dataURL(blob){return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result);reader.onerror=reject;reader.readAsDataURL(blob);});}
export function mountPetBackground(world,space,signal){
 const svg=world.querySelector('.iso-scenery');if(!svg)return;
 if(!backgrounds.has(space))backgrounds.set(space,(async()=>{
  const clone=svg.cloneNode(true);clone.setAttribute('xmlns','http://www.w3.org/2000/svg');clone.setAttribute('width','1280');clone.setAttribute('height','1280');
  for(const image of clone.querySelectorAll('image')){oak ||= fetch(image.getAttribute('href')).then(r=>{if(!r.ok)throw Error('texture');return r.blob();}).then(dataURL);image.setAttribute('href',await oak);}
  const url=URL.createObjectURL(new Blob([new XMLSerializer().serializeToString(clone)],{type:'image/svg+xml'}));
  try{const image=new Image();image.src=url;await image.decode();const canvas=document.createElement('canvas');canvas.width=canvas.height=1280;canvas.getContext('2d').drawImage(image,0,0);const blob=await new Promise(resolve=>canvas.toBlob(resolve,'image/png'));if(!blob)throw Error('background');return URL.createObjectURL(blob);}finally{URL.revokeObjectURL(url);}
 })().catch(error=>{backgrounds.delete(space);oak=null;return null;}));
 backgrounds.get(space).then(url=>{if(!url||signal.aborted||!svg.isConnected)return;const image=new Image();image.className='iso-scenery scenery-bitmap';image.alt='';image.draggable=false;image.src=url;svg.replaceWith(image);});
}
