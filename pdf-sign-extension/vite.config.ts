import { defineConfig } from 'vite'
import { crx } from '@crxjs/vite-plugin'
import { resolve } from 'node:path'
import manifest from './manifest.config'

// Node 20.11+/22+ provides import.meta.dirname; this file is ESM.
const rootDir = import.meta.dirname

// MV3 build via @crxjs/vite-plugin. Everything ships inside the package:
// pdf.js, pdf-lib, fonts and the bundled license public key. Nothing is
// fetched at runtime; `npm run audit:remote` greps the build to prove it.
export default defineConfig({
  resolve: {
    alias: {
      '@': resolve(rootDir,'src'),
    },
  },
  build: {
    target: 'es2022',
    // Keep the source readable in the store review bundle.
    minify: 'esbuild',
    sourcemap: false,
    rollupOptions: {
      input: {
        editor: resolve(rootDir,'src/editor/editor.html'),
      },
    },
  },
  worker: {
    format: 'es',
  },
  plugins: [crx({ manifest })],
})
