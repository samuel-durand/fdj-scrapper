/**
 * SCRIPT DE CORRECTION - Jackpots EuroDreams
 * Corrige les montants erronés dans le cache (ex: "6212 000 € par mois" → "20 000 € par mois")
 */

import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';

console.log('\n╔════════════════════════════════════════════╗');
console.log('║   🔧 CORRECTION JACKPOTS EURODREAMS      ║');
console.log('╚════════════════════════════════════════════╝\n');

// Lire le cache
if (!fs.existsSync(CACHE_FILE)) {
  console.error('❌ Fichier cache introuvable:', CACHE_FILE);
  process.exit(1);
}

const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
const cache = JSON.parse(cacheContent);

if (!cache.eurodreams || !Array.isArray(cache.eurodreams)) {
  console.log('⚠️  Aucune donnée EuroDreams à corriger');
  process.exit(0);
}

console.log(`📊 ${cache.eurodreams.length} tirages EuroDreams trouvés\n`);

let corrected = 0;

cache.eurodreams = cache.eurodreams.map(draw => {
  if (!draw.jackpot) {
    return draw;
  }

  const currentJackpot = draw.jackpot;
  
  // Extraire le montant numérique
  const amountMatch = currentJackpot.match(/(\d+[\s\d]*)/);
  if (amountMatch) {
    const amount = parseInt(amountMatch[1].replace(/\s+/g, ''));
    
    // Si le montant n'est pas entre 10k et 30k, le corriger
    if (amount < 10000 || amount > 30000) {
      console.log(`🔧 ${draw.date}: "${currentJackpot}" → "20 000 € par mois"`);
      draw.jackpot = '20 000 € par mois';
      corrected++;
    } else if (amount === 20000 && currentJackpot !== '20 000 € par mois') {
      // Normaliser le format même si le montant est correct
      console.log(`📝 ${draw.date}: Format normalisé "${currentJackpot}" → "20 000 € par mois"`);
      draw.jackpot = '20 000 € par mois';
      corrected++;
    }
  }
  
  return draw;
});

if (corrected > 0) {
  // Sauvegarder le cache corrigé
  cache.lastUpdate = new Date().toISOString();
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log(`║   ✅ ${corrected.toString().padStart(2)} TIRAGES CORRIGÉS              ║`);
  console.log(`║   💾 Cache mis à jour                     ║`);
  console.log('╚════════════════════════════════════════════╝\n');
} else {
  console.log('\n✅ Tous les jackpots sont déjà corrects!\n');
}

