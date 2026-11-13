import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// En développement, /api est redirigé vers le backend Flask (python backend/manage.py run).
const API_TARGET = process.env.VITE_API_PROXY || 'http://127.0.0.1:5000'

export default defineConfig({
  plugins: [react()],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // three.js (~525 ko, 136 ko gzip) est isolé dans un chunk chargé à la demande (scène 3D de fond)
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  base: '/',
  server: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true }
    }
  },
  preview: {
    port: 5173,
    host: true,
    proxy: {
      '/api': { target: API_TARGET, changeOrigin: true }
    }
  }
})
