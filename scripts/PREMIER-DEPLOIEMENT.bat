@echo off
chcp 65001 > nul
color 0E
echo.
echo ════════════════════════════════════════════════════════════
echo     🎯 PREMIER DÉPLOIEMENT SUR O2SWITCH
echo     (Upload complet du site)
echo ════════════════════════════════════════════════════════════
echo.

cd ..

echo ⚠️  Ce script est pour le PREMIER déploiement
echo    Il va récupérer 1 mois de résultats complet
echo.
pause

echo.
echo 📊 Étape 1/3 : Récupération de 1 mois de résultats...
echo    (Cela peut prendre 2-3 minutes)
echo.
node scraper-urls-directes.js 1
if %errorlevel% neq 0 (
    echo.
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)

echo.
echo ✅ Résultats récupérés (1 mois complet) !
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
echo 📦 Étape 3/3 : Copie du cache dans dist...
copy resultats-cache.json dist\ /Y > nul
echo ✅ Copie terminée !

echo.
echo ════════════════════════════════════════════════════════════
echo     ✅ TOUT EST PRÊT !
echo ════════════════════════════════════════════════════════════
echo.
echo 📁 Le dossier dist\ contient TOUT ton site
echo.
echo 🌐 UPLOAD SUR O2SWITCH :
echo.
echo    Via FileZilla ou WinSCP :
echo.
echo    1. Ouvre FileZilla
echo    2. Connecte-toi à o2switch
echo    3. Upload TOUT le contenu de dist\ vers /www/
echo.
echo    Fichiers à uploader :
echo    ✓ index.html
echo    ✓ resultats-cache.json
echo    ✓ .htaccess
echo    ✓ assets/ (dossier complet)
echo.
echo ════════════════════════════════════════════════════════════
echo.
echo 📁 Ouverture du dossier dist\...
explorer dist

echo.
pause

