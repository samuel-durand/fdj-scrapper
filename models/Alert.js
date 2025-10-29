import mongoose from 'mongoose'

const alertSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  name: {
    type: String,
    required: [true, 'Le nom de l\'alerte est requis'],
    trim: true,
    maxlength: [100, 'Le nom ne peut pas dépasser 100 caractères']
  },
  type: {
    type: String,
    required: true,
    enum: ['jackpot_threshold', 'favorite_numbers', 'new_draw', 'lucky_number_match']
  },
  game: {
    type: String,
    required: true,
    enum: ['euromillions', 'loto', 'eurodreams']
  },
  enabled: {
    type: Boolean,
    default: true
  },
  config: {
    // Pour jackpot_threshold
    threshold: Number,
    
    // Pour favorite_numbers
    numbers: [Number],
    minMatches: Number,
    
    // Pour lucky_number_match
    luckyNumber: Number
  }
}, {
  timestamps: true
})

// Index composé pour recherches rapides
alertSchema.index({ userId: 1, enabled: 1 })

const Alert = mongoose.model('Alert', alertSchema)

export default Alert

