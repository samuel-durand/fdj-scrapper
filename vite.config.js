import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { copyFileSync } from 'fs'

export default defineConfig({
  plugins: [
    react(),
    {
      name: 'copy-cache',
      buildStart() {
        // Copier resultats-cache.json dans public/ avant le build
        try {
          copyFileSync('resultats-cache.json', 'public/resultats-cache.json')
          console.log('✅ resultats-cache.json copié dans public/')
        } catch (err) {
          console.warn('⚠️ Impossible de copier resultats-cache.json:', err.message)
        }
      }
    }
  ],
})

