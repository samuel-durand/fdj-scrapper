import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync, existsSync } from 'fs'
import { join } from 'path'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-cache',
      buildStart() {
        // Copier resultats-cache.json dans public/ avant le build
        // Supporte à la fois la racine et public/
        const cacheFiles = [
          { from: 'resultats-cache.json', to: 'public/resultats-cache.json' },
          { from: 'public/resultats-cache.json', to: 'public/resultats-cache.json' }
        ]
        
        for (const { from, to } of cacheFiles) {
          if (existsSync(from)) {
            try {
              copyFileSync(from, to)
              console.log(`✅ ${from} copié vers ${to}`)
              break
            } catch (err) {
              console.warn(`⚠️ Impossible de copier ${from}:`, err.message)
            }
          }
        }
      }
    }
  ],
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    // Améliorer la gestion des assets pour Railways
    rollupOptions: {
      output: {
        manualChunks: {
          'react-vendor': ['react', 'react-dom']
        }
      }
    }
  },
  // Configuration pour la production
  base: '/',
  server: {
    port: 5173,
    host: true
  },
  preview: {
    port: 5173,
    host: true
  }
})

