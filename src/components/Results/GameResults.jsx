import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GAMES, LOTO_TYPES, formatDrawDate, formatShortDate } from '../../games'
import { getGameData } from '../../services/lotteryService'
import { Ball, DrawBalls } from './Balls'
import NextDrawHero from './NextDrawHero'
import WinningsTable, { PayoutTable } from './WinningsTable'
import FrequencyStats from './FrequencyStats'
import Calendar from '../Calendar'
import Statistics from '../Statistics'
import GameStatistics from '../GameStatistics'
import './Results.css'

const VIEWS = [
  { id: 'results', label: 'Résultats' },
  { id: 'history', label: 'Historique' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'stats', label: 'Statistiques' },
  { id: 'charts', label: 'Graphiques' },
]
// Keno, Crescendo, Amigo : statistiques de fréquence simples (pas de générateur ni de graphiques par grille)
const SIMPLE_VIEWS = [
  { id: 'results', label: 'Résultats' },
  { id: 'history', label: 'Historique' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'freq', label: 'Statistiques' },
]
const viewsFor = (game) => (GAMES[game].simple ? SIMPLE_VIEWS : VIEWS)

function Extras({ game, draw }) {
  const items = []
  if (draw.multiplier) items.push(['Multiplicateur', `×${draw.multiplier}`])
  if (draw.myMillionCode && draw.myMillionCode !== 'Non disponible') {
    items.push(['Code My Million', draw.myMillionCode])
  }
  if (draw.jokerPlus) items.push(['Numéro Joker+', draw.jokerPlus])
  if (draw.jackpot && draw.jackpot !== 'Non disponible') {
    items.push([game === 'eurodreams' ? 'Rente en jeu' : 'Jackpot en jeu', draw.jackpot])
  }
  if (items.length === 0) return null
  return (
    <dl className="extras">
      {items.map(([label, value]) => (
        <div className="extras__item" key={label}>
          <dt>{label}</dt>
          <dd>{value}</dd>
        </div>
      ))}
    </dl>
  )
}

function DrawCard({ game, draw, draws, onSelect }) {
  const cfg = GAMES[game]
  const idx = draws.findIndex((d) => d.id === draw.id)
  const older = draws[idx + 1]
  const newer = draws[idx - 1]
  const special = draw.lotoType && LOTO_TYPES[draw.lotoType]
  const comp = GAMES[game].complementary

  // Si la scène 3D tourne, les boules du tirage partent du fond et viennent se poser ici.
  const ballsRef = useRef(null)
  const fromScene = useMemo(
    () => document.documentElement.classList.contains('has-3d'),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [draw.id]
  )
  useEffect(() => {
    if (!fromScene || !ballsRef.current) return
    window.dispatchEvent(new CustomEvent('lottery:draw', { detail: { game, container: ballsRef.current } }))
  }, [draw.id, game, fromScene])

  return (
    <article className="card result-card">
      <header className="result-card__head">
        <div>
          <h2 className="result-card__title">Résultats du tirage</h2>
          <p className="result-card__date">
            {special && <span className="badge badge--special">{special}</span>}
            {formatDrawDate(draw)}
            {draw.drawNumber && <span className="muted"> · n° {draw.drawNumber}</span>}
          </p>
        </div>
        <div className="date-nav">
          <button className="icon-btn" disabled={!older} onClick={() => onSelect(older.id)} aria-label="Tirage précédent">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
          <label className="select">
            <span className="sr-only">Choisir une date de tirage</span>
            <select value={draw.id} onChange={(e) => onSelect(e.target.value)}>
              {draws.map((d) => (
                <option key={d.id} value={d.id}>{formatShortDate(d)}</option>
              ))}
            </select>
          </label>
          <button className="icon-btn" disabled={!newer} onClick={() => onSelect(newer.id)} aria-label="Tirage suivant">
            <svg width="18" height="18" viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" /></svg>
          </button>
        </div>
      </header>

      <div
        className={`result-card__balls ${fromScene ? 'from-scene' : ''}`}
        key={`balls-${draw.id}`}
        ref={ballsRef}
      >
        <DrawBalls game={game} draw={draw} size={(draw.numbers?.length || 0) > 8 ? 'md' : 'lg'} animated />
        <p className="legend">
          <span><i className="dot dot--main" /> {cfg.mainLabel || 'Numéros'}</span>
          {comp && <span><i className={`dot dot--${comp.variant}`} /> {comp.label}</span>}
        </p>
      </div>

      {draw.secondDraw?.length > 0 && (
        <div className="second-draw">
          <h3>2nd tirage</h3>
          <div className="balls balls--md balls--anim" key={draw.id}>
            {draw.secondDraw.map((n, i) => <Ball key={i} value={n} variant="outline" index={i + 8} />)}
          </div>
        </div>
      )}

      <Extras game={game} draw={draw} />

      {draw.codesGagnants?.length > 0 && (
        <div className="codes">
          <h3>Codes gagnants tirés au sort</h3>
          <ul>
            {draw.codesGagnants.map((c, i) => (
              <li key={`${draw.id}-${c}`} className="stagger" style={{ '--i': i }}>{c}</li>
            ))}
          </ul>
        </div>
      )}

      <WinningsTable key={`gains-${draw.id}`} draw={draw} />
      {/* Barème (Keno, Amigo) : l'API ne l'envoie qu'avec le tirage le plus récent */}
      <PayoutTable key={`bareme-${game}`} payouts={draw.payouts || draws[0]?.payouts} title="Barème des gains" />
    </article>
  )
}

