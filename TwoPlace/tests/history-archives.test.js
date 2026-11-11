import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import {archiveDate,splitHistory,mergeArchive,copyArchives} from '../scripts/copy-history-archives.mjs';
const at=day=>Date.parse(day+'T00:00:00+09:00');
test('three-day archive buckets use Korean dates and separate months, years and leap days',()=>{
 assert.equal(archiveDate(at('2026-11-11')).day,'10');
 assert.equal(archiveDate(at('2026-11-13')-1).day,'10');
 assert.equal(archiveDate(at('2026-11-13')).day,'13');
 assert.equal(archiveDate(at('2027-01-01')-1).year,'2026');
 assert.equal(archiveDate(at('2027-01-01')).month,'01');
 assert.equal(archiveDate(at('2028-02-29')).end,at('2028-03-01'));
 assert.throws(()=>archiveDate(NaN));
});
test('copy preserves exact rows including same-time identical events, replay is idempotent and only adds new rows',()=>{
 const entry={at:at('2026-11-11'),amount:1,label:'하트'},room={code:'123456789012',petHome:{heartHistory:[entry,entry],adventure:{history:[{at:at('2026-10-31'),runId:'run'}]}}};
 const original=JSON.stringify(room),files=splitHistory(room);
 assert.equal(JSON.stringify(room),original);assert.equal(files.size,2);
 const heart=files.get('123456789012/history/2026/11/heart_2026_11_10.json');assert.equal(heart.entries.length,2);
 assert.equal(mergeArchive(heart,heart).entries.length,2);
 assert.equal(mergeArchive(heart,{...heart,entries:[...heart.entries,{...entry,amount:5}]}).entries.length,3);
 assert.equal(mergeArchive(heart,{...heart,entries:[]}).entries.length,2);
});
test('disk migration never edits original and rerunning copies no duplicates',()=>{
 fs.mkdirSync('.data',{recursive:true});
 const root=fs.mkdtempSync(path.resolve('.data/history-archive-test-'));
 try{
  const room={code:'123456789012',petHome:{heartHistory:[{at:at('2026-11-11'),amount:1}],adventure:{history:[]}}},source=path.join(root,'room.json'),text=JSON.stringify(room);
  fs.writeFileSync(source,text);const out=path.join(root,'out'),sources=[{source,text}];
  copyArchives(sources,out);copyArchives(sources,out);
  assert.equal(fs.readFileSync(source,'utf8'),text);
  const saved=JSON.parse(fs.readFileSync(path.join(out,'123456789012/history/2026/11/heart_2026_11_10.json')));
  assert.equal(saved.entries.length,1);
  assert.throws(()=>copyArchives([{source,text:JSON.stringify({...room,petHome:{heartHistory:[{at:'invalid'}]}})}],out));
  assert.equal(JSON.parse(fs.readFileSync(path.join(out,'123456789012/history/2026/11/heart_2026_11_10.json'))).entries.length,1);
 }finally{fs.rmSync(root,{recursive:true,force:true});}
});
