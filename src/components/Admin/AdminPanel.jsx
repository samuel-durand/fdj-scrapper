import { useState, useEffect } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import * as adminService from '../../services/adminService'
import DashboardCharts from './DashboardCharts'
import './AdminPanel.css'

export default function AdminPanel({ onClose }) {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState('stats') // stats, users, combinations, alerts
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  
  // Stats
  const [stats, setStats] = useState(null)
  
  // Users
  const [users, setUsers] = useState([])
  const [usersPagination, setUsersPagination] = useState(null)
  const [userSearch, setUserSearch] = useState('')
  
  // Combinations
  const [combinations, setCombinations] = useState([])
  const [combinationsPagination, setCombinationsPagination] = useState(null)
  
  // Alerts
  const [alerts, setAlerts] = useState([])
  const [alertsPagination, setAlertsPagination] = useState(null)

  // Vérifier que l'utilisateur est admin
  useEffect(() => {
    if (!user || user.role !== 'admin') {
      setError('Accès refusé - Droits administrateur requis')
      setLoading(false)
    }
  }, [user])

  // Charger les stats au démarrage
  useEffect(() => {
    if (activeTab === 'stats') {
      loadStats()
    } else if (activeTab === 'users') {
      loadUsers()
    } else if (activeTab === 'combinations') {
      loadCombinations()
    } else if (activeTab === 'alerts') {
      loadAlerts()
    }
  }, [activeTab])

  const loadStats = async () => {
    setLoading(true)
    const result = await adminService.getAdminStats()
    if (result.success) {
      setStats(result.data)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const loadUsers = async (page = 1) => {
    setLoading(true)
    const result = await adminService.getUsers({ page, search: userSearch })
    if (result.success) {
      setUsers(result.data)
      setUsersPagination(result.pagination)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const loadCombinations = async (page = 1) => {
    setLoading(true)
    const result = await adminService.getAllCombinations({ page, limit: 30 })
    if (result.success) {
      setCombinations(result.data)
      setCombinationsPagination(result.pagination)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const loadAlerts = async (page = 1) => {
    setLoading(true)
    const result = await adminService.getAllAlerts({ page, limit: 30 })
    if (result.success) {
      setAlerts(result.data)
      setAlertsPagination(result.pagination)
    } else {
      setError(result.error)
    }
    setLoading(false)
  }

  const handleDeleteUser = async (userId) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet utilisateur et toutes ses données ?')) {
      return
    }

    const result = await adminService.deleteUser(userId)
    if (result.success) {
      alert('Utilisateur supprimé')
      loadUsers()
    } else {
      alert('Erreur: ' + result.error)
    }
  }

  const handleToggleUserActive = async (userId, currentStatus) => {
    const result = await adminService.updateUser(userId, { isActive: !currentStatus })
    if (result.success) {
      loadUsers()
    } else {
      alert('Erreur: ' + result.error)
    }
  }

  const handleToggleUserRole = async (userId, currentRole) => {
    const newRole = currentRole === 'admin' ? 'user' : 'admin'
    const result = await adminService.updateUser(userId, { role: newRole })
    if (result.success) {
      loadUsers()
    } else {
      alert('Erreur: ' + result.error)
    }
  }

  const handleDeleteCombination = async (combinationId) => {
    if (!confirm('Supprimer cette combinaison ?')) return
    
    const result = await adminService.deleteCombination(combinationId)
    if (result.success) {
      loadCombinations()
    } else {
      alert('Erreur: ' + result.error)
    }
  }

  const handleDeleteAlert = async (alertId) => {
    if (!confirm('Supprimer cette alerte ?')) return
    
    const result = await adminService.deleteAlert(alertId)
    if (result.success) {
      loadAlerts()
    } else {
      alert('Erreur: ' + result.error)
    }
  }

  if (!user || user.role !== 'admin') {
    return (
      <div className="admin-modal-overlay" onClick={onClose}>
        <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
          <button className="admin-modal-close" onClick={onClose}>×</button>
          <h2 className="admin-title">⛔ Accès Refusé</h2>
          <p className="admin-error">Vous devez être administrateur pour accéder à cette page.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div className="admin-modal admin-panel-modal" onClick={(e) => e.stopPropagation()}>
        <button className="admin-modal-close" onClick={onClose}>×</button>
        
        <h2 className="admin-title">🔐 Panel Administrateur</h2>
        <p className="admin-subtitle">Gestion complète de la plateforme</p>

        <div className="admin-tabs">
          <button
            className={`admin-tab ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📊 Statistiques
          </button>
          <button
            className={`admin-tab ${activeTab === 'users' ? 'active' : ''}`}
            onClick={() => setActiveTab('users')}
          >
            👥 Utilisateurs
          </button>
          <button
            className={`admin-tab ${activeTab === 'combinations' ? 'active' : ''}`}
            onClick={() => setActiveTab('combinations')}
          >
            🎲 Combinaisons
          </button>
          <button
            className={`admin-tab ${activeTab === 'alerts' ? 'active' : ''}`}
            onClick={() => setActiveTab('alerts')}
          >
            🔔 Alertes
          </button>
        </div>

        <div className="admin-content">
          {loading && <div className="admin-loading">Chargement...</div>}
          {error && <div className="admin-error">{error}</div>}

          {!loading && !error && (
            <>
              {/* Statistiques avec graphiques */}
              {activeTab === 'stats' && stats && (
                <DashboardCharts stats={stats} />
              )}

              {/* Utilisateurs */}
              {activeTab === 'users' && (
                <div className="admin-users">
                  <div className="users-header">
                    <input
                      type="text"
                      placeholder="Rechercher un utilisateur..."
                      value={userSearch}
                      onChange={(e) => setUserSearch(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && loadUsers()}
                      className="search-input"
                    />
                    <button onClick={() => loadUsers()} className="search-btn">🔍 Rechercher</button>
                  </div>

                  <div className="users-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Nom</th>
                          <th>Email</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th>Stats</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.map(u => (
                          <tr key={u._id}>
                            <td>{u.name}</td>
                            <td>{u.email}</td>
                            <td>
                              <span className={`role-badge ${u.role}`}>
                                {u.role === 'admin' ? '👑 Admin' : '👤 User'}
                              </span>
                            </td>
                            <td>
                              <span className={`status-badge ${u.isActive ? 'active' : 'inactive'}`}>
                                {u.isActive ? '✅ Actif' : '❌ Inactif'}
                              </span>
                            </td>
                            <td>
                              <small>
                                {u.stats.combinations} combinaisons<br/>
                                {u.stats.alerts} alertes
                              </small>
                            </td>
                            <td>
                              <div className="action-buttons">
                                <button 
                                  onClick={() => handleToggleUserRole(u._id, u.role)}
                                  className="btn-small"
                                  disabled={u._id === user._id}
                                >
                                  {u.role === 'admin' ? '👤' : '👑'}
                                </button>
                                <button 
                                  onClick={() => handleToggleUserActive(u._id, u.isActive)}
                                  className="btn-small"
                                >
                                  {u.isActive ? '🔒' : '🔓'}
                                </button>
                                <button 
                                  onClick={() => handleDeleteUser(u._id)}
                                  className="btn-small btn-danger"
                                  disabled={u._id === user._id}
                                >
                                  🗑️
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {usersPagination && usersPagination.pages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: usersPagination.pages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => loadUsers(page)}
                          className={page === usersPagination.page ? 'active' : ''}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Combinaisons */}
              {activeTab === 'combinations' && (
                <div className="admin-combinations">
                  <div className="combinations-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Jeu</th>
                          <th>Numéros</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinations.map(c => (
                          <tr key={c._id}>
                            <td>{c.userId?.name || 'N/A'}</td>
                            <td><span className="game-badge">{c.game.toUpperCase()}</span></td>
                            <td>
                              <div className="numbers-display">
                                {c.numbers.join(', ')}
                                {c.stars && ` | ⭐ ${c.stars.join(', ')}`}
                                {c.luckyNumber && ` | 🍀 ${c.luckyNumber}`}
                                {c.dreamNumber && ` | 💜 ${c.dreamNumber}`}
                              </div>
                            </td>
                            <td><small>{new Date(c.createdAt).toLocaleDateString()}</small></td>
                            <td>
                              <button 
                                onClick={() => handleDeleteCombination(c._id)}
                                className="btn-small btn-danger"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {combinationsPagination && combinationsPagination.pages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: combinationsPagination.pages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => loadCombinations(page)}
                          className={page === combinationsPagination.page ? 'active' : ''}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Alertes */}
              {activeTab === 'alerts' && (
                <div className="admin-alerts">
                  <div className="alerts-table-container">
                    <table className="admin-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Jeu</th>
                          <th>Type</th>
                          <th>Statut</th>
                          <th>Date</th>
                          <th>Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.map(a => (
                          <tr key={a._id}>
                            <td>{a.userId?.name || 'N/A'}</td>
                            <td><span className="game-badge">{a.game.toUpperCase()}</span></td>
                            <td><small>{a.type}</small></td>
                            <td>
                              <span className={`status-badge ${a.isActive ? 'active' : 'inactive'}`}>
                                {a.isActive ? '✅' : '❌'}
                              </span>
                            </td>
                            <td><small>{new Date(a.createdAt).toLocaleDateString()}</small></td>
                            <td>
                              <button 
                                onClick={() => handleDeleteAlert(a._id)}
                                className="btn-small btn-danger"
                              >
                                🗑️
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>

                  {alertsPagination && alertsPagination.pages > 1 && (
                    <div className="pagination">
                      {Array.from({ length: alertsPagination.pages }, (_, i) => i + 1).map(page => (
                        <button
                          key={page}
                          onClick={() => loadAlerts(page)}
                          className={page === alertsPagination.page ? 'active' : ''}
                        >
                          {page}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}

