import express from 'express'
import User from '../models/User.js'
import Combination from '../models/Combination.js'
import Alert from '../models/Alert.js'
import { protect, isAdmin } from '../middleware/auth.js'

const router = express.Router()

// Toutes les routes nécessitent l'authentification ET les droits admin
router.use(protect)
router.use(isAdmin)

// @route   GET /api/admin/stats
// @desc    Obtenir les statistiques globales
// @access  Admin
router.get('/stats', async (req, res) => {
  try {
    const totalUsers = await User.countDocuments()
    const activeUsers = await User.countDocuments({ isActive: true })
    const totalCombinations = await Combination.countDocuments()
    const totalAlerts = await Alert.countDocuments()
    const activeAlerts = await Alert.countDocuments({ isActive: true })

    // Stats par jeu
    const combinationsByGame = await Combination.aggregate([
      {
        $group: {
          _id: '$game',
          count: { $sum: 1 }
        }
      }
    ])

    // Utilisateurs récents (7 derniers jours)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)
    const recentUsers = await User.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    // Combinaisons récentes (7 derniers jours)
    const recentCombinations = await Combination.countDocuments({
      createdAt: { $gte: sevenDaysAgo }
    })

    // Données temporelles pour les graphiques (30 derniers jours)
    const thirtyDaysAgo = new Date()
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30)
    thirtyDaysAgo.setHours(0, 0, 0, 0)

    // Générer les dates des 30 derniers jours
    const dates = []
    for (let i = 29; i >= 0; i--) {
      const date = new Date()
      date.setDate(date.getDate() - i)
      date.setHours(0, 0, 0, 0)
      dates.push(date)
    }

    // Statistiques utilisateurs par jour
    const usersByDay = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Statistiques combinaisons par jour
    const combinationsByDay = await Combination.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Statistiques alertes par jour
    const alertsByDay = await Alert.aggregate([
      {
        $match: {
          createdAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m-%d', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    // Créer des maps pour accès rapide
    const usersMap = new Map(usersByDay.map(u => [u._id, u.count]))
    const combinationsMap = new Map(combinationsByDay.map(c => [c._id, c.count]))
    const alertsMap = new Map(alertsByDay.map(a => [a._id, a.count]))

    // Formater les données temporelles
    const timeSeriesData = dates.map(date => {
      const dateStr = date.toISOString().split('T')[0]
      return {
        date: dateStr,
        label: date.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short' }),
        users: usersMap.get(dateStr) || 0,
        combinations: combinationsMap.get(dateStr) || 0,
        alerts: alertsMap.get(dateStr) || 0
      }
    })

    // Statistiques par mois (6 derniers mois)
    const sixMonthsAgo = new Date()
    sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6)
    sixMonthsAgo.setDate(1)
    sixMonthsAgo.setHours(0, 0, 0, 0)

    const usersByMonth = await User.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    const combinationsByMonth = await Combination.aggregate([
      {
        $match: {
          createdAt: { $gte: sixMonthsAgo }
        }
      },
      {
        $group: {
          _id: {
            $dateToString: { format: '%Y-%m', date: '$createdAt' }
          },
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: 1 } }
    ])

    res.json({
      success: true,
      data: {
        users: {
          total: totalUsers,
          active: activeUsers,
          inactive: totalUsers - activeUsers,
          recent: recentUsers
        },
        combinations: {
          total: totalCombinations,
          recent: recentCombinations,
          byGame: combinationsByGame
        },
        alerts: {
          total: totalAlerts,
          active: activeAlerts,
          inactive: totalAlerts - activeAlerts
        },
        timeSeries: {
          daily: timeSeriesData
        },
        monthly: {
          users: usersByMonth,
          combinations: combinationsByMonth
        }
      }
    })
  } catch (error) {
    console.error('Get admin stats error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des statistiques'
    })
  }
})

// @route   GET /api/admin/users
// @desc    Récupérer tous les utilisateurs
// @access  Admin
router.get('/users', async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role, isActive } = req.query

    const query = {}
    
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ]
    }
    
    if (role) query.role = role
    if (isActive !== undefined) query.isActive = isActive === 'true'

    const users = await User.find(query)
      .select('-password -refreshToken')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await User.countDocuments(query)

    // Ajouter les stats pour chaque utilisateur
    const usersWithStats = await Promise.all(
      users.map(async (user) => {
        const combinationsCount = await Combination.countDocuments({ userId: user._id })
        const alertsCount = await Alert.countDocuments({ userId: user._id })
        
        return {
          ...user.toJSON(),
          stats: {
            combinations: combinationsCount,
            alerts: alertsCount
          }
        }
      })
    )

    res.json({
      success: true,
      data: usersWithStats,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get users error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des utilisateurs'
    })
  }
})

