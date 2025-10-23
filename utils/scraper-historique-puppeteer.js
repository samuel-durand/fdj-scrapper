/**
 * SCRAPER HISTORIQUE AVEC PUPPETEER
 * Récupère plusieurs tirages en naviguant dans l'historique FDJ
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';
const DELAY_BETWEEN_REQUESTS = 3000; // 3 secondes entre chaque requête

/**
 * Pause
 */
const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Scrape plusieurs tirages Euromillions
 */
async function scrapEuromillionsHistory(nbTirages = 10) {
  console.log(`\n🎯 Scraping historique Euromillions (${nbTirages} derniers tirages)...\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('📡 Navigation vers la page Euromillions...');
    await page.goto('https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    // Essayer de trouver les boutons de navigation
    let currentTirage = 0;
    
    while (currentTirage < nbTirages) {
      console.log(`\n📊 Récupération du tirage ${currentTirage + 1}/${nbTirages}...`);
      
      // Attendre un peu pour que la page se charge
      await sleep(2000);
      
      // Extraire les données du tirage actuel
      const result = await page.evaluate(() => {
        const data = {
          date: null,
          numbers: [],
          stars: [],
          jackpot: 'Non disponible',
          winningsDistribution: []
        };
        
        // Date
        const titleElement = document.querySelector('h2, h1');
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
        
        // Numéros et étoiles
        const balls = Array.from(document.querySelectorAll('[class*="ball"], [class*="Ball"], .heading4, .heading5'));
        const allNumbers = balls
          .map(el => parseInt(el.textContent.trim()))
          .filter(n => !isNaN(n) && n > 0);
        
        data.numbers = allNumbers.filter(n => n >= 1 && n <= 50).slice(0, 5);
        const afterNumbers = allNumbers.slice(data.numbers.length);
        data.stars = afterNumbers.filter(n => n >= 1 && n <= 12).slice(0, 2);
        
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
        
        // Répartition
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
        // Vérifier si on n'a pas déjà ce résultat
        if (!results.find(r => r.date === result.date)) {
          results.push(result);
          console.log(`   ✅ ${result.date} : ${result.numbers.join(', ')} + ⭐${result.stars.join(', ')}`);
          console.log(`      Répartition : ${result.winningsDistribution.length} rangs`);
          currentTirage++;
        } else {
          console.log(`   ⏭️  Tirage déjà récupéré`);
          break; // On a fait le tour
        }
      } else {
        console.log(`   ⚠️  Données incomplètes`);
      }
      
      // Chercher le bouton "Tirage précédent" ou similaire
      const hasNextButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const prevButton = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('précédent') ||
          btn.textContent.toLowerCase().includes('previous') ||
          btn.getAttribute('aria-label')?.toLowerCase().includes('précédent')
        );
        
        if (prevButton) {
          prevButton.click();
          return true;
        }
        return false;
      });
      
      if (!hasNextButton) {
        console.log('\n⚠️  Pas de bouton "précédent" trouvé');
        console.log('   Le site FDJ affiche peut-être uniquement le dernier tirage sur cette page.\n');
        break;
      }
      
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log(`\n✅ ${results.length} tirages Euromillions récupérés`);
  return results;
}

/**
 * Scrape plusieurs tirages Loto
 */
async function scrapLotoHistory(nbTirages = 10) {
  console.log(`\n🍀 Scraping historique Loto (${nbTirages} derniers tirages)...\n`);
  
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const results = [];
  
  try {
    const page = await browser.newPage();
    await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
    
    console.log('📡 Navigation vers la page Loto...');
    await page.goto('https://www.fdj.fr/jeux-de-tirage/loto/resultats', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    await page.waitForSelector('body', { timeout: 10000 });
    
    let currentTirage = 0;
    
    while (currentTirage < nbTirages) {
      console.log(`\n📊 Récupération du tirage ${currentTirage + 1}/${nbTirages}...`);
      
      await sleep(2000);
      
      const result = await page.evaluate(() => {
        const data = {
          date: null,
          numbers: [],
          luckyNumber: null,
          jackpot: 'Non disponible',
          winningsDistribution: []
        };
        
        // Date
        const titleElement = document.querySelector('h2, h1');
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
        
        // Numéros
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
        if (!results.find(r => r.date === result.date)) {
          results.push(result);
          console.log(`   ✅ ${result.date} : ${result.numbers.join(', ')} + 🍀${result.luckyNumber}`);
          console.log(`      Répartition : ${result.winningsDistribution.length} rangs`);
          currentTirage++;
        } else {
          console.log(`   ⏭️  Tirage déjà récupéré`);
          break;
        }
      } else {
        console.log(`   ⚠️  Données incomplètes`);
      }
      
      const hasNextButton = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button, a'));
        const prevButton = buttons.find(btn => 
          btn.textContent.toLowerCase().includes('précédent') ||
          btn.textContent.toLowerCase().includes('previous') ||
          btn.getAttribute('aria-label')?.toLowerCase().includes('précédent')
        );
        
        if (prevButton) {
          prevButton.click();
          return true;
        }
        return false;
      });
      
      if (!hasNextButton) {
        console.log('\n⚠️  Pas de bouton "précédent" trouvé\n');
        break;
      }
      
      await sleep(DELAY_BETWEEN_REQUESTS);
    }
    
  } catch (error) {
    console.error('❌ Erreur:', error.message);
  } finally {
    await browser.close();
  }
  
  console.log(`\n✅ ${results.length} tirages Loto récupérés`);
  return results;
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
    } else {
      formatted.luckyNumber = result.luckyNumber;
    }
    
    return formatted;
  });
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   📜 SCRAPER HISTORIQUE AVEC PUPPETEER   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Date: ${new Date().toLocaleString('fr-FR')}  ║`);
  console.log('╚════════════════════════════════════════════╝');
  
  // Demander combien de tirages récupérer
  const nbTirages = parseInt(process.argv[2]) || 5;
  console.log(`\n🎯 Objectif : ${nbTirages} derniers tirages de chaque jeu\n`);
  
  // Scraper Euromillions
  const euromillionsResults = await scrapEuromillionsHistory(nbTirages);
  
  console.log('\n⏳ Pause de 5 secondes avant Loto...');
  await sleep(5000);
  
  // Scraper Loto
  const lotoResults = await scrapLotoHistory(nbTirages);
  
  // Formater
  const formattedEuromillions = formatResults(euromillionsResults, 'em');
  const formattedLoto = formatResults(lotoResults, 'loto');
  
  // Sauvegarder
  const cache = {
    lastUpdate: new Date().toISOString(),
    euromillions: formattedEuromillions,
    loto: formattedLoto
  };
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  
  console.log('\n✅ Cache mis à jour !');
  console.log(`📊 Euromillions: ${formattedEuromillions.length} tirages`);
  console.log(`📊 Loto: ${formattedLoto.length} tirages`);
  console.log(`💾 Fichier: ${CACHE_FILE}\n`);
}

main().catch(console.error);

