const tailAnchors={front:[.925,.595],side:[.14,.57],back:[.105,.61],'diagonal-front':[.125,.615],'diagonal-back':[.14,.625]};
export function chargeFocus(id,pose){const [x,y]=id==='kuki'?(tailAnchors[pose]||tailAnchors.front):[.51,pose==='side'?.035:.055];return {x:-54+x*108,y:-104+y*108};}
// Called in the character's translated/mirrored canvas space, so the glow
// follows the exact same facing, scale and position as the standing sprite.
export function drawChargeGather(ctx,{id,pose,time,power}){
 const focus=chargeFocus(id,pose),pink=id==='momo',radius=10+power*11,color=pink?'#ffd4e8':'#ffe9a9';ctx.save();ctx.globalCompositeOperation='screen';
 const glow=ctx.createRadialGradient(focus.x,focus.y,0,focus.x,focus.y,radius);glow.addColorStop(0,'#ffffff');glow.addColorStop(.22,pink?'#fff3fae6':'#fff9dce6');glow.addColorStop(.55,pink?'#ffd5e980':'#ffe6a880');glow.addColorStop(1,pink?'#ffcae000':'#ffe29a00');ctx.fillStyle=glow;ctx.beginPath();ctx.arc(focus.x,focus.y,radius,0,Math.PI*2);ctx.fill();
 for(let i=0;i<12;i++){const t=(time*1.3+i/12)%1,angle=i*2.4+time*.8,r=(1-t)**1.4*(32+power*23),x=focus.x+Math.cos(angle)*r,y=focus.y+Math.sin(angle)*r*.78;ctx.globalAlpha=Math.sin(t*Math.PI)*(.55+power*.45);ctx.strokeStyle=color;ctx.lineWidth=1+power;ctx.beginPath();ctx.moveTo(x+Math.cos(angle)*5,y+Math.sin(angle)*4);ctx.lineTo(x,y);ctx.stroke();ctx.fillStyle='#fffdf6';ctx.beginPath();ctx.arc(x,y,1+power*1.4,0,Math.PI*2);ctx.fill();}
 ctx.restore();
}
