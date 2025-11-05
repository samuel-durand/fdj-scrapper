/**
 * Service pour récupérer les résultats des loteries
 * Fonctionne en développement ET en production sur o2switch
 */

// Chemin relatif vers le cache JSON
// En production, ce fichier sera à la racine du site (dist/resultats-cache.json)
const CACHE_URL = '/resultats-cache.json'

/**
 * Charge les données depuis le cache JSON
 */
async function loadCache() {
  try {
    // Ajouter un timestamp pour éviter le cache du navigateur
    const timestamp = new Date().getTime()
    const response = await fetch(`${CACHE_URL}?t=${timestamp}`, {
      cache: 'no-cache',
      headers: {
        'Cache-Control': 'no-cache'
      }
    })
    
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`)
    }
    
    const data = await response.json()
    return data
  } catch (error) {
    console.error('❌ Erreur lors du chargement du cache:', error)
    
    // Fallback : retourner des données vides
    return {
      euromillions: [],
      loto: [],
      eurodreams: []
    }
  }
}

/**
 * Récupère les résultats Euromillions
 * @param {number} limit - Nombre de résultats à retourner (défaut: tous)
 */
export async function getEuromillionsResults(limit = null) {
  const cache = await loadCache()
  const results = cache.euromillions || []
  
  if (limit) {
    return results.slice(0, limit)
  }
  
  return results
}

/**
 * Récupère les résultats Loto
 * @param {number} limit - Nombre de résultats à retourner (défaut: tous)
 */
export async function getLotoResults(limit = null) {
  const cache = await loadCache()
  const results = cache.loto || []
  
  if (limit) {
    return results.slice(0, limit)
  }
  
  return results
}

/**
 * Récupère les résultats EuroDreams
 * @param {number} limit - Nombre de résultats à retourner (défaut: tous)
 */
export async function getEurodreamsResults(limit = null) {
  const cache = await loadCache()
  const results = cache.eurodreams || []
  
  if (limit) {
    return results.slice(0, limit)
  }
  
  return results
}

/**
 * Récupère tous les résultats
 */
export async function getAllResults() {
  return await loadCache()
}

