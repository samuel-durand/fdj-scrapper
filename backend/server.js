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
  console.error('❌ ERREUR: JWT_SECRET et JWT_REFRESH_SECRET doivent être définis dans .env')
  console.error('   Créez un fichier backend/.env avec ces variables')
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
  : ['http://localhost:5173']

app.use(cors({
  origin: (origin, callback) => {
    // En production sur Railway, accepter toutes les origines si FRONTEND_URL n'est pas défini
    // Sinon, vérifier contre la liste autorisée
    if (!origin || process.env.NODE_ENV !== 'production' || frontendUrls.includes(origin)) {
      callback(null, true)
    } else if (process.env.RAILWAY_PUBLIC_DOMAIN || frontendUrls.includes(origin)) {
      callback(null, true)
    } else {
      callback(null, true) // Permettre pour faciliter le développement
    }
  },
  credentials: true
}))
app.use(express.json())
app.use(express.urlencoded({ extended: true }))

// Servir les fichiers statiques du frontend (dist) - UNIQUEMENT si API_ONLY n'est pas défini
if (!process.env.API_ONLY && process.env.NODE_ENV !== 'production') {
  app.use(express.static(path.join(__dirname, '../dist')))
}

// Routes
app.use('/api/auth', authRoutes)
app.use('/api/alerts', alertRoutes)
app.use('/api/users', userRoutes)
app.use('/api/combinations', combinationRoutes)
app.use('/api/admin', adminRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' })
})

// Error handling middleware (doit être avant le catch-all)
app.use((err, req, res, next) => {
  console.error(err.stack)
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'development' ? err : {}
  })
})

// Route catch-all pour le frontend React - UNIQUEMENT si API_ONLY n'est pas défini
if (!process.env.API_ONLY && process.env.NODE_ENV !== 'production') {
  app.get('*', (req, res) => {
    // Ne servir que les routes non-API
    if (!req.path.startsWith('/api/')) {
      res.sendFile(path.join(__dirname, '../dist/index.html'))
    } else {
      res.status(404).json({ error: 'Route API non trouvée' })
    }
  })
} else {
  // En mode API uniquement, retourner 404 pour les routes non-API
  app.get('*', (req, res) => {
    if (!req.path.startsWith('/api/')) {
      res.status(404).json({ error: 'API uniquement. Le frontend est déployé séparément.' })
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
      console.log(`📍 API URL: http://${host}:${PORT}/api`)
      if (process.env.FRONTEND_URL) {
        console.log(`📍 Frontend URL: ${process.env.FRONTEND_URL}`)
      }
      if (process.env.RAILWAY_PUBLIC_DOMAIN) {
        console.log(`🌐 Railway URL: https://${process.env.RAILWAY_PUBLIC_DOMAIN}`)
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

