import {mkdir,copyFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const out=path.join(root,'dist');
await mkdir(out,{recursive:true});
const files=['index.html','app.js','cloud-client.js','cloud-store.js','naver-map.js','style.css','icon.svg','manifest.webmanifest','sw.js'];
for(const name of files)await copyFile(path.join(root,name),path.join(out,name));
console.log('Built PlaceMate web: '+out);
