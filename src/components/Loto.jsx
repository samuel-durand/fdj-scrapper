import { useState, useEffect } from 'react'
import './Lottery.css'
import { getLotoResults } from '../services/lotteryService'
import Calendar from './Calendar'
import Pagination from './Pagination'
import DrawDetailsModal from './DrawDetailsModal'
import Statistics from './Statistics'

function Loto() {
  const [draws, setDraws] = useState([])
  const [displayedDraws, setDisplayedDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'calendar', 'pagination' ou 'statistics'
  const [selectedDraw, setSelectedDraw] = useState(null)
  const [modalDraw, setModalDraw] = useState(null) // Tirage affiché dans la modale

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true)
        setError(null)
        const results = await getLotoResults(50) // Récupérer tous les résultats
        setDraws(results)
        setDisplayedDraws(results.slice(0, 5)) // Afficher les 5 premiers par défaut
      } catch (err) {
        setError('Impossible de charger les résultats')
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchResults()
  }, [])

  // Gérer la sélection depuis le calendrier
  const handleDateSelect = (draw) => {
    setSelectedDraw(draw)
    setViewMode('list')
    // Scroll vers le résultat
    setTimeout(() => {
      document.getElementById(`draw-${draw.id}`)?.scrollIntoView({ 
        behavior: 'smooth', 
        block: 'center' 
      })
    }, 100)
  }

  return (
    <div className="lottery-container">
      <div className="lottery-header">
        <h2>🍀 Loto</h2>
        <p>Retrouvez les derniers résultats des tirages du Loto</p>
        
      <div className="view-toggle">
        <button
          className={`toggle-btn ${viewMode === 'list' ? 'active' : ''}`}
          onClick={() => setViewMode('list')}
        >
          📋 Liste Simple
        </button>
        <button
          className={`toggle-btn ${viewMode === 'pagination' ? 'active' : ''}`}
          onClick={() => setViewMode('pagination')}
        >
          📊 Tous les Tirages
        </button>
        <button
          className={`toggle-btn ${viewMode === 'calendar' ? 'active' : ''}`}
          onClick={() => setViewMode('calendar')}
        >
          📅 Calendrier
        </button>
        <button
          className={`toggle-btn ${viewMode === 'statistics' ? 'active' : ''}`}
          onClick={() => setViewMode('statistics')}
        >
          📈 Statistiques
        </button>
      </div>
    </div>

    {loading && (
      <div className="loading-message">
        <div className="spinner"></div>
        <p>Chargement des résultats...</p>
      </div>
    )}

    {error && (
      <div className="error-message">
        <p>⚠️ {error}</p>
        <button onClick={() => window.location.reload()}>Réessayer</button>
      </div>
    )}

    {!loading && !error && viewMode === 'calendar' && (
      <Calendar
        gameType="loto"
        draws={draws}
        onDateSelect={handleDateSelect}
      />
    )}

    {!loading && !error && viewMode === 'pagination' && (
      <>
        <Pagination
          draws={draws}
          itemsPerPage={5}
          onPageChange={setDisplayedDraws}
        />
        <div className="draws-grid">
          {displayedDraws.map((draw) => (
            <div
              key={draw.id}
              id={`draw-${draw.id}`}
              className={`draw-card loto ${
                selectedDraw?.id === draw.id ? 'highlighted' : ''
              }`}
              onClick={() => setModalDraw(draw)}
              style={{ cursor: 'pointer' }}
            >
              <div className="draw-date">
                <span className="day">{draw.day}</span>
                <span className="date">{draw.date}</span>
              </div>
              {draw.jackpot && draw.jackpot !== 'Non disponible' && (
                <div className="jackpot">
                  <span className="jackpot-label">Jackpot</span>
                  <span className="jackpot-amount">{draw.jackpot}</span>
                </div>
              )}
              <div className="numbers-section">
                <div className="numbers-label">Numéros gagnants</div>
                <div className="numbers">
                  {draw.numbers.map((num, index) => (
                    <div key={index} className="ball loto-ball">{num}</div>
                  ))}
                </div>
                <div className="lucky-number-section">
                  <div className="lucky-label">Numéro Chance</div>
                  <div className="ball lucky-ball">🍀 {draw.luckyNumber}</div>
                </div>
              </div>
              
              {draw.secondDraw && (
                <div className="second-draw">
                  <h4>🎲 2ème tirage</h4>
                  <div className="numbers">
                    {draw.secondDraw.map((num, index) => (
                      <div key={index} className="ball">{num}</div>
                    ))}
                  </div>
                </div>
              )}
              
              {draw.jokerPlus && (
                <div className="joker-plus">
                  <span className="icon">🎫</span>
                  <span className="label">Joker+ :</span>
                  <span className="code">{draw.jokerPlus}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    )}

    {!loading && !error && viewMode === 'statistics' && (
      <Statistics draws={draws} gameType="loto" />
    )}

    {!loading && !error && viewMode === 'list' && (
      <div className="draws-grid">
      {draws.slice(0, 5).map((draw) => (
          <div 
            key={draw.id} 
            id={`draw-${draw.id}`}
            className={`draw-card loto ${
              selectedDraw?.id === draw.id ? 'highlighted' : ''
            }`}
          >
            <div className="draw-date">
              <span className="day">{draw.day}</span>
              <span className="date">{draw.date}</span>
            </div>
            
            {draw.jackpot && draw.jackpot !== 'Non disponible' && (
              <div className="jackpot">
                <span className="jackpot-label">Jackpot</span>
                <span className="jackpot-amount">{draw.jackpot}</span>
              </div>
            )}

            <div className="numbers-section">
              <div className="numbers-label">Numéros gagnants</div>
              <div className="numbers">
                {draw.numbers.map((num, index) => (
                  <div key={index} className="ball loto-ball">{num}</div>
                ))}
              </div>
              
              <div className="lucky-number-section">
                <div className="lucky-label">Numéro Chance</div>
                <div className="ball lucky-ball">🍀 {draw.luckyNumber}</div>
              </div>
            </div>
            
            {draw.secondDraw && (
              <div className="second-draw">
                <h4>🎲 2ème tirage</h4>
                <div className="numbers">
                  {draw.secondDraw.map((num, index) => (
                    <div key={index} className="ball">{num}</div>
                  ))}
                </div>
              </div>
            )}
            
            {draw.jokerPlus && (
              <div className="joker-plus">
                <span className="icon">🎫</span>
                <span className="label">Joker+ :</span>
                <span className="code">{draw.jokerPlus}</span>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      <div className="info-box">
        <h3>Comment jouer au Loto ?</h3>
        <p>Choisissez 5 numéros entre 1 et 49 et 1 numéro chance entre 1 et 10. Les tirages ont lieu le lundi, mercredi et samedi soir.</p>
      </div>

      {/* Modale des détails */}
      {modalDraw && (
        <DrawDetailsModal
          draw={modalDraw}
          gameType="loto"
          onClose={() => setModalDraw(null)}
        />
      )}
    </div>
  )
}

export default Loto

