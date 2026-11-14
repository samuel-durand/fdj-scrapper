/**
 * Vérificateur de ticket : règles de saisie et calcul du gain pour chaque jeu.
 *
 * Le rang est retrouvé dans la répartition des gains du tirage (winningsDistribution) à partir du
 * libellé de la combinaison (« 4 numéros + 2 étoiles »…), identique dans les données du scraper et
 * des archives FDJ. Keno et Amigo : barème des gains (payouts).
 */

const plural = (n, word) => `${n} ${word}${n > 1 ? 's' : ''}`
const good = (n) => (n > 1 ? `${n} bons numéros` : `${n} bon numéro`)
const norm = (s) => String(s || '').replace(/\s+/g, ' ').trim().toLowerCase()

/** Règles de saisie de chaque jeu. pick : nombre exact, ou [min, max]. */
export const TICKET_RULES = {
  euromillions: { main: { pick: 5, max: 50 }, comp: { pick: 2, max: 12, field: 'stars', label: 'Étoiles', variant: 'star' } },
  loto: { main: { pick: 5, max: 49 }, comp: { pick: 1, max: 10, field: 'luckyNumber', label: 'Numéro Chance', variant: 'chance' } },
  eurodreams: { main: { pick: 6, max: 40 }, comp: { pick: 1, max: 5, field: 'dreamNumber', label: 'Dream Number', variant: 'dream' } },
  keno: { main: { pick: [4, 10], max: 56 }, stakes: true },
  crescendo: {
    main: { pick: 10, max: 25 },
    comp: { pick: 1, values: ['A', 'D', 'E', 'I', 'M', 'S'], field: 'letter', label: 'Lettre', variant: 'letter' },
  },
  amigo: { main: { pick: 7, max: 28 }, stakes: true },
}

export function pickRange(rule) {
  return Array.isArray(rule.pick) ? rule.pick : [rule.pick, rule.pick]
}

/** Le ticket est-il complet (bon nombre de numéros et de complémentaires) ? */
export function isComplete(game, ticket) {
  const rules = TICKET_RULES[game]
  const [min, max] = pickRange(rules.main)
  if (ticket.main.length < min || ticket.main.length > max) return false
  return !rules.comp || ticket.comp.length === rules.comp.pick
}

/** Grille au hasard. */
export function randomTicket(game) {
  const rules = TICKET_RULES[game]
  const draw = (values, n) => {
    const pool = [...values]
    const out = []
    while (out.length < n && pool.length) out.push(pool.splice(Math.floor(Math.random() * pool.length), 1)[0])
    return out.sort((a, b) => (typeof a === 'number' ? a - b : String(a).localeCompare(String(b))))
  }
  const [, max] = pickRange(rules.main)
  const range = (n) => Array.from({ length: n }, (_, i) => i + 1)
  const comp = rules.comp ? draw(rules.comp.values || range(rules.comp.max), rules.comp.pick) : []
  return { main: draw(range(rules.main.max), game === 'keno' ? 10 : max), comp }
}

function asList(v) {
  if (v === null || v === undefined) return []
  return Array.isArray(v) ? v : [v]
}

function findRow(rows, candidates) {
  for (const label of candidates.filter(Boolean)) {
    const row = (rows || []).find((r) => norm(r.combination) === norm(label))
    if (row) return row
  }
  return null
}

/**
 * Résultat d'un ticket sur un tirage.
 * Retourne { mainHits, compHits, yellowHits, description, row, amount, won, known, second }.
 *   known : false si la répartition de ce tirage ne permet pas de retrouver le rang
 *           (anciennes archives EuroMillions aux rangs non documentés).
 */
