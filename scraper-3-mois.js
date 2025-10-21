/**
 * SCRAPER DES 3 DERNIERS MOIS
 * Récupère tous les tirages des 3 derniers mois depuis le site FDJ
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';

const CACHE_FILE = 'resultats-cache.json';
const FDJ_BASE_URL = 'https://www.fdj.fr';

// Délai entre les requêtes pour ne pas surcharger le serveur FDJ
const DELAY_MS = 2000;

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Génère toutes les dates de tirages pour les 3 derniers mois
 */
function generateDates() {
  const dates = {
    euromillions: [], // Mardi et Vendredi
    loto: []          // Lundi, Mercredi et Samedi
  };
  
  const today = new Date();
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(today.getMonth() - 3);
  
  // Parcourir chaque jour des 3 derniers mois
  let currentDate = new Date(threeMonthsAgo);
  
  while (currentDate <= today) {
    const dayOfWeek = currentDate.getDay();
    const dateStr = currentDate.toISOString().split('T')[0];
    
    // EuroMillions: Mardi (2) et Vendredi (5)
    if (dayOfWeek === 2 || dayOfWeek === 5) {
      dates.euromillions.push(dateStr);
    }
    
    // Loto: Lundi (1), Mercredi (3) et Samedi (6)
    if (dayOfWeek === 1 || dayOfWeek === 3 || dayOfWeek === 6) {
      dates.loto.push(dateStr);
    }
    
    currentDate.setDate(currentDate.getDate() + 1);
  }
  
  return dates;
}

/**
 * Parse la page résultats Euromillions
 */
