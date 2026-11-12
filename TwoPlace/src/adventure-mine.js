import {MINE_SECONDS,createMine,createSeededMine,MINE_DAMAGE_PER_SHARD,MINE_BREAK_SHARDS,prepareMineLevel} from '../shared/adventure-mine-field.js';
export {MINE_SECONDS,createMine,createSeededMine,MINE_DAMAGE_PER_SHARD,MINE_BREAK_SHARDS,prepareMineLevel};
const mineArt={};let mineArtReady;
export function loadMineArt(){return mineArtReady||=Promise.all(['entrance','ore','mountain','interior'].map(async id=>{const image=new Image();image.src=import.meta.env.BASE_URL+'adventure/mine/'+id+(['entrance','mountain','interior'].includes(id)?'-v2.png':'-v1.png');try{await image.decode();const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);const pixels=c.getImageData(0,0,canvas.width,canvas.height).data;let left=canvas.width,top=canvas.height,right=0,bottom=0;for(let y=0;y<canvas.height;y++)for(let x=0;x<canvas.width;x++)if(pixels[(y*canvas.width+x)*4+3]>30){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right>left)mineArt[id]={image,x:left,y:top,w:right-left+1,h:bottom-top+1};}catch{}}));}
function drawMineArt(ctx,id,x,y,width,height,anchor){const a=mineArt[id];if(!a)return false;const scale=Math.min(width/a.w,height/a.h),w=a.w*scale,h=a.h*scale;ctx.drawImage(a.image,a.x,a.y,a.w,a.h,x-w/2,y-h+anchor,w,h);return true;}

export const MINE_EXIT={x:1300,y:1660,radius:80};
export const MINE_PORTALS=[{x:1105,y:800,name:'반짝 동굴'},{x:1235,y:800,name:'푸른 동굴'},{x:1365,y:800,name:'깊은 동굴'},{x:1495,y:800,name:'비밀 동굴'}];
export const MINE_HUB_BOUNDS={left:950,right:1650,top:825,bottom:1120};
const hubArt={spacing:130,mountainWidth:560,entranceWidth:107,entranceHeight:114};
export function configureMineHub(viewWidth){Object.assign(MINE_HUB_BOUNDS,{left:Math.max(20,1300-viewWidth/2+54),right:Math.min(2580,1300+viewWidth/2-54)});const gap=Math.min(130,Math.max(64,(viewWidth-60)/4));MINE_PORTALS.forEach((p,i)=>{p.x=1300+(i-1.5)*gap;});Object.assign(hubArt,{spacing:gap,mountainWidth:gap*4+40,entranceWidth:gap*.82,entranceHeight:gap*.88});}