// @route   GET /api/admin/users/:id
// @desc    Récupérer un utilisateur par ID
// @access  Admin
router.get('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id).select('-password -refreshToken')

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      })
    }

    const combinations = await Combination.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)

    const alerts = await Alert.find({ userId: user._id })
      .sort({ createdAt: -1 })
      .limit(10)

    res.json({
      success: true,
      data: {
        user: user.toJSON(),
        combinations,
        alerts
      }
    })
  } catch (error) {
    console.error('Get user error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération de l\'utilisateur'
    })
  }
})

// @route   PUT /api/admin/users/:id
// @desc    Mettre à jour un utilisateur
// @access  Admin
router.put('/users/:id', async (req, res) => {
  try {
    const { name, email, role, isActive } = req.body

    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      })
    }

    // Empêcher de modifier son propre rôle
    if (user._id.toString() === req.user._id.toString() && role && role !== user.role) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas modifier votre propre rôle'
      })
    }

    if (name) user.name = name
    if (email) user.email = email
    if (role) user.role = role
    if (isActive !== undefined) user.isActive = isActive

    await user.save()

    res.json({
      success: true,
      message: 'Utilisateur mis à jour',
      data: user.toJSON()
    })
  } catch (error) {
    console.error('Update user error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la mise à jour'
    })
  }
})

// @route   DELETE /api/admin/users/:id
// @desc    Supprimer un utilisateur
// @access  Admin
router.delete('/users/:id', async (req, res) => {
  try {
    const user = await User.findById(req.params.id)

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'Utilisateur non trouvé'
      })
    }

    // Empêcher de se supprimer soi-même
    if (user._id.toString() === req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Vous ne pouvez pas supprimer votre propre compte'
      })
    }

    // Supprimer toutes les données associées
    await Combination.deleteMany({ userId: user._id })
    await Alert.deleteMany({ userId: user._id })
    await user.deleteOne()

    res.json({
      success: true,
      message: 'Utilisateur et données associées supprimés'
    })
  } catch (error) {
    console.error('Delete user error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    })
  }
})

// @route   GET /api/admin/combinations
// @desc    Récupérer toutes les combinaisons
// @access  Admin
router.get('/combinations', async (req, res) => {
  try {
    const { page = 1, limit = 50, game, userId } = req.query

    const query = {}
    if (game) query.game = game
    if (userId) query.userId = userId

    const combinations = await Combination.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await Combination.countDocuments(query)

    res.json({
      success: true,
      data: combinations,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get combinations error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des combinaisons'
    })
  }
})

// @route   DELETE /api/admin/combinations/:id
// @desc    Supprimer une combinaison
// @access  Admin
router.delete('/combinations/:id', async (req, res) => {
  try {
    const combination = await Combination.findById(req.params.id)

    if (!combination) {
      return res.status(404).json({
        success: false,
        message: 'Combinaison non trouvée'
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

// @route   GET /api/admin/alerts
// @desc    Récupérer toutes les alertes
// @access  Admin
router.get('/alerts', async (req, res) => {
  try {
    const { page = 1, limit = 50, userId, isActive } = req.query

    const query = {}
    if (userId) query.userId = userId
    if (isActive !== undefined) query.isActive = isActive === 'true'

    const alerts = await Alert.find(query)
      .populate('userId', 'name email')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip((parseInt(page) - 1) * parseInt(limit))

    const total = await Alert.countDocuments(query)

    res.json({
      success: true,
      data: alerts,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        total,
        pages: Math.ceil(total / parseInt(limit))
      }
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    })
  }
})

// @route   DELETE /api/admin/alerts/:id
// @desc    Supprimer une alerte
// @access  Admin
router.delete('/alerts/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      })
    }

    await alert.deleteOne()

    res.json({
      success: true,
      message: 'Alerte supprimée'
    })
  } catch (error) {
    console.error('Delete alert error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression'
    })
  }
})

export default router

