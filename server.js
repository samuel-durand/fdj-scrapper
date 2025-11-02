import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import authRoutes from './routes/auth.js'
import alertRoutes from './routes/alerts.js'
import userRoutes from './routes/users.js'
import combinationRoutes from './routes/combinations.js'
import adminRoutes from './routes/admin.js'

dotenv.config()

// Vérifier les variables d'environnement critiques
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ ERREUR: JWT_SECRET et JWT_REFRESH_SECRET doivent être définis')
  console.error('   En local : créez un fichier .env à la racine')
  console.error('   Sur Railway : ajoutez ces variables dans Railway Dashboard')
  console.error('   Exemple: JWT_SECRET=votre_secret_ici_minimum_32_caracteres')
  process.exit(1)
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const app = express()
const PORT = process.env.PORT || 5000

// Configuration CORS
const frontendUrls = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : []

app.use(cors({
  origin: (origin, callback) => {
    // En développement, accepter toutes les origines
    if (process.env.NODE_ENV !== 'production') {
      return callback(null, true)
    }
    
    // En production :
    // Si aucune origine (requêtes non-browser), accepter
    if (!origin) {
      return callback(null, true)
    }
    
    // Si FRONTEND_URL est défini, vérifier contre la liste
    if (frontendUrls.length > 0) {
      // Vérifier l'origine exacte
      if (frontendUrls.includes(origin)) {
        return callback(null, true)
      }
      // Vérifier aussi avec/sans trailing slash et http/https
      const normalizedOrigin = origin.replace(/\/$/, '')
      const isAllowed = frontendUrls.some(url => {
        const normalizedUrl = url.replace(/\/$/, '')
        return normalizedOrigin === normalizedUrl || 
               normalizedOrigin === normalizedUrl.replace('https://', 'http://') ||
               normalizedOrigin === normalizedUrl.replace('http://', 'https://')
      })
      if (isAllowed) {
        return callback(null, true)
      }
      // Si pas trouvé, rejeter en production
      return callback(new Error('Not allowed by CORS'))
    }
    
    // Si FRONTEND_URL n'est pas défini, accepter toutes les origines (moins sécurisé)
    console.warn('⚠️  CORS: FRONTEND_URL non défini, acceptation de toutes les origines')
    callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques du frontend (dist) - UNIQUEMENT si API_ONLY n'est pas défini
if (!process.env.API_ONLY && process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
}

// Health check pour Railway (sur la racine) - DOIT être avant les routes catch-all
app.get('/', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running', service: 'loterie-fdj-backend' })
})

// Health check API
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Routes API
app.use('/api/auth', authRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/users', userRoutes)
app.use('/api/combinations', combinationRoutes)
app.use('/api/admin', adminRoutes)

// Error handling middleware (doit être avant le catch-all)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  })
})

// Route catch-all pour les routes non-API (en mode production/API_ONLY)
if (process.env.API_ONLY || process.env.NODE_ENV === 'production') {
  app.get('*', (req, res) => {
    // Ne pas interférer avec les routes /api
    if (req.path.startsWith('/api/')) {
      return res.status(404).json({ error: 'Route API non trouvée' })
    }
    // Pour toutes les autres routes, retourner un message
    res.status(404).json({ error: 'API uniquement. Le frontend est déployé séparément.', available: '/api' })
  })
} else {
  // En développement, servir le frontend React
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'))
    } else {
      res.status(404).json({ error: 'Route API non trouvée' })
    }
  })
}

// MongoDB Connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loterie-fdj')
  .then(() => {
    console.log('✅ Connected to MongoDB')
    const host = process.env.NODE_ENV === 'production' ? '0.0.0.0' : 'localhost'
    app.listen(PORT, host, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`)
      
      // Afficher l'URL API correcte selon l'environnement
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        console.log(`📍 API URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN}/api`)
      } else if (process.env.NODE_ENV === 'production') {
        console.log(`📍 API URL: http://${host}:${PORT}/api`)
      } else {
        console.log(`📍 API URL: http://localhost:${PORT}/api`)
      }
      
      if (process.env.FRONTEND_URL) {
        console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL}`)
      }
      
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        console.log(`🌐 Railway Domain: ${process.env.RAILWAY_PUBLIC_DOMAIN}`)
      }
    })
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error)
    process.exit(1)
  })

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server')
  mongoose.connection.close(() => {
    console.log('MongoDB connection closed')
    process.exit(0)
  })
})

export default app

