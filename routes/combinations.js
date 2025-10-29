import express from 'express'
import Combination from '../models/Combination.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Toutes les routes nécessitent l'authentification
router.use(protect)

// @route   GET /api/combinations
// @desc    Récupérer toutes les combinaisons de l'utilisateur
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { game, favorite, played, limit = 50, skip = 0 } = req.query

    const query = { userId: req.user._id }
    
    if (game) query.game = game
    if (favorite === 'true') query.isFavorite = true
    if (played === 'true') query.isPlayed = true

    const combinations = await Combination.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip))

    const total = await Combination.countDocuments(query)

    res.json({
      success: true,
      count: combinations.length,
      total,
      data: combinations.map(c => c.format())
    })
  } catch (error) {
    console.error('Get combinations error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des combinaisons'
    })
  }
})

// @route   GET /api/combinations/stats
// @desc    Statistiques des combinaisons
// @access  Private
router.get('/stats', async (req, res) => {
  try {
    const stats = await Combination.aggregate([
      { $match: { userId: req.user._id } },
      {
        $group: {
          _id: '$game',
          total: { $sum: 1 },
          favorites: {
            $sum: { $cond: ['$isFavorite', 1, 0] }
          },
          played: {
            $sum: { $cond: ['$isPlayed', 1, 0] }
          },
          won: {
            $sum: { $cond: ['$result.hasWon', 1, 0] }
          }
        }
      }
    ])

    res.json({
      success: true,
      data: stats
    })
  } catch (error) {
    console.error('Get stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    })
  }
})

// @route   POST /api/combinations
// @desc    Créer une nouvelle combinaison
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { game, numbers, stars, luckyNumber, dreamNumber, name, isFavorite } = req.body

    // Validation
    if (!game || !numbers) {
      return res.status(400).json({
        success: false,
        message: 'Jeu et numéros requis'
      })
    }

    // Créer la combinaison
    const combinationData = {
      userId: req.user._id,
      game,
      numbers,
      name,
      isFavorite: isFavorite || false
    }

    if (game === 'euromillions' && stars) {
      combinationData.stars = stars
    } else if (game === 'loto' && luckyNumber) {
      combinationData.luckyNumber = luckyNumber
    } else if (game === 'eurodreams' && dreamNumber) {
      combinationData.dreamNumber = dreamNumber
    }

    const combination = await Combination.create(combinationData)

    res.status(201).json({
      success: true,
      message: 'Combinaison sauvegardée',
      data: combination.format()
    })
  } catch (error) {
    console.error('Create combination error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de la combinaison'
    })
  }
})

// @route   POST /api/combinations/generate
// @desc    Générer une ou plusieurs combinaisons aléatoires
// @access  Private
router.post('/generate', async (req, res) => {
  try {
    const { game, count = 1, save = false } = req.body

    if (!game) {
      return res.status(400).json({
        success: false,
        message: 'Jeu requis'
      })
    }

    const combinations = []

    for (let i = 0; i < Math.min(count, 10); i++) {
      const combination = generateRandomCombination(game)
      
      if (save) {
        const saved = await Combination.create({
          userId: req.user._id,
          ...combination
        })
        combinations.push(saved.format())
      } else {
        combinations.push(combination)
      }
    }

    res.json({
      success: true,
      count: combinations.length,
      data: combinations
    })
  } catch (error) {
    console.error('Generate combination error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la génération'
    })
  }
})

// @route   PUT /api/combinations/:id
// @desc    Mettre à jour une combinaison
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let combination = await Combination.findById(req.params.id)

    if (!combination) {
      return res.status(404).json({
        success: false,
        message: 'Combinaison non trouvée'
      })
    }

    // Vérifier que c'est bien la combinaison de l'utilisateur
    if (combination.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    // Mettre à jour
    const allowedUpdates = ['name', 'isFavorite', 'isPlayed', 'playedDate', 'notes']
    const updates = {}
    
    allowedUpdates.forEach(field => {
      if (req.body[field] !== undefined) {
        updates[field] = req.body[field]
      }
    })

    combination = await Combination.findByIdAndUpdate(
      req.params.id,
      updates,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Combinaison mise à jour',
      data: combination.format()
    })
  } catch (error) {
    console.error('Update combination error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour'
    })
  }
})

