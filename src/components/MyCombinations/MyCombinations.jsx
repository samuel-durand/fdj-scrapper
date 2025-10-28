import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { 
  getCombinations, 
  getStats, 
  updateCombination, 
  deleteCombination,
  checkCombination 
} from '../../services/combinationService'
import { getEuromillionsResults, getLotoResults, getEurodreamsResults } from '../../services/lotteryService'
import './MyCombinations.css'

export default function MyCombinations() {
  const { user } = useAuth()
  const [combinations, setCombinations] = useState([])
  const [stats, setStats] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all') // all, euromillions, loto, eurodreams, favorites
  const [showCheckModal, setShowCheckModal] = useState(false)
  const [selectedCombination, setSelectedCombination] = useState(null)

  useEffect(() => {
    if (user) {
      loadData()
    }
  }, [user, filter])

  const loadData = async () => {
    setLoading(true)
    
    const filters = {}
    if (filter !== 'all' && filter !== 'favorites') {
      filters.game = filter
    }
    if (filter === 'favorites') {
      filters.favorite = 'true'
    }

    const [combos, statistics] = await Promise.all([
      getCombinations(filters),
      getStats()
    ])

    setCombinations(combos)
    setStats(statistics)
    setLoading(false)
  }

  const handleToggleFavorite = async (id, currentStatus) => {
    const result = await updateCombination(id, { isFavorite: !currentStatus })
    if (result.success) {
      loadData()
    }
  }

  const handleDelete = async (id) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette combinaison ?')) {
      const result = await deleteCombination(id)
      if (result.success) {
        loadData()
      }
    }
  }

  const handleCheckWin = (combination) => {
    setSelectedCombination(combination)
    setShowCheckModal(true)
  }

  if (!user) {
    return (
      <div className="my-combinations">
        <div className="login-required">
          <h3>🔒 Connexion requise</h3>
          <p>Connectez-vous pour accéder à vos combinaisons sauvegardées</p>
        </div>
      </div>
    )
  }

  return (
    <div className="my-combinations">
      <div className="combinations-header">
        <h2>🎲 Mes Combinaisons</h2>
        <div className="filters">
          <button 
            className={`filter-btn ${filter === 'all' ? 'active' : ''}`}
            onClick={() => setFilter('all')}
          >
            Toutes
          </button>
          <button 
            className={`filter-btn ${filter === 'euromillions' ? 'active' : ''}`}
            onClick={() => setFilter('euromillions')}
          >
            ⭐ EuroMillions
          </button>
          <button 
            className={`filter-btn ${filter === 'loto' ? 'active' : ''}`}
            onClick={() => setFilter('loto')}
          >
            🍀 Loto
          </button>
          <button 
            className={`filter-btn ${filter === 'eurodreams' ? 'active' : ''}`}
            onClick={() => setFilter('eurodreams')}
          >
            💤 EuroDreams
          </button>
          <button 
            className={`filter-btn ${filter === 'favorites' ? 'active' : ''}`}
            onClick={() => setFilter('favorites')}
          >
            ⭐ Favoris
          </button>
        </div>
      </div>

      {stats.length > 0 && (
        <div className="stats-cards">
          {stats.map((stat) => (
            <div key={stat._id} className="stat-card">
              <h4>{getGameName(stat._id)}</h4>
              <div className="stat-value">{stat.total}</div>
              <div className="stat-details">
                <span>⭐ {stat.favorites} favoris</span>
                <span>🎯 {stat.played} jouées</span>
                {stat.won > 0 && <span className="won">🏆 {stat.won} gagnantes!</span>}
              </div>
            </div>
          ))}
        </div>
      )}

      {loading ? (
        <div className="loading">Chargement...</div>
      ) : combinations.length === 0 ? (
        <div className="no-combinations">
          <span className="empty-icon">🎲</span>
          <p>Aucune combinaison sauvegardée</p>
          <p className="help-text">Générez et sauvegardez vos combinaisons depuis les onglets de jeux</p>
        </div>
      ) : (
        <div className="combinations-list">
          {combinations.map((combo) => (
            <CombinationCard
              key={combo.id}
              combination={combo}
              onToggleFavorite={handleToggleFavorite}
              onDelete={handleDelete}
              onCheck={handleCheckWin}
            />
          ))}
        </div>
      )}

      {showCheckModal && selectedCombination && (
        <CheckWinModal
          combination={selectedCombination}
          onClose={() => {
            setShowCheckModal(false)
            setSelectedCombination(null)
            loadData()
          }}
        />
      )}
    </div>
  )
}

