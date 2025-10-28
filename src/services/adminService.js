import { api } from './api'

// Récupérer les statistiques globales
export const getAdminStats = async () => {
  try {
    const response = await api.get('/admin/stats')
    return {
      success: response.success,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des statistiques'
    }
  }
}

// Récupérer tous les utilisateurs
export const getUsers = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString()
    const response = await api.get(`/admin/users?${params}`)
    return {
      success: response.success,
      data: response.data,
      pagination: response.pagination
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des utilisateurs'
    }
  }
}

// Récupérer un utilisateur par ID
export const getUserById = async (id) => {
  try {
    const response = await api.get(`/admin/users/${id}`)
    return {
      success: response.success,
      data: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération de l\'utilisateur'
    }
  }
}

// Mettre à jour un utilisateur
export const updateUser = async (id, updates) => {
  try {
    const response = await api.put(`/admin/users/${id}`, updates)
    return {
      success: response.success,
      data: response.data,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    }
  }
}

// Supprimer un utilisateur
export const deleteUser = async (id) => {
  try {
    const response = await api.delete(`/admin/users/${id}`)
    return {
      success: response.success,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    }
  }
}

// Récupérer toutes les combinaisons
export const getAllCombinations = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString()
    const response = await api.get(`/admin/combinations?${params}`)
    return {
      success: response.success,
      data: response.data,
      pagination: response.pagination
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des combinaisons'
    }
  }
}

// Supprimer une combinaison
export const deleteCombination = async (id) => {
  try {
    const response = await api.delete(`/admin/combinations/${id}`)
    return {
      success: response.success,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    }
  }
}

// Récupérer toutes les alertes
export const getAllAlerts = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString()
    const response = await api.get(`/admin/alerts?${params}`)
    return {
      success: response.success,
      data: response.data,
      pagination: response.pagination
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la récupération des alertes'
    }
  }
}

// Supprimer une alerte
export const deleteAlert = async (id) => {
  try {
    const response = await api.delete(`/admin/alerts/${id}`)
    return {
      success: response.success,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la suppression'
    }
  }
}

