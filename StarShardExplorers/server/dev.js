import {createServer as createViteServer} from 'vite';
import {createGameServer} from './index.js';
const api=createGameServer();await new Promise(r=>api.listen(5191,'127.0.0.1',r));
const vite=await createViteServer();await vite.listen();vite.printUrls();
async function stop(){await vite.close();api.close(()=>process.exit());}process.on('SIGINT',stop);process.on('SIGTERM',stop);
