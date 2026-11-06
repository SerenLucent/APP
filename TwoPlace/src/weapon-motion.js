export const WEAPON_DIRECTIONS=[
 {id:'up',label:'↑ 위',column:0}, {id:'down',label:'↓ 아래',column:1},
 {id:'left',label:'← 왼쪽',column:2}, {id:'upLeft',label:'↖ 왼쪽 위',column:3},
 {id:'downLeft',label:'↙ 왼쪽 아래',column:4},
 {id:'right',label:'→ 오른쪽',column:2,flip:true},
 {id:'upRight',label:'↗ 오른쪽 위',column:3,flip:true},
 {id:'downRight',label:'↘ 오른쪽 아래',column:4,flip:true}
];
export function weaponFrame(width,height,direction,state='idle'){
 const d=WEAPON_DIRECTIONS.find(d=>d.id===direction)||WEAPON_DIRECTIONS[1];
 return {x:d.column*width/5,y:state==='strike'?height/2:0,width:width/5,height:height/2,flip:!!d.flip};
}
export function drawWeaponFrame(ctx,image,direction,state,width,height){
 const f=weaponFrame(image.naturalWidth,image.naturalHeight,direction,state),size=Math.min(width,height);
 ctx.save();ctx.translate(width/2,height/2);if(f.flip)ctx.scale(-1,1);
 ctx.drawImage(image,f.x,f.y,f.width,f.height,-size/2,-size/2,size,size);ctx.restore();
}



// Reference: Rune-Midgarts-Village player_attack_* poses, not slash_hit_* impacts.
export function drawWeaponSwing(ctx,direction,pet,progress,width,height){
 if(progress<0||progress>1)return;
 const flip=direction==='right'||direction.endsWith('Right'),up=direction.startsWith('up');
 ctx.save();ctx.scale(width,height);if(flip){ctx.translate(1,0);ctx.scale(-1,1);}
 const alpha=Math.sin(Math.PI*Math.min(1,progress/.9)),end=Math.min(1,progress*2.8);
 const points=up?(direction==='up'?[[.60,.02],[.22,-.04],[.12,.27],[.50,.48]]:[[.53,.04],[.06,-.02],[-.03,.30],[.18,.64]]):[[.68,.12],[.02,.30],[.01,.70],[.26,.94]];
 const point=t=>{const u=1-t,weights=[u*u*u,3*u*u*t,3*u*t*t,t*t*t];return {x:points.reduce((v,p,i)=>v+p[0]*weights[i],0),y:points.reduce((v,p,i)=>v+p[1]*weights[i],0)};};
 ctx.globalCompositeOperation='screen';ctx.lineCap='round';
 for(let i=0;i<44;i++){const t=i/44;if(t>end)break;const a=point(t),b=point((i+1)/44),taper=Math.pow(Math.sin(Math.PI*t),.7);ctx.globalAlpha=alpha;
 ctx.strokeStyle=pet==='momo'?'#ff9ecb':'#ffd06b';ctx.lineWidth=.042*taper+.001;ctx.shadowColor=ctx.strokeStyle;ctx.shadowBlur=7;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();
 ctx.shadowBlur=0;ctx.strokeStyle='#fff9e8';ctx.lineWidth=.018*taper+.001;ctx.beginPath();ctx.moveTo(a.x,a.y);ctx.lineTo(b.x,b.y);ctx.stroke();}
 if(progress>.22&&progress<.85){ctx.shadowBlur=0;ctx.strokeStyle=pet==='momo'?'#ffd2e6':'#fff0bc';ctx.lineWidth=.004;for(let i=0;i<4;i++){const q=point(.2+i*.19),r=.009+Math.sin(progress*7+i)*.003;ctx.globalAlpha=alpha*.65;ctx.beginPath();ctx.moveTo(q.x-r,q.y);ctx.lineTo(q.x+r,q.y);ctx.moveTo(q.x,q.y-r);ctx.lineTo(q.x,q.y+r);ctx.stroke();}}
 ctx.restore();
}

// Upward attacks occur on the far side of the body; the sprite must occlude them.
export function drawWeaponPose(ctx,image,direction,state,pet,progress,width,height){
 const trail=state==='strike'&&progress>=0;
 if(trail&&direction.startsWith('up'))drawWeaponSwing(ctx,direction,pet,progress,width,height);
 drawWeaponFrame(ctx,image,direction,state,width,height);
 if(trail&&!direction.startsWith('up'))drawWeaponSwing(ctx,direction,pet,progress,width,height);
}
