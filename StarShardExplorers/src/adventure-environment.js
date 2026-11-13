const sprites={};
let ready,ground;
export function loadEnvironment(){
 return ready ||= Promise.all(['tree','rock','house','enemy','trap'].map(async id=>{
  const image=new Image();image.src=import.meta.env.BASE_URL+'adventure/environment/'+id+'-v1.png';
  let timer;try{await Promise.race([image.decode(),new Promise((_,reject)=>{timer=setTimeout(()=>reject(new Error('asset timeout')),5000);})]);clearTimeout(timer);const c=document.createElement('canvas');c.width=image.width;c.height=image.height;const ctx=c.getContext('2d',{willReadFrequently:true});ctx.drawImage(image,0,0);const data=ctx.getImageData(0,0,c.width,c.height).data;let left=c.width,top=c.height,right=0,bottom=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]>20){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}if(right>left&&bottom>top)sprites[id]={image,sx:left,sy:top,sw:right-left+1,sh:bottom-top+1};}catch{/* Keep the existing vector fallback if an asset cannot load. */}finally{clearTimeout(timer);}
 }));
}
export function drawEnvironmentProp(ctx,id,o,{width,height,player,anchor=10}={}){
 const s=sprites[id];if(!s)return false;
 const drawHeight=Math.min(height,width*s.sh/s.sw),drawWidth=drawHeight*s.sw/s.sh;
 ctx.save();ctx.globalAlpha=1;ctx.drawImage(s.image,s.sx,s.sy,s.sw,s.sh,o.x-drawWidth/2,o.y-drawHeight+anchor,drawWidth,drawHeight);
 if(o.flash>0){ctx.globalAlpha=.4;ctx.strokeStyle='#fff2b1';ctx.lineWidth=2;ctx.beginPath();ctx.ellipse(o.x,o.y+2,width*.35,9,0,0,Math.PI*2);ctx.stroke();}
 ctx.restore();return true;
}
function groundTexture(){
 if(ground)return ground;ground=document.createElement('canvas');ground.width=2600;ground.height=1800;const c=ground.getContext('2d');let seed=78317;const rand=()=>{seed=(seed*1664525+1013904223)>>>0;return seed/4294967296;};
 c.fillStyle='#a5b979';c.fillRect(0,0,2600,1800);
 for(let n=0;n<1700;n++){const x=rand()*2600,y=rand()*1800,r=10+rand()*38;c.fillStyle=['#bfd18c22','#d2da9b22','#75965616','#94ae6826'][n%4];c.beginPath();c.ellipse(x,y,r,r*.6,0,0,Math.PI*2);c.fill();}
 const road=new Path2D();road.moveTo(280,1320);road.bezierCurveTo(670,1000,1060,1230,1380,850);road.bezierCurveTo(1660,560,1710,470,2070,465);c.lineCap='round';for(const [w,color] of [[91,'#a9ac6d'],[83,'#c3b986'],[74,'#dfcc9e'],[59,'#e8d4aa']]){c.strokeStyle=color;c.lineWidth=w;c.stroke(road);}
 for(let n=0;n<26000;n++){const x=rand()*2600,y=rand()*1800;if(c.isPointInStroke(road,x,y)){c.fillStyle=n%2?'#c9af7f55':'#fff0c233';c.fillRect(x,y,1+rand()*2,1);}else{c.fillStyle=['#e0e5b455','#5d894328','#7e9e5438'][n%3];c.beginPath();c.ellipse(x,y,.5+rand()*1.1,.3+rand()*.7,0,0,Math.PI*2);c.fill();}}
 for(let n=0;n<650;n++){const x=rand()*2600,y=rand()*1800;if(c.isPointInStroke(road,x,y))continue;c.strokeStyle=n%2?'#73934f77':'#cfdb9b99';c.lineWidth=.8;c.beginPath();c.moveTo(x-2,y);c.quadraticCurveTo(x-1,y-4,x,y-1);c.quadraticCurveTo(x+2,y-4,x+3,y);c.stroke();if(n%19===0){c.fillStyle='#fff1bf';c.beginPath();c.arc(x,y-2,1.8,0,Math.PI*2);c.fill();}}
 return ground;
}
export function drawEnvironmentGround(ctx){ctx.drawImage(groundTexture(),0,0);}
