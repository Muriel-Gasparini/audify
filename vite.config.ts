import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import checker from 'vite-plugin-checker';
import { resolve } from 'path';
import { copyFileSync, mkdirSync } from 'fs';
import type { UserConfig } from 'vite';

function copyStaticAssets() {
  return {
    name: 'copy-static-assets',
    writeBundle() {
      mkdirSync(resolve(__dirname, 'dist/icons'), { recursive: true });

      copyFileSync(
        resolve(__dirname, 'manifest.json'),
        resolve(__dirname, 'dist/manifest.json')
      );

      const icons = ['icon16.png', 'icon48.png', 'icon128.png'];
      icons.forEach(icon => {
        copyFileSync(
          resolve(__dirname, `public/icons/${icon}`),
          resolve(__dirname, `dist/icons/${icon}`)
        );
      });

      console.log('✓ Manifest and icons copied to dist/');
    }
  };
}

export default defineConfig(({ mode }) => {
  const isProduction = mode === 'production';

  const config: UserConfig = {
    plugins: [
      react(),
      checker({
        typescript: true,
        enableBuild: true,
      }),
      copyStaticAssets()
    ],
    base: './',
    build: {
      outDir: 'dist',
      emptyOutDir: true,
      rollupOptions: {
        input: {
          popup: resolve(__dirname, 'popup.html'),
          content: resolve(__dirname, 'src/content/index.ts'),
        },
        output: {
          entryFileNames: (chunkInfo) => {
            if (chunkInfo.name === 'content') {
              return 'content.js';
            }
            return '[name].js';
          },
          chunkFileNames: 'chunks/[name]-[hash].js',
          assetFileNames: (assetInfo) => {
            if (assetInfo.name && assetInfo.name.endsWith('.css')) {
              return 'assets/[name][extname]';
            }
            return 'assets/[name]-[hash][extname]';
          },
          manualChunks: undefined,
        },
      },
      sourcemap: !isProduction,
      minify: isProduction ? 'terser' : false,
      reportCompressedSize: false,
      chunkSizeWarningLimit: 1000,
    },
    resolve: {
      alias: {
        '@': resolve(__dirname, 'src'),
      },
    },
  };

  if (isProduction && config.build) {
    config.build.terserOptions = {
      compress: {
        drop_console: true,
        drop_debugger: true,
        pure_funcs: ['console.log', 'console.debug', 'console.info'],
        passes: 2,
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    };
  }

  return config;
});
