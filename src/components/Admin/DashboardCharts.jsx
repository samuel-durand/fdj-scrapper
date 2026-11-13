import { useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js'
import { Line, Bar, Doughnut } from 'react-chartjs-2'
import useTheme from '../../hooks/useTheme'
import { GAMES } from '../../games'
import './DashboardCharts.css'

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, BarElement, ArcElement, Tooltip, Legend, Filler)

// Palette alignée sur le site, déclinée pour le thème sombre
const PALETTE = {
  light: {
    text: '#1b1d3a', muted: '#5c6184', grid: 'rgba(27, 29, 58, .08)', surface: '#ffffff',
    users: '#282d87', combinations: '#0a8a5c', alerts: '#e6007e',
    euromillions: '#1f2b8f', loto: '#0067c8', eurodreams: '#8a3fc0',
  },
  dark: {
    text: '#eceefa', muted: '#a4a9c9', grid: 'rgba(255, 255, 255, .08)', surface: '#161936',
    users: '#8f96ff', combinations: '#3ccf96', alerts: '#ff4fae',
    euromillions: '#6f80ff', loto: '#3d9df5', eurodreams: '#b47ae6',
  },
}

const alpha = (hex, a) => hex + Math.round(a * 255).toString(16).padStart(2, '0')
const sum = (list, key) => list.reduce((s, d) => s + (d[key] || 0), 0)

function variation(daily, key) {
  const last = sum(daily.slice(-7), key)
  const prev = sum(daily.slice(-14, -7), key)
  if (!prev) return null
  return Math.round(((last - prev) / prev) * 100)
}

function Kpi({ label, value, detail, trend, color }) {
  return (
    <div className="adm-kpi" style={{ '--kpi': color }}>
      <span className="adm-kpi__label">{label}</span>
      <span className="adm-kpi__value">{value.toLocaleString('fr-FR')}</span>
      <span className="adm-kpi__detail">
        {detail}
        {trend != null && trend !== 0 && (
          <span className={`adm-kpi__trend ${trend > 0 ? 'is-up' : 'is-down'}`}
            title="Variation sur 7 jours par rapport aux 7 jours précédents">
            {trend > 0 ? '▲' : '▼'} {Math.abs(trend)} %
          </span>
        )}
      </span>
    </div>
  )
}

function ChartCard({ title, subtitle, children, wide }) {
  return (
    <figure className={`adm-chart ${wide ? 'adm-chart--wide' : ''}`}>
      <figcaption>
        <strong>{title}</strong>
        {subtitle && <span>{subtitle}</span>}
      </figcaption>
      <div className="adm-chart__canvas">{children}</div>
    </figure>
  )
}

export default function DashboardCharts({ stats }) {
  const theme = useTheme()
  const c = PALETTE[theme]
  const daily = stats.timeSeries?.daily || []

  const tooltip = {
    backgroundColor: c.surface,
    titleColor: c.text,
    bodyColor: c.text,
    borderColor: c.grid,
    borderWidth: 1,
    padding: 10,
    cornerRadius: 8,
    boxPadding: 4,
    usePointStyle: true,
  }

  const legend = {
    position: 'bottom',
    labels: { color: c.muted, usePointStyle: true, pointStyle: 'circle', boxWidth: 8, padding: 16, font: { weight: '600' } },
  }

  const axes = {
    x: { grid: { display: false }, border: { display: false }, ticks: { color: c.muted, maxRotation: 0, autoSkipPadding: 12 } },
    y: { beginAtZero: true, grid: { color: c.grid }, border: { display: false }, ticks: { color: c.muted, precision: 0 } },
  }

  const baseOptions = {
    responsive: true,
    maintainAspectRatio: false,
    interaction: { mode: 'index', intersect: false },
    plugins: { legend, tooltip },
    scales: axes,
  }

  const lineData = useMemo(() => ({
    labels: daily.map((d) => d.label),
    datasets: [
      ['users', 'Inscriptions'],
      ['combinations', 'Combinaisons'],
      ['alerts', 'Alertes'],
    ].map(([key, label]) => ({
      label,
      data: daily.map((d) => d[key]),
      borderColor: c[key],
      backgroundColor: alpha(c[key], .12),
      fill: key === 'users',
      tension: .35,
      borderWidth: 2,
      pointRadius: 0,
      pointHoverRadius: 4,
    })),
  }), [daily, c])

  const barData = useMemo(() => {
    const months = [...new Set([
      ...(stats.monthly?.users || []).map((m) => m._id),
      ...(stats.monthly?.combinations || []).map((m) => m._id),
    ])].sort()
    const map = (list) => new Map((list || []).map((m) => [m._id, m.count]))
    const users = map(stats.monthly?.users)
    const combos = map(stats.monthly?.combinations)
    return {
      labels: months.map((id) => {
        const [y, m] = id.split('-')
        return new Date(y, m - 1).toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' })
      }),
      datasets: [
        { label: 'Inscriptions', data: months.map((m) => users.get(m) || 0), backgroundColor: c.users },
        { label: 'Combinaisons', data: months.map((m) => combos.get(m) || 0), backgroundColor: c.combinations },
      ].map((d) => ({ ...d, borderRadius: 6, borderSkipped: false, maxBarThickness: 28 })),
    }
  }, [stats, c])

  const byGame = stats.combinations?.byGame || []
  const doughnutData = useMemo(() => ({
    labels: byGame.map((g) => GAMES[g._id]?.name || g._id),
    datasets: [{
      data: byGame.map((g) => g.count),
      backgroundColor: byGame.map((g) => c[g._id] || c.users),
      borderColor: c.surface,
      borderWidth: 3,
      hoverOffset: 6,
    }],
  }), [byGame, c])

  const u = stats.users || {}
  const co = stats.combinations || {}
  const al = stats.alerts || {}

  return (
    <div className="adm-dashboard">
      <div className="adm-kpis">
        <Kpi label="Utilisateurs" value={u.total || 0} color={c.users}
          detail={`${u.active || 0} actifs · +${u.recent || 0} cette semaine`} trend={variation(daily, 'users')} />
        <Kpi label="Combinaisons" value={co.total || 0} color={c.combinations}
          detail={`+${co.recent || 0} cette semaine`} trend={variation(daily, 'combinations')} />
        <Kpi label="Alertes" value={al.total || 0} color={c.alerts}
          detail={`${al.active || 0} actives · ${al.inactive || 0} en pause`} trend={variation(daily, 'alerts')} />
        <Kpi label="Comptes désactivés" value={u.inactive || 0} color={c.muted}
          detail={u.total ? `${Math.round(((u.inactive || 0) / u.total) * 100)} % des comptes` : 'Aucun compte'} />
      </div>

      <div className="adm-charts">
        <ChartCard title="Activité" subtitle="30 derniers jours" wide>
          <Line data={lineData} options={baseOptions} />
        </ChartCard>

        <ChartCard title="Par mois" subtitle="6 derniers mois">
          {barData.labels.length
            ? <Bar data={barData} options={baseOptions} />
            : <p className="adm-chart__empty">Pas encore de données.</p>}
        </ChartCard>

        <ChartCard title="Combinaisons par jeu">
          {byGame.length
            ? <Doughnut data={doughnutData} options={{
                responsive: true, maintainAspectRatio: false, cutout: '68%',
                plugins: { legend, tooltip },
              }} />
            : <p className="adm-chart__empty">Aucune combinaison enregistrée.</p>}
        </ChartCard>
      </div>
    </div>
  )
}
