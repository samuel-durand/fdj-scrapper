// Test de connexion MongoDB
import mongoose from 'mongoose'
import dotenv from 'dotenv'

dotenv.config()

console.log('\n🔍 Test de connexion MongoDB...\n')
console.log('================================')
console.log('Configuration:')
console.log('================================')
console.log('NODE_ENV:', process.env.NODE_ENV || 'Non défini')
console.log('PORT:', process.env.PORT || 'Non défini')
console.log('MONGODB_URI:', process.env.MONGODB_URI ? '✅ Défini' : '❌ Non défini')
console.log('JWT_SECRET:', process.env.JWT_SECRET ? '✅ Défini' : '❌ Non défini')
console.log('FRONTEND_URL:', process.env.FRONTEND_URL || 'Non défini')

if (!process.env.MONGODB_URI) {
  console.log('\n❌ ERREUR: MONGODB_URI n\'est pas défini dans .env')
  console.log('\nCréez un fichier .env avec:')
  console.log('MONGODB_URI=mongodb+srv://fdj_db_user:password@fjd.c4zt5vn.mongodb.net/fdj?retryWrites=true&w=majority&appName=fjd')
  process.exit(1)
}

console.log('\n================================')
console.log('Tentative de connexion...')
console.log('================================\n')

const startTime = Date.now()

mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n✅ ✅ ✅ CONNEXION RÉUSSIE ! ✅ ✅ ✅')
    console.log('\n================================')
    console.log('Informations de connexion:')
    console.log('================================')
    console.log('Host:', mongoose.connection.host)
    console.log('Database:', mongoose.connection.name)
    console.log('Port:', mongoose.connection.port || 'N/A')
    console.log('Temps de connexion:', duration + 's')
    console.log('\n🎉 MongoDB fonctionne correctement !')
    console.log('\nVous pouvez maintenant démarrer le serveur avec:')
    console.log('  node server.js\n')
    process.exit(0)
  })
  .catch((error) => {
    const duration = ((Date.now() - startTime) / 1000).toFixed(2)
    console.log('\n❌ ❌ ❌ ERREUR DE CONNEXION ❌ ❌ ❌')
    console.log('\n================================')
    console.log('Détails de l\'erreur:')
    console.log('================================')
    console.log('Type:', error.name)
    console.log('Message:', error.message)
    console.log('Temps écoulé:', duration + 's')
    
    console.log('\n================================')
    console.log('🔧 Solutions possibles:')
    console.log('================================\n')
    
    if (error.message.includes('bad auth') || error.message.includes('Authentication failed')) {
      console.log('➜ PROBLÈME: Username ou password incorrect')
      console.log('  Solutions:')
      console.log('  1. Vérifiez Database Access sur MongoDB Atlas')
      console.log('  2. Vérifiez le username: fdj_db_user')
      console.log('  3. Vérifiez le mot de passe dans MONGODB_URI')
      console.log('  4. Si le mot de passe contient @#$%&, encodez-les:')
      console.log('     @ = %40, # = %23, $ = %24, etc.')
    } else if (error.message.includes('ENOTFOUND') || error.message.includes('getaddrinfo')) {
      console.log('➜ PROBLÈME: URI MongoDB incorrect ou problème DNS')
      console.log('  Solutions:')
      console.log('  1. Vérifiez le format de MONGODB_URI dans .env')
      console.log('  2. Format attendu: mongodb+srv://user:pass@host/database?params')
      console.log('  3. Vérifiez que le cluster existe sur MongoDB Atlas')
      console.log('  4. Sur O2Switch, vérifiez la connexion internet du serveur')
    } else if (error.message.includes('connect') || error.message.includes('ETIMEDOUT')) {
      console.log('➜ PROBLÈME: Impossible de se connecter au serveur MongoDB')
      console.log('  Solutions:')
      console.log('  1. MongoDB Atlas → Network Access → Ajoutez 0.0.0.0/0')
      console.log('  2. Vérifiez que le firewall O2Switch autorise les connexions sortantes')
      console.log('  3. Testez depuis un autre réseau pour confirmer')
    } else if (error.message.includes('poolSize')) {
      console.log('➜ PROBLÈME: Configuration de connexion')
      console.log('  Solutions:')
      console.log('  1. Supprimez les options useNewUrlParser et useUnifiedTopology')
      console.log('  2. Utilisez uniquement la connection string de MongoDB Atlas')
    } else {
      console.log('➜ PROBLÈME: Erreur inconnue')
      console.log('  Détails complets:')
      console.log(error)
    }
    
    console.log('\n================================')
    console.log('📋 Checklist de vérification:')
    console.log('================================')
    console.log('☐ Fichier .env existe dans le dossier backend/')
    console.log('☐ MONGODB_URI est défini dans .env')
    console.log('☐ Username = fdj_db_user')
    console.log('☐ Mot de passe correct (sans caractères spéciaux ou encodés)')
    console.log('☐ MongoDB Atlas → Network Access → 0.0.0.0/0 ajouté')
    console.log('☐ MongoDB Atlas → Database Access → Utilisateur existe')
    console.log('☐ Sur O2Switch → Connexions sortantes autorisées\n')
    
    process.exit(1)
  })

// Timeout après 30 secondes
setTimeout(() => {
  console.log('\n⏱️  TIMEOUT: La connexion prend trop de temps (>30s)')
  console.log('Cela peut indiquer:')
  console.log('  - Firewall bloquant les connexions sortantes')
  console.log('  - MongoDB Atlas inaccessible depuis ce serveur')
  console.log('  - Problème réseau sur O2Switch\n')
  process.exit(1)
}, 30000)

