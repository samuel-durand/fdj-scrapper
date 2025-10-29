// Test de connexion MongoDB
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

console.log('🔍 Test de connexion MongoDB...\n')
console.log('Configuration:')
console.log('- MONGODB_URI:', process.env.MONGODB_URI ? '✅ Défini' : '❌ Non défini')
console.log('- JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini')
console.log('- FRONTEND_URL:', process.env.FRONTEND_URL || 'Non défini')
console.log('\nConnexion en cours...\n')

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('✅ ✅ ✅ CONNEXION RÉUSSIE ! ✅ ✅ ✅')
    console.log('\nInformations:')
    console.log('- Host:', mongoose.connection.host)
    console.log('- Database:', mongoose.connection.name)
    console.log('- Port:', mongoose.connection.port)
    console.log('\n🎉 MongoDB fonctionne correctement !')
    process.exit(0)
  })
  .catch((error) => {
    console.log('❌ ❌ ❌ ERREUR DE CONNEXION ❌ ❌ ❌\n')
    console.log('Type d\'erreur:', error.name)
    console.log('Message:', error.message)
    console.log('\n🔧 Solutions possibles:\n')
    
    if (error.message.includes('bad auth')) {
      console.log('➜ Username ou password incorrect')
      console.log('➜ Vérifiez Database Access sur MongoDB Atlas')
      console.log('➜ Re-créez un utilisateur avec un mot de passe simple')
    } else if (error.message.includes('ENOTFOUND')) {
      console.log('➜ URI MongoDB incorrect')
      console.log('➜ Vérifiez le format de MONGODB_URI')
    } else if (error.message.includes('connect')) {
      console.log('➜ Network Access non configuré sur MongoDB Atlas')
      console.log('➜ Ajoutez 0.0.0.0/0 dans Network Access')
    } else {
      console.log('➜ Erreur inconnue, voici les détails:')
      console.log(error)
    }
    
    process.exit(1)
  })

