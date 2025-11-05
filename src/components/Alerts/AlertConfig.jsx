import { useState } from 'react'
import { createAlert } from '../../services/alertServiceAPI'
import { ALERT_TYPES, GAMES } from '../../services/alertService'
import './Alerts.css'

export default function AlertConfig({ userId, onClose, onAlertCreated }) {
  // userId n'est plus nécessaire car l'API utilise le token, mais on le garde pour compatibilité
  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [alertConfig, setAlertConfig] = useState({
    type: ALERT_TYPES.JACKPOT_THRESHOLD,
    game: GAMES.EUROMILLIONS,
    name: '',
    enabled: true
  })

  const handleNext = () => {
    if (step < 3) setStep(step + 1)
  }

  const handleBack = () => {
    if (step > 1) setStep(step - 1)
  }

  const handleCreate = async () => {
    try {
      setLoading(true)
      setError(null)
      
      // Préparer les données pour l'API
      const alertData = {
        name: alertConfig.name,
        type: alertConfig.type,
        game: alertConfig.game,
        config: {}
      }

      // Ajouter les configurations spécifiques selon le type
      if (alertConfig.type === ALERT_TYPES.JACKPOT_THRESHOLD) {
        alertData.config.threshold = alertConfig.threshold
      } else if (alertConfig.type === ALERT_TYPES.FAVORITE_NUMBERS) {
        alertData.config.numbers = alertConfig.numbers
        alertData.config.minMatches = alertConfig.minMatches || 1
      } else if (alertConfig.type === ALERT_TYPES.LUCKY_NUMBER_MATCH) {
        alertData.config.luckyNumber = alertConfig.luckyNumber
      }

      const result = await createAlert(alertData)
      
      if (result.success) {
        onAlertCreated(result.alert)
        onClose()
      } else {
        setError(result.error || 'Erreur lors de la création de l\'alerte')
      }
    } catch (err) {
      console.error('Erreur lors de la création de l\'alerte:', err)
      setError(err.message || 'Erreur lors de la création de l\'alerte')
    } finally {
      setLoading(false)
    }
  }

  const isValid = () => {
    if (!alertConfig.name) return false
    
    switch (alertConfig.type) {
      case ALERT_TYPES.JACKPOT_THRESHOLD:
        return alertConfig.threshold > 0
      case ALERT_TYPES.FAVORITE_NUMBERS:
        return alertConfig.numbers && alertConfig.numbers.length > 0
      case ALERT_TYPES.LUCKY_NUMBER_MATCH:
        return alertConfig.luckyNumber > 0
      default:
        return true
    }
  }

  return (
    <div className="alert-config-modal-overlay" onClick={onClose}>
      <div className="alert-config-modal" onClick={(e) => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose}>×</button>
        
        <h2 className="alert-config-title">🔔 Créer une Alerte</h2>
        <div className="alert-config-steps">
          <div className={`step ${step >= 1 ? 'active' : ''}`}>1. Type</div>
          <div className={`step ${step >= 2 ? 'active' : ''}`}>2. Configuration</div>
          <div className={`step ${step >= 3 ? 'active' : ''}`}>3. Nom</div>
        </div>

        <div className="alert-config-content">
          {step === 1 && (
            <Step1 alertConfig={alertConfig} setAlertConfig={setAlertConfig} />
          )}
          
          {step === 2 && (
            <Step2 alertConfig={alertConfig} setAlertConfig={setAlertConfig} />
          )}
          
          {step === 3 && (
            <Step3 alertConfig={alertConfig} setAlertConfig={setAlertConfig} />
          )}
        </div>

        <div className="alert-config-actions">
          {step > 1 && (
            <button onClick={handleBack} className="btn-secondary">
              ← Retour
            </button>
          )}
          
          {step < 3 ? (
            <button onClick={handleNext} className="btn-primary">
              Suivant →
            </button>
          ) : (
            <button 
              onClick={handleCreate} 
              className="btn-success"
              disabled={!isValid() || loading}
            >
              {loading ? '⏳ Création...' : '✅ Créer l\'alerte'}
            </button>
          )}
        {error && (
          <div className="error-message" style={{ marginTop: '10px', color: 'red' }}>
            ⚠️ {error}
          </div>
        )}
        </div>
      </div>
    </div>
  )
}