function History({ game, draws, onSelect }) {
  const [limit, setLimit] = useState(20)
  return (
    <div className="card history">
      <h2 className="section-title">Historique des tirages</h2>
      <ul className="history__list">
        {draws.slice(0, limit).map((d, i) => (
          <li key={d.id} className="stagger" style={{ '--i': i % 20 }}>
            <button className="history__row" onClick={() => onSelect(d.id)}>
              <span className="history__date">
                {formatDrawDate(d)}
                {d.lotoType && LOTO_TYPES[d.lotoType] && <span className="badge badge--special">{LOTO_TYPES[d.lotoType]}</span>}
              </span>
              <DrawBalls game={game} draw={d} size="sm" />
              <span className="history__jackpot">{d.jackpot !== 'Non disponible' ? d.jackpot : ''}</span>
            </button>
          </li>
        ))}
      </ul>
      {limit < draws.length && (
        <button className="btn btn--ghost" onClick={() => setLimit(limit + 20)}>Voir plus de tirages</button>
      )}
    </div>
  )
}

/** Sous-navigation avec un indicateur qui glisse sous l'onglet actif. */
function SubNav({ game, view, onChange }) {
  const navRef = useRef(null)
  const [indicator, setIndicator] = useState(null)

  useLayoutEffect(() => {
    const update = () => {
      const el = navRef.current?.querySelector('.is-active')
      if (el) setIndicator({ left: el.offsetLeft, width: el.offsetWidth })
    }
    update()
    document.fonts?.ready.then(update)
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [view, game])

  return (
    <nav className="subnav" aria-label="Affichage" ref={navRef}>
      {indicator && (
        <span
          className="subnav__indicator"
          style={{ transform: `translateX(${indicator.left}px)`, width: indicator.width }}
          aria-hidden="true"
        />
      )}
      {viewsFor(game).map((v) => (
        <button
          key={v.id}
          className={`subnav__item ${view === v.id ? 'is-active' : ''}`}
          aria-current={view === v.id ? 'page' : undefined}
          onClick={() => onChange(v.id)}
        >
          {v.label}
        </button>
      ))}
    </nav>
  )
}

function GameResults({ game }) {
  const [state, setState] = useState({ loading: true, error: null, draws: [], nextDraw: null })
  const [selectedId, setSelectedId] = useState(null)
  const [view, setView] = useState('results')

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    setSelectedId(null)
    setView('results')
    getGameData(game)
      .then(({ draws, nextDraw }) => alive && setState({ loading: false, error: null, draws, nextDraw }))
      .catch(() => alive && setState({ loading: false, error: 'Impossible de charger les résultats.', draws: [], nextDraw: null }))
    return () => { alive = false }
  }, [game])

  const { draws, nextDraw, loading, error } = state
  const draw = useMemo(
    () => draws.find((d) => d.id === selectedId) || draws[0],
    [draws, selectedId]
  )

  const select = (id) => {
    setSelectedId(id)
    setView('results')
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  return (
    <div className={`game game--${game}`}>
      <NextDrawHero key={`${game}-${nextDraw?.date || ''}`} game={game} nextDraw={nextDraw} />

      <div className="container">
        <SubNav game={game} view={view} onChange={setView} />

        {loading && (
          <div className="card state"><div className="spinner" /> Chargement des résultats…</div>
        )}
        {error && (
          <div className="card state state--error">
            {error} <button className="btn" onClick={() => window.location.reload()}>Réessayer</button>
          </div>
        )}
        {!loading && !error && !draw && <div className="card state">Aucun tirage disponible pour le moment.</div>}

        {!loading && !error && draw && (
          <div className="view-anim" key={`${game}-${view}`}>
            {view === 'results' && <DrawCard game={game} draw={draw} draws={draws} onSelect={select} />}
            {view === 'history' && <History game={game} draws={draws} onSelect={select} />}
            {view === 'calendar' && (
              <div className="card"><Calendar gameType={game} draws={draws} onDateSelect={(d) => select(d.id)} /></div>
            )}
            {view === 'stats' && <div className="card"><Statistics draws={draws} gameType={game} /></div>}
            {view === 'freq' && <div className="card"><FrequencyStats game={game} draws={draws} /></div>}
            {view === 'charts' && <div className="card"><GameStatistics gameType={game} /></div>}
          </div>
        )}

        <aside className="card rules">
          <h2 className="section-title">Comment jouer {game === 'loto' ? 'au' : 'à'} {GAMES[game].name} ?</h2>
          <p>{GAMES[game].rules}</p>
        </aside>
      </div>
    </div>
  )
}

export default GameResults
