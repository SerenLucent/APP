const tailAnchors={front:[.925,.595],side:[.14,.57],back:[.105,.61],'diagonal-front':[.125,.615],'diagonal-back':[.14,.625]};
export function chargeFocus(id,pose){const [x,y]=id==='kuki'?(tailAnchors[pose]||tailAnchors.front):[.51,pose==='side'?.035:.055];return {x:-54+x*108,y:-104+y*108};}
// Called in the character's translated/mirrored canvas space, so the glow
// follows the exact same facing, scale and position as the standing sprite.
export function drawChargeGather(ctx,{id,pose,time,power}){
 const focus=chargeFocus(id,pose),pink=id==='momo',radius=10+power*11;ctx.save();ctx.globalCompositeOperation='screen';ctx.translate(focus.x,focus.y);ctx.scale(2,2);ctx.translate(-focus.x,-focus.y);
 const glow=ctx.createRadialGradient(focus.x,focus.y,0,focus.x,focus.y,radius);glow.addColorStop(0,'#ffffff');glow.addColorStop(.22,pink?'#fff3fae6':'#fff9dce6');glow.addColorStop(.55,pink?'#ffd5e980':'#ffe6a880');glow.addColorStop(1,pink?'#ffcae000':'#ffe29a00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(focus.x,focus.y,radius,0,Math.PI*2);ctx.fill();
 // A soft spindle: both ends taper to points, without a separate round head.
 for(let i=0;i<12;i++){
  const t=(time*1.3+i/12)%1,angle=i*2.4+time*.8,r=(1-t)**1.4*(32+power*23),x=focus.x+Math.cos(angle)*r,y=focus.y+Math.sin(angle)*r*.78;
  ctx.save();ctx.translate(x,y);ctx.rotate(Math.atan2(Math.sin(angle)*.78,Math.cos(angle)));ctx.globalAlpha=Math.sin(t*Math.PI)*(.55+power*.45);
  const length=10+power*5,width=.8+power*.5,gradient=ctx.createLinearGradient(-length/2,0,length/2,0);
  gradient.addColorStop(0,pink?'#ffd4e800':'#ffe9a900');gradient.addColorStop(.5,'#fffdf6');gradient.addColorStop(1,pink?'#ffd4e800':'#ffe9a900');ctx.fillStyle=gradient;
  ctx.beginPath();ctx.moveTo(-length/2,0);ctx.bezierCurveTo(-length*.2,-width, length*.2,-width,length/2,0);ctx.bezierCurveTo(length*.2,width,-length*.2,width,-length/2,0);ctx.fill();ctx.restore();
 }

 ctx.restore();
}

export function weaponPowerFocus(id,direction,strike=false,outerFlip=false){
 const columns={up:0,down:1,left:2,right:2,upLeft:3,upRight:3,downLeft:4,downRight:4};
 const momo=strike?[[.51,.24],[.49,.14],[.40,.19],[.35,.18],[.49,.17]]:[[.50,.14],[.52,.14],[.58,.15],[.54,.14],[.57,.15]];
 const kuki=strike?[[.19,.62],[.84,.65],[.84,.53],[.83,.51],[.88,.55]]:[[.18,.63],[.87,.68],[.84,.62],[.83,.62],[.88,.68]];
 const [u,v]=(id==='momo'?momo:kuki)[columns[direction]??1],mirrored=direction==='right'||direction.endsWith('Right');
 const x=-54+(mirrored?1-u:u)*108;
 return {x:outerFlip?-x:x,y:-104+v*108};
}
export function drawPowerNeon(ctx,{id,pose,time,bounce=0,focus=null}){
 const heartAnchors={front:[.61,.14],side:[.64,.13],back:[.42,.14],'diagonal-front':[.61,.14],'diagonal-back':[.49,.14]};
 const anchor=heartAnchors[pose]||heartAnchors.front,f=focus||(id==='momo'?{x:-54+anchor[0]*108,y:-104+anchor[1]*108}:chargeFocus(id,pose)),pink=id==='momo',x=f.x,y=f.y+bounce,r=25+Math.sin(time*5)*2;
 ctx.save();ctx.globalCompositeOperation='screen';
 // Keep the orb clear, with character-colored neon only around its rim.
 const rim=r*.72,glow=ctx.createRadialGradient(x,y,0,x,y,r);
 glow.addColorStop(0,pink?'#ffbddb00':'#8adeff00');glow.addColorStop(.62,pink?'#ffbddb00':'#8adeff00');glow.addColorStop(.70,pink?'#ffc5df70':'#a5e8ff70');glow.addColorStop(.73,pink?'#ffe1efbb':'#d9f7ffbb');glow.addColorStop(.80,pink?'#ffbddb45':'#8adeff45');glow.addColorStop(1,pink?'#ffbddb00':'#8adeff00');
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(x,y,r,0,Math.PI*2);ctx.fill();
 // Subtle glass shading and reflections, without a cloudy colored center.
 const glass=ctx.createRadialGradient(x-rim*.32,y-rim*.38,0,x,y,rim);
 glass.addColorStop(0,'#ffffff12');glass.addColorStop(.40,'#ffffff03');glass.addColorStop(.76,'#ffffff00');glass.addColorStop(1,pink?'#ffe0ee1c':'#d8f6ff1c');
 ctx.fillStyle=glass;ctx.beginPath();ctx.arc(x,y,rim,0,Math.PI*2);ctx.fill();
 ctx.save();ctx.translate(x,y);ctx.rotate(-.65);
 const reflection=ctx.createRadialGradient(-rim*.25,-rim*.48,0,-rim*.25,-rim*.48,rim*.45);
 reflection.addColorStop(0,'#ffffff85');reflection.addColorStop(.45,'#ffffff32');reflection.addColorStop(1,'#ffffff00');ctx.fillStyle=reflection;ctx.beginPath();ctx.ellipse(-rim*.25,-rim*.48,rim*.38,rim*.16,0,0,Math.PI*2);ctx.fill();ctx.restore();
 ctx.strokeStyle='#ffffffa6';ctx.lineWidth=1.7;ctx.lineCap='round';ctx.beginPath();ctx.arc(x,y,rim*.87,Math.PI*1.08,Math.PI*1.40);ctx.stroke();
 ctx.strokeStyle='#ffffff40';ctx.lineWidth=1;ctx.beginPath();ctx.arc(x,y,rim*.88,.12,.65);ctx.stroke();
 ctx.strokeStyle=pink?'#ffd2e6':'#c5f2ff';ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(x,y,rim,0,Math.PI*2);ctx.stroke();ctx.restore();
}
