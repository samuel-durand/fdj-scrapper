@echo off
chcp 65001 > nul
color 0B
echo.
echo ════════════════════════════════════════════════════════════
echo     🚀 BUILD COMPLET AVEC 3 MOIS DE DONNÉES
echo ════════════════════════════════════════════════════════════
echo.

REM Se placer dans le dossier du projet
cd /d "%~dp0.."

echo 📊 Étape 1/3 : Scraping de 3 mois de résultats...
echo    (Cela peut prendre 3-5 minutes)
echo.
node scraper-urls-directes.js 3
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)

echo.
echo ✅ Scraping terminé !
echo    • EuroMillions : ~26 tirages
echo    • Loto : ~40 tirages
echo    • EuroDreams : ~27 tirages
echo.

echo 🏗️  Étape 2/3 : Build de l'application...
call npm run build
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)

echo.
echo ✅ Build terminé !
echo.

echo 📦 Étape 3/3 : Copie du cache dans dist...
copy resultats-cache.json dist\ /Y > nul
echo ✅ Cache copié !

echo.
echo ════════════════════════════════════════════════════════════
echo     ✅ BUILD COMPLET RÉUSSI !
echo ════════════════════════════════════════════════════════════
echo.
echo 📁 Le dossier dist\ contient :
echo    ✓ 3 mois de résultats complets
echo    ✓ Application buildée et optimisée
echo    ✓ Prêt pour o2switch !
echo.
echo 🌐 Prochaine étape :
echo    → Upload dist\ sur o2switch
echo    → Ou utilise : scripts\deployer-o2switch.bat
echo.
echo ════════════════════════════════════════════════════════════
echo.
pause

