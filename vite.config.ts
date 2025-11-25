/// <reference types="vitest/config" />
import { dirname, resolve, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { defineConfig } from 'vitest/config';

import packageConfig from './package.json';
import * as child from 'child_process';

const commitHash = child.execSync('git rev-parse --short HEAD').toString();

const __dirname = dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  define: {
    __APP_VERSION__: JSON.stringify(packageConfig.version),
    __COMMIT_HASH__: JSON.stringify(commitHash),
  },
  build: {
    lib: {
      entry: resolve(__dirname, 'lib/index.ts'),
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
    include: ['src/tests/**/*.test.ts'],
    browser: {
      enabled: true,
      provider: 'playwright',
      name: 'chromium',
      headless: true
    }
  }
});