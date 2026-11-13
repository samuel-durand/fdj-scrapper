/**
 * Service pour récupérer les résultats des loteries depuis l'API (GET /api/draws),
 * alimentée en base par le scraper/worker Python.
 *
 * Les données sont téléchargées une seule fois puis partagées entre tous les composants,
 * et rafraîchies au plus toutes les 5 min (le serveur gère aussi le cache HTTP / ETag).
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'
const TTL = 5 * 60 * 1000
const EMPTY = { euromillions: [], loto: [], eurodreams: [], nextDraws: {} }

let pending = null
let loadedAt = 0

async function fetchCache() {
  const response = await fetch(`${API_URL}/draws`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  return { ...EMPTY, ...(await response.json()) }
}

function loadCache({ force = false } = {}) {
  if (!pending || force || Date.now() - loadedAt > TTL) {
    loadedAt = Date.now()
    pending = fetchCache().catch((error) => {
      console.error('❌ Erreur lors du chargement du cache:', error)
      pending = null
      throw error
    })
  }
  return pending
}

const take = (list, limit) => (limit ? list.slice(0, limit) : list)

export async function getGameData(game, { force = false } = {}) {
  const cache = await loadCache({ force })
  return {
    draws: cache[game] || [],
    nextDraw: cache.nextDraws?.[game] || null,
    lastUpdate: cache.lastUpdate || null,
  }
}

export async function getEuromillionsResults(limit = null) {
  return take((await loadCache().catch(() => EMPTY)).euromillions || [], limit)
}

export async function getLotoResults(limit = null) {
  return take((await loadCache().catch(() => EMPTY)).loto || [], limit)
}

export async function getEurodreamsResults(limit = null) {
  return take((await loadCache().catch(() => EMPTY)).eurodreams || [], limit)
}

export async function getAllResults() {
  return loadCache().catch(() => EMPTY)
}
