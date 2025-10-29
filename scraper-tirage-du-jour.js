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
      
      // Extraire les données avec les NOUVEAUX sélecteurs FDJ 2025
      const drawData = await page.evaluate(() => {
        // Numéros principaux
        const ballsMain = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative'));
        const allNumbers = ballsMain.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        const numbers = allNumbers.slice(0, 5);
        
        // Étoiles
        const ballsStars = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative.top-\\[0\\.2rem\\]'));
        const stars = ballsStars.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        // Jackpot - chercher "XX millions €"
        let jackpot = 'Non disponible';
        const bodyText = document.body.innerText;
        const jackpotMatch = bodyText.match(/(\d+(?:\s+\d+)*)\s*millions?\s*€/i);
        if (jackpotMatch) {
          jackpot = jackpotMatch[0];
        }
        
        // Code My Million
        let myMillionCode = null;
        const myMillionMatch = bodyText.match(/([A-Z]{2}\s*\d{3}\s*\d{4})/);
        if (myMillionMatch) {
          myMillionCode = myMillionMatch[1];
        }
        
        // Cliquer sur "Ouvrir le tableau" pour afficher les gains
        const allElements = Array.from(document.querySelectorAll('button, a, div[role="button"], span'));
        for (const el of allElements) {
          const text = el.textContent.trim().toLowerCase();
          if (text.includes('ouvrir') || text.includes('tableau') || text.includes('répartition')) {
            el.click();
            break;
          }
        }
        
        return { numbers, stars, jackpot, myMillionCode };
      });
      
      // Attendre que le tableau se charge
      await sleep(2000);
      
      // Scraper le tableau des gains
      const winningsData = await page.evaluate(() => {
        const winningsDistribution = [];
        const table = document.querySelector('table');
        
        if (table) {
          const rows = Array.from(table.querySelectorAll('tr'));
          
          // Mapping des codes vers les combinaisons
          const combinationMap = {
            '52': '5 numéros + 2 étoiles',
            '51': '5 numéros + 1 étoile',
            '5': '5 numéros',
            '42': '4 numéros + 2 étoiles',
            '41': '4 numéros + 1 étoile',
            '4': '4 numéros',
            '32': '3 numéros + 2 étoiles',
            '31': '3 numéros + 1 étoile',
            '3': '3 numéros',
            '22': '2 numéros + 2 étoiles',
            '21': '2 numéros + 1 étoile',
            '2': '2 numéros',
            '12': '1 numéro + 2 étoiles'
          };
          
          let rank = 1;
          rows.forEach((row, idx) => {
            if (idx < 2) return; // Ignorer les headers
            
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
            if (cells.length >= 4) {
              const code = cells[0];
              const combination = combinationMap[code] || code;
              const winnersFrance = cells[1];
              const amount = cells[3];
              
              if (code && combination) {
                winningsDistribution.push({
                  rank: rank++,
                  combination: combination,
                  winners: winnersFrance,
                  amount: amount === '/' ? 'Non disponible' : amount
                });
              }
            }
          });
        }
        
        return winningsDistribution;
      });
      
      // Fusionner les données
      drawData.winningsDistribution = winningsData;
      
      if (drawData.numbers.length > 0) {
        console.log(`  ✅ Trouvé : ${drawData.numbers.join(', ')} + ⭐ ${drawData.stars.join(', ')}`);
        if (drawData.myMillionCode) {
          console.log(`  💰 My Million : ${drawData.myMillionCode}`);
        }
        if (drawData.winningsDistribution && drawData.winningsDistribution.length > 0) {
          console.log(`  📊 Gains : ${drawData.winningsDistribution.length} rangs récupérés`);
        }
        
        return {
          id: `em-${urlData.date}`,
          date: urlData.date,
          formattedDate: urlData.dateFormatted,
          day: urlData.dateFormatted.split(' ')[0],
          numbers: drawData.numbers,
          stars: drawData.stars,
          jackpot: drawData.jackpot,
          myMillionCode: drawData.myMillionCode || 'Non disponible',
          winningsDistribution: drawData.winningsDistribution || []
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
        // Numéros principaux + Numéro Chance
        const allBalls = Array.from(document.querySelectorAll('span.heading4.lg\\:heading5.relative'));
        const allNumbers = allBalls.map(ball => {
          const text = ball.textContent.trim();
          return parseInt(text, 10);
        }).filter(n => !isNaN(n));
        
        const numbers = allNumbers.slice(0, 5);
        const luckyNumber = allNumbers.length >= 6 ? allNumbers[5] : null;
        
        // Jackpot - chercher "X millions €" en priorité
        let jackpot = 'Non disponible';
        const bodyText = document.body.innerText;
        const jackpotMatch = bodyText.match(/(\d+(?:\s+\d+)*)\s*millions?\s*€/i);
        if (jackpotMatch) {
          jackpot = jackpotMatch[0];
        }
        
        // Codes gagnants (10 codes de format "X 1234 5678")
        const codesGagnants = [];
        const codeMatches = bodyText.match(/([A-Z]\s*\d{4}\s*\d{4})/g);
        if (codeMatches) {
          // Prendre seulement les 10 premiers (codes uniques)
          const uniqueCodes = [...new Set(codeMatches)];
          codesGagnants.push(...uniqueCodes.slice(0, 10));
        }
        
        // Cliquer sur "Ouvrir le tableau"
        const allElements = Array.from(document.querySelectorAll('button, a, div[role="button"], span'));
        for (const el of allElements) {
          const text = el.textContent.trim().toLowerCase();
          if (text.includes('ouvrir') || text.includes('tableau') || text.includes('répartition')) {
            el.click();
            break;
          }
        }
        
        return { numbers, luckyNumber, jackpot, codesGagnants };
      });
      
      // Attendre que le tableau se charge
      await sleep(2000);
      
      // Scraper le tableau des gains
      const winningsData = await page.evaluate(() => {
        const winningsDistribution = [];
        const table = document.querySelector('table');
        
        if (table) {
          const rows = Array.from(table.querySelectorAll('tr'));
          
          // Mapping des codes vers les combinaisons pour le Loto
          const combinationMap = {
            '51': '5 numéros + numéro chance',
            '5': '5 numéros',
            '41': '4 numéros + numéro chance',
            '4': '4 numéros',
            '31': '3 numéros + numéro chance',
            '3': '3 numéros',
            '21': '2 numéros + numéro chance',
            '2': '2 numéros',
            '1101': '1 numéro + numéro chance',
            '11': '1 numéro + numéro chance'
          };
          
          let rank = 1;
          rows.forEach((row, idx) => {
            if (idx === 0) return; // Ignorer le header
            
            const cells = Array.from(row.querySelectorAll('td')).map(td => td.textContent.trim());
            if (cells.length >= 3) {
              const code = cells[0];
              const combination = combinationMap[code] || code;
              const winners = cells[1];
              const amount = cells[2];
              
              if (code && combination) {
                winningsDistribution.push({
                  rank: rank++,
                  combination: combination,
                  winners: winners,
                  amount: amount === '/' ? 'Non disponible' : amount
                });
              }
            }
          });
        }
        
        return winningsDistribution;
      });
      
      // Fusionner les données
      drawData.winningsDistribution = winningsData;
      
      if (drawData.numbers.length > 0) {
        console.log(`  ✅ Trouvé : ${drawData.numbers.join(', ')} + 🍀 ${drawData.luckyNumber}`);
        if (drawData.codesGagnants && drawData.codesGagnants.length > 0) {
          console.log(`  🎫 Codes gagnants : ${drawData.codesGagnants.length} codes`);
        }
        if (drawData.winningsDistribution && drawData.winningsDistribution.length > 0) {
          console.log(`  📊 Gains : ${drawData.winningsDistribution.length} rangs récupérés`);
        }
        
        return {
          id: `loto-${urlData.date}`,
          date: urlData.date,
          formattedDate: urlData.dateFormatted,
          day: urlData.dateFormatted.split(' ')[0],
          numbers: drawData.numbers,
          luckyNumber: drawData.luckyNumber,
          jackpot: drawData.jackpot,
          codesGagnants: drawData.codesGagnants || [],
          winningsDistribution: drawData.winningsDistribution || []
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
  
  // Trier le cache par date décroissante (plus récent en premier)
  console.log('🔄 Tri du cache par date...');
  cache.euromillions.sort((a, b) => new Date(b.date) - new Date(a.date));
  cache.loto.sort((a, b) => new Date(b.date) - new Date(a.date));
  cache.eurodreams.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Mettre à jour la date
  cache.lastUpdate = new Date().toISOString();
  
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

