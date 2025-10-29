/**
 * SCRAPER MODERNE AVEC PUPPETEER
 * Récupère les vrais résultats depuis le site FDJ avec un navigateur headless
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';

/**
 * Scrape les résultats Euromillions avec Puppeteer
 */
async function scrapEuromillionsPuppeteer() {
  console.log('\n🎯 Scraping Euromillions avec Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📡 Navigation vers la page Euromillions...');
    await page.goto('https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    // Attendre que les résultats soient chargés
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Extraire les données avec JavaScript dans le navigateur
    const result = await page.evaluate(() => {
      const data = {
        date: null,
        numbers: [],
        stars: [],
        myMillionCode: null,
        jackpot: 'Non disponible',
        winningsDistribution: []
      };
      
      // Extraire la date du titre
      const titleElement = document.querySelector('h2');
      if (titleElement) {
        const dateMatch = titleElement.textContent.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (dateMatch) {
          const mois = {
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
          };
          const jour = dateMatch[1].padStart(2, '0');
          const moisNum = mois[dateMatch[2].toLowerCase()] || '01';
          const annee = dateMatch[3];
          data.date = `${annee}-${moisNum}-${jour}`;
        }
      }
      
      // Extraire les numéros et étoiles
      const balls = Array.from(document.querySelectorAll('[class*="ball"], [class*="Ball"], .heading4, .heading5'));
      const allNumbers = balls
        .map(el => parseInt(el.textContent.trim()))
        .filter(n => !isNaN(n) && n > 0);
      
      // Les 5 premiers sont les numéros (1-50)
      data.numbers = allNumbers.filter(n => n >= 1 && n <= 50).slice(0, 5);
      
      // Les 2 suivants sont les étoiles (1-12)
      const afterNumbers = allNumbers.slice(data.numbers.length);
      data.stars = afterNumbers.filter(n => n >= 1 && n <= 12).slice(0, 2);
      
      // Code My Million
      const bodyText = document.body.textContent;
      const myMillionMatch = bodyText.match(/\b([A-Z]{2}\s?\d{3,4}\s?\d{4})\b/);
      if (myMillionMatch) {
        data.myMillionCode = myMillionMatch[1].replace(/\s+/g, ' ').trim();
      }
      
      // Extraire le jackpot
      const jackpotElements = Array.from(document.querySelectorAll('*'));
      for (const el of jackpotElements) {
        const text = el.textContent;
        const match = text.match(/(\d+)\s*millions?\s*€/i);
        if (match && text.length < 200) {
          const amount = parseInt(match[1]);
          if (amount >= 10 && amount <= 300) {
            data.jackpot = `${amount} 000 000 €`;
            break;
          }
        }
      }
      
      // Extraire la répartition des gains depuis le tableau
      const table = document.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        rows.forEach((row, idx) => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 4) {
            const combo = cells[0].textContent.trim();
            const winnersEurope = cells[2].textContent.trim();
            const amount = cells[3].textContent.trim();
            
            const combMap = {
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
              '2': '2 numéros'
            };
            
            const rankMap = {
              '52': 1, '51': 2, '5': 3, '42': 4, '41': 5, '4': 6,
              '32': 7, '31': 8, '3': 9, '22': 10, '21': 11, '2': 12
            };
            
            if (combMap[combo]) {
              data.winningsDistribution.push({
                rank: rankMap[combo] || idx + 1,
                combination: combMap[combo],
                winners: winnersEurope !== '/' ? winnersEurope : '0',
                amount: amount !== '/' ? amount : 'Non disponible'
              });
            }
          }
        });
      }
      
      return data;
    });
    
    await browser.close();
    
    if (result.numbers.length === 5 && result.stars.length === 2) {
      console.log(`✅ Euromillions ${result.date}`);
      console.log(`   Numéros: ${result.numbers.join(', ')}`);
      console.log(`   Étoiles: ${result.stars.join(', ')}`);
      if (result.myMillionCode) {
        console.log(`   🎫 My Million: ${result.myMillionCode}`);
      }
      console.log(`   Jackpot: ${result.jackpot}`);
      console.log(`   Répartition: ${result.winningsDistribution.length} rangs`);
      return result;
    } else {
      console.log(`⚠️ Données incomplètes: ${result.numbers.length} numéros, ${result.stars.length} étoiles`);
      await browser.close();
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await browser.close();
    return null;
  }
}

/**
 * Scrape les résultats Loto avec Puppeteer
 */
