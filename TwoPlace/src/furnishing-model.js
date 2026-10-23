import {footprint} from '../shared/pet-space.js';
// All vertices are in floor-cell units; screen axes match pet-space exactly.
const palette={wood:'#c99665',cream:'#f4e5c9',pink:'#e7a7bb',mint:'#a3c5b4',blue:'#a1c6d6',leaf:'#7f9e70',water:'#85bfcb',soil:'#725e49',brass:'#c9a15e'};
const cache=new Map();
export function furnishingModel(product,rotation=0){
 const key=product+':'+rotation;if(cache.has(key))return cache.get(key);
 const [w,d]=footprint({product,rotation:0}),[fw,fd]=footprint({product,rotation});
 const turn=((rotation/90)%4+4)%4,faces=[],modelVertices=[];
 const rot=([u,v,z])=>turn===0?[u,v,z]:turn===1?[-v,u,z]:turn===2?[-u,-v,z]:[v,-u,z];
 const project=vertex=>{const [a,b,z]=rot(vertex);return {x:(a-b)*20,y:(a+b)*10-z*20,depth:a+b+z};};
 function shade(hex,light){const n=parseInt(hex.slice(1),16);return '#'+[n>>16,(n>>8)&255,n&255].map(c=>Math.round(Math.min(255,Math.max(0,c*light))).toString(16).padStart(2,'0')).join('');}
 function quad(vertices,color,grain=false){
  modelVertices.push(...vertices);
  const a=rot(vertices[0]),b=rot(vertices[1]),c=rot(vertices[2]),ab=b.map((v,i)=>v-a[i]),ac=c.map((v,i)=>v-a[i]);
  const n=[ab[1]*ac[2]-ab[2]*ac[1],ab[2]*ac[0]-ab[0]*ac[2],ab[0]*ac[1]-ab[1]*ac[0]],length=Math.hypot(...n)||1;
  if(n.reduce((s,v)=>s+v,0)<-1e-8)return;
  const light=.77+.24*(n[2]/length)+.08*(-n[0]/length+n[1]/length);
  const p=vertices.map(project);faces.push({depth:p.reduce((s,v)=>s+v.depth,0)/p.length,vertices:p,color:shade(color,light),paints:vertices.map(v=>{if(!v.normal)return shade(color,light);const n=rot(v.normal),l=Math.hypot(...n)||1;return shade(color,.77+.24*n[2]/l+.08*(-n[0]/l+n[1]/l));}),grain});
 }
 function roundBox(cx,cy,z,sx,sy,sz,color,r=.06,grain=false,cloth=false){
  const center=[cx,cy,z+sz/2],half=[sx/2,sy/2,sz/2],radius=Math.min(r,...half),inner=half.map(h=>h-radius),steps=cloth?20:6;
  function rounded(v){const q=v.map((x,i)=>Math.max(-inner[i],Math.min(inner[i],x))),delta=v.map((x,i)=>x-q[i]),len=Math.hypot(...delta)||1;const p=q.map((x,i)=>center[i]+x+delta[i]/len*radius);if(cloth){const tx=(p[0]-cx)/sx,ty=(p[1]-cy)/sy,top=Math.max(0,(p[2]-z-sz/2)/(sz/2));p[2]+=top*(.12*Math.cos(tx*Math.PI)*Math.cos(ty*Math.PI)+(cloth==='pillow'?.006:.018)*Math.sin(tx*28+ty*9)*Math.cos(ty*18));}p.normal=delta.map(x=>x/len);return p;}
  for(let axis=0;axis<3;axis++)for(const sign of [-1,1]){
   const a=(axis+1)%3,b=(axis+2)%3;
   for(let i=0;i<steps;i++)for(let j=0;j<steps;j++){
    let corners=[[i,j],[i+1,j],[i+1,j+1],[i,j+1]].map(([u,v])=>{const p=[0,0,0];p[axis]=sign*half[axis];p[a]=-half[a]+u/steps*2*half[a];p[b]=-half[b]+v/steps*2*half[b];return rounded(p);});
    if(sign<0)corners.reverse();quad(corners,color,grain);
   }
  }
 }
 function ball(cx,cy,cz,rx,ry,rz,color){const rows=10,cols=20;const v=(a,b)=>{const p=[cx+rx*Math.sin(a)*Math.cos(b),cy+ry*Math.sin(a)*Math.sin(b),cz+rz*Math.cos(a)];p.normal=[(p[0]-cx)/(rx*rx),(p[1]-cy)/(ry*ry),(p[2]-cz)/(rz*rz)];return p;};for(let i=0;i<rows;i++)for(let j=0;j<cols;j++){const a=i/rows*Math.PI,b=j/cols*2*Math.PI;quad([v(a,b),v(a+Math.PI/rows,b),v(a+Math.PI/rows,b+2*Math.PI/cols),v(a,b+2*Math.PI/cols)],color);}}
 const box=roundBox;
 const legs=(sx,sy,height,thick=.15)=>{for(const x of [-sx/2+thick/2,sx/2-thick/2])for(const y of [-sy/2+thick/2,sy/2-thick/2])box(x,y,0,thick,thick,height,palette.wood,.035,true);};
 const cushion=(x,y,z,sx,sy,color)=>{box(x,y,z,sx,sy,.38,color,.18,false,'pillow');for(const u of [-.22,.22])for(const v of [-.18,.18])ball(x+u*sx,y+v*sy,z+.47,.022,.022,.008,shade(color,.87));};
 const plant=(x,y,z,size=.8)=>{box(x,y,z,size*.5,size*.5,.43,palette.cream,.12);for(let i=0;i<7;i++){const a=i*Math.PI*2/7;ball(x+Math.cos(a)*size*.22,y+Math.sin(a)*size*.22,z+.65+(i%3)*.1,size*.16,size*.1,size*.28,i%2?'#9ab584':palette.leaf);}};
 switch(product){
 case 'bed':{
  legs(1.85,2.85,.63,.17);
  box(0,0,.43,1.94,2.92,.29,palette.wood,.08,true);
  box(0,0,.72,1.83,2.72,.45,palette.cream,.18);
  box(0,-1.39,.53,1.96,.2,1.48,palette.wood,.09,true);
  for(const x of [-.85,.85])ball(x,-1.39,2.04,.1,.1,.1,palette.wood);
  box(0,.35,1.13,1.87,2.05,.4,palette.pink,.18,false,true);
  // Raised quilt channels, rounded hem and tiny stitches lie in model space.
  // Seams follow the actual quilt surface rather than a flat overlay.
  for(let y=-.45;y<1.28;y+=.31)for(let x=-.76;x<.76;x+=.06){const z=1.54+.12*Math.cos(x/1.87*Math.PI)*Math.cos((y-.35)/2.05*Math.PI)+.024*Math.sin(x/1.87*28+(y-.35)/2.05*9)*Math.cos((y-.35)/2.05*18);quad([[x,y,z],[x+.055,y,z],[x+.055,y+.008,z],[x,y+.008,z]],'#f5cbd7');}
  
  box(0,-.57,1.5,1.85,.25,.11,'#f6d4dd',.05,false,true);
  cushion(-.43,-.94,1.16,.77,.59,'#fff3dc');cushion(.43,-.94,1.16,.77,.59,'#fff3dc');
  break;}
 case 'desk':case 'table':{
  const desk=product==='desk',sx=1.85,sy=1.8;
  legs(sx-.12,sy-.12,1.35,.16);box(0,0,1.26,sx,sy,.21,palette.wood,.07,true);
  if(desk){box(.54,0,.92,.66,sy-.1,.33,'#e4c29a',.04,true);box(.54,sy/2-.025,1,.54,.055,.2,'#f2d9b7',.02);ball(.54,sy/2+.015,1.1,.05,.025,.035,palette.brass);
   box(-.4,-.15,1.48,.5,.43,.045,'#d5bfc6',.015);box(-.4,-.15,1.52,.46,.38,.03,'#fff4df',.008);plant(.55,-.34,1.48,.42);
  }
  break;}
 case 'sofa':case 'bench':{
  const sofa=product==='sofa';legs(2.8,sofa?1.52:.82,.3,.16);box(0,0,.23,2.9,sofa?1.64:.92,.38,palette.wood,.1,true);
  box(0,sofa?-.72:-.36,.55,2.9,.27,1.1,sofa?palette.cream:palette.wood,.1,!sofa);
  for(const x of [-1.3,1.3])box(x,0,.5,.28,sofa?1.55:.8,.65,sofa?palette.cream:palette.wood,.13,!sofa);
  for(const x of [-.65,.65]){cushion(x,.03,.61,1.18,sofa?1.17:.67,sofa?'#f0d9bc':palette.mint);if(sofa)box(x,-.54,.9,1.15,.29,.64,'#e9d0af',.13);}
  if(sofa)ball(-.87,-.32,1.18,.25,.17,.27,palette.pink);break;}
 case 'cushion':cushion(0,0,.05,.88,.88,palette.pink);break;
 case 'rug':box(0,0,.015,2.9,1.9,.075,palette.mint,.03);for(let y=-.8;y<.9;y+=.16)box(0,y,.09,2.67,.025,.015,'#c5dccc',.006);break;
 case 'bookshelf':case 'wardrobe':{
  const book=product==='bookshelf',height=2.65;box(0,-.37,.12,1.91,.15,height,palette.wood,.035,true);
  for(const x of [-.9,.9])box(x,0,.1,.15,.9,height,palette.wood,.04,true);
  for(const z of book?[.1,.9,1.7,2.65]:[.1,2.65])box(0,0,z,1.95,.96,.13,palette.wood,.035,true);
  if(book){const colors=['#ae839b','#91aa95','#d5b16d','#90aabb'];for(const z of [.24,1.04,1.84])for(let i=0;i<8;i++)box(-.71+i*.2,.09,z,.145,.55,.43+(i%3)*.09,colors[i%4],.016);}
  else{for(const x of [-.44,.44]){box(x,.43,.26,.83,.1,2.36,palette.cream,.04);box(x,.5,.64,.64,.025,1.65,'#e9d6b9',.018);ball(x<0?-.1:.1,.53,1.42,.035,.035,.08,palette.brass);}}
  break;}
 case 'nightstand':case 'toybox':{
  box(0,0,.08,.91,.9,product==='nightstand'?.87:.6,palette.cream,.09);box(0,0,product==='nightstand'?.95:.68,.98,.97,.13,palette.wood,.06,true);
  if(product==='nightstand'){box(0,.46,.34,.73,.05,.47,'#e8d2b2',.02);ball(0,.51,.58,.065,.025,.04,palette.brass);}else{ball(-.2,0,.87,.2,.2,.2,palette.pink);ball(.18,.05,.85,.18,.18,.18,palette.blue);}break;}
 case 'plant':plant(0,0,0);break;
 case 'flowerbed':box(0,0,0,1.9,1.9,.37,palette.wood,.07,true);box(0,0,.37,1.66,1.66,.07,palette.soil,.02);for(const x of [-.55,0,.55])for(const y of [-.5,.15,.6]){ball(x,y,.6,.16,.14,.22,palette.leaf);for(let i=0;i<5;i++)ball(x+Math.cos(i*1.26)*.12,y+Math.sin(i*1.26)*.12,.86,.09,.09,.055,palette.pink);ball(x,y,.89,.06,.06,.04,'#f4d48a');}break;
 case 'pond':ball(0,0,.04,1.4,1.4,.08,palette.water);for(let i=0;i<16;i++){const a=i*Math.PI/8;ball(Math.cos(a)*1.27,Math.sin(a)*1.27,.13,.22,.2,.16,i%2?'#dfd2b8':'#cbbb9e');}ball(.3,.2,.14,.17,.07,.035,'#edb18a');ball(-.4,-.4,.14,.25,.23,.025,palette.leaf);break;
 case 'bowl':ball(0,0,.2,.44,.44,.2,palette.blue);ball(0,0,.33,.34,.34,.035,palette.water);break;
 case 'lamp':case 'lantern':{
  ball(0,0,.08,.4,.4,.09,palette.brass);box(0,0,.13,.075,.075,1.8,palette.brass,.03);
  if(product==='lamp'){ball(0,0,1.95,.47,.47,.44,'#f2d8a6');ball(0,0,2.35,.05,.05,.055,palette.brass);}else{box(0,0,1.6,.54,.54,.7,'#f4d892',.09);box(0,0,2.3,.65,.65,.14,palette.mint,.06);for(const x of [-.24,.24])for(const y of [-.24,.24])box(x,y,1.58,.055,.055,.75,palette.brass,.02);}break;}
 case 'armchair':case 'ottoman':case 'diningchair':{
  const chair=product==='diningchair',otto=product==='ottoman',size=chair||otto?.88:1.8;legs(size*.88,size*.88,chair?.9:.35,.12);box(0,0,chair?.82:.3,size,size,.17,palette.wood,.05,true);
  cushion(0,0,chair?.98:.47,size*.93,size*.9,product==='armchair'?palette.mint:palette.pink);
  if(!otto){box(0,-size*.43,chair?1.15:.7,size,.2,chair?.85:1.25,chair?palette.wood:palette.mint,.1,!chair);if(!chair)for(const x of [-.8,.8])box(x,0,.65,.26,1.6,.7,palette.mint,.12);}
  break;}
 case 'diningtable':case 'coffeeTable':case 'picnicTable':{
  const picnic=product==='picnicTable',coffee=product==='coffeeTable',height=coffee?.8:1.4,sx=coffee?1.9:2.85,sy=coffee?.86:1.85;legs(sx-.12,sy-.12,height,.16);box(0,0,height,sx,sy,.18,palette.wood,.07,true);
  if(picnic)for(const y of [-1.28,1.28]){box(0,y,.7,2.8,.4,.13,palette.wood,.04,true);for(const x of [-1,1])box(x,y,0,.14,.3,.7,palette.wood,.02,true);}
  if(coffee){box(0,0,.25,1.7,.7,.12,palette.cream,.02);box(-.4,0,height+.18,.5,.45,.045,palette.mint,.015);}
  break;}
 case 'tvstand':case 'recordplayer':case 'coffeestation':case 'pantry':case 'shoeCabinet':case 'towelCabinet':case 'kitchencounter':case 'dishrack':{
  const wide=product==='tvstand',tall=product==='pantry'||product==='towelCabinet'||product==='dishrack',height=tall?2.5:1.05,sx=wide?2.85:1.85;
  box(0,0,.08,sx,.9,height,palette.wood,.055,true);box(0,0,height+.08,sx+.06,.96,.12,palette.cream,.04);
  for(const x of [-sx/4,sx/4]){box(x,.465,.18,sx/2-.08,.055,height-.18,product==='pantry'?'#b5c8c0':palette.cream,.025);ball(x<0?-.1:.1,.51,height*.6,.04,.025,.06,palette.brass);}
  if(product==='recordplayer'){box(0,0,1.25,1.45,.65,.14,'#ab7d59',.04,true);ball(-.2,0,1.41,.27,.27,.025,'#5b5554');box(.4,-.1,1.41,.035,.45,.045,palette.brass,.01);}
  if(product==='coffeestation'){box(-.3,0,1.26,.65,.54,.67,'#a0b4ad',.06);box(-.3,.25,1.48,.45,.1,.32,'#5c6863',.02);ball(.45,.12,1.3,.16,.16,.12,palette.cream);}
  if(product==='towelCabinet'||product==='dishrack'){for(const z of [.45,1.2,1.95]){box(0,.5,z,1.6,.13,.09,palette.wood,.01);for(const x of [-.5,0,.5]){if(product==='dishrack')ball(x,.35,z+.25,.19,.07,.22,palette.cream);else box(x,.4,z+.1,.42,.22,.25,['#e4d1bb',palette.blue,palette.pink][Math.round(x*2)+1],.07,false,true);}}}
  if(product==='kitchencounter'){box(.3,0,1.26,.65,.55,.04,'#cfa575',.02,true);box(.3,0,1.31,.3,.2,.04,palette.leaf,.015);}
  break;}
 case 'fridge':case 'washingMachine':case 'stove':case 'sinkunit':{
  const fridge=product==='fridge',washer=product==='washingMachine',sink=product==='sinkunit',height=fridge?2.85:1.5,depth=sink?.9:1.8;
  box(0,0,.05,1.85,depth,height,'#ede5d5',.1);box(0,depth/2+.018,.2,1.64,.07,height-.26,fridge?palette.mint:'#e3d6c2',.035);
  if(fridge){box(0,depth/2+.06,1.9,1.67,.04,.035,'#b0b6a7',.01);for(const z of [1.5,2.2])box(.62,depth/2+.12,z,.06,.06,.3,palette.brass,.025);}
  if(washer){ball(0,depth/2+.085,.85,.58,.06,.58,'#8f9f9a');ball(0,depth/2+.14,.85,.44,.03,.44,'#799a9f');ball(.1,depth/2+.175,.72,.3,.02,.15,'#bdccc3');}
  if(product==='stove'){box(0,.93,.32,1.48,.065,.9,'#65716b',.05);box(0,.98,.43,1.22,.025,.59,'#526560',.02);for(const x of [-.45,.45])for(const y of [-.45,.45]){ball(x,y,1.58,.3,.3,.035,'#6b7067');ball(x,y,1.62,.17,.17,.025,'#92927e');}}
  if(sink){box(0,0,1.55,1.95,1,.1,palette.wood,.025,true);box(-.3,0,1.64,.85,.65,.025,'#9caaa3',.05);box(-.3,0,1.665,.64,.46,.025,'#758f8f',.04);box(-.3,-.36,1.64,.05,.05,.5,palette.brass,.02);box(-.3,-.2,2.09,.05,.35,.06,palette.brass,.02);}
  else for(const x of [-.55,-.2,.2,.55])ball(x,depth/2+.09,height-.1,.07,.025,.07,palette.brass);
  break;}
 case 'television':{
  box(0,0,0,1.85,.85,.5,palette.wood,.05,true);box(0,-.03,.51,1.74,.6,1.15,palette.cream,.12);box(-.16,.295,.64,1.2,.055,.8,'#5f797b',.09);box(-.16,.33,.7,1.07,.025,.66,'#9eb9b2',.06);for(const z of [.8,1.3])ball(.64,.33,z,.08,.025,.08,palette.brass);break;}
 case 'coatRack':case 'mirrorStand':case 'birdbath':{
  box(0,0,.02,.85,.85,.13,palette.wood,.1,true);
  if(product==='birdbath'){box(0,0,.15,.2,.2,1,palette.cream,.07);ball(0,0,1.2,.45,.45,.14,palette.cream);ball(0,0,1.31,.34,.34,.025,palette.water);}
  else if(product==='mirrorStand'){box(0,-.1,.15,.83,.16,2.5,palette.wood,.1,true);box(0,.005,.4,.65,.035,2.02,'#b6d1cb',.06);}
  else{box(0,0,.15,.1,.1,2.6,palette.wood,.04,true);for(const z of [1.7,2.35]){box(0,0,z,.82,.09,.09,palette.wood,.03,true);box(.28,.04,z-.48,.4,.22,.5,palette.mint,.07,false,true);}}
  break;}
 case 'laundryBasket':case 'wateringCan':{
  box(0,0,.04,.83,.8,.7,product==='wateringCan'?palette.mint:'#cdb08b',.12,product==='laundryBasket');
  if(product==='laundryBasket')for(const x of [-.2,.2])box(x,0,.67,.4,.65,.26,x<0?palette.pink:palette.cream,.12,false,true);
  else{box(.36,0,.4,.17,.6,.08,palette.mint,.03);box(.36,.25,.4,.16,.08,.6,palette.mint,.03);box(-.4,0,.3,.15,.16,.4,palette.mint,.04);plant(.2,-.22,.76,.35);}break;}
 case 'vanity':case 'sewingDesk':{
  const sewing=product==='sewingDesk',depth=sewing?1.8:.85;legs(1.7,depth,1.1,.13);box(0,0,1.1,1.9,depth,.16,palette.wood,.05,true);
  if(sewing){box(0,-.1,1.26,.94,.55,.12,palette.cream,.035);box(.32,-.1,1.38,.2,.4,.65,palette.cream,.05);box(0,-.1,1.9,.8,.4,.16,palette.cream,.04);box(-.35,-.1,1.57,.08,.08,.33,palette.brass,.01);box(-.4,.38,1.27,.65,.55,.04,palette.pink,.01,false,true);}
  else{box(0,-.32,1.26,1.21,.12,1.5,palette.wood,.1,true);box(0,-.24,1.4,.99,.035,1.15,'#b9d1cc',.06);for(const x of [-.7,.7])ball(x,.1,1.38,.09,.09,.13,x<0?palette.pink:palette.blue);}
  break;}
 case 'bookCart':{
  for(const x of [-.35,.35])for(const y of [-.35,.35]){ball(x,y,.1,.1,.1,.1,'#7c867a');box(x,y,.16,.06,.06,1.1,palette.brass,.02);}
  for(const z of [.23,.8])box(0,0,z,.85,.85,.1,palette.wood,.03,true);for(let i=0;i<4;i++)box(-.25+i*.17,0,.34,.13,.53,.36,[palette.mint,palette.pink,palette.blue,palette.cream][i],.015);ball(.1,.1,1.01,.15,.15,.12,palette.cream);break;}
 case 'catTower':{
  box(0,0,.02,1.85,1.85,.15,palette.wood,.05,true);for(const [x,y,z] of [[-.5,-.4,1.5],[.5,.5,.9]]){box(x,y,.17,.22,.22,z,'#c9b596',.08);cushion(x,y,z+.17,.9,.9,palette.cream);}box(.35,-.4,.17,.9,.9,.65,palette.mint,.13);ball(.35,.07,.45,.23,.035,.23,'#7e9e8b');break;}
 case 'greenhouse':{
  for(const x of [-1.35,1.35])for(const y of [-.85,.85])box(x,y,0,.08,.08,2.45,palette.mint,.025);
  for(const z of [.3,1.2,2.2]){box(0,0,z,2.85,1.8,.1,palette.wood,.025,true);for(const x of [-.85,0,.85])plant(x,0,z+.1,.65);}box(0,-.8,2.4,2.85,.09,.2,palette.mint,.03);break;}
 case 'barbecue':{
  legs(1.5,1.3,1,.13);box(0,0,.85,1.75,1.55,.5,'#74877c',.12);box(0,0,1.36,1.55,1.35,.06,'#4f5c53',.02);for(let x=-.6;x<.7;x+=.16)box(x,0,1.42,.035,1.25,.025,palette.brass,.008);for(const x of [-.4,.3])ball(x,0,1.48,.18,.3,.05,'#dba27c');break;}
 case 'pottedTree':{
  box(0,0,.04,1.1,1.1,.95,palette.cream,.16);box(0,0,.99,.9,.9,.04,palette.soil,.02);box(0,0,1.03,.16,.16,1.4,palette.wood,.04,true);for(const [x,y,z] of [[-.35,0,2.2],[.35,.15,2.4],[0,-.35,2.7]]){ball(x,y,z,.58,.5,.57,palette.leaf);ball(x+.2,y+.4,z,.1,.1,.13,'#e6cc76');}break;}
 case 'flowerCart':{
  for(const x of [-.75,.75])for(const y of [-.65,.65])ball(x,y,.23,.09,.25,.25,palette.wood);box(0,0,.38,1.8,1.65,.5,palette.wood,.06,true);box(0,-.86,.7,1.6,.08,.85,palette.mint,.03);for(const x of [-.5,0,.5]){plant(x,0,.88,.65);ball(x,.05,1.68,.2,.18,.12,palette.pink);}break;}

 case 'mealPlate':case 'toastPlate':case 'fruitPlate':case 'cakePlate':case 'teaSet':case 'soupBowl':{
  ball(0,0,.035,.31,.31,.035,palette.cream);
  if(product==='mealPlate'){ball(-.1,0,.09,.12,.15,.065,'#fff4da');ball(.12,-.08,.085,.11,.09,.04,'#c68d65');for(const y of [.04,.14])ball(.12,y,.09,.1,.04,.035,palette.leaf);}
  if(product==='toastPlate'){box(0,0,.075,.4,.4,.07,'#c99d69',.025);box(0,0,.145,.32,.32,.015,'#e3be82',.02);box(0,0,.16,.1,.1,.025,'#f1da93',.015);}
  if(product==='fruitPlate')for(const [x,y,c] of [[-.12,0,'#d68e86'],[.12,0,'#e6c67c'],[0,.14,'#a9b484']])ball(x,y,.12,.09,.09,.085,c);
  if(product==='cakePlate'){box(0,0,.07,.34,.34,.22,'#edcfb1',.03);box(0,0,.29,.35,.35,.06,'#fff2d9',.02);ball(0,0,.39,.08,.07,.08,palette.pink);}
  if(product==='teaSet')for(const x of [-.15,.15]){ball(x,0,.13,.11,.11,.1,palette.cream);ball(x,0,.215,.08,.08,.012,'#a67d56');}
  if(product==='soupBowl'){ball(0,0,.12,.22,.22,.12,palette.cream);ball(0,0,.22,.18,.18,.016,'#d5b477');for(const x of [-.07,.07])ball(x,0,.24,.03,.035,.01,palette.leaf);}
  break;}
 default:return null;
 }
 const floorZ=Math.min(...modelVertices.map(p=>p[2]));
 if(Math.abs(floorZ)>1e-9)for(const face of faces)for(const p of face.vertices){p.y+=floorZ*20;p.depth-=floorZ;}
 const contacts=modelVertices.filter(p=>p[2]<=floorZ+.025).map(p=>rot([p[0],p[1],p[2]-floorZ]));
 const ground=[[-fw/2,-fd/2],[fw/2,-fd/2],[fw/2,fd/2],[-fw/2,fd/2]].map(([u,v])=>({x:(u-v)*20,y:(u+v)*10}));
 const points=faces.flatMap(f=>f.vertices).concat(ground),minX=Math.min(...points.map(p=>p.x))-1,maxX=Math.max(...points.map(p=>p.x))+1,minY=Math.min(...points.map(p=>p.y))-1,maxY=Math.max(...points.map(p=>p.y))+1;
 const width=maxX-minX,height=maxY-minY;faces.sort((a,b)=>a.depth-b.depth);
 const polygon=f=>`<polygon points="${f.vertices.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')}" fill="${f.color}" stroke="${f.color}" stroke-width=".12"/>${f.grain?`<polygon points="${f.vertices.map(p=>`${p.x.toFixed(3)},${p.y.toFixed(3)}`).join(' ')}" fill="url(#wood-${product}-${turn})" opacity=".24"/>`:''}`;
 const svg=`<span class="furniture-art iso-furniture projected-furniture" data-model="${product}" data-direction="${turn}" aria-hidden="true"><svg viewBox="${minX} ${minY} ${width} ${height}" preserveAspectRatio="xMidYMax meet"><defs><pattern id="wood-${product}-${turn}" width="25" height="25" patternUnits="userSpaceOnUse" patternTransform="matrix(1 .5 -1 .5 0 0)"><rect width="25" height="25" fill="#c8a078"/><path d="M0 3Q7 1 14 3T25 3M0 7Q9 9 16 7T25 7M0 11Q8 8 17 11T25 11M0 16Q6 18 15 16T25 16M0 21Q10 18 18 21T25 21" fill="none" stroke="#8f6542" stroke-width=".35"/><ellipse cx="16" cy="12" rx="4" ry="1.2" fill="none" stroke="#9e7452" stroke-width=".35"/></pattern><filter id="texture-${product}-${turn}"><feTurbulence type="fractalNoise" baseFrequency=".75" numOctaves="2" seed="7" result="grain"/><feColorMatrix in="grain" type="saturate" values="0"/><feComponentTransfer><feFuncA type="linear" slope=".045"/></feComponentTransfer><feBlend in="SourceGraphic" mode="multiply"/></filter></defs><g filter="url(#texture-${product}-${turn})">${faces.map(polygon).join('')}</g></svg></span>`;
 const result={width,height,anchorX:-minX/width,anchorY:-minY/height,ground,contacts,faces,svg};cache.set(key,result);return result;
}
