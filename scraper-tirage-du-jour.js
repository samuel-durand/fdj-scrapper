/**
 * SCRAPER INTELLIGENT - TIRAGE DU JOUR UNIQUEMENT
 * Ne scrape que les jeux qui ont un tirage aujourd'hui
 * 
 * Calendrier des tirages :
 * - Lundi    : Loto (20h), EuroDreams (21h)
 * - Mardi    : EuroMillions (20h15)
 * - Mercredi : Loto (20h)
 * - Jeudi    : EuroDreams (21h)
 * - Vendredi : EuroMillions (20h15)
 * - Samedi   : Loto (20h)
 * - Dimanche : Aucun tirage
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Détermine quels jeux ont un tirage aujourd'hui
 */
function getGamesForToday() {
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0 = Dimanche, 1 = Lundi, ..., 6 = Samedi
  
  const games = [];
  
  switch (dayOfWeek) {
    case 0: // Dimanche
      console.log('📅 Dimanche : Aucun tirage prévu');
      break;
    case 1: // Lundi
      games.push({ name: 'loto', time: '20h00' });
      games.push({ name: 'eurodreams', time: '21h00' });
      break;
    case 2: // Mardi
      games.push({ name: 'euromillions', time: '20h15' });
      break;
    case 3: // Mercredi
      games.push({ name: 'loto', time: '20h00' });
      break;
    case 4: // Jeudi
      games.push({ name: 'eurodreams', time: '21h00' });
      break;
    case 5: // Vendredi
      games.push({ name: 'euromillions', time: '20h15' });
      break;
    case 6: // Samedi
      games.push({ name: 'loto', time: '20h00' });
      break;
  }
  
  return games;
}

/**
 * Génère l'URL pour le tirage d'aujourd'hui
 */
function generateTodayUrl(game) {
  const today = new Date();
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  const jour = jours[today.getDay()];
  const jourNum = today.getDate();
  const moisNom = mois[today.getMonth()];
  const annee = today.getFullYear();
  
  let baseUrl = '';
  if (game === 'euromillions') {
    baseUrl = 'https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats';
  } else if (game === 'loto') {
    baseUrl = 'https://www.fdj.fr/jeux-de-tirage/loto/resultats';
  } else if (game === 'eurodreams') {
    baseUrl = 'https://www.fdj.fr/jeux-de-tirage/eurodreams/resultats';
  }
  
  const url = `${baseUrl}/${jour}-${jourNum}-${moisNom}-${annee}`;
  const dateISO = today.toISOString().split('T')[0];
  
  return { url, date: dateISO, dateFormatted: `${jour} ${jourNum} ${moisNom} ${annee}` };
}

/**
 * Scrape un tirage Euromillions
 */
