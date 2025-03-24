import { defineConfig } from 'vitest/config';

export default defineConfig({
  build: {
    sourcemap: true,
    lib: {
      entry: './lib/index.ts',
      formats: ['es']
    },
    emptyOutDir: false
  },
  server: {
    port: 5180
  },
  test: {
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true
    }
  }
})
