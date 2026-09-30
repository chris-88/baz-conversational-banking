import { fileURLToPath } from 'node:url'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

const resolve = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': resolve('./src'),
        // shadcn generates `import { cn } from "cn"`; keep ui/ identical to upstream.
        cn: resolve('./src/lib/utils.ts'),
      '@domain': resolve('./supabase/functions/_shared/domain'),
      '@contracts': resolve('./supabase/functions/_shared/contracts'),
    },
  },
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: [
      'src/**/*.test.{ts,tsx}',
      'supabase/functions/_shared/**/*.test.ts',
    ],
    exclude: ['e2e/**', 'node_modules/**'],
    coverage: {
      provider: 'v8',
      include: ['supabase/functions/_shared/domain/**', 'src/**'],
    },
  },
})
