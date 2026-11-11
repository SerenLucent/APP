// Copy-only first migration step. Never edits room.json or deletes old archives.
import fs from 'node:fs';
import path from 'node:path';
import {execFileSync} from 'node:child_process';
import {createHash} from 'node:crypto';
import {fileURLToPath} from 'node:url';

const DAY=86400000;
const canonical=value=>value===null||typeof value!=='object'?JSON.stringify(value):Array.isArray(value)?'['+value.map(canonical).join(',')+']':'{'+Object.keys(value).sort().map(key=>JSON.stringify(key)+':'+canonical(value[key])).join(',')+'}';
export function archiveDate(at){
 if(!Number.isFinite(at))throw Error('기록의 날짜가 올바르지 않습니다.');
 const date=new Date(at+9*3600000);
 if(!Number.isFinite(date.getTime()))throw Error('기록의 날짜가 올바르지 않습니다.');
 const year=String(date.getUTCFullYear()),month=String(date.getUTCMonth()+1).padStart(2,'0');
 if(!/^\d{4}$/.test(year))throw Error('기록의 연도가 올바르지 않습니다.');
 const start=1+Math.floor((date.getUTCDate()-1)/3)*3;
 return {year,month,day:String(start).padStart(2,'0'),start:Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),start)-9*3600000,end:Math.min(Date.UTC(date.getUTCFullYear(),date.getUTCMonth(),start+3),Date.UTC(date.getUTCFullYear(),date.getUTCMonth()+1,1))-9*3600000};
}
export function splitHistory(room){
 if(!/^\d{12}$/.test(room.code))throw Error('방 코드는 숫자 12자리여야 합니다.');
 const files=new Map();
 for(const [kind,entries] of [['heart',room.petHome?.heartHistory??[]],['clear',room.petHome?.adventure?.history??[]]]){
  if(!Array.isArray(entries))throw Error(kind+' 이력이 배열이 아닙니다.');
  for(const entry of entries){
   if(!entry||typeof entry!=='object')throw Error('기록 형식이 올바르지 않습니다.');
   const bucket=archiveDate(entry.at),relative=`${room.code}/history/${bucket.year}/${bucket.month}/${kind}_${bucket.year}_${bucket.month}_${bucket.day}.json`;
   if(!files.has(relative))files.set(relative,{schemaVersion:1,kind,timezone:'Asia/Seoul',start:new Date(bucket.start+9*3600000).toISOString().slice(0,10),endExclusive:new Date(bucket.end+9*3600000).toISOString().slice(0,10),entries:[]});
   files.get(relative).entries.push(structuredClone(entry));
  }
 }
 return files;
}
// Preserve genuine identical records, while re-running the copy does not duplicate them.
export function mergeArchive(previous,next){
 if(!previous)return next;
 for(const key of ['schemaVersion','kind','timezone','start','endExclusive'])if(previous[key]!==next[key])throw Error('기존 이력 파일의 기간 또는 종류가 다릅니다.');
 if(!Array.isArray(previous.entries))throw Error('기존 이력 파일 형식이 올바르지 않습니다.');
 const counts=new Map(),seen=new Map(),entries=[...previous.entries];
 for(const entry of entries){const key=canonical(entry);counts.set(key,(counts.get(key)||0)+1);}
 for(const entry of next.entries){const key=canonical(entry),count=(seen.get(key)||0)+1;seen.set(key,count);if(count>(counts.get(key)||0))entries.push(entry);}
 return {...next,entries:entries.sort((a,b)=>a.at-b.at)};
}
export function copyArchives(sources,output){
 const root=path.resolve(output),plans=new Map(),rooms=[];
 // Validate every source and destination before writing any archive.
 for(const {text,source} of sources){
  const room=JSON.parse(text),files=splitHistory(room);
  for(const [relative,next] of files){
   const target=path.resolve(root,relative);
   if(!target.startsWith(root+path.sep))throw Error('저장 경로가 잘못되었습니다.');
   const previous=plans.get(target)?.data??(fs.existsSync(target)?JSON.parse(fs.readFileSync(target,'utf8')):null);
   plans.set(target,{relative,data:mergeArchive(previous,next)});
  }
  rooms.push({code:room.code,source,sourceSha256:createHash('sha256').update(text).digest('hex'),heartEntries:room.petHome?.heartHistory?.length??0,clearEntries:room.petHome?.adventure?.history?.length??0,files:files.size});
 }
 for(const [target,{data}] of plans){fs.mkdirSync(path.dirname(target),{recursive:true});const temporary=target+'.copy-tmp';fs.writeFileSync(temporary,JSON.stringify(data,null,2)+'\n');fs.renameSync(temporary,target);}
 const report={mode:'copy-only',originalsModified:false,createdAt:new Date().toISOString(),rooms,files:[...plans.values()].map(({relative,data})=>({path:relative,entries:data.entries.length}))};
 fs.mkdirSync(root,{recursive:true});fs.writeFileSync(path.join(root,'copy-report.json'),JSON.stringify(report,null,2)+'\n');return report;
}
function main(){
 const args=process.argv.slice(2),arg=name=>{const i=args.indexOf(name);return i<0?null:args[i+1];};
 const output=arg('--output')||'.data/history-split/TwoPlace/remote-data/couples';let sources;
 if(arg('--source')){
  const root=path.resolve(arg('--source'));
  sources=fs.readdirSync(root,{withFileTypes:true}).filter(e=>e.isDirectory()&&/^\d{12}$/.test(e.name)).map(e=>path.join(root,e.name,'room.json')).filter(file=>fs.existsSync(file)).map(file=>({source:file,text:fs.readFileSync(file,'utf8')}));
 }else{
  const repo=path.resolve(arg('--repo')||'releases/APP'),ref=arg('--git-ref')||'origin/main';
  const git=args=>execFileSync('git',['-c','safe.directory='+repo.replaceAll('\\','/'),'-C',repo,...args],{encoding:'utf8',maxBuffer:32*1024*1024});
  const commit=git(['rev-parse','--verify',ref+'^{commit}']).trim();
  sources=git(['ls-tree','-r','--name-only',commit,'--','TwoPlace/remote-data/couples']).split(/\r?\n/).filter(file=>/^TwoPlace\/remote-data\/couples\/\d{12}\/room\.json$/.test(file)).map(file=>({source:commit+':'+file,text:git(['show',commit+':'+file])}));
 }
 if(!sources.length)throw Error('복사할 방 JSON이 없습니다.');
 const report=copyArchives(sources,output);
 console.log(JSON.stringify({output:path.resolve(output),rooms:report.rooms.length,files:report.files.length,heartEntries:report.rooms.reduce((n,r)=>n+r.heartEntries,0),clearEntries:report.rooms.reduce((n,r)=>n+r.clearEntries,0),originalsModified:false},null,2));
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url))main();
