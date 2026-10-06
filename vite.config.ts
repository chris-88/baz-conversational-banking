import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import { defineConfig, loadEnv } from 'vite'

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url))


export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')

  // GitHub Pages has no rewrites: `/<repo>/` unless a custom domain is configured.
  const raw = env.VITE_BASE_PATH?.trim() || '/'
  const base = raw.endsWith('/') ? raw : `${raw}/`

  return {
    base,
    resolve: {
      alias: {
        '@': resolve('./src'),
        // shadcn generates `import { cn } from "cn"`; keep ui/ identical to upstream.
        cn: resolve('./src/lib/utils.ts'),
        '@domain': resolve('./supabase/functions/_shared/domain'),
        '@contracts': resolve('./supabase/functions/_shared/contracts'),
        '@db': resolve('./supabase/functions/_shared/db'),
        '@llm': resolve('./supabase/functions/_shared/llm'),
        '@tenants': resolve('./supabase/functions/_shared/tenants'),
      },
    },
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        registerType: 'autoUpdate',
        // `start_url`/`scope` follow base so the installed PWA works under /<repo>/.
        manifest: {
          name: 'Bank of Ireland',
          short_name: 'BOI',
          description: 'Bank of Ireland mobile banking',
          start_url: base,
          scope: base,
          display: 'standalone',
          background_color: '#ffffff',
          theme_color: '#0b2a4a',
          icons: [
            { src: 'icons/icon-192.png', sizes: '192x192', type: 'image/png' },
            { src: 'icons/icon-512.png', sizes: '512x512', type: 'image/png' },
            {
              src: 'icons/icon-512-maskable.png',
              sizes: '512x512',
              type: 'image/png',
              purpose: 'maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,svg,png,woff2}'],
          navigateFallback: `${base}index.html`,
          // Never cache API responses (CLAUDE.md > GitHub Pages).
          runtimeCaching: [
            {
              urlPattern: /^https:\/\/[a-z0-9-]+\.supabase\.(co|in)\/.*/i,
              handler: 'NetworkOnly',
            },
          ],
        },
        devOptions: { enabled: false },
      }),
    ],
    build: {
      sourcemap: true,
      target: 'es2023',
    },
    server: {
      port: 5173,
    },
  }
})
