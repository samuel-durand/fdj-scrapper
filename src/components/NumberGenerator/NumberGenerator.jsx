import { useState } from 'react'
import { useAuth } from '../../contexts/AuthContext'
import { generateRandomCombination, saveCombination } from '../../services/combinationService'
import './NumberGenerator.css'

export default function NumberGenerator({ game, onGenerate, onSave }) {
  const { user } = useAuth()
  const [combination, setCombination] = useState(null)
  const [name, setName] = useState('')
  const [isFavorite, setIsFavorite] = useState(false)
  const [loading, setLoading] = useState(false)
  const [saved, setSaved] = useState(false)

  const gameConfig = {
    euromillions: {
      name: 'EuroMillions',
      icon: '⭐',
      numbersCount: 5,
      numbersMax: 50,
      starsCount: 2,
      starsMax: 12
    },
    loto: {
      name: 'Loto',
      icon: '🍀',
      numbersCount: 5,
      numbersMax: 49,
      luckyMax: 10
    },
    eurodreams: {
      name: 'EuroDreams',
      icon: '💤',
      numbersCount: 6,
      numbersMax: 40,
      dreamMax: 5
    }
  }

  const config = gameConfig[game]

  const handleGenerate = () => {
    const newCombination = generateRandomCombination(game)
    setCombination(newCombination)
    setSaved(false)
    
    if (onGenerate) {
      onGenerate(newCombination)
    }
  }

  const handleSave = async () => {
    if (!user) {
      alert('Vous devez être connecté pour sauvegarder')
      return
    }

    if (!combination) return

    setLoading(true)
    
    const result = await saveCombination({
      ...combination,
      name: name || `${config.name} - ${new Date().toLocaleDateString('fr-FR')}`,
      isFavorite
    })

    setLoading(false)

    if (result.success) {
      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
      
      if (onSave) {
        onSave(result.combination)
      }
    } else {
      alert(result.error || 'Erreur lors de la sauvegarde')
    }
  }

  return (
    <div className="number-generator">
      <div className="generator-header">
        <h3>{config.icon} Générateur {config.name}</h3>
        <button className="generate-btn" onClick={handleGenerate}>
          🎲 Générer
        </button>
      </div>

      {combination && (
        <div className="generated-combination">
          <div className="numbers-display">
            <div className="numbers-section">
              <span className="section-label">Numéros :</span>
              <div className="numbers-grid">
                {combination.numbers.map((num, idx) => (
                  <div key={idx} className="number-ball primary">
                    {num}
                  </div>
                ))}
              </div>
            </div>

            {game === 'euromillions' && combination.stars && (
              <div className="numbers-section">
                <span className="section-label">Étoiles :</span>
                <div className="numbers-grid">
                  {combination.stars.map((star, idx) => (
                    <div key={idx} className="number-ball star">
                      {star}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {game === 'loto' && combination.luckyNumber && (
              <div className="numbers-section">
                <span className="section-label">Numéro chance :</span>
                <div className="number-ball lucky">
                  {combination.luckyNumber}
                </div>
              </div>
            )}

            {game === 'eurodreams' && combination.dreamNumber && (
              <div className="numbers-section">
                <span className="section-label">Numéro Dream :</span>
                <div className="number-ball dream">
                  {combination.dreamNumber}
                </div>
              </div>
            )}
          </div>

          {user && (
            <div className="save-section">
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Nom de la combinaison (optionnel)"
                className="combination-name-input"
              />
              
              <label className="favorite-checkbox">
                <input
                  type="checkbox"
                  checked={isFavorite}
                  onChange={(e) => setIsFavorite(e.target.checked)}
                />
                <span>⭐ Favori</span>
              </label>

              <button
                className="save-combination-btn"
                onClick={handleSave}
                disabled={loading || saved}
              >
                {loading ? '💾 Sauvegarde...' : saved ? '✅ Sauvegardé !' : '💾 Sauvegarder'}
              </button>
            </div>
          )}

          {!user && (
            <p className="login-prompt">
              Connectez-vous pour sauvegarder vos combinaisons
            </p>
          )}
        </div>
      )}

      {!combination && (
        <div className="no-combination">
          <p>Cliquez sur "Générer" pour créer une combinaison aléatoire</p>
        </div>
      )}
    </div>
  )
}

