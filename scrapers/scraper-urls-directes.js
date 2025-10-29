/**
 * SCRAPER AVEC URLs DIRECTES FDJ
 * Génère les URLs pour chaque tirage et scrape l'historique complet !
 * 
 * Format découvert :
 * https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats/mardi-21-octobre-2025
 * https://www.fdj.fr/jeux-de-tirage/loto/resultats/mercredi-22-octobre-2025
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';
const DELAY_BETWEEN_REQUESTS = 2000; // 2 secondes entre chaque requête

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Génère les URLs pour les tirages Euromillions
 * Mardis et Vendredis des N derniers mois
 */
function generateEuromillionsUrls(nbMois = 3) {
  const urls = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - nbMois);
  
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= today) {
    const dayOfWeek = currentDate.getDay();
    
    // Euromillions : Mardi (2) et Vendredi (5)
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      const jour = jours[dayOfWeek];
      const jourNum = currentDate.getDate();
      const moisNom = mois[currentDate.getMonth()];
      const annee = currentDate.getFullYear();
      
      const url = `https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats/${jour}-${jourNum}-${moisNom}-${annee}`;
      const dateISO = currentDate.toISOString().split('T')[0];
      
      urls.push({ url, date: dateISO, dateFormatted: `${jour} ${jourNum} ${moisNom} ${annee}` });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return urls.reverse(); // Plus récent en premier
}

/**
 * Génère les URLs pour les tirages Loto
 * Lundis, Mercredis et Samedis des N derniers mois
 */
function generateLotoUrls(nbMois = 3) {
  const urls = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - nbMois);
  
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= today) {
    const dayOfWeek = currentDate.getDay();
    
    // Loto : Lundi (1), Mercredi (3) et Samedi (6)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 6) {
      const jour = jours[dayOfWeek];
      const jourNum = currentDate.getDate();
      const moisNom = mois[currentDate.getMonth()];
      const annee = currentDate.getFullYear();
      
      const url = `https://www.fdj.fr/jeux-de-tirage/loto/resultats/${jour}-${jourNum}-${moisNom}-${annee}`;
      const dateISO = currentDate.toISOString().split('T')[0];
      
      urls.push({ url, date: dateISO, dateFormatted: `${jour} ${jourNum} ${moisNom} ${annee}` });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return urls.reverse();
}

/**
 * Scrape une page Euromillions
 */
