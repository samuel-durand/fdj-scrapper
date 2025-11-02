import express from 'express'
import jwt from 'jsonwebtoken'
import User from '../models/User.js'
import { protect } from '../middleware/auth.js'

const router = express.Router()

// Générer le JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE || '7d'
  })
}

// Générer le Refresh Token
const generateRefreshToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_REFRESH_SECRET, {
    expiresIn: process.env.JWT_REFRESH_EXPIRE || '30d'
  })
}

// @route   POST /api/auth/register
// @desc    Inscription d'un nouvel utilisateur
// @access  Public
router.post('/register', async (req, res) => {
  try {
    const { name, email, password } = req.body

    // Validation
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Veuillez remplir tous les champs'
      })
    }

    // Vérifier si l'utilisateur existe déjà
    const userExists = await User.findOne({ email: email.toLowerCase() })
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Cet email est déjà utilisé'
      })
    }

    // Créer l'utilisateur
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      password
    })

    // Générer les tokens
    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Sauvegarder le refresh token
    user.refreshToken = refreshToken
    await user.save()

    res.status(201).json({
      success: true,
      message: 'Inscription réussie',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Register error:', error)
    res.status(500).json({
      success: false,
      message: error.message || 'Erreur lors de l\'inscription'
    })
  }
})

// @route   POST /api/auth/login
// @desc    Connexion utilisateur
// @access  Public
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body

    // Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email et mot de passe requis'
      })
    }

    // Récupérer l'utilisateur avec le mot de passe
    const user = await User.findOne({ email: email.toLowerCase() }).select('+password')

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      })
    }

    // Vérifier le mot de passe
    const isPasswordMatch = await user.comparePassword(password)

    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: 'Email ou mot de passe incorrect'
      })
    }

    // Vérifier si le compte est actif
    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: 'Compte désactivé'
      })
    }

    // Mettre à jour la dernière connexion
    user.lastLogin = new Date()
    
    // Générer les tokens
    const token = generateToken(user._id)
    const refreshToken = generateRefreshToken(user._id)

    // Sauvegarder le refresh token
    user.refreshToken = refreshToken
    await user.save()

    res.json({
      success: true,
      message: 'Connexion réussie',
      data: {
        user: user.toJSON(),
        token,
        refreshToken
      }
    })
  } catch (error) {
    console.error('Login error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la connexion'
    })
  }
})

// @route   POST /api/auth/refresh
// @desc    Rafraîchir le token d'accès
// @access  Public
router.post('/refresh', async (req, res) => {
  try {
    const { refreshToken } = req.body

    if (!refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token manquant'
      })
    }

    // Vérifier le refresh token
    const decoded = jwt.verify(refreshToken, process.env.JWT_REFRESH_SECRET)

    // Récupérer l'utilisateur
    const user = await User.findById(decoded.id).select('+refreshToken')

    if (!user || user.refreshToken !== refreshToken) {
      return res.status(401).json({
        success: false,
        message: 'Refresh token invalide'
      })
    }

    // Générer un nouveau token
    const newToken = generateToken(user._id)

    res.json({
      success: true,
      data: {
        token: newToken
      }
    })
  } catch (error) {
    console.error('Refresh token error:', error)
    res.status(401).json({
      success: false,
      message: 'Refresh token invalide ou expiré'
    })
  }
})

// @route   POST /api/auth/logout
// @desc    Déconnexion utilisateur
// @access  Private
router.post('/logout', protect, async (req, res) => {
  try {
    // Supprimer le refresh token
    req.user.refreshToken = undefined
    await req.user.save()

    res.json({
      success: true,
      message: 'Déconnexion réussie'
    })
  } catch (error) {
    console.error('Logout error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la déconnexion'
    })
  }
})

// @route   GET /api/auth/me
// @desc    Récupérer l'utilisateur connecté
// @access  Private
router.get('/me', protect, async (req, res) => {
  try {
    res.json({
      success: true,
      data: {
        user: req.user
      }
    })
  } catch (error) {
    console.error('Get me error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur lors de la récupération du profil'
    })
  }
})

export default router

