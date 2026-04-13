import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';
import { resolve } from 'path';

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src'),
      '@core': resolve(__dirname, 'src/core'),
      '@shared': resolve(__dirname, 'src/shared'),
      '@modules': resolve(__dirname, 'src/modules'),
    },
  },
  server: {
    host: true,
    port: 3000,
    allowedHosts: ['efectivo360.test'],
    hmr: {
      clientPort: 80, // IMPORTANTE: El navegador hablará con el puerto 80 del proxy
    },
    proxy: {
      '/api': {
        target: process.env.VITE_API_URL || 'http://api.efectivo360.test',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, ''),
      },
    },
  },
  build: {
    target: 'esnext',
    outDir: 'dist',
    sourcemap: true,
  },
});
