import { useState } from 'react'
import './App.css'
import Euromillions from './components/Euromillions'
import Loto from './components/Loto'

function App() {
  const [activeTab, setActiveTab] = useState('euromillions')

  return (
    <div className="app">
      <header className="header">
        <h1>🎰 Résultats Loterie FDJ</h1>
        <p className="subtitle">Consultez les derniers tirages de l'Euromillions et du Loto en temps réel</p>
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
      </div>

      <main className="main-content">
        {activeTab === 'euromillions' ? <Euromillions /> : <Loto />}
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

