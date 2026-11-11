import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {partitionLegacyRoom} from '../shared/room-storage.js';
const repo=path.resolve('releases/APP'),git=args=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),'-C',repo,...args],{encoding:'utf8',maxBuffer:32*1024*1024});
const commit=git(['rev-parse','origin/main']).trim(),root=path.resolve('.data/storage-v2/TwoPlace/remote-data/couples');
const paths=git(['ls-tree','-r','--name-only',commit,'--','TwoPlace/remote-data/couples']).split(/\r?\n/).filter(name=>/^TwoPlace\/remote-data\/couples\/\d{12}\/room\.json$/.test(name));
const plans=[],report={sourceCommit:commit,originalsModified:false,deployed:false,rooms:[]};
for(const source of paths){
 const text=git(['show',commit+':'+source]),room=JSON.parse(text);
 if(room.storageVersion===2)continue;
 const documents=partitionLegacyRoom(room);
 documents['backups/storage-v2_'+commit+'.json']=room;
 const roomRoot=path.join(root,room.code);
 for(const [name,data] of Object.entries(documents))plans.push({target:path.join(roomRoot,name),text:JSON.stringify(data,null,2)+'\n'});
 report.rooms.push({code:room.code,sourceSha256:createHash('sha256').update(text).digest('hex'),sourceBytes:Buffer.byteLength(text),coreBytes:Buffer.byteLength(JSON.stringify(documents['room.json'],null,2)),files:Object.keys(documents),heartEntries:room.petHome.heartHistory?.length||0,clearEntries:room.petHome.adventure?.history?.length||0,events:room.state.events.length,notes:room.state.notes.length,furniture:room.petHome.items.length});
}
// Validation of all rooms completes before any output is written. Originals are read only.
for(const plan of plans){fs.mkdirSync(path.dirname(plan.target),{recursive:true});fs.writeFileSync(plan.target,plan.text);}
fs.mkdirSync('.data/storage-v2',{recursive:true});fs.writeFileSync('.data/storage-v2/partition-report.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify({output:root,rooms:report.rooms.length,files:plans.length,originalsModified:false,deployed:false},null,2));
