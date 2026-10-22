import fs from 'node:fs';
const root=new URL('../',import.meta.url);
const read=name=>fs.readFileSync(new URL(name,root),'utf8');
fs.writeFileSync(new URL('apps-script/Code.gs',root),'// GENERATED: paste this complete file into the PlaceMate Apps Script project.\n'+read('apps-script/PlaceMate.gs')+'\n'+read('apps-script/Naver.gs'));
console.log('Built Apps Script: apps-script/Code.gs');
