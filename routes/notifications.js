import express from 'express'
import Notification from '../models/Notification.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Toutes les routes nécessitent l'authentification
router.use(protect)

// @route   GET /api/notifications
// @desc    Récupérer toutes les notifications de l'utilisateur
// @access  Private
router.get('/', async (req, res) => {
  try {
    const { read, limit } = req.query
    
    const query = { userId: req.user._id }
    if (read !== undefined) {
      query.read = read === 'true'
    }

    const notifications = await Notification.find(query)
      .sort({ createdAt: -1 })
      .limit(limit ? parseInt(limit) : 50)

    const unreadCount = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    })

    res.json({
      success: true,
      count: notifications.length,
      unreadCount,
      data: notifications
    })
  } catch (error) {
    console.error('Get notifications error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération des notifications'
    })
  }
})

// @route   GET /api/notifications/unread-count
// @desc    Obtenir le nombre de notifications non lues
// @access  Private
router.get('/unread-count', async (req, res) => {
  try {
    const count = await Notification.countDocuments({
      userId: req.user._id,
      read: false
    })

    res.json({
      success: true,
      count
    })
  } catch (error) {
    console.error('Get unread count error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du nombre de notifications non lues'
    })
  }
})

// @route   PATCH /api/notifications/:id/read
// @desc    Marquer une notification comme lue
// @access  Private
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      })
    }

    // Vérifier que c'est bien la notification de l'utilisateur
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    notification.read = true
    await notification.save()

    res.json({
      success: true,
      message: 'Notification marquée comme lue',
      data: notification
    })
  } catch (error) {
    console.error('Mark notification as read error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour de la notification'
    })
  }
})

// @route   PATCH /api/notifications/mark-all-read
// @desc    Marquer toutes les notifications comme lues
// @access  Private
router.patch('/mark-all-read', async (req, res) => {
  try {
    const result = await Notification.updateMany(
      { userId: req.user._id, read: false },
      { read: true }
    )

    res.json({
      success: true,
      message: `${result.modifiedCount} notification(s) marquée(s) comme lue(s)`,
      count: result.modifiedCount
    })
  } catch (error) {
    console.error('Mark all notifications as read error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des notifications'
    })
  }
})

// @route   DELETE /api/notifications/:id
// @desc    Supprimer une notification
// @access  Private
router.delete('/:id', async (req, res) => {
  try {
    const notification = await Notification.findById(req.params.id)

    if (!notification) {
      return res.status(404).json({
        success: false,
        message: 'Notification non trouvée'
      })
    }

    // Vérifier que c'est bien la notification de l'utilisateur
    if (notification.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Non autorisé'
      })
    }

    await notification.deleteOne()

    res.json({
      success: true,
      message: 'Notification supprimée'
    })
  } catch (error) {
    console.error('Delete notification error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression de la notification'
    })
  }
})

// @route   DELETE /api/notifications
// @desc    Supprimer toutes les notifications de l'utilisateur
// @access  Private
router.delete('/', async (req, res) => {
  try {
    const result = await Notification.deleteMany({ userId: req.user._id })

    res.json({
      success: true,
      message: `${result.deletedCount} notification(s) supprimée(s)`,
      count: result.deletedCount
    })
  } catch (error) {
    console.error('Delete all notifications error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la suppression des notifications'
    })
  }
})

// @route   POST /api/notifications
// @desc    Créer une nouvelle notification
// @access  Private
router.post('/', async (req, res) => {
  try {
    const { alertId, alertName, message, gameType, draw } = req.body

    if (!message || !gameType) {
      return res.status(400).json({
        success: false,
        message: 'Message et gameType requis'
      })
    }

    const notification = await Notification.create({
      userId: req.user._id,
      alertId: alertId || null,
      alertName: alertName || null,
      message,
      gameType,
      draw: draw || {},
      read: false
    })

    res.status(201).json({
      success: true,
      message: 'Notification créée',
      data: notification
    })
  } catch (error) {
    console.error('Create notification error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la création de la notification'
    })
  }
})

export default router

