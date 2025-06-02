import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  build: {
    lib: {
      entry: {
        basic: resolve(__dirname, 'lib/index.ts'),
        ai: resolve(__dirname, 'lib/index-ai.ts'),
      },
      name: 'paracharts',
      fileName: 'paracharts',
      formats: ['es']
    },
    rollupOptions: {
      output: {
        // WORKAROUND for immer.js esm (see https://github.com/immerjs/immer/issues/557)
        intro: `window.process = {
          env: {
            NODE_ENV: "production"
          }
        };`
      }
    }
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
