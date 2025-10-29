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
 * Détermine quels jeux ont un tirage pour un jour donné
 */
function getGamesForDay(dayOfWeek) {
  const games = [];
  
  switch (dayOfWeek) {
    case 0: // Dimanche
      // Aucun tirage
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
 * Détermine quels jeux scraper (derniers 7 jours pour combler les trous)
 */
function getGamesToScrape(daysBack = 7) {
  const today = new Date();
  const dayNames = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  
  console.log(`📅 Aujourd'hui : ${dayNames[today.getDay()]} ${today.toLocaleDateString('fr-FR')}`);
  console.log(`🔍 Recherche des tirages des ${daysBack} derniers jours...`);
  console.log('');
  
  const allGames = [];
  
  // Parcourir les N derniers jours
  for (let i = 0; i < daysBack; i++) {
    const date = new Date(today);
    date.setDate(date.getDate() - i);
    const dayOfWeek = date.getDay();
    
    const gamesForDay = getGamesForDay(dayOfWeek);
    
    for (const game of gamesForDay) {
      allGames.push({
        ...game,
        dayOffset: i,
        dateObj: date
      });
    }
  }
  
  return allGames;
}

/**
 * Génère l'URL pour un tirage à partir d'une date
 */
function generateUrlFromDate(gameName, dateObj) {
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  const jour = jours[dateObj.getDay()];
  const jourNum = dateObj.getDate();
  const moisNom = mois[dateObj.getMonth()];
  const annee = dateObj.getFullYear();
  
  let baseUrl = '';
  if (gameName === 'euromillions') {
    baseUrl = 'https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats';
  } else if (gameName === 'loto') {
    baseUrl = 'https://www.fdj.fr/jeux-de-tirage/loto/resultats';
  } else if (gameName === 'eurodreams') {
    baseUrl = 'https://www.fdj.fr/jeux-de-tirage/eurodreams/resultats';
  }
  
  const url = `${baseUrl}/${jour}-${jourNum}-${moisNom}-${annee}`;
  const dateISO = dateObj.toISOString().split('T')[0];
  
  return { url, date: dateISO, dateFormatted: `${jour} ${jourNum} ${moisNom} ${annee}` };
}

/**
 * Scrape un tirage Euromillions (avec retry)
 */
async function scrapeEuromillions(page, urlData, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentative ${attempt}/${retries}...`);
      } else {
        console.log(`  🔍 Scraping ${urlData.url}...`);
      }
      
      await page.goto(urlData.url, {
        waitUntil: 'networkidle2',
        timeout: 45000
      });
      
      // Attendre plus longtemps pour que la page charge complètement
      await sleep(3000);
      
      // Extraire les données avec les NOUVEAUX sélecteurs
      const drawData = await page.evaluate(() => {
        // Numéros principaux - NOUVEAU SÉLECTEUR
        const ballsMain = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative'));
        const allNumbers = ballsMain.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        // Les 5 premiers sont les numéros principaux
        const numbers = allNumbers.slice(0, 5);
        
        // Étoiles - NOUVEAU SÉLECTEUR (avec top-[0.2rem])
        const ballsStars = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative.top-\\[0\\.2rem\\]'));
        const stars = ballsStars.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        // Jackpot - chercher dans les éléments avec "million" ou "€"
        let jackpot = 'Non disponible';
        const allText = document.body.innerText;
        const jackpotMatch = allText.match(/(\d+(?:[,\s]\d+)*)\s*(?:millions?|€)/i);
        if (jackpotMatch) {
          jackpot = jackpotMatch[0];
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
      
      // Si aucune donnée trouvée, attendre avant de réessayer
      if (attempt < retries) {
        console.log('  ⏳ Aucune donnée trouvée, nouvelle tentative dans 3 secondes...');
        await sleep(3000);
      } else {
        console.log('  ⚠️  Aucune donnée trouvée après toutes les tentatives');
      }
      
    } catch (error) {
      console.error(`  ❌ Erreur (tentative ${attempt}/${retries}) : ${error.message}`);
      if (attempt < retries) {
        await sleep(3000);
      }
    }
  }
  
  return null;
}

/**
 * Scrape un tirage Loto (avec retry)
 */
async function scrapeLoto(page, urlData, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentative ${attempt}/${retries}...`);
      } else {
        console.log(`  🔍 Scraping ${urlData.url}...`);
      }
      
      await page.goto(urlData.url, {
        waitUntil: 'networkidle2',
        timeout: 45000
      });
      
      await sleep(3000);
      
      const drawData = await page.evaluate(() => {
        // Numéros principaux + Numéro Chance - NOUVEAU SÉLECTEUR
        const allBalls = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative'));
        const allNumbers = allBalls.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        // Les 5 premiers sont les numéros principaux
        const numbers = allNumbers.slice(0, 5);
        
        // Le 6ème est le numéro chance
        const luckyNumber = allNumbers.length >= 6 ? allNumbers[5] : null;
        
        // Jackpot
        let jackpot = 'Non disponible';
        const allText = document.body.innerText;
        const jackpotMatch = allText.match(/(\d+(?:[,\s]\d+)*)\s*(?:millions?|€)/i);
        if (jackpotMatch) {
          jackpot = jackpotMatch[0];
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
      
      if (attempt < retries) {
        console.log('  ⏳ Aucune donnée trouvée, nouvelle tentative dans 3 secondes...');
        await sleep(3000);
      } else {
        console.log('  ⚠️  Aucune donnée trouvée après toutes les tentatives');
      }
      
    } catch (error) {
      console.error(`  ❌ Erreur (tentative ${attempt}/${retries}) : ${error.message}`);
      if (attempt < retries) {
        await sleep(3000);
      }
    }
  }
  
  return null;
}

/**
 * Scrape un tirage EuroDreams (avec retry)
 */
async function scrapeEurodreams(page, urlData, retries = 2) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      if (attempt > 1) {
        console.log(`  🔄 Tentative ${attempt}/${retries}...`);
      } else {
        console.log(`  🔍 Scraping ${urlData.url}...`);
      }
      
      await page.goto(urlData.url, {
        waitUntil: 'networkidle2',
        timeout: 45000
      });
      
      await sleep(3000);
      
      const drawData = await page.evaluate(() => {
        // Numéros principaux + Dream Number - NOUVEAU SÉLECTEUR
        const allBalls = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative'));
        const allNumbers = allBalls.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        // Les 6 premiers sont les numéros principaux
        const numbers = allNumbers.slice(0, 6);
        
        // Le 7ème est le dream number
        const dreamNumber = allNumbers.length >= 7 ? allNumbers[6] : null;
        
        // Jackpot/Rente
        let jackpot = 'Non disponible';
        const allText = document.body.innerText;
        const jackpotMatch = allText.match(/(\d+(?:[,\s]\d+)*)\s*(?:€|euros?)/i);
        if (jackpotMatch) {
          jackpot = jackpotMatch[0];
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
      
      if (attempt < retries) {
        console.log('  ⏳ Aucune donnée trouvée, nouvelle tentative dans 3 secondes...');
        await sleep(3000);
      } else {
        console.log('  ⚠️  Aucune donnée trouvée après toutes les tentatives');
      }
      
    } catch (error) {
      console.error(`  ❌ Erreur (tentative ${attempt}/${retries}) : ${error.message}`);
      if (attempt < retries) {
        await sleep(3000);
      }
    }
  }
  
  return null;
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
  console.log(`📅 Date : ${today.toLocaleDateString('fr-FR')} ${today.toLocaleTimeString('fr-FR')}`);
  console.log('');
  
  // Déterminer les jeux à scraper (derniers 7 jours)
  const gamesToScrape = getGamesToScrape(7);
  
  if (gamesToScrape.length === 0) {
    console.log('🌙 Aucun tirage à scraper. Repos bien mérité !');
    console.log('');
    return;
  }
  
  console.log(`🎯 ${gamesToScrape.length} tirages à vérifier :`);
  const summary = {};
  gamesToScrape.forEach(game => {
    const key = game.name.toUpperCase();
    summary[key] = (summary[key] || 0) + 1;
  });
  Object.keys(summary).forEach(game => {
    console.log(`   • ${game} : ${summary[game]} tirage(s)`);
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
  
  // Scraper chaque jeu
  let scrapedCount = 0;
  let newDraws = 0;
  
  for (const game of gamesToScrape) {
    const dayLabel = game.dayOffset === 0 ? 'Aujourd\'hui' : 
                     game.dayOffset === 1 ? 'Hier' : 
                     `Il y a ${game.dayOffset} jours`;
    
    console.log(`📊 ${game.name.toUpperCase()} - ${dayLabel} (${game.time})`);
    console.log('─────────────────────────────────────────────────');
    
    const urlData = generateUrlFromDate(game.name, game.dateObj);
    
    // Vérifier si on a déjà ce tirage dans le cache
    const gameKey = game.name === 'euromillions' ? 'euromillions' : 
                     game.name === 'loto' ? 'loto' : 'eurodreams';
    const alreadyExists = cache[gameKey].some(draw => draw.id === `${gameKey === 'euromillions' ? 'em' : gameKey === 'loto' ? 'loto' : 'ed'}-${urlData.date}`);
    
    if (alreadyExists) {
      console.log(`  ⏭️  Déjà dans le cache, on passe`);
      console.log('');
      await sleep(500);
      continue;
    }
    
    let result = null;
    
    if (game.name === 'euromillions') {
      result = await scrapeEuromillions(page, urlData);
    } else if (game.name === 'loto') {
      result = await scrapeLoto(page, urlData);
    } else if (game.name === 'eurodreams') {
      result = await scrapeEurodreams(page, urlData);
    }
    
    scrapedCount++;
    
    if (result) {
      updateCache(cache, game.name, result);
      newDraws++;
    } else {
      console.log(`  ⚠️  Résultats non encore disponibles`);
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
  console.log('📊 Résultats du scraping :');
  console.log(`   • Tirages vérifiés : ${gamesToScrape.length}`);
  console.log(`   • Nouveaux tirages ajoutés : ${newDraws}`);
  console.log('');
  console.log('📦 Contenu total du cache :');
  console.log(`   • EuroMillions : ${cache.euromillions.length} tirages`);
  console.log(`   • Loto : ${cache.loto.length} tirages`);
  console.log(`   • EuroDreams : ${cache.eurodreams.length} tirages`);
  console.log('');
}

main().catch(error => {
  console.error('❌ ERREUR FATALE:', error);
  process.exit(1);
});

