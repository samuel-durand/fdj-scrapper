import express from 'express'
<<<<<<< HEAD:routes/stats.js
import { readFileSync } from 'fs'
=======
import { readFileSync, existsSync } from 'fs'
>>>>>>> main:backend/routes/stats.js
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'
import { protect } from '../middleware/auth.js'

const router = express.Router()

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// Chemin vers le cache des résultats
<<<<<<< HEAD:routes/stats.js
const CACHE_PATH = join(__dirname, '../../public/resultats-cache.json')
=======
// Cherche dans plusieurs emplacements possibles :
// 1. public/resultats-cache.json (racine du projet)
// 2. resultats-cache.json (racine du projet)
// 3. ../public/resultats-cache.json (depuis backend/)
const possiblePaths = [
  join(__dirname, '../../public/resultats-cache.json'), // Racine/public/
  join(__dirname, '../../resultats-cache.json'),         // Racine/
  join(__dirname, '../public/resultats-cache.json'),    // backend/public/
  join(__dirname, '../resultats-cache.json'),           // backend/
  join(process.cwd(), 'public/resultats-cache.json'),   // CWD/public/
  join(process.cwd(), 'resultats-cache.json')           // CWD/
]

let CACHE_PATH = null
for (const path of possiblePaths) {
  if (existsSync(path)) {
    CACHE_PATH = path
    console.log(`✅ Cache trouvé: ${path}`)
    break
  }
}

if (!CACHE_PATH) {
  console.warn('⚠️  Aucun fichier resultats-cache.json trouvé dans les emplacements attendus')
  CACHE_PATH = possiblePaths[0] // Utiliser le premier par défaut pour l'erreur
}
>>>>>>> main:backend/routes/stats.js

/**
 * Charge les données du cache
 */
function loadCache() {
  try {
    const data = readFileSync(CACHE_PATH, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Erreur lors du chargement du cache:', error)
    return null
  }
}

/**
 * Analyse les statistiques d'un jeu
 */
function analyzeGameStats(draws, gameType) {
  if (!draws || draws.length === 0) {
    return null
  }

  const stats = {
    totalDraws: draws.length,
    numberFrequency: {},
    starFrequency: {},
    luckyFrequency: {},
    dreamFrequency: {},
    dateRange: {
      first: draws[draws.length - 1]?.date || null,
      last: draws[0]?.date || null
    }
  }

  // Déterminer les plages selon le jeu
  let maxNumber = 50
  let maxStars = 12
  let maxLucky = 10
  let maxDream = 5

  if (gameType === 'loto') {
    maxNumber = 49
  } else if (gameType === 'eurodreams') {
    maxNumber = 40
  }

  // Initialiser les fréquences
  for (let i = 1; i <= maxNumber; i++) {
    stats.numberFrequency[i] = 0
  }

  if (gameType === 'euromillions') {
    for (let i = 1; i <= maxStars; i++) {
      stats.starFrequency[i] = 0
    }
  } else if (gameType === 'loto') {
    for (let i = 1; i <= maxLucky; i++) {
      stats.luckyFrequency[i] = 0
    }
  } else if (gameType === 'eurodreams') {
    for (let i = 1; i <= maxDream; i++) {
      stats.dreamFrequency[i] = 0
    }
  }

  // Analyser chaque tirage
  draws.forEach(draw => {
    // Numéros principaux
    if (draw.numbers && Array.isArray(draw.numbers)) {
      draw.numbers.forEach(num => {
        const numInt = parseInt(num)
        if (numInt >= 1 && numInt <= maxNumber) {
          stats.numberFrequency[numInt] = (stats.numberFrequency[numInt] || 0) + 1
        }
      })
    }

    // Étoiles (Euromillions)
    if (gameType === 'euromillions' && draw.stars && Array.isArray(draw.stars)) {
      draw.stars.forEach(star => {
        const starInt = parseInt(star)
        if (starInt >= 1 && starInt <= maxStars) {
          stats.starFrequency[starInt] = (stats.starFrequency[starInt] || 0) + 1
        }
      })
    }

    // Numéro chance (Loto)
    if (gameType === 'loto' && draw.luckyNumber) {
      const luckyInt = parseInt(draw.luckyNumber)
      if (luckyInt >= 1 && luckyInt <= maxLucky) {
        stats.luckyFrequency[luckyInt] = (stats.luckyFrequency[luckyInt] || 0) + 1
      }
    }

    // Numéro Dream (Eurodreams)
    if (gameType === 'eurodreams' && draw.dreamNumber) {
      const dreamInt = parseInt(draw.dreamNumber)
      if (dreamInt >= 1 && dreamInt <= maxDream) {
        stats.dreamFrequency[dreamInt] = (stats.dreamFrequency[dreamInt] || 0) + 1
      }
    }
  })

  // Convertir en tableaux triés
  const numberArray = Object.entries(stats.numberFrequency)
    .map(([num, count]) => ({
      number: parseInt(num),
      count,
      percentage: ((count / (draws.length * (gameType === 'eurodreams' ? 6 : 5))) * 100).toFixed(2)
    }))
    .sort((a, b) => b.count - a.count)

  let starArray = []
  if (gameType === 'euromillions') {
    starArray = Object.entries(stats.starFrequency)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: ((count / (draws.length * 2)) * 100).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count)
  }

  let luckyArray = []
  if (gameType === 'loto') {
    luckyArray = Object.entries(stats.luckyFrequency)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: ((count / draws.length) * 100).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count)
  }

  let dreamArray = []
  if (gameType === 'eurodreams') {
    dreamArray = Object.entries(stats.dreamFrequency)
      .map(([num, count]) => ({
        number: parseInt(num),
        count,
        percentage: ((count / draws.length) * 100).toFixed(2)
      }))
      .sort((a, b) => b.count - a.count)
  }

  return {
    totalDraws: stats.totalDraws,
    dateRange: stats.dateRange,
    numbers: numberArray,
    stars: starArray,
    luckyNumbers: luckyArray,
    dreamNumbers: dreamArray,
    topNumbers: numberArray.slice(0, 10),
    bottomNumbers: numberArray.slice(-10).reverse(),
    topStars: starArray.slice(0, 6),
    bottomStars: starArray.slice(-6).reverse(),
    topLucky: luckyArray.slice(0, 5),
    topDream: dreamArray.slice(0, 5)
  }
}

