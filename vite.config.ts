import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';

// Plugin para copiar manifest.json e ícones para dist/
function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    writeBundle() {
      // Cria diretório de ícones se não existir
      mkdirSync(resolve(__dirname, 'dist/icons'), { recursive: true });

      // Copia manifest.json
      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );

      // Copia ícones
      const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
      icons.forEach(icon => {
        copyFileSync(
          resolve(__dirname, `public/icons/${icon}`),
          resolve(__dirname, `dist/icons/${icon}`)
        );
      });

      console.log('✓ Manifest e ícones copiados para dist/');
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react(), copyStaticAssets()],
  base: './', // Usa paths relativos para extensões Chrome
  build: {
    outDir: 'dist',
    emptyOutDir: true, // Agora pode limpar dist pois vamos copiar tudo
    rollupOptions: {
      input: {
        popup: resolve(__dirname, 'popup.html'),
        content: resolve(__dirname, 'src/content/index.ts'),
      },
      output: {
        entryFileNames: (chunkInfo) => {
          // content/index.ts -> content.js
          if (chunkInfo.name === 'content') {
            return 'content.js';
          }
          // Para outros entry points, usa o nome padrão
          return '[name].js';
        },
        chunkFileNames: 'chunks/[name]-[hash].js',
        assetFileNames: (assetInfo) => {
          // CSS vai para assets/
          if (assetInfo.name && assetInfo.name.endsWith('.css')) {
            return 'assets/[name][extname]';
          }
          return 'assets/[name]-[hash][extname]';
        },
      },
    },
    sourcemap: false,
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: false, // Mantém console.log para debug
      },
    },
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
    },
  },
});
