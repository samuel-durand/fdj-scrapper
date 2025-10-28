@echo off
chcp 65001 > nul
color 0A
echo.
echo ════════════════════════════════════════════════════════════
echo     🧪 TEST AVANT UPLOAD SUR O2SWITCH
echo ════════════════════════════════════════════════════════════
echo.

cd ..

echo 📊 Étape 1/4 : Récupération des derniers résultats...
node scraper-urls-directes.js 0.1
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du scraping
    pause
    exit /b 1
)
echo ✅ Scraping OK
echo.

echo 🏗️  Étape 2/4 : Build de l'application...
call npm run build
if %errorlevel% neq 0 (
    echo ❌ Erreur lors du build
    pause
    exit /b 1
)
echo ✅ Build OK
echo.

echo 📦 Étape 3/4 : Vérification des fichiers dist...
echo.
echo 📁 Fichiers dans dist/ :
dir /b dist
echo.

if not exist "dist\index.html" (
    echo ❌ ERREUR : index.html manquant !
    pause
    exit /b 1
)

if not exist "dist\resultats-cache.json" (
    echo ❌ ERREUR : resultats-cache.json manquant !
    pause
    exit /b 1
)

if not exist "dist\.htaccess" (
    echo ❌ ERREUR : .htaccess manquant !
    pause
    exit /b 1
)

if not exist "dist\assets" (
    echo ❌ ERREUR : dossier assets manquant !
    pause
    exit /b 1
)

echo ✅ Tous les fichiers sont présents !
echo.

echo 🧪 Étape 4/4 : Test local...
echo.
echo ⏳ Lancement du serveur de prévisualisation...
echo    (Le navigateur va s'ouvrir automatiquement)
echo.
echo ⚠️  TESTE TON SITE :
echo    • Les 3 onglets fonctionnent ?
echo    • Les résultats s'affichent ?
echo    • Le calendrier fonctionne ?
echo    • Le thème sombre/clair fonctionne ?
echo.
echo 💡 Si tout fonctionne ici, ça fonctionnera sur o2switch !
echo.
echo 📝 Appuie sur une touche pour lancer le serveur de test...
pause > nul

call npm run preview

echo.
echo ════════════════════════════════════════════════════════════
echo     ✅ TEST TERMINÉ
echo ════════════════════════════════════════════════════════════
echo.
echo Si tout fonctionne :
echo    → Lance scripts\deployer-o2switch.bat
echo    → Upload dist\ sur o2switch
echo.
pause

