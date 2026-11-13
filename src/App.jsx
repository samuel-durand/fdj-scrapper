import { useState, useEffect, useCallback } from 'react'
import './App.css'
import GameResults from './components/Results/GameResults'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import UserProfile from './components/Auth/UserProfile'
import NotificationCenter from './components/Alerts/NotificationCenter'
import AdminPanel from './components/Admin/AdminPanel'
import Background from './components/Background/Background'
import { useAuth } from './contexts/AuthContext'
import { getUnreadCount } from './services/notificationService'
import { GAMES, GAME_KEYS } from './games'

const gameFromHash = () => {
  const h = window.location.hash.replace('#', '')
  return GAME_KEYS.includes(h) ? h : null
}

function Logo() {
  return (
    <svg className="brand__mark" width="34" height="34" viewBox="0 0 34 34" aria-hidden="true">
      <circle cx="11" cy="20" r="9" fill="var(--c-euromillions)" />
      <circle cx="23" cy="20" r="9" fill="var(--c-loto)" opacity=".92" />
      <circle cx="17" cy="10" r="8" fill="var(--c-star)" />
    </svg>
  )
}

function App() {
  const { user } = useAuth()
  const [activeTab, setActiveTab] = useState(() => gameFromHash() || 'euromillions')
  const [theme, setTheme] = useState(() => {
    try { return localStorage.getItem('theme') || 'light' } catch { return 'light' }
  })
  const [modal, setModal] = useState(null) // 'login' | 'register' | 'profile' | 'notifications' | 'admin'
  const [unreadCount, setUnreadCount] = useState(0)
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    try { localStorage.setItem('theme', theme) } catch { /* stockage indisponible */ }
  }, [theme])

  // Onglet <-> URL (#euromillions, #loto, #eurodreams)
  useEffect(() => {
    const onHash = () => { const g = gameFromHash(); if (g) setActiveTab(g) }
    window.addEventListener('hashchange', onHash)
    return () => window.removeEventListener('hashchange', onHash)
  }, [])
  const selectTab = (key) => {
    setActiveTab(key)
    history.replaceState(null, '', `#${key}`)
  }

  useEffect(() => {
    if (user?.preferences?.defaultTab && !gameFromHash()) setActiveTab(user.preferences.defaultTab)
    if (user?.preferences?.theme) setTheme(user.preferences.theme)
  }, [user])

  const updateUnreadCount = useCallback(async () => {
    if (!user?.id) return
    try {
      setUnreadCount(await getUnreadCount())
    } catch (error) {
      console.error('Erreur lors de la récupération des notifications:', error)
    }
  }, [user])

  // Compteur de notifications (toutes les 5 min). Les alertes sont évaluées par le
  // worker côté serveur dès qu'un tirage arrive : rien à calculer dans le navigateur.
  useEffect(() => {
    if (!user?.id) return
    updateUnreadCount()
    const interval = setInterval(updateUnreadCount, 5 * 60 * 1000)
    return () => clearInterval(interval)
  }, [user, updateUnreadCount])

  const close = () => { setModal(null); updateUnreadCount() }

  return (
    <div className={`app app--${activeTab}`}>
      <Background game={activeTab} theme={theme} />
      <header className={`topbar ${scrolled ? 'is-scrolled' : ''}`}>
        <div className="topbar__inner">
          <a className="brand" href={`#${activeTab}`}>
            <Logo />
            <span className="brand__text">Résultats <strong>Loterie</strong></span>
          </a>

          <nav className="gamenav" aria-label="Jeux">
            {GAME_KEYS.map((key) => (
              <button
                key={key}
                className={`gamenav__item gamenav__item--${key} ${activeTab === key ? 'is-active' : ''}`}
                aria-current={activeTab === key ? 'page' : undefined}
                onClick={() => selectTab(key)}
              >
                {GAMES[key].name}
              </button>
            ))}
          </nav>

          <div className="topbar__actions">
            <button
              className="icon-btn"
              onClick={() => setTheme(theme === 'light' ? 'dark' : 'light')}
              title={`Thème ${theme === 'light' ? 'sombre' : 'clair'}`}
              aria-label="Changer de thème"
            >
              {theme === 'light' ? (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" fill="currentColor" /></svg>
              ) : (
                <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="5" fill="currentColor" /><g stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M12 1v3M12 20v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M1 12h3M20 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></g></svg>
              )}
            </button>

            {user ? (
              <>
                <button className="icon-btn notif" onClick={() => setModal('notifications')} aria-label="Notifications">
                  <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M18 8a6 6 0 1 0-12 0c0 7-3 9-3 9h18s-3-2-3-9M13.7 21a2 2 0 0 1-3.4 0" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                  {unreadCount > 0 && <span className="notif__badge">{unreadCount}</span>}
                </button>
                {user.role === 'admin' && (
                  <button className="btn btn--ghost btn--sm" onClick={() => setModal('admin')}>Admin</button>
                )}
                <button className="btn btn--primary btn--sm" onClick={() => setModal('profile')}>
                  <span className="avatar">{(user.name || '?').charAt(0).toUpperCase()}</span>
                  <span className="hide-sm">{user.name}</span>
                </button>
              </>
            ) : (
              <>
                <button className="btn btn--ghost btn--sm hide-sm" onClick={() => setModal('register')}>Inscription</button>
                <button className="btn btn--primary btn--sm" onClick={() => setModal('login')}>Connexion</button>
              </>
            )}
          </div>
        </div>
      </header>

      <main className="main">
        <GameResults game={activeTab} />
      </main>

      <footer className="footer">
        <div className="footer__inner">
          <p className="footer__warning">
            <strong>18+</strong> Jouer comporte des risques : endettement, isolement, dépendance.
            Pour être aidé, appelez le 09 74 75 13 13 (appel non surtaxé).
          </p>
          <p className="footer__note">
            Site indépendant, non affilié à La Française des Jeux. Résultats repris des publications
            officielles — en cas de différence, seuls les résultats officiels font foi.
          </p>
        </div>
      </footer>

      {modal === 'login' && <Login onClose={close} onSwitchToRegister={() => setModal('register')} />}
      {modal === 'register' && <Register onClose={close} onSwitchToLogin={() => setModal('login')} />}
      {modal === 'profile' && <UserProfile onClose={close} />}
      {modal === 'notifications' && <NotificationCenter userId={user?.id} onClose={close} />}
      {modal === 'admin' && <AdminPanel onClose={close} />}
    </div>
  )
}

export default App
