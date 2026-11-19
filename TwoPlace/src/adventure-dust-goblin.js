const sheets={};
let pending;
// Sheet order: S, SW, W, NW / N, NE, E, SE.
export function dustDirection(dx,dy){
 if(!dx&&!dy)return 0;
 return [6,7,0,1,2,3,4,5][(Math.round(Math.atan2(dy,dx)/(Math.PI/4))+8)%8];
}
export function updateDustFacing(enemy,player){
 const dx=enemy.x-(enemy.drawX??enemy.x),dy=enemy.y-(enemy.drawY??enemy.y);
 enemy.drawX=enemy.x;enemy.drawY=enemy.y;
 if(Math.hypot(dx,dy)>.01)enemy.facing=dustDirection(dx,dy);
 else if(enemy.windup>0||enemy.mode==='chase')enemy.facing=dustDirection(player.x-enemy.x,player.y-enemy.y);
 return Math.hypot(dx,dy)>.01;
}
export function loadDustGoblin(){
 return pending ||= Promise.all(['idle','hit'].map(async pose=>{
  const image=new Image();image.src=import.meta.env.BASE_URL+'adventure/enemy-concepts/dust-goblin-'+pose+'-8dir-v1.png';
  try{await image.decode();}catch{pending=null;throw new Error('뭉치 이미지를 불러오지 못했어요. 다시 시작해 주세요.');}
  const canvas=document.createElement('canvas');canvas.width=image.width;canvas.height=image.height;
  const c=canvas.getContext('2d',{willReadFrequently:true});c.drawImage(image,0,0);
  const pixels=c.getImageData(0,0,canvas.width,canvas.height).data,cw=canvas.width/4,ch=canvas.height/2;
  const frames=Array.from({length:8},(_,i)=>{
   const ox=Math.round(i%4*cw),oy=Math.round(Math.floor(i/4)*ch);let left=ox+cw,right=ox,top=oy+ch,bottom=oy;
   for(let y=oy;y<Math.min(canvas.height,oy+ch);y++)for(let x=ox;x<Math.min(canvas.width,ox+cw);x++)if(pixels[(y*canvas.width+x)*4+3]>180){left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);}
   return {sx:left,sy:top,sw:right-left+1,sh:bottom-top+1};
  });
  sheets[pose]={image,frames};
 }));
}
export function drawDustGoblin(ctx,enemy){
 const hit=enemy.flash>0||enemy.hitJolt>0,s=sheets[hit?'hit':'idle'];if(!s)return;
 const f=s.frames[(hit?enemy.hitFacing:enemy.facing)??0];
 const height=enemy.training?105:70,width=height*f.sw/f.sh;
 ctx.drawImage(s.image,f.sx,f.sy,f.sw,f.sh,-width/2,5-height,width,height);
}
