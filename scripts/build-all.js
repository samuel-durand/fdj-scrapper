/**
 * SCRIPT DE BUILD COMPLET
 * Build le frontend et le prépare pour être servi par le backend
 */

import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

console.log('');
console.log('════════════════════════════════════════════════════');
console.log('   🚀 BUILD COMPLET - FRONTEND + BACKEND');
console.log('════════════════════════════════════════════════════');
console.log('');

// 1. Créer le fichier .env.production si nécessaire
console.log('📝 Étape 1/3 : Configuration de l\'environnement...');
const envProductionPath = path.join(__dirname, '.env.production')
const envContent = `# API URL pour la production
# Utiliser une URL relative car le backend servira le frontend
VITE_API_URL=/api
`

if (!fs.existsSync(envProductionPath)) {
  fs.writeFileSync(envProductionPath, envContent)
  console.log('   ✅ .env.production créé');
} else {
  console.log('   ℹ️  .env.production existe déjà');
}
console.log('');

// 2. Build du frontend
console.log('🎨 Étape 2/3 : Build du frontend React...');
try {
  execSync('npm run build', { 
    stdio: 'inherit',
    cwd: __dirname
  })
  console.log('   ✅ Frontend buildé dans dist/');
} catch (error) {
  console.error('   ❌ Erreur lors du build du frontend');
  process.exit(1)
}
console.log('');

// 3. Installer les dépendances backend
console.log('📦 Étape 3/3 : Vérification des dépendances backend...');
const backendPath = path.join(__dirname, 'backend')
if (fs.existsSync(backendPath)) {
  try {
    console.log('   Installation des dépendances backend...');
    execSync('npm install', { 
      stdio: 'inherit',
      cwd: backendPath
    })
    console.log('   ✅ Dépendances backend installées');
  } catch (error) {
    console.error('   ❌ Erreur lors de l\'installation backend');
    process.exit(1)
  }
} else {
  console.log('   ⚠️  Dossier backend non trouvé');
}
console.log('');

console.log('════════════════════════════════════════════════════');
console.log('   ✅ BUILD TERMINÉ AVEC SUCCÈS !');
console.log('════════════════════════════════════════════════════');
console.log('');
console.log('📦 Structure créée :');
console.log('   dist/          → Frontend buildé');
console.log('   backend/       → Backend Node.js');
console.log('');
console.log('🚀 Prochaines étapes :');
console.log('');
console.log('   1️⃣  LOCAL : Tester en production');
console.log('       cd backend');
console.log('       NODE_ENV=production npm start');
console.log('       → http://localhost:5000');
console.log('');
console.log('   2️⃣  DÉPLOIEMENT : Sur Render.com');
console.log('       - Le frontend sera automatiquement servi par le backend');
console.log('       - Une seule URL pour tout !');
console.log('');
console.log('════════════════════════════════════════════════════');
console.log('');