async function scrapEuromillionsPage(page, urlData) {
  try {
    console.log(`\n📡 ${urlData.dateFormatted}...`);
    
    await page.goto(urlData.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('body', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const data = {
        numbers: [],
        stars: [],
        myMillionCode: null,
        jackpot: 'Non disponible',
        winningsDistribution: []
      };
      
      // Numéros et étoiles
      const balls = Array.from(document.querySelectorAll('[class*="ball"], [class*="Ball"], .heading4, .heading5'));
      const allNumbers = balls
        .map(el => parseInt(el.textContent.trim()))
        .filter(n => !isNaN(n) && n > 0);
      
      data.numbers = allNumbers.filter(n => n >= 1 && n <= 50).slice(0, 5);
      const afterNumbers = allNumbers.slice(data.numbers.length);
      data.stars = afterNumbers.filter(n => n >= 1 && n <= 12).slice(0, 2);
      
      // Code My Million
      const bodyText = document.body.textContent;
      // Chercher un pattern comme "OA 155 5726" ou "AB123456" ou "OA1555726"
      const myMillionMatch = bodyText.match(/\b([A-Z]{2}\s?\d{3,4}\s?\d{4})\b/);
      if (myMillionMatch) {
        // Normaliser le format : "AB 123 4567" ou "AB1234567"
        data.myMillionCode = myMillionMatch[1].replace(/\s+/g, ' ').trim();
      }
      
      // Jackpot
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
      
      // Répartition des gains
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
    
    if (result.numbers.length === 5 && result.stars.length === 2) {
      console.log(`   ✅ ${result.numbers.join(', ')} + ⭐${result.stars.join(', ')}`);
      if (result.myMillionCode) {
        console.log(`   🎫 My Million: ${result.myMillionCode}`);
      }
      console.log(`   💰 ${result.jackpot}`);
      console.log(`   📊 ${result.winningsDistribution.length} rangs`);
      
      return {
        date: urlData.date,
        numbers: result.numbers,
        stars: result.stars,
        myMillionCode: result.myMillionCode,
        jackpot: result.jackpot,
        winningsDistribution: result.winningsDistribution
      };
    } else {
      console.log(`   ⚠️  Données incomplètes (${result.numbers.length} nums, ${result.stars.length} étoiles)`);
      return null;
    }
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    return null;
  }
}

/**
 * Scrape une page Loto
 */
async function scrapLotoPage(page, urlData) {
  try {
    console.log(`\n📡 ${urlData.dateFormatted}...`);
    
    await page.goto(urlData.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('body', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const data = {
        numbers: [],
        luckyNumber: null,
        secondDraw: null,
        jokerPlus: null,
        jackpot: 'Non disponible',
        winningsDistribution: []
      };
      
      // Numéros du 1er tirage
      const balls = Array.from(document.querySelectorAll('[class*="ball"], [class*="Ball"], .heading4, .heading5, li'));
      const allNumbers = balls
        .map(el => parseInt(el.textContent.trim()))
        .filter(n => !isNaN(n) && n > 0);
      
      const uniqueNumbers = [];
      for (const num of allNumbers) {
        if (num >= 1 && num <= 49 && !uniqueNumbers.includes(num) && uniqueNumbers.length < 5) {
          uniqueNumbers.push(num);
        }
      }
      data.numbers = uniqueNumbers;
      
      const afterNumbers = allNumbers.slice(5);
      for (const num of afterNumbers) {
        if (num >= 1 && num <= 10) {
          data.luckyNumber = num;
          break;
        }
      }
      
      // 2ème tirage (optionnel) - chercher dans le texte
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
      
      // Code Joker+ - format : 1 234 567 ou 1234567
      const jokerMatch = bodyText.match(/joker\+?[\s:]*(\d[\s\d]{6,})/i);
      if (jokerMatch) {
        data.jokerPlus = jokerMatch[1].replace(/\s+/g, ' ').trim();
      }
      
      // Jackpot
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
      
      // Répartition
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
    
    if (result.numbers.length === 5 && result.luckyNumber !== null) {
      console.log(`   ✅ ${result.numbers.join(', ')} + 🍀${result.luckyNumber}`);
      if (result.secondDraw) {
        console.log(`   🎲 2ème tirage: ${result.secondDraw.join(', ')}`);
      }
      if (result.jokerPlus) {
        console.log(`   🎫 Joker+: ${result.jokerPlus}`);
      }
      console.log(`   💰 ${result.jackpot}`);
      console.log(`   📊 ${result.winningsDistribution.length} rangs`);
      
      return {
        date: urlData.date,
        numbers: result.numbers,
        luckyNumber: result.luckyNumber,
        secondDraw: result.secondDraw,
        jokerPlus: result.jokerPlus,
        jackpot: result.jackpot,
        winningsDistribution: result.winningsDistribution
      };
    } else {
      console.log(`   ⚠️  Données incomplètes`);
      return null;
    }
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
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
 * Génère les URLs pour les tirages Eurodreams
 * Lundis et Jeudis
 */
function generateEurodreamsUrls(nbMois = 3) {
  const urls = [];
  const today = new Date();
  const startDate = new Date();
  startDate.setMonth(today.getMonth() - nbMois);
  
  const jours = ['dimanche', 'lundi', 'mardi', 'mercredi', 'jeudi', 'vendredi', 'samedi'];
  const mois = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  let currentDate = new Date(startDate);
  
  while (currentDate <= today) {
    const dayOfWeek = currentDate.getDay();
    
    // Eurodreams : Lundi (1) et Jeudi (4)
    if (dayOfWeek === 1 || dayOfWeek === 4) {
      const jour = jours[dayOfWeek];
      const jourNum = currentDate.getDate();
      const moisNom = mois[currentDate.getMonth()];
      const annee = currentDate.getFullYear();
      
      const url = `https://www.fdj.fr/jeux-de-tirage/eurodreams/resultats/${jour}-${jourNum}-${moisNom}-${annee}`;
      const dateISO = currentDate.toISOString().split('T')[0];
      
      urls.push({ url, date: dateISO, dateFormatted: `${jour} ${jourNum} ${moisNom} ${annee}` });
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return urls.reverse();
}

/**
 * Scrape une page Eurodreams
 */
async function scrapEurodreamsPage(page, urlData) {
  try {
    console.log(`\n📡 ${urlData.dateFormatted}...`);
    
    await page.goto(urlData.url, {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('body', { timeout: 5000 });
    
    const result = await page.evaluate(() => {
      const data = {
        numbers: [],
        dreamNumber: null,
        jackpot: 'Non disponible',
        winningsDistribution: []
      };
      
      // Numéros et Dream Number
      const balls = Array.from(document.querySelectorAll('[class*="ball"], [class*="Ball"], .heading4, .heading5'));
      const allNumbers = balls
        .map(el => parseInt(el.textContent.trim()))
        .filter(n => !isNaN(n) && n > 0);
      
      // Les 6 premiers sont les numéros (1-40)
      data.numbers = allNumbers.filter(n => n >= 1 && n <= 40).slice(0, 6);
      
      // Le Dream Number (1-5)
      const afterNumbers = allNumbers.slice(data.numbers.length);
      for (const num of afterNumbers) {
        if (num >= 1 && num <= 5) {
          data.dreamNumber = num;
          break;
        }
      }
      
      // Jackpot (rente mensuelle) - EuroDreams est toujours 20 000 € par mois
      const bodyText = document.body.textContent;
      
      // Chercher spécifiquement "20 000" ou "20000" suivi de "€ par mois"
      const jackpotMatch = bodyText.match(/(?:20[\s]*000|20[\s]*000)\s*€\s*(?:par mois|\/mois)/i);
      if (jackpotMatch) {
        data.jackpot = '20 000 € par mois';
      } else {
        // Fallback : chercher n'importe quel montant raisonnable
        const anyMatch = bodyText.match(/(\d+[\s\d]*)\s*€\s*(?:par mois|\/mois)/i);
        if (anyMatch) {
          const amount = parseInt(anyMatch[1].replace(/\s+/g, ''));
          // Valider que c'est un montant raisonnable (entre 10k et 30k)
          if (amount >= 10000 && amount <= 30000) {
            data.jackpot = `${anyMatch[1].replace(/\s+/g, ' ').trim()} € par mois`;
          } else {
            // Si le montant n'est pas valide, utiliser la valeur standard
            data.jackpot = '20 000 € par mois';
          }
        } else {
          data.jackpot = '20 000 € par mois';
        }
      }
      
      // Répartition des gains
      const table = document.querySelector('table');
      if (table) {
        const rows = Array.from(table.querySelectorAll('tbody tr'));
        
        rows.forEach((row, idx) => {
          const cells = Array.from(row.querySelectorAll('td'));
          if (cells.length >= 3) {
            const combo = cells[0].textContent.trim();
            const winners = cells[1].textContent.trim();
            const amount = cells[2].textContent.trim();
            
            data.winningsDistribution.push({
              rank: idx + 1,
              combination: combo,
              winners: winners !== '/' ? winners : '0',
              amount: amount !== '/' ? amount : 'Non disponible'
            });
          }
        });
      }
      
      return data;
    });
    
    if (result.numbers.length === 6 && result.dreamNumber !== null) {
      console.log(`   ✅ ${result.numbers.join(', ')} + 💤${result.dreamNumber}`);
      console.log(`   💰 ${result.jackpot}`);
      console.log(`   📊 ${result.winningsDistribution.length} rangs`);
      
      return {
        date: urlData.date,
        numbers: result.numbers,
        dreamNumber: result.dreamNumber,
        jackpot: result.jackpot,
        winningsDistribution: result.winningsDistribution
      };
    } else {
      console.log(`   ⚠️  Données incomplètes`);
      return null;
    }
    
  } catch (error) {
    console.log(`   ❌ Erreur: ${error.message}`);
    return null;
  }
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🎯 SCRAPER URLs DIRECTES FDJ           ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Date: ${new Date().toLocaleString('fr-FR')}  ║`);
  console.log('╚════════════════════════════════════════════╝\n');
  
  const nbMois = parseFloat(process.argv[2]) || 1;
  console.log(`🎯 Récupération des ${nbMois} derniers mois\n`);
  
  // Générer les URLs
  console.log('📋 Génération des URLs...');
  const euroUrls = generateEuromillionsUrls(nbMois);
  const lotoUrls = generateLotoUrls(nbMois);
  const eurodreamsUrls = generateEurodreamsUrls(nbMois);
  
  console.log(`   Euromillions : ${euroUrls.length} tirages attendus`);
  console.log(`   Loto : ${lotoUrls.length} tirages attendus`);
  console.log(`   Eurodreams : ${eurodreamsUrls.length} tirages attendus\n`);
  
  // Lancer Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // Scraper Euromillions
  console.log('═══════════════════════════════════════════');
  console.log('🎯 EUROMILLIONS');
  console.log('═══════════════════════════════════════════');
  
  const euromillionsResults = [];
  let euroSuccess = 0;
  
  for (const urlData of euroUrls) {
    const result = await scrapEuromillionsPage(page, urlData);
    if (result) {
      euromillionsResults.push(result);
      euroSuccess++;
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`\n✅ Euromillions : ${euroSuccess}/${euroUrls.length} tirages récupérés`);
  
  // Pause avant Loto
  console.log('\n⏳ Pause de 5 secondes...\n');
  await sleep(5000);
  
  // Scraper Loto
  console.log('═══════════════════════════════════════════');
  console.log('🍀 LOTO');
  console.log('═══════════════════════════════════════════');
  
  const lotoResults = [];
  let lotoSuccess = 0;
  
  for (const urlData of lotoUrls) {
    const result = await scrapLotoPage(page, urlData);
    if (result) {
      lotoResults.push(result);
      lotoSuccess++;
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`\n✅ Loto : ${lotoSuccess}/${lotoUrls.length} tirages récupérés`);
  
  // Pause avant Eurodreams
  console.log('\n⏳ Pause de 5 secondes...\n');
  await sleep(5000);
  
  // Scraper Eurodreams
  console.log('═══════════════════════════════════════════');
  console.log('💤 EURODREAMS');
  console.log('═══════════════════════════════════════════');
  
  const eurodreamsResults = [];
  let eurodreamsSuccess = 0;
  
  for (const urlData of eurodreamsUrls) {
    const result = await scrapEurodreamsPage(page, urlData);
    if (result) {
      eurodreamsResults.push(result);
      eurodreamsSuccess++;
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`\n✅ Eurodreams : ${eurodreamsSuccess}/${eurodreamsUrls.length} tirages récupérés`);
  
  await browser.close();
  
  // Formater et sauvegarder
  const formattedEuromillions = formatResults(euromillionsResults, 'em');
  const formattedLoto = formatResults(lotoResults, 'loto');
  const formattedEurodreams = formatResults(eurodreamsResults, 'ed');
  
  const cache = {
    lastUpdate: new Date().toISOString(),
    euromillions: formattedEuromillions,
    loto: formattedLoto,
    eurodreams: formattedEurodreams
  };
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   ✅ SCRAPING TERMINÉ !                   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Euromillions : ${euroSuccess.toString().padStart(2)} tirages récupérés     ║`);
  console.log(`║   Loto : ${lotoSuccess.toString().padStart(2)} tirages récupérés            ║`);
  console.log(`║   Eurodreams : ${eurodreamsSuccess.toString().padStart(2)} tirages récupérés       ║`);
  console.log(`║   Fichier : ${CACHE_FILE.padEnd(24)} ║`);
  console.log('╚════════════════════════════════════════════╝\n');
}

main().catch(console.error);

