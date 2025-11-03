// Service API pour communiquer avec le backend
// Utilise VITE_API_URL depuis .env ou /api par défaut

const API_URL = import.meta.env.VITE_API_URL || '/api'

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
    const fullUrl = `${API_URL}${endpoint}`
    if (import.meta.env.DEV || import.meta.env.MODE === 'development') {
      console.log('🌐 Requête API:', fullUrl, config.method || 'GET')
    }
    
    let response
    try {
      response = await fetch(fullUrl, config)
    } catch (networkError) {
      console.error('Erreur réseau:', networkError)
      console.error('URL tentée:', fullUrl)
      throw new Error('Impossible de se connecter au serveur. Vérifiez que le backend est démarré et que VITE_API_URL est correctement configuré.')
    }
    
    // Vérifier si la réponse a du contenu avant de parser le JSON
    const contentType = response.headers.get('content-type')
    const hasJsonContent = contentType && contentType.includes('application/json')
    
    let data = {}
    
    // Essayer de parser le JSON seulement si la réponse en contient
    if (hasJsonContent) {
      const text = await response.text()
      if (text && text.trim()) {
        try {
          data = JSON.parse(text)
        } catch (parseError) {
          console.error('Erreur de parsing JSON:', parseError)
          console.error('Contenu reçu:', text.substring(0, 200))
          throw new Error('Réponse invalide du serveur')
        }
      }
    } else if (response.status === 204 || response.status === 201) {
      // Réponse No Content ou Created sans body
      data = { success: true }
    }

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
      throw new Error(data.message || data.error || `Erreur ${response.status}: ${response.statusText}`)
    }

    return data
  } catch (error) {
    // Si c'est déjà une Error créée, la relancer
    if (error instanceof Error && error.message) {
      console.error('API Error:', error.message)
      throw error
    }
    
    // Sinon, créer une nouvelle Error avec un message approprié
    console.error('API Error:', error)
    throw new Error(error.message || 'Erreur de connexion au serveur')
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

    // Vérifier si la réponse a du contenu JSON
    const contentType = response.headers.get('content-type')
    if (!contentType || !contentType.includes('application/json')) {
      return false
    }

    const text = await response.text()
    if (!text) {
      return false
    }

    let data
    try {
      data = JSON.parse(text)
    } catch (parseError) {
      console.error('Erreur de parsing JSON lors du refresh:', parseError)
      return false
    }

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

