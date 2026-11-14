import { useEffect, useMemo, useRef, useState } from 'react'
import { GAMES, formatDrawDate, formatShortDate } from '../../games'
import { getDraw } from '../../services/lotteryService'
import { TICKET_RULES, evaluate, historyCheck, isComplete, pickRange, randomTicket } from '../../ticket'
import { Ball } from './Balls'

const EMPTY = { main: [], comp: [] }

/** « 15 000 € » -> 15000 (null si le montant n'est pas un simple montant en euros). */
function euros(text) {
  if (!text || !/^[\d\s ,.]+€$/.test(text.replace(/ /g, ' '))) return null
  return parseFloat(text.replace(/[^\d,]/g, '').replace(',', '.'))
}
const money = (n) => `${n.toLocaleString('fr-FR', { minimumFractionDigits: n % 1 ? 2 : 0, maximumFractionDigits: 2 })} €`

function NumberGrid({ values, selected, max, onToggle, variant, label }) {
  const full = selected.length >= max
  return (
    <div className={`ticket-grid ticket-grid--${variant}`} role="group" aria-label={label}>
      {values.map((v) => {
        const on = selected.includes(v)
        return (
          <button
            key={v}
            type="button"
            className={`ticket-grid__cell ${on ? 'is-on' : ''}`}
            aria-pressed={on}
            disabled={!on && full}
            onClick={() => onToggle(v)}
          >
            {v}
          </button>
        )
      })}
    </div>
  )
}

function byYear(list) {
  const groups = new Map()
  for (const d of list) {
    const year = d.date.slice(0, 4)
    if (!groups.has(year)) groups.set(year, [])
    groups.get(year).push(d)
  }
  return [...groups.entries()]
}

/**
 * Vérificateur de ticket : l'utilisateur saisit sa grille, choisit un tirage et voit s'il a gagné
 * (rang et gain réels de ce tirage), puis peut tester sa grille sur tout l'historique.
 */
