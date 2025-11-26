import { defineConfig, loadEnv } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const phpWatchPlugin = () => ({
  name: 'php-watch-reload',
  handleHotUpdate({ file, server }) {
      if (file.endsWith('.php')) {
          console.log(`🔥 PHP modifié : ${file} -> Rechargement...`);
          server.ws.send({ type: 'full-reload' });
      }
  }
});

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, process.cwd(), '');
    const isStackBlitz = env.APP_URL?.includes('webcontainer.io')
    return {
        server: {
            host: '0.0.0.0',
            port: 5173,
            strictPort: true,
            hmr: {
              host: isStackBlitz ? new URL(env.APP_URL).host : undefined,
              clientPort: isStackBlitz ? 443 : undefined,
              protocol: isStackBlitz ? 'wss' : 'ws' 
            },
            proxy: {
                '^(?!/@vite|/@id|/node_modules|/resources|/assets|/@react-refresh).*': {
                    target: 'http://localhost:3000',
                    changeOrigin: false,
                    secure: false,
                    xfwd: true
                }
            }
        },
        plugins: [
            laravel({
                input: ['resources/css/app.css', 'resources/js/app.tsx'],
                refresh: true,
            }),
            react(),
            phpWatchPlugin() 
        ],
    };
});