// @route   DELETE /api/combinations/:id
// @desc    Supprimer une combinaison
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const combination = await Combination.findById(req.params.id)

    if (!combination) {
      return res.status(404).json({
        success: false,
        message: 'Combinaison non trouvée'
      })
    }

    // Vérifier que c'est bien la combinaison de l'utilisateur
    if (combination.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    await combination.deleteOne()

    res.json({
      success: true,
      message: 'Combinaison supprimée'
    })
  } catch (error) {
    console.error('Delete combination error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    })
  }
})

// @route   POST /api/combinations/:id/check
// @desc    Vérifier si une combinaison a gagné
// @access  Private
router.post('/:id/check', async (req, res) => {
  try {
    const { drawNumbers, drawStars, drawLuckyNumber } = req.body
    
    const combination = await Combination.findById(req.params.id)

    if (!combination) {
      return res.status(404).json({
        success: false,
        message: 'Combinaison non trouvée'
      })
    }

    if (combination.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    // Vérifier les correspondances
    const result = checkCombination(combination, drawNumbers, drawStars, drawLuckyNumber)
    
    // Sauvegarder le résultat
    combination.result = {
      ...result,
      checkedDate: new Date()
    }
    await combination.save()

    res.json({
      success: true,
      data: {
        combination: combination.format(),
        result
      }
    })
  } catch (error) {
    console.error('Check combination error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la vérification'
    })
  }
})

// Fonction utilitaire : Générer une combinaison aléatoire
function generateRandomCombination(game) {
  const combination = { game }

  if (game === 'euromillions') {
    combination.numbers = generateUniqueNumbers(5, 1, 50)
    combination.stars = generateUniqueNumbers(2, 1, 12)
  } else if (game === 'loto') {
    combination.numbers = generateUniqueNumbers(5, 1, 49)
    combination.luckyNumber = Math.floor(Math.random() * 10) + 1
  } else if (game === 'eurodreams') {
    combination.numbers = generateUniqueNumbers(6, 1, 40)
    combination.dreamNumber = Math.floor(Math.random() * 5) + 1
  }

  return combination
}

// Fonction utilitaire : Générer des numéros uniques
function generateUniqueNumbers(count, min, max) {
  const numbers = []
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
}

// Fonction utilitaire : Vérifier une combinaison
function checkCombination(combination, drawNumbers, drawStars, drawLuckyNumber) {
  const matchedNumbers = combination.numbers.filter(n => drawNumbers?.includes(n))
  const matchedStars = combination.stars?.filter(s => drawStars?.includes(s)) || []
  
  const result = {
    hasWon: false,
    matchedNumbers,
    matchedStars,
    rank: null,
    prize: null
  }

  // Déterminer le rang selon le jeu
  if (combination.game === 'euromillions') {
    const numCount = matchedNumbers.length
    const starCount = matchedStars.length
    
    if (numCount === 5 && starCount === 2) {
      result.rank = '1 (Jackpot!)'
      result.hasWon = true
    } else if (numCount === 5 && starCount === 1) {
      result.rank = '2'
      result.hasWon = true
    } else if (numCount === 5 && starCount === 0) {
      result.rank = '3'
      result.hasWon = true
    } else if (numCount === 4 && starCount === 2) {
      result.rank = '4'
      result.hasWon = true
    } else if (numCount >= 3 && (numCount + starCount) >= 4) {
      result.hasWon = true
    }
  } else if (combination.game === 'loto') {
    const numCount = matchedNumbers.length
    const luckyMatch = combination.luckyNumber === drawLuckyNumber
    
    if (numCount === 5 && luckyMatch) {
      result.rank = '1 (Jackpot!)'
      result.hasWon = true
    } else if (numCount === 5) {
      result.rank = '2'
      result.hasWon = true
    } else if (numCount === 4 && luckyMatch) {
      result.rank = '3'
      result.hasWon = true
    } else if (numCount >= 3) {
      result.hasWon = true
    }
  }

  return result
}

export default router