export default function TicketChecker({ game, draws, allDraws, onNeedHistory }) {
  const rules = TICKET_RULES[game]
  const [minPick, maxPick] = pickRange(rules.main)
  const [ticket, setTicket] = useState(EMPTY)
  const [drawId, setDrawId] = useState(draws[0]?.id)
  const [fetched, setFetched] = useState({}) // id -> tirage complet récupéré à la demande
  const [loadingDraw, setLoadingDraw] = useState(false)
  const [stake, setStake] = useState(0)
  const [withMultiplier, setWithMultiplier] = useState(false)
  const [history, setHistory] = useState(null)
  const verdictRef = useRef(null)

  // Changement de jeu : on repart d'une grille vide sur le dernier tirage
  useEffect(() => {
    setTicket(EMPTY)
    setDrawId(draws[0]?.id)
    setHistory(null)
    setStake(0)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [game])

  // Liste de tous les tirages (version allégée) pour le choix de la date
  useEffect(() => { onNeedHistory?.() }, [onNeedHistory])

  const payouts = draws.find((d) => d.payouts)?.payouts || null
  const draw = draws.find((d) => d.id === drawId) || fetched[drawId] || null

  // Tirage choisi hors des tirages chargés : on le récupère
  useEffect(() => {
    if (!drawId || draw) return
    const entry = allDraws?.find((d) => d.id === drawId)
    if (!entry) return
    let alive = true
    setLoadingDraw(true)
    getDraw(game, entry.date, entry.time)
      .then((d) => alive && d && setFetched((f) => ({ ...f, [drawId]: d })))
      .catch(() => {})
      .finally(() => alive && setLoadingDraw(false))
    return () => { alive = false }
  }, [drawId, draw, allDraws, game])

  const complete = isComplete(game, ticket)
  const result = useMemo(
    () => (complete && draw ? evaluate(game, ticket, draw, { payouts, stake }) : null),
    [complete, draw, game, ticket, payouts, stake],
  )

  // Ticket gagnant : pluie de pièces d'or (scène 3D)
  useEffect(() => {
    if (!result?.won && !result?.second?.won) return
    const t = setTimeout(() => {
      window.dispatchEvent(new CustomEvent('lottery:jackpot', { detail: { el: verdictRef.current } }))
    }, 250)
    return () => clearTimeout(t)
  }, [result?.won, result?.second?.won, drawId])

  useEffect(() => { setHistory(null) }, [ticket, game, stake])

  const toggle = (part, value, limit) => {
    setTicket((t) => {
      const list = t[part]
      if (list.includes(value)) return { ...t, [part]: list.filter((v) => v !== value) }
      if (list.length >= limit) return t
      const next = [...list, value].sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b))))
      return { ...t, [part]: next }
    })
  }

  const mainValues = useMemo(() => Array.from({ length: rules.main.max }, (_, i) => i + 1), [rules.main.max])
  const compValues = rules.comp
    ? rules.comp.values || Array.from({ length: rules.comp.max }, (_, i) => i + 1)
    : []

  const options = allDraws?.length ? allDraws : draws
  const multiplier = withMultiplier && draw?.multiplier ? draw.multiplier : null
  const base = euros(result?.amount)
  const amount = result?.amount && multiplier && base !== null ? money(base * multiplier) : result?.amount

  const runHistory = () => {
    if (!allDraws?.length) return
    setHistory(historyCheck(game, ticket, allDraws, draws.find((d) => d.winningsDistribution?.length) || draws[0], { payouts, stake }))
  }

  const pickLabel = minPick === maxPick ? `${maxPick} numéros` : `de ${minPick} à ${maxPick} numéros`

  return (
    <div className="ticket">
      <h2 className="section-title">Vérifier mon ticket</h2>
      <p className="muted ticket__intro">
        Sélectionnez votre grille {GAMES[game].name}, puis le tirage : vous saurez tout de suite si votre ticket est gagnant.
      </p>

      <div className="ticket__layout">
        <div className="ticket__form">
          <div className="ticket__block">
            <div className="ticket__head">
              <h3>Vos numéros <span className="muted">({pickLabel})</span></h3>
              <span className={`ticket__count ${ticket.main.length >= minPick ? 'is-ok' : ''}`}>
                {ticket.main.length} / {maxPick}
              </span>
            </div>
            <NumberGrid values={mainValues} selected={ticket.main} max={maxPick} variant="main"
              label="Vos numéros" onToggle={(v) => toggle('main', v, maxPick)} />
          </div>

          {rules.comp && (
            <div className="ticket__block">
              <div className="ticket__head">
                <h3>{rules.comp.label}</h3>
                <span className={`ticket__count ${ticket.comp.length === rules.comp.pick ? 'is-ok' : ''}`}>
                  {ticket.comp.length} / {rules.comp.pick}
                </span>
              </div>
              <NumberGrid values={compValues} selected={ticket.comp} max={rules.comp.pick}
                variant={rules.comp.variant} label={rules.comp.label}
                onToggle={(v) => toggle('comp', v, rules.comp.pick)} />
            </div>
          )}

          {rules.stakes && payouts?.stakes?.length > 0 && (
            <div className="ticket__block ticket__options">
              <label>
                Mise
                <span className="select">
                  <select value={stake} onChange={(e) => setStake(Number(e.target.value))}>
                    {payouts.stakes.map((s, i) => <option key={s} value={i}>{s}</option>)}
                  </select>
                </span>
              </label>
              {game === 'keno' && (
                <label className="ticket__check">
                  <input type="checkbox" checked={withMultiplier} onChange={(e) => setWithMultiplier(e.target.checked)} />
                  Option Multiplicateur
                </label>
              )}
            </div>
          )}

          <div className="ticket__actions">
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTicket(randomTicket(game))}>
              Grille au hasard
            </button>
            <button type="button" className="btn btn--ghost btn--sm" onClick={() => setTicket(EMPTY)}
              disabled={!ticket.main.length && !ticket.comp.length}>
              Effacer
            </button>
          </div>
        </div>

        <div className="ticket__result">
          <label className="ticket__draw">
            <span>Tirage</span>
            <span className={`select ${loadingDraw ? 'is-busy' : ''}`}>
              <select value={drawId || ''} onChange={(e) => setDrawId(e.target.value)}>
                {byYear(options).map(([year, list]) => (
                  <optgroup key={year} label={year}>
                    {list.map((d) => <option key={d.id} value={d.id}>{formatShortDate(d)}</option>)}
                  </optgroup>
                ))}
              </select>
            </span>
          </label>

          {draw && (
            <div className="ticket__drawn">
              <p className="muted">{formatDrawDate(draw)}</p>
              <div className="balls balls--md">
                {(draw.numbers || []).map((v) => (
                  <Ball key={`n${v}`} value={v} size="sm"
                    className={result ? (result.mainHits.includes(v) ? 'is-hit' : 'is-miss') : ''} />
                ))}
                {rules.comp && (draw[rules.comp.field] !== undefined) && <span className="balls__sep" />}
                {rules.comp && [].concat(draw[rules.comp.field] ?? []).map((v) => (
                  <Ball key={`c${v}`} value={v} variant={rules.comp.variant} size="sm"
                    className={result ? (result.compHits.map(String).includes(String(v)) ? 'is-hit' : 'is-miss') : ''} />
                ))}
                {game === 'amigo' && <span className="balls__sep" />}
                {game === 'amigo' && (draw.yellowNumbers || []).map((v) => (
                  <Ball key={`y${v}`} value={v} variant="yellow" size="sm"
                    className={result ? (result.yellowHits.includes(v) ? 'is-hit' : 'is-miss') : ''} />
                ))}
              </div>
            </div>
          )}

          <div ref={verdictRef} className={`ticket__verdict ${result ? (result.won ? 'is-won' : 'is-lost') : ''}`} aria-live="polite">
            {!complete && <p>Complétez votre grille pour connaître le résultat.</p>}
            {complete && !draw && <p>{loadingDraw ? 'Chargement du tirage…' : 'Choisissez un tirage.'}</p>}
            {result && result.won && (
              <>
                <p className="ticket__title">Ticket gagnant !</p>
                <p>
                  <strong>{result.row.combination}</strong>
                  {result.row.rank ? <span className="muted"> · rang {result.row.rank}</span> : null}
                </p>
                <p className="ticket__amount">
                  {amount && amount !== 'Non disponible' ? amount : 'Montant non communiqué pour ce tirage'}
                </p>
                {multiplier && base !== null && <p className="muted">Gain de base {result.amount} × {multiplier} (Multiplicateur)</p>}
                {withMultiplier && !draw.multiplier && <p className="muted">Multiplicateur inconnu pour ce tirage.</p>}
              </>
            )}
            {result && !result.won && (
              <>
                <p className="ticket__title">Pas gagnant cette fois</p>
                <p>{result.description}{result.known ? '' : ' (barème non disponible pour ce tirage)'}</p>
              </>
            )}
            {result?.second && (
              <p className={`ticket__second ${result.second.won ? 'is-won' : ''}`}>
                2nd tirage : {result.second.description}
                {result.second.won ? ` · gagnant, ${result.second.row.amount}` : ' · non gagnant'}
              </p>
            )}
          </div>

          {complete && (
            <div className="ticket__history">
              <button type="button" className="btn btn--primary btn--sm" onClick={runHistory} disabled={!allDraws?.length}>
                {allDraws?.length ? `Et sur tout l'historique (${allDraws.length.toLocaleString('fr-FR')} tirages) ?` : 'Chargement de l\'historique…'}
              </button>
              {history && (
                <div className="ticket__history-result">
                  <p>
                    Cette grille aurait été gagnante <strong>{history.wins.toLocaleString('fr-FR')} fois</strong> sur{' '}
                    {history.total.toLocaleString('fr-FR')} tirages
                    {history.total ? ` (${((history.wins / history.total) * 100).toLocaleString('fr-FR', { maximumFractionDigits: 1 })} %)` : ''}.
                  </p>
                  {history.best.length > 0 && (
                    <>
                      <p className="muted">Meilleurs résultats (rangs actuels du jeu) :</p>
                      <ul>
                        {history.best.map((b) => (
                          <li key={b.draw.id}>
                            <button type="button" className="ticket__link" onClick={() => setDrawId(b.draw.id)}>
                              {formatShortDate(b.draw)}
                            </button>{' '}
                            — {b.description}
                          </li>
                        ))}
                      </ul>
                    </>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
      <p className="muted ticket__disclaimer">
        Vérification indicative, d'après les résultats publiés par la FDJ. Seul le ticket et le contrôle en point de vente
        ou sur fdj.fr font foi.
      </p>
    </div>
  )
}
