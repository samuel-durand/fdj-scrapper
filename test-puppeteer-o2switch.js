/**
 * TEST PUPPETEER SUR O2SWITCH
 * Script minimal pour vérifier si Puppeteer fonctionne
 */

import puppeteer from 'puppeteer';

async function testPuppeteer() {
  console.log('🧪 Test de Puppeteer sur o2switch...\n');
  
  try {
    console.log('1️⃣ Lancement du navigateur...');
    
    const browser = await puppeteer.launch({
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--disable-gpu'
      ]
    });
    
    console.log('✅ Navigateur lancé avec succès !');
    
    console.log('2️⃣ Ouverture d\'une page...');
    const page = await browser.newPage();
    
    console.log('3️⃣ Navigation vers Google...');
    await page.goto('https://www.google.com', {
      waitUntil: 'networkidle2',
      timeout: 30000
    });
    
    console.log('4️⃣ Extraction du titre...');
    const title = await page.title();
    console.log(`   Titre de la page : ${title}`);
    
    await browser.close();
    
    console.log('\n✅✅✅ SUCCÈS ! Puppeteer fonctionne parfaitement sur o2switch !');
    console.log('🎉 Vous pouvez utiliser vos scrapers directement sur o2switch !');
    
    return true;
    
  } catch (error) {
    console.error('\n❌ ÉCHEC ! Puppeteer ne fonctionne PAS sur o2switch');
    console.error('\n📋 Erreur détaillée :');
    console.error(error.message);
    
    if (error.message.includes('libX11') || 
        error.message.includes('shared libraries') ||
        error.message.includes('EACCES') ||
        error.message.includes('chrome')) {
      console.error('\n💡 Raison : Chrome/Chromium ou ses dépendances système manquent');
      console.error('   → o2switch est un hébergement mutualisé sans Chrome');
      console.error('   → Utilisez GitHub Actions ou la tâche planifiée Windows');
    }
    
    return false;
  }
}

testPuppeteer().then(success => {
  process.exit(success ? 0 : 1);
});

