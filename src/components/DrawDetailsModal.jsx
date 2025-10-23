import { useEffect } from 'react'
import './DrawDetailsModal.css'

function DrawDetailsModal({ draw, gameType, onClose }) {
  // Fermer avec la touche Escape
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleEscape)
    return () => window.removeEventListener('keydown', handleEscape)
  }, [onClose])

  if (!draw) return null

  const formatCurrency = (amount) => {
    if (typeof amount === 'string') return amount
    if (amount === 'Non disponible' || amount === '/') return amount
    return new Intl.NumberFormat('fr-FR', {
      style: 'currency',
      currency: 'EUR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount)
  }

  const formatWinners = (winners) => {
    if (typeof winners === 'string') {
      // Si c'est déjà une chaîne, la retourner directement
      if (winners === '/' || winners === 'Non disponible') return '0'
      return winners
    }
    // Si c'est un nombre, le formater
    return winners.toLocaleString('fr-FR')
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>✕</button>
        
        <div className="modal-header">
          <h2>
            {gameType === 'euromillions' && '⭐ EuroMillions'}
            {gameType === 'loto' && '🎲 Loto'}
            {gameType === 'eurodreams' && '💤 EuroDreams'}
          </h2>
          <div className="modal-date">
            <span className="modal-day">{draw.day}</span>
            <span className="modal-date-text">{draw.date}</span>
          </div>
        </div>

        <div className="modal-body">
          {/* Numéros gagnants */}
          <div className="modal-section">
            <h3>🎯 Numéros gagnants</h3>
            <div className="modal-numbers">
              {draw.numbers && draw.numbers.map((num, index) => (
                <div key={index} className="modal-ball modal-number-ball">{num}</div>
              ))}
            </div>
            {gameType === 'euromillions' && draw.stars && (
              <>
                <h3>⭐ Étoiles</h3>
                <div className="modal-numbers">
                  {draw.stars.map((star, index) => (
                    <div key={index} className="modal-ball modal-star-ball">{star}</div>
                  ))}
                </div>
              </>
            )}
            {gameType === 'euromillions' && draw.myMillionCode && (
              <div className="my-million-code" style={{ marginTop: '20px' }}>
                <span className="icon">🎫</span>
                <span className="label">Code My Million :</span>
                <span className="code">{draw.myMillionCode}</span>
              </div>
            )}
            {gameType === 'eurodreams' && draw.dreamNumber !== undefined && (
              <>
                <h3>💤 Dream Number</h3>
                <div className="modal-numbers">
                  <div className="modal-ball modal-dream-ball">{draw.dreamNumber}</div>
                </div>
              </>
            )}
            {gameType === 'loto' && draw.luckyNumber !== undefined && (
              <>
                <h3>🍀 Numéro Chance</h3>
                <div className="modal-numbers">
                  <div className="modal-ball modal-lucky-ball">{draw.luckyNumber}</div>
                </div>
              </>
            )}
            {gameType === 'loto' && draw.secondDraw && (
              <div className="second-draw" style={{ marginTop: '20px' }}>
                <h4>🎲 2ème tirage</h4>
                <div className="numbers">
                  {draw.secondDraw.map((num, index) => (
                    <div key={index} className="ball">{num}</div>
                  ))}
                </div>
              </div>
            )}
            {gameType === 'loto' && draw.jokerPlus && (
              <div className="joker-plus" style={{ marginTop: '15px' }}>
                <span className="icon">🎫</span>
                <span className="label">Joker+ :</span>
                <span className="code">{draw.jokerPlus}</span>
              </div>
            )}
          </div>

          {/* Jackpot */}
          <div className="modal-section modal-jackpot">
            <h3>💰 {gameType === 'eurodreams' ? 'Rente mensuelle' : 'Jackpot'}</h3>
            <div className="modal-jackpot-amount">{draw.jackpot}</div>
          </div>

          {/* Répartition des gains */}
          {(draw.winningsDistribution || draw.winnings) && (
            <div className="modal-section">
              <h3>📊 Répartition des gains</h3>
              <div className="winnings-table">
                <div className="winnings-header">
                  <div>Rang</div>
                  <div>Combinaison</div>
                  <div>Gagnants</div>
                  <div>Gains</div>
                </div>
                {(draw.winningsDistribution || draw.winnings).map((winning, index) => {
                  const winners = winning.winners || 0
                  const hasWinners = (typeof winners === 'string' ? parseInt(winners) : winners) > 0
                  return (
                    <div key={index} className={`winnings-row ${hasWinners ? 'has-winners' : ''}`}>
                      <div className="winnings-rank">Rang {winning.rank}</div>
                      <div className="winnings-combination">{winning.combination}</div>
                      <div className="winnings-count">{formatWinners(winners)}</div>
                      <div className="winnings-amount">{formatCurrency(winning.amount || winning.prize)}</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Informations complémentaires */}
          <div className="modal-section modal-info">
            <div className="info-item">
              <span className="info-label">ID du tirage :</span>
              <span className="info-value">{draw.id}</span>
            </div>
            {draw.drawNumber && (
              <div className="info-item">
                <span className="info-label">N° de tirage :</span>
                <span className="info-value">{draw.drawNumber}</span>
              </div>
            )}
          </div>
        </div>

        <div className="modal-footer">
          <button className="modal-btn-close" onClick={onClose}>Fermer</button>
        </div>
      </div>
    </div>
  )
}

export default DrawDetailsModal

