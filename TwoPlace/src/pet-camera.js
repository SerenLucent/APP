import {GRID_SIZE} from '../shared/pet-space.js';
const cameras=new Map();
export function mountPetCamera(viewport,space,signal){
 const world=viewport.querySelector('.pet-world'),points=new Map(),width=GRID_SIZE*(1000/12),height=width;
 world.style.width=width+'px';world.style.height=height+'px';
 let base=viewport.clientWidth/width*2.2;
 let camera=cameras.get(space)||{level:1,x:0,y:-height*.14*base},gesture=null,suppressUntil=0,frame=0;
 function paint(){frame=0;base=viewport.clientWidth/width*2.2;camera.level=Math.max(.5,Math.min(2,camera.level));const zoom=base*camera.level;
 const mx=Math.max(0,(width*zoom-viewport.clientWidth)/2)+70,my=Math.max(0,(height*zoom-viewport.clientHeight)/2)+70;
 camera.x=Math.max(-mx,Math.min(mx,camera.x));camera.y=Math.max(-my,Math.min(my,camera.y));
 world.style.transform=`translate3d(calc(-50% + ${camera.x}px),calc(-50% + ${camera.y}px),0) scale(${zoom})`;
 viewport.parentElement.querySelector('.camera-level').textContent=`${Math.round(camera.level*100)}%`;cameras.set(space,camera);}
 function schedule(){if(!frame)frame=requestAnimationFrame(paint);}
 function start(){const p=[...points.values()];gesture={x:camera.x,y:camera.y,level:camera.level,cx:p.reduce((s,q)=>s+q.x,0)/p.length,cy:p.reduce((s,q)=>s+q.y,0)/p.length,d:p.length>1?Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y):0,moved:false};}
 viewport.addEventListener('pointerdown',e=>{if(e.target.closest('[data-draft],.furniture-actions,.placement-hint')||world.dataset.draggingFurniture)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});start();},{signal});
 viewport.addEventListener('pointermove',e=>{if(!points.has(e.pointerId)||!gesture)return;points.set(e.pointerId,{x:e.clientX,y:e.clientY});const p=[...points.values()],cx=p.reduce((s,q)=>s+q.x,0)/p.length,cy=p.reduce((s,q)=>s+q.y,0)/p.length;if(Math.hypot(cx-gesture.cx,cy-gesture.cy)>6||p.length>1)gesture.moved=true;if(!gesture.moved)return;if(!viewport.hasPointerCapture(e.pointerId))viewport.setPointerCapture(e.pointerId);if(p.length>1&&gesture.d)camera.level=gesture.level*Math.hypot(p[0].x-p[1].x,p[0].y-p[1].y)/gesture.d;camera.x=gesture.x+cx-gesture.cx;camera.y=gesture.y+cy-gesture.cy;suppressUntil=performance.now()+350;e.preventDefault();schedule();},{signal});
 function end(e){if(gesture?.moved)suppressUntil=performance.now()+350;points.delete(e.pointerId);if(points.size)start();else gesture=null;}
 for(const name of ['pointerup','pointercancel'])viewport.addEventListener(name,end,{signal});
 viewport.addEventListener('click',e=>{if(performance.now()<suppressUntil){e.preventDefault();e.stopImmediatePropagation();}},{capture:true,signal});
 viewport.parentElement.querySelectorAll('[data-camera]').forEach(button=>button.addEventListener('click',e=>{e.stopPropagation();if(button.dataset.camera==='reset')camera={level:1,x:0,y:-height*.14*base};else camera.level=Math.round((camera.level+(button.dataset.camera==='in'?.1:-.1))*100)/100;paint();},{signal}));
 const resize=new ResizeObserver(schedule);resize.observe(viewport);signal.addEventListener('abort',()=>{cancelAnimationFrame(frame);resize.disconnect();},{once:true});paint();
}
