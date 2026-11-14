import { useState, useEffect, useCallback, useRef } from 'react'
import { flushSync } from 'react-dom'
import './App.css'
import GameResults from './components/Results/GameResults'
import Login from './components/Auth/Login'
import Register from './components/Auth/Register'
import UserProfile from './components/Auth/UserProfile'
import NotificationCenter from './components/Alerts/NotificationCenter'
import AdminPanel from './components/Admin/AdminPanel'
import Background from './components/Background/Background'
import ThemeIcon from './components/ThemeIcon'
import { useAuth } from './contexts/AuthContext'
import { getUnreadCount } from './services/notificationService'
import { GAMES, GAME_KEYS } from './games'

/** Un thème a-t-il déjà été choisi sur cet appareil ? */
const hasLocalTheme = () => {
  try { return Boolean(localStorage.getItem('theme')) } catch { return false }
}

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
  const { user, updatePreferences } = useAuth()
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

  // Préférences du compte, appliquées une fois par connexion. Le thème choisi sur cet appareil
  // l'emporte sur celui du compte (sinon le rechargement de la page annulait le mode sombre).
  const prefsAppliedFor = useRef(null)
  useEffect(() => {
    if (!user?.id || prefsAppliedFor.current === user.id) return
    prefsAppliedFor.current = user.id
    if (user.preferences?.defaultTab && !gameFromHash()) setActiveTab(user.preferences.defaultTab)
    if (user.preferences?.theme && !hasLocalTheme()) setTheme(user.preferences.theme)
  }, [user])

  const toggleTheme = (e) => {
    const next = theme === 'light' ? 'dark' : 'light'
    const apply = () => {
      document.documentElement.setAttribute('data-theme', next)
      flushSync(() => setTheme(next))
    }
    // Le nouveau thème se propage en cercle depuis le bouton (View Transitions API).
    // Sans prise en charge, ou si l'utilisateur demande moins d'animations : bascule directe.
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || reduce) {
      apply()
    } else {
      const r = e.currentTarget.getBoundingClientRect()
      const x = r.left + r.width / 2
      const y = r.top + r.height / 2
      const radius = Math.hypot(Math.max(x, window.innerWidth - x), Math.max(y, window.innerHeight - y))
      const transition = document.startViewTransition(apply)
      transition.ready.then(() => {
        document.documentElement.animate(
          { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
          { duration: 700, easing: 'cubic-bezier(.4, 0, .2, 1)', pseudoElement: '::view-transition-new(root)' },
        )
      }).catch(() => { /* transition interrompue : le thème est déjà appliqué */ })
    }
    // Choix explicite sur cet appareil (seulement au clic : sinon le thème par défaut serait
    // mémorisé avant que les préférences du compte aient pu s'appliquer)
    try { localStorage.setItem('theme', next) } catch { /* stockage indisponible */ }
    // Mémorisé aussi dans le compte : on le retrouve sur ses autres appareils
    if (user) updatePreferences({ theme: next }).catch(() => { /* hors ligne : le choix local suffit */ })
  }

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
              className="icon-btn theme-toggle"
              onClick={toggleTheme}
              title={`Passer en thème ${theme === 'light' ? 'sombre' : 'clair'}`}
              aria-label="Changer de thème"
              aria-pressed={theme === 'dark'}
            >
              <ThemeIcon dark={theme === 'dark'} />
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
