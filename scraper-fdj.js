/**
 * SCRAPER AUTOMATIQUE FDJ
 * Récupère les résultats des tirages depuis le site officiel de la FDJ
 * et les stocke dans un fichier cache local
 */

import fetch from 'node-fetch';
import * as cheerio from 'cheerio';
import fs from 'fs';
import path from 'path';

const CACHE_FILE = 'resultats-cache.json';
const FDJ_BASE_URL = 'https://www.fdj.fr';

/**
 * Récupère les résultats Euromillions depuis le site FDJ
 * Utilise la page résultats officielle
 */
async function scrapEuromillions() {
  console.log('\n🎯 Récupération Euromillions...');
  
  try {
    // Utiliser la page résultats qui contient les données directement
    const url = `${FDJ_BASE_URL}/jeux-de-tirage/euromillions-my-million/resultats`;
    console.log(`📡 Requête vers: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Parser la page résultats
    const results = parseEuromillionsResultsPage($);
    
    if (results && results.length > 0) {
      console.log(`✅ ${results.length} résultat(s) Euromillions extrait(s)`);
      return formatEuromillionsResults(results);
    }
    
    console.log('⚠️  Aucun résultat trouvé');
    return null;
    
  } catch (error) {
    console.error('❌ Erreur scraping Euromillions:', error.message);
    return null;
  }
}

/**
 * Récupère les résultats Loto depuis le site FDJ
 * Utilise la page résultats officielle
 */
async function scrapLoto() {
  console.log('\n🎯 Récupération Loto...');
  
  try {
    // Utiliser la page résultats qui contient les données directement
    const url = `${FDJ_BASE_URL}/jeux-de-tirage/loto/resultats`;
    console.log(`📡 Requête vers: ${url}`);
    
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'fr-FR,fr;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
      }
    });
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    
    const html = await response.text();
    const $ = cheerio.load(html);
    
    // Parser la page résultats
    const results = parseLotoResultsPage($);
    
    if (results && results.length > 0) {
      console.log(`✅ ${results.length} résultat(s) Loto extrait(s)`);
      return formatLotoResults(results);
    }
    
    console.log('⚠️  Aucun résultat trouvé');
    return null;
    
  } catch (error) {
    console.error('❌ Erreur scraping Loto:', error.message);
    return null;
  }
}

/**
 * Parse la page résultats Euromillions
 * Cible la page https://www.fdj.fr/jeux-de-tirage/euromillions-my-million/resultats
 */
function parseEuromillionsResultsPage($) {
  const results = [];
  
  try {
    console.log('🔍 Parsing page résultats Euromillions...');
    
    // Chercher le titre avec la date
    const dateTitle = $('h2:contains("Tirage du")').text();
    let dateText = '';
    
    // Extraire la date: "Tirage du vendredi 17 octobre 2025" → "2025-10-17" (format ISO)
    const dateMatch = dateTitle.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (dateMatch) {
      const mois = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      };
      const jour = dateMatch[1].padStart(2, '0');
      const moisNum = mois[dateMatch[2].toLowerCase()] || '01';
      const annee = dateMatch[3];
      dateText = `${annee}-${moisNum}-${jour}`;
      console.log(`📅 Date extraite: ${dateText}`);
    }
    
    // Extraire les numéros et étoiles
    const numbers = [];
    const stars = [];
    let foundNumbers = false;
    
    // Les numéros sont dans des éléments avec class "heading4" ou "heading5"
    $('.heading4, .heading5').each((i, elem) => {
      const text = $(elem).text().trim();
      const num = parseInt(text);
      
      if (!isNaN(num)) {
        // Les 5 premiers sont les numéros (1-50)
        if (!foundNumbers && num >= 1 && num <= 50 && numbers.length < 5) {
          numbers.push(num);
          console.log(`  Numéro: ${num}`);
          if (numbers.length === 5) foundNumbers = true;
        }
        // Les 2 suivants sont les étoiles (1-12)
        else if (foundNumbers && num >= 1 && num <= 12 && stars.length < 2) {
          stars.push(num);
          console.log(`  ⭐ Étoile: ${num}`);
        }
      }
    });
    
    // Extraire le jackpot
    let jackpot = 'Non disponible';
    const jackpotText = $('*:contains("million")').filter((i, el) => {
      const text = $(el).text();
      return text.includes('€') && text.length < 200;
    }).first().text();
    
    const jackpotMatch = jackpotText.match(/(\d+)\s*millions?\s*€/i);
    if (jackpotMatch) {
      jackpot = `${jackpotMatch[1]} 000 000 €`;
      console.log(`💰 Jackpot: ${jackpot}`);
    }
    
    // Extraire la répartition des gains
    console.log('📊 Extraction répartition des gains...');
    const winningsDistribution = [];
    
    $('table').first().find('tbody tr').each((i, tr) => {
      const cells = [];
      $(tr).find('td').each((j, td) => {
        cells.push($(td).text().trim());
      });
      
      // Structure du tableau Euromillions:
      // cells[0] = Bons n° (ex: "52", "51", "5")
      // cells[1] = Grilles gagnantes France
      // cells[2] = Grilles gagnantes Europe
      // cells[3] = Gains Euromillions
      // cells[4] = Grilles gagnantes Étoile+
      // cells[5] = Gains Étoile+
      // cells[6] = Gains Euromillions Étoile+
      
      if (cells.length >= 4) {
        const combination = cells[0]; // "52", "51", "5", etc.
        const winnersEurope = cells[2] || '0';
        const winAmount = cells[3] || 'Non disponible';
        
        // Mapper les combinaisons vers les rangs Euromillions
        const rankMap = {
          '52': 1, '51': 2, '5': 3, '42': 4, '41': 5, '4': 6,
          '32': 7, '31': 8, '3': 9, '22': 10, '21': 11, '2': 12
        };
        
        const rank = rankMap[combination] || i + 1;
        
        // Formater la combinaison pour l'affichage (ex: "52" → "5 numéros + 2 étoiles")
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
        
        winningsDistribution.push({
          rank: rank,
          combination: combMap[combination] || combination,
          winners: winnersEurope !== '/' ? winnersEurope : '0',
          amount: winAmount !== '/' ? winAmount : 'Non disponible'
        });
      }
    });
    
    console.log(`📊 ${winningsDistribution.length} rangs de gains extraits`);
    
    // Vérifier qu'on a bien 5 numéros et 2 étoiles
    if (numbers.length === 5 && stars.length === 2) {
      console.log(`✅ Tirage complet: ${numbers.join('-')} ⭐ ${stars.join('-')}`);
      
      results.push({
        date: dateText || new Date().toISOString().split('T')[0],
        numbers: numbers.sort((a, b) => a - b),
        stars: stars.sort((a, b) => a - b),
        jackpot: jackpot,
        winningsDistribution: winningsDistribution.length > 0 ? winningsDistribution : undefined
      });
    } else {
      console.log(`⚠️  Données incomplètes: ${numbers.length} numéros, ${stars.length} étoiles`);
    }
    
    console.log(`📊 Total: ${results.length} résultat(s) extrait(s)`);
    return results.length > 0 ? results : null;
    
  } catch (error) {
    console.error('❌ Erreur parsing page résultats:', error.message);
    return null;
  }
}

/**
 * Parse la page résultats Loto
 * Cible la page https://www.fdj.fr/jeux-de-tirage/loto/resultats
 */
function parseLotoResultsPage($) {
  const results = [];
  
  try {
    console.log('🔍 Parsing page résultats Loto...');
    
    // Chercher le titre avec la date
    const dateTitle = $('h2:contains("Tirage du")').text();
    let dateText = '';
    
    // Extraire la date: "Tirage du lundi 20 octobre 2025" → "2025-10-20" (format ISO)
    const dateMatch = dateTitle.match(/(\d{1,2})\s+(\w+)\s+(\d{4})/);
    if (dateMatch) {
      const mois = {
        'janvier': '01', 'février': '02', 'mars': '03', 'avril': '04',
        'mai': '05', 'juin': '06', 'juillet': '07', 'août': '08',
        'septembre': '09', 'octobre': '10', 'novembre': '11', 'décembre': '12'
      };
      const jour = dateMatch[1].padStart(2, '0');
      const moisNum = mois[dateMatch[2].toLowerCase()] || '01';
      const annee = dateMatch[3];
      dateText = `${annee}-${moisNum}-${jour}`;
      console.log(`📅 Date extraite: ${dateText}`);
    }
    
    // Extraire les numéros
    const numbers = [];
    let luckyNumber = null;
    let foundNumbers = false;
    
    // Les numéros sont dans des éléments avec class "heading4" ou "heading5"
    $('.heading4, .heading5').each((i, elem) => {
      const text = $(elem).text().trim();
      const num = parseInt(text);
      
      if (!isNaN(num)) {
        // Les 5 premiers sont les numéros principaux (1-49)
        if (!foundNumbers && num >= 1 && num <= 49 && numbers.length < 5) {
          numbers.push(num);
          console.log(`  Numéro: ${num}`);
          if (numbers.length === 5) foundNumbers = true;
        }
        // Le suivant est le numéro chance (1-10)
        else if (foundNumbers && num >= 1 && num <= 10 && luckyNumber === null) {
          luckyNumber = num;
          console.log(`  🍀 Numéro Chance: ${num}`);
        }
      }
    });
    
    // Extraire le jackpot
    let jackpot = 'Non disponible';
    const jackpotText = $('*:contains("million")').filter((i, el) => {
      const text = $(el).text();
      return text.includes('€') && text.length < 200;
    }).first().text();
    
    const jackpotMatch = jackpotText.match(/(\d+)\s*millions?\s*€/i);
    if (jackpotMatch) {
      jackpot = `${jackpotMatch[1]} 000 000 €`;
      console.log(`💰 Jackpot: ${jackpot}`);
    }
    
    // Extraire la répartition des gains
    console.log('📊 Extraction répartition des gains...');
    const winningsDistribution = [];
    
    $('table').first().find('tbody tr').each((i, tr) => {
      const cells = [];
      $(tr).find('td').each((j, td) => {
        cells.push($(td).text().trim());
      });
      
      // Structure du tableau Loto:
      // cells[0] = Bons n° (ex: "51", "5", "41")
      // cells[1] = Grilles gagnantes
      // cells[2] = Gains par grilles gagnantes
      
      if (cells.length >= 3) {
        const combination = cells[0]; // "51", "5", "41", etc.
        const winners = cells[1] || '0';
        const winAmount = cells[2] || 'Non disponible';
        
        // Mapper les combinaisons vers les rangs Loto
        const rankMap = {
          '51': 1, '5': 2, '41': 3, '4': 4, '31': 5, '3': 6, '21': 7, '2': 8
        };
        
        const rank = rankMap[combination] || i + 1;
        
        // Formater la combinaison pour l'affichage (ex: "51" → "5 numéros + N° Chance")
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
        
        winningsDistribution.push({
          rank: rank,
          combination: combMap[combination] || combination,
          winners: winners !== '/' ? winners : '0',
          amount: winAmount !== '/' ? winAmount : 'Non disponible'
        });
      }
    });
    
    console.log(`📊 ${winningsDistribution.length} rangs de gains extraits`);
    
    // Vérifier qu'on a bien 5 numéros et 1 numéro chance
    if (numbers.length === 5 && luckyNumber !== null) {
      console.log(`✅ Tirage complet: ${numbers.join('-')} 🍀 ${luckyNumber}`);
      
      results.push({
        date: dateText || new Date().toISOString().split('T')[0],
        numbers: numbers.sort((a, b) => a - b),
        luckyNumber: luckyNumber,
        jackpot: jackpot,
        winningsDistribution: winningsDistribution.length > 0 ? winningsDistribution : undefined
      });
    } else {
      console.log(`⚠️  Données incomplètes: ${numbers.length} numéros, numéro chance: ${luckyNumber}`);
    }
    
    console.log(`📊 Total: ${results.length} résultat(s) extrait(s)`);
    return results.length > 0 ? results : null;
    
  } catch (error) {
    console.error('❌ Erreur parsing page résultats:', error.message);
    return null;
  }
}

/**
 * Parse le HTML Loto si pas de données JSON
 */
function parseLotoHTML($) {
  const results = [];
  
  try {
    // Chercher les éléments contenant les résultats
    $('.result-item, .draw-result, .tirage-item').each((i, elem) => {
      const $elem = $(elem);
      
      // Extraire les numéros
      const numbers = [];
      $elem.find('.ball, .numero, .number').each((j, ball) => {
        const num = parseInt($(ball).text().trim());
        if (!isNaN(num) && num >= 1 && num <= 49) {
          numbers.push(num);
        }
      });
      
      // Extraire le numéro chance
      const chanceText = $elem.find('.chance, .lucky').text().trim();
      const chance = parseInt(chanceText);
      
      // Extraire la date
      const dateText = $elem.find('.date, .draw-date').text().trim();
      
      if (numbers.length === 5 && !isNaN(chance)) {
        results.push({
          date: dateText,
          numbers: numbers.slice(0, 5),
          chance: chance
        });
      }
    });
    
    return results.length > 0 ? results : null;
  } catch (error) {
    console.error('❌ Erreur parsing HTML Loto:', error.message);
    return null;
  }
}

/**
 * Génère des données de fallback Euromillions pour toute l'année 2025
 */
function generateEuromillionsFallbackData() {
  try {
    const data = fs.readFileSync('year-data-2025.js', 'utf8');
    const match = data.match(/const euromillionsFallbackData = \[([\s\S]*?)\];/);
    if (match) {
      // Parser les données
      const arrayContent = match[1];
      return eval(`[${arrayContent}]`);
    }
  } catch (e) {
    console.log('⚠️  Fichier year-data-2025.js non trouvé, utilisation de données minimales');
  }
  return [];
}

/**
 * Génère des données de fallback Loto pour toute l'année 2025
 */
function generateLotoFallbackData() {
  try {
    const data = fs.readFileSync('year-data-2025.js', 'utf8');
    const match = data.match(/const lotoFallbackData = \[([\s\S]*?)\];/);
    if (match) {
      // Parser les données
      const arrayContent = match[1];
      return eval(`[${arrayContent}]`);
    }
  } catch (e) {
    console.log('⚠️  Fichier year-data-2025.js non trouvé, utilisation de données minimales');
  }
  return [];
}

/**
 * Formate les résultats Euromillions
 * Ajoute des données de fallback pour avoir plusieurs tirages
 */
function formatEuromillionsResults(results) {
  if (!Array.isArray(results)) return null;
  
  // Vrais résultats scrapés
  const realResults = results.slice(0, 10).map((draw, index) => ({
    id: draw.id || draw.drawId || `em-${index}`,
    date: draw.date || draw.drawDate || draw.datetirage,
    numbers: draw.balls || draw.numbers || draw.numeros || [],
    stars: draw.stars || draw.etoiles || draw.lucky_stars || [],
    jackpot: draw.jackpot || draw.cagnotte || null,
    winningsDistribution: draw.winningsDistribution || undefined
  }));
  
  // Données de fallback pour compléter l'historique (toute l'année 2025)
  const fallbackData = generateEuromillionsFallbackData();
  
  // Combiner : vrais résultats + fallback (retourne tous les résultats)
  return [...realResults, ...fallbackData];
}

/**
 * Formate les résultats Loto
 * Ajoute des données de fallback pour avoir plusieurs tirages
 */
function formatLotoResults(results) {
  if (!Array.isArray(results)) return null;
  
  // Vrais résultats scrapés
  const realResults = results.map((draw, index) => ({
    id: draw.id || draw.drawId || `loto-${index}`,
    date: draw.date || draw.drawDate || draw.datetirage,
    numbers: draw.balls || draw.numbers || draw.numeros || [],
    luckyNumber: draw.luckyNumber || draw.chance || draw.numeroChance || 0,
    jackpot: draw.jackpot || draw.cagnotte || null,
    winningsDistribution: draw.winningsDistribution || undefined
  }));
  
  // Données de fallback pour compléter l'historique (toute l'année 2025)
  const fallbackData = generateLotoFallbackData();
  
  // Combiner : vrais résultats + fallback (retourne tous les résultats)
  return [...realResults, ...fallbackData];
}

/**
 * Charge le cache existant
 */
function loadCache() {
  try {
    if (fs.existsSync(CACHE_FILE)) {
      const data = fs.readFileSync(CACHE_FILE, 'utf8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('⚠️  Erreur lecture cache:', error.message);
  }
  
  return {
    euromillions: [],
    loto: [],
    lastUpdate: null
  };
}

/**
 * Sauvegarde le cache
 */
function saveCache(cache) {
  try {
    fs.writeFileSync(CACHE_FILE, JSON.stringify(cache, null, 2), 'utf8');
    console.log('✅ Cache sauvegardé');
  } catch (error) {
    console.error('❌ Erreur sauvegarde cache:', error.message);
  }
}

/**
 * Vérifie si c'est un jour de tirage
 */
function isDrawDay(gameType) {
  const now = new Date();
  const day = now.getDay(); // 0 = Dimanche, 1 = Lundi, etc.
  
  if (gameType === 'euromillions') {
    // Mardi (2) et Vendredi (5)
    return day === 2 || day === 5;
  } else if (gameType === 'loto') {
    // Lundi (1), Mercredi (3) et Samedi (6)
    return day === 1 || day === 3 || day === 6;
  }
  
  return false;
}

/**
 * Fonction principale de scraping
 */
export async function scrapResults(force = false) {
  console.log('\n╔════════════════════════════════════════════╗');
  console.log('║   🎰 SCRAPER FDJ - Récupération Auto     ║');
  console.log('╠════════════════════════════════════════════╣');
  console.log(`║   Date: ${new Date().toLocaleString('fr-FR')}  ║`);
  console.log('╚════════════════════════════════════════════╝\n');
  
  const cache = loadCache();
  
  // Scraper Euromillions
  if (force || isDrawDay('euromillions')) {
    console.log('✅ Jour de tirage Euromillions (Mardi ou Vendredi)');
    const euromillionsResults = await scrapEuromillions();
    
    if (euromillionsResults && euromillionsResults.length > 0) {
      cache.euromillions = euromillionsResults;
      console.log(`✅ ${euromillionsResults.length} résultats Euromillions mis à jour`);
    } else {
      console.log('⚠️  Impossible de récupérer Euromillions, cache conservé');
    }
  } else {
    console.log('⏭️  Pas de tirage Euromillions aujourd\'hui');
  }
  
  // Scraper Loto
  if (force || isDrawDay('loto')) {
    console.log('✅ Jour de tirage Loto (Lundi, Mercredi ou Samedi)');
    const lotoResults = await scrapLoto();
    
    if (lotoResults && lotoResults.length > 0) {
      cache.loto = lotoResults;
      console.log(`✅ ${lotoResults.length} résultats Loto mis à jour`);
    } else {
      console.log('⚠️  Impossible de récupérer Loto, cache conservé');
    }
  } else {
    console.log('⏭️  Pas de tirage Loto aujourd\'hui');
  }
  
  cache.lastUpdate = new Date().toISOString();
  saveCache(cache);
  
  console.log('\n✅ Scraping terminé !');
  return cache;
}

/**
 * Récupère les résultats depuis le cache
 */
export function getCachedResults() {
  return loadCache();
}

// Si exécuté directement
if (import.meta.url === `file://${process.argv[1].replace(/\\/g, '/')}`) {
  const forceUpdate = process.argv.includes('--force');
  scrapResults(forceUpdate)
    .then(() => {
      console.log('\n✅ Script terminé avec succès');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Erreur:', error);
      process.exit(1);
    });
}

