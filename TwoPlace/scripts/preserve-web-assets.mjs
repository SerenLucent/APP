// Keep public app chunks referenced by cached entry pages across Pages deployments.
import fs from 'node:fs/promises';
const base='https://serenlucent.github.io/APP/TwoPlace/';
const folder='.asset-history';
await fs.mkdir(folder,{recursive:true});
const queued=new Set(),queue=[];
function discover(text){
  for(const match of text.matchAll(/["'](?:\/APP\/TwoPlace\/assets\/|\.\/)?([A-Za-z0-9_-]+\.(?:js|css))["']/g)){
    const name=match[1];if(!queued.has(name)){queued.add(name);queue.push(name);}
  }
}
try{
  const response=await fetch(base+'?asset-backup='+Date.now(),{signal:AbortSignal.timeout(10000)});
  if(!response.ok)throw new Error('Previous page unavailable');
  discover(await response.text());
  for(let i=0;i<queue.length&&i<50;i++){
    const name=queue[i],response=await fetch(base+'assets/'+name,{signal:AbortSignal.timeout(10000)});
    if(!response.ok)continue;
    const body=await response.text();await fs.writeFile(folder+'/'+name,body);
    if(name.endsWith('.js'))discover(body);
  }
  console.log('Preserved public app assets:',queue.length);
}catch{console.log('Previous website unavailable; keeping already cached assets.');}
