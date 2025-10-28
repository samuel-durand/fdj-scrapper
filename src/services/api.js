// Service API pour communiquer avec le backend

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

// Récupérer le token depuis localStorage
const getToken = () => {
  return localStorage.getItem('token')
}

// Récupérer le refresh token
const getRefreshToken = () => {
  return localStorage.getItem('refreshToken')
}

// Sauvegarder les tokens
export const saveTokens = (token, refreshToken) => {
  localStorage.setItem('token', token)
  if (refreshToken) {
    localStorage.setItem('refreshToken', refreshToken)
  }
}

// Supprimer les tokens
export const clearTokens = () => {
  localStorage.removeItem('token')
  localStorage.removeItem('refreshToken')
  localStorage.removeItem('currentUser')
}

// Faire une requête API
const apiRequest = async (endpoint, options = {}) => {
  const token = getToken()
  
  const config = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    }
  }

  // Ajouter le token si disponible
  if (token && !options.skipAuth) {
    config.headers['Authorization'] = `Bearer ${token}`
  }

  try {
    const response = await fetch(`${API_URL}${endpoint}`, config)
    const data = await response.json()

    // Si le token est expiré, essayer de le rafraîchir
    if (response.status === 401 && data.code === 'TOKEN_EXPIRED' && !options.skipRefresh) {
      const refreshed = await refreshAccessToken()
      if (refreshed) {
        // Retry la requête avec le nouveau token
        return apiRequest(endpoint, { ...options, skipRefresh: true })
      } else {
        // Impossible de rafraîchir, déconnecter l'utilisateur
        clearTokens()
        window.location.href = '/'
        throw new Error('Session expirée')
      }
    }

    if (!response.ok) {
      throw new Error(data.message || 'Erreur lors de la requête')
    }

    return data
  } catch (error) {
    console.error('API Error:', error)
    throw error
  }
}

// Rafraîchir le token d'accès
const refreshAccessToken = async () => {
  const refreshToken = getRefreshToken()
  
  if (!refreshToken) {
    return false
  }

  try {
    const response = await fetch(`${API_URL}/auth/refresh`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ refreshToken })
    })

    const data = await response.json()

    if (response.ok && data.success) {
      saveTokens(data.data.token, refreshToken)
      return true
    }

    return false
  } catch (error) {
    console.error('Token refresh error:', error)
    return false
  }
}

// Méthodes HTTP
export const api = {
  get: (endpoint, options = {}) => apiRequest(endpoint, { ...options, method: 'GET' }),
  
  post: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'POST',
    body: JSON.stringify(body)
  }),
  
  put: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'PUT',
    body: JSON.stringify(body)
  }),
  
  patch: (endpoint, body, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'PATCH',
    body: JSON.stringify(body)
  }),
  
  delete: (endpoint, options = {}) => apiRequest(endpoint, {
    ...options,
    method: 'DELETE'
  })
}

export default api

