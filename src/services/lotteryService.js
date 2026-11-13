/**
 * Résultats des tirages depuis l'API (GET /api/draws/<jeu>), alimentée par le scraper/worker Python.
 *
 * Chaque jeu n'est téléchargé que lorsqu'on l'affiche, puis gardé en mémoire et rafraîchi au plus
 * toutes les 5 min (le serveur gère aussi le cache HTTP / ETag et la compression).
 */

const API_URL = import.meta.env.VITE_API_URL || '/api'
const TTL = 5 * 60 * 1000

const cache = new Map() // jeu -> { pending, loadedAt }

async function fetchGame(game) {
  const response = await fetch(`${API_URL}/draws/${game}`)
  if (!response.ok) throw new Error(`HTTP ${response.status}`)
  const body = await response.json()
  return { draws: body.data || [], nextDraw: body.nextDraw || null, lastUpdate: body.lastUpdate || null }
}

function load(game, { force = false } = {}) {
  const entry = cache.get(game)
  if (entry && !force && Date.now() - entry.loadedAt < TTL) return entry.pending
  const pending = fetchGame(game).catch((error) => {
    console.error(`❌ Erreur lors du chargement des tirages (${game}) :`, error)
    cache.delete(game)
    throw error
  })
  cache.set(game, { pending, loadedAt: Date.now() })
  return pending
}

export function getGameData(game, options) {
  return load(game, options)
}

const take = (list, limit) => (limit ? list.slice(0, limit) : list)
const drawsOf = async (game, limit) => take((await load(game).catch(() => ({ draws: [] }))).draws, limit)

export const getEuromillionsResults = (limit = null) => drawsOf('euromillions', limit)
export const getLotoResults = (limit = null) => drawsOf('loto', limit)
export const getEurodreamsResults = (limit = null) => drawsOf('eurodreams', limit)

/** Les trois jeux à grille (statistiques globales) : { euromillions: [...], loto: [...], eurodreams: [...] }. */
export async function getAllResults() {
  const games = ['euromillions', 'loto', 'eurodreams']
  const lists = await Promise.all(games.map((g) => drawsOf(g)))
  return Object.fromEntries(games.map((g, i) => [g, lists[i]]))
}
