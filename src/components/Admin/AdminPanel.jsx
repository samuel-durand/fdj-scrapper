import { useState, useEffect, useCallback } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import * as adminService from '../../services/adminService'
import { GAMES } from '../../games'
import { DrawBalls } from '../Results/Balls'
import DashboardCharts from './DashboardCharts'
import './AdminPanel.css'

const TABS = [
  { key: 'stats', label: 'Tableau de bord' },
  { key: 'users', label: 'Utilisateurs' },
  { key: 'combinations', label: 'Combinaisons' },
  { key: 'alerts', label: 'Alertes' },
]

const ALERT_LABELS = {
  jackpot_threshold: 'Seuil de jackpot',
  favorite_numbers: 'Numéros favoris',
  new_draw: 'Nouveau tirage',
  winning_combination: 'Combinaison gagnante',
  lucky_number_match: 'Numéro chance',
}

const formatDate = (value) =>
  value ? new Date(value).toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'

const initial = (name) => (name || '?').trim().charAt(0).toUpperCase()

function Icon({ name }) {
  const paths = {
    close: <path d="M6 6l12 12M18 6L6 18" />,
    search: <><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></>,
    trash: <path d="M4 7h16M10 11v6M14 11v6M6 7l1 13h10l1-13M9 7V4h6v3" />,
    crown: <path d="M3 18h18M4 8l4 4 4-7 4 7 4-4-2 10H6z" />,
    user: <><circle cx="12" cy="8" r="4" /><path d="M4 21a8 8 0 0 1 16 0" /></>,
    lock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 8 0v4" /></>,
    unlock: <><rect x="5" y="11" width="14" height="10" rx="2" /><path d="M8 11V7a4 4 0 0 1 7.5-2" /></>,
    shield: <path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z" />,
  }
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
      strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {paths[name]}
    </svg>
  )
}

function GameChip({ game }) {
  return <span className={`adm-chip adm-chip--${game}`}>{GAMES[game]?.name || game}</span>
}

function Pagination({ pagination, onPage }) {
  if (!pagination || pagination.pages <= 1) return null
  const { page, pages } = pagination
  // Fenêtre de 5 pages autour de la page courante
  const start = Math.max(1, Math.min(page - 2, pages - 4))
  const nums = Array.from({ length: Math.min(5, pages) }, (_, i) => start + i)
  return (
    <nav className="adm-pagination" aria-label="Pagination">
      <button onClick={() => onPage(page - 1)} disabled={page <= 1} aria-label="Page précédente">‹</button>
      {nums.map((n) => (
        <button key={n} onClick={() => onPage(n)} className={n === page ? 'is-active' : ''}
          aria-current={n === page ? 'page' : undefined}>
          {n}
        </button>
      ))}
      <button onClick={() => onPage(page + 1)} disabled={page >= pages} aria-label="Page suivante">›</button>
    </nav>
  )
}

function Empty({ children }) {
  return <div className="adm-empty">{children}</div>
}

