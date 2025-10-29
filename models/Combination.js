import mongoose from 'mongoose'

const combinationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  game: {
    type: String,
    required: true,
    enum: ['euromillions', 'loto', 'eurodreams']
  },
  numbers: {
    type: [Number],
    required: true,
    validate: {
      validator: function(numbers) {
        // Validation selon le jeu
        if (this.game === 'euromillions') {
          return numbers.length === 5 && numbers.every(n => n >= 1 && n <= 50)
        } else if (this.game === 'loto') {
          return numbers.length === 5 && numbers.every(n => n >= 1 && n <= 49)
        } else if (this.game === 'eurodreams') {
          return numbers.length === 6 && numbers.every(n => n >= 1 && n <= 40)
        }
        return false
      },
      message: 'Numéros invalides pour ce jeu'
    }
  },
  stars: {
    type: [Number],
    validate: {
      validator: function(stars) {
        if (this.game === 'euromillions') {
          return stars && stars.length === 2 && stars.every(n => n >= 1 && n <= 12)
        }
        return !stars || stars.length === 0
      },
      message: 'Étoiles invalides'
    }
  },
  luckyNumber: {
    type: Number,
    validate: {
      validator: function(num) {
        if (this.game === 'loto') {
          return num >= 1 && num <= 10
        }
        return !num
      },
      message: 'Numéro chance invalide'
    }
  },
  dreamNumber: {
    type: Number,
    validate: {
      validator: function(num) {
        if (this.game === 'eurodreams') {
          return num >= 1 && num <= 5
        }
        return !num
      },
      message: 'Numéro Dream invalide'
    }
  },
  name: {
    type: String,
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  isFavorite: {
    type: Boolean,
    default: false
  },
  isPlayed: {
    type: Boolean,
    default: false
  },
  playedDate: Date,
  result: {
    hasWon: {
      type: Boolean,
      default: false
    },
    matchedNumbers: [Number],
    matchedStars: [Number],
    rank: String,
    prize: String,
    checkedDate: Date
  },
  notes: {
    type: String,
    maxlength: [500, 'Les notes ne peuvent pas dépasser 500 caractères']
  }
}, {
  timestamps: true
})

// Index composé pour recherches rapides
combinationSchema.index({ userId: 1, game: 1, createdAt: -1 })
combinationSchema.index({ userId: 1, isFavorite: 1 })

// Méthode pour formater l'affichage
combinationSchema.methods.format = function() {
  const formatted = {
    id: this._id,
    game: this.game,
    numbers: this.numbers,
    name: this.name,
    isFavorite: this.isFavorite,
    isPlayed: this.isPlayed,
    createdAt: this.createdAt
  }

  if (this.game === 'euromillions') {
    formatted.stars = this.stars
  } else if (this.game === 'loto') {
    formatted.luckyNumber = this.luckyNumber
  } else if (this.game === 'eurodreams') {
    formatted.dreamNumber = this.dreamNumber
  }

  if (this.result?.hasWon) {
    formatted.result = this.result
  }

  return formatted
}

const Combination = mongoose.model('Combination', combinationSchema)

export default Combination

