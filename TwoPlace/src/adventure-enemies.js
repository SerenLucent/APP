export const ENEMY_RULES={notice:240,lose:350,leash:440,attack:46,speed:100,windup:.55};
const CELL=40,COLS=65,ROWS=45;
function clearAt(x,y,obstacles,radius=18){return x>=80&&x<=2520&&y>=160&&y<=1720&&!obstacles.some(o=>o.hp>0&&Math.hypot(o.x-x,o.y-y)<o.radius+radius);}
export function createEnemies(obstacles=[],count=24){return [...[[820,1220],[1060,740],[1340,1100],[1620,500],[1820,1380],[2180,780]],...Array.from({length:Math.max(0,count-6)},(_,i)=>[740+(i%6)*280+(Math.floor(i/18)%2)*60,360+(Math.floor(i/6)%3)*530])].map(([x,y],i)=>{const ox=x,oy=y;for(let t=0;t<100&&(!clearAt(x,y,obstacles,26)||Math.hypot(x-550,y-1040)<310);t++){x=ox+Math.cos(t*2.4)*(50+t*3);y=oy+Math.sin(t*2.4)*(50+t*3);}x=Math.floor(x/CELL)*CELL+20;y=Math.floor(y/CELL)*CELL+20;for(let n=0;n<30&&!clearAt(x,y,obstacles,26);n++)x+=CELL;return {id:'enemy-'+i,type:'enemy',name:'숲 방울이',x,y,homeX:x,homeY:y,hp:90,max:90,radius:22,mode:'idle',flash:0,cooldown:0,windup:0,repath:0,path:[]};});}
export function enemyMode(enemy,player){if(enemy.hp<=0)return 'dead';if(enemy.offense)return 'chase';if(enemy.mode==='return')return Math.hypot(enemy.x-enemy.homeX,enemy.y-enemy.homeY)<10?'idle':'return';const homeDistance=Math.hypot(enemy.x-enemy.homeX,enemy.y-enemy.homeY),targetDistance=Math.hypot(player.x-enemy.x,player.y-enemy.y);if(enemy.mode==='chase'&&(homeDistance>ENEMY_RULES.leash||targetDistance>ENEMY_RULES.lose))return 'return';return targetDistance<ENEMY_RULES.notice||enemy.mode==='chase'?'chase':'idle';}
export function enemyPath(start,goal,obstacles){
 const cell=p=>({c:Math.max(2,Math.min(COLS-3,Math.floor(p.x/CELL))),r:Math.max(4,Math.min(ROWS-3,Math.floor(p.y/CELL)))}),a=cell(start),b=cell(goal),key=(c,r)=>r*COLS+c;
 const walk=new Map(),can=(c,r)=>{const k=key(c,r);if(!walk.has(k))walk.set(k,c>=2&&c<COLS-2&&r>=4&&r<ROWS-2&&clearAt(c*CELL+20,r*CELL+20,obstacles));return walk.get(k);};
 // Nearby reachable endpoint rather than cutting through a tree under the target.
 if(!can(b.c,b.r)){const near=[];for(let dr=-2;dr<=2;dr++)for(let dc=-2;dc<=2;dc++)if(can(b.c+dc,b.r+dr))near.push({c:b.c+dc,r:b.r+dr,d:Math.hypot(dc,dr)});near.sort((x,y)=>x.d-y.d);if(!near.length)return [];Object.assign(b,near[0]);}
 const origin=key(a.c,a.r),end=key(b.c,b.r),open=[{...a,k:origin,g:0,f:0}],cost=new Map([[origin,0]]),parents=new Map(),closed=new Set();let found=false;
 for(let limit=0;open.length&&limit<2200;limit++){let best=0;for(let i=1;i<open.length;i++)if(open[i].f<open[best].f)best=i;const q=open.splice(best,1)[0];if(closed.has(q.k))continue;if(q.k===end){found=true;break;}closed.add(q.k);for(let dr=-1;dr<=1;dr++)for(let dc=-1;dc<=1;dc++){if(!dc&&!dr)continue;const c=q.c+dc,r=q.r+dr,k=key(c,r);if(!can(c,r)||closed.has(k)||dc&&dr&&(!can(q.c+dc,q.r)||!can(q.c,q.r+dr)))continue;const g=q.g+(dc&&dr?Math.SQRT2:1);if(g>=(cost.get(k)??Infinity))continue;cost.set(k,g);parents.set(k,q.k);open.push({c,r,k,g,f:g+Math.hypot(c-b.c,r-b.r)});}}
 if(!found)return [];const path=[];let k=end;while(k!==origin){path.push({x:(k%COLS)*CELL+20,y:Math.floor(k/COLS)*CELL+20});k=parents.get(k);if(k===undefined)return [];}return path.reverse();
}
export function stepEnemy(enemy,player,obstacles,dt){
 const before=enemy.mode;enemy.mode=enemyMode(enemy,player);enemy.cooldown=Math.max(0,enemy.cooldown-dt);enemy.repath-=dt;
 if(enemy.mode==='dead'||enemy.mode==='idle'){enemy.windup=0;enemy.path=[];return false;}
 if(before!==enemy.mode){enemy.path=[];enemy.repath=0;enemy.windup=0;}
 if(enemy.windup>0){enemy.windup-=dt;if(enemy.windup<=0){enemy.cooldown=1.25;return Math.hypot(player.x-enemy.x,player.y-enemy.y)<ENEMY_RULES.attack+12;}return false;}
 if(enemy.mode==='chase'&&Math.hypot(player.x-enemy.x,player.y-enemy.y)<ENEMY_RULES.attack){if(enemy.cooldown<=0)enemy.windup=ENEMY_RULES.windup;return false;}
 const target=enemy.mode==='return'?{x:enemy.homeX,y:enemy.homeY}:player;
 if(enemy.repath<=0){enemy.path=enemyPath(enemy,target,obstacles);enemy.repath=.65;}
 let next=enemy.path[0];if(!next&&enemy.mode==='return'&&Math.hypot(enemy.x-enemy.homeX,enemy.y-enemy.homeY)<CELL*1.5)next=target;
 if(next){const dx=next.x-enemy.x,dy=next.y-enemy.y,d=Math.hypot(dx,dy),step=Math.min(d,ENEMY_RULES.speed*dt);const nx=enemy.x+(dx/(d||1))*step,ny=enemy.y+(dy/(d||1))*step;if(clearAt(nx,ny,obstacles)){enemy.x=nx;enemy.y=ny;}else enemy.repath=0;if(d<6)enemy.path.shift();}
 return false;
}