export default function AdminPanel({ onClose }) {
  const { user } = useAuth()
  const isAdmin = user?.role === 'admin'
  const [tab, setTab] = useState('stats')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [toast, setToast] = useState(null)

  const [stats, setStats] = useState(null)
  const [users, setUsers] = useState({ data: [], pagination: null })
  const [userSearch, setUserSearch] = useState('')
  const [combinations, setCombinations] = useState({ data: [], pagination: null })
  const [alerts, setAlerts] = useState({ data: [], pagination: null })

  const notify = (message, kind = 'success') => setToast({ message, kind, id: Date.now() })

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(() => setToast(null), 3000)
    return () => clearTimeout(t)
  }, [toast])

  useEffect(() => {
    const onKey = (e) => e.key === 'Escape' && onClose()
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  const run = async (request, onSuccess) => {
    setLoading(true)
    setError('')
    const result = await request()
    if (result.success) onSuccess(result)
    else setError(result.error)
    setLoading(false)
  }

  const loadStats = () => run(adminService.getAdminStats, (r) => setStats(r.data))
  const loadUsers = (page = 1) =>
    run(() => adminService.getUsers({ page, search: userSearch }), (r) => setUsers({ data: r.data, pagination: r.pagination }))
  const loadCombinations = (page = 1) =>
    run(() => adminService.getAllCombinations({ page, limit: 30 }), (r) => setCombinations({ data: r.data, pagination: r.pagination }))
  const loadAlerts = (page = 1) =>
    run(() => adminService.getAllAlerts({ page, limit: 30 }), (r) => setAlerts({ data: r.data, pagination: r.pagination }))

  const loaders = { stats: loadStats, users: loadUsers, combinations: loadCombinations, alerts: loadAlerts }

  useEffect(() => {
    if (isAdmin) loaders[tab]()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tab, isAdmin])

  const act = useCallback(async (request, successMessage, reload) => {
    const result = await request()
    if (result.success) {
      notify(successMessage)
      reload()
    } else {
      notify(result.error || 'Une erreur est survenue', 'error')
    }
  }, [])

  const page = (p) => p?.page || 1

  const toggleRole = (u) =>
    act(() => adminService.updateUser(u._id, { role: u.role === 'admin' ? 'user' : 'admin' }),
      u.role === 'admin' ? `${u.name} n'est plus administrateur` : `${u.name} est maintenant administrateur`,
      () => loadUsers(page(users.pagination)))

  const toggleActive = (u) =>
    act(() => adminService.updateUser(u._id, { isActive: !u.isActive }),
      u.isActive ? `Compte de ${u.name} désactivé` : `Compte de ${u.name} réactivé`,
      () => loadUsers(page(users.pagination)))

  const deleteUser = (u) => {
    if (!confirm(`Supprimer ${u.name} et toutes ses données ? Cette action est définitive.`)) return
    act(() => adminService.deleteUser(u._id), 'Utilisateur supprimé', () => loadUsers(page(users.pagination)))
  }

  const deleteCombination = (c) => {
    if (!confirm('Supprimer cette combinaison ?')) return
    act(() => adminService.deleteCombination(c._id), 'Combinaison supprimée',
      () => loadCombinations(page(combinations.pagination)))
  }

  const deleteAlert = (a) => {
    if (!confirm('Supprimer cette alerte ?')) return
    act(() => adminService.deleteAlert(a._id), 'Alerte supprimée', () => loadAlerts(page(alerts.pagination)))
  }

  const total = (p, list) => p?.total ?? list.length
  const counts = {
    users: stats?.users?.total,
    combinations: stats?.combinations?.total,
    alerts: stats?.alerts?.total,
  }

  return (
    <div className="adm-overlay" onClick={onClose}>
      <div className="adm-modal" role="dialog" aria-modal="true" aria-labelledby="adm-title"
        onClick={(e) => e.stopPropagation()}>
        <header className="adm-header">
          <div className="adm-header__title">
            <span className="adm-header__icon"><Icon name="shield" /></span>
            <div>
              <h2 id="adm-title">Administration</h2>
              <p>Utilisateurs, combinaisons et alertes de la plateforme</p>
            </div>
          </div>
          <button className="adm-close" onClick={onClose} aria-label="Fermer"><Icon name="close" /></button>
        </header>

        {!isAdmin ? (
          <div className="adm-body">
            <div className="adm-error">Accès refusé : droits administrateur requis.</div>
          </div>
        ) : (
          <>
            <nav className="adm-tabs" role="tablist">
              {TABS.map((t) => (
                <button key={t.key} role="tab" aria-selected={tab === t.key}
                  className={`adm-tab ${tab === t.key ? 'is-active' : ''}`} onClick={() => setTab(t.key)}>
                  {t.label}
                  {counts[t.key] != null && <span className="adm-tab__count">{counts[t.key]}</span>}
                </button>
              ))}
            </nav>

            <div className="adm-body">
              {error && <div className="adm-error">{error}</div>}

              {tab === 'stats' && (
                loading && !stats ? <div className="adm-loading">Chargement des statistiques…</div>
                  : stats && <DashboardCharts stats={stats} />
              )}

              {tab === 'users' && (
                <section>
                  <form className="adm-toolbar" onSubmit={(e) => { e.preventDefault(); loadUsers() }}>
                    <label className="adm-search">
                      <Icon name="search" />
                      <input type="search" placeholder="Rechercher par nom ou email" value={userSearch}
                        onChange={(e) => setUserSearch(e.target.value)} aria-label="Rechercher un utilisateur" />
                    </label>
                    <button type="submit" className="btn btn--primary btn--sm">Rechercher</button>
                  </form>
                  <p className="adm-meta">{total(users.pagination, users.data)} utilisateur(s)</p>

                  <div className={`adm-table-wrap ${loading ? 'is-loading' : ''}`}>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Rôle</th>
                          <th>Statut</th>
                          <th className="num">Combinaisons</th>
                          <th className="num">Alertes</th>
                          <th>Inscription</th>
                          <th className="actions"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {users.data.map((u) => {
                          const self = u._id === user._id
                          return (
                            <tr key={u._id}>
                              <td>
                                <div className="adm-user">
                                  <span className="adm-avatar">{initial(u.name)}</span>
                                  <div>
                                    <strong>{u.name}{self && <em className="adm-you"> (vous)</em>}</strong>
                                    <small>{u.email}</small>
                                  </div>
                                </div>
                              </td>
                              <td>
                                <span className={`adm-badge ${u.role === 'admin' ? 'adm-badge--admin' : ''}`}>
                                  {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                                </span>
                              </td>
                              <td>
                                <span className={`adm-status ${u.isActive ? 'is-on' : 'is-off'}`}>
                                  {u.isActive ? 'Actif' : 'Désactivé'}
                                </span>
                              </td>
                              <td className="num">{u.stats?.combinations ?? 0}</td>
                              <td className="num">{u.stats?.alerts ?? 0}</td>
                              <td className="muted">{formatDate(u.createdAt)}</td>
                              <td className="actions">
                                <div className="adm-actions">
                                  <button className="adm-icon-btn" onClick={() => toggleRole(u)} disabled={self}
                                    title={u.role === 'admin' ? 'Retirer les droits admin' : 'Promouvoir admin'}>
                                    <Icon name={u.role === 'admin' ? 'user' : 'crown'} />
                                  </button>
                                  <button className="adm-icon-btn" onClick={() => toggleActive(u)} disabled={self}
                                    title={u.isActive ? 'Désactiver le compte' : 'Réactiver le compte'}>
                                    <Icon name={u.isActive ? 'lock' : 'unlock'} />
                                  </button>
                                  <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => deleteUser(u)}
                                    disabled={self} title="Supprimer l'utilisateur">
                                    <Icon name="trash" />
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {!loading && users.data.length === 0 && <Empty>Aucun utilisateur trouvé.</Empty>}
                  </div>
                  <Pagination pagination={users.pagination} onPage={loadUsers} />
                </section>
              )}

              {tab === 'combinations' && (
                <section>
                  <p className="adm-meta">{total(combinations.pagination, combinations.data)} combinaison(s) enregistrée(s)</p>
                  <div className={`adm-table-wrap ${loading ? 'is-loading' : ''}`}>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Jeu</th>
                          <th>Numéros</th>
                          <th>Créée le</th>
                          <th className="actions"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {combinations.data.map((c) => (
                          <tr key={c._id}>
                            <td>
                              <div className="adm-user">
                                <span className="adm-avatar">{initial(c.userId?.name)}</span>
                                <div>
                                  <strong>{c.userId?.name || 'Utilisateur supprimé'}</strong>
                                  {c.userId?.email && <small>{c.userId.email}</small>}
                                </div>
                              </div>
                            </td>
                            <td><GameChip game={c.game} /></td>
                            <td>
                              {GAMES[c.game]
                                ? <div className={`adm-balls adm-balls--${c.game}`}><DrawBalls game={c.game} draw={c} size="sm" /></div>
                                : (c.numbers || []).join(' · ')}
                            </td>
                            <td className="muted">{formatDate(c.createdAt)}</td>
                            <td className="actions">
                              <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => deleteCombination(c)}
                                title="Supprimer la combinaison">
                                <Icon name="trash" />
                              </button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                    {!loading && combinations.data.length === 0 && <Empty>Aucune combinaison enregistrée.</Empty>}
                  </div>
                  <Pagination pagination={combinations.pagination} onPage={loadCombinations} />
                </section>
              )}

              {tab === 'alerts' && (
                <section>
                  <p className="adm-meta">{total(alerts.pagination, alerts.data)} alerte(s) configurée(s)</p>
                  <div className={`adm-table-wrap ${loading ? 'is-loading' : ''}`}>
                    <table className="adm-table">
                      <thead>
                        <tr>
                          <th>Utilisateur</th>
                          <th>Jeu</th>
                          <th>Type</th>
                          <th>Statut</th>
                          <th>Créée le</th>
                          <th className="actions"><span className="sr-only">Actions</span></th>
                        </tr>
                      </thead>
                      <tbody>
                        {alerts.data.map((a) => {
                          const on = a.enabled ?? a.isActive ?? true
                          return (
                            <tr key={a._id}>
                              <td>
                                <div className="adm-user">
                                  <span className="adm-avatar">{initial(a.userId?.name)}</span>
                                  <div>
                                    <strong>{a.userId?.name || 'Utilisateur supprimé'}</strong>
                                    {a.userId?.email && <small>{a.userId.email}</small>}
                                  </div>
                                </div>
                              </td>
                              <td><GameChip game={a.game} /></td>
                              <td>{ALERT_LABELS[a.type] || a.type}</td>
                              <td>
                                <span className={`adm-status ${on ? 'is-on' : 'is-off'}`}>{on ? 'Active' : 'En pause'}</span>
                              </td>
                              <td className="muted">{formatDate(a.createdAt)}</td>
                              <td className="actions">
                                <button className="adm-icon-btn adm-icon-btn--danger" onClick={() => deleteAlert(a)}
                                  title="Supprimer l'alerte">
                                  <Icon name="trash" />
                                </button>
                              </td>
                            </tr>
                          )
                        })}
                      </tbody>
                    </table>
                    {!loading && alerts.data.length === 0 && <Empty>Aucune alerte configurée.</Empty>}
                  </div>
                  <Pagination pagination={alerts.pagination} onPage={loadAlerts} />
                </section>
              )}
            </div>
          </>
        )}

        {toast && (
          <div key={toast.id} className={`adm-toast adm-toast--${toast.kind}`} role="status">{toast.message}</div>
        )}
      </div>
    </div>
  )
}
