import mongoose from 'mongoose'
import dotenv from 'dotenv'
import Combination from '../models/Combination.js'
import Alert from '../models/Alert.js'
import Notification from '../models/Notification.js'
import User from '../models/User.js'

dotenv.config()

// Simulation d'un tirage (vous pouvez remplacer par un vrai tirage)
const mockDraw = {
  euromillions: {
    date: new Date('2025-01-20'),
    numbers: [12, 23, 34, 45, 50],
    stars: [3, 8],
    jackpot: '85 000 000 €'
  },
  loto: {
    date: new Date('2025-01-20'),
    numbers: [5, 12, 25, 38, 49],
    luckyNumber: 7,
    jackpot: '2 000 000 €'
  },
  eurodreams: {
    date: new Date('2025-01-20'),
    numbers: [8, 15, 22, 33, 39, 40],
    dreamNumber: 3,
    jackpot: '500 000 €'
  }
}

/**
 * Compter le nombre de numéros correspondants entre deux tableaux
 */
function countMatches(arr1, arr2) {
  const set2 = new Set(arr2)
  return arr1.filter(n => set2.has(n)).length
}

/**
 * Vérifier si une combinaison correspond au tirage
 */
function checkCombination(combination, draw) {
  const matches = countMatches(combination.numbers, draw.numbers)
  let additionalMatch = false

  if (combination.game === 'euromillions' && combination.stars) {
    additionalMatch = countMatches(combination.stars, draw.stars) > 0
  } else if (combination.game === 'loto' && combination.luckyNumber) {
    additionalMatch = combination.luckyNumber === draw.luckyNumber
  } else if (combination.game === 'eurodreams' && combination.dreamNumber) {
    additionalMatch = combination.dreamNumber === draw.dreamNumber
  }

  return {
    matches,
    additionalMatch,
    hasWon: matches >= 3 || (matches === 2 && additionalMatch)
  }
}

/**
 * Générer des alertes pour toutes les combinaisons
 */
async function generateAlertsForCombinations() {
  try {
    console.log('\n🔔 Génération d\'alertes pour les combinaisons utilisateurs...\n')

    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loterie-fdj')
    console.log('✅ Connected to MongoDB\n')

    // Récupérer toutes les combinaisons
    const combinations = await Combination.find({ isPlayed: false })
      .populate('userId', 'name email')

    console.log(`📊 ${combinations.length} combinaisons trouvées\n`)

    let alertsCreated = 0
    let notificationsCreated = 0
    let usersAlerted = new Set()

    for (const combination of combinations) {
      const draw = mockDraw[combination.game]
      if (!draw) {
        console.log(`⚠️  Pas de tirage disponible pour ${combination.game}`)
        continue
      }

      const result = checkCombination(combination, draw)

      if (result.hasWon) {
        console.log(`🎉 Combinaison ${combination._id}: ${result.matches} numéros + bonus match!`)

        // Mettre à jour le résultat de la combinaison
        combination.result = {
          hasWon: true,
          matchedNumbers: combination.numbers.filter(n => draw.numbers.includes(n)),
          matchedStars: combination.stars?.filter(n => draw.stars.includes(n)) || [],
          luckyNumber: combination.luckyNumber === draw.luckyNumber ? draw.luckyNumber : undefined,
          dreamNumber: combination.dreamNumber === draw.dreamNumber ? draw.dreamNumber : undefined,
          rank: calculateRank(combination.game, result.matches, result.additionalMatch),
          checkedDate: new Date()
        }
        combination.isPlayed = true
        await combination.save()

        // Créer ou récupérer l'alerte
        let alert = await Alert.findOne({
          userId: combination.userId,
          type: 'favorite_numbers',
          game: combination.game,
          'config.numbers': combination.numbers
        })

        if (!alert) {
          alert = await Alert.create({
            userId: combination.userId,
            name: `${combination.name || 'Ma combinaison'} - ${combination.game}`,
            type: 'favorite_numbers',
            game: combination.game,
            enabled: true,
            config: {
              numbers: combination.numbers,
              minMatches: 3
            }
          })
          alertsCreated++
        }

        // Créer une notification
        const gameName = {
          euromillions: 'EuroMillions',
          loto: 'Loto',
          eurodreams: 'EuroDreams'
        }

        const message = `${result.matches} numéros gagnants ! ${result.additionalMatch ? 'Bonus également trouvé !' : ''}`

        await Notification.create({
          userId: combination.userId,
          alertId: alert._id,
          alertName: alert.name,
          message,
          gameType: combination.game,
          draw: {
            date: draw.date,
            numbers: draw.numbers,
            stars: draw.stars,
            luckyNumber: draw.luckyNumber,
            jackpot: draw.jackpot
          },
          read: false
        })
        notificationsCreated++
        usersAlerted.add(combination.userId._id.toString())
      }
    }

    console.log('\n' + '='.repeat(50))
    console.log('📊 RÉSUMÉ')
    console.log('='.repeat(50))
    console.log(`✅ Combinaisons vérifiées: ${combinations.length}`)
    console.log(`🔔 Alertes créées: ${alertsCreated}`)
    console.log(`📧 Notifications créées: ${notificationsCreated}`)
    console.log(`👥 Utilisateurs alertés: ${usersAlerted.size}`)
    console.log('='.repeat(50) + '\n')

    if (usersAlerted.size > 0) {
      console.log('📋 Utilisateurs qui ont gagné:')
      for (const userId of usersAlerted) {
        const user = await User.findById(userId)
        console.log(`   - ${user.name} (${user.email})`)
      }
      console.log('')
    }

    await mongoose.connection.close()
    console.log('👋 Déconnexion de MongoDB\n')
    process.exit(0)

  } catch (error) {
    console.error('❌ Erreur:', error.message)
    console.error(error.stack)
    await mongoose.connection.close()
    process.exit(1)
  }
}

/**
 * Calculer le rang du gain approximatif
 */
function calculateRank(game, matches, hasBonus) {
  if (game === 'euromillions') {
    if (matches === 5 && hasBonus) return '1ère catégorie'
    if (matches === 5 && !hasBonus) return '2ème catégorie'
    if (matches === 4 && hasBonus) return '3ème catégorie'
    if (matches === 4 && !hasBonus) return '4ème catégorie'
    if (matches === 3 && hasBonus) return '5ème catégorie'
    if (matches === 3 && !hasBonus) return '6ème catégorie'
    if (matches === 2 && hasBonus) return '7ème catégorie'
    if (hasBonus) return '8ème catégorie'
  }

  if (game === 'loto') {
    if (matches === 5 && hasBonus) return '1ère catégorie'
    if (matches === 5 && !hasBonus) return '2ème catégorie'
    if (matches === 4 && hasBonus) return '3ème catégorie'
    if (matches === 4 && !hasBonus) return '4ème catégorie'
    if (matches === 3 && hasBonus) return '5ème catégorie'
    if (matches === 3 && !hasBonus) return '6ème catégorie'
    if (hasBonus) return '7ème catégorie'
  }

  if (game === 'eurodreams') {
    if (matches === 6 && hasBonus) return '1ère catégorie'
    if (matches === 6 && !hasBonus) return '2ème catégorie'
    if (matches === 5 && hasBonus) return '3ème catégorie'
    if (matches === 5 && !hasBonus) return '4ème catégorie'
    if (matches === 4 && hasBonus) return '5ème catégorie'
    if (matches === 4 && !hasBonus) return '6ème catégorie'
    if (matches === 3 && hasBonus) return '7ème catégorie'
    if (hasBonus) return '8ème catégorie'
  }

  return 'Rang inconnu'
}

generateAlertsForCombinations()


