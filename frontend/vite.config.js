import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'build'
  },

  test: {
    globals: true,
    environment: 'happy-dom',
    setupFiles: './src/setupTests.js',
    css: false,
    testTimeout: 30000,
    watch: false
  }
})