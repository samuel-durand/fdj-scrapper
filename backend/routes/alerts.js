import express from 'express'
import Alert from '../models/Alert.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Toutes les routes nécessitent l'authentification
router.use(protect)

// @route   GET /api/alerts
// @desc    Récupérer toutes les alertes de l'utilisateur
// @access  Private
router.get('/', async (req, res) => {
  try {
    const alerts = await Alert.find({ userId: req.user._id }).sort({ createdAt: -1 })

    res.json({
      success: true,
      count: alerts.length,
      data: alerts
    })
  } catch (error) {
    console.error('Get alerts error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des alertes'
    })
  }
})

// @route   POST /api/alerts
// @desc    Créer une nouvelle alerte
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { name, type, game, config } = req.body

    // Validation
    if (!name || !type || !game) {
      return res.status(400).json({
        success: false,
        message: 'Nom, type et jeu requis'
      })
    }

    // Créer l'alerte
    const alert = await Alert.create({
      userId: req.user._id,
      name,
      type,
      game,
      config: config || {}
    })

    res.status(201).json({
      success: true,
      message: 'Alerte créée avec succès',
      data: alert
    })
  } catch (error) {
    console.error('Create alert error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de la création de l\'alerte'
    })
  }
})

// @route   PUT /api/alerts/:id
// @desc    Mettre à jour une alerte
// @access  Private
router.put('/:id', async (req, res) => {
  try {
    let alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      })
    }

    // Vérifier que c'est bien l'alerte de l'utilisateur
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    // Mettre à jour
    alert = await Alert.findByIdAndUpdate(
      req.params.id,
      req.body,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Alerte mise à jour',
      data: alert
    })
  } catch (error) {
    console.error('Update alert error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de l\'alerte'
    })
  }
})

// @route   DELETE /api/alerts/:id
// @desc    Supprimer une alerte
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      })
    }

    // Vérifier que c'est bien l'alerte de l'utilisateur
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
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
      message: 'Erreur lors de la suppression de l\'alerte'
    })
  }
})

// @route   PATCH /api/alerts/:id/toggle
// @desc    Activer/désactiver une alerte
// @access  Private
router.patch('/:id/toggle', async (req, res) => {
  try {
    const alert = await Alert.findById(req.params.id)

    if (!alert) {
      return res.status(404).json({
        success: false,
        message: 'Alerte non trouvée'
      })
    }

    // Vérifier que c'est bien l'alerte de l'utilisateur
    if (alert.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    alert.enabled = !alert.enabled
    await alert.save()

    res.json({
      success: true,
      message: `Alerte ${alert.enabled ? 'activée' : 'désactivée'}`,
      data: alert
    })
  } catch (error) {
    console.error('Toggle alert error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors du toggle de l\'alerte'
    })
  }
})

export default router

