import { api, saveTokens, clearTokens } from './api'

// Inscription
export const register = async (name, email, password) => {
  try {
    const response = await api.post('/auth/register', { name, email, password }, { skipAuth: true })
    
    if (response.success) {
      // Sauvegarder les tokens
      saveTokens(response.data.token, response.data.refreshToken)
      
      // Sauvegarder l'utilisateur
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      
      return {
        success: true,
        user: response.data.user
      }
    }
    
    return {
      success: false,
      error: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de l\'inscription'
    }
  }
}

// Connexion
export const login = async (email, password) => {
  try {
    const response = await api.post('/auth/login', { email, password }, { skipAuth: true })
    
    if (response.success) {
      // Sauvegarder les tokens
      saveTokens(response.data.token, response.data.refreshToken)
      
      // Sauvegarder l'utilisateur
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      
      return {
        success: true,
        user: response.data.user
      }
    }
    
    return {
      success: false,
      error: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la connexion'
    }
  }
}

// Déconnexion
export const logout = async () => {
  try {
    await api.post('/auth/logout')
  } catch (error) {
    console.error('Logout error:', error)
  } finally {
    clearTokens()
  }
}

// Récupérer le profil utilisateur
export const getProfile = async () => {
  try {
    const response = await api.get('/auth/me')
    
    if (response.success) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      return response.data.user
    }
    
    return null
  } catch (error) {
    console.error('Get profile error:', error)
    return null
  }
}

// Mettre à jour les préférences
export const updatePreferences = async (preferences) => {
  try {
    const response = await api.put('/users/preferences', preferences)
    
    if (response.success) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      return {
        success: true,
        user: response.data.user
      }
    }
    
    return {
      success: false,
      error: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    }
  }
}

// Mettre à jour le profil
export const updateProfile = async (name, email) => {
  try {
    const response = await api.put('/users/profile', { name, email })
    
    if (response.success) {
      localStorage.setItem('currentUser', JSON.stringify(response.data.user))
      return {
        success: true,
        user: response.data.user
      }
    }
    
    return {
      success: false,
      error: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    }
  }
}

// Changer le mot de passe
export const changePassword = async (currentPassword, newPassword) => {
  try {
    const response = await api.put('/users/password', { currentPassword, newPassword })
    
    return {
      success: response.success,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors du changement de mot de passe'
    }
  }
}

