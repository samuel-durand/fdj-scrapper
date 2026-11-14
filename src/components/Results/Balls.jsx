import { GAMES, complementaryValues } from '../../games'

export function Ball({ value, variant = 'main', size = 'md', index = 0, className = '' }) {
  return (
    <span
      className={`ball ball--${variant} ball--${size} ${className}`}
      style={{ '--i': index }}
      aria-label={String(value)}
    >
      <span className="ball__value">{value}</span>
    </span>
  )
}

/**
 * Rangée de boules d'un tirage : numéros + complémentaires (étoiles, chance, dream).
 * `animated` : les boules tombent une à une, comme lors d'un vrai tirage.
 */
export function DrawBalls({ game, draw, size = 'md', animated = false }) {
  const comp = GAMES[game].complementary
  const numbers = draw.numbers || []
  const extras = complementaryValues(game, draw)
  return (
    <div className={`balls balls--${size} ${animated ? 'balls--anim' : ''}`}>
      {numbers.map((n, i) => (
        <Ball key={`n${i}`} value={n} size={size} index={i} />
      ))}
      {extras.length > 0 && <span className="balls__sep" aria-hidden="true" />}
      {extras.map((n, i) => (
        // petite pause avant les complémentaires, pour le suspense
        <Ball key={`c${i}`} value={n} variant={comp.variant} size={size} index={numbers.length + i + 1.5} />
      ))}
    </div>
  )
}
