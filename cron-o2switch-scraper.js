#!/usr/bin/env node

/**
 * SCRIPT CRON POUR O2SWITCH
 * À exécuter automatiquement via les tâches cron de cPanel
 * 
 * Ce script :
 * 1. Scrape les résultats FDJ avec Puppeteer
 * 2. Met à jour resultats-cache.json
 * 3. Log les résultats pour suivi
 */

import puppeteer from 'puppeteer';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const CACHE_FILE = path.join(__dirname, 'resultats-cache.json');
const LOG_FILE = path.join(__dirname, 'cron-logs.txt');

// Fonction de logging
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  
  // Console
  console.log(logMessage.trim());
  
  // Fichier de log
  try {
    fs.appendFileSync(LOG_FILE, logMessage);
  } catch (err) {
    console.error('Erreur lors de l\'écriture du log:', err);
  }
}

// Import du scraper existant
async function runScraper() {
  log('🚀 Démarrage du scraping automatique...');
  
  try {
    // Importer dynamiquement votre scraper
    const scraperPath = path.join(__dirname, 'scraper-urls-directes.js');
    
    log('📊 Lancement du scraper...');
    
    // Exécuter le scraper (0.5 mois = résultats récents)
    // Votre scraper génère déjà resultats-cache.json
    const { execSync } = await import('child_process');
    execSync(`node "${scraperPath}" 0.5`, { 
      cwd: __dirname,
      stdio: 'inherit'
    });
    
    log('✅ Scraping terminé avec succès');
    
    // Vérifier que le fichier existe et a une taille correcte
    if (fs.existsSync(CACHE_FILE)) {
      const stats = fs.statSync(CACHE_FILE);
      const sizeMB = (stats.size / 1024 / 1024).toFixed(2);
      log(`📁 Fichier généré : ${sizeMB} MB`);
      
      if (stats.size > 1000) {
        log('✅ Fichier valide et prêt');
        return true;
      } else {
        log('⚠️ Fichier trop petit, possible erreur');
        return false;
      }
    } else {
      log('❌ Fichier cache non généré');
      return false;
    }
    
  } catch (error) {
    log(`❌ Erreur lors du scraping : ${error.message}`);
    log(`📋 Stack trace : ${error.stack}`);
    return false;
  }
}

// Fonction principale
async function main() {
  log('═══════════════════════════════════════════════════');
  log('🎰 CRON JOB O2SWITCH - Mise à jour résultats FDJ');
  log('═══════════════════════════════════════════════════');
  
  const startTime = Date.now();
  
  const success = await runScraper();
  
  const duration = ((Date.now() - startTime) / 1000).toFixed(2);
  log(`⏱️ Durée totale : ${duration} secondes`);
  
  if (success) {
    log('✅ Tâche cron terminée avec succès');
    log('═══════════════════════════════════════════════════');
    process.exit(0);
  } else {
    log('❌ Tâche cron terminée avec erreurs');
    log('═══════════════════════════════════════════════════');
    process.exit(1);
  }
}

// Lancer le script
main().catch(error => {
  log(`❌ Erreur fatale : ${error.message}`);
  process.exit(1);
});

