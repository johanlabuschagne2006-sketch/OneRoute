import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  root: path.resolve(__dirname, 'client'), // Point Vite to your client folder
  build: {
    outDir: path.resolve(__dirname, 'dist'), // Output compiled files here
    emptyOutDir: true, // Clean dist before building
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'), // Optional: allows "@/..." imports
    },
  },
})