export function scatterMineShards(mine,ore,damage,random=Math.random){
 const cave=mine.caves[mine.room];if(!cave)return;
 if(ore.deposit!==undefined){
  ore.harvest=Math.min(ore.max,ore.harvest+Math.max(0,damage));
  const earned=ore.hp<=0?ore.deposit:Math.floor(ore.harvest/ore.max*Math.max(0,ore.deposit-MINE_BREAK_SHARDS));
  const count=Math.max(0,earned-(ore.emitted||0));ore.emitted=(ore.emitted||0)+count;
  if(ore.hp<=0&&!ore.mineBroken){ore.mineBroken=true;cave.broken++;mine.broken++;}
  for(let i=0;i<count;i++){const angle=random()*Math.PI*2,distance=45+random()*55;cave.drops.push({oreId:ore.id,x:ore.x+Math.cos(angle)*distance,y:ore.y+Math.sin(angle)*distance*.65,age:0,value:1});}
  return;
 }
 ore.harvest+=damage;let count=Math.floor(ore.harvest/MINE_DAMAGE_PER_SHARD);ore.harvest%=MINE_DAMAGE_PER_SHARD;
 if(ore.hp<=0){count+=MINE_BREAK_SHARDS;cave.broken++;mine.broken++;}
 for(let i=0;i<count;i++){const angle=random()*Math.PI*2,distance=45+random()*55;cave.drops.push({oreId:ore.id,x:ore.x+Math.cos(angle)*distance,y:ore.y+Math.sin(angle)*distance*.65,age:0,value:1});}
}
export function stepMine(mine,player,dt,onCollect=()=>{}){
 mine.travelLock=Math.max(0,mine.travelLock-dt);if(mine.finished)return null;
 if(mine.room>=0){const cave=mine.caves[mine.room];for(const d of cave.drops){d.age+=dt;if(d.value&&d.age>.35&&Math.hypot(player.x-d.x,player.y-d.y)<48){mine.collectedByOre[d.oreId]=(mine.collectedByOre[d.oreId]||0)+d.value;mine.total=Math.floor(Object.values(mine.collectedByOre).reduce((a,b)=>a+b,0)*(mine.rewardFactor??1));onCollect(d);d.value=0;}}cave.drops=cave.drops.filter(d=>d.value);if(!mine.travelLock&&Math.hypot(player.x-MINE_EXIT.x,player.y-MINE_EXIT.y)<MINE_EXIT.radius)return -1;}
 else if(!mine.travelLock){const i=MINE_PORTALS.findIndex(p=>Math.hypot(player.x-p.x,player.y-p.y)<62);if(i>=0)return i;}
 return null;
}
function oval(ctx,x,y,rx,ry,color){ctx.fillStyle=color;ctx.beginPath();ctx.ellipse(x,y,rx,ry,0,0,Math.PI*2);ctx.fill();}
function crystal(ctx,x,y,size,color){ctx.fillStyle=color;ctx.strokeStyle='#daf6ff';ctx.lineWidth=1.3;ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x+size*.55,y-size*.4);ctx.lineTo(x+size*.4,y+size*.4);ctx.lineTo(x-size*.45,y+size*.4);ctx.lineTo(x-size*.6,y-size*.3);ctx.closePath();ctx.fill();ctx.stroke();ctx.fillStyle='#ffffff66';ctx.beginPath();ctx.moveTo(x,y-size);ctx.lineTo(x,y+size*.4);ctx.lineTo(x-size*.6,y-size*.3);ctx.fill();}
export function drawMineGround(ctx,mine,time){
 if(mine.room>=0){ctx.fillStyle='#3d465d';ctx.fillRect(0,0,2600,1800);const a=mineArt.interior;if(a)ctx.drawImage(a.image,0,0,2600,1800);}
 for(let i=0;i<170;i++){const x=(i*397)%2600,y=(i*223)%1800;oval(ctx,x,y,12+i%7,4,'#ffffff08');}
 if(mine.room<0){// The ridge is the northern field boundary, extending beyond both side edges.
 ctx.fillStyle='#9691aa';ctx.fillRect(-3000,-1800,8600,2595);
 const mountain=mineArt.mountain;if(mountain){const width=2800,height=width*mountain.h/mountain.w;for(const x of [-1500,1300,4100])ctx.drawImage(mountain.image,mountain.x,mountain.y,mountain.w,mountain.h,x-width/2,826-height,width,height);}
 oval(ctx,1300,818,1600,18,'#344e3c20');ctx.strokeStyle='#d5c9a2';ctx.lineWidth=70;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(1300-hubArt.mountainWidth*.65,925);ctx.lineTo(1300+hubArt.mountainWidth*.65,925);ctx.stroke();}else{ctx.strokeStyle='#67758b';ctx.lineWidth=70;ctx.lineCap='round';ctx.beginPath();ctx.moveTo(180,160);ctx.lineTo(2420,160);ctx.stroke();}
 if(mine.room>=0)drawMineExit(ctx,time);
 const gates=mine.room<0?MINE_PORTALS:[];
 for(const [i,p] of gates.entries()){oval(ctx,p.x,p.y+10,mine.room<0?hubArt.entranceWidth*.4:65,14,'#242e4044');if(!drawMineArt(ctx,'entrance',p.x,p.y,mine.room<0?hubArt.entranceWidth:145,mine.room<0?hubArt.entranceHeight:150,18)){ctx.fillStyle='#777d91';ctx.beginPath();ctx.roundRect(p.x-84,p.y-135,168,150,[80,80,12,12]);ctx.fill();ctx.fillStyle='#172238';ctx.beginPath();ctx.roundRect(p.x-60,p.y-114,120,130,[58,58,7,7]);ctx.fill();crystal(ctx,p.x-65,p.y-25,20,'#a8e0f0');crystal(ctx,p.x+68,p.y-56,26,'#d7b9ec');}ctx.font='bold '+(mine.room<0?12:18)+'px sans-serif';ctx.textAlign='center';ctx.fillStyle='#fff2d4';ctx.fillText(p.name,p.x,p.y-(mine.room<0?hubArt.entranceHeight+2:155));ctx.font='11px sans-serif';ctx.fillText(mine.room<0?'입장':'입구로 이동해서 나가기',p.x,p.y+35);}
}
export function drawMineOre(ctx,o){if(o.hp<=0){oval(ctx,o.x,o.y,24,8,'#252c3944');return;}oval(ctx,o.x,o.y+5,44,15,'#202c424d');if(drawMineArt(ctx,'ore',o.x,o.y,112,105,12)){if(o.flash){ctx.strokeStyle='#fff3d7';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(o.x,o.y,40,13,0,0,Math.PI*2);ctx.stroke();}return;}oval(ctx,o.x,o.y-3,31,18,o.flash?'#fff5d5':'#71788d');for(let i=0;i<4;i++)crystal(ctx,o.x-26+i*17,o.y-11-(i%2)*15,22+(i%3)*9,o.flash?'#ffffff':o.tint>.5?'#a0d8f0':'#c8b6ed');}
export function drawMineDrops(ctx,mine,time,image){if(mine.room<0)return;for(const d of mine.caves[mine.room].drops){const z=d.age<.35?Math.sin(d.age/.35*Math.PI)*25:Math.sin(time*4+d.x)*3;oval(ctx,d.x,d.y+5,10,4,'#16233c44');if(image?.naturalWidth)ctx.drawImage(image,d.x-13,d.y-21-z,26,26);else crystal(ctx,d.x,d.y-10-z,10,'#baeafa');}}

