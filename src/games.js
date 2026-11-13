/** Configuration d'affichage des jeux. */
export const GAMES = {
  euromillions: {
    key: 'euromillions',
    name: 'EuroMillions',
    fullName: 'EuroMillions – My Million',
    tagline: 'Tirages le mardi et le vendredi',
    rules: 'Choisissez 5 numéros entre 1 et 50 et 2 étoiles entre 1 et 12. Tirages le mardi et le vendredi soir. Chaque grille participe aussi au tirage My Million : un code gagnant à 1 million d\'euros en France.',
    complementary: { field: 'stars', label: 'Étoiles', variant: 'star' },
  },
  loto: {
    key: 'loto',
    name: 'Loto',
    fullName: 'Loto',
    tagline: 'Tirages le lundi, le mercredi et le samedi',
    rules: 'Choisissez 5 numéros entre 1 et 49 et 1 numéro chance entre 1 et 10. Tirages le lundi, le mercredi et le samedi soir, plus les Super Loto et Grand Loto exceptionnels.',
    complementary: { field: 'luckyNumber', label: 'Numéro Chance', variant: 'chance' },
  },
  eurodreams: {
    key: 'eurodreams',
    name: 'EuroDreams',
    fullName: 'EuroDreams',
    tagline: 'Tirages le lundi et le jeudi',
    rules: 'Choisissez 6 numéros entre 1 et 40 et 1 Dream Number entre 1 et 5. Le premier rang gagne une rente mensuelle pendant 30 ans. Tirages le lundi et le jeudi soir.',
    complementary: { field: 'dreamNumber', label: 'Dream Number', variant: 'dream' },
  },
  keno: {
    key: 'keno',
    name: 'Keno',
    fullName: 'Keno',
    tagline: 'Un tirage chaque soir',
    rules: 'Choisissez de 4 à 10 numéros entre 1 et 56 et votre mise (de 1 à 10 €). Chaque soir, 16 numéros sont tirés : vos gains dépendent du nombre de numéros joués et du nombre de bons numéros. Avec 10 bons numéros sur 10, le gain peut prendre la forme d\'une rente à vie. L\'option Multiplicateur multiplie vos gains.',
    complementary: null,
    mainLabel: 'Numéros tirés',
    simple: true,
  },
  crescendo: {
    key: 'crescendo',
    name: 'Crescendo',
    fullName: 'Crescendo',
    tagline: '7 tirages le samedi, chaque heure de 13h à 19h',
    rules: 'Choisissez 10 numéros entre 1 et 25 et une lettre. Le samedi, un tirage a lieu chaque heure de 13h à 19h, avec un jackpot à gagner à chaque tirage pour 10 bons numéros sur 10.',
    complementary: { field: 'letter', label: 'Lettre', variant: 'letter' },
    intraday: true,
    simple: true,
  },
  amigo: {
    key: 'amigo',
    name: 'Amigo',
    fullName: 'Amigo',
    tagline: 'Un tirage toutes les 5 minutes',
    rules: 'Choisissez 7 numéros entre 1 et 28. À chaque tirage, 12 numéros sont tirés : 7 bleus et 5 jaunes. Vos gains dépendent du nombre de bons numéros et de leur couleur. Un tirage a lieu toutes les 5 minutes.',
    complementary: { field: 'yellowNumbers', label: 'Numéros jaunes', variant: 'yellow' },
    mainLabel: 'Numéros bleus',
    intraday: true,
    simple: true,
  },
}

export const GAME_KEYS = Object.keys(GAMES)

/** Jeux à grille fixe : statistiques détaillées, générateur, combinaisons et alertes. */
export const GRID_GAMES = ['euromillions', 'loto', 'eurodreams']

/** "19:35" -> "19h35" */
export const formatTime = (t) => (t ? t.replace(':', 'h') : '')

export const LOTO_TYPES = {
  superloto: 'Super Loto',
  grandloto: 'Grand Loto',
}

export function capitalize(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDrawDate(draw) {
  const at = draw?.time ? ` à ${formatTime(draw.time)}` : ''
  if (draw?.formattedDate) return capitalize(draw.formattedDate) + at
  if (!draw?.date) return ''
  return capitalize(
    new Date(`${draw.date}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  ) + at
}

/** "Mer. 11 nov. 2026" — pour les listes déroulantes (tient sur mobile). */
export function formatShortDate(draw) {
  if (!draw?.date) return ''
  const day = capitalize(
    new Date(`${draw.date}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short', ...(draw.time ? {} : { year: 'numeric' }),
    })
  )
  return draw.time ? `${day} · ${formatTime(draw.time)}` : day
}

export function complementaryValues(game, draw) {
  const comp = GAMES[game]?.complementary
  if (!comp) return []
  const v = draw?.[comp.field]
  if (v === null || v === undefined) return []
  return Array.isArray(v) ? v : [v]
}
