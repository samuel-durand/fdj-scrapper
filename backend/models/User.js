import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Le nom est requis'],
    trim: true,
    minlength: [2, 'Le nom doit contenir au moins 2 caractères'],
    maxlength: [50, 'Le nom ne peut pas dépasser 50 caractères']
  },
  email: {
    type: String,
    required: [true, 'L\'email est requis'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Email invalide']
  },
  password: {
    type: String,
    required: [true, 'Le mot de passe est requis'],
    minlength: [6, 'Le mot de passe doit contenir au moins 6 caractères'],
    select: false // Ne pas retourner le mot de passe par défaut
  },
  role: {
    type: String,
    enum: ['user', 'admin'],
    default: 'user'
  },
  preferences: {
    favoriteGames: {
      type: [String],
      default: ['euromillions', 'loto', 'eurodreams']
    },
    defaultTab: {
      type: String,
      default: 'euromillions',
      enum: ['euromillions', 'loto', 'eurodreams']
    },
    notifications: {
      type: Boolean,
      default: true
    },
    theme: {
      type: String,
      default: 'light',
      enum: ['light', 'dark']
    }
  },
  refreshToken: {
    type: String,
    select: false
  },
  isActive: {
    type: Boolean,
    default: true
  },
  lastLogin: {
    type: Date
  }
}, {
  timestamps: true
})

// Hash password before saving
userSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next()
  
  try {
    const salt = await bcrypt.genSalt(12)
    this.password = await bcrypt.hash(this.password, salt)
    next()
  } catch (error) {
    next(error)
  }
})

// Compare password method
userSchema.methods.comparePassword = async function(candidatePassword) {
  try {
    return await bcrypt.compare(candidatePassword, this.password)
  } catch (error) {
    throw new Error('Erreur lors de la comparaison du mot de passe')
  }
}

// Method to get public profile
userSchema.methods.toJSON = function() {
  const user = this.toObject()
  delete user.password
  delete user.refreshToken
  delete user.__v
  return user
}

const User = mongoose.model('User', userSchema)

export default User

