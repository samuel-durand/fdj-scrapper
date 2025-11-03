import express from 'express'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Toutes les routes nécessitent l'authentification
router.use(protect)

// @route   PUT /api/users/preferences
// @desc    Mettre à jour les préférences utilisateur
// @access  Private
router.put('/preferences', async (req, res) => {
  try {
    const { favoriteGames, defaultTab, notifications, theme } = req.body

    const updates = {}
    if (favoriteGames !== undefined) updates['preferences.favoriteGames'] = favoriteGames
    if (defaultTab !== undefined) updates['preferences.defaultTab'] = defaultTab
    if (notifications !== undefined) updates['preferences.notifications'] = notifications
    if (theme !== undefined) updates['preferences.theme'] = theme

    const user = await User.findByIdAndUpdate(
      req.user._id,
      { $set: updates },
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Préférences mises à jour',
      data: {
        user
      }
    })
  } catch (error) {
    console.error('Update preferences error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour des préférences'
    })
  }
})

// @route   PUT /api/users/profile
// @desc    Mettre à jour le profil utilisateur
// @access  Private
router.put('/profile', async (req, res) => {
  try {
    const { name, email } = req.body

    const updates = {}
    if (name) updates.name = name
    if (email) updates.email = email.toLowerCase()

    // Vérifier si l'email existe déjà
    if (email) {
      const emailExists = await User.findOne({ 
        email: email.toLowerCase(),
        _id: { $ne: req.user._id }
      })
      
      if (emailExists) {
        return res.status(400).json({
          success: false,
          message: 'Cet email est déjà utilisé'
        })
      }
    }

    const user = await User.findByIdAndUpdate(
      req.user._id,
      updates,
      { new: true, runValidators: true }
    )

    res.json({
      success: true,
      message: 'Profil mis à jour',
      data: {
        user
      }
    })
  } catch (error) {
    console.error('Update profile error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la mise à jour du profil'
    })
  }
})

// @route   PUT /api/users/password
// @desc    Changer le mot de passe
// @access  Private
router.put('/password', async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'Mot de passe actuel et nouveau mot de passe requis'
      })
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Le nouveau mot de passe doit contenir au moins 6 caractères'
      })
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findById(req.user._id).select('+password')

    // Vérifier le mot de passe actuel
    const isPasswordMatch = await user.comparePassword(currentPassword)
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Mot de passe actuel incorrect'
      })
    }

    // Mettre à jour le mot de passe
    user.password = newPassword
    await user.save()

    res.json({
      success: true,
      message: 'Mot de passe modifié avec succès'
    })
  } catch (error) {
    console.error('Change password error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors du changement de mot de passe'
    })
  }
})

export default router

