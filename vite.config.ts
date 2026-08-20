/// <reference types="vitest/config" />
import { dirname, resolve } from 'node:path';
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
        intro: `window.process = {
          env: {
            NODE_ENV: "production"
          }
        };`
      }
    }
  },

  server: {
    port: 5180,
    fs: {
      allow: ['..']
    }
  },

  test: {
    projects: [
      {
        test: {
          name: 'unit',
          include: ['src/tests/unit/**/*.test.ts'],
          environment: 'happy-dom'
        }
      },

      {
        test: {
          name: 'browser',
          include: ['src/tests/browser/**/*.test.ts'],
          fileParallelism: false,
          browser: {
            enabled: true,
            provider: 'playwright',
            instances: [{ browser: 'chromium' }],
            headless: true
          }
        }
      }
    ]
  },

  optimizeDeps: {
    include: [
      'lit',
      'lit/decorators.js',
      'lit/directives/ref.js',
      'lit/directives/class-map.js',
      'lit/directives/unsafe-html.js',
      'lit/directives/style-map.js',
      'lit/static-html.js',
      '@lit-app/state',
      'immer',
      '@fizz/chartsignal-internal',
      '@fizz/parasummary',
      '@fizz/ui-components',
      '@fizz/jimerator',
      '@fizz/paramodel',
      '@fizz/sparkbraille-component',
      '@fizz/clustering',
      '@fizz/templum',
      'decimal.js',
      'papaparse'
    ]
  }
});
