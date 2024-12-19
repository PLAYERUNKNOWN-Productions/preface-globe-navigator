import { defineConfig } from 'vite';
import path from 'path';

export default defineConfig({
  base: './',
  server: {
    open: true,
    hmr: true
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@styles': path.resolve(__dirname, './src/styles'),
      '@js': path.resolve(__dirname, './src/js'),
      '@images': path.resolve(__dirname, './public/images')
    }
  },
  build: {
    outDir: 'dist',
    sourcemap: true,
    assetsInlineLimit: 4096,
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['three']
        }
      }
    }
  },
  assetsInclude: ['**/*.png'],
  publicDir: 'public',
}); 