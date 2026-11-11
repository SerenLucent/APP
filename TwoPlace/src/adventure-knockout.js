export const KNOCKOUT_SECONDS=2;
export function beginKnockout(state){
 if(state.knockout||state.dead||state.won||state.pets[state.active].hp>0)return false;
 state.knockout={id:state.active,t:0,completed:false};state.attack=null;state.burst=null;state.heartMeteor=null;state.basic=0;state.charge=null;state.switching=null;state.hitStop=0;state.target=null;state.p.walking=false;return true;
}
export function stepKnockout(state,dt){
 const ko=state.knockout;if(!ko||ko.completed)return null;ko.t=Math.min(KNOCKOUT_SECONDS,ko.t+dt);if(ko.t<KNOCKOUT_SECONDS-1e-9)return null;
 if(state.pets[ko.id].hp>0){state.knockout=null;state.invuln=1;return 'revived';}
 const other=ko.id==='momo'?'kuki':'momo';
 if(state.pets[other].hp>0){state.active=other;state.knockout=null;state.invuln=1;return 'switch';}
 ko.completed=true;state.dead=true;return 'defeat';
}
export function drawKnockedOut(ctx,state,sheet,standing){
 const ko=state.knockout,id=state.active,p=state.p,t=ko?.t??KNOCKOUT_SECONDS,u=Math.min(1,t/.2);
 ctx.save();ctx.translate(p.x,p.y);ctx.fillStyle='#253d3438';ctx.beginPath();ctx.ellipse(0,5,37,10,0,0,Math.PI*2);ctx.fill();
 if(u<1&&standing?.complete&&standing.naturalWidth){ctx.globalAlpha=1-u;ctx.drawImage(standing,-54,-104+u*12,108,108);}
 ctx.globalAlpha=u;
 if(sheet?.complete&&sheet.naturalWidth){const w=sheet.naturalWidth/4,h=sheet.naturalHeight/4,column=p.fx<0?1:0,row=id==='momo'?2:3;ctx.drawImage(sheet,column*w,row*h,w,h,-59,-96-(1-u)*9,118,118);}
 else if(standing?.complete&&standing.naturalWidth){ctx.save();ctx.translate(0,-18);ctx.rotate(Math.PI/2);ctx.drawImage(standing,-54,-54,108,108);ctx.restore();}
 ctx.globalAlpha=.8;for(let i=0;i<3;i++){const angle=t*2+i*Math.PI*2/3,x=Math.cos(angle)*19,y=-67+Math.sin(angle)*5;ctx.fillStyle='#ffe8a4';ctx.beginPath();for(let j=0;j<10;j++){const a=j*Math.PI/5-Math.PI/2,r=j%2?1.5:3.5;j?ctx.lineTo(x+Math.cos(a)*r,y+Math.sin(a)*r):ctx.moveTo(x+Math.cos(a)*r,y+Math.sin(a)*r);}ctx.closePath();ctx.fill();}ctx.restore();
}
