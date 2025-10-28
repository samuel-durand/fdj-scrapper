import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import readline from 'readline'

dotenv.config()

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout
})

function question(query) {
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loterie-fdj', {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    })
    console.log('✅ Connected to MongoDB')

    console.log('\n🔐 Création d\'un compte administrateur\n')

    // Demander les informations
    const name = await question('Nom de l\'administrateur: ')
    const email = await question('Email: ')
    const password = await question('Mot de passe (min. 6 caractères): ')

    if (!name || !email || !password) {
      console.error('❌ Tous les champs sont requis')
      process.exit(1)
    }

    if (password.length < 6) {
      console.error('❌ Le mot de passe doit contenir au moins 6 caractères')
      process.exit(1)
    }

    // Vérifier si l'email existe déjà
    const existingUser = await User.findOne({ email: email.toLowerCase() })
    if (existingUser) {
      // Si l'utilisateur existe déjà, demander si on veut le promouvoir en admin
      const promote = await question(`\n⚠️  L'utilisateur ${email} existe déjà. Voulez-vous le promouvoir en admin? (oui/non): `)
      
      if (promote.toLowerCase() === 'oui' || promote.toLowerCase() === 'o') {
        existingUser.role = 'admin'
        await existingUser.save()
        console.log(`\n✅ L'utilisateur ${email} a été promu administrateur`)
      } else {
        console.log('\n❌ Opération annulée')
      }
    } else {
      // Créer le nouvel utilisateur admin
      const admin = await User.create({
        name,
        email: email.toLowerCase(),
        password,
        role: 'admin',
        isActive: true
      })

      console.log('\n✅ Compte administrateur créé avec succès!')
      console.log(`   Nom: ${admin.name}`)
      console.log(`   Email: ${admin.email}`)
      console.log(`   Rôle: ${admin.role}`)
    }

    rl.close()
    await mongoose.connection.close()
    console.log('\n👋 Déconnexion de MongoDB\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    rl.close()
    await mongoose.connection.close()
    process.exit(1)
  }
}

createAdmin()

