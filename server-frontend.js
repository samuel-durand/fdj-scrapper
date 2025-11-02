/**
 * Serveur Express pour déployer le frontend sur Railways
 * Sert les fichiers statiques du dossier dist/
 */

import express from 'express'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { existsSync } from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

const app = express()
const PORT = process.env.PORT || 3000

// Configuration CORS pour Railway (si nécessaire)
app.use((req, res, next) => {
  // Permettre les requêtes depuis n'importe quelle origine (à ajuster selon vos besoins)
  res.header('Access-Control-Allow-Origin', '*')
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization')
  
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200)
  }
  
  next()
})

// Compression et sécurité de base
app.disable('x-powered-by')

// Dossier des fichiers statiques (build Vite)
const distPath = join(__dirname, 'dist')

// Vérifier que le dossier dist existe
if (!existsSync(distPath)) {
  console.error('❌ Erreur : Le dossier dist/ n\'existe pas !')
  console.error('   Lancez d\'abord : npm run build')
  process.exit(1)
}

// Servir les fichiers statiques
app.use(express.static(distPath))

// Route pour le fichier cache JSON (SPA fallback)
app.get('/resultats-cache.json', (req, res) => {
  const cachePath = join(distPath, 'resultats-cache.json')
  if (existsSync(cachePath)) {
    res.sendFile(cachePath)
  } else {
    res.status(404).json({ error: 'Cache non trouvé' })
  }
})

// Route SPA : toutes les routes non API pointent vers index.html
app.get('*', (req, res) => {
  // Exclure les routes API si nécessaire
  if (req.path.startsWith('/api/')) {
    return res.status(404).json({ error: 'API non disponible' })
  }
  
  const indexPath = join(distPath, 'index.html')
  if (existsSync(indexPath)) {
    res.sendFile(indexPath)
  } else {
    res.status(500).send('❌ Erreur : index.html non trouvé. Le build a peut-être échoué.')
  }
})

// Gestion des erreurs globales
app.use((err, req, res, next) => {
  console.error('❌ Erreur serveur:', err)
  res.status(500).json({ 
    error: 'Erreur interne du serveur',
    message: process.env.NODE_ENV === 'development' ? err.message : undefined
  })
})

// Démarrer le serveur
app.listen(PORT, '0.0.0.0', () => {
  console.log('🚀 Serveur frontend démarré !')
  console.log(`📍 Port : ${PORT}`)
  console.log(`📁 Fichiers servis depuis : ${distPath}`)
  console.log(`🌍 Mode : ${process.env.NODE_ENV || 'development'}`)
  
  // Afficher l'URL si disponible
  if (process.env.RAILWAY_PUBLIC_DOMAIN) {
    console.log(`🌐 URL publique : https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
  }
})

// Gestion gracieuse de l'arrêt
process.on('SIGTERM', () => {
  console.log('🛑 SIGTERM reçu, arrêt du serveur...')
  process.exit(0)
})

process.on('SIGINT', () => {
  console.log('🛑 SIGINT reçu, arrêt du serveur...')
  process.exit(0)
})