async function scrapeEuromillions(page, urlData) {
  try {
    console.log(`  🔍 Scraping ${urlData.url}...`);
    
    await page.goto(urlData.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await sleep(2000);
    
    // Extraire les données
    const drawData = await page.evaluate(() => {
      // Numéros principaux
      const ballsMain = Array.from(document.querySelectorAll('.c-ball--euromillions.c-ball--main'));
      const numbers = ballsMain.map(ball => {
        const text = ball.textContent.trim();
        return parseInt(text, 10);
      }).filter(n => !isNaN(n));
      
      // Étoiles
      const ballsStars = Array.from(document.querySelectorAll('.c-ball--euromillions.c-ball--lucky'));
      const stars = ballsStars.map(ball => {
        const text = ball.textContent.trim();
        return parseInt(text, 10);
      }).filter(n => !isNaN(n));
      
      // Jackpot
      let jackpot = 'Non disponible';
      const jackpotElement = document.querySelector('.c-result__gain__amount');
      if (jackpotElement) {
        jackpot = jackpotElement.textContent.trim();
      }
      
      return { numbers, stars, jackpot };
    });
    
    if (drawData.numbers.length > 0) {
      console.log(`  ✅ Trouvé : ${drawData.numbers.join(', ')} + ⭐ ${drawData.stars.join(', ')}`);
      
      return {
        id: `em-${urlData.date}`,
        date: urlData.date,
        formattedDate: urlData.dateFormatted,
        day: urlData.dateFormatted.split(' ')[0],
        numbers: drawData.numbers,
        stars: drawData.stars,
        jackpot: drawData.jackpot
      };
    }
    
    console.log('  ⚠️  Aucune donnée trouvée');
    return null;
  } catch (error) {
    console.error(`  ❌ Erreur : ${error.message}`);
    return null;
  }
}

/**
 * Scrape un tirage Loto
 */
async function scrapeLoto(page, urlData) {
  try {
    console.log(`  🔍 Scraping ${urlData.url}...`);
    
    await page.goto(urlData.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await sleep(2000);
    
    const drawData = await page.evaluate(() => {
      // Numéros principaux
      const ballsMain = Array.from(document.querySelectorAll('.c-ball--loto.c-ball--main'));
      const numbers = ballsMain.map(ball => {
        const text = ball.textContent.trim();
        return parseInt(text, 10);
      }).filter(n => !isNaN(n));
      
      // Numéro chance
      let luckyNumber = null;
      const luckyBall = document.querySelector('.c-ball--loto.c-ball--lucky');
      if (luckyBall) {
        luckyNumber = parseInt(luckyBall.textContent.trim(), 10);
      }
      
      // Jackpot
      let jackpot = 'Non disponible';
      const jackpotElement = document.querySelector('.c-result__gain__amount');
      if (jackpotElement) {
        jackpot = jackpotElement.textContent.trim();
      }
      
      return { numbers, luckyNumber, jackpot };
    });
    
    if (drawData.numbers.length > 0) {
      console.log(`  ✅ Trouvé : ${drawData.numbers.join(', ')} + 🍀 ${drawData.luckyNumber}`);
      
      return {
        id: `loto-${urlData.date}`,
        date: urlData.date,
        formattedDate: urlData.dateFormatted,
        day: urlData.dateFormatted.split(' ')[0],
        numbers: drawData.numbers,
        luckyNumber: drawData.luckyNumber,
        jackpot: drawData.jackpot
      };
    }
    
    console.log('  ⚠️  Aucune donnée trouvée');
    return null;
  } catch (error) {
    console.error(`  ❌ Erreur : ${error.message}`);
    return null;
  }
}

/**
 * Scrape un tirage EuroDreams
 */
async function scrapeEurodreams(page, urlData) {
  try {
    console.log(`  🔍 Scraping ${urlData.url}...`);
    
    await page.goto(urlData.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await sleep(2000);
    
    const drawData = await page.evaluate(() => {
      // Numéros principaux
      const ballsMain = Array.from(document.querySelectorAll('.c-ball--eurodreams.c-ball--main'));
      const numbers = ballsMain.map(ball => {
        const text = ball.textContent.trim();
        return parseInt(text, 10);
      }).filter(n => !isNaN(n));
      
      // Numéro Dream
      let dreamNumber = null;
      const dreamBall = document.querySelector('.c-ball--eurodreams.c-ball--lucky');
      if (dreamBall) {
        dreamNumber = parseInt(dreamBall.textContent.trim(), 10);
      }
      
      // Jackpot/Rente
      let jackpot = 'Non disponible';
      const jackpotElement = document.querySelector('.c-result__gain__amount');
      if (jackpotElement) {
        jackpot = jackpotElement.textContent.trim();
      }
      
      return { numbers, dreamNumber, jackpot };
    });
    
    if (drawData.numbers.length > 0) {
      console.log(`  ✅ Trouvé : ${drawData.numbers.join(', ')} + 💤 ${drawData.dreamNumber}`);
      
      return {
        id: `ed-${urlData.date}`,
        date: urlData.date,
        formattedDate: urlData.dateFormatted,
        day: urlData.dateFormatted.split(' ')[0],
        numbers: drawData.numbers,
        dreamNumber: drawData.dreamNumber,
        jackpot: drawData.jackpot
      };
    }
    
    console.log('  ⚠️  Aucune donnée trouvée');
    return null;
  } catch (error) {
    console.error(`  ❌ Erreur : ${error.message}`);
    return null;
  }
}

/**
 * Charge le cache existant
 */
function loadExistingCache() {
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    } catch (error) {
      console.error('Erreur de lecture du cache:', error);
      return { euromillions: [], loto: [], eurodreams: [] };
    }
  }
  return { euromillions: [], loto: [], eurodreams: [] };
}

/**
 * Ajoute ou met à jour un tirage dans le cache
 */
function updateCache(cache, game, newDraw) {
  if (!newDraw) return;
  
  const gameKey = game === 'euromillions' ? 'euromillions' : 
                  game === 'loto' ? 'loto' : 'eurodreams';
  
  // Vérifier si le tirage existe déjà
  const existingIndex = cache[gameKey].findIndex(draw => draw.id === newDraw.id);
  
  if (existingIndex !== -1) {
    // Mettre à jour le tirage existant
    cache[gameKey][existingIndex] = newDraw;
    console.log(`  🔄 Tirage mis à jour dans le cache`);
  } else {
    // Ajouter le nouveau tirage
    cache[gameKey].unshift(newDraw);
    console.log(`  ➕ Nouveau tirage ajouté au cache`);
  }
  
  // Garder seulement les 100 derniers tirages
  cache[gameKey] = cache[gameKey].slice(0, 100);
}

/**
 * MAIN
 */
async function main() {
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   🎰 SCRAPER INTELLIGENT - TIRAGE DU JOUR UNIQUEMENT');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  
  const today = new Date();
  const jours = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  console.log(`📅 Aujourd'hui : ${jours[today.getDay()]} ${today.toLocaleDateString('fr-FR')}`);
  console.log('');
  
  // Déterminer les jeux du jour
  const gamesToScrape = getGamesForToday();
  
  if (gamesToScrape.length === 0) {
    console.log('🌙 Aucun tirage prévu aujourd\'hui. Repos bien mérité !');
    console.log('');
    return;
  }
  
  console.log('🎯 Tirages prévus aujourd\'hui :');
  gamesToScrape.forEach(game => {
    console.log(`   • ${game.name.toUpperCase()} à ${game.time}`);
  });
  console.log('');
  
  // Charger le cache existant
  const cache = loadExistingCache();
  console.log('📂 Cache existant chargé');
  console.log(`   • EuroMillions : ${cache.euromillions.length} tirages`);
  console.log(`   • Loto : ${cache.loto.length} tirages`);
  console.log(`   • EuroDreams : ${cache.eurodreams.length} tirages`);
  console.log('');
  
  // Lancer le navigateur
  console.log('🚀 Lancement du navigateur...');
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 1080 });
  
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   🔍 SCRAPING EN COURS...');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  
  // Scraper chaque jeu du jour
  for (const game of gamesToScrape) {
    console.log(`📊 ${game.name.toUpperCase()} (Tirage à ${game.time})`);
    console.log('─────────────────────────────────────────────────');
    
    const urlData = generateTodayUrl(game.name);
    let result = null;
    
    if (game.name === 'euromillions') {
      result = await scrapeEuromillions(page, urlData);
    } else if (game.name === 'loto') {
      result = await scrapeLoto(page, urlData);
    } else if (game.name === 'eurodreams') {
      result = await scrapeEurodreams(page, urlData);
    }
    
    if (result) {
      updateCache(cache, game.name, result);
    }
    
    console.log('');
    await sleep(2000);
  }
  
  await browser.close();
  
  // Sauvegarder le cache
  console.log('💾 Sauvegarde du cache...');
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2));
  console.log('✅ Cache sauvegardé dans ' + CACHE_FILE);
  
  console.log('');
  console.log('════════════════════════════════════════════════════');
  console.log('   ✅ SCRAPING TERMINÉ !');
  console.log('════════════════════════════════════════════════════');
  console.log('');
  console.log('📊 Résultats finaux :');
  console.log(`   • EuroMillions : ${cache.euromillions.length} tirages dans le cache`);
  console.log(`   • Loto : ${cache.loto.length} tirages dans le cache`);
  console.log(`   • EuroDreams : ${cache.eurodreams.length} tirages dans le cache`);
  console.log('');
}

main().catch(error => {
  console.error('❌ ERREUR FATALE:', error);
  process.exit(1);
});

