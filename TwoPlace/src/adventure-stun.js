// Drawn in the enemy's local coordinates so the orbit follows its head.
export function drawStunStars(ctx,time,phase=0){
 ctx.save();
 ctx.strokeStyle='#fff2bb88';ctx.lineWidth=1.5;
 ctx.beginPath();ctx.ellipse(0,-73,26,9,0,0,Math.PI*2);ctx.stroke();
 for(let i=0;i<3;i++){
  const angle=time*4+phase*.01+i*Math.PI*2/3;
  const depth=Math.sin(angle),size=5.5+depth;
  ctx.save();ctx.translate(Math.cos(angle)*26,-73+depth*9);ctx.rotate(-.15+Math.sin(time*3+i)*.2);
  ctx.shadowColor='#ffe183';ctx.shadowBlur=7;
  ctx.fillStyle='#ffe37d';ctx.strokeStyle='#fff8db';ctx.lineWidth=1.2;
  ctx.beginPath();
  for(let corner=0;corner<10;corner++){
   const a=-Math.PI/2+corner*Math.PI/5,r=corner%2?size*.46:size;
   const x=Math.cos(a)*r,y=Math.sin(a)*r;
   if(corner===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);
  }
  ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
 }
 ctx.restore();
}
