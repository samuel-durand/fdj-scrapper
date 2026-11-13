import { useMemo } from 'react'
import { GAMES, complementaryValues } from '../../games'
import { Ball } from './Balls'

/** Fréquence de sortie de chaque valeur sur un ensemble de tirages. */
function count(draws, pick) {
  const map = new Map()
  for (const d of draws) for (const v of pick(d)) map.set(v, (map.get(v) || 0) + 1)
  return [...map.entries()].map(([value, n]) => ({ value, n }))
}

function Ranking({ title, items, variant, total }) {
  const max = Math.max(1, ...items.map((i) => i.n))
  return (
    <div className="freq__block">
      <h3>{title}</h3>
      <ol className="freq__list">
        {items.map((it, i) => (
          <li key={it.value} className="stagger" style={{ '--i': i }}>
            <Ball value={it.value} variant={variant} size="sm" />
            <span className="freq__bar"><span style={{ width: `${(it.n / max) * 100}%` }} /></span>
            <span className="freq__count">{it.n}<small> / {total}</small></span>
          </li>
        ))}
      </ol>
    </div>
  )
}

/**
 * Statistiques simples pour Keno, Crescendo et Amigo : numéros les plus et les moins tirés
 * sur les tirages disponibles (et lettres / numéros jaunes).
 */
export default function FrequencyStats({ game, draws }) {
  const cfg = GAMES[game]
  const comp = cfg.complementary

  const { hot, cold, compHot } = useMemo(() => {
    const main = count(draws, (d) => d.numbers || []).sort((a, b) => b.n - a.n || a.value - b.value)
    const extra = comp
      ? count(draws, (d) => complementaryValues(game, d)).sort((a, b) => b.n - a.n || String(a.value).localeCompare(String(b.value)))
      : []
    return {
      hot: main.slice(0, 10),
      cold: main.slice(-10).reverse(),
      compHot: comp?.variant === 'letter' ? extra : extra.slice(0, 10),
    }
  }, [draws, game, comp])

  if (draws.length === 0) return <p className="muted">Pas encore de tirages à analyser.</p>

  const first = draws[draws.length - 1]
  const period = cfg.intraday ? `${draws.length} tirages` : `${draws.length} tirages depuis le ${new Date(`${first.date}T12:00:00`).toLocaleDateString('fr-FR')}`

  return (
    <div className="freq">
      <h2 className="section-title">Fréquences de sortie</h2>
      <p className="muted freq__period">Calculées sur les {period} disponibles.</p>
      <div className="freq__grid">
        <Ranking title="Les plus tirés" items={hot} total={draws.length} />
        <Ranking title="Les moins tirés" items={cold} total={draws.length} />
        {comp && compHot.length > 0 && (
          <Ranking title={comp.variant === 'letter' ? 'Lettres' : `${comp.label} les plus tirés`}
            items={compHot} variant={comp.variant} total={draws.length} />
        )}
      </div>
    </div>
  )
}
