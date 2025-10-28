import { api } from './api'

// Générer une combinaison aléatoire
export const generateRandomCombination = (game) => {
  const combination = { game }

  if (game === 'euromillions') {
    combination.numbers = generateUniqueNumbers(5, 1, 50)
    combination.stars = generateUniqueNumbers(2, 1, 12)
  } else if (game === 'loto') {
    combination.numbers = generateUniqueNumbers(5, 1, 49)
    combination.luckyNumber = Math.floor(Math.random() * 10) + 1
  } else if (game === 'eurodreams') {
    combination.numbers = generateUniqueNumbers(6, 1, 40)
    combination.dreamNumber = Math.floor(Math.random() * 5) + 1
  }

  return combination
}

// Générer des numéros uniques
function generateUniqueNumbers(count, min, max) {
  const numbers = []
  while (numbers.length < count) {
    const num = Math.floor(Math.random() * (max - min + 1)) + min
    if (!numbers.includes(num)) {
      numbers.push(num)
    }
  }
  return numbers.sort((a, b) => a - b)
}

// Récupérer toutes les combinaisons
export const getCombinations = async (filters = {}) => {
  try {
    const params = new URLSearchParams(filters).toString()
    const response = await api.get(`/combinations?${params}`)
    return response.success ? response.data : []
  } catch (error) {
    console.error('Get combinations error:', error)
    return []
  }
}

// Récupérer les statistiques
export const getStats = async () => {
  try {
    const response = await api.get('/combinations/stats')
    return response.success ? response.data : []
  } catch (error) {
    console.error('Get stats error:', error)
    return []
  }
}

// Sauvegarder une combinaison
export const saveCombination = async (combinationData) => {
  try {
    const response = await api.post('/combinations', combinationData)
    return {
      success: response.success,
      combination: response.data,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la sauvegarde'
    }
  }
}

// Générer via API (avec option de sauvegarde)
export const generateViaPAPI = async (game, count = 1, save = false) => {
  try {
    const response = await api.post('/combinations/generate', { game, count, save })
    return {
      success: response.success,
      combinations: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la génération'
    }
  }
}

// Mettre à jour une combinaison
export const updateCombination = async (id, updates) => {
  try {
    const response = await api.put(`/combinations/${id}`, updates)
    return {
      success: response.success,
      combination: response.data,
      message: response.message
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la mise à jour'
    }
  }
}

// Supprimer une combinaison
export const deleteCombination = async (id) => {
  try {
    const response = await api.delete(`/combinations/${id}`)
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

// Vérifier une combinaison
export const checkCombination = async (id, drawData) => {
  try {
    const response = await api.post(`/combinations/${id}/check`, drawData)
    return {
      success: response.success,
      result: response.data
    }
  } catch (error) {
    return {
      success: false,
      error: error.message || 'Erreur lors de la vérification'
    }
  }
}

