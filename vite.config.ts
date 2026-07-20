import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import path from 'node:path'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    VitePWA({
      // Auto-update: a returning visitor's service worker silently fetches and activates
      // the new build in the background rather than pinning them to a stale cached bundle
      // until they manually clear it — matters here since deploys happen on every merge
      // to main (see deploy/README.md), not on a slow release cadence.
      registerType: 'autoUpdate',
      manifest: {
        name: 'Koushol',
        short_name: 'Koushol',
        description:
          'Koushol turns courses into interactive chapters and quizzes — read, get tested, unlock the next step, and learn at your own pace.',
        start_url: '/',
        scope: '/',
        display: 'standalone',
        background_color: '#ffffff',
        theme_color: '#0C8A4B',
        // SVG-only icons: Chrome/Edge/Android install flows support them directly. iOS
        // Safari's "Add to Home Screen" icon (a separate, non-manifest mechanism —
        // apple-touch-icon in index.html) generally wants a real PNG; this repo doesn't
        // have a raster icon yet, so the iOS home-screen icon will look worse than
        // Android's until one is added — flagged here rather than silently ignored.
        icons: [
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
          { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
        ],
      },
      workbox: {
        // Only precache the built app shell (JS/CSS/HTML/icons) — Supabase API calls are
        // cross-origin and untouched by this, so students/teachers never see stale course
        // data served from a cache.
        globPatterns: ['**/*.{js,css,html,svg,ico}'],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
})
