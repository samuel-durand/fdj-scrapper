import { useState, useEffect } from 'react'
import './App.css'
import Euromillions from './components/Euromillions'
import Loto from './components/Loto'
import Eurodreams from './components/Eurodreams'
import { getEuromillionsResults, getLotoResults } from './services/lotteryService'

// Fonction pour calculer le prochain jour de tirage
function getNextDrawDate(gameType) {
  const today = new Date()
  const currentDay = today.getDay() // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  
  let daysUntilNext = 0
  
  if (gameType === 'euromillions') {
    // Euromillions : Mardi (2) et Vendredi (5)
    if (currentDay === 0 || currentDay === 1) {
      // Dimanche ou Lundi → prochain tirage Mardi
      daysUntilNext = 2 - currentDay
    } else if (currentDay === 2) {
      // Mardi → vérifier l'heure (si avant 20h15, c'est aujourd'hui, sinon vendredi)
      const hour = today.getHours()
      daysUntilNext = hour < 20 ? 0 : 3
    } else if (currentDay === 3 || currentDay === 4) {
      // Mercredi ou Jeudi → prochain tirage Vendredi
      daysUntilNext = 5 - currentDay
    } else if (currentDay === 5) {
      // Vendredi → vérifier l'heure
      const hour = today.getHours()
      daysUntilNext = hour < 20 ? 0 : 4
    } else {
      // Samedi → prochain tirage Mardi
      daysUntilNext = 3
    }
  } else if (gameType === 'eurodreams') {
    // Eurodreams : Lundi (1) et Jeudi (4)
    if (currentDay === 0) {
      // Dimanche → prochain tirage Lundi
      daysUntilNext = 1
    } else if (currentDay === 1) {
      // Lundi → vérifier l'heure
      const hour = today.getHours()
      daysUntilNext = hour < 21 ? 0 : 3
    } else if (currentDay === 2 || currentDay === 3) {
      // Mardi ou Mercredi → prochain tirage Jeudi
      daysUntilNext = 4 - currentDay
    } else if (currentDay === 4) {
      // Jeudi → vérifier l'heure
      const hour = today.getHours()
      daysUntilNext = hour < 21 ? 0 : 4
    } else {
      // Vendredi ou Samedi → prochain tirage Lundi
      daysUntilNext = (8 - currentDay) % 7
    }
  } else {
    // Loto : Lundi (1), Mercredi (3) et Samedi (6)
    if (currentDay === 0) {
      // Dimanche → prochain tirage Lundi
      daysUntilNext = 1
    } else if (currentDay === 1) {
      // Lundi → vérifier l'heure
      const hour = today.getHours()
      daysUntilNext = hour < 20 ? 0 : 2
    } else if (currentDay === 2) {
      // Mardi → prochain tirage Mercredi
      daysUntilNext = 1
    } else if (currentDay === 3) {
      // Mercredi → vérifier l'heure
      const hour = today.getHours()
      daysUntilNext = hour < 20 ? 0 : 3
    } else if (currentDay === 4 || currentDay === 5) {
      // Jeudi ou Vendredi → prochain tirage Samedi
      daysUntilNext = 6 - currentDay
    } else {
      // Samedi → vérifier l'heure
      const hour = today.getHours()
      daysUntilNext = hour < 20 ? 0 : 2
    }
  }
  
  const nextDate = new Date(today)
  nextDate.setDate(today.getDate() + daysUntilNext)
  
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi']
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre']
  
  const dayName = days[nextDate.getDay()]
  const day = nextDate.getDate()
  const month = months[nextDate.getMonth()]
  const year = nextDate.getFullYear()
  
  return {
    day: dayName,
    date: `${day} ${month} ${year}`
  }
}

