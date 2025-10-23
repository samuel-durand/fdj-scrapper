@echo off
echo ========================================
echo   Lancement COMPLET avec Scraper Auto
echo ========================================
echo.
echo Installation des dependances si necessaire...
if not exist "node_modules\cheerio" (
    echo Installation de cheerio et node-cron...
    call npm install cheerio node-cron
)
echo.
echo Scraping initial des resultats...
node scraper-fdj.js --force
echo.
echo Demarrage du scheduler automatique...
start "Scheduler FDJ" cmd /k node scheduler-scraper.js
timeout /t 2 /nobreak >nul
echo.
echo Demarrage du serveur proxy...
start "Proxy FDJ" cmd /k node server-proxy-example.js
timeout /t 2 /nobreak >nul
echo.
echo Demarrage de l'application React...
start "Application Loterie" cmd /k npm run dev
echo.
echo ========================================
echo   Tous les services sont lances !
echo ========================================
echo.
echo   Scheduler:    Actif (scraping automatique)
echo   Proxy:        http://localhost:3001
echo   Application:  http://localhost:5173
echo.
echo Les resultats seront mis a jour automatiquement
echo aux jours de tirage !
echo.
pause

