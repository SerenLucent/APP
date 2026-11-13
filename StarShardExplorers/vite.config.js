import {defineConfig} from 'vite';
export default defineConfig({base:process.env.VITE_BASE_PATH||'/',server:{host:'127.0.0.1',port:5190,strictPort:true,proxy:{'/api':'http://127.0.0.1:5191'}},build:{rollupOptions:{input:{main:'index.html',menu:'adventure-menu.html',game:'adventure.html'}}}});
