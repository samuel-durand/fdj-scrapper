import { useState, useEffect, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Bar, Doughnut, Line } from 'react-chartjs-2'
import { api } from '../services/api'
import './GameStatistics.css'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function GameStatistics({ gameType }) {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const gameLabels = {
    euromillions: 'Euromillions',
    loto: 'Loto',
    eurodreams: 'EuroDreams'
  }

  useEffect(() => {
    loadStats()
  }, [gameType])

  const loadStats = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await api.get(`/stats/games/${gameType}`)
      if (response.success) {
        setStats(response.data)
      } else {
        setError(response.message || 'Erreur lors du chargement')
      }
    } catch (err) {
      console.error('Erreur chargement stats:', err)
      setError('Impossible de charger les statistiques')
    } finally {
      setLoading(false)
    }
  }

  // Configuration des couleurs selon le thème
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  const textColor = isDark ? '#f1f5f9' : '#1f2937'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'

  // Couleurs selon le jeu
  const gameColors = {
    euromillions: {
      primary: '#0052CC',
      secondary: '#4A90E2',
      accent: '#FFB800'
    },
    loto: {
      primary: '#00C389',
      secondary: '#059669',
      accent: '#10B981'
    },
    eurodreams: {
      primary: '#FF006E',
      secondary: '#FF4081',
      accent: '#E91E63'
    }
  }

  const colors = gameColors[gameType] || gameColors.euromillions

  // Graphique en barres - Top 15 numéros
  const barChartData = useMemo(() => {
    if (!stats?.numbers) return null

    const top15 = stats.numbers.slice(0, 15)
    
    return {
      labels: top15.map(n => n.number.toString()),
      datasets: [
        {
          label: 'Fréquence',
          data: top15.map(n => n.count),
          backgroundColor: top15.map((_, idx) => {
            const alpha = idx < 5 ? 0.8 : idx < 10 ? 0.6 : 0.4
            return `${colors.primary}${Math.round(alpha * 255).toString(16).padStart(2, '0')}`
          }),
          borderColor: colors.primary,
          borderWidth: 2,
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    }
  }, [stats, colors])

  // Graphique en donut - Répartition des bonus
  const donutChartData = useMemo(() => {
    if (gameType === 'euromillions' && stats?.stars) {
      return {
        labels: stats.stars.map(s => `Étoile ${s.number}`),
        datasets: [
          {
            data: stats.stars.map(s => s.count),
            backgroundColor: [
              '#FFB800', '#FF8C00', '#FF6B35', '#FF4D00',
              '#FFD700', '#FFA500', '#FF8C42', '#FF7F50',
              '#FF6347', '#FF4500', '#FF3300', '#FF0000'
            ],
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      }
    } else if (gameType === 'loto' && stats?.luckyNumbers) {
      return {
        labels: stats.luckyNumbers.map(n => `Chance ${n.number}`),
        datasets: [
          {
            data: stats.luckyNumbers.map(n => n.count),
            backgroundColor: [
              '#00C389', '#10B981', '#059669', '#047857',
              '#065F46', '#064E3B', '#022C22', '#014737',
              '#012A1F', '#001A14'
            ],
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      }
    } else if (gameType === 'eurodreams' && stats?.dreamNumbers) {
      return {
        labels: stats.dreamNumbers.map(n => `Dream ${n.number}`),
        datasets: [
          {
            data: stats.dreamNumbers.map(n => n.count),
            backgroundColor: [
              '#FF006E', '#FF4081', '#E91E63', '#C2185B', '#AD1457'
            ],
            borderColor: isDark ? '#1e293b' : '#ffffff',
            borderWidth: 2,
            hoverOffset: 8
          }
        ]
      }
    }
    return null
  }, [stats, gameType, isDark])

  // Graphique en barres - Comparaison chaud/froid
  const hotColdData = useMemo(() => {
    if (!stats?.topNumbers || !stats?.bottomNumbers) return null

    const top10 = stats.topNumbers.slice(0, 10)
    const bottom10 = stats.bottomNumbers.slice(0, 10).reverse()

    return {
      labels: ['Top 10', 'Bottom 10'],
      datasets: [
        {
          label: 'Fréquence moyenne',
          data: [
            top10.reduce((sum, n) => sum + n.count, 0) / 10,
            bottom10.reduce((sum, n) => sum + n.count, 0) / 10
          ],
          backgroundColor: [colors.primary, colors.secondary],
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    }
  }, [stats, colors])

  // Options communes
  const commonOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
        labels: {
          color: textColor,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
          }
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  }

  const barChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Top 15 Numéros les Plus Fréquents',
        color: textColor,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor,
          font: {
            size: 11
          }
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor,
          font: {
            size: 11
          },
          stepSize: 1
        }
      }
    }
  }

  const donutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor,
          padding: 10,
          font: {
            size: 11
          },
          usePointStyle: true
        }
      },
      tooltip: {
        backgroundColor: isDark ? 'rgba(30, 41, 59, 0.95)' : 'rgba(255, 255, 255, 0.95)',
        titleColor: textColor,
        bodyColor: textColor,
        borderColor: gridColor,
        borderWidth: 1,
        padding: 12,
        cornerRadius: 8
      },
      title: {
        display: true,
        text: gameType === 'euromillions' ? 'Répartition des Étoiles' :
              gameType === 'loto' ? 'Répartition des Numéros Chance' :
              'Répartition des Numéros Dream',
        color: textColor,
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 15
        }
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  }

  const hotColdOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Comparaison Numéros Chauds vs Froids',
        color: textColor,
        font: {
          size: 14,
          weight: 'bold'
        },
        padding: {
          bottom: 15
        }
      }
    },
    scales: {
      x: {
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor
        }
      },
      y: {
        beginAtZero: true,
        grid: {
          color: gridColor,
          drawBorder: false
        },
        ticks: {
          color: textColor,
          precision: 0
        }
      }
    }
  }

  if (loading) {
    return (
      <div className="game-statistics-container">
        <div className="loading-stats">
          <div className="spinner"></div>
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="game-statistics-container">
        <div className="error-stats">
          <p>❌ {error}</p>
          <button onClick={loadStats} className="retry-btn">🔄 Réessayer</button>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="game-statistics-container">
        <p className="no-stats">Aucune statistique disponible</p>
      </div>
    )
  }

  return (
    <div className="game-statistics-container">
      <div className="stats-header">
        <h2>📊 Statistiques {gameLabels[gameType]}</h2>
        <div className="stats-summary">
          <div className="summary-item">
            <span className="summary-label">Tirages analysés</span>
            <span className="summary-value">{stats.totalDraws}</span>
          </div>
          {stats.dateRange.first && stats.dateRange.last && (
            <div className="summary-item">
              <span className="summary-label">Période</span>
              <span className="summary-value">
                {new Date(stats.dateRange.last).toLocaleDateString('fr-FR')} - {new Date(stats.dateRange.first).toLocaleDateString('fr-FR')}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="charts-grid">
        {/* Graphique en barres - Top numéros */}
        {barChartData && (
          <div className="chart-card">
            <div className="chart-wrapper">
              {barChartData && barChartData.labels && barChartData.labels.length > 0 && (
                <Bar data={barChartData} options={barChartOptions} />
              )}
            </div>
          </div>
        )}

        {/* Graphique en donut - Bonus */}
        {donutChartData && (
          <div className="chart-card">
            <div className="chart-wrapper">
              {donutChartData && donutChartData.labels && donutChartData.labels.length > 0 && (
                <Doughnut data={donutChartData} options={donutChartOptions} />
              )}
            </div>
          </div>
        )}

        {/* Comparaison chaud/froid */}
        {hotColdData && (
          <div className="chart-card">
            <div className="chart-wrapper">
              {hotColdData && hotColdData.labels && hotColdData.labels.length > 0 && (
                <Bar data={hotColdData} options={hotColdOptions} />
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tableaux de statistiques détaillées */}
      <div className="stats-tables-grid">
        <div className="stats-table-card">
          <h3>🔥 Top 10 Numéros les Plus Sortis</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Numéro</th>
                <th>Sorties</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {stats.topNumbers.slice(0, 10).map((num, idx) => (
                <tr key={num.number} className={idx < 3 ? 'top-three' : ''}>
                  <td>#{idx + 1}</td>
                  <td>
                    <span className={`stat-number ${gameType}`}>{num.number}</span>
                  </td>
                  <td>{num.count}</td>
                  <td>{num.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="stats-table-card">
          <h3>❄️ Top 10 Numéros les Moins Sortis</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Rang</th>
                <th>Numéro</th>
                <th>Sorties</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {stats.bottomNumbers.slice(0, 10).map((num, idx) => (
                <tr key={num.number}>
                  <td>#{idx + 1}</td>
                  <td>
                    <span className={`stat-number ${gameType} cold`}>{num.number}</span>
                  </td>
                  <td>{num.count}</td>
                  <td>{num.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {stats.topStars && stats.topStars.length > 0 && (
        <div className="stats-table-card">
          <h3>⭐ Statistiques des Étoiles</h3>
          <table className="stats-table">
            <thead>
              <tr>
                <th>Étoile</th>
                <th>Sorties</th>
                <th>%</th>
              </tr>
            </thead>
            <tbody>
              {stats.topStars.map((star) => (
                <tr key={star.number}>
                  <td>⭐ {star.number}</td>
                  <td>{star.count}</td>
                  <td>{star.percentage}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

