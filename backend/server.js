import express from 'express'
import cors from 'cors'
import mongoose from 'mongoose'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'
import { existsSync } from 'fs'
import authRoutes from './routes/auth.js'
import alertRoutes from './routes/alerts.js'
import userRoutes from './routes/users.js'
import combinationRoutes from './routes/combinations.js'
import adminRoutes from './routes/admin.js'
import statsRoutes from './routes/stats.js'
import notificationRoutes from './routes/notifications.js'

// Configuration dotenv : charger .env systématiquement
// Toutes les variables doivent être définies dans .env (pas de valeurs par défaut)
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const envPath = path.join(__dirname, '.env')

// Charger .env systématiquement
const result = dotenv.config({ path: envPath })
if (result.error) {
  console.warn('⚠️  Fichier .env non trouvé, utilisation des variables d\'environnement système')
  console.warn('   Pour le développement local, créez backend/.env avec vos variables')
} else {
  console.log('✅ Variables chargées depuis .env')
}

// Vérifier les variables d'environnement critiques
if (!process.env.JWT_SECRET || !process.env.JWT_REFRESH_SECRET) {
  console.error('❌ ERREUR: JWT_SECRET et JWT_REFRESH_SECRET doivent être définis')
  if (process.env.NODE_ENV === 'production') {
    console.error('   En production : configurez ces variables dans Railway Dashboard')
    console.error('   Allez dans votre projet Railway → Variables → Ajoutez JWT_SECRET et JWT_REFRESH_SECRET')
  } else {
    console.error('   En développement : créez un fichier backend/.env avec ces variables')
    console.error('   Exemple: JWT_SECRET=votre_secret_ici_minimum_32_caracteres')
  }
  process.exit(1)
}

const app = express()
const PORT = process.env.PORT

if (!PORT) {
  console.error('❌ ERREUR: PORT doit être défini dans .env')
  console.error('   Ajoutez PORT=5000 (ou autre port) dans votre fichier backend/.env')
  process.exit(1)
}

// Configuration CORS
const frontendUrls = process.env.FRONTEND_URL 
  ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
  : []

// En développement, ajouter automatiquement localhost:5173 si pas déjà présent
const devUrls = [...frontendUrls]
if (process.env.NODE_ENV !== 'production') {
  const localhost5173 = 'http://localhost:5173'
  const localhost3000 = 'http://localhost:3000'
  if (!devUrls.includes(localhost5173)) {
    devUrls.push(localhost5173)
  }
  if (!devUrls.includes(localhost3000)) {
    devUrls.push(localhost3000)
  }
}

app.use(cors({
  origin: (origin, callback) => {
    // Accepter les requêtes sans origin (Postman, curl, etc.)
    if (!origin) {
      return callback(null, true)
    }
    
    // En production, vérifier strictement contre FRONTEND_URL
    if (process.env.NODE_ENV === 'production') {
      if (frontendUrls.length > 0 && frontendUrls.includes(origin)) {
        return callback(null, true)
      }
      // Permettre Railway si configuré
      if (process.env.RAILWAY_PUBLIC_DOMAIN && origin.includes(process.env.RAILWAY_PUBLIC_DOMAIN)) {
        return callback(null, true)
      }
      return callback(new Error('Not allowed by CORS'))
    }
    
    // En développement, utiliser les URLs configurées + localhost
    if (devUrls.length > 0) {
      if (devUrls.includes(origin)) {
        console.log(`✅ CORS: Origine autorisée (configurée): ${origin}`)
        return callback(null, true)
      }
      // Permettre aussi localhost avec différents ports en dev
      if (origin.startsWith('http://localhost:') || origin.startsWith('http://127.0.0.1:')) {
        console.log(`✅ CORS: Origine autorisée (localhost): ${origin}`)
        return callback(null, true)
      }
      // Afficher un warning mais accepter quand même en dev
      console.warn(`⚠️  CORS: Origine non configurée mais acceptée en dev: ${origin}`)
      return callback(null, true)
    }
    
    // Si aucune URL n'est définie en dev, permettre toutes les origines
    return callback(null, true)
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
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
app.use('/api/stats', statsRoutes)
app.use('/api/notifications', notificationRoutes)

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
if (!process.env.MONGODB_URI) {
  console.error('❌ ERREUR: MONGODB_URI doit être défini')
  if (process.env.NODE_ENV === 'production') {
    console.error('   En production : configurez MONGODB_URI dans Railway Dashboard')
    console.error('   Allez dans votre projet Railway → Variables → Ajoutez MONGODB_URI')
  } else {
    console.error('   En développement : ajoutez MONGODB_URI dans votre fichier backend/.env')
  }
  process.exit(1)
}

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ Connected to MongoDB')
    const host = process.env.HOST || '0.0.0.0' // Utiliser 0.0.0.0 par défaut pour Railway
    app.listen(PORT, host, () => {
      console.log(`🚀 Server running on port ${PORT}`)
      console.log(`🌍 Mode: ${process.env.NODE_ENV || 'development'}`)
      console.log(`📍 API URL: http://${host}:${PORT}/api`)
      if (process.env.FRONTEND_URL) {
        console.log(`📍 Frontend URL configuré: ${process.env.FRONTEND_URL}`)
      }
      if (process.env.NODE_ENV !== 'production') {
        console.log(`📍 URLs CORS autorisées en dev: ${devUrls.join(', ')}`)
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

