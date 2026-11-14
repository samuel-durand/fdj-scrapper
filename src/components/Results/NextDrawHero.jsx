import { useEffect, useRef, useState } from 'react'
import { GAMES, LOTO_TYPES, capitalize, formatTime } from '../../games'
import AnimatedAmount from './AnimatedAmount'
import useTilt from '../../hooks/useTilt'

function useNow(intervalMs = 30000) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])
  return now
}

function formatCountdown(ms) {
  const totalMin = Math.max(0, Math.floor(ms / 60000))
  const d = Math.floor(totalMin / 1440)
  const h = Math.floor((totalMin % 1440) / 60)
  const m = totalMin % 60
  if (d > 0) return `${d} j ${h} h`
  if (h > 0) return `${h} h ${String(m).padStart(2, '0')} min`
  return `${m} min`
}

// Boules décoratives qui flottent dans le bandeau
const BUBBLES = [
  { size: 120, x: '62%', y: '18%', dur: 14, delay: 0 },
  { size: 54, x: '48%', y: '70%', dur: 11, delay: -4 },
  { size: 26, x: '40%', y: '22%', dur: 9, delay: -2 },
  { size: 80, x: '4%', y: '62%', dur: 16, delay: -7 },
  { size: 18, x: '90%', y: '80%', dur: 8, delay: -1 },
]

function NextDrawHero({ game, nextDraw }) {
  const cfg = GAMES[game]
  const now = useNow()
  // Amigo n'annonce pas d'heure de fin des prises de jeu : on prend l'heure du tirage
  const closesIso = nextDraw?.wageringEndsAt || (nextDraw?.time ? nextDraw.drawTime : null)
  const closesAt = closesIso ? new Date(closesIso).getTime() : null
  const remaining = closesAt ? closesAt - now : 0
  const isOpen = closesAt && remaining > 0
  const urgent = isOpen && remaining < 60 * 60 * 1000
  const special = nextDraw?.lotoType && LOTO_TYPES[nextDraw.lotoType]
  const panelRef = useRef(null)
  const amountRef = useRef(null)
  useTilt(panelRef)
  // Survol ou appui sur le jackpot : pluie de pièces d'or (scène 3D, si elle tourne)
  const rain = () => window.dispatchEvent(new CustomEvent('lottery:jackpot', { detail: { el: amountRef.current } }))
  const drawPassed = nextDraw?.drawTime ? new Date(nextDraw.drawTime).getTime() < now : false

  return (
    <section className={`hero hero--${game}`}>
      <div className="hero__bubbles" aria-hidden="true">
        {BUBBLES.map((b, i) => (
          <span
            key={i}
            className="hero__bubble"
            style={{
              width: b.size, height: b.size, left: b.x, top: b.y,
              animationDuration: `${b.dur}s`, animationDelay: `${b.delay}s`,
            }}
          />
        ))}
      </div>

      <div className="hero__inner">
        <div className="hero__title reveal">
          <p className="hero__eyebrow">Résultats</p>
          <h1>{cfg.fullName}</h1>
          <p className="hero__tagline">{cfg.tagline}</p>
        </div>

        {nextDraw?.jackpot && (
          <div className="next-draw reveal tilt" style={{ '--d': '120ms' }} ref={panelRef}
            onPointerEnter={(e) => e.pointerType !== 'touch' && rain()} onClick={rain}>
            <p className="next-draw__label">
              {special ? <span className="badge badge--special badge--pulse">{special}</span> : null}
              Prochain tirage · {capitalize(nextDraw.formattedDate || '')}
              {nextDraw.time && !drawPassed && ` à ${formatTime(nextDraw.time)}`}
            </p>
            {nextDraw.prefix && <p className="next-draw__prefix">{nextDraw.prefix}</p>}
            <p className="next-draw__amount" ref={amountRef}>
              <AnimatedAmount text={nextDraw.jackpot} />
            </p>
            {nextDraw.suffix && <p className="next-draw__suffix">{nextDraw.suffix}</p>}
            {isOpen && (
              <p className={`next-draw__countdown ${urgent ? 'is-urgent' : ''}`}>
                <span className="live-dot" aria-hidden="true" />
                {nextDraw.wageringEndsAt ? 'Fin des prises de jeu dans' : 'Tirage dans'} <strong>{formatCountdown(remaining)}</strong>
              </p>
            )}
          </div>
        )}
      </div>
    </section>
  )
}

export default NextDrawHero
