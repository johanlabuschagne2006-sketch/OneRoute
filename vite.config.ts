import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  root: '.', // index.html stays in root
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'), // alias for imports
    },
  },
  build: {
    outDir: 'dist/public', // where Capacitor expects web files
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'), // use root index.html
    },
  },
})
