import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  root: '.', // Root of the project
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, 'client/src'),
    },
  },
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: path.resolve(__dirname, 'index.html'),
    },
  },
});
