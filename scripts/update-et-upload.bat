@echo off
chcp 65001 > nul
echo.
echo ╔════════════════════════════════════════════╗
echo ║   🔄 MISE À JOUR ET UPLOAD O2SWITCH       ║
echo ╚════════════════════════════════════════════╝
echo.

cd ..

REM 1. Scraper les résultats
echo 📊 Étape 1/3 : Scraping des résultats...
node scraper-urls-directes.js 0.5
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)
echo ✅ Scraping terminé
echo.

REM 2. Copier dans dist
echo 📦 Étape 2/3 : Copie dans dist...
copy resultats-cache.json dist\ /Y
echo ✅ Fichier copié
echo.

REM 3. Instructions upload
echo 🌐 Étape 3/3 : Upload vers o2switch
echo.
echo ⚠️  Maintenant, upload manuellement :
echo    1. Ouvre FileZilla ou WinSCP
echo    2. Connecte-toi à o2switch
echo    3. Upload le fichier : dist\resultats-cache.json
echo    4. Destination : /home/ton-user/www/
echo.
echo 💡 Ou utilise le script auto-update-o2switch.bat
echo    (nécessite WinSCP configuré)
echo.

pause

