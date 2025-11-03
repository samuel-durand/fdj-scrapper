import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import './DashboardCharts.css'

// Enregistrer les composants Chart.js
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
)

export default function DashboardCharts({ stats }) {
  // Configuration des couleurs selon le thème
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark'
  
  const textColor = isDark ? '#f1f5f9' : '#1f2937'
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)'
  
  // Calculer les variations et moyennes
  const metrics = useMemo(() => {
    if (!stats || !stats.timeSeries?.daily) {
      return {
        usersVariation: 0,
        combinationsVariation: 0,
        alertsVariation: 0,
        avgUsers: 0,
        avgCombinations: 0,
        avgAlerts: 0
      }
    }

    const daily = stats.timeSeries.daily
    const last7Days = daily.slice(-7)
    const prev7Days = daily.slice(-14, -7)

    const avgLast7 = {
      users: last7Days.reduce((sum, d) => sum + d.users, 0) / 7,
      combinations: last7Days.reduce((sum, d) => sum + d.combinations, 0) / 7,
      alerts: last7Days.reduce((sum, d) => sum + d.alerts, 0) / 7
    }

    const avgPrev7 = {
      users: prev7Days.reduce((sum, d) => sum + d.users, 0) / 7,
      combinations: prev7Days.reduce((sum, d) => sum + d.combinations, 0) / 7,
      alerts: prev7Days.reduce((sum, d) => sum + d.alerts, 0) / 7
    }

    return {
      usersVariation: avgPrev7.users > 0 
        ? ((avgLast7.users - avgPrev7.users) / avgPrev7.users * 100).toFixed(1)
        : 0,
      combinationsVariation: avgPrev7.combinations > 0
        ? ((avgLast7.combinations - avgPrev7.combinations) / avgPrev7.combinations * 100).toFixed(1)
        : 0,
      alertsVariation: avgPrev7.alerts > 0
        ? ((avgLast7.alerts - avgPrev7.alerts) / avgPrev7.alerts * 100).toFixed(1)
        : 0,
      avgUsers: avgLast7.users.toFixed(1),
      avgCombinations: avgLast7.combinations.toFixed(1),
      avgAlerts: avgLast7.alerts.toFixed(1)
    }
  }, [stats])

  // Données pour le graphique en ligne (évolution temporelle)
  const lineChartData = useMemo(() => {
    if (!stats?.timeSeries?.daily) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = stats.timeSeries.daily.map(d => d.label)
    
    return {
      labels,
      datasets: [
        {
          label: 'Utilisateurs',
          data: stats.timeSeries.daily.map(d => d.users),
          borderColor: '#0052CC',
          backgroundColor: 'rgba(0, 82, 204, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Combinaisons',
          data: stats.timeSeries.daily.map(d => d.combinations),
          borderColor: '#00C389',
          backgroundColor: 'rgba(0, 195, 137, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        },
        {
          label: 'Alertes',
          data: stats.timeSeries.daily.map(d => d.alerts),
          borderColor: '#FF006E',
          backgroundColor: 'rgba(255, 0, 110, 0.1)',
          fill: true,
          tension: 0.4,
          pointRadius: 3,
          pointHoverRadius: 5
        }
      ]
    }
  }, [stats])

  // Données pour le graphique en barres (mensuel)
  const barChartData = useMemo(() => {
    if (!stats?.monthly?.users || !stats?.monthly?.combinations) {
      return {
        labels: [],
        datasets: []
      }
    }

    const labels = stats.monthly.users.map(u => {
      const [year, month] = u._id.split('-')
      return new Date(year, parseInt(month) - 1).toLocaleDateString('fr-FR', { month: 'short', year: 'numeric' })
    })

    const combinationsMap = new Map(
      stats.monthly.combinations.map(c => [c._id, c.count])
    )

    return {
      labels,
      datasets: [
        {
          label: 'Utilisateurs',
          data: stats.monthly.users.map(u => u.count),
          backgroundColor: '#0052CC',
          borderRadius: 8,
          borderSkipped: false
        },
        {
          label: 'Combinaisons',
          data: stats.monthly.users.map(u => combinationsMap.get(u._id) || 0),
          backgroundColor: '#00C389',
          borderRadius: 8,
          borderSkipped: false
        }
      ]
    }
  }, [stats])

  // Données pour le graphique en donut (répartition par jeu)
  const doughnutChartData = useMemo(() => {
    if (!stats?.combinations?.byGame || stats.combinations.byGame.length === 0) {
      return {
        labels: [],
        datasets: []
      }
    }

    const colors = {
      euromillions: '#0052CC',
      loto: '#00C389',
      eurodreams: '#FF006E'
    }

    return {
      labels: stats.combinations.byGame.map(g => g._id.toUpperCase()),
      datasets: [
        {
          data: stats.combinations.byGame.map(g => g.count),
          backgroundColor: stats.combinations.byGame.map(g => colors[g._id] || '#6B46C1'),
          borderColor: isDark ? '#1e293b' : '#ffffff',
          borderWidth: 2,
          hoverOffset: 8
        }
      ]
    }
  }, [stats, isDark])

  // Options communes pour les graphiques
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
        cornerRadius: 8,
        displayColors: true
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
          }
        }
      }
    },
    animation: {
      duration: 1000,
      easing: 'easeInOutQuart'
    }
  }

  const lineChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Évolution sur 30 jours',
        color: textColor,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      }
    }
  }

  const barChartOptions = {
    ...commonOptions,
    plugins: {
      ...commonOptions.plugins,
      title: {
        display: true,
        text: 'Statistiques mensuelles (6 derniers mois)',
        color: textColor,
        font: {
          size: 16,
          weight: 'bold'
        },
        padding: {
          bottom: 20
        }
      }
    }
  }

  const doughnutChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'right',
        labels: {
          color: textColor,
          padding: 15,
          font: {
            size: 12,
            weight: '500'
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
      }
    },
    animation: {
      animateRotate: true,
      animateScale: true,
      duration: 1000
    }
  }

  // Vérifier si on a des données à afficher
  if (!stats) {
    return (
      <div className="dashboard-charts">
        <div className="loading-message">
          <p>Chargement des statistiques...</p>
        </div>
      </div>
    )
  }

  // Debug: vérifier les données
  console.log('📊 DashboardCharts - Stats:', stats)
  console.log('📊 Line chart data:', lineChartData)
  console.log('📊 Bar chart data:', barChartData)
  console.log('📊 Doughnut chart data:', doughnutChartData)

  return (
    <div className="dashboard-charts">
      {/* Cartes de statistiques clés */}
      <div className="stats-cards">
        <div className="stat-card">
          <div className="stat-card-icon">👥</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.users?.total || 0}</div>
            <div className="stat-card-label">Utilisateurs totaux</div>
            <div className="stat-card-detail">
              {stats.users?.active || 0} actifs • {metrics.avgUsers}/jour (7j)
            </div>
            {metrics.usersVariation !== 0 && (
              <div className={`stat-card-variation ${metrics.usersVariation > 0 ? 'positive' : 'negative'}`}>
                {metrics.usersVariation > 0 ? '↑' : '↓'} {Math.abs(metrics.usersVariation)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🎲</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.combinations?.total || 0}</div>
            <div className="stat-card-label">Combinaisons totales</div>
            <div className="stat-card-detail">
              {stats.combinations?.recent || 0} récentes (7j) • {metrics.avgCombinations}/jour
            </div>
            {metrics.combinationsVariation !== 0 && (
              <div className={`stat-card-variation ${metrics.combinationsVariation > 0 ? 'positive' : 'negative'}`}>
                {metrics.combinationsVariation > 0 ? '↑' : '↓'} {Math.abs(metrics.combinationsVariation)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">🔔</div>
          <div className="stat-card-content">
            <div className="stat-card-value">{stats.alerts?.total || 0}</div>
            <div className="stat-card-label">Alertes totales</div>
            <div className="stat-card-detail">
              {stats.alerts?.active || 0} actives • {metrics.avgAlerts}/jour (7j)
            </div>
            {metrics.alertsVariation !== 0 && (
              <div className={`stat-card-variation ${metrics.alertsVariation > 0 ? 'positive' : 'negative'}`}>
                {metrics.alertsVariation > 0 ? '↑' : '↓'} {Math.abs(metrics.alertsVariation)}%
              </div>
            )}
          </div>
        </div>

        <div className="stat-card">
          <div className="stat-card-icon">📊</div>
          <div className="stat-card-content">
            <div className="stat-card-value">
              {stats.combinations?.byGame?.reduce((sum, g) => sum + g.count, 0) || 0}
            </div>
            <div className="stat-card-label">Total toutes catégories</div>
            <div className="stat-card-detail">
              {stats.combinations?.byGame?.length || 0} types de jeux
            </div>
          </div>
        </div>
      </div>

      {/* Graphiques */}
      <div className="charts-grid">
        {/* Graphique en ligne */}
        {lineChartData.labels.length > 0 && (
          <div className="chart-container">
            <div className="chart-wrapper">
              <Line data={lineChartData} options={lineChartOptions} />
            </div>
          </div>
        )}

        {/* Graphique en barres */}
        {barChartData.labels.length > 0 && (
          <div className="chart-container">
            <div className="chart-wrapper">
              <Bar data={barChartData} options={barChartOptions} />
            </div>
          </div>
        )}

        {/* Graphique en donut */}
        {doughnutChartData.labels.length > 0 && (
          <div className="chart-container chart-doughnut">
            <div className="chart-wrapper">
              <Doughnut data={doughnutChartData} options={doughnutChartOptions} />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

