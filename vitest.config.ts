import { fileURLToPath } from 'node:url'
import { defineConfig } from 'vitest/config'

// Plain Vitest (no Nuxt runtime): the suite covers pure logic in `shared/` and the
// pure `useOrderStatus` lookup, so a lightweight node environment is enough. Nuxt-aware
// component/handler integration tests (needing @nuxt/test-utils) are deliberately out
// of scope for now. Aliases mirror the project's so tests import like the app does.
const r = (p: string) => fileURLToPath(new URL(p, import.meta.url))

export default defineConfig({
  test: {
    environment: 'node',
    include: ['test/**/*.test.ts'],
    coverage: {
      provider: 'v8',
      include: ['shared/**/*.ts', 'app/composables/**/*.ts'],
    },
  },
  resolve: {
    alias: {
      '#shared': r('./shared'),
      '~~': r('.'),
      '@@': r('.'),
      '~': r('./app'),
      '@': r('./app'),
    },
  },
})