function Step1({ alertConfig, setAlertConfig }) {
  const alertTypes = [
    {
      type: ALERT_TYPES.JACKPOT_THRESHOLD,
      icon: '💰',
      title: 'Seuil de Jackpot',
      description: 'Alerté quand le jackpot dépasse un montant'
    },
    {
      type: ALERT_TYPES.FAVORITE_NUMBERS,
      icon: '🎯',
      title: 'Numéros Favoris',
      description: 'Alerté quand vos numéros sortent'
    },
    {
      type: ALERT_TYPES.NEW_DRAW,
      icon: '🆕',
      title: 'Nouveau Tirage',
      description: 'Alerté à chaque nouveau tirage'
    },
    {
      type: ALERT_TYPES.LUCKY_NUMBER_MATCH,
      icon: '⭐',
      title: 'Numéro Chance',
      description: 'Alerté quand votre numéro chance sort'
    }
  ]

  return (
    <div className="step-content">
      <h3>Quel type d'alerte souhaitez-vous créer ?</h3>
      <div className="alert-types-grid">
        {alertTypes.map(type => (
          <div
            key={type.type}
            className={`alert-type-card ${alertConfig.type === type.type ? 'selected' : ''}`}
            onClick={() => setAlertConfig({ ...alertConfig, type: type.type })}
          >
            <span className="alert-type-icon">{type.icon}</span>
            <h4>{type.title}</h4>
            <p>{type.description}</p>
          </div>
        ))}
      </div>
    </div>
  )
}

function Step2({ alertConfig, setAlertConfig }) {
  const [selectedNumbers, setSelectedNumbers] = useState(alertConfig.numbers || [])
  
  const toggleNumber = (num) => {
    const newNumbers = selectedNumbers.includes(num)
      ? selectedNumbers.filter(n => n !== num)
      : [...selectedNumbers, num]
    
    setSelectedNumbers(newNumbers)
    setAlertConfig({ ...alertConfig, numbers: newNumbers })
  }

  const maxNumber = alertConfig.game === GAMES.EURODREAMS ? 40 : 50
  const numbers = Array.from({ length: maxNumber }, (_, i) => i + 1)

  return (
    <div className="step-content">
      <h3>Pour quel jeu ?</h3>
      <div className="game-selector">
        <label className={`game-option ${alertConfig.game === GAMES.EUROMILLIONS ? 'selected' : ''}`}>
          <input
            type="radio"
            name="game"
            value={GAMES.EUROMILLIONS}
            checked={alertConfig.game === GAMES.EUROMILLIONS}
            onChange={(e) => setAlertConfig({ ...alertConfig, game: e.target.value })}
          />
          <span>⭐ EuroMillions</span>
        </label>
        
        <label className={`game-option ${alertConfig.game === GAMES.LOTO ? 'selected' : ''}`}>
          <input
            type="radio"
            name="game"
            value={GAMES.LOTO}
            checked={alertConfig.game === GAMES.LOTO}
            onChange={(e) => setAlertConfig({ ...alertConfig, game: e.target.value })}
          />
          <span>🍀 Loto</span>
        </label>
        
        <label className={`game-option ${alertConfig.game === GAMES.EURODREAMS ? 'selected' : ''}`}>
          <input
            type="radio"
            name="game"
            value={GAMES.EURODREAMS}
            checked={alertConfig.game === GAMES.EURODREAMS}
            onChange={(e) => setAlertConfig({ ...alertConfig, game: e.target.value })}
          />
          <span>💤 EuroDreams</span>
        </label>
      </div>

      {alertConfig.type === ALERT_TYPES.JACKPOT_THRESHOLD && (
        <div className="config-section">
          <h3>Montant minimum du jackpot</h3>
          <div className="threshold-presets">
            {[50, 100, 150, 200].map(amount => (
              <button
                key={amount}
                className={`preset-btn ${alertConfig.threshold === amount * 1000000 ? 'selected' : ''}`}
                onClick={() => setAlertConfig({ ...alertConfig, threshold: amount * 1000000 })}
              >
                {amount}M€
              </button>
            ))}
          </div>
          <input
            type="number"
            value={alertConfig.threshold || 0}
            onChange={(e) => setAlertConfig({ ...alertConfig, threshold: parseInt(e.target.value) })}
            placeholder="Montant personnalisé"
            className="custom-threshold"
          />
        </div>
      )}

      {alertConfig.type === ALERT_TYPES.FAVORITE_NUMBERS && (
        <div className="config-section">
          <h3>Sélectionnez vos numéros favoris</h3>
          <p className="help-text">Cliquez sur les numéros pour les sélectionner</p>
          <div className="numbers-grid">
            {numbers.map(num => (
              <button
                key={num}
                className={`number-btn ${selectedNumbers.includes(num) ? 'selected' : ''}`}
                onClick={() => toggleNumber(num)}
              >
                {num}
              </button>
            ))}
          </div>
          <div className="match-config">
            <label>
              Nombre minimum de numéros correspondants :
              <input
                type="number"
                min="1"
                max={selectedNumbers.length}
                value={alertConfig.minMatches || 1}
                onChange={(e) => setAlertConfig({ ...alertConfig, minMatches: parseInt(e.target.value) })}
              />
            </label>
          </div>
        </div>
      )}

      {alertConfig.type === ALERT_TYPES.LUCKY_NUMBER_MATCH && (
        <div className="config-section">
          <h3>Votre numéro chance</h3>
          <input
            type="number"
            min="1"
            max={alertConfig.game === GAMES.EUROMILLIONS ? 12 : 10}
            value={alertConfig.luckyNumber || ''}
            onChange={(e) => setAlertConfig({ ...alertConfig, luckyNumber: parseInt(e.target.value) })}
            placeholder={`Entre 1 et ${alertConfig.game === GAMES.EUROMILLIONS ? 12 : 10}`}
            className="lucky-number-input"
          />
        </div>
      )}
    </div>
  )
}

