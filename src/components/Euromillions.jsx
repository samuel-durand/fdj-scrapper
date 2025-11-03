import { useState, useEffect } from 'react'
import './Lottery.css'
import { getEuromillionsResults } from '../services/lotteryService'
import Calendar from './Calendar'
import Pagination from './Pagination'
import DrawDetailsModal from './DrawDetailsModal'
import Statistics from './Statistics'
import GameStatistics from './GameStatistics'

function Euromillions() {
  const [draws, setDraws] = useState([])
  const [displayedDraws, setDisplayedDraws] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [viewMode, setViewMode] = useState('list') // 'list', 'calendar', 'pagination', 'statistics' ou 'charts'
  const [selectedDraw, setSelectedDraw] = useState(null)
  const [modalDraw, setModalDraw] = useState(null) // Tirage affiché dans la modale

  useEffect(() => {
    async function fetchResults() {
      try {
        setLoading(true)
        setError(null)
        const results = await getEuromillionsResults(50) // Récupérer tous les résultats
        console.log('🎯 Euromillions - Nombre de tirages:', results.length)
        console.log('🎯 Premier tirage:', results[0])
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
        <h2>⭐ Euromillions - My Million</h2>
        <p>Retrouvez les derniers résultats des tirages Euromillions</p>
        
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
        <button
          className={`toggle-btn ${viewMode === 'charts' ? 'active' : ''}`}
          onClick={() => setViewMode('charts')}
        >
          📊 Graphiques
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
        gameType="euromillions"
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
              className={`draw-card euromillions ${
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
                    <div key={index} className="ball number-ball">{num}</div>
                  ))}
                </div>
                <div className="stars-label">Étoiles</div>
                <div className="stars">
                  {draw.stars.map((star, index) => (
                    <div key={index} className="ball star-ball">⭐ {star}</div>
                  ))}
                </div>
              </div>
              
              {draw.myMillionCode && (
                <div className="my-million-code">
                  <span className="icon">🎫</span>
                  <span className="label">My Million :</span>
                  <span className="code">{draw.myMillionCode}</span>
                </div>
              )}
            </div>
          ))}
        </div>
      </>
    )}

    {!loading && !error && viewMode === 'statistics' && (
      <Statistics draws={draws} gameType="euromillions" />
    )}

    {!loading && !error && viewMode === 'charts' && (
      <GameStatistics gameType="euromillions" />
    )}

    {!loading && !error && viewMode === 'list' && (
      <div className="draws-grid">
      {draws.slice(0, 5).map((draw) => (
          <div 
            key={draw.id} 
            id={`draw-${draw.id}`}
            className={`draw-card euromillions ${
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
                  <div key={index} className="ball number-ball">{num}</div>
                ))}
              </div>
              
              <div className="stars-label">Étoiles</div>
              <div className="stars">
                {draw.stars.map((star, index) => (
                  <div key={index} className="ball star-ball">⭐ {star}</div>
                ))}
              </div>
            </div>
            
            {draw.myMillionCode && (
              <div className="my-million-code">
                <span className="icon">🎫</span>
                <span className="label">My Million :</span>
                <span className="code">{draw.myMillionCode}</span>
              </div>
            )}
          </div>
        ))}
        </div>
      )}

      <div className="info-box">
        <h3>Comment jouer à l'Euromillions ?</h3>
        <p>Choisissez 5 numéros entre 1 et 50 et 2 étoiles entre 1 et 12. Les tirages ont lieu le mardi et le vendredi soir.</p>
      </div>

      {/* Modale des détails */}
      {modalDraw && (
        <DrawDetailsModal
          draw={modalDraw}
          gameType="euromillions"
          onClose={() => setModalDraw(null)}
        />
      )}
    </div>
  )
}

export default Euromillions

