import {floorProduct} from '../shared/floor-designs.js';
// All texture coordinates are on the floor plane. The same 2:1 projection
// as the placement grid is applied once, never baked into a skewed bitmap.
export function floorPattern(product,id,projected=true){
 const p=floorProduct(product);if(!p)return '';
 const b=p.base,a=p.accent,l=p.light;
 let w=8.8,h=8.8,art='';
 if(p.pattern==='plank'||p.pattern==='brick'){
  const wood=p.pattern==='plank';h=4.4;
  art=`<rect width="8.8" height="4.4" fill="${b}"/><path d="M0 0h8.8M0 2.2h8.8M0 4.4h8.8M2.2 0v2.2M6.6 2.2v2.2" stroke="${a}" stroke-width="${wood?'.065':'.16'}"/><path d="M0 .13h8.8M0 2.33h8.8" stroke="${l}" stroke-width=".09"/>`;
  if(wood)art+=`<g fill="none" stroke="${a}" stroke-width=".035" opacity=".58"><path d="M.3 .6q2 .25 4.5 0t3.5 .1M.1 1.5q2-.3 4.4 0t4-.1M.4 2.9q3 .3 6 .05t2 0M.2 3.8q2-.2 4.5 0t3.8-.1"/><ellipse cx="5.8" cy="1.1" rx=".7" ry=".22"/><ellipse cx="5.8" cy="1.1" rx=".32" ry=".09"/></g>`;
  else art+=`<path d="M.3 .4h1.3M3 .6h4M.5 2.7h4.2M7.1 3h1" stroke="${l}" stroke-width=".08" opacity=".7"/>`;
 }else if(p.pattern==='herringbone'){
  w=h=8.8;art=`<rect width="8.8" height="8.8" fill="${a}"/>`;
  for(let x=-4;x<9;x++)for(let y=-4;y<9;y++)if((x-y)%4===0){art+=`<rect x="${x*2.2}" y="${y*2.2}" width="4.4" height="2.2" fill="${b}" stroke="${a}" stroke-width=".075"/><path d="M${x*2.2+.2} ${y*2.2+.7}h4" stroke="${l}" stroke-width=".05"/><rect x="${(x+2)*2.2}" y="${(y-1)*2.2}" width="2.2" height="4.4" fill="${l}" stroke="${a}" stroke-width=".075"/><path d="M${(x+2)*2.2+.7} ${(y-1)*2.2+.2}v4" stroke="${b}" stroke-width=".05"/>`;}
 }else if(p.pattern==='tile'){
  w=h=4.4;art=`<rect width="4.4" height="4.4" fill="${b}"/><path d="M0 0h2.2v2.2H0ZM2.2 2.2h2.2v2.2H2.2Z" fill="${l}"/><path d="M0 0h4.4v4.4H0ZM2.2 0v4.4M0 2.2h4.4" fill="none" stroke="${a}" stroke-width=".055"/>`;
 }else if(p.pattern==='octagon'){
  w=h=4.4;art=`<rect width="4.4" height="4.4" fill="${l}"/><path d="M.85 .04h2.7l.81 .81v2.7l-.81 .81H.85l-.81-.81V.85Z" fill="${b}" stroke="${a}" stroke-width=".055"/><path d="M1 .18h2.4" stroke="#fff8ed" stroke-width=".07"/>`;
 }else if(p.pattern==='flower'){
  w=h=4.4;art=`<rect width="4.4" height="4.4" fill="${b}"/><path d="M0 0h4.4v4.4H0Z" fill="none" stroke="${a}" stroke-width=".055"/><g transform="translate(2.2 2.2)" fill="${a}">`;
  for(let n=0;n<4;n++)art+=`<path transform="rotate(${n*90})" d="M0-.12C-.9-1.2-.55-1.7 0-1.94.55-1.7.9-1.2 0-.12Z"/>`;
  art+=`<circle r=".24" fill="${l}"/></g><path d="M.25 .25h.45M.25 .25v.45M4.15 4.15H3.7M4.15 4.15V3.7" stroke="${l}" stroke-width=".065" fill="none"/>`;
 }else if(p.pattern==='basket'){
  w=h=8.8;art=`<rect width="8.8" height="8.8" fill="${b}"/>`;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)for(let n=0;n<3;n++){
   const horizontal=(x+y)%2===0,px=x*4.4+(horizontal?0:n*4.4/3),py=y*4.4+(horizontal?n*4.4/3:0),bw=horizontal?4.4:4.4/3,bh=horizontal?4.4/3:4.4;
   art+=`<rect x="${px}" y="${py}" width="${bw}" height="${bh}" fill="${n===1?b:l}" stroke="${a}" stroke-width=".06"/><path d="M${px+.2} ${py+.3}${horizontal?'h'+(bw-.4):'v'+(bh-.5)}" stroke="${a}" stroke-width=".035" opacity=".6"/>`;
  }
 }else if(p.pattern==='diamond'){
  w=h=4.4;art=`<rect width="4.4" height="4.4" fill="${b}"/><path d="M0 0h4.4v4.4H0Z" fill="none" stroke="${a}" stroke-width=".07"/><path d="M2.2 .45 3.95 2.2 2.2 3.95 .45 2.2Z" fill="none" stroke="${a}" stroke-width=".085"/><path d="M2.2 1.7 2.7 2.2 2.2 2.7 1.7 2.2Z" fill="${l}"/>`;
 }else if(p.pattern==='terrazzo'){
  art=`<rect width="8.8" height="8.8" fill="${b}"/>`;
  for(let n=0;n<24;n++){const x=(n*3.17)%8.8,y=(n*2.73+.4)%8.8,c=['#d6b4a7','#bbcbb9','#c6bdd1',l,a][n%5];art+=`<path d="m${x} ${y} .3-.12 .16 .28-.35 .2Z" fill="${c}" opacity=".8"/>`;}
 }else if(p.pattern==='grass'){
  art=`<rect width="8.8" height="8.8" fill="${b}"/>`;
  for(let n=0;n<35;n++){const x=(n*3.37)%8.8,y=(n*2.13)%8.8;art+=`<path d="M${x} ${y}l-.12-.26m.12 .26 .18-.2" stroke="${n%3?l:a}" stroke-width=".07" fill="none"/>`;}
 }else{
  art=`<rect width="8.8" height="8.8" fill="${a}"/>`;
  for(let x=0;x<2;x++)for(let y=0;y<2;y++)art+=`<rect x="${x*4.4+.06}" y="${y*4.4+.06}" width="4.28" height="4.28" rx=".13" fill="${(x+y)%2?l:b}"/><path d="m${x*4.4+.6} ${y*4.4+1} 1.4-.2 .8 .2m-1.7 1.8 1.7 .25" stroke="${a}" opacity=".25" stroke-width=".06"/>`;
 }
 return `<pattern id="${id}" width="${w}" height="${h}" patternUnits="userSpaceOnUse"${projected?' patternTransform="matrix(1 .5 -1 .5 50 42)"':''}>${art}</pattern>`;
}
export function floorThumbnail(product){return `<span class="floor-thumbnail" aria-hidden="true"><svg viewBox="0 0 100 72"><defs>${floorPattern(product,'sample-'+product)}</defs><path d="M6 37 50 15 94 37v5L50 64 6 42Z" fill="${floorProduct(product).accent}"/><path d="M6 37 50 15 94 37 50 59Z" fill="url(#sample-${product})" stroke="${floorProduct(product).accent}" stroke-width=".4"/></svg></span>`;}
