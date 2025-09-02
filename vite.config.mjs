import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import UnoCSS from 'unocss/vite'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react(), UnoCSS()],
  resolve: {
    alias: {
      '@': resolve(__dirname, './src-react'),
      '@/components': resolve(__dirname, './src-react/components'),
      '@/hooks': resolve(__dirname, './src-react/hooks'),
      '@/stores': resolve(__dirname, './src-react/stores'),
      '@/utils': resolve(__dirname, './src-react/utils'),
      '@/types': resolve(__dirname, './src-react/types'),
      '@/constants': resolve(__dirname, './src-react/constants'),
      '@/workers': resolve(__dirname, './src-react/workers'),
      '@/legacy': resolve(__dirname, './src-react/legacy'),
    }
  },
  root: '.',
  publicDir: 'images',
  build: {
    outDir: 'dist-react',
    rollupOptions: {
      input: {
        main: resolve(__dirname, 'index-react.html')
      }
    }
  },
  server: {
    port: 3000,
    open: '/index-react.html'
  }
})