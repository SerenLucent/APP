import { createServer } from 'node:http';
import { createReadStream, statSync } from 'node:fs';
import { resolve, extname, sep } from 'node:path';
import { createRoomApi } from './api.js';

const api = createRoomApi();
const root = resolve('dist');
const mime = {'.html':'text/html; charset=utf-8','.js':'text/javascript; charset=utf-8','.css':'text/css; charset=utf-8','.svg':'image/svg+xml','.png':'image/png','.webmanifest':'application/manifest+json'};
const server = createServer((req,res) => api.handle(req,res,() => {
  if (!['GET','HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
  let file;
  try {
    const path = decodeURIComponent(new URL(req.url,'http://localhost').pathname);
    file = resolve(root, `.${path === '/' ? '/index.html' : path}`);
    if (!file.startsWith(root + sep)) { res.writeHead(403); res.end(); return; }
    if (!statSync(file).isFile()) throw new Error('missing');
  } catch { res.writeHead(404); res.end('Not found'); return; }
  res.writeHead(200, {'Content-Type':mime[extname(file)] || 'application/octet-stream','X-Content-Type-Options':'nosniff','Cache-Control':'no-cache'});
  if (req.method === 'HEAD') res.end(); else createReadStream(file).pipe(res);
}));
server.listen(Number(process.env.PORT || 3000),'0.0.0.0',() => console.log(`TwoPlace: http://localhost:${server.address().port}`));
function stop() { server.close(() => { api.close(); process.exit(0); }); }
process.on('SIGINT',stop);
process.on('SIGTERM',stop);
