import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import AlertsList from '../Alerts/AlertsList'
import AlertConfig from '../Alerts/AlertConfig'
import MyCombinations from '../MyCombinations/MyCombinations'
import './Auth.css'

export default function UserProfile({ onClose }) {
  const { user, logout, updatePreferences } = useAuth()
  const [preferences, setPreferences] = useState(user?.preferences || {})
  const [saved, setSaved] = useState(false)
  const [activeTab, setActiveTab] = useState('profile') // profile, alerts, combinations
  const [showAlertConfig, setShowAlertConfig] = useState(false)
  const [refreshAlerts, setRefreshAlerts] = useState(0)

  useEffect(() => {
    if (user?.preferences) {
      setPreferences(user.preferences)
    }
  }, [user])

  const handleGameToggle = (game) => {
    const newFavoriteGames = preferences.favoriteGames?.includes(game)
      ? preferences.favoriteGames.filter(g => g !== game)
      : [...(preferences.favoriteGames || []), game]
    
    setPreferences({
      ...preferences,
      favoriteGames: newFavoriteGames
    })
  }

  const handleSave = () => {
    updatePreferences(preferences)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  const handleLogout = () => {
    logout()
    onClose()
  }

  const handleAlertCreated = () => {
    setRefreshAlerts(prev => prev + 1)
    // Le composant AlertsList se rechargera grâce au changement de key
  }

  return (
    <div className="auth-modal-overlay" onClick={onClose}>
      <div className="auth-modal profile-modal" onClick={(e) => e.stopPropagation()}>
        <button className="auth-modal-close" onClick={onClose}>×</button>
        
        <h2 className="auth-title">👤 Mon Profil</h2>
        <p className="auth-subtitle">Bienvenue, {user?.name} !</p>

        <div className="profile-tabs">
          <button
            className={`profile-tab ${activeTab === 'profile' ? 'active' : ''}`}
            onClick={() => setActiveTab('profile')}
          >
            👤 Profil
          </button>
          <button
            className={`profile-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🔔 Alertes
          </button>
          <button
            className={`profile-tab ${activeTab === 'combinations' ? 'active' : ''}`}
            onClick={() => setActiveTab('combinations')}
          >
            🎲 Mes Combinaisons
          </button>
        </div>

        {activeTab === 'profile' && (
          <>
            <div className="profile-section">
              <h3>📧 Informations</h3>
          <div className="profile-info">
            <p><strong>Nom :</strong> {user?.name}</p>
            <p><strong>Email :</strong> {user?.email}</p>
            <p><strong>Membre depuis :</strong> {new Date(user?.createdAt).toLocaleDateString('fr-FR')}</p>
              </div>
            </div>

            <div className="profile-section">
              <h3>🎰 Jeux Favoris</h3>
          <p className="section-description">Sélectionnez les jeux qui vous intéressent</p>
          
          <div className="game-preferences">
            <label className="game-checkbox">
              <input
                type="checkbox"
                checked={preferences.favoriteGames?.includes('euromillions')}
                onChange={() => handleGameToggle('euromillions')}
              />
              <span className="game-label">⭐ EuroMillions - My Million</span>
            </label>

            <label className="game-checkbox">
              <input
                type="checkbox"
                checked={preferences.favoriteGames?.includes('loto')}
                onChange={() => handleGameToggle('loto')}
              />
              <span className="game-label">🍀 Loto®</span>
            </label>

            <label className="game-checkbox">
              <input
                type="checkbox"
                checked={preferences.favoriteGames?.includes('eurodreams')}
                onChange={() => handleGameToggle('eurodreams')}
              />
              <span className="game-label">💤 EuroDreams</span>
            </label>
              </div>
            </div>

            <div className="profile-section">
              <h3>⚙️ Préférences</h3>
          
          <div className="preference-item">
            <label htmlFor="defaultTab">Onglet par défaut</label>
            <select
              id="defaultTab"
              value={preferences.defaultTab || 'euromillions'}
              onChange={(e) => setPreferences({ ...preferences, defaultTab: e.target.value })}
              className="preference-select"
            >
              <option value="euromillions">EuroMillions</option>
              <option value="loto">Loto</option>
              <option value="eurodreams">EuroDreams</option>
            </select>
          </div>

          <label className="preference-checkbox">
            <input
              type="checkbox"
              checked={preferences.notifications !== false}
              onChange={(e) => setPreferences({ ...preferences, notifications: e.target.checked })}
            />
            <span>🔔 Recevoir les notifications (à venir)</span>
              </label>
            </div>

            <div className="profile-actions">
              <button onClick={handleSave} className="save-btn">
                {saved ? '✅ Enregistré !' : '💾 Enregistrer les modifications'}
              </button>
              
              <button onClick={handleLogout} className="logout-btn">
                🚪 Se déconnecter
              </button>
            </div>
          </>
        )}

        {activeTab === 'alerts' && (
          <div className="alerts-section">
            <div className="alerts-header">
              <h3>🔔 Mes Alertes Personnalisées</h3>
              <button 
                className="create-alert-btn"
                onClick={() => setShowAlertConfig(true)}
              >
                ➕ Créer une alerte
              </button>
            </div>
            
            <p className="section-description">
              Configurez des alertes pour être notifié quand vos critères sont remplis
            </p>

            <AlertsList 
              refreshTrigger={refreshAlerts}
            />
          </div>
        )}

        {activeTab === 'combinations' && (
          <MyCombinations />
        )}

        {showAlertConfig && (
          <AlertConfig
            userId={user?.id}
            onClose={() => setShowAlertConfig(false)}
            onAlertCreated={handleAlertCreated}
          />
        )}
      </div>
    </div>
  )
}

