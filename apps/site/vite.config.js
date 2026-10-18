import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

const { version } = JSON.parse(readFileSync(new URL('../../packages/pixelmark/package.json', import.meta.url), 'utf8'))
const lib = (p) => fileURLToPath(new URL(`../../packages/pixelmark/src/${p}`, import.meta.url))

// The site imports the library straight from its source, so edits to the
// engine or a build hot-reload here without a library build step.
export default defineConfig({
  plugins: [react(), tailwindcss()],
  resolve: {
    alias: [
      { find: /^pixelmark\/vanilla$/, replacement: lib('vanilla.js') },
      { find: /^pixelmark$/, replacement: lib('index.js') },
    ],
  },
  define: {
    __PIXELMARK_VERSION__: JSON.stringify(version),
  },
  // the manifest lets the prerender step preload each route's own chunks
  build: { sourcemap: false, manifest: true },
})
