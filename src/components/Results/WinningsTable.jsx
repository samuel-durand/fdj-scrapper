import { useState } from 'react'

const hasWinners = (w) => parseInt(String(w ?? '0').replace(/\s/g, ''), 10) > 0

// Les anciens caches contiennent parfois des lignes parasites ("02") : on les ignore.
const clean = (rows) => (rows || []).filter((r) => r && r.combination && !/^\d+$/.test(r.combination))

function Table({ rows, showRank, showEurope }) {
  return (
    <div className="table-wrap">
      <table className="winnings">
        <thead>
          <tr>
            {showRank && <th scope="col">Rang</th>}
            <th scope="col">Bons numéros</th>
            <th scope="col" className="num">Gagnants{showEurope ? ' France' : ''}</th>
            {showEurope && <th scope="col" className="num col-europe">Gagnants Europe</th>}
            <th scope="col" className="num">Gain par grille</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr
              key={i}
              className={`stagger ${hasWinners(r.winners) || hasWinners(r.winnersEurope) ? '' : 'is-empty'}`}
              style={{ '--i': i }}
            >
              {showRank && <td className="rank">{r.rank ?? i + 1}</td>}
              <td>{r.combination}</td>
              <td className="num">{r.winners ?? '0'}</td>
              {showEurope && <td className="num col-europe">{r.winnersEurope ?? '—'}</td>}
              <td className="num amount">{r.amount}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

function WinningsTable({ draw }) {
  const tabs = [
    { id: 'main', label: 'Tirage principal', rows: clean(draw.winningsDistribution), rank: true },
    { id: 'second', label: '2nd tirage', rows: clean(draw.secondDrawDistribution), rank: true },
    { id: 'etoile', label: 'Étoile+', rows: clean(draw.etoilePlusDistribution), rank: false },
  ].filter((t) => t.rows.length > 0)

  const [open, setOpen] = useState(true)
  const [active, setActive] = useState('main')
  if (tabs.length === 0) return null
  const current = tabs.find((t) => t.id === active) || tabs[0]
  const showEurope = current.rows.some((r) => r.winnersEurope !== undefined)

  return (
    <div className={`accordion ${open ? 'is-open' : ''}`}>
      <button className="accordion__toggle" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>Répartition des gains</span>
        <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden="true">
          <path d="M6 9l6 6 6-6" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>
      {/* grille 0fr -> 1fr : ouverture/fermeture animée sans connaître la hauteur */}
      <div className="accordion__panel" aria-hidden={!open}>
        <div className="accordion__body">
          {tabs.length > 1 && (
            <div className="pills" role="tablist">
              {tabs.map((t) => (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={current.id === t.id}
                  className={`pill ${current.id === t.id ? 'is-active' : ''}`}
                  onClick={() => setActive(t.id)}
                >
                  {t.label}
                </button>
              ))}
            </div>
          )}
          <Table key={current.id} rows={current.rows} showRank={current.rank} showEurope={showEurope} />
        </div>
      </div>
    </div>
  )
}

export default WinningsTable
