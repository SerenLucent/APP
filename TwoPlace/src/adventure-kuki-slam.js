export const KUKI_SLAM_RADIUS=235;
export const KUKI_SLAM_MULTIPLIER=5;
export const KUKI_WAVE_LIFE=.8;

const waveColors = {
 blue: {inner:'181,237,255', mid:'123,214,255', edge:'126,223,255', ring:'#8cdeff', halo:'#7ad5ff', core:'#f5fdff', spark:'#c8f2ff'},
 pink: {inner:'255,246,252', mid:'255,216,235', edge:'255,222,238', ring:'#ffdeef', halo:'#ffbbdf', core:'#ffffff', spark:'#fff2f9'},
};

export function drawGroundWave(ctx,x,y,t,radius=KUKI_SLAM_RADIUS,color='blue'){
 if(t<0||t>=1)return;
 const fade=(1-t)**1.65,spread=1-(1-t)**2.15,r=radius*(.12+.88*spread);
 const palette=waveColors[color];
 ctx.save();ctx.translate(x,y);ctx.scale(1,.43);
 const glow=ctx.createRadialGradient(0,0,0,0,0,r);
 glow.addColorStop(0,`rgba(255,255,255,${.64*fade})`);
 glow.addColorStop(.42,`rgba(${palette.inner},${.25*fade})`);
 glow.addColorStop(.82,`rgba(${palette.mid},${.13*fade})`);
 glow.addColorStop(.95,`rgba(${palette.edge},${.43*fade})`);
 glow.addColorStop(1,`rgba(${palette.edge},0)`);
 ctx.fillStyle=glow;ctx.beginPath();ctx.arc(0,0,r,0,Math.PI*2);ctx.fill();
 for(let i=0;i<2;i++){
  const radius=r*(.94-i*.22),width=(18-i*5)*(1-t)+2;
  ctx.globalAlpha=fade*(i?.58:1);ctx.strokeStyle=palette.ring;ctx.lineWidth=width;ctx.shadowColor=palette.halo;ctx.shadowBlur=12;
  ctx.beginPath();ctx.arc(0,0,radius,0,Math.PI*2);ctx.stroke();
  ctx.shadowBlur=0;ctx.strokeStyle=palette.core;ctx.lineWidth=width*.34;ctx.stroke();
 }
 for(let i=0;i<14;i++){
  const a=i*2.39996,dist=r*(.58+(i%4)*.09),len=(9+i%3*5)*(1-t)+3;
  ctx.globalAlpha=fade*(.38+i%3*.2);ctx.strokeStyle=i%2?palette.spark:'#ffffff';ctx.lineWidth=3-i%2;ctx.lineCap='round';
  ctx.beginPath();ctx.moveTo(Math.cos(a)*dist,Math.sin(a)*dist);ctx.lineTo(Math.cos(a)*(dist+len),Math.sin(a)*(dist+len));ctx.stroke();
 }
 ctx.restore();
}

export function drawPowerStar(ctx,x,y,scale,alpha){
 ctx.save();ctx.translate(x,y);ctx.scale(scale,scale);ctx.globalAlpha=alpha;ctx.shadowColor='#ffe379';ctx.shadowBlur=11;
 const fill=ctx.createLinearGradient(0,-17,0,14);fill.addColorStop(0,'#fff7aa');fill.addColorStop(1,'#ffbf35');ctx.fillStyle=fill;ctx.strokeStyle='#fff4b0';ctx.lineWidth=2;ctx.lineJoin='round';
 ctx.beginPath();for(let i=0;i<10;i++){const a=i*Math.PI/5-Math.PI/2,r=i%2?8:17;const x=Math.cos(a)*r,y=Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}ctx.closePath();ctx.fill();ctx.stroke();ctx.restore();
}