async function scrapLotoPuppeteer() {
  console.log('\n🍀 Scraping Loto avec Puppeteer...');
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    
    console.log('📡 Navigation vers la page Loto...');
    await page.goto('https://www.fdj.fr/jeux-de-tirage/loto/resultats', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    const result = await page.evaluate(() => {
      const data = {
        date: null,
        numbers: [],
        luckyNumber: null,
        secondDraw: null,
        jokerPlus: null,
        jackpot: 'Non disponible',
        winningsDistribution: []
      };
      
      // Extraire la date
      const titleElement = document.querySelector('h2');
      if (titleElement) {
        const dateMatch = titleElement.textContent.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
        if (dateMatch) {
          const mois = {
            'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
            'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
            'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
          };
          const jour = dateMatch[1].padStart(2, '0');
          const moisNum = mois[dateMatch[2].toLowerCase()] || '01';
          const annee = dateMatch[3];
          data.date = `${annee}-${moisNum}-${jour}`;
        }
      }
      
      // Extraire les numéros
      const balls = Array.from(document.querySelectorAll('[class*="ball"], [class*="Ball"], .heading4, .heading5, li'));
      const allNumbers = balls
        .map(el => parseInt(el.textContent.trim()))
        .filter(n => !isNaN(n) && n > 0);
      
      // Les 5 premiers numéros (1-49)
      const uniqueNumbers = [];
      for (const num of allNumbers) {
        if (num >= 1 && num <= 49 && !uniqueNumbers.includes(num) && uniqueNumbers.length < 5) {
          uniqueNumbers.push(num);
        }
      }
      data.numbers = uniqueNumbers;
      
      // Le numéro chance (1-10)
      const afterNumbers = allNumbers.slice(5);
      for (const num of afterNumbers) {
        if (num >= 1 && num <= 10) {
          data.luckyNumber = num;
          break;
        }
      }
      
      // 2ème tirage (optionnel)
      const bodyText = document.body.textContent;
      const secondDrawMatch = bodyText.match(/2(?:e|ème)\s*tirage[\s\S]{0,200}?(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})\D+(\d{1,2})/i);
      if (secondDrawMatch) {
        const nums = [
          parseInt(secondDrawMatch[1]),
          parseInt(secondDrawMatch[2]),
          parseInt(secondDrawMatch[3]),
          parseInt(secondDrawMatch[4]),
          parseInt(secondDrawMatch[5])
        ].filter(n => n >= 1 && n <= 49);
        
        if (nums.length === 5) {
          data.secondDraw = nums.sort((a, b) => a - b);
        }
      }
      
      // Code Joker+
      const jokerMatch = bodyText.match(/joker\+?[\s:]*(\d[\s\d]{6,})/i);
      if (jokerMatch) {
        data.jokerPlus = jokerMatch[1].replace(/\s+/g, ' ').trim();
      }
      
      // Extraire le prochain jackpot
      const jackpotElements = Array.from(document.querySelectorAll('*'));
      for (const el of jackpotElements) {
        const text = el.textContent;
        const match = text.match(/(\d+)\s*millions?\s*€/i);
        if (match && text.length < 300) {
          const amount = parseInt(match[1]);
          if (amount >= 1 && amount <= 200) {
            data.jackpot = `${amount} 000 000 €`;
            break;
          }
        }
      }
      
      // Extraire la répartition des gains
      const table = document.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        rows.forEach((row, idx) => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 3) {
            const combo = cells[0].textContent.trim();
            const winners = cells[1].textContent.trim();
            const amount = cells[2].textContent.trim();
            
            const combMap = {
              '51': '5 numéros + N° Chance',
              '5': '5 numéros',
              '41': '4 numéros + N° Chance',
              '4': '4 numéros',
              '31': '3 numéros + N° Chance',
              '3': '3 numéros',
              '21': '2 numéros + N° Chance',
              '2': '2 numéros'
            };
            
            const rankMap = {
              '51': 1, '5': 2, '41': 3, '4': 4, '31': 5, '3': 6, '21': 7, '2': 8
            };
            
            if (combMap[combo]) {
              data.winningsDistribution.push({
                rank: rankMap[combo] || idx + 1,
                combination: combMap[combo],
                winners: winners !== '/' ? winners : '0',
                amount: amount !== '/' ? amount : 'Non disponible'
              });
            }
          }
        });
      }
      
      return data;
    });
    
    await browser.close();
    
    if (result.numbers.length === 5 && result.luckyNumber !== null) {
      console.log(`✅ Loto ${result.date}`);
      console.log(`   Numéros: ${result.numbers.join(', ')}`);
      console.log(`   N° Chance: ${result.luckyNumber}`);
      if (result.secondDraw) {
        console.log(`   🎲 2ème tirage: ${result.secondDraw.join(', ')}`);
      }
      if (result.jokerPlus) {
        console.log(`   🎫 Joker+: ${result.jokerPlus}`);
      }
      console.log(`   Jackpot: ${result.jackpot}`);
      console.log(`   Répartition: ${result.winningsDistribution.length} rangs`);
      return result;
    } else {
      console.log(`⚠️ Données incomplètes: ${result.numbers.length} numéros, N° Chance: ${result.luckyNumber}`);
      await browser.close();
      return null;
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
    await browser.close();
    return null;
  }
}

/**
 * Formate les résultats
 */
