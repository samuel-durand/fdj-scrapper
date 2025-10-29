/**
 * SCRAPER EURODREAMS AVEC PUPPETEER
 * Récupère les résultats Eurodreams depuis le site FDJ
 * Tirages : Lundis et Jeudis
 * Format : 6 numéros (1-40) + 1 numéro Dream (1-5)
 */

import puppeteer from 'puppeteer';
import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';
const DELAY_BETWEEN_REQUESTS = 2000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

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
  
  return urls.reverse(); // Plus récent en premier
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
      
      // Le Dream Number (1-5) - chercher après les 6 numéros
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
      console.log(`   ⚠️  Données incomplètes (${result.numbers.length} nums, Dream: ${result.dreamNumber})`);
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
function formatResults(results) {
  const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
  const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 
                  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
  
  return results.map((result, index) => {
    const dateObj = new Date(result.date + 'T12:00:00');
    const day = days[dateObj.getDay()];
    const formattedDate = `${dateObj.getDate()} ${months[dateObj.getMonth()]} ${dateObj.getFullYear()}`;
    
    return {
      id: `eurodreams-${index}`,
      date: result.date,
      day: day,
      formattedDate: formattedDate,
      numbers: result.numbers,
      dreamNumber: result.dreamNumber,
      jackpot: result.jackpot || 'Non disponible',
      winningsDistribution: result.winningsDistribution || []
    };
  });
}

/**
 * Fonction principale
 */
async function main() {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   💤 SCRAPER EURODREAMS PUPPETEER       ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Date: ${new Date().toLocaleString('fr-FR')}  ║`);
  console.log('╚════════════════════════════════════════════╝\n');
  
  const nbMois = parseFloat(process.argv[2]) || 1;
  console.log(`🎯 Récupération des ${nbMois} derniers mois\n`);
  
  // Générer les URLs
  console.log('📋 Génération des URLs...');
  const eurodreamsUrls = generateEurodreamsUrls(nbMois);
  console.log(`   Eurodreams : ${eurodreamsUrls.length} tirages attendus\n`);
  
  // Lancer Puppeteer
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36');
  
  // Scraper Eurodreams
  console.log('═══════════════════════════════════════════');
  console.log('💤 EURODREAMS');
  console.log('═══════════════════════════════════════════');
  
  const eurodreamsResults = [];
  let success = 0;
  
  for (const urlData of eurodreamsUrls) {
    const result = await scrapEurodreamsPage(page, urlData);
    if (result) {
      eurodreamsResults.push(result);
      success++;
    }
    await sleep(DELAY_BETWEEN_REQUESTS);
  }
  
  console.log(`\n✅ Eurodreams : ${success}/${eurodreamsUrls.length} tirages récupérés`);
  
  await browser.close();
  
  // Formater
  const formattedEurodreams = formatResults(eurodreamsResults);
  
  // Charger le cache existant
  let cache = { euromillions: [], loto: [], eurodreams: [] };
  if (fs.existsSync(CACHE_FILE)) {
    try {
      const cacheContent = fs.readFileSync(CACHE_FILE, 'utf-8');
      cache = JSON.parse(cacheContent);
    } catch (error) {
      console.error('⚠️ Erreur lecture cache:', error.message);
    }
  }
  
  // Mettre à jour le cache avec Eurodreams
  cache.eurodreams = formattedEurodreams;
  cache.lastUpdate = new Date().toISOString();
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   ✅ SCRAPING TERMINÉ !                   ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Eurodreams : ${success.toString().padStart(2)} tirages récupérés    ║`);
  console.log(`║   Fichier : ${CACHE_FILE.padEnd(24)} ║`);
  console.log('╚════════════════════════════════════════════╝\n');
}

main().catch(console.error);