function App() {
  const [activeTab, setActiveTab] = useState('euromillions')
  const [euromillionsData, setEuromillionsData] = useState(null)
  const [lotoData, setLotoData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [nextEuroDrawDate, setNextEuroDrawDate] = useState(null)
  const [nextLotoDrawDate, setNextLotoDrawDate] = useState(null)
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('theme') || 'light'
  })

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('theme', theme)
  }, [theme])

  const toggleTheme = () => {
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light')
  }

  useEffect(() => {
    async function fetchJackpots() {
      try {
        setLoading(true)
        const [euroResults, lotoResults] = await Promise.all([
          getEuromillionsResults(10),
          getLotoResults(10)
        ])
        
        // Trouver le premier tirage avec un jackpot disponible pour Euromillions
        const euroWithJackpot = euroResults.find(draw => 
          draw.jackpot && draw.jackpot !== 'Non disponible'
        )
        setEuromillionsData(euroWithJackpot || euroResults[0])
        
        // Trouver le premier tirage avec un jackpot disponible pour Loto
        const lotoWithJackpot = lotoResults.find(draw => 
          draw.jackpot && draw.jackpot !== 'Non disponible'
        )
        setLotoData(lotoWithJackpot || lotoResults[0])
        
        // Calculer les vraies dates des prochains tirages
        setNextEuroDrawDate(getNextDrawDate('euromillions'))
        setNextLotoDrawDate(getNextDrawDate('loto'))
      } catch (error) {
        console.error('Erreur lors du chargement des jackpots:', error)
      } finally {
        setLoading(false)
      }
    }
    fetchJackpots()
  }, [])

  return (
    <div className="app">
      <header className="header">
        <div className="header-content">
          <div className="header-text">
            <h1>🎰 Résultats Loterie FDJ</h1>
            <p className="subtitle">Consultez les derniers tirages de l'Euromillions et du Loto en temps réel</p>
          </div>
          <button className="theme-toggle" onClick={toggleTheme} title={`Passer au thème ${theme === 'light' ? 'sombre' : 'clair'}`}>
            {theme === 'light' ? '🌙' : '☀️'}
          </button>
        </div>
      </header>

      <div className="tabs">
        <button 
          className={`tab ${activeTab === 'euromillions' ? 'active' : ''}`}
          onClick={() => setActiveTab('euromillions')}
        >
          ⭐ EuroMillions - My Million
        </button>
        <button 
          className={`tab ${activeTab === 'loto' ? 'active' : ''}`}
          onClick={() => setActiveTab('loto')}
        >
          🍀 Loto®
        </button>
        <button 
          className={`tab ${activeTab === 'eurodreams' ? 'active' : ''}`}
          onClick={() => setActiveTab('eurodreams')}
        >
          💤 EuroDreams
        </button>
      </div>

      {!loading && (
        <>
          {activeTab === 'euromillions' && euromillionsData?.jackpot && euromillionsData.jackpot !== 'Non disponible' && nextEuroDrawDate && (
            <div className="top-jackpot-banner">
              <div className="top-jackpot-info">
                <span className="top-jackpot-icon">💰</span>
                <div className="top-jackpot-details">
                  <span className="top-jackpot-title">Prochain Jackpot Euromillions</span>
                  <span className="top-jackpot-value">{euromillionsData.jackpot}</span>
                </div>
                <span className="top-next-draw-info">Prochain tirage : {nextEuroDrawDate.day} {nextEuroDrawDate.date}</span>
              </div>
            </div>
          )}
          {activeTab === 'loto' && lotoData?.jackpot && lotoData.jackpot !== 'Non disponible' && nextLotoDrawDate && (
            <div className="top-jackpot-banner">
              <div className="top-jackpot-info">
                <span className="top-jackpot-icon">💰</span>
                <div className="top-jackpot-details">
                  <span className="top-jackpot-title">Prochain Jackpot Loto</span>
                  <span className="top-jackpot-value">{lotoData.jackpot}</span>
                </div>
                <span className="top-next-draw-info">Prochain tirage : {nextLotoDrawDate.day} {nextLotoDrawDate.date}</span>
              </div>
            </div>
          )}
        </>
      )}

      <main className="main-content">
        {activeTab === 'euromillions' && <Euromillions />}
        {activeTab === 'loto' && <Loto />}
        {activeTab === 'eurodreams' && <Eurodreams />}
      </main>

      <footer className="footer">
        <p>✅ Résultats officiels FDJ® - Mis à jour en temps réel</p>
        <p style={{ marginTop: '12px', fontSize: '0.85em', opacity: 0.8 }}>
          🔞 Interdit aux mineurs · ♠️ Jouer comporte des risques : endettement, isolement, dépendance
        </p>
      </footer>
    </div>
  )
}

export default App