function formatResults(results, gameType) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  return results.map((result, index) => {
    const dateObj = new Date(result.date + 'T12:00:00');
    const day = days[dateObj.getDay()];
    const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    
    const formatted = {
      id: `${gameType}-${index}`,
      date: result.date,
      day: day,
      formattedDate: formattedDate,
      numbers: result.numbers,
      jackpot: result.jackpot || 'Non disponible',
      winningsDistribution: result.winningsDistribution || []
    };
    
    if (gameType === 'em') {
      formatted.stars = result.stars;
      if (result.myMillionCode) {
        formatted.myMillionCode = result.myMillionCode;
      }
    } else {
      formatted.luckyNumber = result.luckyNumber;
      if (result.secondDraw) {
        formatted.secondDraw = result.secondDraw;
      }
      if (result.jokerPlus) {
        formatted.jokerPlus = result.jokerPlus;
      }
    }
    
    return formatted;
  });
}

/**
 * Charge le cache existant et le met à jour
 */
async function loadExistingCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
      const cache = JSON.parse(cacheContent);
      return { euromillions: cache.euromillions || [], loto: cache.loto || [] };
    }
  } catch (error) {
    console.error('⚠️ Erreur lecture cache:', error.message);
  }
  return { euromillions: [], loto: [] };
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🚀 SCRAPER MODERNE AVEC PUPPETEER      ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Date: ${new Date().toLocaleString('fr-FR')}  ║`);
  console.log('╚════════════════════════════════════════════╝');
  
  // Charger le cache existant
  const existing = await loadExistingCache();
  
  let euromillionsResults = existing.euromillions.map(r => ({
    date: r.date,
    numbers: r.numbers,
    stars: r.stars,
    jackpot: r.jackpot,
    winningsDistribution: r.winningsDistribution || []
  }));
  
  let lotoResults = existing.loto.map(r => ({
    date: r.date,
    numbers: r.numbers,
    luckyNumber: r.luckyNumber,
    jackpot: r.jackpot,
    winningsDistribution: r.winningsDistribution || []
  }));
  
  // Scraper Euromillions
  const latestEuro = await scrapEuromillionsPuppeteer();
  if (latestEuro) {
    const existingIndex = euromillionsResults.findIndex(r => r.date === latestEuro.date);
    if (existingIndex >= 0) {
      euromillionsResults[existingIndex] = latestEuro;
      console.log('✅ Euromillions mis à jour dans le cache');
    } else {
      euromillionsResults.unshift(latestEuro);
      console.log('✅ Euromillions ajouté au cache');
    }
  }
  
  // Attendre 3 secondes avant le prochain scraping
  console.log('\n⏳ Pause de 3 secondes...');
  await new Promise(resolve => setTimeout(resolve, 3000));
  
  // Scraper Loto
  const latestLoto = await scrapLotoPuppeteer();
  if (latestLoto) {
    const existingIndex = lotoResults.findIndex(r => r.date === latestLoto.date);
    if (existingIndex >= 0) {
      lotoResults[existingIndex] = latestLoto;
      console.log('✅ Loto mis à jour dans le cache');
    } else {
      lotoResults.unshift(latestLoto);
      console.log('✅ Loto ajouté au cache');
    }
  }
  
  // Trier par date décroissante
  euromillionsResults.sort((a, b) => new Date(b.date) - new Date(a.date));
  lotoResults.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Garder seulement les 3 derniers mois
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  euromillionsResults = euromillionsResults.filter(r => {
    const drawDate = new Date(r.date + 'T12:00:00');
    return drawDate >= threeMonthsAgo;
  });
  
  lotoResults = lotoResults.filter(r => {
    const drawDate = new Date(r.date + 'T12:00:00');
    return drawDate >= threeMonthsAgo;
  });
  
  // Formater les résultats
  const formattedEuromillions = formatResults(euromillionsResults, 'em');
  const formattedLoto = formatResults(lotoResults, 'loto');
  
  // Sauvegarder le cache
  const cache = {
    lastUpdate: new Date().toISOString(),
    euromillions: formattedEuromillions,
    loto: formattedLoto
  };
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  
  console.log('\n✅ Cache mis à jour avec succès !');
  console.log(`📊 Euromillions: ${formattedEuromillions.length} tirages`);
  console.log(`📊 Loto: ${formattedLoto.length} tirages`);
  console.log(`💾 Fichier: ${CACHE_FILE}`);
  
  // Afficher le dernier résultat
  if (formattedEuromillions.length > 0) {
    const first = formattedEuromillions[0];
    console.log(`\n🎯 Dernier Euromillions (${first.date}):`);
    console.log(`   Numéros: ${first.numbers.join(', ')}`);
    console.log(`   Étoiles: ${first.stars.join(', ')}`);
    console.log(`   Jackpot: ${first.jackpot}`);
  }
  
  if (formattedLoto.length > 0) {
    const first = formattedLoto[0];
    console.log(`\n🍀 Dernier Loto (${first.date}):`);
    console.log(`   Numéros: ${first.numbers.join(', ')}`);
    console.log(`   N° Chance: ${first.luckyNumber}`);
    console.log(`   Jackpot: ${first.jackpot}`);
  }
  
  console.log('\n✨ Scraping terminé avec Puppeteer !\n');
}

main().catch(console.error);