export function evaluate(game, ticket, draw, { payouts = null, stake = 0 } = {}) {
  const numbers = new Set(draw.numbers || [])
  const mainHits = ticket.main.filter((n) => numbers.has(n))
  const rules = TICKET_RULES[game]
  const compValues = rules.comp ? asList(draw[rules.comp.field]).map(String) : []
  const compHits = ticket.comp.filter((c) => compValues.includes(String(c)))
  const n = mainHits.length
  const k = compHits.length
  const dist = draw.winningsDistribution || []
  const out = { mainHits, compHits, yellowHits: [], row: null, amount: null, won: false, known: true, second: null }

  if (game === 'euromillions') {
    out.description = k ? `${plural(n, 'numéro')} + ${plural(k, 'étoile')}` : plural(n, 'numéro')
    out.row = findRow(dist, [out.description])
    out.known = dist.length === 0 || dist.some((r) => !/^rang \d+$/i.test(r.combination))
  } else if (game === 'loto') {
    out.description = k ? `${plural(n, 'numéro')} + numéro chance` : plural(n, 'numéro')
    out.row = findRow(dist, k
      ? [out.description, n <= 1 ? '0 ou 1 numéro + numéro chance' : null, plural(n, 'numéro')]
      : [out.description])
    if (draw.secondDraw?.length) {
      const second = new Set(draw.secondDraw)
      const hits = ticket.main.filter((x) => second.has(x))
      const row = findRow(draw.secondDrawDistribution, [plural(hits.length, 'numéro')])
      out.second = { hits, description: plural(hits.length, 'numéro'), row, won: Boolean(row) }
    }
  } else if (game === 'eurodreams') {
    out.description = k ? `${plural(n, 'numéro')} + Dream Number` : plural(n, 'numéro')
    out.row = findRow(dist, [n === 6 && k ? '6 numéros + dream number' : null, plural(n, 'numéro')])
  } else if (game === 'crescendo') {
    out.description = k ? `${good(n)} + lettre` : good(n)
    out.row = findRow(dist, [n === 10 ? '10 bons numéros' : null, k ? `${good(n)} + lettre` : null, good(n), k ? 'Lettre seule' : null])
  } else if (game === 'keno' || game === 'amigo') {
    const table = draw.payouts || payouts
    let gridId
    let rowLabel
    if (game === 'keno') {
      gridId = String(ticket.main.length)
      rowLabel = good(n)
      out.description = `${good(n)} sur ${ticket.main.length} numéros joués`
    } else {
      const yellow = new Set(draw.yellowNumbers || [])
      out.yellowHits = ticket.main.filter((x) => yellow.has(x))
      const y = out.yellowHits.length
      gridId = String(n + y)
      rowLabel = [n ? plural(n, 'bleu') : '', y ? plural(y, 'jaune') : ''].filter(Boolean).join(' + ')
      out.description = rowLabel ? `${rowLabel} (${good(n + y)})` : '0 bon numéro'
    }
    const grid = table?.grids?.find((g) => g.id === gridId)
    out.row = grid ? findRow(grid.rows, [rowLabel]) : null
    out.known = Boolean(table)
    if (out.row) {
      const amount = out.row.amounts?.[stake]
      out.amount = amount && amount !== '—' ? amount : null
      out.won = Boolean(out.amount)
      if (!out.won) out.row = null
    }
    return out
  }

  if (out.row) {
    out.won = true
    out.amount = out.row.amount
  }
  return out
}

/**
 * Le ticket sur tout l'historique (numéros seulement) : nombre de tirages gagnants et meilleurs
 * résultats. Les rangs gagnants sont ceux de la répartition du tirage de référence.
 */
export function historyCheck(game, ticket, draws, reference, { payouts = null, stake = 0 } = {}) {
  const ranks = (reference?.winningsDistribution || []).map((r) => r.combination)
  let wins = 0
  const best = []
  for (const d of draws) {
    const full = { ...d, winningsDistribution: reference?.winningsDistribution, secondDraw: null }
    const r = evaluate(game, ticket, full, { payouts: payouts || reference?.payouts, stake })
    if (!r.won) continue
    wins += 1
    const order = r.row ? ranks.findIndex((c) => norm(c) === norm(r.row.combination)) : -1
    // Keno / Amigo : plus il y a de bons numéros, mieux c'est
    const score = order >= 0 ? order : 100 - (r.mainHits.length + r.yellowHits.length)
    best.push({ draw: d, description: r.row?.combination || r.description, score })
  }
  best.sort((a, b) => a.score - b.score || b.draw.date.localeCompare(a.draw.date))
  return { total: draws.length, wins, best: best.slice(0, 5) }
}
