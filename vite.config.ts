import { defineConfig, loadEnv } from 'vite';
import vue from '@vitejs/plugin-vue';
import { VitePWA } from 'vite-plugin-pwa';
import { resolve } from 'path';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const apiUrl = env.VITE_API_PROXY_URL || 'http://api.efectivo360.test';

  return {
    plugins: [
      vue(),
      VitePWA({
        registerType: 'autoUpdate',
        includeAssets: ['assets/efectivo360/logo-mark.svg'],
        manifest: {
          name: 'Efectivo 360 — ERP/POS',
          short_name: 'Efectivo360',
          description: 'Plataforma de gestión financiera, inventario y punto de venta',
          theme_color: '#1d4ed8',
          background_color: '#f8fafc',
          display: 'standalone',
          orientation: 'any',
          scope: '/',
          start_url: '/',
          icons: [
            { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
            { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2}'],
          runtimeCaching: [
            {
              urlPattern: /^\/api\//,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^\/storage\//,
              handler: 'NetworkOnly',
            },
            {
              urlPattern: /^https:\/\/cdn\.jsdelivr\.net\/npm\/emoji/,
              handler: 'CacheFirst',
              options: {
                cacheName: 'emoji-data',
                expiration: { maxEntries: 10, maxAgeSeconds: 60 * 60 * 24 * 30 },
              },
            },
          ],
        },
      }),
    ],
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
      hmr: { clientPort: 3000 },
      proxy: {
        '/api': { target: apiUrl, changeOrigin: true },
        '/storage': { target: apiUrl, changeOrigin: true },
      },
    },
    build: {
      target: 'esnext',
      outDir: 'dist',
      sourcemap: true,
      rolldownOptions: {
        external: [/^onnxruntime-web/],
      },
    },
  };
});
