import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  root: 'client', // 👈 tells Vite to use client as the root folder
  build: {
    outDir: '../dist', // build output goes here
    emptyOutDir: true,
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, 'client/src'), // so you can do @/filename imports
    },
  },
})




