import jwt from 'jsonwebtoken'
import User from '../models/User.js'

export const protect = async (req, res, next) => {
  try {
    let token

    // Récupérer le token depuis le header Authorization
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
      token = req.headers.authorization.split(' ')[1]
    }

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Token manquant'
      })
    }

    try {
      // Vérifier le token
      const decoded = jwt.verify(token, process.env.JWT_SECRET)

      // Récupérer l'utilisateur (sans le mot de passe)
      req.user = await User.findById(decoded.id).select('-password -refreshToken')

      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Utilisateur non trouvé'
        })
      }

      if (!req.user.isActive) {
        return res.status(401).json({
          success: false,
          message: 'Compte désactivé'
        })
      }

      next()
    } catch (error) {
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token expiré',
          code: 'TOKEN_EXPIRED'
        })
      }

      return res.status(401).json({
        success: false,
        message: 'Token invalide'
      })
    }
  } catch (error) {
    console.error('Auth middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur d\'authentification'
    })
  }
}

// Middleware optionnel : vérifie si l'utilisateur est l'owner de la ressource
export const isOwner = (resourceUserId) => {
  return (req, res, next) => {
    if (req.user._id.toString() !== resourceUserId.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Vous n\'êtes pas autorisé'
      })
    }
    next()
  }
}

// Middleware : vérifie si l'utilisateur est admin
export const isAdmin = async (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: 'Non autorisé - Utilisateur non authentifié'
      })
    }

    if (req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Accès refusé - Droits administrateur requis'
      })
    }

    next()
  } catch (error) {
    console.error('Admin middleware error:', error)
    res.status(500).json({
      success: false,
      message: 'Erreur de vérification des droits'
    })
  }
}

