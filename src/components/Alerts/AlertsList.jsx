import { useState, useEffect } from 'react'
import { getAlerts, deleteAlert, toggleAlert } from '../../services/alertService'
import './Alerts.css'

export default function AlertsList({ userId, onEdit }) {
  const [alerts, setAlerts] = useState([])

  useEffect(() => {
    loadAlerts()
  }, [userId])

  const loadAlerts = () => {
    const userAlerts = getAlerts(userId)
    setAlerts(userAlerts)
  }

  const handleToggle = (alertId) => {
    toggleAlert(userId, alertId)
    loadAlerts()
  }

  const handleDelete = (alertId) => {
    if (window.confirm('Voulez-vous vraiment supprimer cette alerte ?')) {
      deleteAlert(userId, alertId)
      loadAlerts()
    }
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
          key={alert.id}
          alert={alert}
          onToggle={() => handleToggle(alert.id)}
          onDelete={() => handleDelete(alert.id)}
        />
      ))}
    </div>
  )
}

function AlertItem({ alert, onToggle, onDelete }) {
  const getAlertDetails = () => {
    switch (alert.type) {
      case 'jackpot_threshold':
        return `💰 Jackpot ≥ ${formatAmount(alert.threshold)}`
      case 'favorite_numbers':
        return `🎯 Numéros: ${alert.numbers?.slice(0, 5).join(', ')}${alert.numbers?.length > 5 ? '...' : ''}`
      case 'new_draw':
        return '🆕 Chaque nouveau tirage'
      case 'lucky_number_match':
        return `⭐ Numéro chance: ${alert.luckyNumber}`
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

  return (
    <div className={`alert-item ${alert.enabled ? 'enabled' : 'disabled'}`}>
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
            checked={alert.enabled}
            onChange={onToggle}
          />
          <span className="slider"></span>
        </label>
      </div>
      
      <p className="alert-details">{getAlertDetails()}</p>
      
      <div className="alert-item-footer">
        <span className="alert-created">
          Créée le {new Date(alert.createdAt).toLocaleDateString('fr-FR')}
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

