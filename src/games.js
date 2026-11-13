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
}

export const GAME_KEYS = Object.keys(GAMES)

export const LOTO_TYPES = {
  superloto: 'Super Loto',
  grandloto: 'Grand Loto',
}

export function capitalize(s = '') {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

export function formatDrawDate(draw) {
  if (draw?.formattedDate) return capitalize(draw.formattedDate)
  if (!draw?.date) return ''
  return capitalize(
    new Date(`${draw.date}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
    })
  )
}

/** "Mer. 11 nov. 2026" — pour les listes déroulantes (tient sur mobile). */
export function formatShortDate(draw) {
  if (!draw?.date) return ''
  return capitalize(
    new Date(`${draw.date}T12:00:00`).toLocaleDateString('fr-FR', {
      weekday: 'short', day: 'numeric', month: 'short', year: 'numeric',
    })
  )
}

export function complementaryValues(game, draw) {
  const v = draw?.[GAMES[game].complementary.field]
  if (v === null || v === undefined) return []
  return Array.isArray(v) ? v : [v]
}
