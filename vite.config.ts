import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import { VitePWA } from 'vite-plugin-pwa';
import { fileURLToPath } from 'node:url';

const src = (path: string) => fileURLToPath(new URL(path, import.meta.url));
const isTest = Boolean(process.env.VITEST);

export default defineConfig({
  plugins: [
    react(),
    // El service worker no participa en los tests (ahí se usa un reemplazo de `virtual:pwa-register/react`).
    !isTest &&
      VitePWA({
        // El usuario decide cuándo actualizar (ver UpdatePrompt): no se recarga la app en medio de un recorrido.
        registerType: 'prompt',
        includeAssets: ['favicon-64.png', 'apple-touch-icon.png'],
        manifest: {
          name: 'Hanzi Master',
          short_name: 'Hanzi Master',
          description: 'Flashcards a tu medida para aprender chino, japonés o el idioma que elijas.',
          lang: 'es',
          start_url: '/',
          scope: '/',
          display: 'standalone',
          orientation: 'any',
          theme_color: '#4F46E5',
          background_color: '#F6F7FF',
          icons: [
            { src: 'pwa-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'pwa-512.png', sizes: '512x512', type: 'image/png' },
            { src: 'maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
          ],
        },
        workbox: {
          // Se precachea el shell (HTML, JS, CSS, íconos). Las fuentes son muchas y pesadas: se cachean al usarse.
          globPatterns: ['**/*.{js,css,html,png,svg,webmanifest}'],
          navigateFallback: '/index.html',
          // `/__/` lo sirve Firebase (handler de inicio de sesión); no debe responderlo el service worker.
          navigateFallbackDenylist: [/^\/__\//],
          cleanupOutdatedCaches: true,
          runtimeCaching: [
            {
              urlPattern: /\.woff2?$/,
              handler: 'CacheFirst',
              options: { cacheName: 'fonts', expiration: { maxEntries: 80, maxAgeSeconds: 60 * 60 * 24 * 365 } },
            },
          ],
        },
      }),
  ],
  resolve: {
    alias: {
      '@': src('./src'),
      ...(isTest ? { 'virtual:pwa-register/react': src('./src/test/pwa-register-stub.ts') } : {}),
    },
  },
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: ['./src/test-setup.ts'],
    include: ['src/**/*.test.{ts,tsx}'],
  },
});
