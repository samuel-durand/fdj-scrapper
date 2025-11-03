import { useState, useEffect } from 'react'
import { getAlerts, deleteAlert, toggleAlert } from '../../services/alertServiceAPI'
import './Alerts.css'

export default function AlertsList({ userId, onEdit, refreshTrigger }) {
  const [alerts, setAlerts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const loadAlerts = async () => {
    try {
      setLoading(true)
      setError(null)
      console.log('🔔 Chargement des alertes...') // Debug
      const alertsData = await getAlerts()
      console.log('✅ Alertes chargées:', alertsData) // Debug
      
      if (Array.isArray(alertsData)) {
        setAlerts(alertsData)
        if (alertsData.length === 0) {
          console.log('ℹ️ Aucune alerte trouvée pour cet utilisateur')
        }
      } else {
        console.warn('⚠️ Format de réponse inattendu:', alertsData)
        setAlerts([])
      }
    } catch (err) {
      console.error('❌ Erreur lors du chargement des alertes:', err)
      setError('Impossible de charger les alertes: ' + (err.message || 'Erreur inconnue'))
      setAlerts([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    // L'API utilise automatiquement l'utilisateur connecté via le token
    // Pas besoin de vérifier userId
    loadAlerts()
  }, [refreshTrigger]) // Recharger si refreshTrigger change

  const handleToggle = async (alertId) => {
    try {
      const result = await toggleAlert(alertId)
      if (result.success) {
        await loadAlerts()
      } else {
        alert('Erreur: ' + (result.error || 'Impossible de modifier l\'alerte'))
      }
    } catch (err) {
      console.error('Erreur lors du toggle:', err)
      alert('Erreur lors de la modification de l\'alerte')
    }
  }

  const handleDelete = async (alertId) => {
    if (!window.confirm('Voulez-vous vraiment supprimer cette alerte ?')) {
      return
    }
    
    try {
      const result = await deleteAlert(alertId)
      if (result.success) {
        await loadAlerts()
      } else {
        alert('Erreur: ' + (result.error || 'Impossible de supprimer l\'alerte'))
      }
    } catch (err) {
      console.error('Erreur lors de la suppression:', err)
      alert('Erreur lors de la suppression de l\'alerte')
    }
  }

  if (loading) {
    return (
      <div className="no-alerts">
        <div className="spinner"></div>
        <p>Chargement des alertes...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="no-alerts">
        <span className="empty-icon">⚠️</span>
        <p>{error}</p>
        <button onClick={loadAlerts} className="retry-btn">🔄 Réessayer</button>
      </div>
    )
  }

  if (alerts.length === 0) {
    return (
      <div className="no-alerts">
        <span className="empty-icon">🔕</span>
        <p>Aucune alerte configurée</p>
        <p className="help-text">Créez votre première alerte pour ne rien manquer !</p>
      </div>
    )
  }

  return (
    <div className="alerts-list">
      {alerts.map(alert => (
        <AlertItem
          key={alert._id || alert.id}
          alert={alert}
          onToggle={() => handleToggle(alert._id || alert.id)}
          onDelete={() => handleDelete(alert._id || alert.id)}
        />
      ))}
    </div>
  )
}

function AlertItem({ alert, onToggle, onDelete }) {
  const getAlertDetails = () => {
    // Les données viennent maintenant de l'API avec la structure { type, config }
    const config = alert.config || {}
    
    switch (alert.type) {
      case 'jackpot_threshold':
        return `💰 Jackpot ≥ ${formatAmount(config.threshold || alert.threshold || 0)}`
      case 'favorite_numbers':
        const numbers = config.numbers || alert.numbers || []
        return `🎯 Numéros: ${numbers.slice(0, 5).join(', ')}${numbers.length > 5 ? '...' : ''}`
      case 'new_draw':
        return '🆕 Chaque nouveau tirage'
      case 'lucky_number_match':
        return `⭐ Numéro chance: ${config.luckyNumber || alert.luckyNumber || ''}`
      default:
        return alert.type
    }
  }

  const getGameBadge = () => {
    const badges = {
      euromillions: { icon: '⭐', name: 'EuroMillions', class: 'euromillions' },
      loto: { icon: '🍀', name: 'Loto', class: 'loto' },
      eurodreams: { icon: '💤', name: 'EuroDreams', class: 'eurodreams' }
    }
    return badges[alert.game] || { icon: '🎰', name: alert.game, class: 'default' }
  }

  const badge = getGameBadge()

  // Utiliser alert.enabled avec une valeur par défaut
  const isEnabled = alert.enabled !== undefined ? alert.enabled : true

  return (
    <div className={`alert-item ${isEnabled ? 'enabled' : 'disabled'}`}>
      <div className="alert-item-header">
        <div className="alert-item-title">
          <h4>{alert.name}</h4>
          <span className={`game-badge ${badge.class}`}>
            {badge.icon} {badge.name}
          </span>
        </div>
        <label className="toggle-switch">
          <input
            type="checkbox"
            checked={isEnabled}
            onChange={onToggle}
          />
          <span className="slider"></span>
        </label>
      </div>
      
      <p className="alert-details">{getAlertDetails()}</p>
      
      <div className="alert-item-footer">
        <span className="alert-created">
          Créée le {new Date(alert.createdAt || alert.timestamp || Date.now()).toLocaleDateString('fr-FR')}
        </span>
        <button className="delete-alert-btn" onClick={onDelete}>
          🗑️ Supprimer
        </button>
      </div>
    </div>
  )
}

function formatAmount(amount) {
  if (amount >= 1000000) {
    return `${amount / 1000000}M€`
  }
  return `${amount.toLocaleString('fr-FR')} €`
}

