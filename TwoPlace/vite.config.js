import { defineConfig } from 'vite';
import { createRoomApi } from './server/api.js';

export default defineConfig({
  base: process.env.VITE_BASE_PATH || '/',
  build: {rollupOptions:{input:{main:'index.html',admin:'admin.html',demo:'demo.html'}}},
  server: { host: '0.0.0.0', port: 5173, strictPort: true, watch: { ignored: ['**/.data/**', '**/android/**', '**/releases/**'] } },
  plugins: [{
    name: 'twoplace-rooms',
    configureServer(server) {
      const api = createRoomApi();
      server.middlewares.use(api.handle);
      server.httpServer?.once('close', () => api.close());
    },
    configurePreviewServer(server) {
      const api = createRoomApi();
      server.middlewares.use(api.handle);
      server.httpServer?.once('close', () => api.close());
    },
  }],
});