function Step3({ alertConfig, setAlertConfig }) {
  return (
    <div className="step-content">
      <h3>Nommez votre alerte</h3>
      <input
        type="text"
        value={alertConfig.name}
        onChange={(e) => setAlertConfig({ ...alertConfig, name: e.target.value })}
        placeholder="Ex: Gros jackpot EuroMillions"
        className="alert-name-input"
        autoFocus
      />
      
      <div className="alert-summary">
        <h4>📋 Résumé de l'alerte</h4>
        <div className="summary-content">
          <p><strong>Type :</strong> {getAlertTypeName(alertConfig.type)}</p>
          <p><strong>Jeu :</strong> {getGameName(alertConfig.game)}</p>
          {alertConfig.type === ALERT_TYPES.JACKPOT_THRESHOLD && (
            <p><strong>Seuil :</strong> {formatAmount(alertConfig.threshold)}</p>
          )}
          {alertConfig.type === ALERT_TYPES.FAVORITE_NUMBERS && (
            <>
              <p><strong>Numéros :</strong> {alertConfig.numbers?.join(', ')}</p>
              <p><strong>Correspondances min :</strong> {alertConfig.minMatches}</p>
            </>
          )}
          {alertConfig.type === ALERT_TYPES.LUCKY_NUMBER_MATCH && (
            <p><strong>Numéro chance :</strong> {alertConfig.luckyNumber}</p>
          )}
        </div>
      </div>
    </div>
  )
}

function getAlertTypeName(type) {
  const names = {
    [ALERT_TYPES.JACKPOT_THRESHOLD]: '💰 Seuil de Jackpot',
    [ALERT_TYPES.FAVORITE_NUMBERS]: '🎯 Numéros Favoris',
    [ALERT_TYPES.NEW_DRAW]: '🆕 Nouveau Tirage',
    [ALERT_TYPES.LUCKY_NUMBER_MATCH]: '⭐ Numéro Chance'
  }
  return names[type] || type
}

function getGameName(game) {
  const names = {
    [GAMES.EUROMILLIONS]: '⭐ EuroMillions',
    [GAMES.LOTO]: '🍀 Loto',
    [GAMES.EURODREAMS]: '💤 EuroDreams'
  }
  return names[game] || game
}

function formatAmount(amount) {
  if (amount >= 1000000) {
    return `${amount / 1000000}M€`
  }
  return `${amount.toLocaleString('fr-FR')} €`
}

