import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Library build: ESM only, React external. Every game scene stays its own
// chunk (dist/chunks/*), so apps only download the scenes that actually play.
export default defineConfig({
  plugins: [react()],
  build: {
    lib: {
      entry: { index: 'src/index.js', vanilla: 'src/vanilla.js' },
      formats: ['es'],
    },
    rollupOptions: {
      external: ['react', 'react-dom', 'react/jsx-runtime'],
      output: { chunkFileNames: 'chunks/[name]-[hash].js' },
    },
    sourcemap: false,
    minify: true,
    target: 'es2020',
  },
  test: {
    environment: 'node',
  },
})
