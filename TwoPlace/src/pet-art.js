import {furnishingImage} from './furniture-rasterizer.js';
import {furnishingModel} from './furnishing-model.js';
import {bedModel} from './bed-model.js';
import {furnitureSprites} from './furniture-assets.js';
import {project,fromWorld,GRID_SIZE} from '../shared/pet-space.js';
function floorPoint(u,v){const p=project(fromWorld(u,v));return `${p.x},${p.y}`;}
function tiles(space){
  let result='';
  for(let u=0;u<GRID_SIZE;u++)for(let v=0;v<GRID_SIZE;v++){
    const fill=space==='yard' ? ((u+v)%2?'#d7dfb9':'#dce4c1') : space==='terrace' ? ((u+v)%2?'#dec8a5':'#e5d2b4') : 'url(#oak-floor)';
    result+=`<polygon points="${floorPoint(u/GRID_SIZE,v/GRID_SIZE)} ${floorPoint((u+1)/GRID_SIZE,v/GRID_SIZE)} ${floorPoint((u+1)/GRID_SIZE,(v+1)/GRID_SIZE)} ${floorPoint(u/GRID_SIZE,(v+1)/GRID_SIZE)}" fill="${fill}" stroke="${space==='yard'?'#bfc99c':'#cbb38f'}" stroke-width=".11"/>`;
  }
  return result;
}
function windowArt(){return '<g transform="matrix(1 -.5 0 1 12 49)"><rect x="0" y="-12" width="26" height="19" rx="4" fill="#c4ad8b"/><rect x="1.4" y="-10.5" width="23.2" height="16" rx="3" fill="#c5d8ce"/><path d="M13-10.5V5.5M1.5-2.5h23" stroke="#f9edda" stroke-width="1.3"/><path d="M0 7h26v2H0Z" fill="#bda180"/><path d="M2-10v14M24-10v14" stroke="#d9b4a5" stroke-width="3"/></g>';}
function bedroomExit(){
  return '<g transform="matrix(1 .5 0 1 55 27.5)"><rect x="-.6" y="-.6" width="9.2" height="17.6" rx=".5" fill="#b59d80"/><rect width="8" height="17" rx=".4" fill="#b7c7ac"/><rect x="1" y="2" width="6" height="6" rx=".5" fill="#dce6d1"/><path d="M1 11h6v4H1Z" fill="none" stroke="#92a486" stroke-width=".3"/><circle cx="6.6" cy="10" r=".4" fill="#a38b61"/><path d="M-.6 17h9.2" stroke="#f9ecd6" stroke-width=".6"/><rect x="-.3" y="-4.7" width="8.6" height="2.8" rx=".5" fill="#fff3de"/><text x="4" y="-2.7" text-anchor="middle" font-size="1.8" fill="#8b7964">거실로</text></g>';
}
function livingRoom(){
  return `<path d="M5 37 50 14 95 37v2L50 17 5 40Z" fill="#fff4e3"/>
  <path d="M6 38 50 16v26L6 64Z" fill="#e7d8c8" stroke="#d4bea1" stroke-width=".3"/>
  <path d="M50 16 94 38v26L50 42Z" fill="#f3e6d7" stroke="#d9c5ac" stroke-width=".3"/>
  <path d="M6 62 50 40 94 62v2L50 42 6 64Z" fill="#cbb18d"/>
  <g transform="matrix(1 -.5 0 1 41 29.5)">
    <rect x="-.6" y="-.6" width="8.2" height="17.6" rx=".5" fill="#c2a08a"/>
    <rect width="7" height="17" rx=".4" fill="#e7bdb5"/>
    <rect x="1" y="2" width="5" height="7" rx=".5" fill="#f3d7cd"/>
    <path d="M1 11h5v4H1Z" fill="none" stroke="#d0a094" stroke-width=".3"/>
    <circle cx="5.7" cy="10" r=".4" fill="#a58961"/>
    <rect x="-.5" y="-4.5" width="8" height="2.8" rx=".5" fill="#fff2dd"/>
    <text x="3.5" y="-2.5" text-anchor="middle" font-size="1.8" fill="#a17870">모모네방</text>
  </g>
  <g transform="matrix(1 .5 0 1 57.5 28.75)">
    <rect x="-.6" y="-.6" width="8.2" height="17.6" rx=".5" fill="#b2a0ad"/>
    <rect width="7" height="17" rx=".4" fill="#b9aec9"/>
    <rect x="1" y="2" width="5" height="7" rx=".5" fill="#d6cfe1"/>
    <path d="M1 11h5v4H1Z" fill="none" stroke="#9d8eaf" stroke-width=".3"/>
    <circle cx="5.7" cy="10" r=".4" fill="#a58961"/>
    <rect x="-.5" y="-4.5" width="8" height="2.8" rx=".5" fill="#fff2dd"/>
    <text x="3.5" y="-2.5" text-anchor="middle" font-size="1.8" fill="#82708c">쿠키네방</text>
  </g>
  <g class="built-in-kitchen" transform="translate(94 64) scale(${8/GRID_SIZE}) translate(-94 -64)">
    <g transform="matrix(1 .5 0 1 72 29)">
      <rect width="22" height="15" fill="#e4d4ba"/>
      <path d="M0 5h22M0 10h22M5 0v15M11 0v15M17 0v15" stroke="#f8eddb" stroke-width=".35"/>
      <rect y="-4" width="22" height="7" rx=".4" fill="#c3ccaf" stroke="#9eae8d" stroke-width=".3"/>
      <path d="M7.3-4v7M14.6-4v7M6 0v1M13.2 0v1M20.3 0v1" stroke="#8f9f7f" stroke-width=".4"/>
    </g>
    <path d="M88.5 57.75 94 55v9l-5.5 2.75Z" fill="#a2b08d"/>
    <g transform="matrix(1 .5 0 1 66.5 46.75)">
      <rect width="22" height="9" fill="#c4cfb0" stroke="#a0ae89" stroke-width=".3"/>
      <path d="M7.3 0v9M14.6 0v9M1 2h5M8.3 2h5M15.6 2h5" stroke="#94a17f" stroke-width=".35"/>
      <path d="M0 8.5h22" stroke="#9caa84" stroke-width=".8"/>
    </g>
    <g transform="matrix(1 .5 -1 .5 72 44)">
      <rect x="-.4" y="-.4" width="22.8" height="6.3" rx=".4" fill="#fbf0dc" stroke="#c7b597" stroke-width=".35"/>
      <rect x="3" y=".8" width="7.5" height="4" rx=".8" fill="#a5bab5"/>
      <rect x="3.7" y="1.4" width="6.1" height="2.8" rx=".6" fill="#cad8ce"/>
      <rect x="14" y=".5" width="7" height="4.5" rx=".4" fill="#7d8580"/>
      <circle cx="16" cy="2.6" r="1.1" fill="none" stroke="#cbd1c4" stroke-width=".3"/>
      <circle cx="19" cy="2.6" r="1.1" fill="none" stroke="#cbd1c4" stroke-width=".3"/>
    </g>
    <path d="M77.5 46v-3q0-2-1.4-1.3l-.8.4v1.2" fill="none" stroke="#879d97" stroke-width=".7" stroke-linecap="round"/>
  </g>
  `;
}
function walls(space){
  if(space==='home')return livingRoom();
  if(space==='yard'){
    // The house stands outside the floor (v < 0), with its doorway on v = 0.
    let fence='';
    for(let i=0;i<=8;i++){
      const posts=[project(fromWorld(0,i/8))];
      if(i>4)posts.push(project(fromWorld(i/8,0)));
      for(const p of posts)fence+=`<path d="M${p.x-1},${p.y}v-6l1-1 1 1v6Z" fill="#f5edda" stroke="#d2c3a3" stroke-width=".2"/>`;
    }
    return `<g>${fence}<path d="M6 60 50 38M6 62 50 40M77.5 51.75 94 60M77.5 53.75 94 62" fill="none" stroke="#f8efd9" stroke-width=".8"/></g>
      <g class="iso-cottage">
        <path d="M50 42 72 53 91.8 43.1 69.8 32.1Z" fill="#ae9877"/>
        <g transform="matrix(1 -.5 0 1 72 36)">
          <path d="M0 0h19.8v17H0Z" fill="#ddc5a3" stroke="#c4a680" stroke-width=".25"/>
          <path d="M0 5h19.8M0 10h19.8M0 15h19.8" stroke="#d0b58e" stroke-width=".2"/>
          <rect x="6" y="4" width="8" height="7" rx=".5" fill="#fff1d8"/>
          <rect x="6.7" y="4.7" width="6.6" height="5.6" rx=".2" fill="#aacbd0"/>
          <path d="M10 4.7v5.6M6.7 7.5h6.6" stroke="#fff1d8" stroke-width=".45"/>
          <path d="M5.5 11.3h9v.8h-9Z" fill="#b39170"/>
        </g>
        <g transform="matrix(1 .5 0 1 50 25)">
          <path d="M0 0 11-12 22 0v17H0Z" fill="#fae9cc" stroke="#d6bb93" stroke-width=".25"/>
          <path d="M0 5h22M0 10h22M0 15h22" stroke="#ead6b4" stroke-width=".2"/>
          <circle cx="11" cy="-4" r="2" fill="#b9d2ca" stroke="#fff6e4" stroke-width=".6"/>
          <rect x="7.1" y="5" width="7.8" height="12" rx=".7" fill="#c7ac85"/>
          <rect x="7.7" y="5.6" width="6.6" height="11.4" rx=".5" fill="#91ab98"/>
          <rect x="8.6" y="6.8" width="4.8" height="3.8" rx=".5" fill="#d8e6d7"/>
          <path d="M8.7 12h4.6v3.8H8.7Z" fill="none" stroke="#76947e" stroke-width=".25"/>
          <circle cx="13.2" cy="11.6" r=".35" fill="#f9dda1"/>
          <path d="M6.6 17h8.8" stroke="#f6eddc" stroke-width=".6"/>
          <rect x="17" y="5.5" width="1.5" height="2.2" rx=".3" fill="#f6d79d" stroke="#ac8a65" stroke-width=".2"/>
          <rect x="1.6" y="5.6" width="3.5" height="5" rx=".4" fill="#fff1d8"/>
          <rect x="2.1" y="6.1" width="2.5" height="4" fill="#b9d2ca"/>
        </g>
        <path d="M48.8 24.5 61 18.5 80.8 8.6 68.6 14.6Z" fill="#dea48f" stroke="#bd8371" stroke-width=".3"/>
        <path d="M61 18.5 73.2 36.5 93 26.6 80.8 8.6Z" fill="#ca8c7c" stroke="#b7786b" stroke-width=".35"/>
        <path d="M65 24.4 84.8 14.5M69.1 30.4 88.9 20.5" stroke="#b8796b" stroke-width=".45"/>
        <path d="M48.8 24.5 61 18.5 73.2 36.5 93 26.6" fill="none" stroke="#f1c3a8" stroke-width=".8" stroke-linejoin="round"/>
        <path d="M61 18.5 80.8 8.6" stroke="#b9796c" stroke-width=".8" stroke-linecap="round"/>
      </g>`;
  }
  const left=true?'#e7d8c8':'#eee3d1',right=true?'#f3e6d7':'#f6eedf';
  return `<path d="M5 37 50 14 95 37 94 39 50 17 6 39Z" fill="#fdf4e7"/><path d="M6 38 50 16V42L6 64Z" fill="${left}" stroke="#d6c1a7" stroke-width=".35"/>${true ? `<path d="M50 16 94 38V64L50 42Z" fill="${right}" stroke="#decbb2" stroke-width=".35"/>` : `<path d="M50 32 94 54v10L50 42Z" fill="#f3e8d5" opacity=".22"/><path d="M50 42V32M55.5 44.75v-10M61 47.5v-10M66.5 50.25v-10M72 53v-10M77.5 55.75v-10M83 58.5v-10M88.5 61.25v-10M94 64V38" fill="none" stroke="#eee0c7" stroke-width="1.3"/><path d="M50 32 94 54M50 40 94 62" fill="none" stroke="#fcf4e1" stroke-width="1.5"/>`}<path d="M6 61 50 39 94 61v3L50 42 6 64Z" fill="#cbb18d"/>${windowArt()}${bedroomExit()}${true ? '<g transform="matrix(1 .5 0 1 68 30)"><rect width="12" height="12" rx=".6" fill="#bfa381"/><rect x="1" y="1" width="10" height="10" fill="#fbf1de"/><path d="M6 9 3.5 5.8C1.8 3 5 2 6 4c1-2 4.2-1 2.5 1.8Z" fill="#d7aba0"/></g><path d="M9 59 43 43 56 49 22 66Z" fill="#fff0ca" opacity=".3"/>' : '<path d="M49 13 96 36v5L49 18Z" fill="#d6aa92"/><path d="M50 14 94 36v2L50 16Z" fill="#f5ddbc"/><g transform="matrix(1 .5 0 1 72 34)"><rect width="13" height="10" rx="1" fill="#d1bda1"/><path d="M6 8V0M6 4C0 4 1-2 6 2M6 2c5-5 8 1 0 3" stroke="#94aa7b" stroke-width="1.4" fill="none"/></g>'}`;
}
export function isoScenery(space){
  return `<svg class="iso-scenery" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true"><defs><pattern id="oak-floor" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .5 -1 .5 50 42)"><image href="${import.meta.env.BASE_URL}furniture/oak-floor-v1.png" width="12" height="12"/></pattern><filter id="iso-shadow"><feGaussianBlur stdDeviation="1.4"/></filter></defs><ellipse cx="50" cy="85" rx="42" ry="6" fill="#92795f" opacity=".13" filter="url(#iso-shadow)"/><path d="M6 64 50 86 94 64v5L50 91 6 69Z" fill="${space==='yard'?'#adba8f':'#bca17c'}"/><path d="M50 86 94 64v5L50 91Z" fill="${space==='yard'?'#99a97f':'#aa8c68'}"/>${tiles(space)}${walls(space)}</svg>`;
}
const shadows='<ellipse cx="51" cy="85" rx="31" ry="8" fill="#80694c" opacity=".13"/>';
const shapes={
  cushion:'<path d="M11 59Q8 52 20 45L45 31q5-3 11 0l27 14q16 9 7 17L59 81q-8 4-17-1Z" fill="#ca9892"/><path d="M11 53Q8 47 20 40L45 26q5-3 11 0l27 14q16 9 7 17L59 75q-8 4-17-1Z" fill="#ecc5bf"/><path d="m23 48 27-14 28 15-27 16Z" fill="#f4d9d2"/><ellipse cx="51" cy="48" rx="4" ry="2.5" fill="#d6a9a2"/>',
  plant:'<path d="M30 61 35 86q16 11 32-1l5-24Z" fill="#c69a7d"/><path d="M51 65v26q13 0 16-6l5-24Z" fill="#b58b70"/><ellipse cx="51" cy="61" rx="21" ry="9" fill="#e0b69a"/><ellipse cx="51" cy="61" rx="16" ry="6" fill="#9f8064"/><path d="M51 63V23" stroke="#91a178" stroke-width="3"/><path d="M51 46Q14 42 30 15q26 0 21 31" fill="#b0c196"/><path d="M51 39Q45 7 72 12q11 23-21 27" fill="#8fa77b"/><path d="M51 57Q36 30 20 43q0 20 31 14" fill="#9bb185"/>',
  table:'<path d="M30 48v34l6 3 3-4V48M66 48v35l6 3 3-4V48" fill="#b18a65"/><path d="M47 52v34l6 4 4-4V52" fill="#c4a17a"/><ellipse cx="51" cy="43" rx="39" ry="21" fill="#b99570"/><path d="M12 37v7q39 35 78 0v-7Z" fill="#c5a17b"/><ellipse cx="51" cy="37" rx="39" ry="21" fill="#e9ceaa"/><ellipse cx="49" cy="35" rx="31" ry="15" fill="none" stroke="#f3dfc0" stroke-width="1.5"/>',
  rug:'<path d="m4 55 46-25 46 25-46 27Z" fill="#b99b6e"/><path d="m4 52 46-25 46 25-46 27Z" fill="#e7cfa3"/><path d="m12 52 38-20 38 20-38 22Z" fill="none" stroke="#c9a773" stroke-width="2"/><path d="m22 52 28-15 28 15-28 16Z" fill="none" stroke="#f5e4c6" stroke-width="2"/>',
  lamp:'<ellipse cx="50" cy="84" rx="22" ry="10" fill="#b79971"/><ellipse cx="50" cy="81" rx="22" ry="9" fill="#d3b78d"/><path d="M48 80V31h4v49Z" fill="#bc9b71"/><path d="m28 12-9 27q31 18 62 0l-9-27Z" fill="#ead09a"/><path d="M50 13v38q19 0 31-12l-9-27Z" fill="#d8ba80"/><ellipse cx="50" cy="12" rx="22" ry="10" fill="#fae9bd"/><ellipse cx="50" cy="40" rx="30" ry="10" fill="#f6dfa7"/>',
  fence:'<path d="M17 35v40l7 4 4-3V37l-7-5ZM47 50v40l7 4 4-3V52l-7-5ZM76 35v40l7 4 4-3V37l-7-5Z" fill="#d7c8af"/><path d="M16 34v39l7 4V36l-3-4ZM46 49v39l7 4V51l-3-4ZM75 34v39l7 4V36l-3-4Z" fill="#fff5df"/><path d="m18 46 32 16 31-16v7L50 69 18 53ZM18 61l32 16 31-16v6L50 84 18 67Z" fill="#f0e3ca"/>'
};
Object.assign(shapes,{
  bed:'<path d="M10 39 47 20 91 43v39L54 99 10 76Z" fill="#ba9379"/><path d="M10 28 47 9v29L10 57Z" fill="#d7b392" stroke="#ac846a"/><path d="M15 32 44 17v15L15 47Z" fill="#f2dcc2"/><path d="m12 53 35-18 43 23-35 19Z" fill="#fff5e9"/><path d="m12 58 43 23 35-18v13L55 95 12 72Z" fill="#e8b4c6"/><path d="m30 45 17-9 43 23-17 9Z" fill="#f8d7e1"/><path d="m16 52 13-7 19 10-13 7Z" fill="#fff" stroke="#ead9c5"/><path d="m59 67 14-7 14 8-14 7Z" fill="#f4c7d6"/><path d="M17 74v10M83 80v9" stroke="#a88269" stroke-width="5"/>',
  sofa:'<path d="M9 43 51 21 92 42v29L50 94 9 73Z" fill="#bb8a9f"/><path d="m10 29 41-21 41 21v28L51 78 10 57Z" fill="#e5b4ca"/><path d="m17 48 34-17 34 17-34 19Z" fill="#f4cfdd" stroke="#d5a2b9"/><path d="m51 31 1 35" stroke="#d49db6"/><path d="M9 45 20 51v24L9 69ZM81 50 92 44v26l-11 6Z" fill="#e7b6ce"/><path d="m26 38 10-6 12 7-11 6Z" fill="#fff0c7"/><path d="M20 77v8M80 77v8" stroke="#a88772" stroke-width="4"/>',
  bookshelf:'<path d="M20 16 61 2 84 14v70L43 99 20 87Z" fill="#b69070"/><path d="m25 20 34-12v70L25 90Z" fill="#6e5746"/><path d="M25 42 59 30M25 66 59 54M25 88 59 76" stroke="#dfbf96" stroke-width="4"/><path d="M30 22v17M37 20v16M46 17v16M53 15v16" stroke="#e6a9b5" stroke-width="5"/><path d="M30 47v14M38 44v15M47 41v15M54 38v15" stroke="#a9c7b9" stroke-width="5"/><path d="M30 71v13M39 68v13M48 65v13" stroke="#e9cf8c" stroke-width="6"/>',
  desk:'<path d="M15 48v38M47 65v30M86 46v39" stroke="#ad886b" stroke-width="6"/><path d="m7 43 42-22 46 24-43 23Z" fill="#e2bd91" stroke="#bc9572"/><path d="m12 43 37-19 39 21-36 18Z" fill="#f0d5b3"/><path d="m43 35 15-8 15 8-15 8Z" fill="#c6d9cf"/><path d="M22 33v-8m-5 1 5-8 6 8Z" fill="#f3d793" stroke="#b99b6e"/><path d="m31 49 13-7 14 7-13 7Z" fill="#fff7e9"/><path d="m38 48 9-3" stroke="#aa9c83"/>',
  wardrobe:'<path d="M19 15 59 1 85 15v72L44 100 19 87Z" fill="#b98e71"/><path d="m24 20 35-12v72L24 92Z" fill="#e5c29c" stroke="#a98065"/><path d="M42 14v72" stroke="#b38b6f"/><path d="M36 48v8M47 44v8" stroke="#987456" stroke-width="3"/><path d="m60 9 19 10v62L60 71Z" fill="#cda782"/>',
  nightstand:'<path d="m15 38 35-18 35 18v42L50 98 15 80Z" fill="#bf9778"/><path d="m15 38 35-18 35 18-35 18Z" fill="#ebcaa5"/><path d="M20 48 47 62v20L20 68ZM54 62 80 48v20L54 82Z" fill="#d9b18c"/><circle cx="33" cy="65" r="2" fill="#a57a5b"/><path d="M50 41V20" stroke="#bba47b" stroke-width="3"/><path d="m35 15-5 15q20 13 40 0l-5-15Z" fill="#ffe6ad"/><ellipse cx="50" cy="15" rx="15" ry="6" fill="#fff2cc"/>',
  toybox:'<path d="m15 50 34-17 37 18-35 20Z" fill="#bd9b7c"/><path d="M15 50v25l36 19 35-19V51L51 71Z" fill="#dfbb91"/><path d="M22 60v17M32 65v17M43 71v17M61 68v19M73 61v19" stroke="#c19e7b" stroke-width="2"/><circle cx="36" cy="43" r="13" fill="#eaa6ba"/><path d="m56 49 5-23 17 5-4 25Z" fill="#b1c6d9"/><path d="m27 48 15 7" stroke="#fff0da" stroke-width="3"/><circle cx="64" cy="43" r="3" fill="#fff3c9"/>',
  bowl:'<ellipse cx="50" cy="73" rx="35" ry="17" fill="#c2a9a3"/><path d="M15 57q5 30 35 30t35-30Z" fill="#e9c8d4"/><ellipse cx="50" cy="57" rx="35" ry="17" fill="#fff0e8"/><ellipse cx="50" cy="57" rx="27" ry="11" fill="#a9d9e0"/><path d="M34 56q15-7 29 0" fill="none" stroke="#e5f6f4" stroke-width="2"/>',
  bench:'<path d="M16 53v30M45 69v26M84 52v31" stroke="#8c9a86" stroke-width="5"/><path d="m9 46 44-23 39 21-44 24Z" fill="#dfbf8c" stroke="#b08c64"/><path d="m17 18 37-19 34 18v25L51 62 17 44Z" fill="#d8b384"/><path d="m23 20 31-16 28 14M23 29 54 13l28 14M23 38l31-16 28 14" fill="none" stroke="#f1d6a9" stroke-width="3"/>',
  flowerbed:'<path d="m7 58 42-22 44 23-42 24Z" fill="#9e8468"/><path d="M7 58v14l44 24 42-24V59L51 83Z" fill="#d7b293"/><path d="M23 62V37M48 70V29M73 58V38" stroke="#8ca67e" stroke-width="3"/><g fill="#edb0c8"><circle cx="23" cy="32" r="10"/><circle cx="48" cy="24" r="11"/></g><circle cx="73" cy="33" r="11" fill="#f4da92"/><g fill="#ffe8aa"><circle cx="23" cy="32" r="4"/><circle cx="48" cy="24" r="4"/></g><circle cx="73" cy="33" r="4" fill="#d5ad68"/>',
  pond:'<ellipse cx="50" cy="62" rx="46" ry="27" fill="#c3b59d"/><ellipse cx="50" cy="58" rx="39" ry="21" fill="#a1cdd0"/><ellipse cx="50" cy="58" rx="33" ry="16" fill="#b7dfe0"/><path d="M23 58q17-8 34-1M43 66q14-6 27-3" fill="none" stroke="#e7f7ef" stroke-width="2"/><ellipse cx="62" cy="56" rx="7" ry="3" fill="#e6a484"/><path d="m69 56 5-4v8Z" fill="#e6a484"/><ellipse cx="31" cy="49" rx="9" ry="5" fill="#94b58c"/><g fill="#e3d5bd"><ellipse cx="15" cy="53" rx="8" ry="5"/><ellipse cx="47" cy="35" rx="8" ry="5"/><ellipse cx="79" cy="76" rx="8" ry="5"/></g>',
  lantern:'<ellipse cx="50" cy="87" rx="18" ry="7" fill="#7d9185"/><path d="M50 82V33" stroke="#81958a" stroke-width="5"/><path d="m33 22 17-9 17 9v27l-17 9-17-9Z" fill="#fff0bb" stroke="#91a295" stroke-width="3"/><path d="m27 20 23-15 23 15-23 12Z" fill="#a8baaa"/><path d="M50 32v24" stroke="#91a295" stroke-width="2"/>'
});
export function isoFurniture(product,rotation=0,state='idle'){
 const model=furnishingModel(product,rotation,state);if(model){
  furnishingImage(model);
  return `<span class="furniture-art iso-furniture projected-furniture" data-model="${product}" data-direction="${((rotation/90)%4+4)%4}" aria-hidden="true"><img src="${model.image}" alt="" draggable="false" decoding="async" loading="lazy"/></span>`;
 }
 const sprite=furnitureSprites[product];
 if(sprite){const direction=((rotation/90)%4+4)%4,frame=sprite.frames[direction];
 return `<span class="furniture-art iso-furniture sprite-furniture" data-direction="${direction}" aria-hidden="true"><svg viewBox="${frame.x} ${frame.y} ${frame.w} ${frame.h}" preserveAspectRatio="xMidYMax meet"><image href="${import.meta.env.BASE_URL}${sprite.url}" width="${sprite.width}" height="${sprite.height}"/></svg></span>`;}
 return `<span class="furniture-art iso-furniture" aria-hidden="true"><svg viewBox="0 0 100 100">${shadows}${shapes[product]||shapes.cushion}</svg></span>`;
}


export function furnitureForeground(product,rotation=0){
 const model=furnishingModel(product,rotation);if(!model||!model.faces.some(f=>f.foreground))return '';
 if(!model.foregroundImage)model.foregroundImage=furnishingImage({...model,image:null,faces:model.faces.filter(f=>f.foreground)});
 return '<span class="furniture-art iso-furniture projected-furniture" aria-hidden="true"><img src="'+model.foregroundImage+'" alt="" draggable="false"></span>';
}