function parseEuromillionsResultsPage($) {
  try {
    // Chercher le script __NEXT_DATA__ qui contient les données JSON
    const scriptContent = $('script#__NEXT_DATA__').html();
    
    if (scriptContent) {
      const data = JSON.parse(scriptContent);
      const pageProps = data?.props?.pageProps;
      
      if (pageProps?.results) {
        const result = pageProps.results;
        
        // Extraire la date
        let dateStr = result.date || result.drawDate;
        if (dateStr && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        // Extraire les numéros et étoiles
        const numbers = result.balls || result.numbers || [];
        const stars = result.stars || result.luckyStars || [];
        
        // Extraire le jackpot
        let jackpot = 'Non disponible';
        if (result.jackpot) {
          jackpot = result.jackpot;
        } else if (pageProps.jackpot) {
          jackpot = pageProps.jackpot;
        }
        
        return [{
          date: dateStr,
          numbers: numbers.slice(0, 5),
          stars: stars.slice(0, 2),
          jackpot: jackpot,
          winningsDistribution: []
        }];
      }
    }
    
    // Fallback: parsing HTML manuel
    const numbers = [];
    const stars = [];
    
    $('.number-ball, .ball').each((i, el) => {
      const num = parseInt($(el).text().trim());
      if (!isNaN(num) && numbers.length < 5) {
        numbers.push(num);
      }
    });
    
    $('.star-ball, .lucky-star').each((i, el) => {
      const num = parseInt($(el).text().trim());
      if (!isNaN(num) && stars.length < 2) {
        stars.push(num);
      }
    });
    
    if (numbers.length === 5 && stars.length === 2) {
      // Chercher la date dans le texte
      const dateMatch = $('body').text().match(/(\d{2})\/(\d{2})\/(\d{4})/);
      let dateStr = null;
      if (dateMatch) {
        dateStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }
      
      return [{
        date: dateStr,
        numbers: numbers,
        stars: stars,
        jackpot: 'Non disponible',
        winningsDistribution: []
      }];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur parsing:', error.message);
    return null;
  }
}

/**
 * Parse la page résultats Loto
 */
function parseLotoResultsPage($) {
  try {
    // Chercher le script __NEXT_DATA__
    const scriptContent = $('script#__NEXT_DATA__').html();
    
    if (scriptContent) {
      const data = JSON.parse(scriptContent);
      const pageProps = data?.props?.pageProps;
      
      if (pageProps?.results) {
        const result = pageProps.results;
        
        let dateStr = result.date || result.drawDate;
        if (dateStr && dateStr.includes('T')) {
          dateStr = dateStr.split('T')[0];
        }
        
        const numbers = result.balls || result.numbers || [];
        const luckyNumber = result.luckyNumber || result.chance || 0;
        
        let jackpot = 'Non disponible';
        if (result.jackpot) {
          jackpot = result.jackpot;
        } else if (pageProps.jackpot) {
          jackpot = pageProps.jackpot;
        }
        
        return [{
          date: dateStr,
          numbers: numbers.slice(0, 5),
          luckyNumber: luckyNumber,
          jackpot: jackpot,
          winningsDistribution: []
        }];
      }
    }
    
    // Fallback HTML
    const numbers = [];
    
    $('.number-ball, .ball').each((i, el) => {
      const num = parseInt($(el).text().trim());
      if (!isNaN(num) && numbers.length < 5) {
        numbers.push(num);
      }
    });
    
    const luckyBall = $('.lucky-ball, .chance-ball').first().text().trim();
    const luckyNumber = parseInt(luckyBall) || 0;
    
    if (numbers.length === 5 && luckyNumber > 0) {
      const dateMatch = $('body').text().match(/(\d{2})\/(\d{2})\/(\d{4})/);
      let dateStr = null;
      if (dateMatch) {
        dateStr = `${dateMatch[3]}-${dateMatch[2]}-${dateMatch[1]}`;
      }
      
      return [{
        date: dateStr,
        numbers: numbers,
        luckyNumber: luckyNumber,
        jackpot: 'Non disponible',
        winningsDistribution: []
      }];
    }
    
    return null;
  } catch (error) {
    console.error('Erreur parsing:', error.message);
    return null;
  }
}

/**
 * Scrape un tirage Euromillions pour une date spécifique
 */
async function scrapEuromillionsDate(date) {
  try {
    const url = `${FDJ_BASE_URL}/jeux-de-tirage/euromillions-my-million/resultats`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = parseEuromillionsResultsPage($);
    
    if (results && results.length > 0 && results[0].date === date) {
      return results[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur scraping ${date}:`, error.message);
    return null;
  }
}

/**
 * Scrape un tirage Loto pour une date spécifique
 */
async function scrapLotoDate(date) {
  try {
    const url = `${FDJ_BASE_URL}/jeux-de-tirage/loto/resultats`;
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
      }
    });
    
    if (!response.ok) {
      return null;
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    const results = parseLotoResultsPage($);
    
    if (results && results.length > 0 && results[0].date === date) {
      return results[0];
    }
    
    return null;
  } catch (error) {
    console.error(`Erreur scraping ${date}:`, error.message);
    return null;
  }
}

/**
 * Formate les résultats pour le cache
 */
function formatResults(results, gameType) {
  return results.map((result, index) => {
    const dateObj = new Date(result.date);
    const days = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];
    const months = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
    
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
    
    if (gameType === 'euromillions') {
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
  console.log('🚀 Démarrage du scraping des 3 derniers mois...\n');
  
  // Charger le fallback data pour avoir une base complète
  let euromillionsResults = [];
  let lotoResults = [];
  
  try {
    const fallbackModule = await import('./year-data-2025.js');
    if (fallbackModule.euromillionsData2025) {
      euromillionsResults = [...fallbackModule.euromillionsData2025];
      console.log(`📦 Chargé ${euromillionsResults.length} tirages Euromillions depuis le fallback`);
    }
    if (fallbackModule.lotoData2025) {
      lotoResults = [...fallbackModule.lotoData2025];
      console.log(`📦 Chargé ${lotoResults.length} tirages Loto depuis le fallback`);
    }
  } catch (error) {
    console.log('⚠️  Pas de données fallback, démarrage à zéro');
  }
  
  // Scraper le dernier tirage de chaque jeu
  console.log('\n📡 Scraping des derniers tirages...\n');
  
  // Euromillions
  try {
    const url = `${FDJ_BASE_URL}/jeux-de-tirage/euromillions-my-million/resultats`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const results = parseEuromillionsResultsPage($);
      
      if (results && results.length > 0) {
        const newResult = results[0];
        // Vérifier si ce résultat existe déjà
        const existingIndex = euromillionsResults.findIndex(r => r.date === newResult.date);
        
        if (existingIndex >= 0) {
          euromillionsResults[existingIndex] = newResult;
          console.log(`✅ Euromillions ${newResult.date} mis à jour`);
        } else {
          euromillionsResults.unshift(newResult);
          console.log(`✅ Euromillions ${newResult.date} ajouté`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur Euromillions:', error.message);
  }
  
  await sleep(DELAY_MS);
  
  // Loto
  try {
    const url = `${FDJ_BASE_URL}/jeux-de-tirage/loto/resultats`;
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html',
      }
    });
    
    if (response.ok) {
      const html = await response.text();
      const $ = cheerio.load(html);
      const results = parseLotoResultsPage($);
      
      if (results && results.length > 0) {
        const newResult = results[0];
        const existingIndex = lotoResults.findIndex(r => r.date === newResult.date);
        
        if (existingIndex >= 0) {
          lotoResults[existingIndex] = newResult;
          console.log(`✅ Loto ${newResult.date} mis à jour`);
        } else {
          lotoResults.unshift(newResult);
          console.log(`✅ Loto ${newResult.date} ajouté`);
        }
      }
    }
  } catch (error) {
    console.error('❌ Erreur Loto:', error.message);
  }
  
  // Trier par date décroissante (plus récent en premier)
  euromillionsResults.sort((a, b) => new Date(b.date) - new Date(a.date));
  lotoResults.sort((a, b) => new Date(b.date) - new Date(a.date));
  
  // Garder seulement les 3 derniers mois (environ 26 tirages pour Euromillions, 39 pour Loto)
  const threeMonthsAgo = new Date();
  threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);
  
  euromillionsResults = euromillionsResults.filter(r => {
    const drawDate = new Date(r.date);
    return drawDate >= threeMonthsAgo;
  });
  
  lotoResults = lotoResults.filter(r => {
    const drawDate = new Date(r.date);
    return drawDate >= threeMonthsAgo;
  });
  
  // Formater les résultats
  const formattedEuromillions = formatResults(euromillionsResults, 'em');
  const formattedLoto = formatResults(lotoResults, 'loto');
  
  // Sauvegarder dans le cache
  const cache = {
    lastUpdate: new Date().toISOString(),
    euromillions: formattedEuromillions,
    loto: formattedLoto
  };
  
  fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf-8');
  
  console.log('\n✅ Scraping terminé !');
  console.log(`📊 Euromillions: ${formattedEuromillions.length} tirages`);
  console.log(`📊 Loto: ${formattedLoto.length} tirages`);
  console.log(`💾 Cache sauvegardé dans ${CACHE_FILE}`);
}

main().catch(console.error);

