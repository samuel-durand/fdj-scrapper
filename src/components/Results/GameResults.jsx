import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import { GAMES, LOTO_TYPES, formatDrawDate, formatShortDate } from '../../games'
import { getGameData, getHistorySummary, getOlderDraws } from '../../services/lotteryService'
import { Ball, DrawBalls } from './Balls'
import NextDrawHero from './NextDrawHero'
import WinningsTable, { PayoutTable } from './WinningsTable'
import FrequencyStats from './FrequencyStats'
import TicketChecker from './TicketChecker'
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
  { id: 'ticket', label: 'Vérifier mon ticket' },
]
// Keno, Crescendo, Amigo : statistiques de fréquence simples (pas de générateur ni de graphiques par grille)
const SIMPLE_VIEWS = [
  { id: 'results', label: 'Résultats' },
  { id: 'history', label: 'Historique' },
  { id: 'calendar', label: 'Calendrier' },
  { id: 'freq', label: 'Statistiques' },
  { id: 'ticket', label: 'Vérifier mon ticket' },
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

/** Tirages groupés par année (liste déroulante). Le tirage affiché y figure toujours. */
function byYear(list, current) {
  const all = list.some((d) => d.id === current.id) ? list : [current, ...list]
  const groups = new Map()
  for (const d of all) {
    const year = d.date.slice(0, 4)
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(d)
  }
  return [...groups.entries()]
}

function DrawCard({ game, draw, draws, onSelect, allDraws, onPick, picking }) {
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
          <label className={`select ${picking ? 'is-busy' : ''}`}>
            <span className="sr-only">Choisir une date de tirage</span>
            <select value={draw.id} onChange={(e) => onPick(e.target.value)} disabled={picking}>
              {byYear(allDraws?.length ? allDraws : draws, draw).map(([year, list]) => (
                <optgroup key={year} label={year}>
                  {list.map((d) => <option key={d.id} value={d.id}>{formatShortDate(d)}</option>)}
                </optgroup>
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

function History({ game, draws, onSelect, hasMore, loadOlder, loadingOlder }) {
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
      {(limit < draws.length || hasMore) && (
        <button
          className="btn btn--ghost"
          disabled={loadingOlder}
          onClick={() => {
            if (limit + 20 > draws.length && hasMore) loadOlder()
            setLimit(limit + 20)
          }}
        >
          {loadingOlder ? 'Chargement…' : 'Voir plus de tirages'}
        </button>
      )}
    </div>
  )
}

/** Période des statistiques : derniers tirages chargés ou tout l'historique (archives FDJ comprises). */
function ScopeSwitch({ scope, onChange, recentCount, history }) {
  const first = history?.draws?.[history.draws.length - 1]
  const since = first ? new Date(`${first.date}T12:00:00`).getFullYear() : null
  return (
    <div className="scope">
      <div className="pills" role="tablist" aria-label="Période analysée">
        <button role="tab" aria-selected={scope === 'recent'} className={`pill ${scope === 'recent' ? 'is-active' : ''}`}
          onClick={() => onChange('recent')}>
          {recentCount} derniers tirages
        </button>
        <button role="tab" aria-selected={scope === 'all'} className={`pill ${scope === 'all' ? 'is-active' : ''}`}
          onClick={() => onChange('all')}>
          Tout l'historique{history?.draws ? ` (${history.draws.length.toLocaleString('fr-FR')} tirages depuis ${since})` : ''}
        </button>
      </div>
      {scope === 'all' && history?.loading && <span className="muted">Chargement de l'historique…</span>}
      {scope === 'all' && history?.error && <span className="muted">{history.error}</span>}
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
  const [hasMore, setHasMore] = useState(false)
  const [loadingOlder, setLoadingOlder] = useState(false)
  const [calendarMonth, setCalendarMonth] = useState(null)
  const [statsScope, setStatsScope] = useState('all') // 'recent' | 'all'
  const [fullHistory, setFullHistory] = useState({ game: null, draws: null, loading: false, error: null })

  useEffect(() => {
    let alive = true
    setState((s) => ({ ...s, loading: true, error: null }))
    setSelectedId(null)
    setView('results')
    setHasMore(false)
    setCalendarMonth(null)
    setStatsScope('all')
    getGameData(game)
      .then(({ draws, nextDraw }) => {
        if (!alive) return
        setState({ loading: false, error: null, draws, nextDraw })
        setHasMore(draws.length >= 200) // l'API renvoie 200 tirages par page
      })
      .catch(() => alive && setState({ loading: false, error: 'Impossible de charger les résultats.', draws: [], nextDraw: null }))
    return () => { alive = false }
  }, [game])

  const { draws, nextDraw, loading, error } = state
  const draw = useMemo(
    () => draws.find((d) => d.id === selectedId) || draws[0],
    [draws, selectedId]
  )

  // Tirages plus anciens (historique, calendrier) : page suivante de 200
  const olderRef = useRef(false)
  const loadOlder = useCallback(async () => {
    const oldest = state.draws[state.draws.length - 1]
    if (olderRef.current || !oldest?.drawTime) return
    olderRef.current = true
    setLoadingOlder(true)
    try {
      const older = await getOlderDraws(game, oldest.drawTime)
      setState((s) => {
        const known = new Set(s.draws.map((d) => d.id))
        return { ...s, draws: [...s.draws, ...older.filter((d) => !known.has(d.id))] }
      })
      setHasMore(older.length >= 200)
    } catch {
      setHasMore(false)
    } finally {
      olderRef.current = false
      setLoadingOlder(false)
    }
  }, [game, state.draws])

  // Calendrier : on charge jusqu'à couvrir le mois affiché
  useEffect(() => {
    const oldest = state.draws[state.draws.length - 1]
    if (view !== 'calendar' || !calendarMonth || !hasMore || loadingOlder || !oldest) return
    const monthStart = `${calendarMonth.getFullYear()}-${String(calendarMonth.getMonth() + 1).padStart(2, '0')}-01`
    if (oldest.date > monthStart) loadOlder()
  }, [view, calendarMonth, hasMore, loadingOlder, state.draws, loadOlder])

  // Statistiques sur tout l'historique : numéros seulement, téléchargés une fois par jeu
  const historyGame = useRef(null) // jeu dont l'historique est chargé ou en cours de chargement
  useEffect(() => {
    if (!(statsScope === 'all' || view === 'results' || view === 'ticket') || loading || historyGame.current === game) return
    historyGame.current = game
    setFullHistory({ game, draws: null, loading: true, error: null })
    getHistorySummary(game)
      .then((all) => historyGame.current === game && setFullHistory({ game, draws: all, loading: false, error: null }))
      .catch(() => {
        if (historyGame.current !== game) return
        historyGame.current = null // nouvel essai au prochain clic
        setFullHistory({ game, draws: null, loading: false, error: 'Historique indisponible.' })
      })
  }, [statsScope, view, loading, game])

  const statsDraws = statsScope === 'all' && fullHistory.game === game && fullHistory.draws ? fullHistory.draws : null

  const [picking, setPicking] = useState(false)
  const pick = async (id) => {
    if (state.draws.some((d) => d.id === id)) return select(id)
    setPicking(true)
    let list = state.draws
    let more = true
    try {
      while (more && !list.some((d) => d.id === id)) {
        const page = await getOlderDraws(game, list[list.length - 1].drawTime, 500)
        const known = new Set(list.map((d) => d.id))
        list = [...list, ...page.filter((d) => !known.has(d.id))]
        more = page.length >= 500
      }
      setState((s) => ({ ...s, draws: list }))
      setHasMore(more)
      if (list.some((d) => d.id === id)) select(id)
    } catch {
      /* réseau : on reste sur le tirage affiché */
    } finally {
      setPicking(false)
    }
  }

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
            {view === 'results' && (
              <DrawCard game={game} draw={draw} draws={draws} onSelect={select} onPick={pick} picking={picking}
                allDraws={fullHistory.game === game ? fullHistory.draws : null} />
            )}
            {view === 'history' && (
              <History game={game} draws={draws} onSelect={select}
                hasMore={hasMore} loadOlder={loadOlder} loadingOlder={loadingOlder} />
            )}
            {view === 'calendar' && (
              <div className="card">
                <Calendar gameType={game} draws={draws} onDateSelect={(d) => select(d.id)} onMonthChange={setCalendarMonth} />
                {loadingOlder && <p className="muted calendar-loading">Chargement des tirages plus anciens…</p>}
              </div>
            )}
            {['stats', 'freq', 'charts'].includes(view) && (
              <ScopeSwitch
                scope={statsScope}
                onChange={setStatsScope}
                recentCount={draws.length}
                history={fullHistory.game === game ? fullHistory : null}
              />
            )}
            {view === 'stats' && <div className="card"><Statistics draws={statsDraws || draws} gameType={game} /></div>}
            {view === 'freq' && <div className="card"><FrequencyStats game={game} draws={statsDraws || draws} /></div>}
            {view === 'charts' && <div className="card"><GameStatistics gameType={game} draws={statsScope === 'all' ? statsDraws : draws} /></div>}
            {view === 'ticket' && (
              <div className="card">
                <TicketChecker game={game} draws={draws} allDraws={fullHistory.game === game ? fullHistory.draws : null} />
              </div>
            )}
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