// @route   GET /api/stats/games/:gameType
// @desc    Obtenir les statistiques d'un jeu spécifique
// @access  Public (pas besoin d'authentification)
router.get('/games/:gameType', async (req, res) => {
  try {
    const { gameType } = req.params
    const validGames = ['euromillions', 'loto', 'eurodreams']
    
    if (!validGames.includes(gameType)) {
      return res.status(400).json({
        success: false,
        message: 'Type de jeu invalide. Utilisez: euromillions, loto, ou eurodreams'
      })
    }

    const cache = loadCache()
    if (!cache) {
      return res.status(500).json({
        success: false,
        message: 'Impossible de charger les données'
      })
    }

    const draws = cache[gameType] || []
    
    if (draws.length === 0) {
      return res.status(404).json({
        success: false,
        message: `Aucun résultat trouvé pour ${gameType}`
      })
    }

    const stats = analyzeGameStats(draws, gameType)

    if (!stats) {
      return res.status(500).json({
        success: false,
        message: 'Erreur lors de l\'analyse des statistiques'
      })
    }

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Get game stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    })
  }
})

// @route   GET /api/stats/games
// @desc    Obtenir les statistiques de tous les jeux
// @access  Public
router.get('/games', async (req, res) => {
  try {
    const cache = loadCache()
    if (!cache) {
      return res.status(500).json({
        success: false,
        message: 'Impossible de charger les données'
      })
    }

    const results = {}
    
    if (cache.euromillions && cache.euromillions.length > 0) {
      results.euromillions = analyzeGameStats(cache.euromillions, 'euromillions')
    }
    
    if (cache.loto && cache.loto.length > 0) {
      results.loto = analyzeGameStats(cache.loto, 'loto')
    }
    
    if (cache.eurodreams && cache.eurodreams.length > 0) {
      results.eurodreams = analyzeGameStats(cache.eurodreams, 'eurodreams')
    }

    res.json({
      success: true,
      data: results
    })
  } catch (error) {
    console.error('Get all games stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    })
  }
})

export default router

