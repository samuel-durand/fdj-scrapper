import mongoose from 'mongoose'
import dotenv from 'dotenv'
import User from '../models/User.js'
import readline from 'readline'

dotenv.config()

// Vérifier si des arguments sont fournis en ligne de commande (mode non-interactif)
const args = process.argv.slice(2)
const isInteractive = args.length === 0

let rl
if (isInteractive) {
  rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  })
}

function question(query) {
  if (!rl) {
    throw new Error('readline interface non initialisée')
  }
  return new Promise(resolve => rl.question(query, resolve))
}

async function createAdmin() {
  try {
    // Connexion à MongoDB
    await mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/loterie-fdj')
    console.log('✅ Connected to MongoDB')

    console.log('\n🔐 Création d\'un compte administrateur\n')

    let name, email, password
    
    // Mode non-interactif (args en ligne de commande)
    if (!isInteractive) {
      if (args.length < 3) {
        console.error('❌ Usage: node create-admin.js <nom> <email> <mot-de-passe>')
        console.error('   Exemple: node create-admin.js "Admin" admin@example.com "motdepasse123"')
        process.exit(1)
      }
      name = args[0]
      email = args[1]
      password = args[2]
    } else {
      // Mode interactif (prompts)
      name = await question('Nom de l\'administrateur: ')
      email = await question('Email: ')
      password = await question('Mot de passe (min. 6 caractères): ')
    }

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
      // En mode non-interactif, promouvoir automatiquement si l'utilisateur existe
      if (!isInteractive) {
        existingUser.role = 'admin'
        if (name) existingUser.name = name
        await existingUser.save()
        console.log(`\n✅ L'utilisateur ${email} a été promu administrateur`)
      } else {
        // Mode interactif : demander confirmation
        const promote = await question(`\n⚠️  L'utilisateur ${email} existe déjà. Voulez-vous le promouvoir en admin? (oui/non): `)
        
        if (promote.toLowerCase() === 'oui' || promote.toLowerCase() === 'o') {
          existingUser.role = 'admin'
          await existingUser.save()
          console.log(`\n✅ L'utilisateur ${email} a été promu administrateur`)
        } else {
          console.log('\n❌ Opération annulée')
        }
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

    if (rl) rl.close()
    await mongoose.connection.close()
    console.log('\n👋 Déconnexion de MongoDB\n')
    process.exit(0)
  } catch (error) {
    console.error('❌ Erreur:', error.message)
    if (rl) rl.close()
    await mongoose.connection.close()
    process.exit(1)
  }
}

createAdmin()

