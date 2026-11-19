import {fortressDamageStage} from './adventure-fortress-damage.js';
import {OFFENSE_BASE,REBUILD_SECONDS} from './adventure-offense.js';
import {drawEnvironmentProp} from './adventure-environment.js';
let atlas,loading,ridge,cannon;
const ruins={};
async function loadRuin(type,file='fortress-'+type+'-destroyed-v2.png'){
 const image=new Image();image.src=import.meta.env.BASE_URL+'adventure/environment/'+file;await image.decode();
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const pixels=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,right=0,top=c.height,bottom=0;
 for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(pixels[(y*c.width+x)*4+3]>180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
 ruins[type]={image,frame:{x:left,y:top,w:right-left+1,h:bottom-top+1}};
}
export function loadFortressArt(){return loading ||= (async()=>{
 const image=new Image();image.src=import.meta.env.BASE_URL+'adventure/environment/fortress-parts-v1.png';
 const cannonImage=new Image();cannonImage.src=import.meta.env.BASE_URL+'adventure/environment/fortress-cannon-8dir-v1.png';
 try{await Promise.all([image.decode(),cannonImage.decode(),loadRuin('gate'),loadRuin('tower'),loadRuin('house'),loadRuin('houseStage2','fortress-house-damaged-stage2-v1.png'),loadRuin('houseStage3','fortress-house-damaged-stage3-v1.png')]);}catch{loading=null;throw Error('요새 그림을 불러오지 못했어요. 다시 시작해 주세요.');}
 const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;
 const bounds=[0,.4,.72,1];const frames=bounds.slice(0,3).map((v,i)=>{let l=c.width,r=0,t=c.height,b=0;for(let y=0;y<c.height;y++)for(let x=Math.ceil(v*c.width);x<Math.floor(bounds[i+1]*c.width);x++)if(data[(y*c.width+x)*4+3]>180){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {x:l,y:t,w:r-l+1,h:b-t+1};});atlas={image,frames};
 const cc=document.createElement('canvas');cc.width=cannonImage.width;cc.height=cannonImage.height;const cx=cc.getContext('2d',{willReadFrequently:true});cx.drawImage(cannonImage,0,0);const pixels=cx.getImageData(0,0,cc.width,cc.height).data;const cw=cc.width/4,ch=cc.height/2;const cannonFrames=Array.from({length:8},(_,i)=>{let l=cc.width,r=0,t=cc.height,b=0;const ox=Math.round(i%4*cw),oy=Math.round(Math.floor(i/4)*ch);for(let y=oy;y<Math.min(cc.height,oy+ch);y++)for(let x=ox;x<Math.min(cc.width,ox+cw);x++)if(pixels[(y*cc.width+x)*4+3]>180){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}return {x:l,y:t,w:r-l+1,h:b-t+1};});cannon={image:cannonImage,frames:cannonFrames};
})();}
function frame(type,direction=0){return type==='tower'?cannon?.frames[direction]:atlas?.frames[type==='house'?0:1];}
export function fortressSpriteSize(type,f,width,reference=f){const height=type==='tower'?width*reference.h/reference.w:width*f.h/f.w;return {width:height*f.w/f.h,height};}
function sprite(ctx,type,x,y,width,direction=0){const f=frame(type,direction);if(!f)return;const size=fortressSpriteSize(type,f,width,frame(type,0));const height=size.height;width=size.width;ctx.save();ctx.translate(x,y);ctx.drawImage(type==='tower'?cannon.image:atlas.image,f.x,f.y,f.w,f.h,-width/2,15-height,width,height);ctx.restore();return height;}
function bar(ctx,x,y,value,color,label){ctx.fillStyle='#263c36';ctx.fillRect(x-43,y,86,7);ctx.fillStyle=color;ctx.fillRect(x-42,y+1,84*value,5);ctx.fillStyle='#fff4dc';ctx.font='bold 10px sans-serif';ctx.textAlign='center';ctx.strokeStyle='#36473d';ctx.lineWidth=3;ctx.strokeText(label,x,y-5);ctx.fillText(label,x,y-5);}
export function drawRebuildClock(ctx,x,y,elapsed){
 const progress=Math.max(0,Math.min(1,elapsed/REBUILD_SECONDS)),remaining=Math.ceil(REBUILD_SECONDS-elapsed);
 ctx.save();ctx.fillStyle='#273c35e6';ctx.strokeStyle='#cbbd94';ctx.lineWidth=1;ctx.beginPath();ctx.roundRect(x-46,y-14,92,28,12);ctx.fill();ctx.stroke();
 const cx=x-29;ctx.lineWidth=2.5;ctx.strokeStyle='#7e8874';ctx.beginPath();ctx.arc(cx,y,8.5,0,Math.PI*2);ctx.stroke();
 ctx.strokeStyle='#f0d694';ctx.beginPath();ctx.arc(cx,y,8.5,-Math.PI/2,-Math.PI/2+progress*Math.PI*2);ctx.stroke();
 ctx.lineWidth=1.4;ctx.strokeStyle='#fff0cd';ctx.beginPath();ctx.moveTo(cx,y-5);ctx.lineTo(cx,y);ctx.lineTo(cx+4,y+2);ctx.stroke();
 ctx.fillStyle='#fff0cd';ctx.font='bold 11px sans-serif';ctx.textAlign='left';ctx.fillText('재건 '+Math.max(0,remaining)+'초',x-14,y+4);ctx.restore();
}
export function drawFortressRidge(ctx){
 if(!ridge){ridge=document.createElement('canvas');ridge.width=2600;ridge.height=OFFENSE_BASE.y;const c=ridge.getContext('2d');c.fillStyle='#a8a0aa';c.fillRect(0,0,2600,OFFENSE_BASE.y-70);
  for(let y=45;y<OFFENSE_BASE.y-60;y+=82)for(let x=-80;x<2700;x+=105)drawEnvironmentProp(c,'rock',{x:x+(Math.floor(y/82)%2)*50,y:y+Math.sin(x*.03)*10},{width:150,height:140,anchor:25});
  const y=OFFENSE_BASE.y-58;for(let x=-80;x<2700;x+=105)drawEnvironmentProp(c,'rock',{x,y:y+Math.sin(x*.03)*10},{width:150,height:140,anchor:25});
 }ctx.drawImage(ridge,0,0);
}
export function drawFortressBody(ctx,progress){const {x,y}=OFFENSE_BASE,stage=fortressDamageStage(progress);if(stage>1){const ruin=ruins[stage===2?'houseStage2':stage===3?'houseStage3':'house'];if(ruin){const f=ruin.frame,width=170,height=width*f.h/f.w;ctx.drawImage(ruin.image,f.x,f.y,f.w,f.h,x-width/2,y+15-height,width,height);}return;}sprite(ctx,'house',x,y,170);}
export function drawFortressPart(ctx,o){if(o.type==='house')return;const width=o.type==='gate'?112:83;
 if(o.hp<=0){const ruin=ruins[o.type];let height=50;if(ruin){const f=ruin.frame,size=fortressSpriteSize(o.type,f,width,frame(o.type,0));height=size.height*(o.type==='tower'?.92:1);ctx.drawImage(ruin.image,f.x,f.y,f.w,f.h,o.x-size.width/2,o.y+15-height,size.width,height);}drawRebuildClock(ctx,o.x,o.y-height-7,o.rebuild||0);return;}
 const height=sprite(ctx,o.type,o.x,o.y,width,o.facing)||100;
 bar(ctx,o.x,o.y-height-2,o.hp/o.max,'#e7b9c3',o.name+' '+Math.ceil(o.hp)+' / '+o.max);
}
export function drawFortressEffects(ctx,offense,time,minY=-Infinity){
 for(const q of offense.projectiles){const u=q.age/q.life,x=q.x+(q.tx-q.x)*u,y=q.y+(q.ty-q.y)*u-Math.sin(u*Math.PI)*65;ctx.fillStyle='#b87a632b';ctx.strokeStyle='#a56953b3';ctx.lineWidth=1.5;ctx.beginPath();ctx.ellipse(q.tx,q.ty,48,20,0,0,Math.PI*2);ctx.fill();ctx.stroke();const shade=ctx.createRadialGradient(x-3,y-4,1,x,y,10);shade.addColorStop(0,'#c4bed0');shade.addColorStop(.4,'#746e85');shade.addColorStop(1,'#3c394c');ctx.fillStyle=shade;ctx.beginPath();ctx.arc(x,y,10,0,Math.PI*2);ctx.fill();}
 if(offense.ready<=0)return;
 for(const o of offense.objects){const width=o.type==='house'?170:o.type==='gate'?112:83,f=frame(o.type,o.facing),height=f?width*f.h/f.w:100,y=Math.max(minY,o.y-height-30+Math.sin(time*5)*3);ctx.fillStyle='#fff0cd';ctx.strokeStyle='#7b5a38';ctx.lineWidth=1.5;ctx.beginPath();ctx.roundRect(o.x-49,y-24,98,22,9);ctx.fill();ctx.stroke();ctx.fillStyle='#513b27';ctx.font='bold 11px sans-serif';ctx.textAlign='center';ctx.fillText('BREAK POINT',o.x,y-9);ctx.fillStyle='#efd16e';ctx.beginPath();ctx.moveTo(o.x-5,y);ctx.lineTo(o.x+5,y);ctx.lineTo(o.x+5,y+10);ctx.lineTo(o.x+12,y+10);ctx.lineTo(o.x,y+22);ctx.lineTo(o.x-12,y+10);ctx.lineTo(o.x-5,y+10);ctx.closePath();ctx.fill();ctx.stroke();}
}
