import { useState, useEffect } from 'react'
import './Statistics.css'

function Statistics({ draws, gameType }) {
  const [numberStats, setNumberStats] = useState([])
  const [starStats, setStarStats] = useState([])
  const [luckyStats, setLuckyStats] = useState([])
  const [generatedNumbers, setGeneratedNumbers] = useState(null)
  const [generationMode, setGenerationMode] = useState('hot') // 'hot', 'cold', 'balanced', 'random'

  useEffect(() => {
    if (!draws || draws.length === 0) return

    // Analyser les numéros principaux
    const numberFrequency = {}
    const maxNumber = gameType === 'loto' ? 49 : 50
    
    // Initialiser tous les numéros
    for (let i = 1; i <= maxNumber; i++) {
      numberFrequency[i] = 0
    }

    // Compter les occurrences
    draws.forEach(draw => {
      if (draw.numbers && Array.isArray(draw.numbers)) {
        draw.numbers.forEach(num => {
          const numInt = parseInt(num)
          if (!isNaN(numInt)) {
            numberFrequency[numInt] = (numberFrequency[numInt] || 0) + 1
          }
        })
      }
    })

    // Convertir en tableau et trier
    const numbersArray = Object.entries(numberFrequency)
      .map(([num, count]) => ({
        number: parseInt(num),
        count: count,
        percentage: ((count / draws.length) * 100).toFixed(1)
      }))
      .sort((a, b) => b.count - a.count)

    setNumberStats(numbersArray)

    // Analyser les étoiles pour Euromillions
    if (gameType === 'euromillions') {
      const starFrequency = {}
      for (let i = 1; i <= 12; i++) {
        starFrequency[i] = 0
      }

      draws.forEach(draw => {
        if (draw.stars && Array.isArray(draw.stars)) {
          draw.stars.forEach(star => {
            const starInt = parseInt(star)
            if (!isNaN(starInt)) {
              starFrequency[starInt] = (starFrequency[starInt] || 0) + 1
            }
          })
        }
      })

      const starsArray = Object.entries(starFrequency)
        .map(([num, count]) => ({
          number: parseInt(num),
          count: count,
          percentage: ((count / draws.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)

      setStarStats(starsArray)
    }

    // Analyser les numéros chance pour Loto
    if (gameType === 'loto') {
      const luckyFrequency = {}
      for (let i = 1; i <= 10; i++) {
        luckyFrequency[i] = 0
      }

      draws.forEach(draw => {
        const luckyNum = parseInt(draw.luckyNumber)
        if (!isNaN(luckyNum)) {
          luckyFrequency[luckyNum] = (luckyFrequency[luckyNum] || 0) + 1
        }
      })

      const luckyArray = Object.entries(luckyFrequency)
        .map(([num, count]) => ({
          number: parseInt(num),
          count: count,
          percentage: ((count / draws.length) * 100).toFixed(1)
        }))
        .sort((a, b) => b.count - a.count)

      setLuckyStats(luckyArray)
    }
  }, [draws, gameType])

  const generateNumbers = () => {
    let selectedNumbers = []
    let selectedBonus = null

    if (generationMode === 'hot') {
      // Utiliser les numéros les plus sortis
      const hotNumbers = numberStats.slice(0, 15).map(s => s.number)
      selectedNumbers = getRandomFromArray(hotNumbers, 5)
    } else if (generationMode === 'cold') {
      // Utiliser les numéros les moins sortis
      const coldNumbers = numberStats.slice(-15).map(s => s.number)
      selectedNumbers = getRandomFromArray(coldNumbers, 5)
    } else if (generationMode === 'balanced') {
      // Mélange: 3 chauds, 2 froids
      const hotNumbers = numberStats.slice(0, 10).map(s => s.number)
      const coldNumbers = numberStats.slice(-10).map(s => s.number)
      const hot = getRandomFromArray(hotNumbers, 3)
      const cold = getRandomFromArray(coldNumbers, 2)
      selectedNumbers = [...hot, ...cold]
    } else {
      // Complètement aléatoire
      const maxNumber = gameType === 'loto' ? 49 : 50
      selectedNumbers = getRandomNumbers(1, maxNumber, 5)
    }

    selectedNumbers.sort((a, b) => a - b)

    // Générer le bonus (étoiles ou numéro chance)
    if (gameType === 'euromillions') {
      let stars = []
      if (generationMode === 'hot') {
        const hotStars = starStats.slice(0, 6).map(s => s.number)
        stars = getRandomFromArray(hotStars, 2)
      } else if (generationMode === 'cold') {
        const coldStars = starStats.slice(-6).map(s => s.number)
        stars = getRandomFromArray(coldStars, 2)
      } else {
        stars = getRandomNumbers(1, 12, 2)
      }
      stars.sort((a, b) => a - b)
      selectedBonus = stars
    } else {
      // Loto
      if (generationMode === 'hot' && luckyStats.length > 0) {
        const hotLucky = luckyStats.slice(0, 5).map(s => s.number)
        selectedBonus = hotLucky[Math.floor(Math.random() * hotLucky.length)]
      } else if (generationMode === 'cold' && luckyStats.length > 0) {
        const coldLucky = luckyStats.slice(-5).map(s => s.number)
        selectedBonus = coldLucky[Math.floor(Math.random() * coldLucky.length)]
      } else {
        selectedBonus = Math.floor(Math.random() * 10) + 1
      }
    }

    setGeneratedNumbers({
      numbers: selectedNumbers,
      bonus: selectedBonus
    })
  }

  const getRandomFromArray = (arr, count) => {
    const shuffled = [...arr].sort(() => 0.5 - Math.random())
    return shuffled.slice(0, count)
  }

  const getRandomNumbers = (min, max, count) => {
    const numbers = []
    while (numbers.length < count) {
      const num = Math.floor(Math.random() * (max - min + 1)) + min
      if (!numbers.includes(num)) {
        numbers.push(num)
      }
    }
    return numbers
  }

  if (!draws || draws.length === 0) {
    return (
      <div className="statistics-container">
        <p className="no-data">Pas assez de données pour afficher les statistiques</p>
      </div>
    )
  }

  return (
    <div className="statistics-container">
      <div className="statistics-header">
        <h3>📊 Statistiques & Générateur</h3>
        <p className="stats-info">Basé sur {draws.length} tirages analysés</p>
      </div>

      {/* Générateur de numéros */}
      <div className="number-generator">
        <h4>🎲 Générateur de Numéros</h4>
        <div className="generation-modes">
          <button
            className={`mode-btn ${generationMode === 'hot' ? 'active' : ''}`}
            onClick={() => setGenerationMode('hot')}
          >
            🔥 Numéros Chauds
          </button>
          <button
            className={`mode-btn ${generationMode === 'cold' ? 'active' : ''}`}
            onClick={() => setGenerationMode('cold')}
          >
            ❄️ Numéros Froids
          </button>
          <button
            className={`mode-btn ${generationMode === 'balanced' ? 'active' : ''}`}
            onClick={() => setGenerationMode('balanced')}
          >
            ⚖️ Équilibré
          </button>
          <button
            className={`mode-btn ${generationMode === 'random' ? 'active' : ''}`}
            onClick={() => setGenerationMode('random')}
          >
            🎰 Aléatoire
          </button>
        </div>

        <button className="generate-btn" onClick={generateNumbers}>
          ✨ Générer mes Numéros
        </button>

        {generatedNumbers && (
          <div className="generated-result">
            <div className="generated-numbers">
              <span className="result-label">Numéros :</span>
              <div className="result-balls">
                {generatedNumbers.numbers.map((num, idx) => (
                  <div key={idx} className={`result-ball ${gameType}`}>
                    {num}
                  </div>
                ))}
              </div>
            </div>
            <div className="generated-bonus">
              <span className="result-label">
                {gameType === 'loto' ? 'Numéro Chance :' : 'Étoiles :'}
              </span>
              <div className="result-balls">
                {gameType === 'loto' ? (
                  <div className="result-ball lucky">{generatedNumbers.bonus}</div>
                ) : (
                  generatedNumbers.bonus.map((star, idx) => (
                    <div key={idx} className="result-ball star">
                      ⭐ {star}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Statistiques des numéros */}
      <div className="stats-section">
        <h4>🔢 Numéros Principaux</h4>
        <div className="stats-tables">
          <div className="stats-column">
            <h5>🔥 Top 10 - Plus Sortis</h5>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Sorties</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {numberStats.slice(0, 10).map((stat, idx) => (
                  <tr key={stat.number} className={idx < 3 ? 'top-three' : ''}>
                    <td className="number-cell">
                      <span className={`stat-ball ${gameType}`}>{stat.number}</span>
                    </td>
                    <td>{stat.count}</td>
                    <td>{stat.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="stats-column">
            <h5>❄️ Top 10 - Moins Sortis</h5>
            <table className="stats-table">
              <thead>
                <tr>
                  <th>N°</th>
                  <th>Sorties</th>
                  <th>%</th>
                </tr>
              </thead>
              <tbody>
                {numberStats.slice(-10).reverse().map((stat) => (
                  <tr key={stat.number}>
                    <td className="number-cell">
                      <span className={`stat-ball ${gameType} cold`}>{stat.number}</span>
                    </td>
                    <td>{stat.count}</td>
                    <td>{stat.percentage}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Statistiques étoiles Euromillions */}
      {gameType === 'euromillions' && starStats.length > 0 && (
        <div className="stats-section">
          <h4>⭐ Étoiles</h4>
          <div className="stats-tables">
            <div className="stats-column">
              <h5>🔥 Plus Sorties</h5>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Sorties</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {starStats.slice(0, 6).map((stat, idx) => (
                    <tr key={stat.number} className={idx < 2 ? 'top-three' : ''}>
                      <td className="number-cell">
                        <span className="stat-ball star">⭐ {stat.number}</span>
                      </td>
                      <td>{stat.count}</td>
                      <td>{stat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="stats-column">
              <h5>❄️ Moins Sorties</h5>
              <table className="stats-table">
                <thead>
                  <tr>
                    <th>N°</th>
                    <th>Sorties</th>
                    <th>%</th>
                  </tr>
                </thead>
                <tbody>
                  {starStats.slice(-6).reverse().map((stat) => (
                    <tr key={stat.number}>
                      <td className="number-cell">
                        <span className="stat-ball star cold">⭐ {stat.number}</span>
                      </td>
                      <td>{stat.count}</td>
                      <td>{stat.percentage}%</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Statistiques numéro chance Loto */}
      {gameType === 'loto' && luckyStats.length > 0 && (
        <div className="stats-section">
          <h4>🍀 Numéros Chance</h4>
          <table className="stats-table stats-table-inline">
            <thead>
              <tr>
                <th>N°</th>
                <th>Sorties</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {luckyStats.map((stat, idx) => (
                <tr key={stat.number} className={idx < 3 ? 'top-three' : ''}>
                  <td className="number-cell">
                    <span className="stat-ball lucky">{stat.number}</span>
                  </td>
                  <td>{stat.count}</td>
                  <td>{stat.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <div className="stats-legend">
        <p><strong>🔥 Numéros Chauds :</strong> Les plus sortis récemment</p>
        <p><strong>❄️ Numéros Froids :</strong> Les moins sortis récemment</p>
        <p><strong>⚖️ Équilibré :</strong> Mix de numéros chauds et froids</p>
        <p className="disclaimer">⚠️ Ces statistiques sont fournies à titre informatif. Le hasard reste imprévisible !</p>
      </div>
    </div>
  )
}

export default Statistics

