import { useEffect, useState } from 'react'

const NUMBER_RE = /\d[\d\s  ]*(?:,\d+)?/

const prefersReducedMotion = () =>
  typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches

const format = (value, decimals) =>
  value
    .toFixed(decimals)
    .replace('.', ',')
    .replace(/\B(?=(\d{3})+(?!\d))/g, ' ')

/**
 * Affiche un montant ("17 millions €", "50 000 € par mois…") en faisant
 * défiler le premier nombre de 0 jusqu'à sa valeur.
 */
function AnimatedAmount({ text, duration = 1400 }) {
  const match = text?.match(NUMBER_RE)
  const raw = match?.[0].trim() ?? ''
  const decimals = raw.includes(',') ? raw.split(',')[1].length : 0
  const target = raw ? parseFloat(raw.replace(/[\s  ]/g, '').replace(',', '.')) : 0
  const [value, setValue] = useState(prefersReducedMotion() ? target : 0)

  useEffect(() => {
    if (!raw || prefersReducedMotion()) {
      setValue(target)
      return
    }
    let frame
    const start = performance.now()
    const tick = (now) => {
      const t = Math.min(1, (now - start) / duration)
      const eased = 1 - Math.pow(1 - t, 4) // easeOutQuart
      setValue(target * eased)
      if (t < 1) frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [text, target, raw, duration])

  if (!raw) return <>{text}</>
  const shown = value >= target ? raw : format(value, decimals)
  const before = text.slice(0, match.index)
  const after = text.slice(match.index + match[0].length)
  // espace capturé après le nombre (ex. "17 millions") : on le conserve
  const trailing = match[0].slice(raw.length)
  return (
    <span aria-label={text}>
      <span aria-hidden="true">
        {before}
        <span className="tabular">{shown}</span>
        {trailing}
        {after}
      </span>
    </span>
  )
}

export default AnimatedAmount
