import {createServer} from 'node:http';
import {readFile} from 'node:fs/promises';
import {resolve,extname,sep} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createPlayerStore} from './store.js';
export function createGameServer({database=process.env.DATA_PATH||'data/players.sqlite',staticDir=resolve('dist')}={}){
 const store=createPlayerStore(database),rates=new Map();
 const server=createServer(async(req,res)=>{
  const json=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(data));};
  try{
   const url=new URL(req.url,'http://localhost');
   if(url.pathname.startsWith('/api/')){
    const origin=req.headers.origin,allowed=new Set([process.env.PUBLIC_ORIGIN,'http://'+req.headers.host,'https://'+req.headers.host,'http://127.0.0.1:5190','http://localhost:5190']);
    if(origin&&!allowed.has(origin))return json(403,{error:'허용되지 않은 접속 주소예요.'});
    if(req.method==='OPTIONS')return json(405,{error:'같은 사이트에서 요청해 주세요.'});
    const token=(req.headers.authorization||'').replace(/^Bearer /,'');
    let body={};if(req.method==='POST'){let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>262144)return json(413,{error:'저장 요청이 너무 커요.'});chunks.push(chunk);}try{body=JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{return json(400,{error:'잘못된 저장 요청이에요.'});}}
    if(url.pathname==='/api/player'&&req.method==='POST'){
     const ip=req.socket.remoteAddress,key=ip+':'+Math.floor(Date.now()/3600000),count=rates.get(key)||0;
     if(count>=100)return json(429,{error:'잠시 후 다시 시도해 주세요.'});if(rates.size>10000)rates.clear();rates.set(key,count+1);
     return json(200,store.create(token));
    }
    if(url.pathname==='/api/save'&&req.method==='GET')return json(200,store.get(token));
    if(url.pathname==='/api/action'&&req.method==='POST')return json(200,store.action(token,body));
    if(url.pathname==='/api/history'&&req.method==='GET')return json(200,store.history(token,url.searchParams.get('start'),url.searchParams.get('end')));
    if(url.pathname==='/api/health')return json(200,{ok:true,game:'StarShardExplorers'});
    return json(404,{error:'요청한 기능을 찾을 수 없어요.'});
   }
   if(!['GET','HEAD'].includes(req.method))return json(405,{error:'지원하지 않는 요청이에요.'});
   const file=resolve(staticDir,'.'+decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname));if(!file.startsWith(resolve(staticDir)+sep))return json(403,{error:'잘못된 경로예요.'});
   const mime={'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.png':'image/png','.webp':'image/webp','.mp3':'audio/mpeg','.ico':'image/x-icon','.json':'application/json'};
   const data=await readFile(file);res.writeHead(200,{'Content-Type':mime[extname(file)]||'application/octet-stream','Cache-Control':file.includes(sep+'assets'+sep)?'public,max-age=31536000,immutable':'no-cache','X-Content-Type-Options':'nosniff','Referrer-Policy':'same-origin'});res.end(req.method==='HEAD'?undefined:data);
  }catch(e){const status=e.code==='ENOENT'?404:e.status||500;json(status,{error:status===500?'저장 서버에 문제가 있어요. 잠시 후 다시 시도해 주세요.':e.message});}
 });
 server.on('close',()=>store.close());return server;
}
if(process.argv[1]&&resolve(process.argv[1])===fileURLToPath(import.meta.url)){const port=Number(process.env.PORT||5190);createGameServer().listen(port,'0.0.0.0',()=>console.log('별조각 탐험대 http://localhost:'+port));}
