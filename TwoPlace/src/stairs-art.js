import {project,fromWorld,GRID_SIZE} from '../shared/pet-space.js';
export const STAIR_FOOTPRINT={column:17,row:0,columns:2,rows:5};
const point=(c,r,z=0)=>{const p=project(fromWorld(c/GRID_SIZE,r/GRID_SIZE));return {x:p.x,y:p.y-z};};
const xy=p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`;
const polygon=(points,fill,stroke='#b78e65',width=.13)=>`<polygon points="${points.map(xy).join(' ')}" fill="${fill}" stroke="${stroke}" stroke-width="${width}" stroke-linejoin="round"/>`;
function railPost(c,r,z){const a=point(c,r,z),b=point(c,r,z+4.2);return `<path d="M${xy(a)} ${xy(b)}" stroke="#ac8a69" stroke-width=".65" stroke-linecap="round"/><path d="M${a.x-.12} ${a.y-.2} ${b.x-.12} ${b.y}" stroke="#fff2db" stroke-width=".32" stroke-linecap="round"/><circle cx="${b.x}" cy="${b.y}" r=".4" fill="#d6ad78" stroke="#aa8256" stroke-width=".12"/><circle cx="${b.x-.1}" cy="${b.y-.1}" r=".13" fill="#fff2d3"/>`;}
export function staircaseArt(){
 const {column:c,row:r,columns:w,rows:d}=STAIR_FOOTPRINT,rise=1.7;
 let svg=`<g class="review-stairs"><defs><linearGradient id="stair-tread" x2="0" y2="1"><stop stop-color="#f4dbb8"/><stop offset="1" stop-color="#d9ad7b"/></linearGradient><linearGradient id="stair-riser" x2="1" y2="0"><stop stop-color="#c49a70"/><stop offset="1" stop-color="#e6c49a"/></linearGradient></defs>`;
 svg+=polygon([point(c-.1,d+.2),point(c+w+.15,d+.2),point(c+w+.15,r),point(c-.1,r)],'#91725022','none');
 // An opening on the existing right wall, aligned with the top landing.
 const landing=point(c,0,d*rise),portalWidth=w*44/GRID_SIZE;
 svg+=`<g transform="matrix(1 .5 0 1 ${landing.x} ${landing.y-10.5})"><rect x="-.3" y="-.3" width="${portalWidth+.6}" height="10.8" rx=".4" fill="#c7a981"/><rect width="${portalWidth}" height="10.5" rx=".3" fill="#a9b8aa"/><path d="M.4 4h${portalWidth-.8}M.4 7h${portalWidth-.8}" stroke="#cdd8c8" stroke-width=".2"/><rect x=".5" y=".8" width="${portalWidth-1}" height="2.3" rx=".4" fill="#fff0d8"/><text x="${portalWidth/2}" y="2.45" text-anchor="middle" font-size="1.35" fill="#8b6c50">2F</text></g>`;
 const side=[point(c+w,d,0),point(c+w,0,0),point(c+w,0,d*rise),point(c+w,d,rise)];
 svg+=polygon(side,'#c29e79','#aa825d',.2);
 svg+=`<path d="M${xy(point(c+w,d,.35))} ${xy(point(c+w,.25,d*rise-.9))}" stroke="#f7e5ca" stroke-width=".6"/>`;
 for(let i=d-1;i>=0;i--){
  const row=d-1-i,z=(i+1)*rise,below=i*rise;
  svg+=polygon([point(c,row+1,z),point(c+w,row+1,z),point(c+w,row+1,below),point(c,row+1,below)],'url(#stair-riser)');
  svg+=polygon([point(c,row,z),point(c+w,row,z),point(c+w,row+1,z),point(c,row+1,z)],'url(#stair-tread)','#bc9066',.13);
  svg+=`<path d="M${xy(point(c,row+1,z-.05))} ${xy(point(c+w,row+1,z-.05))}" stroke="#fff3d8" stroke-width=".23" stroke-linecap="round"/>`;
  for(const t of [.28,.6])svg+=`<path d="M${xy(point(c+.18,row+t,z+.015))} Q${xy(point(c+1.5,row+t+.035,z+.015))} ${xy(point(c+w-.18,row+t,z+.015))}" fill="none" stroke="#b98d5e" stroke-opacity=".35" stroke-width=".045"/>`;
  svg+=`<circle cx="${point(c+w-.22,row+1,z-.6).x}" cy="${point(c+w-.22,row+1,z-.6).y}" r=".07" fill="#a77e55"/>`;
 }
 // Rounded, cream balusters and continuous oak handrails.
 for(const row of [0,2,d])svg+=railPost(c+w+.1,row,row===d?0:(d-row)*rise);
 const start=point(c+w+.1,d,4.2),end=point(c+w+.1,0,d*rise+4.2);
 svg+=`<path d="M${xy(start)} ${xy(end)}" stroke="#a77f57" stroke-width="1" stroke-linecap="round"/><path d="M${start.x-.12} ${start.y-.12} ${end.x-.12} ${end.y-.12}" stroke="#edd0a9" stroke-width=".6" stroke-linecap="round"/>`;
 svg+=railPost(c-.08,d,0)+railPost(c-.08,0,d*rise);
 const a=point(c-.08,d,4.2),b=point(c-.08,0,d*rise+4.2);
 svg+=`<path d="M${xy(a)} ${xy(b)}" stroke="#b38c65" stroke-width=".75" stroke-linecap="round"/><path d="M${a.x-.1} ${a.y-.1} ${b.x-.1} ${b.y-.1}" stroke="#f5dfbd" stroke-width=".35" stroke-linecap="round"/>`;
 return svg+'</g>';
}
export function stairwellArt(){
 const {column:c,row:r,columns:w,rows:d}=STAIR_FOOTPRINT;let svg='<g class="review-stairwell">';
 svg+=polygon([point(c,r),point(c+w,r),point(c+w,r+d),point(c,r+d)],'#7e7568','#b59470',.4);
 for(let i=d-1;i>=0;i--){const depth=.8+i*.45;svg+=polygon([point(c+.15,r+i, -depth),point(c+w-.15,r+i,-depth),point(c+w-.15,r+i+.7,-depth),point(c+.15,r+i+.7,-depth)],i>4?'#a89278':'#cfb18a','#a68a69',.12);}
 for(const row of [r,r+2,r+4,r+d])svg+=railPost(c,row,0);
 const a=point(c,r,4.2),b=point(c,r+d,4.2);svg+=`<path d="M${xy(a)} ${xy(b)}" stroke="#a9835e" stroke-width=".8" stroke-linecap="round"/><path d="M${xy(point(c+w,r))} ${xy(point(c+w,r,4))} ${xy(point(c,r,4))}" stroke="#ead5b6" stroke-width=".8" fill="none"/>`;
 return svg+'</g>';
}
export function centeredRoomDoors(floor){
 const doors=floor===1?[['화장실','#b9cbb9','#e2eadb'],['샤워실','#aec7d4','#d8e8ed']]:[['모모네방','#e7bdb5','#f3d7cd'],['쿠키네방','#b9aec9','#d6cfe1']];
 return doors.map(([label,color,panel],index)=>{
  // Move both doors toward the inner corner along their existing wall axes.
  const x=index?61.5:31.5,y=index?30.75:34.25,slope=index?.5:-.5;
  return `<g class="centered-room-door" transform="matrix(1 ${slope} 0 1 ${x} ${y})"><rect x="-.6" y="-.6" width="8.2" height="17.6" rx=".5" fill="#bca58d"/><rect width="7" height="17" rx=".4" fill="${color}"/><rect x="1" y="2" width="5" height="7" rx=".55" fill="${panel}"/><path d="M1 11h5v4H1Z" fill="none" stroke="#9c9383" stroke-opacity=".5" stroke-width=".3"/><circle cx="5.7" cy="10" r=".4" fill="#a58961"/><rect x="-.5" y="-4.5" width="8" height="2.8" rx=".5" fill="#fff2dd"/><text x="3.5" y="-2.5" text-anchor="middle" font-size="1.65" fill="#827263">${label}</text></g>`;
 }).join('');
}