function CombinationCard({ combination, onToggleFavorite, onDelete, onCheck }) {
  const gameIcons = {
    euromillions: '⭐',
    loto: '🍀',
    eurodreams: '💤'
  }

  return (
    <div className={`combination-card ${combination.result?.hasWon ? 'won' : ''}`}>
      <div className="card-header">
        <div className="card-title">
          <span className="game-icon">{gameIcons[combination.game]}</span>
          <h4>{combination.name || `${getGameName(combination.game)} - ${new Date(combination.createdAt).toLocaleDateString('fr-FR')}`}</h4>
        </div>
        <div className="card-actions">
          <button
            className={`favorite-btn ${combination.isFavorite ? 'active' : ''}`}
            onClick={() => onToggleFavorite(combination.id, combination.isFavorite)}
            title="Favori"
          >
            {combination.isFavorite ? '⭐' : '☆'}
          </button>
          <button
            className="delete-btn"
            onClick={() => onDelete(combination.id)}
            title="Supprimer"
          >
            🗑️
          </button>
        </div>
      </div>

      <div className="card-numbers">
        <div className="numbers-row">
          <span className="label">Numéros :</span>
          <div className="numbers">
            {combination.numbers.map((num, idx) => (
              <span key={idx} className="number primary">{num}</span>
            ))}
          </div>
        </div>

        {combination.stars && (
          <div className="numbers-row">
            <span className="label">Étoiles :</span>
            <div className="numbers">
              {combination.stars.map((star, idx) => (
                <span key={idx} className="number star">{star}</span>
              ))}
            </div>
          </div>
        )}

        {combination.luckyNumber && (
          <div className="numbers-row">
            <span className="label">Chance :</span>
            <span className="number lucky">{combination.luckyNumber}</span>
          </div>
        )}

        {combination.dreamNumber && (
          <div className="numbers-row">
            <span className="label">Dream :</span>
            <span className="number dream">{combination.dreamNumber}</span>
          </div>
        )}
      </div>

      {combination.result?.hasWon && (
        <div className="win-badge">
          🏆 Gagnant ! {combination.result.rank && `Rang ${combination.result.rank}`}
        </div>
      )}

      <div className="card-footer">
        <span className="date">
          {new Date(combination.createdAt).toLocaleDateString('fr-FR', {
            day: '2-digit',
            month: 'short',
            year: 'numeric'
          })}
        </span>
        <button className="check-btn" onClick={() => onCheck(combination)}>
          🔍 Vérifier gain
        </button>
      </div>
    </div>
  )
}

function CheckWinModal({ combination, onClose }) {
  const [draws, setDraws] = useState([])
  const [selectedDraw, setSelectedDraw] = useState(null)
  const [result, setResult] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadDraws()
  }, [])

  const loadDraws = async () => {
    let results = []
    if (combination.game === 'euromillions') {
      results = await getEuromillionsResults(10)
    } else if (combination.game === 'loto') {
      results = await getLotoResults(10)
    } else if (combination.game === 'eurodreams') {
      results = await getEurodreamsResults(10)
    }
    setDraws(results)
    setLoading(false)
  }

  const handleCheck = async () => {
    if (!selectedDraw) return

    const drawData = {
      drawNumbers: selectedDraw.numbers || selectedDraw.balls,
      drawStars: selectedDraw.stars,
      drawLuckyNumber: selectedDraw.luckyNumber
    }

    const checkResult = await checkCombination(combination.id, drawData)
    
    if (checkResult.success) {
      setResult(checkResult.result.result)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="check-win-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h3>🔍 Vérifier les gains</h3>
        
        <div className="combination-display">
          <p>Votre combinaison :</p>
          <div className="numbers">
            {combination.numbers.map((num, idx) => (
              <span key={idx} className="number primary">{num}</span>
            ))}
            {combination.stars?.map((star, idx) => (
              <span key={idx} className="number star">{star}</span>
            ))}
            {combination.luckyNumber && (
              <span className="number lucky">{combination.luckyNumber}</span>
            )}
          </div>
        </div>

        <div className="draw-selector">
          <label>Sélectionnez un tirage :</label>
          {loading ? (
            <p>Chargement des tirages...</p>
          ) : (
            <select 
              value={selectedDraw?.id || ''} 
              onChange={(e) => {
                const draw = draws.find(d => d.id === e.target.value)
                setSelectedDraw(draw)
                setResult(null)
              }}
            >
              <option value="">-- Choisir un tirage --</option>
              {draws.map((draw) => (
                <option key={draw.id} value={draw.id}>
                  {new Date(draw.date).toLocaleDateString('fr-FR')} - 
                  {' '}{(draw.numbers || draw.balls).join(', ')}
                </option>
              ))}
            </select>
          )}
        </div>

        <button 
          className="check-button"
          onClick={handleCheck}
          disabled={!selectedDraw}
        >
          Vérifier
        </button>

        {result && (
          <div className={`result-display ${result.hasWon ? 'won' : 'lost'}`}>
            {result.hasWon ? (
              <>
                <div className="result-icon">🎉</div>
                <h4>Félicitations ! Vous avez gagné !</h4>
                {result.rank && <p className="rank">Rang : {result.rank}</p>}
                <p>Numéros correspondants : {result.matchedNumbers.join(', ')}</p>
                {result.matchedStars?.length > 0 && (
                  <p>Étoiles correspondantes : {result.matchedStars.join(', ')}</p>
                )}
              </>
            ) : (
              <>
                <div className="result-icon">😔</div>
                <h4>Pas de gain cette fois</h4>
                <p>Numéros correspondants : {result.matchedNumbers.length > 0 ? result.matchedNumbers.join(', ') : 'Aucun'}</p>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function getGameName(game) {
  const names = {
    euromillions: 'EuroMillions',
    loto: 'Loto',
    eurodreams: 'EuroDreams'
  }
  return names[game] || game
}

