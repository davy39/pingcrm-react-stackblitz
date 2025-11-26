import { defineConfig } from 'vite';
import laravel from 'laravel-vite-plugin';
import react from '@vitejs/plugin-react';

const isStackBlitz = process.env.STACKBLITZ === 'true';

export default defineConfig({
  server: {
    // Configuration spécifique StackBlitz
    hmr: { clientPort: isStackBlitz ? 443 : undefined },
    port: 5173,
    strictPort: true,
    proxy: {
      // Redirige les requêtes Laravel vers le serveur PHP Wasm (port 3000)
      // Sauf les assets gérés par Vite
      '^(?!/@vite|/@id|/node_modules|/resources|/assets|/@react-refresh).*': {
        target: 'http://localhost:3000',
        changeOrigin: true,
        secure: false,
      }
    }
  },
  plugins: [
    laravel({
        input: ['resources/css/app.css', 'resources/js/app.tsx'],
        refresh: true,
    }), 
    react()
  ]
});