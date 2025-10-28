import mongoose from 'mongoose'

const notificationSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  alertId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Alert',
    required: true
  },
  alertName: String,
  message: {
    type: String,
    required: true
  },
  gameType: {
    type: String,
    required: true,
    enum: ['euromillions', 'loto', 'eurodreams']
  },
  draw: {
    date: Date,
    numbers: [Number],
    stars: [Number],
    luckyNumber: Number,
    jackpot: String
  },
  read: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
})

// Index pour tri par date
notificationSchema.index({ userId: 1, createdAt: -1 })

// TTL index: supprimer automatiquement après 30 jours
notificationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 2592000 })

const Notification = mongoose.model('Notification', notificationSchema)

export default Notification

