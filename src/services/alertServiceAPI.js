import { api } from './api'

// Récupérer toutes les alertes
export const getAlerts = async () => {
  try {
    const response = await api.get('/alerts')
    // L'API retourne { success: true, data: [...] }
    if (response.success && Array.isArray(response.data)) {
      return response.data
    }
    // Fallback si la structure est différente
    if (Array.isArray(response)) {
      return response
    }
    return []
  } catch (error) {
    console.error('Get alerts error:', error)
    return []
  }
}

// Créer une alerte
export const createAlert = async (alertData) => {
  try {
    const response = await api.post('/alerts', alertData)
    return {
      success: response.success,
      alert: response.data,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la création de l\'alerte'
    }
  }
}

// Mettre à jour une alerte
export const updateAlert = async (alertId, updates) => {
  try {
    const response = await api.put(`/alerts/${alertId}`, updates)
    return {
      success: response.success,
      alert: response.data,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour de l\'alerte'
    }
  }
}

// Supprimer une alerte
export const deleteAlert = async (alertId) => {
  try {
    const response = await api.delete(`/alerts/${alertId}`)
    return {
      success: response.success,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression de l\'alerte'
    }
  }
}

// Toggle alerte (activer/désactiver)
export const toggleAlert = async (alertId) => {
  try {
    const response = await api.patch(`/alerts/${alertId}/toggle`)
    return {
      success: response.success,
      alert: response.data,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors du toggle de l\'alerte'
    }
  }
}

