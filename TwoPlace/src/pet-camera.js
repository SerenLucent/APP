import {GRID_SIZE} from '../shared/pet-space.js';
const cameras=new Map();
export function mountPetCamera(viewport,space,signal){
  const world=viewport.querySelector('.pet-world'),points=new Map();
  const width=GRID_SIZE*(1000/12),height=width;
  world.style.width=width+'px';world.style.height=height+'px';
  const fit=Math.min(1,viewport.clientWidth/width);
  const initialZoom=Math.max(fit,.65);
  let camera=cameras.get(space)||{zoom:initialZoom,x:0,y:-height*.14*initialZoom};
  let gesture=null,moved=false,suppressUntil=0;
  function paint(){
    camera.zoom=Math.max(fit*.8,Math.min(2,camera.zoom));
    const mx=Math.max(0,(width*camera.zoom-viewport.clientWidth)/2)+70;
    const my=Math.max(0,(height*camera.zoom-viewport.clientHeight)/2)+70;
    camera.x=Math.max(-mx,Math.min(mx,camera.x));camera.y=Math.max(-my,Math.min(my,camera.y));
    world.style.transform=`translate(calc(-50% + ${camera.x}px),calc(-50% + ${camera.y}px)) scale(${camera.zoom})`;
    viewport.querySelector('.camera-level').textContent=`${Math.round(camera.zoom/fit*100)}%`;
    cameras.set(space,camera);
  }
  function start(){
    const p=[...points.values()];
    gesture={x:camera.x,y:camera.y,zoom:camera.zoom,cx:p.reduce((s,q)=>s+q.x,0)/p.length,cy:p.reduce((s,q)=>s+q.y,0)/p.length,d:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0};
  }
  viewport.addEventListener('pointerdown',e=>{
    if(e.target.closest('.camera-controls'))return;
    if(e.pointerType==='mouse'&&e.target.closest('button'))return;
    // Single taps still activate pets and furniture; two fingers always control the camera.
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});moved=false;start();
  },{signal});
  viewport.addEventListener('pointermove',e=>{
    if(!points.has(e.pointerId)||!gesture)return;
    points.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...points.values()];
    const cx=p.reduce((s,q)=>s+q.x,0)/p.length,cy=p.reduce((s,q)=>s+q.y,0)/p.length;
    if(p.length<2&&e.target.closest('button'))return;
    if(Math.hypot(cx-gesture.cx,cy-gesture.cy)>6||p.length>1)moved=true;
    if(!moved)return;
    if(p.length>1&&gesture.d)camera.zoom=gesture.zoom*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/gesture.d;
    camera.x=gesture.x+cx-gesture.cx;camera.y=gesture.y+cy-gesture.cy;
    suppressUntil=performance.now()+400;e.preventDefault();paint();
  },{signal});
  function end(e){points.delete(e.pointerId);if(moved)suppressUntil=performance.now()+400;if(points.size)start();else gesture=null;}
  for(const name of ['pointerup','pointercancel','pointerleave'])viewport.addEventListener(name,end,{signal});
  viewport.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal});
  viewport.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',()=>{
    if(button.dataset.camera==='reset')camera={zoom:fit,x:0,y:0};else camera.zoom*=button.dataset.camera==='in'?1.2:1/1.2;
    paint();
  },{signal}));
  paint();
}
