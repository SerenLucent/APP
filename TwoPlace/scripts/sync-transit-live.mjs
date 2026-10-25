import {copyFile,mkdir} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import path from 'node:path';
const root=fileURLToPath(new URL('../',import.meta.url));
const source=process.env.TRANSITLIVE_SOURCE||path.resolve(root,'../TransitLive');
const destination=path.join(root,'public/transit-live');
await mkdir(path.join(destination,'assets'),{recursive:true});
for(const file of ['index.html','style.css','app.js','lines.js','line-search.js','live.js','assets/train-line2-short.png'])await copyFile(path.join(source,file),path.join(destination,file));
console.log('Transit Live web files synced (7 files).');
