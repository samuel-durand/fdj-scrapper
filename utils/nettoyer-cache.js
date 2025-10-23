/**
 * NETTOYAGE DU CACHE
 * Supprime les faux résultats et ne garde que les vrais scrapés avec Puppeteer
 */

import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';

console.log('🧹 Nettoyage du cache...\n');

// Charger le cache
let cache = { euromillions: [], loto: [], lastUpdate: new Date().toISOString() };

if (fs.existsSync(CACHE_FILE)) {
  const content = fs.readFileSync(CACHE_FILE, 'utf-8');
  cache = JSON.parse(content);
}

console.log(`📊 Avant nettoyage :`);
console.log(`   Euromillions : ${cache.euromillions.length} tirages`);
console.log(`   Loto : ${cache.loto.length} tirages\n`);

// Garder uniquement les résultats qui ont une répartition complète
// (ce sont les vrais résultats scrapés avec Puppeteer)
const cleanEuromillions = cache.euromillions.filter(r => {
  return r.winningsDistribution && r.winningsDistribution.length >= 10;
});

const cleanLoto = cache.loto.filter(r => {
  return r.winningsDistribution && r.winningsDistribution.length >= 6;
});

console.log(`✅ Après nettoyage :`);
console.log(`   Euromillions : ${cleanEuromillions.length} tirage(s) avec données complètes`);
console.log(`   Loto : ${cleanLoto.length} tirage(s) avec données complètes\n`);

// Sauvegarder le cache nettoyé
const cleanCache = {
  lastUpdate: new Date().toISOString(),
  euromillions: cleanEuromillions,
  loto: cleanLoto
};

fs.writeFileSync(CACHE_FILE, JSON.stringify(cleanCache, null, 2), 'utf-8');

console.log('💾 Cache nettoyé et sauvegardé !');
console.log(`📁 Fichier : ${CACHE_FILE}\n`);

// Afficher les résultats conservés
if (cleanEuromillions.length > 0) {
  console.log('🎯 Euromillions conservés :');
  cleanEuromillions.forEach(r => {
    console.log(`   - ${r.date} : ${r.numbers.join(', ')} + ⭐${r.stars.join(', ')}`);
  });
  console.log();
}

if (cleanLoto.length > 0) {
  console.log('🍀 Loto conservés :');
  cleanLoto.forEach(r => {
    console.log(`   - ${r.date} : ${r.numbers.join(', ')} + 🍀${r.luckyNumber}`);
  });
  console.log();
}

console.log('✨ Terminé ! Maintenant utilisez "npm run scrape" pour récupérer les nouveaux tirages.\n');