function drawMineExit(ctx,time){
 const {x,y}=MINE_EXIT;ctx.save();
 // The exit belongs to the southern cave boundary: daylight spills inward along the floor.
 const light=ctx.createLinearGradient(x,y+160,x,y-270);light.addColorStop(0,'#fff8db85');light.addColorStop(.45,'#ffecc340');light.addColorStop(1,'#fff4cf00');
 ctx.fillStyle=light;ctx.beginPath();ctx.moveTo(x-155,y+140);ctx.bezierCurveTo(x-145,y-20,x-160,y-150,x-220,y-260);ctx.lineTo(x+220,y-260);ctx.bezierCurveTo(x+160,y-150,x+145,y-20,x+155,y+140);ctx.closePath();ctx.fill();
 for(let i=0;i<14;i++){const phase=(time*.13+i*.071)%1,px=x+Math.sin(i*7.1)*110,py=y+70-phase*280;ctx.globalAlpha=Math.sin(phase*Math.PI)*.55;oval(ctx,px,py,1.8,1.8,'#fff8d9');}
 ctx.globalAlpha=1;ctx.textAlign='center';ctx.font='bold 15px sans-serif';ctx.fillStyle='#fff2cd';ctx.strokeStyle='#5c5264';ctx.lineWidth=3;ctx.strokeText('출구 ↓',x,y-95);ctx.fillText('출구 ↓',x,y-95);ctx.restore();
}
