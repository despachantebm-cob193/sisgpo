import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import tsconfigPaths from 'vite-tsconfig-paths';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react({
      jsxRuntime: 'automatic',
    }),
    tsconfigPaths(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'masked-icon.svg', 'login-bg.jpg', 'logo cbmgo.png'],
      // Ativa o PWA também em modo de desenvolvimento para testes
      devOptions: {
        enabled: true,
      },
      manifest: {
        name: 'SISGPO',
        short_name: 'SISGPO',
        description: 'Sistema de Gestão de Pessoal e Operações',
        theme_color: '#ffffff',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png',
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
          },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp}'],
        // Permite navegação SPA para rotas /app/* quando offline
        navigateFallbackAllowlist: [/^\/app\//],
        // Evita interceptar chamadas de API
        navigateFallbackDenylist: [/^\/api\//],
        // OPÇÃO 1: Cache estritamente estático.
        // Removido runtimeCaching de API para evitar dados desatualizados.
      },
    }),
  ],
  server: {
    watch: {
      usePolling: true,
      interval: 200,
      awaitWriteFinish: {
        stabilityThreshold: 300,
        pollInterval: 100,
      },
    },
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom', 'react-router-dom'],
          'ui-vendor': ['lucide-react', 'react-hot-toast', 'react-select'],
          'charts-vendor': ['recharts'],
          'utils-vendor': ['date-fns'],
          'supabase-vendor': ['@supabase/supabase-js'],
        },
      },
    },
    chunkSizeWarningLimit: 1000,
  },
});
