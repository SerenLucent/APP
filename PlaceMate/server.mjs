import http from 'node:http';
import {readFile} from 'node:fs/promises';
import path from 'node:path';
const root=process.cwd();
const publicFiles=new Set(['/index.html','/app.js','/cloud-client.js','/cloud-store.js','/naver-map.js','/style.css','/icon.svg','/manifest.webmanifest','/sw.js']);
const types={'.html':'text/html; charset=utf-8','.css':'text/css','.js':'text/javascript','.svg':'image/svg+xml','.webmanifest':'application/manifest+json'};
http.createServer(async(req,res)=>{try{if(!['GET','HEAD'].includes(req.method)){res.writeHead(405).end();return;}const url=new URL(req.url,'http://localhost');const pathname=decodeURIComponent(url.pathname==='/'?'/index.html':url.pathname);if(!publicFiles.has(pathname)){res.writeHead(404).end('Not found');return;}const file=path.resolve(root,'.'+pathname);const data=await readFile(file);res.writeHead(200,{'Content-Type':types[path.extname(file)]||'application/octet-stream','Cache-Control':'no-cache'}).end(req.method==='HEAD'?undefined:data);}catch{res.writeHead(404).end('Not found');}}).listen(Number(process.env.PORT||4173),'0.0.0.0',()=>console.log('Local: http://localhost:'+(process.env.PORT||4173)));

