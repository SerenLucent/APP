// Isolate the main connected sprite, so neighboring-cell fragments never render.
export function isolateTurretFrame(rgba,width,height,cell){
 const x0=Math.floor(cell.x),y0=Math.floor(cell.y),cw=Math.floor(cell.w),ch=Math.floor(cell.h),seen=new Uint8Array(cw*ch),queue=new Int32Array(cw*ch);let best=[];
 for(let start=0;start<seen.length;start++){if(seen[start])continue;seen[start]=1;let sx=start%cw,sy=Math.floor(start/cw);if(rgba[((y0+sy)*width+x0+sx)*4+3]<180)continue;let head=0,tail=1;queue[0]=start;while(head<tail){const i=queue[head++],x=i%cw,y=Math.floor(i/cw);for(const [dx,dy] of [[-1,0],[1,0],[0,-1],[0,1]]){const nx=x+dx,ny=y+dy;if(nx<0||ny<0||nx>=cw||ny>=ch)continue;const n=ny*cw+nx;if(seen[n])continue;seen[n]=1;if(rgba[((y0+ny)*width+x0+nx)*4+3]>=180)queue[tail++]=n;}}if(tail>best.length)best=Array.from(queue.subarray(0,tail));}
 if(!best.length)throw Error('포대 그림의 본체를 찾지 못했어요.');
 let left=cw,right=0,top=ch,bottom=0;const mask=new Uint8Array(cw*ch);for(const i of best){const x=i%cw,y=Math.floor(i/cw);left=Math.min(left,x);right=Math.max(right,x);top=Math.min(top,y);bottom=Math.max(bottom,y);for(let dy=-2;dy<=2;dy++)for(let dx=-2;dx<=2;dx++){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<cw&&ny<ch)mask[ny*cw+nx]=1;}}
 left=Math.max(0,left-2);right=Math.min(cw-1,right+2);top=Math.max(0,top-2);bottom=Math.min(ch-1,bottom+2);const w=right-left+1,h=bottom-top+1,data=new Uint8ClampedArray(w*h*4);
 for(let y=top;y<=bottom;y++)for(let x=left;x<=right;x++)if(mask[y*cw+x]){const src=((y0+y)*width+x0+x)*4,dst=((y-top)*w+x-left)*4;data.set(rgba.subarray(src,src+4),dst);}
 // The widest solid row of the lower base defines its pivot and consistent size.
 let baseWidth=0,anchorX=w/2;for(let y=Math.floor(h*.58);y<h;y++){let l=w,r=-1;for(let x=0;x<w;x++)if(data[(y*w+x)*4+3]>=180){l=Math.min(l,x);r=x;}if(r-l+1>baseWidth){baseWidth=r-l+1;anchorX=(l+r)/2;}}
 return {data,w,h,anchorX,anchorY:h-2,baseWidth};
}
export function turretFrameLayout(frame,p){const scale=106/frame.baseWidth;return {f:frame,scale,x:p.x-frame.anchorX*scale,y:p.y+15-frame.anchorY*scale};}
